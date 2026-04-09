/**
 * Supabase Edge Function: Dhmad Create Escrow
 *
 * Called by: src/services/dhmad.ts  createEscrow()
 * Calls:     POST ${DHMAD_BASE_URL}/escrows
 * Side-effect: updates contracts.dhmad_escrow_id + contracts.dhmad_payment_url
 *
 * Required secrets (set via: npx supabase secrets set <KEY>=<VALUE> --project-ref <ref>):
 *   DHMAD_API_KEY       = sk_live_...   (or sk_test_... for sandbox)
 *   DHMAD_BASE_URL      = https://dhmad.tn/api/v1
 *   SUPABASE_URL        (auto-injected by Supabase)
 *   SUPABASE_SERVICE_ROLE_KEY  (auto-injected by Supabase)
 *
 * TODO: Replace mock block with real Dhmad API call when credentials available.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS ─────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://khedmetna.tn';

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
        const body = await req.json() as {
            amount: number;
            buyer_id: string;
            seller_id: string;
            contract_id: string;
            description: string;
        };

        const { amount, buyer_id, seller_id, contract_id, description } = body;

        if (!amount || !buyer_id || !seller_id || !contract_id || !description) {
            return jsonResponse({ error: 'حقول مطلوبة مفقودة: amount, buyer_id, seller_id, contract_id, description' }, 400);
        }

        // Enforce: only the buyer (client) can create an escrow for their own contract
        if (buyer_id !== user.id) {
            return jsonResponse({ error: 'يُسمح فقط للعميل بإنشاء الضمان.' }, 403);
        }

        console.log('[dhmad-create-escrow] user:', user.id, 'contract:', contract_id, 'amount:', amount);

        // ── TODO: Replace mock with real Dhmad API call when credentials available ──
        let dhmadData: {
            escrow_id: string;
            status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
            amount: number;
            payment_url?: string;
            created_at: string;
        };

        if (IS_DEV || !DHMAD_API_KEY) {
            // DEV MOCK — realistic shape, no network call
            const escrow_id = `dhmad_mock_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
            dhmadData = {
                escrow_id,
                status: 'pending',
                amount,
                payment_url: `https://sandbox.dhmad.tn/pay/${escrow_id}`,
                created_at: new Date().toISOString(),
            };
            console.log('[dhmad-create-escrow][DEV] returning mock escrow:', dhmadData.escrow_id);
        } else {
            // PROD — real Dhmad API call
            // TODO: Verify exact Dhmad request schema from docs.dhmad.tn before going live
            const dhmadRes = await fetch(`${DHMAD_BASE_URL}/escrows`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DHMAD_API_KEY}`,
                },
                body: JSON.stringify({
                    amount,
                    buyer_id,
                    seller_id,
                    reference: contract_id,
                    description,
                }),
            });

            if (!dhmadRes.ok) {
                const errText = await dhmadRes.text();
                console.error('[dhmad-create-escrow] Dhmad API error:', dhmadRes.status, errText);
                return jsonResponse({ error: 'فشل إنشاء الضمان عبر بوابة دحماد.' }, 502);
            }

            dhmadData = await dhmadRes.json();
        }

        // ── Persist escrow_id + payment_url back to contracts table ──────────
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        const { error: updateError } = await supabaseAdmin
            .from('contracts')
            .update({
                dhmad_escrow_id: dhmadData.escrow_id,
                dhmad_payment_url: dhmadData.payment_url ?? null,
            })
            .eq('id', contract_id);

        if (updateError) {
            // Non-fatal: escrow was created, but we failed to store the ID locally.
            // Log and continue — caller can retrieve status via getEscrowStatus.
            console.error('[dhmad-create-escrow] Failed to update contracts row:', updateError.message);
        }

        return jsonResponse(dhmadData);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        console.error('[dhmad-create-escrow] Unhandled error:', message);
        return jsonResponse({ error: message }, 500);
    }
});
