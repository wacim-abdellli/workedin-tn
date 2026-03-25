/**
 * Messages Service - Chat/messaging Supabase queries
 */
import { supabase } from '@/lib/supabase';
import type { MessageAttachment } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

function normalizeMessageError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('rate_limit_exceeded')) {
        return new Error('Slow down - max 30 messages per minute.');
    }
    return error instanceof Error ? error : new Error(message);
}

// --- TYPES ---

export interface Conversation {
    id: string;
    participant_1: string;
    participant_2: string;
    contract_id: string | null;
    last_message_text: string | null;
    last_message_at: string | null;
    unread_count_1: number;
    unread_count_2: number;
    created_at: string;
    updated_at: string;
    otherUser: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        username: string | null;
    };
    unread_count: number;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    attachments: MessageAttachment[];
    is_read: boolean;
    created_at: string;
    contract_id: string | null;
    proposal_id: string | null;
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

// --- READ ---

export async function getConversations(userId: string) {
    try {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                participant1:profiles!conversations_participant_1_fkey(id, full_name, avatar_url, username),
                participant2:profiles!conversations_participant_2_fkey(id, full_name, avatar_url, username)
            `)
            .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
            .order('last_message_at', { ascending: false, nullsFirst: false });

        if (error) throw error;

        // Transform data to include otherUser and unread_count
        const conversations: Conversation[] = (data || []).map((conv: any) => {
            const isParticipant1 = conv.participant_1 === userId;
            const otherUser = isParticipant1 ? conv.participant2 : conv.participant1;
            const unread_count = isParticipant1 ? conv.unread_count_1 : conv.unread_count_2;

            return {
                ...conv,
                otherUser: otherUser || { id: '', full_name: 'Unknown User', avatar_url: null, username: null },
                unread_count: unread_count || 0,
            };
        });

        return { data: conversations, error: null };
    } catch (error) {
        return { data: null, error: normalizeMessageError(error) };
    }
}

export async function getMessages(conversationId: string) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!sender_id(id, full_name, avatar_url)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return { data: data as Message[], error: null };
    } catch (error) {
        return { data: null, error: normalizeMessageError(error) };
    }
}

// --- WRITE ---

export async function sendMessage(params: {
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    contractId?: string | null;
    attachments?: MessageAttachment[];
}) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: params.conversationId,
                sender_id: params.senderId,
                receiver_id: params.receiverId,
                content: params.content,
                contract_id: params.contractId || null,
                attachments: params.attachments || [],
            })
            .select(`
                *,
                sender:profiles!sender_id(id, full_name, avatar_url)
            `)
            .single();

        if (error) throw error;

        return { data: data as Message, error: null };
    } catch (error) {
        return { data: null, error: normalizeMessageError(error) };
    }
}

export async function markConversationRead(conversationId: string, userId: string) {
    try {
        const { error } = await supabase.rpc('mark_conversation_read', {
            p_conversation_id: conversationId,
            p_user_id: userId,
        });

        if (error) throw error;

        return { error: null };
    } catch (error) {
        return { error: normalizeMessageError(error) };
    }
}

// --- REALTIME ---

export function subscribeToConversation(
    conversationId: string,
    callback: (payload: any) => void
): RealtimeChannel {
    return supabase
        .channel(`messages:${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`,
            },
            callback
        )
        .subscribe();
}

export function subscribeToConversations(
    userId: string,
    callback: (payload: any) => void
): RealtimeChannel {
    const channel = supabase.channel(`conversations:${userId}`);

    // Listen for changes where user is participant_1
    channel.on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `participant_1=eq.${userId}`,
        },
        callback
    );

    // Listen for changes where user is participant_2
    channel.on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `participant_2=eq.${userId}`,
        },
        callback
    );

    channel.subscribe();

    return channel;
}

// --- LEGACY (kept for backward compatibility) ---

export async function markMessageRead(messageId: string) {
    return supabase.from('messages').update({ is_read: true }).eq('id', messageId);
}

export function subscribeToMessages(contractId: string, callback: (payload: unknown) => void) {
    return supabase
        .channel(`messages:${contractId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `contract_id=eq.${contractId}`,
            },
            callback
        )
        .subscribe();
}

// Legacy sendMessage for contract-based messaging (without conversation_id)
// This is used by contract workspace and hooks
export async function sendContractMessage(data: {
    contract_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    attachments?: MessageAttachment[];
    message_type?: string | null;
}) {
    try {
        // Get or create conversation for these users
        const { data: conversationId, error: convError } = await supabase.rpc(
            'get_or_create_conversation',
            {
                user1: data.sender_id,
                user2: data.receiver_id,
                p_contract_id: data.contract_id,
            }
        );

        if (convError) throw convError;

        // Insert message with conversation_id
        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: data.sender_id,
                receiver_id: data.receiver_id,
                content: data.content,
                contract_id: data.contract_id,
                attachments: data.attachments || [],
            })
            .select()
            .single();

        if (error) throw error;

        return { data: message, error: null };
    } catch (error) {
        return { data: null, error: normalizeMessageError(error) };
    }
}
