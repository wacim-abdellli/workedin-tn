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
};

function DashboardPanel({ className = '', children }: { className?: string; children: ReactNode }) {
    return (
        <section className={cn(
            'rounded-lg p-6 border',
            'bg-white dark:bg-[#1a1825]',
            'border-gray-100 dark:border-white/6',
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
    tone,
    isLoading,
}: {
    icon: ElementType;
    label: string;
    value: string | number;
    detail: string;
    tone: string;
    isLoading?: boolean;
}) {
    return (
        <div className={cn(
            'rounded-lg p-5 border',
            'bg-white dark:bg-[#1a1825]',
            'border-gray-100 dark:border-white/6',
            'shadow-sm dark:shadow-none'
        )}>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-11 w-11 rounded-lg" />
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-4 w-24" />
                </div>
            ) : (
                <>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${tone}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</div>
                    <div className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-400">{detail}</div>
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
        <div className="flex flex-col items-start rounded-[1.6rem] border border-dashed border-primary-200/70 bg-primary-50/45 p-5 text-left dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm dark:bg-white/10 dark:text-primary-300">
                <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-[#1a1825] dark:text-white">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">{description}</p>
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

            const [contractsCountRes, contractRowsRes, proposalsRes, walletRes, viewsRes, notificationsRes] = await Promise.all([
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

    const metricCards = [
        {
            label: tx('pages.freelancerDashboard.stat.activeContracts', undefined, 'Active contracts'),
            value: stats?.activeContracts ?? 0,
            detail: tx('pages.freelancerDashboard.metric.activeContractsDetail', undefined, 'Projects currently moving with approved scope and funded escrow.'),
            icon: Briefcase,
            tone: 'from-primary-500/20 to-primary-500/5 text-primary-600 dark:text-primary-300',
        },
        {
            label: tx('pages.freelancerDashboard.stat.pendingProposals', undefined, 'Pending proposals'),
            value: stats?.pendingProposals ?? 0,
            detail: tx('pages.freelancerDashboard.metric.pendingProposalsDetail', undefined, 'Applications waiting on a client response or next decision.'),
            icon: Send,
            tone: 'from-amber-400/20 to-amber-400/5 text-amber-600 dark:text-amber-300',
        },
        {
            label: tx('pages.freelancerDashboard.stat.totalEarnings', undefined, 'Total earnings'),
            value: formatCurrency(stats?.totalEarnings ?? 0),
            detail: tx('pages.freelancerDashboard.metric.totalEarningsDetail', undefined, 'Released escrow payments collected across your completed work.'),
            icon: DollarSign,
            tone: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-300',
        },
        {
            label: tx('pages.freelancerDashboard.stat.profileViews', undefined, 'Profile views'),
            value: (stats?.profileViews ?? 0).toLocaleString(locale),
            detail: tx('pages.freelancerDashboard.metric.profileViewsDetail', undefined, 'How often clients opened your profile recently.'),
            icon: Eye,
            tone: 'from-sky-500/20 to-sky-500/5 text-sky-600 dark:text-sky-300',
        },
    ];

    const notificationIcons: Record<string, typeof Bell> = {
        new_proposal: Sparkles,
        message: Bell,
        milestone: Calendar,
        payment: DollarSign,
    };

    return (
        <div className="page-shell bg-[#f6f3ff] dark:bg-[#0b0a12]">
            <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
            <Header />

            <main className="page-shell-content space-y-6">
                <section className="radius-shell overflow-hidden border border-primary-200/40 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,239,255,0.92))] p-6 shadow-[0_32px_90px_-48px_rgba(76,29,149,0.38)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.24),transparent_30%),linear-gradient(145deg,rgba(19,16,31,0.98),rgba(11,10,18,0.98))] sm:p-8">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-primary-200">
                                <Sparkles className="h-3.5 w-3.5" />
                                {tx('pages.freelancerDashboard.commandCenter', undefined, 'Freelancer command center')}
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
                                            <p className="text-sm font-medium text-[#6b6880] dark:text-[#8b8aa0]">
                                                {tx('pages.freelancerDashboard.welcomeBack', undefined, 'Welcome back')}
                                            </p>
                                            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#171420] dark:text-white sm:text-4xl">
                                                {tx('pages.freelancerDashboard.heroGreeting', { name: greeting }, `Welcome back, ${greeting}`)}
                                            </h1>
                                            <p className="mt-2 text-sm font-medium text-primary-700 dark:text-primary-200">
                                                {stats?.freelancerTitle || tx('pages.freelancerDashboard.defaultTitle', undefined, 'Independent professional')}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-5 max-w-2xl text-sm leading-7 text-[#5c5971] dark:text-[#aca9bd] sm:text-base">
                                        {tx('pages.freelancerDashboard.welcomeDescription', undefined, 'Your freelancer business is looking sharper. Keep momentum high, finish the right profile steps, and stay visible to better-fit clients.')}
                                    </p>
                                </div>

                                <div className="rounded-[1.6rem] border border-primary-100 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:min-w-[240px]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b8aa0]">
                                        {tx('pages.freelancerDashboard.focusLabel', undefined, 'Today focus')}
                                    </p>
                                    <p className="mt-3 text-base font-semibold text-[#171420] dark:text-white">
                                        {nextMilestone
                                            ? tx('pages.freelancerDashboard.focusMilestone', undefined, 'Prepare your next milestone handoff')
                                            : unreadCount > 0
                                                ? tx('pages.freelancerDashboard.focusNotifications', undefined, 'Clear your unread updates and keep leads warm')
                                                : tx('pages.freelancerDashboard.focusProfile', undefined, 'Polish your profile to raise conversion')}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                                        {nextMilestone
                                            ? (nextMilestone.description || tx('pages.freelancerDashboard.noUpcomingMilestones', undefined, 'No upcoming milestones'))
                                            : latestNotification?.content || tx('pages.freelancerDashboard.focusDefaultDescription', undefined, 'You are in a quiet window. Improve the profile and keep proposals active so the next opportunity lands stronger.')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-4 py-2 text-sm text-[#353149] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#e3def7]">                                        <Activity className="h-4 w-4 text-purple-500" />
                                        <span className="font-bold">{stats?.connectsBalance ?? 0}</span>
                                        <span className="text-[#7a768e] dark:text-[#8b8aa0]">{tx('pages.freelancerDashboard.pipeline.connects', undefined, 'connects available')}</span>
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-4 py-2 text-sm text-[#353149] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#e3def7]">                                    <Send className="h-4 w-4 text-amber-500" />
                                    <span>{stats?.pendingProposals ?? 0}</span>
                                    <span className="text-[#7a768e] dark:text-[#8b8aa0]">{tx('pages.freelancerDashboard.pipeline.pendingProposals', undefined, 'pending proposals')}</span>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-4 py-2 text-sm text-[#353149] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#e3def7]">
                                    <Bell className="h-4 w-4 text-primary-500" />
                                    <span>{unreadCount}</span>
                                    <span className="text-[#7a768e] dark:text-[#8b8aa0]">{tx('pages.freelancerDashboard.pipeline.unreadUpdates', undefined, 'unread updates')}</span>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-4 py-2 text-sm text-[#353149] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#e3def7]">
                                    <Wallet className="h-4 w-4 text-emerald-500" />
                                    <span>{formatCurrency(stats?.walletBalance ?? 0)}</span>
                                    <span className="text-[#7a768e] dark:text-[#8b8aa0]">{tx('pages.freelancerDashboard.pipeline.availableBalance', undefined, 'available balance')}</span>
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
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                                        {tx('pages.freelancerDashboard.performanceBadge', undefined, 'Performance pulse')}
                                    </p>
                                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#171420] dark:text-white">
                                        {tx('pages.freelancerDashboard.earningsTrajectory', undefined, 'Earnings trajectory')}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
                                        {tx('pages.freelancerDashboard.earningsDescription', undefined, 'Released escrow payments across the last six months, grouped to show momentum at a glance.')}
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:min-w-[240px]">
                                    <div className="rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8aa0]">
                                            {tx('pages.freelancerDashboard.sixMonthTrend', undefined, '6 month trend')}
                                        </p>
                                        <p className="mt-2 text-xl font-semibold text-[#171420] dark:text-white">
                                            {formatCurrency(totalChartEarnings)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-primary-100 bg-white/75 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
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

                        <DashboardPanel>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                                        {tx('pages.freelancerDashboard.activityBadge', undefined, 'Live feed')}
                                    </p>
                                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#171420] dark:text-white">
                                        {tx('pages.freelancerDashboard.recentActivity', undefined, 'Recent activity')}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[#8b8aa0]">
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
                                            <div key={notification.id} className="relative flex gap-4 rounded-[1.6rem] border border-primary-100/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                                {index !== notifications.length - 1 ? (
                                                    <div className="absolute bottom-[-18px] left-[31px] top-[52px] w-px bg-primary-100 dark:bg-white/10" />
                                                ) : null}
                                                <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/8 dark:text-primary-300">
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
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                                        {tx('pages.freelancerDashboard.deliveryBadge', undefined, 'Delivery queue')}
                                    </p>
                                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#171420] dark:text-white">
                                        {tx('pages.freelancerDashboard.upcomingMilestones', undefined, 'Upcoming milestones')}
                                    </h2>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/5 dark:text-primary-300">
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
                                        <div key={milestone.id} className="rounded-[1.4rem] border border-primary-100/70 bg-white/75 p-4 dark:border-white/10 dark:bg-white/[0.04]">
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
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                                        {tx('pages.freelancerDashboard.inboxBadge', undefined, 'Inbox pulse')}
                                    </p>
                                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#171420] dark:text-white">
                                        {tx('pages.freelancerDashboard.notificationsSummary', undefined, 'Notifications snapshot')}
                                    </h2>
                                </div>
                                <span className="inline-flex min-w-[44px] items-center justify-center rounded-2xl bg-primary-600 px-3 py-2 text-sm font-bold text-white shadow-[0_18px_36px_-20px_rgba(109,40,217,0.9)]">
                                    {unreadCount}
                                </span>
                            </div>

                            <div className="mt-5 rounded-[1.5rem] border border-primary-100/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
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
