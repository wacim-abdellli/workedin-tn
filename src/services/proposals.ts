/**
 * Proposals Service - All proposal-related Supabase queries
 */
import { supabase, uploadFile } from '@/lib/supabase';

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
        .select(`*, freelancer:profiles!freelancer_id(id, full_name, avatar_url, location)`)
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
        // freelancer_profiles.id = profiles.id (same UUID as auth user).
        // Guard: ensure the user has a freelancer_profiles row before inserting.
        const { data: fp, error: fpError } = await supabase
            .from('freelancer_profiles')
            .select('id')
            .eq('id', data.freelancer_id)
            .maybeSingle();

        if (fpError) throw fpError;

        if (!fp) {
            // Auto-create a minimal freelancer_profiles row so the FK is satisfied.
            // Users can complete their profile later from the dashboard.
            const { error: insertFpError } = await supabase
                .from('freelancer_profiles')
                .insert({ id: data.freelancer_id });
            if (insertFpError) {
                return {
                    data: null,
                    error: new Error('يجب إكمال ملفك الشخصي كمستقل قبل تقديم العروض.'),
                };
            }
        }

        const attachmentUrls: string[] = [];

        for (const file of files) {
            const path = `${data.freelancer_id}/${data.job_id}/${Date.now()}-${file.name}`;
            const uploadedUrl = await uploadFile('attachments', path, file);
            attachmentUrls.push(uploadedUrl);
        }

        const { data: proposal, error } = await supabase
            .from('proposals')
            .insert({
                job_id: data.job_id,
                freelancer_id: data.freelancer_id,
                cover_letter: data.cover_letter,
                bid_amount: data.bid_amount,
                delivery_time_days: data.delivery_time_days,
                attachments: attachmentUrls,
            })
            .select('id')
            .single();

        if (error) throw error;

        return { data: proposal?.id ?? null, error: null };
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
