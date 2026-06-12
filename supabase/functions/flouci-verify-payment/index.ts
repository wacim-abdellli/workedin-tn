/**
 * Supabase Edge Function: Flouci Payment Verification
 *
 * SECURITY:
 * - Requires authenticated user
 * - Verifies caller is the contract's client before completing payment
 * - CORS restricted to production domain
 * - APP_SECRET stays server-side
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function logPaymentEvent(supabaseClient: any, payload: {
    user_id: string;
    event_type: string;
    amount: number;
    flouci_session_id?: string;
    contract_id?: string;
    wallet_id?: string;
    status: string;
    metadata?: Record<string, unknown>;
}) {
    try {
        await supabaseClient.from('payment_audit_log').insert({
            ...payload,
            currency: 'TND',
            metadata: payload.metadata ?? {},
        });
    } catch (err) {
        // Never let audit logging crash the payment flow
        console.error('[audit_log] failed to write:', err);
    }
}

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://workedin.tn'

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FLOUCI_API_URL = Deno.env.get('FLOUCI_API_URL') || 'https://developers.flouci.com/api'
const APP_TOKEN = Deno.env.get('FLOUCI_APP_TOKEN')!
const APP_SECRET = Deno.env.get('FLOUCI_APP_SECRET')!

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // --- AUTH CHECK ---
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! }
                }
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('[Flouci Edge] Auth error:', authError)
            return new Response(
                JSON.stringify({ error: 'Unauthorized', details: 'You must be logged in to verify a payment' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // --- INPUT VALIDATION ---
        const { payment_id, complete_payment, transaction_id, contract_id, freelancer_id, amount: _amount } = await req.json()

        if (!payment_id || typeof payment_id !== 'string') {
            return new Response(
                JSON.stringify({ error: 'payment_id is required and must be a string' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('[Flouci Edge] Verifying payment:', payment_id, 'for user:', user.id)

        // --- VERIFY WITH FLOUCI ---
        const response = await fetch(`${FLOUCI_API_URL}/verify_payment/${payment_id}`, {
            method: 'GET',
            headers: {
                'apppublic': APP_TOKEN,
                'appsecret': APP_SECRET,
            },
        })

        if (!response.ok) {
            console.error('[Flouci Edge] Verification API error:', response.status)
            return new Response(
                JSON.stringify({ error: 'Payment verification failed', status: response.status }),
                { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const data = await response.json()
        console.log('[Flouci Edge] Verification result:', JSON.stringify(data))

        const verificationResult = {
            status: data.result?.status || 'FAILED',
            payment_id: payment_id,
            amount: data.result?.amount || 0,
            developer_tracking_id: data.result?.developer_tracking_id,
            created_at: data.result?.created_at || new Date().toISOString(),
        }

        // --- ATOMIC PAYMENT COMPLETION ---
        if (complete_payment && verificationResult.status === 'SUCCESS' && transaction_id && contract_id && freelancer_id) {
            console.log('[Flouci Edge] Completing payment atomically...')

            // Use service role for database operations
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL')!,
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
            )

            // SECURITY: Verify the authenticated user is the contract's client
            const { data: contract, error: contractError } = await supabaseAdmin
                .from('contracts')
                .select('client_id, freelancer_id, amount, funded_at, payment_status')
                .eq('id', contract_id)
                .single()

            if (contractError || !contract) {
                console.error('[Flouci Edge] Contract not found:', contractError)
                return new Response(
                    JSON.stringify({ error: 'Contract not found' }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            if (contract.client_id !== user.id) {
                console.error('[Flouci Edge] User', user.id, 'is not the client of contract', contract_id)
                return new Response(
                    JSON.stringify({ error: 'Forbidden: you are not the client of this contract' }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            if (contract.freelancer_id !== freelancer_id) {
                return new Response(
                    JSON.stringify({ error: 'Freelancer mismatch for contract' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            const { data: transaction, error: transactionError } = await supabaseAdmin
                .from('transactions')
                .select('id, contract_id, user_id, payment_gateway_id, status, amount')
                .eq('id', transaction_id)
                .maybeSingle()

            if (transactionError || !transaction) {
                return new Response(
                    JSON.stringify({ error: 'Pending payment transaction not found' }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            if (transaction.user_id !== user.id || transaction.contract_id !== contract_id || transaction.payment_gateway_id !== payment_id) {
                return new Response(
                    JSON.stringify({ error: 'Payment transaction does not match this contract session' }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            if (transaction.status === 'completed' || contract.funded_at || ['in_escrow', 'released'].includes(contract.payment_status || '')) {
                return new Response(
                    JSON.stringify({
                        verification: verificationResult,
                        completion: { success: true, data: { existing: true } }
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // Call atomic function
            const { data: completionResult, error: completionError } = await supabaseAdmin.rpc('complete_escrow_payment', {
                p_transaction_id: transaction_id,
                p_contract_id: contract_id,
                p_freelancer_id: freelancer_id,
                p_amount: contract.amount,
            })

            if (completionError) {
                console.error('[Flouci Edge] Payment completion error:', completionError)

                // Log failed payment
                await logPaymentEvent(supabaseAdmin, {
                    user_id: user.id,
                    event_type: 'payment_failed',
                    amount: contract.amount,
                    flouci_session_id: payment_id,
                    contract_id: contract_id,
                    status: 'failed',
                    metadata: { error: completionError.message, transaction_id },
                });

                return new Response(
                    JSON.stringify({
                        verification: verificationResult,
                        completion: { success: false, error: completionError.message }
                    }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // Log successful payment
            await logPaymentEvent(supabaseAdmin, {
                user_id: user.id,
                event_type: 'payment_success',
                amount: contract.amount,
                flouci_session_id: payment_id,
                contract_id: contract_id,
                status: 'success',
                metadata: { transaction_id, freelancer_id, completion_result: completionResult },
            });

            return new Response(
                JSON.stringify({
                    verification: verificationResult,
                    completion: { success: true, data: completionResult }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify(verificationResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        console.error('[Flouci Edge] Verification error:', message)
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

