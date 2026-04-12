import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
  X,
} from "lucide-react";
import { Header } from "@/components/layout";
import { supabase } from "@/lib/supabase";
import { supabaseWithRetry } from "@/lib/supabaseWithRetry";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import Button from "@/components/ui/Button";
import { localizeGovernorate } from "@/lib/governorates";
import { useToast } from "@/components/ui/Toast";

import OptimizedImage from "@/components/common/OptimizedImage";
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

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

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl border flex-1 min-w-0 text-center"
      style={{
        background: "var(--color-background-elevated)",
        borderColor: "var(--color-border-subtle)",
      }}
    >
      <Icon
        className="w-5 h-5 flex-shrink-0"
        style={{ color: "var(--workspace-primary)" }}
      />
      <span
        className="text-lg font-bold leading-tight tabular-nums"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </span>
      <span
        className="text-xs leading-snug"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {label}
      </span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
      {/* Header card */}
      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{
          background: "var(--color-background-elevated)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
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
      <div
        className="rounded-2xl border p-5 space-y-3"
        style={{
          background: "var(--color-background-elevated)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
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
  const { user, updateProfile, profile } = useAuth();
  const { tx, language } = useTranslation() as any;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

  const isOwnProfile = Boolean(user?.id && client?.id && user.id === client.id);

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
    setLocationDraft(client.location ?? "");
    setIsEditingProfile(false);
  }, [client]);

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
      showToast("Client profile updated", "success");
    } catch (error) {
      logger.error("Failed to update client profile", error);
      showToast("Failed to update client profile", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        <SEO {...SEO_CONFIG.dashboard} noIndex />
        <div
          className="min-h-screen"
          style={{ background: "var(--color-background-base, #f9fafb)" }}
        >
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
        <div
          className="min-h-screen"
          style={{ background: "var(--color-background-base, #f9fafb)" }}
        >
          <Header />
          <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
            <UserX
              className="w-16 h-16"
              style={{ color: "var(--color-text-secondary)" }}
            />
            <h2
              className="text-xl font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {tx("common.loadFailed", undefined, "Failed to load profile")}
            </h2>
            <p
              className="text-sm max-w-xl"
              style={{ color: "var(--color-text-secondary)" }}
            >
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
        <div
          className="min-h-screen"
          style={{ background: "var(--color-background-base, #f9fafb)" }}
        >
          <Header />
          <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
            <UserX
              className="w-16 h-16"
              style={{ color: "var(--color-text-secondary)" }}
            />
            <h2
              className="text-xl font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {tx("clientProfile.notFound", undefined, "Client not found")}
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
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

  const canContact = !!user && !isOwnProfile;
  const clientIntro = getClientIntro(client);
  const communicationSummary = getSummary(client.communication_preferences);
  const screeningSummary = getSummary(client.screening_preferences);
  const legalSummary = getSummary(client.legal_preferences);
  const statsContent = stats ? (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        icon={Briefcase}
        label={tx(
          "clientProfile.stats.jobsPosted",
          undefined,
          "Jobs Posted",
        )}
        value={stats.totalJobs.toString()}
      />
      <StatCard
        icon={FileText}
        label={tx(
          "clientProfile.stats.completedContracts",
          undefined,
          "Completed",
        )}
        value={stats.completedContracts.toString()}
      />
      <StatCard
        icon={DollarSign}
        label={tx(
          "clientProfile.stats.totalSpent",
          undefined,
          "Total Spent",
        )}
        value={
          stats.totalSpent > 0 ? formatCurrency(stats.totalSpent) : "—"
        }
      />
      <StatCard
        icon={Star}
        label={tx(
          "clientProfile.stats.avgRating",
          undefined,
          "Avg Rating",
        )}
        value={
          stats.reviewCount > 0 ? (
            <span className="flex items-center justify-center gap-1">
              <Star
                className="w-4 h-4"
                style={{
                  color: "var(--color-status-warning)",
                  fill: "var(--color-status-warning)",
                }}
              />
              {stats.avgRating.toFixed(1)}
            </span>
          ) : (
            <span
              className="text-sm font-normal"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {tx("clientProfile.noReviews", undefined, "No reviews")}
            </span>
          )
        }
      />
    </div>
  ) : null;

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <>
      <SEO {...SEO_CONFIG.dashboard} noIndex />
      <div
        className="min-h-screen"
        style={{ background: "var(--color-background-base, #f9fafb)" }}
      >
        <Header />

        <main className="max-w-6xl mx-auto px-4 py-8 pb-20 space-y-5">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            {tx("common.back", undefined, "Back")}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            <div className="lg:col-span-2 space-y-5">

          {/* ── Profile header card ──────────────────────────────── */}
          <div
            className="rounded-2xl border p-6 space-y-4"
            style={{
              background: "var(--color-background-elevated)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                {client.avatar_url ? (
                  <OptimizedImage
                    src={client.avatar_url}
                    alt={client.full_name}
                    className="w-20 h-20 rounded-full"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold select-none"
                    style={{ background: "var(--workspace-primary)" }}
                  >
                    {getInitials(client.full_name)}
                  </div>
                )}
              </div>

              {/* Name + badges */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <h1
                  className="text-2xl font-bold leading-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {client.full_name}
                </h1>

                {isOwnProfile ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {!isEditingProfile ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors"
                        style={{
                          color: "var(--workspace-primary)",
                          borderColor:
                            "color-mix(in srgb, var(--workspace-primary) 38%, var(--color-border-subtle))",
                          background:
                            "color-mix(in srgb, var(--workspace-primary) 10%, transparent)",
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        {tx("clientProfile.editProfile", undefined, "Edit Profile")}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setBioDraft(clientIntro);
                            setLocationDraft(client.location ?? "");
                            setIsEditingProfile(false);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors"
                          style={{
                            color: "var(--color-text-secondary)",
                            borderColor: "var(--color-border-subtle)",
                            background: "transparent",
                          }}
                          disabled={isSavingProfile}
                        >
                          <X className="w-3.5 h-3.5" />
                          {tx("common.cancel", undefined, "Cancel")}
                        </button>

                        <button
                          type="button"
                          onClick={() => void saveOwnProfile()}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors"
                          style={{
                            color: "var(--workspace-primary)",
                            borderColor:
                              "color-mix(in srgb, var(--workspace-primary) 45%, var(--color-border-subtle))",
                            background:
                              "color-mix(in srgb, var(--workspace-primary) 12%, transparent)",
                          }}
                          disabled={isSavingProfile}
                        >
                          <Save className="w-3.5 h-3.5" />
                          {isSavingProfile
                            ? tx("common.saving", undefined, "Saving...")
                            : tx("common.save", undefined, "Save")}
                        </button>
                      </>
                    )}
                  </div>
                ) : null}

                {/* Verified badge */}
                {client.cin_verified && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        "color-mix(in srgb, var(--color-status-success) 12%, transparent)",
                      color: "var(--color-status-success)",
                    }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {tx(
                      "clientProfile.verifiedClient",
                      undefined,
                      "Verified Client",
                    )}
                  </span>
                )}

                {/* Location */}
                {isEditingProfile ? (
                  <div className="space-y-1">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {tx("clientProfile.location", undefined, "Location")}
                    </label>
                    <input
                      value={locationDraft}
                      onChange={(event) => setLocationDraft(event.target.value)}
                      placeholder={tx("clientProfile.locationPlaceholder", undefined, "City or governorate")}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                      style={{
                        borderColor: "var(--color-border-subtle)",
                        background: "var(--color-background-base)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>
                ) : client.location ? (
                  <div
                    className="flex items-center gap-1.5 text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{localizeGovernorate(client.location, language)}</span>
                  </div>
                ) : null}

                {/* Member since */}
                <div
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {tx("clientProfile.memberSince", undefined, "Member since")}{" "}
                    {formatDate(client.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {isEditingProfile ? (
              <div className="space-y-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {tx("clientProfile.about", undefined, "About")}
                </label>
                <textarea
                  value={bioDraft}
                  onChange={(event) => setBioDraft(event.target.value)}
                  rows={4}
                  placeholder={tx("clientProfile.bioPlaceholder", undefined, "Tell freelancers about your company or hiring needs")}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-y"
                  style={{
                    borderColor: "var(--color-border-subtle)",
                    background: "var(--color-background-base)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
            ) : clientIntro ? (
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-primary)" }}
              >
                {clientIntro}
              </p>
            ) : null}
          </div>

          {(client.company_name || client.company_industry || client.company_size || client.company_role || (Array.isArray(client.hiring_needs) && client.hiring_needs.length > 0)) ? (
            <div
              className="rounded-2xl border p-5"
              style={{
                background: "var(--color-background-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <h2
                className="text-sm font-semibold mb-3"
                style={{ color: "var(--color-text-primary)" }}
              >
                {tx("clientProfile.companyInfo", undefined, "Company Information")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {client.company_name ? (
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-text-primary)" }}>{tx("profile.companyName", undefined, "Company name")}: </span>
                    {client.company_name}
                  </p>
                ) : null}
                {client.company_industry ? (
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-text-primary)" }}>{tx("profile.companyIndustry", undefined, "Industry")}: </span>
                    {client.company_industry}
                  </p>
                ) : null}
                {client.company_size ? (
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-text-primary)" }}>{tx("profile.companySize", undefined, "Company size")}: </span>
                    {client.company_size}
                  </p>
                ) : null}
                {client.company_role ? (
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-text-primary)" }}>{tx("profile.companyRole", undefined, "Role")}: </span>
                    {client.company_role}
                  </p>
                ) : null}
                {client.company_website ? (
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-text-primary)" }}>{tx("profile.companyWebsite", undefined, "Website")}: </span>
                    {client.company_website}
                  </p>
                ) : null}
              </div>
              {Array.isArray(client.hiring_needs) && client.hiring_needs.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {client.hiring_needs.map((need) => (
                    <span
                      key={need}
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          "color-mix(in srgb, var(--workspace-primary) 12%, transparent)",
                        color: "var(--workspace-primary)",
                      }}
                    >
                      {need}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {(client.project_budget_preference || client.project_timeline_preference || communicationSummary || screeningSummary || legalSummary) ? (
            <div
              className="rounded-2xl border p-5"
              style={{
                background: "var(--color-background-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <h2
                className="text-sm font-semibold mb-3"
                style={{ color: "var(--color-text-primary)" }}
              >
                {tx("clientProfile.hiringPreferences", undefined, "Hiring Preferences")}
              </h2>

              <div className="space-y-2 text-sm">
                {client.project_budget_preference ? (
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-text-primary)" }}>{tx("profile.budgetPreference", undefined, "Budget")}: </span>
                    {client.project_budget_preference}
                  </p>
                ) : null}
                {client.project_timeline_preference ? (
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-text-primary)" }}>{tx("profile.timelinePreference", undefined, "Timeline")}: </span>
                    {client.project_timeline_preference}
                  </p>
                ) : null}
                {communicationSummary ? (
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-text-primary)" }}>{tx("profile.communicationPreferences", undefined, "Communication")}: </span>
                    {communicationSummary}
                  </p>
                ) : null}
                {screeningSummary ? (
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-text-primary)" }}>{tx("profile.screeningPreferences", undefined, "Screening")}: </span>
                    {screeningSummary}
                  </p>
                ) : null}
                {legalSummary ? (
                  <p style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "var(--color-text-primary)" }}>{tx("profile.legalPreferences", undefined, "Legal")}: </span>
                    {legalSummary}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* ── Recent job postings ──────────────────────────────── */}
          {recentJobs.length > 0 && (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                background: "var(--color-background-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <div
                className="px-5 py-4 border-b"
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                <h2
                  className="text-base font-semibold flex items-center gap-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <Briefcase className="w-4 h-4" />
                  {tx(
                    "clientProfile.activeJobs",
                    undefined,
                    "Active Job Postings",
                  )}
                </h2>
              </div>

              <div
                className="divide-y"
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="px-5 py-4 flex items-start justify-between gap-3"
                  >
                    {/* Left: title + meta */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="text-sm font-semibold hover:underline block truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {job.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Category badge */}
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background:
                              "color-mix(in srgb, var(--workspace-primary) 12%, transparent)",
                            color: "var(--workspace-primary)",
                          }}
                        >
                          {job.category}
                        </span>

                        {/* Budget */}
                        {(job.budget_min != null || job.budget_max != null) && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {job.budget_min != null && job.budget_max != null
                              ? `${job.budget_min.toLocaleString()} – ${job.budget_max.toLocaleString()} TND`
                              : job.budget_min != null
                                ? `From ${job.budget_min.toLocaleString()} TND`
                                : `Up to ${job.budget_max!.toLocaleString()} TND`}
                          </span>
                        )}

                        {/* Proposals count */}
                        {job.proposals_count != null && (
                          <span
                            className="text-xs flex items-center gap-1"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            <Users className="w-3 h-3" />
                            {job.proposals_count}{" "}
                            {tx(
                              "clientProfile.proposals",
                              undefined,
                              "proposals",
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Apply button */}
                    <Link to={`/jobs/${job.id}`} className="flex-shrink-0">
                      <Button variant="outline" size="sm">
                        {tx("clientProfile.apply", undefined, "Apply")}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Contact button ───────────────────────────────────── */}
          {canContact && (
            <div className="flex justify-center pt-2">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<MessageSquare className="w-5 h-5" />}
                onClick={() => navigate("/messages")}
              >
                {tx("clientProfile.sendMessage", undefined, "Send Message")}
              </Button>
            </div>
          )}
            </div>

            <aside className="space-y-5">
              {statsContent}

              <div
                className="rounded-2xl border p-5"
                style={{
                  background: "var(--color-background-elevated)",
                  borderColor: "var(--color-border-subtle)",
                }}
              >
                <h2
                  className="text-sm font-semibold mb-3"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {tx("clientProfile.workspaceSummary", undefined, "Client Workspace")}
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {tx("clientProfile.workspaceSummaryDesc", undefined, "Public client profile is read-only for visitors. Only you can edit while viewing your own profile.")}
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
