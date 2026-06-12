/**
 * Proposals Service - All proposal-related Supabase queries
 */
import { supabase, uploadFile } from '@/lib/supabase';



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
    resetAt: string | null;
}

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
    const now = new Date(date);
    const windowStart = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago

    // Use count without head:true to avoid 400 on some Supabase RLS configurations
    const { data, error } = await supabase
        .from('proposals')
        .select('created_at')
        .eq('freelancer_id', freelancerId)
        .gte('created_at', windowStart.toISOString())
        .order('created_at', { ascending: true }); // oldest first

    if (error) {
        // If we can't count (e.g. RLS blocks it), assume 0 used — don't crash
        console.warn('[proposals] getDailyProposalUsage error (non-fatal):', extractMessage(error));
        return { used: 0, remaining: DAILY_PROPOSAL_LIMIT, limit: DAILY_PROPOSAL_LIMIT, resetAt: null };
    }

    const used = data?.length ?? 0;
    let resetAt: string | null = null;

    if (used > 0) {
        // The oldest proposal in this 48h window will be the first to "fall off"
        const oldestTime = new Date(data[0].created_at).getTime();
        resetAt = new Date(oldestTime + 48 * 60 * 60 * 1000).toISOString();
    }

    return {
        used,
        remaining: Math.max(DAILY_PROPOSAL_LIMIT - used, 0),
        limit: DAILY_PROPOSAL_LIMIT,
        resetAt,
    };
}

function normalizeProposalError(error: unknown): Error {
    const message = extractMessage(error, 'Failed to submit proposal');
    if (
        message.includes('daily_apply_limit_reached') ||
        message.includes('daily_proposal_limit_reached') ||
        message.includes('rate_limit_exceeded')
    ) {
        return new Error("You've reached the proposal limit. Try again in an hour.");
    }
    return toError(error, 'Failed to submit proposal');
}

function isMissingSubmitProposalAtomicRpc(error: unknown): boolean {
    const message = extractMessage(error, '').toLowerCase();
    if (!message) return false;

    const mentionsRpc = message.includes('submit_proposal_atomic');
    const missingHint = message.includes('does not exist')
        || message.includes('could not find the function')
        || message.includes('function public.submit_proposal_atomic')
        || message.includes('pgrst202');

    return mentionsRpc && missingHint;
}

function extractProposalIdFromSubmitProposalRpc(data: unknown): string | null {
    if (typeof data === 'string' && data.trim().length > 0) {
        return data;
    }

    if (data && typeof data === 'object') {
        const candidate = data as { proposal_id?: unknown; id?: unknown };

        if (typeof candidate.proposal_id === 'string' && candidate.proposal_id.trim().length > 0) {
            return candidate.proposal_id;
        }

        if (typeof candidate.id === 'string' && candidate.id.trim().length > 0) {
            return candidate.id;
        }
    }

    return null;
}

async function fallbackCreateProposalWithoutAtomicRpc(
    data: CreateProposalInput,
    attachmentUrls: string[],
): Promise<{ data: string | null; error: Error | null }> {
    const insertResult = await supabase
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

    if (!insertResult.error && typeof insertResult.data?.id === 'string') {
        return { data: insertResult.data.id, error: null };
    }

    const duplicateMessage = extractMessage(insertResult.error, '').toLowerCase();
    const duplicateDetected = duplicateMessage.includes('duplicate key') || duplicateMessage.includes('unique');

    if (duplicateDetected) {
        const existing = await supabase
            .from('proposals')
            .select('id')
            .eq('job_id', data.job_id)
            .eq('freelancer_id', data.freelancer_id)
            .maybeSingle();

        if (!existing.error && typeof existing.data?.id === 'string') {
            return { data: existing.data.id, error: null };
        }
    }

    return {
        data: null,
        error: toError(insertResult.error, 'Failed to submit proposal'),
    };
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
        // Upload attachments before creating the proposal atomically.
        const attachmentUrls: string[] = await Promise.all(
            files.map(async (file) => {
                const path = `${data.freelancer_id}/${data.job_id}/${Date.now()}-${file.name}`;
                return await uploadFile('attachments', path, file);
            })
        );

        const { data: rpcData, error } = await supabase.rpc('submit_proposal_atomic', {
            p_job_id: data.job_id,
            p_cover_letter: data.cover_letter,
            p_bid_amount: data.bid_amount,
            p_delivery_time_days: data.delivery_time_days,
            p_attachments: attachmentUrls,
        });

        if (error) {
            if (isMissingSubmitProposalAtomicRpc(error)) {
                // Legacy fallback for environments where submit_proposal_atomic
                // was not deployed yet. Keep proposal flow functional.
                return await fallbackCreateProposalWithoutAtomicRpc(data, attachmentUrls);
            }

            throw toError(error, 'Failed to submit proposal');
        }

        let proposalId = extractProposalIdFromSubmitProposalRpc(rpcData);

        if (!proposalId) {
            // Defensive confirmation for unexpected RPC payload shapes.
            const existing = await supabase
                .from('proposals')
                .select('id')
                .eq('job_id', data.job_id)
                .eq('freelancer_id', data.freelancer_id)
                .maybeSingle();

            if (!existing.error && typeof existing.data?.id === 'string') {
                proposalId = existing.data.id;
            }
        }

        if (!proposalId) {
            return {
                data: null,
                error: new Error('Proposal submission could not be confirmed. Please try again.'),
            };
        }

        return { data: proposalId, error: null };
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
