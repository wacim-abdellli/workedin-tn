/**
 * Messages Service - Chat/messaging Supabase queries
 */
import { supabase } from '@/lib/supabase';
import type { MessageAttachment } from '@/types';

function normalizeMessageError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('rate_limit_exceeded')) {
        return new Error('Slow down - max 30 messages per minute.');
    }
    return error instanceof Error ? error : new Error(message);
}

// --- READ ---

export async function getConversations(userId: string) {
    return supabase
        .from('messages')
        .select(`
            *,
            sender:profiles!sender_id(id, full_name, avatar_url),
            receiver:profiles!receiver_id(id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });
}

export async function getMessages(contractId: string) {
    return supabase
        .from('messages')
        .select(`*, sender:profiles!sender_id(id, full_name, avatar_url)`)
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });
}

// --- WRITE ---

export async function sendMessage(data: {
    contract_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    attachments?: MessageAttachment[];
    message_type?: string | null;
}) {
    try {
        const { data: messageId, error } = await supabase.rpc('send_message', {
            p_contract_id: data.contract_id,
            p_sender_id: data.sender_id,
            p_receiver_id: data.receiver_id,
            p_content: data.content,
            p_attachments: data.attachments ?? [],
            p_message_type: data.message_type ?? null,
        });

        if (error) {
            throw error;
        }

        return { data: messageId, error: null };
    } catch (error) {
        return { data: null, error: normalizeMessageError(error) };
    }
}

export async function markMessageRead(messageId: string) {
    return supabase.from('messages').update({ is_read: true }).eq('id', messageId);
}

// --- REALTIME ---

export function subscribeToMessages(contractId: string, callback: (payload: unknown) => void) {
    return supabase
        .channel(`messages:${contractId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `contract_id=eq.${contractId}`,
        }, callback)
        .subscribe();
}
