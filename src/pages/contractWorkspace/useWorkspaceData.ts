import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import type { ContractRow, LatestDelivery, SharedFile } from './types';
import { fetchContractByColumn } from './contractFetchers';
import type { User } from '@supabase/supabase-js';
import { useWorkspaceModals } from './useWorkspaceModals';
import { useDeliveryUpload } from './useDeliveryUpload';

type Profile = {
    full_name?: string | null;
    avatar_url?: string | null;
};

type ContractMilestoneRow = {
    id: string;
    contract_id: string;
    [key: string]: unknown;
};

type CounterpartyProfile = {
    full_name: string;
    avatar_url: string | null;
};

type SharedAttachment = {
    url?: string;
    name?: string;
    type?: string;
    size?: number | string;
};

type MessageRow = {
    id: string;
    sender_id: string;
    attachments: SharedAttachment[] | null;
    content?: string;
    created_at?: string | null;
    message_type?: string;
};

type JobRow = {
    title?: string | null;
    deadline?: string | null;
    category?: string | null;
};

type UseWorkspaceDataParams = {
    contractId: string | undefined;
};

type UseWorkspaceDataReturn = {
    contract: ContractRow | null;
    setContract: React.Dispatch<React.SetStateAction<ContractRow | null>>;
    jobTitle: string | null;
    jobDeadline: string | null;
    jobCategory: string | null;
    latestDelivery: LatestDelivery | null;
    lastRevisionNote: string | null;
    sharedFiles: SharedFile[];
    hasReviewed: boolean;
    counterpartyProfile: CounterpartyProfile;
    isLoading: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    loadWorkspace: () => Promise<void>;
} & UseWorkspaceModalsReturn & UseDeliveryUploadReturn;

export function useWorkspaceData({ contractId }: UseWorkspaceDataParams): UseWorkspaceDataReturn {
    const { user, profile } = useAuth();

    const [contract, setContract] = useState<ContractRow | null>(null);
    const [jobTitle, setJobTitle] = useState<string | null>(null);
    const [jobDeadline, setJobDeadline] = useState<string | null>(null);
    const [jobCategory, setJobCategory] = useState<string | null>(null);
    const [latestDelivery, setLatestDelivery] = useState<LatestDelivery | null>(null);
    const [lastRevisionNote, setLastRevisionNote] = useState<string | null>(null);
    const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [counterpartyProfile, setCounterpartyProfile] = useState<CounterpartyProfile>({ full_name: '', avatar_url: null });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const modals = useWorkspaceModals();
    const upload = useDeliveryUpload();

    const loadWorkspace = useCallback(async () => {
        if (!contractId || !user?.id) return;
        setIsLoading(true);
        setError(null);

        try {
            const urlParamId = contractId ?? '';
            const { data: directContractData, error: contractError } = await fetchContractByColumn('id', urlParamId);
            let contractData = directContractData;

            if (contractError) throw contractError;

            if (!contractData) {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(urlParamId);
                if (isUuid) {
                    const proposalLookup = await fetchContractByColumn('proposal_id', urlParamId);
                    if (proposalLookup.error) {
                        logger.warn('[ContractWorkspacePage] Proposal fallback failed:', proposalLookup.error);
                    }
                    contractData = proposalLookup.data;

                    if (!contractData) {
                        const jobLookup = await fetchContractByColumn('job_id', urlParamId);
                        if (jobLookup.error) {
                            logger.warn('[ContractWorkspacePage] Job fallback failed:', jobLookup.error);
                        }
                        contractData = jobLookup.data;
                    }
                }
            }
            if (!contractData) { setError('Contract not found or you do not have access.'); return; }
            if (contractData.client_id !== user.id && contractData.freelancer_id !== user.id) {
                setError('You are not a participant in this contract.'); return;
            }

            const cpRole = contractData.client_id === user.id ? 'freelancer' : 'client';
            const counterpartyId = cpRole === 'freelancer' ? contractData.freelancer_id : contractData.client_id;

            const [
                milestonesRes,
                counterpartyRes,
                jobRes,
                deliveryRes,
                reviewRes,
                conversationRes,
            ] = await Promise.all([
                supabase
                    .from('milestones')
                    .select('*')
                    .eq('contract_id', contractData.id)
                    .order('created_at', { ascending: true }),
                counterpartyId
                    ? supabase.from('public_profiles').select('full_name, avatar_url').eq('id', counterpartyId).maybeSingle()
                    : Promise.resolve({ data: null, error: null }),
                contractData.job_id
                    ? supabase.from('jobs').select('title, deadline, category').eq('id', contractData.job_id).maybeSingle()
                    : Promise.resolve({ data: null, error: null }),
                supabase.rpc('get_latest_contract_delivery', { p_contract_id: contractData.id }),
                supabase.from('reviews').select('id').eq('contract_id', contractData.id).eq('reviewer_id', user.id).maybeSingle(),
                supabase.from('conversations').select('id').eq('contract_id', contractData.id).limit(1).maybeSingle(),
            ]);

            const milestonesData: ContractMilestoneRow[] = milestonesRes.error
                ? (() => { logger.warn('[ContractWorkspacePage] Failed to load milestones:', milestonesRes.error); return []; })()
                : (milestonesRes.data ?? []);

            const cpData = counterpartyRes.error
                ? (() => { logger.warn('[ContractWorkspacePage] Failed to load counterparty profile:', counterpartyRes.error); return null; })()
                : counterpartyRes.data;

            const jobData = jobRes.error
                ? (() => { logger.warn('[ContractWorkspacePage] Failed to load job details:', jobRes.error); return null; })()
                : jobRes.data as JobRow | null;

            const deliveryData = deliveryRes.error
                ? (() => { logger.warn('[ContractWorkspacePage] Failed to load latest delivery:', deliveryRes.error); return null; })()
                : deliveryRes.data;

            const reviewData = reviewRes.error
                ? (() => { logger.warn('[ContractWorkspacePage] Failed to load review status:', reviewRes.error); return null; })()
                : reviewRes.data;

            const convData = conversationRes.error
                ? (() => { logger.warn('[ContractWorkspacePage] Failed to load conversation:', conversationRes.error); return null; })()
                : conversationRes.data;

            setContract({
                ...(contractData as ContractRow),
                milestones: milestonesData,
            });

            if (cpData) {
                setCounterpartyProfile({
                    full_name: cpData.full_name || (cpRole === 'freelancer' ? 'Freelancer' : 'Client'),
                    avatar_url: cpData.avatar_url ?? null,
                });
            } else {
                setCounterpartyProfile({ full_name: cpRole === 'freelancer' ? 'Freelancer' : 'Client', avatar_url: null });
            }

            if (jobData) {
                setJobTitle(jobData.title ?? null);
                setJobDeadline(jobData.deadline ?? null);
                setJobCategory(jobData.category ?? null);
            }

            if (deliveryData && typeof deliveryData === 'object' && 'id' in deliveryData) {
                setLatestDelivery(deliveryData as LatestDelivery);
            } else {
                setLatestDelivery(null);
            }

            setHasReviewed(Boolean(reviewData?.id));

            if (convData?.id) {
                const [revMsgRes, messagesRes] = await Promise.all([
                    supabase
                        .from('messages')
                        .select('content')
                        .eq('conversation_id', convData.id)
                        .eq('message_type', 'feedback')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle(),
                    supabase
                        .from('messages')
                        .select('id, sender_id, attachments, created_at')
                        .eq('conversation_id', convData.id)
                        .not('attachments', 'is', null)
                        .order('created_at', { ascending: false })
                        .limit(50),
                ]);

                if (revMsgRes.data?.content) {
                    setLastRevisionNote(revMsgRes.data.content.replace(/^Changes requested:\s*/i, '').trim());
                } else {
                    setLastRevisionNote('');
                }

                const files: SharedFile[] = [];
                const seen = new Set<string>();
                const messages = (messagesRes.data ?? []) as MessageRow[];
                for (const msg of messages) {
                    for (const [i, att] of (Array.isArray(msg.attachments) ? msg.attachments : []).entries()) {
                        if (!att?.url) continue;
                        const key = `${att.url}|${att.name ?? ''}`;
                        if (seen.has(key)) continue;
                        seen.add(key);
                        files.push({
                            id: `${msg.id}-${i}`,
                            name: att.name ?? 'Attachment',
                            url: att.url as string,
                            type: att.type ?? null,
                            size: att.size ?? null,
                            uploadedAt: msg.created_at ?? null,
                            senderName: msg.sender_id === user.id ? (profile?.full_name || 'You') : 'Counterparty',
                        });
                        if (files.length >= 12) break;
                    }
                    if (files.length >= 12) break;
                }
                setSharedFiles(files);
            } else {
                setLastRevisionNote('');
                setSharedFiles([]);
            }
        } catch (err) {
            logger.error('[ContractWorkspacePage] Failed to load:', err);
            setError('Failed to load contract details. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [contractId, user?.id, profile?.full_name]);

    useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

    // Real-time contract status subscription
    const resolvedContractId = contract?.id ?? contractId ?? '';
    useEffect(() => {
        if (!resolvedContractId) return;
        const channel = supabase
            .channel(`contract-watch:${resolvedContractId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'contracts',
                filter: `id=eq.${resolvedContractId}`,
            }, () => {
                void loadWorkspace();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [resolvedContractId, loadWorkspace]);

    return {
        contract, setContract,
        jobTitle, jobDeadline, jobCategory,
        latestDelivery,
        lastRevisionNote,
        sharedFiles,
        hasReviewed,
        counterpartyProfile,
        isLoading,
        error, setError,
        loadWorkspace,
        ...modals,
        ...upload,
    };
}
