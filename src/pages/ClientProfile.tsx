  import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import SEO, { SEO_CONFIG } from "@/components/common/SEO";
import {
  MapPin,
  Calendar,
  Briefcase,
  Star,
  DollarSign,
  MessageSquare,
  ArrowLeft,
  CheckCircle,
  UserX,
  Users,
  FileText,
  Edit2,
  Save,
  ShieldCheck,
  X,
  Target,
  Settings,
  Plus,
  Eye,
  Globe,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout";
import { supabase } from "@/lib/supabase";
import { supabaseWithRetry } from "@/lib/supabaseWithRetry";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { ROUTES } from "@/lib/routes";
import Button from "@/components/ui/Button";
import CustomSelect from "@/components/ui/CustomSelect";
import { localizeGovernorate, getLocalizedGovernorateOptions } from "@/lib/governorates";
import { useToast } from "@/components/ui/Toast";
import { GOVERNORATES } from "@/types";
import { Skeleton } from "@/components/common/SkeletonCard";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileStatBar } from "@/components/profile/ProfileStatBar";
import { ProfileSection, ProfileTag, ProfileEmptySlot } from "@/components/profile/ProfileSection";
import { ProfileActionSidebar } from "@/components/profile/ProfileActionSidebar";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-TN") + " TND";
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

  const communication = toRecord(profile.communication_preferences);
  const intro = communication.profile_intro;

  if (typeof intro === "string" && intro.trim().length > 0) {
    return intro.trim();
  }

  return profile.bio?.trim() || "";
}

function getSummary(value: unknown): string {
  const record = toRecord(value);
  const summary = record.summary;
  return typeof summary === "string" ? summary.trim() : "";
}

function normalizeGovernorateValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const normalized = value.trim().toLowerCase();

  const directMatch = GOVERNORATES.find((gov) => gov.toLowerCase() === normalized);
  if (directMatch) {
    return directMatch;
  }

  const mappedMatch = GOVERNORATES.find((gov) => {
    const ar = localizeGovernorate(gov, "ar").toLowerCase();
    const en = localizeGovernorate(gov, "en").toLowerCase();
    const fr = localizeGovernorate(gov, "fr").toLowerCase();

    return normalized === ar || normalized === en || normalized === fr;
  });

  return mappedMatch ?? value.trim();
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
    company_industry:
      typeof data.company_industry === "string" ? data.company_industry : null,
    company_size: typeof data.company_size === "string" ? data.company_size : null,
    company_role: typeof data.company_role === "string" ? data.company_role : null,
    company_website: typeof data.company_website === "string" ? data.company_website : null,
    hiring_needs: hiringNeeds,
    project_budget_preference:
      typeof data.project_budget_preference === "string"
        ? data.project_budget_preference
        : null,
    project_timeline_preference:
      typeof data.project_timeline_preference === "string"
        ? data.project_timeline_preference
        : null,
    communication_preferences:
      data.communication_preferences &&
      typeof data.communication_preferences === "object" &&
      !Array.isArray(data.communication_preferences)
        ? (data.communication_preferences as Record<string, unknown>)
        : null,
    screening_preferences:
      data.screening_preferences &&
      typeof data.screening_preferences === "object" &&
      !Array.isArray(data.screening_preferences)
        ? (data.screening_preferences as Record<string, unknown>)
        : null,
    legal_preferences:
      data.legal_preferences &&
      typeof data.legal_preferences === "object" &&
      !Array.isArray(data.legal_preferences)
        ? (data.legal_preferences as Record<string, unknown>)
        : null,
    created_at:
      typeof data.created_at === "string"
        ? data.created_at
        : new Date().toISOString(),
    cin_verified:
      typeof data.cin_verified === "boolean" ? data.cin_verified : null,
    phone_verified:
      typeof data.phone_verified === "boolean" ? data.phone_verified : null,
    payment_verified:
      typeof data.payment_verified === "boolean" ? data.payment_verified : null,
  };
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
      {/* Header card */}
      <div className="surface-card border border-surface rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      {/* Jobs */}
      <div className="surface-card border border-surface rounded-2xl p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ClientProfile() {
  const { clientId } = useParams<{ clientId: string }>();
  const { user, updateProfile, profile, activeMode } = useAuth();
  const { tx, language } = useTranslation() as any;
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isStartingConversation, setIsStartingConversation] = useState(false);

  const isPublicPreview = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("preview") === "public";
  }, [location.search]);

  const governorateOptions = useMemo(
    () => getLocalizedGovernorateOptions(language),
    [language],
  );

  // â”€â”€ Fetch client profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Fetch client stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Fetch recent open jobs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Not found â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // ── Main render ─────────────────────────────────────────────────────────
  // ── Computed values for new layout ────────────────────────────────────────
  const accentColor = "#F59E0B";
  const clientIntro = getClientIntro(client);
  const communicationSummary = getSummary(client.communication_preferences);
  const screeningSummary = getSummary(client.screening_preferences);
  const legalSummary = getSummary(client.legal_preferences);

  const heroBadges = [
    { label: tx("clientProfile.client", undefined, "Client"), style: "filled" as const },
    ...(client.cin_verified
      ? [{ label: tx("clientProfile.verifiedClient", undefined, "Verified Client"), style: "success" as const, icon: <CheckCircle className="w-3 h-3" /> }]
      : []),
  ];

  const heroMeta = [
    ...(client.location ? [{ icon: <MapPin className="w-3.5 h-3.5" />, label: localizeGovernorate(client.location, language) }] : []),
    { icon: <Calendar className="w-3.5 h-3.5" />, label: `${tx("clientProfile.memberSince", undefined, "Member since")} ${formatDate(client.created_at)}` },
    ...(stats ? [{ icon: <Target className="w-3.5 h-3.5" />, label: `${stats.totalJobs} ${tx("clientProfile.stats.jobsPosted", undefined, "Jobs Posted")}` }] : []),
  ];

  const heroActions = isOwnProfile ? (
      <button
        type="button"
        onClick={() => navigate('/settings?tab=profile')}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border transition-all duration-150 hover:bg-white/5"
        style={{ color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.12)" }}
      >
        <Edit2 className="w-3.5 h-3.5" />
        {tx("clientProfile.editProfile", undefined, "Edit Profile")}
      </button>
  ) : null;

  return (
    <>
      <SEO {...SEO_CONFIG.dashboard} noIndex />
      <div className="min-h-screen page-bg-base">
        <Header />

        {/* Preview banner */}
        {isPublicPreview && isOwnerProfile && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
            <div
              className="rounded-xl border px-4 py-3 flex items-center justify-between gap-3"
              style={{ 
                background: 'var(--workspace-primary-dim)', 
                borderColor: 'color-mix(in srgb, var(--workspace-primary) 25%, transparent)' 
              }}
            >
              <div>
                <p 
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {tx("clientProfile.previewTitle", undefined, "Public Profile Preview")}
                </p>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {tx("clientProfile.previewDesc", undefined, "You are viewing your profile as other users see it.")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/client/${client.id}`)}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all"
                style={{ 
                  color: 'var(--workspace-primary)', 
                  borderColor: 'color-mix(in srgb, var(--workspace-primary) 35%, transparent)', 
                  background: 'color-mix(in srgb, var(--workspace-primary) 8%, transparent)' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <ArrowLeft className="w-4 h-4" />
                {tx("clientProfile.exitPreview", undefined, "Exit Preview")}
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ Hero banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <ProfileHero
          variant="client"
          name={client.full_name}
          subtitle={client.company_role || client.company_industry || tx("clientProfile.client", undefined, "Client")}
          avatarUrl={client.avatar_url}
          badges={heroBadges}
          meta={heroMeta}
          actions={heroActions}
        />

        {/* â”€â”€ Stat bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {stats && (
          <ProfileStatBar
            variant="client"
            stats={[
              { icon: <Briefcase className="w-4 h-4" />, label: tx("clientProfile.stats.jobsPosted", undefined, "Jobs Posted"), value: stats.totalJobs },
              { icon: <FileText className="w-4 h-4" />, label: tx("clientProfile.stats.completedContracts", undefined, "Completed"), value: stats.completedContracts },
              { icon: <DollarSign className="w-4 h-4" />, label: tx("clientProfile.stats.totalSpent", undefined, "Total Spent"), value: stats.totalSpent > 0 ? formatCurrency(stats.totalSpent) : "", highlight: true },
              { icon: <Star className="w-4 h-4" />, label: tx("clientProfile.stats.avgRating", undefined, "Avg Rating"), value: stats.reviewCount > 0 ? stats.avgRating.toFixed(1) : "" },
            ]}
          />
        )}

        {/* â”€â”€ Main grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* â”€â”€ Left column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* About / Intro */}
              <ProfileSection
                title={tx("clientProfile.about", undefined, "About")}
                animationDelay={0}
              >
                {clientIntro ? (
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {clientIntro}
                  </p>
                ) : (
                  <ProfileEmptySlot
                    message={tx("clientProfile.noIntro", undefined, "No introduction added yet.")}
                    cta={isOwnProfile ? (
                      <Link to="/settings?tab=profile" className="text-xs font-medium" style={{ color: accentColor }}>
                        + Add introduction
                      </Link>
                    ) : undefined}
                  />
                )}
              </ProfileSection>

              {/* Company info */}
              {(isOwnProfile || client.company_name || client.company_industry || client.company_size || client.company_role || client.company_website || (Array.isArray(client.hiring_needs) && client.hiring_needs.length > 0)) && (
                <ProfileSection
                  title={tx("clientProfile.companyInfo", undefined, "Company")}
                  icon={<Briefcase className="w-3.5 h-3.5" />}
                  animationDelay={80}
                >
                  {(client.company_name || client.company_industry || client.company_size || client.company_role || client.company_website || (Array.isArray(client.hiring_needs) && client.hiring_needs.length > 0)) ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {[
                          { label: tx("profile.companyName", undefined, "Company"), value: client.company_name },
                          { label: tx("profile.companyIndustry", undefined, "Industry"), value: client.company_industry },
                          { label: tx("profile.companySize", undefined, "Size"), value: client.company_size },
                          { label: tx("profile.companyRole", undefined, "Your role"), value: client.company_role },
                        ].filter(r => r.value).map(row => (
                          <div
                            key={row.label}
                            className="flex items-center gap-3 rounded-xl px-4 py-3 border"
                            style={{ background: "var(--color-background-elevated)", borderColor: "var(--color-border-subtle)" }}
                          >
                            <span className="text-xs font-medium shrink-0" style={{ color: "var(--color-text-tertiary)" }}>{row.label}</span>
                            <span className="font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{row.value}</span>
                          </div>
                        ))}
                        {client.company_website && (
                          <div
                            className="sm:col-span-2 flex items-center gap-3 rounded-xl px-4 py-3 border"
                            style={{ background: "var(--color-background-elevated)", borderColor: "var(--color-border-subtle)" }}
                          >
                            <Globe className="w-4 h-4 shrink-0" style={{ color: "var(--color-text-tertiary)" }} />
                            <a
                              href={client.company_website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium hover:underline break-all"
                              style={{ color: accentColor }}
                            >
                              {client.company_website}
                            </a>
                          </div>
                        )}
                      </div>
                      {Array.isArray(client.hiring_needs) && client.hiring_needs.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-tertiary)" }}>Hiring needs</p>
                          <div className="flex flex-wrap gap-2">
                            {client.hiring_needs.map(need => (
                              <ProfileTag key={need} label={need} accentColor={accentColor} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <ProfileEmptySlot
                      message={tx("clientProfile.noCompanyInfo", undefined, "No company details added yet.")}
                      cta={isOwnProfile ? (
                        <Link to="/settings" className="text-xs font-medium" style={{ color: accentColor }}>
                          + Add company details
                        </Link>
                      ) : undefined}
                    />
                  )}
                </ProfileSection>
              )}

              {/* Hiring preferences */}
              {(isOwnProfile || client.project_budget_preference || client.project_timeline_preference || communicationSummary || screeningSummary || legalSummary) && (
                <ProfileSection
                  title={tx("clientProfile.hiringPreferences", undefined, "Hiring Preferences")}
                  icon={<Target className="w-3.5 h-3.5" />}
                  animationDelay={160}
                >
                  {(client.project_budget_preference || client.project_timeline_preference || communicationSummary || screeningSummary || legalSummary) ? (
                    <dl className="space-y-3 text-sm">
                      {[
                        { label: tx("profile.budgetPreference", undefined, "Budget"), value: client.project_budget_preference },
                        { label: tx("profile.timelinePreference", undefined, "Timeline"), value: client.project_timeline_preference },
                        { label: tx("profile.communicationPreferences", undefined, "Communication"), value: communicationSummary },
                        { label: tx("profile.screeningPreferences", undefined, "Screening"), value: screeningSummary },
                        { label: tx("profile.legalPreferences", undefined, "Legal"), value: legalSummary },
                      ].filter(r => r.value).map(row => (
                        <div key={row.label} className="flex items-start gap-3">
                          <dt className="w-28 shrink-0 font-medium" style={{ color: "var(--color-text-tertiary)" }}>{row.label}</dt>
                          <dd className="leading-relaxed" style={{ color: "var(--color-text-primary)" }}>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <ProfileEmptySlot
                      message={tx("clientProfile.noHiringPreferences", undefined, "No hiring preferences added yet.")}
                      cta={isOwnProfile ? (
                        <Link to="/settings" className="text-xs font-medium" style={{ color: accentColor }}>
                          + Add preferences
                        </Link>
                      ) : undefined}
                    />
                  )}
                </ProfileSection>
              )}

              {/* Active jobs */}
              {recentJobs.length > 0 && (
                <ProfileSection
                  title={tx("clientProfile.activeJobs", undefined, "Active Job Postings")}
                  icon={<Briefcase className="w-3.5 h-3.5" />}
                  trailing={
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ background: "rgba(245,158,11,0.08)", color: accentColor, borderColor: "rgba(245,158,11,0.25)" }}>
                      {recentJobs.length}
                    </span>
                  }
                  animationDelay={240}
                >
                  <div className="space-y-3">
                    {recentJobs.map(job => (
                      <div
                        key={job.id}
                        className="group flex items-start justify-between gap-3 rounded-xl border px-4 py-3.5 transition-colors hover:border-[rgba(245,158,11,0.25)] hover:bg-[rgba(245,158,11,0.03)]"
                        style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-background-elevated)" }}
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="text-sm font-semibold hover:underline block truncate"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {job.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2">
                            <ProfileTag label={job.category} accentColor={accentColor} size="xs" />
                            {(job.budget_min != null || job.budget_max != null) && (
                              <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                                {job.budget_min != null && job.budget_max != null
                                  ? `${job.budget_min.toLocaleString()} â€“ ${job.budget_max.toLocaleString()} TND`
                                  : job.budget_min != null
                                    ? `From ${job.budget_min.toLocaleString()} TND`
                                    : `Up to ${job.budget_max!.toLocaleString()} TND`}
                              </span>
                            )}
                            {job.proposals_count != null && (
                              <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-tertiary)" }}>
                                <Users className="w-3 h-3" />
                                {job.proposals_count} {tx("clientProfile.proposals", undefined, "proposals")}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link to={`/jobs/${job.id}`} className="shrink-0">
                          <Button variant="outline" size="sm">
                            {isOwnProfile ? tx("jobDetail.manageJob", undefined, "Manage") : tx("clientProfile.apply", undefined, "Apply")}
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </ProfileSection>
              )}
            </div>

            {/* â”€â”€ Right sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <ProfileActionSidebar
              variant="client"
              primaryCta={
                canContact ? (
                  <button
                    type="button"
                    onClick={() => void handleStartConversation()}
                    disabled={isStartingConversation}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: accentColor, boxShadow: "0 8px 24px -8px rgba(245,158,11,0.50)" }}
                  >
                    {isStartingConversation
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <MessageSquare className="w-4 h-4" />}
                    {isStartingConversation
                      ? tx("common.loading", undefined, "Loading...")
                      : tx("clientProfile.sendMessage", undefined, "Send Message")}
                  </button>
                ) : undefined
              }
              workspaceInfo={[
                ...(client.location ? [{ label: tx("clientProfile.location", undefined, "Location"), value: localizeGovernorate(client.location, language) }] : []),
                { label: tx("clientProfile.memberSince", undefined, "Member since"), value: formatDate(client.created_at) },
              ]}
              verifications={[
                { label: tx("clientProfile.verifiedClient", undefined, "Identity Verified"), passed: Boolean(client.cin_verified) },
                { label: "Phone Verified", passed: Boolean(client.phone_verified) },
                { label: "Payment Method", passed: Boolean(client.payment_verified) },
              ]}
              ownerActions={isOwnProfile ? [
                {
                  icon: <Eye className="w-4 h-4" />,
                  label: tx("clientProfile.viewPublicProfile", undefined, "View Public Profile"),
                  description: tx("clientProfile.viewPublicProfileDesc", undefined, "Preview as freelancers see it"),
                  onClick: () => navigate(`/client/${client.id}?preview=public`),
                },
                {
                  icon: <Plus className="w-4 h-4" />,
                  label: tx("pages.clientJobs.postProject", undefined, "Post a Project"),
                  description: tx("clientProfile.actionPostDesc", undefined, "Create a new job and get proposals"),
                  onClick: () => navigate(ROUTES.jobsNew),
                },
                {
                  icon: <Briefcase className="w-4 h-4" />,
                  label: tx("nav.myProjects", undefined, "My Projects"),
                  description: tx("clientProfile.actionProjectsDesc", undefined, "Track open jobs and proposals"),
                  onClick: () => navigate(ROUTES.clientJobs),
                },
                {
                  icon: <Settings className="w-4 h-4" />,
                  label: tx("clientProfile.actionSettings", undefined, "Workspace Settings"),
                  description: tx("clientProfile.actionSettingsDesc", undefined, "Notifications and account controls"),
                  onClick: () => navigate(ROUTES.settings),
                },
              ] : []}
            />
          </div>
        </main>
      </div>
    </>
  );
}
