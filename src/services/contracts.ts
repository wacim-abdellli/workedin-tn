/**
 * Contracts Service — All contract-related Supabase queries
 */
import { supabase } from '@/lib/supabase';

// --- READ ---

export async function getContractById(contractId: string) {
    return supabase
        .from('contracts')
        .select(`
            id, status, title, amount, total_amount, created_at, client_id, freelancer_id, job_id,
            client:profiles!client_id(id, full_name, avatar_url),
            freelancer:profiles!freelancer_id(id, full_name, avatar_url),
            job:jobs(id, title, category),
            milestones(id, description, amount, status, due_date)
        `)
        .eq('id', contractId)
        .single();
}

export async function getContractsByUser(userId: string) {
    return supabase
        .from('contracts')
        .select(`
            *,
            client:profiles!client_id(id, full_name, avatar_url),
            freelancer:profiles!freelancer_id(id, full_name, avatar_url),
            job:jobs(id, title)
        `)
        .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
        .order('created_at', { ascending: false });
}

// --- WRITE ---

export async function createContract(data: {
    job_id: string;
    client_id: string;
    freelancer_id: string;
    amount: number;
}) {
    return supabase
        .from('contracts')
        .insert({ ...data, status: 'active', payment_status: 'pending' })
        .select()
        .single();
}

export async function updateContractStatus(contractId: string, status: string) {
    return supabase.from('contracts').update({ status }).eq('id', contractId);
}

// --- MILESTONES ---

export async function getMilestones(contractId: string) {
    return supabase
        .from('milestones')
        .select('*')
        .eq('contract_id', contractId)
        .order('order_index', { ascending: true });
}

export async function createMilestone(data: {
    contract_id: string;
    title: string;
    description?: string;
    amount: number;
    due_date?: string;
    order_index: number;
}) {
    return supabase.from('milestones').insert(data).select().single();
}

export async function updateMilestoneStatus(milestoneId: string, status: string) {
    return supabase.from('milestones').update({ status }).eq('id', milestoneId);
}
