import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Filter, Share2, MoreVertical, Edit, Loader2 } from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import ProposalCard from '../components/proposals/ProposalCard';
import ProposalFiltersSidebar from '../components/proposals/ProposalFiltersSidebar';
import JobSummaryCard from '../components/proposals/JobSummaryCard';
import type { Proposal, ProposalStatus, ProposalFilters } from '../types/proposal';
import ProposalDetailModal from '../components/proposals/ProposalDetailModal';
import EmptyState from '../components/ui/EmptyState';
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

export default function JobProposals() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const { t } = useTranslation();

    // sessionStorage cache helpers
    const cacheKey = jobId ? `jp_cache_${jobId}` : null;
    const readCache = () => {
        if (!cacheKey) return null;
        try { const r = sessionStorage.getItem(cacheKey); return r ? JSON.parse(r) : null; } catch { return null; }
    };
    const writeCache = (job: JobData, proposals: Proposal[]) => {
        if (!cacheKey) return;
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ job, proposals, ts: Date.now() })); } catch { /* ignore */ }
    };

    const cached = readCache();

    const [activeTab, setActiveTab] = useState('all');
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>(cached?.proposals ?? []);
    const [filteredProposals, setFilteredProposals] = useState<Proposal[]>(cached?.proposals ?? []);
    const [loading, setLoading] = useState(!cached);
    const [shortlistedIds, setShortlistedIds] = useState<string[]>(
        (cached?.proposals ?? []).filter((p: Proposal) => p.status === 'shortlisted').map((p: Proposal) => p.id)
    );
    const [job, setJob] = useState<JobData | null>(cached?.job ?? null);
    const [filters, setFilters] = useState<ProposalFilters>({});

    // Fetch job + proposals in parallel, skip loader if cache hit
    useEffect(() => {
        if (!jobId) return;
        const hasCached = !!cached;
        if (!hasCached) setLoading(true);

        const fetchAll = async () => {
            try {
                const [jobRes, proposalsRes] = await Promise.all([
                    withTimeout(supabase.from('jobs').select('*').eq('id', jobId).single(), 10000),
                    withTimeout(
                        supabase.from('proposals').select(`
                            *,
                            freelancer:public_profiles!freelancer_id(id, full_name, avatar_url, location),
                            freelancer_profile:freelancer_profiles!freelancer_id(title, hourly_rate, skills, average_rating, total_reviews, completed_jobs, success_rate)
                        `).eq('job_id', jobId).order('created_at', { ascending: false }),
                        10000
                    ),
                ]);

                if (jobRes.error) throw jobRes.error;
                setJob(jobRes.data);

                const transformedProposals: Proposal[] = (proposalsRes.data || []).map((p: Record<string, unknown>) => ({
                    id: p.id as string,
                    job_id: p.job_id as string,
                    freelancer_id: p.freelancer_id as string,
                    cover_letter: p.cover_letter as string || '',
                    bid_amount: p.bid_amount as number,
                    duration: p.estimated_duration as number || 14,
                    delivery_time: p.estimated_duration as number || 14,
                    created_at: p.created_at as string,
                    status: p.status as ProposalStatus || 'new',
                    attachments: (p.attachments as Array<{ name: string; size: string }>) || [],
                    freelancer: {
                        id: (p.freelancer as Record<string, unknown>)?.id as string || '',
                        full_name: (p.freelancer as Record<string, unknown>)?.full_name as string || t.jobProposals.defaultUser,
                        title: (p.freelancer_profile as Record<string, unknown>)?.title as string || '',
                        avatar_url: (p.freelancer as Record<string, unknown>)?.avatar_url as string || '',
                        country: (p.freelancer as Record<string, unknown>)?.location as string || t.jobProposals.defaultCountry,
                        rating: (p.freelancer_profile as Record<string, unknown>)?.average_rating as number || 0,
                        reviews_count: (p.freelancer_profile as Record<string, unknown>)?.total_reviews as number || 0,
                        jobs_completed: (p.freelancer_profile as Record<string, unknown>)?.completed_jobs as number || 0,
                        success_rate: (p.freelancer_profile as Record<string, unknown>)?.success_rate as number || 0,
                        is_verified: true,
                        is_online: false,
                        bio: ''
                    }
                }));

                setProposals(transformedProposals);
                setFilteredProposals(transformedProposals);
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

    // Message freelancer handler
    const handleMessage = useCallback(async (proposalId: string) => {
        const proposal = proposals.find(p => p.id === proposalId);
        if (!proposal) return;

        try {
            // Check if contract exists for this proposal
            const { data: contract } = await supabase
                .from('contracts')
                .select('id')
                .eq('proposal_id', proposalId)
                .single();

            if (contract) {
                // Navigate to existing contract messages
                navigate(`/contracts/${contract.id}`);
            } else {
                // Show "hire first" message
                showToast(t.jobProposals.hireFirst, 'info');
            }
        } catch {
            // No contract found - show info message
            showToast(t.jobProposals.hireFirst, 'info');
        }
    }, [proposals, navigate, showToast]);

    // Shortlist handler
    const handleShortlist = useCallback(async (proposalId: string) => {
        try {
            const isShortlisted = shortlistedIds.includes(proposalId);
            const newStatus = isShortlisted ? 'new' : 'shortlisted';

            // Update in database
            const { error } = await withTimeout(
                supabase
                    .from('proposals')
                    .update({ status: newStatus })
                    .eq('id', proposalId),
                15000
            );

            if (error) throw error;

            // Update local state
            if (isShortlisted) {
                setShortlistedIds(prev => prev.filter(id => id !== proposalId));
                showToast(t.jobProposals.removedFromShortlist, 'success');
            } else {
                setShortlistedIds(prev => [...prev, proposalId]);
                showToast(t.jobProposals.addedToShortlist, 'success');
            }

            // Update proposals state
            setProposals(prev => prev.map(p =>
                p.id === proposalId ? { ...p, status: newStatus as ProposalStatus } : p
            ));

        } catch (error) {
            logger.error('Shortlist error', error);
            showToast(t.jobProposals.shortlistError, 'error');
        }
    }, [shortlistedIds, showToast]);

    // Hire mutation - create contract with retry logic
    const hireMutation = useMutation({
        mutationFn: async (proposalId: string) => {
            const proposal = proposals.find(p => p.id === proposalId);
            if (!proposal || !job || !user) {
                throw new Error('Missing required data');
            }

            const { data: hireResult, error: hireError } = await withTimeout(
                supabase.rpc('hire_proposal_atomic', {
                    p_proposal_id: proposalId,
                }),
                15000
            );

            if (hireError) throw hireError;

            const contractId = (hireResult as { contract_id?: string } | null)?.contract_id;
            if (!contractId) {
                throw new Error('Atomic hire did not return a contract id');
            }

            // Non-critical follow-up effects stay outside the transaction.
            await supabase.rpc('notify_proposal_accepted', {
                p_contract_id: contractId
            });

            // Fire-and-forget email safely via edge function
            if (contractId) {
                import('../lib/email').then(({ sendProposalAcceptedEmail }) => {
                    sendProposalAcceptedEmail(contractId);
                });
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
            showToast(t.jobProposals.hireError, 'error');
        }
    });

    const handleHire = useCallback((proposalId: string) => {
        hireMutation.mutate(proposalId);
    }, [hireMutation]);

    // Filter change handler
    const handleFilterChange = useCallback((newFilters: ProposalFilters) => {
        setFilters(newFilters);

        let filtered = [...proposals];

        // Filter by status
        if (newFilters.status) {
            filtered = filtered.filter(p => p.status === newFilters.status);
        }

        // Filter by bid range
        if (newFilters.minBid !== undefined) {
            filtered = filtered.filter(p => p.bid_amount >= newFilters.minBid!);
        }
        if (newFilters.maxBid !== undefined) {
            filtered = filtered.filter(p => p.bid_amount <= newFilters.maxBid!);
        }

        // Filter by rating
        if (newFilters.minRating !== undefined) {
            filtered = filtered.filter(p => (p.freelancer?.rating || 0) >= newFilters.minRating!);
        }

        // Sort
        switch (newFilters.sortBy) {
            case 'lowest_bid':
                filtered.sort((a, b) => a.bid_amount - b.bid_amount);
                break;
            case 'rating':
                filtered.sort((a, b) => (b.freelancer?.rating || 0) - (a.freelancer?.rating || 0));
                break;
            case 'newest':
            default:
                filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
        }

        setFilteredProposals(filtered);
    }, [proposals]);

    // Tab filter effect
    useEffect(() => {
        let filtered = [...proposals];

        switch (activeTab) {
            case 'new':
                filtered = proposals.filter(p => p.status === 'new');
                break;
            case 'shortlisted':
                filtered = proposals.filter(p => shortlistedIds.includes(p.id));
                break;
            case 'archived':
                filtered = proposals.filter(p => p.status === 'archived');
                break;
            default:
                filtered = proposals;
        }

        setFilteredProposals(filtered);
    }, [activeTab, proposals, shortlistedIds]);

    // Archive proposal handler
    const handleArchive = useCallback(async (proposalId: string) => {
        try {
            const { error } = await withTimeout(
                supabase
                    .from('proposals')
                    .update({ status: 'archived' })
                    .eq('id', proposalId),
                15000
            );

            if (error) throw error;

            // Update local state
            setProposals(prev => prev.map(p =>
                p.id === proposalId ? { ...p, status: 'archived' as ProposalStatus } : p
            ));

            setSelectedProposal(null);
            showToast(t.jobProposals.proposalArchived, 'success');

        } catch (error) {
            logger.error('Archive error', error);
            showToast(t.jobProposals.archiveError, 'error');
        }
    }, [showToast]);

    // Calculate stats
    const stats = {
        proposals: proposals.length,
        interviewing: proposals.filter(p => p.status === 'shortlisted').length,
        shortlisted: shortlistedIds.length,
        hired: proposals.filter(p => p.status === 'accepted').length
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--page-bg)] transition-colors duration-300">
                <Header />
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--workspace-primary)]" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--page-bg)] pb-20 transition-colors duration-300">
            <Header />

            {/* Top Section: Job Info */}
            <div className="bg-[var(--card-bg)] border-b border-[var(--border)] pt-8 pb-8 transition-colors duration-300">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                                    {job?.title || t.jobProposals.loading}
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-success-light)] dark:bg-[var(--color-success)]/20 text-[var(--color-success-dark)] dark:text-[var(--color-success)] text-xs font-medium border border-[var(--color-success)]/20 dark:border-[var(--color-success)]/30">
                                    {job?.status === 'open' ? t.jobProposals.open : job?.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
                                <span className="flex items-center gap-1">
                                    <strong className="text-[var(--text-primary)]">{stats.proposals}</strong> {t.jobProposals.proposals}
                                </span>
                                <span className="flex items-center gap-1">
                                    <strong className="text-[var(--text-primary)]">{stats.interviewing}</strong> {t.jobProposals.interviews}
                                </span>
                                <span className="flex items-center gap-1">
                                    <strong className="text-[var(--text-primary)]">{stats.shortlisted}</strong> {t.jobProposals.shortlist}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" leftIcon={<Share2 className="w-4 h-4" />}>
                                {t.jobProposals.share}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Edit className="w-4 h-4" />}
                                onClick={() => navigate(jobId ? getJobEditRoute(jobId) : ROUTES.jobs)}
                            >
                                {t.jobProposals.edit}
                            </Button>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-custom py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Left Sidebar: Filters */}
                    <div className="hidden lg:block lg:col-span-3">
                        <ProposalFiltersSidebar
                            totalProposals={stats.proposals}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                        />
                    </div>

                    {/* Center: Proposals List */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* Mobile Filter Toggle */}
                        <div className="lg:hidden">
                            <Button variant="outline" className="w-full" leftIcon={<Filter className="w-4 h-4" />}>
                                {t.jobProposals.filterAndShow}
                            </Button>
                        </div>

                        {/* Tabs */}
                        <div className="tabs-row mb-0 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-1">
                            {['all', 'new', 'shortlisted', 'archived'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={activeTab === tab ? 'tab-pill-active flex-1 shadow-none' : 'tab-pill flex-1'}
                                >
                                    {tab === 'all' && t.jobProposals.allProposals}
                                    {tab === 'new' && t.jobProposals.new}
                                    {tab === 'shortlisted' && t.jobProposals.shortlist}
                                    {tab === 'archived' && t.jobProposals.archived}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="space-y-4">
                            {hireMutation.isPending && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-[var(--workspace-primary)]" />
                                </div>
                            )}

                            {filteredProposals.length > 0 ? (
                                filteredProposals.map(proposal => (
                                    <div
                                        key={proposal.id}
                                        onClick={() => setSelectedProposal(proposal)}
                                        className="cursor-pointer transition-transform hover:scale-[1.01]"
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                setSelectedProposal(proposal);
                                            }
                                        }}
                                    >
                                        <ProposalCard
                                            proposal={proposal}
                                            onHire={handleHire}
                                            onMessage={handleMessage}
                                            onShortlist={handleShortlist}
                                        />
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon={Filter}
                                    title={t.jobProposals.noProposals}
                                    description={t.jobProposals.noProposalsDesc}
                                    action={{
                                        label: t.jobProposals.shareProject,
                                        onClick: () => { },
                                        variant: "outline"
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar: Job Summary */}
                    <div className="hidden lg:block lg:col-span-3">
                        {job && (
                            <JobSummaryCard job={{
                                ...job,
                                stats
                            }} />
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            <ProposalDetailModal
                proposal={selectedProposal}
                isOpen={!!selectedProposal}
                onClose={() => setSelectedProposal(null)}
                onHire={() => selectedProposal?.id && handleHire(selectedProposal.id)}
                onMessage={() => selectedProposal?.id && handleMessage(selectedProposal.id)}
                onShortlist={() => selectedProposal?.id && handleShortlist(selectedProposal.id)}
                onArchive={() => selectedProposal?.id && handleArchive(selectedProposal.id)}
            />
        </div>
    );
}
