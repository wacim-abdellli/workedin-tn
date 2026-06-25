import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { sendContractMessage } from '@/services/messages';
import { releaseEscrow, refundEscrow } from '@/services/dhmad';
import type { ContractStatus } from '@/types';
import {
    canClientAcceptForStatus,
    canClientRequestChangesForStatus,
    canFreelancerDeliverForStatus,
    canOpenDisputeForStatus,
    hasRecordedDeliveryEvidence,
} from '@/lib/contractWorkflow';
import type { ContractData } from './types';
import { getCounterpartyId } from './utils';

type SetContract = (updater: (current: ContractData | null) => ContractData | null) => void;

type InvalidateQueries = () => Promise<void>;

type ActionContext = {
    contract: ContractData;
    contractId: string;
    userId: string;
    userRole: 'client' | 'freelancer';
    setContract: SetContract;
    invalidateQueries?: InvalidateQueries;
};

function createQueryInvalidator(
    queryClient: import('@tanstack/react-query').QueryClient | undefined,
    contractId: string,
): InvalidateQueries | undefined {
    if (!queryClient) return undefined;
    return async () => {
        await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    };
}

// ─── deliverWork ─────────────────────────────────────────────────────────────

export async function deliverWork(
    ctx: ActionContext,
    note: string,
    reviewAssets: Array<Record<string, string>> = [],
    finalAssets: Array<Record<string, string>> = [],
    links: Array<Record<string, unknown>> = [],
): Promise<void> {
    const { contract, contractId, userId, userRole, setContract, invalidateQueries } = ctx;

    if (userRole !== 'freelancer') {
        throw new Error('Only freelancers can deliver work');
    }
    if (!canFreelancerDeliverForStatus(contract.status)) {
        throw new Error('This contract is not ready for delivery');
    }

    const receiverId = getCounterpartyId(contract, userRole);
    if (!receiverId) throw new Error('Unable to determine message recipient');

    const trimmedNote = note.trim();
    const deliveryMessage = trimmedNote
        ? `[[delivery]] ${trimmedNote}`
        : '[[delivery]]';

    const nextDeliveryNote = trimmedNote || 'submitted';

    const { data: deliveryResult, error: deliveryError } = await supabase.rpc('submit_contract_delivery_atomic', {
        p_contract_id: contractId,
        p_delivery_note: nextDeliveryNote,
        p_review_assets: reviewAssets,
        p_final_assets: finalAssets,
        p_delivery_links: links,
    });

    if (deliveryError) throw deliveryError;

    const { error: messageError } = await sendContractMessage({
        contract_id: contractId,
        sender_id: userId,
        receiver_id: receiverId,
        content: deliveryMessage,
        message_type: 'delivery',
    });

    if (messageError) throw messageError;

    setContract((current) => current ? {
        ...current,
        status: String(deliveryResult?.status || current.status) as ContractStatus,
        delivery_note: String(deliveryResult?.delivery_note || nextDeliveryNote),
    } : current);

    if (invalidateQueries) await invalidateQueries();
}

// ─── acceptWork ──────────────────────────────────────────────────────────────

export async function acceptWork(
    ctx: ActionContext,
): Promise<void> {
    const { contract, contractId, userId, userRole, setContract, invalidateQueries } = ctx;

    if (userRole !== 'client') {
        throw new Error('Only clients can accept work');
    }
    const hasEvidence = hasRecordedDeliveryEvidence(contract.delivery_note) || contract.status === 'delivery_submitted';
    if (!canClientAcceptForStatus(contract.status, hasEvidence)) {
        throw new Error('Work must be delivered before it can be accepted');
    }

    const receiverId = getCounterpartyId(contract, userRole);
    if (!receiverId) throw new Error('Unable to determine message recipient');

    let resolvedEscrowId = contract.dhmad_escrow_id;
    if (import.meta.env.DEV && !resolvedEscrowId) {
        const mockId = `dhmad_mock_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
        const { error: updateError } = await supabase
            .from('contracts')
            .update({ dhmad_escrow_id: mockId })
            .eq('id', contractId);

        if (updateError) {
            logger.error('[DEV] Failed to auto-fund contract:', updateError);
        } else {
            logger.info('[DEV] Auto-funded contract for release bypass:', mockId);
            resolvedEscrowId = mockId;
        }
    }

    if (resolvedEscrowId) {
        try {
            await releaseEscrow(resolvedEscrowId, contractId);
        } catch (err) {
            logger.error('Failed to release Dhmad escrow:', err);
            throw new Error('payment.releaseFailed');
        }
    } else {
        logger.warn('[acceptWork] No dhmad_escrow_id found — skipping Dhmad API call. Payment will be processed via DB RPC only.');
    }

    const { error: releaseError } = await supabase.rpc('release_contract_payment_atomic', {
        p_contract_id: contractId,
    });

    if (releaseError) throw releaseError;

    setContract(current => current ? {
        ...current,
        status: 'completed',
        payment_status: 'in_escrow',
        escrow_pending_clearance_until: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        completed_at: current.completed_at || new Date().toISOString(),
    } : current);

    if (invalidateQueries) await invalidateQueries();

    const { error: messageError } = await sendContractMessage({
        contract_id: contractId,
        sender_id: userId,
        receiver_id: receiverId,
        content: 'Work has been accepted and payment released',
        message_type: 'system',
    });

    if (messageError) throw messageError;
}

// ─── requestChanges ──────────────────────────────────────────────────────────

export async function requestChanges(
    ctx: ActionContext,
    feedback: string,
): Promise<void> {
    const { contract, contractId, userId, userRole, setContract, invalidateQueries } = ctx;

    if (userRole !== 'client') {
        throw new Error('Only clients can request changes');
    }
    const hasEvidence = hasRecordedDeliveryEvidence(contract.delivery_note) || contract.status === 'delivery_submitted';
    if (!canClientRequestChangesForStatus(contract.status, hasEvidence)) {
        throw new Error('Changes can only be requested after a delivery is submitted');
    }
    if ((contract.revision_requests_count ?? 0) >= (contract.max_revision_rounds ?? 2)) {
        throw new Error('Revision limit reached for this contract');
    }

    const { error: revisionError } = await supabase.rpc('request_contract_revision_atomic', {
        p_contract_id: contractId,
        p_reason: feedback,
    });

    if (revisionError) throw revisionError;

    setContract((current) => current ? {
        ...current,
        status: 'revision_requested',
        revision_requests_count: (current.revision_requests_count ?? 0) + 1,
    } : current);

    if (invalidateQueries) await invalidateQueries();

    const receiverId = getCounterpartyId(contract, userRole);
    if (!receiverId) throw new Error('Unable to determine message recipient');

    const { error: messageError } = await sendContractMessage({
        contract_id: contractId,
        sender_id: userId,
        receiver_id: receiverId,
        content: `Changes requested: ${feedback}`,
        message_type: 'feedback',
    });

    if (messageError) throw messageError;
}

// ─── openDispute ─────────────────────────────────────────────────────────────

export async function openDispute(
    ctx: ActionContext,
    reason: string,
): Promise<void> {
    const { contract, contractId, userId, userRole, setContract, invalidateQueries } = ctx;

    if (!canOpenDisputeForStatus(contract.status)) {
        throw new Error('A dispute cannot be opened in the current contract state');
    }

    const receiverId = getCounterpartyId(contract, userRole);
    if (!receiverId) throw new Error('Unable to determine message recipient');

    const { error: disputeError } = await supabase.rpc('open_dispute_atomic', {
        p_contract_id: contractId,
        p_reason: reason,
    });

    if (disputeError) throw disputeError;

    setContract((current) => current ? {
        ...current,
        status: 'disputed',
        dispute_reason: reason,
    } : current);

    if (invalidateQueries) await invalidateQueries();

    const { error: messageError } = await sendContractMessage({
        contract_id: contractId,
        sender_id: userId,
        receiver_id: receiverId,
        content: `Dispute opened: ${reason}`,
        message_type: 'dispute',
    });

    if (messageError) {
        logger.warn('Dispute opened but dispute message failed to send', messageError);
    }
}

// ─── holdClearancePayment ────────────────────────────────────────────────────

export async function holdClearancePayment(
    ctx: ActionContext,
    reason: string,
): Promise<void> {
    const { contract, contractId, userId, userRole, setContract, invalidateQueries } = ctx;

    if (userRole !== 'client') {
        throw new Error('Only clients can suspend clearance');
    }
    if (!contract.escrow_pending_clearance_until) {
        throw new Error('Clearance window is not active');
    }

    const receiverId = getCounterpartyId(contract, userRole);
    if (!receiverId) throw new Error('Unable to determine message recipient');

    const { error: rpcError } = await supabase.rpc('hold_clearance_payment_dispute', {
        p_contract_id: contractId,
        p_dispute_reason: reason,
    });

    if (rpcError) throw rpcError;

    setContract(current => current ? {
        ...current,
        status: 'disputed',
        escrow_hold_disputed: true,
    } : current);

    if (invalidateQueries) await invalidateQueries();

    const { error: messageError } = await sendContractMessage({
        contract_id: contractId,
        sender_id: userId,
        receiver_id: receiverId,
        content: `Clearance hold requested: ${reason}`,
        message_type: 'dispute',
    });

    if (messageError) throw messageError;
}

// ─── cancelContract ──────────────────────────────────────────────────────────

export async function cancelContract(
    ctx: ActionContext,
    reason: string,
): Promise<void> {
    const { contract, contractId, userId, userRole, setContract, invalidateQueries } = ctx;

    const cancellableStatuses: ContractStatus[] = ['pending_payment', 'active'];
    if (!cancellableStatuses.includes(contract.status)) {
        throw new Error('This contract cannot be cancelled in its current state');
    }

    const { data: result, error: rpcError } = await supabase.rpc('cancel_contract_atomic', {
        p_contract_id: contractId,
        p_reason: reason.trim() || null,
    });

    if (rpcError) throw rpcError;

    if (result?.needs_refund && result?.dhmad_escrow_id) {
        try {
            await refundEscrow(result.dhmad_escrow_id, contractId, reason.trim() || 'Contract cancelled');
        } catch (refundErr) {
            logger.error('Dhmad refund failed after contract cancellation — manual refund needed', refundErr);
        }
    }

    const receiverId = getCounterpartyId(contract, userRole);
    if (receiverId) {
        const cancellationMessage = `[[system]] Contract cancelled: ${reason.trim() || 'No reason provided'}`;
        await sendContractMessage({
            contract_id: contractId,
            sender_id: userId,
            receiver_id: receiverId,
            content: cancellationMessage,
            message_type: 'system',
        }).catch(err => logger.warn('Cancel message failed', err));
    }

    setContract(current => current ? { ...current, status: 'cancelled' as ContractStatus } : current);

    if (invalidateQueries) await invalidateQueries();
}

// ─── deliverMilestoneWork ────────────────────────────────────────────────────

export async function deliverMilestoneWork(
    ctx: ActionContext,
    milestoneId: string,
    note: string,
    reviewAssets: Array<Record<string, string>> = [],
    finalAssets: Array<Record<string, string>> = [],
    links: Array<Record<string, unknown>> = [],
): Promise<void> {
    const { contract, contractId, userId, userRole, setContract, invalidateQueries } = ctx;

    if (userRole !== 'freelancer') {
        throw new Error('Only freelancers can deliver work');
    }
    if (!canFreelancerDeliverForStatus(contract.status)) {
        throw new Error('This contract is not ready for delivery');
    }

    const receiverId = getCounterpartyId(contract, userRole);
    if (!receiverId) throw new Error('Unable to determine message recipient');

    const trimmedNote = note.trim();
    const deliveryMessage = trimmedNote
        ? `[[delivery]] Milestone Work delivered: ${trimmedNote}`
        : '[[delivery]] Milestone Work delivered and ready for review';

    const nextDeliveryNote = trimmedNote || 'submitted';

    const { data: deliveryResult, error: deliveryError } = await supabase.rpc('submit_milestone_delivery_atomic', {
        p_contract_id: contractId,
        p_milestone_id: milestoneId,
        p_delivery_note: nextDeliveryNote,
        p_review_assets: reviewAssets,
        p_final_assets: finalAssets,
        p_delivery_links: links,
    });

    if (deliveryError) throw deliveryError;

    const { error: messageError } = await sendContractMessage({
        contract_id: contractId,
        sender_id: userId,
        receiver_id: receiverId,
        content: deliveryMessage,
        message_type: 'delivery',
    });

    if (messageError) throw messageError;

    setContract((current) => {
        if (!current) return current;
        const updatedMilestones = (current.milestones || []).map((m) =>
            m.id === milestoneId ? { ...m, status: 'submitted' } : m
        );
        return {
            ...current,
            status: String(deliveryResult?.contract_status || current.status) as ContractStatus,
            delivery_note: String(deliveryResult?.delivery_note || nextDeliveryNote),
            milestones: updatedMilestones,
        };
    });

    if (invalidateQueries) await invalidateQueries();
}

// ─── acceptMilestoneWork ─────────────────────────────────────────────────────

export async function acceptMilestoneWork(
    ctx: ActionContext,
    milestoneId: string,
): Promise<void> {
    const { contract, contractId, userId, userRole, setContract, invalidateQueries } = ctx;

    if (userRole !== 'client') {
        throw new Error('Only clients can accept work');
    }

    const milestone = (contract.milestones || []).find((m) => m.id === milestoneId);
    const escrowId = milestone?.dhmad_escrow_id || contract.dhmad_escrow_id;

    if (escrowId) {
        try {
            await releaseEscrow(escrowId, contractId);
        } catch (err) {
            logger.error('Failed to release Dhmad escrow for milestone:', err);
            throw new Error('payment.releaseFailed');
        }
    } else {
        logger.warn(
            `[acceptMilestoneWork] No dhmad_escrow_id for milestone ${milestoneId} — proceeding with DB-only release.`,
        );
    }

    const receiverId = getCounterpartyId(contract, userRole);
    if (!receiverId) throw new Error('Unable to determine message recipient');

    const { data: releaseResult, error: releaseError } = await supabase.rpc('release_milestone_payment_atomic', {
        p_milestone_id: milestoneId,
    });

    if (releaseError) throw releaseError;

    setContract(current => {
        if (!current) return current;
        const updatedMilestones = (current.milestones || []).map((m) =>
            m.id === milestoneId
                ? {
                      ...m,
                      status: 'approved',
                      escrow_pending_clearance_until: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                  }
                : m
        );
        const contractCompleted = Boolean(releaseResult?.contract_completed);
        return {
            ...current,
            status: contractCompleted ? 'completed' : 'active',
            payment_status: contractCompleted ? 'released' : current.payment_status,
            completed_at: contractCompleted ? new Date().toISOString() : current.completed_at,
            milestones: updatedMilestones,
        };
    });

    if (invalidateQueries) await invalidateQueries();

    const { error: messageError } = await sendContractMessage({
        contract_id: contractId,
        sender_id: userId,
        receiver_id: receiverId,
        content: 'Milestone approved and payment released.',
        message_type: 'payment',
    });
    if (messageError) throw messageError;
}

// ─── holdMilestoneClearance ──────────────────────────────────────────────────

export async function holdMilestoneClearance(
    ctx: ActionContext,
    milestoneId: string,
    reason: string,
): Promise<void> {
    const { contract, contractId, userId, userRole, setContract, invalidateQueries } = ctx;

    if (userRole !== 'client') {
        throw new Error('Only clients can suspend clearance');
    }

    const receiverId = getCounterpartyId(contract, userRole);
    if (!receiverId) throw new Error('Unable to determine message recipient');

    const { error: rpcError } = await supabase.rpc('hold_milestone_clearance_payment', {
        p_milestone_id: milestoneId,
        p_reason: reason,
    });

    if (rpcError) throw rpcError;

    setContract(current => {
        if (!current) return current;
        const updatedMilestones = (current.milestones || []).map((m) =>
            m.id === milestoneId ? { ...m, escrow_hold_disputed: true } : m
        );
        return {
            ...current,
            status: 'disputed',
            milestones: updatedMilestones,
        };
    });

    if (invalidateQueries) await invalidateQueries();

    const { error: messageError } = await sendContractMessage({
        contract_id: contractId,
        sender_id: userId,
        receiver_id: receiverId,
        content: `Clearance hold requested for milestone: ${reason}`,
        message_type: 'dispute',
    });
    if (messageError) throw messageError;
}
