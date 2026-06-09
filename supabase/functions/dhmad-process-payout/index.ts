/**
 * Supabase Edge Function: Dhmad Process Payout
 *
 * Called by: src/services/payments.ts  processWithdrawalRequest()
 * Calls:     POST ${DHMAD_BASE_URL}/payouts
 * RPC:       approve_withdrawal_admin OR reject_withdrawal_admin
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Config & Environment ─────────────────────────────────────────────────────

const DHMAD_API_KEY = Deno.env.get('DHMAD_API_KEY') ?? '';
const DHMAD_BASE_URL = Deno.env.get('DHMAD_BASE_URL') ?? 'https://sandbox.dhmad.tn/api/v1';
const SANDBOX_MODE = Deno.env.get('SANDBOX_MODE') === 'true';
const IS_DEV = Deno.env.get('DENO_ENV') === 'development' || SANDBOX_MODE || !DHMAD_API_KEY;

// ─── CORS ─────────────────────────────────────────────────────────────────────

const configuredOrigins = new Set<string>([
  ...(
    Deno.env.get('ALLOWED_ORIGINS')
    || Deno.env.get('ALLOWED_ORIGIN')
    || 'https://workedin-tn.vercel.app'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  // If in dev or sandbox mode, always allow local dev servers
  ...(IS_DEV
    ? [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        'http://127.0.0.1:3000',
      ]
    : [])
]);

function getCorsHeaders(requestOrigin: string | null) {
  const allowedOrigins = [...configuredOrigins];
  const defaultOrigin = allowedOrigins[0] || '*';
  
  let allowOrigin = defaultOrigin;
  if (requestOrigin) {
    const isLocalhost = requestOrigin.startsWith('http://localhost:') || 
                        requestOrigin.startsWith('http://127.0.0.1:') || 
                        requestOrigin === 'http://localhost' || 
                        requestOrigin === 'http://127.0.0.1';
    
    if (configuredOrigins.has(requestOrigin) || isLocalhost) {
      allowOrigin = requestOrigin;
    }
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

function jsonResponse(corsHeaders: Record<string, string>, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}][${requestId}][dhmad-process-payout] Request received: POST ${req.url}`);

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error(`[${timestamp}][${requestId}][dhmad-process-payout] Auth failed:`, authError?.message);
      return jsonResponse(corsHeaders, 401, { error: 'Unauthorized' });
    }

    // Verify caller is admin
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile?.is_admin) {
      console.error(`[${timestamp}][${requestId}][dhmad-process-payout] User ${user.id} is not an admin`);
      return jsonResponse(corsHeaders, 403, { error: 'Admin privileges required' });
    }

    // ── Parse request ─────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({} as Record<string, unknown>)) as {
      withdrawal_id: string;
      action: 'approve' | 'reject';
      admin_notes?: string;
    };

    const { withdrawal_id, action, admin_notes } = body;
    if (!withdrawal_id || !action || !['approve', 'reject'].includes(action)) {
      return jsonResponse(corsHeaders, 400, { error: 'Missing or invalid parameters' });
    }

    console.log(`[${timestamp}][${requestId}][dhmad-process-payout] Processing withdrawal:`, { withdrawal_id, action });

    // Retrieve withdrawal record
    const { data: withdrawal, error: wError } = await adminClient
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawal_id)
      .maybeSingle();

    if (wError || !withdrawal) {
      console.error(`[${timestamp}][${requestId}][dhmad-process-payout] Fetch withdrawal error:`, wError?.message);
      return jsonResponse(corsHeaders, 404, { error: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
      return jsonResponse(corsHeaders, 400, { error: `Withdrawal request is already processed. Current status: ${withdrawal.status}` });
    }

    if (action === 'approve') {
      let payoutData: { success: boolean; payout_id: string; status: string };

      if (IS_DEV) {
        // Sandbox mode mock
        console.log(`[${timestamp}][${requestId}][dhmad-process-payout] SANDBOX MODE: Mocking payout`);
        payoutData = {
          success: true,
          payout_id: `dhmad_payout_mock_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
          status: 'completed',
        };
      } else {
        // Call real Dhmad Payout API
        const destDetails = withdrawal.method === 'bank_transfer' ? {
          bankName: withdrawal.bank_name,
          accountName: withdrawal.bank_account_name ?? '',
          iban: withdrawal.bank_iban ?? withdrawal.iban ?? ''
        } : {
          phoneNumber: withdrawal.phone_number ?? withdrawal.d17_phone ?? ''
        };

        const dhmadPayload = {
          amount: parseFloat(withdrawal.amount),
          currency: 'TND',
          method: withdrawal.method,
          destination: destDetails,
          metadata: {
            withdrawal_id: withdrawal.id,
            user_id: withdrawal.user_id,
          }
        };

        console.log(`[${timestamp}][${requestId}][dhmad-process-payout] Calling Dhmad API: POST ${DHMAD_BASE_URL}/payouts`);

        const dhmadRes = await fetch(`${DHMAD_BASE_URL}/payouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DHMAD_API_KEY}`,
          },
          body: JSON.stringify(dhmadPayload),
        });

        if (!dhmadRes.ok) {
          const errText = await dhmadRes.text();
          console.error(`[${timestamp}][${requestId}][dhmad-process-payout] Dhmad API Payout Error: ${dhmadRes.status} - ${errText}`);
          return jsonResponse(corsHeaders, 502, { error: 'Failed to process payout via Dhmad gateway.' });
        }

        const raw = await dhmadRes.json();
        payoutData = {
          success: true,
          payout_id: raw.id ?? raw.payout_id,
          status: raw.status ?? 'completed',
        };
      }

      // Execute SQL RPC to mark completed, deduct fee, log transaction
      console.log(`[${timestamp}][${requestId}][dhmad-process-payout] Calling approve_withdrawal_admin RPC...`);
      const { data: rpcData, error: rpcError } = await adminClient.rpc('approve_withdrawal_admin', {
        p_withdrawal_id: withdrawal_id,
        p_admin_notes: admin_notes ?? `Approved by admin. Payout Ref: ${payoutData.payout_id}`,
      });

      if (rpcError) {
        console.error(`[${timestamp}][${requestId}][dhmad-process-payout] RPC approve_withdrawal_admin error:`, rpcError.message);
        return jsonResponse(corsHeaders, 500, { error: `Database update failed: ${rpcError.message}` });
      }

      console.log(`[${timestamp}][${requestId}][dhmad-process-payout] Withdrawal approved and payout executed successfully`);
      return jsonResponse(corsHeaders, 200, { success: true, data: rpcData });

    } else {
      // Reject withdrawal - refund user balance and log transaction
      console.log(`[${timestamp}][${requestId}][dhmad-process-payout] Calling reject_withdrawal_admin RPC...`);
      const { data: rpcData, error: rpcError } = await adminClient.rpc('reject_withdrawal_admin', {
        p_withdrawal_id: withdrawal_id,
        p_admin_notes: admin_notes ?? 'Rejected by admin',
      });

      if (rpcError) {
        console.error(`[${timestamp}][${requestId}][dhmad-process-payout] RPC reject_withdrawal_admin error:`, rpcError.message);
        return jsonResponse(corsHeaders, 500, { error: `Database update failed: ${rpcError.message}` });
      }

      console.log(`[${timestamp}][${requestId}][dhmad-process-payout] Withdrawal rejected and balance refunded successfully`);
      return jsonResponse(corsHeaders, 200, { success: true, data: rpcData });
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error(`[${timestamp}][${requestId}][dhmad-process-payout] Unhandled error:`, message);
    return jsonResponse(corsHeaders, 500, { error: message });
  }
});
