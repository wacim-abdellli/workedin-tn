import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Sparkles, User, Search, MessageSquare } from "lucide-react";

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
    return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
  if (status === "viewed") {
    return "border border-blue-500/30 bg-blue-500/10 text-blue-300";
  }
  if (status === "rejected") {
    return "border border-rose-500/30 bg-rose-500/10 text-rose-300";
  }
  return "border border-violet-500/30 bg-violet-500/10 text-violet-300";
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
            "id, title, status, total_amount, client:public_profiles!contracts_client_id_fkey(id, full_name, avatar_url)",
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
        activeContractsList: (activeContractsListRes.data ??
          []) as unknown as DashboardStats["activeContractsList"],
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
  const firstName = profile?.full_name?.split(" ")[0] || "Freelancer";
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
            <div className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.02] h-36" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-8">
                <div className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.02] h-72" />
                <div className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.02] h-64" />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.02] h-48" />
                <div className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.02] h-64" />
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
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
      <Header />

      <main className="min-h-screen bg-[var(--color-bg-base)] pt-6 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-5">
          {/* ── COMMAND CENTER BANNER ── */}
          <section className="relative overflow-hidden border rounded-xl bg-[radial-gradient(90%_160%_at_0%_0%,rgba(139,92,246,0.12)_0%,transparent_48%),#0a0a0a]" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
            <div className="pointer-events-none absolute -top-8 right-8 h-20 w-20 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 p-5">
              <div className="min-w-0 flex items-center gap-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={firstName}
                    className="h-12 w-12 rounded-full border border-white/10 object-cover ring-2 ring-violet-500/20"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full border border-white/10 bg-[var(--color-bg-elevated)] flex items-center justify-center ring-2 ring-violet-500/20">
                    <User className="h-5 w-5 text-violet-300" />
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300/80">
                      {tx("dashboard.freelancer.commandCenter", undefined, "Freelancer Dashboard")}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate text-white leading-none">
                    {tx("dashboard.freelancer.welcomeBack", undefined, "Welcome back")}, {firstName}
                  </h1>
                  <p className="text-xs text-white/50 mt-1.5 truncate">
                    {tx(
                      "dashboard.freelancer.matchingHint",
                      { count: jobs.length },
                      `${jobs.length} fresh job matches are currently visible for you.`,
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-row items-center gap-3 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide shrink-0">
                <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 min-w-[120px]">
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-0.5">
                    {tx("dashboard.freelancer.dailyApplicationsRemaining", undefined, "Applications")}
                  </p>
                  <p className="text-lg font-black text-white">{dailyProposalUsage.remaining}</p>
                </div>

                <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 min-w-[120px]">
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-0.5">
                    {tx("dashboard.freelancer.activeContracts", undefined, "Contracts")}
                  </p>
                  <p className="text-lg font-black text-white">{activeContractsCount}</p>
                </div>

                <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 min-w-[120px]">
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-0.5">
                    {tx("dashboard.freelancer.pendingProposals", undefined, "Pending")}
                  </p>
                  <p className="text-lg font-black text-white">{pendingProposalsCount}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── MAIN CONTENT GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column - Primary Content */}
            <section className="lg:col-span-8 flex flex-col gap-5">
              
              {/* Active Contracts */}
              <div className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] overflow-hidden flex flex-col">
                <header className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-violet-300">
                    {tx("dashboard.freelancer.activeContracts", undefined, "Active Contracts")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate("/contracts")}
                    className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    {tx("dashboard.freelancer.viewAll", undefined, "View All")} -&gt;
                  </button>
                </header>

                {isLoading ? (
                  <div className="p-5 space-y-2">
                    <div className="animate-pulse h-12 rounded-lg bg-white/5" />
                    <div className="animate-pulse h-12 rounded-lg bg-white/5" />
                  </div>
                ) : activeContractRows.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-white/40 text-center">
                    {tx("dashboard.freelancer.noActiveContracts", undefined, "No active contracts yet.")}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {activeContractRows.map((row, index) => (
                      <div
                        key={row.id}
                        className={`px-5 py-3.5 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3 ${index < activeContractRows.length - 1 ? "border-b border-white/5" : ""}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{row.jobTitle}</p>
                          <p className="text-xs text-white/50 truncate mt-0.5">{row.clientName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(row.submitPath)}
                          className="shrink-0 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                        >
                          {tx("dashboard.freelancer.submitWork", undefined, "Workspace")}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Proposals */}
              <div className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] overflow-hidden flex flex-col">
                <header className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-violet-300">
                    {tx("dashboard.freelancer.recentProposals", undefined, "Recent Proposals")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate("/my-proposals")}
                    className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    {tx("dashboard.freelancer.viewAll", undefined, "View All")} -&gt;
                  </button>
                </header>

                {isLoading ? (
                  <div className="p-5 space-y-2">
                    <div className="animate-pulse h-10 rounded-lg bg-white/5" />
                    <div className="animate-pulse h-10 rounded-lg bg-white/5" />
                  </div>
                ) : proposalRows.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-white/40 text-center">
                    {tx("dashboard.freelancer.noProposalsYet", undefined, "No proposals yet.")}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {proposalRows.map((row, index) => (
                      <div
                        key={row.id}
                        className={`px-5 py-3 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3 ${index < proposalRows.length - 1 ? "border-b border-white/5" : ""}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white/90 truncate">{row.jobTitle}</p>
                          <p className="text-[11px] text-white/50 mt-0.5">{row.proposedRate}</p>
                        </div>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${proposalStatusClass(row.status)}`}
                        >
                          {proposalStatusLabel(row.status, tx)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matched Jobs */}
              <div className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] overflow-hidden flex flex-col">
                <header className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-violet-300">
                    {tx("dashboard.freelancer.matchedForYou", undefined, "Matched Jobs")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.jobs)}
                    className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    {tx("dashboard.freelancer.browseJobs", undefined, "Browse")} -&gt;
                  </button>
                </header>

                {isLoadingJobs ? (
                  <div className="p-5 space-y-2">
                    <div className="animate-pulse h-12 rounded-lg bg-white/5" />
                    <div className="animate-pulse h-12 rounded-lg bg-white/5" />
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-white/40 text-center">
                    {tx("dashboard.freelancer.noMatchesYet", undefined, "No new job matches right now.")}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {jobs.map((job, index) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className={`w-full text-left px-5 py-3.5 hover:bg-white/[0.02] transition-colors ${index < jobs.length - 1 ? "border-b border-white/5" : ""}`}
                      >
                        <p className="text-sm font-semibold text-white/90 truncate">{job.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                          <span>
                            {job.category
                              ? tx(`categories.${job.category}`, undefined, job.category)
                              : tx("common.general", undefined, "General")}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="font-medium text-white/70">{formatJobBudget(job, language)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Right Column - Secondary Content & Widgets */}
            <aside className="lg:col-span-4 flex flex-col gap-5 sticky top-20">
              
              {/* Earnings Widget */}
              <div className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  {tx("dashboard.freelancer.earningsThisMonth", undefined, "Earnings this month")}
                </p>
                <p className="text-2xl font-black text-white mt-1 leading-none">{monthlyEarningsLabel}</p>

                <p className="text-[11px] text-white/40 mt-2">
                  {tx(
                    "dashboard.freelancer.lastMonthReference",
                    { value: formatCurrency(lastMonthEarnings, true, language) },
                    `Last month: ${formatCurrency(lastMonthEarnings, true, language)}`,
                  )}
                  <br />
                  {tx(
                    "dashboard.freelancer.pendingBalanceReference",
                    { value: formatCurrency(stats?.pendingBalance ?? 0, true, language) },
                    `Pending: ${formatCurrency(stats?.pendingBalance ?? 0, true, language)}`,
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/wallet")}
                  className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  {tx("dashboard.freelancer.withdrawFunds", undefined, "Withdraw Funds")}
                </button>
              </div>

              {/* Profile Completion Widget */}
              {profileCompletion < 100 && (
                <div className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-4">
                    {tx("dashboard.freelancer.profileCompletion", undefined, "Profile Completion")}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0">
                      <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 100 100">
                        <circle
                          className="text-white/5 stroke-current"
                          strokeWidth="8"
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                        />
                        <circle
                          className="text-violet-500 stroke-current transition-all duration-1000 ease-out"
                          strokeWidth="8"
                          strokeLinecap="round"
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - profileCompletion / 100)}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{profileCompletion}%</span>
                      </div>
                    </div>
                    
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white/90">
                        {tx("dashboard.freelancer.completeProfileLabel", undefined, "Complete your profile")}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/profile")}
                        className="mt-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium transition-colors"
                      >
                        {tx("dashboard.freelancer.editProfileLink", undefined, "Edit profile")} -&gt;
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] overflow-hidden">
                <p className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
                  {tx("dashboard.freelancer.quickActions", undefined, "Quick Actions")}
                </p>
                <div className="flex flex-col p-2 pt-0">
                  {[
                    {
                      label: tx("nav.findWork", undefined, "Find Work"),
                      icon: Search,
                      path: ROUTES.jobs,
                    },
                    {
                      label: tx("nav.contracts", undefined, "Contracts"),
                      icon: Briefcase,
                      path: ROUTES.contracts,
                    },
                    {
                      label: tx("nav.messages", undefined, "Messages"),
                      icon: MessageSquare,
                      path: ROUTES.messages,
                    },
                    {
                      label: tx("dashboard.freelancer.myProposals", undefined, "My Proposals"),
                      icon: FileText,
                      path: ROUTES.myProposals,
                    },
                  ].map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => navigate(action.path)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors text-left"
                    >
                      <span className="text-xs font-semibold text-white/80">{action.label}</span>
                      <action.icon className="h-3.5 w-3.5 text-white/30" />
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


