import type { ContractStatus } from '@/types';

export type ContractMessagingStatus = ContractStatus | 'pending_payment' | 'revision_requested' | 'unknown';
export type MessagingConversationKind = 'direct' | 'contract';
export type MessagingPolicyTone = 'none' | 'info' | 'success' | 'warning' | 'danger';

export interface MessagingLifecyclePolicy {
    kind: MessagingConversationKind;
    contractStatus: ContractMessagingStatus | null;
    stateLabelFallback: string | null;
    contextLabelFallback: string;
    isReadOnly: boolean;
    canSend: boolean;
    canAttachFiles: boolean;
    canSendVoiceNotes: boolean;
    canReply: boolean;
    bannerTone: MessagingPolicyTone;
    bannerFallback: string | null;
    blockedReasonFallback: string | null;
}

interface ResolveMessagingLifecyclePolicyOptions {
    kind: MessagingConversationKind;
    contractStatus?: string | null;
}

export const normalizeContractStatus = (value: string | null | undefined): ContractMessagingStatus => {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return 'unknown';

    if (normalized === 'canceled') return 'cancelled';

    if (
        normalized === 'active'
        || normalized === 'delivery_submitted'
        || normalized === 'completed'
        || normalized === 'cancelled'
        || normalized === 'disputed'
        || normalized === 'revision_requested'
        || normalized === 'pending_payment'
    ) {
        return normalized;
    }

    return 'unknown';
};

const buildReadOnlyContractPolicy = (
    status: Extract<ContractMessagingStatus, 'completed' | 'cancelled' | 'disputed'>,
    stateLabelFallback: string,
    bannerTone: Extract<MessagingPolicyTone, 'success' | 'warning' | 'danger'>,
    bannerFallback: string,
): MessagingLifecyclePolicy => ({
    kind: 'contract',
    contractStatus: status,
    stateLabelFallback,
    contextLabelFallback: `Contract chat • ${stateLabelFallback}`,
    isReadOnly: true,
    canSend: false,
    canAttachFiles: false,
    canSendVoiceNotes: false,
    canReply: false,
    bannerTone,
    bannerFallback,
    blockedReasonFallback: bannerFallback,
});

const buildContractPolicy = (status: ContractMessagingStatus): MessagingLifecyclePolicy => {
    switch (status) {
        case 'active':
            return {
                kind: 'contract',
                contractStatus: status,
                stateLabelFallback: 'Active',
                contextLabelFallback: 'Contract chat • Active',
                isReadOnly: false,
                canSend: true,
                canAttachFiles: true,
                canSendVoiceNotes: true,
                canReply: true,
                bannerTone: 'none',
                bannerFallback: null,
                blockedReasonFallback: null,
            };
        case 'pending_payment':
            return {
                kind: 'contract',
                contractStatus: status,
                stateLabelFallback: 'Pending payment',
                contextLabelFallback: 'Contract chat • Pending payment',
                isReadOnly: false,
                canSend: true,
                canAttachFiles: true,
                canSendVoiceNotes: true,
                canReply: true,
                bannerTone: 'info',
                bannerFallback: 'Payment pending.',
                blockedReasonFallback: null,
            };
        case 'delivery_submitted':
            return {
                kind: 'contract',
                contractStatus: status,
                stateLabelFallback: 'Under review',
                contextLabelFallback: 'Contract chat • Under review',
                isReadOnly: false,
                canSend: true,
                canAttachFiles: true,
                canSendVoiceNotes: true,
                canReply: true,
                bannerTone: 'none',
                bannerFallback: 'Delivery submitted.',
                blockedReasonFallback: null,
            };
        case 'revision_requested':
            return {
                kind: 'contract',
                contractStatus: status,
                stateLabelFallback: 'Revision requested',
                contextLabelFallback: 'Contract chat • Revision requested',
                isReadOnly: false,
                canSend: true,
                canAttachFiles: true,
                canSendVoiceNotes: true,
                canReply: true,
                bannerTone: 'info',
                bannerFallback: 'Revision requested.',
                blockedReasonFallback: null,
            };
        case 'disputed':
            return buildReadOnlyContractPolicy(
                status,
                'Disputed',
                'warning',
                'Contract under dispute. Chat locked.',
            );
        case 'completed':
            return buildReadOnlyContractPolicy(
                status,
                'Completed',
                'success',
                'Contract completed. Thread is read-only.',
            );
        case 'cancelled':
            return buildReadOnlyContractPolicy(
                status,
                'Cancelled',
                'danger',
                'Contract cancelled. Thread is read-only.',
            );
        case 'unknown':
        default:
            return {
                kind: 'contract',
                contractStatus: 'unknown',
                stateLabelFallback: null,
                contextLabelFallback: 'Contract chat',
                isReadOnly: false,
                canSend: true,
                canAttachFiles: true,
                canSendVoiceNotes: true,
                canReply: true,
                bannerTone: 'info',
                bannerFallback: 'Contract status unavailable.',
                blockedReasonFallback: null,
            };
    }
};

export const resolveMessagingLifecyclePolicy = ({
    kind,
    contractStatus,
}: ResolveMessagingLifecyclePolicyOptions): MessagingLifecyclePolicy => {
    if (kind === 'direct') {
        return {
            kind: 'direct',
            contractStatus: null,
            stateLabelFallback: null,
            contextLabelFallback: 'Direct chat',
            isReadOnly: false,
            canSend: true,
            canAttachFiles: true,
            canSendVoiceNotes: true,
            canReply: true,
            bannerTone: 'none',
            bannerFallback: null,
            blockedReasonFallback: null,
        };
    }

    return buildContractPolicy(normalizeContractStatus(contractStatus));
};
