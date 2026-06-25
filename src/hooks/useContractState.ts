import { logger } from '@/lib/logger';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { sendContractMessage } from '../services/messages';
import { releaseEscrow, refundEscrow } from '../services/dhmad';
import type { ContractStatus } from '../types';
import {
    canClientAcceptForStatus,
    canClientRequestChangesForStatus,
    canFreelancerDeliverForStatus,
    canOpenDisputeForStatus,
    canTransitionContractStatus,
    hasRecordedDeliveryEvidence,
} from '../lib/contractWorkflow';

interface ContractData {
    id: string;
    job_id: string;
    freelancer_id: string;
    client_id: string;
    status: ContractStatus;
    payment_status: 'pending' | 'paid' | 'released' | 'in_escrow';
    started_at: string;
    completed_at?: string;
    delivery_note?: string;
    dispute_reason?: string;
    revision_requests_count?: number;
    max_revision_rounds?: number;
    dhmad_escrow_id?: string;
    escrow_pending_clearance_until?: string | null;
    escrow_hold_disputed?: boolean;
}

interface UseContractStateOptions {
    contractId: string;
    userId: string;
    userRole: 'client' | 'freelancer';
    queryClient?: QueryClient;
    contract?: ContractData | null;
    setContract?: React.Dispatch<React.SetStateAction<any>> | ((contract: any) => void);
}

interface UseContractStateReturn {
    contract: ContractData | null;
    isLoading: boolean;
    error: Error | null;
    deliverWork: (
        note: string, 
        reviewAssets?: Array<Record<string, string>>, 
        finalAssets?: Array<Record<string, string>>,
        links?: Array<Record<string, any>>
    ) => Promise<void>;
    acceptWork: () => Promise<void>;
    requestChanges: (feedback: string) => Promise<void>;
    openDispute: (reason: string) => Promise<void>;
    holdClearancePayment: (reason: string) => Promise<void>;
    deliverMilestoneWork: (
        milestoneId: string,
        note: string, 
        reviewAssets?: Array<Record<string, string>>, 
        finalAssets?: Array<Record<string, string>>,
        links?: Array<Record<string, any>>
    ) => Promise<void>;
    acceptMilestoneWork: (milestoneId: string) => Promise<void>;
    holdMilestoneClearance: (milestoneId: string, reason: string) => Promise<void>;
    canDeliver: boolean;
    canAccept: boolean;
    canDispute: boolean;
    canCancel: boolean;
    isDelivering: boolean;
    isAccepting: boolean;
    isDisputing: boolean;
    isCancelling: boolean;
    cancelContract: (reason: string) => Promise<void>;
    refresh: () => Promise<void>;
}

function getCounterpartyId(contract: ContractData | null, userRole: 'client' | 'freelancer') {
    if (!contract) return null;
    return userRole === 'client' ? contract.freelancer_id : contract.client_id;
}

export function useContractState({
    contractId,
    userId,
    userRole,
    queryClient,
    contract: initialContract,
    setContract: passedSetContract,
}: UseContractStateOptions): UseContractStateReturn {
    const [localContract, setLocalContract] = useState<ContractData | null>(initialContract || null);

    useEffect(() => {
        if (initialContract && !passedSetContract) {
            setLocalContract(initialContract);
        }
    }, [initialContract, passedSetContract]);

    const contract = passedSetContract ? (initialContract || null) : localContract;

    const setContract = useCallback((updater: any) => {
        if (passedSetContract) {
            passedSetContract(updater);
        } else {
            setLocalContract(updater);
        }
    }, [passedSetContract]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isDelivering, setIsDelivering] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDisputing, setIsDisputing] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const refresh = useCallback(async () => {
        if (!contractId) return;

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('contracts')
                .select('*')
                .eq('id', contractId)
                .single();

            if (fetchError) throw fetchError;
            setContract(data);
        } catch (err) {
            logger.error('Error fetching contract:', err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [contractId]);

    const canTransition = useCallback(
        (to: ContractStatus): boolean => {
            if (!contract) return false;
            return canTransitionContractStatus(contract.status, to);
        },
        [contract]
    );

    const _updateStatus = useCallback(
        async (
            newStatus: ContractStatus,
            additionalData: Partial<ContractData> = {}
        ) => {
            if (!contract || !canTransition(newStatus)) {
                throw new Error('Invalid status transition');
            }

            const { data, error: updateError } = await supabase
                .from('contracts')
                .update({
                    status: newStatus,
                    ...additionalData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', contractId)
                .eq('status', contract.status)
                .select();

            if (updateError) throw updateError;
            if (!data || data.length === 0) {
                throw new Error('Contract status changed during operation. Please refresh the page.');
            }

            setContract({
                ...contract,
                status: newStatus,
                ...additionalData,
            });

            if (queryClient) {
                await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
            }
        },
        [contract, contractId, canTransition, queryClient]
    );

    const deliverWork = useCallback(
        async (
            note: string, 
            reviewAssets: Array<Record<string, string>> = [], 
            finalAssets: Array<Record<string, string>> = [],
            links: Array<Record<string, any>> = []
        ) => {
            if (userRole !== 'freelancer') {
                throw new Error('Only freelancers can deliver work');
            }
            if (!contract || !canFreelancerDeliverForStatus(contract.status)) {
                throw new Error('This contract is not ready for delivery');
            }

            setIsDelivering(true);
            try {
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

                if (queryClient) {
                    await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
                }
            } finally {
                setIsDelivering(false);
            }
        },
        [contract, contractId, queryClient, userId, userRole]
    );

    const acceptWork = useCallback(
        async () => {
            if (userRole !== 'client') {
                throw new Error('Only clients can accept work');
            }
            const hasEvidence = hasRecordedDeliveryEvidence(contract.delivery_note) || contract.status === 'delivery_submitted';
            if (!contract || !canClientAcceptForStatus(contract.status, hasEvidence)) {
                throw new Error('Work must be delivered before it can be accepted');
            }

            setIsAccepting(true);
            try {
                const receiverId = getCounterpartyId(contract, userRole);
                if (!receiverId) throw new Error('Unable to determine message recipient');

                // DEV auto-funding / escrow id bypass
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

                // If this contract has a Dhmad escrow, release it via Dhmad API.
                // The webhook will eventually confirm, but we also run the RPC
                // below to optimistically complete it in the DB immediately.
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

                if (queryClient) {
                    await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
                }

                const { error: messageError } = await sendContractMessage({
                    contract_id: contractId,
                    sender_id: userId,
                    receiver_id: receiverId,
                    content: 'Work has been accepted and payment released',
                    message_type: 'system',
                });

                if (messageError) throw messageError;
            } finally {
                setIsAccepting(false);
            }
        },
        [contract, contractId, userId, userRole, queryClient]
    );

    const requestChanges = useCallback(
        async (feedback: string) => {
            if (userRole !== 'client') {
                throw new Error('Only clients can request changes');
            }
            const hasEvidence = hasRecordedDeliveryEvidence(contract.delivery_note) || contract.status === 'delivery_submitted';
            if (!contract || !canClientRequestChangesForStatus(contract.status, hasEvidence)) {
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

            if (queryClient) {
                await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
            }

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
        },
        [contract, contractId, queryClient, userId, userRole]
    );

    const openDispute = useCallback(
        async (reason: string) => {
            if (!contract || !canOpenDisputeForStatus(contract.status)) {
                throw new Error('A dispute cannot be opened in the current contract state');
            }

            setIsDisputing(true);
            try {
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

                if (queryClient) {
                    await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
                }

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
            } finally {
                setIsDisputing(false);
            }
        },
        [contract, contractId, queryClient, userId, userRole]
    );

    const holdClearancePayment = useCallback(
        async (reason: string) => {
            if (userRole !== 'client') {
                throw new Error('Only clients can suspend clearance');
            }
            if (!contract || !contract.escrow_pending_clearance_until) {
                throw new Error('Clearance window is not active');
            }

            try {
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

                if (queryClient) {
                    await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
                }

                const { error: messageError } = await sendContractMessage({
                    contract_id: contractId,
                    sender_id: userId,
                    receiver_id: receiverId,
                    content: `Clearance hold requested: ${reason}`,
                    message_type: 'dispute',
                });

                if (messageError) throw messageError;
            } catch (err) {
                logger.error('Failed to suspend payment clearance:', err);
                throw err;
            }
        },
        [contract, contractId, userId, userRole, queryClient]
    );

    const cancelContract = useCallback(
        async (reason: string) => {
            if (!contract) throw new Error('No contract loaded');

            const cancellableStatuses: ContractStatus[] = ['pending_payment', 'active'];
            if (!cancellableStatuses.includes(contract.status)) {
                throw new Error('This contract cannot be cancelled in its current state');
            }

            setIsCancelling(true);
            try {
                const { data: result, error: rpcError } = await supabase.rpc('cancel_contract_atomic', {
                    p_contract_id: contractId,
                    p_reason: reason.trim() || null,
                });

                if (rpcError) throw rpcError;

                // If escrow was funded, trigger Dhmad refund
                if (result?.needs_refund && result?.dhmad_escrow_id) {
                    try {
                        await refundEscrow(result.dhmad_escrow_id, contractId, reason.trim() || 'Contract cancelled');
                    } catch (refundErr) {
                        logger.error('Dhmad refund failed after contract cancellation — manual refund needed', refundErr);
                    }
                }

                // Send cancellation message to conversation
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

                if (queryClient) {
                    await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
                }
            } finally {
                setIsCancelling(false);
            }
        },
        [contract, contractId, queryClient, userId, userRole]
    );
    const deliverMilestoneWork = useCallback(
        async (
            milestoneId: string,
            note: string,
            reviewAssets: Array<Record<string, string>> = [],
            finalAssets: Array<Record<string, string>> = [],
            links: Array<Record<string, any>> = []
        ) => {
            if (userRole !== 'freelancer') {
                throw new Error('Only freelancers can deliver work');
            }
            if (!contract || !canFreelancerDeliverForStatus(contract.status)) {
                throw new Error('This contract is not ready for delivery');
            }

            setIsDelivering(true);
            try {
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
                    const updatedMilestones = (current.milestones || []).map((m: any) =>
                        m.id === milestoneId ? { ...m, status: 'submitted' } : m
                    );
                    return {
                        ...current,
                        status: String(deliveryResult?.contract_status || current.status) as ContractStatus,
                        delivery_note: String(deliveryResult?.delivery_note || nextDeliveryNote),
                        milestones: updatedMilestones,
                    };
                });

                if (queryClient) {
                    await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
                }
            } finally {
                setIsDelivering(false);
            }
        },
        [contract, contractId, queryClient, userId, userRole]
    );

    const acceptMilestoneWork = useCallback(
        async (milestoneId: string) => {
            if (userRole !== 'client') {
                throw new Error('Only clients can accept work');
            }
            if (!contract) {
                throw new Error('Contract not loaded');
            }

            setIsAccepting(true);
            try {
                const receiverId = getCounterpartyId(contract, userRole);
                if (!receiverId) throw new Error('Unable to determine message recipient');

                const milestone = (contract.milestones || []).find((m: any) => m.id === milestoneId);
                // Use milestone-specific escrow if available, fall back to contract-level escrow
                const escrowId = milestone?.dhmad_escrow_id || contract.dhmad_escrow_id;

                if (escrowId) {
                    try {
                        await releaseEscrow(escrowId, contractId);
                    } catch (err) {
                        logger.error('Failed to release Dhmad escrow for milestone:', err);
                        throw new Error('payment.releaseFailed');
                    }
                } else {
                    // No escrow ID available — sandbox/dev path or milestone not yet funded via Dhmad.
                    // Log a warning and proceed with the DB RPC only (funds tracked internally).
                    logger.warn(
                        `[acceptMilestoneWork] No dhmad_escrow_id for milestone ${milestoneId} — proceeding with DB-only release. In production, milestones must have their own Dhmad escrow created before approval.`
                    );
                }

                const { data: releaseResult, error: releaseError } = await supabase.rpc('release_milestone_payment_atomic', {
                    p_milestone_id: milestoneId,
                });

                if (releaseError) throw releaseError;

                setContract(current => {
                    if (!current) return current;
                    const updatedMilestones = (current.milestones || []).map((m: any) =>
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

                if (queryClient) {
                    await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
                }

                const { error: messageError } = await sendContractMessage({
                    contract_id: contractId,
                    sender_id: userId,
                    receiver_id: receiverId,
                    content: `Milestone approved and payment released.`,
                    message_type: 'payment',
                });
                if (messageError) throw messageError;
            } finally {
                setIsAccepting(false);
            }
        },
        [contract, contractId, queryClient, userId, userRole]
    );

    const holdMilestoneClearance = useCallback(
        async (milestoneId: string, reason: string) => {
            if (userRole !== 'client') {
                throw new Error('Only clients can suspend clearance');
            }
            if (!contract) {
                throw new Error('Contract not loaded');
            }

            try {
                const receiverId = getCounterpartyId(contract, userRole);
                if (!receiverId) throw new Error('Unable to determine message recipient');

                const { error: rpcError } = await supabase.rpc('hold_milestone_clearance_payment', {
                    p_milestone_id: milestoneId,
                    p_reason: reason,
                });

                if (rpcError) throw rpcError;

                setContract(current => {
                    if (!current) return current;
                    const updatedMilestones = (current.milestones || []).map((m: any) =>
                        m.id === milestoneId ? { ...m, escrow_hold_disputed: true } : m
                    );
                    return {
                        ...current,
                        status: 'disputed',
                        milestones: updatedMilestones,
                    };
                });

                if (queryClient) {
                    await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
                }

                const { error: messageError } = await sendContractMessage({
                    contract_id: contractId,
                    sender_id: userId,
                    receiver_id: receiverId,
                    content: `Clearance hold requested for milestone: ${reason}`,
                    message_type: 'dispute',
                });
                if (messageError) throw messageError;
            } catch (err) {
                logger.error('Failed to suspend milestone payment clearance:', err);
                throw err;
            }
        },
        [contract, contractId, queryClient, userId, userRole]
    );

    const canDeliver = useMemo(() => userRole === 'freelancer' && canFreelancerDeliverForStatus(contract?.status), [userRole, contract?.status]);
    const canAccept = useMemo(() => userRole === 'client' && canClientAcceptForStatus(
        contract?.status,
        hasRecordedDeliveryEvidence(contract?.delivery_note) || contract?.status === 'delivery_submitted'
    ), [userRole, contract?.status, contract?.delivery_note]);
    const canDispute = useMemo(() => canOpenDisputeForStatus(contract?.status), [contract?.status]);
    const canCancel = useMemo(() => !!contract && ['pending_payment', 'active'].includes(contract.status), [contract]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return {
        contract,
        isLoading,
        error,
        deliverWork,
        acceptWork,
        requestChanges,
        openDispute,
        cancelContract,
        holdClearancePayment,
        deliverMilestoneWork,
        acceptMilestoneWork,
        holdMilestoneClearance,
        canDeliver,
        canAccept,
        canDispute,
        canCancel,
        isDelivering,
        isAccepting,
        isDisputing,
        isCancelling,
        refresh,
    };
}

export default useContractState;
