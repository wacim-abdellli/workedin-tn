import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
    sendContractMessage,
} from '../../services/messages';
import { submitReview as submitReviewRequest } from '../../services/reviews';
import { submitReport } from '../../services/reports';
import {
    normalizeContractStatus,
    type ContractMessagingStatus,
} from '../../lib/messagingLifecycle';
import {
    canClientRequestChangesForStatus,
    canFreelancerDeliverForStatus,
    canOpenDisputeForStatus,
} from '../../lib/contractWorkflow';
import {
    isMissingSchemaColumnError,
    isEnumValueUnsupportedError,
    resolveContractSystemMessage,
    openBlobAsPreviewOrDownload,
    resolveMessageAttachmentUrl,
    extractMessageAttachmentPath,
} from '../../lib/messageUtils';
import { getErrorMessage } from '../../lib/errorMessage';
import { parseReplyMetadataFromContent } from '../../lib/messageReplies';
import { validateUploadSelection } from '../../lib/uploadPolicy';
import { normalizeMimeType } from '../../lib/audioProcessing';
import type {
    ContractSessionMeta,
    ContractMilestone,
    LatestContractDelivery,
    ContractSharedFile,
    Conversation,
    ThreadMessage,
} from './types';

interface UseContractLifecycleProps {
    user: any;
    profile: any;
    selectedConversation: Conversation | null;
    contractConversationIds: string[];
    conversations: Conversation[];
    messages: ThreadMessage[];
    showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    tx: any;
}

export function useContractLifecycle({
    user,
    profile,
    selectedConversation,
    contractConversationIds,
    conversations,
    messages,
    showToast,
    tx
}: UseContractLifecycleProps) {
    const [contractStatusById, setContractStatusById] = useState<Record<string, ContractMessagingStatus>>(() => {
        try {
            const cached = sessionStorage.getItem('workedin_contract_statuses');
            return cached ? (JSON.parse(cached) as Record<string, ContractMessagingStatus>) : {};
        } catch {
            return {};
        }
    });

    const [contractStatusesHydrated, setContractStatusesHydrated] = useState(false);
    const [contractSessionMetaById, setContractSessionMetaById] = useState<Record<string, ContractSessionMeta>>(() => {
        try {
            const cached = sessionStorage.getItem('workedin_contract_session_meta');
            return cached ? (JSON.parse(cached) as Record<string, ContractSessionMeta>) : {};
        } catch {
            return {};
        }
    });
    const [milestonesByContractId, setMilestonesByContractId] = useState<Record<string, ContractMilestone[]>>({});
    const [hasReviewedContractById, setHasReviewedContractById] = useState<Record<string, boolean>>({});
    const [latestDeliveryByContractId, setLatestDeliveryByContractId] = useState<Record<string, LatestContractDelivery>>({});

    const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isFundEscrowOpen, setIsFundEscrowOpen] = useState(false);
    const [isContractWorkspaceOpen, setIsContractWorkspaceOpen] = useState(false);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [customReportReason, setCustomReportReason] = useState('');
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportTouched, setReportTouched] = useState(false);

    const [deliveryNote, setDeliveryNote] = useState('');
    const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
    const [deliveryActionError, setDeliveryActionError] = useState<string | null>(null);
    const [disputeReason, setDisputeReason] = useState('');

    const [isDeliveringContractWork, setIsDeliveringContractWork] = useState(false);
    const [isAcceptingContractWork, setIsAcceptingContractWork] = useState(false);
    const [isRequestingContractChanges, setIsRequestingContractChanges] = useState(false);
    const [isOpeningContractDispute, setIsOpeningContractDispute] = useState(false);
    const [loadingMilestonesContractId, setLoadingMilestonesContractId] = useState<string | null>(null);
    const [loadingReviewContractId, setLoadingReviewContractId] = useState<string | null>(null);

    const selectedContractId = selectedConversation?.contract_id || null;
    const selectedContractMeta = selectedContractId ? contractSessionMetaById[selectedContractId] : null;
    const isContractSession = Boolean(selectedContractId);
    


    const selectedContractUserRole: 'client' | 'freelancer' = useMemo(() => {
        if (profile?.active_mode === 'client') return 'client';
        if (profile?.active_mode === 'freelancer') return 'freelancer';
        if (selectedContractMeta?.client_id && selectedContractMeta.client_id === user?.id) {
            return 'client';
        }
        return 'freelancer';
    }, [profile?.active_mode, selectedContractMeta?.client_id, user?.id]);

    const selectedContractStatus = useMemo(() => {
        if (!selectedContractId) return null;
        const rawStatus = contractStatusById[selectedContractId] ?? normalizeContractStatus(selectedContractMeta?.status);
        const isEscrowFunded = selectedContractMeta ? (selectedContractMeta.funded_at !== null) : true;
        if (rawStatus === 'active' && !isEscrowFunded) {
            return 'pending_payment';
        }
        return rawStatus;
    }, [selectedContractId, contractStatusById, selectedContractMeta]);

    const selectedContractMilestones = selectedContractId
        ? (milestonesByContractId[selectedContractId] ?? [])
        : [];

    const selectedContractHasReview = selectedContractId
        ? (hasReviewedContractById[selectedContractId] ?? false)
        : true;
    const selectedContractRevisionCount = Number(selectedContractMeta?.revision_requests_count ?? 0);
    const selectedContractRevisionLimit = Number(selectedContractMeta?.max_revision_rounds ?? 2);
    const selectedContractRevisionRemaining = Math.max(selectedContractRevisionLimit - selectedContractRevisionCount, 0);
    const selectedContractDeliverySubmittedAt = selectedContractMeta?.delivery_submitted_at || null;
    const selectedContractReviewDueAt = selectedContractMeta?.review_due_at || null;

    const contractDeliverySubmitted = useMemo(() => {
        if (!isContractSession) return false;
        if (selectedContractStatus === 'delivery_submitted' || selectedContractStatus === 'completed') return true;

        const freelancerId = selectedContractUserRole === 'client'
            ? selectedConversation?.otherUser.id
            : user?.id;

        if (!freelancerId) return false;

        return messages.some((message) => {
            if (message.sender_id !== freelancerId) return false;
            const normalized = String(parseReplyMetadataFromContent(message.content).bodyText || '').trim().toLowerCase();
            return normalized.startsWith('[[delivery]]')
                || normalized.startsWith('work has been delivered:')
                || normalized.startsWith('work delivered and ready for review');
        });
    }, [isContractSession, messages, selectedContractStatus, selectedContractUserRole, selectedConversation?.otherUser.id, user?.id]);

    // Keep contract status cache in sessionStorage
    useEffect(() => {
        if (Object.keys(contractStatusById).length === 0) return;
        try {
            sessionStorage.setItem('workedin_contract_statuses', JSON.stringify(contractStatusById));
        } catch { /* ignore */ }
    }, [contractStatusById]);

    // Keep contract session meta cache in sessionStorage
    useEffect(() => {
        if (Object.keys(contractSessionMetaById).length === 0) return;
        try {
            sessionStorage.setItem('workedin_contract_session_meta', JSON.stringify(contractSessionMetaById));
        } catch { /* ignore */ }
    }, [contractSessionMetaById]);

    const syncContractStatusLocally = useCallback((contractId: string, status: ContractMessagingStatus) => {
        setContractStatusById((prev) => ({
            ...prev,
            [contractId]: status,
        }));

        setContractSessionMetaById((prev) => {
            const existing = prev[contractId];
            if (!existing) return prev;
            return {
                ...prev,
                [contractId]: {
                    ...existing,
                    status,
                },
            };
        });
    }, []);

    const refreshLatestContractDelivery = useCallback(async (contractId: string) => {
        try {
            const { data, error } = await supabase
                .from('contract_deliveries')
                .select(`
                    id,
                    version_number,
                    delivery_note,
                    submitted_at,
                    review_due_at,
                    locked_final_asset_count,
                    assets:contract_delivery_assets (
                        id,
                        asset_kind,
                        access_state,
                        name,
                        storage_bucket,
                        storage_path,
                        mime_type,
                        size_bytes
                    )
                `)
                .eq('contract_id', contractId)
                .order('version_number', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.warn('[Messages] Failed to load latest contract delivery metadata', error);
                return;
            }

            if (data) {
                const formattedAssets = ((data.assets ?? []) as any[]).map(asset => ({
                    id: asset.id,
                    asset_kind: asset.asset_kind,
                    access_state: asset.access_state,
                    name: asset.name,
                    storage_bucket: asset.storage_bucket,
                    storage_path: asset.storage_path,
                    mime_type: asset.mime_type,
                    size_bytes: asset.size_bytes,
                }));

                const formattedDelivery: LatestContractDelivery = {
                    id: data.id,
                    version_number: data.version_number,
                    delivery_note: data.delivery_note,
                    submitted_at: data.submitted_at,
                    review_due_at: data.review_due_at,
                    locked_final_asset_count: data.locked_final_asset_count,
                    assets: formattedAssets,
                };

                setLatestDeliveryByContractId((prev) => ({
                    ...prev,
                    [contractId]: formattedDelivery,
                }));

                if (data.submitted_at && selectedContractMeta) {
                    setContractSessionMetaById((prev) => {
                        const existing = prev[contractId];
                        if (!existing) return prev;
                        return {
                            ...prev,
                            [contractId]: {
                                ...existing,
                                delivery_submitted_at: data.submitted_at,
                                review_due_at: data.review_due_at || existing.review_due_at,
                            },
                        };
                    });
                }
            }
        } catch (caughtError) {
            console.warn('[Messages] Failed to refresh latest contract delivery metadata', caughtError);
        }
    }, [selectedContractMeta]);

    // Fetch review existence
    useEffect(() => {
        if (!selectedContractId || !user?.id) return;

        let cancelled = false;
        setLoadingReviewContractId(selectedContractId);

        const checkReviewSubmitted = async () => {
            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .select('id')
                    .eq('contract_id', selectedContractId)
                    .eq('reviewer_id', user.id)
                    .maybeSingle();

                if (error) {
                    console.warn('[Messages] Failed to check contract review status', error);
                    return;
                }

                if (cancelled) return;
                setHasReviewedContractById((prev) => ({
                    ...prev,
                    [selectedContractId]: Boolean(data),
                }));
            } catch (err) {
                console.warn('[Messages] Failed to check contract review status', err);
            } finally {
                if (!cancelled) {
                    setLoadingReviewContractId((current) => (
                        current === selectedContractId ? null : current
                    ));
                }
            }
        };

        void checkReviewSubmitted();

        return () => {
            cancelled = true;
        };
    }, [selectedContractId, user?.id]);

    // Load latest contract delivery
    useEffect(() => {
        if (!selectedContractId) return;
        void refreshLatestContractDelivery(selectedContractId);
    }, [refreshLatestContractDelivery, selectedContractId]);

    // Load milestones
    useEffect(() => {
        if (!selectedContractId) return;

        let cancelled = false;
        setLoadingMilestonesContractId(selectedContractId);

        const loadMilestones = async () => {
            try {
                const { data, error } = await supabase
                    .from('milestones')
                    .select('id, contract_id, title, description, amount, status, due_date, order_index, created_at')
                    .eq('contract_id', selectedContractId)
                    .order('order_index', { ascending: true });

                if (error) {
                    const shouldRetryWithoutOrder = typeof error.message === 'string'
                        && error.message.toLowerCase().includes('order_index');

                    if (!shouldRetryWithoutOrder) {
                        console.warn('[Messages] Failed to load contract milestones', error);
                        if (!cancelled) {
                            setMilestonesByContractId((prev) => ({
                                ...prev,
                                [selectedContractId]: prev[selectedContractId] ?? [],
                            }));
                        }
                        return;
                    }

                    const fallback = await supabase
                        .from('milestones')
                        .select('id, contract_id, title, description, amount, status, due_date, created_at')
                        .eq('contract_id', selectedContractId)
                        .order('created_at', { ascending: true });

                    if (fallback.error) {
                        console.warn('[Messages] Failed to load contract milestones fallback', fallback.error);
                        if (!cancelled) {
                            setMilestonesByContractId((prev) => ({
                                ...prev,
                                [selectedContractId]: prev[selectedContractId] ?? [],
                            }));
                        }
                        return;
                    }

                    if (cancelled) return;

                    const fallbackRows = (fallback.data ?? []).map((row) => ({
                        ...row,
                        order_index: null,
                    })) as ContractMilestone[];

                    setMilestonesByContractId((prev) => ({
                        ...prev,
                        [selectedContractId]: fallbackRows,
                    }));
                    return;
                }

                if (cancelled) return;

                setMilestonesByContractId((prev) => ({
                    ...prev,
                    [selectedContractId]: (data ?? []) as ContractMilestone[],
                }));
            } catch (caughtError) {
                console.warn('[Messages] Failed to load contract milestones', caughtError);
                if (!cancelled) {
                    setMilestonesByContractId((prev) => ({
                        ...prev,
                        [selectedContractId]: prev[selectedContractId] ?? [],
                    }));
                }
            } finally {
                if (!cancelled) {
                    setLoadingMilestonesContractId((current) => (
                        current === selectedContractId ? null : current
                    ));
                }
            }
        };

        void loadMilestones();

        return () => {
            cancelled = true;
        };
    }, [selectedContractId]);

    // Hydrate all contract statuses
    const contractConversationIdsKey = contractConversationIds.join('|');
    useEffect(() => {
        if (contractConversationIds.length === 0) {
            setContractStatusById({});
            setContractSessionMetaById({});
            setMilestonesByContractId({});
            setHasReviewedContractById({});
            setContractStatusesHydrated(true);
            return;
        }

        let cancelled = false;
        setContractStatusesHydrated(false);

        const loadContractStatuses = async () => {
            type ContractSessionRow = Omit<ContractSessionMeta, 'linked_contract_id'> & {
                proposal_id?: string | null;
                created_at?: string | null;
                job?: any;
                proposal?: any;
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

            const contractSelectColumns =
                'id, proposal_id, status, title, amount, total_amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, revision_requested_at, client_id, freelancer_id, job_id, created_at, delivery_note, job:jobs(title, deadline), proposal:proposals(job_id, job:jobs(title, deadline))';
            const legacyContractSelectColumns =
                'id, proposal_id, status, title, amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, revision_requested_at, client_id, freelancer_id, job_id, created_at, delivery_note, job:jobs(title, deadline), proposal:proposals(job_id, job:jobs(title, deadline))';

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

                let result = await runLookup(contractSelectColumns);

                if (isMissingSchemaColumnError(result.error, 'contracts', 'total_amount')) {
                    result = await runLookup(legacyContractSelectColumns);
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
                const jobTitleById: Record<string, string> = {};
                const jobDeadlineById: Record<string, string> = {};
                const proposalJobIdByProposalId: Record<string, string> = {};

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

                const extractJobTitleAndDeadline = (row: any) => {
                    const job = Array.isArray(row?.job) ? row.job[0] : row?.job;
                    if (job) {
                        return {
                            title: job.title || null,
                            deadline: job.deadline || null,
                        };
                    }
                    const proposal = Array.isArray(row?.proposal) ? row.proposal[0] : row?.proposal;
                    const proposalJob = Array.isArray(proposal?.job) ? proposal.job[0] : proposal?.job;
                    if (proposalJob) {
                        return {
                            title: proposalJob.title || null,
                            deadline: proposalJob.deadline || null,
                        };
                    }
                    return { title: null, deadline: null };
                };

                const primaryRows = (data ?? []) as Array<ContractSessionRow>;
                for (const row of primaryRows) {
                    if (!row?.id) continue;
                    hydrateRow(row.id, row);
                    
                    const jobDetails = extractJobTitleAndDeadline(row);
                    if (row.job_id && jobDetails.title) {
                        jobTitleById[row.job_id] = jobDetails.title;
                    }
                    if (row.job_id && jobDetails.deadline) {
                        jobDeadlineById[row.job_id] = jobDetails.deadline;
                    }
                    const proposal = Array.isArray(row?.proposal) ? row.proposal[0] : row?.proposal;
                    if (proposal?.job_id && jobDetails.title) {
                        proposalJobIdByProposalId[row.proposal_id || ''] = proposal.job_id;
                        jobTitleById[proposal.job_id] = jobDetails.title;
                    }
                    if (proposal?.job_id && jobDetails.deadline) {
                        jobDeadlineById[proposal.job_id] = jobDetails.deadline;
                    }
                }

                const conversationByContractId = new Map<string, Conversation>();
                for (const conversation of conversations) {
                    if (!conversation.contract_id) continue;
                    conversationByContractId.set(conversation.contract_id, conversation);
                }

                let unresolvedConversationContractIds = contractConversationIds.filter(
                    (contractId) => !rowByConversationContractId.has(contractId)
                );

                // proposal lookup
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

                // job lookup
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

                const resolvedRows = Array.from(rowByConversationContractId.entries());
                const directJobIds = Array.from(new Set(
                    resolvedRows
                        .map(([_, row]) => (typeof row.job_id === 'string' ? row.job_id.trim() : ''))
                        .filter(Boolean)
                ));

                const directProposalIds = Array.from(new Set(
                    resolvedRows
                        .map(([_, row]) => (typeof row.proposal_id === 'string' ? row.proposal_id.trim() : ''))
                        .filter(Boolean)
                ));

                const missingProposalIds = directProposalIds.filter((proposalId) => !proposalJobIdByProposalId[proposalId]);

                if (missingProposalIds.length > 0) {
                    const { data: proposalsData, error: proposalsError } = await supabase
                        .from('proposals')
                        .select('id, job_id')
                        .in('id', missingProposalIds);

                    if (cancelled) return;

                    if (proposalsError) {
                        console.warn('[Messages] Failed to load job IDs for contract proposals', proposalsError);
                    } else {
                        for (const proposal of (proposalsData ?? []) as Array<{ id: string; job_id: string | null }>) {
                            if (proposal.id && proposal.job_id) {
                                proposalJobIdByProposalId[proposal.id] = proposal.job_id;
                            }
                        }
                    }
                }

                const fallbackJobIds = Array.from(new Set([
                    ...directJobIds,
                    ...Object.values(proposalJobIdByProposalId),
                ])).filter(Boolean);

                const missingJobIds = fallbackJobIds.filter((jobId) => !jobTitleById[jobId]);

                if (missingJobIds.length > 0) {
                    const { data: jobsData, error: jobsError } = await supabase
                        .from('jobs')
                        .select('id, title, deadline')
                        .in('id', missingJobIds);

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
                }

                // Proposal fallback lookup for other party
                const conversationIdsNeedingPartnerProposalFallback = Array.from(new Set([
                    ...unresolvedConversationContractIds,
                    ...resolvedRows
                        .filter(([_, row]) => {
                            const existingTitle = typeof row?.title === 'string' ? row.title.trim() : '';
                            if (existingTitle.length > 0) return false;

                            const directJobId = typeof row?.job_id === 'string' ? row.job_id.trim() : '';
                            if (directJobId && jobTitleById[directJobId]) return false;

                            const proposalId = typeof row?.proposal_id === 'string' ? row.proposal_id : '';
                            const proposalJobId = proposalId ? proposalJobIdByProposalId[proposalId] || '' : '';
                            if (proposalJobId && jobTitleById[proposalJobId]) return false;

                            return true;
                        })
                        .map(([conversationContractId]) => conversationContractId),
                ]));

                const partnerProposalFallbackByConversationContractId: Record<string, {
                    jobId: string | null;
                    title: string | null;
                    proposalId: string | null;
                }> = {};

                if (conversationIdsNeedingPartnerProposalFallback.length > 0 && user?.id) {
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
                                .in('freelancer_id', [user.id]),
                        ]);

                        if (cancelled) return;

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

                            if (!proposalJobsError && proposalJobsData) {
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
                            if (proposal.freelancer_id === user.id) {
                                const jobClientId = typeof job.client_id === 'string' ? job.client_id : '';
                                if (jobClientId && partnerIds.includes(jobClientId)) {
                                    partnerId = jobClientId;
                                }
                            } else {
                                const freelancerId = typeof proposal.freelancer_id === 'string' ? proposal.freelancer_id : '';
                                const jobClientId = typeof job.client_id === 'string' ? job.client_id : '';
                                if (freelancerId && partnerIds.includes(freelancerId) && jobClientId === user.id) {
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
    }, [contractConversationIdsKey, conversations, user?.id]);



    // Handle contract workspace modals auto-close
    useEffect(() => {
        if (!isContractSession) {
            setIsContractWorkspaceOpen(false);
            setIsReviewModalOpen(false);
        }
    }, [isContractSession]);

    // Handlers
    const handleDeliverContractWork = useCallback(async (links: Array<any> = [], fileStages: Record<number, 'review' | 'final'> = {}) => {
        if (isDeliveringContractWork) return;
        if (!selectedConversation || !selectedConversation.contract_id || !user?.id) return;

        setDeliveryActionError(null);
        setIsDeliveringContractWork(true);
        try {
            if (selectedContractUserRole !== 'freelancer') {
                throw new Error(tx('contract.deliverBlocked', undefined, 'Only the freelancer can deliver work for this contract.'));
            }

            const workflowStatus = selectedContractStatus === 'unknown' ? null : selectedContractStatus;
            if (!canFreelancerDeliverForStatus(workflowStatus)) {
                throw new Error(tx('contract.deliverBlocked', undefined, 'This contract is not ready for delivery.'));
            }

            const contractId = selectedConversation.contract_id;
            const trimmedNote = deliveryNote.trim();
            const selectedDeliveryFiles = deliveryFiles;
            
            const hasReview = selectedDeliveryFiles.some((_, idx) => fileStages[idx] === 'review') || links.some(l => l.link_kind === 'review_link');
            const hasFinal = selectedDeliveryFiles.some((_, idx) => fileStages[idx] === 'final') || links.some(l => l.link_kind === 'final_link');
            if (!hasReview || !hasFinal) {
                setDeliveryActionError('Please provide deliverables for both review and final hand-off phases.');
                setIsDeliveringContractWork(false);
                return;
            }

            for (const file of selectedDeliveryFiles) {
                const validation = validateUploadSelection({
                    bucket: 'contract-files',
                    fileName: file.name,
                    mimeType: normalizeMimeType(file.type),
                    size: file.size,
                });

                if (!validation.ok) {
                    throw new Error(`${file.name}: ${validation.reason || 'Unsupported file type.'}`);
                }
            }

            const messageContent = trimmedNote
                ? `[[delivery]] ${trimmedNote}`
                : '[[delivery]] Work delivered and ready for review';

            const uploadFile = async (file: File, stage: 'review' | 'final') => {
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const path = `${user.id}/${contractId}/submissions/${stage}/${Date.now()}_${safeName}`;
                
                const { error } = await supabase.storage.from('contract-files').upload(path, file, { upsert: false });
                if (error) throw new Error(`${stage === 'review' ? 'Review' : 'Final'} upload failed for ${file.name}: ${error.message}`);

                return {
                    name: file.name,
                    storage_path: path,
                    storage_bucket: 'contract-files',
                    mime_type: file.type || '',
                    size_bytes: file.size,
                };
            };

            const reviewAssets = [];
            const finalAssets = [];
            for (let idx = 0; idx < selectedDeliveryFiles.length; idx++) {
                const file = selectedDeliveryFiles[idx];
                const stage = fileStages[idx] || 'review';
                const asset = await uploadFile(file, stage);
                if (stage === 'review') {
                    reviewAssets.push(asset);
                } else {
                    finalAssets.push(asset);
                }
            }

            const { data: deliveryResult, error: deliveryError } = await supabase.rpc('submit_contract_delivery_atomic', {
                p_contract_id: contractId,
                p_delivery_note: trimmedNote || 'submitted',
                p_review_assets: reviewAssets,
                p_final_assets: finalAssets,
                p_delivery_links: links,
            });

            if (deliveryError) {
                throw new Error(`Delivery record failed: ${getErrorMessage(deliveryError, 'Delivery was blocked by database policy')}`);
            }

            const returnedStatus = normalizeContractStatus(
                deliveryResult && typeof deliveryResult === 'object' && 'status' in deliveryResult
                    ? String((deliveryResult as { status?: string }).status || '')
                    : null
            );

            if (returnedStatus !== 'unknown') {
                syncContractStatusLocally(contractId, returnedStatus);
            }

            await refreshLatestContractDelivery(contractId);

            const { error } = await sendContractMessage({
                contract_id: contractId,
                sender_id: user.id,
                receiver_id: selectedConversation.otherUser.id,
                content: messageContent,
                message_type: 'delivery',
            });

            if (error) {
                throw new Error(`Delivery message failed: ${getErrorMessage(error, 'Message was blocked by database policy')}`);
            }

            setIsDeliverModalOpen(false);
            setDeliveryNote('');
            setDeliveryFiles([]);
            showToast(tx('contract.workDelivered', undefined, 'Work delivered successfully'), 'success');
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.deliverError', undefined, 'Failed to deliver work'));
            setDeliveryActionError(message);
            showToast(message, 'error');
        } finally {
            setIsDeliveringContractWork(false);
        }
    }, [deliveryFiles, deliveryNote, isDeliveringContractWork, refreshLatestContractDelivery, selectedConversation, selectedContractStatus, selectedContractUserRole, showToast, syncContractStatusLocally, tx, user?.id]);

    const handleRequestContractChanges = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.contract_id || !user?.id) return;

        setIsRequestingContractChanges(true);
        try {
            const workflowStatus = selectedContractStatus === 'unknown' ? null : selectedContractStatus;
            if (!canClientRequestChangesForStatus(workflowStatus, contractDeliverySubmitted)) {
                throw new Error(tx('contract.requestChangesBlocked', undefined, 'Changes can only be requested after a delivery is submitted.'));
            }
            if (selectedContractRevisionRemaining <= 0) {
                throw new Error(tx('contract.revisionLimitReached', undefined, 'Revision limit reached for this contract.'));
            }

            const contractId = selectedConversation.contract_id;
            let revisionStatusApplied = false;

            const { data: revisionResult, error: updateStatusError } = await supabase.rpc('request_contract_revision_atomic', {
                p_contract_id: contractId,
                p_reason: tx('contract.requestRevision', undefined, 'Please revise according to feedback'),
            });

            if (!updateStatusError) {
                revisionStatusApplied = true;
                syncContractStatusLocally(contractId, 'revision_requested');
                setContractSessionMetaById((prev) => {
                    const existing = prev[contractId];
                    if (!existing) return prev;

                    return {
                        ...prev,
                        [contractId]: {
                            ...existing,
                            status: 'revision_requested',
                            revision_requests_count:
                                revisionResult && typeof revisionResult === 'object' && 'revision_requests_count' in revisionResult
                                    ? Number((revisionResult as { revision_requests_count?: number }).revision_requests_count ?? existing.revision_requests_count ?? 0)
                                    : (existing.revision_requests_count ?? 0) + 1,
                            max_revision_rounds:
                                revisionResult && typeof revisionResult === 'object' && 'max_revision_rounds' in revisionResult
                                    ? Number((revisionResult as { max_revision_rounds?: number }).max_revision_rounds ?? existing.max_revision_rounds ?? 2)
                                    : (existing.max_revision_rounds ?? 2),
                        },
                    };
                });
            } else if (
                isEnumValueUnsupportedError(updateStatusError, 'contract_status_enum', 'revision_requested')
                || isMissingSchemaColumnError(updateStatusError, 'contracts', 'status')
            ) {
                console.warn('[Messages] Revision status update skipped for compatibility', updateStatusError);
            } else {
                console.warn('[Messages] Failed to update contract status to revision_requested', updateStatusError);
            }

            const changeNote = tx('contract.requestRevision', undefined, 'Please revise according to feedback');
            const { error } = await sendContractMessage({
                contract_id: contractId,
                sender_id: user.id,
                receiver_id: selectedConversation.otherUser.id,
                content: `[[revision_requested]] ${changeNote}`,
                message_type: 'system',
            });

            if (error) throw error;

            if (revisionStatusApplied) {
                showToast(tx('contract.revisionSent', undefined, 'Revision request sent'), 'info');
            } else {
                showToast(
                    tx(
                        'contract.revisionSentCompatibilityNotice',
                        undefined,
                        'Revision request sent. Status update will apply once the latest contract enum migration is available.'
                    ),
                    'warning'
                );
            }
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.error', undefined, 'Action failed'));
            showToast(message, 'error');
        } finally {
            setIsRequestingContractChanges(false);
        }
    }, [contractDeliverySubmitted, selectedContractRevisionRemaining, selectedContractStatus, selectedConversation, showToast, syncContractStatusLocally, tx, user?.id]);

    const handleAcceptContractAndPay = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.contract_id || !user?.id) return;

        setIsAcceptingContractWork(true);
        try {
            if (import.meta.env.DEV) {
                const { data: contractData, error: fetchErr } = await supabase
                    .from('contracts')
                    .select('dhmad_escrow_id')
                    .eq('id', selectedConversation.contract_id)
                    .single();

                if (!fetchErr && contractData && !contractData.dhmad_escrow_id) {
                    const mockId = `dhmad_mock_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
                    await supabase
                        .from('contracts')
                        .update({ dhmad_escrow_id: mockId })
                        .eq('id', selectedConversation.contract_id);
                }
            }

            const { error: releaseError } = await supabase.rpc('release_contract_payment_atomic', {
                p_contract_id: selectedConversation.contract_id,
            });

            if (releaseError) throw releaseError;

            syncContractStatusLocally(selectedConversation.contract_id, 'completed');
            await refreshLatestContractDelivery(selectedConversation.contract_id);

            const { error: messageError } = await sendContractMessage({
                contract_id: selectedConversation.contract_id,
                sender_id: user.id,
                receiver_id: selectedConversation.otherUser.id,
                content: '[[contract_completed]] Work has been accepted and payment released',
                message_type: 'system',
            });

            if (messageError) throw messageError;

            setIsAcceptModalOpen(false);
            showToast(tx('contract.workAccepted', undefined, 'Work accepted and payment released'), 'success');
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.acceptError', undefined, 'Failed to accept work'));
            showToast(message, 'error');
        } finally {
            setIsAcceptingContractWork(false);
        }
    }, [refreshLatestContractDelivery, selectedConversation, showToast, syncContractStatusLocally, tx, user?.id]);

    const handleOpenContractDispute = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.contract_id || !user?.id) return;
        if (!disputeReason.trim()) return;

        setIsOpeningContractDispute(true);
        try {
            const workflowStatus = selectedContractStatus === 'unknown' ? null : selectedContractStatus;
            if (!canOpenDisputeForStatus(workflowStatus)) {
                throw new Error(tx('contract.disputeBlocked', undefined, 'A dispute cannot be opened in the current contract state.'));
            }

            const { error: disputeError } = await supabase.rpc('open_dispute_atomic', {
                p_contract_id: selectedConversation.contract_id,
                p_reason: disputeReason.trim(),
            });

            if (disputeError) throw disputeError;

            syncContractStatusLocally(selectedConversation.contract_id, 'disputed');

            const { error: messageError } = await sendContractMessage({
                contract_id: selectedConversation.contract_id,
                sender_id: user.id,
                receiver_id: selectedConversation.otherUser.id,
                content: `[[dispute_opened]] Dispute opened: ${disputeReason.trim()}`,
                message_type: 'dispute',
            });

            if (messageError) {
                console.warn('[Messages] Dispute opened but follow-up message failed', messageError);
            }

            setIsDisputeModalOpen(false);
            setDisputeReason('');
            showToast(tx('contract.disputeOpened', undefined, 'Dispute opened successfully'), 'warning');
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.disputeError', undefined, 'Failed to open dispute'));
            showToast(message, 'error');
        } finally {
            setIsOpeningContractDispute(false);
        }
    }, [disputeReason, selectedContractStatus, selectedConversation, showToast, syncContractStatusLocally, tx, user?.id]);

    const handleReportUser = useCallback(async () => {
        if (!selectedConversation || !user?.id) return;
        if (!reportReason) return;
        const finalReason = reportReason === 'other' ? customReportReason.trim() : reportReason;
        if (reportReason === 'other' && !finalReason) return;

        setIsSubmittingReport(true);
        try {
            await submitReport(user.id, 'user', selectedConversation.otherUser.id, finalReason);
            showToast(tx('pages.messages.reportSubmittedSuccess', undefined, 'Report submitted successfully. Our team will review it.'), 'success');
            setIsReportModalOpen(false);
            setReportReason('');
            setCustomReportReason('');
            setReportTouched(false);
        } catch (error) {
            console.error('[Messages] Failed to submit user report:', error);
            const errMsg = error instanceof Error ? error.message : String(error);
            showToast(errMsg || tx('common.reportFailed', undefined, 'Failed to submit report'), 'error');
        } finally {
            setIsSubmittingReport(false);
        }
    }, [selectedConversation, user?.id, reportReason, customReportReason, showToast, tx]);

    const handleSubmitContractReview = useCallback(async (rating: number, comment: string) => {
        if (!selectedContractId || !user?.id || !selectedConversation) {
            throw new Error('Missing contract context for review submission.');
        }

        const { error } = await submitReviewRequest(selectedContractId, rating, comment);
        if (error) {
            const errMessage = typeof error === 'object' && error !== null && 'message' in error
                ? String((error as { message?: string }).message || '')
                : '';
            throw new Error(errMessage || tx('contract.error', undefined, 'An error occurred'));
        }

        await sendContractMessage({
            contract_id: selectedContractId,
            sender_id: user.id,
            receiver_id: selectedConversation.otherUser.id,
            content: `[[review_left]] ${rating} stars: ${comment || 'No comment provided'}`,
            message_type: 'system',
        });

        setHasReviewedContractById((prev) => ({
            ...prev,
            [selectedContractId]: true,
        }));
        setIsReviewModalOpen(false);
        showToast(tx('contract.reviewSent', undefined, 'Review submitted successfully'), 'success');
    }, [selectedContractId, selectedConversation, showToast, tx, user?.id]);

    const contractSharedFiles = useMemo<ContractSharedFile[]>(() => {
        if (!isContractSession || !selectedContractId) return [];

        const dedupe = new Set<string>();
        const files: ContractSharedFile[] = [];

        for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
            const message = messages[messageIndex];
            if (message.contract_id !== selectedContractId) continue;

            const attachments = message.attachments ?? [];
            if (attachments.length === 0) continue;

            const senderName = message.sender_id === user?.id
                ? tx('common.you', undefined, 'You')
                : (selectedConversation?.otherUser.full_name || tx('pages.messages.userFallback', undefined, 'User'));

            for (const [attachmentIndex, attachment] of attachments.entries()) {
                if (!attachment?.url) continue;

                const dedupeKey = `${attachment.url}|${attachment.name || ''}`;
                if (dedupe.has(dedupeKey)) continue;
                dedupe.add(dedupeKey);

                files.push({
                    id: `${message.id}-${attachmentIndex}`,
                    name: attachment.name || tx('pages.messages.attachmentLabel', undefined, 'Attachment'),
                    url: attachment.url,
                    type: attachment.type || null,
                    size: attachment.size ?? null,
                    uploadedAt: message.created_at || null,
                    senderName,
                });

                if (files.length >= 12) return files;
            }
        }

        return files;
    }, [
        isContractSession,
        messages,
        selectedContractId,
        selectedConversation?.otherUser.full_name,
        tx,
        user?.id,
    ]);

    const contractSidebarData = useMemo(() => {
        if (!isContractSession || !selectedConversation) return null;

        const title = selectedContractMeta?.title
            || tx('pages.messages.contractSessionFallbackTitle', undefined, 'Contract');
        const amountValue = selectedContractMeta?.total_amount
            ?? selectedContractMeta?.amount
            ?? 0;
        const jobDeadline = selectedContractMeta?.job_deadline || null;

        const firstUpcomingDueDate = selectedContractMilestones
            .filter((milestone) => {
                if (!milestone.due_date) return false;
                const normalizedStatus = String(milestone.status || '').trim().toLowerCase();
                return normalizedStatus !== 'completed'
                    && normalizedStatus !== 'approved'
                    && normalizedStatus !== 'paid'
                    && normalizedStatus !== 'cancelled'
                    && normalizedStatus !== 'canceled';
            })
            .map((milestone) => milestone.due_date as string)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

        const otherParticipant = selectedConversation.otherUser;
        const latestDelivery = selectedContractId ? latestDeliveryByContractId[selectedContractId] : undefined;
        const latestDeliveryAssets = latestDelivery?.assets ?? [];
        const reviewFiles = latestDeliveryAssets.filter((asset) => asset.asset_kind === 'review_asset');
        const finalFiles = latestDeliveryAssets.filter((asset) => asset.asset_kind === 'final_asset');
        const lockedFinalFilesCount = Number(
            latestDelivery?.locked_final_asset_count ?? finalFiles.filter((asset) => asset.access_state !== 'released').length
        );
        const visibleFinalFiles = selectedContractUserRole === 'client'
            ? finalFiles.filter((asset) => asset.access_state === 'released')
            : finalFiles;

        const currentUserDisplayName = profile?.full_name || tx('common.you', undefined, 'You');
        const currentUserAvatar = profile?.avatar_url || null;

        const clientProfile = selectedContractUserRole === 'client'
            ? { full_name: currentUserDisplayName, avatar_url: currentUserAvatar }
            : { full_name: otherParticipant.full_name, avatar_url: otherParticipant.avatar_url };

        const freelancerProfile = selectedContractUserRole === 'freelancer'
            ? { full_name: currentUserDisplayName, avatar_url: currentUserAvatar }
            : { full_name: otherParticipant.full_name, avatar_url: otherParticipant.avatar_url };

        return {
            amount: amountValue,
            revisionRequestsCount: selectedContractMeta?.revision_requests_count ?? 0,
            maxRevisionRounds: selectedContractMeta?.max_revision_rounds ?? 2,
            fundedAt: selectedContractMeta?.funded_at ?? null,
            deliverySubmittedAt: selectedContractDeliverySubmittedAt,
            reviewDueAt: selectedContractReviewDueAt,
            reviewFiles: reviewFiles.map((asset) => ({
                id: asset.id,
                name: asset.name,
                storagePath: asset.storage_path,
                storageBucket: asset.storage_bucket ?? 'contract-files',
                mimeType: asset.mime_type ?? null,
                sizeBytes: asset.size_bytes ?? null,
                assetKind: asset.asset_kind,
                accessState: asset.access_state,
            })),
            finalFiles: visibleFinalFiles.map((asset) => ({
                id: asset.id,
                name: asset.name,
                storagePath: asset.storage_path,
                storageBucket: asset.storage_bucket ?? 'contract-files',
                mimeType: asset.mime_type ?? null,
                sizeBytes: asset.size_bytes ?? null,
                assetKind: asset.asset_kind,
                accessState: asset.access_state,
            })),
            lockedFinalFilesCount,
            job: {
                title,
                deadline: firstUpcomingDueDate || jobDeadline,
            },
            milestones: selectedContractMilestones.map((milestone) => ({
                id: milestone.id,
                title: milestone.title,
                description: milestone.description,
                amount: milestone.amount,
                status: milestone.status,
                due_date: milestone.due_date,
            })),
            sharedFiles: contractSharedFiles,
            client: clientProfile,
            freelancer: freelancerProfile,
        };
    }, [
        contractSharedFiles,
        isContractSession,
        latestDeliveryByContractId,
        selectedContractMilestones,
        selectedContractDeliverySubmittedAt,
        selectedContractMeta,
        selectedContractReviewDueAt,
        selectedContractId,
        selectedContractUserRole,
        selectedConversation,
        profile,
        tx,
    ]);

    const isContractSidebarDataLoading = Boolean(loadingMilestonesContractId || loadingReviewContractId);

    const selectedContractActivityEvents = useMemo<any[]>(() => {
        if (!selectedContractId) return [];
        const events: any[] = [];
        messages.forEach((msg) => {
            if (msg.contract_id !== selectedContractId) return;
            const bodyText = parseReplyMetadataFromContent(msg.content).bodyText.trim();
            const sysMsg = resolveContractSystemMessage(bodyText);
            if (sysMsg) {
                events.push({
                    id: msg.id,
                    text: sysMsg.text,
                    timestamp: msg.created_at,
                    actorName: msg.sender?.full_name || 'System',
                    actorRole: msg.sender_id === user?.id ? (selectedContractUserRole === 'client' ? 'client' : 'freelancer') : (selectedContractUserRole === 'client' ? 'freelancer' : 'client'),
                    actorAvatarUrl: msg.sender?.avatar_url || null,
                    kind: sysMsg.kind,
                    system: msg.message_type === 'system',
                });
            }
        });
        return events;
    }, [messages, selectedContractId, user?.id, selectedContractUserRole]);

    const handleOpenContractSidebarFile = useCallback(async (file: {
        url?: string;
        name: string;
        type?: string | null;
        size?: number | string | null;
        storageBucket?: string | null;
        storagePath?: string | null;
    }) => {
        if (file.storagePath && file.storageBucket) {
            const normalizedType = normalizeMimeType(file.type || null);
            const canPreviewInTab = normalizedType.startsWith('image/')
                || normalizedType.startsWith('audio/')
                || normalizedType.startsWith('video/')
                || normalizedType === 'application/pdf';

            try {
                const { data, error } = await supabase.storage
                    .from(file.storageBucket)
                    .download(file.storagePath);

                if (error || !data) {
                    throw error || new Error('Download failed');
                }

                openBlobAsPreviewOrDownload(data, file.name || 'attachment', canPreviewInTab);
                return;
            } catch (error) {
                console.error('[Messages] Failed to open contract delivery file:', error);
                showToast(tx('pages.messages.errors.openAttachment', undefined, 'Failed to open attachment right now'), 'error');
                return;
            }
        }

        if (file.url) {
            const sourceUrl = resolveMessageAttachmentUrl(file.url);
            if (!sourceUrl) {
                showToast(tx('pages.messages.errors.invalidAttachment', undefined, 'Attachment link is not available'), 'error');
                return;
            }

            const normalizedType = normalizeMimeType(file.type || null);
            const canPreviewInTab = normalizedType.startsWith('image/')
                || normalizedType.startsWith('audio/')
                || normalizedType.startsWith('video/')
                || normalizedType === 'application/pdf';

            try {
                const response = await fetch(sourceUrl, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const blob = await response.blob();
                openBlobAsPreviewOrDownload(blob, file.name || 'attachment', canPreviewInTab);
            } catch (error) {
                try {
                    const attachmentPath = extractMessageAttachmentPath(file.url);
                    if (!attachmentPath) throw error;

                    const { data, error: downloadError } = await supabase.storage
                        .from('message_attachments')
                        .download(attachmentPath);

                    if (downloadError || !data) {
                        throw downloadError || error;
                    }

                    openBlobAsPreviewOrDownload(data, file.name || 'attachment', canPreviewInTab);
                } catch (downloadError) {
                    console.error('[Messages] Failed to open attachment via fallback:', downloadError);
                    showToast(tx('pages.messages.errors.openAttachment', undefined, 'Failed to open attachment right now'), 'error');
                }
            }
            return;
        }

        showToast(tx('pages.messages.errors.invalidAttachment', undefined, 'Attachment link is not available'), 'error');
    }, [showToast, tx]);

    const selectedContractReviewBanner = useMemo(() => {
        if (selectedContractStatus !== 'delivery_submitted') return null;

        const dueDate = selectedContractReviewDueAt ? new Date(selectedContractReviewDueAt) : null;
        const dueLabel = dueDate && !Number.isNaN(dueDate.getTime())
            ? dueDate.toLocaleString(profile?.language === 'ar' ? 'ar-TN' : profile?.language === 'fr' ? 'fr-FR' : 'en-US')
            : null;
        const overdue = Boolean(dueDate && dueDate.getTime() < Date.now());

        if (selectedContractUserRole === 'client') {
            return overdue
                ? `Review is overdue. Please accept, request changes, or open a dispute now. If you stay inactive, the platform may escalate or auto-resolve this contract based on policy.`
                : `This delivery is under review. Review it by ${dueLabel ?? 'the deadline'} and choose Accept and Pay, Request Changes, or Open Dispute. If you do nothing, the platform may escalate or auto-resolve the next step based on policy.`;
        }

        return overdue
            ? `Client review is overdue. The platform will follow the contract protection policy next if the client stays inactive.`
            : `Your delivery is under review until ${dueLabel ?? 'the deadline'}. The client must accept, request changes, or open a dispute. If they do nothing, the platform may escalate or auto-resolve the next step based on policy.`;
    }, [profile?.language, selectedContractReviewDueAt, selectedContractStatus, selectedContractUserRole]);

    return {
        contractStatusById,
        contractSessionMetaById,
        setContractSessionMetaById,
        isContractSidebarDataLoading,
        selectedContractActivityEvents,
        handleOpenContractSidebarFile,
        milestonesByContractId,
        hasReviewedContractById,
        latestDeliveryByContractId,
        contractStatusesHydrated,
        selectedContractUserRole,
        selectedContractStatus,
        selectedContractMilestones,
        selectedContractHasReview,
        selectedContractRevisionCount,
        selectedContractRevisionLimit,
        selectedContractRevisionRemaining,
        selectedContractDeliverySubmittedAt,
        selectedContractReviewDueAt,
        contractDeliverySubmitted,
        isDeliverModalOpen,
        setIsDeliverModalOpen,
        isAcceptModalOpen,
        setIsAcceptModalOpen,
        isDisputeModalOpen,
        setIsDisputeModalOpen,
        isReviewModalOpen,
        setIsReviewModalOpen,
        isFundEscrowOpen,
        setIsFundEscrowOpen,
        isContractWorkspaceOpen,
        setIsContractWorkspaceOpen,
        deliveryNote,
        setDeliveryNote,
        deliveryFiles,
        setDeliveryFiles,
        deliveryActionError,
        setDeliveryActionError,
        disputeReason,
        setDisputeReason,
        isDeliveringContractWork,
        isAcceptingContractWork,
        isRequestingContractChanges,
        isOpeningContractDispute,
        loadingMilestonesContractId,
        loadingReviewContractId,
        contractSharedFiles,
        contractSidebarData,
        selectedContractReviewBanner,
        syncContractStatusLocally,
        refreshLatestContractDelivery,
        handleDeliverContractWork,
        handleRequestContractChanges,
        handleAcceptContractAndPay,
        handleOpenContractDispute,
        handleSubmitContractReview,
        isReportModalOpen,
        setIsReportModalOpen,
        reportReason,
        setReportReason,
        customReportReason,
        setCustomReportReason,
        isSubmittingReport,
        reportTouched,
        setReportTouched,
        handleReportUser,
    };
}
