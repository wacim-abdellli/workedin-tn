import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Filter, Share2, MoreVertical, Edit, Loader2 } from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import ProposalCard from '../components/proposals/ProposalCard';
import ProposalFiltersSidebar from '../components/proposals/ProposalFiltersSidebar';
import JobSummaryCard from '../components/proposals/JobSummaryCard';
import type { Proposal, ProposalStatus } from '../types/proposal';
import ProposalDetailModal from '../components/proposals/ProposalDetailModal';
import EmptyState from '../components/common/EmptyState';
import { supabase, withTimeout } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../lib/logger';

interface ProposalFilters {
    status?: ProposalStatus;
    minBid?: number;
    maxBid?: number;
    minRating?: number;
    sortBy?: 'newest' | 'lowest_bid' | 'highest_rating';
}

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

    const [activeTab, setActiveTab] = useState('all');
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
    const [job, setJob] = useState<JobData | null>(null);
    const [filters, setFilters] = useState<ProposalFilters>({});

    // Fetch job data
    useEffect(() => {
        const fetchJob = async () => {
            if (!jobId) return;

            try {
                const { data, error } = await withTimeout(
                    supabase
                        .from('jobs')
                        .select('*')
                        .eq('id', jobId)
                        .single(),
                    8000
                );

                if (error) throw error;
                setJob(data);
            } catch (error) {
                logger.error('Failed to fetch job', error);
                showToast('فشل تحميل بيانات المشروع', 'error');
            }
        };

        fetchJob();
    }, [jobId, showToast]);

    // Fetch proposals from database
    useEffect(() => {
        const fetchProposals = async () => {
            if (!jobId) return;

            try {
                setLoading(true);
                const { data, error } = await withTimeout(
                    supabase
                        .from('proposals')
                        .select(`
                            *,
                            freelancer:profiles!freelancer_id(
                                id,
                                full_name,
                                avatar_url,
                                location
                            ),
                            freelancer_profile:freelancer_profiles!freelancer_id(
                                title,
                                hourly_rate,
                                skills,
                                average_rating,
                                total_reviews,
                                completed_jobs,
                                success_rate
                            )
                        `)
                        .eq('job_id', jobId)
                        .order('created_at', { ascending: false }),
                    8000
                );

                if (error) throw error;

                // Transform data to match Proposal type
                const transformedProposals: Proposal[] = (data || []).map((p: Record<string, unknown>) => ({
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
                        full_name: (p.freelancer as Record<string, unknown>)?.full_name as string || 'مستخدم',
                        title: (p.freelancer_profile as Record<string, unknown>)?.title as string || '',
                        avatar_url: (p.freelancer as Record<string, unknown>)?.avatar_url as string || '',
                        country: (p.freelancer as Record<string, unknown>)?.location as string || 'تونس',
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

                // Extract shortlisted IDs
                const shortlisted = transformedProposals
                    .filter((p) => p.status === 'shortlisted')
                    .map((p) => p.id);
                setShortlistedIds(shortlisted);

            } catch (error) {
                logger.error('Failed to fetch proposals', error);
                showToast('فشل تحميل العروض', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProposals();
    }, [jobId, showToast]);

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
                showToast('يجب توظيف المستقل أولاً لبدء المحادثة', 'info');
            }
        } catch {
            // No contract found - show info message
            showToast('يجب توظيف المستقل أولاً لبدء المحادثة', 'info');
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
                8000
            );

            if (error) throw error;

            // Update local state
            if (isShortlisted) {
                setShortlistedIds(prev => prev.filter(id => id !== proposalId));
                showToast('تمت الإزالة من القائمة المختصرة', 'success');
            } else {
                setShortlistedIds(prev => [...prev, proposalId]);
                showToast('تمت الإضافة إلى القائمة المختصرة', 'success');
            }

            // Update proposals state
            setProposals(prev => prev.map(p =>
                p.id === proposalId ? { ...p, status: newStatus as ProposalStatus } : p
            ));

        } catch (error) {
            logger.error('Shortlist error', error);
            showToast('حدث خطأ أثناء تحديث القائمة المختصرة', 'error');
        }
    }, [shortlistedIds, showToast]);

    // Hire handler - create contract
    const handleHire = useCallback(async (proposalId: string) => {
        const proposal = proposals.find(p => p.id === proposalId);
        if (!proposal || !job || !user) return;

        try {
            setActionLoading(true);

            // 1. Update proposal status to accepted
            const { error: proposalError } = await withTimeout(
                supabase
                    .from('proposals')
                    .update({ status: 'accepted' })
                    .eq('id', proposalId),
                8000
            );

            if (proposalError) throw proposalError;

            // 2. Reject all other proposals for this job
            await supabase
                .from('proposals')
                .update({ status: 'rejected' })
                .eq('job_id', jobId)
                .neq('id', proposalId);

            // 3. Create contract
            const { data: contract, error: contractError } = await withTimeout(
                supabase
                    .from('contracts')
                    .insert({
                        job_id: jobId,
                        proposal_id: proposalId,
                        client_id: user.id,
                        freelancer_id: proposal.freelancer_id,
                        amount: proposal.bid_amount,
                        status: 'pending_payment'
                    })
                    .select()
                    .single(),
                8000
            );

            if (contractError) throw contractError;

            // 4. Update job status
            await supabase
                .from('jobs')
                .update({ status: 'in_progress' })
                .eq('id', jobId);

            // 5. Send notification to freelancer
            await supabase
                .from('notifications')
                .insert({
                    user_id: proposal.freelancer_id,
                    type: 'proposal_accepted',
                    title: 'تم قبول عرضك!',
                    message: `تم قبول عرضك على المشروع: ${job.title}`,
                    data: { contract_id: contract.id, job_id: jobId }
                });

            // 6. Send email notification (fire-and-forget)
            supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', proposal.freelancer_id)
                .single()
                .then(({ data: fp }) => {
                    if (fp?.email) {
                        import('../lib/email').then(({ sendProposalAcceptedEmail }) => {
                            sendProposalAcceptedEmail(fp.email, fp.full_name || 'مستقل', job.title, contract.id);
                        });
                    }
                });

            showToast('تم توظيف المستقل بنجاح! 🎉', 'success');
            navigate(`/contracts/${contract.id}`);

        } catch (error) {
            logger.error('Hire error', error);
            showToast('فشل توظيف المستقل. حاول مرة أخرى', 'error');
        } finally {
            setActionLoading(false);
        }
    }, [proposals, job, user, jobId, navigate, showToast]);

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
            case 'highest_rating':
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
                8000
            );

            if (error) throw error;

            // Update local state
            setProposals(prev => prev.map(p =>
                p.id === proposalId ? { ...p, status: 'archived' as ProposalStatus } : p
            ));

            setSelectedProposal(null);
            showToast('تم أرشفة العرض', 'success');

        } catch (error) {
            logger.error('Archive error', error);
            showToast('فشل أرشفة العرض', 'error');
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
            <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
                <Header />
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pb-20 transition-colors duration-300">
            <Header />

            {/* Top Section: Job Info */}
            <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 pt-8 pb-8 transition-colors duration-300">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {job?.title || 'تحميل...'}
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-800">
                                    {job?.status === 'open' ? 'مفتوح' : job?.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <strong className="text-gray-900 dark:text-white">{stats.proposals}</strong> عروض
                                </span>
                                <span className="flex items-center gap-1">
                                    <strong className="text-gray-900 dark:text-white">{stats.interviewing}</strong> مقابلات
                                </span>
                                <span className="flex items-center gap-1">
                                    <strong className="text-gray-900 dark:text-white">{stats.shortlisted}</strong> قائمة قصيرة
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" leftIcon={<Share2 className="w-4 h-4" />}>
                                مشاركة
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Edit className="w-4 h-4" />}
                                onClick={() => navigate(`/jobs/${jobId}/edit`)}
                            >
                                تعديل
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
                                تصفية وعرض
                            </Button>
                        </div>

                        {/* Tabs */}
                        <div className="tabs-row mb-0 rounded-xl border border-gray-100 bg-white p-1 dark:border-dark-700 dark:bg-dark-800">
                            {['all', 'new', 'shortlisted', 'archived'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={activeTab === tab ? 'tab-pill-active flex-1 shadow-none' : 'tab-pill flex-1'}
                                >
                                    {tab === 'all' && 'كل العروض'}
                                    {tab === 'new' && 'جديدة'}
                                    {tab === 'shortlisted' && 'قائمة قصيرة'}
                                    {tab === 'archived' && 'مؤرشفة'}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="space-y-4">
                            {actionLoading && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
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
                                    title="لا توجد عروض بعد"
                                    description="لم تتلقى أي عروض لهذا المشروع حتى الآن. جرب مشاركة المشروع لزيادة المشاهدات."
                                    action={{
                                        label: "مشاركة المشروع",
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
