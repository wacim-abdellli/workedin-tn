import { logger } from "@/lib/logger";
import { supabase } from "../lib/supabase";
import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Box,
  Heart,
  Clock,
  Briefcase,
  Eye,
  Users,
  Figma,
  FolderOpen,
  FileText,
  Download,
  Share2,
  Flag,
  CheckCircle,
  XCircle,
  ChevronRight,
  ExternalLink,
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Palette,
  Send,
  Twitter,
  Youtube,
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
import SimilarJobCard from "../components/jobs/SimilarJobCard";
import ClientInfoSidebar from "../components/jobs/ClientInfoSidebar";
import OptimizedImage from "../components/common/OptimizedImage";
import {
  canApplyToJob,
  canSaveJob,
  getAccessMessage,
} from "../lib/marketplaceAccess";
import { localizeGovernorate } from "../lib/governorates";
import { ROUTES, getClientJobProposalsRoute } from "../lib/routes";
import {
  getJobReferenceLinkMeta,
  sanitizeJobReferenceLinks,
  type JobLinkPlatform,
} from "../lib/jobLinks";

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
  reference_links?: string[];
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

function resolveJobAttachmentUrl(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const normalizedPath = trimmed.replace(/^\/+/, '').replace(/^attachments\//i, '');
  return supabase.storage.from('attachments').getPublicUrl(normalizedPath).data.publicUrl;
}

function getAttachmentExtension(urlOrPath: string): string {
  const withoutQuery = urlOrPath.split('?')[0].split('#')[0].toLowerCase();
  const dotIndex = withoutQuery.lastIndexOf('.');
  if (dotIndex < 0) return '';
  return withoutQuery.slice(dotIndex + 1);
}

function isImageAttachment(urlOrPath: string): boolean {
  const extension = getAttachmentExtension(urlOrPath);
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif'].includes(extension);
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

const LINK_BADGE_STYLE: Record<JobLinkPlatform, string> = {
  google_drive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  linkedin: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
  github: 'bg-zinc-400/15 text-zinc-200 border-zinc-400/25',
  youtube: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
  instagram: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25',
  facebook: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  x: 'bg-slate-500/15 text-slate-200 border-slate-500/25',
  tiktok: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  dropbox: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  behance: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  figma: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  website: 'bg-white/10 text-white/80 border-white/15',
};

function JobLinkPlatformIcon({ platform }: { platform: JobLinkPlatform }) {
  if (platform === 'google_drive') return <FolderOpen className="h-4 w-4" />;
  if (platform === 'linkedin') return <Linkedin className="h-4 w-4" />;
  if (platform === 'github') return <Github className="h-4 w-4" />;
  if (platform === 'youtube') return <Youtube className="h-4 w-4" />;
  if (platform === 'instagram') return <Instagram className="h-4 w-4" />;
  if (platform === 'facebook') return <Facebook className="h-4 w-4" />;
  if (platform === 'x') return <Twitter className="h-4 w-4" />;
  if (platform === 'tiktok') return <Box className="h-4 w-4" />;
  if (platform === 'dropbox') return <Box className="h-4 w-4" />;
  if (platform === 'behance') return <Palette className="h-4 w-4" />;
  if (platform === 'figma') return <Figma className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
}

function CountdownTimer({ resetAt }: { resetAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!resetAt) {
      setTimeLeft("");
      return;
    }
    const update = () => {
      const target = new Date(resetAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${mins}m ${secs}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [resetAt]);

  return <span>{timeLeft}</span>;
}

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
  const requiresFreelancerWorkspace =
    applyDecision.reason === 'freelancer_role_required' ||
    applyDecision.reason === 'freelancer_workspace_required';

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
      if (error) throw new Error(error.message ?? 'Failed to load job');

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

  const { data: dailyProposalUsageData } = useQuery({
    queryKey: ["dailyProposalUsage", user?.id],
    queryFn: () => proposalsService.getDailyProposalUsage(user!.id),
    enabled: !!user?.id && !!freelancerProfile,
  });
  const dailyProposalUsage = dailyProposalUsageData ?? {
    used: 0,
    remaining: 6,
    limit: 6,
    resetAt: null,
  };
  const canSubmitToday = dailyProposalUsage.remaining > 0;
  const dailyUsagePercent =
    dailyProposalUsage.limit > 0
      ? Math.min(
          100,
          Math.round((dailyProposalUsage.used / dailyProposalUsage.limit) * 100),
        )
      : 0;
  const canViewClientProfile = Boolean(job?.client_id) && user?.id !== job?.client_id;

  const normalizedProposalStatus = String(myProposal?.status || '').toLowerCase();
  const isAcceptedProposal = ['accepted', 'hired'].includes(normalizedProposalStatus);
  const isDeclinedProposal = ['rejected', 'declined', 'archived'].includes(normalizedProposalStatus);
  const isWithdrawnProposal = ['withdrawn', 'canceled', 'cancelled'].includes(normalizedProposalStatus);
  const canWithdrawCurrentProposal = Boolean(
    myProposal && !isAcceptedProposal && !isDeclinedProposal && !isWithdrawnProposal,
  );

  const proposalCardTitle = isAcceptedProposal
    ? tx('jobDetail.proposalAccepted', undefined, 'Your proposal was accepted')
    : isDeclinedProposal
    ? tx('jobDetail.proposalDeclined', undefined, 'Your proposal was declined')
    : isWithdrawnProposal
    ? tx('jobDetail.proposalWithdrawnTitle', undefined, 'Your proposal was withdrawn')
    : tx('jobDetail.proposalSubmitted', undefined, 'Your proposal was submitted');

  const proposalStatusLabel = isAcceptedProposal
    ? tx('jobDetail.proposalAcceptedStatus', undefined, 'Accepted')
    : isDeclinedProposal
    ? tx('jobDetail.proposalDeclinedStatus', undefined, 'Declined')
    : isWithdrawnProposal
    ? tx('jobDetail.proposalWithdrawnStatus', undefined, 'Withdrawn')
    : tx('jobDetail.proposalPendingStatus', undefined, 'Pending');

  const attachmentItems = useMemo(() => {
    if (!job?.attachments || job.attachments.length === 0) return [];

    return job.attachments
      .map((rawAttachment, index) => {
        const url = resolveJobAttachmentUrl(rawAttachment);
        if (!url) return null;

        const extension = getAttachmentExtension(rawAttachment || url);
        return {
          url,
          extension,
          isImage: isImageAttachment(rawAttachment || url),
          displayIndex: index + 1,
        };
      })
      .filter(
        (
          item,
        ): item is {
          url: string;
          extension: string;
          isImage: boolean;
          displayIndex: number;
        } => Boolean(item),
      );
  }, [job?.attachments]);

  const imageAttachments = attachmentItems.filter((item) => item.isImage);
  const fileAttachments = attachmentItems.filter((item) => !item.isImage);
  const pdfAttachments = fileAttachments.filter((item) => item.extension === 'pdf');
  const otherFileAttachments = fileAttachments.filter((item) => item.extension !== 'pdf');

  const referenceLinkItems = useMemo(() => {
    return sanitizeJobReferenceLinks(job?.reference_links || [])
      .map((link) => getJobReferenceLinkMeta(link))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [job?.reference_links]);

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

    if (!canSubmitToday) {
      showToast(
        tx(
          "jobDetail.dailyApplyLimitReached",
          { limit: dailyProposalUsage.limit },
          `You reached your 48h limit of ${dailyProposalUsage.limit} applications. Try again later.`,
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
      if (error) throw new Error(error.message ?? 'Failed to submit proposal');

      return proposalId;
    },
    onMutate: async ({ data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["myProposal", jobId, user?.id],
      });

      // Snapshot previous values
      const previousProposal = queryClient.getQueryData([
        "myProposal",
        jobId,
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

      // Close modal immediately for instant feedback
      setShowProposalModal(false);
      showToast(t.jobDetail.proposalSent, "success");

      return { previousProposal };
    },
    onSuccess: () => {
      // Invalidate to get real data from server
      queryClient.invalidateQueries({
        queryKey: ["myProposal", jobId, user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["dailyProposalUsage", user?.id],
      });

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

      logger.error("Error submitting proposal:", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof (err as any)?.message === 'string'
          ? (err as any).message
          : t.jobDetail.proposalError;
      showToast(message, 'error');

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
      const { error } = await proposalsService.withdrawProposal(myProposal.id);
      if (error) throw new Error(error.message ?? 'Failed to withdraw proposal');
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["myProposal", jobId, user?.id],
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
      <div className="min-h-screen bg-[var(--color-bg-base)]">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-9 w-3/4 bg-white/5" />
              <div className="flex gap-3">
                <Skeleton className="h-6 w-24 rounded-full bg-white/5" />
                <Skeleton className="h-6 w-20 rounded-full bg-white/5" />
                <Skeleton className="h-6 w-28 rounded-full bg-white/5" />
              </div>
              <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-white/5" />
                <Skeleton className="h-4 w-full bg-white/5" />
                <Skeleton className="h-4 w-2/3 bg-white/5" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full bg-white/5" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />
              <Skeleton className="h-32 w-full rounded-2xl bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)]">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
          <Briefcase className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-white">
            {tx("jobDetail.jobNotFound", undefined, "Job not found")}
          </h2>
          <Button variant="primary" onClick={() => navigate("/jobs")} className="mt-4">
            {tx("jobDetail.browseJobs", undefined, "Browse Jobs")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter min-h-screen bg-[var(--color-bg-base)] transition-colors duration-300">
      <SEO
        title={job ? `${job.title} | ${t.seo.jobDetail.titleSuffix}` : t.seo.jobDetail.titleSuffix}
        description={job?.description?.slice(0, 160) || t.seo.jobDetail.descriptionFallback}
      />
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-white/40 mb-7">
          <Link to="/" className="hover:text-white/70 transition-colors">{t.nav.home}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/jobs" className="hover:text-white/70 transition-colors">{t.nav.jobs}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white/60">
            {t.jobDetail.category[CATEGORY_LABELS[job.category] as keyof typeof t.jobDetail.category] || job.category}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Hero Header Card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-violet-500/5 to-transparent">
              <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-20 blur-3xl bg-violet-500" />
              <div className="relative p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight break-words [overflow-wrap:anywhere]">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={toggleSave}
                      className={cn(
                        'group flex h-9 w-9 items-center justify-center rounded-xl border transition-all',
                        isSaved
                          ? 'border-rose-500/40 bg-rose-500/10'
                          : 'border-white/5 bg-white/[0.02] hover:border-rose-500/40 hover:bg-rose-500/10',
                      )}
                      title={isSaved ? tx('jobDetail.removeFromSaves', undefined, 'Remove from saves') : tx('jobDetail.saveJob', undefined, 'Save this job')}
                    >
                      <Heart className={cn('w-4 h-4 transition-colors', isSaved ? 'fill-rose-400 text-rose-400' : 'text-white/50 group-hover:text-rose-400')} />
                    </button>
                    <button
                      onClick={shareJob}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-white/50 transition-all hover:border-white/10 hover:bg-white/5 hover:text-white"
                      title={tx('jobDetail.shareJob', undefined, 'Share this job')}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] uppercase tracking-wider font-bold text-white/40 mb-5">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{tx('jobDetail.postedLabel', undefined, 'Posted')} {timeAgo(job.posted_at, tx)}</span>
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{job.proposals_count} {t.jobDetail.proposals}</span>
                  <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{job.views_count} {t.jobDetail.views}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-white/5">
                  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      job.job_type === 'fixed_price' ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                    {job.job_type === 'fixed_price' ? t.jobDetail.fixedPrice : t.jobDetail.hourly}
                  </span>
                  <span className="inline-flex items-center rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {t.jobDetail.experience[EXPERIENCE_LABELS[job.experience_level] as keyof typeof t.jobDetail.experience] || job.experience_level}
                  </span>
                  {job.duration && (
                    <span className="inline-flex items-center rounded-md bg-violet-500/10 text-violet-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                      {(() => {
                        const durationKeyMap: Record<string, string> = {
                          less_than_1_month: 'jobs.new.stepBudget.durationLessThan1Month',
                          '1_3_months': 'jobs.new.stepBudget.duration1To3Months',
                          '3_6_months': 'jobs.new.stepBudget.duration3To6Months',
                          more_than_6_months: 'jobs.new.stepBudget.durationMoreThan6Months',
                        };
                        const k = durationKeyMap[job.duration!];
                        return k ? tx(k, undefined, job.duration) : job.duration;
                      })()}
                    </span>
                  )}
                </div>

                {/* Budget */}
                <div className="rounded-xl p-4 flex items-center gap-4 bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black bg-violet-500/20 text-violet-400">
                    TND
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/80 mb-0.5">{t.jobDetail.budget}</p>
                    <p className="text-2xl font-black text-white leading-none">
                      {job.job_type === 'fixed_price' ? (
                        job.budget_min === job.budget_max || !job.budget_max
                          ? `${job.budget_min} ${tx('common.currency', undefined, 'TND')}`
                          : `${job.budget_min} – ${job.budget_max} ${tx('common.currency', undefined, 'TND')}`
                      ) : (
                        <>
                          {job.hourly_rate} {tx('common.currency', undefined, 'TND')}
                          <span className="text-sm font-normal text-white/50 ms-1">{t.jobDetail.perHour}</span>
                        </>
                      )}
                    </p>
                    {job.job_type === 'hourly' && job.estimated_hours && (
                      <p className="text-xs text-white/50 mt-0.5 font-medium">{t.jobDetail.approxHours.replace('{{count}}', String(job.estimated_hours))}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 opacity-60 text-violet-400" />
                {t.jobDetail.description}
              </h2>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-white/70 leading-7">
                {job.description}
              </div>
            </div>

            {/* Reference Links */}
            {referenceLinkItems.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
                <h2 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 opacity-60 text-violet-400" />
                  {tx('jobDetail.referenceLinks', undefined, 'Reference links')}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {referenceLinkItems.map((item, index) => (
                    <a
                      key={`${item.url}-${index}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex items-start gap-3">
                          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${LINK_BADGE_STYLE[item.platform]}`}>
                            <JobLinkPlatformIcon platform={item.platform} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                              {item.platformLabel}
                            </p>
                            <p className="truncate text-[11px] text-white/40">{item.hostname}</p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 shrink-0 text-white/30 transition group-hover:text-white/60" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {job.required_skills && job.required_skills.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
                <h2 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 opacity-60 text-violet-400" />
                  {t.jobDetail.requiredSkills}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, index) => {
                    const skillLabel = getSkillLabel(skill);
                    const isMatch = freelancerProfile?.skills?.some((s) =>
                      'name_ar' in s
                        ? s.name_ar === skillLabel || s.name_en === skillLabel || s.name_fr === skillLabel
                        : s.name === skillLabel,
                    );
                    return (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1.5 break-words [overflow-wrap:anywhere] px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border transition-colors ${
                          isMatch ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/60 border-white/10'
                        }`}
                      >
                        {isMatch && <CheckCircle className="w-3 h-3 shrink-0" />}
                        {skillLabel}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attachments */}
            {attachmentItems.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
                <h2 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4">{t.jobDetail.attachments}</h2>

                {imageAttachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {imageAttachments.map((item) => (
                      <a
                        key={`${item.url}-${item.displayIndex}`}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors"
                      >
                        <div className="aspect-[4/3] bg-black/40">
                          <img
                            src={item.url}
                            alt={tx('jobDetail.attachmentLabel', { index: item.displayIndex }, `Attachment ${item.displayIndex}`)}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="px-3 py-2 flex items-center justify-between border-t border-white/5">
                          <span className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                            {tx('jobDetail.attachmentLabel', { index: item.displayIndex }, `Attachment ${item.displayIndex}`)}
                          </span>
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{item.extension || 'IMG'}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : null}

                {pdfAttachments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    {pdfAttachments.map((item) => (
                      <div
                        key={`${item.url}-${item.displayIndex}`}
                        className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
                      >
                        <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
                          <span className="text-xs font-bold text-white">
                            {tx('jobDetail.attachmentLabel', { index: item.displayIndex }, `Attachment ${item.displayIndex}`)}
                          </span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] uppercase tracking-wider font-bold text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            {tx('jobDetail.openFile', undefined, 'Open file')}
                          </a>
                        </div>
                        <iframe
                          src={item.url}
                          title={tx('jobDetail.attachmentLabel', { index: item.displayIndex }, `Attachment ${item.displayIndex}`)}
                          className="w-full h-72 bg-black/40"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

                {otherFileAttachments.length > 0 ? (
                  <div className="space-y-2">
                    {otherFileAttachments.map((item) => (
                      <a
                        key={`${item.url}-${item.displayIndex}`}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                              {tx('jobDetail.attachmentLabel', { index: item.displayIndex }, `Attachment ${item.displayIndex}`)}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{item.extension || tx('jobDetail.fileType', undefined, 'FILE')}</p>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
                <h2 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4">{tx('jobDetail.similarJobs', undefined, 'Similar jobs')}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {similarJobs.map((j) => (
                    <SimilarJobCard key={j.id} job={j} onClick={() => navigate(`/jobs/${j.id}`)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-[300px] shrink-0 space-y-4">

            {/* Action Card */}
            <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent p-5 space-y-4 shadow-xl">
              {myProposal ? (
                <div className="text-center py-2">
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3',
                    isDeclinedProposal
                      ? 'bg-rose-500/15'
                      : isWithdrawnProposal
                      ? 'bg-amber-500/15'
                      : 'bg-emerald-500/15',
                  )}>
                    {isDeclinedProposal ? (
                      <XCircle className="w-7 h-7 text-rose-400" />
                    ) : isWithdrawnProposal ? (
                      <Clock className="w-7 h-7 text-amber-400" />
                    ) : (
                      <CheckCircle className="w-7 h-7 text-emerald-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-on-surface text-base mb-1">{proposalCardTitle}</h3>
                  <p className="text-xs text-white/45 mb-1">{proposalStatusLabel}</p>
                  <p className="text-sm text-white/50 mb-4">{tx('jobDetail.yourBid', undefined, 'Your bid:')} {myProposal.bid_amount} {tx('common.currency', undefined, 'TND')}</p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate(ROUTES.myProposals)}>
                      {tx('jobDetail.viewProposal', undefined, 'View proposal')}
                    </Button>
                    {canWithdrawCurrentProposal && (
                      <Button variant="ghost" className="w-full rounded-xl text-rose-400 hover:text-rose-300" onClick={withdrawProposal}>
                        {tx('jobDetail.withdrawProposal', undefined, 'Withdraw proposal')}
                      </Button>
                    )}
                  </div>
                </div>
              ) : user?.id === job.client_id ? (
                <div className="text-center py-2">
                  <p className="text-sm text-white/50 mb-3">{tx('jobDetail.yourJob', undefined, 'This is your job')}</p>
                  <Button variant="primary" className="w-full rounded-xl" onClick={() => navigate(getClientJobProposalsRoute(job.id))}>
                    {tx('jobDetail.manageJob', undefined, 'Manage job')}
                  </Button>
                </div>
              ) : !applyDecision.allowed ? (
                <div className="space-y-4">
                  {/* Contextual access message */}
                  <div
                    className="rounded-2xl p-5 text-center"
                    style={{
                      background: requiresFreelancerWorkspace
                        ? 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(15,23,42,0.7) 100%)'
                        : 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(15,23,42,0.7) 100%)',
                      border: `1px solid ${requiresFreelancerWorkspace ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}`,
                    }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{
                        background: requiresFreelancerWorkspace
                          ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                      }}>
                      {requiresFreelancerWorkspace ? (
                        <Briefcase className="w-6 h-6 text-amber-400" />
                      ) : applyDecision.reason === 'auth_required' ? (
                        <Send className="w-6 h-6 text-blue-400" />
                      ) : (
                        <CheckCircle className="w-6 h-6 text-blue-400" />
                      )}
                    </div>
                    <h3 className="font-bold text-on-surface text-sm mb-1">
                      {requiresFreelancerWorkspace
                        ? tx('jobDetail.clientCantApplyTitle', undefined, 'Client accounts cannot apply')
                        : applyDecision.reason === 'auth_required'
                        ? tx('jobDetail.loginRequiredTitle', undefined, 'Sign in to apply')
                        : applyDecision.reason === 'freelancer_onboarding_required'
                        ? tx('jobDetail.completeOnboardingTitle', undefined, 'Complete onboarding first')
                        : applyDecision.reason === 'freelancer_profile_incomplete'
                        ? tx('jobDetail.completeProfileTitle', undefined, 'Complete your profile')
                        : tx('jobDetail.cannotApplyTitle', undefined, 'Cannot apply yet')}
                    </h3>
                    <p className="text-xs text-white/45 mb-4 leading-relaxed">
                      {getAccessMessage(applyDecision.reason, applyDecision.completion)}
                    </p>
                    {applyDecision.nextStepPath && (
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={() => navigate(applyDecision.nextStepPath!, { state: { from: location.pathname } })}
                      >
                        {requiresFreelancerWorkspace
                          ? tx('jobDetail.switchToFreelancer', undefined, 'Switch to Freelancer')
                          : applyDecision.reason === 'auth_required'
                          ? tx('jobDetail.signIn', undefined, 'Sign in')
                          : tx('jobDetail.completeNow', undefined, 'Complete now')}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={openProposalFlow}
                    disabled={!canSubmitToday}
                    className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl font-bold text-white text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.23)] hover:bg-violet-500 bg-violet-600"
                  >
                    <Send className="w-4 h-4" />
                    {tx('jobDetail.submitProposal', undefined, 'Submit Proposal')}
                  </button>

                  {freelancerProfile && (
                    <div className="flex flex-col items-center justify-center pt-1.5 pb-1">
                      {canSubmitToday ? (
                        <p className="text-[11px] font-medium text-white/50 flex items-center gap-1.5">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            dailyProposalUsage.remaining > 2 ? "bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                          )}></span>
                          {tx('jobDetail.inlineRemainingHint', { remaining: dailyProposalUsage.remaining }, `${dailyProposalUsage.remaining} applications available`)}
                        </p>
                      ) : (
                        <p className="text-[11px] font-medium text-rose-400/80 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {tx('jobDetail.inlineRechargingHint', undefined, 'Recharging in')}
                          {dailyProposalUsage.resetAt && <span className="font-bold tracking-wider"><CountdownTimer resetAt={dailyProposalUsage.resetAt} /></span>}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Client Info */}
            <ClientInfoSidebar
              clientName={job.client?.full_name || t.jobDetail.defaultClient}
              location={job.client?.location ? localizeGovernorate(job.client.location, language) : 'Tunis'}
              avatarUrl={job.client?.avatar_url || null}
              ratingText={clientStats.rating > 0 ? `${clientStats.rating.toFixed(1)} of 5 reviews` : '4.8 of 5 reviews'}
              jobsPosted={clientStats.totalJobs > 0 ? `${clientStats.totalJobs}` : '15'}
              hireRate="75%"
              totalSpent={clientStats.totalSpent > 0 ? `${clientStats.totalSpent.toLocaleString()} TND` : '15k+ TND'}
              avgHourlyPaid="45 TND/hr"
              paymentVerified={!!job.client?.payment_verified}
              phoneVerified={!!job.client?.phone_verified}
              emailVerified={true} // Usually true since Auth requires it
              memberSince={job.client?.created_at ? new Date(job.client.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Mar 2026'}
              onViewProfile={
                canViewClientProfile ? () => navigate(`/client/${job.client_id}`) : undefined
              }
              isOwnProfile={user?.id === job.client_id}
            />

            {/* Job Stats */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h3 className="text-xs uppercase tracking-wider font-bold text-white/70 mb-3">{tx('jobDetail.jobStats', undefined, 'Job Stats')}</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/45 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{tx('jobDetail.proposals', undefined, 'Proposals')}</span>
                  <span className="font-semibold text-white">{job.proposals_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/45 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{tx('jobDetail.views', undefined, 'Views')}</span>
                  <span className="font-semibold text-white">{job.views_count}</span>
                </div>
                {job.deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/45 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{tx('jobDetail.deadline', undefined, 'Deadline')}</span>
                    <span className="font-semibold text-white">
                      {new Date(job.deadline).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Report */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full text-center text-xs font-medium flex items-center justify-center gap-1.5 py-2 text-white/25 hover:text-rose-400/70 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              {tx('jobDetail.reportJob', undefined, 'Report This Job')}
            </button>
          </div>
        </div>
      </div>

      {!user ? <Footer /> : null}

      {/* Mobile sticky CTA */}
      {!myProposal && user?.id !== job.client_id && applyDecision.allowed && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] bg-[var(--color-bg-base)]/90 backdrop-blur-xl border-t border-white/5">
          <button
            onClick={openProposalFlow}
            className="w-full h-12 rounded-xl font-bold text-white text-sm transition-all hover:bg-violet-500 bg-violet-600 shadow-[0_4px_14px_0_rgba(139,92,246,0.39)]"
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

      <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} title={tx('jobDetail.confirmWithdrawal', undefined, 'Confirm Withdrawal')} size="md">
        <div className="space-y-6 pt-4">
          <p className="text-white/60 text-sm">
            {tx('jobDetail.withdrawConfirmDesc', undefined, 'Are you sure you want to withdraw this proposal? This action cannot be undone.')}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsWithdrawModalOpen(false)}>{tx('common.cancel', undefined, 'Cancel')}</Button>
            <Button variant="danger" onClick={confirmWithdrawProposal} isLoading={withdrawProposalMutation.isPending}>
              {tx('jobDetail.yesWithdraw', undefined, 'Yes, Withdraw')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={tx('jobDetail.reportJobTitle', undefined, 'Report Job')} size="sm">
        <div className="space-y-4 pt-2">
          <p className="text-xs text-white/50">
            {tx('jobDetail.reportJobDescription', undefined, 'Tell us why this job violates our community guidelines.')}
          </p>
          <div className="space-y-2">
            {['spam', 'misleading', 'inappropriate', 'fraud', 'other'].map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  reportReason === reason ? 'border-violet-500 bg-violet-500/10' : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                <input type="radio" name="report-reason" value={reason} checked={reportReason === reason} onChange={() => setReportReason(reason)} className="accent-violet-500" />
                <span className="text-sm font-bold text-white">
                  {tx(`jobDetail.reportReason.${reason}`, undefined, reason.charAt(0).toUpperCase() + reason.slice(1))}
                </span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsReportModalOpen(false)}>{tx('common.cancel', undefined, 'Cancel')}</Button>
            <Button variant="danger" size="sm" onClick={handleReport} isLoading={isSubmittingReport} disabled={!reportReason}>
              {tx('jobDetail.submitReport', undefined, 'Submit Report')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default JobDetail;



