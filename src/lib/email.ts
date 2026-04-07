/**
 * Email notification helper — calls the send-email Edge Function.
 * Only fires in production; silently skips in dev to avoid noise.
 * Never throws — email failure must never break the main flow.
 */
import { supabase } from './supabase';

type EmailAction =
    | 'proposal_accepted'
    | 'payment_received'
    | 'new_proposal'
    | 'dispute_opened';

async function invokeEmailAction(action: EmailAction, actionData: Record<string, unknown>): Promise<void> {
    try {
        const { error } = await supabase.functions.invoke('send-email', {
            body: { action, actionData },
        });
        if (error) console.warn('[email] send failed:', error.message);
    } catch (err) {
        console.warn('[email] send error:', err);
    }
}

export async function sendProposalAcceptedEmail(
    contractId: string,
): Promise<void> {
    await invokeEmailAction('proposal_accepted', { contractId });
}

export async function sendPaymentReceivedEmail(
    contractId: string,
): Promise<void> {
    await invokeEmailAction('payment_received', { contractId });
}

export async function sendNewProposalEmail(
    jobId: string,
): Promise<void> {
    await invokeEmailAction('new_proposal', { jobId });
}

export async function sendDisputeOpenedEmail(
    contractId: string,
): Promise<void> {
    await invokeEmailAction('dispute_opened', { contractId });
}
