import { supabase } from '@/lib/supabase';

export type ResolvedContractInbox = 'client' | 'freelancer';
export type ConversationInboxValue = ResolvedContractInbox | 'contract' | 'shared';

type ContractParticipantsRow = {
    id: string;
    client_id: string | null;
    freelancer_id: string | null;
};

export interface ContractConversationInboxRow {
    id: string;
    participant_1: string;
    participant_2: string;
    contract_id?: string | null;
    conversation_scope?: string | null;
    inbox_participant_1?: string | null;
    inbox_participant_2?: string | null;
}

type ContractConversationInboxPatch = {
    conversation_scope: 'contract';
    inbox_participant_1: ResolvedContractInbox;
    inbox_participant_2: ResolvedContractInbox;
};

const isResolvedContractInbox = (value: unknown): value is ResolvedContractInbox => (
    value === 'client' || value === 'freelancer'
);

const shouldRepairContractConversationInbox = (row: ContractConversationInboxRow) => (
    Boolean(row.contract_id)
    && (
        !isResolvedContractInbox(row.inbox_participant_1)
        || !isResolvedContractInbox(row.inbox_participant_2)
        || row.conversation_scope !== 'contract'
    )
);

export const resolveContractConversationInboxPatch = (
    participant1: string,
    participant2: string,
    contract: ContractParticipantsRow | null | undefined,
): ContractConversationInboxPatch | null => {
    if (!contract?.client_id || !contract.freelancer_id) return null;

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

    if (!inboxParticipant1 || !inboxParticipant2 || inboxParticipant1 === inboxParticipant2) {
        return null;
    }

    return {
        conversation_scope: 'contract',
        inbox_participant_1: inboxParticipant1,
        inbox_participant_2: inboxParticipant2,
    };
};

export async function getContractConversationInboxPatch(
    participant1: string,
    participant2: string,
    contractId: string,
): Promise<ContractConversationInboxPatch | null> {
    const { data, error } = await supabase
        .from('contracts')
        .select('id, client_id, freelancer_id')
        .eq('id', contractId)
        .maybeSingle();

    if (error || !data) return null;

    return resolveContractConversationInboxPatch(participant1, participant2, data);
}

export async function repairContractConversationInboxRows<T extends ContractConversationInboxRow>(
    rows: T[],
): Promise<T[]> {
    const candidateRows = rows.filter(shouldRepairContractConversationInbox);
    if (candidateRows.length === 0) return rows;

    const contractIds = Array.from(new Set(
        candidateRows
            .map((row) => row.contract_id)
            .filter((contractId): contractId is string => Boolean(contractId)),
    ));

    if (contractIds.length === 0) return rows;

    const { data, error } = await supabase
        .from('contracts')
        .select('id, client_id, freelancer_id')
        .in('id', contractIds);

    if (error || !data) return rows;

    const contractsById = new Map<string, ContractParticipantsRow>(
        data.map((contract) => [contract.id, contract]),
    );

    const pendingRepairs = candidateRows.flatMap((row) => {
        const contract = row.contract_id ? contractsById.get(row.contract_id) : undefined;
        const patch = resolveContractConversationInboxPatch(
            row.participant_1,
            row.participant_2,
            contract,
        );

        if (!patch) return [];

        const needsRepair = row.conversation_scope !== patch.conversation_scope
            || row.inbox_participant_1 !== patch.inbox_participant_1
            || row.inbox_participant_2 !== patch.inbox_participant_2;

        return needsRepair ? [{ id: row.id, patch }] : [];
    });

    if (pendingRepairs.length === 0) return rows;

    const repairResults = await Promise.all(
        pendingRepairs.map(async ({ id, patch }) => {
            const { error: updateError } = await supabase
                .from('conversations')
                .update(patch)
                .eq('id', id);

            if (updateError) return null;

            return { id, patch };
        }),
    );

    const successfulRepairs = new Map<string, ContractConversationInboxPatch>();
    for (const result of repairResults) {
        if (result) successfulRepairs.set(result.id, result.patch);
    }

    if (successfulRepairs.size === 0) return rows;

    return rows.map((row) => {
        const patch = successfulRepairs.get(row.id);
        return patch ? { ...row, ...patch } : row;
    });
}
