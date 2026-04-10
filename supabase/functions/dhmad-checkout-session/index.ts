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
    const requestId = crypto.randomUUID().slice(0, 8);
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}][${requestId}][dhmad-checkout-session] Request received: ${req.method} ${req.url}`);

    if (req.method === 'OPTIONS') {
        console.log(`[${timestamp}][${requestId}][dhmad-checkout-session] CORS preflight handled`);
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log(`[${timestamp}][${requestId}][dhmad-checkout-session] Authenticating user...`);
        const supabaseAnon = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
        );
        const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
        if (authError || !user) {
            console.error(`[${timestamp}][${requestId}][dhmad-checkout-session] Auth failed:`, authError?.message);
            return jsonResponse({ error: 'غير مصرح.' }, 401);
        }
        console.log(`[${timestamp}][${requestId}][dhmad-checkout-session] User authenticated: ${user.id}`);

        const body = await req.json() as {
            escrow_id: string;
            action: 'sign_contract' | 'accept_pay' | 'complete' | 'dispute';
            user_email: string;
            redirect_url: string;
        };

        const { escrow_id, action, user_email, redirect_url } = body;
        console.log(`[${timestamp}][${requestId}][dhmad-checkout-session] Request body:`, { escrow_id, action, user_email, redirect_url });
        
        if (!escrow_id || !action || !user_email || !redirect_url) {
            console.error(`[${timestamp}][${requestId}][dhmad-checkout-session] Missing required fields`);
            return jsonResponse({ error: 'حقول مطلوبة: escrow_id, action, user_email, redirect_url' }, 400);
        }

        if (IS_DEV || !DHMAD_API_KEY) {
            // DEV: return a fake checkout URL
            console.log(`[${timestamp}][${requestId}][dhmad-checkout-session] DEV MODE: Creating mock session`);
            const mockSessionId = `mock_session_${crypto.randomUUID().slice(0, 8)}`;
            const mockData = {
                session_id: mockSessionId,
                url: `${redirect_url}?session_id=${mockSessionId}&status=completed`,
            };
            console.log(`[${timestamp}][${requestId}][dhmad-checkout-session] Mock session created:`, mockData);
            return jsonResponse(mockData);
        }

        const apiPayload = { action, userEmail: user_email, redirectUrl: redirect_url };
        console.log(`[${timestamp}][${requestId}][dhmad-checkout-session] Calling Dhmad API: POST ${DHMAD_BASE_URL}/escrows/${escrow_id}/sessions`);
        console.log(`[${timestamp}][${requestId}][dhmad-checkout-session] API payload:`, apiPayload);

        const res = await fetch(`${DHMAD_BASE_URL}/escrows/${escrow_id}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DHMAD_API_KEY}`,
            },
            body: JSON.stringify(apiPayload),
        });

        console.log(`[${timestamp}][${requestId}][dhmad-checkout-session] Dhmad API response status: ${res.status}`);

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[${timestamp}][${requestId}][dhmad-checkout-session] Dhmad API error: ${res.status} - ${errText}`);
            return jsonResponse({ error: 'فشل إنشاء جلسة الدفع.' }, 502);
        }

        const raw = await res.json();
        console.log(`[${timestamp}][${requestId}][dhmad-checkout-session] Dhmad API response:`, raw);
        
        const responseData = {
            session_id: raw.sessionId ?? raw.id,
            url: `${DHMAD_CHECKOUT_BASE}/${raw.sessionId ?? raw.id}`,
        };
        console.log(`[${timestamp}][${requestId}][dhmad-checkout-session] Session created successfully:`, responseData);
        return jsonResponse(responseData);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        const stack = err instanceof Error ? err.stack : undefined;
        console.error(`[${timestamp}][${requestId}][dhmad-checkout-session] Unhandled error:`, message);
        if (stack) console.error(`[${timestamp}][${requestId}][dhmad-checkout-session] Stack trace:`, stack);
        return jsonResponse({ error: message }, 500);
    }
});
