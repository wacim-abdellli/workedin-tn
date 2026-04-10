/**
 * Supabase Edge Function: Dhmad Refund Escrow
 *
 * Called by: src/services/dhmad.ts  refundEscrow()
 * Calls:     POST ${DHMAD_BASE_URL}/escrows/:escrow_id/refund
 * Side-effect: updates contracts SET payment_status = 'refunded', status = 'cancelled'
 *
 * Required secrets:
 *   DHMAD_API_KEY, DHMAD_BASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * TODO: Replace mock block with real Dhmad API call when credentials available.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS ─────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://workedin.tn';

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// ─── Config ───────────────────────────────────────────────────────────────────

const DHMAD_API_KEY = Deno.env.get('DHMAD_API_KEY') ?? '';
const DHMAD_BASE_URL = Deno.env.get('DHMAD_BASE_URL') ?? 'https://sandbox.dhmad.tn/api/v1';
const IS_DEV = Deno.env.get('DENO_ENV') === 'development';

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
    const requestId = crypto.randomUUID().slice(0, 8);
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Request received: ${req.method} ${req.url}`);

    if (req.method === 'OPTIONS') {
        console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] CORS preflight handled`);
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // ── Auth ──────────────────────────────────────────────────────────────
        console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Authenticating user...`);
        const supabaseAnon = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
        );

        const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
        if (authError || !user) {
            console.error(`[${timestamp}][${requestId}][dhmad-refund-escrow] Auth failed:`, authError?.message);
            return jsonResponse({ error: 'غير مصرح. يجب تسجيل الدخول أولاً.' }, 401);
        }
        console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] User authenticated: ${user.id}`);

        // ── Parse body ────────────────────────────────────────────────────────
        const body = await req.json() as { escrow_id: string; contract_id: string; reason: string };
        const { escrow_id, contract_id, reason } = body;
        console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Request body:`, { escrow_id, contract_id, reason: reason.substring(0, 50) + '...' });

        if (!escrow_id || !contract_id || !reason) {
            console.error(`[${timestamp}][${requestId}][dhmad-refund-escrow] Missing required fields`);
            return jsonResponse({ error: 'حقول مطلوبة مفقودة: escrow_id, contract_id, reason' }, 400);
        }

        // ── Ownership check: operation restricted to admin or contract parties ─
        console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Verifying contract ownership...`);
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        const { data: contract, error: contractError } = await supabaseAdmin
            .from('contracts')
            .select('id, client_id, freelancer_id, dhmad_escrow_id')
            .eq('id', contract_id)
            .single();

        if (contractError || !contract) {
            console.error(`[${timestamp}][${requestId}][dhmad-refund-escrow] Contract not found:`, contractError?.message);
            return jsonResponse({ error: 'العقد غير موجود.' }, 404);
        }

        // Only the client or freelancer of this contract may request a refund
        if (contract.client_id !== user.id && contract.freelancer_id !== user.id) {
            console.error(`[${timestamp}][${requestId}][dhmad-refund-escrow] Authorization failed: user ${user.id} is not client or freelancer`);
            return jsonResponse({ error: 'غير مصرح بطلب استرجاع الضمان.' }, 403);
        }

        if (contract.dhmad_escrow_id && contract.dhmad_escrow_id !== escrow_id) {
            console.error(`[${timestamp}][${requestId}][dhmad-refund-escrow] Escrow ID mismatch: ${contract.dhmad_escrow_id} !== ${escrow_id}`);
            return jsonResponse({ error: 'معرّف الضمان لا يطابق العقد.' }, 400);
        }

        console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Refunding escrow - user: ${user.id}, escrow: ${escrow_id}, contract: ${contract_id}`);

        // ── TODO: Replace mock with real Dhmad API call when credentials available ──
        let dhmadData: { success: boolean; escrow_id: string; status: 'refunded'; refunded_at: string };

        if (IS_DEV || !DHMAD_API_KEY) {
            // DEV MOCK
            console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] DEV MODE: Creating mock refund`);
            dhmadData = {
                success: true,
                escrow_id,
                status: 'refunded',
                refunded_at: new Date().toISOString(),
            };
            console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Mock refund created:`, dhmadData);
        } else {
            // PROD — real Dhmad API call (cancel escrow)
            console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Calling Dhmad API: POST ${DHMAD_BASE_URL}/escrows/${escrow_id}/cancel`);
            console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Refund reason:`, reason);
            
            const dhmadRes = await fetch(`${DHMAD_BASE_URL}/escrows/${escrow_id}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DHMAD_API_KEY}`,
                },
                body: JSON.stringify({ reason }),
            });

            console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Dhmad API response status: ${dhmadRes.status}`);

            if (!dhmadRes.ok) {
                const errText = await dhmadRes.text();
                console.error(`[${timestamp}][${requestId}][dhmad-refund-escrow] Dhmad API error: ${dhmadRes.status} - ${errText}`);
                return jsonResponse({ error: 'فشل استرجاع الضمان عبر بوابة دحماد.' }, 502);
            }

            const raw = await dhmadRes.json();
            console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Dhmad API response:`, raw);
            
            dhmadData = {
                success: true,
                escrow_id,
                status: 'refunded',
                refunded_at: raw.updatedAt ?? raw.refunded_at ?? new Date().toISOString(),
            };
            console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Escrow refunded successfully:`, dhmadData);
        }

        // ── Update contracts: payment_status = refunded, status = cancelled ───
        console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Updating contract ${contract_id} status to cancelled...`);
        const { error: updateError } = await supabaseAdmin
            .from('contracts')
            .update({
                payment_status: 'refunded',
                status: 'cancelled',
            })
            .eq('id', contract_id);

        if (updateError) {
            console.error(`[${timestamp}][${requestId}][dhmad-refund-escrow] Failed to update contract status:`, updateError.message);
        } else {
            console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Contract status updated successfully`);
        }

        console.log(`[${timestamp}][${requestId}][dhmad-refund-escrow] Request completed successfully`);
        return jsonResponse(dhmadData);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        const stack = err instanceof Error ? err.stack : undefined;
        console.error(`[${timestamp}][${requestId}][dhmad-refund-escrow] Unhandled error:`, message);
        if (stack) console.error(`[${timestamp}][${requestId}][dhmad-refund-escrow] Stack trace:`, stack);
        return jsonResponse({ error: message }, 500);
    }
});
