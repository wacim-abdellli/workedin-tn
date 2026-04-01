/**
 * Messages Service - Chat/messaging Supabase queries
 */
import { supabase, uploadFile } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import type { MessageAttachment } from '@/types';
import type {
    RealtimeChannel,
    RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

function normalizeMessageError(error: unknown) {
    const message = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null
            ? [
                'message' in error && typeof error.message === 'string' ? error.message : null,
                'details' in error && typeof error.details === 'string' ? error.details : null,
                'hint' in error && typeof error.hint === 'string' ? error.hint : null,
              ].filter(Boolean).join(' - ') || 'Unexpected error'
            : String(error);
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
    created_at: string;
    contract_id: string | null;
    proposal_id: string | null;
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
}

interface ConversationParticipantRow {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
}

interface ConversationRow {
    id: string;
    participant_1: string;
    participant_2: string;
    contract_id: string | null;
    last_message_text: string | null;
    last_message_at: string | null;
    unread_count_1: number | null;
    unread_count_2: number | null;
    created_at: string;
    updated_at: string;
    messages?: { count: number }[];
    participant1?: ConversationParticipantRow | ConversationParticipantRow[] | null;
    participant2?: ConversationParticipantRow | ConversationParticipantRow[] | null;
}

// --- READ ---

export async function getConversations(userId: string, page: number = 0, limit: number = 20) {
    try {
        const start = page * limit;
        const end = start + limit - 1;

        const { data, error, count } = await supabaseWithRetry(() => supabase
            .from('conversations')
            .select('*, messages(count)', { count: 'exact' })
            .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
            .order('last_message_at', { ascending: false })
            .range(start, end));

        if (error) throw error;

        const rows = (data ?? []) as ConversationRow[];
        const otherUserIds = Array.from(new Set(rows.map((conv) => (
            conv.participant_1 === userId ? conv.participant_2 : conv.participant_1
        )).filter(Boolean)));

        const profilesById = new Map<string, ConversationParticipantRow>();

        if (otherUserIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabaseWithRetry(() => supabase
                .from('profiles')
                .select('id, full_name, avatar_url, username')
                .in('id', otherUserIds));

            if (profilesError) throw profilesError;

            for (const profile of (profiles ?? []) as ConversationParticipantRow[]) {
                profilesById.set(profile.id, profile);
            }
        }

        const conversations: Conversation[] = rows.map((conv) => {
            const isParticipant1 = conv.participant_1 === userId;
            const otherUserId = isParticipant1 ? conv.participant_2 : conv.participant_1;
            const otherUser = (otherUserId ? profilesById.get(otherUserId) : null) ?? null;
            const unread_count = isParticipant1 ? conv.unread_count_1 : conv.unread_count_2;

            return {
                id: conv.id,
                participant_1: conv.participant_1,
                participant_2: conv.participant_2,
                contract_id: conv.contract_id,
                last_message_text: conv.last_message_text,
                last_message_at: conv.last_message_at,
                unread_count_1: conv.unread_count_1 ?? 0,
                unread_count_2: conv.unread_count_2 ?? 0,
                created_at: conv.created_at,
                updated_at: conv.updated_at,
                otherUser: {
                    id: otherUser?.id || '',
                    full_name: otherUser?.full_name || 'Unknown User',
                    avatar_url: otherUser?.avatar_url || null,
                    username: otherUser?.username || null,
                },
                unread_count: unread_count || 0,
                message_count: conv.messages?.[0]?.count ?? 0,
            };
        });

        return { data: conversations, count: count || 0, error: null };
    } catch (error) {
        return { data: null, count: 0, error: normalizeMessageError(error) };
    }
}

export async function getTotalUnreadCount(userId: string) {
    try {
        const { data, error } = await supabaseWithRetry(() => supabase
            .rpc('get_total_unread_count', { custom_user_id: userId })
        );

        if (error) throw error;

        return { count: (data as number) ?? 0, error: null };
    } catch (error) {
        return { count: 0, error: normalizeMessageError(error) };
    }
}

export async function getMessages(conversationId: string, limit: number = 50, offset: number = 0) {
    try {
        const { data, error } = await supabaseWithRetry(() => supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!sender_id(id, full_name, avatar_url)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1));

        if (error) throw error;

        // Since we fetch in descending order to get latest first, reverse them for display
        return { data: (data as Message[]).reverse(), error: null };
    } catch (error) {
        return { data: null, error: normalizeMessageError(error) };
    }
}

export async function getMessageCount(conversationId: string) {
    try {
        // Create a timeout promise that rejects after 3 seconds
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 3000)
        );

        const queryPromise = supabaseWithRetry(() => supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversationId));

        const { count, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

        if (error) throw error;

        return { count: count ?? 0, error: null };
    } catch (_error) {
        // Silently fail with 0 count - this prevents timeout errors from showing
        return { count: 0, error: null };
    }
}

// --- WRITE ---

export async function uploadMessageAttachment(file: File, conversationId: string): Promise<{ url: string | null; error: Error | null }> {
    try {
        const path = `${conversationId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadedUrl = await uploadFile('message_attachments', path, file);
        return { url: uploadedUrl, error: null };
    } catch (error) {
        return { url: null, error: normalizeMessageError(error) };
    }
}

export async function sendMessage(params: {
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    contractId?: string | null;
    attachments?: MessageAttachment[];
}) {
    try {
        const { data, error } = await supabaseWithRetry(() => supabase
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
            .single(), { throwOnError: false, timeoutMs: 15000 });

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
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
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
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
): RealtimeChannel {
    const channel = supabase.channel(`conversations:${userId}`);

    channel.on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'conversations',
        },
        (payload) => {
            const newRecord = payload.new as any;
            const oldRecord = payload.old as any;
            const isParticipant =
                (newRecord && (newRecord.participant_1 === userId || newRecord.participant_2 === userId)) ||
                (oldRecord && (oldRecord.participant_1 === userId || oldRecord.participant_2 === userId));
                
            if (isParticipant) callback(payload);
        }
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

export async function unsubscribeFromChannel(channel: RealtimeChannel) {
    if (channel) await supabase.removeChannel(channel);
}
