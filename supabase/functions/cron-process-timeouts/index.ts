/**
 * Supabase Edge Function: Cron Process Timeouts
 *
 * This function should be called periodically (e.g., via pg_cron or GitHub Actions).
 * It does two things:
 * 1. Finds contracts that are >14 days past their review due date, calls Dhmad to release funds,
 *    and then updates the DB via a dedicated RPC.
 * 2. Calls the existing `process_contract_review_timeouts()` RPC to handle 24h reminders
 *    and standard overdue notifications.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DHMAD_API_KEY = Deno.env.get('DHMAD_API_KEY') ?? '';
const DHMAD_BASE_URL = Deno.env.get('DHMAD_BASE_URL') ?? 'https://sandbox.dhmad.tn/api/v1';
const IS_DEV = Deno.env.get('DENO_ENV') === 'development';

serve(async (req: Request): Promise<Response> => {
    // Only allow POST requests for security if not invoked via CRON
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Starting cron-process-timeouts...`);

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // 1. Find all contracts due for 14-day auto-release
        const { data: autoReleaseCandidates, error: fetchError } = await supabaseAdmin
            .from('contracts')
            .select('id, dhmad_escrow_id')
            .eq('status', 'delivery_submitted')
            .not('review_due_at', 'is', null)
            .lte('review_due_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

        if (fetchError) throw fetchError;

        let autoReleasedCount = 0;
        let autoReleaseFailures = 0;

        console.log(`Found ${autoReleaseCandidates?.length || 0} contracts due for 14-day auto-release.`);

        for (const contract of autoReleaseCandidates || []) {
            try {
                if (contract.dhmad_escrow_id) {
                    if (IS_DEV || !DHMAD_API_KEY) {
                        console.log(`[DEV] Mocking Dhmad release for escrow ${contract.dhmad_escrow_id}`);
                    } else {
                        console.log(`Calling Dhmad to auto-release escrow ${contract.dhmad_escrow_id}...`);
                        const dhmadRes = await fetch(`${DHMAD_BASE_URL}/escrows/${contract.dhmad_escrow_id}/deliver`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${DHMAD_API_KEY}`,
                            },
                        });

                        if (!dhmadRes.ok) {
                            const errText = await dhmadRes.text();
                            throw new Error(`Dhmad API error: ${dhmadRes.status} - ${errText}`);
                        }
                    }
                }

                // If Dhmad succeeds (or in DEV/missing ID), update the DB
                const { error: releaseError } = await supabaseAdmin.rpc('auto_release_contract_payment', {
                    p_contract_id: contract.id
                });

                if (releaseError) throw releaseError;
                autoReleasedCount++;
                console.log(`Successfully auto-released contract ${contract.id}`);
                
            } catch (err) {
                console.error(`Failed to auto-release contract ${contract.id}:`, err);
                autoReleaseFailures++;
            }
        }

        // 2. Process standard reminders and notifications (24h warning, 0h overdue)
        console.log('Processing standard reminders and timeouts...');
        const { data: timeoutResults, error: timeoutError } = await supabaseAdmin.rpc('process_contract_review_timeouts');
        
        if (timeoutError) {
             console.error('Failed to process standard timeouts:', timeoutError);
        }

        return new Response(JSON.stringify({
            success: true,
            autoReleased: autoReleasedCount,
            autoReleaseFailures,
            standardTimeouts: timeoutResults
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Cron job failed:', message);
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
