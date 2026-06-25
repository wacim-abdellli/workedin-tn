import { supabase } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import type { ConversationScope, ConversationQueryOptions, Conversation, ConversationRow, ConversationParticipantRow } from './types';
import { normalizeMessageError } from './utils';

const CONVERSATIONS_TIMEOUT_MS = 20000;
const MESSAGE_WRITE_TIMEOUT_MS = 12000;

export const conversationIdCache = new Map<string, string>();

import { getConversationCacheKey } from './utils';

export async function getOrCreateConversationId(
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
        const inboxValues = scopes && scopes.length > 0 ? scopes : null;

        let query = supabase
            .from('conversations')
            .select(`
                id, participant_1, participant_2, client_id, freelancer_id, contract_id, 
                last_message_text, last_message_at, unread_count_1, unread_count_2, 
                created_at, updated_at, conversation_scope, inbox_participant_1, 
                inbox_participant_2, status
            `, { count: 'estimated' });
        if (inboxValues && inboxValues.length > 0) {
            const hasClient = inboxValues.includes('client');
            const hasFreelancer = inboxValues.includes('freelancer');
            if (hasClient && !hasFreelancer) {
                query = query.eq('client_id', userId);
            } else if (hasFreelancer && !hasClient) {
                query = query.eq('freelancer_id', userId);
            } else {
                query = query.or(`client_id.eq.${userId},freelancer_id.eq.${userId}`);
            }
        } else {
            query = query.or(`client_id.eq.${userId},freelancer_id.eq.${userId}`);
        }

        const { data: conversationsData, error } = await supabaseWithRetry(() =>
            query.order('last_message_at', { ascending: false })
        , { timeoutMs: CONVERSATIONS_TIMEOUT_MS });

        if (error) throw error;

        const allConversations = (conversationsData ?? []) as ConversationRow[];

        const scopedConversations = inboxValues && inboxValues.length > 0
            ? allConversations.filter((conversation) => {
                if (conversation.status === 'archived') return false;

                let myRole: ConversationScope | undefined = undefined;
                if (conversation.client_id === userId) {
                    myRole = 'client';
                } else if (conversation.freelancer_id === userId) {
                    myRole = 'freelancer';
                }

                if (!myRole) {
                    const myInbox = conversation.participant_1 === userId
                        ? conversation.inbox_participant_1
                        : conversation.inbox_participant_2;
                    if (myInbox) {
                        myRole = myInbox as ConversationScope;
                    }
                }

                if (myRole) {
                    return inboxValues.includes(myRole);
                }

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
            const hasClient = scopes.includes('client');
            const hasFreelancer = scopes.includes('freelancer');

            let query = supabase
                .from('conversations')
                .select('participant_1, participant_2, client_id, freelancer_id, inbox_participant_1, inbox_participant_2, unread_count_1, unread_count_2, status');

            if (hasClient && !hasFreelancer) {
                query = query.eq('client_id', userId);
            } else if (hasFreelancer && !hasClient) {
                query = query.eq('freelancer_id', userId);
            } else {
                query = query.or(`client_id.eq.${userId},freelancer_id.eq.${userId}`);
            }

            const { data, error } = await supabaseWithRetry(() => query, { timeoutMs: 12000 });

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

        const { data, error } = await supabaseWithRetry(() => supabase
            .rpc('get_total_unread_count', { custom_user_id: userId })
        , { timeoutMs: 12000 });

        if (error) throw error;

        return { count: (data as number) ?? 0, error: null };
    } catch (error) {
        return { count: 0, error: normalizeMessageError(error) };
    }
}
