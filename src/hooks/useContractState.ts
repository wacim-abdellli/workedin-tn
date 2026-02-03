import { logger } from '@/lib/logger';
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
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
}

interface UseContractStateReturn {
    contract: ContractData | null;
    isLoading: boolean;
    error: Error | null;
    // Actions
    deliverWork: (note: string) => Promise<void>;
    acceptWork: () => Promise<void>;
    requestChanges: (feedback: string) => Promise<void>;
    openDispute: (reason: string) => Promise<void>;
    // Status helpers
    canDeliver: boolean;
    canAccept: boolean;
    canDispute: boolean;
    isDelivering: boolean;
    isAccepting: boolean;
    isDisputing: boolean;
    // Fetch
    refresh: () => Promise<void>;
}

// Valid state transitions
const VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
    active: ['completed', 'disputed'],
    completed: [],
    cancelled: [],
    disputed: ['active', 'cancelled'],
};

export function useContractState({
    contractId,
    userId,
    userRole,
}: UseContractStateOptions): UseContractStateReturn {
    const [contract, setContract] = useState<ContractData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isDelivering, setIsDelivering] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDisputing, setIsDisputing] = useState(false);

    // Fetch contract data
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

    // Validate state transition
    const canTransition = useCallback(
        (to: ContractStatus): boolean => {
            if (!contract) return false;
            return VALID_TRANSITIONS[contract.status]?.includes(to) || false;
        },
        [contract]
    );

    // Update contract status
    const updateStatus = useCallback(
        async (
            newStatus: ContractStatus,
            additionalData: Partial<ContractData> = {}
        ) => {
            if (!contract || !canTransition(newStatus)) {
                throw new Error('انتقال الحالة غير صالح');
            }

            const { error: updateError } = await supabase
                .from('contracts')
                .update({
                    status: newStatus,
                    ...additionalData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', contractId);

            if (updateError) throw updateError;

            // Optimistic update
            setContract({
                ...contract,
                status: newStatus,
                ...additionalData,
            });
        },
        [contract, contractId, canTransition]
    );

    // Deliver work (freelancer action)
    const deliverWork = useCallback(
        async (note: string) => {
            if (userRole !== 'freelancer') {
                throw new Error('فقط الموظف يمكنه تسليم العمل');
            }

            setIsDelivering(true);
            try {
                // Insert delivery message
                await supabase.from('messages').insert({
                    contract_id: contractId,
                    sender_id: userId,
                    content: `📦 تم تسليم العمل: ${note}`,
                    message_type: 'delivery',
                });

                // Update contract
                await supabase
                    .from('contracts')
                    .update({
                        delivery_note: note,
                        payment_status: 'pending',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', contractId);

                await refresh();
            } finally {
                setIsDelivering(false);
            }
        },
        [contractId, userId, userRole, refresh]
    );

    // Accept work and release payment (client action)
    const acceptWork = useCallback(async () => {
        if (userRole !== 'client') {
            throw new Error('فقط العميل يمكنه قبول العمل');
        }

        setIsAccepting(true);
        try {
            await updateStatus('completed', {
                payment_status: 'released',
                completed_at: new Date().toISOString(),
            });

            // Insert completion message
            await supabase.from('messages').insert({
                contract_id: contractId,
                sender_id: userId,
                content: '✅ تم قبول العمل وإتمام الدفع',
                message_type: 'system',
            });
        } finally {
            setIsAccepting(false);
        }
    }, [contractId, userId, userRole, updateStatus]);

    // Request changes (client action)
    const requestChanges = useCallback(
        async (feedback: string) => {
            if (userRole !== 'client') {
                throw new Error('فقط العميل يمكنه طلب تعديلات');
            }

            // Insert feedback message
            await supabase.from('messages').insert({
                contract_id: contractId,
                sender_id: userId,
                content: `🔄 طلب تعديلات: ${feedback}`,
                message_type: 'feedback',
            });
        },
        [contractId, userId, userRole]
    );

    // Open dispute
    const openDispute = useCallback(
        async (reason: string) => {
            setIsDisputing(true);
            try {
                await updateStatus('disputed', {
                    dispute_reason: reason,
                });

                // Insert dispute message
                await supabase.from('messages').insert({
                    contract_id: contractId,
                    sender_id: userId,
                    content: `⚠️ تم فتح نزاع: ${reason}`,
                    message_type: 'dispute',
                });
            } finally {
                setIsDisputing(false);
            }
        },
        [contractId, userId, updateStatus]
    );

    // Permission helpers
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
