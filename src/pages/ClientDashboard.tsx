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
    ArrowRight,
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
    <div className="min-h-screen" style={{ background: 'var(--color-bg-base)' }}>
      <SEO {...SEO_CONFIG.dashboard} url="/client/dashboard" noIndex />
      <Header />

      <main className="pt-8 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-7">

          {/* ── HERO ROW ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={firstName}
                  className="h-14 w-14 rounded-full object-cover shrink-0"
                  style={{ boxShadow: '0 0 0 3px var(--color-bg-base), 0 0 0 5px color-mix(in srgb, var(--workspace-primary) 40%, transparent)' }}
                />
              ) : (
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center shrink-0 text-xl font-bold"
                  style={{
                    background: 'color-mix(in srgb, var(--workspace-primary) 12%, var(--color-bg-elevated))',
                    color: 'var(--workspace-primary)',
                    boxShadow: '0 0 0 3px var(--color-bg-base), 0 0 0 5px color-mix(in srgb, var(--workspace-primary) 40%, transparent)',
                  }}
                >
                  {firstName[0]}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--workspace-primary)' }}>
                  {getTimeGreeting(tx)}
                </p>
                <h1 className="text-2xl font-bold tracking-tight leading-none" style={{ color: 'var(--color-text-primary)' }}>
                  {firstName}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {tx('dashboard.client.commandCenterSubtitle', undefined, 'Track projects, proposals, and spending.')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/jobs/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110 active:scale-95 shrink-0"
              style={{
                background: 'var(--workspace-primary)',
                boxShadow: '0 4px 14px -4px color-mix(in srgb, var(--workspace-primary) 60%, transparent)',
              }}
            >
              <Plus className="w-4 h-4" />
              {tx('dashboard.client.postAProject', undefined, 'Post a Project')}
            </button>
          </div>

          {/* ── 4 STAT TILES ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Projects */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-10px_color-mix(in_srgb,var(--workspace-primary)_35%,transparent)]"
              style={{
                background: 'color-mix(in srgb, var(--workspace-primary) 8%, var(--color-bg-elevated))',
                boxShadow: '0 0 0 1px color-mix(in srgb, var(--workspace-primary) 20%, transparent)',
                borderLeft: '4px solid var(--workspace-primary)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'color-mix(in srgb, var(--workspace-primary) 85%, transparent)' }}>Total Projects</p>
                <FolderOpen className="w-4 h-4" style={{ color: 'var(--workspace-primary)' }} />
              </div>
              <p className="text-3xl font-extrabold tabular-nums leading-none mt-1" style={{ color: 'var(--workspace-primary)' }}>{statsData.totalJobs}</p>
              <p className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--workspace-primary) 70%, transparent)' }}>projects posted</p>
            </div>

            {/* Card 2: Active Projects */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-10px_color-mix(in_srgb,var(--color-status-info)_35%,transparent)]"
              style={{
                background: 'color-mix(in srgb, var(--color-status-info) 8%, var(--color-bg-elevated))',
                boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-status-info) 20%, transparent)',
                borderLeft: '4px solid var(--color-status-info)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'color-mix(in srgb, var(--color-status-info) 85%, transparent)' }}>Active</p>
                <Sparkles className="w-4 h-4" style={{ color: 'var(--color-status-info)' }} />
              </div>
              <p className="text-3xl font-extrabold tabular-nums leading-none mt-1" style={{ color: 'var(--color-status-info)' }}>{statsData.activeJobs}</p>
              <p className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--color-status-info) 70%, transparent)' }}>open & in progress</p>
            </div>

            {/* Card 3: Proposals */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-10px_color-mix(in_srgb,var(--color-status-warning)_35%,transparent)]"
              style={{
                background: 'color-mix(in srgb, var(--color-status-warning) 8%, var(--color-bg-elevated))',
                boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-status-warning) 20%, transparent)',
                borderLeft: '4px solid var(--color-status-warning)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'color-mix(in srgb, var(--color-status-warning) 85%, transparent)' }}>Proposals</p>
                <FileText className="w-4 h-4" style={{ color: 'var(--color-status-warning)' }} />
              </div>
              <p className="text-3xl font-extrabold tabular-nums leading-none mt-1" style={{ color: 'var(--color-status-warning)' }}>{statsData.totalProposals}</p>
              <p className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--color-status-warning) 70%, transparent)' }}>received total</p>
            </div>

            {/* Card 4: Total Spent */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-10px_color-mix(in_srgb,var(--color-status-success)_35%,transparent)]"
              style={{
                background: 'color-mix(in srgb, var(--color-status-success) 8%, var(--color-bg-elevated))',
                boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-status-success) 20%, transparent)',
                borderLeft: '4px solid var(--color-status-success)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'color-mix(in srgb, var(--color-status-success) 85%, transparent)' }}>Total Spent</p>
                <Briefcase className="w-4 h-4" style={{ color: 'var(--color-status-success)' }} />
              </div>
              <p className="text-3xl font-extrabold tabular-nums leading-none mt-1" style={{ color: 'var(--color-status-success)' }}>{formatCurrency(statsData.totalSpent, true, language)}</p>
              <p className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--color-status-success) 70%, transparent)' }}>across all projects</p>
            </div>
          </div>

          {/* ── TWO-COLUMN GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* LEFT: 8 cols */}
            <section className="lg:col-span-8 flex flex-col gap-5">

              {/* Your Projects */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
                <div className="flex items-center justify-between px-5 pt-5 pb-4">
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {tx('dashboard.client.activeProjects', undefined, 'Your Projects')}
                  </h2>
                  <button type="button" onClick={() => navigate('/client/jobs')} className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: 'var(--workspace-primary)' }}>
                    View all <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {isStatsLoading ? (
                  <div className="px-5 pb-5 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}</div>
                ) : jobs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 text-center px-5 pb-8 pt-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-bg-subtle)' }}>
                      <FolderOpen className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No projects yet</p>
                    <button type="button" onClick={() => navigate('/jobs/new')} className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all hover:brightness-110" style={{ background: 'var(--workspace-primary)' }}>
                      Post your first project
                    </button>
                  </div>
                ) : (
                  <div className="px-5 pb-5 flex flex-col gap-2">
                    {jobs.slice(0, 4).map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => {
                          const activeContract = job.contracts?.find((c: any) => {
                            const s = String(c.status || '').toLowerCase();
                            return s === 'active' || s === 'in_progress' || s === 'pending_payment';
                          });
                          if (activeContract) {
                            navigate(`/workspace/${activeContract.id}`, {
                              state: { otherUserId: activeContract.freelancer_id || null },
                            });
                          } else {
                            navigate(`/client/jobs/${job.id}/proposals`);
                          }
                        }}
                        className="group flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-150 hover:translate-x-0.5 active:scale-[0.99]"
                        style={{
                          background: 'var(--color-bg-base)',
                          boxShadow: '0 0 0 1px var(--color-border-subtle)',
                          borderLeft: `3px solid ${job.status === 'open' ? 'var(--workspace-primary)' : job.status === 'in_progress' ? 'var(--color-status-info)' : 'var(--color-status-success)'}`,
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{job.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{formatBudgetRange(job, language)}</span>
                            <span style={{ color: 'var(--color-border-default)' }}>·</span>
                            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{formatDate(job.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {job.proposals_count > 0 && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 9%, transparent)', color: 'var(--workspace-primary)' }}>
                              {job.proposals_count} proposal{job.proposals_count !== 1 ? 's' : ''}
                            </span>
                          )}
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${jobStatusClass(job.status)}`}>
                            {tx(`status.${job.status}`, undefined, job.status)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Proposals to Review */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
                <div className="flex items-center justify-between px-5 pt-5 pb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {tx('dashboard.client.recentProposals', undefined, 'Proposals to Review')}
                    </h2>
                    {proposalsWaitingReview > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)', color: 'var(--workspace-primary)' }}>
                        {proposalsWaitingReview} pending
                      </span>
                    )}
                  </div>
                  <button type="button" onClick={() => navigate('/client/jobs')} className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: 'var(--workspace-primary)' }}>
                    View all <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {isStatsLoading ? (
                  <div className="px-5 pb-5 space-y-2">{[1,2].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}</div>
                ) : proposals.length === 0 ? (
                  <div className="px-5 pb-8 pt-2 text-center">
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No proposals yet — post a project to receive them</p>
                  </div>
                ) : (
                  <div className="px-5 pb-5 flex flex-col gap-2">
                    {proposals.slice(0, 4).map((proposal) => (
                      <div
                        key={proposal.id}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-xl"
                        style={{ background: 'var(--color-bg-base)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="h-9 w-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-bold"
                            style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, var(--color-bg-elevated))', color: 'var(--workspace-primary)' }}
                          >
                            {proposal.freelancer?.avatar_url ? (
                              <img src={proposal.freelancer.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              (proposal.freelancer?.full_name?.[0] || 'F')
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                              {proposal.freelancer?.full_name || tx('dashboard.client.freelancerFallback', undefined, 'Freelancer')}
                            </p>
                            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                              {proposal.job?.title || tx('dashboard.client.untitledJob', undefined, 'Untitled job')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                            {formatCurrency(proposal.bid_amount ?? 0, true, language)}
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate(`/client/jobs/${proposal.job_id}/proposals`)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:brightness-110 text-white"
                            style={{ background: 'var(--workspace-primary)' }}
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Contracts */}
              {activeContracts.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
                  <div className="flex items-center justify-between px-5 pt-5 pb-4">
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {tx('dashboard.client.activeContracts', undefined, 'Active Contracts')}
                    </h2>
                    <button type="button" onClick={() => navigate('/contracts')} className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: 'var(--workspace-primary)' }}>
                      View all <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="px-5 pb-5 flex flex-col gap-2">
                    {activeContracts.slice(0, 3).map((contract) => (
                      <button
                        key={contract.id}
                        type="button"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                        className="group flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-150 hover:translate-x-0.5"
                        style={{ background: 'var(--color-bg-base)', boxShadow: '0 0 0 1px var(--color-border-subtle)', borderLeft: '3px solid var(--color-status-info)' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-bold" style={{ background: 'color-mix(in srgb, var(--color-status-info) 10%, var(--color-bg-elevated))', color: 'var(--color-status-info)' }}>
                            {contract.freelancer?.avatar_url ? <img src={contract.freelancer.avatar_url} alt="" className="h-full w-full object-cover" /> : (contract.freelancer?.full_name?.[0] || 'F')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{contract.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{contract.freelancer?.full_name || 'Freelancer'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(contract.total_amount ?? 0, true, language)}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--workspace-primary)' }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </section>

            {/* RIGHT: Sidebar 4 cols */}
            <aside className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20">

              {/* Spending Card */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Total Spent</p>
                <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(statsData.totalSpent, true, language)}
                </p>
                <div className="mt-4 pt-3 border-t space-y-2" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Active contracts</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{statsData.activeContracts}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Completed</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{stats?.completedContracts ?? 0}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/wallet')}
                  className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
                  style={{ background: 'var(--color-bg-base)', boxShadow: '0 0 0 1px var(--color-border-subtle)', color: 'var(--color-text-primary)' }}
                >
                  {tx('dashboard.client.viewWallet', undefined, 'View Wallet')}
                </button>
              </div>

              {/* Post a Project CTA */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'linear-gradient(135deg, var(--workspace-primary) 0%, color-mix(in srgb, var(--workspace-primary) 80%, #000) 100%)',
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Get it done</p>
                <p className="text-base font-bold leading-snug text-white mb-1">
                  Need something done?
                </p>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Post a project free and get proposals from verified Tunisian talent.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/jobs/new')}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  {tx('dashboard.client.postAProject', undefined, 'Post a Project')} — It's free
                </button>
              </div>

              {/* Quick Links */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
                <p className="px-5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Quick Links</p>
                <div className="pb-2">
                  {[
                    { label: tx('nav.findFreelancers', undefined, 'Find Freelancers'), icon: Users, path: '/find-freelancers' },
                    { label: tx('dashboard.client.activeProjects', undefined, 'My Jobs'), icon: FolderOpen, path: '/client/jobs' },
                    { label: tx('nav.contracts', undefined, 'Contracts'), icon: Briefcase, path: '/contracts' },
                    { label: tx('nav.messages', undefined, 'Messages'), icon: MessageSquare, path: '/messages' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => navigate(action.path)}
                      className="group w-full flex items-center justify-between px-5 py-3 transition-all duration-150"
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-subtle)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span className="flex items-center gap-3 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        <action.icon className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                        {action.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--workspace-primary)' }} />
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
