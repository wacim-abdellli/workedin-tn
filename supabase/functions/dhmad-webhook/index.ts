import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DHMAD_WEBHOOK_SECRET = Deno.env.get('DHMAD_WEBHOOK_SECRET');
const IS_DEV = Deno.env.get('DENO_ENV') === 'development';

// ─── HMAC-SHA256 Signature Verification ───────────────────────────────────────

async function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): Promise<boolean> {
    if (!signatureHeader) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const expectedHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // Support both "sha256=<hex>" and plain "<hex>" formats
    const receivedHex = signatureHeader.replace(/^sha256=/, '').trim().toLowerCase();
    
    // Constant-time comparison to prevent timing attacks
    if (expectedHex.length !== receivedHex.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expectedHex.length; i++) {
        mismatch |= expectedHex.charCodeAt(i) ^ receivedHex.charCodeAt(i);
    }
    return mismatch === 0;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
    const requestId = crypto.randomUUID().slice(0, 8);
    const timestamp = new Date().toISOString();

    try {
        // Only accept POST requests
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        // Read raw body for signature verification
        const rawBody = await req.text();

        // ── Signature verification ────────────────────────────────────────────
        // In production: DHMAD_WEBHOOK_SECRET is mandatory. Hard fail if missing.
        if (!IS_DEV && !DHMAD_WEBHOOK_SECRET) {
            console.error(`[${timestamp}][${requestId}][dhmad-webhook] FATAL: DHMAD_WEBHOOK_SECRET is not configured. Refusing all requests.`);
            return new Response('Webhook not configured', { status: 503 });
        }

        // Verify signature in production (skip only in local dev)
        if (!IS_DEV) {
            const signatureHeader = req.headers.get('x-dhmad-signature')
                || req.headers.get('x-webhook-signature')
                || req.headers.get('x-signature');

            const isValid = await verifySignature(rawBody, signatureHeader, DHMAD_WEBHOOK_SECRET!);
            if (!isValid) {
                console.error(`[${timestamp}][${requestId}][dhmad-webhook] Signature verification FAILED`);
                return new Response('Invalid signature', { status: 401 });
            }
            console.log(`[${timestamp}][${requestId}][dhmad-webhook] Signature verified ✓`);
        }

        // Parse webhook payload
        const payload = JSON.parse(rawBody);
        console.log(`[${timestamp}][${requestId}][dhmad-webhook] Received payload:`, payload);

        // Standard Dhmad webhook structure assumed:
        // { event: "escrow.funded", data: { id: "escrow_xyz", status: "funded" } }
        // Or direct payload depending on exact API structure.
        
        const event = payload.event || 'unknown';
        const escrowData = payload.data || payload;
        const escrowId = escrowData.id || escrowData.escrow_id;
        const status = escrowData.status;

        if (!escrowId || !status) {
            console.error(`[${timestamp}][${requestId}][dhmad-webhook] Missing escrow ID or status`);
            return new Response('Invalid payload', { status: 400 });
        }

        // Initialize Supabase Admin client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch contract by escrow ID
        const { data: contract, error: contractError } = await supabaseAdmin
            .from('contracts')
            .select('id, status, payment_status, escrow_funded')
            .eq('dhmad_escrow_id', escrowId)
            .maybeSingle();

        if (contractError || !contract) {
            console.error(`[${timestamp}][${requestId}][dhmad-webhook] Contract not found for escrow ${escrowId}`);
            // Return 200 so Dhmad doesn't retry unnecessarily if it's an old/unknown escrow
            return new Response('Contract not found', { status: 200 });
        }

        console.log(`[${timestamp}][${requestId}][dhmad-webhook] Processing update for contract ${contract.id}: event=${event}, status=${status}`);

        const updates: Record<string, any> = {};

        // Map Dhmad status to our internal state
        if (status === 'funded') {
            updates.escrow_funded = true;
            updates.payment_status = 'in_escrow';
            updates.funded_at = new Date().toISOString();
            if (contract.status === 'pending_payment') {
                updates.status = 'active';
            }
        } else if (status === 'released') {
            updates.payment_status = 'released';
            if (contract.status === 'active' || contract.status === 'delivery_submitted' || contract.status === 'revision_requested') {
                 updates.status = 'completed';
            }
        } else if (status === 'refunded') {
            updates.payment_status = 'refunded';
            updates.status = 'cancelled';
        }

        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabaseAdmin
                .from('contracts')
                .update(updates)
                .eq('id', contract.id);

            if (updateError) {
                console.error(`[${timestamp}][${requestId}][dhmad-webhook] Failed to update contract:`, updateError);
                return new Response('Database update failed', { status: 500 });
            }
            console.log(`[${timestamp}][${requestId}][dhmad-webhook] Successfully updated contract ${contract.id} with`, updates);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err) {
        console.error(`[${timestamp}][${requestId}][dhmad-webhook] Unhandled error:`, err);
        return new Response('Internal Server Error', { status: 500 });
    }
});
