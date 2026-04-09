/**
 * Supabase Edge Function: Dhmad Checkout Session
 *
 * Creates a DHMAD checkout session so the user can be redirected to dhmad.tn
 * to perform a critical action (sign contract, pay, complete, dispute).
 *
 * POST body: { escrow_id, action, user_email, redirect_url }
 * action: "sign_contract" | "accept_pay" | "complete" | "dispute"
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

const DHMAD_API_KEY = Deno.env.get('DHMAD_API_KEY') ?? '';
const DHMAD_BASE_URL = Deno.env.get('DHMAD_BASE_URL') ?? 'https://dhmad.tn/api/v1';
const DHMAD_CHECKOUT_BASE = Deno.env.get('DHMAD_CHECKOUT_BASE') ?? 'https://dhmad.tn/checkout';
const IS_DEV = Deno.env.get('DENO_ENV') === 'development';

serve(async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabaseAnon = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
        );
        const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
        if (authError || !user) return jsonResponse({ error: 'غير مصرح.' }, 401);

        const body = await req.json() as {
            escrow_id: string;
            action: 'sign_contract' | 'accept_pay' | 'complete' | 'dispute';
            user_email: string;
            redirect_url: string;
        };

        const { escrow_id, action, user_email, redirect_url } = body;
        if (!escrow_id || !action || !user_email || !redirect_url) {
            return jsonResponse({ error: 'حقول مطلوبة: escrow_id, action, user_email, redirect_url' }, 400);
        }

        if (IS_DEV || !DHMAD_API_KEY) {
            // DEV: return a fake checkout URL
            const mockSessionId = `mock_session_${crypto.randomUUID().slice(0, 8)}`;
            return jsonResponse({
                session_id: mockSessionId,
                url: `${redirect_url}?session_id=${mockSessionId}&status=completed`,
            });
        }

        const res = await fetch(`${DHMAD_BASE_URL}/escrows/${escrow_id}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DHMAD_API_KEY}`,
            },
            body: JSON.stringify({ action, userEmail: user_email, redirectUrl: redirect_url }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('[dhmad-checkout-session] error:', res.status, errText);
            return jsonResponse({ error: 'فشل إنشاء جلسة الدفع.' }, 502);
        }

        const raw = await res.json();
        return jsonResponse({
            session_id: raw.sessionId ?? raw.id,
            url: `${DHMAD_CHECKOUT_BASE}/${raw.sessionId ?? raw.id}`,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        console.error('[dhmad-checkout-session] error:', message);
        return jsonResponse({ error: message }, 500);
    }
});
