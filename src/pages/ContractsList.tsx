import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { Header } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n";
import { supabase } from "@/lib/supabase";
import { useWorkspaceStore } from "@/lib/workspaceState";
import EmptyState from "@/components/ui/EmptyState";

type ContractTab = "all" | "active" | "completed" | "disputed";

type ContractRow = {
  id: string;
  amount: number;
  created_at: string;
  status: "active" | "completed" | "disputed" | string;
  jobs?: { title?: string | null } | null;
  freelancer?: { full_name?: string | null; avatar_url?: string | null } | null;
  client?: { full_name?: string | null; avatar_url?: string | null } | null;
  milestones?: Array<{ id: string; status: string }> | null;
};

// sessionStorage cache helpers
const CACHE_KEY = (userId: string, isFreelancer: boolean) => `contracts_${userId}_${isFreelancer ? 'fl' : 'cl'}`;
const readCache = (key: string): ContractRow[] | null => {
  try { const r = sessionStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
};
const writeCache = (key: string, data: ContractRow[]) => {
  try { sessionStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
};

export default function ContractsList() {
  const { user } = useAuth();
  const { language, tx } = useTranslation();
  const { activeWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContractTab>("all");

  const isFreelancer = activeWorkspace === "freelancer";
  const cacheKey = user?.id ? CACHE_KEY(user.id, isFreelancer) : null;

  // Fetch ALL contracts once — filter client-side per tab (no re-fetch on tab switch)
  const { data: allContracts, isLoading } = useQuery({
    queryKey: ["contracts", user?.id, isFreelancer],
    queryFn: async () => {
      let query = supabase.from("contracts").select(
        `*,
         jobs(title),
         freelancer:freelancer_id(full_name, avatar_url),
         client:client_id(full_name, avatar_url),
         milestones(id, status)`,
      );

      query = isFreelancer
        ? query.eq("freelancer_id", user?.id)
        : query.eq("client_id", user?.id);

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error && error.code !== "PGRST116") throw error;
      const result = (data || []) as ContractRow[];
      if (cacheKey) writeCache(cacheKey, result);
      return result;
    },
    enabled: !!user?.id,
    // Seed from sessionStorage so first render is instant
    initialData: () => (cacheKey ? readCache(cacheKey) ?? undefined : undefined),
    staleTime: 60_000,
  });

  // Filter client-side — zero network cost on tab switch
  const contracts = useMemo(() => {
    if (!allContracts) return [];
    if (activeTab === "all") return allContracts;
    return allContracts.filter((c) => c.status === activeTab);
  }, [allContracts, activeTab]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(
      language === "ar" ? "ar-TN" : language === "fr" ? "fr-FR" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );

  const tabLabel = (tab: ContractTab) => {
    if (tab === "all") return tx("contracts.tabs.all", undefined, "All");
    if (tab === "active")
      return tx("contracts.tabs.active", undefined, "Active");
    if (tab === "completed")
      return tx("contracts.tabs.completed", undefined, "Completed");
    return tx("contracts.tabs.disputed", undefined, "Disputed");
  };

  const statusLabel = (status: string) => {
    if (status === "active")
      return tx("contracts.status.active", undefined, "Active");
    if (status === "completed")
      return tx("contracts.status.completed", undefined, "Completed");
    if (status === "disputed")
      return tx("contracts.status.disputed", undefined, "Disputed");
    return status;
  };

  const activeCount =
    contracts?.filter((contract) => contract.status === "active").length || 0;

  return (
    <div className="page-shell">
      <Header />

      <div className="page-shell-content-narrow">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {tx("contracts.title", undefined, "Contracts")}
            </h1>
            {activeCount > 0 ? (
              <span
                className="rounded-full px-2 py-1 text-xs font-bold"
                style={{
                  background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)',
                  color: 'var(--workspace-primary)',
                }}
              >
                {tx('contracts.activeCount', { count: activeCount }, `${activeCount} Active`)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="tabs-row">
          {(["all", "active", "completed", "disputed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "tab-pill-active" : "tab-pill"}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        {isLoading && !allContracts ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-background-base)] p-5 animate-pulse">
                <div className="mb-3 flex justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-48 rounded-lg bg-[var(--color-background-subtle)]" />
                    <div className="h-4 w-20 rounded-full bg-[var(--color-background-subtle)]" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-5 w-24 rounded-lg bg-[var(--color-background-subtle)]" />
                    <div className="h-4 w-32 rounded-lg bg-[var(--color-background-subtle)]" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-5 rounded-full bg-[var(--color-background-subtle)]" />
                  <div className="h-4 w-32 rounded-lg bg-[var(--color-background-subtle)]" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--color-background-subtle)]" />
              </div>
            ))}
          </div>
        ) : !contracts || contracts.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={tx("contracts.empty.title", undefined, "No contracts yet")}
            description={
              isFreelancer
                ? tx(
                    "contracts.empty.freelancerDescription",
                    undefined,
                    "Send proposals to get your first contract.",
                  )
                : tx(
                    "contracts.empty.clientDescription",
                    undefined,
                    "Hire a freelancer to create your first contract.",
                  )
            }
            action={{
              label: isFreelancer
                ? tx("contracts.empty.freelancerCta", undefined, "Browse jobs")
                : tx("contracts.empty.clientCta", undefined, "Post a project"),
              onClick: () => navigate(isFreelancer ? "/jobs" : "/jobs/new"),
              variant: "primary",
            }}
          />
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => {
              const partner = isFreelancer
                ? contract.client
                : contract.freelancer;
              const roleLabel = isFreelancer
                ? tx("contracts.role.client", undefined, "Client")
                : tx("contracts.role.freelancer", undefined, "Freelancer");
              const progressIndicatorColor = 'var(--workspace-primary)';

              const totalMilestones = contract.milestones?.length ?? 0;
              const completedMilestones =
                contract.milestones?.filter(
                  (m) => m.status === "completed" || m.status === "approved",
                ).length ?? 0;
              const progressPercentage =
                totalMilestones > 0
                  ? Math.round((completedMilestones / totalMilestones) * 100)
                  : 0;

              return (
                <div
                  key={contract.id}
                  className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-background-base)] p-5 transition-colors hover:border-[var(--color-border-strong)]"
                >
                  <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="mb-1 text-lg font-semibold text-[var(--color-text-primary)]">
                        {contract.jobs?.title ||
                          tx(
                            "contracts.unknownProject",
                            undefined,
                            "Unknown Project",
                          )}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`whitespace-nowrap ${
                            contract.status === "active"
                              ? "status-pill-open"
                              : contract.status === "completed"
                                ? "status-pill-completed"
                                : "status-pill-cancelled"
                          }`}
                        >
                          {statusLabel(contract.status)}
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-[var(--color-text-primary)]">
                        {contract.amount} TND
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {tx(
                          "contracts.startedOn",
                          { date: formatDate(contract.created_at) },
                          `Started ${formatDate(contract.created_at)}`,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {roleLabel}:
                    </p>
                    <div className="flex items-center gap-1.5">
                      {partner?.avatar_url ? (
                        <img
                          src={partner.avatar_url}
                          alt={partner?.full_name || "User"}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-background-subtle)] text-[10px] font-bold text-[var(--color-text-secondary)]">
                          {partner?.full_name?.charAt(0) || "?"}
                        </div>
                      )}
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {partner?.full_name ||
                          tx(
                            "contracts.unknownUser",
                            undefined,
                            "Unknown User",
                          )}
                      </span>
                    </div>
                  </div>

                  {totalMilestones > 0 && (
                    <div className="mb-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          {tx(
                            "contracts.milestonesProgressCount",
                            {
                              completed: completedMilestones,
                              total: totalMilestones,
                            },
                            `${completedMilestones} of ${totalMilestones} milestones complete`,
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-background-subtle)]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${progressPercentage}%`, background: progressIndicatorColor }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end border-t border-[var(--color-border-default)] pt-4">
                    <button
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                      className="text-sm font-medium transition-colors"
                      style={{ color: 'var(--workspace-primary)' }}
                    >
                      {tx('contracts.openWorkspace', undefined, 'Open workspace ->')}
                    </button>
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
