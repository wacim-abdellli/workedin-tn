import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Activity, Bell, Briefcase, Calendar,
    DollarSign, Eye, FileText, Plus, Send, Sparkles,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Header } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import ProfileCompletionCard from '../components/freelancer/ProfileCompletionCard';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/common/SkeletonCard';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currencyUtils';

function FreelancerDashboardPage() {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t, tx } = useTranslation();

    useEffect(() => {
        const justSwitched = sessionStorage.getItem('workspace_switched');
        if (justSwitched !== 'freelancer') return;
        sessionStorage.removeItem('workspace_switched');
        showToast(t.auth.accountPanel.switchedFreelancer, 'success', 2000, { position: 'bottom-center' });
    }, [showToast, t.auth.accountPanel.switchedFreelancer]);

    const greeting = useMemo(() => profile?.full_name?.split(' ')[0] || tx('pages.freelancerDashboard.greetingFallback', undefined, 'there'), [profile?.full_name, tx]);

    // Fetch real stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ['freelancerDashboardStats', profile?.id],
        enabled: !!profile?.id,
        queryFn: async () => {
            const userId = profile!.id;

            const [contractsRes, proposalsRes, walletRes, viewsRes, notificationsRes, milestonesRes] = await Promise.all([
                supabase.from('contracts').select('id', { count: 'exact', head: true })
                    .eq('freelancer_id', userId).eq('status', 'active'),
                supabase.from('proposals').select('id', { count: 'exact', head: true })
                    .eq('freelancer_id', userId).eq('status', 'pending'),
                supabase.from('wallets').select('total_earned').eq('user_id', userId).maybeSingle(),
                supabase.from('freelancer_profiles').select('profile_views').eq('id', userId).maybeSingle(),
                supabase.from('notifications').select('id, type, content, created_at')
                    .eq('user_id', userId).eq('is_read', false).order('created_at', { ascending: false }).limit(3),
                supabase.from('milestones')
                    .select('id, description, due_date, amount, status, contract_id')
                    .eq('status', 'pending')
                    .order('due_date', { ascending: true })
                    .limit(3),
            ]);

            return {
                activeContracts: contractsRes.count ?? 0,
                pendingProposals: proposalsRes.count ?? 0,
                totalEarnings: walletRes.data?.total_earned ?? 0,
                profileViews: viewsRes.data?.profile_views ?? 0,
                notifications: notificationsRes.data ?? [],
                milestones: milestonesRes.data ?? [],
            };
        },
        staleTime: 60_000,
    });

    // Fetch earnings chart data (last 6 months from transactions)
    const { data: chartData = [] } = useQuery({
        queryKey: ['freelancerEarningsChart', profile?.id],
        enabled: !!profile?.id,
        queryFn: async () => {
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

            // Group by month
            const monthMap: Record<string, number> = {};
            (data || []).forEach((tx) => {
                const month = new Date(tx.created_at).toLocaleString('en', { month: 'short' });
                monthMap[month] = (monthMap[month] || 0) + (tx.amount || 0);
            });

            return Object.entries(monthMap).map(([month, earnings]) => ({ month, earnings }));
        },
        staleTime: 300_000,
    });

    const statCards = [
        { label: tx('pages.freelancerDashboard.stat.activeContracts', undefined, 'Active Contracts'), value: stats?.activeContracts ?? 0, icon: Briefcase, tone: 'from-primary-500/20 to-primary-500/5 text-primary-600 dark:text-primary-300' },
        { label: tx('pages.freelancerDashboard.stat.pendingProposals', undefined, 'Pending Proposals'), value: stats?.pendingProposals ?? 0, icon: Send, tone: 'from-amber-400/20 to-amber-400/5 text-amber-600 dark:text-amber-300' },
        { label: tx('pages.freelancerDashboard.stat.totalEarnings', undefined, 'Total Earnings'), value: formatCurrency(stats?.totalEarnings ?? 0), icon: DollarSign, tone: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-300' },
        { label: tx('pages.freelancerDashboard.stat.profileViews', undefined, 'Profile Views'), value: (stats?.profileViews ?? 0).toLocaleString(), icon: Eye, tone: 'from-sky-500/20 to-sky-500/5 text-sky-600 dark:text-sky-300' },
    ];

    const notificationIcons: Record<string, typeof Bell> = {
        new_proposal: Sparkles,
        message: Bell,
        milestone: Calendar,
        payment: DollarSign,
    };

    return (
        <div className="min-h-screen bg-[#f6f3ff] dark:bg-[#0b0a12]">
            <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
            <Header />

            <main className="container-custom py-8">
                <section className="glass-card overflow-hidden rounded-[32px] p-6 sm:p-8">
                    <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
                        {/* Left sidebar */}
                        <aside className="space-y-5">
                            <div className="premium-panel rounded-[28px] p-5">
                                <p className="text-sm font-medium text-[#6b6880] dark:text-[#8b8aa0]">{tx('pages.freelancerDashboard.welcomeBack', undefined, 'Welcome back')}</p>
                                <h1 className="mt-2 text-3xl font-bold text-[#1a1825] dark:text-white">{greeting}</h1>
                                <p className="mt-3 text-sm leading-relaxed text-[#6b6880] dark:text-[#8b8aa0]">
                                    {tx('pages.freelancerDashboard.welcomeDescription', undefined, 'Your freelancer business is looking sharper. Keep the momentum high and the profile polished.')}
                                </p>
                            </div>

                            <ProfileCompletionCard />

                            <div className="premium-panel rounded-[28px] p-5">
                                <div className="text-sm font-semibold text-[#1a1825] dark:text-white">{tx('pages.freelancerDashboard.quickActions', undefined, 'Quick actions')}</div>
                                <div className="mt-4 space-y-3">
                                    <Button className="w-full justify-start" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/jobs')}>
                                        {tx('pages.freelancerDashboard.browseJobs', undefined, 'Browse jobs')}
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" leftIcon={<FileText className="h-4 w-4" />} onClick={() => navigate('/settings')}>
                                        {tx('pages.freelancerDashboard.profileSettings', undefined, 'Profile settings')}
                                    </Button>
                                    <button
                                        onClick={() => signOut()}
                                        className="w-full rounded-2xl border border-red-200 px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
                                    >
                                        {t.nav?.logout || 'Sign out'}
                                    </button>
                                </div>
                            </div>
                        </aside>

                        {/* Main content */}
                        <section className="space-y-5">
                            {/* Stats cards */}
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {statCards.map((item) => (
                                    <div key={item.label} className="premium-panel rounded-[28px] p-5">
                                        {isLoading ? (
                                            <div className="space-y-4">
                                                <Skeleton className="h-11 w-11 rounded-2xl" />
                                                <Skeleton className="h-8 w-28" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                        ) : (
                                            <>
                                                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone}`}>
                                                    <item.icon className="h-5 w-5" />
                                                </div>
                                                <div className="mt-5 text-3xl font-bold text-[#1a1825] dark:text-white">{item.value}</div>
                                                <div className="mt-1 text-sm font-medium text-[#4e4a63] dark:text-[#aba9bc]">{item.label}</div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Earnings chart */}
                            <div className="premium-panel rounded-[30px] p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-[#1a1825] dark:text-white">{tx('pages.freelancerDashboard.earningsTrajectory', undefined, 'Earnings trajectory')}</h2>
                                        <p className="mt-2 text-sm text-[#6b6880] dark:text-[#8b8aa0]">{tx('pages.freelancerDashboard.earningsDescription', undefined, 'Last 6 months of released escrow payments.')}</p>
                                    </div>
                                    <div className="rounded-2xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 dark:border-white/8 dark:bg-white/5 dark:text-primary-200">
                                        {tx('pages.freelancerDashboard.sixMonthTrend', undefined, '6 month trend')}
                                    </div>
                                </div>

                                <div className="mt-6 h-[320px]">
                                    {chartData.length === 0 ? (
                                        <div className="flex h-full items-center justify-center text-sm text-[#8b8aa0]">
                                            {tx('pages.freelancerDashboard.noEarningsData', undefined, 'No earnings data yet')}
                                        </div>
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
                                                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8b8aa0', fontSize: 12 }} tickFormatter={(v) => `${v} TND`} width={72} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: 18, border: '1px solid rgba(139,92,246,0.14)', background: 'rgba(17,14,28,0.92)', color: '#fff' }}
                                                        formatter={(v) => [`${Number(v ?? 0).toLocaleString()} TND`, tx('pages.freelancerDashboard.earnings', undefined, 'Earnings')]}
                                                />
                                                <Area type="monotone" dataKey="earnings" stroke="#8b5cf6" strokeWidth={3} fill="url(#earningsFill)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Recent activity from notifications */}
                            <div className="premium-panel rounded-[30px] p-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/5 dark:text-primary-300">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[#1a1825] dark:text-white">{tx('pages.freelancerDashboard.recentActivity', undefined, 'Recent activity')}</h2>
                                        <p className="text-sm text-[#6b6880] dark:text-[#8b8aa0]">{tx('pages.freelancerDashboard.recentActivityDescription', undefined, 'Your latest notifications and updates.')}</p>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-5">
                                    {isLoading ? (
                                        [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)
                                    ) : stats?.notifications.length === 0 ? (
                                        <p className="text-sm text-[#8b8aa0]">{tx('pages.freelancerDashboard.noRecentActivity', undefined, 'No recent activity')}</p>
                                    ) : (
                                        stats?.notifications.map((notif, index) => {
                                            const Icon = notificationIcons[notif.type] || Bell;
                                            return (
                                                <div key={notif.id} className="relative flex gap-4">
                                                    {index !== (stats.notifications.length - 1) && (
                                                        <div className="absolute left-[18px] top-11 h-[calc(100%-1rem)] w-px bg-primary-100 dark:bg-white/10" />
                                                    )}
                                                    <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/5 dark:text-primary-300">
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-[#1a1825] dark:text-white">{notif.content}</div>
                                                        <div className="mt-1 text-xs font-medium text-[#8b8aa0]">
                                                            {new Date(notif.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Right sidebar */}
                        <aside className="space-y-5">
                            {/* Upcoming milestones */}
                            <div className="premium-panel rounded-[28px] p-5">
                                <div className="text-sm font-semibold text-[#1a1825] dark:text-white">{tx('pages.freelancerDashboard.upcomingMilestones', undefined, 'Upcoming milestones')}</div>
                                <div className="mt-4 space-y-3">
                                    {isLoading ? (
                                        [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
                                    ) : stats?.milestones.length === 0 ? (
                                        <p className="text-sm text-[#8b8aa0]">{tx('pages.freelancerDashboard.noUpcomingMilestones', undefined, 'No upcoming milestones')}</p>
                                    ) : (
                                        stats?.milestones.map((m) => (
                                            <div key={m.id} className="rounded-2xl border border-primary-100/80 bg-white/80 p-4 dark:border-white/8 dark:bg-white/5">
                                                <div className="font-semibold text-[#1a1825] dark:text-white">{m.description}</div>
                                                <div className="mt-1 text-sm text-[#6b6880] dark:text-[#8b8aa0]">
                                                    {m.due_date ? new Date(m.due_date).toLocaleDateString() : tx('pages.freelancerDashboard.noDueDate', undefined, 'No due date')}
                                                </div>
                                                <div className="mt-3 text-sm font-semibold text-primary-600 dark:text-primary-300">
                                                    {formatCurrency(m.amount)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Unread notifications panel */}
                            <div className="premium-panel rounded-[28px] p-5">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-[#1a1825] dark:text-white">{t.notifications?.title || 'Notifications'}</div>
                                    {(stats?.notifications.length ?? 0) > 0 && (
                                        <span className="rounded-full bg-primary-500 px-2 py-0.5 text-xs font-bold text-white">
                                            {stats?.notifications.length}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-4 space-y-3">
                                    {isLoading ? (
                                        [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)
                                    ) : stats?.notifications.length === 0 ? (
                                        <p className="text-sm text-[#8b8aa0]">{tx('pages.freelancerDashboard.allCaughtUp', undefined, 'All caught up!')}</p>
                                    ) : (
                                        stats?.notifications.map((notif) => (
                                            <div key={notif.id} className="flex gap-3 rounded-2xl bg-white/75 p-4 dark:bg-white/5">
                                                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-500" />
                                                <p className="text-sm leading-relaxed text-[#4e4a63] dark:text-[#aba9bc]">{notif.content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default FreelancerDashboardPage;
