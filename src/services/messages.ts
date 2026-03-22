/**
 * Messages Service — Chat/messaging Supabase queries
 */
import { supabase } from '@/lib/supabase';

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
    attachments?: string[];
}) {
    return supabase.from('messages').insert(data);
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
