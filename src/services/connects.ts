/**
 * Connects Credit System — Service Layer
 * Each proposal costs CONNECTS_COST connects.
 * New freelancers get INITIAL_CONNECTS free.
 */
import { supabase } from '@/lib/supabase';

export const CONNECTS_COST = 2;       // connects per proposal
export const INITIAL_CONNECTS = 20;   // free connects for new freelancers

export interface ConnectsBalance {
    balance: number;
    used: number;
}

/**
 * Get the current connects balance for a freelancer.
 */
export async function getConnectsBalance(freelancerId: string): Promise<ConnectsBalance> {
    const { data, error } = await supabase
        .from('freelancer_profiles')
        .select('connects_balance, connects_used')
        .eq('id', freelancerId)
        .single();

    if (error || !data) return { balance: 0, used: 0 };
    return {
        balance: data.connects_balance ?? 0,
        used: data.connects_used ?? 0,
    };
}

/**
 * Spend connects when submitting a proposal.
 * Uses atomic SQL function to prevent race conditions.
 * Returns { success, balance, error? }
 */
export async function spendConnects(
    freelancerId: string,
    proposalId: string,
    cost = CONNECTS_COST,
): Promise<{ success: boolean; balance: number; error?: string }> {
    const { data, error } = await supabase.rpc('spend_connects_for_proposal', {
        p_freelancer_id: freelancerId,
        p_proposal_id: proposalId,
        p_cost: cost,
    });

    if (error) {
        return { success: false, balance: 0, error: error.message };
    }

    return data as { success: boolean; balance: number; error?: string };
}

/**
 * Refund connects when a proposal is withdrawn.
 */
export async function refundConnects(
    freelancerId: string,
    proposalId: string,
    refund = CONNECTS_COST,
): Promise<void> {
    await supabase.rpc('refund_connects_for_proposal', {
        p_freelancer_id: freelancerId,
        p_proposal_id: proposalId,
        p_refund: refund,
    });
}

/**
 * Get connects transaction history for a freelancer.
 */
export async function getConnectsHistory(freelancerId: string) {
    return supabase
        .from('connects_transactions')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .order('created_at', { ascending: false })
        .limit(50);
}
