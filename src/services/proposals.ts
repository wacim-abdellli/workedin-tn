/**
 * Proposals Service — All proposal-related Supabase queries
 */
import { supabase, uploadFile } from '@/lib/supabase';

export interface CreateProposalInput {
    job_id: string;
    freelancer_id: string;
    cover_letter: string;
    bid_amount: number;
    delivery_days: number;
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
    // Upload attachments
    const attachmentUrls: string[] = [];
    for (const file of files) {
        const path = `${data.freelancer_id}/${data.job_id}/${Date.now()}-${file.name}`;
        const url = await uploadFile('attachments', path, file);
        if (url) attachmentUrls.push(url);
    }

    return supabase.from('proposals').insert({
        ...data,
        attachments: attachmentUrls,
        status: 'pending',
    });
}

export async function withdrawProposal(proposalId: string) {
    return supabase.from('proposals').delete().eq('id', proposalId);
}

export async function updateProposalStatus(proposalId: string, status: string) {
    return supabase.from('proposals').update({ status }).eq('id', proposalId);
}
