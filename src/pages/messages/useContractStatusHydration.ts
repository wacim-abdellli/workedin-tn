import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { getJobById } from '../../services/jobs';
import { normalizeContractStatus, type ContractMessagingStatus } from '../../lib/messagingLifecycle';
import { isMissingSchemaColumnError } from '../../lib/messageUtils';
import type { Conversation } from '../../services/messages';
import type { ContractSessionMeta } from './types';

type ContractSessionRow = Omit<ContractSessionMeta, 'linked_contract_id'> & {
    proposal_id?: string | null;
    created_at?: string | null;
};

type ProposalTitleFallbackRow = {
    id: string;
    job_id: string | null;
    freelancer_id: string | null;
    status: string | null;
    created_at?: string | null;
};

type JobTitleLookupRow = {
    id: string;
    title: string | null;
    deadline?: string | null;
    client_id?: string | null;
};

const CONTRACT_SELECT_COLUMNS =
    'id, proposal_id, status, title, amount, total_amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, revision_requested_at, client_id, freelancer_id, job_id, created_at, delivery_note';
const LEGACY_CONTRACT_SELECT_COLUMNS =
    'id, proposal_id, status, title, amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, revision_requested_at, client_id, freelancer_id, job_id, created_at, delivery_note';

interface UseContractStatusHydrationParams {
    conversations: Conversation[];
    userId: string | undefined;
}

interface UseContractStatusHydrationReturn {
    contractConversationIds: string[];
    contractStatusById: Record<string, ContractMessagingStatus>;
    contractSessionMetaById: Record<string, ContractSessionMeta>;
    contractStatusesHydrated: boolean;
    setContractSessionMetaById: React.Dispatch<React.SetStateAction<Record<string, ContractSessionMeta>>>;
    setContractStatusById: React.Dispatch<React.SetStateAction<Record<string, ContractMessagingStatus>>>;
}

export function useContractStatusHydration({
    conversations,
    userId,
}: UseContractStatusHydrationParams): UseContractStatusHydrationReturn {
    const [contractStatusById, setContractStatusById] = useState<Record<string, ContractMessagingStatus>>(() => {
        try {
            const cached = sessionStorage.getItem('workedin_contract_statuses');
            return cached ? (JSON.parse(cached) as Record<string, ContractMessagingStatus>) : {};
        } catch {
            return {};
        }
    });

    const [contractStatusesHydrated, setContractStatusesHydrated] = useState(false);
    const [contractSessionMetaById, setContractSessionMetaById] = useState<Record<string, ContractSessionMeta>>({});

    const contractConversationIds = useMemo(() => {
        return Array.from(
            new Set(
                conversations
                    .map((conversation) => conversation.contract_id)
                    .filter((contractId): contractId is string => Boolean(contractId))
            )
        ).sort();
    }, [conversations]);

    const contractConversationIdsKey = useMemo(() => contractConversationIds.join('|'), [contractConversationIds]);

    useEffect(() => {
        if (Object.keys(contractStatusById).length === 0) return;
        try {
            sessionStorage.setItem('workedin_contract_statuses', JSON.stringify(contractStatusById));
        } catch {
            // sessionStorage quota exceeded or unavailable — safe to ignore
        }
    }, [contractStatusById]);

    useEffect(() => {
        if (contractConversationIds.length === 0) {
            setContractStatusById({});
            setContractSessionMetaById({});
            return;
        }

        let cancelled = false;

        const loadContractStatuses = async () => {
            const fetchContractRows = async (
                field: 'id' | 'proposal_id' | 'job_id' | 'client_id' | 'freelancer_id',
                ids: string[],
                extraEq?: { column: 'client_id' | 'freelancer_id'; value: string } | null,
            ) => {
                if (ids.length === 0) {
                    return { data: [] as ContractSessionRow[], error: null };
                }

                const runLookup = (selectColumns: string) => {
                    let query = supabase
                        .from('contracts')
                        .select(selectColumns);

                    if (extraEq) {
                        query = query.eq(extraEq.column, extraEq.value);
                    }

                    return query.in(field, ids);
                };

                let result = await runLookup(CONTRACT_SELECT_COLUMNS);

                if (isMissingSchemaColumnError(result.error, 'contracts', 'total_amount')) {
                    result = await runLookup(LEGACY_CONTRACT_SELECT_COLUMNS);
                }

                return result as { data: ContractSessionRow[] | null; error: unknown };
            };

            try {
                const { data, error } = await fetchContractRows('id', contractConversationIds);

                if (cancelled) return;

                if (error) {
                    console.warn('[Messages] Failed to load contract statuses for lifecycle policy', error);
                    return;
                }

                const rowByConversationContractId = new Map<string, ContractSessionRow>();
                const hydrateRow = (conversationContractId: string, row: ContractSessionRow) => {
                    if (!conversationContractId) return;

                    const existing = rowByConversationContractId.get(conversationContractId);
                    if (!existing) {
                        rowByConversationContractId.set(conversationContractId, row);
                        return;
                    }

                    const existingTitle = typeof existing.title === 'string' ? existing.title.trim() : '';
                    const incomingTitle = typeof row.title === 'string' ? row.title.trim() : '';
                    const shouldReplace = (!existingTitle && !!incomingTitle)
                        || (!existing.job_id && !!row.job_id);

                    if (shouldReplace) {
                        rowByConversationContractId.set(conversationContractId, row);
                    }
                };

                const primaryRows = (data ?? []) as Array<ContractSessionRow>;
                for (const row of primaryRows) {
                    if (!row?.id) continue;
                    hydrateRow(row.id, row);
                }

                const conversationByContractId = new Map<string, Conversation>();
                for (const conversation of conversations) {
                    if (!conversation.contract_id) continue;
                    conversationByContractId.set(conversation.contract_id, conversation);
                }

                let unresolvedConversationContractIds = contractConversationIds.filter(
                    (contractId) => !rowByConversationContractId.has(contractId)
                );

                if (unresolvedConversationContractIds.length > 0) {
                    const { data: proposalLinkedRows, error: proposalLinkedError } = await fetchContractRows(
                        'proposal_id',
                        unresolvedConversationContractIds
                    );

                    if (cancelled) return;

                    if (proposalLinkedError) {
                        console.warn('[Messages] Failed to load proposal-linked contract statuses for lifecycle policy', proposalLinkedError);
                    } else {
                        for (const row of (proposalLinkedRows ?? []) as Array<ContractSessionRow>) {
                            const proposalId = typeof row?.proposal_id === 'string' ? row.proposal_id : '';
                            if (!proposalId) continue;
                            hydrateRow(proposalId, row);
                        }

                        unresolvedConversationContractIds = unresolvedConversationContractIds.filter(
                            (contractId) => !rowByConversationContractId.has(contractId)
                        );
                    }
                }

                if (unresolvedConversationContractIds.length > 0) {
                    const { data: jobLinkedRows, error: jobLinkedError } = await fetchContractRows(
                        'job_id',
                        unresolvedConversationContractIds
                    );

                    if (cancelled) return;

                    if (jobLinkedError) {
                        console.warn('[Messages] Failed to load job-linked contract statuses for lifecycle policy', jobLinkedError);
                    } else {
                        for (const row of (jobLinkedRows ?? []) as Array<ContractSessionRow>) {
                            const jobId = typeof row?.job_id === 'string' ? row.job_id : '';
                            if (!jobId) continue;
                            hydrateRow(jobId, row);
                        }
                    }
                }

                if (unresolvedConversationContractIds.length > 0 && userId) {
                    const partnerIdByConversationContractId: Record<string, string> = {};
                    for (const unresolvedId of unresolvedConversationContractIds) {
                        const partnerId = conversationByContractId.get(unresolvedId)?.otherUser.id;
                        if (!partnerId) continue;
                        partnerIdByConversationContractId[unresolvedId] = partnerId;
                    }

                    const partnerIds = Array.from(new Set(Object.values(partnerIdByConversationContractId)));

                    if (partnerIds.length > 0) {
                        const [asClientResult, asFreelancerResult] = await Promise.all([
                            fetchContractRows('freelancer_id', partnerIds, { column: 'client_id', value: userId }),
                            fetchContractRows('client_id', partnerIds, { column: 'freelancer_id', value: userId }),
                        ]);

                        if (cancelled) return;

                        if (asClientResult.error) {
                            console.warn('[Messages] Failed partner contract lookup (as client)', asClientResult.error);
                        }
                        if (asFreelancerResult.error) {
                            console.warn('[Messages] Failed partner contract lookup (as freelancer)', asFreelancerResult.error);
                        }

                        const pickPreferredRow = (current: ContractSessionRow | undefined, candidate: ContractSessionRow) => {
                            if (!current) return candidate;

                            const currentTitle = typeof current.title === 'string' ? current.title.trim() : '';
                            const candidateTitle = typeof candidate.title === 'string' ? candidate.title.trim() : '';
                            if (!currentTitle && candidateTitle) return candidate;
                            if (currentTitle && !candidateTitle) return current;

                            const currentCreatedAt = Date.parse(String(current.created_at || ''));
                            const candidateCreatedAt = Date.parse(String(candidate.created_at || ''));
                            if (!Number.isFinite(currentCreatedAt)) return candidate;
                            if (!Number.isFinite(candidateCreatedAt)) return current;
                            return candidateCreatedAt > currentCreatedAt ? candidate : current;
                        };

                        const partnerBestRow: Record<string, ContractSessionRow> = {};
                        const partnerRows = [
                            ...((asClientResult.data ?? []) as Array<ContractSessionRow>),
                            ...((asFreelancerResult.data ?? []) as Array<ContractSessionRow>),
                        ];

                        for (const row of partnerRows) {
                            if (!row) continue;
                            const partnerId = row.client_id === userId ? row.freelancer_id : row.client_id;
                            if (!partnerId) continue;

                            partnerBestRow[partnerId] = pickPreferredRow(partnerBestRow[partnerId], row);
                        }

                        for (const unresolvedId of unresolvedConversationContractIds) {
                            const partnerId = partnerIdByConversationContractId[unresolvedId];
                            if (!partnerId) continue;
                            const row = partnerBestRow[partnerId];
                            if (!row) continue;
                            hydrateRow(unresolvedId, row);
                        }
                    }
                }

                unresolvedConversationContractIds = contractConversationIds.filter(
                    (contractId) => !rowByConversationContractId.has(contractId)
                );

                const resolvedRows = Array.from(rowByConversationContractId.entries());

                const proposalIdsNeedingJobLookup = Array.from(new Set([
                    ...unresolvedConversationContractIds,
                    ...resolvedRows
                        .filter(([, row]) => {
                            const proposalId = typeof row?.proposal_id === 'string' ? row.proposal_id : '';
                            if (!proposalId) return false;

                            const existingTitle = typeof row.title === 'string' ? row.title.trim() : '';
                            const hasJobId = typeof row.job_id === 'string' && row.job_id.trim().length > 0;
                            return !hasJobId || existingTitle.length === 0;
                        })
                        .map(([, row]) => row.proposal_id as string),
                ]));

                const proposalJobIdByProposalId: Record<string, string> = {};
                if (proposalIdsNeedingJobLookup.length > 0) {
                    const { data: proposalRows, error: proposalRowsError } = await supabase
                        .from('proposals')
                        .select('id, job_id')
                        .in('id', proposalIdsNeedingJobLookup);

                    if (cancelled) return;

                    if (proposalRowsError) {
                        console.warn('[Messages] Failed to load proposal rows for conversation title fallback', proposalRowsError);
                    } else {
                        for (const proposal of (proposalRows ?? []) as Array<{ id: string; job_id: string | null }>) {
                            const proposalId = typeof proposal?.id === 'string' ? proposal.id : '';
                            const jobId = typeof proposal?.job_id === 'string' ? proposal.job_id : '';
                            if (!proposalId || !jobId) continue;
                            proposalJobIdByProposalId[proposalId] = jobId;
                        }
                    }
                }

                const jobIdsNeedingTitle = Array.from(new Set(
                    resolvedRows
                        .map(([, row]) => {
                            const existingTitle = typeof row.title === 'string' ? row.title.trim() : '';
                            if (existingTitle.length > 0) return null;

                            const directJobId = typeof row.job_id === 'string' ? row.job_id.trim() : '';
                            if (directJobId) return directJobId;

                            const proposalId = typeof row.proposal_id === 'string' ? row.proposal_id : '';
                            return proposalId ? proposalJobIdByProposalId[proposalId] || null : null;
                        })
                        .filter((jobId): jobId is string => Boolean(jobId))
                ));

                const fallbackJobIds = Array.from(new Set([
                    ...jobIdsNeedingTitle,
                    ...unresolvedConversationContractIds,
                    ...Object.values(proposalJobIdByProposalId),
                ]));

                const jobTitleById: Record<string, string> = {};
                const jobDeadlineById: Record<string, string> = {};

                if (fallbackJobIds.length > 0) {
                    const { data: jobsData, error: jobsError } = await supabase
                        .from('jobs')
                        .select('id, title, deadline')
                        .in('id', fallbackJobIds);

                    if (cancelled) return;

                    if (jobsError) {
                        console.warn('[Messages] Failed to load job titles for contract conversations', jobsError);
                    } else {
                        for (const job of (jobsData ?? []) as Array<{ id: string; title: string | null; deadline?: string | null }>) {
                            const normalizedTitle = typeof job.title === 'string' ? job.title.trim() : '';
                            if (job.id && normalizedTitle) {
                                jobTitleById[job.id] = normalizedTitle;
                            }

                            const normalizedDeadline = typeof job.deadline === 'string' ? job.deadline.trim() : '';
                            if (job.id && normalizedDeadline) {
                                jobDeadlineById[job.id] = normalizedDeadline;
                            }
                        }
                    }

                    const missingJobTitleIds = fallbackJobIds.filter((jobId) => !jobTitleById[jobId]).slice(0, 16);
                    if (missingJobTitleIds.length > 0) {
                        const resolvedViaPublicLookup = await Promise.all(missingJobTitleIds.map(async (jobId) => {
                            const { data: jobData, error: jobError } = await getJobById(jobId);
                            if (jobError || !jobData) return null;

                            const title = typeof (jobData as { title?: string | null }).title === 'string'
                                ? (jobData as { title?: string | null }).title?.trim()
                                : '';
                            const deadline = typeof (jobData as { deadline?: string | null }).deadline === 'string'
                                ? (jobData as { deadline?: string | null }).deadline?.trim()
                                : '';
                            if (!title && !deadline) return null;

                            return { jobId, title, deadline };
                        }));

                        if (cancelled) return;

                        for (const resolved of resolvedViaPublicLookup) {
                            if (!resolved) continue;
                            if (resolved.title) {
                                jobTitleById[resolved.jobId] = resolved.title;
                            }
                            if (resolved.deadline) {
                                jobDeadlineById[resolved.jobId] = resolved.deadline;
                            }
                        }
                    }
                }

                const conversationIdsNeedingPartnerProposalFallback = Array.from(new Set([
                    ...unresolvedConversationContractIds,
                    ...resolvedRows
                        .filter(([conversationContractId, row]) => {
                            const existingTitle = typeof row?.title === 'string' ? row.title.trim() : '';
                            if (existingTitle.length > 0) return false;

                            const directJobId = typeof row?.job_id === 'string' ? row.job_id.trim() : '';
                            if (directJobId && jobTitleById[directJobId]) return false;

                            const proposalId = typeof row?.proposal_id === 'string' ? row.proposal_id : '';
                            const proposalJobId = proposalId ? proposalJobIdByProposalId[proposalId] || '' : '';
                            if (proposalJobId && jobTitleById[proposalJobId]) return false;

                            return Boolean(conversationContractId);
                        })
                        .map(([conversationContractId]) => conversationContractId),
                ]));

                const partnerProposalFallbackByConversationContractId: Record<string, {
                    jobId: string | null;
                    title: string | null;
                    proposalId: string | null;
                }> = {};

                if (conversationIdsNeedingPartnerProposalFallback.length > 0 && userId) {
                    const partnerIdByConversationContractId: Record<string, string> = {};
                    for (const conversationContractId of conversationIdsNeedingPartnerProposalFallback) {
                        const partnerId = conversationByContractId.get(conversationContractId)?.otherUser.id;
                        if (!partnerId) continue;
                        partnerIdByConversationContractId[conversationContractId] = partnerId;
                    }

                    const partnerIds = Array.from(new Set(Object.values(partnerIdByConversationContractId)));

                    if (partnerIds.length > 0) {
                        const [proposalsAsClientResult, proposalsAsFreelancerResult] = await Promise.all([
                            supabase
                                .from('proposals')
                                .select('id, job_id, freelancer_id, status, created_at')
                                .in('freelancer_id', partnerIds),
                            supabase
                                .from('proposals')
                                .select('id, job_id, freelancer_id, status, created_at')
                                .in('freelancer_id', [userId]),
                        ]);

                        if (cancelled) return;

                        if (proposalsAsClientResult.error) {
                            console.warn('[Messages] Failed partner proposal lookup (as client)', proposalsAsClientResult.error);
                        }
                        if (proposalsAsFreelancerResult.error) {
                            console.warn('[Messages] Failed partner proposal lookup (as freelancer)', proposalsAsFreelancerResult.error);
                        }

                        const proposalRows = [
                            ...((proposalsAsClientResult.data ?? []) as Array<ProposalTitleFallbackRow>),
                            ...((proposalsAsFreelancerResult.data ?? []) as Array<ProposalTitleFallbackRow>),
                        ];

                        const proposalJobIds = Array.from(new Set(
                            proposalRows
                                .map((proposal) => (typeof proposal.job_id === 'string' ? proposal.job_id.trim() : ''))
                                .filter(Boolean)
                        ));

                        const jobsById: Record<string, JobTitleLookupRow> = {};
                        if (proposalJobIds.length > 0) {
                            const { data: proposalJobsData, error: proposalJobsError } = await supabase
                                .from('jobs')
                                .select('id, title, client_id')
                                .in('id', proposalJobIds);

                            if (cancelled) return;

                            if (proposalJobsError) {
                                console.warn('[Messages] Failed proposal job lookup for conversation title fallback', proposalJobsError);
                            } else {
                                for (const job of (proposalJobsData ?? []) as Array<JobTitleLookupRow>) {
                                    if (!job?.id) continue;
                                    jobsById[job.id] = job;

                                    const normalizedTitle = typeof job.title === 'string' ? job.title.trim() : '';
                                    if (normalizedTitle && !jobTitleById[job.id]) {
                                        jobTitleById[job.id] = normalizedTitle;
                                    }
                                }
                            }
                        }

                        const getProposalPriority = (status: string | null | undefined) => {
                            switch (String(status || '').trim().toLowerCase()) {
                                case 'accepted': return 5;
                                case 'shortlisted': return 4;
                                case 'pending':
                                case 'new': return 3;
                                case 'submitted': return 2;
                                case 'rejected':
                                case 'withdrawn':
                                case 'archived': return 1;
                                default: return 0;
                            }
                        };

                        const pickPreferredProposal = (
                            current: { jobId: string | null; title: string | null; proposalId: string | null; priority: number; createdAt: number } | undefined,
                            candidate: { jobId: string | null; title: string | null; proposalId: string | null; priority: number; createdAt: number },
                        ) => {
                            if (!current) return candidate;
                            if (candidate.priority !== current.priority) {
                                return candidate.priority > current.priority ? candidate : current;
                            }
                            return candidate.createdAt > current.createdAt ? candidate : current;
                        };

                        const bestProposalByPartnerId: Record<string, {
                            jobId: string | null;
                            title: string | null;
                            proposalId: string | null;
                            priority: number;
                            createdAt: number;
                        }> = {};

                        for (const proposal of proposalRows) {
                            const proposalId = typeof proposal.id === 'string' ? proposal.id : '';
                            const jobId = typeof proposal.job_id === 'string' ? proposal.job_id.trim() : '';
                            if (!proposalId || !jobId) continue;

                            const job = jobsById[jobId];
                            if (!job) continue;

                            const title = typeof job.title === 'string' ? job.title.trim() : '';
                            if (!title) continue;

                            let partnerId: string | null = null;
                            if (proposal.freelancer_id === userId) {
                                const jobClientId = typeof job.client_id === 'string' ? job.client_id : '';
                                if (jobClientId && partnerIds.includes(jobClientId)) {
                                    partnerId = jobClientId;
                                }
                            } else {
                                const freelancerId = typeof proposal.freelancer_id === 'string' ? proposal.freelancer_id : '';
                                const jobClientId = typeof job.client_id === 'string' ? job.client_id : '';
                                if (freelancerId && partnerIds.includes(freelancerId) && jobClientId === userId) {
                                    partnerId = freelancerId;
                                }
                            }

                            if (!partnerId) continue;

                            const createdAt = Date.parse(String(proposal.created_at || ''));
                            bestProposalByPartnerId[partnerId] = pickPreferredProposal(bestProposalByPartnerId[partnerId], {
                                jobId,
                                title,
                                proposalId,
                                priority: getProposalPriority(proposal.status),
                                createdAt: Number.isFinite(createdAt) ? createdAt : 0,
                            });
                        }

                        for (const conversationContractId of conversationIdsNeedingPartnerProposalFallback) {
                            const partnerId = partnerIdByConversationContractId[conversationContractId];
                            if (!partnerId) continue;

                            const fallback = bestProposalByPartnerId[partnerId];
                            if (!fallback) continue;

                            partnerProposalFallbackByConversationContractId[conversationContractId] = {
                                jobId: fallback.jobId,
                                title: fallback.title,
                                proposalId: fallback.proposalId,
                            };
                        }
                    }
                }

                const nextStatuses: Record<string, ContractMessagingStatus> = {};
                const nextMeta: Record<string, ContractSessionMeta> = {};
                for (const contractId of contractConversationIds) {
                    nextStatuses[contractId] = 'unknown';
                }

                for (const [conversationContractId, row] of resolvedRows) {
                    if (!row) continue;

                    const existingTitle = typeof row.title === 'string' ? row.title.trim() : '';
                    const partnerFallback = partnerProposalFallbackByConversationContractId[conversationContractId];
                    const resolvedJobId = (typeof row.job_id === 'string' ? row.job_id.trim() : '')
                        || (typeof row.proposal_id === 'string' ? proposalJobIdByProposalId[row.proposal_id] || '' : '')
                        || (partnerFallback?.jobId || '');
                    const resolvedTitle = existingTitle
                        || (resolvedJobId ? jobTitleById[resolvedJobId] : '')
                        || partnerFallback?.title
                        || null;
                    const resolvedJobDeadline = resolvedJobId
                        ? (jobDeadlineById[resolvedJobId] || null)
                        : null;

                    nextStatuses[conversationContractId] = normalizeContractStatus(row.status);
                    nextMeta[conversationContractId] = {
                        id: conversationContractId,
                        status: row.status,
                        title: resolvedTitle,
                        amount: row.amount ?? null,
                        total_amount: row.total_amount ?? null,
                        revision_requests_count: row.revision_requests_count ?? 0,
                        max_revision_rounds: row.max_revision_rounds ?? 2,
                        funded_at: row.funded_at === undefined ? undefined : row.funded_at,
                        delivery_submitted_at: row.delivery_submitted_at === undefined ? undefined : row.delivery_submitted_at,
                        review_due_at: row.review_due_at === undefined ? undefined : row.review_due_at,
                        revision_requested_at: row.revision_requested_at === undefined ? undefined : row.revision_requested_at,
                        job_deadline: resolvedJobDeadline,
                        client_id: row.client_id ?? null,
                        freelancer_id: row.freelancer_id ?? null,
                        job_id: resolvedJobId || null,
                        proposal_id: row.proposal_id ?? partnerFallback?.proposalId ?? null,
                        linked_contract_id: row.id ?? null,
                    };
                }

                for (const unresolvedId of unresolvedConversationContractIds) {
                    if (nextMeta[unresolvedId]) continue;

                    const jobIdFromProposal = proposalJobIdByProposalId[unresolvedId] || null;
                    const partnerFallback = partnerProposalFallbackByConversationContractId[unresolvedId];
                    const resolvedJobId = jobIdFromProposal || partnerFallback?.jobId || unresolvedId;
                    const resolvedTitle = jobTitleById[resolvedJobId] || partnerFallback?.title || null;
                    const resolvedJobDeadline = jobDeadlineById[resolvedJobId] || null;

                    if (!resolvedTitle && !resolvedJobDeadline) continue;

                    nextMeta[unresolvedId] = {
                        id: unresolvedId,
                        status: null,
                        title: resolvedTitle,
                        amount: null,
                        total_amount: null,
                        job_deadline: resolvedJobDeadline,
                        client_id: null,
                        freelancer_id: null,
                        job_id: resolvedJobId,
                        proposal_id: jobIdFromProposal ? unresolvedId : partnerFallback?.proposalId ?? null,
                        linked_contract_id: null,
                    };
                }

                setContractStatusById((prev) => {
                    const previousKeys = Object.keys(prev);
                    const nextKeys = Object.keys(nextStatuses);

                    const isSameShape = previousKeys.length === nextKeys.length
                        && nextKeys.every((key) => Object.prototype.hasOwnProperty.call(prev, key));
                    if (!isSameShape) return nextStatuses;

                    const isSameValues = nextKeys.every((key) => prev[key] === nextStatuses[key]);
                    return isSameValues ? prev : nextStatuses;
                });

                setContractSessionMetaById(nextMeta);
            } catch (caughtError) {
                if (cancelled) return;

                console.warn('[Messages] Contract status hydration fallback to unknown', caughtError);
                const fallbackStatuses: Record<string, ContractMessagingStatus> = {};
                for (const contractId of contractConversationIds) {
                    fallbackStatuses[contractId] = 'unknown';
                }
                setContractStatusById(fallbackStatuses);
            } finally {
                if (!cancelled) setContractStatusesHydrated(true);
            }
        };

        void loadContractStatuses();

        return () => {
            cancelled = true;
        };
    }, [contractConversationIdsKey, conversations, userId]);

    return {
        contractConversationIds,
        contractStatusById,
        contractSessionMetaById,
        contractStatusesHydrated,
        setContractSessionMetaById,
        setContractStatusById,
    };
}
