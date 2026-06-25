import { supabase } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { canSendMessage } from '@/lib/permissionEngine';
import type { MessageAttachment } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getOrCreateConversationId } from './conversations';
import { normalizeMessageError } from './utils';

const MESSAGE_SEND_TIMEOUT_MS = 20000;

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

export async function sendContractMessage(data: {
    contract_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    attachments?: MessageAttachment[];
    message_type?: string | null;
}) {
    try {
        const { data: conversationId, error: convError } = await getOrCreateConversationId(
            data.sender_id,
            data.receiver_id,
            data.contract_id,
            'contract'
        );

        if (convError) throw convError;
        if (!conversationId) throw new Error('Failed to resolve conversation');

        const { data: conversation, error: fetchConvError } = await supabase
            .from('conversations')
            .select('participant_1, participant_2')
            .eq('id', conversationId)
            .maybeSingle();

        if (fetchConvError || !conversation) {
            throw fetchConvError || new Error('Conversation not found.');
        }

        if (!canSendMessage(data.sender_id, conversation)) {
            throw new Error('Permission Denied: You are not a participant in this conversation.');
        }

        const { data: message, error } = await supabaseWithRetry(
            () => supabase
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
                .single(),
            { throwOnError: false, timeoutMs: MESSAGE_SEND_TIMEOUT_MS }
        );

        if (error) throw error;

        return { data: message, error: null };
    } catch (error) {
        return { data: null, error: normalizeMessageError(error) };
    }
}
