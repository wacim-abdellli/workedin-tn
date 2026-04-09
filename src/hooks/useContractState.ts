import { logger } from '@/lib/logger';
import { useState, useCallback } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { sendContractMessage } from '../services/messages';
import type { ContractStatus } from '../types';

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

const VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
    active: ['completed', 'disputed'],
    completed: [],
    cancelled: [],
    disputed: ['active', 'cancelled'],
};

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
            return VALID_TRANSITIONS[contract.status]?.includes(to) || false;
        },
        [contract]
    );

    const updateStatus = useCallback(
        async (
            newStatus: ContractStatus,
            additionalData: Partial<ContractData> = {}
        ) => {
            if (!contract || !canTransition(newStatus)) {
                throw new Error('ا� ت�ا� ا�حا�ة غ�`ر صا�ح');
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
                throw new Error('تغ�`رت حا�ة ا�ع�د أث� اء ا�ع�&��`ة�R �`رج�0 تحد�`ث ا�صفحة');
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
                throw new Error('ف�ط ا��&��ظف �`�&ْ� �! تس��`�& ا�ع�&�');
            }

            setIsDelivering(true);
            try {
                const receiverId = getCounterpartyId(contract, userRole);
                if (!receiverId) throw new Error('Unable to determine message recipient');

                await updateStatus('completed', {
                    delivery_note: note,
                    completed_at: new Date().toISOString(),
                });

                const { error: messageError } = await sendContractMessage({
                    contract_id: contractId,
                    sender_id: userId,
                    receiver_id: receiverId,
                    content: `�x� ت�& تس��`�& ا�ع�&�: ${note}`,
                    message_type: 'delivery',
                });

                if (messageError) throw messageError;
            } finally {
                setIsDelivering(false);
            }
        },
        [contract, contractId, userId, userRole, updateStatus]
    );

    const acceptWork = useCallback(
        async () => {
            if (userRole !== 'client') {
                throw new Error('ف�ط ا�ع�&�`� �`�&ْ� �! �ب��� ا�ع�&�');
            }

            setIsAccepting(true);
            try {
                const receiverId = getCounterpartyId(contract, userRole);
                if (!receiverId) throw new Error('Unable to determine message recipient');

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
                    content: '�S& ت�& �ب��� ا�ع�&� ��إت�&ا�& ا�دفع',
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
                throw new Error('ف�ط ا�ع�&�`� �`�&ْ� �! ط�ب تعد�`�ات');
            }

            const receiverId = getCounterpartyId(contract, userRole);
            if (!receiverId) throw new Error('Unable to determine message recipient');

            const { error: messageError } = await sendContractMessage({
                contract_id: contractId,
                sender_id: userId,
                receiver_id: receiverId,
                content: `�x ط�ب تعد�`�ات: ${feedback}`,
                message_type: 'feedback',
            });

            if (messageError) throw messageError;
        },
        [contract, contractId, userId, userRole]
    );

    const openDispute = useCallback(
        async (reason: string) => {
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
                    content: `�a ️ ت�& فتح � زاع: ${reason}`,
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

    const canDeliver = userRole === 'freelancer' && contract?.status === 'active';
    const canAccept = userRole === 'client' && contract?.status === 'active';
    const canDispute = contract?.status === 'active';

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
