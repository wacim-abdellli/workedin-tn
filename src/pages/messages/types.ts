import type { Conversation, ConversationScope } from '../../services/messages';

export type ContractSessionMeta = {
    id: string;
    status: string | null;
    title: string | null;
    amount: number | null;
    total_amount: number | null;
    revision_requests_count?: number | null;
    max_revision_rounds?: number | null;
    funded_at?: string | null;
    delivery_submitted_at?: string | null;
    review_due_at?: string | null;
    revision_requested_at?: string | null;
    job_deadline: string | null;
    client_id: string | null;
    freelancer_id: string | null;
    job_id: string | null;
    proposal_id?: string | null;
    linked_contract_id?: string | null;
};

export type LatestContractDeliveryAsset = {
    id: string;
    asset_kind: 'review_asset' | 'final_asset';
    access_state: 'preview_available' | 'locked' | 'released';
    name: string;
    storage_bucket?: string | null;
    storage_path: string;
    mime_type?: string | null;
    size_bytes?: number | null;
};

export type LatestContractDelivery = {
    id: string;
    version_number: number;
    delivery_note?: string | null;
    review_due_at?: string | null;
    submitted_at?: string | null;
    locked_final_asset_count?: number | null;
    assets?: LatestContractDeliveryAsset[];
};

export type ContractMilestone = {
    id: string;
    contract_id: string | null;
    title: string | null;
    description: string | null;
    amount: number | null;
    status: string | null;
    due_date: string | null;
    order_index: number | null;
    created_at: string | null;
};

export type ContractSharedFile = {
    id: string;
    name: string;
    url: string;
    type: string | null;
    size: number | string | null;
    uploadedAt: string | null;
    senderName: string;
};

export type ContractConversationLookupRow = {
    id: string;
    participant_1: string;
    participant_2: string;
    client_id?: string;
    freelancer_id?: string;
    status?: string;
    contract_id: string | null;
    last_message_text: string | null;
    last_message_at: string | null;
    unread_count_1: number | null;
    unread_count_2: number | null;
    created_at: string;
    updated_at: string;
    conversation_scope?: ConversationScope | null;
    inbox_participant_1?: string | null;
    inbox_participant_2?: string | null;
};

export type AccentClasses = {
    selectedConversationBorder: string;
    selectedConversationSurface: string;
    conversationHoverSurface: string;
    avatarHoverRing: string;
    headerAvatarHoverRing: string;
    contextLabelText: string;
    unreadBadgeBg: string;
    inputFocusBorder: string;
    headerMetaText: string;
    searchSurface: string;
    contractToggleActive: string;
    contractToggleIdle: string;
    threadAmbientGlow: string;
    ownBubbleBg: string;
    ownReplyCard: string;
    ownTextMuted: string;
    ownAttachmentCard: string;
    ownAttachmentIcon: string;
    neutralAttachmentIcon: string;
    readReceipt: string;
    replyActionHover: string;
    highlightRing: string;
    typingDot: string;
    replyStripe: string;
    iconAccent: string;
    sendButton: string;
    composerShell: string;
};
