import type { ContractStatus } from '@/types';

export const CONTRACT_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
    pending_payment: ['active', 'cancelled', 'disputed'],
    active: ['delivery_submitted', 'cancelled', 'disputed'],
    delivery_submitted: ['active', 'revision_requested', 'completed', 'cancelled', 'disputed'],
    revision_requested: ['delivery_submitted', 'cancelled', 'disputed'],
    completed: [],
    cancelled: [],
    disputed: [],
};

export const canTransitionContractStatus = (
    currentStatus: ContractStatus | null | undefined,
    nextStatus: ContractStatus,
) => {
    if (!currentStatus) return false;
    return CONTRACT_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
};

export const hasRecordedDeliveryEvidence = (deliveryNote: string | null | undefined) => {
    return Boolean(String(deliveryNote || '').trim());
};

export const getStatusAfterDelivery = (status: ContractStatus | null | undefined): ContractStatus | null => {
    if (status === 'active' || status === 'revision_requested') return 'delivery_submitted';
    return null;
};

export const canFreelancerDeliverForStatus = (status: ContractStatus | null | undefined) => {
    return status === 'active' || status === 'revision_requested';
};

export const canClientAcceptForStatus = (
    status: ContractStatus | null | undefined,
    hasDeliveryEvidence: boolean,
) => {
    return status === 'delivery_submitted' && hasDeliveryEvidence;
};

export const canClientRequestChangesForStatus = (
    status: ContractStatus | null | undefined,
    hasDeliveryEvidence: boolean,
) => {
    return status === 'delivery_submitted' && hasDeliveryEvidence;
};

export const canOpenDisputeForStatus = (status: ContractStatus | null | undefined) => {
    return status === 'pending_payment' || status === 'active' || status === 'delivery_submitted' || status === 'revision_requested';
};
