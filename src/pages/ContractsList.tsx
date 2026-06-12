import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  MessageSquare,
  FileSignature,
  ShieldAlert as AlertShield,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";

import { Header } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useWorkspaceStore } from "@/lib/workspaceState";
import { useTranslation } from "@/i18n";

type ContractTab = "active" | "completed" | "cancelled";
type ContractStatus = "active" | "completed" | "cancelled";

type PartnerRecord = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type JobRecord = {
  id: string;
  title: string | null;
  job_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  hourly_rate: number | null;
};

type ContractRowRaw = {
  id: string;
  job_id?: string | null;
  title?: string | null;
  status: string | null;
  amount: number | null;
  total_amount?: number | null;
  created_at: string;
  client_id: string;
  freelancer_id: string;
  client: PartnerRecord | PartnerRecord[] | null;
  freelancer: PartnerRecord | PartnerRecord[] | null;
  job: JobRecord | JobRecord[] | null;
};

type ContractRow = {
  id: string;
  title: string | null;
  createdAt: string;
  status: ContractStatus;
  amount: number;
  totalAmount: number;
  client: PartnerRecord | null;
  freelancer: PartnerRecord | null;
  job: JobRecord | null;
};

function getErrorText(error: unknown): string {
  if (!error || typeof error !== "object") return "";

  const candidate = error as {
    message?: unknown;
    details?: unknown;
    hint?: unknown;
  };

  return [candidate.message, candidate.details, candidate.hint]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

function canRetryWithLegacySelect(error: unknown): boolean {
  const text = getErrorText(error);
  if (!text) return false;

  return (
    text.includes("column")
    || text.includes("does not exist")
    || text.includes("schema cache")
  );
}

function normalizeStatus(value: string | null): ContractStatus {
  const normalized = value?.toLowerCase() ?? "";

  if (normalized === "completed") {
    return "completed";
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "disputed"
  ) {
    return "cancelled";
  }

  return "active";
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-TN");
}

function formatHiredDate(value: string, language: string): string {
  const date = new Date(value);
  const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-TN' : 'en-US';
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRateLabel(
  contract: ContractRow,
  tx: (key: string, params?: Record<string, string | number>, fallback?: string) => string
): { typeLabel: string; amountLabel: string } {
  const jobType = contract.job?.job_type ?? "";

  if (jobType === "hourly") {
    const hourly = contract.job?.hourly_rate ?? contract.amount ?? contract.totalAmount;
    return {
      typeLabel: tx("contracts.rateType.hourly", undefined, "Hourly"),
      amountLabel: tx("contracts.rateType.hourlyLabel", { amount: formatCurrency(hourly) }, `${formatCurrency(hourly)} TND/hr`),
    };
  }

  const fixedAmount =
    contract.totalAmount ||
    contract.amount ||
    contract.job?.budget_max ||
    contract.job?.budget_min ||
    0;

  return {
    typeLabel: tx("contracts.rateType.fixed", undefined, "Fixed-price"),
    amountLabel: tx("contracts.rateType.fixedLabel", { amount: formatCurrency(fixedAmount) }, `${formatCurrency(fixedAmount)} TND`),
  };
}

function getStatusBadge(status: ContractStatus) {
  if (status === "completed") {
    return {
      className:
        "bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      labelKey: "contracts.status.completed",
      fallbackLabel: "Completed",
    };
  }

  if (status === "cancelled") {
    return {
      className:
        "bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider",
      icon: <XCircle className="w-3.5 h-3.5" />,
      labelKey: "contracts.status.cancelled",
      fallbackLabel: "Cancelled",
    };
  }

  return {
    className:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    labelKey: "contracts.status.active",
    fallbackLabel: "Active",
  };
}

export default function ContractsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tx, language } = useTranslation();
  const { activeWorkspace } = useWorkspaceStore();
  const isFreelancerWorkspace = activeWorkspace !== "client";

  const [activeTab, setActiveTab] = useState<ContractTab>("active");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ["contracts-list-v2", user?.id, isFreelancerWorkspace],
    queryFn: async () => {
      if (!user?.id) {
        return [] as ContractRow[];
      }

      const withWorkspaceScope = <T,>(query: T): T => {
        const typedQuery = query as {
          eq: (column: string, value: string) => unknown;
        };

        return (isFreelancerWorkspace
          ? typedQuery.eq("freelancer_id", user.id)
          : typedQuery.eq("client_id", user.id)) as T;
      };

      const primaryQuery = supabase
        .from("contracts")
        .select("id, job_id, title, status, amount, total_amount, created_at, client_id, freelancer_id")
        .order("created_at", { ascending: false });

      const scopedPrimaryQuery = withWorkspaceScope(primaryQuery);

      const primaryResult = await scopedPrimaryQuery;

      let baseRows = (primaryResult.data ?? []) as ContractRowRaw[];
      let baseError = primaryResult.error;

      if (baseError && baseError.code !== "PGRST116" && canRetryWithLegacySelect(baseError)) {
        const legacyQuery = supabase
          .from("contracts")
          .select("id, job_id, status, amount, created_at, client_id, freelancer_id")
          .order("created_at", { ascending: false });

        const scopedLegacyQuery = withWorkspaceScope(legacyQuery);

        const legacyResult = await scopedLegacyQuery;
        baseRows = (legacyResult.data ?? []) as ContractRowRaw[];
        baseError = legacyResult.error;
      }

      if (baseError && baseError.code !== "PGRST116" && canRetryWithLegacySelect(baseError)) {
        const minimalQuery = supabase
          .from("contracts")
          .select("id, status, amount, created_at, client_id, freelancer_id")
          .order("created_at", { ascending: false });

        const scopedMinimalQuery = withWorkspaceScope(minimalQuery);
        const minimalResult = await scopedMinimalQuery;
        baseRows = (minimalResult.data ?? []) as ContractRowRaw[];
        baseError = minimalResult.error;
      }

      if (baseError && baseError.code !== "PGRST116") {
        console.warn("[ContractsList] contracts query failed", baseError);
        return [] as ContractRow[];
      }

      if (baseRows.length === 0) {
        return [] as ContractRow[];
      }

      const jobIds = [...new Set(baseRows.map((row) => row.job_id).filter(Boolean))] as string[];
      const partnerIds = [...new Set(baseRows.flatMap((row) => [row.client_id, row.freelancer_id]).filter(Boolean))] as string[];

      const jobsById = new Map<string, JobRecord>();
      const profilesById = new Map<string, PartnerRecord>();

      if (jobIds.length > 0) {
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs")
          .select("id, title, job_type, budget_min, budget_max, hourly_rate")
          .in("id", jobIds);

        if (jobsError) {
          console.warn("[ContractsList] job hydration failed", jobsError);
        } else {
          (jobsData ?? []).forEach((job) => {
            const row = job as JobRecord;
            jobsById.set(row.id, row);
          });
        }
      }

      if (partnerIds.length > 0) {
        const { data: publicProfilesData, error: publicProfilesError } = await supabase
          .from("public_profiles")
          .select("id, full_name, avatar_url")
          .in("id", partnerIds);

        if (!publicProfilesError) {
          (publicProfilesData ?? []).forEach((profile) => {
            const row = profile as PartnerRecord;
            profilesById.set(row.id, row);
          });
        } else {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", partnerIds);

          if (profilesError) {
            console.warn("[ContractsList] profile hydration failed", profilesError);
          } else {
            (profilesData ?? []).forEach((profile) => {
              const row = profile as PartnerRecord;
              profilesById.set(row.id, row);
            });
          }
        }
      }

      return baseRows.map((raw) => {
        return {
          id: raw.id,
          title: raw.title,
          createdAt: raw.created_at,
          status: normalizeStatus(raw.status),
          amount: raw.amount ?? 0,
          totalAmount: raw.total_amount ?? raw.amount ?? 0,
          client: profilesById.get(raw.client_id) ?? null,
          freelancer: profilesById.get(raw.freelancer_id) ?? null,
          job: raw.job_id ? (jobsById.get(raw.job_id) ?? null) : null,
        } as ContractRow;
      });
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const counts = useMemo(() => {
    const summary = {
      active: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const contract of contracts) {
      summary[contract.status] += 1;
    }

    return summary;
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return contracts
      .filter((contract) => contract.status === activeTab)
      .filter((contract) => {
        if (!normalizedSearch) {
          return true;
        }

        const partner = isFreelancerWorkspace ? contract.client : contract.freelancer;
        const title = contract.job?.title?.toLowerCase() ?? "";
        const partnerName = partner?.full_name?.toLowerCase() ?? "";

        return title.includes(normalizedSearch) || partnerName.includes(normalizedSearch);
      });
  }, [activeTab, contracts, isFreelancerWorkspace, searchQuery]);

  const tabConfig = [
    {
      key: "active" as const,
      label: tx("contracts.tabs.active", undefined, "Active"),
      count: counts.active,
    },
    {
      key: "completed" as const,
      label: tx("contracts.tabs.completed", undefined, "Completed"),
      count: counts.completed,
    },
    {
      key: "cancelled" as const,
      label: tx("contracts.status.cancelled", undefined, "Cancelled"),
      count: counts.cancelled,
    },
  ];

  return (
    <div className="min-h-screen page-bg-base">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-black text-white tracking-tight mb-1">
          {tx("contracts.title", undefined, "Contracts")}
        </h1>
        <p className="text-sm text-white/50 mb-8">
          {tx(
            "contracts.subtitle",
            undefined,
            "Manage your active contracts, past work, and client communications.",
          )}
        </p>

        <section className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex gap-4 items-start mb-8">
          <AlertShield className="text-violet-400 shrink-0 mt-0.5 w-5 h-5" />
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {tx("contracts.paymentProtectionTitle", undefined, "Payment Protection")}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {tx(
                "contracts.paymentProtectionDesc",
                undefined,
                "Always communicate and request payments through WorkedIn. Contracts paid outside the platform are not protected by our secure escrow system."
              )}
            </p>
          </div>
        </section>

        <div className="flex overflow-x-auto scrollbar-hide mb-6 border-b border-white/5">
          {tabConfig.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold transition-all shrink-0 ${active ? "text-violet-400" : "text-white/40 hover:text-white/70"}`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-black ${active ? "bg-violet-500/20 text-violet-300" : "bg-white/5 text-white/40"}`}>
                    {tab.count}
                  </span>
                )}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-t-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                )}
              </button>
            );
          })}
        </div>

        <section className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 flex gap-4 bg-white/[0.01]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={tx("contracts.searchPlaceholder", undefined, "Search contracts or users...")}
                className="w-full bg-white/5 border border-white/5 text-white rounded-lg text-sm pl-9 pr-4 py-2.5 outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          {error ? (
            <div className="p-6 border-b border-white/5 bg-rose-500/5">
              <p className="text-sm text-rose-500">
                {tx("contracts.loadError", undefined, "Failed to load contracts.")}
              </p>
            </div>
          ) : null}

          {isLoading && !error ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="p-6 border border-white/5 rounded-xl bg-white/[0.02] animate-pulse"
                >
                  <div className="h-5 w-1/3 bg-white/10 rounded mb-3" />
                  <div className="h-4 w-1/2 bg-white/5 rounded mb-2" />
                  <div className="h-4 w-1/4 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
                <AlertShield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{tx("contracts.loadError", undefined, "Failed to load contracts.")}</h3>
              <p className="text-sm text-white/50 max-w-md">
                {tx("common.tryAgain", undefined, "Try again in a moment.")}
              </p>
            </div>
          ) : filteredContracts.length > 0 ? (
            <div className="flex flex-col">
              {filteredContracts.map((contract, index) => {
                const partner = isFreelancerWorkspace ? contract.client : contract.freelancer;
                const partnerName = partner?.full_name || tx("contracts.unknownUser", undefined, "Unknown User");
                const badge = getStatusBadge(contract.status);
                const rate = getRateLabel(contract, tx);

                return (
                  <article
                    key={contract.id}
                    className={`p-6 hover:bg-white/[0.02] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6 group ${index < filteredContracts.length - 1 ? "border-b border-white/5" : ""}`}
                  >
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-1 mb-2">
                        {contract.job?.title || contract.title || tx("contracts.unknownProject", undefined, "Unknown Project")}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-white/50 flex-wrap">
                        <span>
                          {rate.typeLabel}: <span className="text-white font-semibold">{rate.amountLabel}</span>
                        </span>
                        <span>
                          {tx("contracts.startedDate", undefined, "Started")}{" "}
                          <span className="text-white font-medium">{formatHiredDate(contract.createdAt, language)}</span>
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-2.5 text-xs text-white/60">
                        {partner?.avatar_url ? (
                          <img
                            src={partner.avatar_url}
                            alt={partnerName}
                            className="w-6 h-6 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                            <Briefcase className="w-3 h-3 text-white/30" />
                          </div>
                        )}
                        <span>
                          {isFreelancerWorkspace
                            ? tx("contracts.role.client", undefined, "Client")
                            : tx("contracts.role.freelancer", undefined, "Freelancer")}
                          : {" "}
                          <span className="font-semibold text-white/80">{partnerName}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-4 shrink-0">
                      <span className={badge.className}>
                        {badge.icon}
                        {tx(badge.labelKey, undefined, badge.fallbackLabel)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(
                            `/messages?contract=${contract.id}${partner?.id ? `&with=${partner.id}` : ''}`,
                            { state: { contractId: contract.id, otherUserId: partner?.id || null } }
                          )}
                          className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {tx("contracts.message", undefined, "Message")}
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/workspace/${contract.id}`)}
                          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                        >
                          <FileSignature className="w-4 h-4" />
                          {tx("contracts.viewContract", undefined, "Workspace")}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : activeTab === "cancelled" ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-6">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{tx("contracts.emptyCancelledTitle", undefined, "No cancelled contracts")}</h3>
              <p className="text-sm text-white/40 max-w-md">
                {tx("contracts.emptyCancelledDescription", undefined, "You don't have any cancelled contracts.")}
              </p>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-6">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{tx("contracts.emptyTitle", undefined, "No contracts found")}</h3>
              <p className="text-sm text-white/40 max-w-md">
                {tx("contracts.emptyDescription", undefined, "Try another tab or adjust your search to find contracts faster.")}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

