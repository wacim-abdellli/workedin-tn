import {
  useEffect,
  useMemo,
  useState } from "react";
import { useNavigate,
  useParams,
  Link,
  useLocation } from "react-router-dom";
import SEO,
  { SEO_CONFIG } from "@/components/common/SEO";
import {
  MapPin,
  Calendar,
  Briefcase,
  Star,
  MessageSquare,
  ArrowLeft,
  CheckCircle,
  UserX,
  Users,
  Edit2,
  Settings,
  Plus,
  Globe,
  Loader2,
  Camera,
  Check,
  Share2,
  Clock,
  ExternalLink
} from "lucide-react";
import { Header } from "@/components/layout";
import { supabase, isMissingStorageBucketError, getStorageConfigErrorMessage } from "@/lib/supabase";
import { supabaseWithRetry } from "@/lib/supabaseWithRetry";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { ROUTES } from "@/lib/routes";
import Button from "@/components/ui/Button";

import { localizeGovernorate, getLocalizedGovernorateOptions } from "@/lib/governorates";
import { useToast } from "@/components/ui/Toast";


import { uploadAvatar } from "@/services/profiles";
import { usePresence } from "@/hooks/usePresence";

// === Types ===

interface ClientProfileData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  company_name: string | null;
  company_industry: string | null;
  company_size: string | null;
  company_role: string | null;
  company_website: string | null;
  hiring_needs: string[] | null;
  project_budget_preference: string | null;
  project_timeline_preference: string | null;
  communication_preferences: Record<string, unknown> | null;
  screening_preferences: Record<string, unknown> | null;
  legal_preferences: Record<string, unknown> | null;
  created_at: string;
  cin_verified: boolean | null;
  phone_verified: boolean | null;
  payment_verified: boolean | null;
}

interface ClientStats {
  totalJobs: number;
  completedContracts: number;
  totalSpent: number;
  avgRating: number;
  reviewCount: number;
}

interface RecentJob {
  id: string;
  title: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  status: string;
  proposals_count: number | null;
}

import { formatCurrency } from "@/lib/currencyUtils";

// === Helpers ===

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const maybeMessage = 'message' in error && typeof error.message === 'string'
      ? error.message
      : '';
    if (maybeMessage) {
      return maybeMessage;
    }
  }

  return String(error || '');
}

function isSchemaCacheMissingColumnError(
  error: unknown,
  tableName: string,
  columnName: string,
): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('could not find')
    && message.includes('schema cache')
    && message.includes(tableName.toLowerCase())
    && message.includes(columnName.toLowerCase());
}

function isMissingAvatarModeColumnError(error: unknown): boolean {
  return isSchemaCacheMissingColumnError(error, 'profiles', 'avatar_url_freelancer')
    || isSchemaCacheMissingColumnError(error, 'profiles', 'avatar_url_client');
}

function getAvatarUpdateErrorMessage(error: unknown): string {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes('row-level security') || message.includes('42501')) {
    return 'You do not have permission to update this profile picture.';
  }

  if (message.includes('timed out') || message.includes('failed to fetch') || message.includes('network')) {
    return 'Network issue while updating profile picture. Please try again.';
  }

  if (isMissingAvatarModeColumnError(error)) {
    return 'Your database schema is outdated. Please apply the latest migrations and try again.';
  }

  return 'Could not update profile picture';
}

function formatDate(dateStr: string, language: string): string {
  const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
  });
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function getClientIntro(profile: ClientProfileData | null | undefined): string {
  if (!profile) {
    return "";
  }
  if (typeof profile.bio === "string" && profile.bio.trim().length > 0) {
    return profile.bio.trim();
  }
  const communication = toRecord(profile.communication_preferences);
  const intro = communication.profile_intro;
  if (typeof intro === "string" && intro.trim().length > 0) {
    return intro.trim();
  }
  return "";
}

function getSummary(value: unknown): string {
  const record = toRecord(value);
  const summary = record.summary;
  return typeof summary === "string" ? summary.trim() : "";
}

function normalizeClientProfileData(data: Record<string, unknown>): ClientProfileData {
  const hiringNeeds = Array.isArray(data.hiring_needs)
    ? (data.hiring_needs as string[])
    : null;

  return {
    id: typeof data.id === "string" ? data.id : "",
    full_name: typeof data.full_name === "string" ? data.full_name : "",
    avatar_url: typeof data.avatar_url === "string" ? data.avatar_url : null,
    location: typeof data.location === "string" ? data.location : null,
    bio: typeof data.bio === "string" ? data.bio : null,
    company_name: typeof data.company_name === "string" ? data.company_name : null,
    company_industry: typeof data.company_industry === "string" ? data.company_industry : null,
    company_size: typeof data.company_size === "string" ? data.company_size : null,
    company_role: typeof data.company_role === "string" ? data.company_role : null,
    company_website: typeof data.company_website === "string" ? data.company_website : null,
    hiring_needs: hiringNeeds,
    project_budget_preference: typeof data.project_budget_preference === "string" ? data.project_budget_preference : null,
    project_timeline_preference: typeof data.project_timeline_preference === "string" ? data.project_timeline_preference : null,
    communication_preferences: data.communication_preferences && typeof data.communication_preferences === "object" && !Array.isArray(data.communication_preferences) ? (data.communication_preferences as Record<string, unknown>) : null,
    screening_preferences: data.screening_preferences && typeof data.screening_preferences === "object" && !Array.isArray(data.screening_preferences) ? (data.screening_preferences as Record<string, unknown>) : null,
    legal_preferences: data.legal_preferences && typeof data.legal_preferences === "object" && !Array.isArray(data.legal_preferences) ? (data.legal_preferences as Record<string, unknown>) : null,
    created_at: typeof data.created_at === "string" ? data.created_at : new Date().toISOString(),
    cin_verified: typeof data.cin_verified === "boolean" ? data.cin_verified : null,
    phone_verified: typeof data.phone_verified === "boolean" ? data.phone_verified : null,
    payment_verified: typeof data.payment_verified === "boolean" ? data.payment_verified : null,
  };
}

function ProfileSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="surface-card border border-surface rounded-2xl p-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-[#262626]" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 bg-[#262626] rounded-lg" />
              <div className="h-4 w-32 bg-[#262626] rounded-lg" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-[#262626] rounded-full" />
                <div className="h-6 w-20 bg-[#262626] rounded-full" />
              </div>
            </div>
          </div>
        </div>
        <div className="surface-card border border-surface rounded-2xl p-6 space-y-3">
          <div className="h-4 w-32 bg-[#262626] rounded" />
          <div className="h-4 w-full bg-[#262626] rounded" />
          <div className="h-4 w-3/4 bg-[#262626] rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="surface-card border border-surface rounded-2xl p-6 space-y-3">
          <div className="h-10 w-full bg-[#262626] rounded-xl" />
          <div className="h-10 w-full bg-[#262626] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// === Page ===

export default function ClientProfile() {
  const { clientId } = useParams<{ clientId: string }>();
  const { user, updateProfile, profile, activeMode } = useAuth();
  const { tx, txPlural, language } = useTranslation() as any;
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const _queryClient = useQueryClient();

  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const localTime = useMemo(() => {
    return time.toLocaleTimeString(
      language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: language !== 'fr'
      }
    );
  }, [time, language]);

  const { isOnline } = usePresence({
    userId: user?.id,
    isOnlineForMessages: profile?.is_online_for_messages !== false,
  });

  const isPublicPreview = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("preview") === "public";
  }, [location.search]);

  const _governorateOptions = useMemo(
    () => getLocalizedGovernorateOptions(language),
    [language],
  );

  // ── Fetch client profile ──
  const {
    data: client,
    isLoading,
    isError,
    error: clientError,
    refetch: refetchClient,
  } = useQuery<ClientProfileData | null>({
    queryKey: ["client-profile", clientId, user?.id ?? null],
    queryFn: async () => {
      const isOwnRoute = Boolean(user?.id && clientId && user.id === clientId);

      const { data } = await supabaseWithRetry(
        () =>
          supabase
            .from(isOwnRoute ? "profiles" : "public_profiles")
            .select("*")
            .eq("id", clientId!)
            .maybeSingle(),
        { timeoutMs: 15000 },
      );

      if (!data) {
        return null;
      }

      return normalizeClientProfileData(data as Record<string, unknown>);
    },
    enabled: !!clientId,
    retry: 1,
  });

  // ── Fetch client stats ──
  const { data: stats } = useQuery<ClientStats>({
    queryKey: ["client-stats", clientId],
    queryFn: async () => {
      const [jobsRes, contractsRes, reviewsRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id, status", { count: "exact" })
          .eq("client_id", clientId!),
        supabase
          .from("contracts")
          .select("total_amount, status")
          .eq("client_id", clientId!),
        supabase.from("reviews").select("rating").eq("reviewee_id", clientId!),
      ]);

      const totalJobs = jobsRes.count ?? 0;
      const completedContracts =
        contractsRes.data?.filter((c) => c.status === "completed").length ?? 0;
      const totalSpent =
        contractsRes.data
          ?.filter((c) => c.status === "completed")
          .reduce((s, c) => s + (c.total_amount ?? 0), 0) ?? 0;
      const ratings = reviewsRes.data?.map((r) => r.rating) ?? [];
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      return {
        totalJobs,
        completedContracts,
        totalSpent,
        avgRating,
        reviewCount: ratings.length,
      };
    },
    enabled: !!clientId,
  });

  // ── Fetch recent open jobs ──
  const { data: recentJobs = [] } = useQuery<RecentJob[]>({
    queryKey: ["client-jobs", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id, title, category, budget_min, budget_max, created_at, status, proposals_count",
        )
        .eq("client_id", clientId!)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as RecentJob[];
    },
    enabled: !!clientId,
  });

  // ── Fetch client reviews ──
  const { data: clientReviews = [] } = useQuery({
    queryKey: ["client-reviews", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer:public_profiles!reviewer_id (
            full_name,
            avatar_url
          ),
          contract:contracts!contract_id (
            job:jobs (
              title
            )
          )
        `)
        .eq("reviewee_id", clientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      return (data ?? []).map((review: any) => {
        const reviewer = Array.isArray(review.reviewer) ? review.reviewer[0] : review.reviewer;
        const contract = Array.isArray(review.contract) ? review.contract[0] : review.contract;
        const job = contract?.job;
        const jobRow = Array.isArray(job) ? job[0] : job;

        return {
          id: review.id,
          client_name: reviewer?.full_name || 'Freelancer',
          client_avatar: reviewer?.avatar_url || undefined,
          rating: review.rating,
          comment: review.comment || '',
          created_at: review.created_at,
          job_title: jobRow?.title || 'Project Collaboration',
        };
      });
    },
    enabled: !!clientId,
  });

  const handleAvatarUploadSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
    if (!allowedTypes.has(file.type)) {
      showToast(tx('pages.freelancerProfile.validation.avatarType', undefined, 'Please upload JPG, PNG, WEBP, or GIF image.'), 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(tx('pages.freelancerProfile.validation.avatarSize', undefined, 'Image size should be less than 5MB.'), 'warning');
      return;
    }

    try {
      setSavingAvatar(true);
      const avatarUrl = await uploadAvatar(client!.id, file);
      
      try {
        await updateProfile({
          avatar_url: avatarUrl,
          avatar_url_client: avatarUrl,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        if (message.includes('could not find') && message.includes('schema cache')) {
          await updateProfile({ avatar_url: avatarUrl });
        } else {
          throw error;
        }
      }
      showToast(tx('pages.freelancerProfile.toasts.avatarUpdated', undefined, 'Profile picture updated'), 'success');
      await refetchClient();
    } catch (error) {
      logger.error('Failed to upload profile picture', error);
      const fallbackErrorText = getAvatarUpdateErrorMessage(error);
      const rawErrorText = getErrorMessage(error);
      showToast(
        isMissingStorageBucketError(error)
          ? getStorageConfigErrorMessage('avatars')
          : fallbackErrorText === 'Could not update profile picture' && rawErrorText
            ? `${fallbackErrorText}: ${rawErrorText}`
            : fallbackErrorText,
        'error',
      );
    } finally {
      setSavingAvatar(false);
    }
  };

  const isOwnerProfile = Boolean(user?.id && client?.id && user.id === client.id);
  const isOwnProfile = isOwnerProfile && !isPublicPreview;

  useEffect(() => {
    if (isLoading || isError || client) {
      return;
    }

    const isOwnRoute = Boolean(user?.id && clientId && user.id === clientId);
    if (!isOwnRoute) {
      return;
    }

    if (profile?.user_type === "freelancer" || profile?.user_type === "both") {
      navigate(`/freelancer/${profile?.username || user?.id}`, { replace: true });
      return;
    }

    navigate("/settings?tab=account", { replace: true });
  }, [
    client,
    clientId,
    isError,
    isLoading,
    navigate,
    profile?.user_type,
    profile?.username,
    user?.id,
  ]);

  const handleStartConversation = async () => {
    if (!user) {
      showToast(
        tx("clientProfile.loginRequired", undefined, "You need to sign in to send a message"),
        "error",
      );
      return;
    }

    if (!client?.id) {
      showToast(
        tx("clientProfile.notFound", undefined, "Client profile not found"),
        "error",
      );
      return;
    }

    if (user.id === client.id) {
      showToast(
        tx("clientProfile.cannotMessageSelf", undefined, "You cannot message yourself"),
        "warning",
      );
      return;
    }

    setIsStartingConversation(true);
    try {
      const preferredScope = activeMode === "freelancer" ? "freelancer" : "client";

      let { data: conversationId, error } = await supabase.rpc("get_or_create_conversation", {
        user1: user.id,
        user2: client.id,
        p_contract_id: null,
        p_scope: preferredScope,
      });

      if (error) {
        const message = typeof error.message === "string" ? error.message.toLowerCase() : "";
        if (
          message.includes("p_scope") ||
          (message.includes("get_or_create_conversation") && message.includes("does not exist"))
        ) {
          const legacyResult = await supabase.rpc("get_or_create_conversation", {
            user1: user.id,
            user2: client.id,
            p_contract_id: null,
          });
          conversationId = legacyResult.data;
          error = legacyResult.error;
        }
      }

      if (error || !conversationId) {
        throw error || new Error(tx("clientProfile.startConversationFailed", undefined, "Failed to start conversation"));
      }

      navigate(`${ROUTES.messages}?conversation=${conversationId}`);
    } catch (error: any) {
      logger.error("Error starting client conversation", error);
      showToast(
        error?.message || tx("clientProfile.startConversationError", undefined, "Something went wrong while starting the conversation"),
        "error",
      );
    } finally {
      setIsStartingConversation(false);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <>
        <SEO {...SEO_CONFIG.dashboard} noIndex />
        <div className="min-h-screen page-bg-base">
          <Header />
          <ProfileSkeleton />
        </div>
      </>
    );
  }

  // ── Error ──
  if (isError) {
    const errorMessage =
      clientError instanceof Error
        ? clientError.message
        : tx("common.genericError", undefined, "Something went wrong");

    return (
      <>
        <SEO {...SEO_CONFIG.dashboard} noIndex />
        <div className="min-h-screen page-bg-base">
          <Header />
          <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
            <UserX className="w-16 h-16 text-on-surface-subtle" />
            <h2 className="text-xl font-semibold text-white">
              {tx("common.loadFailed", undefined, "Failed to load profile")}
            </h2>
            <p className="text-sm max-w-xl text-on-surface-muted">
              {errorMessage}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void refetchClient()}
            >
              {tx("common.retry", undefined, "Retry")}
            </Button>
          </div>
        </div>
      </>
    );
  }

  // ── Not found ──
  if (!client) {
    return (
      <>
        <SEO {...SEO_CONFIG.dashboard} noIndex />
        <div className="min-h-screen page-bg-base">
          <Header />
          <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
            <UserX className="w-16 h-16 text-on-surface-subtle" />
            <h2 className="text-xl font-semibold text-white">
              {tx("clientProfile.notFound", undefined, "Client not found")}
            </h2>
            <p className="text-sm text-on-surface-muted">
              {tx(
                "clientProfile.notFoundDesc",
                undefined,
                "This profile does not exist or has been removed.",
              )}
            </p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate("/find-freelancers")}
            >
              {tx("common.goBack", undefined, "Go Back")}
            </Button>
          </div>
        </div>
      </>
    );
  }

  const canContact = !!user && !isOwnerProfile;

  // === Main Render ===
  // === Computed values for new layout ===
  const _accentColor = "#F59E0B";
  const clientIntro = getClientIntro(client);
  const communicationSummary = getSummary(client.communication_preferences);
  const screeningSummary = getSummary(client.screening_preferences);
  const legalSummary = getSummary(client.legal_preferences);

  const initialAvatar = client.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');

  const reviewBuckets = [5, 4, 3, 2, 1].map((score) => {
    const total = stats?.reviewCount || 0;
    const count = clientReviews.filter((r: any) => Math.round(r.rating) === score).length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

    return { score, pct };
  });

  return (
    <>
      <SEO {...SEO_CONFIG.dashboard} noIndex />
      <div className="min-h-screen page-bg-base">
        <Header />

        {/* Preview banner */}
        {isPublicPreview && isOwnerProfile && (
          <div className="max-w-[1400px] mx-auto px-4 pt-4">
            <div
              className="rounded-xl border px-4 py-3 flex items-center justify-between gap-3 bg-yellow-500/10 border-yellow-500/20"
            >
              <div>
                <p 
                  className="text-sm font-semibold text-gray-900 dark:text-zinc-50"
                >
                  {tx("clientProfile.previewTitle", undefined, "Public Profile Preview")}
                </p>
                <p 
                  className="text-xs text-gray-500 dark:text-zinc-400"
                >
                  {tx("clientProfile.previewDesc", undefined, "You are viewing your profile as other users see it.")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/client/${client.id}`)}
                className="inline-flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm font-medium transition-all text-[#F59E0B] hover:bg-yellow-500/20"
              >
                <ArrowLeft className="w-4 h-4" />
                {tx("clientProfile.exitPreview", undefined, "Exit Preview")}
              </button>
            </div>
          </div>
        )}

        <div className="w-full bg-[#f9fafb] dark:bg-black py-6 px-2 sm:px-4 transition-colors duration-200">
          <div className="max-w-[1400px] mx-auto bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-[#2d2d2d] rounded-2xl shadow-sm overflow-hidden transition-colors duration-200 relative">
            
            {/* === Profile Header === */}
            <header className="relative p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
              {/* Ambient Glows */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/5 dark:bg-[#F59E0B]/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-red-500/5 dark:bg-[#EF4444]/5 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 flex-1 w-full">
                {/* Avatar block with green dot and gradient ambient border */}
                <div className="relative group shrink-0">
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#EF4444] opacity-20 group-hover:opacity-70 blur-sm transition duration-500" />
                  {client.avatar_url ? (
                    <img
                      src={client.avatar_url}
                      alt={client.full_name}
                      className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border border-gray-200 dark:border-[#2d2d2d] bg-white dark:bg-[#0c0c0e]"
                    />
                  ) : (
                    <div
                      className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-3xl font-bold text-white select-none"
                      style={{ background: '#F59E0B' }}
                    >
                      {initialAvatar}
                    </div>
                  )}
                  
                  {/* Availability Status Dot with breathing pulse */}
                  {isOnline(client.id) && (
                    <span className="absolute bottom-1 right-1 w-4 h-4 shrink-0 flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-[#10B981] opacity-40" />
                      <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#10B981] opacity-75" style={{ animationDelay: '500ms', animationDuration: '2s' }} />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981] border border-white dark:border-[#0c0c0e]" />
                    </span>
                  )}

                  {/* Camera overlay for avatar upload (owner only) */}
                  {isOwnProfile && (
                    <label className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/60 transition-opacity duration-200 cursor-pointer z-10 ${
                      savingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      {savingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                      <input
                        type="file"
                        aria-label="Upload profile picture"
                        className="hidden"
                        onChange={handleAvatarUploadSelection}
                        disabled={savingAvatar}
                      />
                    </label>
                  )}
                </div>

                {/* Info details */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-zinc-50 tracking-tight">
                      {client.full_name || 'Client'}
                    </h1>
                    
                    {/* Verification badge */}
                    {client.cin_verified && (
                      <CheckCircle 
                        className="w-5 h-5 text-[#10B981] fill-white dark:fill-[#0c0c0e] shrink-0"
                        aria-label="Verified"
                      />
                    )}
                  </div>

                  {/* Company Role / Subtitle */}
                  <p className="text-sm font-medium text-gray-600 dark:text-zinc-300 mt-1">
                    {client.company_role || client.company_industry || tx("clientProfile.client", undefined, "Client")}
                  </p>

                  {/* Location & Local Time */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-zinc-400">
                    {client.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                        <span>{localizeGovernorate(client.location, language)}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                      <span>{tx("clientProfile.localTime", { time: localTime }, `${localTime} local time`)}</span>
                    </span>
                  </div>

                  {/* Stats: Rating, Jobs, Response Time */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 mt-4 text-sm text-gray-500 dark:text-zinc-400">
                    {stats && (
                      <>
                        <span className="inline-flex items-center gap-1 text-[#F59E0B] font-medium">
                          <Star className="w-4 h-4 fill-current" />
                          <span>{stats.avgRating.toFixed(1)} ({txPlural("clientProfile.reviewsCount", stats.reviewCount, { count: stats.reviewCount }, `${stats.reviewCount} reviews`)})</span>
                        </span>
                        <span className="text-gray-300 dark:text-[#2d2d2d] select-none">•</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                          <span>{txPlural("clientProfile.jobsPostedCount", stats.totalJobs, { count: stats.totalJobs }, `${stats.totalJobs} jobs posted`)}</span>
                        </span>
                        <span className="text-gray-300 dark:text-[#2d2d2d] select-none">•</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                          <span>{tx("clientProfile.memberSinceLabel", undefined, "Member since")} {formatDate(client.created_at, language)}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons (Right side) */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end mt-4 md:mt-0 shrink-0 flex-wrap z-10">
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={() => navigate('/settings?tab=profile&focus=full_name')}
                    className="rounded-full border border-[#F59E0B] hover:bg-[#F59E0B]/5 text-[#F59E0B] dark:text-[#F59E0B] dark:border-[#F59E0B] px-5 py-2 text-sm font-semibold flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {tx("profile.editProfile", undefined, "Edit Profile")}
                  </button>
                ) : canContact ? (
                  <button
                    type="button"
                    onClick={() => void handleStartConversation()}
                    disabled={isStartingConversation}
                    className="rounded-full bg-[#F59E0B] hover:bg-[#d97706] text-white px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-all duration-150 disabled:opacity-60"
                  >
                    {isStartingConversation ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5" />
                    )}
                    {tx("profile.sendMessage", undefined, "Send Message")}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    showToast(tx('pages.freelancerProfile.toasts.linkCopied', undefined, 'Profile link copied to clipboard'), 'success');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`rounded-full border px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-all duration-300 transform active:scale-95 ${
                    copied 
                      ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' 
                      : 'border-gray-300 dark:border-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#161618] text-gray-700 dark:text-zinc-300'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {tx("clientProfile.copied", undefined, "Copied!")}
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      {tx("clientProfile.share", undefined, "Share")}
                    </>
                  )}
                </button>
              </div>
            </header>

            {/* Divider */}
            <div className="border-b border-gray-200 dark:border-[#2d2d2d]" />

            {/* Two-Column Split Grid with Mount Transition */}
            <div className={`grid grid-cols-1 lg:grid-cols-4 transition-all duration-700 transform ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}>
              
              {/* Left Column (3/4 width) */}
              <main className="lg:col-span-3 flex flex-col divide-y divide-gray-200 dark:divide-[#2d2d2d]">
                
                {/* Title & Bio Section */}
                <section className="p-6 sm:p-8 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap w-full">
                    <div className="space-y-1 flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-50">
                        {client.company_role && client.company_name 
                          ? `${client.company_role} at ${client.company_name}` 
                          : client.company_role || client.company_name || tx("clientProfile.businessOwner", undefined, "Business Owner")}
                      </h2>
                      {client.company_industry && (
                        <p className="text-xs text-gray-400 dark:text-zinc-500">
                          {tx("clientProfile.specializedIn", { industry: client.company_industry }, `Specialized in ${client.company_industry}`)}
                        </p>
                      )}
                    </div>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => navigate('/settings?tab=profile&focus=bio')}
                        className="p-1.5 text-gray-400 hover:text-[#F59E0B] dark:text-zinc-500 dark:hover:text-[#fbbf24] hover:bg-[#F59E0B]/10 dark:hover:bg-[#F59E0B]/20 hover:scale-110 active:scale-90 rounded-full transition-all duration-200 shrink-0"
                        aria-label="Edit bio and headline details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Biography Paragraph */}
                  <div className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                    {clientIntro || tx("clientProfile.noBio", undefined, "No biography or about details provided yet.")}
                  </div>

                  {isOwnProfile && !clientIntro && (
                    <button
                      type="button"
                      onClick={() => navigate('/settings?tab=profile&focus=bio')}
                      className="text-sm font-semibold text-[#F59E0B] hover:underline self-start"
                    >
                      {tx("clientProfile.addDescription", undefined, "+ Add description")}
                    </button>
                  )}
                </section>

                {/* Company Information */}
                {(isOwnProfile || client.company_name || client.company_industry || client.company_size || client.company_role || client.company_website || (Array.isArray(client.hiring_needs) && client.hiring_needs.length > 0)) && (
                  <section className="p-6 sm:p-8 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">
                        {tx("clientProfile.companyInformation", undefined, "Company Information")}
                      </h3>
                      {isOwnProfile && (
                        <button
                          type="button"
                          onClick={() => navigate('/settings?tab=profile&focus=company')}
                          className="p-1.5 text-gray-400 hover:text-[#F59E0B] dark:text-zinc-500 dark:hover:text-[#fbbf24] hover:bg-[#F59E0B]/10 dark:hover:bg-[#F59E0B]/20 hover:scale-110 active:scale-90 rounded-full transition-all duration-200"
                          aria-label="Edit company details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-6">
                      {(client.company_name || client.company_industry || client.company_size || client.company_role || client.company_website) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {[
                            { label: tx("profile.companyName", undefined, "Company"), value: client.company_name },
                            { label: tx("profile.companyIndustry", undefined, "Industry"), value: client.company_industry },
                            { label: tx("profile.companySize", undefined, "Size"), value: client.company_size },
                            { label: tx("profile.companyRole", undefined, "Your role"), value: client.company_role },
                          ].filter(r => r.value).map(row => (
                            <div
                              key={row.label}
                              className="flex items-center gap-3 rounded-xl px-4 py-3 border border-gray-150 dark:border-[#2d2d2d] bg-gray-50/30 dark:bg-[#161618]/30 hover:-translate-y-0.5 hover:border-[#F59E0B]/20 hover:shadow-sm transition-all duration-300"
                            >
                              <span className="text-xs font-medium shrink-0 text-gray-400 dark:text-zinc-500">{row.label}</span>
                              <span className="font-semibold truncate text-gray-900 dark:text-zinc-100">{row.value}</span>
                            </div>
                          ))}
                          {client.company_website && (
                            <div className="sm:col-span-2 flex items-center gap-3 rounded-xl px-4 py-3 border border-gray-150 dark:border-[#2d2d2d] bg-gray-50/30 dark:bg-[#161618]/30 hover:-translate-y-0.5 hover:border-[#F59E0B]/20 hover:shadow-sm transition-all duration-300">
                              <Globe className="w-4 h-4 shrink-0 text-gray-400 dark:text-zinc-500" />
                              <a
                                href={client.company_website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium hover:underline hover:translate-x-1 transition-transform break-all text-[#F59E0B]"
                              >
                                {client.company_website}
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 border border-dashed border-gray-300 dark:border-[#2d2d2d] rounded-xl bg-gray-50/20 dark:bg-[#161618]/10">
                          <p className="text-xs text-gray-400 dark:text-zinc-500">{tx("clientProfile.noCompanyDetails", undefined, "No company details added yet.")}</p>
                        </div>
                      )}

                      {Array.isArray(client.hiring_needs) && client.hiring_needs.length > 0 && (
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                            {tx("clientProfile.hiringNeeds", undefined, "Hiring Needs")}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {client.hiring_needs.map((need) => (
                              <span
                                key={need}
                                className="px-3.5 py-1.5 bg-gray-50 dark:bg-[#161618] border border-gray-200 dark:border-[#2d2d2d] rounded-full text-xs font-medium text-gray-700 dark:text-zinc-300 hover:scale-105 hover:bg-[#F59E0B]/5 hover:border-[#F59E0B]/40 dark:hover:bg-[#F59E0B]/10 dark:hover:border-[#F59E0B]/40 transition-all duration-200"
                              >
                                {need}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Hiring Preferences & Details */}
                {(isOwnProfile || client.project_budget_preference || client.project_timeline_preference || communicationSummary || screeningSummary || legalSummary) && (
                  <section className="p-6 sm:p-8 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">
                        {tx("clientProfile.hiringPreferences", undefined, "Hiring Preferences & Details")}
                      </h3>
                      {isOwnProfile && (
                        <button
                          type="button"
                          onClick={() => navigate('/settings?tab=profile&focus=preferences')}
                          className="p-1.5 text-gray-400 hover:text-[#F59E0B] dark:text-zinc-500 dark:hover:text-[#fbbf24] hover:bg-[#F59E0B]/10 dark:hover:bg-[#F59E0B]/20 hover:scale-110 active:scale-90 rounded-full transition-all duration-200"
                          aria-label="Edit hiring preferences"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      {[
                        { label: tx("profile.budgetPreference", undefined, "Budget"), value: client.project_budget_preference },
                        { label: tx("profile.timelinePreference", undefined, "Timeline"), value: client.project_timeline_preference },
                        { label: tx("profile.communicationPreferences", undefined, "Communication"), value: communicationSummary },
                        { label: tx("profile.screeningPreferences", undefined, "Screening"), value: screeningSummary },
                        { label: tx("profile.legalPreferences", undefined, "Legal"), value: legalSummary },
                      ].filter(r => r.value).map((row, idx) => (
                        <div key={idx} className="space-y-2.5 p-4 rounded-xl border border-gray-100 dark:border-[#2d2d2d] bg-gray-50/55 dark:bg-[#161618]/30 hover:-translate-y-0.5 hover:border-[#F59E0B]/20 hover:shadow-sm transition-all duration-300">
                          <h4 className="font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[#F59E0B]" />
                            {row.label}
                          </h4>
                          <p className="text-gray-600 dark:text-zinc-400 leading-relaxed text-xs">
                            {row.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Active Job Postings */}
                <section className="p-6 sm:p-8 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">
                      {tx("clientProfile.activeJobs", undefined, "Active Job Postings")}
                    </h3>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => navigate(ROUTES.jobsNew)}
                        className="text-[#F59E0B] hover:underline text-sm font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        {tx("clientProfile.postJob", undefined, "Post a Job")}
                      </button>
                    )}
                  </div>

                  {recentJobs.length > 0 ? (
                    <div className={`grid gap-5 ${recentJobs.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                      {recentJobs.map((job) => (
                        <article
                          key={job.id}
                          className="group flex flex-col border border-gray-200 dark:border-[#2d2d2d] rounded-xl overflow-hidden bg-white dark:bg-[#0c0c0e] hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/50 hover:border-[#F59E0B]/30 transition-all duration-300 p-4 justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <Link
                              to={`/jobs/${job.id}`}
                              className="text-sm font-semibold hover:underline block truncate text-gray-900 dark:text-zinc-100"
                            >
                              {job.title}
                            </Link>
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-[#2d2d2d] text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-[#161618]/50">
                                {job.category}
                              </span>
                              {job.proposals_count != null && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-[#2d2d2d] text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-[#161618]/50 flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {txPlural("clientProfile.proposalsCount", job.proposals_count, { count: job.proposals_count }, `${job.proposals_count} proposals`)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-[#2d2d2d]/80 mt-1">
                            {(job.budget_min != null || job.budget_max != null) ? (
                              <span className="text-xs font-semibold text-[#F59E0B]">
                                {job.budget_min != null && job.budget_max != null
                                  ? `${formatCurrency(job.budget_min, false, language)} - ${formatCurrency(job.budget_max, true, language)}`
                                  : job.budget_min != null
                                    ? `${tx("common.from", undefined, "From")} ${formatCurrency(job.budget_min, true, language)}`
                                    : `${tx("clientProfile.upTo", undefined, "Up to")} ${formatCurrency(job.budget_max!, true, language)}`}
                              </span>
                            ) : (
                              <span />
                            )}
                            <Link to={`/jobs/${job.id}`} className="shrink-0">
                              <Button variant="outline" size="sm">
                                {isOwnProfile ? tx("jobDetail.manageJob", undefined, "Manage") : tx("clientProfile.apply", undefined, "Apply")}
                              </Button>
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-300 dark:border-[#2d2d2d] rounded-xl bg-gray-50/50 dark:bg-[#161618]/10 text-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#161618] text-gray-400 dark:text-[#2d2d2d] mb-3">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                        {tx("clientProfile.noActiveJobs", undefined, "No active job postings yet")}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-[280px] leading-relaxed mb-4">
                        {tx("clientProfile.noActiveJobsDesc", undefined, "Post projects, launch milestone tasks, and collaborate with Top Freelancers.")}
                      </p>
                      {isOwnProfile && (
                        <button
                          type="button"
                          onClick={() => navigate(ROUTES.jobsNew)}
                          className="px-5 py-2 bg-[#F59E0B] hover:bg-[#d97706] text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
                        >
                          {tx("clientProfile.postFirstJob", undefined, "Post your first job")}
                        </button>
                      )}
                    </div>
                  )}
                </section>

                {/* Work History & Reviews */}
                <section className="p-6 sm:p-8 flex flex-col gap-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">
                    {tx("clientProfile.workHistory", undefined, "Work History & Reviews")}
                  </h3>

                  {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-start">
                      <div className="border border-gray-200 dark:border-[#2d2d2d] bg-gray-50/30 dark:bg-[#161618]/30 rounded-xl p-4 text-center">
                        <p className="text-5xl font-black text-gray-900 dark:text-zinc-50 leading-none">
                          {stats.avgRating.toFixed(1)}
                        </p>
                        <div className="mt-2 flex items-center justify-center gap-1">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                              key={value}
                              className="w-4 h-4"
                              style={{
                                color: value <= Math.round(stats.avgRating) ? '#F59E0B' : '#d1d5db',
                                fill: value <= Math.round(stats.avgRating) ? '#F59E0B' : 'none',
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                          {txPlural("clientProfile.reviewsCount", stats.reviewCount, { count: stats.reviewCount }, `${stats.reviewCount} reviews`)}
                        </p>
                      </div>

                      <div className="space-y-2 flex-1">
                        {reviewBuckets.map(({ score, pct }) => (
                          <div key={score} className="flex items-center gap-3 text-xs group">
                            <span className="w-3 text-gray-500 dark:text-zinc-400">{score}</span>
                            <div className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-[#161618] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#F59E0B] transition-all duration-500 group-hover:brightness-110"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-gray-400 dark:text-zinc-500 group-hover:text-[#F59E0B] group-hover:font-medium">{pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {clientReviews.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-[#2d2d2d] mt-4">
                      {clientReviews.map((review) => (
                        <article key={review.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                {review.job_title}
                              </h4>
                              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                                {tx("clientProfile.by", undefined, "by")} {review.client_name} • {new Date(review.created_at).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <div className="inline-flex items-center gap-1 text-[#F59E0B] font-medium text-sm">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{review.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-zinc-300 italic font-normal leading-relaxed mt-1">
                            "{review.comment}"
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center border border-gray-100 dark:border-[#2d2d2d] rounded-xl bg-gray-50/20 dark:bg-[#161618]/10">
                      <p className="text-xs text-gray-400 dark:text-zinc-500">
                        {tx("clientProfile.noReviewsYet", undefined, "No reviews yet. Complete your first contract with a freelancer to receive feedback.")}
                      </p>
                    </div>
                  )}
                </section>
              </main>

              {/* Right Column Sidebar (1/4 width) */}
              <aside className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-[#2d2d2d] flex flex-col divide-y divide-gray-200 dark:divide-[#2d2d2d]">
                
                {/* Stats Column */}
                <section className="p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50">
                      {tx("clientProfile.hiringAndStats", undefined, "Hiring & Stats")}
                    </h3>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => navigate('/settings?tab=profile&focus=location')}
                        className="p-1 text-gray-400 hover:text-[#F59E0B] dark:text-zinc-500 dark:hover:text-[#fbbf24] hover:bg-[#F59E0B]/10 dark:hover:bg-[#F59E0B]/20 hover:scale-110 active:scale-90 rounded-full transition-all duration-200"
                        aria-label="Edit account settings"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {stats && (
                    <dl className="space-y-3.5 text-sm">
                      <div className="flex justify-between items-start gap-3">
                        <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx("clientProfile.hiringStatus", undefined, "Hiring Status")}</dt>
                        <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: client.payment_verified ? '#4ade80' : '#fbbf24' }}
                          />
                          {client.payment_verified 
                            ? tx("clientProfile.paymentVerified", undefined, "Payment Verified") 
                            : tx("clientProfile.standardStatus", undefined, "Standard")}
                        </dd>
                      </div>

                      {client.location && (
                        <div className="flex justify-between items-start gap-3">
                          <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx("clientProfile.locationLabel", undefined, "Location")}</dt>
                          <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right">
                            {localizeGovernorate(client.location, language)}
                          </dd>
                        </div>
                      )}

                      <div className="flex justify-between items-start gap-3">
                        <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx("clientProfile.memberSinceLabel", undefined, "Member since")}</dt>
                        <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right">
                          {formatDate(client.created_at, language)}
                        </dd>
                      </div>

                      <div className="flex justify-between items-start gap-3">
                        <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx("clientProfile.jobsPostedLabel", undefined, "Jobs Posted")}</dt>
                        <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right">
                          {stats.totalJobs}
                        </dd>
                      </div>

                      <div className="flex justify-between items-start gap-3">
                        <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx("clientProfile.completedContractsLabel", undefined, "Completed Contracts")}</dt>
                        <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right">
                          {stats.completedContracts}
                        </dd>
                      </div>

                      <div className="flex justify-between items-start gap-3">
                        <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx("clientProfile.totalSpentLabel", undefined, "Total spent")}</dt>
                        <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right text-[#F59E0B]">
                          {formatCurrency(stats.totalSpent, true, language)}
                        </dd>
                      </div>

                      <div className="flex justify-between items-start gap-3">
                        <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx("clientProfile.avgRatingLabel", undefined, "Average Rating")}</dt>
                        <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right flex items-center justify-end gap-1">
                          <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                          <span>{stats.avgRating.toFixed(1)} / 5.0</span>
                        </dd>
                      </div>
                    </dl>
                  )}
                </section>

                {/* Company Website / Resource links */}
                <section className="p-6 flex flex-col gap-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50">
                    {tx("clientProfile.linksTitle", undefined, "Links & Resources")}
                  </h3>
                  {client.company_website ? (
                    <ul className="space-y-2.5">
                      <li>
                        <a
                          href={client.company_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-[#F59E0B] dark:text-[#fbbf24] hover:underline hover:translate-x-1 transition-transform duration-200"
                        >
                          <Globe className="w-4 h-4 shrink-0 text-gray-400 dark:text-zinc-500" />
                          <span className="truncate">{client.company_name || tx("clientProfile.companyWebsite", undefined, "Company Website")}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                        </a>
                      </li>
                    </ul>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{tx("clientProfile.noLinks", undefined, "No links added yet.")}</p>
                    </div>
                  )}
                </section>

                {/* Verifications Checklist */}
                <section className="p-6 flex flex-col gap-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50">
                    {tx("clientProfile.verificationsTitle", undefined, "Verifications")}
                  </h3>

                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2.5">
                      {client.cin_verified ? (
                        <CheckCircle className="w-4 h-4 shrink-0 text-[#10B981] fill-white dark:fill-[#0c0c0e]" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-zinc-700 shrink-0" />
                      )}
                      <span className={client.cin_verified ? 'text-gray-950 dark:text-zinc-100 font-medium' : 'text-gray-400 dark:text-zinc-500'}>
                        {tx("clientProfile.verifications.identity", undefined, "Identity Verified")}
                      </span>
                    </li>

                    <li className="flex items-center gap-2.5">
                      {client.phone_verified ? (
                        <CheckCircle className="w-4 h-4 shrink-0 text-[#10B981] fill-white dark:fill-[#0c0c0e]" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-zinc-700 shrink-0" />
                      )}
                      <span className={client.phone_verified ? 'text-gray-950 dark:text-zinc-100 font-medium' : 'text-gray-400 dark:text-zinc-500'}>
                        {tx("clientProfile.verifications.phone", undefined, "Phone Number")}
                      </span>
                    </li>

                    <li className="flex items-center gap-2.5">
                      {client.payment_verified ? (
                        <CheckCircle className="w-4 h-4 shrink-0 text-[#10B981] fill-white dark:fill-[#0c0c0e]" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-zinc-700 shrink-0" />
                      )}
                      <span className={client.payment_verified ? 'text-gray-950 dark:text-zinc-100 font-medium' : 'text-gray-400 dark:text-zinc-500'}>
                        {tx("clientProfile.verifications.payment", undefined, "Payment Method")}
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Owner Controls */}
                {isOwnProfile && (
                  <section className="p-6 flex flex-col gap-3">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                      {tx("clientProfile.workspaceControls", undefined, "Workspace Controls")}
                    </h3>
                    {[
                      { icon: <Plus className="w-4 h-4" />, label: tx("clientProfile.postJob", undefined, "Post a Job"), onClick: () => navigate(ROUTES.jobsNew) },
                      { icon: <Briefcase className="w-4 h-4" />, label: tx("clientProfile.myProjects", undefined, "My Projects"), onClick: () => navigate(ROUTES.clientJobs) },
                      { icon: <Settings className="w-4 h-4" />, label: tx("clientProfile.settings", undefined, "Settings"), onClick: () => navigate(ROUTES.settings) },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={item.onClick}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2d2d2d] bg-gray-50/20 dark:bg-white/[0.02] hover:bg-gray-150 dark:hover:bg-white/[0.05] transition-all text-sm font-medium text-gray-700 dark:text-zinc-300"
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </section>
                )}
              </aside>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
