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
  title: string | null;
  status: string | null;
  amount: number | null;
  total_amount: number | null;
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

function toSingle<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
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

      const query = supabase
        .from("contracts")
        .select(
          `id, title, status, amount, total_amount, created_at, client_id, freelancer_id,
           client:public_profiles!client_id(id, full_name, avatar_url),
           freelancer:public_profiles!freelancer_id(id, full_name, avatar_url),
           job:jobs(id, title, job_type, budget_min, budget_max, hourly_rate)`,
        )
        .order("created_at", { ascending: false });

      const scopedQuery = isFreelancerWorkspace
        ? query.eq("freelancer_id", user.id)
        : query.eq("client_id", user.id);

      const { data, error } = await scopedQuery;

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return (data ?? []).map((row) => {
        const raw = row as ContractRowRaw;
        return {
          id: raw.id,
          title: raw.title,
          createdAt: raw.created_at,
          status: normalizeStatus(raw.status),
          amount: raw.amount ?? 0,
          totalAmount: raw.total_amount ?? raw.amount ?? 0,
          client: toSingle(raw.client),
          freelancer: toSingle(raw.freelancer),
          job: toSingle(raw.job),
        } as ContractRow;
      });
    },
    enabled: !!user?.id,
    staleTime: 60_000,
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
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-2 text-white">{tx("contracts.title", undefined, "Contracts")}</h1>
        <p className="text-gray-400 mb-6">
          {tx(
            "contracts.subtitle",
            undefined,
            "Manage your active contracts, past work, and client communications.",
          )}
        </p>

        <section className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4 flex gap-4 items-start mb-8">
          <AlertShield className="text-purple-400 shrink-0 mt-0.5 w-5 h-5" />
          <div>
            <p className="text-sm font-bold text-purple-300">Payment Protection</p>
            <p className="text-sm text-purple-200/70 mt-1">
              Always communicate and request payments through WorkedIn. Contracts paid outside
              the platform are not protected by our secure escrow system.
            </p>
          </div>
        </section>

        <nav className="flex items-center gap-6 border-b border-[#262626] mb-8 pb-px">
          {tabConfig.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? "pb-4 border-b-2 border-purple-500 text-purple-400 font-semibold text-sm transition-all"
                  : "pb-4 border-b-2 border-transparent text-gray-400 hover:text-gray-200 font-medium text-sm transition-all cursor-pointer"
              }
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>

        <section className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#262626] flex gap-4 bg-[#0a0a0a]/30">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={tx("contracts.searchPlaceholder", undefined, "Search contracts or users...")}
                className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-purple-500 rounded-xl text-sm text-white placeholder:text-gray-500 pl-9 pr-4 py-2.5 outline-none"
              />
            </div>
          </div>

          {error ? (
            <div className="p-6 border-b border-[#262626]">
              <p className="text-sm text-red-300">{tx("contracts.loadError", undefined, "Failed to load contracts.")}</p>
            </div>
          ) : null}

          {isLoading && !error ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="p-6 border border-[#262626] rounded-xl bg-[#0a0a0a]/20 animate-pulse"
                >
                  <div className="h-5 w-1/3 bg-[#262626] rounded mb-3" />
                  <div className="h-4 w-1/2 bg-[#262626] rounded mb-2" />
                  <div className="h-4 w-1/4 bg-[#262626] rounded" />
                </div>
              ))}
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
                  className="p-6 border-b border-[#262626] last:border-b-0 hover:bg-[#262626]/20 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1 mb-2">
                      {contract.job?.title || contract.title || tx("contracts.unknownProject", undefined, "Unknown Project")}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                      <span>
                        {rate.typeLabel}: <span className="text-white">{rate.amountLabel}</span>
                      </span>
                      <span>
                        Started <span className="text-white">{formatHiredDate(contract.createdAt)}</span>
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      {partner?.avatar_url ? (
                        <img
                          src={partner.avatar_url}
                          alt={partnerName}
                          className="w-6 h-6 rounded-full object-cover border border-[#262626]"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-[#262626] rounded-full" />
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
                        onClick={() => navigate("/messages", { state: { contractId: contract.id } })}
                        className="border border-[#262626] text-gray-300 hover:text-purple-400 hover:border-purple-500 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {tx("contracts.message", undefined, "Message")}
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
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
              <div className="size-16 rounded-full bg-[#262626]/50 flex items-center justify-center text-gray-600 mb-6">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{tx("contracts.emptyCancelledTitle", undefined, "No cancelled contracts")}</h3>
              <p className="text-sm text-gray-400 max-w-md">
                {tx("contracts.emptyCancelledDescription", undefined, "You don't have any cancelled contracts.")}
              </p>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-full bg-[#262626]/50 flex items-center justify-center text-gray-600 mb-6">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{tx("contracts.emptyTitle", undefined, "No contracts found")}</h3>
              <p className="text-sm text-gray-400 max-w-md">
                {tx("contracts.emptyDescription", undefined, "Try another tab or adjust your search to find contracts faster.")}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
