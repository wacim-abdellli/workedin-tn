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
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabaseAnon = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
        );
        const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
        if (authError || !user) return jsonResponse({ error: 'غير مصرح.' }, 401);

        const { escrow_id } = await req.json() as { escrow_id: string };
        if (!escrow_id) return jsonResponse({ error: 'escrow_id مطلوب' }, 400);

        if (IS_DEV || !DHMAD_API_KEY) {
            return jsonResponse({ escrow_id, status: 'funded', amount: 0, created_at: new Date().toISOString() });
        }

        const res = await fetch(`${DHMAD_BASE_URL}/escrows/${escrow_id}`, {
            headers: { 'Authorization': `Bearer ${DHMAD_API_KEY}` },
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('[dhmad-get-escrow-status] error:', res.status, errText);
            return jsonResponse({ error: 'فشل جلب حالة الضمان.' }, 502);
        }

        const raw = await res.json();
        return jsonResponse({
            escrow_id: raw.id ?? escrow_id,
            status: raw.status,
            amount: raw.amount,
            payment_url: raw.checkoutUrl ?? null,
            created_at: raw.createdAt ?? new Date().toISOString(),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        console.error('[dhmad-get-escrow-status] error:', message);
        return jsonResponse({ error: message }, 500);
    }
});
