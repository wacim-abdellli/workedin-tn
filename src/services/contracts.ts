/**
 * Contracts Service — All contract-related Supabase queries
 */
import { supabase } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { canAccessContract } from '@/lib/permissionEngine';
import { canTransitionContractStatus } from '@/lib/contractWorkflow';
import type { ContractStatus } from '@/types';

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
    const directResult = await supabaseWithRetry(() =>
        supabase
            .from('contracts')
            .select(`
                id, status, title, amount, total_amount, created_at, client_id, freelancer_id, job_id,
                delivery_note, delivery_submitted_at, review_due_at, revision_requests_count, max_revision_rounds,
                escrow_pending_clearance_until, escrow_hold_disputed, payment_status,
                client:public_profiles!client_id(id, full_name, avatar_url),
                freelancer:public_profiles!freelancer_id(id, full_name, avatar_url),
                job:jobs(id, title, category),
                milestones(id, description, amount, status, due_date)
            `)
            .eq('id', contractId)
            .single(),
        { throwOnError: false }
    );

    if (!directResult.error || !canRetryWithManualHydration(directResult.error)) {
        if (directResult.data && supabase.auth && typeof supabase.auth.getUser === 'function') {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && !canAccessContract(user.id, directResult.data)) {
                return { data: null, error: { message: 'Access Denied: You do not have permission to access this contract.', code: '403', details: '', hint: '' } };
            }
        }
        return directResult;
    }

    const { data: baseContract, error: baseError } = await supabaseWithRetry(() =>
        supabase
            .from('contracts')
            .select('*')
            .eq('id', contractId)
            .single(),
        { throwOnError: false }
    );

    if (baseError || !baseContract) {
        return { data: null, error: baseError || directResult.error };
    }

    const [jobResult, clientResult, freelancerResult, milestonesResult] = await Promise.all([
        supabaseWithRetry(() =>
            supabase
                .from('jobs')
                .select('id, title, category')
                .eq('id', baseContract.job_id)
                .maybeSingle(),
            { throwOnError: false }
        ),
        supabaseWithRetry(() =>
            supabase
                .from('public_profiles')
                .select('id, full_name, avatar_url')
                .eq('id', baseContract.client_id)
                .maybeSingle(),
            { throwOnError: false }
        ),
        supabaseWithRetry(() =>
            supabase
                .from('public_profiles')
                .select('id, full_name, avatar_url')
                .eq('id', baseContract.freelancer_id)
                .maybeSingle(),
            { throwOnError: false }
        ),
        supabaseWithRetry(() =>
            supabase
                .from('milestones')
                .select('id, description, amount, status, due_date')
                .eq('contract_id', contractId),
            { throwOnError: false }
        ),
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

    const contract = {
        ...baseContract,
        job: jobResult.data,
        client: clientResult.data,
        freelancer: freelancerResult.data,
        milestones: milestonesResult.data || [],
    };

    const user = (supabase.auth && typeof supabase.auth.getUser === 'function') ? (await supabase.auth.getUser())?.data?.user : null;
    if (user && !canAccessContract(user.id, contract)) {
        return { data: null, error: { message: 'Access Denied: You do not have permission to access this contract.', code: '403', details: '', hint: '' } };
    }

    return {
        data: contract,
        error: null,
    };
}

export async function getContractsByUser(userId: string) {
    return supabaseWithRetry(() =>
        supabase
            .from('contracts')
            .select(`
                *,
                client:public_profiles!client_id(id, full_name, avatar_url),
                freelancer:public_profiles!freelancer_id(id, full_name, avatar_url),
                job:jobs(id, title)
            `)
            .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
            .order('created_at', { ascending: false }),
        { throwOnError: false }
    );
}

// --- WRITE ---

export async function createContract(data: {
    job_id: string;
    client_id: string;
    freelancer_id: string;
    amount: number;
}) {
    const result = await supabaseWithRetry(() =>
        supabase
            .from('contracts')
            .insert({ ...data, status: 'pending_payment', payment_status: 'pending' })
            .select()
            .single(),
        { throwOnError: false }
    );

    if (result.error && typeof result.error === 'object' && 'message' in (result.error as any)) {
        const errObj = result.error as any;
        if (typeof errObj.message === 'string') {
            const normalized = errObj.message.trim();
            if (normalized.includes('identity verification') || normalized.includes('risk guardrails') || normalized.includes('New first-time accounts')) {
                errObj.message = normalized;
            }
        }
    }

    return result;
}

export async function updateContractStatus(contractId: string, status: string) {
    const { data: contractData, error: fetchError } = await supabaseWithRetry(() =>
        supabase
            .from('contracts')
            .select('status')
            .eq('id', contractId)
            .single(),
        { throwOnError: false }
    );

    if (fetchError) {
        return { data: null, error: fetchError };
    }

    const currentContract = Array.isArray(contractData) ? contractData[0] : contractData;
    const currentStatus = currentContract?.status;

    if (!canTransitionContractStatus(currentStatus, status as ContractStatus)) {
        return {
            data: null,
            error: {
                message: `Access Denied: Illegal transition from ${currentStatus} to ${status}`,
                details: 'Contract status transition is not permitted.',
                hint: 'Check the contract workflow state machine rules.',
                code: '403',
            }
        };
    }

    return supabaseWithRetry(() =>
        supabase.from('contracts').update({ status }).eq('id', contractId),
        { throwOnError: false }
    );
}

// --- MILESTONES ---

export async function getMilestones(contractId: string) {
    return supabaseWithRetry(() =>
        supabase
            .from('milestones')
            .select('*')
            .eq('contract_id', contractId)
            .order('order_index', { ascending: true }),
        { throwOnError: false }
    );
}

export async function createMilestone(data: {
    contract_id: string;
    title: string;
    description?: string;
    amount: number;
    due_date?: string;
    order_index: number;
}) {
    return supabaseWithRetry(() =>
        supabase.from('milestones').insert(data).select().single(),
        { throwOnError: false }
    );
}

export async function updateMilestoneStatus(milestoneId: string, status: string) {
    return supabaseWithRetry(() =>
        supabase.from('milestones').update({ status }).eq('id', milestoneId),
        { throwOnError: false }
    );
}

