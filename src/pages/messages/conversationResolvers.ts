import { supabase } from '../../lib/supabase';
import { isMissingSchemaColumnError } from '../../lib/messageUtils';
import type { Conversation, ConversationScope } from '../../services/messages';
import type { ContractConversationLookupRow } from './types';

const SCOPE_SELECT_COLUMNS =
    'id, participant_1, participant_2, client_id, freelancer_id, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at, conversation_scope, inbox_participant_1, inbox_participant_2, status';
const LEGACY_SELECT_COLUMNS =
    'id, participant_1, participant_2, contract_id, last_message_text, last_message_at, unread_count_1, unread_count_2, created_at, updated_at';

export const hydrateConversationRow = async (
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

export const fetchConversationById = async (
    userId: string,
    conversationId: string,
): Promise<Conversation | null> => {
    const buildLookup = (includeScopeColumns: boolean) => {
        const selectColumns = includeScopeColumns ? SCOPE_SELECT_COLUMNS : LEGACY_SELECT_COLUMNS;
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

export const fetchConversationByContractId = async (
    userId: string,
    contractId: string,
): Promise<Conversation | null> => {
    const buildLookup = (
        participantColumn: 'participant_1' | 'participant_2',
        includeScopeColumns: boolean,
    ) => {
        const selectColumns = includeScopeColumns ? SCOPE_SELECT_COLUMNS : LEGACY_SELECT_COLUMNS;
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

export const fetchConversationByParticipants = async (
    userId: string,
    otherUserId: string,
): Promise<Conversation | null> => {
    const [participant1, participant2] = userId < otherUserId
        ? [userId, otherUserId]
        : [otherUserId, userId];

    const buildLookup = (includeScopeColumns: boolean) => {
        const selectColumns = includeScopeColumns ? SCOPE_SELECT_COLUMNS : LEGACY_SELECT_COLUMNS;
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

export const createContractConversationFallback = async (
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
