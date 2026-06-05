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
    
    console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] Request received: ${req.method} ${req.url}`);

    if (req.method === 'OPTIONS') {
        console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] CORS preflight handled`);
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // ── Auth ──────────────────────────────────────────────────────────────
        console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] Authenticating user...`);
        const supabaseAnon = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
        );

        const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
        if (authError || !user) {
            console.error(`[${timestamp}][${requestId}][dhmad-create-escrow] Auth failed:`, authError?.message);
            return jsonResponse({ error: 'غير مصرح. يجب تسجيل الدخول أولاً.' }, 401);
        }
        console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] User authenticated: ${user.id}`);

        // ── Parse body ────────────────────────────────────────────────────────
        const body = await req.json() as {
            amount: number;
            buyer_id: string;
            seller_id: string;
            contract_id: string;
            description: string;
        };

        const { amount, buyer_id, seller_id, contract_id, description } = body;
        console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] Request body:`, {
            amount,
            buyer_id,
            seller_id,
            contract_id,
            description: description.substring(0, 50) + '...'
        });

        if (!amount || !buyer_id || !seller_id || !contract_id || !description) {
            console.error(`[${timestamp}][${requestId}][dhmad-create-escrow] Missing required fields`);
            return jsonResponse({ error: 'حقول مطلوبة مفقودة: amount, buyer_id, seller_id, contract_id, description' }, 400);
        }

        // Enforce: only the buyer (client) can create an escrow for their own contract
        if (buyer_id !== user.id) {
            console.error(`[${timestamp}][${requestId}][dhmad-create-escrow] Authorization failed: buyer_id ${buyer_id} !== user.id ${user.id}`);
            return jsonResponse({ error: 'يُسمح فقط للعميل بإنشاء الضمان.' }, 403);
        }

        console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] Creating escrow - user: ${user.id}, contract: ${contract_id}, amount: ${amount} TND`);

        // ── TODO: Replace mock with real Dhmad API call when credentials available ──
        let dhmadData: {
            escrow_id: string;
            status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
            amount: number;
            payment_url?: string;
            created_at: string;
        };

        // In production: DHMAD_API_KEY is required. Hard fail if not configured.
        if (!IS_DEV && !DHMAD_API_KEY) {
            console.error(`[${timestamp}][${requestId}][dhmad-create-escrow] FATAL: DHMAD_API_KEY not configured.`);
            return jsonResponse({
                error: 'خدمة الدفع غير متاحة حالياً. يرجى التواصل مع الدعم.',
            }, 503);
        }

        if (IS_DEV) {
            // DEV MOCK — realistic shape, no network call
            console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] DEV MODE: Creating mock escrow`);
            const escrow_id = `dhmad_mock_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
            dhmadData = {
                escrow_id,
                status: 'pending',
                amount,
                payment_url: `https://sandbox.dhmad.tn/pay/${escrow_id}`,
                created_at: new Date().toISOString(),
            };
            console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] Mock escrow created:`, dhmadData);
        } else {
            // PROD — real Dhmad API call
            const apiPayload = {
                title: description,
                amount,
                currency: 'TND',
                buyerEmail: body.buyer_email,
                sellerEmail: body.seller_email,
                description,
                metadata: { contract_id, buyer_id, seller_id },
            };
            console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] Calling Dhmad API: POST ${DHMAD_BASE_URL}/escrows`);
            console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] API payload:`, apiPayload);

            const dhmadRes = await fetch(`${DHMAD_BASE_URL}/escrows`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DHMAD_API_KEY}`,
                },
                body: JSON.stringify(apiPayload),
            });

            console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] Dhmad API response status: ${dhmadRes.status}`);

            if (!dhmadRes.ok) {
                const errText = await dhmadRes.text();
                console.error(`[${timestamp}][${requestId}][dhmad-create-escrow] Dhmad API error: ${dhmadRes.status} - ${errText}`);
                return jsonResponse({ error: 'فشل إنشاء الضمان عبر بوابة دحماد.' }, 502);
            }

            const raw = await dhmadRes.json();
            console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] Dhmad API response:`, raw);
            
            dhmadData = {
                escrow_id: raw.id ?? raw.escrow_id,
                status: raw.status ?? 'pending',
                amount: raw.amount ?? amount,
                payment_url: raw.checkoutUrl ?? raw.payment_url,
                created_at: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
            };
            console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] Escrow created successfully:`, dhmadData);
        }

        // ── Persist escrow_id + payment_url back to contracts table ──────────
        console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] Updating contract ${contract_id} with escrow data...`);
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
            console.error(`[${timestamp}][${requestId}][dhmad-create-escrow] Failed to update contracts row:`, updateError.message);
        } else {
            console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] Contract updated successfully`);
        }

        console.log(`[${timestamp}][${requestId}][dhmad-create-escrow] Request completed successfully`);
        return jsonResponse(dhmadData);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        const stack = err instanceof Error ? err.stack : undefined;
        console.error(`[${timestamp}][${requestId}][dhmad-create-escrow] Unhandled error:`, message);
        if (stack) console.error(`[${timestamp}][${requestId}][dhmad-create-escrow] Stack trace:`, stack);
        return jsonResponse({ error: message }, 500);
    }
});
