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
const CRON_SECRET = Deno.env.get('CRON_SECRET');

serve(async (req: Request): Promise<Response> => {
    // Only allow POST requests for security if not invoked via CRON
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const timestamp = new Date().toISOString();

    // Validate cron secret in production
    if (!IS_DEV) {
        if (!CRON_SECRET) {
            console.error(`[${timestamp}] FATAL: CRON_SECRET is not configured.`);
            return new Response('Cron service not configured', { status: 503 });
        }
        const requestSecret = req.headers.get('x-cron-secret');
        if (!requestSecret || requestSecret !== CRON_SECRET) {
            console.error(`[${timestamp}] Unauthorized cron attempt — invalid or missing x-cron-secret header`);
            return new Response('Unauthorized', { status: 401 });
        }
    }

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
        let pendingCancelledCount = 0;

        console.log(`Found ${autoReleaseCandidates?.length || 0} contracts due for 14-day auto-release.`);

        for (const contract of autoReleaseCandidates || []) {
            try {
                if (contract.dhmad_escrow_id) {
                    if (!IS_DEV && !DHMAD_API_KEY) {
                        console.error(`[${timestamp}] FATAL: DHMAD_API_KEY not configured.`);
                        throw new Error("DHMAD_API_KEY not configured.");
                    }
                    if (IS_DEV) {
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

        // 1.5. Find all contracts stuck in pending_payment for >72 hours
        const cutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
        const { data: stuckPendingContracts, error: pendingFetchError } = await supabaseAdmin
            .from('contracts')
            .select('id, client_id, freelancer_id, title')
            .eq('status', 'pending_payment')
            .lte('created_at', cutoff72h);

        if (pendingFetchError) {
            console.error('Failed to fetch stuck pending_payment contracts:', pendingFetchError);
        } else {
            console.log(`Found ${stuckPendingContracts?.length || 0} contracts stuck in pending_payment > 72 hours.`);
            for (const contract of stuckPendingContracts || []) {
                try {
                    // Update status to cancelled
                    const { error: cancelError } = await supabaseAdmin
                        .from('contracts')
                        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                        .eq('id', contract.id);

                    if (cancelError) throw cancelError;

                    // Send notification to client
                    const clientTitle = 'Contract cancelled — unpaid escrow';
                    const clientBody = `Your contract "${contract.title || 'Contract'}" was cancelled because the escrow payment was not funded within 72 hours.`;
                    const { error: clientNotifError } = await supabaseAdmin.rpc('create_notification', {
                        p_user_id: contract.client_id,
                        p_type: 'contract',
                        p_title: clientTitle,
                        p_body: clientBody,
                        p_link: `/contracts/${contract.id}`,
                        p_related_id: contract.id
                    });
                    if (clientNotifError) {
                        console.error(`Failed to notify client ${contract.client_id} for cancelled contract ${contract.id}:`, clientNotifError);
                    }

                    // Send notification to freelancer
                    if (contract.freelancer_id) {
                        const freelancerTitle = 'Contract cancelled — unpaid escrow';
                        const freelancerBody = `The contract "${contract.title || 'Contract'}" was cancelled because the client did not fund the escrow within 72 hours.`;
                        const { error: freelancerNotifError } = await supabaseAdmin.rpc('create_notification', {
                            p_user_id: contract.freelancer_id,
                            p_type: 'contract',
                            p_title: freelancerTitle,
                            p_body: freelancerBody,
                            p_link: `/contracts/${contract.id}`,
                            p_related_id: contract.id
                        });
                        if (freelancerNotifError) {
                            console.error(`Failed to notify freelancer ${contract.freelancer_id} for cancelled contract ${contract.id}:`, freelancerNotifError);
                        }
                    }

                    pendingCancelledCount++;
                    console.log(`Successfully cancelled stuck contract ${contract.id} and notified parties.`);
                } catch (err) {
                    console.error(`Failed to process pending_payment timeout for contract ${contract.id}:`, err);
                }
            }
        }

        // 2. Process standard reminders and notifications (24h warning, 0h overdue)
        console.log('Processing standard reminders and timeouts...');
        const { data: timeoutResults, error: timeoutError } = await supabaseAdmin.rpc('process_contract_review_timeouts');
        
        if (timeoutError) {
             console.error('Failed to process standard timeouts:', timeoutError);
        }

        // 3. Finalize clearance for completed contracts past the 48-hour hold buffer
        console.log('Processing 48-hour escrow clearance holds...');
        const nowStr = new Date().toISOString();
        const { data: clearanceCandidates, error: clearanceFetchError } = await supabaseAdmin
            .from('contracts')
            .select('id')
            .eq('status', 'completed')
            .eq('payment_status', 'in_escrow')
            .eq('escrow_hold_disputed', false)
            .lte('escrow_pending_clearance_until', nowStr);

        let clearedCount = 0;
        let clearanceFailures = 0;

        if (clearanceFetchError) {
            console.error('Failed to fetch escrow clearance candidates:', clearanceFetchError);
        } else {
            console.log(`Found ${clearanceCandidates?.length || 0} contracts due for 48-hour hold clearance.`);
            for (const contract of clearanceCandidates || []) {
                try {
                    console.log(`Finalizing payment clearance for contract ${contract.id}...`);
                    const { error: finalizeError } = await supabaseAdmin.rpc('finalize_clearance_payment', {
                        p_contract_id: contract.id
                    });

                    if (finalizeError) throw finalizeError;

                    clearedCount++;
                    console.log(`Successfully cleared payment for contract ${contract.id}`);
                } catch (err) {
                    console.error(`Failed to finalize clearance for contract ${contract.id}:`, err);
                    clearanceFailures++;
                }
            }
        }

        // 4. Finalize clearance for milestones past the 48-hour hold buffer
        console.log('Processing 48-hour milestone escrow clearance holds...');
        const { data: milestoneClearanceCandidates, error: milestoneFetchError } = await supabaseAdmin
            .from('milestones')
            .select('id')
            .eq('status', 'approved')
            .lte('escrow_pending_clearance_until', nowStr)
            .eq('escrow_hold_disputed', false);

        let clearedMilestonesCount = 0;
        let milestoneClearanceFailures = 0;

        if (milestoneFetchError) {
            console.error('Failed to fetch milestone clearance candidates:', milestoneFetchError);
        } else {
            console.log(`Found ${milestoneClearanceCandidates?.length || 0} milestones due for 48-hour hold clearance.`);
            for (const milestone of milestoneClearanceCandidates || []) {
                try {
                    console.log(`Finalizing payment clearance for milestone ${milestone.id}...`);
                    const { error: finalizeError } = await supabaseAdmin.rpc('finalize_milestone_clearance_payment', {
                        p_milestone_id: milestone.id
                    });

                    if (finalizeError) throw finalizeError;

                    clearedMilestonesCount++;
                    console.log(`Successfully cleared payment for milestone ${milestone.id}`);
                } catch (err) {
                    console.error(`Failed to finalize clearance for milestone ${milestone.id}:`, err);
                    milestoneClearanceFailures++;
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            autoReleased: autoReleasedCount,
            autoReleaseFailures,
            pendingCancelled: pendingCancelledCount,
            standardTimeouts: timeoutResults,
            clearedEscrows: clearedCount,
            clearanceFailures,
            clearedMilestones: clearedMilestonesCount,
            milestoneClearanceFailures
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
