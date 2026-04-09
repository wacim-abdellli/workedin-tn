import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Check,
  DollarSign,
  FileText,
  MessageSquare,
  Search,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Header } from "../components/layout";
import SEO, { SEO_CONFIG } from "../components/common/SEO";
import EmptyState from "../components/ui/EmptyState";
import SkeletonCard from "../components/common/SkeletonCard";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { DashWidget } from "../components/dashboard/DashWidget";
import { ProfileRing } from "../components/dashboard/ProfileRing";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n";
import { dashboardQueryKeys } from "../lib/dashboardQueries";
import { supabase } from "../lib/supabase";
import { formatCurrency } from "../lib/currencyUtils";

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
  connectsBalance: number;
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

const motionEase = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: motionEase } },
};

function getTimeGreeting(tx: any): string {
  const h = new Date().getHours();
  if (h < 12)
    return tx("dashboard.greeting.morning", undefined, "Good morning");
  if (h < 18)
    return tx("dashboard.greeting.afternoon", undefined, "Good afternoon");
  return tx("dashboard.greeting.evening", undefined, "Good evening");
}

function FreelancerDashboardPage() {
  const { profile, freelancerProfile, isLoading: isAuthLoading } = useAuth();
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
          .select("profile_views,title,connects_balance")
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
        connectsBalance: Number(viewsRes.data?.connects_balance ?? 0),
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

  const recentProposals = stats?.recentProposals ?? [];
  const contracts = stats?.activeContractsList ?? [];
  const monthlyEarnings = chartData[chartData.length - 1]?.earnings ?? 0;
  const lastMonthEarnings = chartData[chartData.length - 2]?.earnings ?? 0;

  const checklist = [
    {
      label: tx(
        "dashboard.freelancer.checklist.avatar",
        undefined,
        "Avatar uploaded",
      ),
      done: !!profile?.avatar_url,
    },
    {
      label: tx("dashboard.freelancer.checklist.bio", undefined, "Bio written"),
      done: (profile?.bio?.length ?? 0) > 20,
    },
    {
      label: tx(
        "dashboard.freelancer.checklist.skills",
        undefined,
        "Skills added",
      ),
      done: (freelancerProfile?.skills?.length ?? 0) > 0,
    },
    {
      label: tx(
        "dashboard.freelancer.checklist.title",
        undefined,
        "Professional title",
      ),
      done: !!stats?.freelancerTitle,
    },
    {
      label: tx(
        "dashboard.freelancer.checklist.identity",
        undefined,
        "Identity verified",
      ),
      done: !!profile?.cin_verified,
    },
  ];

  const profileCompletion = Math.round(
    (checklist.filter((item) => item.done).length / checklist.length) * 100,
  );

  const statsData = {
    activeContracts: stats?.activeContracts ?? 0,
    totalProposals: stats?.pendingProposals ?? 0,
    totalEarnings: formatCurrency(stats?.totalEarnings ?? 0, true, language),
    rating: "—",
    monthlyEarnings,
    lastMonthEarnings,
  };

  if (isAuthLoading || !profile?.id) {
    return (
      <div className="min-h-screen bg-[var(--color-background-base)]">
        <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
        <Header />
        <main className="container mx-auto px-[var(--spacing-4)] sm:px-[var(--spacing-6)] lg:px-[var(--spacing-8)] pt-[var(--spacing-20)] pb-[var(--spacing-12)] max-w-7xl">
          <SkeletonCard />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background-base)]">
      <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
      <Header />

      <main className="container mx-auto px-[var(--spacing-4)] sm:px-[var(--spacing-6)] lg:px-[var(--spacing-8)] pt-[var(--spacing-20)] pb-[var(--spacing-12)] max-w-7xl">
        <m.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: motionEase }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[var(--spacing-6)] mb-[var(--spacing-10)]"
        >
          <div>
            <p className="text-[var(--font-fontSize-xs)] font-[var(--font-fontWeight-semibold)] uppercase tracking-[0.2em] mb-[var(--spacing-1)] text-[var(--color-brand-primary)]">
              {getTimeGreeting(tx)}
            </p>
            <h1 className="font-display text-[var(--font-fontSize-4xl)] sm:text-[var(--font-fontSize-5xl)] font-[var(--font-fontWeight-bold)] tracking-tight text-[var(--color-text-primary)]">
              {profile.full_name?.split(" ")[0] || "Freelancer"}
            </h1>
          </div>

          <div className="flex flex-wrap gap-[var(--spacing-3)]">
            {[
              {
                label: tx(
                  "dashboard.freelancer.contractsLabel",
                  undefined,
                  "Contracts",
                ),
                value: statsData.activeContracts,
              },
              {
                label: tx(
                  "dashboard.freelancer.proposalsLabel",
                  undefined,
                  "Proposals",
                ),
                value: statsData.totalProposals,
              },
              {
                label: tx(
                  "dashboard.freelancer.earningsLabel",
                  undefined,
                  "Earnings",
                ),
                value: statsData.totalEarnings,
                accent: true,
              },
              {
                label: tx(
                  "dashboard.freelancer.ratingLabel",
                  undefined,
                  "Rating",
                ),
                value: `${statsData.rating}/5`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center px-[var(--spacing-4)] py-[var(--spacing-2)] rounded-[var(--radius-2xl)] border"
                style={{
                  background: stat.accent
                    ? "var(--workspace-primary-hover)"
                    : "var(--color-background-subtle)",
                  borderColor: stat.accent
                    ? "transparent"
                    : "var(--color-border-subtle)",
                }}
              >
                <span
                  className="font-display font-[var(--font-fontWeight-bold)] text-[var(--font-fontSize-lg)] leading-tight"
                  style={{
                    color: stat.accent
                      ? "var(--workspace-primary-text, #fff)"
                      : "var(--color-text-primary)",
                  }}
                >
                  {stat.value}
                </span>
                <span
                  className="text-[11px] font-[var(--font-fontWeight-medium)] uppercase tracking-wider"
                  style={{
                    color: stat.accent
                      ? "rgba(255,255,255,0.96)"
                      : "var(--color-text-tertiary)",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </m.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--spacing-5)]">
          <m.div
            className="lg:col-span-2 space-y-[var(--spacing-5)]"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <m.div variants={itemVariants}>
              <DashWidget
                title={tx(
                  "dashboard.freelancer.activeContracts",
                  undefined,
                  "Active Contracts",
                )}
                icon={<Briefcase className="w-4 h-4" />}
                action={{
                  label: tx(
                    "dashboard.freelancer.viewAll",
                    undefined,
                    "View all",
                  ),
                  onClick: () => navigate("/contracts"),
                }}
              >
                {isLoading ? (
                  <SkeletonCard />
                ) : contracts.length === 0 ? (
                  <EmptyState
                    icon={Briefcase}
                    title={tx(
                      "dashboard.freelancer.noActiveContracts",
                      undefined,
                      "No active contracts",
                    )}
                    description={tx(
                      "dashboard.freelancer.submitProposalsToStart",
                      undefined,
                      "Submit proposals to start getting contracts",
                    )}
                    action={{
                      label: tx(
                        "dashboard.freelancer.browseJobs",
                        undefined,
                        "Browse Jobs",
                      ),
                      onClick: () => navigate("/jobs"),
                    }}
                  />
                ) : (
                  <div className="divide-y divide-[var(--color-border-subtle)]">
                    {contracts.slice(0, 3).map((contract) => (
                      <div
                        key={contract.id}
                        className="flex items-center justify-between py-[var(--spacing-4)] px-[var(--spacing-1)] cursor-pointer group"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                      >
                        <div className="flex items-center gap-[var(--spacing-3)] min-w-0">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--color-background-elevated)]">
                            <Briefcase className="w-4 h-4 text-[var(--color-brand-primary)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-[var(--font-fontWeight-semibold)] truncate text-[var(--font-fontSize-sm)] text-[var(--color-text-primary)]">
                              {contract.title}
                            </p>
                            <p className="text-[var(--font-fontSize-xs)] truncate text-[var(--color-text-tertiary)]">
                              {contract.client?.full_name ??
                                tx(
                                  "dashboard.freelancer.clientFallback",
                                  undefined,
                                  "Client",
                                )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-[var(--spacing-3)] shrink-0 ml-[var(--spacing-4)]">
                          <Badge
                            variant={
                              contract.status === "active"
                                ? "success"
                                : "warning"
                            }
                          >
                            {tx(
                              `status.${contract.status}`,
                              undefined,
                              contract.status,
                            )}
                          </Badge>
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-brand-primary)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DashWidget>
            </m.div>

            <m.div variants={itemVariants}>
              <DashWidget
                title={tx(
                  "dashboard.freelancer.recentProposals",
                  undefined,
                  "Recent Proposals",
                )}
                icon={<FileText className="w-4 h-4" />}
                action={{
                  label: tx(
                    "dashboard.freelancer.viewAll",
                    undefined,
                    "View all",
                  ),
                  onClick: () => navigate("/my-proposals"),
                }}
              >
                {isLoading ? (
                  <SkeletonCard />
                ) : recentProposals.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={tx(
                      "dashboard.freelancer.noProposalsYet",
                      undefined,
                      "No proposals yet",
                    )}
                    description={tx(
                      "dashboard.freelancer.browseAndSendProposal",
                      undefined,
                      "Browse open jobs and send your first proposal",
                    )}
                    action={{
                      label: tx(
                        "dashboard.freelancer.browseJobs",
                        undefined,
                        "Browse Jobs",
                      ),
                      onClick: () => navigate("/jobs"),
                    }}
                  />
                ) : (
                  <div className="divide-y divide-[var(--color-border-subtle)]">
                    {recentProposals.slice(0, 4).map((proposal) => (
                      <div
                        key={proposal.id}
                        className="flex items-center justify-between py-[var(--spacing-4)] px-[var(--spacing-1)]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-[var(--font-fontWeight-semibold)] text-[var(--font-fontSize-sm)] truncate text-[var(--color-text-primary)]">
                            {proposal.job?.title ??
                              tx(
                                "dashboard.freelancer.untitledJob",
                                undefined,
                                "Untitled job",
                              )}
                          </p>
                          <p className="text-[var(--font-fontSize-xs)] mt-[var(--spacing-1)] text-[var(--color-text-tertiary)]">
                            {formatCurrency(
                              proposal.bid_amount ?? 0,
                              true,
                              language,
                            )}{" "}
                            ·{" "}
                            {new Date(proposal.created_at).toLocaleDateString(
                              locale,
                            )}
                          </p>
                        </div>
                        <Badge
                          variant={
                            proposal.status === "accepted"
                              ? "success"
                              : proposal.status === "rejected"
                                ? "danger"
                                : proposal.status === "pending"
                                  ? "warning"
                                  : "default"
                          }
                        >
                          {tx(
                            `status.${proposal.status}`,
                            undefined,
                            proposal.status,
                          )}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </DashWidget>
            </m.div>

            <m.div variants={itemVariants}>
              <DashWidget
                title={tx(
                  "dashboard.freelancer.earningsChart",
                  undefined,
                  "Earnings",
                )}
                icon={<DollarSign className="w-4 h-4" />}
                action={{
                  label: tx(
                    "dashboard.freelancer.viewEarnings",
                    undefined,
                    "Full report",
                  ),
                  onClick: () => navigate("/freelancer/earnings"),
                }}
              >
                {chartData.every((d) => d.earnings === 0) ? (
                  <EmptyState
                    icon={DollarSign}
                    title={tx(
                      "dashboard.freelancer.noEarningsYet",
                      undefined,
                      "No earnings yet",
                    )}
                    description={tx(
                      "dashboard.freelancer.completeContractToEarn",
                      undefined,
                      "Complete a contract to start earning",
                    )}
                    action={{
                      label: tx(
                        "dashboard.freelancer.browseJobs",
                        undefined,
                        "Browse Jobs",
                      ),
                      onClick: () => navigate("/jobs"),
                    }}
                  />
                ) : (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="dashEarningsGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--workspace-primary)"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--workspace-primary)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--color-text-tertiary)",
                            fontSize: 10,
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--color-text-tertiary)",
                            fontSize: 10,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-background-elevated)",
                            border: "1px solid var(--color-border-subtle)",
                            borderRadius: 8,
                            color: "var(--color-text-primary)",
                            fontSize: 11,
                          }}
                          formatter={(val) => [
                            `${Number(val ?? 0).toLocaleString(locale)} TND`,
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="earnings"
                          stroke="var(--workspace-primary)"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#dashEarningsGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </DashWidget>
            </m.div>

            <m.div variants={itemVariants}>
              <DashWidget
                title={tx(
                  "dashboard.freelancer.matchedForYou",
                  undefined,
                  "Matched for You",
                )}
                icon={<Target className="w-4 h-4" />}
                action={{
                  label: tx(
                    "dashboard.freelancer.seeAllJobs",
                    undefined,
                    "See all jobs",
                  ),
                  onClick: () => navigate("/jobs"),
                }}
              >
                {isLoadingJobs ? (
                  <SkeletonCard />
                ) : jobs.length === 0 ? (
                  <EmptyState
                    icon={Target}
                    title={tx(
                      "dashboard.freelancer.noMatchesYet",
                      undefined,
                      "No matches yet",
                    )}
                    description={tx(
                      "dashboard.freelancer.addSkillsToMatch",
                      undefined,
                      "Add skills to your profile to get matched jobs",
                    )}
                    action={{
                      label: tx(
                        "dashboard.freelancer.updateProfile",
                        undefined,
                        "Update Profile",
                      ),
                      onClick: () => navigate("/settings"),
                    }}
                  />
                ) : (
                  <div className="divide-y divide-[var(--color-border-subtle)]">
                    {jobs.slice(0, 3).map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between py-[var(--spacing-4)] px-[var(--spacing-1)] cursor-pointer group"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-[var(--font-fontWeight-semibold)] text-[var(--font-fontSize-sm)] truncate text-[var(--color-text-primary)]">
                            {job.title}
                          </p>
                          <p className="text-[var(--font-fontSize-xs)] mt-[var(--spacing-1)] text-[var(--color-text-tertiary)]">
                            {job.budget_min ?? 0}–{job.budget_max ?? 0} TND ·{" "}
                            {tx(
                              `categories.${job.category}`,
                              undefined,
                              job.category ?? "General",
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-[var(--spacing-2)] shrink-0 ml-[var(--spacing-4)]">
                          <span className="text-[var(--font-fontSize-xs)] font-[var(--font-fontWeight-medium)] px-[var(--spacing-2)] py-[var(--spacing-1)] rounded-lg bg-[var(--color-brand-primary)] text-white opacity-90">
                            {tx(
                              "dashboard.freelancer.apply",
                              undefined,
                              "Apply",
                            )}
                          </span>
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-brand-primary)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DashWidget>
            </m.div>

            {(stats?.milestones?.length ?? 0) > 0 && (
              <m.div variants={itemVariants}>
                <DashWidget
                  title={tx(
                    "dashboard.freelancer.upcomingMilestones",
                    undefined,
                    "Upcoming Milestones",
                  )}
                  icon={<Target className="w-4 h-4" />}
                  action={{
                    label: tx(
                      "dashboard.freelancer.viewContracts",
                      undefined,
                      "View contracts",
                    ),
                    onClick: () => navigate("/contracts"),
                  }}
                >
                  <div className="divide-y divide-[var(--color-border-subtle)]">
                    {stats!.milestones.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between py-[var(--spacing-3)] px-[var(--spacing-1)]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[var(--font-fontSize-sm)] font-[var(--font-fontWeight-medium)] truncate text-[var(--color-text-primary)]">
                            {m.description}
                          </p>
                          {m.due_date && (
                            <p className="text-[var(--font-fontSize-xs)] text-[var(--color-text-tertiary)] mt-[var(--spacing-0.5)]">
                              {tx(
                                "dashboard.freelancer.dueDate",
                                undefined,
                                "Due:",
                              )}{" "}
                              {new Date(m.due_date).toLocaleDateString(locale)}
                            </p>
                          )}
                        </div>
                        <p className="text-[var(--font-fontSize-sm)] font-[var(--font-fontWeight-bold)] text-[var(--color-text-primary)] shrink-0 ml-[var(--spacing-4)]">
                          {formatCurrency(m.amount, true, language)}
                        </p>
                      </div>
                    ))}
                  </div>
                </DashWidget>
              </m.div>
            )}
          </m.div>

          <m.div
            className="space-y-5"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <m.div variants={itemVariants}>
              <DashWidget
                title={tx(
                  "dashboard.freelancer.profileStrength",
                  undefined,
                  "Profile Strength",
                )}
                icon={<User className="w-4 h-4" />}
              >
                <div className="flex flex-col items-center py-[var(--spacing-2)]">
                  <ProfileRing value={profileCompletion} />
                  <div className="w-full mt-[var(--spacing-5)] space-y-[var(--spacing-2)]">
                    {checklist.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-[var(--spacing-3)]"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: item.done
                              ? "var(--color-brand-primary)"
                              : "var(--color-border-default)",
                          }}
                        >
                          {item.done && (
                            <Check className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>
                        <span
                          className="text-[var(--font-fontSize-sm)]"
                          style={{
                            color: item.done
                              ? "var(--color-text-primary)"
                              : "var(--color-text-tertiary)",
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </DashWidget>
            </m.div>

            <m.div variants={itemVariants}>
              <DashWidget
                title={tx(
                  "dashboard.freelancer.thisMonth",
                  undefined,
                  "This Month",
                )}
                icon={<DollarSign className="w-4 h-4" />}
              >
                <div className="space-y-[var(--spacing-3)]">
                  <div>
                    <p className="font-display font-[var(--font-fontWeight-bold)] text-[var(--font-fontSize-3xl)] text-[var(--color-text-primary)]">
                      {formatCurrency(
                        statsData.monthlyEarnings,
                        true,
                        language,
                      )}
                    </p>
                    <div className="flex items-center gap-[var(--spacing-2)] mt-[var(--spacing-1)]">
                      {statsData.monthlyEarnings >=
                      statsData.lastMonthEarnings ? (
                        <TrendingUp
                          className="w-3.5 h-3.5"
                          style={{ color: "var(--color-status-success)" }}
                        />
                      ) : (
                        <TrendingDown
                          className="w-3.5 h-3.5"
                          style={{ color: "var(--color-status-error)" }}
                        />
                      )}
                      <span className="text-[var(--font-fontSize-xs)] text-[var(--color-text-tertiary)]">
                        {tx(
                          "dashboard.freelancer.vsLastMonth",
                          undefined,
                          "vs last month",
                        )}
                      </span>
                    </div>
                  </div>

                  {(stats?.walletBalance ?? 0) > 0 && (
                    <div
                      className="flex items-center justify-between rounded-lg px-3 py-2"
                      style={{
                        background: "var(--color-background-subtle)",
                        borderColor: "var(--color-border-subtle)",
                      }}
                    >
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {tx(
                          "dashboard.freelancer.walletBalance",
                          undefined,
                          "Wallet balance",
                        )}
                      </span>
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">
                        {formatCurrency(stats!.walletBalance, true, language)}
                      </span>
                    </div>
                  )}

                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: "var(--color-background-subtle)" }}
                  >
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {tx(
                        "dashboard.freelancer.connects",
                        undefined,
                        "Connects",
                      )}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: "var(--workspace-primary)" }}
                    >
                      {stats?.connectsBalance ?? 0}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/wallet")}
                  >
                    {tx(
                      "dashboard.freelancer.viewWallet",
                      undefined,
                      "View Wallet",
                    )}{" "}
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </DashWidget>
            </m.div>

            {(stats?.notifications?.length ?? 0) > 0 && (
              <m.div variants={itemVariants}>
                <DashWidget
                  title={tx(
                    "dashboard.freelancer.notifications",
                    undefined,
                    "Notifications",
                  )}
                  icon={<Bell className="w-4 h-4" />}
                  action={{
                    label: tx(
                      "dashboard.freelancer.viewAll",
                      undefined,
                      "View all",
                    ),
                    onClick: () => navigate("/notifications"),
                  }}
                >
                  <div className="space-y-[var(--spacing-2)]">
                    {stats!.notifications.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-[var(--spacing-2)] py-[var(--spacing-1)]"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ background: "var(--workspace-primary)" }}
                        />
                        <p className="text-[var(--font-fontSize-xs)] text-[var(--color-text-secondary)] line-clamp-2">
                          {n.title || n.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </DashWidget>
              </m.div>
            )}

            <m.div variants={itemVariants}>
              <DashWidget
                title={tx(
                  "dashboard.freelancer.quickActions",
                  undefined,
                  "Quick Actions",
                )}
                icon={<Settings className="w-4 h-4" />}
              >
                <div className="space-y-[var(--spacing-2)]">
                  {[
                    {
                      label: tx(
                        "dashboard.freelancer.browseJobs",
                        undefined,
                        "Browse Jobs",
                      ),
                      icon: Search,
                      path: "/jobs",
                    },
                    {
                      label: tx("nav.myProposals", undefined, "My Proposals"),
                      icon: FileText,
                      path: "/my-proposals",
                    },
                    {
                      label: tx("nav.portfolio", undefined, "Portfolio"),
                      icon: Briefcase,
                      path: "/portfolio",
                    },
                    {
                      label: tx("nav.messages", undefined, "Messages"),
                      icon: MessageSquare,
                      path: "/messages",
                    },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="w-full flex items-center gap-[var(--spacing-3)] px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-xl text-[var(--font-fontSize-sm)] font-[var(--font-fontWeight-medium)] transition-all duration-[var(--animation-hover-duration)] text-left text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)]"
                    >
                      <action.icon className="w-4 h-4 shrink-0 text-[var(--color-brand-primary)]" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </DashWidget>
            </m.div>
          </m.div>
        </div>
      </main>
    </div>
  );
}

export default FreelancerDashboardPage;
