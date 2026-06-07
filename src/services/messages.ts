/**
 * Messages Service - Chat/messaging Supabase queries
 */
import { supabase, uploadFile } from '@/lib/supabase';
import { validateUploadPayload } from '@/lib/uploadPolicy';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { canAccessMessage, canSendMessage, canDeleteMessage } from '@/lib/permissionEngine';
import type { MessageAttachment } from '@/types';
import type {
    RealtimeChannel,
    RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

const CONVERSATIONS_TIMEOUT_MS = 20000;
const MESSAGES_TIMEOUT_MS = 20000;
const MESSAGE_SEND_TIMEOUT_MS = 20000;
const MESSAGE_WRITE_TIMEOUT_MS = 12000;

const conversationIdCache = new Map<string, string>();

function buildMessageAttachmentPath(conversationId: string, fileName: string) {
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueToken = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

    return `${conversationId}/${uniqueToken}-${safeFileName}`;
}

async function getFileBytes(file: File): Promise<Uint8Array> {
    if (typeof file.arrayBuffer === 'function') {
        return new Uint8Array(await file.arrayBuffer());
    }

    const fallbackBuffer = await new Response(file).arrayBuffer();
    return new Uint8Array(fallbackBuffer);
}

export type ConversationScope = 'client' | 'freelancer' | 'contract' | 'shared';

interface ConversationQueryOptions {
    scopes?: ConversationScope[];
}

function getConversationCacheKey(
    user1: string,
    user2: string,
    contractId?: string | null,
    scope?: ConversationScope | null
) {
    return [user1, user2].sort().join(':') + `:${contractId ?? 'none'}:${scope ?? 'auto'}`;
}

function extractConversationIdFromRpcPayload(payload: unknown) {
    if (typeof payload === 'string' && payload.trim().length > 0) {
        return payload;
    }

    if (payload && typeof payload === 'object') {
        const candidate = payload as { id?: unknown; conversation_id?: unknown };
        if (typeof candidate.id === 'string' && candidate.id.trim().length > 0) {
            return candidate.id;
        }
        if (typeof candidate.conversation_id === 'string' && candidate.conversation_id.trim().length > 0) {
            return candidate.conversation_id;
        }
    }

    return null;
}

async function getOrCreateConversationId(
    user1: string,
    user2: string,
    contractId?: string | null,
    scope?: ConversationScope | null
) {
    const cacheKey = getConversationCacheKey(user1, user2, contractId, scope);
    const cachedConversationId = conversationIdCache.get(cacheKey);

    if (cachedConversationId) {
        return { data: cachedConversationId, error: null };
    }

    try {
        const [participant1, participant2] = [user1, user2].sort();
        const resolvedScope = scope ?? 'shared';

        // 1. Check if the conversation already exists
        let existingQuery = supabase
            .from('conversations')
            .select('id')
            .eq('participant_1', participant1)
            .eq('participant_2', participant2);

        if (contractId) {
            existingQuery = existingQuery.eq('contract_id', contractId);
        } else {
            existingQuery = existingQuery.eq('conversation_scope', resolvedScope).is('contract_id', null);
        }

        const { data: existing, error: fetchError } = await supabaseWithRetry(
            () => existingQuery.maybeSingle(),
            { timeoutMs: MESSAGE_WRITE_TIMEOUT_MS }
        );

        if (fetchError) throw fetchError;
        if (existing?.id) {
            conversationIdCache.set(cacheKey, existing.id);
            return { data: existing.id, error: null };
        }

        // 2. Resolve client_id and freelancer_id
        let clientId = '';
        let freelancerId = '';

        if (contractId) {
            const { data: contract, error: contractError } = await supabaseWithRetry(
                () => supabase
                    .from('contracts')
                    .select('client_id, freelancer_id')
                    .eq('id', contractId)
                    .single(),
                { timeoutMs: MESSAGE_WRITE_TIMEOUT_MS }
            );
            if (contractError) throw contractError;
            if (contract) {
                clientId = contract.client_id;
                freelancerId = contract.freelancer_id;
            }
        }

        if (!clientId || !freelancerId) {
            const { data: profiles, error: profilesError } = await supabaseWithRetry(
                () => supabase
                    .from('profiles')
                    .select('id, user_type')
                    .in('id', [user1, user2]),
                { timeoutMs: MESSAGE_WRITE_TIMEOUT_MS }
            );

            if (profilesError) throw profilesError;

            const p1 = profiles?.find((p) => p.id === user1);
            const p2 = profiles?.find((p) => p.id === user2);

            if (p1?.user_type === 'client' || p2?.user_type === 'freelancer') {
                clientId = user1;
                freelancerId = user2;
            } else if (p2?.user_type === 'client' || p1?.user_type === 'freelancer') {
                clientId = user2;
                freelancerId = user1;
            } else {
                clientId = user1;
                freelancerId = user2;
            }
        }

        // 3. Insert explicit conversation row
        const { data: newConv, error: insertError } = await supabaseWithRetry(
            () => supabase
                .from('conversations')
                .insert({
                    participant_1: participant1,
                    participant_2: participant2,
                    client_id: clientId,
                    freelancer_id: freelancerId,
                    contract_id: contractId ?? null,
                    conversation_scope: resolvedScope,
                    inbox_participant_1: participant1 === clientId ? 'client' : 'freelancer',
                    inbox_participant_2: participant2 === clientId ? 'client' : 'freelancer',
                    status: 'active',
                })
                .select('id')
                .single(),
            { timeoutMs: MESSAGE_WRITE_TIMEOUT_MS }
        );

        if (insertError) throw insertError;
        if (!newConv?.id) throw new Error('Failed to create conversation');

        conversationIdCache.set(cacheKey, newConv.id);
        return { data: newConv.id, error: null };
    } catch (error) {
        return { data: null, error: normalizeMessageError(error) };
    }
}

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
    if (message.toLowerCase().includes('contract chat safety violation')) {
        return new Error(message);
    }
    return error instanceof Error ? error : new Error(message);
}

function isMissingSchemaColumn(error: unknown, tableName: string, columnName: string): boolean {
    if (!error || typeof error !== 'object') return false;
    const message = 'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : '';
    return message.includes('could not find')
        && message.includes('schema cache')
        && message.includes(tableName.toLowerCase())
        && message.includes(columnName.toLowerCase());
}

// --- TYPES ---

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
    /** Per-participant inbox columns — which mode-inbox each user sees this conversation in. */
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

// --- READ ---

export async function getConversations(
    userId: string,
    page: number = 0,
    limit: number = 20,
    options?: ConversationQueryOptions
) {
    try {
        const start = page * limit;
        const end = start + limit - 1;
        const scopes = options?.scopes;

        // Determine which inbox values to filter on.
        const inboxValues = scopes && scopes.length > 0 ? scopes : null;

        const { data: conversationsData, error } = await supabaseWithRetry(() => supabase
            .from('conversations')
            .select(`
                id, participant_1, participant_2, client_id, freelancer_id, contract_id, 
                last_message_text, last_message_at, unread_count_1, unread_count_2, 
                created_at, updated_at, conversation_scope, inbox_participant_1, 
                inbox_participant_2, status
            `, { count: 'estimated' })
            .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
            .order('last_message_at', { ascending: false })
        , { timeoutMs: CONVERSATIONS_TIMEOUT_MS });

        if (error) throw error;

        const allConversations = (conversationsData ?? []) as ConversationRow[];

        const scopedConversations = inboxValues && inboxValues.length > 0
            ? allConversations.filter((conversation) => {
                if (conversation.status === 'archived') return false;

                // Explicit first-class role mapping:
                let myRole: ConversationScope | undefined = undefined;
                if (conversation.client_id === userId) {
                    myRole = 'client';
                } else if (conversation.freelancer_id === userId) {
                    myRole = 'freelancer';
                }

                // Fallback to inbox_participant columns if roles are not aligned or for legacy rows
                if (!myRole) {
                    const myInbox = conversation.participant_1 === userId
                        ? conversation.inbox_participant_1
                        : conversation.inbox_participant_2;
                    if (myInbox) {
                        myRole = myInbox as ConversationScope;
                    }
                }

                // If role is resolved, verify it matches the active workspace mode (inboxValues)
                if (myRole) {
                    return inboxValues.includes(myRole);
                }

                // Fallback to conversation_scope if still unresolved
                if (conversation.conversation_scope === 'contract') {
                    return inboxValues.includes('contract');
                }
                if (conversation.conversation_scope) {
                    return inboxValues.includes(conversation.conversation_scope as ConversationScope);
                }

                return true;
            })
            : allConversations.filter(c => c.status !== 'archived');

        const paginatedConversations = scopedConversations.slice(start, end + 1);
        const count = scopedConversations.length;

        const rows = paginatedConversations as unknown as ConversationRow[];
        const otherUserIds = Array.from(new Set(rows.map((conv) => (
            conv.participant_1 === userId ? conv.participant_2 : conv.participant_1
        )).filter(Boolean)));

        const [profilesResult] = await Promise.all([
            otherUserIds.length > 0
                ? supabaseWithRetry(() => supabase
                    .from('public_profiles')
                    .select('id, full_name, avatar_url, username')
                    .in('id', otherUserIds), { timeoutMs: CONVERSATIONS_TIMEOUT_MS })
                : Promise.resolve({ data: [], error: null })
        ]);

        if (profilesResult.error) throw profilesResult.error;

        const profilesById = new Map<string, ConversationParticipantRow>();
        for (const profile of (profilesResult.data ?? []) as ConversationParticipantRow[]) {
            profilesById.set(profile.id, profile);
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
                client_id: conv.client_id,
                freelancer_id: conv.freelancer_id,
                status: conv.status || 'active',
                contract_id: conv.contract_id,
                last_message_text: conv.last_message_text,
                last_message_at: conv.last_message_at,
                unread_count_1: conv.unread_count_1 ?? 0,
                unread_count_2: conv.unread_count_2 ?? 0,
                created_at: conv.created_at,
                updated_at: conv.updated_at,
                conversation_scope: conv.conversation_scope ?? 'shared',
                inbox_participant_1: conv.inbox_participant_1,
                inbox_participant_2: conv.inbox_participant_2,
                otherUser: {
                    id: otherUser?.id || '',
                    full_name: otherUser?.full_name || 'Unknown User',
                    avatar_url: otherUser?.avatar_url || null,
                    username: otherUser?.username || null,
                },
                unread_count: unread_count || 0,
                message_count: undefined,
            };
        });

        return { data: conversations, count: count || 0, error: null };
    } catch (error) {
        return { data: null, count: 0, error: normalizeMessageError(error) };
    }
}

export async function getTotalUnreadCount(userId: string, scopes?: ConversationScope[]) {
    try {
        if (scopes && scopes.length > 0) {
            const { data, error } = await supabaseWithRetry(() => supabase
                .from('conversations')
                .select('participant_1, participant_2, client_id, freelancer_id, inbox_participant_1, inbox_participant_2, unread_count_1, unread_count_2, status')
                .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
            , { timeoutMs: 12000 });

            if (error) throw error;

            const totalUnread = (data ?? []).reduce((sum, row) => {
                if (row.status === 'archived') return sum;

                let myRole: ConversationScope | undefined = undefined;
                if (row.client_id === userId) {
                    myRole = 'client';
                } else if (row.freelancer_id === userId) {
                    myRole = 'freelancer';
                }

                if (!myRole) {
                    const myInbox = row.participant_1 === userId ? row.inbox_participant_1 : row.inbox_participant_2;
                    if (myInbox) {
                        myRole = myInbox as ConversationScope;
                    }
                }

                if (myRole && scopes.includes(myRole)) {
                    const count = row.participant_1 === userId ? row.unread_count_1 : row.unread_count_2;
                    return sum + (typeof count === 'number' ? count : 0);
                }

                return sum;
            }, 0);

            return { count: totalUnread, error: null };
        }

        // No scope filter: use the server-side RPC for the global total
        const { data, error } = await supabaseWithRetry(() => supabase
            .rpc('get_total_unread_count', { custom_user_id: userId })
        , { timeoutMs: 12000 });

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
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1), { timeoutMs: MESSAGES_TIMEOUT_MS });

        if (error) throw error;

        // Since we fetch in descending order to get latest first, reverse them for display
        return { data: (data as Message[]).reverse(), error: null };
    } catch (error) {
        return { data: null, error: normalizeMessageError(error) };
    }
}

/**
 * Message count is already available in the Conversation object as `message_count`.
 * Use getConversations() instead of calling a separate count query.
 * This function has been removed to prevent performance issues and dead code.
 */

// --- WRITE ---

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
            // Removed expensive sender join for faster message delivery
            .select()
            .single(), { throwOnError: false, timeoutMs: MESSAGE_SEND_TIMEOUT_MS });

        if (error) throw error;
        
        // Inject sender info locally instead of a DB join to make sending lightning fast
        const msg = data as Message;
        if (msg && !msg.sender) {
             msg.sender = { id: params.senderId, full_name: 'You', avatar_url: null }; // Will be updated by UI context naturally
        }

        return { data: msg, error: null };
    } catch (error) {
        return { data: null, error: normalizeMessageError(error) };
    }
}

// userId is kept in the signature to avoid breaking existing call sites, but is
// no longer forwarded to the RPC — the DB function derives the actor from auth.uid().
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

        // Use the existing delete_message_atomic function
        // This marks the message as deleted for everyone
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
            const newRecord = payload.new as any;
            const oldRecord = payload.old as any;
            const isParticipant =
                (newRecord && (newRecord.participant_1 === userId || newRecord.participant_2 === userId)) ||
                (oldRecord && (oldRecord.participant_1 === userId || oldRecord.participant_2 === userId));

            if (!isParticipant) return;

            // Scope guard: prefer the new record's scope (authoritative post-update state).
            // Fall back to old record only when new record doesn't carry the column
            // (e.g. partial UPDATE payloads). This prevents events where
            // oldRecord.conversation_scope is undefined from matching every scope.
            if (scopes && scopes.length > 0) {
                const authoritative: string | undefined =
                    (typeof newRecord?.conversation_scope === 'string' && newRecord.conversation_scope)
                        ? newRecord.conversation_scope
                        : (typeof oldRecord?.conversation_scope === 'string' && oldRecord.conversation_scope)
                            ? oldRecord.conversation_scope
                            : undefined;

                // Unknown scope → let through as safe default (caller decides).
                if (authoritative !== undefined && !scopes.includes(authoritative as ConversationScope)) return;
            }

            callback(payload);
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

export async function unsubscribeFromChannel(channel: RealtimeChannel) {
    if (channel) await supabase.removeChannel(channel);
}
