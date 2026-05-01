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
import {
  ProfileAvatar,
  ProfileInfoHeader,
  ProfileInfoRow,
  ProfileSectionCard,
  ProfileSectionHeader,
  ProfileStatCard,
} from "@/components/profile/ProfilePrimitives";

import { Skeleton } from "@/components/common/SkeletonCard";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientProfile() {
  const { clientId } = useParams<{ clientId: string }>();
  const { user, updateProfile, profile, activeMode } = useAuth();
  const { tx, language } = useTranslation() as any;
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);

  const isPublicPreview = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("preview") === "public";
  }, [location.search]);

  const governorateOptions = useMemo(
    () => getLocalizedGovernorateOptions(language),
    [language],
  );

  // ── Fetch client profile ────────────────────────────────────────────────
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

  // ── Fetch client stats ──────────────────────────────────────────────────
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

  // ── Fetch recent open jobs ──────────────────────────────────────────────
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

  useEffect(() => {
    if (!client) {
      return;
    }

    setBioDraft(getClientIntro(client));
    setLocationDraft(normalizeGovernorateValue(client.location));
    setIsEditingProfile(false);
  }, [client, isPublicPreview]);

  const saveOwnProfile = async () => {
    if (!isOwnProfile || !user?.id) {
      return;
    }

    const nextBio = bioDraft.trim();
    const nextLocation = locationDraft.trim();
    const currentCommunicationPreferences = {
      ...toRecord(profile?.communication_preferences),
      ...toRecord(client?.communication_preferences),
    };
    const nextCommunicationPreferences: Record<string, unknown> = {
      ...currentCommunicationPreferences,
    };

    if (nextBio) {
      nextCommunicationPreferences.profile_intro = nextBio;
    } else {
      delete nextCommunicationPreferences.profile_intro;
    }

    setIsSavingProfile(true);

    try {
      await updateProfile({
        location: nextLocation || undefined,
        communication_preferences: nextCommunicationPreferences,
      });

      queryClient.setQueryData<ClientProfileData>(["client-profile", clientId, user?.id ?? null], (prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          location: nextLocation || null,
          communication_preferences: nextCommunicationPreferences,
        };
      });

      setIsEditingProfile(false);
      showToast(
        tx("pages.clientProfile.toasts.profileUpdated", undefined, "Client profile updated"),
        "success",
      );
    } catch (error) {
      logger.error("Failed to update client profile", error);
      showToast(
        tx(
          "pages.clientProfile.toasts.profileUpdateFailed",
          undefined,
          "Failed to update client profile",
        ),
        "error",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

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

  // ── Loading ─────────────────────────────────────────────────────────────
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

  // ── Error ───────────────────────────────────────────────────────────────
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

  // ── Not found ───────────────────────────────────────────────────────────
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
  const clientIntro = getClientIntro(client);
  const communicationSummary = getSummary(client.communication_preferences);
  const screeningSummary = getSummary(client.screening_preferences);
  const legalSummary = getSummary(client.legal_preferences);
  const accentColor = "#F59E0B";
  const statsContent = stats ? (
    <section className="grid grid-cols-2 gap-3">
      <ProfileStatCard
        icon={<Briefcase className="w-4 h-4" />}
        label={tx(
          "clientProfile.stats.jobsPosted",
          undefined,
          "Jobs Posted",
        )}
        value={stats.totalJobs}
        accentColor={accentColor}
      />
      <ProfileStatCard
        icon={<FileText className="w-4 h-4" />}
        label={tx(
          "clientProfile.stats.completedContracts",
          undefined,
          "Completed",
        )}
        value={stats.completedContracts}
        accentColor={accentColor}
      />
      <ProfileStatCard
        icon={<DollarSign className="w-4 h-4" />}
        label={tx(
          "clientProfile.stats.totalSpent",
          undefined,
          "Total Spent",
        )}
        value={
          stats.totalSpent > 0 ? formatCurrency(stats.totalSpent) : "—"
        }
        accentColor={accentColor}
      />
      <ProfileStatCard
        icon={<Star className="w-4 h-4" />}
        label={tx(
          "clientProfile.stats.avgRating",
          undefined,
          "Avg Rating",
        )}
        value={
          stats.reviewCount > 0 ? stats.avgRating.toFixed(1) : "—"
        }
        accentColor={accentColor}
      />
    </section>
  ) : null;

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <>
      <SEO {...SEO_CONFIG.dashboard} noIndex />
      <div className="min-h-screen page-bg-base">
        <Header />

        <main className="w-full p-4 sm:p-6">
          {isPublicPreview && isOwnerProfile ? (
            <div className="max-w-6xl mx-auto mb-6">
              <div className="bg-[linear-gradient(135deg,rgba(245,158,11,0.16),#141414_48%,#121212)] border border-[#493624] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {tx("clientProfile.previewTitle", undefined, "Public Profile Preview")}
                  </p>
                  <p className="text-xs text-white/60">
                    {tx("clientProfile.previewDesc", undefined, "You are viewing your profile as other users see it.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/client/${client.id}`)}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                  style={{
                    color: accentColor,
                    borderColor: "rgba(245,158,11,0.45)",
                    background: "rgba(245,158,11,0.08)",
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {tx("clientProfile.exitPreview", undefined, "Exit Preview")}
                </button>
              </div>
            </div>
          ) : null}

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-5">
              <ProfileSectionCard className="relative overflow-hidden bg-[radial-gradient(circle_at_88%_6%,rgba(245,158,11,0.18),transparent_40%),#141414] border-white/10">
                <div className="absolute -right-4 -top-8 h-24 w-24 rounded-full bg-[#F59E0B]/20 blur-2xl" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-5">
                  <ProfileAvatar
                    type="client"
                    name={client.full_name}
                    imageUrl={client.avatar_url}
                    showOnlineDot={Boolean(client.cin_verified)}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h1 className="text-2xl sm:text-[1.75rem] font-black leading-tight text-white">
                        {client.full_name}
                      </h1>

                      {isOwnProfile ? (
                        !isEditingProfile ? (
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(true)}
                            className="inline-flex items-center gap-1 text-white/60 hover:text-white transition-colors text-xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            {tx("clientProfile.editProfile", undefined, "Edit Profile")}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setBioDraft(clientIntro);
                                setLocationDraft(normalizeGovernorateValue(client.location));
                                setIsEditingProfile(false);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border text-white/75 border-white/15"
                              disabled={isSavingProfile}
                            >
                              <X className="w-3.5 h-3.5" />
                              {tx("common.cancel", undefined, "Cancel")}
                            </button>

                            <button
                              type="button"
                              onClick={() => void saveOwnProfile()}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
                              style={{
                                color: accentColor,
                                borderColor: "rgba(245,158,11,0.45)",
                                background: "rgba(245,158,11,0.12)",
                              }}
                              disabled={isSavingProfile}
                            >
                              <Save className="w-3.5 h-3.5" />
                              {isSavingProfile
                                ? tx("common.saving", undefined, "Saving...")
                                : tx("common.save", undefined, "Save")}
                            </button>
                          </div>
                        )
                      ) : null}
                    </div>

                    <p className="text-white/55 mt-1">
                      {client.company_role || client.company_industry || tx("clientProfile.client", undefined, "Client")}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className="px-3 py-1 rounded-full border text-xs font-semibold"
                        style={{
                          background: "rgba(245,158,11,0.12)",
                          color: accentColor,
                          borderColor: "rgba(245,158,11,0.35)",
                        }}
                      >
                        {tx("clientProfile.client", undefined, "Client")}
                      </span>

                      {client.cin_verified ? (
                        <span className="px-3 py-1 rounded-full border text-xs font-semibold bg-green-500/10 text-green-400 border-green-500/25 inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {tx("clientProfile.verifiedClient", undefined, "Verified Client")}
                        </span>
                      ) : null}
                    </div>

                    {!isEditingProfile ? (
                      <div className="flex flex-wrap gap-4 text-sm text-white/55 mt-3">
                        {client.location ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {localizeGovernorate(client.location, language)}
                          </span>
                        ) : null}

                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {tx("clientProfile.memberSince", undefined, "Member since")} {formatDate(client.created_at)}
                        </span>

                        {stats ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Target className="w-4 h-4" style={{ color: accentColor }} />
                            {stats.totalJobs} {tx("clientProfile.stats.jobsPosted", undefined, "Jobs Posted")}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                {isEditingProfile ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5">
                    <div>
                      <label className="text-xs text-white/50">
                        {tx("clientProfile.location", undefined, "Location")}
                      </label>
                      <div className="mt-1">
                        <CustomSelect
                          id="client-profile-location"
                          value={locationDraft}
                          onChange={(value) => setLocationDraft(value)}
                          options={governorateOptions}
                          placeholder={tx("clientProfile.locationPlaceholder", undefined, "Select governorate")}
                          variant="client"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-white/50">
                        {tx("clientProfile.about", undefined, "About")}
                      </label>
                      <textarea
                        value={bioDraft}
                        onChange={(event) => setBioDraft(event.target.value)}
                        rows={4}
                        placeholder={tx("clientProfile.bioPlaceholder", undefined, "Tell freelancers about your company or hiring needs")}
                        className="mt-1 w-full bg-[var(--color-bg-base)] border border-white/10 rounded-lg text-white p-3 outline-none resize-y"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-white/75 mt-4 leading-relaxed">
                    {clientIntro || tx("clientProfile.noIntro", undefined, "No introduction added yet")}
                  </p>
                )}
              </ProfileSectionCard>

              {(client.company_name || client.company_industry || client.company_size || client.company_role || client.company_website || (Array.isArray(client.hiring_needs) && client.hiring_needs.length > 0)) ? (
                <ProfileSectionCard>
                  <ProfileSectionHeader
                    title={tx("clientProfile.companyInfo", undefined, "Company Information")}
                    accentColor={accentColor}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-white/75">
                    {client.company_name ? (
                      <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        <span className="text-on-surface font-semibold">{tx("profile.companyName", undefined, "Company name")}: </span>
                        {client.company_name}
                      </p>
                    ) : null}
                    {client.company_industry ? (
                      <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        <span className="text-on-surface font-semibold">{tx("profile.companyIndustry", undefined, "Industry")}: </span>
                        {client.company_industry}
                      </p>
                    ) : null}
                    {client.company_size ? (
                      <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        <span className="text-on-surface font-semibold">{tx("profile.companySize", undefined, "Company size")}: </span>
                        {client.company_size}
                      </p>
                    ) : null}
                    {client.company_role ? (
                      <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        <span className="text-on-surface font-semibold">{tx("profile.companyRole", undefined, "Role")}: </span>
                        {client.company_role}
                      </p>
                    ) : null}
                    {client.company_website ? (
                      <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                        <span className="text-on-surface font-semibold">{tx("profile.companyWebsite", undefined, "Website")}: </span>
                        <a
                          href={client.company_website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: accentColor }}
                          className="hover:underline break-all"
                        >
                          {client.company_website}
                        </a>
                      </p>
                    ) : null}
                  </div>

                  {Array.isArray(client.hiring_needs) && client.hiring_needs.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {client.hiring_needs.map((need) => (
                        <span
                          key={need}
                          className="px-4 py-1.5 rounded-full border text-sm"
                          style={{
                            background: "rgba(245,158,11,0.12)",
                            color: accentColor,
                            borderColor: "rgba(245,158,11,0.35)",
                          }}
                        >
                          {need}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </ProfileSectionCard>
              ) : null}

              {(client.project_budget_preference || client.project_timeline_preference || communicationSummary || screeningSummary || legalSummary) ? (
                <ProfileSectionCard>
                  <ProfileSectionHeader
                    title={tx("clientProfile.hiringPreferences", undefined, "Hiring Preferences")}
                    accentColor={accentColor}
                  />

                  <div className="space-y-2 text-sm text-white/75">
                    {client.project_budget_preference ? (
                      <p>
                        <span className="text-on-surface font-semibold">{tx("profile.budgetPreference", undefined, "Budget")}: </span>
                        {client.project_budget_preference}
                      </p>
                    ) : null}
                    {client.project_timeline_preference ? (
                      <p>
                        <span className="text-on-surface font-semibold">{tx("profile.timelinePreference", undefined, "Timeline")}: </span>
                        {client.project_timeline_preference}
                      </p>
                    ) : null}
                    {communicationSummary ? (
                      <p>
                        <span className="text-on-surface font-semibold">{tx("profile.communicationPreferences", undefined, "Communication")}: </span>
                        {communicationSummary}
                      </p>
                    ) : null}
                    {screeningSummary ? (
                      <p>
                        <span className="text-on-surface font-semibold">{tx("profile.screeningPreferences", undefined, "Screening")}: </span>
                        {screeningSummary}
                      </p>
                    ) : null}
                    {legalSummary ? (
                      <p>
                        <span className="text-on-surface font-semibold">{tx("profile.legalPreferences", undefined, "Legal")}: </span>
                        {legalSummary}
                      </p>
                    ) : null}
                  </div>
                </ProfileSectionCard>
              ) : null}

              {recentJobs.length > 0 ? (
                <ProfileSectionCard>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: accentColor }} />
                      <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: `${accentColor}CC` }}>
                        {tx("clientProfile.activeJobs", undefined, "Active Job Postings")}
                      </span>
                    </div>
                    <span className="border border-white/10 bg-white/[0.04] px-2 py-0.5 rounded text-xs text-white/70">
                      {recentJobs.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-xl border border-white/10 bg-[#0f0f0f] p-3.5 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="text-sm font-semibold hover:underline block truncate text-white"
                          >
                            {job.title}
                          </Link>

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{
                                background: "rgba(245,158,11,0.15)",
                                color: accentColor,
                              }}
                            >
                              {job.category}
                            </span>

                            {(job.budget_min != null || job.budget_max != null) ? (
                              <span className="text-xs text-white/50">
                                {job.budget_min != null && job.budget_max != null
                                  ? `${job.budget_min.toLocaleString()} – ${job.budget_max.toLocaleString()} TND`
                                  : job.budget_min != null
                                    ? `From ${job.budget_min.toLocaleString()} TND`
                                    : `Up to ${job.budget_max!.toLocaleString()} TND`}
                              </span>
                            ) : null}

                            {job.proposals_count != null ? (
                              <span className="text-xs flex items-center gap-1 text-white/50">
                                <Users className="w-3 h-3" />
                                {job.proposals_count} {tx("clientProfile.proposals", undefined, "proposals")}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <Link to={`/jobs/${job.id}`} className="flex-shrink-0">
                          <Button variant="outline" size="sm">
                            {isOwnProfile
                              ? tx("jobDetail.manageJob", undefined, "Manage job")
                              : tx("clientProfile.apply", undefined, "Apply")}
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </ProfileSectionCard>
              ) : null}
            </div>

            <aside className="lg:col-span-1 flex flex-col gap-5">
              <ProfileSectionCard>
                <div className="flex flex-col gap-3 w-full">
                  {isOwnProfile ? (
                    <button
                      onClick={() => navigate(`/client/${client.id}?preview=public`)}
                      className="group relative w-full overflow-hidden rounded-xl p-3.5 text-left border transition-all duration-200"
                      style={{
                        borderColor: "rgba(245,158,11,0.45)",
                        background: "linear-gradient(135deg, rgba(245,158,11,0.24) 0%, #171717 58%, #141414 100%)",
                        boxShadow: "0 14px 36px -26px rgba(245,158,11,0.62)",
                      }}
                    >
                      <span className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full opacity-35 bg-orange-500/40" />
                      <span className="inline-flex items-center gap-2 text-base font-semibold text-white relative z-10">
                        <Eye className="w-4 h-4 text-white/90" />
                        {tx("clientProfile.viewPublicProfile", undefined, "View Public Profile")}
                      </span>
                      <span className="mt-1 block text-xs text-white/75 relative z-10">
                        {tx("clientProfile.viewPublicProfileDesc", undefined, "Preview exactly how freelancers and visitors see your profile.")}
                      </span>
                    </button>
                  ) : null}

                  {isOwnProfile ? (
                    <button
                      onClick={() => navigate(ROUTES.jobsNew)}
                      className="group relative w-full overflow-hidden rounded-xl p-3.5 text-left border transition-all duration-200"
                      style={{
                        borderColor: "rgba(245,158,11,0.45)",
                        background: "linear-gradient(135deg, rgba(245,158,11,0.24) 0%, #171717 58%, #141414 100%)",
                        boxShadow: "0 14px 36px -26px rgba(245,158,11,0.62)",
                      }}
                    >
                      <span className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full opacity-35 bg-orange-500/40" />
                      <span className="inline-flex items-center gap-2 text-base font-semibold text-white relative z-10">
                        <Plus className="w-4 h-4 text-white/90" />
                        {tx("pages.clientJobs.postProject", undefined, "Post a project")}
                      </span>
                      <span className="mt-1 block text-xs text-white/75 relative z-10">
                        {tx("clientProfile.actionPostDesc", undefined, "Create a new job and start receiving proposals.")}
                      </span>
                    </button>
                  ) : null}

                  {isOwnProfile ? (
                    <button
                      onClick={() => navigate(ROUTES.clientJobs)}
                      className="w-full rounded-xl p-3.5 text-left border border-white/10 bg-[linear-gradient(180deg,#1a1a1a_0%,#171717_100%)] transition-all duration-200 hover:border-white/20 hover:bg-[var(--color-bg-muted)]"
                    >
                      <span className="inline-flex items-center gap-2 text-base font-semibold text-white">
                        <Briefcase className="w-4 h-4" style={{ color: accentColor }} />
                        {tx("nav.myProjects", undefined, "My Projects")}
                      </span>
                      <span className="mt-1 block text-xs text-white/50">
                        {tx("clientProfile.actionProjectsDesc", undefined, "Track open jobs and incoming proposals.")}
                      </span>
                    </button>
                  ) : null}

                  {isOwnProfile ? (
                    <button
                      onClick={() => navigate(ROUTES.settings)}
                      className="w-full rounded-xl p-3.5 text-left border border-white/10 transition-all duration-200 hover:bg-[var(--color-bg-elevated)] hover:border-white/20"
                    >
                      <span className="inline-flex items-center gap-2 text-base font-semibold text-white/90">
                        <Settings className="w-4 h-4 text-white/75" />
                        {tx("clientProfile.actionSettings", undefined, "Workspace Settings")}
                      </span>
                      <span className="mt-1 block text-xs text-white/50">
                        {tx("clientProfile.actionSettingsDesc", undefined, "Notifications, security, and account controls.")}
                      </span>
                    </button>
                  ) : null}

                  {canContact ? (
                    <button
                      onClick={() => {
                        void handleStartConversation();
                      }}
                      disabled={isStartingConversation}
                      className="w-full text-white rounded-xl py-3 font-semibold transition-colors inline-flex items-center justify-center gap-2"
                      style={{ background: accentColor }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {isStartingConversation
                        ? tx("common.loading", undefined, "Loading...")
                        : tx("clientProfile.sendMessage", undefined, "Send Message")}
                    </button>
                  ) : null}
                </div>
              </ProfileSectionCard>

              {statsContent}

              <ProfileSectionCard>
                <ProfileInfoHeader
                  icon={<ShieldCheck className="w-4 h-4" />}
                  title={tx("clientProfile.workspaceSummary", undefined, "Client Workspace")}
                  accentColor={accentColor}
                />

                {client.location ? (
                  <ProfileInfoRow
                    label={tx("clientProfile.location", undefined, "Location")}
                    value={localizeGovernorate(client.location, language)}
                  />
                ) : null}
                <ProfileInfoRow
                  label={tx("clientProfile.memberSince", undefined, "Member since")}
                  value={formatDate(client.created_at)}
                />
                <ProfileInfoRow
                  label={tx("clientProfile.verification", undefined, "Verification")}
                  value={
                    <span className={client.cin_verified ? "text-green-500" : "text-white/75"}>
                      {client.cin_verified
                        ? tx("clientProfile.verifiedClient", undefined, "Verified Client")
                        : tx("clientProfile.unverified", undefined, "Pending")}
                    </span>
                  }
                />
              </ProfileSectionCard>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}


