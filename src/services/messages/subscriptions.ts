import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { ConversationScope } from './types';

export function subscribeToConversation(
    conversationId: string,
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
): RealtimeChannel {
    return supabase
        .channel(`messages:${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`,
            },
            callback
        )
        .subscribe();
}

export function subscribeToIncomingMessages(
    userId: string,
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
): RealtimeChannel {
    return supabase
        .channel(`incoming_messages:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${userId}`,
            },
            callback
        )
        .subscribe();
}

export function subscribeToConversations(
    userId: string,
    scopes: ConversationScope[] | undefined,
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
            const newRecord = payload.new as Record<string, unknown> | undefined;
            const oldRecord = payload.old as Record<string, unknown> | undefined;
            const isParticipant =
                (newRecord && (newRecord.participant_1 === userId || newRecord.participant_2 === userId)) ||
                (oldRecord && (oldRecord.participant_1 === userId || oldRecord.participant_2 === userId));

            if (!isParticipant) return;

            if (scopes && scopes.length > 0) {
                const authoritative: string | undefined =
                    (typeof newRecord?.conversation_scope === 'string' && newRecord.conversation_scope)
                        ? newRecord.conversation_scope
                        : (typeof oldRecord?.conversation_scope === 'string' && oldRecord.conversation_scope)
                            ? oldRecord.conversation_scope
                            : undefined;

                if (authoritative !== undefined && !scopes.includes(authoritative as ConversationScope)) return;
            }

            callback(payload);
        }
    );

    channel.subscribe();

    return channel;
}

export async function unsubscribeFromChannel(channel: RealtimeChannel) {
    if (channel) await supabase.removeChannel(channel);
}
