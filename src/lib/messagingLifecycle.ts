import type { ContractStatus } from '@/types';

export type ContractMessagingStatus = ContractStatus | 'pending_payment' | 'unknown';
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
        || normalized === 'completed'
        || normalized === 'cancelled'
        || normalized === 'disputed'
        || normalized === 'pending_payment'
    ) {
        return normalized;
    }

    return 'unknown';
};

const buildReadOnlyContractPolicy = (
    status: Extract<ContractMessagingStatus, 'completed' | 'cancelled'>,
    stateLabelFallback: string,
    bannerTone: Extract<MessagingPolicyTone, 'success' | 'danger'>,
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
                bannerFallback: 'Payment is still being confirmed for this contract. Messaging remains open.',
                blockedReasonFallback: null,
            };
        case 'disputed':
            return {
                kind: 'contract',
                contractStatus: status,
                stateLabelFallback: 'Disputed',
                contextLabelFallback: 'Contract chat • Disputed',
                isReadOnly: false,
                canSend: true,
                canAttachFiles: true,
                canSendVoiceNotes: true,
                canReply: true,
                bannerTone: 'warning',
                bannerFallback: 'This contract is under dispute. Keep all messages focused on resolution details.',
                blockedReasonFallback: null,
            };
        case 'completed':
            return buildReadOnlyContractPolicy(
                status,
                'Completed',
                'success',
                'This contract is completed. The thread is now read-only.',
            );
        case 'cancelled':
            return buildReadOnlyContractPolicy(
                status,
                'Cancelled',
                'danger',
                'This contract was cancelled. The thread is now read-only.',
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
                bannerFallback: 'Contract status is currently unavailable. Messaging remains open.',
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
