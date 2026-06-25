import { supabase, uploadFile } from '@/lib/supabase';
import { validateUploadPayload } from '@/lib/uploadPolicy';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { canSendMessage, canDeleteMessage } from '@/lib/permissionEngine';
import type { MessageAttachment } from '@/types';
import type { Message } from './types';
import { buildMessageAttachmentPath, getFileBytes, normalizeMessageError } from './utils';

const MESSAGES_TIMEOUT_MS = 20000;
const MESSAGE_SEND_TIMEOUT_MS = 20000;
const MESSAGE_WRITE_TIMEOUT_MS = 12000;

export async function getMessages(conversationId: string, limit: number = 50, offset: number = 0) {
    try {
        const { data, error } = await supabaseWithRetry(() => supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1), { timeoutMs: MESSAGES_TIMEOUT_MS });

        if (error) throw error;

        return { data: (data as Message[]).reverse(), error: null };
    } catch (error) {
        return { data: null, error: normalizeMessageError(error) };
    }
}

export async function uploadMessageAttachment(file: File, conversationId: string): Promise<{ url: string | null; error: Error | null }> {
    try {
        const bytes = await getFileBytes(file);
        const validation = validateUploadPayload({
            bucket: 'message_attachments',
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            bytes,
        });

        if (!validation.ok) {
            throw new Error(validation.reason || 'Unsafe attachment blocked.');
        }

        const path = buildMessageAttachmentPath(conversationId, file.name);
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
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('participant_1, participant_2')
            .eq('id', params.conversationId)
            .maybeSingle();

        if (convError || !conversation) {
            return { data: null, error: convError || new Error('Conversation not found.') };
        }

        if (!canSendMessage(params.senderId, conversation)) {
            return { data: null, error: new Error('Permission Denied: You are not a participant in this conversation.') };
        }

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
            .select()
            .single(), { throwOnError: false, timeoutMs: MESSAGE_SEND_TIMEOUT_MS });

        if (error) throw error;
        
        const msg = data as Message;
        if (msg && !msg.sender) {
             msg.sender = { id: params.senderId, full_name: 'You', avatar_url: null };
        }

        return { data: msg, error: null };
    } catch (error) {
        return { data: null, error: normalizeMessageError(error) };
    }
}

export async function markConversationRead(conversationId: string, _userId?: string) {
    try {
        const { error } = await supabaseWithRetry(
            () => supabase.rpc('mark_conversation_read', {
                p_conversation_id: conversationId,
            }),
            { throwOnError: false, timeoutMs: 10000 }
        );

        if (error) throw error;

        return { error: null };
    } catch (error) {
        return { error: normalizeMessageError(error) };
    }
}

export async function deleteMessage(messageId: string) {
    try {
        const user = (supabase.auth && typeof supabase.auth.getUser === 'function') ? (await supabase.auth.getUser())?.data?.user : null;
        if (!user) {
            return { data: null, error: new Error('Unauthorized: No active session.') };
        }

        const { data: message, error: fetchError } = await supabase
            .from('messages')
            .select('sender_id, receiver_id')
            .eq('id', messageId)
            .maybeSingle();

        if (fetchError || !message) {
            return { data: null, error: fetchError || new Error('Message not found.') };
        }

        if (!canDeleteMessage(user.id, message)) {
            return { data: null, error: new Error('Access Denied: You do not have permission to delete this message.') };
        }

        const { data, error } = await supabaseWithRetry(
            () => supabase.rpc('delete_message_atomic', { p_message_id: messageId }),
            { throwOnError: false, timeoutMs: MESSAGE_WRITE_TIMEOUT_MS }
        );

        if (error) throw error;

        return {
            data: data as { conversation_id?: string | null } | null,
            error: null,
        };
    } catch (error) {
        const normalizedError = normalizeMessageError(error);
        if (normalizedError.message.includes('Could not find the function public.delete_message_atomic')) {
            return {
                data: null,
                error: new Error('Delete message is not enabled in the database yet. Run the latest messages SQL migration first.'),
            };
        }

        return { data: null, error: normalizeMessageError(error) };
    }
}
