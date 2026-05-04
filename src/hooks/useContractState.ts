import { logger } from '@/lib/logger';
import { useState, useCallback, useEffect } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { sendContractMessage } from '../services/messages';
import { releaseEscrow } from '../services/dhmad';
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
    payment_status: 'pending' | 'paid' | 'released';
    started_at: string;
    completed_at?: string;
    delivery_note?: string;
    dispute_reason?: string;
    revision_requests_count?: number;
    max_revision_rounds?: number;
    dhmad_escrow_id?: string;
}

interface UseContractStateOptions {
    contractId: string;
    userId: string;
    userRole: 'client' | 'freelancer';
    queryClient?: QueryClient;
}

interface UseContractStateReturn {
    contract: ContractData | null;
    isLoading: boolean;
    error: Error | null;
    deliverWork: (note: string) => Promise<void>;
    acceptWork: () => Promise<void>;
    requestChanges: (feedback: string) => Promise<void>;
    openDispute: (reason: string) => Promise<void>;
    canDeliver: boolean;
    canAccept: boolean;
    canDispute: boolean;
    isDelivering: boolean;
    isAccepting: boolean;
    isDisputing: boolean;
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
}: UseContractStateOptions): UseContractStateReturn {
    const [contract, setContract] = useState<ContractData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isDelivering, setIsDelivering] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDisputing, setIsDisputing] = useState(false);

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

    const updateStatus = useCallback(
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
        async (note: string) => {
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
                    : '[[delivery]] Work delivered and ready for review';

                const nextDeliveryNote = trimmedNote || 'submitted';

                const { data: deliveryResult, error: deliveryError } = await supabase.rpc('submit_contract_delivery_atomic', {
                    p_contract_id: contractId,
                    p_delivery_note: nextDeliveryNote,
                    p_review_assets: [],
                    p_final_assets: [],
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
            if (!contract || !canClientAcceptForStatus(contract.status, hasRecordedDeliveryEvidence(contract.delivery_note))) {
                throw new Error('Work must be delivered before it can be accepted');
            }

            setIsAccepting(true);
            try {
                const receiverId = getCounterpartyId(contract, userRole);
                if (!receiverId) throw new Error('Unable to determine message recipient');

                // If this contract has a Dhmad escrow, release it via Dhmad API.
                // The webhook will eventually confirm, but we also run the RPC
                // below to optimisticly complete it in the DB immediately.
                if (contract.dhmad_escrow_id) {
                    try {
                        await releaseEscrow(contract.dhmad_escrow_id, contractId);
                    } catch (err) {
                        logger.error('Failed to release Dhmad escrow:', err);
                        throw new Error('فشل تحرير الدفعة. يرجى المحاولة مرة أخرى.');
                    }
                }

                const { error: releaseError } = await supabase.rpc('release_contract_payment_atomic', {
                    p_contract_id: contractId,
                });

                if (releaseError) throw releaseError;

                setContract(current => current ? {
                    ...current,
                    status: 'completed',
                    payment_status: 'released',
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
            if (!contract || !canClientRequestChangesForStatus(contract.status, hasRecordedDeliveryEvidence(contract.delivery_note))) {
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

    const canDeliver = userRole === 'freelancer' && canFreelancerDeliverForStatus(contract?.status);
    const canAccept = userRole === 'client' && canClientAcceptForStatus(contract?.status, hasRecordedDeliveryEvidence(contract?.delivery_note));
    const canDispute = canOpenDisputeForStatus(contract?.status);

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
        canDeliver,
        canAccept,
        canDispute,
        isDelivering,
        isAccepting,
        isDisputing,
        refresh,
    };
}

export default useContractState;
