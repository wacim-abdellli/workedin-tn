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
        const body = await req.json() as { escrow_id: string; contract_id: string; reason: string };
        const { escrow_id, contract_id, reason } = body;

        if (!escrow_id || !contract_id || !reason) {
            return jsonResponse({ error: 'حقول مطلوبة مفقودة: escrow_id, contract_id, reason' }, 400);
        }

        // ── Ownership check: operation restricted to admin or contract parties ─
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
            return jsonResponse({ error: 'العقد غير موجود.' }, 404);
        }

        // Only the client or freelancer of this contract may request a refund
        if (contract.client_id !== user.id && contract.freelancer_id !== user.id) {
            return jsonResponse({ error: 'غير مصرح بطلب استرجاع الضمان.' }, 403);
        }

        if (contract.dhmad_escrow_id && contract.dhmad_escrow_id !== escrow_id) {
            return jsonResponse({ error: 'معرّف الضمان لا يطابق العقد.' }, 400);
        }

        console.log('[dhmad-refund-escrow] user:', user.id, 'escrow:', escrow_id, 'contract:', contract_id, 'reason:', reason);

        // ── TODO: Replace mock with real Dhmad API call when credentials available ──
        let dhmadData: { success: boolean; escrow_id: string; status: 'refunded'; refunded_at: string };

        if (IS_DEV || !DHMAD_API_KEY) {
            // DEV MOCK
            dhmadData = {
                success: true,
                escrow_id,
                status: 'refunded',
                refunded_at: new Date().toISOString(),
            };
            console.log('[dhmad-refund-escrow][DEV] returning mock refund');
        } else {
            // PROD — real Dhmad API call (cancel escrow)
            const dhmadRes = await fetch(`${DHMAD_BASE_URL}/escrows/${escrow_id}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DHMAD_API_KEY}`,
                },
                body: JSON.stringify({ reason }),
            });

            if (!dhmadRes.ok) {
                const errText = await dhmadRes.text();
                console.error('[dhmad-refund-escrow] Dhmad API error:', dhmadRes.status, errText);
                return jsonResponse({ error: 'فشل استرجاع الضمان عبر بوابة دحماد.' }, 502);
            }

            const raw = await dhmadRes.json();
            dhmadData = {
                success: true,
                escrow_id,
                status: 'refunded',
                refunded_at: raw.updatedAt ?? raw.refunded_at ?? new Date().toISOString(),
            };
        }

        // ── Update contracts: payment_status = refunded, status = cancelled ───
        const { error: updateError } = await supabaseAdmin
            .from('contracts')
            .update({
                payment_status: 'refunded',
                status: 'cancelled',
            })
            .eq('id', contract_id);

        if (updateError) {
            console.error('[dhmad-refund-escrow] Failed to update contract status:', updateError.message);
        }

        return jsonResponse(dhmadData);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        console.error('[dhmad-refund-escrow] Unhandled error:', message);
        return jsonResponse({ error: message }, 500);
    }
});
