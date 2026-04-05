import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Briefcase,
    Check,
    DollarSign,
    FileText,
    MessageSquare,
    Search,
    Settings,
    Target,
    TrendingDown,
    TrendingUp,
    User,
} from 'lucide-react';

import { Header } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import EmptyState from '../components/common/EmptyState';
import SkeletonCard from '../components/common/SkeletonCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { DashWidget } from '../components/dashboard/DashWidget';
import { ProfileRing } from '../components/dashboard/ProfileRing';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currencyUtils';

type DashboardNotification = {
    id: string;
    title: string | null;
    body: string | null;
    type: string;
    created_at: string;
};

type DashboardMilestone = {
    id: string;
    description: string;
    due_date: string | null;
    amount: number;
    status: string;
    contract_id: string;
};

type DashboardStats = {
    activeContracts: number;
    pendingProposals: number;
    totalEarnings: number;
    walletBalance: number;
    pendingBalance: number;
    profileViews: number;
    connectsBalance: number;
    freelancerTitle: string | null;
    notifications: DashboardNotification[];
    milestones: DashboardMilestone[];
    recentProposals: Array<{
        id: string;
        status: string;
        bid_amount: number;
        created_at: string;
        job: { id: string; title: string; category: string; status: string } | null;
    }>;
    activeContractsList: Array<{
        id: string;
        title: string;
        status: string;
        total_amount: number;
        client: { id: string; full_name: string; avatar_url: string | null } | null;
    }>;
};

type MatchedJob = {
    id: string;
    title: string;
    category: string | null;
    budget_min: number | null;
    budget_max: number | null;
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

function FreelancerDashboardPage() {
    const { profile, freelancerProfile, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const { language, tx } = useTranslation();

    const locale = useMemo(() => {
        if (language === 'ar') return 'ar-TN';
        if (language === 'fr') return 'fr-FR';
        return 'en-US';
    }, [language]);

    const { data: stats, isLoading } = useQuery({
        queryKey: ['freelancerDashboardStats', profile?.id],
        enabled: !!profile?.id,
        queryFn: async (): Promise<DashboardStats> => {
            const userId = profile!.id;

            const [contractsCountRes, proposalsRes, walletRes, viewsRes, notificationsRes, recentProposalsRes, activeContractsListRes] = await Promise.all([
                supabase.from('contracts').select('id', { count: 'exact', head: true })
                    .eq('freelancer_id', userId)
                    .eq('status', 'active'),
                supabase.from('proposals').select('id', { count: 'exact', head: true })
                    .eq('freelancer_id', userId)
                    .eq('status', 'pending'),
                supabase.from('wallets').select('balance,pending_balance,total_earned').eq('user_id', userId).maybeSingle(),
                supabase.from('freelancer_profiles').select('profile_views,title,connects_balance').eq('id', userId).maybeSingle(),
                supabase.from('notifications').select('id,title,body,type,created_at')
                    .eq('user_id', userId)
                    .neq('type', 'message')
                    .eq('is_read', false)
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase.from('proposals').select('id, status, bid_amount, created_at, job:jobs(id, title, category, status)')
                    .eq('freelancer_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase.from('contracts').select('id, title, status, total_amount, client:profiles!contracts_client_id_fkey(id, full_name, avatar_url)')
                    .eq('freelancer_id', userId)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(5),
            ]);

            const milestonesRes = await supabase.from('milestones')
                .select('id,description,due_date,amount,status,contract_id,contracts!inner(freelancer_id, status)')
                .eq('contracts.freelancer_id', userId)
                .eq('contracts.status', 'active')
                .eq('status', 'pending')
                .order('due_date', { ascending: true })
                .limit(4);

            return {
                activeContracts: contractsCountRes.count ?? 0,
                pendingProposals: proposalsRes.count ?? 0,
                totalEarnings: Number(walletRes.data?.total_earned ?? 0),
                walletBalance: Number(walletRes.data?.balance ?? 0),
                pendingBalance: Number(walletRes.data?.pending_balance ?? 0),
                profileViews: Number(viewsRes.data?.profile_views ?? 0),
                connectsBalance: Number(viewsRes.data?.connects_balance ?? 0),
                freelancerTitle: viewsRes.data?.title ?? null,
                notifications: (notificationsRes.data ?? []) as DashboardNotification[],
                milestones: (milestonesRes.data ?? []) as DashboardMilestone[],
                recentProposals: (recentProposalsRes.data ?? []) as unknown as DashboardStats['recentProposals'],
                activeContractsList: (activeContractsListRes.data ?? []) as unknown as DashboardStats['activeContractsList'],
            };
        },
        staleTime: 60_000,
    });

    const { data: chartData = [] } = useQuery({
        queryKey: ['freelancerEarningsChart', profile?.id, locale],
        enabled: !!profile?.id,
        queryFn: async () => {
            const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' });
            const months = Array.from({ length: 6 }, (_, index) => {
                const date = new Date();
                date.setDate(1);
                date.setMonth(date.getMonth() - (5 - index));

                return {
                    key: `${date.getFullYear()}-${date.getMonth()}`,
                    month: monthFormatter.format(date),
                    earnings: 0,
                };
            });

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const { data } = await supabase
                .from('transactions')
                .select('amount, created_at')
                .eq('user_id', profile!.id)
                .eq('type', 'escrow_release')
                .eq('status', 'completed')
                .gte('created_at', sixMonthsAgo.toISOString())
                .order('created_at', { ascending: true });

            (data || []).forEach((transaction) => {
                const date = new Date(transaction.created_at);
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                const month = months.find((item) => item.key === key);
                if (month) {
                    month.earnings += Number(transaction.amount ?? 0);
                }
            });

            return months.map(({ key: _key, ...item }) => item);
        },
        staleTime: 300_000,
    });

    const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<MatchedJob[]>({
        queryKey: ['dashboard', 'matched-jobs', profile?.id],
        enabled: !!profile?.id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('jobs')
                .select('id,title,category,budget_min,budget_max')
                .eq('status', 'open')
                .eq('visibility', 'public')
                .order('created_at', { ascending: false })
                .limit(3);

            if (error) {
                console.error('freelancer matched jobs:', error);
                return [];
            }

            return (data ?? []) as MatchedJob[];
        },
        staleTime: 60_000,
    });

    const recentProposals = stats?.recentProposals ?? [];
    const contracts = stats?.activeContractsList ?? [];
    const monthlyEarnings = chartData[chartData.length - 1]?.earnings ?? 0;
    const lastMonthEarnings = chartData[chartData.length - 2]?.earnings ?? 0;

    const checklist = [
        { label: tx('dashboard.freelancer.checklist.avatar', undefined, 'Avatar uploaded'), done: !!profile?.avatar_url },
        { label: tx('dashboard.freelancer.checklist.bio', undefined, 'Bio written'), done: (profile?.bio?.length ?? 0) > 20 },
        { label: tx('dashboard.freelancer.checklist.skills', undefined, 'Skills added'), done: (freelancerProfile?.skills?.length ?? 0) > 0 },
        { label: tx('dashboard.freelancer.checklist.title', undefined, 'Professional title'), done: !!stats?.freelancerTitle },
        { label: tx('dashboard.freelancer.checklist.identity', undefined, 'Identity verified'), done: !!profile?.cin_verified },
    ];

    const profileCompletion = Math.round((checklist.filter((item) => item.done).length / checklist.length) * 100);

    const statsData = {
        activeContracts: stats?.activeContracts ?? 0,
        totalProposals: stats?.pendingProposals ?? 0,
        totalEarnings: formatCurrency(stats?.totalEarnings ?? 0, true, language),
        rating: '—',
        monthlyEarnings,
        lastMonthEarnings,
    };

    if (isAuthLoading || !profile?.id) {
        return (
            <div className="min-h-screen" style={{ background: 'var(--dash-bg)' }}>
                <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
                <Header />
                <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 max-w-7xl">
                    <SkeletonCard />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--dash-bg)' }}>
            <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
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
                            {profile.full_name?.split(' ')[0] || 'Freelancer'}
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {[
                            { label: tx('dashboard.freelancer.contractsLabel', undefined, 'Contracts'), value: statsData.activeContracts },
                            { label: tx('dashboard.freelancer.proposalsLabel', undefined, 'Proposals'), value: statsData.totalProposals },
                            { label: tx('dashboard.freelancer.earningsLabel', undefined, 'Earnings'), value: statsData.totalEarnings, accent: true },
                            { label: tx('dashboard.freelancer.ratingLabel', undefined, 'Rating'), value: `${statsData.rating}/5` },
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
                            <DashWidget title={tx('dashboard.freelancer.activeContracts', undefined, 'Active Contracts')} icon={<Briefcase className="w-4 h-4" />} action={{ label: tx('dashboard.freelancer.viewAll', undefined, 'View all'), onClick: () => navigate('/contracts') }}>
                                {isLoading ? (
                                    <SkeletonCard />
                                ) : contracts.length === 0 ? (
                                    <EmptyState
                                        icon={Briefcase}
                                        title={tx('dashboard.freelancer.noActiveContracts', undefined, 'No active contracts')}
                                        description={tx('dashboard.freelancer.submitProposalsToStart', undefined, 'Submit proposals to start getting contracts')}
                                        action={{ label: tx('dashboard.freelancer.browseJobs', undefined, 'Browse Jobs'), onClick: () => navigate('/jobs') }}
                                    />
                                ) : (
                                    <div className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
                                        {contracts.slice(0, 3).map((contract) => (
                                            <div
                                                key={contract.id}
                                                className="flex items-center justify-between py-4 px-1 cursor-pointer group"
                                                onClick={() => navigate(`/contracts/${contract.id}`)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--dash-raised)' }}>
                                                        <Briefcase className="w-4 h-4" style={{ color: 'var(--workspace-primary)' }} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                                                            {contract.title}
                                                        </p>
                                                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                                            {contract.client?.full_name ?? tx('dashboard.freelancer.clientFallback', undefined, 'Client')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                                    <Badge variant={contract.status === 'active' ? 'success' : 'warning'}>{tx(`status.${contract.status}`, undefined, contract.status)}</Badge>
                                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--workspace-primary)' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </DashWidget>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <DashWidget title={tx('dashboard.freelancer.recentProposals', undefined, 'Recent Proposals')} icon={<FileText className="w-4 h-4" />} action={{ label: tx('dashboard.freelancer.viewAll', undefined, 'View all'), onClick: () => navigate('/my-proposals') }}>
                                {isLoading ? (
                                    <SkeletonCard />
                                ) : recentProposals.length === 0 ? (
                                    <EmptyState
                                        icon={FileText}
                                        title={tx('dashboard.freelancer.noProposalsYet', undefined, 'No proposals yet')}
                                        description={tx('dashboard.freelancer.browseAndSendProposal', undefined, 'Browse open jobs and send your first proposal')}
                                        action={{ label: tx('dashboard.freelancer.browseJobs', undefined, 'Browse Jobs'), onClick: () => navigate('/jobs') }}
                                    />
                                ) : (
                                    <div className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
                                        {recentProposals.slice(0, 4).map((proposal) => (
                                            <div key={proposal.id} className="flex items-center justify-between py-4 px-1">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                                        {proposal.job?.title ?? tx('dashboard.freelancer.untitledJob', undefined, 'Untitled job')}
                                                    </p>
                                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                        {formatCurrency(proposal.bid_amount ?? 0, true, language)} · {new Date(proposal.created_at).toLocaleDateString(locale)}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        proposal.status === 'accepted'
                                                            ? 'success'
                                                            : proposal.status === 'rejected'
                                                                ? 'danger'
                                                                : proposal.status === 'pending'
                                                                    ? 'warning'
                                                                    : 'default'
                                                    }
                                                >
                                                    {tx(`status.${proposal.status}`, undefined, proposal.status)}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </DashWidget>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <DashWidget title={tx('dashboard.freelancer.matchedForYou', undefined, 'Matched for You')} icon={<Target className="w-4 h-4" />} action={{ label: tx('dashboard.freelancer.seeAllJobs', undefined, 'See all jobs'), onClick: () => navigate('/jobs') }}>
                                {isLoadingJobs ? (
                                    <SkeletonCard />
                                ) : jobs.length === 0 ? (
                                    <EmptyState
                                        icon={Target}
                                        title={tx('dashboard.freelancer.noMatchesYet', undefined, 'No matches yet')}
                                        description={tx('dashboard.freelancer.addSkillsToMatch', undefined, 'Add skills to your profile to get matched jobs')}
                                        action={{ label: tx('dashboard.freelancer.updateProfile', undefined, 'Update Profile'), onClick: () => navigate('/settings') }}
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
                                                        {job.budget_min ?? 0}–{job.budget_max ?? 0} TND · {tx(`categories.${job.category}`, undefined, job.category ?? 'General')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                                    <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: 'var(--workspace-primary)', color: '#fff', opacity: 0.9 }}>
                                                        {tx('dashboard.freelancer.apply', undefined, 'Apply')}
                                                    </span>
                                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--workspace-primary)' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </DashWidget>
                        </motion.div>
                    </motion.div>

                    <motion.div className="space-y-5" variants={containerVariants} initial="hidden" animate="show">
                        <motion.div variants={itemVariants}>
                            <DashWidget title={tx('dashboard.freelancer.profileStrength', undefined, 'Profile Strength')} icon={<User className="w-4 h-4" />}>
                                <div className="flex flex-col items-center py-2">
                                    <ProfileRing value={profileCompletion} />
                                    <div className="w-full mt-5 space-y-2">
                                        {checklist.map((item) => (
                                            <div key={item.label} className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: item.done ? 'var(--workspace-primary)' : 'var(--dash-border)' }}>
                                                    {item.done && <Check className="w-2.5 h-2.5 text-white" />}
                                                </div>
                                                <span className="text-sm" style={{ color: item.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                    {item.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </DashWidget>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <DashWidget title={tx('dashboard.freelancer.thisMonth', undefined, 'This Month')} icon={<DollarSign className="w-4 h-4" />}>
                                <div>
                                    <p className="font-display font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>
                                        {formatCurrency(statsData.monthlyEarnings, true, language)}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {statsData.monthlyEarnings >= statsData.lastMonthEarnings ? (
                                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                                        )}
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {tx('dashboard.freelancer.vsLastMonth', undefined, 'vs last month')}
                                        </span>
                                    </div>
                                    <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigate('/wallet')}>
                                        {tx('dashboard.freelancer.viewWallet', undefined, 'View Wallet')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                </div>
                            </DashWidget>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <DashWidget title={tx('dashboard.freelancer.quickActions', undefined, 'Quick Actions')} icon={<Settings className="w-4 h-4" />}>
                                <div className="space-y-2">
                                    {[
                                        { label: tx('dashboard.freelancer.browseJobs', undefined, 'Browse Jobs'), icon: Search, path: '/jobs' },
                                        { label: tx('nav.myProposals', undefined, 'My Proposals'), icon: FileText, path: '/my-proposals' },
                                        { label: tx('nav.portfolio', undefined, 'Portfolio'), icon: Briefcase, path: '/portfolio' },
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

export default FreelancerDashboardPage;
