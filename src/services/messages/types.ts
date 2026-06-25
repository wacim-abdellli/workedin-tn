import type { MessageAttachment } from '@/types';

export type ConversationScope = 'client' | 'freelancer' | 'contract' | 'shared';

export interface ConversationQueryOptions {
    scopes?: ConversationScope[];
}

export interface Conversation {
    id: string;
    participant_1: string;
    participant_2: string;
    client_id?: string;
    freelancer_id?: string;
    status?: string;
    contract_id: string | null;
    last_message_text: string | null;
    last_message_at: string | null;
    unread_count_1: number;
    unread_count_2: number;
    created_at: string;
    updated_at: string;
    conversation_scope?: ConversationScope;
    inbox_participant_1?: string;
    inbox_participant_2?: string;
    otherUser: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        username: string | null;
    };
    unread_count: number;
    message_count?: number;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    attachments: MessageAttachment[];
    is_read: boolean;
    is_deleted?: boolean;
    deleted_at?: string | null;
    deleted_by?: string | null;
    created_at: string;
    contract_id: string | null;
    proposal_id: string | null;
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

export interface ConversationParticipantRow {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
}

export interface ConversationRow {
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
    conversation_scope?: ConversationScope;
    inbox_participant_1?: string;
    inbox_participant_2?: string;
    messages?: { count: number }[];
    participant1?: ConversationParticipantRow | ConversationParticipantRow[] | null;
    participant2?: ConversationParticipantRow | ConversationParticipantRow[] | null;
}
