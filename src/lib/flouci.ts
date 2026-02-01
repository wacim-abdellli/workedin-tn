/**
 * Flouci Payment Gateway Service for Khedma.tn
 * Documentation: https://flouci.com/developers
 * 
 * SECURITY: All payment operations handled via Supabase Edge Functions.
 * APP_SECRET is never exposed to the client.
 */

import { supabase } from './supabase';
import type {
    FlouciPaymentRequest,
    FlouciPaymentResponse,
    FlouciVerificationResponse,
} from '../types/payment';

// Development mode flag
const IS_DEV_MODE = import.meta.env.DEV;

/**
 * Initiate a Flouci payment via Edge Function
 * Creates a payment session and returns a redirect URL
 * 
 * @param payment - Payment request details
 * @returns Payment response with payment_id and redirect link
 */
export async function initiatePayment(
    payment: FlouciPaymentRequest
): Promise<FlouciPaymentResponse> {
    console.log('[Flouci] Initiating payment:', {
        amount: payment.amount,
        tracking_id: payment.developer_tracking_id,
    });

    // In development mode without Edge Functions, return mock response
    if (IS_DEV_MODE) {
        console.log('[Flouci] Running in DEV mode - returning mock payment');
        const mockPaymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            payment_id: mockPaymentId,
            // In dev mode, redirect directly to success page
            link: `${payment.success_link}&payment_id=${mockPaymentId}`,
        };
    }

    try {
        // Call Edge Function (APP_SECRET handled server-side)
        const { data, error } = await supabase.functions.invoke('flouci-initiate-payment', {
            body: {
                amount: payment.amount,
                success_link: payment.success_link,
                fail_link: payment.fail_link,
                developer_tracking_id: payment.developer_tracking_id,
                session_timeout_secs: payment.session_timeout_secs,
            }
        });

        if (error) {
            console.error('[Flouci] Edge Function error:', error);
            throw new Error(error.message || 'فشل في بدء عملية الدفع');
        }

        if (data.error) {
            throw new Error(data.error);
        }

        console.log('[Flouci] Payment initiated:', data);

        return {
            payment_id: data.payment_id,
            link: data.link,
        };
    } catch (error) {
        console.error('[Flouci] Payment initiation error:', error);

        if (error instanceof Error) {
            throw error;
        }
        throw new Error('خطأ غير متوقع في خدمة الدفع');
    }
}

/**
 * Verify a Flouci payment status via Edge Function
 * Call this after user returns from payment page
 * 
 * @param paymentId - Payment ID from Flouci
 * @param options - Optional parameters for atomic completion
 * @returns Verification response with payment status
 */
export async function verifyPayment(
    paymentId: string,
    options?: {
        complete_payment?: boolean;
        transaction_id?: string;
        contract_id?: string;
        freelancer_id?: string;
        amount?: number;
    }
): Promise<FlouciVerificationResponse & { completion?: { success: boolean; data?: any; error?: string } }> {
    console.log('[Flouci] Verifying payment:', paymentId);

    // In development mode, simulate successful verification
    if (IS_DEV_MODE) {
        console.log('[Flouci] Running in DEV mode - returning mock verification');

        // Simulate successful payment for mock IDs
        if (paymentId.startsWith('mock_')) {
            return {
                status: 'SUCCESS',
                payment_id: paymentId,
                amount: 0, // Amount would come from real API
                developer_tracking_id: undefined,
                created_at: new Date().toISOString(),
            };
        }

        // Unknown payment ID in dev mode
        return {
            status: 'FAILED',
            payment_id: paymentId,
            amount: 0,
            created_at: new Date().toISOString(),
        };
    }

    try {
        // Call Edge Function for verification (and optional atomic completion)
        const { data, error } = await supabase.functions.invoke('flouci-verify-payment', {
            body: {
                payment_id: paymentId,
                ...options,
            }
        });

        if (error) {
            console.error('[Flouci] Verification Edge Function error:', error);
            throw new Error('فشل في التحقق من عملية الدفع');
        }

        console.log('[Flouci] Verification result:', data);

        // If completion was requested, return full response
        if (options?.complete_payment && data.verification) {
            return {
                ...data.verification,
                completion: data.completion,
            };
        }

        return {
            status: data.status || 'FAILED',
            payment_id: paymentId,
            amount: data.amount || 0,
            developer_tracking_id: data.developer_tracking_id,
            created_at: data.created_at || new Date().toISOString(),
        };
    } catch (error) {
        console.error('[Flouci] Payment verification error:', error);

        if (error instanceof Error) {
            throw error;
        }
        throw new Error('خطأ في التحقق من عملية الدفع');
    }
}

/**
 * Check if Flouci is properly configured
 * In production, configuration is on server-side (Edge Functions)
 */
export function isFlouciConfigured(): boolean {
    // In dev mode, always return true for mock payments
    if (IS_DEV_MODE) return true;
    // In production, assume Edge Functions are configured
    return true;
}

/**
 * Get Flouci configuration status for debugging
 */
export function getFlouciStatus(): {
    configured: boolean;
    devMode: boolean;
    usingEdgeFunctions: boolean;
} {
    return {
        configured: isFlouciConfigured(),
        devMode: IS_DEV_MODE,
        usingEdgeFunctions: !IS_DEV_MODE,
    };
}
