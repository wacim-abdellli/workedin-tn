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
import SEO from "@/components/common/SEO";

type ProposalTab = "all" | "pending" | "accepted" | "rejected";

type ProposalRow = {
  id: string;
  job_id?: string | null;
  bid_amount: number;
  created_at: string;
  status: string;
  jobs?: { id?: string | null; title?: string | null; category?: string | null } | null;
  linked_contract?: {
    id: string;
    title: string | null;
    status: string | null;
    client_id?: string | null;
    freelancer_id?: string | null;
  } | null;
};

type ContractLinkRow = {
  id: string;
  proposal_id: string | null;
  job_id: string | null;
  title: string | null;
  status: string | null;
  client_id: string | null;
  freelancer_id: string | null;
};

const TAB_STATUS_MAP: Record<ProposalTab, string[]> = {
  all: [],
  pending: ["pending", "new", "shortlisted"],
  accepted: ["accepted", "hired"],
  rejected: ["rejected", "declined", "archived", "withdrawn"],
};

const normalizeToTab = (status: string): ProposalTab => {
  const s = String(status || "").toLowerCase();
  if (TAB_STATUS_MAP.accepted.includes(s)) return "accepted";
  if (TAB_STATUS_MAP.rejected.includes(s)) return "rejected";
  return "pending";
};

type Tx = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

const buildContractThreadPath = (contractId: string, otherUserId?: string | null) => {
  const encodedContractId = encodeURIComponent(contractId);
  const _encodedOtherUserId = otherUserId ? encodeURIComponent(otherUserId) : null;
  return `/workspace/${encodedContractId}`;
};

const getStatusLabel = (status: string, tx: Tx) => {
  if (normalizeToTab(status) === "accepted") return tx("pages.myProposals.accepted", undefined, "Accepted");
  if (normalizeToTab(status) === "rejected") return tx("pages.myProposals.rejected", undefined, "Declined");
  return tx("pages.myProposals.pending", undefined, "Pending");
};

const StatusDot = ({ status }: { status: string }) => {
  const tab = normalizeToTab(status);
  if (tab === "accepted") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (tab === "rejected") return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
  return <Circle className="w-3.5 h-3.5 text-amber-400" />;
};

const pillStyle = (status: string) => {
  const tab = normalizeToTab(status);
  if (tab === "accepted") return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  if (tab === "rejected") return "bg-rose-500/10 text-rose-300 border-rose-500/20";
  return "bg-amber-500/10 text-amber-300 border-amber-500/20";
};

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] p-5 animate-pulse">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="h-4 w-52 rounded-full bg-[var(--color-bg-muted)]" />
        <div className="h-6 w-24 rounded-full bg-white/10" />
      </div>
      <div className="h-3.5 w-36 rounded-full mb-3 bg-white/5" />
      <div className="flex gap-4">
        <div className="h-3 w-24 rounded-full bg-white/5" />
        <div className="h-3 w-20 rounded-full bg-white/5" />
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

      const { data: rows, error: rowsError } = await supabase
        .from("proposals")
        .select("id, job_id, bid_amount, created_at, status")
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (rowsError) throw rowsError;
      if (!rows || rows.length === 0) return [];

      const jobIds = [...new Set(rows.map((r: ProposalRow) => r.job_id).filter(Boolean))] as string[];
      const jobsById = new Map<string, { id: string; title: string | null; category: string | null }>();
      const contractsByProposalId = new Map<string, ContractLinkRow>();
      const contractsByJobId = new Map<string, ContractLinkRow>();

      if (jobIds.length > 0) {
        const { data: jobData } = await supabase
          .from("jobs")
          .select("id, title, category")
          .in("id", jobIds);
        (jobData ?? []).forEach((j: { id: string; title: string | null; category: string | null }) => jobsById.set(j.id, j));
      }

      const { data: contractsData } = await supabase
        .from("contracts")
        .select("*")
        .eq("freelancer_id", user.id);

      (contractsData ?? []).forEach((contract) => {
        const row = {
          id: String((contract as Record<string, unknown>).id ?? ''),
          proposal_id: typeof (contract as Record<string, unknown>).proposal_id === 'string'
            ? ((contract as Record<string, unknown>).proposal_id as string)
            : null,
          job_id: typeof (contract as Record<string, unknown>).job_id === 'string'
            ? ((contract as Record<string, unknown>).job_id as string)
            : null,
          title: typeof (contract as Record<string, unknown>).title === 'string'
            ? ((contract as Record<string, unknown>).title as string)
            : null,
          status: typeof (contract as Record<string, unknown>).status === 'string'
            ? ((contract as Record<string, unknown>).status as string)
            : null,
          client_id: typeof (contract as Record<string, unknown>).client_id === 'string'
            ? ((contract as Record<string, unknown>).client_id as string)
            : null,
          freelancer_id: typeof (contract as Record<string, unknown>).freelancer_id === 'string'
            ? ((contract as Record<string, unknown>).freelancer_id as string)
            : null,
        } as ContractLinkRow;

        if (!row.id) return;

        if (row.proposal_id) {
          contractsByProposalId.set(row.proposal_id, row);
        }
        if (row.job_id) {
          contractsByJobId.set(row.job_id, row);
        }
      });

      return rows.map((row: ProposalRow) => ({
        ...row,
        jobs: row.job_id ? (jobsById.get(row.job_id) ?? null) : null,
        linked_contract:
          contractsByProposalId.get(row.id)
          ?? (row.job_id ? contractsByJobId.get(row.job_id) : null)
          ?? null,
      })) as ProposalRow[];
    },
    enabled: !!user?.id,
    staleTime: 0,
    retry: 1,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const sanitizedData = (allData ?? []).filter((proposal) => (
    Boolean(proposal.jobs?.id) || Boolean(proposal.linked_contract?.id)
  ));

  const hiddenOrphanCount = Math.max(0, (allData?.length ?? 0) - sanitizedData.length);

  const proposals = activeTab === "all"
    ? sanitizedData
    : sanitizedData.filter((proposal) => TAB_STATUS_MAP[activeTab].includes(String(proposal.status || "").toLowerCase()));

  const stats = {
    sent: sanitizedData.length,
    pending: sanitizedData.filter((proposal) => TAB_STATUS_MAP.pending.includes(String(proposal.status || "").toLowerCase())).length,
    accepted: sanitizedData.filter((proposal) => TAB_STATUS_MAP.accepted.includes(String(proposal.status || "").toLowerCase())).length,
    rejected: sanitizedData.filter((proposal) => TAB_STATUS_MAP.rejected.includes(String(proposal.status || "").toLowerCase())).length,
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

  const openAcceptedProposalContract = async (proposal: ProposalRow) => {
    const linkedContractId = proposal.linked_contract?.id ?? null;
    const linkedOtherUserId = proposal.linked_contract?.client_id ?? null;

    if (linkedContractId) {
      navigate(buildContractThreadPath(linkedContractId, linkedOtherUserId));
      return;
    }

    if (!user?.id) {
      navigate('/contracts');
      return;
    }

    let contractQuery = supabase
      .from('contracts')
      .select('id, client_id, proposal_id, job_id, created_at')
      .eq('freelancer_id', user.id);

    if (proposal.job_id) {
      contractQuery = contractQuery.or(`proposal_id.eq.${proposal.id},job_id.eq.${proposal.job_id}`);
    } else {
      contractQuery = contractQuery.eq('proposal_id', proposal.id);
    }

    const { data: resolvedContracts } = await contractQuery
      .order('created_at', { ascending: false })
      .limit(1);

    const resolvedContract = Array.isArray(resolvedContracts) ? resolvedContracts[0] : null;

    if (resolvedContract?.id) {
      navigate(buildContractThreadPath(resolvedContract.id, resolvedContract.client_id ?? null));
      return;
    }

    navigate('/contracts');
  };

  const tabLabel = (tab: ProposalTab) => {
    if (tab === "all") return tx("pages.myProposals.all", undefined, "All");
    if (tab === "pending") return tx("pages.myProposals.pending", undefined, "Pending");
    if (tab === "accepted") return tx("pages.myProposals.accepted", undefined, "Accepted");
    return tx("pages.myProposals.rejected", undefined, "Declined");
  };

  const TABS: ProposalTab[] = ["all", "pending", "accepted", "rejected"];
  return (
    <div className="min-h-screen page-bg-base">
      <SEO 
        title={tx("pages.myProposals.title", undefined, "My Proposals")} 
        description={tx("pages.myProposals.subtitle", undefined, "Track every proposal you've sent")}
        url="/my-proposals" 
      />
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Page Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {tx("pages.myProposals.title", undefined, "My Proposals")}
          </h1>
          <p className="text-sm text-white/50 mt-1">
            {tx("pages.myProposals.subtitle", undefined, "Track every proposal you've sent")}
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: tx("pages.myProposals.sent", undefined, "Sent"), value: stats.sent, icon: Send, text: "text-violet-400", bg: "bg-violet-500/10" },
            { label: tx("pages.myProposals.pending", undefined, "Pending"), value: stats.pending, icon: Clock, text: "text-amber-400", bg: "bg-amber-500/10" },
            { label: tx("pages.myProposals.accepted", undefined, "Accepted"), value: stats.accepted, icon: CheckCircle2, text: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map(({ label, value, icon: Icon, text, bg }) => (
            <div
              key={label}
              className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-5 py-4 flex items-center gap-4"
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <div>
                <p className={`text-2xl font-black leading-none ${isLoading ? "text-white/20" : "text-white"}`}>
                  {isLoading ? "—" : value}
                </p>
                <p className="text-xs mt-1 font-semibold text-white/50 uppercase tracking-wider">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── DB Error Debug Banner ── */}
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 mb-6 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
            <p className="text-xs font-mono text-rose-300">
              {String((error as Error).message || error)}
            </p>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex overflow-x-auto scrollbar-hide mb-6 border-b border-white/5">
          {TABS.map(tab => {
            const active = activeTab === tab;
            const count = tab === "all" ? stats.sent : tab === "pending" ? stats.pending : tab === "accepted" ? stats.accepted : stats.rejected;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold transition-all shrink-0 ${active ? "text-violet-400" : "text-white/40 hover:text-white/70"}`}
              >
                {tabLabel(tab)}
                {!isLoading && count > 0 && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-black ${active ? "bg-violet-500/20 text-violet-300" : "bg-white/5 text-white/40"}`}>
                    {count}
                  </span>
                )}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-t-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
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
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] flex flex-col items-center text-center py-16 px-8">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5 bg-violet-500/10">
              <FileText className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {activeTab === "all"
                ? tx("pages.myProposals.emptyTitle", undefined, "You haven't applied to any jobs yet")
                : tx("pages.myProposals.emptyTabTitle", { tab: tabLabel(activeTab) }, `No ${tabLabel(activeTab)} proposals`)}
            </h3>
            <p className="text-sm text-white/40 mb-6 max-w-sm">
              {tx("pages.myProposals.emptyDescription", undefined, "Browse open projects and send your first proposal to start working.")}
            </p>
            <button
              type="button"
              onClick={() => navigate("/jobs")}
              className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-sm font-bold text-white transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              {tx("pages.myProposals.browseJobs", undefined, "Browse Jobs")}
            </button>
            {activeTab !== "all" && stats.sent > 0 && (
              <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-left max-w-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                <p className="text-xs text-amber-200/60">
                  {tx("pages.myProposals.emptyTabHint", { tab: tabLabel(activeTab) }, `Try the All tab.`)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map(proposal => {
              const isAccepted = normalizeToTab(proposal.status) === "accepted";
              const contractId = proposal.linked_contract?.id ?? null;
              const contractOtherUserId = proposal.linked_contract?.client_id || null;
              const hasLiveJob = Boolean(proposal.jobs?.id);
              const targetPath = contractId
                ? buildContractThreadPath(contractId, contractOtherUserId)
                : !isAccepted && hasLiveJob
                  ? `/jobs/${proposal.jobs?.id}`
                  : null;

              const title = proposal.jobs?.title
                ?? proposal.linked_contract?.title
                ?? tx("pages.myProposals.archivedProject", undefined, "Archived Project");

              const cardActionLabel = contractId
                ? tx("pages.myProposals.viewContract", undefined, "Workspace")
                : tx("pages.myProposals.viewJob", undefined, "View Job");

              return (
                <div
                  key={proposal.id}
                  className="group relative rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] overflow-hidden transition-all hover:bg-[var(--color-bg-muted)]"
                  onClick={() => {
                    if (isAccepted && !contractId) {
                      void openAcceptedProposalContract(proposal);
                      return;
                    }
                    if (targetPath) navigate(targetPath);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key !== 'Enter') return;
                    if (isAccepted && !contractId) {
                      void openAcceptedProposalContract(proposal);
                      return;
                    }
                    if (targetPath) navigate(targetPath);
                  }}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isAccepted ? "bg-emerald-500" : normalizeToTab(proposal.status) === "rejected" ? "bg-rose-500" : "bg-violet-500"}`} />

                  <div className="pl-6 pr-5 py-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h3 className="font-bold text-white text-base truncate">
                          {title}
                        </h3>
                        <span className={`flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pillStyle(proposal.status)}`}>
                          <StatusDot status={proposal.status} />
                          {getStatusLabel(proposal.status, tx)}
                        </span>
                      </div>
                      
                      {proposal.jobs?.category && (
                        <p className="text-xs text-white/50 truncate mb-3">{proposal.jobs.category}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-violet-300">
                          <TrendingUp className="w-3.5 h-3.5 opacity-70" />
                          {tx("pages.myProposals.yourBid", { amount: proposal.bid_amount }, `Bid: ${proposal.bid_amount} TND`)}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-white/40 font-medium">
                          <Clock className="w-3.5 h-3.5 opacity-70" />
                          {formatTimeAgo(proposal.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Action Button & Accepted State */}
                    <div className="shrink-0 flex flex-col items-start md:items-end gap-3 mt-2 md:mt-0">
                      {isAccepted ? (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            if (contractId) {
                              navigate(buildContractThreadPath(contractId, contractOtherUserId));
                              return;
                            }
                            void openAcceptedProposalContract(proposal);
                          }}
                          className="flex items-center gap-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-400 transition-colors"
                        >
                          {tx("pages.myProposals.viewContract", undefined, "Workspace")}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/30 group-hover:text-violet-400 transition-colors">
                          {cardActionLabel}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {hiddenOrphanCount > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/60 mt-4 text-center">
                {tx(
                  "pages.myProposals.orphanedHiddenHint",
                  { count: hiddenOrphanCount },
                  `${hiddenOrphanCount} old proposal(s) were hidden because their jobs are no longer available.`,
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
