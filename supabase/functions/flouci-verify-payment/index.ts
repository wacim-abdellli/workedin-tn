/**
 * Supabase Edge Function: Flouci Payment Verification
 * 
 * This function securely verifies payment status with Flouci.
 * Can optionally complete the payment atomically in the database.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FLOUCI_API_URL = Deno.env.get('FLOUCI_API_URL') || 'https://developers.flouci.com/api'
const APP_TOKEN = Deno.env.get('FLOUCI_APP_TOKEN')!
const APP_SECRET = Deno.env.get('FLOUCI_APP_SECRET')!

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { payment_id, complete_payment, transaction_id, contract_id, freelancer_id, amount } = await req.json()

        if (!payment_id) {
            return new Response(
                JSON.stringify({ error: 'payment_id is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('[Flouci Edge] Verifying payment:', payment_id)

        // Verify with Flouci
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

        // If payment is successful and complete_payment flag is set, complete atomically
        if (complete_payment && verificationResult.status === 'SUCCESS' && transaction_id && contract_id && freelancer_id) {
            console.log('[Flouci Edge] Completing payment atomically...')

            // Use service role for database operations
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL')!,
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
            )

            // Call atomic function
            const { data: completionResult, error: completionError } = await supabaseAdmin.rpc('complete_escrow_payment', {
                p_transaction_id: transaction_id,
                p_contract_id: contract_id,
                p_freelancer_id: freelancer_id,
                p_amount: amount || verificationResult.amount / 1000, // Convert millimes to dinars if needed
            })

            if (completionError) {
                console.error('[Flouci Edge] Payment completion error:', completionError)
                return new Response(
                    JSON.stringify({
                        verification: verificationResult,
                        completion: { success: false, error: completionError.message }
                    }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

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
    } catch (error) {
        console.error('[Flouci Edge] Verification error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
