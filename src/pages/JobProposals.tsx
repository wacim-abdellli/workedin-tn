import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, Edit, MoreVertical, Loader2 } from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import ProposalListItem from '../components/proposals/ProposalCard';
import ProposalFilterBar from '../components/proposals/ProposalFiltersSidebar';
import JobEmptyPane from '../components/proposals/JobSummaryCard';
import type { Proposal, ProposalStatus, ProposalFilters } from '../types/proposal';
import ProposalDetailPane from '../components/proposals/ProposalDetailModal';
import { HireCelebrationPane } from '../components/proposals/HireCelebrationPane';
import { supabase, withTimeout } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../lib/logger';
import { useTranslation } from '../i18n';
import { useMutation } from '@tanstack/react-query';
import { ROUTES, getJobEditRoute } from '../lib/routes';
import { insertNotification } from '../services/notifications';

interface JobData {
    id: string;
    title: string;
    status: string;
    budget_min: number;
    budget_max: number;
    job_type: string;
    duration: string;
    created_at: string;
    client_id: string;
}

// Tab definitions
const TABS = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'archived', label: 'Archived' },
] as const;

type TabKey = typeof TABS[number]['key'];

const ENABLE_JOB_PROPOSALS_SESSION_CACHE = false;
const HIREABLE_STATUSES: ProposalStatus[] = ['new', 'pending', 'shortlisted'];

export default function JobProposals() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const { t } = useTranslation();

    // Cache helpers
    const CACHE_VERSION = 'v3';
    const cacheKey = jobId ? `jp_cache_${CACHE_VERSION}_${jobId}` : null;
    const readCache = () => {
        if (!ENABLE_JOB_PROPOSALS_SESSION_CACHE || !cacheKey) return null;
        try {
            const r = sessionStorage.getItem(cacheKey);
            if (!r) return null;
            const parsed = JSON.parse(r);
            if (Date.now() - (parsed.ts ?? 0) > 5 * 60_000) { sessionStorage.removeItem(cacheKey); return null; }
            return parsed;
        } catch { return null; }
    };
    const writeCache = (job: JobData, proposals: Proposal[]) => {
        if (!ENABLE_JOB_PROPOSALS_SESSION_CACHE || !cacheKey) return;
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ job, proposals, ts: Date.now() })); } catch { /* ignore */ }
    };

    const cached = readCache();

    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>(cached?.proposals ?? []);
    const [loading, setLoading] = useState(!cached);
    const [shortlistedIds, setShortlistedIds] = useState<string[]>(
        (cached?.proposals ?? []).filter((p: Proposal) => p.status === 'shortlisted').map((p: Proposal) => p.id)
    );
    const [job, setJob] = useState<JobData | null>(cached?.job ?? null);
    const [filters, setFilters] = useState<ProposalFilters>({});
    const proposalsLoadErrorShownRef = useRef(false);
    const [hasActiveContract, setHasActiveContract] = useState(false);
    const [hiredContract, setHiredContract] = useState<{ id: string; freelancerId: string; freelancerName: string; freelancerAvatar: string | null; jobTitle: string | null; amount: number } | null>(null);

    useEffect(() => {
        if (!jobId) return;
        const hasCached = !!cached;
        if (!hasCached) setLoading(true);

        const showLoadErrorToastOnce = () => {
            if (hasCached || proposalsLoadErrorShownRef.current) return;
            proposalsLoadErrorShownRef.current = true;
            showToast(t.jobProposals.loadProposalsError, 'error');
        };

        const proposalSelectColumns = `
            id,
            job_id,
            freelancer_id,
            cover_letter,
            bid_amount,
            delivery_time_days,
            attachments,
            status,
            created_at,
            freelancer:public_profiles!freelancer_id(id, full_name, avatar_url, location),
            freelancer_profile:freelancer_profiles!freelancer_id(title, jobs_completed, success_rate)
        `;

        const baseProposalSelectColumns = `
            id,
            job_id,
            freelancer_id,
            cover_letter,
            bid_amount,
            delivery_time_days,
            attachments,
            status,
            created_at
        `;

        const fetchProposalsRows = async () => {
            const joinedResult = await withTimeout(
                supabase.from('proposals')
                    .select(proposalSelectColumns)
                    .eq('job_id', jobId)
                    .order('created_at', { ascending: false }),
                10000
            );

            if (!joinedResult.error) {
                return joinedResult.data || [];
            }

            logger.warn('Proposals joined query failed; retrying with fallback queries', joinedResult.error);

            const basicResult = await withTimeout(
                supabase.from('proposals')
                    .select(baseProposalSelectColumns)
                    .eq('job_id', jobId)
                    .order('created_at', { ascending: false }),
                10000
            );

            if (basicResult.error) {
                throw basicResult.error;
            }

            const basicRows = (basicResult.data || []) as Array<Record<string, unknown>>;
            const freelancerIds = Array.from(new Set(
                basicRows
                    .map((row) => (typeof row.freelancer_id === 'string' ? row.freelancer_id : ''))
                    .filter(Boolean)
            ));

            if (freelancerIds.length === 0) {
                return basicRows;
            }

            const [publicProfilesResult, freelancerProfilesResult] = await Promise.all([
                withTimeout(
                    supabase.from('public_profiles')
                        .select('id, full_name, avatar_url, location')
                        .in('id', freelancerIds),
                    10000
                ),
                withTimeout(
                    supabase.from('freelancer_profiles')
                        .select('id, title, jobs_completed, success_rate')
                        .in('id', freelancerIds),
                    10000
                ),
            ]);

            const publicProfileMap = new Map<string, Record<string, unknown>>();
            for (const profile of (publicProfilesResult.data || []) as Array<Record<string, unknown>>) {
                const id = String(profile.id || '');
                if (!id) continue;
                publicProfileMap.set(id, profile);
            }

            const freelancerProfileMap = new Map<string, Record<string, unknown>>();
            for (const profile of (freelancerProfilesResult.data || []) as Array<Record<string, unknown>>) {
                const id = String(profile.id || '');
                if (!id) continue;
                freelancerProfileMap.set(id, profile);
            }

            return basicRows.map((row) => {
                const id = typeof row.freelancer_id === 'string' ? row.freelancer_id : '';
                return {
                    ...row,
                    freelancer: id ? publicProfileMap.get(id) : undefined,
                    freelancer_profile: id ? freelancerProfileMap.get(id) : undefined,
                };
            });
        };

        const fetchAll = async () => {
            try {
                const [jobRes, proposalsRows, contractsRes] = await Promise.all([
                    withTimeout(supabase.from('jobs').select('*').eq('id', jobId).single(), 10000),
                    fetchProposalsRows(),
                    withTimeout(
                        supabase.from('contracts')
                            .select('id, status')
                            .eq('job_id', jobId)
                            .in('status', ['active', 'in_progress', 'pending_payment', 'delivery_submitted']),
                        10000
                    ),
                ]);

                if (jobRes.error) throw jobRes.error;
                setJob(jobRes.data);

                // Check if there are any active contracts
                const activeContracts = contractsRes.data || [];
                setHasActiveContract(activeContracts.length > 0);

                const rows = proposalsRows || [];
                const transformedProposals: Proposal[] = rows.map((p: Record<string, unknown>) => {
                    const fid = p.freelancer_id as string;
                    const profile = (Array.isArray(p.freelancer)
                        ? p.freelancer[0]
                        : p.freelancer) as Record<string, unknown> | undefined;
                    const fp = (Array.isArray(p.freelancer_profile)
                        ? p.freelancer_profile[0]
                        : p.freelancer_profile) as Record<string, unknown> | undefined;
                    return {
                        id: p.id as string,
                        job_id: p.job_id as string,
                        freelancer_id: fid,
                        cover_letter: p.cover_letter as string || '',
                        bid_amount: p.bid_amount as number,
                        duration: p.delivery_time_days as number || 14,
                        created_at: p.created_at as string,
                        status: p.status as ProposalStatus || 'new',
                        attachments: (Array.isArray(p.attachments) ? p.attachments : []).map((att: any) => {
                            if (typeof att === 'string') {
                                const url = att.startsWith('http') ? att : supabase.storage.from('attachments').getPublicUrl(att.replace(/^attachments\//, '')).data.publicUrl;
                                const isImage = /\.(jpg|jpeg|png|webp|gif|bmp|avif)(\?.*)?$/i.test(att);
                                const name = att.split('/').pop()?.split('?')[0] || 'Attachment';
                                return { url, name, size: '', isImage };
                            }
                            return att;
                        }),
                        freelancer: {
                            id: fid,
                            full_name: (profile?.full_name as string) || t.jobProposals.defaultUser,
                            title: (fp?.title as string) || '',
                            avatar_url: (profile?.avatar_url as string) || null,
                            country: '',
                            rating: 0,
                            reviews_count: 0,
                            jobs_completed: (fp?.jobs_completed as number) || 0,
                            success_rate: (fp?.success_rate as number) || 0,
                            is_verified: true,
                            is_online: false,
                            bio: '',
                        },
                    };
                });

                setProposals(transformedProposals);
                setShortlistedIds(transformedProposals.filter(p => p.status === 'shortlisted').map(p => p.id));
                writeCache(jobRes.data, transformedProposals);
                proposalsLoadErrorShownRef.current = false;
            } catch (error) {
                logger.error('Failed to fetch proposals', error);
                showLoadErrorToastOnce();
            } finally {
                setLoading(false);
            }
        };

        void fetchAll();
    }, [cached, jobId, showToast, t.jobProposals.loadProposalsError]);

    const handleMessage = useCallback(async (proposalId: string) => {
        const proposal = proposals.find(p => p.id === proposalId);
        if (!proposal) return;
        try {
            const { data: contract } = await supabase
                .from('contracts')
                .select('id')
                .eq('proposal_id', proposalId)
                .maybeSingle();

            if (contract?.id) {
                navigate(`/messages?contract=${contract.id}&with=${proposal.freelancer_id}`, {
                    state: { contractId: contract.id, otherUserId: proposal.freelancer_id },
                });
            }
            else showToast(t.jobProposals.hireFirst, 'info');
        } catch {
            showToast(t.jobProposals.hireFirst, 'info');
        }
    }, [proposals, navigate, showToast]);

    const handleShareJob = useCallback(async () => {
        if (!jobId) return;
        
        const jobUrl = `${window.location.origin}/jobs/${jobId}`;
        
        try {
            // Try to use native share API if available (mobile)
            if (navigator.share) {
                await navigator.share({
                    title: job?.title || 'Job Opportunity',
                    text: `Check out this job: ${job?.title || 'Job Opportunity'}`,
                    url: jobUrl,
                });
                showToast('Shared successfully', 'success');
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(jobUrl);
                showToast('Job link copied to clipboard', 'success');
            }
        } catch (error) {
            // If share was cancelled or clipboard failed, try clipboard as fallback
            if (error instanceof Error && error.name !== 'AbortError') {
                try {
                    await navigator.clipboard.writeText(jobUrl);
                    showToast('Job link copied to clipboard', 'success');
                } catch {
                    showToast('Failed to share job', 'error');
                }
            }
        }
    }, [jobId, job?.title, showToast]);

    const handleShortlist = useCallback(async (proposalId: string) => {
        const isShortlisted = shortlistedIds.includes(proposalId);
        const newStatus = isShortlisted ? 'pending' : 'shortlisted';

        if (isShortlisted) setShortlistedIds(prev => prev.filter(id => id !== proposalId));
        else setShortlistedIds(prev => [...prev, proposalId]);
        setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: newStatus as ProposalStatus } : p));

        try {
            const { error } = await withTimeout(
                supabase.from('proposals').update({ status: newStatus }).eq('id', proposalId),
                15000
            );
            if (error) throw error;
            showToast(isShortlisted ? t.jobProposals.removedFromShortlist : t.jobProposals.addedToShortlist, 'success');
        } catch (error) {
            logger.error('Shortlist error', error);
            if (isShortlisted) setShortlistedIds(prev => [...prev, proposalId]);
            else setShortlistedIds(prev => prev.filter(id => id !== proposalId));
            setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: isShortlisted ? 'shortlisted' : 'pending' as ProposalStatus } : p));
            showToast(t.jobProposals.shortlistError, 'error');
        }
    }, [shortlistedIds, showToast]);

    const isContractTypeCastRpcError = (error: unknown): boolean => {
        if (!error || typeof error !== 'object') return false;
        const candidate = error as { message?: unknown; details?: unknown; hint?: unknown };
        const message = typeof candidate.message === 'string' ? candidate.message : '';
        const details = typeof candidate.details === 'string' ? candidate.details : '';
        const hint = typeof candidate.hint === 'string' ? candidate.hint : '';
        const normalized = `${message} ${details} ${hint}`.toLowerCase();
        return normalized.includes('contract_type')
            && normalized.includes('job_type_enum')
            && normalized.includes('text');
    };

    const isMissingDisputedJobStatusError = (error: unknown): boolean => {
        if (!error || typeof error !== 'object') return false;
        const candidate = error as { message?: unknown; details?: unknown; hint?: unknown };
        const message = typeof candidate.message === 'string' ? candidate.message : '';
        const details = typeof candidate.details === 'string' ? candidate.details : '';
        const hint = typeof candidate.hint === 'string' ? candidate.hint : '';
        const normalized = `${message} ${details} ${hint}`.toLowerCase();
        return normalized.includes('job_status_enum') && normalized.includes('disputed');
    };

    const invokeHireProposalFallback = async (proposalId: string): Promise<{ contract_id?: string }> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error('Authentication required');
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase environment is not configured');
        }

        const requestFallback = (accessToken: string) => withTimeout(
            fetch(`${supabaseUrl}/functions/v1/hire-proposal-fallback`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    apikey: supabaseAnonKey,
                    'Content-Type': 'application/json',
                    'x-client-info': 'WorkedIn-tn',
                },
                body: JSON.stringify({ proposalId }),
            }),
            20000,
            'hire-proposal-fallback'
        );

        type FallbackPayload = {
            error?: unknown;
            message?: unknown;
            contract_id?: unknown;
        };

        let response = await requestFallback(session.access_token);
        let payload = await response.json().catch(() => ({})) as FallbackPayload;

        if (response.status === 401) {
            const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
            const refreshedToken = refreshed.session?.access_token;

            if (!refreshError && refreshedToken && refreshedToken !== session.access_token) {
                response = await requestFallback(refreshedToken);
                payload = await response.json().catch(() => ({})) as FallbackPayload;
            }
        }

        if (!response.ok) {
            const message = typeof payload.error === 'string'
                ? payload.error
                : typeof payload.message === 'string'
                    ? payload.message
                    : 'Failed to create contract via fallback';

            if (message.toLowerCase().includes('job_status_enum') && message.toLowerCase().includes('disputed')) {
                throw new Error('Hiring is temporarily unavailable until the latest database migrations are applied.');
            }

            throw new Error(message);
        }

        return {
            contract_id: typeof payload.contract_id === 'string' ? payload.contract_id : undefined,
        };
    };

    const hireMutation = useMutation({
        mutationFn: async ({ proposalId, milestones }: { proposalId: string; milestones?: Array<{ description: string; amount: number; due_date?: string }> }) => {
            const proposal = proposals.find(p => p.id === proposalId);
            if (!proposal || !job || !user) throw new Error('Missing required data');
            if (!HIREABLE_STATUSES.includes(proposal.status)) {
                throw new Error('Only new, pending, or shortlisted proposals can be hired.');
            }

            let contractId: string | undefined;

            const { data: hireResult, error: hireError } = await withTimeout(
                supabase.rpc('hire_proposal_atomic', { p_proposal_id: proposalId }),
                15000
            );

            if (!hireError) {
                contractId = (hireResult as { contract_id?: string } | null)?.contract_id;
            } else if (isContractTypeCastRpcError(hireError)) {
                logger.warn('hire_proposal_atomic enum-cast error detected; falling back to edge function', hireError);

                const fallbackResult = await invokeHireProposalFallback(proposalId);
                contractId = fallbackResult.contract_id;
            } else if (isMissingDisputedJobStatusError(hireError)) {
                throw new Error('Hiring is temporarily unavailable until the latest database migrations are applied.');
            } else {
                throw hireError;
            }

            if (!contractId) throw new Error('Atomic hire did not return a contract id');

            // Insert milestones if provided
            if (milestones && milestones.length > 0) {
                logger.info(`[hiring] Inserting ${milestones.length} milestones for contract ${contractId}`);
                const milestoneRows = milestones.map((m, idx) => ({
                    contract_id: contractId,
                    description: m.description.trim() || `Milestone ${idx + 1}`,
                    amount: m.amount,
                    status: 'pending',
                    due_date: m.due_date ? new Date(m.due_date).toISOString() : null
                }));

                const { error: insertError } = await supabase
                    .from('milestones')
                    .insert(milestoneRows);

                if (insertError) {
                    logger.error('[hiring] Failed to insert milestones:', insertError);
                    throw new Error(`Contract created, but milestones failed to initialize: ${insertError.message}`);
                }
            }


            void (async () => {
                try {
                    const { error } = await supabase.rpc('notify_proposal_accepted', { p_contract_id: contractId });
                    if (error) {
                        logger.warn('notify_proposal_accepted failed after hire', error);
                    }
                } catch (notifyError) {
                    logger.warn('notify_proposal_accepted threw after hire', notifyError);
                }
            })();

            if (contractId) {
                void import('../lib/email')
                    .then(({ sendProposalAcceptedEmail }) => {
                        sendProposalAcceptedEmail(contractId);
                    })
                    .catch((emailError) => {
                        logger.warn('sendProposalAcceptedEmail import failed after hire', emailError);
                    });
            }

            void (async () => {
                try {
                    const { error } = await supabase.rpc('notify_unselected_proposals', {
                        p_job_id: job.id,
                        p_accepted_proposal_id: proposalId,
                        p_contract_id: contractId,
                    });

                    if (error) {
                        const message = String(error.message || '').toLowerCase();
                        const missingRpc = message.includes('notify_unselected_proposals') && message.includes('does not exist');
                        if (!missingRpc) {
                            logger.warn('notify_unselected_proposals failed after hire', error);
                        }
                    }
                } catch (notifyOthersError) {
                    logger.warn('notify_unselected_proposals threw after hire', notifyOthersError);
                }
            })();

            // Pre-create the contract conversation so Messages page opens it immediately.
            // We do this synchronously (not fire-and-forget) so the thread exists before we navigate.
            try {
                let convoResult = await supabase.rpc('get_or_create_conversation', {
                    user1: user.id,
                    user2: proposal.freelancer_id,
                    p_contract_id: contractId,
                    p_scope: 'contract',
                });
                if (convoResult.error) {
                    // Fallback for older DB revisions without p_scope
                    convoResult = await supabase.rpc('get_or_create_conversation', {
                        user1: user.id,
                        user2: proposal.freelancer_id,
                        p_contract_id: contractId,
                    });
                }
            } catch (convoErr) {
                logger.warn('Pre-creating contract conversation failed; Messages page will retry', convoErr);
            }

            return { id: contractId, freelancerId: proposal.freelancer_id };
        },
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        onSuccess: (contract) => {
            showToast(t.jobProposals.hireSuccess, 'success');
            // Mark that we now have an active contract
            setHasActiveContract(true);
            const prop = proposals.find(p => p.freelancer_id === contract.freelancerId);
            setHiredContract({
                id: contract.id || '',
                freelancerId: contract.freelancerId || '',
                freelancerName: prop?.freelancer?.full_name || 'Freelancer',
                freelancerAvatar: prop?.freelancer?.avatar_url || null,
                jobTitle: job?.title || 'Job',
                amount: prop?.bid_amount || 0
            });
        },
        onError: (error) => {
            logger.error('Hire error', error);
            if (isMissingDisputedJobStatusError(error)) {
                showToast('Hiring is temporarily unavailable until the latest database migrations are applied.', 'error');
                return;
            }
            showToast((error as Error)?.message || t.jobProposals.hireError, 'error');
        },
    });

    const handleHire = useCallback((proposalId: string, milestones?: Array<{ description: string; amount: number; due_date?: string }>) => {
        const proposal = proposals.find(p => p.id === proposalId);
        const hireStatusBlockedLabel = 'This proposal can no longer be hired.';
        if (!proposal) {
            showToast(t.jobProposals.hireError, 'error');
            return;
        }

        if (!HIREABLE_STATUSES.includes(proposal.status)) {
            showToast(hireStatusBlockedLabel, 'warning');
            return;
        }

        hireMutation.mutate({ proposalId, milestones });
    }, [proposals, hireMutation, showToast, t.jobProposals.hireError]);


    const handleArchive = useCallback(async (proposalId: string) => {
        try {
            const { error } = await withTimeout(
                supabase.from('proposals').update({ status: 'archived' }).eq('id', proposalId),
                15000
            );
            if (error) throw error;
            setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'archived' as ProposalStatus } : p));
            setShortlistedIds(prev => prev.filter(id => id !== proposalId));
            setSelectedProposal(null);
            showToast(t.jobProposals.proposalArchived, 'success');
        } catch (error) {
            logger.error('Archive error', error);
            showToast(t.jobProposals.archiveError, 'error');
        }
    }, [showToast]);

    const handleUnarchive = useCallback(async (proposalId: string) => {
        try {
            const { error } = await withTimeout(
                supabase.from('proposals').update({ status: 'pending' }).eq('id', proposalId),
                15000
            );
            if (error) throw error;

            setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'pending' as ProposalStatus } : p));
            setShortlistedIds(prev => prev.filter(id => id !== proposalId));
            setSelectedProposal(null);
            showToast(t.jobProposals.proposalUnarchived || 'Proposal moved back to active', 'success');
        } catch (error) {
            logger.error('Unarchive error', error);
            showToast(t.jobProposals.unarchiveError || 'Failed to unarchive proposal', 'error');
        }
    }, [showToast]);

    const rejectedLabel = t.jobProposals?.modal?.rejected || 'Proposal declined';
    const shortlistErrorLabel = t.jobProposals?.shortlistError || 'Error updating proposal status';

    const handleReject = useCallback(async (proposalId: string) => {
        try {
            const { error } = await withTimeout(
                supabase.from('proposals').update({ status: 'rejected' }).eq('id', proposalId),
                15000
            );
            if (error) throw error;

            const proposal = proposals.find(p => p.id === proposalId);
            if (proposal && job) {
                void insertNotification({
                    user_id: proposal.freelancer_id || '',
                    type: 'proposal' as any,
                    title: 'Proposal Declined',
                    body: `Your proposal for "${job.title}" was declined.`,
                    link: `/jobs/${job.id}`
                }).catch(e => logger.warn('Failed to send decline notification', e));
            }

            setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'rejected' as ProposalStatus } : p));
            setShortlistedIds(prev => prev.filter(id => id !== proposalId));
            showToast(rejectedLabel, 'success');
        } catch (error) {
            logger.error('Reject proposal error', error);
            showToast(shortlistErrorLabel, 'error');
        }
    }, [showToast, rejectedLabel, shortlistErrorLabel]);

    // Filtered proposals
    const displayedProposals = proposals.filter(p => {
        // Tab filter
        if (activeTab === 'new') {
            if (p.status !== 'new' && p.status !== 'pending') return false;
            const daysOld = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
            if (daysOld > 3) return false;
        }
        if (activeTab === 'shortlisted' && !shortlistedIds.includes(p.id)) return false;
        if (activeTab === 'archived' && p.status !== 'archived') return false;

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchName = p.freelancer?.full_name?.toLowerCase().includes(q);
            const matchLetter = p.cover_letter?.toLowerCase().includes(q);
            if (!matchName && !matchLetter) return false;
        }

        return true;
    }).sort((a, b) => {
        if (filters.sortBy === 'lowest_bid') return a.bid_amount - b.bid_amount;
        if (filters.sortBy === 'highest_bid') return b.bid_amount - a.bid_amount;
        if (filters.sortBy === 'rating') return (b.freelancer?.rating || 0) - (a.freelancer?.rating || 0);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const stats = {
        proposals: proposals.length,
        interviewing: proposals.filter(p => p.status === 'shortlisted').length,
        shortlisted: shortlistedIds.length,
    };

    const tabCounts: Record<TabKey, number> = {
        all: proposals.length,
        new: proposals.filter(p => {
            if (p.status !== 'new' && p.status !== 'pending') return false;
            return (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 3;
        }).length,
        shortlisted: shortlistedIds.length,
        archived: proposals.filter(p => p.status === 'archived').length,
    };

    // Keep selectedProposal in sync with latest state
    const liveSelectedProposal = selectedProposal
        ? proposals.find(p => p.id === selectedProposal.id) ?? selectedProposal
        : null;
    const isSelectedShortlisted = liveSelectedProposal ? shortlistedIds.includes(liveSelectedProposal.id) : false;

    if (loading) {
        return (
            <div className="min-h-screen page-bg-base flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--workspace-primary)' }} />
                        <p className="text-sm text-white/50">Loading proposals…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen page-bg-base flex flex-col">
            <Header />

            {/* ── COMPACT JOB TITLE BAR ── */}
            <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-white/5 bg-[var(--color-bg-base)] shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <h1 className="text-base font-black truncate text-white">
                        {job?.title || 'Loading…'}
                    </h1>
                    {job?.status && (
                        <span className={`shrink-0 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            job.status === 'open'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-white/5 text-white/50 border-white/10'
                        }`}>
                            {job.status === 'open' ? t.jobProposals.open : job.status}
                        </span>
                    )}
                    {/* Quick stats pills */}
                    <div className="hidden sm:flex items-center gap-2">
                        {[
                            { v: stats.proposals, l: 'proposals' },
                            { v: stats.interviewing, l: 'interviews' },
                        ].map(({ v, l }) => (
                            <span key={l}
                                className="rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                                <strong className="text-amber-400">{v}</strong> {l}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" leftIcon={<Share2 className="w-3.5 h-3.5" />} onClick={handleShareJob}>
                        {t.jobProposals.share}
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        leftIcon={<Edit className="w-3.5 h-3.5" />}
                        onClick={() => navigate(jobId ? getJobEditRoute(jobId) : ROUTES.jobs)}
                        disabled={hasActiveContract}
                        title={hasActiveContract ? 'Cannot edit job with active contract' : 'Edit job details'}
                    >
                        {t.jobProposals.edit}
                    </Button>
                    <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* ── SPLIT PANE CONTENT ── */}
            <div className="flex flex-1 overflow-hidden min-h-0 relative w-full">

                {/* ═══ LEFT: Proposals list ═══ */}
                <div className={`w-full sm:w-[340px] md:w-[380px] xl:w-[420px] shrink-0 flex flex-col border-r border-white/5 bg-[var(--color-bg-base)] min-h-0 ${selectedProposal ? 'hidden sm:flex' : 'flex'}`}>
                    {/* Search + sort */}
                    <ProposalFilterBar
                        filters={filters}
                        onFilterChange={setFilters}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />

                    {/* Tab strip */}
                    <div className="flex shrink-0 border-b border-white/5 overflow-x-auto scrollbar-hide">
                        {TABS.map(tab => {
                            const active = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex-1 relative py-3 px-4 text-[10px] uppercase tracking-wider font-bold transition-all shrink-0 ${active ? "text-amber-400" : "text-white/40 hover:text-white/70"}`}
                                >
                                    {tab.label}
                                    {tabCounts[tab.key] > 0 && (
                                        <span className={`ms-1.5 rounded-sm px-1.5 py-0.5 text-[9px] font-black ${active ? "bg-amber-500 text-white" : "bg-white/5 text-white/40"}`}>
                                            {tabCounts[tab.key]}
                                        </span>
                                    )}
                                    {active && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Proposals list */}
                    <div className="flex-1 overflow-y-auto">
                        {hireMutation.isPending && (
                            <div className="flex items-center gap-2 px-4 py-3 text-xs border-b border-amber-500/20 text-amber-400 bg-amber-500/5 font-medium">
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                Creating contract…
                            </div>
                        )}

                        {displayedProposals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-white/40">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-white/5 border border-white/10">
                                    <span className="text-xl">📭</span>
                                </div>
                                <p className="text-sm font-bold text-white mb-1">
                                    {searchQuery ? 'No matches found' : t.jobProposals.noProposals}
                                </p>
                                <p className="text-xs text-white/50">{searchQuery ? 'Try a different search term.' : t.jobProposals.noProposalsDesc}</p>
                            </div>
                        ) : (
                            displayedProposals.map(proposal => (
                                <ProposalListItem
                                    key={proposal.id}
                                    proposal={proposal}
                                    isSelected={selectedProposal?.id === proposal.id}
                                    onClick={() => setSelectedProposal(proposal)}
                                    onHire={() => handleHire(proposal.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* ═══ RIGHT: Detail pane ═══ */}
                <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
                    {hiredContract ? (
                        <HireCelebrationPane
                            freelancerName={hiredContract.freelancerName}
                            freelancerAvatar={hiredContract.freelancerAvatar}
                            jobTitle={hiredContract.jobTitle}
                            amount={hiredContract.amount}
                            contractId={hiredContract.id}
                            freelancerId={hiredContract.freelancerId}
                            onGoToChat={() => {
                                navigate(`/messages?contract=${hiredContract.id}&with=${hiredContract.freelancerId}`, {
                                    state: { contractId: hiredContract.id, otherUserId: hiredContract.freelancerId },
                                });
                            }}
                            onGoToWorkspace={() => {
                                navigate(`/contracts/${hiredContract.id}`);
                            }}
                        />
                    ) : liveSelectedProposal ? (
                        <ProposalDetailPane
                            proposal={liveSelectedProposal}
                            isHiring={hireMutation.isPending}
                            isShortlisted={isSelectedShortlisted}
                            onClose={() => setSelectedProposal(null)}
                            onHire={(milestones) => handleHire(liveSelectedProposal.id, milestones)}
                            onMessage={() => handleMessage(liveSelectedProposal.id)}
                            onShortlist={() => handleShortlist(liveSelectedProposal.id)}
                            onReject={() => handleReject(liveSelectedProposal.id)}
                            onArchive={() => handleArchive(liveSelectedProposal.id)}
                            onUnarchive={() => handleUnarchive(liveSelectedProposal.id)}
                        />
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[var(--color-bg-base)]">
                            <JobEmptyPane job={job ? { ...job, stats } : null} hasActiveContract={hasActiveContract} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

