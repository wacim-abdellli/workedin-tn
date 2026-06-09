/**
 * Supabase Edge Function: Dhmad Release Escrow
 *
 * Called by: src/services/dhmad.ts  releaseEscrow()
 * Calls:     POST ${DHMAD_BASE_URL}/escrows/:escrow_id/release
 * Side-effect: updates contracts SET payment_status = 'released', status = 'completed'
 *
 * Required secrets:
 *   DHMAD_API_KEY, DHMAD_BASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * DEV/Staging: Set SANDBOX_MODE=true in Supabase Edge Function secrets to bypass
 * the real Dhmad API and use a mock response. Also set ALLOWED_ORIGINS to include
 * your local dev origin (e.g. http://localhost:5173).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS ─────────────────────────────────────────────────────────────────────

const SANDBOX_MODE = Deno.env.get('SANDBOX_MODE') === 'true';

// Comma-separated allowed origins, e.g.: "https://workedin.tn,https://staging.workedin.tn"
const ALLOWED_ORIGINS_ENV = Deno.env.get('ALLOWED_ORIGINS') || Deno.env.get('ALLOWED_ORIGIN') || 'https://workedin.tn';

const ALLOWED_ORIGINS = new Set<string>([
  ...ALLOWED_ORIGINS_ENV.split(',').map((o) => o.trim()).filter(Boolean),
  // In sandbox/dev mode, always allow local dev servers
  ...(SANDBOX_MODE
    ? [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
      ]
    : []),
]);

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : [...ALLOWED_ORIGINS][0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

// ─── Config ───────────────────────────────────────────────────────────────────

const DHMAD_API_KEY = Deno.env.get('DHMAD_API_KEY') ?? '';
const DHMAD_BASE_URL = Deno.env.get('DHMAD_BASE_URL') ?? 'https://sandbox.dhmad.tn/api/v1';
// IS_DEV is true if explicitly set OR if SANDBOX_MODE is enabled
const IS_DEV = Deno.env.get('DENO_ENV') === 'development' || SANDBOX_MODE;

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Request received: ${req.method} ${req.url}`);
  console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] SANDBOX_MODE=${SANDBOX_MODE}, IS_DEV=${IS_DEV}`);

  if (req.method === 'OPTIONS') {
    console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] CORS preflight handled`);
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Authenticating user...`);
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Auth failed:`, authError?.message);
      return jsonResponse(req, { error: 'Unauthorized. Please log in.' }, 401);
    }
    console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] User authenticated: ${user.id}`);

    // ── Parse body ────────────────────────────────────────────────────────
    const body = await req.json() as { escrow_id: string; contract_id: string };
    const { escrow_id, contract_id } = body;
    console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Request body:`, { escrow_id, contract_id });

    if (!escrow_id || !contract_id) {
      console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Missing required fields`);
      return jsonResponse(req, { error: 'Missing required fields: escrow_id, contract_id' }, 400);
    }

    // ── Ownership check: only the client of this contract can release ─────
    console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Verifying contract ownership...`);
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('id, client_id, dhmad_escrow_id, status')
      .eq('id', contract_id)
      .single();

    if (contractError || !contract) {
      console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Contract not found:`, contractError?.message);
      return jsonResponse(req, { error: 'Contract not found.' }, 404);
    }

    if (contract.client_id !== user.id) {
      console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Authorization failed: client_id ${contract.client_id} !== user.id ${user.id}`);
      return jsonResponse(req, { error: 'Only the client can release the escrow.' }, 403);
    }

    if (contract.status !== 'delivery_submitted') {
      console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Invalid status: ${contract.status} must be delivery_submitted`);
      return jsonResponse(req, { error: `Work must be submitted before releasing payment. Current status: ${contract.status}` }, 400);
    }

    // Allow mock escrow IDs in sandbox mode without strict ID matching
    const isMockEscrow = escrow_id.startsWith('dhmad_mock_');
    if (!IS_DEV && !isMockEscrow && contract.dhmad_escrow_id && contract.dhmad_escrow_id !== escrow_id) {
      console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Escrow ID mismatch: ${contract.dhmad_escrow_id} !== ${escrow_id}`);
      return jsonResponse(req, { error: 'Escrow ID does not match the contract.' }, 400);
    }

    console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Releasing escrow - user: ${user.id}, escrow: ${escrow_id}, contract: ${contract_id}, isMock: ${isMockEscrow}`);

    // ── Call Dhmad API or return mock ─────────────────────────────────────
    let dhmadData: { success: boolean; escrow_id: string; status: 'released'; released_at: string };

    if (IS_DEV || isMockEscrow) {
      // SANDBOX / DEV MOCK — skip real Dhmad API call
      console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] SANDBOX MODE: Returning mock release response`);
      dhmadData = {
        success: true,
        escrow_id,
        status: 'released',
        released_at: new Date().toISOString(),
      };
    } else {
      // In production: DHMAD_API_KEY is required
      if (!DHMAD_API_KEY) {
        console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] FATAL: DHMAD_API_KEY not configured.`);
        return jsonResponse(req, {
          error: 'Payment service is not available. Please contact support.',
        }, 503);
      }

      // PROD — real Dhmad API call
      console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Calling Dhmad API: POST ${DHMAD_BASE_URL}/escrows/${escrow_id}/deliver`);

      const dhmadRes = await fetch(`${DHMAD_BASE_URL}/escrows/${escrow_id}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DHMAD_API_KEY}`,
        },
      });

      console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Dhmad API response status: ${dhmadRes.status}`);

      if (!dhmadRes.ok) {
        const errText = await dhmadRes.text();
        console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Dhmad API error: ${dhmadRes.status} - ${errText}`);
        return jsonResponse(req, { error: 'Failed to release escrow via Dhmad payment gateway.' }, 502);
      }

      const raw = await dhmadRes.json();
      console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Dhmad API response:`, raw);

      dhmadData = {
        success: true,
        escrow_id,
        status: 'released',
        released_at: raw.updatedAt ?? raw.released_at ?? new Date().toISOString(),
      };
    }

    // ── Update contracts: payment_status = released, status = completed ───
    console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Updating contract ${contract_id} status to completed...`);
    const { error: updateError } = await supabaseAdmin
      .from('contracts')
      .update({
        payment_status: 'released',
        status: 'completed',
      })
      .eq('id', contract_id);

    if (updateError) {
      // Dhmad side succeeded; log DB failure but don't fail the caller
      console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Failed to update contract status:`, updateError.message);
    } else {
      console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Contract status updated successfully`);
    }

    console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Request completed successfully`);
    return jsonResponse(req, dhmadData);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Unhandled error:`, message);
    if (stack) console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Stack trace:`, stack);
    return jsonResponse(req, { error: message }, 500);
  }
});
