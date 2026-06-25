import { supabase } from '@/lib/supabase';
import type { ContractRow } from './types';

const CONTRACT_SELECT_COLUMNS = [
    'id, proposal_id, status, title, amount, total_amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id, escrow_pending_clearance_until, escrow_hold_disputed, payment_status, delivery_note, dhmad_escrow_id, dhmad_payment_url',
    'id, proposal_id, status, title, amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id, escrow_pending_clearance_until, escrow_hold_disputed, payment_status, delivery_note, dhmad_escrow_id, dhmad_payment_url',
    'id, proposal_id, status, title, amount, client_id, freelancer_id, job_id, escrow_pending_clearance_until, escrow_hold_disputed, payment_status, delivery_note, dhmad_escrow_id, dhmad_payment_url',
    'id, status, title, amount, total_amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id, escrow_pending_clearance_until, escrow_hold_disputed, payment_status, delivery_note, dhmad_escrow_id, dhmad_payment_url',
    'id, status, title, amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id, escrow_pending_clearance_until, escrow_hold_disputed, payment_status, delivery_note, dhmad_escrow_id, dhmad_payment_url',
    'id, status, title, amount, client_id, freelancer_id, job_id, escrow_pending_clearance_until, escrow_hold_disputed, payment_status, delivery_note, dhmad_escrow_id, dhmad_payment_url',
];

export async function fetchContractByColumn(
    column: 'id' | 'proposal_id' | 'job_id',
    value: string,
): Promise<{ data: ContractRow | null; error: unknown }> {
    let lastError: unknown = null;

    for (const selectColumns of CONTRACT_SELECT_COLUMNS) {
        if ((column === 'proposal_id' && !selectColumns.includes('proposal_id'))
            || (column === 'job_id' && !selectColumns.includes('job_id'))) {
            continue;
        }

        const { data, error } = await supabase
            .from('contracts')
            .select(selectColumns)
            .eq(column, value)
            .limit(1)
            .maybeSingle();

        if (!error) {
            return { data: data as ContractRow | null, error: null };
        }

        lastError = error;

        // If the error is NOT a column-mismatch issue, stop immediately
        const msg = String(error?.message ?? error ?? '').toLowerCase();
        if (!msg.includes('column') && !msg.includes('does not exist') && !msg.includes('schema cache')) {
            break;
        }
    }

    return { data: null, error: lastError };
}
