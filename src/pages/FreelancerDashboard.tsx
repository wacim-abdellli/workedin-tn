import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  FileText,
  Sparkles,
  User,
  Search,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  Zap,
  Sun,
  Moon,
  CloudSun,
  ShieldCheck,
} from "lucide-react";
import React, { useState, useEffect } from "react";

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

function _getTimeGreeting(tx: (key: string, params?: any, fallback?: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return tx('dashboard.greeting.morning', undefined, 'Good morning');
  if (hour < 18) return tx('dashboard.greeting.afternoon', undefined, 'Good afternoon');
  return tx('dashboard.greeting.evening', undefined, 'Good evening');
}

function getTimeGreetingData(tx: (key: string, params?: any, fallback?: string) => string): { text: string; Icon: any } {
  const hour = new Date().getHours();
  if (hour < 12) {
    return {
      text: tx('dashboard.greeting.morning', undefined, 'Good morning'),
      Icon: Sun
    };
  }
  if (hour < 18) {
    return {
      text: tx('dashboard.greeting.afternoon', undefined, 'Good afternoon'),
      Icon: CloudSun
    };
  }
  return {
    text: tx('dashboard.greeting.evening', undefined, 'Good evening'),
    Icon: Moon
  };
}

const AnimatedNumber = ({ value, duration = 800, formatter }: { value: number; duration?: number; formatter?: (val: number) => string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;
    if (startValue === endValue) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress * (2 - progress);
      const currentValue = startValue + easeProgress * (endValue - startValue);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const roundedVal = Math.round(displayValue * 100) / 100;
  const displayVal = formatter ? formatter(roundedVal) : Math.round(roundedVal).toString();

  return <>{displayVal}</>;
};

function proposalStatusLabel(
  status: string,
  tx: (key: string, params?: any, fallback?: string) => string,
) {
  if (status === "viewed") return tx("dashboard.freelancer.proposalStatus.viewed", undefined, "Viewed");
  if (status === "shortlisted") return tx("dashboard.freelancer.proposalStatus.shortlisted", undefined, "Shortlisted");
  if (status === "pending") return tx("dashboard.freelancer.proposalStatus.submitted", undefined, "Submitted");
  return tx(`status.${status}`, undefined, status);
}

function proposalStatusConfig(status: string): { dot: string; text: string; bg: string } {
  if (status === "accepted" || status === "shortlisted") {
    return { dot: "#10b981", text: "var(--color-status-success)", bg: "rgba(16,185,129,0.08)" };
  }
  if (status === "viewed") {
    return { dot: "#3b82f6", text: "var(--color-status-info)", bg: "rgba(59,130,246,0.08)" };
  }
  if (status === "rejected") {
    return { dot: "#ef4444", text: "var(--color-status-error)", bg: "rgba(239,68,68,0.08)" };
  }
  return { dot: "var(--workspace-primary)", text: "var(--workspace-primary)", bg: "color-mix(in srgb, var(--workspace-primary) 10%, transparent)" };
}

function formatJobBudget(job: MatchedJob, language: Parameters<typeof formatCurrency>[2]) {
  const min = Number(job.budget_min ?? 0);
  const max = Number(job.budget_max ?? 0);
  if (min > 0 && max > 0) return `${formatCurrency(min, true, language)} – ${formatCurrency(max, true, language)}`;
  if (max > 0) return formatCurrency(max, true, language);
  if (min > 0) return formatCurrency(min, true, language);
  return "—";
}

function FreelancerDashboardPage() {
  const { profile, freelancerProfile, isLoading: isAuthLoading, isFullyReady } = useAuth();
  const navigate = useNavigate();
  const { language, tx, txPlural } = useTranslation();

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
        contractsCountRes, proposalsRes, walletRes, viewsRes,
        notificationsRes, recentProposalsRes, activeContractsListRes, milestonesRes,
      ] = await Promise.all([
        supabase.from("contracts").select("id", { count: "exact", head: true }).eq("freelancer_id", userId).eq("status", "active"),
        supabase.from("proposals").select("id", { count: "exact", head: true }).eq("freelancer_id", userId).eq("status", "pending"),
        supabase.from("wallets").select("balance,pending_balance,total_earned").eq("user_id", userId).maybeSingle(),
        supabase.from("freelancer_profiles").select("profile_views,title").eq("id", userId).maybeSingle(),
        supabase.from("notifications").select("id,title,body,type,created_at").eq("user_id", userId).neq("type", "message").eq("is_read", false).order("created_at", { ascending: false }).limit(5),
        supabase.from("proposals").select("id, status, bid_amount, created_at, job:jobs(id, title, category, status)").eq("freelancer_id", userId).order("created_at", { ascending: false }).limit(5),
        supabase.from("contracts").select("id, title, status, total_amount, client_id, created_at").eq("freelancer_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(5),
        supabase.from("milestones").select("id,description,due_date,amount,status,contract_id,contracts!inner(freelancer_id, status)").eq("contracts.freelancer_id", userId).eq("contracts.status", "active").eq("status", "pending").order("due_date", { ascending: true }).limit(4),
      ]);

      const clientIds = new Set<string>();
      if (activeContractsListRes.data) {
        activeContractsListRes.data.forEach(c => { if (c.client_id) clientIds.add(c.client_id); });
      }

      const profilesById: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (clientIds.size > 0) {
        const { data: profilesData } = await supabase.from('public_profiles').select('id, full_name, avatar_url').in('id', Array.from(clientIds));
        profilesData?.forEach(p => { profilesById[p.id] = p; });
      }

      const activeContractsMapped = (activeContractsListRes.data ?? []).map(c => ({ ...c, client: profilesById[c.client_id] || null }));

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
        recentProposals: (recentProposalsRes.data ?? []) as unknown as DashboardStats["recentProposals"],
        activeContractsList: activeContractsMapped as unknown as DashboardStats["activeContractsList"],
      };
    },
    staleTime: 60_000,
  });

  const { data: chartData = [] } = useQuery({
    queryKey: ["freelancerEarningsChart", profile?.id, locale],
    enabled: !!profile?.id,
    queryFn: async () => {
      const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });
      const months = Array.from({ length: 6 }, (_, index) => {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - (5 - index));
        return { key: `${date.getFullYear()}-${date.getMonth()}`, month: monthFormatter.format(date), earnings: 0 };
      });
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data } = await supabase.from("transactions").select("amount, created_at").eq("user_id", profile!.id).eq("type", "escrow_release").eq("status", "completed").gte("created_at", sixMonthsAgo.toISOString()).order("created_at", { ascending: true });
      (data || []).forEach((transaction) => {
        const date = new Date(transaction.created_at);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const month = months.find((item) => item.key === key);
        if (month) month.earnings += Number(transaction.amount ?? 0);
      });
      return months.map(({ key: _key, ...item }) => item);
    },
    staleTime: 300_000,
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<MatchedJob[]>({
    queryKey: ["dashboard", "matched-jobs", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("id,title,category,budget_min,budget_max").eq("status", "open").eq("visibility", "public").order("created_at", { ascending: false }).limit(3);
      if (error) { console.error("freelancer matched jobs:", error); return []; }
      return (data ?? []) as MatchedJob[];
    },
    staleTime: 60_000,
  });

  const { data: dailyProposalUsage = { used: 0, remaining: DAILY_PROPOSAL_LIMIT, limit: DAILY_PROPOSAL_LIMIT } } = useQuery({
    queryKey: ["dailyProposalUsage", profile?.id],
    queryFn: () => getDailyProposalUsage(profile!.id),
    enabled: !!profile?.id,
    staleTime: 60_000,
  });

  const recentProposals = stats?.recentProposals ?? [];
  const contracts = stats?.activeContractsList ?? [];
  const monthlyEarnings = chartData[chartData.length - 1]?.earnings ?? 0;
  const lastMonthEarnings = chartData[chartData.length - 2]?.earnings ?? 0;
  const earningsTrend = lastMonthEarnings > 0 ? ((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(0) : null;

  const ownFreelancerProfilePath = profile?.id ? `/freelancer/${profile.username || profile.id}` : ROUTES.settingsProfile;

  const checklist = [
    { label: tx("dashboard.freelancer.checklist.avatar", undefined, "Avatar uploaded"), done: !!profile?.avatar_url, path: "/settings?tab=profile" },
    { label: tx("dashboard.freelancer.checklist.bio", undefined, "Bio written"), done: (profile?.bio?.trim()?.length ?? 0) > 0, path: "/settings?tab=profile" },
    { label: tx("dashboard.freelancer.checklist.skills", undefined, "Skills added"), done: (freelancerProfile?.skills?.length ?? 0) > 0, path: "/settings?tab=profile" },
    { label: tx("dashboard.freelancer.checklist.title", undefined, "Professional title"), done: !!stats?.freelancerTitle, path: "/settings?tab=profile" },
    { label: tx("dashboard.freelancer.checklist.identity", undefined, "Identity verified"), done: !!profile?.cin_verified, path: "/verify-identity" },
    { label: tx("dashboard.freelancer.checklist.tools", undefined, "Tools listed"), done: (freelancerProfile?.tools?.length ?? 0) > 0, path: ownFreelancerProfilePath },
    { label: tx("dashboard.freelancer.checklist.preferences", undefined, "Project preferences"), done: typeof freelancerProfile?.project_preferences === "object" && freelancerProfile?.project_preferences !== null && (("summary" in freelancerProfile.project_preferences && typeof freelancerProfile.project_preferences.summary === "string" && freelancerProfile.project_preferences.summary.trim().length > 10) || ("bio" in freelancerProfile.project_preferences && typeof freelancerProfile.project_preferences.bio === "string" && freelancerProfile.project_preferences.bio.trim().length > 10)), path: ownFreelancerProfilePath },
  ];

  const nextProfileFixPath = checklist.find((item) => !item.done)?.path || "/settings?tab=profile";
  const profileCompletion = Math.round((checklist.filter((item) => item.done).length / checklist.length) * 100);
  const completionValue = profileCompletion;
  const firstName = profile?.full_name?.split(" ")[0] || tx("common.freelancer", undefined, "Freelancer");
  const greetingData = getTimeGreetingData(tx);
  const GreetingIcon = greetingData.Icon;
  const greetingText = greetingData.text;
  const activeContractsCount = stats?.activeContracts ?? 0;
  const pendingProposalsCount = stats?.pendingProposals ?? 0;
  const profileViewsCount = stats?.profileViews ?? 0;

  const activeContractRows = useMemo<ContractRow[]>(
    () => contracts.slice(0, 3).map((contract) => ({
      id: contract.id,
      jobTitle: contract.title,
      clientName: contract.client?.full_name || tx("dashboard.freelancer.clientFallback", undefined, "Client"),
      submitPath: `/contracts/${contract.id}`,
    })),
    [contracts, tx],
  );

  const proposalRows = useMemo<ProposalRow[]>(
    () => recentProposals.slice(0, 4).map((proposal) => ({
      id: proposal.id,
      jobTitle: proposal.job?.title || tx("dashboard.freelancer.untitledJob", undefined, "Untitled job"),
      proposedRate: formatCurrency(proposal.bid_amount ?? 0, true, language),
      status: proposal.status,
    })),
    [language, recentProposals, tx],
  );

  const maxEarnings = Math.max(...chartData.map(d => d.earnings), 1);

  if (isAuthLoading || !isFullyReady) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg-base)' }}>
        <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
        <Header />
        <main className="pt-8 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="h-32 rounded-3xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}
            </div>
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-8 space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}
              </div>
              <div className="col-span-4 space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile?.id) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg-base)' }}>
        <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
        <Header />
        <main className="pt-10 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EmptyState icon={User} title={tx("dashboard.freelancer.profileUnavailable", undefined, "Profile unavailable")} description={tx("dashboard.freelancer.profileUnavailableDesc", undefined, "We could not load your account profile yet. Please try again.")} action={{ label: tx("common.retry", undefined, "Retry"), onClick: () => window.location.reload() }} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--color-bg-base)' }}>
      <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
      <Header />

      <main className="pb-20">

        {/* ── COMMAND CENTER HERO ── */}
        <div className="dash-command-ambient max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 animate-dash-fade-up">
          <div className="dash-command-center overflow-hidden py-5 px-6 sm:py-6 sm:px-8">
            {/* Dot pattern overlay */}
            <div className="dash-command-grid" />

            {/* Identity & CTA section */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-5">
              <div className="flex items-center gap-5">
                {/* Avatar with rotating ring & online pulse */}
                <div className="relative shrink-0 animate-dash-scale-in dash-stagger-1">
                  <div className="dash-avatar-ring">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={firstName} />
                    ) : (
                      <div
                        className="dash-avatar-placeholder w-full h-full flex items-center justify-center text-2xl font-bold"
                        style={{
                          background: 'color-mix(in srgb, var(--workspace-primary) 15%, var(--color-bg-elevated))',
                          color: 'var(--workspace-primary)',
                        }}
                      >
                        {firstName[0]}
                      </div>
                    )}
                  </div>
                  <span className="dash-pulse-online" />
                </div>
                <div className="flex flex-col gap-1.5 animate-dash-slide-left dash-stagger-2">
                  <span className="dash-greeting-pill self-start">
                    <GreetingIcon className="dash-greeting-icon" />
                    {greetingText}
                  </span>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                      {firstName}
                    </h1>
                    {profile?.cin_verified ? (
                      <span className="dash-badge flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {tx('dashboard.freelancer.badgeVerified', undefined, 'Verified Pro')}
                      </span>
                    ) : (
                      <span className="dash-badge-unverified">
                        {tx('dashboard.freelancer.badgeUnverified', undefined, 'Pro Freelancer')}
                      </span>
                    )}
                  </div>
                  {stats?.freelancerTitle && (
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      {stats.freelancerTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="animate-dash-slide-right dash-stagger-3">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.jobs)}
                  className="dash-cta-btn group inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
                  style={{
                    background: 'var(--workspace-primary)',
                    boxShadow: '0 4px 20px -4px color-mix(in srgb, var(--workspace-primary) 55%, transparent)',
                  }}
                >
                  <Search className="w-4 h-4" />
                  {tx('nav.findWork', undefined, 'Find Work')}
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="dash-divider relative z-10 animate-dash-fade-up dash-stagger-3" />

            {/* Bento Stats */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">

              {/* Earnings — featured tile */}
              <div className="col-span-2 sm:col-span-1 dash-stat-featured animate-dash-fade-up dash-stagger-4">
                <div className="dash-stat-featured-content">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--workspace-primary)' }}>
                      {tx('dashboard.freelancer.stats.earnings', undefined, 'This Month')}
                    </p>
                    <TrendingUp className="w-4 h-4 dash-stat-icon" style={{ color: 'var(--workspace-primary)' }} />
                  </div>
                  <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                    <AnimatedNumber
                      value={monthlyEarnings}
                      formatter={(val) => formatCurrency(val, true, language)}
                    />
                  </p>
                  {earningsTrend !== null && (
                    <p className="text-[11px] mt-1.5 font-medium flex items-center gap-1" style={{ color: earningsTrend.startsWith('-') ? 'var(--color-status-error)' : 'var(--color-status-success)' }}>
                      <span>{earningsTrend.startsWith('-') ? '▼' : '▲'}</span>
                      <span>{Math.abs(Number(earningsTrend))}% {tx('dashboard.freelancer.stats.vsLastMonth', undefined, 'vs last month')}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Proposals */}
              <div className="dash-stat-card animate-dash-fade-up dash-stagger-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                    {tx('dashboard.freelancer.stats.proposals', undefined, 'Proposals')}
                  </p>
                  <Sparkles className="w-4 h-4 dash-stat-icon" style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                  <AnimatedNumber value={pendingProposalsCount} />
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {tx('dashboard.freelancer.stats.proposalsDesc', undefined, 'awaiting reply')}
                </p>
              </div>

              {/* Contracts */}
              <div className="dash-stat-card animate-dash-fade-up dash-stagger-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                    {tx('dashboard.freelancer.stats.contracts', undefined, 'Contracts')}
                  </p>
                  <Briefcase className="w-4 h-4 dash-stat-icon" style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                  <AnimatedNumber value={activeContractsCount} />
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {tx('dashboard.freelancer.stats.contractsDesc', undefined, 'active now')}
                </p>
              </div>

              {/* Profile Views */}
              <div className="dash-stat-card animate-dash-fade-up dash-stagger-7">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                    {tx('dashboard.freelancer.stats.views', undefined, 'Views')}
                  </p>
                  <User className="w-4 h-4 dash-stat-icon" style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                  <AnimatedNumber value={profileViewsCount} />
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {tx('dashboard.freelancer.stats.viewsDesc', undefined, 'profile views')}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT COLUMN — 8 cols */}
          <section className="lg:col-span-8 flex flex-col gap-5">

            {/* Active Contracts */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)' }}>
                    <Briefcase className="w-3.5 h-3.5" style={{ color: 'var(--workspace-primary)' }} />
                  </div>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {tx('dashboard.freelancer.activeContracts', undefined, 'Active Contracts')}
                  </h2>
                  {activeContractsCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--workspace-primary)', color: '#fff' }}>
                      {activeContractsCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/contracts')}
                  className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--workspace-primary)' }}
                >
                  {tx('dashboard.freelancer.viewAll', undefined, 'View all')} <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {isLoading ? (
                <div className="px-6 pb-5 space-y-2.5">
                  {[1, 2].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}
                </div>
              ) : activeContractRows.length === 0 ? (
                <div className="flex flex-col items-center gap-3 text-center px-6 pb-8 pt-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--color-bg-subtle)' }}
                  >
                    <Briefcase className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>No active contracts yet</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>Start applying to jobs to land your first contract</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.jobs)}
                    className="text-xs font-semibold px-4 py-2 rounded-xl text-white transition-all hover:brightness-110 active:scale-95 mt-1"
                    style={{ background: 'var(--workspace-primary)' }}
                  >
                    Browse Jobs
                  </button>
                </div>
              ) : (
                <div className="px-6 pb-5 space-y-2">
                  {activeContractRows.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => navigate(row.submitPath)}
                      className="group w-full flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-150 active:scale-[0.99]"
                      style={{
                        background: 'var(--color-bg-base)',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--workspace-primary) 35%, transparent)'; (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--workspace-primary) 4%, var(--color-bg-base))'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-subtle)'; (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-base)'; }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}>
                          <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--workspace-primary)' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{row.jobTitle}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-tertiary)' }}>with {row.clientName}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--workspace-primary)' }}>
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Proposals */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)' }}>
                    <FileText className="w-3.5 h-3.5" style={{ color: 'var(--workspace-primary)' }} />
                  </div>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {tx('dashboard.freelancer.recentProposals', undefined, 'Recent Proposals')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/my-proposals')}
                  className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--workspace-primary)' }}
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {isLoading ? (
                <div className="px-6 pb-5 space-y-px">
                  {[1, 2, 3].map(i => <div key={i} className="h-14 animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}
                </div>
              ) : proposalRows.length === 0 ? (
                <div className="px-6 pb-8 pt-4 text-center">
                  <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No proposals submitted yet</p>
                </div>
              ) : (
                <div className="px-6 pb-4">
                  {proposalRows.map((row, index) => {
                    const cfg = proposalStatusConfig(row.status);
                    return (
                      <div
                        key={row.id}
                        className="flex items-center justify-between gap-3 py-3.5"
                        style={{ borderBottom: index < proposalRows.length - 1 ? '1px solid var(--color-border-subtle)' : 'none' }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{row.jobTitle}</p>
                            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--workspace-primary)' }}>{row.proposedRate}</p>
                          </div>
                        </div>
                        <span
                          className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ background: cfg.bg, color: cfg.text }}
                        >
                          {proposalStatusLabel(row.status, tx)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Jobs For You */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)' }}>
                    <Zap className="w-3.5 h-3.5" style={{ color: 'var(--workspace-primary)' }} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {tx('dashboard.freelancer.matchedForYou', undefined, 'Jobs For You')}
                    </h2>
                    {jobs.length > 0 && (
                      <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        {jobs.length} fresh match{jobs.length !== 1 ? 'es' : ''} right now
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.jobs)}
                  className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--workspace-primary)' }}
                >
                  Browse all <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {isLoadingJobs ? (
                <div className="px-6 pb-5 space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--color-bg-subtle)' }} />)}
                </div>
              ) : jobs.length === 0 ? (
                <div className="px-6 pb-8 pt-4 text-center">
                  <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No new job matches right now — check back soon</p>
                </div>
              ) : (
                <div className="px-6 pb-5 space-y-2.5">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-start justify-between gap-4 p-4 rounded-xl transition-all duration-150"
                      style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--workspace-primary) 30%, transparent)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-subtle)'; }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{job.title}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {job.category && (
                            <span
                              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                              style={{ background: 'color-mix(in srgb, var(--workspace-primary) 9%, transparent)', color: 'var(--workspace-primary)' }}
                            >
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
                        className="shrink-0 text-xs font-semibold px-3.5 py-2 rounded-xl text-white transition-all hover:brightness-110 active:scale-95"
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

          {/* RIGHT COLUMN — 4 cols */}
          <aside className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20">

            {/* Earnings Breakdown */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
                {tx('dashboard.freelancer.earningsThisMonth', undefined, 'Earnings This Month')}
              </p>
              <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: 'var(--color-text-primary)' }}>
                {formatCurrency(monthlyEarnings, true, language)}
              </p>

              {/* Mini sparkline */}
              {chartData.length > 0 && (
                <div className="flex items-end gap-1 mt-4 h-10">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-sm transition-all duration-300"
                        style={{
                          height: `${Math.max(4, (d.earnings / maxEarnings) * 36)}px`,
                          background: i === chartData.length - 1
                            ? 'var(--workspace-primary)'
                            : 'color-mix(in srgb, var(--workspace-primary) 25%, var(--color-border-subtle))',
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 space-y-2" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{tx('dashboard.freelancer.wallet.lastMonth', undefined, 'Last month')}</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(lastMonthEarnings, true, language)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{tx('dashboard.freelancer.wallet.inReview', undefined, 'In review')}</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(stats?.pendingBalance ?? 0, true, language)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{tx('dashboard.freelancer.wallet.available', undefined, 'Available')}</span>
                  <span className="font-semibold" style={{ color: 'var(--color-status-success)' }}>{formatCurrency(stats?.walletBalance ?? 0, true, language)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/wallet')}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: 'var(--workspace-primary)', boxShadow: '0 4px 14px -4px color-mix(in srgb, var(--workspace-primary) 50%, transparent)' }}
              >
                {tx('dashboard.freelancer.withdrawFunds', undefined, 'Withdraw Funds')}
              </button>
            </div>

            {/* Daily Quota */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                  {tx('dashboard.freelancer.quota.title', undefined, 'Daily Applications')}
                </p>
                <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  {dailyProposalUsage.used} / {dailyProposalUsage.limit}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border-subtle)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(dailyProposalUsage.used / dailyProposalUsage.limit) * 100}%`,
                    background: dailyProposalUsage.remaining <= 2 ? 'var(--color-status-error)' : 'var(--workspace-primary)',
                  }}
                />
              </div>
              <p className="text-[11px] mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
                <span className="font-semibold" style={{ color: dailyProposalUsage.remaining <= 2 ? 'var(--color-status-error)' : 'var(--color-text-secondary)' }}>
                  {dailyProposalUsage.remaining}
                </span>{' '}
                {txPlural('dashboard.freelancer.quota.remainingLabel', dailyProposalUsage.remaining)}
              </p>
            </div>

            {/* Profile Strength */}
            {completionValue < 100 && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                    {tx('dashboard.freelancer.profileCompletion', undefined, 'Profile Strength')}
                  </p>
                  <span className="text-sm font-bold" style={{ color: 'var(--workspace-primary)' }}>{completionValue}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: 'var(--color-border-subtle)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${completionValue}%`, background: 'var(--workspace-primary)' }}
                  />
                </div>
                <div className="mt-3 space-y-2">
                  {checklist.filter(c => !c.done).slice(0, 3).map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className="w-full flex items-center gap-2.5 text-left group"
                    >
                      <span className="w-4 h-4 rounded-full border-2 shrink-0 group-hover:border-[var(--workspace-primary)] transition-colors" style={{ borderColor: 'var(--color-border-default)' }} />
                      <span className="text-xs truncate group-hover:underline" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(nextProfileFixPath)}
                  className="w-full mt-4 py-2 rounded-xl text-xs font-semibold transition-all hover:brightness-95 active:scale-95"
                  style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-subtle)' }}
                >
                  {tx('dashboard.freelancer.completeProfileButton', undefined, 'Complete profile →')}
                </button>
              </div>
            )}

            {/* Quick Links */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
              <p className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                {tx('dashboard.freelancer.quickActions', undefined, 'Quick Links')}
              </p>
              <div className="pb-2">
                {[
                  { label: tx('nav.findWork', undefined, 'Find Work'), icon: Search, path: ROUTES.jobs },
                  { label: tx('nav.contracts', undefined, 'Contracts'), icon: Briefcase, path: ROUTES.contracts },
                  { label: tx('nav.messages', undefined, 'Messages'), icon: MessageSquare, path: ROUTES.messages },
                  { label: tx('dashboard.freelancer.myProposals', undefined, 'My Proposals'), icon: FileText, path: ROUTES.myProposals },
                  { label: 'My Profile', icon: User, path: ownFreelancerProfilePath },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => navigate(action.path)}
                    className="group w-full flex items-center justify-between px-5 py-2.5 transition-all duration-150 hover:bg-[var(--color-bg-subtle)]"
                  >
                    <span className="flex items-center gap-3 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      <action.icon className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                      {action.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-all -translate-x-1 group-hover:translate-x-0" style={{ color: 'var(--workspace-primary)' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Milestones due */}
            {(stats?.milestones ?? []).length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <Clock className="w-4 h-4" style={{ color: 'var(--color-status-warning)' }} />
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>
                    Upcoming Milestones
                  </p>
                </div>
                <div className="space-y-2.5">
                  {(stats?.milestones ?? []).slice(0, 3).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => navigate(`/contracts/${m.contract_id}`)}
                      className="w-full flex items-start justify-between gap-2 text-left group"
                    >
                      <p className="text-xs font-medium truncate group-hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
                        {m.description}
                      </p>
                      <span className="shrink-0 text-xs font-bold" style={{ color: 'var(--color-status-success)' }}>
                        {formatCurrency(m.amount, true, language)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </aside>
        </div>
      </main>
    </div>
  );
}

export default FreelancerDashboardPage;