import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DHMAD_WEBHOOK_SECRET = Deno.env.get('DHMAD_WEBHOOK_SECRET');

serve(async (req: Request) => {
    try {
        // Only accept POST requests
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        // Parse webhook payload
        const payload = await req.json();
        console.log('[dhmad-webhook] Received payload:', payload);

        // Standard Dhmad webhook structure assumed:
        // { event: "escrow.funded", data: { id: "escrow_xyz", status: "funded" } }
        // Or direct payload depending on exact API structure.
        
        const event = payload.event || 'unknown';
        const escrowData = payload.data || payload;
        const escrowId = escrowData.id || escrowData.escrow_id;
        const status = escrowData.status;

        if (!escrowId || !status) {
            console.error('[dhmad-webhook] Missing escrow ID or status');
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
            console.error(`[dhmad-webhook] Contract not found for escrow ${escrowId}`);
            // Return 200 so Dhmad doesn't retry unnecessarily if it's an old/unknown escrow
            return new Response('Contract not found', { status: 200 });
        }

        console.log(`[dhmad-webhook] Processing update for contract ${contract.id}: status=${status}`);

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
            // We might also set status to cancelled if refunded
            updates.status = 'cancelled';
        }

        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabaseAdmin
                .from('contracts')
                .update(updates)
                .eq('id', contract.id);

            if (updateError) {
                console.error('[dhmad-webhook] Failed to update contract:', updateError);
                return new Response('Database update failed', { status: 500 });
            }
            console.log(`[dhmad-webhook] Successfully updated contract ${contract.id} with`, updates);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err) {
        console.error('[dhmad-webhook] Unhandled error:', err);
        return new Response('Internal Server Error', { status: 500 });
    }
});
