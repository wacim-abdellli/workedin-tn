import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Briefcase,
    FileText,
    FolderOpen,
    MessageSquare,
    Plus,
    Sparkles,
    Users,
} from 'lucide-react';

import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import EmptyState from '../components/ui/EmptyState';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { dashboardQueryKeys } from '../lib/dashboardQueries';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/currencyUtils';

interface DashboardContract {
    id: string;
    status: string;
    freelancer:
        | {
            full_name: string | null;
        }
        | Array<{
            full_name: string | null;
        }>
        | null;
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

type DashboardStats = {
    activeJobs: number;
    completedContracts: number;
    totalSpent: number;
    proposalsWaitingReview: number;
    totalProposals: number;
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

type ActiveContract = {
    id: string;
    title: string;
    status: string;
    total_amount: number | null;
    created_at: string;
    freelancer: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
};

function getTimeGreeting(
    tx: (key: string, params?: any, fallback?: string) => string,
): string {
    const hour = new Date().getHours();
    if (hour < 12) {
        return tx('dashboard.greeting.morning', undefined, 'Good morning');
    }
    if (hour < 18) {
        return tx('dashboard.greeting.afternoon', undefined, 'Good afternoon');
    }

    return tx('dashboard.greeting.evening', undefined, 'Good evening');
}

function jobStatusClass(status: string) {
    if (status === 'open') {
        return 'border border-orange-500/30 bg-orange-500/10 text-orange-200';
    }
    if (status === 'in_progress') {
        return 'border border-blue-500/30 bg-blue-500/10 text-blue-200';
    }
    if (status === 'completed') {
        return 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
    }

    return 'border border-zinc-500/30 bg-zinc-500/10 text-zinc-200';
}

function formatBudgetRange(
    job: DashboardJob,
    language: Parameters<typeof formatCurrency>[2],
) {
    const min = Number(job.budget_min ?? 0);
    const max = Number(job.budget_max ?? 0);

    if (min > 0 && max > 0) {
        return `${formatCurrency(min, true, language)} - ${formatCurrency(max, true, language)}`;
    }
    if (max > 0) {
        return formatCurrency(max, true, language);
    }
    if (min > 0) {
        return formatCurrency(min, true, language);
    }

    return '-';
}

function ClientDashboardPage() {
    const { language, tx } = useTranslation();
    const { profile, isLoading: isAuthLoading, isFullyReady } = useAuth();
    const navigate = useNavigate();

    const locale = useMemo(() => {
        if (language === 'ar') return 'ar-TN';
        if (language === 'fr') return 'fr-FR';
        return 'en-US';
    }, [language]);

    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: dashboardQueryKeys.clientStats(profile?.id),
        enabled: !!profile?.id,
        queryFn: async (): Promise<
            DashboardStats & {
                jobs: DashboardJob[];
                activeContracts: ActiveContract[];
                proposals: RecentProposal[];
            }
        > => {
            const userId = profile!.id;

            const [
                activeJobsRes,
                completedContractsRes,
                walletRes,
                jobsSummaryRes,
                jobsRes,
                activeContractsRes,
                proposalsRes,
            ] = await Promise.all([
                supabase
                    .from('jobs')
                    .select('id', { count: 'exact', head: true })
                    .eq('client_id', userId)
                    .in('status', ['open', 'in_progress']),
                supabase
                    .from('contracts')
                    .select('id', { count: 'exact', head: true })
                    .eq('client_id', userId)
                    .eq('status', 'completed'),
                supabase
                    .from('wallets')
                    .select('total_withdrawn')
                    .eq('user_id', userId)
                    .maybeSingle(),
                supabase
                    .from('jobs')
                    .select('status, proposals_count')
                    .eq('client_id', userId),
                supabase
                    .from('jobs')
                    .select(`
                        id, title, budget_min, budget_max, status, created_at,
                        proposals_count,
                        contracts(id, status, freelancer:public_profiles!freelancer_id(full_name))
                    `)
                    .eq('client_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(6),
                supabase
                    .from('contracts')
                    .select('id, title, status, total_amount, created_at, freelancer:public_profiles!contracts_freelancer_id_fkey(id, full_name, avatar_url)')
                    .eq('client_id', userId)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase
                    .from('proposals')
                    .select('id, job_id, bid_amount, created_at, job:jobs!inner(title, client_id), freelancer:public_profiles!proposals_freelancer_id_fkey(full_name, avatar_url)')
                    .eq('job.client_id', userId)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
                    .limit(4),
            ]);

            const jobSummaryRows = jobsSummaryRes.data ?? [];

            return {
                activeJobs: activeJobsRes.count ?? 0,
                completedContracts: completedContractsRes.count ?? 0,
                totalSpent: Number(walletRes.data?.total_withdrawn ?? 0),
                proposalsWaitingReview: jobSummaryRows.filter(
                    (job) => job.status === 'open' && (job.proposals_count ?? 0) > 0,
                ).length,
                totalProposals: jobSummaryRows.reduce(
                    (sum, job) => sum + Number(job.proposals_count ?? 0),
                    0,
                ),
                jobs: (jobsRes.data ?? []) as unknown as DashboardJob[],
                activeContracts: (activeContractsRes.data ??
                    []) as unknown as ActiveContract[],
                proposals: (proposalsRes.data ?? []) as unknown as RecentProposal[],
            };
        },
        staleTime: 60_000,
    });

    const statsData = {
        totalJobs: stats?.jobs?.length ?? 0,
        activeJobs: stats?.activeJobs ?? 0,
        totalProposals: stats?.totalProposals ?? 0,
        totalSpent: stats?.totalSpent ?? 0,
        monthlySpending: (stats?.activeContracts ?? []).reduce(
            (sum, contract) => sum + Number(contract.total_amount ?? 0),
            0,
        ),
        activeContracts: stats?.activeContracts?.length ?? 0,
    };

    const firstName =
        profile?.full_name?.split(' ')[0] ||
        tx('dashboard.client.clientFallback', undefined, 'Client');
    const proposalsWaitingReview = stats?.proposalsWaitingReview ?? 0;
    const jobs = stats?.jobs ?? [];
    const proposals = stats?.proposals ?? [];
    const activeContracts = stats?.activeContracts ?? [];
    const formatDate = (value: string) =>
        new Date(value).toLocaleDateString(locale);

    if (isAuthLoading || !isFullyReady) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white">
                <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
                <Header />
                <main className="min-h-screen bg-[#0a0a0a] text-white pt-10 pb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
                        <div className="animate-pulse rounded-2xl border border-[#262626] bg-[#141414] h-40" />
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className="lg:col-span-8 space-y-8">
                                <div className="animate-pulse rounded-2xl border border-[#262626] bg-[#141414] h-72" />
                                <div className="animate-pulse rounded-2xl border border-[#262626] bg-[#141414] h-64" />
                            </div>
                            <div className="lg:col-span-4 space-y-6">
                                <div className="animate-pulse rounded-2xl border border-[#262626] bg-[#141414] h-52" />
                                <div className="animate-pulse rounded-2xl border border-[#262626] bg-[#141414] h-64" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!profile?.id) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white">
                <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
                <Header />
                <main className="min-h-screen bg-[#0a0a0a] text-white pt-10 pb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <EmptyState
                            icon={Users}
                            title={tx(
                                'dashboard.client.profileUnavailable',
                                undefined,
                                'Profile unavailable',
                            )}
                            description={tx(
                                'dashboard.client.profileUnavailableDesc',
                                undefined,
                                'We could not load your account profile yet. Please try again.',
                            )}
                            action={{
                                label: tx('common.retry', undefined, 'Retry'),
                                onClick: () => window.location.reload(),
                            }}
                        />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
            <Header />

            <main className="min-h-screen bg-[#0a0a0a] text-white pt-10 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
                    <section className="relative overflow-hidden border border-[#2b2b2b] rounded-2xl bg-[#121212] p-5 sm:p-6 lg:p-7">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_160%_at_0%_0%,rgba(249,115,22,0.16)_0%,transparent_48%),radial-gradient(75%_140%_at_100%_0%,rgba(154,52,18,0.2)_0%,transparent_52%)]" />
                        <div className="pointer-events-none absolute -top-10 right-8 h-28 w-28 rounded-full bg-orange-500/20 blur-3xl" />

                        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    {tx(
                                        'dashboard.client.commandCenter',
                                        undefined,
                                        'Client Command Center',
                                    )}
                                </div>

                                <div className="mt-4 flex items-center gap-4 min-w-0">
                                    {profile.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt={firstName}
                                            className="h-14 w-14 rounded-full border border-[#3a3a3a] object-cover ring-2 ring-orange-500/30"
                                        />
                                    ) : (
                                        <div className="h-14 w-14 rounded-full border border-[#3a3a3a] bg-[#161616] flex items-center justify-center ring-2 ring-orange-500/30">
                                            <Users className="h-6 w-6 text-orange-300" />
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight truncate text-white">
                                            {tx(
                                                'dashboard.client.welcomeBack',
                                                undefined,
                                                'Welcome back',
                                            )}
                                            , {firstName}
                                        </h1>
                                        <p className="text-orange-100/80 text-sm mt-1">
                                            {tx(
                                                'dashboard.client.commandCenterSubtitle',
                                                undefined,
                                                'Track projects, proposals, and spending from one place.',
                                            )}
                                        </p>
                                        <p className="text-xs text-orange-100/60 mt-1">
                                            {getTimeGreeting(tx)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:min-w-[440px]">
                                {[
                                    {
                                        label: tx(
                                            'dashboard.client.projectsLabel',
                                            undefined,
                                            'Projects',
                                        ),
                                        value: statsData.totalJobs,
                                    },
                                    {
                                        label: tx(
                                            'dashboard.client.activeLabel',
                                            undefined,
                                            'Active',
                                        ),
                                        value: statsData.activeJobs,
                                    },
                                    {
                                        label: tx(
                                            'dashboard.client.proposalsLabel',
                                            undefined,
                                            'Proposals',
                                        ),
                                        value: statsData.totalProposals,
                                    },
                                    {
                                        label: tx(
                                            'dashboard.client.spentLabel',
                                            undefined,
                                            'Spent',
                                        ),
                                        value: formatCurrency(
                                            statsData.totalSpent,
                                            true,
                                            language,
                                        ),
                                    },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="rounded-xl border border-[#333] bg-[#101010]/90 px-4 py-3"
                                    >
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-orange-100/65">
                                            {stat.label}
                                        </p>
                                        <p className="mt-1 text-2xl font-bold text-white">
                                            {stat.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative mt-4 flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs text-orange-200/90">
                                {tx(
                                    'dashboard.client.reviewQueue',
                                    undefined,
                                    'Review Queue',
                                )}
                                : {proposalsWaitingReview}
                            </span>
                            <button
                                type="button"
                                onClick={() => navigate('/jobs/new')}
                                className="inline-flex items-center rounded-full border border-[#373737] bg-[#111111] px-3 py-1 text-xs font-medium text-orange-200 hover:border-orange-500/40 hover:text-orange-100 transition-colors"
                            >
                                {tx(
                                    'dashboard.client.postAProject',
                                    undefined,
                                    'Post a Project',
                                )}
                            </button>
                        </div>
                    </section>

                    <div className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                            <section className="lg:col-span-8 h-full bg-[#141414] border border-[#262626] rounded-2xl flex flex-col overflow-hidden">
                                <header className="px-6 py-4 border-b border-[#262626] flex justify-between items-center">
                                    <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-300">
                                        {tx(
                                            'dashboard.client.activeProjects',
                                            undefined,
                                            'Active Projects',
                                        )}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/client/jobs')}
                                        className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                                    >
                                        {tx(
                                            'dashboard.client.viewAll',
                                            undefined,
                                            'View All',
                                        )}{' '}
                                        -&gt;
                                    </button>
                                </header>

                                {isStatsLoading ? (
                                    <div className="p-6 space-y-3">
                                        <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-[#262626]" />
                                        <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-[#262626]" />
                                        <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-[#262626]" />
                                    </div>
                                ) : jobs.length === 0 ? (
                                    <div className="px-6 py-8">
                                        <p className="text-sm text-orange-100/70">
                                            {tx(
                                                'dashboard.client.noActiveProjects',
                                                undefined,
                                                'No active projects yet.',
                                            )}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/jobs/new')}
                                            className="mt-4 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
                                        >
                                            {tx(
                                                'dashboard.client.postAProject',
                                                undefined,
                                                'Post a Project',
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        {jobs.slice(0, 3).map((job, index) => (
                                            <button
                                                key={job.id}
                                                type="button"
                                                onClick={() => navigate(`/jobs/${job.id}`)}
                                                className={`w-full text-left px-6 py-4 hover:bg-[#262626]/30 transition-colors ${index < Math.min(jobs.length, 3) - 1 ? 'border-b border-[#262626]' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">
                                                            {job.title}
                                                        </p>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-orange-100/70">
                                                            <span>
                                                                {job.proposals_count}{' '}
                                                                {tx(
                                                                    'dashboard.client.proposalsCountText',
                                                                    undefined,
                                                                    'proposals',
                                                                )}
                                                            </span>
                                                            <span className="text-orange-300/50">•</span>
                                                            <span>
                                                                {formatDate(new Date(job.created_at).toISOString())}
                                                            </span>
                                                            <span className="text-orange-300/50">•</span>
                                                            <span>
                                                                {formatBudgetRange(job, language)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${jobStatusClass(job.status)}`}
                                                    >
                                                        {tx(
                                                            `status.${job.status}`,
                                                            undefined,
                                                            job.status,
                                                        )}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="lg:col-span-4 h-full relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-[#181818] to-[#121212] p-6">
                                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-500/25 blur-2xl" />

                                <div className="relative">
                                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-orange-400/40 bg-orange-500/20 text-orange-200">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    <h3 className="mt-4 text-xl font-bold text-white leading-tight">
                                        {tx(
                                            'dashboard.client.needSomethingDone',
                                            undefined,
                                            'Need something done?',
                                        )}
                                    </h3>
                                    <p className="mt-2 text-sm text-orange-100/75">
                                        {tx(
                                            'dashboard.client.postProjectFree',
                                            undefined,
                                            'Post a project free. Get proposals from verified Tunisian talent.',
                                        )}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/jobs/new')}
                                        className="mt-4 w-full rounded-xl bg-orange-600 hover:bg-orange-500 py-2.5 text-sm font-semibold text-white transition-colors"
                                    >
                                        {tx(
                                            'dashboard.client.postProjectFreeCta',
                                            undefined,
                                            "Post a project - it's free",
                                        )}
                                    </button>
                                </div>
                            </section>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                            <section className="lg:col-span-8 h-full bg-[#141414] border border-[#262626] rounded-2xl flex flex-col overflow-hidden">
                                <header className="px-6 py-4 border-b border-[#262626] flex justify-between items-center">
                                    <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-300">
                                        {tx(
                                            'dashboard.client.recentProposals',
                                            undefined,
                                            'Recent Proposals',
                                        )}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/client/jobs')}
                                        className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                                    >
                                        {tx(
                                            'dashboard.client.viewAll',
                                            undefined,
                                            'View All',
                                        )}{' '}
                                        -&gt;
                                    </button>
                                </header>

                                {isStatsLoading ? (
                                    <div className="p-6 space-y-3">
                                        <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-[#262626]" />
                                        <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-[#262626]" />
                                        <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-[#262626]" />
                                    </div>
                                ) : proposals.length === 0 ? (
                                    <div className="px-6 py-8 text-sm text-orange-100/70">
                                        {tx(
                                            'dashboard.client.noProposalsYet',
                                            undefined,
                                            'No proposals yet.',
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        {proposals.slice(0, 4).map((proposal, index) => (
                                            <div
                                                key={proposal.id}
                                                className={`px-6 py-4 hover:bg-[#262626]/30 transition-colors flex items-center justify-between gap-3 ${index < Math.min(proposals.length, 4) - 1 ? 'border-b border-[#262626]' : ''}`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="relative h-10 w-10 rounded-full overflow-hidden border border-[#3a3a3a] shrink-0">
                                                        {proposal.freelancer?.avatar_url ? (
                                                            <img
                                                                src={proposal.freelancer.avatar_url}
                                                                alt={proposal.freelancer?.full_name || ''}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full bg-orange-500/20 text-orange-200 flex items-center justify-center text-xs font-bold uppercase">
                                                                {proposal.freelancer?.full_name?.[0] || 'F'}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">
                                                            {proposal.freelancer?.full_name ||
                                                                tx(
                                                                    'dashboard.client.freelancerFallback',
                                                                    undefined,
                                                                    'Freelancer',
                                                                )}
                                                        </p>
                                                        <p className="text-xs text-orange-100/70 truncate mt-1">
                                                            {proposal.job?.title ||
                                                                tx(
                                                                    'dashboard.client.untitledJob',
                                                                    undefined,
                                                                    'Untitled job',
                                                                )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-semibold text-white">
                                                        {formatCurrency(
                                                            proposal.bid_amount ?? 0,
                                                            true,
                                                            language,
                                                        )}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/client/jobs/${proposal.job_id}/proposals`,
                                                            )
                                                        }
                                                        className="mt-1 text-xs text-orange-300 hover:text-orange-200 transition-colors"
                                                    >
                                                        {tx(
                                                            'dashboard.client.reviewBadge',
                                                            undefined,
                                                            'Review',
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="lg:col-span-4 h-full bg-[#141414] border border-[#262626] rounded-2xl p-6">
                                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-300">
                                    {tx('dashboard.client.thisMonth', undefined, 'This Month')}
                                </p>
                                <p className="text-3xl font-black text-white mt-2">
                                    {formatCurrency(
                                        statsData.monthlySpending,
                                        true,
                                        language,
                                    )}
                                </p>

                                <p className="text-xs text-orange-100/70 mt-2">
                                    {tx(
                                        'dashboard.client.acrossActiveContracts',
                                        { count: statsData.activeContracts },
                                        `Across ${statsData.activeContracts} active contracts`,
                                    )}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigate('/wallet')}
                                    className="w-full mt-4 bg-[#262626] hover:bg-[#333] text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                                >
                                    {tx(
                                        'dashboard.client.viewWallet',
                                        undefined,
                                        'View Wallet',
                                    )}
                                </button>
                            </section>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                            <section className="lg:col-span-8 h-full bg-[#141414] border border-[#262626] rounded-2xl flex flex-col overflow-hidden">
                                <header className="px-6 py-4 border-b border-[#262626] flex justify-between items-center">
                                    <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-300">
                                        {tx(
                                            'dashboard.client.activeContracts',
                                            undefined,
                                            'Active Contracts',
                                        )}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/contracts')}
                                        className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                                    >
                                        {tx(
                                            'dashboard.client.viewAll',
                                            undefined,
                                            'View All',
                                        )}{' '}
                                        -&gt;
                                    </button>
                                </header>

                                {isStatsLoading ? (
                                    <div className="p-6 space-y-3">
                                        <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-[#262626]" />
                                        <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-[#262626]" />
                                    </div>
                                ) : activeContracts.length === 0 ? (
                                    <div className="px-6 py-8 text-sm text-orange-100/70">
                                        {tx(
                                            'dashboard.client.noActiveContracts',
                                            undefined,
                                            'No active contracts yet.',
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        {activeContracts
                                            .slice(0, 3)
                                            .map((contract, index) => (
                                                <div
                                                    key={contract.id}
                                                    className={`px-6 py-4 hover:bg-[#262626]/30 transition-colors flex items-center justify-between gap-3 ${index < Math.min(activeContracts.length, 3) - 1 ? 'border-b border-[#262626]' : ''}`}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">
                                                            {contract.title}
                                                        </p>
                                                        <p className="text-xs text-orange-100/70 truncate mt-1">
                                                            {contract.freelancer?.full_name ||
                                                                tx(
                                                                    'dashboard.client.freelancerFallback',
                                                                    undefined,
                                                                    'Freelancer',
                                                                )}
                                                        </p>
                                                    </div>

                                                    <div className="text-right shrink-0">
                                                        <p className="text-sm font-semibold text-white">
                                                            {formatCurrency(
                                                                contract.total_amount ?? 0,
                                                                true,
                                                                language,
                                                            )}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(`/contracts/${contract.id}`)
                                                            }
                                                            className="mt-1 text-xs text-orange-300 hover:text-orange-200 transition-colors"
                                                        >
                                                            {tx(
                                                                'dashboard.client.openContract',
                                                                undefined,
                                                                'Open',
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </section>

                            <section className="lg:col-span-4 h-full bg-[#141414] border border-[#262626] rounded-2xl p-6">
                                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-orange-300">
                                    {tx(
                                        'dashboard.client.quickActions',
                                        undefined,
                                        'Quick Actions',
                                    )}
                                </p>

                                <div className="mt-4 flex flex-col gap-2">
                                    {[
                                        {
                                            label: tx(
                                                'nav.findFreelancers',
                                                undefined,
                                                'Find Freelancers',
                                            ),
                                            icon: Users,
                                            path: '/find-freelancers',
                                        },
                                        {
                                            label: tx(
                                                'nav.myProjects',
                                                undefined,
                                                'My Projects',
                                            ),
                                            icon: FolderOpen,
                                            path: '/client/jobs',
                                        },
                                        {
                                            label: tx(
                                                'nav.contracts',
                                                undefined,
                                                'Contracts',
                                            ),
                                            icon: Briefcase,
                                            path: '/contracts',
                                        },
                                        {
                                            label: tx(
                                                'nav.messages',
                                                undefined,
                                                'Messages',
                                            ),
                                            icon: MessageSquare,
                                            path: '/messages',
                                        },
                                    ].map((action) => (
                                        <button
                                            key={action.label}
                                            type="button"
                                            onClick={() => navigate(action.path)}
                                            className="w-full rounded-xl border border-[#262626] bg-[#101010] hover:bg-[#262626]/40 text-white px-3 py-2.5 text-sm font-medium transition-colors flex items-center justify-between"
                                        >
                                            <span>{action.label}</span>
                                            <action.icon className="h-4 w-4 text-orange-300" />
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ClientDashboardPage;