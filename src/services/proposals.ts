/**
 * Proposals Service - All proposal-related Supabase queries
 */
import { supabase, uploadFile } from '@/lib/supabase';
import { canApplyToJob, getAccessMessage } from '@/lib/marketplaceAccess';
import type { FreelancerProfile, Profile } from '@/types';

export const DAILY_PROPOSAL_LIMIT = 6;

export interface CreateProposalInput {
    job_id: string;
    freelancer_id: string;
    cover_letter: string;
    bid_amount: number;
    delivery_time_days: number; // matches DB column name
}

export interface DailyProposalUsage {
    used: number;
    remaining: number;
    limit: number;
}

const getDayWindow = (date = new Date()) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return { dayStart, dayEnd };
};

/** Safely extract a human-readable message from any error shape */
function extractMessage(err: unknown, fallback = 'An error occurred'): string {
    if (!err) return fallback;
    if (typeof err === 'string') return err || fallback;
    if (err instanceof Error) return err.message || fallback;
    // PostgrestError or similar object with a message property
    if (typeof (err as any)?.message === 'string') return (err as any).message || fallback;
    if (typeof (err as any)?.details === 'string') return (err as any).details || fallback;
    if (typeof (err as any)?.hint === 'string') return (err as any).hint || fallback;
    return fallback;
}

/** Convert any thrown value into a proper Error */
function toError(err: unknown, fallback = 'An error occurred'): Error {
    return err instanceof Error ? err : new Error(extractMessage(err, fallback));
}

export async function getDailyProposalUsage(
    freelancerId: string,
    date = new Date(),
): Promise<DailyProposalUsage> {
    const { dayStart, dayEnd } = getDayWindow(date);

    // Use count without head:true to avoid 400 on some Supabase RLS configurations
    const { data, error } = await supabase
        .from('proposals')
        .select('id')
        .eq('freelancer_id', freelancerId)
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString());

    if (error) {
        // If we can't count (e.g. RLS blocks it), assume 0 used — don't crash
        console.warn('[proposals] getDailyProposalUsage error (non-fatal):', extractMessage(error));
        return { used: 0, remaining: DAILY_PROPOSAL_LIMIT, limit: DAILY_PROPOSAL_LIMIT };
    }

    const used = data?.length ?? 0;
    return {
        used,
        remaining: Math.max(DAILY_PROPOSAL_LIMIT - used, 0),
        limit: DAILY_PROPOSAL_LIMIT,
    };
}

function normalizeProposalError(error: unknown): Error {
    const message = extractMessage(error, 'Failed to submit proposal');
    if (
        message.includes('daily_apply_limit_reached') ||
        message.includes('daily_proposal_limit_reached') ||
        message.includes('rate_limit_exceeded')
    ) {
        return new Error(`You've reached today's proposal limit (${DAILY_PROPOSAL_LIMIT}). Try again tomorrow.`);
    }
    return toError(error, 'Failed to submit proposal');
}

// --- READ ---

export async function getProposalsByJob(jobId: string) {
    return supabase
        .from('proposals')
        .select(`*, freelancer:public_profiles!freelancer_id(id, full_name, avatar_url, location)`)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
}

export async function getMyProposal(jobId: string, freelancerId: string) {
    return supabase
        .from('proposals')
        .select('*')
        .eq('job_id', jobId)
        .eq('freelancer_id', freelancerId)
        .maybeSingle();
}

export async function getProposalsByFreelancer(freelancerId: string) {
    return supabase
        .from('proposals')
        .select(`*, job:jobs(id, title, category, budget_min, budget_max, status)`)
        .eq('freelancer_id', freelancerId)
        .order('created_at', { ascending: false });
}

// --- WRITE ---

export async function createProposal(data: CreateProposalInput, files: File[] = []) {
    try {
        // Pre-flight access check (UX guard)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.freelancer_id)
            .maybeSingle();

        if (profileError) throw toError(profileError, 'Failed to load profile');

        const { data: fp, error: fpError } = await supabase
            .from('freelancer_profiles')
            .select('*')
            .eq('id', data.freelancer_id)
            .maybeSingle();

        if (fpError) throw toError(fpError, 'Failed to load freelancer profile');

        const accessDecision = canApplyToJob({
            isAuthenticated: true,
            profile: (profile as Profile | null) ?? null,
            freelancerProfile: (fp as FreelancerProfile | null) ?? null,
        });

        if (!accessDecision.allowed) {
            return {
                data: null,
                error: new Error(getAccessMessage(accessDecision.reason, accessDecision.completion)),
            };
        }

        // Prevent duplicate proposals
        const { data: existingProposal, error: existingProposalError } = await supabase
            .from('proposals')
            .select('id')
            .eq('job_id', data.job_id)
            .eq('freelancer_id', data.freelancer_id)
            .maybeSingle();

        if (existingProposalError) throw toError(existingProposalError, 'Failed to check existing proposal');
        if (existingProposal?.id) {
            return { data: existingProposal.id, error: null };
        }

        // Daily limit check
        const usage = await getDailyProposalUsage(data.freelancer_id);
        if (usage.remaining <= 0) {
            throw new Error('daily_apply_limit_reached');
        }

        // Upload attachments before insert
        const attachmentUrls: string[] = await Promise.all(
            files.map(async (file) => {
                const path = `${data.freelancer_id}/${data.job_id}/${Date.now()}-${file.name}`;
                return await uploadFile('attachments', path, file);
            })
        );

        const { data: insertedProposal, error } = await supabase
            .from('proposals')
            .insert({
                job_id: data.job_id,
                freelancer_id: data.freelancer_id,
                cover_letter: data.cover_letter,
                bid_amount: data.bid_amount,
                delivery_time_days: data.delivery_time_days,
                attachments: attachmentUrls,
                status: 'pending',
            })
            .select('id')
            .single();

        if (error) throw toError(error, 'Failed to insert proposal');

        return { data: insertedProposal?.id ?? null, error: null };
    } catch (error) {
        return { data: null, error: normalizeProposalError(error) };
    }
}

export async function withdrawProposal(proposalId: string) {
    return supabase
        .from('proposals')
        .delete()
        .eq('id', proposalId)
        .eq('status', 'pending');
}

export async function updateProposalStatus(proposalId: string, status: string) {
    return supabase.from('proposals').update({ status }).eq('id', proposalId);
}
