import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Briefcase,
    DollarSign,
    FileText,
    FolderOpen,
    MessageSquare,
    Plus,
    Settings,
    Users,
} from 'lucide-react';

import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SkeletonCard from '../components/common/SkeletonCard';
import EmptyState from '../components/common/EmptyState';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { DashWidget } from '../components/dashboard/DashWidget';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currencyUtils';

interface DashboardContract {
    id: string;
    status: string;
    freelancer: {
        full_name: string | null;
    } | Array<{
        full_name: string | null;
    }> | null;
}

interface DashboardJob {
    id: string;
    title: string;
    budget_min: number | null;
    budget_max: number | null;
    status: string;
    created_at: string;
    proposals_count: number;
    contracts: DashboardContract[] | null;
    budget_type?: string | null;
}

type DashboardNotification = {
    id: string;
    title: string | null;
    body: string | null;
    created_at: string;
};

type DashboardStats = {
    activeJobs: number;
    completedContracts: number;
    totalSpent: number;
    proposalsWaitingReview: number;
    totalProposals: number;
    unreadNotifications: DashboardNotification[];
};

type RecentProposal = {
    id: string;
    job_id: string;
    bid_amount: number;
    created_at: string;
    job: {
        title: string | null;
        client_id: string;
    } | null;
    freelancer: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
};

const motionEase = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: motionEase } },
};

function getTimeGreeting(tx: any): string {
    const h = new Date().getHours();
    if (h < 12) return tx('dashboard.greeting.morning', undefined, 'Good morning');
    if (h < 18) return tx('dashboard.greeting.afternoon', undefined, 'Good afternoon');
    return tx('dashboard.greeting.evening', undefined, 'Good evening');
}

function ClientDashboardPage() {
    const { language, tx } = useTranslation();
    const { profile, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();

    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['clientDashboardStats', profile?.id],
        enabled: !!profile?.id,
        queryFn: async (): Promise<DashboardStats> => {
            const userId = profile!.id;

            const [activeJobsRes, completedContractsRes, walletRes, jobsSummaryRes, notificationsRes] = await Promise.all([
                supabase.from('jobs').select('id', { count: 'exact', head: true })
                    .eq('client_id', userId)
                    .in('status', ['open', 'in_progress']),
                supabase.from('contracts').select('id', { count: 'exact', head: true })
                    .eq('client_id', userId)
                    .eq('status', 'completed'),
                supabase.from('wallets').select('total_withdrawn').eq('user_id', userId).maybeSingle(),
                supabase.from('jobs').select('status, proposals_count').eq('client_id', userId),
                supabase.from('notifications').select('id,title,body,created_at')
                    .eq('user_id', userId)
                    .eq('is_read', false)
                    .order('created_at', { ascending: false })
                    .limit(4),
            ]);

            const jobSummaryRows = jobsSummaryRes.data ?? [];

            return {
                activeJobs: activeJobsRes.count ?? 0,
                completedContracts: completedContractsRes.count ?? 0,
                totalSpent: Number(walletRes.data?.total_withdrawn ?? 0),
                proposalsWaitingReview: jobSummaryRows.filter((job) => job.status === 'open' && (job.proposals_count ?? 0) > 0).length,
                totalProposals: jobSummaryRows.reduce((sum, job) => sum + Number(job.proposals_count ?? 0), 0),
                unreadNotifications: notificationsRes.data ?? [],
            };
        },
        staleTime: 60_000,
    });

    const { data: jobs = [] } = useQuery<DashboardJob[]>({
        queryKey: ['clientDashboardJobs', profile?.id],
        enabled: !!profile?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    id, title, budget_min, budget_max, status, created_at,
                    proposals_count,
                    contracts(id, status, freelancer:profiles!freelancer_id(full_name))
                `)
                .eq('client_id', profile!.id)
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) {
                console.error('clientDashboardJobs error:', error);
                return [];
            }

            return (data ?? []) as unknown as DashboardJob[];
        },
        staleTime: 60_000,
    });

    const { data: activeContracts = [] } = useQuery({
        queryKey: ['clientActiveContracts', profile?.id],
        enabled: !!profile?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('contracts')
                .select('id, title, status, total_amount, created_at, freelancer:profiles!contracts_freelancer_id_fkey(id, full_name, avatar_url)')
                .eq('client_id', profile!.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(5);
            if (error) { console.error('clientActiveContracts:', error); return []; }
            return (data ?? []) as unknown as Array<{
                id: string;
                title: string;
                status: string;
                total_amount: number;
                created_at: string;
                freelancer: { id: string; full_name: string; avatar_url: string | null } | null;
            }>;
        },
        staleTime: 60_000,
    });

    const { data: proposals = [], isLoading: isLoadingProposals } = useQuery<RecentProposal[]>({
        queryKey: ['dashboard', 'recent-proposals', profile?.id],
        enabled: !!profile?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('proposals')
                .select('id, job_id, bid_amount, created_at, job:jobs!inner(title, client_id), freelancer:profiles!proposals_freelancer_id_fkey(full_name, avatar_url)')
                .eq('job.client_id', profile!.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(4);

            if (error) {
                console.error('clientRecentProposals:', error);
                return [];
            }

            return (data ?? []) as unknown as RecentProposal[];
        },
        staleTime: 60_000,
    });

    const statsData = {
        totalJobs: jobs.length,
        activeJobs: stats?.activeJobs ?? 0,
        totalProposals: stats?.totalProposals ?? 0,
        totalSpent: stats?.totalSpent ?? 0,
        monthlySpending: activeContracts.reduce((sum, contract) => sum + Number(contract.total_amount ?? 0), 0),
        activeContracts: activeContracts.length,
    };

    if (isAuthLoading || !profile?.id) {
        return (
            <div className="min-h-screen" style={{ background: 'var(--dash-bg)' }}>
                <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
                <Header />
                <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 max-w-7xl">
                    <SkeletonCard />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--dash-bg)' }}>
            <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
            <Header />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: motionEase }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10"
                >
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--workspace-primary-mid)' }}>
                            {getTimeGreeting(tx)}
                        </p>
                        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            {profile.full_name?.split(' ')[0] || 'Client'}
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {[
                            { label: tx('dashboard.client.projectsLabel', undefined, 'Projects'), value: statsData.totalJobs },
                            { label: tx('dashboard.client.activeLabel', undefined, 'Active'), value: statsData.activeJobs },
                            { label: tx('dashboard.client.proposalsLabel', undefined, 'Proposals'), value: statsData.totalProposals },
                            { label: tx('dashboard.client.spentLabel', undefined, 'Spent'), value: formatCurrency(statsData.totalSpent, true, language), accent: true },
                        ].map((stat) => (
                            <div
                                key={stat.label}
                                className="flex flex-col items-center px-4 py-2.5 rounded-2xl border"
                                style={{
                                    background: stat.accent ? 'var(--workspace-primary)' : 'var(--stat-pill-bg)',
                                    borderColor: stat.accent ? 'transparent' : 'var(--stat-pill-border)',
                                }}
                            >
                                <span className="font-display font-bold text-lg leading-tight" style={{ color: stat.accent ? '#fff' : 'var(--text-primary)' }}>
                                    {stat.value}
                                </span>
                                <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: stat.accent ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <motion.div className="lg:col-span-2 space-y-5" variants={containerVariants} initial="hidden" animate="show">
                        <motion.div variants={itemVariants}>
                            <DashWidget title={tx('dashboard.client.activeProjects', undefined, 'Active Projects')} icon={<FolderOpen className="w-4 h-4" />} action={{ label: tx('dashboard.client.viewAll', undefined, 'View all'), onClick: () => navigate('/client/jobs') }}>
                                {isStatsLoading ? (
                                    <SkeletonCard />
                                ) : jobs.length === 0 ? (
                                    <EmptyState
                                        icon={FolderOpen}
                                        title={tx('dashboard.client.noActiveProjects', undefined, 'No active projects')}
                                        description={tx('dashboard.client.postFirstProject', undefined, 'Post your first project to find talented freelancers')}
                                        className="min-h-[360px] rounded-[1.6rem] border"
                                        action={{ label: tx('dashboard.client.postAProject', undefined, 'Post a Project'), onClick: () => navigate('/jobs/new') }}
                                    />
                                ) : (
                                    <div className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
                                        {jobs.slice(0, 3).map((job) => (
                                            <div
                                                key={job.id}
                                                className="flex items-center justify-between py-4 px-1 cursor-pointer group"
                                                onClick={() => navigate(`/jobs/${job.id}`)}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                                        {job.title}
                                                    </p>
                                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                        {job.proposals_count ?? 0} {tx('dashboard.client.proposalsCountText', undefined, 'proposals')} · {tx(`status.${job.status}`, undefined, job.status)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                                    <Badge variant={job.status === 'open' ? 'info' : job.status === 'in_progress' ? 'warning' : 'default'}>{tx(`status.${job.status}`, undefined, job.status)}</Badge>
                                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--workspace-primary)' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </DashWidget>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <DashWidget title={tx('dashboard.client.recentProposals', undefined, 'Recent Proposals')} icon={<FileText className="w-4 h-4" />}>
                                {isLoadingProposals ? (
                                    <SkeletonCard />
                                ) : proposals.length === 0 ? (
                                    <EmptyState
                                        icon={FileText}
                                        title={tx('dashboard.client.noProposalsYet', undefined, 'No proposals yet')}
                                        description={tx('dashboard.client.postJobToReceiveProposals', undefined, 'Post a project to start receiving proposals')}
                                        className="rounded-[1.5rem] border"
                                    />
                                ) : (
                                    <div className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
                                        {proposals.slice(0, 4).map((proposal) => (
                                            <div
                                                key={proposal.id}
                                                className="flex items-center justify-between py-4 px-1 cursor-pointer group"
                                                onClick={() => navigate(`/jobs/${proposal.job_id}/proposals`)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0" style={{ background: 'var(--dash-raised)' }}>
                                                        {proposal.freelancer?.avatar_url ? (
                                                            <img src={proposal.freelancer.avatar_url} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--workspace-primary)', color: '#fff' }}>
                                                                {proposal.freelancer?.full_name?.[0] ?? 'F'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                                            {proposal.freelancer?.full_name ?? tx('dashboard.client.freelancerFallback', undefined, 'Freelancer')}
                                                        </p>
                                                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                                            {proposal.job?.title ?? tx('dashboard.client.untitledJob', undefined, 'Untitled job')} · {formatCurrency(proposal.bid_amount ?? 0, true, language)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="warning">{tx('dashboard.client.reviewBadge', undefined, 'Review')}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </DashWidget>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <DashWidget title={tx('dashboard.client.activeContracts', undefined, 'Active Contracts')} icon={<Briefcase className="w-4 h-4" />} action={{ label: tx('dashboard.client.viewAll', undefined, 'View all'), onClick: () => navigate('/contracts') }}>
                                {isStatsLoading ? (
                                    <SkeletonCard />
                                ) : activeContracts.length === 0 ? (
                                    <EmptyState
                                        icon={Briefcase}
                                        title={tx('dashboard.client.noActiveContracts', undefined, 'No active contracts')}
                                        description={tx('dashboard.client.acceptProposalToStart', undefined, 'Accept a proposal to start a contract')}
                                        className="rounded-[1.5rem] border"
                                    />
                                ) : (
                                    <div className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
                                        {activeContracts.slice(0, 3).map((contract) => (
                                            <div
                                                key={contract.id}
                                                className="flex items-center justify-between py-4 px-1 cursor-pointer group"
                                                onClick={() => navigate(`/contracts/${contract.id}`)}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                                        {contract.title}
                                                    </p>
                                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                        {contract.freelancer?.full_name ?? tx('dashboard.client.freelancerFallback', undefined, 'Freelancer')} · {formatCurrency(contract.total_amount ?? 0, true, language)}
                                                    </p>
                                                </div>
                                                <Badge variant={contract.status === 'active' ? 'success' : 'warning'}>{tx(`status.${contract.status}`, undefined, contract.status)}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </DashWidget>
                        </motion.div>
                    </motion.div>

                    <motion.div className="space-y-5" variants={containerVariants} initial="hidden" animate="show">
                        <motion.div variants={itemVariants}>
                            <div
                                className="relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8"
                                style={{ background: 'var(--workspace-primary)' }}
                            >
                                {/* Decorative elements */}
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
                                <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-black/10 blur-3xl" />
                                
                                <div className="relative z-10">
                                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 shadow-inner backdrop-blur-md">
                                        <Plus className="h-6 w-6 text-dark-950" />
                                    </div>
                                    <h3 className="mb-2 font-display text-[1.75rem] font-bold tracking-tight text-dark-950 leading-tight">
                                        {tx('dashboard.client.needSomethingDone', undefined, 'Need something done?')}
                                    </h3>
                                    <p className="mb-8 text-[15px] font-medium leading-relaxed text-dark-950/80">
                                        {tx('dashboard.client.postProjectFree', undefined, 'Post a project free. Get proposals from verified Tunisian talent.')}
                                    </p>
                                    <button
                                        onClick={() => navigate('/jobs/new')}
                                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-dark-950 px-4 py-3.5 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-dark-800 hover:shadow-2xl active:translate-y-0"
                                    >
                                        {tx('dashboard.client.postProjectFreeCta', undefined, 'Post a project — it\'s free')}
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <DashWidget title={tx('dashboard.client.thisMonth', undefined, 'This Month')} icon={<DollarSign className="w-4 h-4" />}>
                                <div>
                                    <p className="font-display font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>
                                        {formatCurrency(statsData.monthlySpending, true, language)}
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                        {tx('dashboard.client.acrossActiveContracts', { count: statsData.activeContracts }, `Across ${statsData.activeContracts} active contracts`)}
                                    </p>
                                    <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigate('/wallet')}>
                                        {tx('dashboard.client.viewWallet', undefined, 'View Wallet')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                </div>
                            </DashWidget>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <DashWidget title={tx('dashboard.client.quickActions', undefined, 'Quick Actions')} icon={<Settings className="w-4 h-4" />}>
                                <div className="space-y-2">
                                    {[
                                        { label: tx('nav.findFreelancers', undefined, 'Find Freelancers'), icon: Users, path: '/find-freelancers' },
                                        { label: tx('nav.myProjects', undefined, 'My Projects'), icon: FolderOpen, path: '/client/jobs' },
                                        { label: tx('nav.contracts', undefined, 'Contracts'), icon: Briefcase, path: '/contracts' },
                                        { label: tx('nav.messages', undefined, 'Messages'), icon: MessageSquare, path: '/messages' },
                                    ].map((action) => (
                                        <button
                                            key={action.label}
                                            onClick={() => navigate(action.path)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
                                            style={{ color: 'var(--text-secondary)' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--dash-raised)';
                                                e.currentTarget.style.color = 'var(--text-primary)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = 'var(--text-secondary)';
                                            }}
                                        >
                                            <action.icon className="w-4 h-4 shrink-0" style={{ color: 'var(--workspace-primary-mid)' }} />
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </DashWidget>
                        </motion.div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

export default ClientDashboardPage;
