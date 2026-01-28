/**
 * Chat and real-time messaging type definitions
 */
import type { Profile } from './index';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/** Chat message */
export interface ChatMessage {
    id: string;
    contract_id: string;
    sender_id: string;
    content: string;
    file_url?: string;
    created_at: string;
    sender?: Profile;
    attachments?: ChatAttachment[];
    status?: 'sending' | 'sent' | 'delivered' | 'read';
}

/** Chat attachment */
export interface ChatAttachment {
    id: string;
    name: string;
    url: string;
    type: 'image' | 'file' | 'audio';
    size?: number;
}

/** Typing indicator state */
export interface TypingState {
    user_id: string;
    typing: boolean;
    timestamp: number;
}

/** Chat participant */
export interface ChatParticipant {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    is_online: boolean;
    last_seen?: string;
}

/** Real-time chat hook return type */
export interface UseRealtimeChatReturn {
    messages: ChatMessage[];
    isLoading: boolean;
    error: Error | null;
    isTyping: boolean;
    otherUserTyping: boolean;
    sendMessage: (content: string, attachments?: ChatAttachment[]) => Promise<void>;
    setTyping: (isTyping: boolean) => void;
    markAsRead: (messageId: string) => void;
}

/** Supabase real-time payload for messages */
export type MessageRealtimePayload = RealtimePostgresChangesPayload<{
    [key: string]: unknown;
}>;

/** Contract status change payload */
export interface ContractStatusPayload {
    id: string;
    status: string;
    updated_at: string;
}
