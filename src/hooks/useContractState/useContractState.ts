import { logger } from '@/lib/logger';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { ContractStatus } from '@/types';
import {
    canClientAcceptForStatus,
    canFreelancerDeliverForStatus,
    canOpenDisputeForStatus,
    hasRecordedDeliveryEvidence,
} from '@/lib/contractWorkflow';
import type { ContractData, UseContractStateOptions, UseContractStateReturn } from './types';
import {
    deliverWork as deliverWorkAction,
    acceptWork as acceptWorkAction,
    requestChanges as requestChangesAction,
    openDispute as openDisputeAction,
    holdClearancePayment as holdClearancePaymentAction,
    cancelContract as cancelContractAction,
    deliverMilestoneWork as deliverMilestoneWorkAction,
    acceptMilestoneWork as acceptMilestoneWorkAction,
    holdMilestoneClearance as holdMilestoneClearanceAction,
} from './contractActions';

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

    const setContract = useCallback((updater: (current: ContractData | null) => ContractData | null) => {
        if (passedSetContract) {
            passedSetContract(updater as never);
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
            setContract(() => data as ContractData);
        } catch (err) {
            logger.error('Error fetching contract:', err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [contractId]);

    const invalidateQueries = useMemo(() => {
        if (!queryClient) return undefined;
        return async () => {
            await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
        };
    }, [queryClient, contractId]);

    const ctx = useMemo(() => {
        if (!contract) return null;
        return {
            contract,
            contractId,
            userId,
            userRole,
            setContract,
            invalidateQueries,
        };
    }, [contract, contractId, userId, userRole, setContract, invalidateQueries]);

    const deliverWork: UseContractStateReturn['deliverWork'] = useCallback(
        async (note, reviewAssets = [], finalAssets = [], links = []) => {
            if (!ctx) throw new Error('No contract loaded');
            setIsDelivering(true);
            try {
                await deliverWorkAction(ctx, note, reviewAssets, finalAssets, links);
            } finally {
                setIsDelivering(false);
            }
        },
        [ctx],
    );

    const acceptWork: UseContractStateReturn['acceptWork'] = useCallback(
        async () => {
            if (!ctx) throw new Error('No contract loaded');
            setIsAccepting(true);
            try {
                await acceptWorkAction(ctx);
            } finally {
                setIsAccepting(false);
            }
        },
        [ctx],
    );

    const requestChanges: UseContractStateReturn['requestChanges'] = useCallback(
        async (feedback) => {
            if (!ctx) throw new Error('No contract loaded');
            await requestChangesAction(ctx, feedback);
        },
        [ctx],
    );

    const openDispute: UseContractStateReturn['openDispute'] = useCallback(
        async (reason) => {
            if (!ctx) throw new Error('No contract loaded');
            setIsDisputing(true);
            try {
                await openDisputeAction(ctx, reason);
            } finally {
                setIsDisputing(false);
            }
        },
        [ctx],
    );

    const holdClearancePayment: UseContractStateReturn['holdClearancePayment'] = useCallback(
        async (reason) => {
            if (!ctx) throw new Error('No contract loaded');
            await holdClearancePaymentAction(ctx, reason);
        },
        [ctx],
    );

    const cancelContract: UseContractStateReturn['cancelContract'] = useCallback(
        async (reason) => {
            if (!ctx) throw new Error('No contract loaded');
            setIsCancelling(true);
            try {
                await cancelContractAction(ctx, reason);
            } finally {
                setIsCancelling(false);
            }
        },
        [ctx],
    );

    const deliverMilestoneWork: UseContractStateReturn['deliverMilestoneWork'] = useCallback(
        async (milestoneId, note, reviewAssets = [], finalAssets = [], links = []) => {
            if (!ctx) throw new Error('No contract loaded');
            setIsDelivering(true);
            try {
                await deliverMilestoneWorkAction(ctx, milestoneId, note, reviewAssets, finalAssets, links);
            } finally {
                setIsDelivering(false);
            }
        },
        [ctx],
    );

    const acceptMilestoneWork: UseContractStateReturn['acceptMilestoneWork'] = useCallback(
        async (milestoneId) => {
            if (!ctx) throw new Error('No contract loaded');
            setIsAccepting(true);
            try {
                await acceptMilestoneWorkAction(ctx, milestoneId);
            } finally {
                setIsAccepting(false);
            }
        },
        [ctx],
    );

    const holdMilestoneClearance: UseContractStateReturn['holdMilestoneClearance'] = useCallback(
        async (milestoneId, reason) => {
            if (!ctx) throw new Error('No contract loaded');
            await holdMilestoneClearanceAction(ctx, milestoneId, reason);
        },
        [ctx],
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
