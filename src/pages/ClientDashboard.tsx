import { useMemo } from 'react';
import type { ElementType, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    ArrowUpRight,
    Bell,
    Briefcase,
    CheckCircle2,
    Clock3,
    DollarSign,
    FileText,
    FolderKanban,
    Plus,
    Settings,
    Sparkles,
    Users,
} from 'lucide-react';

import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/common/SkeletonCard';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { cn } from '../lib/utils';
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
}

type DashboardNotification = {
    id: string;
    title: string | null;
    content: string | null;
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
                    <div className="mt-5 text-2xl font-bold tracking-tight text-[var(--text-primary)]">{value}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</div>
                    <div className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{detail}</div>
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
            <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[var(--text-muted)]">{description}</p>
        </div>
    );
}

function ClientDashboardPage() {
    const { t, tx, language } = useTranslation();
    const { profile } = useAuth();
    const navigate = useNavigate();

    const locale = useMemo(() => {
        if (language === 'ar') return 'ar-TN';
        if (language === 'fr') return 'fr-FR';
        return 'en-US';
    }, [language]);

    const greeting = useMemo(
        () => profile?.full_name?.split(' ')[0] || tx('dashboard.client.defaultName', undefined, 'Client'),
        [profile?.full_name, tx]
    );

    const { data: stats, isLoading } = useQuery({
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
                supabase.from('notifications').select('id,title,content,created_at')
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

    const openJobs = jobs.filter((job) => job.status === 'open').length;
    const inProgressJobs = jobs.filter((job) => job.status === 'in_progress').length;
    const jobsWithProposals = jobs.filter((job) => job.proposals_count > 0).length;
    const unreadNotifications = stats?.unreadNotifications ?? [];

    const todayFocus = (() => {
        const jobNeedingReview = jobs.find((job) => job.status === 'open' && job.proposals_count > 0);

        if (!jobs.length) {
            return {
                title: tx('dashboard.client.focusFirstJobTitle', undefined, 'Post your first project brief'),
                description: tx('dashboard.client.focusFirstJobDescription', undefined, 'A clear job brief unlocks proposals, shortlists, and contracts. Start there before anything else.'),
                actionLabel: t.dashboard.postNewJob,
                actionPath: '/jobs/new',
            };
        }

        if (jobNeedingReview) {
            return {
                title: tx('dashboard.client.focusReviewTitle', undefined, 'Review incoming proposals'),
                description: tx('dashboard.client.focusReviewDescription', { title: jobNeedingReview.title }, `Your job "${jobNeedingReview.title}" already has proposals waiting for your review.`),
                actionLabel: tx('dashboard.client.reviewProposals', undefined, 'Review proposals'),
                actionPath: `/jobs/${jobNeedingReview.id}`,
            };
        }

        if (inProgressJobs > 0) {
            return {
                title: tx('dashboard.client.focusDeliveryTitle', undefined, 'Stay close to active delivery'),
                description: tx('dashboard.client.focusDeliveryDescription', undefined, 'Track milestones, messages, and approvals so active projects keep moving without friction.'),
                actionLabel: tx('dashboard.client.openProjects', undefined, 'Open projects'),
                actionPath: '/client/jobs',
            };
        }

        return {
            title: tx('dashboard.client.focusScaleTitle', undefined, 'Open a stronger next project'),
            description: tx('dashboard.client.focusScaleDescription', undefined, 'You have a calm dashboard right now. Tighten your next brief and invite better-fit freelancers earlier.'),
            actionLabel: t.dashboard.postNewJob,
            actionPath: '/jobs/new',
        };
    })();

    const metricCards = [
        {
            label: tx('dashboard.client.activeJobs', undefined, 'Active jobs'),
            value: stats?.activeJobs ?? 0,
            detail: tx('dashboard.client.activeJobsDetail', undefined, 'Open or in-progress projects currently requiring decisions, proposals, or delivery follow-up.'),
            icon: Briefcase,
            tone: 'from-primary-500/20 to-primary-500/5 text-primary-600 dark:text-primary-300',
        },
        {
            label: tx('dashboard.client.proposalsWaiting', undefined, 'Jobs awaiting review'),
            value: stats?.proposalsWaitingReview ?? 0,
            detail: tx('dashboard.client.proposalsWaitingDetail', undefined, 'Open jobs that already have proposals and should be reviewed before they go stale.'),
            icon: Users,
            tone: 'from-amber-400/20 to-amber-400/5 text-amber-600 dark:text-amber-300',
        },
        {
            label: tx('dashboard.client.totalSpent', undefined, 'Total spent'),
            value: formatCurrency(stats?.totalSpent ?? 0, true, language),
            detail: tx('dashboard.client.totalSpentDetail', undefined, 'Completed payouts released through your client wallet and escrow flows.'),
            icon: DollarSign,
            tone: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-300',
        },
        {
            label: tx('dashboard.client.completedContracts', undefined, 'Completed contracts'),
            value: stats?.completedContracts ?? 0,
            detail: tx('dashboard.client.completedContractsDetail', undefined, 'Projects you have taken through delivery and successfully closed out.'),
            icon: CheckCircle2,
            tone: 'from-sky-500/20 to-sky-500/5 text-sky-600 dark:text-sky-300',
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <span className="status-pill-open"><AlertCircle className="w-3 h-3" />{tx('pages.clientJobs.status.open', undefined, 'Open')}</span>;
            case 'in_progress':
                return <span className="status-pill-progress"><Clock3 className="w-3 h-3" />{tx('pages.clientJobs.status.inProgress', undefined, 'In progress')}</span>;
            case 'completed':
                return <span className="status-pill-completed"><CheckCircle2 className="w-3 h-3" />{tx('pages.clientJobs.status.completed', undefined, 'Completed')}</span>;
            case 'cancelled':
                return <span className="status-pill-cancelled"><AlertCircle className="w-3 h-3" />{tx('dashboard.client.status.cancelled', undefined, 'Cancelled')}</span>;
            default:
                return null;
        }
    };

    return (
        <div className="page-shell bg-[#f6f3ff] dark:bg-[#0b0a12]">
            <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
            <Header />

            <main className="page-shell-content space-y-6">
                <section className="relative radius-shell overflow-hidden border border-primary-200/40 p-6 shadow-[0_32px_90px_-48px_rgba(14,65,227,0.28)] dark:border-white/10 sm:p-8" style={{
                    background: 'linear-gradient(135deg, rgba(21,84,247,0.06) 0%, rgba(21,84,247,0.01) 50%, transparent 100%), linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,239,255,0.92))'
                }}>
                    <div className="hidden dark:block absolute inset-0 pointer-events-none" style={{
                        background: 'linear-gradient(135deg, rgba(21,84,247,0.12) 0%, rgba(21,84,247,0.04) 50%, transparent 100%), linear-gradient(145deg,rgba(18,16,28,0.98),rgba(11,10,18,0.98))'
                    }}></div>
                    <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-l-2 border-l-[color:var(--workspace-primary)] pl-2">
                                <Sparkles className="h-3.5 w-3.5 text-[color:var(--workspace-primary)]" />
                                <p className="text-xs font-semibold uppercase tracking-widest text-[#6b6880] dark:text-gray-400">
                                    {tx('dashboard.client.commandCenter', undefined, 'Client command center')}
                                </p>
                            </div>

                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                <div className="max-w-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-bold text-white ring-2 ring-white/80 dark:ring-white/10" style={{ background: 'linear-gradient(145deg, var(--workspace-primary) 0%, var(--workspace-primary-hover) 55%, var(--workspace-primary-mid) 100%)', boxShadow: '0 26px 52px -30px color-mix(in srgb, var(--workspace-primary-hover) 85%, transparent)' }}>
                                            {profile?.avatar_url ? (
                                                <img src={profile.avatar_url} alt={greeting} className="block h-full w-full object-cover object-center" />
                                            ) : (
                                                greeting.slice(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[#6b6880] dark:text-[var(--text-muted)]">
                                                {tx('dashboard.client.welcomeBack', undefined, 'Welcome back')}
                                            </p>
                                            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                                                {tx('dashboard.client.heroGreeting', { name: greeting }, `Welcome back, ${greeting}`)}
                                            </h1>
                                            <p className="mt-2 text-sm font-medium text-primary-700 dark:text-primary-200">
                                                {t.dashboard.clientSubtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-5 max-w-2xl text-sm leading-7 text-[#5c5971] dark:text-[#aca9bd] sm:text-base">
                                        {tx('dashboard.client.heroDescription', undefined, 'Keep your hiring pipeline clean: post sharper briefs, review proposals faster, and move active work through delivery without extra noise.')}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/75 dark:bg-white/5 p-4 shadow-sm sm:min-w-[240px]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                        {tx('dashboard.client.focusLabel', undefined, 'Today focus')}
                                    </p>
                                    <p className="mt-3 text-base font-semibold text-[var(--text-primary)]">
                                        {todayFocus.title}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[var(--text-muted)]">
                                        {todayFocus.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-4 py-2 text-sm text-[#353149] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#e3def7]">
                                    <Users className="h-4 w-4 text-amber-500" />
                                    <span>{stats?.totalProposals ?? 0}</span>
                                    <span className="text-[var(--text-muted)]">{tx('dashboard.client.pipeline.totalProposals', undefined, 'total proposals')}</span>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-4 py-2 text-sm text-[#353149] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#e3def7]">
                                    <FolderKanban className="h-4 w-4 text-primary-500" />
                                    <span>{openJobs}</span>
                                    <span className="text-[var(--text-muted)]">{tx('dashboard.client.pipeline.openJobs', undefined, 'open jobs')}</span>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-4 py-2 text-sm text-[#353149] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#e3def7]">
                                    <Bell className="h-4 w-4 text-sky-500" />
                                    <span>{unreadNotifications.length}</span>
                                    <span className="text-[var(--text-muted)]">{tx('dashboard.client.pipeline.unreadUpdates', undefined, 'unread updates')}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button size="lg" className="rounded-2xl px-5" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/jobs/new')}>
                                    {t.dashboard.postNewJob}
                                </Button>
                                <Button variant="outline" size="lg" className="rounded-2xl px-5" leftIcon={<FolderKanban className="h-4 w-4" />} onClick={() => navigate(todayFocus.actionPath)}>
                                    {todayFocus.actionLabel}
                                </Button>
                                <Button variant="ghost" size="lg" className="rounded-2xl px-5" leftIcon={<Settings className="h-4 w-4" />} onClick={() => navigate('/settings')}>
                                    {tx('dashboard.client.manageWorkspace', undefined, 'Manage workspace')}
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
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                                        {tx('dashboard.client.projectsBadge', undefined, 'Hiring pipeline')}
                                    </p>
                                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                                        {t.dashboard.yourJobs}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[var(--text-muted)]">
                                        {tx('dashboard.client.projectsDescription', undefined, 'Latest project briefs, proposal signals, and active delivery states in one place.')}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => navigate('/client/jobs')}>
                                    {t.dashboard.viewAll}
                                </Button>
                            </div>

                            <div className="mt-6 space-y-4">
                                {isLoading ? (
                                    [1, 2, 3].map((item) => <Skeleton key={item} className="h-36 rounded-2xl" />)
                                ) : jobs.length === 0 ? (
                                    <EmptyState
                                        icon={Briefcase}
                                        title={tx('dashboard.client.noJobsYet', undefined, 'No jobs posted yet')}
                                        description={tx('dashboard.client.noJobsDescription', undefined, 'Your dashboard will start filling up once you publish a project brief and invite proposals into the pipeline.')}
                                    />
                                ) : (
                                    jobs.map((job) => {
                                        const assignedFreelancer = (() => {
                                            const freelancer = job.contracts?.[0]?.freelancer;
                                            return Array.isArray(freelancer) ? freelancer[0]?.full_name : freelancer?.full_name;
                                        })();

                                        return (
                                            <button
                                                key={job.id}
                                                type="button"
                                                onClick={() => navigate(`/jobs/${job.id}`)}
                                                className="group w-full rounded-[1.6rem] border border-primary-100/70 bg-white/72 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md dark:border-white/10 dark:bg-white/[0.04]"
                                            >
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <h3 className="truncate text-base font-semibold text-[var(--text-primary)] transition-colors group-hover:text-primary-700 dark:group-hover:text-primary-200">
                                                                {job.title}
                                                            </h3>
                                                            {getStatusBadge(job.status)}
                                                        </div>
                                                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                                                            {new Date(job.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-right dark:border-white/10 dark:bg-white/[0.04]">
                                                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">
                                                            {tx('dashboard.client.jobBudget', undefined, 'Budget')}
                                                        </p>
                                                        <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                                                            {job.budget_min && job.budget_max
                                                                ? `${formatCurrency(job.budget_min, true, language)} - ${formatCurrency(job.budget_max, true, language)}`
                                                                : job.budget_min
                                                                    ? formatCurrency(job.budget_min, true, language)
                                                                    : '—'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                                    <div className="rounded-2xl bg-primary-50/70 px-4 py-3 dark:bg-white/[0.04]">
                                                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">
                                                            {tx('dashboard.client.proposalsLabel', undefined, 'Proposals')}
                                                        </p>
                                                        <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                                                            {tx('dashboard.client.proposalsSubmitted', { count: job.proposals_count }, `${job.proposals_count} proposals submitted`)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl bg-primary-50/70 px-4 py-3 dark:bg-white/[0.04]">
                                                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">
                                                            {tx('dashboard.client.assigneeLabel', undefined, 'Assigned freelancer')}
                                                        </p>
                                                        <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                                                            {assignedFreelancer || tx('dashboard.client.freelancerFallback', undefined, 'Not assigned yet')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-2xl bg-primary-50/70 px-4 py-3 dark:bg-white/[0.04]">
                                                        <div>
                                                            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">
                                                                {tx('dashboard.client.nextActionLabel', undefined, 'Next action')}
                                                            </p>
                                                            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                                                                {job.status === 'open' && job.proposals_count > 0
                                                                    ? tx('dashboard.client.reviewProposals', undefined, 'Review proposals')
                                                                    : job.status === 'in_progress'
                                                                        ? tx('dashboard.client.monitorDelivery', undefined, 'Monitor delivery')
                                                                        : tx('dashboard.client.viewProject', undefined, 'View project')}
                                                            </p>
                                                        </div>
                                                        <ArrowUpRight className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </DashboardPanel>
                    </div>

                    <div className="space-y-6">
                        <DashboardPanel>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                                        {tx('dashboard.client.pipelineBadge', undefined, 'Decision support')}
                                    </p>
                                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                                        {tx('dashboard.client.pipelineSummary', undefined, 'Hiring summary')}
                                    </h2>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/5 dark:text-primary-300">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3">
                                <div className="rounded-[1.4rem] border border-primary-100/70 bg-white/75 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">{tx('dashboard.client.awaitingReview', undefined, 'Awaiting review')}</p>
                                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{stats?.proposalsWaitingReview ?? 0}</p>
                                </div>
                                <div className="rounded-[1.4rem] border border-primary-100/70 bg-white/75 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">{tx('dashboard.client.inProgressProjects', undefined, 'In progress')}</p>
                                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{inProgressJobs}</p>
                                </div>
                                <div className="rounded-[1.4rem] border border-primary-100/70 bg-white/75 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">{tx('dashboard.client.jobsWithProposals', undefined, 'Jobs with proposals')}</p>
                                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{jobsWithProposals}</p>
                                </div>
                            </div>
                        </DashboardPanel>

                        <DashboardPanel>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                                        {tx('dashboard.client.updatesBadge', undefined, 'Inbox pulse')}
                                    </p>
                                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                                        {tx('dashboard.notifications', undefined, 'Notifications')}
                                    </h2>
                                </div>
                                <span className="inline-flex min-w-[44px] items-center justify-center rounded-2xl bg-primary-600 px-3 py-2 text-sm font-bold text-white shadow-[0_18px_36px_-20px_rgba(14,65,227,0.9)]">
                                    {unreadNotifications.length}
                                </span>
                            </div>

                            <div className="mt-5 space-y-3">
                                {isLoading ? (
                                    [1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-2xl" />)
                                ) : unreadNotifications.length === 0 ? (
                                    <EmptyState
                                        icon={Bell}
                                        title={tx('dashboard.client.allCaughtUp', undefined, 'All caught up')}
                                        description={tx('dashboard.client.allCaughtUpDescription', undefined, 'When proposal updates, contract changes, or reminders land, they will appear here in a cleaner sequence.')}
                                    />
                                ) : (
                                    unreadNotifications.map((notification) => (
                                        <div key={notification.id} className="rounded-[1.4rem] border border-primary-100/70 bg-white/75 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                {notification.title || tx('dashboard.client.defaultNotificationTitle', undefined, 'Project update')}
                                            </p>
                                            <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[var(--text-muted)]">
                                                {notification.content || tx('dashboard.client.defaultNotificationBody', undefined, 'A project event needs your attention.')}
                                            </p>
                                            <p className="mt-3 text-xs font-medium text-[var(--text-muted)]">
                                                {new Date(notification.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <Button variant="outline" className="mt-4 w-full justify-between rounded-2xl" rightIcon={<ArrowUpRight className="h-4 w-4" />} onClick={() => navigate('/notifications')}>
                                {tx('dashboard.client.openNotifications', undefined, 'Open notifications')}
                            </Button>
                        </DashboardPanel>

                        <DashboardPanel>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                                        {tx('dashboard.client.playbookBadge', undefined, 'Client playbook')}
                                    </p>
                                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                                        {tx('dashboard.client.nextMoves', undefined, 'Best next moves')}
                                    </h2>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/5 dark:text-primary-300">
                                    <FileText className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                <button type="button" onClick={() => navigate('/jobs/new')} className="w-full rounded-[1.4rem] border border-primary-100/70 bg-white/75 p-4 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{tx('dashboard.postNewJob', undefined, t.dashboard.postNewJob)}</p>
                                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[var(--text-muted)]">{tx('dashboard.postNewJobDesc', undefined, t.dashboard.postNewJobDesc)}</p>
                                </button>
                                <button type="button" onClick={() => navigate('/client/jobs')} className="w-full rounded-[1.4rem] border border-primary-100/70 bg-white/75 p-4 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{tx('dashboard.client.reviewPipeline', undefined, 'Review project pipeline')}</p>
                                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[var(--text-muted)]">{tx('dashboard.client.reviewPipelineDescription', undefined, 'Compare open briefs, proposal activity, and active delivery in one place.')}</p>
                                </button>
                                <button type="button" onClick={() => navigate('/settings')} className="w-full rounded-[1.4rem] border border-primary-100/70 bg-white/75 p-4 text-left transition-colors hover:border-primary-200 hover:bg-primary-50/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{tx('dashboard.client.refineProfile', undefined, 'Refine client profile')}</p>
                                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[var(--text-muted)]">{tx('dashboard.client.refineProfileDescription', undefined, 'A clearer company profile helps freelancers trust the brief and respond faster.')}</p>
                                </button>
                            </div>
                        </DashboardPanel>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ClientDashboardPage;
