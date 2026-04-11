import { logger } from "@/lib/logger";
import { supabase } from "../lib/supabase";
import { useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Heart,
  Clock,
  MapPin,
  Star,
  Briefcase,
  User,
  Eye,
  Users,
  FileText,
  Download,
  Share2,
  Flag,
  CheckCircle,
  ChevronRight,
  Send,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as jobsService from "../services/jobs";
import * as profilesService from "../services/profiles";
import * as proposalsService from "../services/proposals";
import { Header, Footer } from "../components/layout";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import SEO from "../components/common/SEO";
import { Skeleton } from "../components/common/SkeletonCard";
import { useTranslation } from "../i18n";
import { cn } from "../lib/utils";
import type { Skill } from "../types";

import ProposalModal from "../components/proposals/ProposalModal";
import type { ProposalFormData } from "../components/proposals/ProposalModal";
import { sendNewProposalEmail } from "../lib/email";
import {
  withdrawProposalWithRefund,
  getConnectsBalance,
  CONNECTS_COST,
} from "../services/connects";
import SimilarJobCard from "../components/jobs/SimilarJobCard";
import OptimizedImage from "../components/common/OptimizedImage";
import {
  canApplyToJob,
  canSaveJob,
  getAccessMessage,
} from "../lib/marketplaceAccess";
import { localizeGovernorate } from "../lib/governorates";
import { ROUTES, getClientJobProposalsRoute } from "../lib/routes";

// Types
interface Job {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  job_type: "fixed_price" | "hourly";
  budget_min?: number;
  budget_max?: number;
  hourly_rate?: number;
  estimated_hours?: number;
  duration?: string;
  experience_level: string;
  required_skills: Array<string | Skill>;
  visibility: string;
  status: string;
  proposals_count: number;
  views_count: number;
  posted_at: string;
  deadline?: string;
  attachments?: string[];
  client?: {
    id: string;
    full_name: string;
    email?: string;
    avatar_url?: string;
    location?: string;
    created_at: string;
  };
}

interface Proposal {
  id: string;
  job_id: string;
  freelancer_id: string;
  cover_letter: string;
  bid_amount: number;
  delivery_days: number;
  status: string;
  created_at: string;
}

type SimilarJob = Pick<
  Job,
  | "id"
  | "title"
  | "job_type"
  | "budget_min"
  | "budget_max"
  | "hourly_rate"
  | "posted_at"
> & {
  location?: string;
  required_skills?: string[];
};

// Helper functions (Restored)
function timeAgo(date: string, tx: any): string {
  const now = new Date();
  const posted = new Date(date);
  const diffMs = now.getTime() - posted.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60)
    return tx(
      "jobDetail.timeAgo.minute",
      { count: diffMins },
      `${diffMins} minute ago`,
    );
  if (diffHours < 24)
    return tx(
      "jobDetail.timeAgo.hour",
      { count: diffHours },
      `${diffHours} hour ago`,
    );
  if (diffDays < 7)
    return tx(
      "jobDetail.timeAgo.day",
      { count: diffDays },
      `${diffDays} day ago`,
    );
  if (diffDays < 30)
    return tx(
      "jobDetail.timeAgo.week",
      { count: Math.floor(diffDays / 7) },
      `${Math.floor(diffDays / 7)} week ago`,
    );
  return tx(
    "jobDetail.timeAgo.month",
    { count: Math.floor(diffDays / 30) },
    `${Math.floor(diffDays / 30)} month ago`,
  );
}

function formatDate(date: string, language: string): string {
  const locale =
    language === "ar" ? "ar-TN" : language === "fr" ? "fr-FR" : "en-GB";

  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
  });
}

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "beginner",
  intermediate: "intermediate",
  expert: "expert",
};

const CATEGORY_LABELS: Record<string, string> = {
  design: "design",
  development: "development",
  writing: "writing",
  translation: "translation",
  video: "video",
  marketing: "marketing",
  data: "data",
  other: "other",
};

// Main Component
function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, tx } = useTranslation();
  const { user, profile, freelancerProfile } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const saveDecision = canSaveJob({
    isAuthenticated: !!user,
    profile,
    freelancerProfile,
  });
  const applyDecision = canApplyToJob({
    isAuthenticated: !!user,
    profile,
    freelancerProfile,
  });

  const getSkillLabel = (skill: string | Skill) => {
    if (typeof skill === "string") {
      return skill;
    }

    return language === "ar"
      ? skill.name_ar
      : language === "fr"
        ? skill.name_fr
        : skill.name_en;
  };

  // Job Fetch
  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!jobId) throw new Error("No job ID");
      const { data, error } = await jobsService.getJobById(jobId);
      if (error) throw error;

      // Count only public/non-owner views. The backend RPC handles the atomic
      // increment; the page skips obvious owner self-views to avoid noise.
      if (data?.client_id && user?.id !== data.client_id) {
        jobsService.incrementJobViews(jobId).catch(console.error);
      }

      return data as Job;
    },
    enabled: !!jobId,
  });

  // Saved Status
  const { data: isSaved = false } = useQuery({
    queryKey: ["savedStatus", jobId, user?.id],
    queryFn: async () => {
      if (!user || !jobId) return false;
      const { data } = await profilesService.getFavoriteStatus(user.id, jobId);
      return !!data;
    },
    enabled: !!user && !!jobId,
  });

  // My Proposal
  const { data: myProposal = null } = useQuery({
    queryKey: ["myProposal", jobId, user?.id],
    queryFn: async () => {
      if (!user || !jobId) return null;
      const { data } = await proposalsService.getMyProposal(jobId, user.id);
      return data as Proposal | null;
    },
    enabled: !!user && !!jobId,
  });

  // Similar Jobs
  const { data: similarJobs = [] } = useQuery<SimilarJob[]>({
    queryKey: ["similarJobs", job?.category],
    queryFn: async () => {
      if (!job) return [];
      const { data } = await jobsService.getSimilarJobs(job.id, job.category);
      return ((data as Job[]) || []).map((similarJob) => ({
        ...similarJob,
        required_skills: (similarJob.required_skills || []).map((skill) =>
          getSkillLabel(skill),
        ),
      }));
    },
    enabled: !!job,
  });

  // Client Stats
  const { data: clientStats = { totalJobs: 0, totalSpent: 0, rating: 0 } } =
    useQuery({
      queryKey: ["clientStats", job?.client_id],
      staleTime: 60 * 60 * 1000,
      queryFn: async () => {
        if (!job?.client_id) return { totalJobs: 0, totalSpent: 0, rating: 0 };
        return profilesService.getClientStats(job.client_id);
      },
      enabled: !!job?.client_id,
    });

  // Connects balance (only for freelancers)
  const { data: connectsBalance = { balance: 0, used: 0 } } = useQuery({
    queryKey: ["connectsBalance", user?.id],
    queryFn: () => getConnectsBalance(user!.id),
    enabled: !!user?.id && !!freelancerProfile,
  });
  const connectsAvailable = connectsBalance?.balance ?? 0;
  const connectsRemainingAfterSubmit = Math.max(
    connectsAvailable - CONNECTS_COST,
    0,
  );

  // Toggle Save Mutation
  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      await profilesService.toggleFavorite(user!.id, jobId!, isSaved);
      return !isSaved;
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    onSuccess: (newSavedStatus) => {
      queryClient.setQueryData(
        ["savedStatus", jobId, user?.id],
        newSavedStatus,
      );
      showToast(
        newSavedStatus ? t.jobDetail.jobSaved : t.jobDetail.jobRemoved,
        "success",
      );
    },
    onError: () => showToast(t.jobDetail.error, "error"),
  });

  const toggleSave = () => {
    if (!jobId) {
      return;
    }

    if (!saveDecision.allowed) {
      showToast(
        getAccessMessage(saveDecision.reason, saveDecision.completion),
        "warning",
      );
      if (saveDecision.nextStepPath) {
        navigate(saveDecision.nextStepPath, {
          state: { from: location.pathname },
        });
      }
      return;
    }
    toggleSaveMutation.mutate();
  };

  const openProposalFlow = () => {
    if (!applyDecision.allowed) {
      showToast(
        getAccessMessage(applyDecision.reason, applyDecision.completion),
        "warning",
      );
      if (applyDecision.nextStepPath) {
        navigate(applyDecision.nextStepPath, {
          state: { from: location.pathname },
        });
      }
      return;
    }

    if (connectsAvailable < CONNECTS_COST) {
      showToast(
        tx(
          "jobDetail.connectsNeeded",
          { count: CONNECTS_COST, balance: connectsAvailable },
          `You need ${CONNECTS_COST} connects to submit a proposal. Your current balance: ${connectsAvailable}`,
        ),
        "warning",
      );
      return;
    }

    setShowProposalModal(true);
  };

  // Submit Proposal Mutation
  const submitProposalMutation = useMutation({
    mutationFn: async ({
      data,
      files,
    }: {
      data: ProposalFormData;
      files: File[];
    }) => {
      if (!user || !jobId) throw new Error("Missing auth or job");

      // Check connects balance before submitting
      if (connectsAvailable < CONNECTS_COST) {
        throw new Error(
          tx(
            "jobDetail.connectsNeeded",
            { count: CONNECTS_COST, balance: connectsAvailable },
            `You need ${CONNECTS_COST} connects to submit a proposal. Your current balance: ${connectsAvailable}`,
          ),
        );
      }

      const { error, data: proposalId } = await proposalsService.createProposal(
        {
          job_id: jobId,
          freelancer_id: user.id,
          cover_letter: data.cover_letter,
          bid_amount: data.bid_amount,
          delivery_time_days: data.delivery_days,
        },
        files,
      );
      if (error) throw error;

      return proposalId;
    },
    onMutate: async ({ data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["myProposal", jobId, user?.id],
      });
      await queryClient.cancelQueries({
        queryKey: ["connectsBalance", user?.id],
      });

      // Snapshot previous values
      const previousProposal = queryClient.getQueryData([
        "myProposal",
        jobId,
        user?.id,
      ]);
      const previousConnects = queryClient.getQueryData([
        "connectsBalance",
        user?.id,
      ]);

      // Optimistically update proposal
      const optimisticProposal: Proposal = {
        id: "temp-optimistic-id",
        job_id: jobId!,
        freelancer_id: user!.id,
        cover_letter: data.cover_letter,
        bid_amount: data.bid_amount,
        delivery_days: data.delivery_days,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(
        ["myProposal", jobId, user?.id],
        optimisticProposal,
      );

      // Optimistically update connects balance
      const newBalance = Math.max(
        (connectsBalance?.balance ?? 0) - CONNECTS_COST,
        0,
      );
      queryClient.setQueryData(["connectsBalance", user?.id], {
        balance: newBalance,
        used: (connectsBalance?.used ?? 0) + CONNECTS_COST,
      });

      // Close modal immediately for instant feedback
      setShowProposalModal(false);

      return { previousProposal, previousConnects };
    },
    onSuccess: () => {
      // Invalidate to get real data from server
      queryClient.invalidateQueries({
        queryKey: ["myProposal", jobId, user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["connectsBalance", user?.id],
      });
      showToast(t.jobDetail.proposalSent, "success");

      // Notify client by email (fire-and-forget)
      if (jobId) {
        sendNewProposalEmail(jobId);
      }
    },
    onError: (err, _variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousProposal !== undefined) {
        queryClient.setQueryData(
          ["myProposal", jobId, user?.id],
          context.previousProposal,
        );
      }
      if (context?.previousConnects !== undefined) {
        queryClient.setQueryData(
          ["connectsBalance", user?.id],
          context.previousConnects,
        );
      }

      logger.error("Error submitting proposal:", err);
      showToast(
        err instanceof Error ? err.message : t.jobDetail.proposalError,
        "error",
      );

      // Reopen modal so user can try again
      setShowProposalModal(true);
    },
  });

  const submitProposal = async (data: ProposalFormData, files: File[]) => {
    submitProposalMutation.mutate({ data, files });
  };

  // Withdraw Proposal Mutation
  const withdrawProposalMutation = useMutation({
    mutationFn: async () => {
      if (!myProposal) throw new Error("No proposal to withdraw");
      // Atomic RPC: validates ownership + status + idempotency,
      // deletes the proposal, and refunds connects in one transaction.
      await withdrawProposalWithRefund(myProposal.id);
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["myProposal", jobId, user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["connectsBalance", user?.id],
      });
      showToast(t.jobDetail.proposalWithdrawn, "success");
    },
    onError: () => showToast(t.jobDetail.withdrawError, "error"),
  });

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const withdrawProposal = () => setIsWithdrawModalOpen(true);

  const confirmWithdrawProposal = () => {
    withdrawProposalMutation.mutate(undefined, {
      onSettled: () => setIsWithdrawModalOpen(false),
    });
  };

  // Share
  const shareJob = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast(t.jobDetail.linkCopied, "success");
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !user?.id || !job) return;
    setIsSubmittingReport(true);
    try {
      await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_type: "job",
        reported_id: job.id,
        reason: reportReason.trim(),
      });
      showToast(
        tx(
          "jobDetail.reportSubmitted",
          undefined,
          "Report submitted. Thank you.",
        ),
        "success",
      );
      setIsReportModalOpen(false);
      setReportReason("");
    } catch {
      showToast(
        tx(
          "jobDetail.reportError",
          undefined,
          "Failed to submit report. Try again.",
        ),
        "error",
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)]">
        <Header />
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-9 w-3/4" />
              <div className="flex gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <Skeleton className="h-48 w-full rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)]">
        <Header />
        <div className="container-custom py-16 text-center">
          <Briefcase className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {tx("jobDetail.jobNotFound", undefined, "Job not found")}
          </h2>
          <Button variant="primary" onClick={() => navigate("/jobs")}>
            {tx("jobDetail.browseJobs", undefined, "Browse Jobs")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter min-h-screen bg-[var(--page-bg)] transition-colors duration-300">
      <SEO
        title={
          job
            ? `${job.title} | ${t.seo.jobDetail.titleSuffix}`
            : t.seo.jobDetail.titleSuffix
        }
        description={
          job?.description?.slice(0, 160) || t.seo.jobDetail.descriptionFallback
        }
      />
      <Header />

      <div className="container-custom py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
          <Link to="/" className="hover:text-[var(--workspace-primary)]">
            {t.nav.home}
          </Link>
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          <Link to="/jobs" className="hover:text-[var(--workspace-primary)]">
            {t.nav.jobs}
          </Link>
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          <span className="text-[var(--text-primary)]">
            {t.jobDetail.category[
              CATEGORY_LABELS[job.category] as keyof typeof t.jobDetail.category
            ] || job.category}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Header Card */}
            <div
              className={cn(
                "rounded-lg p-6 border",
                "bg-[var(--card-bg)]",
                "border-[var(--border)]",
                "shadow-sm dark:shadow-none",
              )}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex-1">
                  <h1
                    className={cn(
                      "mb-3 text-2xl font-bold text-[var(--text-primary)]",
                      "break-words [overflow-wrap:anywhere]",
                    )}
                  >
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {tx("jobDetail.postedLabel", undefined, "Posted")}{" "}
                      {timeAgo(job.posted_at, tx)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {job.proposals_count} {t.jobDetail.proposals}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      {job.views_count} {t.jobDetail.views}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={toggleSave}
                    className={cn(
                      "p-2.5 rounded-lg transition-all",
                      isSaved
                        ? "bg-[var(--color-error-light)] dark:bg-[var(--color-error)]/15 text-[var(--color-error)]"
                        : "bg-[var(--color-bg-muted)] text-[var(--text-muted)] hover:text-[var(--color-error)]",
                    )}
                    title={
                      isSaved
                        ? tx(
                            "jobDetail.removeFromSaves",
                            undefined,
                            "Remove from saves",
                          )
                        : tx("jobDetail.saveJob", undefined, "Save this job")
                    }
                  >
                    <Heart
                      className={cn("w-5 h-5", isSaved && "fill-current")}
                    />
                  </button>
                  <button
                    onClick={shareJob}
                    className={cn(
                      "p-2.5 rounded-lg transition-colors",
                      "bg-[var(--color-bg-muted)] text-[var(--text-muted)] hover:text-[var(--workspace-primary)]",
                    )}
                    title={tx(
                      "jobDetail.shareJob",
                      undefined,
                      "Share this job",
                    )}
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Info Chips */}
              <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-[var(--border)]">
                <span
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold",
                    job.job_type === "fixed_price"
                      ? "bg-[var(--color-info-light)] dark:bg-[var(--color-info)]/15 text-[var(--color-info-dark)] dark:text-[var(--color-info)]"
                      : "bg-[var(--color-success-light)] dark:bg-[var(--color-success)]/15 text-[var(--color-success-dark)] dark:text-[var(--color-success)]",
                  )}
                >
                  {job.job_type === "fixed_price"
                    ? t.jobDetail.fixedPrice
                    : t.jobDetail.hourly}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold",
                    "bg-[var(--color-bg-muted)] text-[var(--text-primary)]",
                  )}
                >
                  {t.jobDetail.experience[
                    EXPERIENCE_LABELS[
                      job.experience_level
                    ] as keyof typeof t.jobDetail.experience
                  ] || job.experience_level}
                </span>
                {job.duration && (
                  <span
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background:
                        "var(--workspace-primary-dim, rgba(147,51,234,0.1))",
                      color: "var(--workspace-primary)",
                    }}
                  >
                    {(() => {
                      const durationKeyMap: Record<string, string> = {
                        less_than_1_month: 'jobs.new.stepBudget.durationLessThan1Month',
                        '1_3_months': 'jobs.new.stepBudget.duration1To3Months',
                        '3_6_months': 'jobs.new.stepBudget.duration3To6Months',
                        more_than_6_months: 'jobs.new.stepBudget.durationMoreThan6Months',
                      };
                      const k = durationKeyMap[job.duration];
                      return k ? tx(k, undefined, job.duration) : job.duration;
                    })()}
                  </span>
                )}
              </div>

              {/* Budget Highlight */}
              <div
                className={cn(
                  "rounded-lg p-5 border-l-4",
                  "bg-[var(--workspace-primary-light)]/40 dark:bg-[var(--workspace-primary)]/8",
                  "border-l-[var(--workspace-primary)]",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                  {t.jobDetail.budget}
                </p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {job.job_type === "fixed_price" ? (
                    job.budget_min === job.budget_max || !job.budget_max ? (
                      `${job.budget_min} ${tx("common.currency", undefined, "د.ت")}`
                    ) : (
                      `${job.budget_min} - ${job.budget_max} ${tx("common.currency", undefined, "د.ت")}`
                    )
                  ) : (
                    <>
                      {job.hourly_rate}{" "}
                      {tx("common.currency", undefined, "د.ت")}
                      <span className="text-sm font-normal">
                        {t.jobDetail.perHour}
                      </span>
                      {job.estimated_hours && (
                        <span className="text-xs font-normal text-[var(--text-muted)] block mt-1">
                          {t.jobDetail.approxHours.replace(
                            "{{count}}",
                            String(job.estimated_hours),
                          )}
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Description */}
            <div
              className="rounded-xl p-6 border"
              style={{
                background: "var(--color-background-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                {t.jobDetail.description}
              </h2>
              <div
                className="prose prose-sm max-w-none whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                style={{ color: "var(--color-text-primary)" }}
              >
                {job.description}
              </div>
            </div>

            {/* Skills */}
            <div
              className="rounded-xl p-6 border"
              style={{
                background: "var(--color-background-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                {t.jobDetail.requiredSkills}
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.required_skills?.map((skill, index) => {
                  const skillLabel = getSkillLabel(skill);
                  const isMatch = freelancerProfile?.skills?.some((s) =>
                    "name_ar" in s
                      ? s.name_ar === skillLabel ||
                        s.name_en === skillLabel ||
                        s.name_fr === skillLabel
                      : s.name === skillLabel,
                  );
                  return (
                    <span
                      key={index}
                      className="break-words [overflow-wrap:anywhere] px-3 py-1.5 rounded-lg text-sm font-medium border"
                      style={
                        isMatch
                          ? {
                              background: "var(--color-status-success-bg)",
                              color: "var(--color-status-success)",
                              borderColor: "color-mix(in srgb, var(--color-status-success) 30%, transparent)",
                            }
                          : {
                              background: "var(--color-background-muted)",
                              color: "var(--color-text-primary)",
                              borderColor: "var(--color-border-subtle)",
                            }
                      }
                    >
                      {isMatch && (
                        <CheckCircle className="w-3 h-3 inline me-1" />
                      )}
                      {skillLabel}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Attachments */}
            {job.attachments && job.attachments.length > 0 && (
              <div
                className="rounded-xl p-6 border"
                style={{
                  background: "var(--color-background-elevated)",
                  borderColor: "var(--color-border-subtle)",
                }}
              >
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {t.jobDetail.attachments}
                </h2>
                <div className="space-y-2">
                  {job.attachments.map((url, index) => {
                    const filename =
                      url.split("/").pop() ||
                      t.jobDetail.file.replace("{{index}}", String(index + 1));
                    return (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border transition-colors"
                        style={{
                          background: "var(--color-background-subtle)",
                          borderColor: "var(--color-border-default)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--color-background-muted)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "var(--color-background-subtle)")
                        }
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-[color:var(--workspace-primary)]" />
                          <span
                            className="text-sm"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {filename}
                          </span>
                        </div>
                        <Download
                          className="w-4 h-4"
                          style={{ color: "var(--color-text-secondary)" }}
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <div
                className="rounded-xl p-6 border"
                style={{
                  background: "var(--color-background-elevated)",
                  borderColor: "var(--color-border-subtle)",
                }}
              >
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {tx("jobDetail.similarJobs", undefined, "Similar jobs")}
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {similarJobs.map((j) => (
                    <SimilarJobCard
                      key={j.id}
                      job={j}
                      onClick={() => navigate(`/jobs/${j.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Action Card */}
            <div
              className="rounded-xl p-6 border space-y-4"
              style={{
                background: "var(--color-background-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              {myProposal ? (
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'var(--color-status-success-bg)' }}
                  >
                    <CheckCircle className="w-6 h-6" style={{ color: 'var(--color-status-success)' }} />
                  </div>
                  <h3
                    className="font-semibold text-base mb-1"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {tx(
                      "jobDetail.proposalSubmitted",
                      undefined,
                      "Your proposal was submitted",
                    )}
                  </h3>
                  <p
                    className="text-sm mb-4"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {tx("jobDetail.yourBid", undefined, "Your bid:")}{" "}
                    {myProposal.bid_amount}{" "}
                    {tx("common.currency", undefined, "د.ت")}
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(ROUTES.myProposals)}
                    >
                      {tx("jobDetail.viewProposal", undefined, "View proposal")}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      style={{ color: 'var(--color-status-error)' }}
                      onClick={withdrawProposal}
                    >
                      {tx("jobDetail.withdrawProposal", undefined, "سحب العرض")}
                    </Button>
                  </div>
                </div>
              ) : user?.id === job.client_id ? (
                <div className="text-center">
                  <p
                    className="text-sm mb-3"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {tx("jobDetail.yourJob", undefined, "This is your job")}
                  </p>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => navigate(getClientJobProposalsRoute(job.id))}
                  >
                    {tx("jobDetail.manageJob", undefined, "Manage job")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={openProposalFlow}
                    rightIcon={<Send className="w-5 h-5" />}
                  >
                    {tx("jobDetail.submitProposal", undefined, "Submit Proposal")}
                  </Button>

                  {freelancerProfile && (
                    <div
                      className="rounded-lg border p-4"
                      style={
                        connectsAvailable >= CONNECTS_COST
                          ? {
                              borderColor: "var(--color-status-info)",
                              background:
                                "var(--color-status-info-bg, rgba(59,130,246,0.08))",
                            }
                          : {
                              borderColor: "var(--color-status-error)",
                              background:
                                "var(--color-status-error-bg, rgba(239,68,68,0.08))",
                            }
                      }
                    >
                      <div
                        className="flex items-center justify-between gap-4"
                        style={
                          connectsAvailable >= CONNECTS_COST
                            ? {
                                color:
                                  "var(--color-status-info-text, var(--color-status-info))",
                              }
                            : {
                                color:
                                  "var(--color-status-error-text, var(--color-status-error))",
                              }
                        }
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {tx(
                              "jobDetail.submissionRequirements",
                              undefined,
                              "Submission Requirements",
                            )}
                          </p>
                          <p className="mt-1 text-xs opacity-80">
                            {tx(
                              "jobDetail.connectsRequiredDescription",
                              undefined,
                              "This proposal requires connects before sending.",
                            )}
                          </p>
                        </div>
                        <span
                          className="rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap"
                          style={{
                            background: "var(--color-background-elevated)",
                            color:
                              connectsAvailable >= CONNECTS_COST
                                ? "var(--color-status-info)"
                                : "var(--color-status-error)",
                          }}
                        >
                          {connectsAvailable >= CONNECTS_COST
                            ? tx(
                                "jobDetail.readyToSubmit",
                                undefined,
                                "Ready to submit",
                              )
                            : tx(
                                "jobDetail.insufficientBalance",
                                undefined,
                                "Insufficient balance",
                              )}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                        <div
                          className="rounded-lg p-3 border"
                          style={
                            connectsAvailable >= CONNECTS_COST
                              ? {
                                  borderColor: "var(--color-status-info)",
                                  background:
                                    "var(--color-background-elevated)",
                                }
                              : {
                                  borderColor: "var(--color-status-error)",
                                  background:
                                    "var(--color-background-elevated)",
                                }
                          }
                        >
                          <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">
                            {tx("jobDetail.balance", undefined, "Balance")}
                          </p>
                          <p className="mt-2 text-lg font-bold">
                            {connectsAvailable}
                          </p>
                        </div>
                        <div
                          className="rounded-lg p-3 border"
                          style={
                            connectsAvailable >= CONNECTS_COST
                              ? {
                                  borderColor: "var(--color-status-info)",
                                  background:
                                    "var(--color-background-elevated)",
                                }
                              : {
                                  borderColor: "var(--color-status-error)",
                                  background:
                                    "var(--color-background-elevated)",
                                }
                          }
                        >
                          <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">
                            {tx("jobDetail.required", undefined, "Required")}
                          </p>
                          <p className="mt-2 text-lg font-bold">
                            {CONNECTS_COST}
                          </p>
                        </div>
                        <div
                          className="rounded-lg p-3 border"
                          style={
                            connectsAvailable >= CONNECTS_COST
                              ? {
                                  borderColor: "var(--color-status-info)",
                                  background:
                                    "var(--color-background-elevated)",
                                }
                              : {
                                  borderColor: "var(--color-status-error)",
                                  background:
                                    "var(--color-background-elevated)",
                                }
                          }
                        >
                          <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">
                            {tx("jobDetail.remaining", undefined, "Remaining")}
                          </p>
                          <p className="mt-2 text-lg font-bold">
                            {connectsRemainingAfterSubmit}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs leading-6 opacity-80">
                        {connectsAvailable >= CONNECTS_COST
                          ? tx(
                              "jobDetail.connectsDeductionWarning",
                              { count: CONNECTS_COST },
                              `${CONNECTS_COST} connects will be deducted immediately after submitting the proposal.`,
                            )
                          : tx(
                              "jobDetail.additionalConnectsNeeded",
                              { count: CONNECTS_COST - connectsAvailable },
                              `You need ${CONNECTS_COST - connectsAvailable} additional connects before submitting this proposal.`,
                            )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Client Info */}
            <div
              className="rounded-xl p-6 border"
              style={{
                background: "var(--color-background-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <h3
                className="font-semibold text-base mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                {tx("jobDetail.aboutClient", undefined, "عن العميل")}
              </h3>
              <div
                className="flex items-center gap-3 mb-5 pb-5 border-b"
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                {job.client?.avatar_url ? (
                  <OptimizedImage
                    src={job.client.avatar_url}
                    alt={job.client.full_name}
                    className="w-12 h-12 rounded-lg"
                    imgClassName="object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--color-background-muted)" }}
                  >
                    <User
                      className="w-6 h-6"
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                  </div>
                )}
                <div>
                  <p
                    className="font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {job.client?.full_name || t.jobDetail.defaultClient}
                  </p>
                  {job.client?.location && (
                    <p
                      className="text-xs flex items-center gap-1 mt-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <MapPin className="w-3 h-3" />
                      {localizeGovernorate(job.client.location, language)}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm mb-5">
                <div className="flex justify-between">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {tx("jobDetail.memberSince", undefined, "Member since")}
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {job.client?.created_at
                      ? formatDate(job.client.created_at, language)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {tx("jobDetail.postedJobs", undefined, "Posted Jobs")}
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {clientStats.totalJobs}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {tx("jobDetail.totalSpending", undefined, "Total Spending")}
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {clientStats.totalSpent.toLocaleString()} {tx('dynamic_key_1524267')}</span>
                </div>
                {clientStats.rating > 0 && (
                  <div
                    className="flex justify-between items-center pt-2 border-t"
                    style={{ borderColor: "var(--color-border-subtle)" }}
                  >
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {tx("jobDetail.rating", undefined, "Rating")}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Star
                        className="w-4 h-4 fill-current"
                        style={{
                          color: "var(--color-status-warning, #f59e0b)",
                        }}
                      />
                      <span style={{ color: "var(--color-text-primary)" }}>
                        {clientStats.rating.toFixed(1)}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              <Link
                to={`/client/${job.client_id}`}
                className={cn(
                  "block w-full text-center px-4 py-2.5 rounded-lg border transition-colors",
                  "text-[color:var(--workspace-primary)] border-[color:var(--workspace-primary)]/20",
                  "hover:bg-[color:var(--workspace-primary)]/5 text-sm font-medium",
                )}
              >
                {tx("jobDetail.viewProfile", undefined, "View Profile")}
              </Link>
            </div>

            {/* Job Stats */}
            <div
              className="rounded-xl p-6 border"
              style={{
                background: "var(--color-background-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <h3
                className="font-semibold text-base mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                {tx("jobDetail.jobStats", undefined, "Job Stats")}
              </h3>
              <div className="space-y-3 text-sm">
                <div
                  className="flex justify-between pb-3 border-b"
                  style={{ borderColor: "var(--color-border-subtle)" }}
                >
                  <span
                    className="font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {tx("jobDetail.proposals", undefined, "Proposals")}
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {job.proposals_count}
                  </span>
                </div>
                <div
                  className="flex justify-between pb-3 border-b"
                  style={{ borderColor: "var(--color-border-subtle)" }}
                >
                  <span
                    className="font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {tx("jobDetail.views", undefined, "Views")}
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {job.views_count}
                  </span>
                </div>
                {job.deadline && (
                  <div className="flex justify-between">
                    <span
                      className="font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {tx("jobDetail.deadline", undefined, "Deadline")}
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {new Date(job.deadline).toLocaleDateString(
                        language === "ar"
                          ? "ar-TN"
                          : language === "fr"
                            ? "fr-FR"
                            : "en-US",
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Report */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full text-center text-sm font-medium flex items-center justify-center gap-1.5 py-2 transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--color-status-error)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--color-text-secondary)")
              }
            >
              <Flag className="w-4 h-4" />
              {tx("jobDetail.reportJob", undefined, "Report This Job")}
            </button>
          </div>
        </div>
      </div>

      {!user ? <Footer /> : null}

      {/* Mobile sticky apply CTA */}
      {!myProposal && user?.id !== job.client_id && applyDecision.allowed && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-4 pb-safe-area-inset-bottom"
          style={{
            background: 'color-mix(in srgb, var(--color-background-elevated) 92%, transparent)',
            borderTop: '1px solid var(--color-border-subtle)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
            paddingTop: '0.75rem',
          }}
        >
          <button
            onClick={openProposalFlow}
            className="w-full rounded-2xl py-3.5 font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--workspace-primary) 0%, var(--workspace-primary-hover) 100%)' }}
          >
            {tx('jobDetail.submitProposal', undefined, 'Submit Proposal')}
          </button>
        </div>
      )}

      {job && (
        <ProposalModal
          isOpen={showProposalModal}
          onClose={() => setShowProposalModal(false)}
          job={job}
          onSubmit={submitProposal}
          isSubmitting={submitProposalMutation.isPending}
        />
      )}

      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title={tx(
          "jobDetail.confirmWithdrawal",
          undefined,
          "Confirm Withdrawal",
        )}
        size="md"
      >
        <div className="space-y-6 pt-4">
          <p style={{ color: "var(--color-text-secondary)" }}>
            {tx(
              "jobDetail.withdrawConfirmDesc",
              undefined,
              "Are you sure you want to withdraw this proposal? This action cannot be undone.",
            )}
          </p>
          <div className="flex gap-3 justify-end pr-0">
            <Button
              variant="outline"
              onClick={() => setIsWithdrawModalOpen(false)}
            >
              {tx("common.cancel", undefined, "Cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={confirmWithdrawProposal}
              isLoading={withdrawProposalMutation.isPending}
            >
              {tx("jobDetail.yesWithdraw", undefined, "Yes, Withdraw Proposal")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={tx("jobDetail.reportJobTitle", undefined, "Report Job")}
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {tx(
              "jobDetail.reportJobDescription",
              undefined,
              "Tell us why this job violates our community guidelines.",
            )}
          </p>
          <div className="space-y-2">
            {["spam", "misleading", "inappropriate", "fraud", "other"].map(
              (reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                  style={{
                    borderColor:
                      reportReason === reason
                        ? "var(--workspace-primary)"
                        : "var(--color-border-default)",
                    background:
                      reportReason === reason
                        ? "var(--workspace-primary-dim, rgba(147,51,234,0.08))"
                        : "var(--color-background-elevated)",
                  }}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                    className="accent-[var(--workspace-primary)]"
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {tx(
                      `jobDetail.reportReason.${reason}`,
                      undefined,
                      reason.charAt(0).toUpperCase() + reason.slice(1),
                    )}
                  </span>
                </label>
              ),
            )}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReportModalOpen(false)}
            >
              {tx("common.cancel", undefined, "Cancel")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReport}
              isLoading={isSubmittingReport}
              disabled={!reportReason}
            >
              {tx("jobDetail.submitReport", undefined, "Submit Report")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default JobDetail;

