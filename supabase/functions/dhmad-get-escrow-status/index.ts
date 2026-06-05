/**
 * Supabase Edge Function: Dhmad Get Escrow Status
 * GET ${DHMAD_BASE_URL}/escrows/:escrow_id
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
const IS_DEV = Deno.env.get('DENO_ENV') === 'development';

serve(async (req: Request): Promise<Response> => {
    const requestId = crypto.randomUUID().slice(0, 8);
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Request received: ${req.method} ${req.url}`);

    if (req.method === 'OPTIONS') {
        console.log(`[${timestamp}][${requestId}][dhmad-get-escrow-status] CORS preflight handled`);
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Authenticating user...`);
        const supabaseAnon = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
        );
        const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
        if (authError || !user) {
            console.error(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Auth failed:`, authError?.message);
            return jsonResponse({ error: 'غير مصرح.' }, 401);
        }
        console.log(`[${timestamp}][${requestId}][dhmad-get-escrow-status] User authenticated: ${user.id}`);

        const { escrow_id } = await req.json() as { escrow_id: string };
        console.log(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Request body:`, { escrow_id });
        
        if (!escrow_id) {
            console.error(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Missing escrow_id`);
            return jsonResponse({ error: 'escrow_id مطلوب' }, 400);
        }

        if (!IS_DEV && !DHMAD_API_KEY) {
            console.error(`[${timestamp}][${requestId}][dhmad-get-escrow-status] FATAL: DHMAD_API_KEY not configured.`);
            return jsonResponse({
                error: 'خدمة الدفع غير متاحة حالياً. يرجى التواصل مع الدعم.',
            }, 503);
        }

        if (IS_DEV) {
            console.log(`[${timestamp}][${requestId}][dhmad-get-escrow-status] DEV MODE: Returning mock status`);
            const mockData = { escrow_id, status: 'funded', amount: 0, created_at: new Date().toISOString() };
            console.log(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Mock data:`, mockData);
            return jsonResponse(mockData);
        }

        console.log(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Calling Dhmad API: GET ${DHMAD_BASE_URL}/escrows/${escrow_id}`);
        const res = await fetch(`${DHMAD_BASE_URL}/escrows/${escrow_id}`, {
            headers: { 'Authorization': `Bearer ${DHMAD_API_KEY}` },
        });

        console.log(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Dhmad API response status: ${res.status}`);

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Dhmad API error: ${res.status} - ${errText}`);
            return jsonResponse({ error: 'فشل جلب حالة الضمان.' }, 502);
        }

        const raw = await res.json();
        console.log(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Dhmad API response:`, raw);
        
        const responseData = {
            escrow_id: raw.id ?? escrow_id,
            status: raw.status,
            amount: raw.amount,
            payment_url: raw.checkoutUrl ?? null,
            created_at: raw.createdAt ?? new Date().toISOString(),
        };
        console.log(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Request completed successfully`);
        return jsonResponse(responseData);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        const stack = err instanceof Error ? err.stack : undefined;
        console.error(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Unhandled error:`, message);
        if (stack) console.error(`[${timestamp}][${requestId}][dhmad-get-escrow-status] Stack trace:`, stack);
        return jsonResponse({ error: message }, 500);
    }
});
