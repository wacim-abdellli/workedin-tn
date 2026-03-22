/**
 * Supabase Edge Function: Flouci Payment Initiation
 * 
 * This function securely handles payment initiation with Flouci.
 * The APP_SECRET is stored server-side and never exposed to clients.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://khedma.tn'

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FLOUCI_API_URL = Deno.env.get('FLOUCI_API_URL') || 'https://developers.flouci.com/api'
const APP_TOKEN = Deno.env.get('FLOUCI_APP_TOKEN')!
const APP_SECRET = Deno.env.get('FLOUCI_APP_SECRET')! // SECRET - Server-side only

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

        const { amount, success_link, fail_link, developer_tracking_id, session_timeout_secs } = await req.json()

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
