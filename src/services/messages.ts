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

const CONVERSATIONS_TIMEOUT_MS = 20000;
const MESSAGES_TIMEOUT_MS = 20000;
const MESSAGE_SEND_TIMEOUT_MS = 20000;
const MESSAGE_WRITE_TIMEOUT_MS = 12000;

const conversationIdCache = new Map<string, string>();

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

    let { data, error } = await supabaseWithRetry(
        () => supabase.rpc('get_or_create_conversation', {
            user1,
            user2,
            p_contract_id: contractId ?? null,
            p_scope: scope ?? null,
        }),
        { throwOnError: false, timeoutMs: MESSAGE_WRITE_TIMEOUT_MS }
    );

    if (error) {
        const errorMessage = typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
            ? error.message.toLowerCase()
            : '';
        const shouldRetryLegacy = errorMessage.includes('p_scope')
            || errorMessage.includes('get_or_create_conversation') && errorMessage.includes('does not exist');

        if (shouldRetryLegacy) {
            const legacyResult = await supabaseWithRetry(
                () => supabase.rpc('get_or_create_conversation', {
                    user1,
                    user2,
                    p_contract_id: contractId ?? null,
                }),
                { throwOnError: false, timeoutMs: MESSAGE_WRITE_TIMEOUT_MS }
            );
            data = legacyResult.data;
            error = legacyResult.error;
        }
    }

    if (!error && typeof data === 'string') {
        conversationIdCache.set(cacheKey, data);
    }

    return { data: typeof data === 'string' ? data : null, error };
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
        // scopes like ['freelancer','contract','shared'] map 1-to-1 to inbox column values.
        // We always include 'shared' because shared conversations appear in all inboxes.
        const inboxValues = scopes && scopes.length > 0 ? scopes : null;

        const buildQuery = (
            participantColumn: 'participant_1' | 'participant_2',
            inboxColumn: 'inbox_participant_1' | 'inbox_participant_2',
            includeScopeColumns: boolean
        ) => {
            let query = (supabase
                .from('conversations') as any)
                .select(
                    includeScopeColumns
                        ? 'id, participant_1, participant_2, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at, conversation_scope, inbox_participant_1, inbox_participant_2'
                        : 'id, participant_1, participant_2, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at',
                    { count: 'estimated' }
                )
                .eq(participantColumn, userId)
                .order('last_message_at', { ascending: false });

            // Use per-participant inbox column for filtering when available.
            // Include null inbox values so legacy rows remain visible after schema upgrades.
            if (includeScopeColumns && inboxValues && inboxValues.length > 0) {
                const safeInboxValues = inboxValues.filter((value) => /^[a-z_]+$/i.test(value));
                if (safeInboxValues.length > 0) {
                    query = query.or(`${inboxColumn}.in.(${safeInboxValues.join(',')}),${inboxColumn}.is.null`);
                }
            }

            return query;
        };

        const runQueries = async (includeInboxCols: boolean) => Promise.all([
            supabaseWithRetry(() => buildQuery('participant_1', 'inbox_participant_1', includeInboxCols),
                { timeoutMs: CONVERSATIONS_TIMEOUT_MS }),
            supabaseWithRetry(() => buildQuery('participant_2', 'inbox_participant_2', includeInboxCols),
                { timeoutMs: CONVERSATIONS_TIMEOUT_MS }),
        ]);

        // Try with inbox columns first; fall back to no-scope query if column missing
        let [result1, result2] = await runQueries(true);

        const hasSchemaError = (err: unknown) =>
            isMissingSchemaColumn(err, 'conversations', 'inbox_participant_1') ||
            isMissingSchemaColumn(err, 'conversations', 'inbox_participant_2') ||
            isMissingSchemaColumn(err, 'conversations', 'conversation_scope');

        if (hasSchemaError(result1.error) || hasSchemaError(result2.error)) {
            // DB schema not yet migrated — fall back to unfiltered query
            [result1, result2] = await runQueries(false);
        }

        if (result1.error) throw result1.error;
        if (result2.error) throw result2.error;

        // Merge and deduplicate results, sort by activity
        const allConversations = [
            ...(result1.data ?? []),
            ...(result2.data ?? [])
        ] as ConversationRow[];

        const uniqueConversations = Array.from(
            new Map(allConversations.map(conv => [conv.id, conv])).values()
        ).sort((a, b) => {
            const aTime = new Date(a.last_message_at || 0).getTime();
            const bTime = new Date(b.last_message_at || 0).getTime();
            return bTime - aTime;
        });

        const paginatedConversations = uniqueConversations.slice(start, end + 1);
        const count = uniqueConversations.length;

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
        // When scopes are provided (mode-specific badge count), use per-participant
        // inbox columns so the count reflects only conversations in the correct inbox.
        // inbox_participant_1/2 is set at creation time per the role context of each party.
        if (scopes && scopes.length > 0) {
            let [participant1Result, participant2Result] = await Promise.all([
                supabaseWithRetry(() => supabase
                    .from('conversations')
                    .select('unread_count_1')
                    .eq('participant_1', userId)
                    .in('inbox_participant_1', scopes),
                    { timeoutMs: 12000 }
                ),
                supabaseWithRetry(() => supabase
                    .from('conversations')
                    .select('unread_count_2')
                    .eq('participant_2', userId)
                    .in('inbox_participant_2', scopes),
                    { timeoutMs: 12000 }
                ),
            ]);

            // Fallback: if inbox columns don't exist yet (pre-migration), try conversation_scope
            const hasInboxError =
                isMissingSchemaColumn(participant1Result.error, 'conversations', 'inbox_participant_1')
                || isMissingSchemaColumn(participant2Result.error, 'conversations', 'inbox_participant_2');

            if (hasInboxError) {
                [participant1Result, participant2Result] = await Promise.all([
                    supabaseWithRetry(() => supabase
                        .from('conversations')
                        .select('unread_count_1')
                        .eq('participant_1', userId)
                        .in('conversation_scope', scopes),
                        { timeoutMs: 12000 }
                    ),
                    supabaseWithRetry(() => supabase
                        .from('conversations')
                        .select('unread_count_2')
                        .eq('participant_2', userId)
                        .in('conversation_scope', scopes),
                        { timeoutMs: 12000 }
                    ),
                ]);

                // Final fallback: no scope filtering at all
                if (
                    isMissingSchemaColumn(participant1Result.error, 'conversations', 'conversation_scope')
                    || isMissingSchemaColumn(participant2Result.error, 'conversations', 'conversation_scope')
                ) {
                    participant1Result = await supabaseWithRetry(() => supabase
                        .from('conversations').select('unread_count_1').eq('participant_1', userId),
                        { timeoutMs: 12000 }
                    );
                    participant2Result = await supabaseWithRetry(() => supabase
                        .from('conversations').select('unread_count_2').eq('participant_2', userId),
                        { timeoutMs: 12000 }
                    );
                }
            }

            if (participant1Result.error) throw participant1Result.error;
            if (participant2Result.error) throw participant2Result.error;

            const participant1Unread = (participant1Result.data ?? []).reduce(
                (sum, row) => sum + (typeof row.unread_count_1 === 'number' ? row.unread_count_1 : 0),
                0
            );
            const participant2Unread = (participant2Result.data ?? []).reduce(
                (sum, row) => sum + (typeof row.unread_count_2 === 'number' ? row.unread_count_2 : 0),
                0
            );

            return { count: participant1Unread + participant2Unread, error: null };
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
