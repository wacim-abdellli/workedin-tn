/**
 * Dhmad Escrow Service
 *
 * Docs:       https://docs.dhmad.tn
 * Sandbox:    https://sandbox.dhmad.tn/api/v1
 * Production: https://dhmad.tn/api/v1
 *
 * In DEV mode all calls return realistic mock data — no network required.
 * In PROD mode calls are proxied through the corresponding Supabase Edge Functions
 * so that DHMAD_API_KEY is never exposed to the browser.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DhmadEscrowRequest {
    amount: number;       // TND — Dhmad uses TND directly (not millimes)
    buyer_id: string;     // WorkedIn user ID (client)
    seller_id: string;    // WorkedIn user ID (freelancer)
    contract_id: string;  // WorkedIn contract ID
    description: string;  // Human-readable description
}

export interface DhmadEscrowResponse {
    escrow_id: string;
    status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
    amount: number;
    payment_url?: string; // Redirect URL for client to fund the escrow
    created_at: string;
}

export interface DhmadReleaseResponse {
    success: boolean;
    escrow_id: string;
    status: 'released';
    released_at: string;
}

export interface DhmadRefundResponse {
    success: boolean;
    escrow_id: string;
    status: 'refunded';
    refunded_at: string;
}

// ─── Dev-mode mock helpers ────────────────────────────────────────────────────

function mockEscrowId(): string {
    return `dhmad_mock_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

function isoNow(): string {
    return new Date().toISOString();
}

// ─── createEscrow ─────────────────────────────────────────────────────────────

/**
 * Creates a Dhmad escrow for a contract.
 * Returns a payment_url the client must visit to fund the escrow.
 */
export async function createEscrow(
    request: DhmadEscrowRequest,
): Promise<DhmadEscrowResponse> {
    // DEV: return a realistic mock so development works without Dhmad credentials
    if (import.meta.env.DEV) {
        logger.info('[Dhmad][DEV] createEscrow mock', request);
        const escrow_id = mockEscrowId();
        return {
            escrow_id,
            status: 'pending',
            amount: request.amount,
            payment_url: `https://sandbox.dhmad.tn/pay/${escrow_id}`,
            created_at: isoNow(),
        };
    }

    // PROD: proxy through Supabase Edge Function
    try {
        const { data, error } = await supabase.functions.invoke<DhmadEscrowResponse>(
            'dhmad-create-escrow',
            { body: request },
        );
        if (error) throw error;
        if (!data) throw new Error('لم يتم استلام أي رد من خادم الضمان');
        return data;
    } catch (err) {
        logger.error('[Dhmad] createEscrow failed', err);
        throw new Error('فشل إنشاء الضمان. يرجى المحاولة مرة أخرى.');
    }
}

// ─── releaseEscrow ────────────────────────────────────────────────────────────

/**
 * Releases a funded escrow to the freelancer (seller).
 * Should be called after the client approves the delivered work.
 */
export async function releaseEscrow(
    escrow_id: string,
    contract_id: string,
): Promise<DhmadReleaseResponse> {
    if (import.meta.env.DEV) {
        logger.info('[Dhmad][DEV] releaseEscrow mock', { escrow_id, contract_id });
        return {
            success: true,
            escrow_id,
            status: 'released',
            released_at: isoNow(),
        };
    }

    try {
        const { data, error } = await supabase.functions.invoke<DhmadReleaseResponse>(
            'dhmad-release-escrow',
            { body: { escrow_id, contract_id } },
        );
        if (error) throw error;
        if (!data) throw new Error('لم يتم استلام أي رد من خادم الضمان');
        return data;
    } catch (err) {
        logger.error('[Dhmad] releaseEscrow failed', err);
        throw new Error('فشل تحرير الضمان. يرجى المحاولة مرة أخرى.');
    }
}

// ─── refundEscrow ─────────────────────────────────────────────────────────────

/**
 * Refunds a funded escrow back to the client (buyer).
 * Should be called when a contract is cancelled before work is completed.
 */
export async function refundEscrow(
    escrow_id: string,
    contract_id: string,
    reason: string,
): Promise<DhmadRefundResponse> {
    if (import.meta.env.DEV) {
        logger.info('[Dhmad][DEV] refundEscrow mock', { escrow_id, contract_id, reason });
        return {
            success: true,
            escrow_id,
            status: 'refunded',
            refunded_at: isoNow(),
        };
    }

    try {
        const { data, error } = await supabase.functions.invoke<DhmadRefundResponse>(
            'dhmad-refund-escrow',
            { body: { escrow_id, contract_id, reason } },
        );
        if (error) throw error;
        if (!data) throw new Error('لم يتم استلام أي رد من خادم الضمان');
        return data;
    } catch (err) {
        logger.error('[Dhmad] refundEscrow failed', err);
        throw new Error('فشل استرجاع مبلغ الضمان. يرجى المحاولة مرة أخرى.');
    }
}

// ─── getEscrowStatus ──────────────────────────────────────────────────────────

/**
 * Fetches the current status of an existing escrow from Dhmad.
 */
export async function getEscrowStatus(
    escrow_id: string,
): Promise<DhmadEscrowResponse> {
    if (import.meta.env.DEV) {
        logger.info('[Dhmad][DEV] getEscrowStatus mock', { escrow_id });
        return {
            escrow_id,
            status: 'funded',
            amount: 0,
            created_at: isoNow(),
        };
    }

    try {
        const { data, error } = await supabase.functions.invoke<DhmadEscrowResponse>(
            'dhmad-get-escrow-status',
            { body: { escrow_id } },
        );
        if (error) throw error;
        if (!data) throw new Error('لم يتم استلام أي رد من خادم الضمان');
        return data;
    } catch (err) {
        logger.error('[Dhmad] getEscrowStatus failed', err);
        throw new Error('فشل الحصول على حالة الضمان. يرجى المحاولة مرة أخرى.');
    }
}

// ─── createCheckoutSession ────────────────────────────────────────────────────

export type DhmadCheckoutAction = 'sign_contract' | 'accept_pay' | 'complete' | 'dispute';

export interface DhmadCheckoutSession {
    session_id: string;
    url: string; // Redirect user to this URL
}

/**
 * Creates a DHMAD checkout session so the user can be redirected to dhmad.tn
 * to perform a critical action (sign contract, pay, complete, dispute).
 */
export async function createCheckoutSession(
    escrow_id: string,
    action: DhmadCheckoutAction,
    user_email: string,
    redirect_url: string,
): Promise<DhmadCheckoutSession> {
    if (import.meta.env.DEV) {
        logger.info('[Dhmad][DEV] createCheckoutSession mock', { escrow_id, action });
        const mockSessionId = `mock_session_${crypto.randomUUID().slice(0, 8)}`;
        return {
            session_id: mockSessionId,
            url: `${redirect_url}?session_id=${mockSessionId}&status=completed`,
        };
    }

    try {
        const { data, error } = await supabase.functions.invoke<DhmadCheckoutSession>(
            'dhmad-checkout-session',
            { body: { escrow_id, action, user_email, redirect_url } },
        );
        if (error) throw error;
        if (!data) throw new Error('لم يتم استلام رابط الدفع');
        return data;
    } catch (err) {
        logger.error('[Dhmad] createCheckoutSession failed', err);
        throw new Error('فشل إنشاء جلسة الدفع. يرجى المحاولة مرة أخرى.');
    }
}
