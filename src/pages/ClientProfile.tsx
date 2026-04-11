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
} from "lucide-react";
import { Header } from "@/components/layout";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import { localizeGovernorate } from "@/lib/governorates";

import OptimizedImage from "@/components/common/OptimizedImage";
import { Skeleton } from "@/components/common/SkeletonCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientProfileData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
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
  const { user } = useAuth();
  const { tx, language } = useTranslation() as any;
  const navigate = useNavigate();

  // ── Fetch client profile ────────────────────────────────────────────────
  const { data: client, isLoading } = useQuery<ClientProfileData>({
    queryKey: ["client-profile", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select(
          "id, full_name, avatar_url, location, bio, created_at, cin_verified",
        )
        .eq("id", clientId!)
        .single();
      if (error) throw error;
      return data as ClientProfileData;
    },
    enabled: !!clientId,
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

  const isOwnProfile = user?.id === client.id;
  const canContact = !!user && !isOwnProfile;

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <>
      <SEO {...SEO_CONFIG.dashboard} noIndex />
      <div
        className="min-h-screen"
        style={{ background: "var(--color-background-base, #f9fafb)" }}
      >
        <Header />

        <main className="max-w-3xl mx-auto px-4 py-8 pb-20 space-y-5">
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
                {client.location && (
                  <div
                    className="flex items-center gap-1.5 text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{localizeGovernorate(client.location, language)}</span>
                  </div>
                )}

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
            {client.bio && (
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-primary)" }}
              >
                {client.bio}
              </p>
            )}
          </div>

          {/* ── Stats row ────────────────────────────────────────── */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          )}

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
        </main>
      </div>
    </>
  );
}
