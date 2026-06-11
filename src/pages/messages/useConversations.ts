import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    getConversations,
    subscribeToConversations,
    type ConversationScope,
    type Conversation,
} from '../../services/messages';
import {
    sortConversationsByActivity,
    isMissingSchemaColumnError,
    isUuidLike,
    extractRpcConversationId,
} from '../../lib/messageUtils';
import type { ContractConversationLookupRow } from './types';



const resolveConversationScopes = (activeMode: string | null | undefined): ConversationScope[] => {
    if (activeMode === 'freelancer') return ['freelancer', 'contract', 'shared'];
    if (activeMode === 'client') return ['client', 'contract', 'shared'];
    return ['client', 'freelancer', 'contract', 'shared'];
};

const isConversationVisibleInMode = (
    conversation: Conversation,
    userId: string | undefined,
    activeMode: string | null | undefined,
) => {
    if (!userId) return true;
    if (activeMode !== 'client' && activeMode !== 'freelancer') return true;

    const isParticipant1 = conversation.participant_1 === userId;
    const myInbox = isParticipant1 ? conversation.inbox_participant_1 : conversation.inbox_participant_2;

    if (myInbox === 'client' || myInbox === 'freelancer' || myInbox === 'shared') {
        return myInbox === activeMode || myInbox === 'shared';
    }
    if (myInbox === 'contract') return true;

    const scope = conversation.conversation_scope;
    if (scope === 'shared') return true;
    if (scope === 'client' || scope === 'freelancer') return scope === activeMode;
    if (scope === 'contract') return true;

    return true;
};

// Local hydration helpers
const hydrateConversationRow = async (
    userId: string,
    row: ContractConversationLookupRow,
): Promise<Conversation> => {
    const otherUserId = row.participant_1 === userId ? row.participant_2 : row.participant_1;

    let profile: { id: string; full_name: string | null; avatar_url: string | null; username?: string | null } | null = null;
    if (otherUserId) {
        const publicProfileResult = await supabase
            .from('public_profiles')
            .select('id, full_name, avatar_url, username')
            .eq('id', otherUserId)
            .maybeSingle();

        if (publicProfileResult.data) {
            profile = publicProfileResult.data;
        } else {
            const profileResult = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', otherUserId)
                .maybeSingle();

            if (profileResult.data) {
                profile = profileResult.data;
            }
        }
    }

    const isParticipant1 = row.participant_1 === userId;

    return {
        id: row.id,
        participant_1: row.participant_1,
        participant_2: row.participant_2,
        client_id: row.client_id,
        freelancer_id: row.freelancer_id,
        status: row.status || 'active',
        contract_id: row.contract_id,
        last_message_text: row.last_message_text,
        last_message_at: row.last_message_at,
        unread_count_1: row.unread_count_1 ?? 0,
        unread_count_2: row.unread_count_2 ?? 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
        conversation_scope: row.conversation_scope ?? 'shared',
        inbox_participant_1: row.inbox_participant_1 ?? undefined,
        inbox_participant_2: row.inbox_participant_2 ?? undefined,
        otherUser: {
            id: profile?.id || otherUserId || '',
            full_name: profile?.full_name || 'Unknown User',
            avatar_url: profile?.avatar_url || null,
            username: profile?.username || null,
        },
        unread_count: isParticipant1 ? (row.unread_count_1 ?? 0) : (row.unread_count_2 ?? 0),
    };
};

const fetchConversationById = async (
    userId: string,
    conversationId: string,
): Promise<Conversation | null> => {
    const buildLookup = (includeScopeColumns: boolean) => {
        const selectColumns = includeScopeColumns
            ? 'id, participant_1, participant_2, client_id, freelancer_id, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at, conversation_scope, inbox_participant_1, inbox_participant_2, status'
            : 'id, participant_1, participant_2, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at';

        return supabase
            .from('conversations')
            .select(selectColumns)
            .eq('id', conversationId)
            .maybeSingle();
    };

    let lookupResult = await buildLookup(true);

    const needsLegacySelect = (
        isMissingSchemaColumnError(lookupResult.error, 'conversations', 'conversation_scope')
        || isMissingSchemaColumnError(lookupResult.error, 'conversations', 'inbox_participant_1')
        || isMissingSchemaColumnError(lookupResult.error, 'conversations', 'inbox_participant_2')
    );

    if (needsLegacySelect) {
        lookupResult = await buildLookup(false);
    }

    const row = lookupResult.data as ContractConversationLookupRow | null;
    if (!row) return null;
    if (row.participant_1 !== userId && row.participant_2 !== userId) return null;

    return hydrateConversationRow(userId, row);
};

const fetchConversationByContractId = async (
    userId: string,
    contractId: string
): Promise<Conversation | null> => {
    const buildLookup = (
        participantColumn: 'participant_1' | 'participant_2',
        includeScopeColumns: boolean
    ) => {
        const selectColumns = includeScopeColumns
            ? 'id, participant_1, participant_2, client_id, freelancer_id, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at, conversation_scope, inbox_participant_1, inbox_participant_2, status'
            : 'id, participant_1, participant_2, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at';

        return supabase
            .from('conversations')
            .select(selectColumns)
            .eq('contract_id', contractId)
            .eq(participantColumn, userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
    };

    let [participant1Result, participant2Result] = await Promise.all([
        buildLookup('participant_1', true),
        buildLookup('participant_2', true),
    ]);

    const needsLegacySelect = (
        isMissingSchemaColumnError(participant1Result.error, 'conversations', 'conversation_scope')
        || isMissingSchemaColumnError(participant1Result.error, 'conversations', 'inbox_participant_1')
        || isMissingSchemaColumnError(participant1Result.error, 'conversations', 'inbox_participant_2')
        || isMissingSchemaColumnError(participant2Result.error, 'conversations', 'conversation_scope')
        || isMissingSchemaColumnError(participant2Result.error, 'conversations', 'inbox_participant_1')
        || isMissingSchemaColumnError(participant2Result.error, 'conversations', 'inbox_participant_2')
    );

    if (needsLegacySelect) {
        [participant1Result, participant2Result] = await Promise.all([
            buildLookup('participant_1', false),
            buildLookup('participant_2', false),
        ]);
    }

    const row = (participant1Result.data || participant2Result.data) as ContractConversationLookupRow | null;
    if (!row) return null;

    return hydrateConversationRow(userId, row);
};

const fetchConversationByParticipants = async (
    userId: string,
    otherUserId: string,
): Promise<Conversation | null> => {
    const [participant1, participant2] = userId < otherUserId
        ? [userId, otherUserId]
        : [otherUserId, userId];

    const buildLookup = (includeScopeColumns: boolean) => {
        const selectColumns = includeScopeColumns
            ? 'id, participant_1, participant_2, client_id, freelancer_id, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at, conversation_scope, inbox_participant_1, inbox_participant_2, status'
            : 'id, participant_1, participant_2, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at';

        return supabase
            .from('conversations')
            .select(selectColumns)
            .eq('participant_1', participant1)
            .eq('participant_2', participant2)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
    };

    let lookupResult = await buildLookup(true);

    const needsLegacySelect = (
        isMissingSchemaColumnError(lookupResult.error, 'conversations', 'conversation_scope')
        || isMissingSchemaColumnError(lookupResult.error, 'conversations', 'inbox_participant_1')
        || isMissingSchemaColumnError(lookupResult.error, 'conversations', 'inbox_participant_2')
    );

    if (needsLegacySelect) {
        lookupResult = await buildLookup(false);
    }

    const row = lookupResult.data as ContractConversationLookupRow | null;
    if (!row) return null;

    return hydrateConversationRow(userId, row);
};

const createContractConversationFallback = async (
    userId: string,
    otherUserId: string,
    contractId: string,
): Promise<Conversation | null> => {
    const [participant1, participant2] = userId < otherUserId
        ? [userId, otherUserId]
        : [otherUserId, userId];

    const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('id, client_id, freelancer_id')
        .eq('id', contractId)
        .maybeSingle();

    if (contractError || !contract) return null;

    const inboxParticipant1 = participant1 === contract.client_id
        ? 'client'
        : participant1 === contract.freelancer_id
            ? 'freelancer'
            : null;
    const inboxParticipant2 = participant2 === contract.client_id
        ? 'client'
        : participant2 === contract.freelancer_id
            ? 'freelancer'
            : null;

    const insertModern = () => supabase
        .from('conversations')
        .insert({
            participant_1: participant1,
            participant_2: participant2,
            client_id: contract.client_id,
            freelancer_id: contract.freelancer_id,
            contract_id: contractId,
            conversation_scope: 'contract',
            inbox_participant_1: inboxParticipant1,
            inbox_participant_2: inboxParticipant2,
            status: 'active',
        })
        .select('id')
        .maybeSingle();

    const insertLegacy = () => supabase
        .from('conversations')
        .insert({
            participant_1: participant1,
            participant_2: participant2,
            contract_id: contractId,
        })
        .select('id')
        .maybeSingle();

    let insertResult = await insertModern();

    const shouldRetryLegacyInsert = (
        isMissingSchemaColumnError(insertResult.error, 'conversations', 'conversation_scope')
        || isMissingSchemaColumnError(insertResult.error, 'conversations', 'inbox_participant_1')
        || isMissingSchemaColumnError(insertResult.error, 'conversations', 'inbox_participant_2')
        || isMissingSchemaColumnError(insertResult.error, 'conversations', 'client_id')
        || isMissingSchemaColumnError(insertResult.error, 'conversations', 'freelancer_id')
    );

    if (shouldRetryLegacyInsert) {
        insertResult = await insertLegacy();
    }

    const insertedConversationId = (
        insertResult.data
        && typeof insertResult.data === 'object'
        && 'id' in insertResult.data
        && typeof (insertResult.data as { id?: unknown }).id === 'string'
    )
        ? (insertResult.data as { id: string }).id
        : null;

    if (insertedConversationId) {
        return fetchConversationById(userId, insertedConversationId);
    }

    const duplicateKey = (insertResult.error as { code?: string } | null)?.code === '23505';
    if (!insertResult.error || duplicateKey) {
        const contractConversation = await fetchConversationByContractId(userId, contractId);
        if (contractConversation) return contractConversation;

        const pairConversation = await fetchConversationByParticipants(userId, otherUserId);
        if (pairConversation) return pairConversation;
    }

    return null;
};

interface UseConversationsProps {
    user: any;
    activeMode: string | null | undefined;
    profile: any;
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    tx: any;
    prefetchConversationMessages: (convId: string) => Promise<void>;
    setShowMobileThread: (val: boolean) => void;
    setShowConversationsList: React.Dispatch<React.SetStateAction<boolean>>;
    setShowContractPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useConversations({
    user,
    activeMode,
    profile,
    showToast,
    tx,
    prefetchConversationMessages,
    setShowMobileThread,
    setShowConversationsList,
    setShowContractPanel
}: UseConversationsProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [showArchived, setShowArchived] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreConversations, setHasMoreConversations] = useState(true);
    const [page, setPage] = useState(0);

    const [archivedConversationIds, setArchivedConversationIds] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem('workedin_archived_conversations');
            return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
        } catch {
            return new Set();
        }
    });

    const [unarchivedConversationIds, setUnarchivedConversationIds] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem('workedin_unarchived_conversations');
            return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
        } catch {
            return new Set();
        }
    });

    const conversationsChannelRef = useRef<any>(null);
    const contractBootstrapAttemptsRef = useRef<Set<string>>(new Set());

    const conversationsModeCacheKey = useMemo(() => {
        if (activeMode === 'client' || activeMode === 'freelancer') return activeMode;
        return 'all';
    }, [activeMode]);

    const conversationScopes = useMemo(() => resolveConversationScopes(activeMode ?? profile?.active_mode), [
        activeMode,
        profile?.active_mode,
    ]);

    const routeContractId = useMemo(() => {
        const fromQuery = searchParams.get('contract');
        if (fromQuery) return fromQuery;
        return (location.state as { contractId?: string } | null)?.contractId || null;
    }, [searchParams, location.state]);

    const routeOtherUserId = useMemo(() => {
        const fromQuery = searchParams.get('with');
        if (fromQuery) return fromQuery;
        return (location.state as { otherUserId?: string } | null)?.otherUserId || null;
    }, [searchParams, location.state]);

    const archiveConversation = useCallback((conversationId: string) => {
        setArchivedConversationIds(prev => {
            const next = new Set(prev);
            next.add(conversationId);
            localStorage.setItem('workedin_archived_conversations', JSON.stringify(Array.from(next)));
            return next;
        });
        setUnarchivedConversationIds(prev => {
            const next = new Set(prev);
            next.delete(conversationId);
            localStorage.setItem('workedin_unarchived_conversations', JSON.stringify(Array.from(next)));
            return next;
        });
        showToast(tx('pages.messages.archiveSuccess', undefined, 'Conversation archived'), 'success');
        if (selectedConversation?.id === conversationId) {
            setSelectedConversation(null);
        }
    }, [selectedConversation?.id, showToast, tx]);

    const unarchiveConversation = useCallback((conversationId: string) => {
        setArchivedConversationIds(prev => {
            const next = new Set(prev);
            next.delete(conversationId);
            localStorage.setItem('workedin_archived_conversations', JSON.stringify(Array.from(next)));
            return next;
        });
        setUnarchivedConversationIds(prev => {
            const next = new Set(prev);
            next.add(conversationId);
            localStorage.setItem('workedin_unarchived_conversations', JSON.stringify(Array.from(next)));
            return next;
        });
        showToast(tx('pages.messages.unarchiveSuccess', undefined, 'Conversation returned to inbox'), 'success');
    }, [showToast, tx]);

    const handleSelectConversation = useCallback(async (conversation: Conversation) => {
        if (selectedConversation?.id === conversation.id) return;

        const seenCount = Math.max(0, Math.floor(conversation.unread_count || 0));
        if (seenCount > 0 && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('messages:unread-seen', { detail: { count: seenCount } }));
        }

        setSelectedConversation(conversation);
        setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, unread_count: 0 } : c));

        setShowMobileThread(true);
        setShowConversationsList(false);
        setShowContractPanel(false);
    }, [selectedConversation?.id, setShowMobileThread, setShowConversationsList, setShowContractPanel]);

    const onLoadMore = useCallback(() => {
        setPage(p => p + 1);
    }, []);

    // Reset conversation states on mode switches
    useEffect(() => {
        setConversations([]);
        setSelectedConversation(null);
        setPage(0);
        setHasMoreConversations(true);
        setIsLoadingConversations(true);
        contractBootstrapAttemptsRef.current.clear();
    }, [user?.id, conversationsModeCacheKey, activeMode, profile?.active_mode]);

    // Prefetch conversations messages
    useEffect(() => {
        if (!user?.id || conversations.length === 0) return;
        conversations.slice(0, 4).forEach((conversation) => {
            void prefetchConversationMessages(conversation.id);
        });
    }, [user?.id, conversations, prefetchConversationMessages]);

    // Bootstrap routing conversations
    useEffect(() => {
        if (!user?.id || !routeContractId || isLoadingConversations) return;

        if (!isUuidLike(routeContractId)) {
            console.warn('[Messages] Ignoring invalid contract route id', routeContractId);
            navigate('/messages', { replace: true, state: null });
            return;
        }

        const existingContractConversation = conversations.find(
            (conversation) => conversation.contract_id === routeContractId
        );
        if (existingContractConversation) {
            void handleSelectConversation(existingContractConversation);
            navigate('/messages', { replace: true, state: null });
            return;
        }

        const attemptKey = `${user.id}:${routeContractId}`;
        if (contractBootstrapAttemptsRef.current.has(attemptKey)) return;
        contractBootstrapAttemptsRef.current.add(attemptKey);

        let cancelled = false;

        const bootstrapContractConversation = async () => {
            const directExistingConversation = await fetchConversationByContractId(user.id, routeContractId);
            if (cancelled) return;

            if (directExistingConversation) {
                setConversations((prev) => {
                    const withoutExisting = prev.filter((conversation) => conversation.id !== directExistingConversation.id);
                    return sortConversationsByActivity([...withoutExisting, directExistingConversation]);
                });
                await handleSelectConversation(directExistingConversation);
                navigate('/messages', { replace: true, state: null });
                return;
            }

            const contractConversationRpcResult = await supabase.rpc('get_or_create_contract_conversation', {
                p_contract_id: routeContractId,
            });

            if (cancelled) return;

            if (!contractConversationRpcResult.error) {
                const conversationIdFromContractRpc = extractRpcConversationId(contractConversationRpcResult.data);
                if (conversationIdFromContractRpc) {
                    const conversationFromContractRpcId = await fetchConversationById(user.id, conversationIdFromContractRpc);
                    if (cancelled) return;

                    if (conversationFromContractRpcId) {
                        setConversations((prev) => {
                            const withoutExisting = prev.filter((conversation) => conversation.id !== conversationFromContractRpcId.id);
                            return sortConversationsByActivity([...withoutExisting, conversationFromContractRpcId]);
                        });
                        await handleSelectConversation(conversationFromContractRpcId);
                        navigate('/messages', { replace: true, state: null });
                        return;
                    }
                }

                const conversationFromContractRpc = await fetchConversationByContractId(user.id, routeContractId);
                if (cancelled) return;

                if (conversationFromContractRpc) {
                    setConversations((prev) => {
                        const withoutExisting = prev.filter((conversation) => conversation.id !== conversationFromContractRpc.id);
                        return sortConversationsByActivity([...withoutExisting, conversationFromContractRpc]);
                    });
                    await handleSelectConversation(conversationFromContractRpc);
                    navigate('/messages', { replace: true, state: null });
                    return;
                }
            } else {
                const normalizedRpcMessage = String(contractConversationRpcResult.error.message || '').toLowerCase();
                const rpcMissing = normalizedRpcMessage.includes('get_or_create_contract_conversation')
                    && normalizedRpcMessage.includes('does not exist');

                if (!rpcMissing) {
                    console.warn('[Messages] get_or_create_contract_conversation RPC failed; using fallback bootstrap', contractConversationRpcResult.error);
                }
            }

            let otherUserId: string | null = isUuidLike(routeOtherUserId) ? routeOtherUserId : null;

            if (!otherUserId) {
                const { data: contractRow, error: contractError } = await supabase
                    .from('contracts')
                    .select('id, client_id, freelancer_id')
                    .eq('id', routeContractId)
                    .maybeSingle();

                if (cancelled) return;

                if (contractError || !contractRow) {
                    console.warn('[Messages] Contract conversation bootstrap failed to load contract', contractError);
                    contractBootstrapAttemptsRef.current.delete(attemptKey);
                    return;
                }

                const isClient = contractRow.client_id === user.id;
                const isFreelancer = contractRow.freelancer_id === user.id;
                if (!isClient && !isFreelancer) {
                    contractBootstrapAttemptsRef.current.delete(attemptKey);
                    return;
                }

                otherUserId = isClient ? contractRow.freelancer_id : contractRow.client_id;
            }

            if (!otherUserId) {
                contractBootstrapAttemptsRef.current.delete(attemptKey);
                return;
            }

            let rpcResult = await supabase.rpc('get_or_create_conversation', {
                user1: user.id,
                user2: otherUserId,
                p_contract_id: routeContractId,
                p_scope: 'contract',
            });

            if (rpcResult.error) {
                const normalizedError = String(rpcResult.error.message || '').toLowerCase();
                const shouldRetryLegacy = normalizedError.includes('p_scope')
                    || (normalizedError.includes('get_or_create_conversation') && normalizedError.includes('does not exist'));

                if (shouldRetryLegacy) {
                    rpcResult = await supabase.rpc('get_or_create_conversation', {
                        user1: user.id,
                        user2: otherUserId,
                        p_contract_id: routeContractId,
                    });
                }
            }

            if (cancelled) return;

            if (rpcResult.error) {
                console.warn('[Messages] Contract conversation bootstrap RPC failed; trying existing conversation fallback', rpcResult.error);
            }

            const conversationIdFromLegacyRpc = extractRpcConversationId(rpcResult.data);
            if (conversationIdFromLegacyRpc) {
                const conversationFromLegacyRpcId = await fetchConversationById(user.id, conversationIdFromLegacyRpc);

                if (cancelled) return;

                if (conversationFromLegacyRpcId) {
                    setConversations((prev) => {
                        const withoutExisting = prev.filter((conversation) => conversation.id !== conversationFromLegacyRpcId.id);
                        return sortConversationsByActivity([...withoutExisting, conversationFromLegacyRpcId]);
                    });
                    await handleSelectConversation(conversationFromLegacyRpcId);
                    navigate('/messages', { replace: true, state: null });
                    return;
                }
            }

            const forcedContractConversation = await fetchConversationByContractId(user.id, routeContractId);

            if (cancelled) return;

            if (forcedContractConversation) {
                setConversations((prev) => {
                    const withoutExisting = prev.filter((conversation) => conversation.id !== forcedContractConversation.id);
                    return sortConversationsByActivity([...withoutExisting, forcedContractConversation]);
                });
                await handleSelectConversation(forcedContractConversation);
                navigate('/messages', { replace: true, state: null });
                return;
            }

            const insertedContractConversation = await createContractConversationFallback(
                user.id,
                otherUserId,
                routeContractId,
            );

            if (cancelled) return;

            if (insertedContractConversation) {
                setConversations((prev) => {
                    const withoutExisting = prev.filter((conversation) => conversation.id !== insertedContractConversation.id);
                    return sortConversationsByActivity([...withoutExisting, insertedContractConversation]);
                });
                await handleSelectConversation(insertedContractConversation);
                navigate('/messages', { replace: true, state: null });
                return;
            }

            let fallbackDirectRpc = await supabase.rpc('get_or_create_conversation', {
                user1: user.id,
                user2: otherUserId,
                p_contract_id: null,
                p_scope: 'shared',
            });

            if (fallbackDirectRpc.error) {
                const fallbackDirectError = String(fallbackDirectRpc.error.message || '').toLowerCase();
                const retryLegacyDirect = fallbackDirectError.includes('p_scope')
                    || (fallbackDirectError.includes('get_or_create_conversation') && fallbackDirectError.includes('does not exist'));

                if (retryLegacyDirect) {
                    fallbackDirectRpc = await supabase.rpc('get_or_create_conversation', {
                        user1: user.id,
                        user2: otherUserId,
                        p_contract_id: null,
                    });
                }
            }

            if (!fallbackDirectRpc.error) {
                const directConversationId = extractRpcConversationId(fallbackDirectRpc.data);
                if (directConversationId) {
                    const directConversation = await fetchConversationById(user.id, directConversationId);
                    if (cancelled) return;

                    if (directConversation) {
                        setConversations((prev) => {
                            const withoutExisting = prev.filter((conversation) => conversation.id !== directConversation.id);
                            return sortConversationsByActivity([...withoutExisting, directConversation]);
                        });
                        await handleSelectConversation(directConversation);
                        navigate('/messages', { replace: true, state: null });
                        return;
                    }
                }
            }

            const fallbackPairConversation = await fetchConversationByParticipants(user.id, otherUserId);
            if (cancelled) return;

            if (fallbackPairConversation) {
                setConversations((prev) => {
                    const withoutExisting = prev.filter((conversation) => conversation.id !== fallbackPairConversation.id);
                    return sortConversationsByActivity([...withoutExisting, fallbackPairConversation]);
                });
                await handleSelectConversation(fallbackPairConversation);
                navigate('/messages', { replace: true, state: null });
                return;
            }

            showToast(
                tx(
                    'pages.messages.contractOpenFailed',
                    undefined,
                    'Could not open this contract thread yet. Please refresh and try again.',
                ),
                'warning',
            );
            navigate('/messages', { replace: true, state: null });
            contractBootstrapAttemptsRef.current.delete(attemptKey);
        };

        void bootstrapContractConversation();

        return () => {
            cancelled = true;
        };
    }, [
        user?.id,
        routeContractId,
        routeOtherUserId,
        isLoadingConversations,
        conversations,
        activeMode,
        profile?.active_mode,
        handleSelectConversation,
        navigate,
        showToast,
        tx,
    ]);

    // Auto-select conversation
    useEffect(() => {
        if (isLoadingConversations) return;
        if (conversations.length === 0) return;

        const targetConversationId = searchParams.get('conversation');
        const targetContractId = routeContractId;

        let match: Conversation | undefined;

        if (targetConversationId) {
            match = conversations.find((conversation) => conversation.id === targetConversationId);
        }

        if (!match && targetContractId) {
            match = conversations.find((conversation) => conversation.contract_id === targetContractId);
        }

        const alreadySelected = match && selectedConversation?.id === match.id;

        if (match && !alreadySelected) {
            void handleSelectConversation(match);
            navigate('/messages', { replace: true, state: null });
        }
    }, [
        searchParams,
        conversations,
        routeContractId,
        handleSelectConversation,
        isLoadingConversations,
        navigate,
        selectedConversation?.id,
    ]);

    // Load initial conversations & setup real-time channel
    useEffect(() => {
        if (!user) return;

        const loadConversations = async (currentPage: number, append: boolean = false) => {
            if (!append && conversations.length === 0) setIsLoadingConversations(true);
            if (append) setIsLoadingMore(true);

            const limit = 20;
            const { data, count, error } = await getConversations(user.id, currentPage, limit, {
                scopes: conversationScopes,
            });

            if (error) {
                showToast(error.message, 'error');
                setIsLoadingConversations(false);
                setIsLoadingMore(false);
            } else if (data) {
                let scopedData = data.filter((conversation) => (
                    isConversationVisibleInMode(conversation, user.id, activeMode ?? profile?.active_mode)
                    || (routeContractId ? conversation.contract_id === routeContractId : false)
                ));

                if (routeContractId && !scopedData.some((conversation) => conversation.contract_id === routeContractId)) {
                    const directRouteConversation = await fetchConversationByContractId(user.id, routeContractId);
                    if (directRouteConversation) {
                        const withoutExisting = scopedData.filter((conversation) => conversation.id !== directRouteConversation.id);
                        scopedData = sortConversationsByActivity([...withoutExisting, directRouteConversation]);
                    }
                }

                if (append) {
                    setConversations(prev => {
                        const existingIds = new Set(prev.map(c => c.id));
                        const uniqueNew = scopedData.filter(c => !existingIds.has(c.id));
                        return sortConversationsByActivity([...prev, ...uniqueNew]);
                    });
                } else {
                    setConversations(sortConversationsByActivity(scopedData));
                }
                setHasMoreConversations((currentPage + 1) * limit < (count || 0));
                setIsLoadingConversations(false);
                setIsLoadingMore(false);
            } else {
                setIsLoadingConversations(false);
                setIsLoadingMore(false);
            }
        };

        void loadConversations(page, page > 0);

        if (page === 0) {
            conversationsChannelRef.current = subscribeToConversations(user.id, conversationScopes, (payload) => {
                const eventType = payload.eventType;
                if (eventType === 'UPDATE') {
                    const changed = payload.new as any;
                    setConversations(prev => {
                        const idx = prev.findIndex(c => c.id === changed.id);
                        if (idx > -1) {
                            const updated = [...prev];
                            const isParticipant1 = changed.participant_1 === user.id;
                            const unread_count = isParticipant1 ? changed.unread_count_1 : changed.unread_count_2;
                            updated[idx] = {
                                ...updated[idx],
                                last_message_text: changed.last_message_text,
                                last_message_at: changed.last_message_at,
                                unread_count: unread_count || 0,
                            };
                            return sortConversationsByActivity(updated);
                        }
                        loadConversations(0, false);
                        return prev;
                    });
                } else if (eventType === 'INSERT') {
                    loadConversations(0, false);
                    setPage(0);
                }
            });
        }

        return () => {
            if (page === 0 && conversationsChannelRef.current) {
                conversationsChannelRef.current.unsubscribe();
            }
        };
    }, [user?.id, page, conversationScopes.join('|'), routeContractId, activeMode, profile?.active_mode]);

    // Reset pagination when search query or filter changes
    useEffect(() => {
        setPage(0);
    }, [filter, searchQuery]);

    const conversationSummaryLabel = useMemo(() => {
        const total = conversations.length;
        const unread = conversations.filter(c => c.unread_count > 0).length;
        if (unread > 0) {
            return tx('pages.messages.summaryUnread', { total, unread }, `${total} chats, ${unread} unread`);
        }
        return tx('pages.messages.summaryEmpty', { total }, `${total} active chats`);
    }, [conversations, tx]);

    return {
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
        searchQuery,
        setSearchQuery,
        filter,
        setFilter,
        showArchived,
        setShowArchived,
        archivedConversationIds,
        unarchivedConversationIds,
        isLoadingConversations,
        setIsLoadingConversations,
        hasMoreConversations,
        isLoadingMore,
        page,
        setPage,
        conversationSummaryLabel,
        archiveConversation,
        unarchiveConversation,
        handleSelectConversation,
        onLoadMore,
    };
}
