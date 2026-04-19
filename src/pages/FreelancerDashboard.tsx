import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Sparkles, User } from "lucide-react";

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
  return "border border-purple-500/30 bg-purple-500/10 text-purple-300";
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
      <div className="min-h-screen page-bg-base">
        <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
        <Header />
        <main className="min-h-screen page-bg-base pt-10 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
            <div className="animate-pulse rounded-2xl border border-surface surface-card h-36" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-8">
                <div className="animate-pulse rounded-2xl border border-surface surface-card h-72" />
                <div className="animate-pulse rounded-2xl border border-surface surface-card h-64" />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="animate-pulse rounded-2xl border border-surface surface-card h-48" />
                <div className="animate-pulse rounded-2xl border border-surface surface-card h-64" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile?.id) {
    return (
      <div className="min-h-screen page-bg-base">
        <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
        <Header />
        <main className="min-h-screen page-bg-base pt-10 pb-12">
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
    <div className="min-h-screen page-bg-base">
      <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
      <Header />

      <main className="min-h-screen page-bg-base pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
          <section className="relative overflow-hidden border border-surface rounded-2xl bg-[var(--color-bg-elevated)] p-5 sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_160%_at_0%_0%,rgba(168,85,247,0.22)_0%,transparent_48%),radial-gradient(75%_140%_at_100%_0%,rgba(88,28,135,0.28)_0%,transparent_52%)]" />
            <div className="pointer-events-none absolute -top-10 right-8 h-28 w-28 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  {tx("dashboard.freelancer.commandCenter", undefined, "Freelancer Command Center")}
                </div>

                <div className="mt-4 flex items-center gap-4 min-w-0">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={firstName}
                      className="h-14 w-14 rounded-full border border-[#383838] object-cover ring-2 ring-purple-500/30"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full border border-[#383838] bg-[#161616] flex items-center justify-center ring-2 ring-purple-500/30">
                      <User className="h-6 w-6 text-purple-300" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate text-white">
                      {tx("dashboard.freelancer.welcomeBack", undefined, "Welcome back")}, {firstName}
                    </h1>
                    <p className="text-purple-200/80 text-sm mt-1">
                      {tx(
                        "dashboard.freelancer.commandCenterSubtitle",
                        undefined,
                        "Here is what's happening with your freelance business today.",
                      )}
                    </p>
                    <p className="text-xs text-purple-200/60 mt-1">
                      {tx(
                        "dashboard.freelancer.matchingHint",
                        { count: jobs.length },
                        `${jobs.length} fresh job matches are currently visible for you.`,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[440px]">
                <div className="rounded-xl border border-[#2f2f2f] bg-[#101010]/90 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-purple-200/60">
                    {tx(
                      "dashboard.freelancer.dailyApplicationsRemaining",
                      undefined,
                      "Applications left today",
                    )}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-white">{dailyProposalUsage.remaining}</p>
                </div>

                <div className="rounded-xl border border-[#2f2f2f] bg-[#101010]/90 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-purple-200/60">
                    {tx("dashboard.freelancer.activeContracts", undefined, "Active Contracts")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-white">{activeContractsCount}</p>
                </div>

                <div className="rounded-xl border border-[#2f2f2f] bg-[#101010]/90 px-4 py-3 col-span-2 sm:col-span-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-purple-200/60">
                    {tx("dashboard.freelancer.pendingProposals", undefined, "Pending Proposals")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-white">{pendingProposalsCount}</p>
                </div>
              </div>
            </div>

            <div className="relative mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-xs text-purple-200/90">
                {tx("dashboard.freelancer.profileViews", undefined, "Profile Views")}: {profileViewsCount}
              </span>
              <button
                type="button"
                onClick={() => navigate(ROUTES.jobs)}
                className="inline-flex items-center rounded-full border border-[#323232] bg-[#111111] px-3 py-1 text-xs font-medium text-purple-200 hover:border-purple-500/40 hover:text-purple-100 transition-colors"
              >
                {tx("dashboard.freelancer.browseJobs", undefined, "Browse Jobs")}
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <section className="lg:col-span-8">
              <section className="surface-card border border-surface rounded-2xl flex flex-col overflow-hidden mb-8">
                <header className="px-6 py-4 border-b border-surface flex justify-between items-center">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-purple-300">
                    {tx("dashboard.freelancer.activeContracts", undefined, "Active Contracts")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate("/contracts")}
                    className="text-sm text-purple-500 hover:text-purple-400 transition-colors"
                  >
                    {tx("dashboard.freelancer.viewAll", undefined, "View All")} -&gt;
                  </button>
                </header>

                {isLoading ? (
                  <div className="p-6 space-y-3">
                    <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-surface" />
                    <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-surface" />
                    <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-surface" />
                  </div>
                ) : activeContractRows.length === 0 ? (
                  <div className="px-6 py-8 text-sm text-purple-200/70">
                    {tx(
                      "dashboard.freelancer.noActiveContracts",
                      undefined,
                      "No active contracts yet.",
                    )}
                  </div>
                ) : (
                  <div>
                    {activeContractRows.map((row, index) => (
                      <div
                        key={row.id}
                        className={`px-6 py-4 hover:bg-[#262626]/30 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${index < activeContractRows.length - 1 ? "border-b border-surface" : ""}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{row.jobTitle}</p>
                          <p className="text-xs text-purple-300/70 mt-1 truncate">{row.clientName}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(row.submitPath)}
                          className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
                        >
                          {tx("dashboard.freelancer.submitWork", undefined, "Submit Work")}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="surface-card border border-surface rounded-2xl flex flex-col overflow-hidden">
                <header className="px-6 py-4 border-b border-surface flex justify-between items-center">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-purple-300">
                    {tx("dashboard.freelancer.recentProposals", undefined, "Recent Proposals")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate("/my-proposals")}
                    className="text-sm text-purple-500 hover:text-purple-400 transition-colors"
                  >
                    {tx("dashboard.freelancer.viewAll", undefined, "View All")} -&gt;
                  </button>
                </header>

                {isLoading ? (
                  <div className="p-6 space-y-3">
                    <div className="animate-pulse h-12 rounded-lg bg-[#1b1b1b] border border-surface" />
                    <div className="animate-pulse h-12 rounded-lg bg-[#1b1b1b] border border-surface" />
                    <div className="animate-pulse h-12 rounded-lg bg-[#1b1b1b] border border-surface" />
                  </div>
                ) : proposalRows.length === 0 ? (
                  <div className="px-6 py-8 text-sm text-purple-200/70">
                    {tx(
                      "dashboard.freelancer.noProposalsYet",
                      undefined,
                      "No proposals yet.",
                    )}
                  </div>
                ) : (
                  <div>
                    {proposalRows.map((row, index) => (
                      <div
                        key={row.id}
                        className={`px-6 py-3 hover:bg-[#262626]/30 transition-colors flex items-center justify-between gap-3 ${index < proposalRows.length - 1 ? "border-b border-surface" : ""}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{row.jobTitle}</p>
                          <p className="text-xs text-purple-300/70 mt-1">{row.proposedRate}</p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${proposalStatusClass(row.status)}`}
                        >
                          {proposalStatusLabel(row.status, tx)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="surface-card border border-surface rounded-2xl flex flex-col overflow-hidden mt-8">
                <header className="px-6 py-4 border-b border-surface flex justify-between items-center">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-purple-300">
                    {tx("dashboard.freelancer.matchedForYou", undefined, "Matched Jobs")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.jobs)}
                    className="text-sm text-purple-500 hover:text-purple-400 transition-colors"
                  >
                    {tx("dashboard.freelancer.viewAll", undefined, "View All")} -&gt;
                  </button>
                </header>

                {isLoadingJobs ? (
                  <div className="p-6 space-y-3">
                    <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-surface" />
                    <div className="animate-pulse h-14 rounded-lg bg-[#1b1b1b] border border-surface" />
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="px-6 py-8 text-sm text-purple-200/70">
                    {tx(
                      "dashboard.freelancer.noMatchesYet",
                      undefined,
                      "No new job matches right now.",
                    )}
                  </div>
                ) : (
                  <div>
                    {jobs.map((job, index) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className={`w-full text-left px-6 py-4 hover:bg-[#262626]/30 transition-colors ${index < jobs.length - 1 ? "border-b border-surface" : ""}`}
                      >
                        <p className="text-sm font-semibold text-white truncate">{job.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-purple-300/70">
                          <span>
                            {job.category
                              ? tx(`categories.${job.category}`, undefined, job.category)
                              : tx("common.general", undefined, "General")}
                          </span>
                          <span className="text-purple-400/50">•</span>
                          <span>{formatJobBudget(job, language)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="surface-card border border-surface rounded-2xl p-6 mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-purple-300">
                  {tx("dashboard.freelancer.performanceSnapshot", undefined, "Performance Snapshot")}
                </h2>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-surface bg-[#101010] p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-purple-300/60">
                      {tx("dashboard.freelancer.pendingProposals", undefined, "Pending Proposals")}
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">{stats?.pendingProposals ?? 0}</p>
                  </div>

                  <div className="rounded-xl border border-surface bg-[#101010] p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-purple-300/60">
                      {tx("dashboard.freelancer.profileViews", undefined, "Profile Views")}
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">{stats?.profileViews ?? 0}</p>
                  </div>

                  <div className="rounded-xl border border-surface bg-[#101010] p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-purple-300/60">
                      {tx("dashboard.freelancer.walletBalance", undefined, "Wallet Balance")}
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">
                      {formatCurrency(stats?.walletBalance ?? 0, true, language)}
                    </p>
                  </div>
                </div>
              </section>
            </section>

            <aside className="lg:col-span-4">
              <div className="flex flex-col gap-6 sticky top-28">
                <section className="surface-card border border-surface rounded-2xl p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-purple-300">
                    {tx("dashboard.freelancer.earningsThisMonth", undefined, "Earnings this month")}
                  </p>
                  <p className="text-3xl font-black text-white mt-2">{monthlyEarningsLabel}</p>

                  <p className="text-xs text-purple-300/70 mt-2">
                    {tx(
                      "dashboard.freelancer.lastMonthReference",
                      { value: formatCurrency(lastMonthEarnings, true, language) },
                      `Last month: ${formatCurrency(lastMonthEarnings, true, language)}`,
                    )}
                  </p>

                  <p className="text-xs text-purple-300/70 mt-1">
                    {tx(
                      "dashboard.freelancer.pendingBalance",
                      { value: formatCurrency(stats?.pendingBalance ?? 0, true, language) },
                      `Pending balance: ${formatCurrency(stats?.pendingBalance ?? 0, true, language)}`,
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/wallet")}
                    className="w-full mt-4 bg-[#262626] hover:bg-[#333] text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    {tx("dashboard.freelancer.withdrawFunds", undefined, "Withdraw Funds")}
                  </button>
                </section>

                <section className="surface-card border border-surface rounded-2xl p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-purple-300">
                    {tx("dashboard.freelancer.profileCompletion", undefined, "Profile Completion")}
                  </p>

                  <div className="mt-5 flex items-center justify-center">
                    <div
                      className="h-32 w-32 rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(rgb(168 85 247) ${completionValue}%, #262626 ${completionValue}% 100%)`,
                      }}
                    >
                      <div className="h-24 w-24 rounded-full border border-surface bg-[#141414] flex items-center justify-center">
                        <span className="text-lg font-bold text-white">{completionValue}%</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-semibold text-white">{completionValue}% Complete</p>
                  <p className="mt-2 text-sm text-purple-300/70">
                    {tx(
                      "dashboard.freelancer.profilePrompt",
                      undefined,
                      "Add portfolio items to reach 100% and boost your visibility.",
                    )}
                  </p>

                  {completionValue < 100 ? (
                    <button
                      type="button"
                      onClick={() => navigate(nextProfileFixPath)}
                      className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      {tx(
                        "dashboard.freelancer.profileStrength.completeProfile",
                        undefined,
                        "Complete Profile",
                      )}
                    </button>
                  ) : null}
                </section>

                <section className="surface-card border border-surface rounded-2xl p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-purple-300">
                    {tx("dashboard.freelancer.quickActions", undefined, "Quick Actions")}
                  </p>

                  <div className="mt-4 flex flex-col gap-2">
                    {[
                      {
                        label: tx("dashboard.freelancer.browseJobs", undefined, "Browse Jobs"),
                        icon: Briefcase,
                        path: ROUTES.jobs,
                      },
                      {
                        label: tx("nav.myProposals", undefined, "My Proposals"),
                        icon: FileText,
                        path: ROUTES.myProposals,
                      },
                    ].map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => navigate(action.path)}
                        className="w-full rounded-xl border border-surface bg-[#101010] hover:bg-[#262626]/40 text-white px-3 py-2.5 text-sm font-medium transition-colors flex items-center justify-between"
                      >
                        <span>{action.label}</span>
                        <action.icon className="h-4 w-4 text-purple-400" />
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default FreelancerDashboardPage;

