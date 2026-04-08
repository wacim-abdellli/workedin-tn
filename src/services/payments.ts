/**
 * Payments Service — Flouci payment and wallet queries
 */
import { supabase } from '@/lib/supabase';
import type {
    AddPaymentMethodInput,
    EarningsTransactionSummary,
    PaymentMethodType,
    ReconcilePaymentResult,
    StuckTransaction,
    WalletEarningsStats,
    WithdrawalRequestInput,
} from '@/types/payment';

export interface PaymentMethodRow {
    id: string;
    user_id: string;
    type: PaymentMethodType | string;
    is_default: boolean;
    label?: string | null;
    bank_name?: string | null;
    iban?: string | null;
    card_last_four?: string | null;
    card_brand?: string | null;
    d17_phone?: string | null;
    verified?: boolean | null;
    created_at?: string;
    updated_at?: string;
}

function readPaymentDetailValue(details: AddPaymentMethodInput['details']): string {
    if (typeof details === 'string') {
        return details.trim();
    }

    const candidates = [
        details.phone_number,
        details.d17_phone,
        details.bank_iban,
        details.iban,
        details.card_last_four,
        details.label,
    ];

    return (candidates.find((value) => typeof value === 'string' && value.trim().length > 0) ?? '').trim();
}

export function getPaymentMethodLabel(type: PaymentMethodType | string, fallbackLabel?: string | null): string {
    if (fallbackLabel?.trim()) return fallbackLabel.trim();

    if (type === 'd17') return 'D17';
    if (type === 'flouci') return 'Flouci';
    if (type === 'bank_transfer' || type === 'bank') return 'Bank transfer';
    if (type === 'card') return 'Card';

    return String(type);
}

export function getPaymentMethodDetails(paymentMethod: Partial<PaymentMethodRow>): string {
    const type = paymentMethod.type ?? '';

    if (type === 'd17' || type === 'flouci') {
        return paymentMethod.d17_phone ?? '';
    }

    if (type === 'bank_transfer' || type === 'bank') {
        return paymentMethod.iban ?? paymentMethod.bank_name ?? '';
    }

    if (type === 'card') {
        const lastFour = paymentMethod.card_last_four?.trim();
        return lastFour ? `**** ${lastFour}` : '';
    }

    return paymentMethod.iban ?? paymentMethod.d17_phone ?? paymentMethod.bank_name ?? '';
}

export function buildPaymentMethodInsert(userId: string, data: AddPaymentMethodInput) {
    const detailValue = readPaymentDetailValue(data.details);
    const insertPayload: Record<string, string | boolean> = {
        user_id: userId,
        type: data.type,
        is_default: data.is_default ?? false,
        label: getPaymentMethodLabel(data.type),
    };

    if (data.type === 'd17' || data.type === 'flouci') {
        insertPayload.d17_phone = detailValue;
        return insertPayload;
    }

    if (data.type === 'bank_transfer' || data.type === 'bank') {
        insertPayload.iban = detailValue;
        return insertPayload;
    }

    if (data.type === 'card') {
        insertPayload.card_last_four = detailValue.slice(-4);
        return insertPayload;
    }

    return insertPayload;
}

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
    return supabase.rpc('request_withdrawal_atomic', {
        p_wallet_id: (data as WithdrawalRequestInput & { wallet_id?: string }).wallet_id,
        p_amount: data.amount,
        p_method: data.method,
        p_client_request_id: crypto.randomUUID(),
        p_bank_name: data.details.bank_name ?? null,
        p_bank_account_name: data.details.bank_account_name ?? null,
        p_bank_iban: data.details.bank_iban ?? data.details.iban ?? null,
        p_phone_number: data.details.phone_number ?? data.details.d17_phone ?? null,
    });
}

// --- PAYMENT METHODS ---

export function getPaymentMethods(userId: string) {
    return supabase.from('payment_methods').select('*').eq('user_id', userId);
}

export function addPaymentMethod(userId: string, data: AddPaymentMethodInput) {
    return supabase.from('payment_methods').insert(buildPaymentMethodInsert(userId, data));
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
        .filter(t => t.type === 'earning' || t.type === 'escrow_release' || t.type === 'release')
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
        .select('id, user_id, amount, type, status, contract_id, created_at')
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
