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
}: {
    icon: ElementType;
    label: string;
    value: string | number;
    detail: string;
    isLoading?: boolean;
}) {
    return (
        <div className={cn(
            'rounded-lg p-5 border',
            'bg-card',
            'border-border',
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
        <div className="flex flex-col items-start rounded-[1.6rem] border border-dashed border-border bg-surface p-5 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card text-brand shadow-sm">
                <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-[var(--text-secondary)]">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
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
        <div className="page-enter page-shell bg-background">
            <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
            <Header />

            <main className="page-shell-content space-y-6">
                <section className="relative radius-shell overflow-hidden border border-primary-200/40 p-6 shadow-[0_32px_90px_-48px_rgba(109,40,217,0.28)] dark:border-white/10 sm:p-8" style={{
                    background: 'radial-gradient(circle at top left, rgba(139,92,246,0.12), transparent 34%), radial-gradient(circle at top right, rgba(245,158,11,0.08), transparent 26%), linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,239,255,0.92))'
                }}>
                    <div className="hidden dark:block absolute inset-0 pointer-events-none" style={{
                        background: 'radial-gradient(circle at top left, rgba(167,139,250,0.16), transparent 34%), radial-gradient(circle at top right, rgba(245,158,11,0.08), transparent 24%), linear-gradient(145deg,rgba(18,16,28,0.98),rgba(11,10,18,0.98))'
                    }}></div>
                    <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-l-2 border-l-[color:var(--workspace-primary)] pl-2">
                                <Sparkles className="h-3.5 w-3.5 text-[color:var(--workspace-primary)]" />
                                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
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
                                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                                                {tx('dashboard.client.welcomeBack', undefined, 'Welcome back')}
                                            </p>
                                            <h1 className="text-3xl font-black text-[var(--text-primary)] leading-tight sm:text-4xl">
                                                {tx('dashboard.client.heroGreeting', { name: greeting }, `Welcome back, ${greeting}`)}
                                            </h1>
                                            <p className="text-sm font-semibold text-[color:var(--workspace-primary)] mt-1">
                                                {t.dashboard.clientSubtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                        {tx('dashboard.client.heroDescription', undefined, 'Keep your hiring pipeline clean: post sharper briefs, review proposals faster, and move active work through delivery without extra noise.')}
                                    </p>
                                </div>

                                <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:min-w-[240px]">
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
                                <div className="summary-chip">
                                    <Users className="summary-chip-icon" />
                                    <span className="summary-chip-value">{stats?.totalProposals ?? 0}</span>
                                    <span className="summary-chip-label">{tx('dashboard.client.pipeline.totalProposals', undefined, 'total proposals')}</span>
                                </div>
                                <div className="summary-chip">
                                    <FolderKanban className="summary-chip-icon" />
                                    <span className="summary-chip-value">{openJobs}</span>
                                    <span className="summary-chip-label">{tx('dashboard.client.pipeline.openJobs', undefined, 'open jobs')}</span>
                                </div>
                                <div className="summary-chip">
                                    <Bell className="summary-chip-icon" />
                                    <span className="summary-chip-value">{unreadNotifications.length}</span>
                                    <span className="summary-chip-label">{tx('dashboard.client.pipeline.unreadUpdates', undefined, 'unread updates')}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/jobs/new')}
                                    className="flex items-center gap-2 bg-[color:var(--workspace-primary)] hover:bg-[color:var(--workspace-primary-hover)] text-[color:var(--workspace-primary-text)] font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    {tx("dashboard.client.postJob", undefined, "Post a New Job")}
                                </button>
                                {todayFocus.actionPath !== '/jobs/new' && (
                                    <Button variant="outline" size="lg" className="rounded-2xl px-5" leftIcon={<FolderKanban className="h-4 w-4" />} onClick={() => navigate(todayFocus.actionPath)}>
                                        {todayFocus.actionLabel}
                                    </Button>
                                )}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-6 min-h-[200px] lg:col-span-2">
                        <DashboardPanel className="bg-card rounded-xl border border-border p-6 min-h-[200px]">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-[0.18em]">
                                        {tx('dashboard.client.projectsBadge', undefined, 'Hiring pipeline')}
                                    </p>
                                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                                        {t.dashboard.yourJobs}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                        {tx('dashboard.client.projectsDescription', undefined, 'Latest project briefs, proposal signals, and active delivery states in one place.')}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" className="rounded-2xl text-[color:var(--workspace-primary)]" onClick={() => navigate('/client/jobs')}>
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
                                                className="group w-full rounded-[1.6rem] border border-border bg-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                                            >
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <h3 className="truncate text-base font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[color:var(--workspace-primary)]">
                                                                {job.title}
                                                            </h3>
                                                            {getStatusBadge(job.status)}
                                                        </div>
                                                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                                                            {new Date(job.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-right">
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
                                                    <div className="rounded-2xl bg-surface px-4 py-3">
                                                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">
                                                            {tx('dashboard.client.proposalsLabel', undefined, 'Proposals')}
                                                        </p>
                                                        <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                                                            {tx('dashboard.client.proposalsSubmitted', { count: job.proposals_count }, `${job.proposals_count} proposals submitted`)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl bg-surface px-4 py-3">
                                                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">
                                                            {tx('dashboard.client.assigneeLabel', undefined, 'Assigned freelancer')}
                                                        </p>
                                                        <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                                                            {assignedFreelancer || tx('dashboard.client.freelancerFallback', undefined, 'Not assigned yet')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
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
                                                        <ArrowUpRight className="h-4 w-4 text-[color:var(--workspace-primary)]" />
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </DashboardPanel>

                        {/* Active Contracts */}
                        <DashboardPanel className="bg-card rounded-xl border border-border p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-[0.18em]">
                                        {tx('dashboard.client.contractsBadge', undefined, 'Active delivery')}
                                    </p>
                                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                                        {tx('dashboard.client.activeContracts', undefined, 'Active contracts')}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                        {tx('dashboard.client.activeContractsDescription', undefined, 'Contracts currently in progress with assigned freelancers.')}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" className="rounded-2xl text-[color:var(--workspace-primary)]" onClick={() => navigate('/contracts')}>
                                    {tx('dashboard.client.viewAllContracts', undefined, 'View all')}
                                </Button>
                            </div>
                            <div className="mt-6 space-y-3">
                                {isLoading ? (
                                    [1, 2].map((item) => <Skeleton key={item} className="h-24 rounded-2xl" />)
                                ) : activeContracts.length === 0 ? (
                                    <EmptyState
                                        icon={FileText}
                                        title={tx('dashboard.client.noActiveContracts', undefined, 'No active contracts')}
                                        description={tx('dashboard.client.noActiveContractsDescription', undefined, 'Once you accept a proposal and fund the escrow, active contracts will appear here.')}
                                    />
                                ) : (
                                    activeContracts.map((contract) => (
                                        <button
                                            key={contract.id}
                                            type="button"
                                            onClick={() => navigate(`/contracts/${contract.id}`)}
                                            className="group w-full text-start rounded-[1.4rem] border border-border/50 bg-card hover:border-[color:var(--workspace-primary)]/30 p-4 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[color:var(--workspace-primary)] transition-colors">
                                                        {contract.title || tx('dashboard.client.untitledContract', undefined, 'Untitled contract')}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                                                        {contract.freelancer?.full_name && (
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                                                                    {contract.freelancer.full_name.charAt(0)}
                                                                </div>
                                                                {contract.freelancer.full_name}
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center gap-1">
                                                            <DollarSign className="h-3.5 w-3.5" />
                                                            {formatCurrency(contract.total_amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="inline-flex items-center rounded-full bg-green-500/12 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-200 shrink-0">
                                                    {tx('dashboard.client.activeBadge', undefined, 'Active')}
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </DashboardPanel>
                    </div>

                    <div className="space-y-6 min-h-[200px] lg:col-span-1">
                        <DashboardPanel className="bg-card rounded-xl border border-border p-6 min-h-[200px]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-[0.18em]">
                                        {tx('dashboard.client.pipelineBadge', undefined, 'Decision support')}
                                    </p>
                                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                                        {tx('dashboard.client.pipelineSummary', undefined, 'Hiring summary')}
                                    </h2>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-[color:var(--workspace-primary)]">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3">
                                <div className="rounded-[1.4rem] border border-border/50 bg-card p-4">
                                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">{tx('dashboard.client.awaitingReview', undefined, 'Awaiting review')}</p>
                                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{stats?.proposalsWaitingReview ?? 0}</p>
                                </div>
                                <div className="rounded-[1.4rem] border border-border/50 bg-card p-4">
                                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">{tx('dashboard.client.inProgressProjects', undefined, 'In progress')}</p>
                                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{inProgressJobs}</p>
                                </div>
                                <div className="rounded-[1.4rem] border border-border/50 bg-card p-4">
                                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">{tx('dashboard.client.jobsWithProposals', undefined, 'Jobs with proposals')}</p>
                                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{jobsWithProposals}</p>
                                </div>
                            </div>
                        </DashboardPanel>

                        <DashboardPanel>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--workspace-primary)]">
                                        {tx('dashboard.client.updatesBadge', undefined, 'Inbox pulse')}
                                    </p>
                                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                                        {tx('dashboard.client.notifications', undefined, 'Notifications')}
                                    </h2>
                                </div>
                                <span className="inline-flex min-w-[44px] items-center justify-center rounded-2xl bg-[color:var(--workspace-primary)] px-3 py-2 text-sm font-bold text-[color:var(--workspace-primary-text)] shadow-sm">
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
                                        <div key={notification.id} className="rounded-[1.4rem] border border-border/50 bg-card p-4">
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
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--workspace-primary)]">
                                        {tx('dashboard.client.playbookBadge', undefined, 'Client playbook')}
                                    </p>
                                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                                        {tx('dashboard.client.nextMoves', undefined, 'Best next moves')}
                                    </h2>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-[color:var(--workspace-primary)]">
                                    <FileText className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                <button type="button" onClick={() => navigate('/jobs/new')} className="w-full rounded-[1.4rem] border border-border/50 bg-card p-4 text-left transition-colors hover:bg-surface hover:border-border">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{tx('dashboard.postNewJob', undefined, t.dashboard.postNewJob)}</p>
                                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[var(--text-muted)]">{tx('dashboard.postNewJobDesc', undefined, t.dashboard.postNewJobDesc)}</p>
                                </button>
                                <button type="button" onClick={() => navigate('/client/jobs')} className="w-full rounded-[1.4rem] border border-border/50 bg-card p-4 text-left transition-colors hover:bg-surface hover:border-border">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{tx('dashboard.client.reviewPipeline', undefined, 'Review project pipeline')}</p>
                                    <p className="mt-2 text-sm leading-6 text-[#6b6880] dark:text-[var(--text-muted)]">{tx('dashboard.client.reviewPipelineDescription', undefined, 'Compare open briefs, proposal activity, and active delivery in one place.')}</p>
                                </button>
                                <button type="button" onClick={() => navigate('/settings')} className="w-full rounded-[1.4rem] border border-border/50 bg-card p-4 text-left transition-colors hover:bg-surface hover:border-border">
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
