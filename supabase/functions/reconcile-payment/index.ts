// supabase/functions/reconcile-payment/index.ts
// Admin-only Edge Function: retries a stuck escrow payment

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ADMIN_EMAILS = ['wacimabdelli01@gmail.com']

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // 1. Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create user-scoped client to check identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Check admin
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Parse body
    const { transaction_id } = await req.json()
    if (!transaction_id) {
      return new Response(JSON.stringify({ error: 'transaction_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Use service role client to call complete_escrow_payment
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get the transaction to find the contract
    const { data: transaction, error: txError } = await adminClient
      .from('transactions')
      .select('reference_id, amount, user_id')
      .eq('id', transaction_id)
      .eq('status', 'pending')
      .single()

    if (txError || !transaction) {
      return new Response(JSON.stringify({
        error: 'Transaction not found or already completed',
        details: txError?.message,
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Call the complete_escrow_payment RPC
    const { error: rpcError } = await adminClient.rpc('complete_escrow_payment', {
      p_contract_id: transaction.reference_id,
      p_payment_id: `admin-reconcile-${transaction_id}-${Date.now()}`,
      p_amount: transaction.amount,
    })

    if (rpcError) {
      return new Response(JSON.stringify({
        error: 'Reconciliation failed',
        details: rpcError.message,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Transaction ${transaction_id} reconciled successfully`,
      amount: transaction.amount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: (err as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
