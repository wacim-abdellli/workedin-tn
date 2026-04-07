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
 * Atomically withdraw a proposal and refund connects in a single DB transaction.
 * Validates: proposal exists, caller owns it, status is pending, no prior refund.
 * Replaces the old two-step (withdrawProposal + refundConnects) pattern.
 * Returns { success, proposal_id, refunded } or throws on validation failure.
 */
export async function withdrawProposalWithRefund(
    proposalId: string,
    refund = CONNECTS_COST,
): Promise<{ success: boolean; proposal_id: string; refunded: number }> {
    const { data, error } = await supabase.rpc('withdraw_proposal_atomic', {
        p_proposal_id: proposalId,
        p_refund: refund,
    });

    if (error) throw error;
    return data as { success: boolean; proposal_id: string; refunded: number };
}

/**
 * @deprecated Use withdrawProposalWithRefund() instead.
 * Kept only for legacy call sites that should be migrated.
 * The underlying DB function (refund_connects_for_proposal) now rejects
 * all authenticated callers and is service-role only.
 */
export async function refundConnects(
    _freelancerId: string,
    _proposalId: string,
    _refund = CONNECTS_COST,
): Promise<void> {
    // No-op: the DB function will raise an error if called by an authenticated user.
    // This stub exists to prevent import errors during migration.
    // Replace all call sites with withdrawProposalWithRefund().
    if (process.env.NODE_ENV !== 'test') {
        console.warn(
            '[connects] refundConnects() is deprecated. ' +
            'Use withdrawProposalWithRefund() for atomic, validated connects refunds.',
        );
    }
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
