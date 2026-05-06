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
        return 'border border-[color-mix(in_srgb,var(--workspace-primary)_30%,transparent)] bg-[var(--workspace-primary-dim)] text-[var(--workspace-primary-mid)]';
    }
    if (status === 'in_progress') {
        return 'border border-[color-mix(in_srgb,var(--color-status-info)_30%,transparent)] bg-[var(--color-status-info-bg)] text-[var(--color-status-info)]';
    }
    if (status === 'completed') {
        return 'border border-[color-mix(in_srgb,var(--color-status-success)_30%,transparent)] bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]';
    }

    return 'border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]';
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
                        contracts(id, status, freelancer_id)
                    `)
                    .eq('client_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(6),
                supabase
                    .from('contracts')
                    .select('id, title, status, total_amount, created_at, freelancer_id')
                    .eq('client_id', userId)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase
                    .from('proposals')
                    .select('id, job_id, bid_amount, created_at, freelancer_id, job:jobs!inner(title, client_id)')
                    .eq('job.client_id', userId)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })
                    .limit(4),
            ]);

            const jobSummaryRows = jobsSummaryRes.data ?? [];

            const freelancerIds = new Set<string>();
            if (activeContractsRes.data) {
                activeContractsRes.data.forEach(c => freelancerIds.add(c.freelancer_id));
            }
            if (proposalsRes.data) {
                proposalsRes.data.forEach(p => freelancerIds.add(p.freelancer_id));
            }
            if (jobsRes.data) {
                jobsRes.data.forEach(j => {
                    j.contracts?.forEach(c => {
                        if (c.freelancer_id) freelancerIds.add(c.freelancer_id);
                    });
                });
            }

            const profilesById: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
            if (freelancerIds.size > 0) {
                const { data: profilesData } = await supabase
                    .from('public_profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', Array.from(freelancerIds));
                
                profilesData?.forEach(p => {
                    profilesById[p.id] = p;
                });
            }

            const jobsMapped = (jobsRes.data ?? []).map(job => ({
                ...job,
                contracts: job.contracts?.map(c => ({
                    ...c,
                    freelancer: profilesById[c.freelancer_id] || null
                }))
            }));

            const activeContractsMapped = (activeContractsRes.data ?? []).map(c => ({
                ...c,
                freelancer: profilesById[c.freelancer_id] || null
            }));

            const proposalsMapped = (proposalsRes.data ?? []).map(p => ({
                ...p,
                freelancer: profilesById[p.freelancer_id] || null
            }));

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
                totalJobs: jobSummaryRows.length,
                jobs: jobsMapped as unknown as DashboardJob[],
                activeContracts: activeContractsMapped as unknown as ActiveContract[],
                proposals: proposalsMapped as unknown as RecentProposal[],
            };
        },
        staleTime: 60_000,
    });

    const statsData = {
        totalJobs: stats?.totalJobs ?? 0,
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
            <div className="min-h-screen bg-[var(--color-bg-base)]">
                <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
                <Header />
                <main className="min-h-screen bg-[var(--color-bg-base)] pt-10 pb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
                        <div className="animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] h-40" />
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className="lg:col-span-8 space-y-8">
                                <div className="animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] h-72" />
                                <div className="animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] h-64" />
                            </div>
                            <div className="lg:col-span-4 space-y-6">
                                <div className="animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] h-52" />
                                <div className="animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] h-64" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!profile?.id) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-base)]">
                <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
                <Header />
                <main className="min-h-screen bg-[var(--color-bg-base)] pt-10 pb-12">
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
        <div className="min-h-screen bg-[var(--color-bg-base)]">
            <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
            <Header />

            <main className="min-h-screen bg-[var(--color-bg-base)] pt-6 pb-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-5">
                    {/* ── COMMAND CENTER BANNER ── */}
                    <section 
                        className="relative overflow-hidden border rounded-xl" 
                        style={{ 
                            background: 'radial-gradient(90% 160% at 0% 0%, color-mix(in srgb, var(--workspace-primary) 12%, transparent) 0%, transparent 48%), var(--color-bg-base)',
                            borderColor: 'color-mix(in srgb, var(--workspace-primary) 15%, transparent)'
                        }}
                    >
                        <div 
                            className="pointer-events-none absolute -top-8 right-8 h-20 w-20 rounded-full blur-3xl" 
                            style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}
                        />

                        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 p-5">
                            <div className="min-w-0 flex items-center gap-4">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={firstName}
                                        className="h-12 w-12 rounded-full border object-cover ring-2"
                                        style={{ 
                                            borderColor: 'var(--color-border-default)',
                                            '--tw-ring-color': 'color-mix(in srgb, var(--workspace-primary) 20%, transparent)'
                                        } as React.CSSProperties}
                                    />
                                ) : (
                                    <div 
                                        className="h-12 w-12 rounded-full border bg-[var(--color-bg-elevated)] flex items-center justify-center ring-2"
                                        style={{ 
                                            borderColor: 'var(--color-border-default)',
                                            '--tw-ring-color': 'color-mix(in srgb, var(--workspace-primary) 20%, transparent)'
                                        } as React.CSSProperties}
                                    >
                                        <Users className="h-5 w-5" style={{ color: 'var(--workspace-primary-mid)' }} />
                                    </div>
                                )}

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--workspace-primary)' }} />
                                        <span 
                                            className="text-[10px] font-bold uppercase tracking-wider"
                                            style={{ color: 'color-mix(in srgb, var(--workspace-primary-mid) 80%, transparent)' }}
                                        >
                                            {tx('dashboard.client.commandCenter', undefined, 'Client Dashboard')}
                                        </span>
                                    </div>
                                    <h1 
                                        className="text-xl sm:text-2xl font-black tracking-tight truncate leading-none"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        {tx('dashboard.client.welcomeBack', undefined, 'Welcome back')}, {firstName}
                                    </h1>
                                    <p 
                                        className="text-xs mt-1.5 truncate"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                        {tx('dashboard.client.commandCenterSubtitle', undefined, 'Track projects, proposals, and spending.')}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!profile?.id) return;
                                            try {
                                                const jobsToSeed = Array.from({ length: 10 }).map((_, i) => ({
                                                    client_id: profile.id,
                                                    title: `Test Job ${i + 1} - ${new Date().toLocaleTimeString()}`,
                                                    description: 'This is a test job seeded automatically to help with testing the new flows and pagination. Need an expert freelancer.',
                                                    budget_min: (i + 1) * 20,
                                                    budget_max: (i + 1) * 50,
                                                    category: 'development', // Lowercase enum
                                                    required_skills: ['React', 'UI/UX'], // Correct column
                                                    status: 'open',
                                                    job_type: 'fixed_price', // Correct column
                                                    experience_level: 'intermediate',
                                                    duration: 'less_than_1_month', // Correct column
                                                }));
                                                const { error } = await supabase.from('jobs').insert(jobsToSeed);
                                                if (error) {
                                                    alert("Failed to seed jobs! Error: " + error.message);
                                                    console.error("Supabase insert error:", error);
                                                } else {
                                                    window.location.reload();
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                alert("Error seeding jobs");
                                            }
                                        }}
                                        className="mt-2 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-500 border border-rose-500/50 hover:bg-rose-500/30 transition-colors"
                                    >
                                        + Seed 10 Jobs (Test)
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-row items-center gap-3 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide shrink-0">
                                <div 
                                    className="rounded-lg border px-4 py-2 min-w-[100px]"
                                    style={{ 
                                        borderColor: 'var(--color-border-subtle)',
                                        background: 'var(--color-bg-subtle)'
                                    }}
                                >
                                    <p 
                                        className="text-[10px] uppercase tracking-wider font-semibold mb-0.5"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                        {tx('dashboard.client.projectsLabel', undefined, 'Projects')}
                                    </p>
                                    <p 
                                        className="text-lg font-black"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        {statsData.totalJobs}
                                    </p>
                                </div>

                                <div 
                                    className="rounded-lg border px-4 py-2 min-w-[100px]"
                                    style={{ 
                                        borderColor: 'var(--color-border-subtle)',
                                        background: 'var(--color-bg-subtle)'
                                    }}
                                >
                                    <p 
                                        className="text-[10px] uppercase tracking-wider font-semibold mb-0.5"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                        {tx('dashboard.client.activeLabel', undefined, 'Active')}
                                    </p>
                                    <p 
                                        className="text-lg font-black"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        {statsData.activeJobs}
                                    </p>
                                </div>

                                <div 
                                    className="rounded-lg border px-4 py-2 min-w-[100px]"
                                    style={{ 
                                        borderColor: 'var(--color-border-subtle)',
                                        background: 'var(--color-bg-subtle)'
                                    }}
                                >
                                    <p 
                                        className="text-[10px] uppercase tracking-wider font-semibold mb-0.5"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                        {tx('dashboard.client.proposalsLabel', undefined, 'Proposals')}
                                    </p>
                                    <p 
                                        className="text-lg font-black"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        {statsData.totalProposals}
                                    </p>
                                </div>

                                <div 
                                    className="rounded-lg border px-4 py-2 min-w-[100px]"
                                    style={{ 
                                        borderColor: 'var(--color-border-subtle)',
                                        background: 'var(--color-bg-subtle)'
                                    }}
                                >
                                    <p 
                                        className="text-[10px] uppercase tracking-wider font-semibold mb-0.5"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                        {tx('dashboard.client.spentLabel', undefined, 'Spent')}
                                    </p>
                                    <p 
                                        className="text-lg font-black"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        {formatCurrency(statsData.totalSpent, true, language)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── MAIN CONTENT GRID ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        {/* Left Column - Primary Content */}
                        <section className="lg:col-span-8 flex flex-col gap-5">
                            
                            {/* Active Projects */}
                            <div 
                                className="rounded-xl border bg-[var(--color-bg-base)] overflow-hidden flex flex-col"
                                style={{ borderColor: 'var(--color-border-subtle)' }}
                            >
                                <header 
                                    className="px-5 py-3 border-b flex justify-between items-center"
                                    style={{ 
                                        borderColor: 'var(--color-border-subtle)',
                                        background: 'var(--color-bg-subtle)'
                                    }}
                                >
                                    <h2 
                                        className="text-xs font-bold uppercase tracking-wider"
                                        style={{ color: 'var(--workspace-primary-mid)' }}
                                    >
                                        {tx('dashboard.client.activeProjects', undefined, 'Active Projects')}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/client/jobs')}
                                        className="text-[11px] font-semibold transition-colors"
                                        style={{ color: 'var(--workspace-primary)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--workspace-primary-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--workspace-primary)'}
                                    >
                                        {tx('dashboard.client.viewAll', undefined, 'View All')} -&gt;
                                    </button>
                                </header>

                                {isStatsLoading ? (
                                    <div className="p-5 space-y-2">
                                        <div className="animate-pulse h-12 rounded-lg" style={{ background: 'var(--color-bg-subtle)' }} />
                                        <div className="animate-pulse h-12 rounded-lg" style={{ background: 'var(--color-bg-subtle)' }} />
                                    </div>
                                ) : jobs.length === 0 ? (
                                    <div className="px-5 py-6 flex items-center justify-between gap-4">
                                        <p 
                                            className="text-sm"
                                            style={{ color: 'var(--color-text-tertiary)' }}
                                        >
                                            {tx('dashboard.client.noActiveProjects', undefined, 'No active projects yet.')}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/jobs/new')}
                                            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                                            style={{ 
                                                background: 'var(--workspace-primary)',
                                                color: 'var(--workspace-primary-text)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--workspace-primary-hover)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--workspace-primary)'}
                                        >
                                            {tx('dashboard.client.postAProject', undefined, 'Post a Project')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {jobs.slice(0, 3).map((job, index) => (
                                            <button
                                                key={job.id}
                                                type="button"
                                                onClick={() => navigate(`/jobs/${job.id}`)}
                                                className={`w-full text-left px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors flex items-start justify-between gap-4 ${index < Math.min(jobs.length, 3) - 1 ? 'border-b' : ''}`}
                                                style={{ borderColor: 'var(--color-border-subtle)' }}
                                            >
                                                <div className="min-w-0">
                                                    <p 
                                                        className="text-sm font-semibold truncate"
                                                        style={{ color: 'var(--color-text-primary)' }}
                                                    >
                                                        {job.title}
                                                    </p>
                                                    <div 
                                                        className="mt-1 flex items-center gap-2 text-xs"
                                                        style={{ color: 'var(--color-text-secondary)' }}
                                                    >
                                                        <span>{job.proposals_count} {tx('dashboard.client.proposalsCountText', undefined, 'proposals')}</span>
                                                        <span style={{ color: 'var(--color-border-default)' }}>•</span>
                                                        <span>{formatDate(new Date(job.created_at).toISOString())}</span>
                                                        <span style={{ color: 'var(--color-border-default)' }}>•</span>
                                                        <span className="font-medium">{formatBudgetRange(job, language)}</span>
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${jobStatusClass(job.status)}`}>
                                                    {tx(`status.${job.status}`, undefined, job.status)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recent Proposals */}
                            <div 
                                className="rounded-xl border bg-[var(--color-bg-base)] overflow-hidden flex flex-col"
                                style={{ borderColor: 'var(--color-border-subtle)' }}
                            >
                                <header 
                                    className="px-5 py-3 border-b flex justify-between items-center"
                                    style={{ 
                                        borderColor: 'var(--color-border-subtle)',
                                        background: 'var(--color-bg-subtle)'
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <h2 
                                            className="text-xs font-bold uppercase tracking-wider"
                                            style={{ color: 'var(--workspace-primary-mid)' }}
                                        >
                                            {tx('dashboard.client.recentProposals', undefined, 'Recent Proposals')}
                                        </h2>
                                        {proposalsWaitingReview > 0 && (
                                            <span 
                                                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                style={{ 
                                                    background: 'var(--workspace-primary-dim)',
                                                    color: 'var(--workspace-primary-mid)'
                                                }}
                                            >
                                                {proposalsWaitingReview} {tx('dashboard.client.reviewQueue', undefined, 'in queue')}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/client/jobs')}
                                        className="text-[11px] font-semibold transition-colors"
                                        style={{ color: 'var(--workspace-primary)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--workspace-primary-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--workspace-primary)'}
                                    >
                                        {tx('dashboard.client.viewAll', undefined, 'View All')} -&gt;
                                    </button>
                                </header>

                                {isStatsLoading ? (
                                    <div className="p-5 space-y-2">
                                        <div className="animate-pulse h-10 rounded-lg" style={{ background: 'var(--color-bg-subtle)' }} />
                                        <div className="animate-pulse h-10 rounded-lg" style={{ background: 'var(--color-bg-subtle)' }} />
                                    </div>
                                ) : proposals.length === 0 ? (
                                    <div 
                                        className="px-5 py-6 text-sm text-center"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                        {tx('dashboard.client.noProposalsYet', undefined, 'No proposals yet.')}
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {proposals.slice(0, 4).map((proposal, index) => (
                                            <div
                                                key={proposal.id}
                                                className={`px-5 py-3 hover:bg-[var(--color-bg-subtle)] transition-colors flex items-center justify-between gap-3 ${index < Math.min(proposals.length, 4) - 1 ? 'border-b' : ''}`}
                                                style={{ borderColor: 'var(--color-border-subtle)' }}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div 
                                                        className="relative h-9 w-9 rounded-full overflow-hidden border shrink-0"
                                                        style={{ borderColor: 'var(--color-border-default)' }}
                                                    >
                                                        {proposal.freelancer?.avatar_url ? (
                                                            <img
                                                                src={proposal.freelancer.avatar_url}
                                                                alt={proposal.freelancer?.full_name || ''}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div 
                                                                className="h-full w-full flex items-center justify-center text-[10px] font-bold uppercase"
                                                                style={{ 
                                                                    background: 'var(--workspace-primary-dim)',
                                                                    color: 'var(--workspace-primary-mid)'
                                                                }}
                                                            >
                                                                {proposal.freelancer?.full_name?.[0] || 'F'}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p 
                                                            className="text-sm font-semibold truncate"
                                                            style={{ color: 'var(--color-text-primary)' }}
                                                        >
                                                            {proposal.freelancer?.full_name || tx('dashboard.client.freelancerFallback', undefined, 'Freelancer')}
                                                        </p>
                                                        <p 
                                                            className="text-[11px] truncate mt-0.5"
                                                            style={{ color: 'var(--color-text-tertiary)' }}
                                                        >
                                                            {proposal.job?.title || tx('dashboard.client.untitledJob', undefined, 'Untitled job')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0 flex items-center gap-3">
                                                    <p 
                                                        className="text-xs font-bold"
                                                        style={{ color: 'var(--color-text-primary)' }}
                                                    >
                                                        {formatCurrency(proposal.bid_amount ?? 0, true, language)}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/client/jobs/${proposal.job_id}/proposals`)}
                                                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                                                        style={{ 
                                                            background: 'var(--color-bg-subtle)',
                                                            borderColor: 'var(--color-border-default)',
                                                            color: 'var(--color-text-primary)'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-muted)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
                                                    >
                                                        {tx('dashboard.client.reviewBadge', undefined, 'Review')}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Active Contracts */}
                            <div 
                                className="rounded-xl border bg-[var(--color-bg-base)] overflow-hidden flex flex-col"
                                style={{ borderColor: 'var(--color-border-subtle)' }}
                            >
                                <header 
                                    className="px-5 py-3 border-b flex justify-between items-center"
                                    style={{ 
                                        borderColor: 'var(--color-border-subtle)',
                                        background: 'var(--color-bg-subtle)'
                                    }}
                                >
                                    <h2 
                                        className="text-xs font-bold uppercase tracking-wider"
                                        style={{ color: 'var(--workspace-primary-mid)' }}
                                    >
                                        {tx('dashboard.client.activeContracts', undefined, 'Active Contracts')}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/contracts')}
                                        className="text-[11px] font-semibold transition-colors"
                                        style={{ color: 'var(--workspace-primary)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--workspace-primary-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--workspace-primary)'}
                                    >
                                        {tx('dashboard.client.viewAll', undefined, 'View All')} -&gt;
                                    </button>
                                </header>

                                {isStatsLoading ? (
                                    <div className="p-5 space-y-2">
                                        <div className="animate-pulse h-12 rounded-lg" style={{ background: 'var(--color-bg-subtle)' }} />
                                    </div>
                                ) : activeContracts.length === 0 ? (
                                    <div 
                                        className="px-5 py-6 text-sm text-center"
                                        style={{ color: 'var(--color-text-tertiary)' }}
                                    >
                                        {tx('dashboard.client.noActiveContracts', undefined, 'No active contracts yet.')}
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {activeContracts.slice(0, 3).map((contract, index) => (
                                            <div
                                                key={contract.id}
                                                className={`px-5 py-3.5 hover:bg-[var(--color-bg-subtle)] transition-colors flex items-center justify-between gap-3 ${index < Math.min(activeContracts.length, 3) - 1 ? 'border-b' : ''}`}
                                                style={{ borderColor: 'var(--color-border-subtle)' }}
                                            >
                                                <div className="min-w-0">
                                                    <p 
                                                        className="text-sm font-semibold truncate"
                                                        style={{ color: 'var(--color-text-primary)' }}
                                                    >
                                                        {contract.title}
                                                    </p>
                                                    <p 
                                                        className="text-xs truncate mt-0.5"
                                                        style={{ color: 'var(--color-text-secondary)' }}
                                                    >
                                                        {contract.freelancer?.full_name || tx('dashboard.client.freelancerFallback', undefined, 'Freelancer')}
                                                    </p>
                                                </div>

                                                <div className="text-right shrink-0 flex items-center gap-3">
                                                    <p 
                                                        className="text-xs font-bold"
                                                        style={{ color: 'var(--color-text-primary)' }}
                                                    >
                                                        {formatCurrency(contract.total_amount ?? 0, true, language)}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/contracts/${contract.id}`)}
                                                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                                                        style={{ 
                                                            background: 'var(--color-bg-subtle)',
                                                            borderColor: 'var(--color-border-default)',
                                                            color: 'var(--color-text-primary)'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-muted)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
                                                    >
                                                        {tx('dashboard.client.openContract', undefined, 'Workspace')}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Right Column - Secondary Content & Widgets */}
                        <aside className="lg:col-span-4 flex flex-col gap-5 sticky top-20">
                            
                            {/* CTA Widget */}
                            <div 
                                className="relative overflow-hidden rounded-xl border p-5"
                                style={{ 
                                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, transparent)',
                                    background: 'radial-gradient(90% 160% at 0% 0%, color-mix(in srgb, var(--workspace-primary) 10%, transparent) 0%, transparent 48%), var(--color-bg-base)'
                                }}
                            >
                                <div 
                                    className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl"
                                    style={{ background: 'color-mix(in srgb, var(--workspace-primary) 20%, transparent)' }}
                                />

                                <div className="relative">
                                    <div 
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border"
                                        style={{ 
                                            borderColor: 'color-mix(in srgb, var(--workspace-primary) 30%, transparent)',
                                            background: 'var(--workspace-primary-dim)',
                                            color: 'var(--workspace-primary-mid)'
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </div>
                                    <h3 
                                        className="mt-3 text-lg font-bold leading-tight"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        {tx('dashboard.client.needSomethingDone', undefined, 'Need something done?')}
                                    </h3>
                                    <p 
                                        className="mt-1.5 text-xs"
                                        style={{ color: 'var(--color-text-secondary)' }}
                                    >
                                        {tx('dashboard.client.postProjectFree', undefined, 'Post a project free. Get proposals from verified Tunisian talent.')}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/jobs/new')}
                                        className="mt-4 w-full rounded-lg py-2 text-xs font-bold transition-colors"
                                        style={{ 
                                            background: 'var(--workspace-primary)',
                                            color: 'var(--workspace-primary-text)'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--workspace-primary-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--workspace-primary)'}
                                    >
                                        {tx('dashboard.client.postProjectFreeCta', undefined, "Post a project - it's free")}
                                    </button>
                                </div>
                            </div>

                            {/* Monthly Summary Widget */}
                            <div 
                                className="rounded-xl border bg-[var(--color-bg-base)] p-5"
                                style={{ borderColor: 'var(--color-border-subtle)' }}
                            >
                                <p 
                                    className="text-[10px] font-bold uppercase tracking-wider"
                                    style={{ color: 'var(--color-text-tertiary)' }}
                                >
                                    {tx('dashboard.client.thisMonth', undefined, 'This Month')}
                                </p>
                                <p 
                                    className="text-2xl font-black mt-1 leading-none"
                                    style={{ color: 'var(--color-text-primary)' }}
                                >
                                    {formatCurrency(statsData.monthlySpending, true, language)}
                                </p>

                                <p 
                                    className="text-[11px] mt-2"
                                    style={{ color: 'var(--color-text-tertiary)' }}
                                >
                                    {tx('dashboard.client.acrossActiveContracts', { count: statsData.activeContracts }, `Across ${statsData.activeContracts} active contracts`)}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigate('/wallet')}
                                    className="w-full mt-4 border py-2 rounded-lg text-xs font-bold transition-colors"
                                    style={{ 
                                        background: 'var(--color-bg-subtle)',
                                        borderColor: 'var(--color-border-default)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-muted)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
                                >
                                    {tx('dashboard.client.viewWallet', undefined, 'View Wallet')}
                                </button>
                            </div>

                            {/* Quick Actions */}
                            <div 
                                className="rounded-xl border bg-[var(--color-bg-base)] overflow-hidden"
                                style={{ borderColor: 'var(--color-border-subtle)' }}
                            >
                                <p 
                                    className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider"
                                    style={{ color: 'var(--color-text-tertiary)' }}
                                >
                                    {tx('dashboard.client.quickActions', undefined, 'Quick Actions')}
                                </p>
                                <div className="flex flex-col p-2 pt-0">
                                    {[
                                        {
                                            label: tx('nav.findFreelancers', undefined, 'Find Freelancers'),
                                            icon: Users,
                                            path: '/find-freelancers',
                                        },
                                        {
                                            label: tx('nav.myProjects', undefined, 'My Projects'),
                                            icon: FolderOpen,
                                            path: '/client/jobs',
                                        },
                                        {
                                            label: tx('nav.contracts', undefined, 'Contracts'),
                                            icon: Briefcase,
                                            path: '/contracts',
                                        },
                                        {
                                            label: tx('nav.messages', undefined, 'Messages'),
                                            icon: MessageSquare,
                                            path: '/messages',
                                        },
                                    ].map((action) => (
                                        <button
                                            key={action.label}
                                            type="button"
                                            onClick={() => navigate(action.path)}
                                            className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--color-bg-subtle)] transition-colors text-left"
                                        >
                                            <span 
                                                className="text-xs font-semibold"
                                                style={{ color: 'var(--color-text-secondary)' }}
                                            >
                                                {action.label}
                                            </span>
                                            <action.icon 
                                                className="h-3.5 w-3.5"
                                                style={{ color: 'var(--color-text-tertiary)' }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ClientDashboardPage;

