/**
 * Flouci Payment Gateway Service for Khedma.tn
 * Documentation: https://flouci.com/developers
 * 
 * TODO: Move VITE_FLOUCI_APP_SECRET to Supabase Edge Function in production
 * The secret should never be exposed in client-side code for production use.
 */

import type {
    FlouciPaymentRequest,
    FlouciPaymentResponse,
    FlouciVerificationResponse,
} from '../types/payment';

// API Configuration
const FLOUCI_API_URL = import.meta.env.VITE_FLOUCI_API_URL || 'https://developers.flouci.com/api';
const APP_TOKEN = import.meta.env.VITE_FLOUCI_APP_TOKEN || '';
const APP_SECRET = import.meta.env.VITE_FLOUCI_APP_SECRET || ''; // TODO: Move to Edge Function

// Development mode flag
const IS_DEV_MODE = !APP_TOKEN || APP_TOKEN === 'test' || import.meta.env.DEV;

/**
 * Initiate a Flouci payment
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

    // In development mode without credentials, return mock response
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
        const response = await fetch(`${FLOUCI_API_URL}/generate_payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apppublic': APP_TOKEN,
            },
            body: JSON.stringify({
                app_token: APP_TOKEN,
                app_secret: APP_SECRET, // TODO: Move to server-side
                amount: payment.amount,
                accept_card: 'true',
                session_timeout_secs: payment.session_timeout_secs || 1200, // 20 minutes default
                success_link: payment.success_link,
                fail_link: payment.fail_link,
                developer_tracking_id: payment.developer_tracking_id,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Flouci] API error:', response.status, errorText);
            throw new Error(`فشل في الاتصال بخدمة الدفع: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Flouci] Payment initiated:', data);

        if (data.result?.success) {
            return {
                payment_id: data.result.payment_id,
                link: data.result.link,
            };
        } else {
            throw new Error(data.result?.message || 'فشل في بدء عملية الدفع');
        }
    } catch (error) {
        console.error('[Flouci] Payment initiation error:', error);

        if (error instanceof Error) {
            throw error;
        }
        throw new Error('خطأ غير متوقع في خدمة الدفع');
    }
}

/**
 * Verify a Flouci payment status
 * Call this after user returns from payment page
 * 
 * @param paymentId - Payment ID from Flouci
 * @returns Verification response with payment status
 */
export async function verifyPayment(
    paymentId: string
): Promise<FlouciVerificationResponse> {
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
        const response = await fetch(`${FLOUCI_API_URL}/verify_payment/${paymentId}`, {
            method: 'GET',
            headers: {
                'apppublic': APP_TOKEN,
                'appsecret': APP_SECRET, // TODO: Move to server-side
            },
        });

        if (!response.ok) {
            console.error('[Flouci] Verification API error:', response.status);
            throw new Error('فشل في التحقق من عملية الدفع');
        }

        const data = await response.json();
        console.log('[Flouci] Verification result:', data);

        return {
            status: data.result?.status || 'FAILED',
            payment_id: paymentId,
            amount: data.result?.amount || 0,
            developer_tracking_id: data.result?.developer_tracking_id,
            created_at: data.result?.created_at || new Date().toISOString(),
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
 */
export function isFlouciConfigured(): boolean {
    return Boolean(APP_TOKEN && APP_SECRET && !IS_DEV_MODE);
}

/**
 * Get Flouci configuration status for debugging
 */
export function getFlouciStatus(): {
    configured: boolean;
    devMode: boolean;
    hasToken: boolean;
    hasSecret: boolean;
} {
    return {
        configured: isFlouciConfigured(),
        devMode: IS_DEV_MODE,
        hasToken: Boolean(APP_TOKEN && APP_TOKEN !== 'test'),
        hasSecret: Boolean(APP_SECRET && APP_SECRET !== 'test'),
    };
}
