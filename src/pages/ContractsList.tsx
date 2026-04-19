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

function formatHiredDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRateLabel(contract: ContractRow): { typeLabel: string; amountLabel: string } {
  const jobType = contract.job?.job_type ?? "";

  if (jobType === "hourly") {
    const hourly = contract.job?.hourly_rate ?? contract.amount ?? contract.totalAmount;
    return {
      typeLabel: "Hourly",
      amountLabel: `${formatCurrency(hourly)} TND/hr`,
    };
  }

  const fixedAmount =
    contract.totalAmount ||
    contract.amount ||
    contract.job?.budget_max ||
    contract.job?.budget_min ||
    0;

  return {
    typeLabel: "Fixed-price",
    amountLabel: `${formatCurrency(fixedAmount)} TND`,
  };
}

function getStatusBadge(status: ContractStatus) {
  if (status === "completed") {
    return {
      className:
        "bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      labelKey: "contracts.status.completed",
      fallbackLabel: "Completed",
    };
  }

  if (status === "cancelled") {
    return {
      className:
        "bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
      icon: <XCircle className="w-3.5 h-3.5" />,
      labelKey: "contracts.status.cancelled",
      fallbackLabel: "Cancelled",
    };
  }

  return {
    className:
      "bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    labelKey: "contracts.status.active",
    fallbackLabel: "Active",
  };
}

export default function ContractsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tx } = useTranslation();
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-2 text-on-surface">{tx("contracts.title", undefined, "Contracts")}</h1>
        <p className="text-on-surface-muted mb-6">
          {tx(
            "contracts.subtitle",
            undefined,
            "Manage your active contracts, past work, and client communications.",
          )}
        </p>

        <section className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4 flex gap-4 items-start mb-8">
          <AlertShield className="text-purple-400 shrink-0 mt-0.5 w-5 h-5" />
          <div>
            <p className="text-sm font-bold text-purple-600 dark:text-purple-300">
              {tx("contracts.paymentProtectionTitle", undefined, "Payment Protection")}
            </p>
            <p className="text-sm text-purple-700/80 dark:text-purple-200/70 mt-1">
              Always communicate and request payments through WorkedIn. Contracts paid outside
              the platform are not protected by our secure escrow system.
            </p>
          </div>
        </section>

        <nav className="flex items-center gap-6 border-b border-surface mb-8 pb-px">
          {tabConfig.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? "pb-4 border-b-2 border-purple-500 text-purple-600 dark:text-purple-400 font-semibold text-sm transition-all"
                  : "pb-4 border-b-2 border-transparent text-on-surface-muted hover:text-on-surface font-medium text-sm transition-all cursor-pointer"
              }
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>

        <section className="surface-card border rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface flex gap-4 surface-sunken">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-on-surface-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={tx("contracts.searchPlaceholder", undefined, "Search contracts or users...")}
                className="w-full rounded-xl text-sm pl-9 pr-4 py-2.5 outline-none"
              />
            </div>
          </div>

          {error ? (
            <div className="p-6 border-b border-surface bg-red-500/5">
              <p className="text-sm text-red-500">
                {tx("contracts.loadError", undefined, "Failed to load contracts.")}
              </p>
            </div>
          ) : null}

          {isLoading && !error ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="p-6 border border-surface rounded-xl surface-sunken animate-pulse"
                >
                  <div className="h-5 w-1/3 bg-[var(--color-bg-muted)] rounded mb-3" />
                  <div className="h-4 w-1/2 bg-[var(--color-bg-muted)] rounded mb-2" />
                  <div className="h-4 w-1/4 bg-[var(--color-bg-muted)] rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6">
                <AlertShield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">{tx("contracts.loadError", undefined, "Failed to load contracts.")}</h3>
              <p className="text-sm text-on-surface-muted max-w-md">
                {tx("common.tryAgain", undefined, "Try again in a moment.")}
              </p>
            </div>
          ) : filteredContracts.length > 0 ? (
            filteredContracts.map((contract) => {
              const partner = isFreelancerWorkspace ? contract.client : contract.freelancer;
              const partnerName = partner?.full_name || tx("contracts.unknownUser", undefined, "Unknown User");
              const badge = getStatusBadge(contract.status);
              const rate = getRateLabel(contract);

              return (
                <article
                  key={contract.id}
                  className="p-6 border-b border-surface last:border-b-0 hover-surface transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
                >
                  <div>
                    <h3 className="text-lg font-bold text-on-surface group-hover:text-purple-500 transition-colors line-clamp-1 mb-2">
                      {contract.job?.title || contract.title || tx("contracts.unknownProject", undefined, "Unknown Project")}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-on-surface-muted flex-wrap">
                      <span>
                        {rate.typeLabel}: <span className="text-on-surface">{rate.amountLabel}</span>
                      </span>
                      <span>
                        Started <span className="text-on-surface">{formatHiredDate(contract.createdAt)}</span>
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-subtle">
                      {partner?.avatar_url ? (
                        <img
                          src={partner.avatar_url}
                          alt={partnerName}
                          className="w-6 h-6 rounded-full object-cover border border-surface"
                        />
                      ) : (
                        <div className="w-6 h-6 surface-sunken border border-surface rounded-full" />
                      )}
                      <span>
                        {isFreelancerWorkspace
                          ? tx("contracts.role.client", undefined, "Client")
                          : tx("contracts.role.freelancer", undefined, "Freelancer")}
                        : {" "}
                        {partnerName}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-4 shrink-0">
                    <span className={badge.className}>
                      {badge.icon}
                      {tx(badge.labelKey, undefined, badge.fallbackLabel)}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(
                          `/messages?contract=${contract.id}${partner?.id ? `&with=${partner.id}` : ''}`,
                          { state: { contractId: contract.id, otherUserId: partner?.id || null } }
                        )}
                        className="border border-surface text-on-surface-muted hover:text-purple-500 hover:border-purple-500 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {tx("contracts.message", undefined, "Message")}
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/contracts/${contract.id}`, {
                          state: { otherUserId: partner?.id || null },
                        })}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                      >
                        <FileSignature className="w-4 h-4" />
                        {tx("contracts.viewContract", undefined, "View Contract")}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : activeTab === "cancelled" ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-full surface-sunken border border-surface flex items-center justify-center text-on-surface-subtle mb-6">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">{tx("contracts.emptyCancelledTitle", undefined, "No cancelled contracts")}</h3>
              <p className="text-sm text-on-surface-muted max-w-md">
                {tx("contracts.emptyCancelledDescription", undefined, "You don't have any cancelled contracts.")}
              </p>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-full surface-sunken border border-surface flex items-center justify-center text-on-surface-subtle mb-6">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">{tx("contracts.emptyTitle", undefined, "No contracts found")}</h3>
              <p className="text-sm text-on-surface-muted max-w-md">
                {tx("contracts.emptyDescription", undefined, "Try another tab or adjust your search to find contracts faster.")}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
