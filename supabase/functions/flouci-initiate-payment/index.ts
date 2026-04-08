/**
 * Supabase Edge Function: Flouci Payment Initiation
 * 
 * This function securely handles payment initiation with Flouci.
 * The APP_SECRET is stored server-side and never exposed to clients.
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

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://khedma.tn'

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FLOUCI_API_URL = Deno.env.get('FLOUCI_API_URL') || 'https://developers.flouci.com/api'
const APP_TOKEN = Deno.env.get('FLOUCI_APP_TOKEN')!
const APP_SECRET = Deno.env.get('FLOUCI_APP_SECRET')! // SECRET - Server-side only
const PLATFORM_FEE_PERCENTAGE = 0.10

function roundTnd(value: number): number {
    return Number(value.toFixed(3))
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client with user's auth context
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! }
                }
            }
        )

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('Auth error:', authError)
            return new Response(
                JSON.stringify({ error: 'Unauthorized', details: 'You must be logged in to initiate a payment' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const {
            amount,
            success_link,
            fail_link,
            developer_tracking_id,
            session_timeout_secs,
            contract_id,
            transaction_amount,
        } = await req.json()

        // Validate required fields
        if (!amount || !success_link || !fail_link) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: amount, success_link, fail_link' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('[Flouci Edge] Initiating payment for user:', user.id, 'amount:', amount)

        // Initiate payment with Flouci (SECRET credentials server-side)
        const response = await fetch(`${FLOUCI_API_URL}/generate_payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apppublic': APP_TOKEN,
            },
            body: JSON.stringify({
                app_token: APP_TOKEN,
                app_secret: APP_SECRET, // NEVER expose this to client
                amount: Math.round(amount), // Flouci expects integer (millimes)
                accept_card: 'true',
                session_timeout_secs: session_timeout_secs || 1200, // 20 minutes default
                success_link,
                fail_link,
                developer_tracking_id: developer_tracking_id || `khedma_${user.id}_${Date.now()}`,
            }),
        })

        const data = await response.json()
        console.log('[Flouci Edge] API response:', JSON.stringify(data))

        if (data.result?.success) {
            if (contract_id) {
                const supabaseAdmin = createClient(
                    Deno.env.get('SUPABASE_URL')!,
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
                )

                const { data: contract, error: contractError } = await supabaseAdmin
                    .from('contracts')
                    .select('id, client_id, amount')
                    .eq('id', contract_id)
                    .single()

                if (contractError || !contract) {
                    return new Response(
                        JSON.stringify({ error: 'Contract not found' }),
                        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }

                if (contract.client_id !== user.id) {
                    return new Response(
                        JSON.stringify({ error: 'Only the contract client can initiate escrow funding' }),
                        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }

                const contractAmount = Number(contract.amount)
                if (!Number.isFinite(contractAmount) || contractAmount <= 0) {
                    return new Response(
                        JSON.stringify({ error: 'Contract amount is invalid for escrow funding' }),
                        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }

                const expectedTransactionAmount = roundTnd(contractAmount * (1 + PLATFORM_FEE_PERCENTAGE))
                const expectedAmountInMillimes = Math.round(expectedTransactionAmount * 1000)

                if (Math.round(amount) !== expectedAmountInMillimes) {
                    return new Response(
                        JSON.stringify({ error: 'Escrow funding amount does not match the contract total' }),
                        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }

                if (
                    transaction_amount !== undefined
                    && transaction_amount !== null
                    && roundTnd(Number(transaction_amount)) !== expectedTransactionAmount
                ) {
                    return new Response(
                        JSON.stringify({ error: 'Client transaction amount does not match the contract total' }),
                        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }

                const { error: transactionError } = await supabaseAdmin
                    .from('transactions')
                    .insert({
                        user_id: user.id,
                        contract_id: contract.id,
                        type: 'escrow_fund',
                        amount: expectedTransactionAmount,
                        status: 'pending',
                        payment_gateway_id: data.result.payment_id,
                        description: `Escrow funding initiated for contract ${contract.id}`,
                    })

                if (transactionError) {
                    console.error('[Flouci Edge] Failed to create pending transaction:', transactionError)
                    return new Response(
                        JSON.stringify({ error: 'Failed to create pending payment transaction' }),
                        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    )
                }
            }

            // Log successful payment initiation
            await logPaymentEvent(supabase, {
                user_id: user.id,
                event_type: 'payment_initiated',
                amount: amount,
                flouci_session_id: data.result.payment_id,
                status: 'pending',
                metadata: { developer_tracking_id, session_timeout_secs },
            });

            return new Response(
                JSON.stringify({
                    payment_id: data.result.payment_id,
                    link: data.result.link,
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        } else {
            const errorMsg = data.result?.message || 'Payment initiation failed'
            console.error('[Flouci Edge] Payment failed:', errorMsg)

            // Log failed payment initiation
            await logPaymentEvent(supabase, {
                user_id: user.id,
                event_type: 'payment_initiated',
                amount: amount,
                status: 'failed',
                metadata: { error: errorMsg, developer_tracking_id },
            });

            return new Response(
                JSON.stringify({ error: errorMsg }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
    } catch (error) {
        console.error('[Flouci Edge] Payment initiation error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
