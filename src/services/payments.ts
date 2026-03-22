/**
 * Payments Service — Flouci payment and wallet queries
 */
import { supabase } from '@/lib/supabase';

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

export async function getWithdrawals(userId: string) {
    return supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
}

export async function requestWithdrawal(data: {
    user_id: string;
    amount: number;
    method: string;
    details: Record<string, string>;
}) {
    return supabase.from('withdrawals').insert({ ...data, status: 'pending' });
}

// --- PAYMENT METHODS ---

export async function getPaymentMethods(userId: string) {
    return supabase.from('payment_methods').select('*').eq('user_id', userId);
}

export async function addPaymentMethod(userId: string, data: {
    type: string;
    details: Record<string, string>;
    is_default?: boolean;
}) {
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

export async function getEarningsStats(userId: string) {
    const [walletResult, transactionsResult] = await Promise.all([
        getWallet(userId),
        supabase.from('transactions').select('amount, type, created_at').eq('user_id', userId),
    ]);

    const transactions = transactionsResult.data || [];
    const totalEarnings = transactions
        .filter(t => t.type === 'earning' || t.type === 'escrow_release')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
        wallet: walletResult.data,
        totalEarnings,
        transactionCount: transactions.length,
    };
}

// --- ADMIN: STUCK TRANSACTIONS ---

export interface StuckTransaction {
    id: string;
    user_id: string;
    amount: number;
    type: string;
    status: string;
    reference_id: string;
    created_at: string;
    user_name: string | null;
    email: string | null;
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

export async function reconcilePayment(transactionId: string): Promise<{ success: boolean; message: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, message: 'Not authenticated' };

    const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reconcile-payment`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ transaction_id: transactionId }),
        }
    );

    const result = await response.json();
    if (!response.ok) {
        return { success: false, message: result.error || 'Reconciliation failed' };
    }
    return { success: true, message: result.message };
}

