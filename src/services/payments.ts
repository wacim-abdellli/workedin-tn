/**
 * Payments Service — Flouci payment and wallet queries
 */
import { supabase } from '@/lib/supabase';
import type {
    AddPaymentMethodInput,
    EarningsTransactionSummary,
    ReconcilePaymentResult,
    StuckTransaction,
    WalletEarningsStats,
    WithdrawalRequestInput,
} from '@/types/payment';

// --- WALLETS ---

export async function getWallet(userId: string) {
    return supabase.from('wallets').select('*').eq('user_id', userId).single();
}

export async function getTransactions(userId: string, page = 1, pageSize = 20) {
    const from = (page - 1) * pageSize;
    return supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
}

// --- WITHDRAWALS ---

export async function getWithdrawals(userId: string, page = 1, pageSize = 20) {
    const from = (page - 1) * pageSize;
    return supabase
        .from('withdrawals')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
}

export async function requestWithdrawal(data: WithdrawalRequestInput) {
    return supabase.from('withdrawals').insert({ ...data, status: 'pending' });
}

// --- PAYMENT METHODS ---

export async function getPaymentMethods(userId: string) {
    return supabase.from('payment_methods').select('*').eq('user_id', userId);
}

export async function addPaymentMethod(userId: string, data: AddPaymentMethodInput) {
    return supabase.from('payment_methods').insert({ user_id: userId, ...data });
}

// --- ESCROW ---

export async function completeEscrowPayment(transactionId: string, contractId: string, freelancerId: string, amount: number) {
    return supabase.rpc('complete_escrow_payment', {
        p_transaction_id: transactionId,
        p_contract_id: contractId,
        p_freelancer_id: freelancerId,
        p_amount: amount,
    });
}

// --- STATS ---

export async function getEarningsStats(userId: string): Promise<WalletEarningsStats> {
    const [walletResult, transactionsResult] = await Promise.all([
        getWallet(userId),
        supabase
            .from('transactions')
            .select('amount, type, created_at')
            .eq('user_id', userId),
    ]);

    const transactions: EarningsTransactionSummary[] = transactionsResult.data || [];
    const totalEarnings = transactions
        .filter(t => t.type === 'earning' || t.type === 'escrow_release')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
        wallet: walletResult.data,
        totalEarnings,
        transactionCount: transactions.length,
    };
}

export async function getStuckTransactions(): Promise<StuckTransaction[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select('id, user_id, amount, type, status, reference_id, created_at')
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data as unknown as StuckTransaction[];
}

export async function reconcilePayment(transactionId: string): Promise<ReconcilePaymentResult> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, message: 'Not authenticated' };

    const { data, error } = await supabase.functions.invoke('reconcile-payment', {
        body: { transaction_id: transactionId },
    });

    if (error) {
        const message = error.message || 'Reconciliation failed';
        return { success: false, message };
    }

    const result = (data ?? {}) as { message?: string };
    return { success: true, message: result.message || 'Reconciliation succeeded' };
}


export async function verifyPaymentProcessorStatus(contractId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase.functions.invoke('flouci-verify-payment', {
            body: { contract_id: contractId },
        });
        
        if (error) {
            console.error('Payment verification edge function error:', error);
            return false;
        }
        
        // Ensure successful response from Flouci (or handle mock gracefully in dev)
        return data?.status === 'SUCCESS' || data?.success === true;
    } catch (err) {
        console.error('Payment verification failed:', err);
        return false;
    }
}
