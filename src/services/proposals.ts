/**
 * Proposals Service - All proposal-related Supabase queries
 */
import { supabase, uploadFile } from '@/lib/supabase';
import { canApplyToJob, getAccessMessage } from '@/lib/marketplaceAccess';
import type { FreelancerProfile, Profile } from '@/types';
import { CONNECTS_COST } from './connects';

export interface CreateProposalInput {
    job_id: string;
    freelancer_id: string;
    cover_letter: string;
    bid_amount: number;
    delivery_time_days: number; // matches DB column name
}

function normalizeProposalError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('rate_limit_exceeded')) {
        return new Error("You've reached the proposal limit. Try again in an hour.");
    }
    return error instanceof Error ? error : new Error(message);
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
        // --- Pre-flight access check (fast client-side guard) ---
        // The DB RPC re-enforces all constraints server-side, so this is a UX
        // convenience only — it is not the authoritative security boundary.
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.freelancer_id)
            .maybeSingle();

        if (profileError) throw profileError;

        const { data: fp, error: fpError } = await supabase
            .from('freelancer_profiles')
            .select('*')
            .eq('id', data.freelancer_id)
            .maybeSingle();

        if (fpError) throw fpError;

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

        // --- Upload attachments (must complete before the atomic RPC) ---
        const attachmentUrls: string[] = await Promise.all(
            files.map(async (file) => {
                const path = `${data.freelancer_id}/${data.job_id}/${Date.now()}-${file.name}`;
                return await uploadFile('attachments', path, file);
            })
        );

        // --- Atomic proposal insert + connects deduction in one DB transaction ---
        // submit_proposal_atomic (migration 20260407020000) inserts the proposal
        // AND deducts connects within a single plpgsql transaction. Any failure
        // rolls back both operations — no orphaned proposals, no free submissions.
        //
        // p_attachments: the DB parameter is JSONB (proposals.attachments column).
        // PostgREST serializes a JS string[] to a JSON array (["url1","url2"]) which
        // Postgres accepts as JSONB. No explicit cast needed on the JS side.
        const { data: result, error } = await supabase.rpc('submit_proposal_atomic', {
            p_job_id:             data.job_id,
            p_cover_letter:       data.cover_letter,
            p_bid_amount:         data.bid_amount,
            p_delivery_time_days: data.delivery_time_days,
            p_attachments:        attachmentUrls,   // string[] → serialized as JSON array (JSONB)
            p_connects_cost:      CONNECTS_COST,
        });

        if (error) throw error;

        const rpcResult = result as { success: boolean; proposal_id: string; existing: boolean };
        if (!rpcResult?.success) {
            throw new Error('Proposal submission failed');
        }

        return { data: rpcResult.proposal_id ?? null, error: null };
    } catch (error) {
        return { data: null, error: normalizeProposalError(error) };
    }
}

export async function withdrawProposal(proposalId: string) {
    return supabase.from('proposals').delete().eq('id', proposalId);
}

export async function updateProposalStatus(proposalId: string, status: string) {
    return supabase.from('proposals').update({ status }).eq('id', proposalId);
}
