import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle, FileText, Clock, CheckCircle2, XCircle,
  ChevronRight, Send, Briefcase, TrendingUp, Circle, ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/i18n";

type ProposalTab = "all" | "pending" | "accepted" | "rejected";

type ProposalRow = {
  id: string;
  job_id?: string | null;
  bid_amount: number;
  created_at: string;
  status: string;
  jobs?: { id?: string | null; title?: string | null; category?: string | null } | null;
};

const TAB_STATUS_MAP: Record<ProposalTab, string[]> = {
  all: [],
  pending: ["pending", "new", "shortlisted"],
  accepted: ["accepted", "hired"],
  rejected: ["rejected", "archived", "withdrawn"],
};

const normalizeToTab = (status: string): ProposalTab => {
  const s = String(status || "").toLowerCase();
  if (TAB_STATUS_MAP.accepted.includes(s)) return "accepted";
  if (TAB_STATUS_MAP.rejected.includes(s)) return "rejected";
  return "pending";
};

type Tx = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

const getStatusLabel = (status: string, tx: Tx) => {
  if (normalizeToTab(status) === "accepted") return tx("pages.myProposals.accepted", undefined, "Accepted");
  if (normalizeToTab(status) === "rejected") return tx("pages.myProposals.rejected", undefined, "Declined");
  return tx("pages.myProposals.pending", undefined, "Pending");
};

const StatusDot = ({ status }: { status: string }) => {
  const tab = normalizeToTab(status);
  if (tab === "accepted") return <CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-status-success)" }} />;
  if (tab === "rejected") return <XCircle className="w-4 h-4" style={{ color: "var(--color-status-error)" }} />;
  return <Circle className="w-4 h-4" style={{ color: "var(--color-status-warning)" }} />;
};

const pillStyle = (status: string): React.CSSProperties => {
  const tab = normalizeToTab(status);
  if (tab === "accepted") return { background: "color-mix(in srgb, var(--color-status-success) 14%, transparent)", color: "var(--color-status-success)", border: "1px solid color-mix(in srgb, var(--color-status-success) 28%, transparent)" };
  if (tab === "rejected") return { background: "color-mix(in srgb, var(--color-status-error) 14%, transparent)", color: "var(--color-status-error)", border: "1px solid color-mix(in srgb, var(--color-status-error) 28%, transparent)" };
  return { background: "color-mix(in srgb, var(--color-status-warning) 14%, transparent)", color: "var(--color-status-warning)", border: "1px solid color-mix(in srgb, var(--color-status-warning) 28%, transparent)" };
};

function CardSkeleton() {
  return (
    <div className="rounded-2xl border p-5 animate-pulse" style={{ background: "var(--card-bg)", borderColor: "color-mix(in srgb, var(--border) 60%, transparent)" }}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="h-4 w-52 rounded-full" style={{ background: "color-mix(in srgb, var(--border) 80%, transparent)" }} />
        <div className="h-6 w-24 rounded-full" style={{ background: "color-mix(in srgb, var(--border) 70%, transparent)" }} />
      </div>
      <div className="h-3.5 w-36 rounded-full mb-3" style={{ background: "color-mix(in srgb, var(--border) 55%, transparent)" }} />
      <div className="flex gap-4">
        <div className="h-3 w-24 rounded-full" style={{ background: "color-mix(in srgb, var(--border) 45%, transparent)" }} />
        <div className="h-3 w-20 rounded-full" style={{ background: "color-mix(in srgb, var(--border) 45%, transparent)" }} />
      </div>
    </div>
  );
}

export default function MyProposals() {
  const { user } = useAuth();
  const { tx } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProposalTab>("all");

  const { data: allData, isLoading, error } = useQuery({
    queryKey: ["my-proposals-v6", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // ── SAFE query: only columns that definitely exist in the schema ──
      const { data: rows, error: rowsError } = await supabase
        .from("proposals")
        .select("id, job_id, bid_amount, created_at, status")
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (rowsError) throw rowsError;
      if (!rows || rows.length === 0) return [];

      // Hydrate job titles in parallel
      const jobIds = [...new Set(rows.map((r: ProposalRow) => r.job_id).filter(Boolean))] as string[];
      const jobsById = new Map<string, { id: string; title: string | null; category: string | null }>();

      if (jobIds.length > 0) {
        const { data: jobData } = await supabase
          .from("jobs")
          .select("id, title, category")
          .in("id", jobIds);
        (jobData ?? []).forEach((j: { id: string; title: string | null; category: string | null }) => jobsById.set(j.id, j));
      }

      return rows.map((row: ProposalRow) => ({
        ...row,
        jobs: row.job_id ? (jobsById.get(row.job_id) ?? null) : null,
      })) as ProposalRow[];
    },
    enabled: !!user?.id,
    staleTime: 20_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const proposals = !allData ? []
    : activeTab === "all" ? allData
    : allData.filter(p => TAB_STATUS_MAP[activeTab].includes(String(p.status || "").toLowerCase()));

  const stats = {
    sent: allData?.length ?? 0,
    pending: allData?.filter(p => TAB_STATUS_MAP.pending.includes(String(p.status || "").toLowerCase())).length ?? 0,
    accepted: allData?.filter(p => TAB_STATUS_MAP.accepted.includes(String(p.status || "").toLowerCase())).length ?? 0,
    rejected: allData?.filter(p => TAB_STATUS_MAP.rejected.includes(String(p.status || "").toLowerCase())).length ?? 0,
  };

  const formatTimeAgo = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
    if (mins < 2) return tx("pages.myProposals.justNow", undefined, "Just now");
    if (mins < 60) return tx("pages.myProposals.minsAgo", { mins }, `${mins}m ago`);
    const hours = Math.floor(mins / 60);
    if (hours < 24) return tx("pages.myProposals.hoursAgo", { hours }, `${hours}h ago`);
    const days = Math.floor(hours / 24);
    if (days === 1) return tx("pages.myProposals.oneDayAgo", undefined, "1 day ago");
    return tx("pages.myProposals.daysAgo", { days }, `${days} days ago`);
  };

  const tabLabel = (tab: ProposalTab) => {
    if (tab === "all") return tx("pages.myProposals.all", undefined, "All");
    if (tab === "pending") return tx("pages.myProposals.pending", undefined, "Pending");
    if (tab === "accepted") return tx("pages.myProposals.accepted", undefined, "Accepted");
    return tx("pages.myProposals.rejected", undefined, "Declined");
  };

  const TABS: ProposalTab[] = ["all", "pending", "accepted", "rejected"];

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--page-bg)" }}>
      <Header />

      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-5">

        {/* ── Page Header ── */}
        <div className="mb-5">
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            {tx("pages.myProposals.title", undefined, "My Proposals")}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {tx("pages.myProposals.subtitle", undefined, "Track every proposal you've sent")}
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: tx("pages.myProposals.sent", undefined, "Sent"), value: stats.sent, icon: Send, color: "var(--workspace-primary-mid)", bg: "color-mix(in srgb, var(--workspace-primary) 12%, transparent)" },
            { label: tx("pages.myProposals.pending", undefined, "Pending"), value: stats.pending, icon: Clock, color: "var(--color-status-warning)", bg: "color-mix(in srgb, var(--color-status-warning) 12%, transparent)" },
            { label: tx("pages.myProposals.accepted", undefined, "Accepted"), value: stats.accepted, icon: CheckCircle2, color: "var(--color-status-success)", bg: "color-mix(in srgb, var(--color-status-success) 12%, transparent)" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="rounded-xl border px-4 py-3 flex items-center gap-3"
              style={{ background: "var(--card-bg)", borderColor: "color-mix(in srgb, var(--border) 70%, transparent)" }}
            >
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold leading-none" style={{ color: isLoading ? "var(--text-muted)" : color }}>
                  {isLoading ? "—" : value}
                </p>
                <p className="text-[11px] mt-0.5 font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── DB Error Debug Banner ── */}
        {error && (
          <div className="rounded-xl border px-4 py-3 mb-5 flex items-start gap-3"
            style={{ background: "color-mix(in srgb, var(--color-status-error) 8%, transparent)", borderColor: "color-mix(in srgb, var(--color-status-error) 25%, transparent)" }}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--color-status-error)" }} />
            <p className="text-xs font-mono" style={{ color: "var(--color-status-error)" }}>
              {String((error as Error).message || error)}
            </p>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex rounded-xl border p-1 mb-4 gap-1"
          style={{ background: "var(--card-bg)", borderColor: "color-mix(in srgb, var(--border) 70%, transparent)" }}>
          {TABS.map(tab => {
            const active = activeTab === tab;
            const count = tab === "all" ? stats.sent : tab === "pending" ? stats.pending : tab === "accepted" ? stats.accepted : stats.rejected;
            return (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all"
                style={{
                  background: active ? "var(--workspace-primary)" : "transparent",
                  color: active ? "#fff" : "var(--text-secondary)",
                  boxShadow: active ? "0 2px 12px -2px color-mix(in srgb, var(--workspace-primary) 50%, transparent)" : "none",
                }}>
                {tabLabel(tab)}
                {!isLoading && count > 0 && (
                  <span className="rounded-full px-2 text-xs font-bold min-w-[20px] text-center leading-[20px]"
                    style={{ background: active ? "rgba(255,255,255,0.22)" : "color-mix(in srgb, var(--workspace-primary) 12%, transparent)", color: active ? "#fff" : "var(--workspace-primary-mid)" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : proposals.length === 0 ? (
          <div className="rounded-2xl border flex flex-col items-center text-center py-14 px-8"
            style={{ background: "var(--card-bg)", borderColor: "color-mix(in srgb, var(--border) 70%, transparent)" }}>
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "color-mix(in srgb, var(--workspace-primary) 12%, transparent)" }}>
              <FileText className="w-7 h-7" style={{ color: "var(--workspace-primary-mid)" }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              {activeTab === "all"
                ? tx("pages.myProposals.emptyTitle", undefined, "You haven't applied to any jobs yet")
                : tx("pages.myProposals.emptyTabTitle", { tab: tabLabel(activeTab) }, `No ${tabLabel(activeTab)} proposals`)}
            </h3>
            <p className="text-sm mb-6 max-w-sm" style={{ color: "var(--text-muted)" }}>
              {tx("pages.myProposals.emptyDescription", undefined, "Browse open projects and send your first proposal to start working.")}
            </p>
            <button type="button" onClick={() => navigate("/jobs")}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:brightness-110"
              style={{ background: "var(--workspace-primary)", color: "#fff", boxShadow: "0 4px 16px -4px color-mix(in srgb, var(--workspace-primary) 50%, transparent)" }}>
              <Briefcase className="w-4 h-4" />
              {tx("pages.myProposals.browseJobs", undefined, "Browse Jobs")}
            </button>
            {activeTab !== "all" && stats.sent > 0 && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-left max-w-sm"
                style={{ background: "color-mix(in srgb, var(--color-status-warning) 8%, transparent)", borderColor: "color-mix(in srgb, var(--color-status-warning) 25%, transparent)" }}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--color-status-warning)" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {tx("pages.myProposals.emptyTabHint", { tab: tabLabel(activeTab) }, `Try the All tab.`)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map(proposal => {
              const isAccepted = normalizeToTab(proposal.status) === "accepted";
              return (
                <div key={proposal.id}
                  className="group rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
                  style={{
                    background: "var(--card-bg)",
                    borderColor: isAccepted
                      ? "color-mix(in srgb, var(--color-status-success) 35%, transparent)"
                      : "color-mix(in srgb, var(--border) 70%, transparent)",
                  }}
                  onClick={() => proposal.job_id && navigate(`/jobs/${proposal.job_id}`)}
                  role="button" tabIndex={0}
                  onKeyDown={e => { if (e.key === "Enter" && proposal.job_id) navigate(`/jobs/${proposal.job_id}`); }}>

                  {/* Accent bar */}
                  <div className="h-1 w-full" style={{
                    background: isAccepted ? "var(--color-status-success)"
                      : normalizeToTab(proposal.status) === "rejected" ? "var(--color-status-error)"
                      : "var(--workspace-primary)",
                  }} />

                  <div className="px-5 py-4">
                    {/* Title + badge */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base leading-tight truncate" style={{ color: "var(--text-primary)" }}>
                          {proposal.jobs?.title ?? tx("pages.myProposals.unknownProject", undefined, "Unknown Project")}
                        </h3>
                        {proposal.jobs?.category && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{proposal.jobs.category}</p>
                        )}
                      </div>
                      <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold shrink-0" style={pillStyle(proposal.status)}>
                        <StatusDot status={proposal.status} />
                        {getStatusLabel(proposal.status, tx)}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: "var(--workspace-primary-mid)" }}>
                        <TrendingUp className="w-4 h-4" />
                        {tx("pages.myProposals.yourBid", { amount: proposal.bid_amount }, `Bid: ${proposal.bid_amount} TND`)}
                      </span>
                      <span className="text-xs ms-auto" style={{ color: "var(--text-muted)" }}>
                        {formatTimeAgo(proposal.created_at)}
                      </span>
                    </div>

                    {/* Accepted CTA */}
                    {isAccepted && (
                      <div className="flex items-center justify-between rounded-xl border px-4 py-3 mt-3"
                        style={{ background: "color-mix(in srgb, var(--color-status-success) 6%, transparent)", borderColor: "color-mix(in srgb, var(--color-status-success) 22%, transparent)" }}>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-status-success)" }}>
                          🎉 {tx("pages.myProposals.proposalAccepted", undefined, "Your proposal was accepted!")}
                        </p>
                        <button type="button"
                          onClick={e => { e.stopPropagation(); navigate("/contracts"); }}
                          className="flex items-center gap-1 text-sm font-bold hover:opacity-80"
                          style={{ color: "var(--color-status-success)" }}>
                          {tx("pages.myProposals.viewContract", undefined, "View Contract")}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hover indicator */}
                  <div className="flex items-center justify-end px-5 pb-3 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--workspace-primary-mid)" }}>
                      {tx("pages.myProposals.viewJob", undefined, "View Job")}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
