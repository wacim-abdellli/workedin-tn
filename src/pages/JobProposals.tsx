import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, Edit, MoreVertical, Loader2 } from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import ProposalListItem from '../components/proposals/ProposalCard';
import ProposalFilterBar from '../components/proposals/ProposalFiltersSidebar';
import JobEmptyPane from '../components/proposals/JobSummaryCard';
import type { Proposal, ProposalStatus, ProposalFilters } from '../types/proposal';
import ProposalDetailPane from '../components/proposals/ProposalDetailModal';
import { supabase, withTimeout } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../lib/logger';
import { useTranslation } from '../i18n';
import { useMutation } from '@tanstack/react-query';
import { ROUTES, getJobEditRoute } from '../lib/routes';

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

    useEffect(() => {
        if (!jobId) return;
        const hasCached = !!cached;
        if (!hasCached) setLoading(true);

        const fetchAll = async () => {
            try {
                const [jobRes, proposalsRes] = await Promise.all([
                    withTimeout(supabase.from('jobs').select('*').eq('id', jobId).single(), 10000),
                    withTimeout(
                        supabase.from('proposals')
                            .select(`
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
                            `)
                            .eq('job_id', jobId)
                            .order('created_at', { ascending: false }),
                        10000
                    ),
                ]);

                if (jobRes.error) throw jobRes.error;
                setJob(jobRes.data);

                if (proposalsRes.error) {
                    logger.error('Proposals query error', proposalsRes.error);
                    if (!hasCached) showToast(t.jobProposals.loadProposalsError, 'error');
                    return;
                }

                const rows = proposalsRes.data || [];
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
                        attachments: (p.attachments as Array<{ name: string; size: string }>) || [],
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
            } catch (error) {
                logger.error('Failed to fetch proposals', error);
                if (!hasCached) showToast(t.jobProposals.loadProposalsError, 'error');
            } finally {
                setLoading(false);
            }
        };

        void fetchAll();
    }, [jobId]);

    const handleMessage = useCallback(async (proposalId: string) => {
        const proposal = proposals.find(p => p.id === proposalId);
        if (!proposal) return;
        try {
            const { data: contract } = await supabase.from('contracts').select('id').eq('proposal_id', proposalId).single();
            if (contract) navigate(`/contracts/${contract.id}`);
            else showToast(t.jobProposals.hireFirst, 'info');
        } catch {
            showToast(t.jobProposals.hireFirst, 'info');
        }
    }, [proposals, navigate, showToast]);

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
            throw new Error(message);
        }

        return {
            contract_id: typeof payload.contract_id === 'string' ? payload.contract_id : undefined,
        };
    };

    const hireMutation = useMutation({
        mutationFn: async (proposalId: string) => {
            const proposal = proposals.find(p => p.id === proposalId);
            if (!proposal || !job || !user) throw new Error('Missing required data');

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
            } else {
                throw hireError;
            }

            if (!contractId) throw new Error('Atomic hire did not return a contract id');

            await supabase.rpc('notify_proposal_accepted', { p_contract_id: contractId });

            if (contractId) {
                import('../lib/email').then(({ sendProposalAcceptedEmail }) => { sendProposalAcceptedEmail(contractId); });
            }

            return { id: contractId };
        },
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        onSuccess: (contract) => {
            showToast(t.jobProposals.hireSuccess, 'success');
            navigate(`/contracts/${contract.id}`);
        },
        onError: (error) => {
            logger.error('Hire error', error);
            showToast((error as Error)?.message || t.jobProposals.hireError, 'error');
        },
    });

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
            <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--page-bg)' }}>
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--workspace-primary)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading proposals…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--page-bg)' }}>
            <Header />

            {/* ── COMPACT JOB TITLE BAR ── */}
            <div
                className="flex items-center justify-between gap-4 px-5 py-3 border-b shrink-0"
                style={{
                    background: 'var(--card-bg)',
                    borderColor: 'color-mix(in srgb, var(--border) 55%, transparent)',
                }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <h1 className="text-base font-black truncate" style={{ color: 'var(--text-primary)' }}>
                        {job?.title || 'Loading…'}
                    </h1>
                    {job?.status && (
                        <span
                            className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold border"
                            style={{
                                background: job.status === 'open' ? 'rgba(34,197,94,0.12)' : 'color-mix(in srgb, var(--border) 20%, transparent)',
                                color: job.status === 'open' ? '#4ade80' : 'var(--text-muted)',
                                borderColor: job.status === 'open' ? 'rgba(34,197,94,0.28)' : 'color-mix(in srgb, var(--border) 50%, transparent)',
                            }}
                        >
                            {job.status === 'open' ? t.jobProposals.open : job.status}
                        </span>
                    )}
                    {/* Quick stats pills */}
                    <div className="hidden sm:flex items-center gap-1.5">
                        {[
                            { v: stats.proposals, l: 'proposals' },
                            { v: stats.interviewing, l: 'interviews' },
                        ].map(({ v, l }) => (
                            <span key={l}
                                className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                                style={{ background: 'color-mix(in srgb, var(--workspace-primary) 6%, var(--card-bg))', borderColor: 'color-mix(in srgb, var(--workspace-primary) 16%, transparent)', color: 'var(--text-secondary)' }}>
                                <strong style={{ color: 'var(--workspace-primary-mid)' }}>{v}</strong> {l}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" leftIcon={<Share2 className="w-3.5 h-3.5" />}>
                        {t.jobProposals.share}
                    </Button>
                    <Button variant="outline" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}
                        onClick={() => navigate(jobId ? getJobEditRoute(jobId) : ROUTES.jobs)}>
                        {t.jobProposals.edit}
                    </Button>
                    <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* ── SPLIT PANE CONTENT ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ═══ LEFT: Proposals list ═══ */}
                <div
                    className="w-full sm:w-[340px] md:w-[380px] xl:w-[420px] shrink-0 flex flex-col border-e overflow-hidden"
                    style={{
                        background: 'var(--card-bg)',
                        borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)',
                        display: selectedProposal ? 'none sm:flex' : 'flex',
                    }}
                >
                    {/* Search + sort */}
                    <ProposalFilterBar
                        filters={filters}
                        onFilterChange={setFilters}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />

                    {/* Tab strip */}
                    <div
                        className="flex shrink-0 border-b"
                        style={{ borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}
                    >
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className="flex-1 relative py-2.5 text-[11px] font-bold transition-colors border-b-2"
                                style={{
                                    borderBottomColor: activeTab === tab.key ? 'var(--workspace-primary)' : 'transparent',
                                    color: activeTab === tab.key ? 'var(--workspace-primary-mid)' : 'var(--text-muted)',
                                    marginBottom: '-1px',
                                }}
                            >
                                {tab.label}
                                {tabCounts[tab.key] > 0 && (
                                    <span
                                        className="ms-1 rounded-full px-1.5 text-[9px] font-black"
                                        style={{
                                            background: activeTab === tab.key ? 'var(--workspace-primary)' : 'color-mix(in srgb, var(--border) 60%, transparent)',
                                            color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                                        }}
                                    >
                                        {tabCounts[tab.key]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Proposals list */}
                    <div className="flex-1 overflow-y-auto">
                        {hireMutation.isPending && (
                            <div className="flex items-center gap-2 px-4 py-2.5 text-xs border-b" style={{ borderColor: 'color-mix(in srgb, var(--border) 40%, transparent)', color: 'var(--workspace-primary-mid)', background: 'color-mix(in srgb, var(--workspace-primary) 6%, transparent)' }}>
                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                Creating contract…
                            </div>
                        )}

                        {displayedProposals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center" style={{ color: 'var(--text-muted)' }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}>
                                    <span className="text-xl">📭</span>
                                </div>
                                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                                    {searchQuery ? 'No matches found' : t.jobProposals.noProposals}
                                </p>
                                <p className="text-xs">{searchQuery ? 'Try a different search term.' : t.jobProposals.noProposalsDesc}</p>
                            </div>
                        ) : (
                            displayedProposals.map(proposal => (
                                <ProposalListItem
                                    key={proposal.id}
                                    proposal={proposal}
                                    isSelected={selectedProposal?.id === proposal.id}
                                    onClick={() => setSelectedProposal(proposal)}
                                    onHire={() => hireMutation.mutate(proposal.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* ═══ RIGHT: Detail pane ═══ */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {liveSelectedProposal ? (
                        <ProposalDetailPane
                            proposal={liveSelectedProposal}
                            isHiring={hireMutation.isPending}
                            isShortlisted={isSelectedShortlisted}
                            onClose={() => setSelectedProposal(null)}
                            onHire={() => hireMutation.mutate(liveSelectedProposal.id)}
                            onMessage={() => handleMessage(liveSelectedProposal.id)}
                            onShortlist={() => handleShortlist(liveSelectedProposal.id)}
                            onArchive={() => handleArchive(liveSelectedProposal.id)}
                            onUnarchive={() => handleUnarchive(liveSelectedProposal.id)}
                        />
                    ) : (
                        <JobEmptyPane job={job ? { ...job, stats } : null} />
                    )}
                </div>
            </div>
        </div>
    );
}
