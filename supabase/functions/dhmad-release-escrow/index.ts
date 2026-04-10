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
    
    console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Request received: ${req.method} ${req.url}`);

    if (req.method === 'OPTIONS') {
        console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] CORS preflight handled`);
        return new Response('ok', { headers: corsHeaders });
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
            return jsonResponse({ error: 'غير مصرح. يجب تسجيل الدخول أولاً.' }, 401);
        }
        console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] User authenticated: ${user.id}`);

        // ── Parse body ────────────────────────────────────────────────────────
        const body = await req.json() as { escrow_id: string; contract_id: string };
        const { escrow_id, contract_id } = body;
        console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Request body:`, { escrow_id, contract_id });

        if (!escrow_id || !contract_id) {
            console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Missing required fields`);
            return jsonResponse({ error: 'حقول مطلوبة مفقودة: escrow_id, contract_id' }, 400);
        }

        // ── Ownership check: only the client of this contract can release ─────
        console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Verifying contract ownership...`);
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        const { data: contract, error: contractError } = await supabaseAdmin
            .from('contracts')
            .select('id, client_id, dhmad_escrow_id')
            .eq('id', contract_id)
            .single();

        if (contractError || !contract) {
            console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Contract not found:`, contractError?.message);
            return jsonResponse({ error: 'العقد غير موجود.' }, 404);
        }

        if (contract.client_id !== user.id) {
            console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Authorization failed: client_id ${contract.client_id} !== user.id ${user.id}`);
            return jsonResponse({ error: 'يُسمح فقط للعميل بتحرير الضمان.' }, 403);
        }

        if (contract.dhmad_escrow_id && contract.dhmad_escrow_id !== escrow_id) {
            console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Escrow ID mismatch: ${contract.dhmad_escrow_id} !== ${escrow_id}`);
            return jsonResponse({ error: 'معرّف الضمان لا يطابق العقد.' }, 400);
        }

        console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Releasing escrow - user: ${user.id}, escrow: ${escrow_id}, contract: ${contract_id}`);

        // ── TODO: Replace mock with real Dhmad API call when credentials available ──
        let dhmadData: { success: boolean; escrow_id: string; status: 'released'; released_at: string };

        if (IS_DEV || !DHMAD_API_KEY) {
            // DEV MOCK
            console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] DEV MODE: Creating mock release`);
            dhmadData = {
                success: true,
                escrow_id,
                status: 'released',
                released_at: new Date().toISOString(),
            };
            console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Mock release created:`, dhmadData);
        } else {
            // PROD — real Dhmad API call (deliver = release funds to seller)
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
                return jsonResponse({ error: 'فشل تحرير الضمان عبر بوابة دحماد.' }, 502);
            }

            const raw = await dhmadRes.json();
            console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Dhmad API response:`, raw);
            
            dhmadData = {
                success: true,
                escrow_id,
                status: 'released',
                released_at: raw.updatedAt ?? raw.released_at ?? new Date().toISOString(),
            };
            console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Escrow released successfully:`, dhmadData);
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
            // The Dhmad side succeeded; log the DB failure but don't fail the caller
            console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Failed to update contract status:`, updateError.message);
        } else {
            console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Contract status updated successfully`);
        }

        console.log(`[${timestamp}][${requestId}][dhmad-release-escrow] Request completed successfully`);
        return jsonResponse(dhmadData);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        const stack = err instanceof Error ? err.stack : undefined;
        console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Unhandled error:`, message);
        if (stack) console.error(`[${timestamp}][${requestId}][dhmad-release-escrow] Stack trace:`, stack);
        return jsonResponse({ error: message }, 500);
    }
});
