import { useMemo } from 'react';
import type { ElementType, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Activity,
    ArrowUpRight,
    Bell,
    Briefcase,
    Calendar,
    Clock3,
    DollarSign,
    Eye,
    FileText,
    FolderKanban,
    Send,
    Sparkles,
    Wallet,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Header } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import ProfileCompletionCard from '../components/freelancer/ProfileCompletionCard';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/common/SkeletonCard';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currencyUtils';

type DashboardNotification = {
    id: string;
    title: string | null;
    content: string | null;
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

function DashboardPanel({ className = '', children }: { className?: string; children: ReactNode }) {
    return (
        <section className={cn(
            'rounded-lg p-6 border',
            'bg-card',
            'border-border',
            'shadow-sm dark:shadow-none',
            className
        )}>
            {children}
        </section>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
    detail,
    isLoading,
    accent = false,
}: {
    icon: ElementType;
    label: string;
    value: string | number;
    detail: string;
    isLoading?: boolean;
    accent?: boolean;
}) {
    return (
        <div className={cn(
            'rounded-xl p-5 border-2',
            'bg-card',
            'border-border/50',
            'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-none',
            accent && 'border-t-4 border-t-[color:var(--workspace-primary)]'
        )}>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-11 w-11 rounded-lg" />
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-4 w-24" />
                </div>
            ) : (
                <>
                    <Icon className="w-8 h-8 text-[color:var(--workspace-primary)] opacity-70 mb-3" />
                    <div className="text-4xl font-black text-[color:var(--workspace-primary)] leading-none my-2">{value}</div>
                    <div className="text-sm font-semibold text-[var(--text-secondary)]">{label}</div>
                    <div className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2 mt-1">{detail}</div>
                </>
            )}
        </div>
    );
}

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <div className="flex items-center justify-center">
                <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{description}</p>
        </div>
    );
}

function FreelancerDashboardPage() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const { language, tx } = useTranslation();

    const locale = useMemo(() => {
        if (language === 'ar') return 'ar-TN';
        if (language === 'fr') return 'fr-FR';
        return 'en-US';
    }, [language]);

    const greeting = useMemo(
        () => profile?.full_name?.split(' ')[0] || tx('pages.freelancerDashboard.greetingFallback', undefined, 'there'),
        [profile?.full_name, tx]
    );

    const { data: stats, isLoading } = useQuery({
        queryKey: ['freelancerDashboardStats', profile?.id],
        enabled: !!profile?.id,
        queryFn: async (): Promise<DashboardStats> => {
            const userId = profile!.id;

            const [contractsCountRes, contractRowsRes, proposalsRes, walletRes, viewsRes, notificationsRes, recentProposalsRes, activeContractsListRes] = await Promise.all([
                supabase.from('contracts').select('id', { count: 'exact', head: true })
                    .eq('freelancer_id', userId)
                    .eq('status', 'active'),
                supabase.from('contracts').select('id')
                    .eq('freelancer_id', userId)
                    .eq('status', 'active'),
                supabase.from('proposals').select('id', { count: 'exact', head: true })
                    .eq('freelancer_id', userId)
                    .eq('status', 'pending'),
                supabase.from('wallets').select('balance,pending_balance,total_earned').eq('user_id', userId).maybeSingle(),
                supabase.from('freelancer_profiles').select('profile_views,title,connects_balance').eq('id', userId).maybeSingle(),
                supabase.from('notifications').select('id,title,content,type,created_at')
                    .eq('user_id', userId)
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

            const contractIds = (contractRowsRes.data ?? []).map((contract) => contract.id);

            const milestonesRes = contractIds.length > 0
                ? await supabase.from('milestones')
                    .select('id,description,due_date,amount,status,contract_id')
                    .in('contract_id', contractIds)
                    .eq('status', 'pending')
                    .order('due_date', { ascending: true })
                    .limit(4)
                : { data: [] as DashboardMilestone[] };

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

            return months.map(({ key, ...item }) => item);
        },
        staleTime: 300_000,
    });

    const totalChartEarnings = useMemo(
        () => chartData.reduce((sum, item) => sum + item.earnings, 0),
        [chartData]
    );

    const bestMonth = useMemo(
        () => chartData.reduce<{ month: string; earnings: number } | null>((best, item) => {
            if (!best || item.earnings > best.earnings) return item;
            return best;
        }, null),
        [chartData]
    );

    const unreadCount = stats?.notifications.length ?? 0;
    const nextMilestone = stats?.milestones[0] ?? null;
    const latestNotification = stats?.notifications[0] ?? null;
    const notifications = stats?.notifications ?? [];
    const milestones = stats?.milestones ?? [];
    const recentProposals = stats?.recentProposals ?? [];
    const activeContractsList = stats?.activeContractsList ?? [];

    const metricCards = [
        {
            label: tx('pages.freelancerDashboard.stat.activeContracts', undefined, 'Active contracts'),
            value: stats?.activeContracts ?? 0,
            detail: tx('pages.freelancerDashboard.metric.activeContractsDetail', undefined, 'Projects currently moving with approved scope and funded escrow.'),
            icon: Briefcase,
            accent: true,
        },
        {
            label: tx('pages.freelancerDashboard.stat.pendingProposals', undefined, 'Pending proposals'),
            value: stats?.pendingProposals ?? 0,
            detail: tx('pages.freelancerDashboard.metric.pendingProposalsDetail', undefined, 'Applications waiting on a client response or next decision.'),
            icon: Send,
            accent: false,
        },
        {
            label: tx('pages.freelancerDashboard.stat.totalEarnings', undefined, 'Total earnings'),
            value: formatCurrency(stats?.totalEarnings ?? 0),
            detail: tx('pages.freelancerDashboard.metric.totalEarningsDetail', undefined, 'Released escrow payments collected across your completed work.'),
            icon: DollarSign,
            accent: true,
        },
        {
            label: tx('pages.freelancerDashboard.stat.profileViews', undefined, 'Profile views'),
            value: (stats?.profileViews ?? 0).toLocaleString(locale),
            detail: tx('pages.freelancerDashboard.metric.profileViewsDetail', undefined, 'How often clients opened your profile recently.'),
            icon: Eye,
            accent: false,
        },
    ];

    const notificationIcons: Record<string, typeof Bell> = {
        new_proposal: Sparkles,
        message: Bell,
        milestone: Calendar,
        payment: DollarSign,
    };

    return (
        <div className="page-shell bg-background">
            <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
            <Header />

            <main className="page-shell-content space-y-6">
                <section className="relative radius-shell overflow-hidden border border-primary-200/40 p-6 shadow-[0_32px_90px_-48px_rgba(109,40,217,0.34)] dark:border-white/10 sm:p-8" style={{
                    background: 'radial-gradient(circle at top left, rgba(139,92,246,0.14), transparent 34%), radial-gradient(circle at top right, rgba(245,158,11,0.06), transparent 26%), linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,239,255,0.92))'
                }}>
                    <div className="hidden dark:block absolute inset-0 pointer-events-none" style={{
                        background: 'radial-gradient(circle at top left, rgba(167,139,250,0.18), transparent 34%), radial-gradient(circle at top right, rgba(245,158,11,0.08), transparent 24%), linear-gradient(145deg,rgba(19,16,31,0.98),rgba(11,10,18,0.98))'
                    }}></div>
                    <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-l-2 border-l-[color:var(--workspace-primary)] pl-2">
                                <Sparkles className="h-3.5 w-3.5 text-[color:var(--workspace-primary)]" />
                                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                                    {tx('pages.freelancerDashboard.commandCenter', undefined, 'Freelancer command center')}
                                </p>
                            </div>

                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                <div className="max-w-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-bold text-white ring-2 ring-white/80 dark:ring-white/10" style={{ background: 'linear-gradient(145deg, var(--workspace-primary-mid) 0%, var(--workspace-primary) 55%, var(--workspace-primary-hover) 100%)', boxShadow: '0 26px 52px -30px color-mix(in srgb, var(--workspace-primary) 90%, transparent)' }}>
                                            {profile?.avatar_url ? (
                                                <img src={profile.avatar_url} alt={greeting} className="block h-full w-full object-cover object-center" />
                                            ) : (
                                                greeting.slice(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                                                {tx('pages.freelancerDashboard.welcomeBack', undefined, 'Welcome back')}
                                            </p>
                                            <h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--text-primary)] leading-tight sm:text-4xl">
                                                {tx('pages.freelancerDashboard.heroGreeting', { name: greeting }, `Welcome back, ${greeting}`)}
                                            </h1>
                                            <p className="mt-2 text-sm font-semibold text-[color:var(--workspace-primary)]">
                                                {stats?.freelancerTitle || tx('pages.freelancerDashboard.defaultTitle', undefined, 'Independent professional')}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-5 max-w-[380px] text-sm leading-7 text-[var(--text-secondary)]">
                                        {tx('pages.freelancerDashboard.welcomeDescription', undefined, 'Your freelancer business is looking sharper. Keep momentum high, finish the right profile steps, and stay visible to better-fit clients.')}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:min-w-[240px]">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                                        {tx('pages.freelancerDashboard.focusLabel', undefined, 'Today focus')}
                                    </p>
                                    <p className="mt-3 text-base font-semibold text-[var(--text-primary)]">
                                        {nextMilestone
                                            ? tx('pages.freelancerDashboard.focusMilestone', undefined, 'Prepare your next milestone handoff')
                                            : unreadCount > 0
                                                ? tx('pages.freelancerDashboard.focusNotifications', undefined, 'Clear your unread updates and keep leads warm')
                                                : tx('pages.freelancerDashboard.focusProfile', undefined, 'Polish your profile to raise conversion')}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                        {nextMilestone
                                            ? (nextMilestone.description || tx('pages.freelancerDashboard.noUpcomingMilestones', undefined, 'No upcoming milestones'))
                                            : latestNotification?.content || tx('pages.freelancerDashboard.focusDefaultDescription', undefined, 'You are in a quiet window. Improve the profile and keep proposals active so the next opportunity lands stronger.')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <div className="summary-chip">
                                    <Activity className="summary-chip-icon" />
                                    <span className="summary-chip-value">{stats?.connectsBalance ?? 0}</span>
                                    <span className="summary-chip-label">{tx('pages.freelancerDashboard.pipeline.connects', undefined, 'connects available')}</span>
                                </div>
                                <div className="summary-chip">
                                    <Send className="summary-chip-icon" />
                                    <span className="summary-chip-value">{stats?.pendingProposals ?? 0}</span>
                                    <span className="summary-chip-label">{tx('pages.freelancerDashboard.pipeline.pendingProposals', undefined, 'pending proposals')}</span>
                                </div>
                                <div className="summary-chip">
                                    <Bell className="summary-chip-icon" />
                                    <span className="summary-chip-value">{unreadCount}</span>
                                    <span className="summary-chip-label">{tx('pages.freelancerDashboard.pipeline.unreadUpdates', undefined, 'unread updates')}</span>
                                </div>
                                <div className="summary-chip">
                                    <Wallet className="summary-chip-icon" />
                                    <span className="summary-chip-value">{formatCurrency(stats?.walletBalance ?? 0)}</span>
                                    <span className="summary-chip-label">{tx('pages.freelancerDashboard.pipeline.availableBalance', undefined, 'available balance')}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button size="lg" className="rounded-2xl px-5" leftIcon={<Briefcase className="h-4 w-4" />} onClick={() => navigate('/jobs')}>
                                    {tx('pages.freelancerDashboard.browseJobs', undefined, 'Find work')}
                                </Button>
                                <Button variant="outline" size="lg" className="rounded-2xl px-5" leftIcon={<FolderKanban className="h-4 w-4" />} onClick={() => navigate('/freelancer/portfolio')}>
                                    {tx('pages.freelancerDashboard.portfolioAction', undefined, 'Open portfolio')}
                                </Button>
                                <Button variant="ghost" size="lg" className="rounded-2xl px-5" leftIcon={<FileText className="h-4 w-4" />} onClick={() => navigate('/settings?tab=profile')}>
                                    {tx('pages.freelancerDashboard.profileSettings', undefined, 'Edit profile')}
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {metricCards.map((card) => (
                                <MetricCard key={card.label} {...card} isLoading={isLoading} />
                            ))}
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
                    <div className="space-y-6">
                        <DashboardPanel>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 border-l-2 border-l-[color:var(--workspace-primary)] pl-2 mb-3">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                            {tx('pages.freelancerDashboard.performanceBadge', undefined, 'Performance pulse')}
                                        </p>
                                    </div>
                                    <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                                        {tx('pages.freelancerDashboard.earningsTrajectory', undefined, 'Earnings trajectory')}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                        {tx('pages.freelancerDashboard.earningsDescription', undefined, 'Released escrow payments across the last six months, grouped to show momentum at a glance.')}
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:min-w-[240px]">
                                    <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8aa0]">
                                            {tx('pages.freelancerDashboard.sixMonthTrend', undefined, '6 month trend')}
                                        </p>
                                        <p className="mt-2 text-xl font-semibold text-[#171420] dark:text-white">
                                            {formatCurrency(totalChartEarnings)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-border/50 bg-card px-4 py-3">
                                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8aa0]">
                                            {tx('pages.freelancerDashboard.bestMonth', undefined, 'Strongest month')}
                                        </p>
                                        <p className="mt-2 text-sm font-semibold text-[#171420] dark:text-white">
                                            {bestMonth && bestMonth.earnings > 0
                                                ? `${bestMonth.month} · ${formatCurrency(bestMonth.earnings)}`
                                                : tx('pages.freelancerDashboard.noEarningsData', undefined, 'No earnings data yet')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 h-[320px]">
                                {chartData.every((item) => item.earnings === 0) ? (
                                    <EmptyState
                                        icon={DollarSign}
                                        title={tx('pages.freelancerDashboard.noEarningsData', undefined, 'No earnings data yet')}
                                        description={tx('pages.freelancerDashboard.noEarningsDescription', undefined, 'Once contracts start releasing escrow, your earnings trend will appear here with a cleaner monthly view.')}
                                    />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.12)" vertical={false} />
                                            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#8b8aa0', fontSize: 12 }} />
                                            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8b8aa0', fontSize: 12 }} tickFormatter={(value) => `${Number(value).toLocaleString(locale)}`} width={72} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: 18, border: '1px solid rgba(139,92,246,0.14)', background: 'rgba(17,14,28,0.92)', color: '#fff' }}
                                                formatter={(value) => [formatCurrency(Number(value ?? 0)), tx('pages.freelancerDashboard.earnings', undefined, 'Earnings')]}
                                            />
                                            <Area type="monotone" dataKey="earnings" stroke="#8b5cf6" strokeWidth={3} fill="url(#earningsFill)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </DashboardPanel>

                        {/* Recent Proposals */}
                        <DashboardPanel>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 border-l-2 border-l-[color:var(--workspace-primary)] pl-2 mb-3">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                            {tx('pages.freelancerDashboard.proposalsBadge', undefined, 'Proposals')}
                                        </p>
                                    </div>
                                    <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                                        {tx('pages.freelancerDashboard.recentProposals', undefined, 'Recent proposals')}
                                    </h2>
                                </div>
                                <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => navigate('/my-proposals')}>
                                    {tx('pages.freelancerDashboard.viewAllProposals', undefined, 'View all')}
                                </Button>
                            </div>
                            <div className="mt-5 space-y-3">
                                {isLoading ? (
                                    [1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-2xl" />)
                                ) : recentProposals.length === 0 ? (
                                    <EmptyState
                                        icon={Send}
                                        title={tx('pages.freelancerDashboard.noProposals', undefined, 'No proposals yet')}
                                        description={tx('pages.freelancerDashboard.noProposalsDescription', undefined, 'Browse the job board and submit your first proposal to get started.')}
                                    />
                                ) : (
                                    recentProposals.map((proposal) => {
                                        const statusStyles: Record<string, string> = {
                                            pending: 'bg-amber-500/12 text-amber-700 dark:text-amber-200',
                                            accepted: 'bg-green-500/12 text-green-700 dark:text-green-200',
                                            rejected: 'bg-red-500/12 text-red-700 dark:text-red-200',
                                            withdrawn: 'bg-gray-500/12 text-gray-700 dark:text-gray-300',
                                        };
                                        return (
                                            <div
                                                key={proposal.id}
                                                onClick={() => proposal.job?.id && navigate(`/jobs/${proposal.job.id}`)}
                                                className="rounded-[1.4rem] border border-border/50 bg-card p-4 cursor-pointer hover:border-[color:var(--workspace-primary)]/30 transition-colors"
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if ((e.key === 'Enter' || e.key === ' ') && proposal.job?.id) navigate(`/jobs/${proposal.job.id}`);
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-[#171420] dark:text-white truncate">
                                                            {proposal.job?.title || tx('pages.freelancerDashboard.untitledJob', undefined, 'Untitled job')}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#7a768e] dark:text-[#8b8aa0]">
                                                            <span className="inline-flex items-center gap-1">
                                                                <DollarSign className="h-3.5 w-3.5" />
                                                                {formatCurrency(proposal.bid_amount)}
                                                            </span>
                                                            <span>
                                                                {new Date(proposal.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${statusStyles[proposal.status] || statusStyles.pending}`}>
                                                        {proposal.status}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </DashboardPanel>

                        {/* Active Contracts */}
                        <DashboardPanel>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 border-l-2 border-l-[color:var(--workspace-primary)] pl-2 mb-3">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                            {tx('pages.freelancerDashboard.contractsBadge', undefined, 'Active work')}
                                        </p>
                                    </div>
                                    <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                                        {tx('pages.freelancerDashboard.activeContracts', undefined, 'Active contracts')}
                                    </h2>
                                </div>
                                <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => navigate('/contracts')}>
                                    {tx('pages.freelancerDashboard.viewAllContracts', undefined, 'View all')}
                                </Button>
                            </div>
                            <div className="mt-5 space-y-3">
                                {isLoading ? (
                                    [1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-2xl" />)
                                ) : activeContractsList.length === 0 ? (
                                    <EmptyState
                                        icon={Briefcase}
                                        title={tx('pages.freelancerDashboard.noActiveContracts', undefined, 'No active contracts')}
                                        description={tx('pages.freelancerDashboard.noActiveContractsDescription', undefined, 'Once a client accepts your proposal and the escrow is funded, your active contracts will appear here.')}
                                    />
                                ) : (
                                    activeContractsList.map((contract) => (
                                        <div
                                            key={contract.id}
                                            onClick={() => navigate(`/contracts/${contract.id}`)}
                                            className="rounded-[1.4rem] border border-border/50 bg-card p-4 cursor-pointer hover:border-[color:var(--workspace-primary)]/30 transition-colors"
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') navigate(`/contracts/${contract.id}`);
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-[#171420] dark:text-white truncate">
                                                        {contract.title || tx('pages.freelancerDashboard.untitledContract', undefined, 'Untitled contract')}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#7a768e] dark:text-[#8b8aa0]">
                                                        {contract.client?.full_name && (
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                                                                    {contract.client.full_name.charAt(0)}
                                                                </div>
                                                                {contract.client.full_name}
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center gap-1">
                                                            <Wallet className="h-3.5 w-3.5" />
                                                            {formatCurrency(contract.total_amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="inline-flex items-center rounded-full bg-green-500/12 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-200 shrink-0">
                                                    {tx('pages.freelancerDashboard.activeBadge', undefined, 'Active')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </DashboardPanel>

                        <DashboardPanel>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 border-l-2 border-l-[color:var(--workspace-primary)] pl-2 mb-3">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                            {tx('pages.freelancerDashboard.activityBadge', undefined, 'Live feed')}
                                        </p>
                                    </div>
                                    <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                                        {tx('pages.freelancerDashboard.recentActivity', undefined, 'Recent activity')}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        {tx('pages.freelancerDashboard.recentActivityDescription', undefined, 'Your latest notifications, proposal events, and system updates in one timeline.')}
                                    </p>
                                </div>

                                <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => navigate('/notifications')}>
                                    {tx('pages.freelancerDashboard.viewAllUpdates', undefined, 'View all')}
                                </Button>
                            </div>

                            <div className="mt-6 space-y-4">
                                {isLoading ? (
                                    [1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-2xl" />)
                                ) : notifications.length === 0 ? (
                                    <EmptyState
                                        icon={Activity}
                                        title={tx('pages.freelancerDashboard.noRecentActivity', undefined, 'No recent activity')}
                                        description={tx('pages.freelancerDashboard.noRecentActivityDescription', undefined, 'Once proposals, client replies, or payment events start landing, they will appear here in chronological order.')}
                                    />
                                ) : (
                                    notifications.map((notification, index) => {
                                        const Icon = notificationIcons[notification.type] || Bell;

                                        return (
                                            <div key={notification.id} className="relative flex gap-4 rounded-[1.6rem] border border-border/50 bg-card p-4">
                                                {index !== notifications.length - 1 ? (
                                                    <div className="absolute bottom-[-18px] left-[31px] top-[52px] w-px bg-border" />
                                                ) : null}
                                                <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface text-brand">
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <p className="text-sm font-semibold text-[#171420] dark:text-white">
                                                            {notification.title || tx('pages.freelancerDashboard.defaultNotificationTitle', undefined, 'Platform update')}
                                                        </p>
                                                        <span className="text-xs font-medium text-[#8b8aa0]">
                                                            {new Date(notification.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm leading-6 text-[#5e5b72] dark:text-[#aca9bd]">
                                                        {notification.content || tx('pages.freelancerDashboard.defaultNotificationBody', undefined, 'No extra details for this notification yet.')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </DashboardPanel>
                    </div>

                    <div className="space-y-6">
                        <ProfileCompletionCard maxStepsToShow={3} />

                        <DashboardPanel>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 border-l-2 border-l-[color:var(--workspace-primary)] pl-2 mb-3">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                            {tx('pages.freelancerDashboard.deliveryBadge', undefined, 'Delivery queue')}
                                        </p>
                                    </div>
                                    <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                                        {tx('pages.freelancerDashboard.upcomingMilestones', undefined, 'Upcoming milestones')}
                                    </h2>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-brand">
                                    <Calendar className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                {isLoading ? (
                                    [1, 2, 3].map((item) => <Skeleton key={item} className="h-24 rounded-2xl" />)
                                ) : milestones.length === 0 ? (
                                    <EmptyState
                                        icon={Calendar}
                                        title={tx('pages.freelancerDashboard.noUpcomingMilestones', undefined, 'No upcoming milestones')}
                                        description={tx('pages.freelancerDashboard.noUpcomingMilestonesDescription', undefined, 'As soon as active contracts include pending milestones, they will show up here with dates and payout value.')}
                                    />
                                ) : (
                                    milestones.map((milestone) => (
                                        <div key={milestone.id} className="rounded-[1.4rem] border border-border/50 bg-card p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-[#171420] dark:text-white">{milestone.description}</p>
                                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#7a768e] dark:text-[#8b8aa0]">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Clock3 className="h-3.5 w-3.5" />
                                                            {milestone.due_date
                                                                ? new Date(milestone.due_date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
                                                                : tx('pages.freelancerDashboard.noDueDate', undefined, 'No due date')}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Wallet className="h-3.5 w-3.5" />
                                                            {formatCurrency(milestone.amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/12 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-200">
                                                    {tx('pages.freelancerDashboard.pendingBadge', undefined, 'Pending')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </DashboardPanel>

                        <DashboardPanel>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 border-l-2 border-l-[color:var(--workspace-primary)] pl-2 mb-3">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                            {tx('pages.freelancerDashboard.inboxBadge', undefined, 'Inbox pulse')}
                                        </p>
                                    </div>
                                    <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                                        {tx('pages.freelancerDashboard.notificationsSummary', undefined, 'Notifications snapshot')}
                                    </h2>
                                </div>
                                <span className="inline-flex min-w-[44px] items-center justify-center rounded-2xl bg-primary-600 px-3 py-2 text-sm font-bold text-white shadow-[0_18px_36px_-20px_rgba(109,40,217,0.9)]">
                                    {unreadCount}
                                </span>
                            </div>

                            <div className="mt-5 rounded-[1.5rem] border border-border/50 bg-card p-4">
                                <p className="text-sm font-semibold text-[#171420] dark:text-white">
                                    {unreadCount > 0
                                        ? tx('pages.freelancerDashboard.unreadSummary', { count: unreadCount }, `${unreadCount} unread updates need your attention`)
                                        : tx('pages.freelancerDashboard.allCaughtUp', undefined, 'All caught up!')}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                                    {latestNotification?.content
                                        || tx('pages.freelancerDashboard.inboxDescription', undefined, 'You are clear for now. When new proposals, messages, or payment events arrive, they will surface here first.')}
                                </p>
                            </div>

                            <Button variant="outline" className="mt-4 w-full justify-between rounded-2xl" rightIcon={<ArrowUpRight className="h-4 w-4" />} onClick={() => navigate('/notifications')}>
                                {tx('pages.freelancerDashboard.openNotifications', undefined, 'Open notifications')}
                            </Button>
                        </DashboardPanel>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default FreelancerDashboardPage;
