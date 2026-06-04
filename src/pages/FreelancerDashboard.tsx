import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Sparkles, User, Search, MessageSquare, ArrowRight } from "lucide-react";

import { Header } from "../components/layout";
import SEO, { SEO_CONFIG } from "../components/common/SEO";
import EmptyState from "../components/ui/EmptyState";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n";
import { dashboardQueryKeys } from "../lib/dashboardQueries";
import { ROUTES } from "../lib/routes";
import { supabase } from "../lib/supabase";
import { formatCurrency } from "../lib/currencyUtils";
import {
  DAILY_PROPOSAL_LIMIT,
  getDailyProposalUsage,
} from "../services/proposals";

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

type ContractRow = {
  id: string;
  jobTitle: string;
  clientName: string;
  submitPath: string;
};

type ProposalRow = {
  id: string;
  jobTitle: string;
  proposedRate: string;
  status: string;
};

function getTimeGreeting(tx: (key: string, params?: any, fallback?: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return tx('dashboard.greeting.morning', undefined, 'Good morning');
  if (hour < 18) return tx('dashboard.greeting.afternoon', undefined, 'Good afternoon');
  return tx('dashboard.greeting.evening', undefined, 'Good evening');
}

function proposalStatusLabel(
  status: string,
  tx: (key: string, params?: any, fallback?: string) => string,
) {
  if (status === "viewed") {
    return tx(
      "dashboard.freelancer.proposalStatus.viewed",
      undefined,
      "Viewed by Client",
    );
  }
  if (status === "shortlisted") {
    return tx(
      "dashboard.freelancer.proposalStatus.shortlisted",
      undefined,
      "Shortlisted",
    );
  }
  if (status === "pending") {
    return tx(
      "dashboard.freelancer.proposalStatus.submitted",
      undefined,
      "Submitted",
    );
  }

  return tx(`status.${status}`, undefined, status);
}

function proposalStatusClass(status: string) {
  if (status === "accepted" || status === "shortlisted") {
    return "border border-[color-mix(in_srgb,var(--color-status-success)_30%,transparent)] bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]";
  }
  if (status === "viewed") {
    return "border border-[color-mix(in_srgb,var(--color-status-info)_30%,transparent)] bg-[var(--color-status-info-bg)] text-[var(--color-status-info)]";
  }
  if (status === "rejected") {
    return "border border-[color-mix(in_srgb,var(--color-status-error)_30%,transparent)] bg-[var(--color-status-error-bg)] text-[var(--color-status-error)]";
  }
  return "border border-[color-mix(in_srgb,var(--workspace-primary)_30%,transparent)] bg-[var(--workspace-primary-dim)] text-[var(--workspace-primary-mid)]";
}

function formatJobBudget(
  job: MatchedJob,
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

  return "-";
}

function FreelancerDashboardPage() {
  const {
    profile,
    freelancerProfile,
    isLoading: isAuthLoading,
    isFullyReady,
  } = useAuth();
  const navigate = useNavigate();
  const { language, tx } = useTranslation();

  const locale = useMemo(() => {
    if (language === "ar") return "ar-TN";
    if (language === "fr") return "fr-FR";
    return "en-US";
  }, [language]);

  const { data: stats, isLoading } = useQuery({
    queryKey: dashboardQueryKeys.freelancerStats(profile?.id),
    enabled: !!profile?.id,
    queryFn: async (): Promise<DashboardStats> => {
      const userId = profile!.id;

      const [
        contractsCountRes,
        proposalsRes,
        walletRes,
        viewsRes,
        notificationsRes,
        recentProposalsRes,
        activeContractsListRes,
        milestonesRes,
      ] = await Promise.all([
        supabase
          .from("contracts")
          .select("id", { count: "exact", head: true })
          .eq("freelancer_id", userId)
          .eq("status", "active"),
        supabase
          .from("proposals")
          .select("id", { count: "exact", head: true })
          .eq("freelancer_id", userId)
          .eq("status", "pending"),
        supabase
          .from("wallets")
          .select("balance,pending_balance,total_earned")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("freelancer_profiles")
          .select("profile_views,title")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("notifications")
          .select("id,title,body,type,created_at")
          .eq("user_id", userId)
          .neq("type", "message")
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("proposals")
          .select(
            "id, status, bid_amount, created_at, job:jobs(id, title, category, status)",
          )
          .eq("freelancer_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("contracts")
          .select(
            "id, title, status, total_amount, client_id, created_at",
          )
          .eq("freelancer_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("milestones")
          .select(
            "id,description,due_date,amount,status,contract_id,contracts!inner(freelancer_id, status)",
          )
          .eq("contracts.freelancer_id", userId)
          .eq("contracts.status", "active")
          .eq("status", "pending")
          .order("due_date", { ascending: true })
          .limit(4),
      ]);

      const clientIds = new Set<string>();
      if (activeContractsListRes.data) {
        activeContractsListRes.data.forEach(c => {
            if (c.client_id) clientIds.add(c.client_id);
        });
      }

      const profilesById: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (clientIds.size > 0) {
          const { data: profilesData } = await supabase
              .from('public_profiles')
              .select('id, full_name, avatar_url')
              .in('id', Array.from(clientIds));
          
          profilesData?.forEach(p => {
              profilesById[p.id] = p;
          });
      }

      const activeContractsMapped = (activeContractsListRes.data ?? []).map(c => ({
          ...c,
          client: profilesById[c.client_id] || null
      }));

      return {
        activeContracts: contractsCountRes.count ?? 0,
        pendingProposals: proposalsRes.count ?? 0,
        totalEarnings: Number(walletRes.data?.total_earned ?? 0),
        walletBalance: Number(walletRes.data?.balance ?? 0),
        pendingBalance: Number(walletRes.data?.pending_balance ?? 0),
        profileViews: Number(viewsRes.data?.profile_views ?? 0),
        freelancerTitle: viewsRes.data?.title ?? null,
        notifications: (notificationsRes.data ?? []) as DashboardNotification[],
        milestones: (milestonesRes.data ?? []) as DashboardMilestone[],
        recentProposals: (recentProposalsRes.data ??
          []) as unknown as DashboardStats["recentProposals"],
        activeContractsList: activeContractsMapped as unknown as DashboardStats["activeContractsList"],
      };
    },
    staleTime: 60_000,
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ["freelancerEarningsChart", profile?.id, locale],
    enabled: !!profile?.id,
    queryFn: async () => {
      const monthFormatter = new Intl.DateTimeFormat(locale, {
        month: "short",
      });
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
        .from("transactions")
        .select("amount, created_at")
        .eq("user_id", profile!.id)
        .eq("type", "escrow_release")
        .eq("status", "completed")
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: true });

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
    queryKey: ["dashboard", "matched-jobs", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id,title,category,budget_min,budget_max")
        .eq("status", "open")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("freelancer matched jobs:", error);
        return [];
      }

      return (data ?? []) as MatchedJob[];
    },
    staleTime: 60_000,
  });

  const {
    data: dailyProposalUsage = {
      used: 0,
      remaining: DAILY_PROPOSAL_LIMIT,
      limit: DAILY_PROPOSAL_LIMIT,
    },
  } = useQuery({
    queryKey: ["dailyProposalUsage", profile?.id],
    queryFn: () => getDailyProposalUsage(profile!.id),
    enabled: !!profile?.id,
    staleTime: 60_000,
  });

  const recentProposals = stats?.recentProposals ?? [];
  const contracts = stats?.activeContractsList ?? [];
  const monthlyEarnings = chartData[chartData.length - 1]?.earnings ?? 0;
  const lastMonthEarnings = chartData[chartData.length - 2]?.earnings ?? 0;

  const ownFreelancerProfilePath = profile?.id
    ? `/freelancer/${profile.username || profile.id}`
    : ROUTES.settingsProfile;

  const checklist = [
    {
      label: tx(
        "dashboard.freelancer.checklist.avatar",
        undefined,
        "Avatar uploaded",
      ),
      done: !!profile?.avatar_url,
      path: "/settings?tab=profile",
    },
    {
      label: tx("dashboard.freelancer.checklist.bio", undefined, "Bio written"),
      done: (profile?.bio?.trim()?.length ?? 0) > 0,
      path: "/settings?tab=profile",
    },
    {
      label: tx(
        "dashboard.freelancer.checklist.skills",
        undefined,
        "Skills added",
      ),
      done: (freelancerProfile?.skills?.length ?? 0) > 0,
      path: "/settings?tab=profile",
    },
    {
      label: tx(
        "dashboard.freelancer.checklist.title",
        undefined,
        "Professional title",
      ),
      done: !!stats?.freelancerTitle,
      path: "/settings?tab=profile",
    },
    {
      label: tx(
        "dashboard.freelancer.checklist.identity",
        undefined,
        "Identity verified",
      ),
      done: !!profile?.cin_verified,
      path: "/verify-identity",
    },
    {
      label: tx(
        "dashboard.freelancer.checklist.tools",
        undefined,
        "Tools listed",
      ),
      done: (freelancerProfile?.tools?.length ?? 0) > 0,
      path: ownFreelancerProfilePath,
    },
    {
      label: tx(
        "dashboard.freelancer.checklist.preferences",
        undefined,
        "Project preferences",
      ),
      done:
        typeof freelancerProfile?.project_preferences === "object" &&
        freelancerProfile?.project_preferences !== null &&
        (("summary" in freelancerProfile.project_preferences &&
          typeof freelancerProfile.project_preferences.summary === "string" &&
          freelancerProfile.project_preferences.summary.trim().length > 10) ||
          ("bio" in freelancerProfile.project_preferences &&
            typeof freelancerProfile.project_preferences.bio === "string" &&
            freelancerProfile.project_preferences.bio.trim().length > 10)),
      path: ownFreelancerProfilePath,
    },
  ];

  const nextProfileFixPath =
    checklist.find((item) => !item.done)?.path || "/settings?tab=profile";

  const profileCompletion = Math.round(
    (checklist.filter((item) => item.done).length / checklist.length) * 100,
  );

  const completionValue = profileCompletion;
  const firstName = profile?.full_name?.split(" ")[0] || tx("common.freelancer", undefined, "Freelancer");
  const activeContractsCount = stats?.activeContracts ?? 0;
  const pendingProposalsCount = stats?.pendingProposals ?? 0;
  const profileViewsCount = stats?.profileViews ?? 0;
  const monthlyEarningsLabel = formatCurrency(monthlyEarnings, true, language);

  const activeContractRows = useMemo<ContractRow[]>(
    () =>
      contracts.slice(0, 3).map((contract) => ({
        id: contract.id,
        jobTitle: contract.title,
        clientName:
          contract.client?.full_name ||
          tx("dashboard.freelancer.clientFallback", undefined, "Client"),
        submitPath: `/contracts/${contract.id}`,
      })),
    [contracts, tx],
  );

  const proposalRows = useMemo<ProposalRow[]>(
    () =>
      recentProposals.slice(0, 4).map((proposal) => ({
        id: proposal.id,
        jobTitle:
          proposal.job?.title ||
          tx("dashboard.freelancer.untitledJob", undefined, "Untitled job"),
        proposedRate: formatCurrency(proposal.bid_amount ?? 0, true, language),
        status: proposal.status,
      })),
    [language, recentProposals, tx],
  );

  if (isAuthLoading || !isFullyReady) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)]">
        <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
        <Header />
        <main className="min-h-screen bg-[var(--color-bg-base)] pt-10 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
            <div className="animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] h-36" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-8">
                <div className="animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] h-72" />
                <div className="animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] h-64" />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] h-48" />
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
        <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
        <Header />
        <main className="min-h-screen bg-[var(--color-bg-base)] pt-10 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EmptyState
              icon={User}
              title={tx("dashboard.freelancer.profileUnavailable", undefined, "Profile unavailable")}
              description={tx(
                "dashboard.freelancer.profileUnavailableDesc",
                undefined,
                "We could not load your account profile yet. Please try again.",
              )}
              action={{
                label: tx("common.retry", undefined, "Retry"),
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
      <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
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
                {stats?.freelancerTitle && (
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    {stats.freelancerTitle}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.jobs)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:brightness-110 active:scale-95 shrink-0"
              style={{
                background: 'var(--workspace-primary)',
                boxShadow: '0 4px 14px -4px color-mix(in srgb, var(--workspace-primary) 60%, transparent)',
              }}
            >
              <Search className="w-4 h-4" />
              {tx('nav.findWork', undefined, 'Find Work')}
            </button>
          </div>

          {/* ── 4 STAT TILES ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className="rounded-2xl p-5 flex flex-col gap-2"
              style={{
                background: 'color-mix(in srgb, var(--workspace-primary) 10%, var(--color-bg-elevated))',
                boxShadow: '0 0 0 1px color-mix(in srgb, var(--workspace-primary) 22%, transparent)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'color-mix(in srgb, var(--workspace-primary) 75%, transparent)' }}>Applications</p>
                <FileText className="w-3.5 h-3.5" style={{ color: 'color-mix(in srgb, var(--workspace-primary) 50%, transparent)' }} />
              </div>
              <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: 'var(--workspace-primary)' }}>{dailyProposalUsage.remaining}</p>
              <p className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--workspace-primary) 60%, transparent)' }}>of {dailyProposalUsage.limit} left today</p>
            </div>

            <div className="rounded-2xl p-5 flex flex-col gap-2" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Contracts</p>
                <Briefcase className="w-3.5 h-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
              </div>
              <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>{activeContractsCount}</p>
              <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>active now</p>
            </div>

            <div className="rounded-2xl p-5 flex flex-col gap-2" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Proposals</p>
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
              </div>
              <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>{pendingProposalsCount}</p>
              <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>awaiting reply</p>
            </div>

            <div className="rounded-2xl p-5 flex flex-col gap-2" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Profile Views</p>
                <User className="w-3.5 h-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
              </div>
              <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>{profileViewsCount}</p>
              <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>total views</p>
            </div>
          </div>

          {/* ── TWO-COLUMN GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* LEFT: 8 cols */}
            <section className="lg:col-span-8 flex flex-col gap-5">

              {/* Active Contracts */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
                <div className="flex items-center justify-between px-5 pt-5 pb-4">
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {tx('dashboard.freelancer.activeContracts', undefined, 'Active Contracts')}
                  </h2>
                  <button type="button" onClick={() => navigate('/contracts')} className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: 'var(--workspace-primary)' }}>
                    View all <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {isLoading ? (
                  <div className="px-5 pb-5 space-y-3">{[1,2].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}</div>
                ) : activeContractRows.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 text-center px-5 pb-8 pt-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-bg-subtle)' }}>
                      <Briefcase className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No active contracts yet</p>
                    <button type="button" onClick={() => navigate(ROUTES.jobs)} className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all hover:brightness-110" style={{ background: 'var(--workspace-primary)' }}>
                      Browse Jobs
                    </button>
                  </div>
                ) : (
                  <div className="px-5 pb-5 flex flex-col gap-2">
                    {activeContractRows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => navigate(row.submitPath)}
                        className="group flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-150 hover:translate-x-0.5 active:scale-[0.99]"
                        style={{ background: 'var(--color-bg-base)', boxShadow: '0 0 0 1px var(--color-border-subtle)', borderLeft: '3px solid var(--workspace-primary)' }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{row.jobTitle}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-tertiary)' }}>with {row.clientName}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)', color: 'var(--workspace-primary)' }}>
                          Open <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Proposals */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
                <div className="flex items-center justify-between px-5 pt-5 pb-4">
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {tx('dashboard.freelancer.recentProposals', undefined, 'Recent Proposals')}
                  </h2>
                  <button type="button" onClick={() => navigate('/my-proposals')} className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: 'var(--workspace-primary)' }}>
                    View all <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {isLoading ? (
                  <div className="px-5 pb-5 space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}</div>
                ) : proposalRows.length === 0 ? (
                  <div className="px-5 pb-8 pt-2 text-center">
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No proposals submitted yet</p>
                  </div>
                ) : (
                  <div className="px-5 pb-5">
                    {proposalRows.map((row, index) => (
                      <div
                        key={row.id}
                        className={`flex items-center justify-between gap-3 py-3.5 ${index < proposalRows.length - 1 ? 'border-b' : ''}`}
                        style={{ borderColor: 'var(--color-border-subtle)' }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{row.jobTitle}</p>
                          <p className="text-xs mt-0.5 font-semibold" style={{ color: 'var(--workspace-primary)' }}>{row.proposedRate}</p>
                        </div>
                        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${proposalStatusClass(row.status)}`}>
                          {proposalStatusLabel(row.status, tx)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Matches */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
                <div className="flex items-center justify-between px-5 pt-5 pb-4">
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {tx('dashboard.freelancer.matchedForYou', undefined, 'Jobs For You')}
                    </h2>
                    {jobs.length > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                        {jobs.length} fresh match{jobs.length !== 1 ? 'es' : ''} right now
                      </p>
                    )}
                  </div>
                  <button type="button" onClick={() => navigate(ROUTES.jobs)} className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: 'var(--workspace-primary)' }}>
                    Browse all <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {isLoadingJobs ? (
                  <div className="px-5 pb-5 space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}</div>
                ) : jobs.length === 0 ? (
                  <div className="px-5 pb-8 pt-2 text-center">
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No new job matches right now</p>
                  </div>
                ) : (
                  <div className="px-5 pb-5 flex flex-col gap-2">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl"
                        style={{ background: 'var(--color-bg-base)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{job.title}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {job.category && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 9%, transparent)', color: 'var(--workspace-primary)' }}>
                                {tx(`categories.${job.category}`, undefined, job.category)}
                              </span>
                            )}
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                              {formatJobBudget(job, language)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="shrink-0 text-xs font-semibold px-3.5 py-2 rounded-lg text-white transition-all hover:brightness-110 active:scale-95"
                          style={{ background: 'var(--workspace-primary)' }}
                        >
                          Apply →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </section>

            {/* RIGHT: Sidebar 4 cols */}
            <aside className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20">

              {/* Earnings */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
                  {tx('dashboard.freelancer.earningsThisMonth', undefined, 'Earnings This Month')}
                </p>
                <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                  {monthlyEarningsLabel}
                </p>
                <div className="mt-4 space-y-2 border-t pt-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Last month</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(lastMonthEarnings, true, language)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--color-text-tertiary)' }}>In review</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(stats?.pendingBalance ?? 0, true, language)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/wallet')}
                  className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                  style={{ background: 'var(--workspace-primary)' }}
                >
                  {tx('dashboard.freelancer.withdrawFunds', undefined, 'Withdraw Funds')}
                </button>
              </div>

              {/* Daily Quota — segmented bar */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Daily Applications</p>
                  <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                    {dailyProposalUsage.used} / {dailyProposalUsage.limit}
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: dailyProposalUsage.limit }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-2 rounded-full transition-all duration-300"
                      style={{ background: i < dailyProposalUsage.used ? 'var(--workspace-primary)' : 'var(--color-border-subtle)' }}
                    />
                  ))}
                </div>
                <p className="text-[11px] mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                  {dailyProposalUsage.remaining} remaining today
                </p>
              </div>

              {/* Profile Completion Ring */}
              {profileCompletion < 100 && (
                <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
                    {tx('dashboard.freelancer.profileCompletion', undefined, 'Profile Strength')}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0">
                      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 100 100">
                        <circle stroke="var(--color-border-subtle)" strokeWidth="7" cx="50" cy="50" r="42" fill="transparent" />
                        <circle
                          stroke="var(--workspace-primary)" strokeWidth="7" strokeLinecap="round"
                          cx="50" cy="50" r="42" fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - completionValue / 100)}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{completionValue}%</span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {completionValue < 50 ? 'Getting started' : completionValue < 80 ? 'Almost there' : 'Nearly complete'}
                      </p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                        {checklist.filter(i => !i.done).length} item{checklist.filter(i => !i.done).length !== 1 ? 's' : ''} remaining
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(nextProfileFixPath)}
                        className="mt-2 text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
                        style={{ color: 'var(--workspace-primary)' }}
                      >
                        Complete profile <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', boxShadow: '0 0 0 1px var(--color-border-subtle)' }}>
                <p className="px-5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                  {tx('dashboard.freelancer.quickActions', undefined, 'Quick Links')}
                </p>
                <div className="pb-2">
                  {[
                    { label: tx('nav.findWork', undefined, 'Find Work'), icon: Search, path: ROUTES.jobs },
                    { label: tx('nav.contracts', undefined, 'Contracts'), icon: Briefcase, path: ROUTES.contracts },
                    { label: tx('nav.messages', undefined, 'Messages'), icon: MessageSquare, path: ROUTES.messages },
                    { label: tx('dashboard.freelancer.myProposals', undefined, 'My Proposals'), icon: FileText, path: ROUTES.myProposals },
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

export default FreelancerDashboardPage;