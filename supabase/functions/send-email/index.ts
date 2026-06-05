/**
 * Supabase Edge Function: Send Email via Resend
 *
 * SECURITY:
 * - Requires authenticated user
 * - CORS restricted to production domain
 * - Only allows recognized action payloads
 * - Authorizes every action server-side
 * - Derives recipients and email content from DB records
 * - Identifies actual DB events and forces deduplication
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://workedin.tn'
const APP_URL = Deno.env.get('APP_URL') || 'https://workedin-tn.vercel.app'

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

type EmailAction = 'proposal_accepted' | 'payment_received' | 'new_proposal' | 'dispute_opened';

type EmailPayload = {
    to: string;
    subject: string;
    html: string;
    logAction: EmailAction;
    logEntityType: string;
    logEntityId: string;
    recipientId: string;
};

type DispatchStatus = 'pending' | 'sent' | 'failed';

type DispatchClaimResult =
    | { mode: 'send'; dispatchId: string }
    | { mode: 'skip'; reason: 'already_sent' | 'already_pending' };

function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function asSingle<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
}

async function getProfileEmail(
    adminClient: ReturnType<typeof createClient>,
    userId: string,
): Promise<{ id: string; email: string; full_name: string | null }> {
    const { data, error } = await adminClient
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', userId)
        .single();

    if (error || !data?.email || !isValidEmail(data.email)) {
        throw new Error('Recipient has no valid email');
    }

    return data;
}

async function getContractWithJob(
    adminClient: ReturnType<typeof createClient>,
    contractId: string,
) {
    const { data, error } = await adminClient
        .from('contracts')
        .select('id, client_id, freelancer_id, amount, payment_status, job:jobs(title)')
        .eq('id', contractId)
        .single();

    if (error || !data) {
        throw new Error('Contract not found');
    }

    const job = asSingle(data.job);
    return { ...data, job };
}

async function buildNewProposalEmail(
    adminClient: ReturnType<typeof createClient>,
    userId: string,
    actionData: Record<string, unknown>,
): Promise<EmailPayload[]> {
    const jobId = typeof actionData.jobId === 'string' ? actionData.jobId : null;
    if (!jobId) {
        throw new Error('Missing jobId');
    }

    const { data: proposal, error: proposalError } = await adminClient
        .from('proposals')
        .select('id')
        .eq('job_id', jobId)
        .eq('freelancer_id', userId)
        .maybeSingle();

    if (proposalError || !proposal) {
        throw new Error('Not authorized to notify for this proposal');
    }

    const { data: job, error: jobError } = await adminClient
        .from('jobs')
        .select('title, client_id')
        .eq('id', jobId)
        .single();

    if (jobError || !job?.client_id) {
        throw new Error('Job not found');
    }

    const recipient = await getProfileEmail(adminClient, job.client_id);

    return [{
        to: recipient.email,
        subject: `Ø¹Ø±Ø¶ Ø¬Ø¯ÙŠØ¯ Ø¹Ù„Ù‰ Ù…Ù‡Ù…ØªÙƒ "${job.title}" â€” Ø®Ø¯Ù…Ø©`,
        html: `
            <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
                <h2 style="color:#7c3aed">Ù„Ø¯ÙŠÙƒ Ø¹Ø±Ø¶ Ø¬Ø¯ÙŠØ¯!</h2>
                <p>Ù…Ø±Ø­Ø¨Ø§Ù‹ ${escapeHtml(recipient.full_name || 'Ø¹Ù…ÙŠÙ„')}ØŒ</p>
                <p>ØªÙ„Ù‚ÙŠØª Ø¹Ø±Ø¶Ø§Ù‹ Ø¬Ø¯ÙŠØ¯Ø§Ù‹ Ø¹Ù„Ù‰ Ù…Ù‡Ù…ØªÙƒ: <strong>${escapeHtml(job.title)}</strong></p>
                <a href="${APP_URL}/jobs/${jobId}"
                   style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                    Ø¹Ø±Ø¶ Ø§Ù„Ø¹Ø±ÙˆØ¶
                </a>
                <p style="color:#888;margin-top:24px;font-size:12px">ÙØ±ÙŠÙ‚ Ø®Ø¯Ù…Ø©</p>
            </div>`,
        logAction: 'new_proposal',
        logEntityType: 'proposal',
        logEntityId: proposal.id,
        recipientId: recipient.id,
    }];
}

async function buildProposalAcceptedEmail(
    adminClient: ReturnType<typeof createClient>,
    userId: string,
    actionData: Record<string, unknown>,
): Promise<EmailPayload[]> {
    const contractId = typeof actionData.contractId === 'string' ? actionData.contractId : null;
    if (!contractId) {
        throw new Error('Missing contractId');
    }

    const contract = await getContractWithJob(adminClient, contractId);
    if (contract.client_id !== userId) {
        throw new Error('Not authorized to send proposal accepted email');
    }

    const recipient = await getProfileEmail(adminClient, contract.freelancer_id);
    const jobTitle = contract.job?.title || 'Ù…Ù‡Ù…ØªÙƒ';

    return [{
        to: recipient.email,
        subject: `ØªÙ… Ù‚Ø¨ÙˆÙ„ Ø¹Ø±Ø¶Ùƒ Ø¹Ù„Ù‰ "${jobTitle}" â€” Ø®Ø¯Ù…Ø©`,
        html: `
            <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
                <h2 style="color:#7c3aed">Ù…Ø¨Ø±ÙˆÙƒ ${escapeHtml(recipient.full_name || 'Ù…Ø³ØªÙ‚Ù„')}! ðŸŽ‰</h2>
                <p>ØªÙ… Ù‚Ø¨ÙˆÙ„ Ø¹Ø±Ø¶Ùƒ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù‡Ù…Ø©: <strong>${escapeHtml(jobTitle)}</strong></p>
                <p>ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø¢Ù† Ø§Ù„Ø§Ø·Ù„Ø§Ø¹ Ø¹Ù„Ù‰ ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø¹Ù‚Ø¯ ÙˆØ§Ù„Ø¨Ø¯Ø¡ ÙÙŠ Ø§Ù„Ø¹Ù…Ù„.</p>
                <a href="${APP_URL}/contracts/${contractId}"
                   style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                    Ø¹Ø±Ø¶ Ø§Ù„Ø¹Ù‚Ø¯
                </a>
                <p style="color:#888;margin-top:24px;font-size:12px">ÙØ±ÙŠÙ‚ Ø®Ø¯Ù…Ø©</p>
            </div>`,
        logAction: 'proposal_accepted',
        logEntityType: 'contract',
        logEntityId: contract.id,
        recipientId: recipient.id,
    }];
}

async function buildPaymentReceivedEmail(
    adminClient: ReturnType<typeof createClient>,
    userId: string,
    actionData: Record<string, unknown>,
): Promise<EmailPayload[]> {
    const contractId = typeof actionData.contractId === 'string' ? actionData.contractId : null;
    if (!contractId) {
        throw new Error('Missing contractId');
    }

    const contract = await getContractWithJob(adminClient, contractId);
    if (contract.client_id !== userId) {
        throw new Error('Not authorized to send payment received email');
    }
    
    if (!['paid', 'in_escrow', 'released'].includes(contract.payment_status || '')) {
        throw new Error('Payment state not met');
    }

    const recipient = await getProfileEmail(adminClient, contract.freelancer_id);
    const amount = Number(contract.amount || 0);

    return [{
        to: recipient.email,
        subject: `ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø¯ÙØ¹Ø© ${amount} Ø¯.Øª â€” Ø®Ø¯Ù…Ø©`,
        html: `
            <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
                <h2 style="color:#059669">ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø¯ÙØ¹ØªÙƒ ðŸ’°</h2>
                <p>Ù…Ø±Ø­Ø¨Ø§Ù‹ ${escapeHtml(recipient.full_name || 'Ù…Ø³ØªÙ‚Ù„')}ØŒ</p>
                <p>ØªÙ… Ø¥Ø¶Ø§ÙØ© <strong>${amount} Ø¯.Øª</strong> Ø¥Ù„Ù‰ Ù…Ø­ÙØ¸ØªÙƒ.</p>
                <a href="${APP_URL}/contracts/${contractId}"
                   style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                    Ø¹Ø±Ø¶ Ø§Ù„Ø¹Ù‚Ø¯
                </a>
                <a href="${APP_URL}/wallet"
                   style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;margin-right:8px">
                    Ø¹Ø±Ø¶ Ø§Ù„Ù…Ø­ÙØ¸Ø©
                </a>
                <p style="color:#888;margin-top:24px;font-size:12px">ÙØ±ÙŠÙ‚ Ø®Ø¯Ù…Ø©</p>
            </div>`,
        logAction: 'payment_received',
        logEntityType: 'contract',
        logEntityId: contract.id,
        recipientId: recipient.id,
    }];
}

async function buildDisputeOpenedEmails(
    adminClient: ReturnType<typeof createClient>,
    userId: string,
    actionData: Record<string, unknown>,
): Promise<EmailPayload[]> {
    const contractId = typeof actionData.contractId === 'string' ? actionData.contractId : null;
    if (!contractId) {
        throw new Error('Missing contractId');
    }

    const contract = await getContractWithJob(adminClient, contractId);
    if (userId !== contract.client_id && userId !== contract.freelancer_id) {
        throw new Error('Not authorized to open dispute notification');
    }

    const { data: dispute, error: disputeError } = await adminClient
        .from('disputes')
        .select('id, reason')
        .eq('contract_id', contractId)
        .eq('opened_by', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
    if (disputeError || !dispute) {
        throw new Error('Dispute row not found in db');
    }

    const reason = typeof dispute.reason === 'string' ? dispute.reason.trim() : '';
    if (!reason) {
        throw new Error('Dispute reason missing in db');
    }

    const openedByRole = userId === contract.client_id ? 'Ø§Ù„Ø¹Ù…ÙŠÙ„' : 'Ø§Ù„Ù…Ø³ØªÙ‚Ù„';
    const recipients = await Promise.all([
        getProfileEmail(adminClient, contract.client_id),
        getProfileEmail(adminClient, contract.freelancer_id),
    ]);

    return recipients.map((recipient) => ({
        to: recipient.email,
        subject: 'ØªÙ… Ù ØªØ­ Ù†Ø²Ø§Ø¹ Ø¹Ù„Ù‰ Ø¹Ù‚Ø¯Ùƒ â€” Ø®Ø¯Ù…Ø©',
        html: `
            <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
                <h2 style="color:#d97706">Dispute opened</h2>
                <p>Ù…Ø±Ø­Ø¨Ø§Ù‹ ${escapeHtml(recipient.full_name || 'Ù…Ø³ØªØ®Ø¯Ù…')}ØŒ</p>
                <p>Ù‚Ø§Ù… <strong>${openedByRole}</strong> Ø¨Ù ØªØ­ Ù†Ø²Ø§Ø¹ Ø¹Ù„Ù‰ Ø§Ù„Ø¹Ù‚Ø¯. Ø³ÙŠÙ‚ÙˆÙ… Ù Ø±ÙŠÙ‚ Ø®Ø¯Ù…Ø© Ø¨Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø­Ø§Ù„Ø© Ø®Ù„Ø§Ù„ 48 Ø³Ø§Ø¹Ø©.</p>
                <p><strong>Ø³Ø¨Ø¨ Ø§Ù„Ù†Ø²Ø§Ø¹:</strong> ${escapeHtml(reason)}</p>
                <a href="${APP_URL}/contracts/${contractId}"
                   style="display:inline-block;background:#d97706;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                    Ø¹Ø±Ø¶ Ø§Ù„Ø¹Ù‚Ø¯
                </a>
                <p style="color:#888;margin-top:24px;font-size:12px">Ù Ø±ÙŠÙ‚ Ø®Ø¯Ù…Ø© â€” disputes@workedin.tn</p>
            </div>`,
        logAction: 'dispute_opened',
        logEntityType: 'dispute',
        logEntityId: dispute.id,
        recipientId: recipient.id,
    }));
}

async function buildEmailPayloads(
    adminClient: ReturnType<typeof createClient>,
    userId: string,
    action: EmailAction,
    actionData: Record<string, unknown>,
): Promise<EmailPayload[]> {
    switch (action) {
        case 'new_proposal':
            return buildNewProposalEmail(adminClient, userId, actionData);
        case 'proposal_accepted':
            return buildProposalAcceptedEmail(adminClient, userId, actionData);
        case 'payment_received':
            return buildPaymentReceivedEmail(adminClient, userId, actionData);
        case 'dispute_opened':
            return buildDisputeOpenedEmails(adminClient, userId, actionData);
        default:
            throw new Error('Unknown action');
    }
}

async function checkAndLogDispatch(
    adminClient: ReturnType<typeof createClient>,
    payload: EmailPayload,
    triggeredBy: string
): Promise<DispatchClaimResult> {
    const { error } = await adminClient.from('email_dispatch_log').insert({
        action: payload.logAction,
        entity_type: payload.logEntityType,
        entity_id: payload.logEntityId,
        recipient_id: payload.recipientId,
        triggered_by: triggeredBy,
        status: 'pending',
        last_error: null,
        provider_message_id: null,
        sent_at: null,
    });

    if (!error) {
        const { data: insertedRow, error: insertedRowError } = await adminClient
            .from('email_dispatch_log')
            .select('id')
            .eq('action', payload.logAction)
            .eq('entity_type', payload.logEntityType)
            .eq('entity_id', payload.logEntityId)
            .eq('recipient_id', payload.recipientId)
            .single();

        if (insertedRowError || !insertedRow?.id) {
            throw new Error('Failed to resolve inserted email dispatch row');
        }

        return { mode: 'send', dispatchId: insertedRow.id };
    }

    if (error.code !== '23505') {
        throw new Error('Failed to log email dispatch: ' + error.message);
    }

    const { data: existingRow, error: existingError } = await adminClient
        .from('email_dispatch_log')
        .select('id, status')
        .eq('action', payload.logAction)
        .eq('entity_type', payload.logEntityType)
        .eq('entity_id', payload.logEntityId)
        .eq('recipient_id', payload.recipientId)
        .single();

    if (existingError || !existingRow?.id) {
        throw new Error('Failed to load existing email dispatch row');
    }

    if (existingRow.status === 'sent') {
        return { mode: 'skip', reason: 'already_sent' };
    }

    if (existingRow.status === 'pending') {
        return { mode: 'skip', reason: 'already_pending' };
    }

    const { data: reclaimedRow, error: reclaimedError } = await adminClient
        .from('email_dispatch_log')
        .update({
            status: 'pending',
            triggered_by: triggeredBy,
            last_error: null,
            provider_message_id: null,
            sent_at: null,
        })
        .eq('id', existingRow.id)
        .eq('status', 'failed')
        .select('id')
        .single();

    if (reclaimedError || !reclaimedRow?.id) {
        const { data: currentRow, error: currentRowError } = await adminClient
            .from('email_dispatch_log')
            .select('id, status')
            .eq('id', existingRow.id)
            .single();

        if (currentRowError || !currentRow?.id) {
            throw new Error('Failed to reclaim email dispatch row');
        }

        if (currentRow.status === 'sent') {
            return { mode: 'skip', reason: 'already_sent' };
        }

        if (currentRow.status === 'pending') {
            return { mode: 'skip', reason: 'already_pending' };
        }

        throw new Error('Failed to reclaim failed email dispatch row');
    }

    return { mode: 'send', dispatchId: reclaimedRow.id };
}

async function markDispatchSent(
    adminClient: ReturnType<typeof createClient>,
    dispatchId: string,
    providerMessageId: string | null,
) {
    const { error } = await adminClient
        .from('email_dispatch_log')
        .update({
            status: 'sent',
            provider_message_id: providerMessageId,
            last_error: null,
            sent_at: new Date().toISOString(),
        })
        .eq('id', dispatchId);

    if (error) {
        throw new Error('Failed to mark email dispatch sent: ' + error.message);
    }
}

async function markDispatchFailed(
    adminClient: ReturnType<typeof createClient>,
    dispatchId: string,
    message: string,
) {
    const { error } = await adminClient
        .from('email_dispatch_log')
        .update({
            status: 'failed',
            last_error: message,
        })
        .eq('id', dispatchId);

    if (error) {
        throw new Error('Failed to mark email dispatch failed: ' + error.message);
    }
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // --- AUTH CHECK ---
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! }
                }
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return jsonResponse({ error: 'Unauthorized' }, 401)
        }

        const reqData = await req.json()
        const action = reqData?.action as EmailAction | undefined
        const actionData = (reqData?.actionData ?? {}) as Record<string, unknown>
        const validActions: EmailAction[] = ['proposal_accepted', 'payment_received', 'new_proposal', 'dispute_opened'];

        if (!action || !validActions.includes(action)) {
            return jsonResponse({ error: 'A recognized action is required' }, 400)
        }

        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const payloads = await buildEmailPayloads(adminClient, user.id, action, actionData);

        if (payloads.length === 0) {
            return jsonResponse({ error: 'No email payloads generated' }, 400)
        }

        let sentCount = 0;
        let skippedCount = 0;

        for (const payload of payloads) {
            if (!isValidEmail(payload.to)) {
                return jsonResponse({ error: `Invalid email address: ${payload.to}` }, 400)
            }
            if (payload.subject.length > 200) {
                return jsonResponse({ error: 'Subject must be under 200 characters' }, 400)
            }
            if (payload.html.length > 50000) {
                return jsonResponse({ error: 'HTML body must be under 50,000 characters' }, 400)
            }

            const dispatch = await checkAndLogDispatch(adminClient, payload, user.id);
            if (dispatch.mode === 'skip') {
                console.log('[SendEmail] Skipping email action:', payload.logAction, 'to:', payload.to, 'reason:', dispatch.reason)
                skippedCount++;
                continue;
            }

            console.log('[SendEmail] Sending action email from user:', user.id, 'to:', payload.to, 'action:', action)
            try {
                const providerResult = await resend.emails.send({
                    from: 'WorkedIn <noreply@workedin.tn>',
                    to: [payload.to],
                    subject: payload.subject,
                    html: payload.html,
                })

                const providerMessageId =
                    typeof providerResult?.id === 'string'
                        ? providerResult.id
                        : null;

                await markDispatchSent(adminClient, dispatch.dispatchId, providerMessageId);
                sentCount++;
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Email provider send failed';
                await markDispatchFailed(adminClient, dispatch.dispatchId, message);
                throw error;
            }
        }

        return jsonResponse({ success: true, count: sentCount, skipped: skippedCount })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        console.error('[SendEmail] Error:', message)
        return jsonResponse({ error: message }, 500)
    }
})

