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
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // ── Auth ──────────────────────────────────────────────────────────────
        const supabaseAnon = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
        );

        const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
        if (authError || !user) {
            return jsonResponse({ error: 'غير مصرح. يجب تسجيل الدخول أولاً.' }, 401);
        }

        // ── Parse body ────────────────────────────────────────────────────────
        const body = await req.json() as { escrow_id: string; contract_id: string };
        const { escrow_id, contract_id } = body;

        if (!escrow_id || !contract_id) {
            return jsonResponse({ error: 'حقول مطلوبة مفقودة: escrow_id, contract_id' }, 400);
        }

        // ── Ownership check: only the client of this contract can release ─────
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
            return jsonResponse({ error: 'العقد غير موجود.' }, 404);
        }

        if (contract.client_id !== user.id) {
            return jsonResponse({ error: 'يُسمح فقط للعميل بتحرير الضمان.' }, 403);
        }

        if (contract.dhmad_escrow_id && contract.dhmad_escrow_id !== escrow_id) {
            return jsonResponse({ error: 'معرّف الضمان لا يطابق العقد.' }, 400);
        }

        console.log('[dhmad-release-escrow] user:', user.id, 'escrow:', escrow_id, 'contract:', contract_id);

        // ── TODO: Replace mock with real Dhmad API call when credentials available ──
        let dhmadData: { success: boolean; escrow_id: string; status: 'released'; released_at: string };

        if (IS_DEV || !DHMAD_API_KEY) {
            // DEV MOCK
            dhmadData = {
                success: true,
                escrow_id,
                status: 'released',
                released_at: new Date().toISOString(),
            };
            console.log('[dhmad-release-escrow][DEV] returning mock release');
        } else {
            // PROD — real Dhmad API call (deliver = release funds to seller)
            const dhmadRes = await fetch(`${DHMAD_BASE_URL}/escrows/${escrow_id}/deliver`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DHMAD_API_KEY}`,
                },
            });

            if (!dhmadRes.ok) {
                const errText = await dhmadRes.text();
                console.error('[dhmad-release-escrow] Dhmad API error:', dhmadRes.status, errText);
                return jsonResponse({ error: 'فشل تحرير الضمان عبر بوابة دحماد.' }, 502);
            }

            const raw = await dhmadRes.json();
            dhmadData = {
                success: true,
                escrow_id,
                status: 'released',
                released_at: raw.updatedAt ?? raw.released_at ?? new Date().toISOString(),
            };
        }

        // ── Update contracts: payment_status = released, status = completed ───
        const { error: updateError } = await supabaseAdmin
            .from('contracts')
            .update({
                payment_status: 'released',
                status: 'completed',
            })
            .eq('id', contract_id);

        if (updateError) {
            // The Dhmad side succeeded; log the DB failure but don't fail the caller
            console.error('[dhmad-release-escrow] Failed to update contract status:', updateError.message);
        }

        return jsonResponse(dhmadData);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        console.error('[dhmad-release-escrow] Unhandled error:', message);
        return jsonResponse({ error: message }, 500);
    }
});
