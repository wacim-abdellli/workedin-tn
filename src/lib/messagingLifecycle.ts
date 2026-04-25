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
                bannerFallback: 'Payment is still being confirmed for this contract. Messaging remains open.',
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
                bannerTone: 'info',
                bannerFallback: 'Delivery submitted. The client is now reviewing the work before approval, changes, or dispute.',
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
                bannerFallback: 'A revision has been requested. Share only the updates needed to close the loop.',
                blockedReasonFallback: null,
            };
        case 'disputed':
            return buildReadOnlyContractPolicy(
                status,
                'Disputed',
                'warning',
                'This contract is under dispute. Messaging is locked while the case is reviewed.',
            );
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
