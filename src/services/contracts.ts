/**
 * Contracts Service — All contract-related Supabase queries
 */
import { supabase } from '@/lib/supabase';

function getErrorText(error: unknown): string {
    if (!error || typeof error !== 'object') return '';

    const candidate = error as {
        message?: unknown;
        details?: unknown;
        hint?: unknown;
    };

    return [candidate.message, candidate.details, candidate.hint]
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLowerCase();
}

function canRetryWithManualHydration(error: unknown): boolean {
    const text = getErrorText(error);
    if (!text) return false;

    return (
        text.includes('relationship')
        || text.includes('schema cache')
        || text.includes('column')
        || text.includes('does not exist')
    );
}

// --- READ ---

export async function getContractById(contractId: string) {
    const directResult = await supabase
        .from('contracts')
        .select(`
            id, status, title, amount, total_amount, created_at, client_id, freelancer_id, job_id,
            client:public_profiles!client_id(id, full_name, avatar_url),
            freelancer:public_profiles!freelancer_id(id, full_name, avatar_url),
            job:jobs(id, title, category),
            milestones(id, description, amount, status, due_date)
        `)
        .eq('id', contractId)
        .single();

    if (!directResult.error || !canRetryWithManualHydration(directResult.error)) {
        return directResult;
    }

    const { data: baseContract, error: baseError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();

    if (baseError || !baseContract) {
        return { data: null, error: baseError || directResult.error };
    }

    const [jobResult, clientResult, freelancerResult, milestonesResult] = await Promise.all([
        supabase
            .from('jobs')
            .select('id, title, category')
            .eq('id', baseContract.job_id)
            .maybeSingle(),
        supabase
            .from('public_profiles')
            .select('id, full_name, avatar_url')
            .eq('id', baseContract.client_id)
            .maybeSingle(),
        supabase
            .from('public_profiles')
            .select('id, full_name, avatar_url')
            .eq('id', baseContract.freelancer_id)
            .maybeSingle(),
        supabase
            .from('milestones')
            .select('id, description, amount, status, due_date')
            .eq('contract_id', contractId),
    ]);

    if (jobResult.error) {
        return { data: null, error: jobResult.error };
    }

    if (clientResult.error) {
        return { data: null, error: clientResult.error };
    }

    if (freelancerResult.error) {
        return { data: null, error: freelancerResult.error };
    }

    if (milestonesResult.error) {
        return { data: null, error: milestonesResult.error };
    }

    return {
        data: {
            ...baseContract,
            job: jobResult.data,
            client: clientResult.data,
            freelancer: freelancerResult.data,
            milestones: milestonesResult.data || [],
        },
        error: null,
    };
}

export async function getContractsByUser(userId: string) {
    return supabase
        .from('contracts')
        .select(`
            *,
            client:public_profiles!client_id(id, full_name, avatar_url),
            freelancer:public_profiles!freelancer_id(id, full_name, avatar_url),
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
    const result = await supabase
        .from('contracts')
        .insert({ ...data, status: 'pending_payment', payment_status: 'pending' })
        .select()
        .single();

    if (result.error?.message) {
        const normalized = result.error.message.trim();
        if (normalized.includes('identity verification') || normalized.includes('risk guardrails') || normalized.includes('New first-time accounts')) {
            result.error.message = normalized;
        }
    }

    return result;
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
