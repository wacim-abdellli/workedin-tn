import { useMemo, useState } from "react";
import {
  Briefcase,
  ShieldAlert as AlertShield,
  Search,
} from "lucide-react";

import { Header } from "@/components/layout";
import { useTranslation } from "@/i18n";
import { useContractsList } from "./useContractsList";
import ContractCard from "./ContractCard";
import type { ContractTab } from "./contractsListUtils";

export default function ContractsList() {
  const { tx, language } = useTranslation();
  const { contracts, isLoading, error, isFreelancerWorkspace } = useContractsList();

  const [activeTab, setActiveTab] = useState<ContractTab>("active");
  const [searchQuery, setSearchQuery] = useState("");

  const counts = useMemo(() => {
    const summary = { active: 0, completed: 0, cancelled: 0 };
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
        if (!normalizedSearch) return true;
        const partner = isFreelancerWorkspace ? contract.client : contract.freelancer;
        const title = contract.job?.title?.toLowerCase() ?? "";
        const partnerName = partner?.full_name?.toLowerCase() ?? "";
        return title.includes(normalizedSearch) || partnerName.includes(normalizedSearch);
      });
  }, [activeTab, contracts, isFreelancerWorkspace, searchQuery]);

  const tabConfig = [
    { key: "active" as const, label: tx("contracts.tabs.active", undefined, "Active"), count: counts.active },
    { key: "completed" as const, label: tx("contracts.tabs.completed", undefined, "Completed"), count: counts.completed },
    { key: "cancelled" as const, label: tx("contracts.status.cancelled", undefined, "Cancelled"), count: counts.cancelled },
  ];

  return (
    <div className="min-h-screen page-bg-base">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-black text-white tracking-tight mb-1">
          {tx("contracts.title", undefined, "Contracts")}
        </h1>
        <p className="text-sm text-white/50 mb-8">
          {tx("contracts.subtitle", undefined, "Manage your active contracts, past work, and client communications.")}
        </p>

        <section className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex gap-4 items-start mb-8">
          <AlertShield className="text-violet-400 shrink-0 mt-0.5 w-5 h-5" />
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {tx("contracts.paymentProtectionTitle", undefined, "Payment Protection")}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {tx("contracts.paymentProtectionDesc", undefined, "Always communicate and request payments through WorkedIn. Contracts paid outside the platform are not protected by our secure escrow system.")}
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
              <p className="text-sm text-rose-500">{tx("contracts.loadError", undefined, "Failed to load contracts.")}</p>
            </div>
          ) : null}

          {isLoading && !error ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-6 border border-white/5 rounded-xl bg-white/[0.02] animate-pulse">
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
              <p className="text-sm text-white/50 max-w-md">{tx("common.tryAgain", undefined, "Try again in a moment.")}</p>
            </div>
          ) : filteredContracts.length > 0 ? (
            <div className="flex flex-col">
              {filteredContracts.map((contract, index) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  isFreelancerWorkspace={isFreelancerWorkspace}
                  hasBorder={index < filteredContracts.length - 1}
                  tx={tx}
                  language={language}
                />
              ))}
            </div>
          ) : activeTab === "cancelled" ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-6">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{tx("contracts.emptyCancelledTitle", undefined, "No cancelled contracts")}</h3>
              <p className="text-sm text-white/40 max-w-md">{tx("contracts.emptyCancelledDescription", undefined, "You don't have any cancelled contracts.")}</p>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-6">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{tx("contracts.emptyTitle", undefined, "No contracts found")}</h3>
              <p className="text-sm text-white/40 max-w-md">{tx("contracts.emptyDescription", undefined, "Try another tab or adjust your search to find contracts faster.")}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

