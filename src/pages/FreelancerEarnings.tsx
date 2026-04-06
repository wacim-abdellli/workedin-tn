import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Header } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import EmptyState from "@/components/ui/EmptyState";
import SkeletonList from "@/components/common/SkeletonList";
import Button from "@/components/ui/Button";
import SEO from "@/components/common/SEO";

// Types
interface WalletRow {
  balance: number;
  pending_balance: number;
  total_earned: number;
}
interface TransactionRow {
  id: string;
  description: string | null;
  related_id: string | null;
  created_at: string;
  amount: number;
  type: string;
  status: string;
}

export default function FreelancerEarnings() {
  const { user } = useAuth();
  const { language, tx } = useTranslation();
  const navigate = useNavigate();

  const locale = useMemo(() => {
    if (language === "ar") return "ar-TN";
    if (language === "fr") return "fr-FR";
    return "en-US";
  }, [language]);

  // Wallet balance
  const { data: wallet } = useQuery<WalletRow>({
    queryKey: ["freelancer-wallet", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("balance,pending_balance,total_earned")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return (
        (data as WalletRow | null) || {
          balance: 0,
          pending_balance: 0,
          total_earned: 0,
        }
      );
    },
    enabled: !!user?.id,
  });

  // All transactions
  const { data: transactions = [], isLoading: isTxLoading } = useQuery<
    TransactionRow[]
  >({
    queryKey: ["freelancer-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id,description,related_id,created_at,amount,type,status")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error && error.code !== "PGRST116") throw error;
      return (data as TransactionRow[] | null) || [];
    },
    enabled: !!user?.id,
  });

  // Completed contracts count
  const { data: completedContracts = 0 } = useQuery<number>({
    queryKey: ["freelancer-completed-contracts", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .eq("freelancer_id", user!.id)
        .eq("status", "completed");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  // Derive this month earnings from transactions
  const thisMonth = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((t) => {
        const d = new Date(t.created_at);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear() &&
          t.amount > 0
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Last month earnings for trend
  const lastMonth = useMemo(() => {
    const now = new Date();
    const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return transactions
      .filter((t) => {
        const d = new Date(t.created_at);
        return (
          d.getMonth() === lastM.getMonth() &&
          d.getFullYear() === lastM.getFullYear() &&
          t.amount > 0
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Build chart data: last 6 months from real transactions
  const chartData = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: monthFormatter.format(d),
        amount: 0,
      };
    });
    transactions
      .filter((t) => t.amount > 0)
      .forEach((t) => {
        const d = new Date(t.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const found = months.find((m) => m.key === key);
        if (found) found.amount += t.amount;
      });
    return months.map(({ key: _k, ...m }) => m);
  }, [transactions, locale]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatAmount = (n: number) =>
    n.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const isTrendUp = thisMonth >= lastMonth;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-background-base)" }}
    >
      <SEO
        title={tx('pages.freelancerEarnings.seoTitle', undefined, 'Earnings | Khedma TN')}
        description={tx('pages.freelancerEarnings.seoDescription', undefined, 'Your earnings and payment history on Khedma TN.')}
        url="/freelancer/earnings"
        noIndex
      />
      <Header />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 pb-24 space-y-6">
        {/* Hero Balance Card */}
        <div
          className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--workspace-primary) 0%, var(--workspace-primary-hover) 100%)",
          }}
        >
          {/* Decorative blobs */}
          <div
            className="absolute -right-12 -top-12 w-40 h-40 rounded-full opacity-20"
            style={{ background: "rgba(255,255,255,0.3)" }}
          />
          <div
            className="absolute -left-6 -bottom-8 w-32 h-32 rounded-full opacity-10"
            style={{ background: "rgba(255,255,255,0.4)" }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest opacity-80 mb-1">
                {tx(
                  "pages.freelancerEarnings.availableBalance",
                  undefined,
                  "Available Balance",
                )}
              </p>
              <p className="text-4xl font-bold">
                {formatAmount(wallet?.balance ?? 0)}{" "}
                <span className="text-lg font-normal opacity-70">TND</span>
              </p>
              {(wallet?.pending_balance ?? 0) > 0 && (
                <p className="text-sm opacity-70 mt-1">
                  + {formatAmount(wallet!.pending_balance)} TND{" "}
                  {tx(
                    "pages.freelancerEarnings.pendingClearance",
                    undefined,
                    "pending clearance",
                  )}
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate("/wallet")}
              rightIcon={<ArrowUpRight className="w-4 h-4" />}
              className="shrink-0 !bg-white/20 hover:!bg-white/30 !text-white !border-white/30"
            >
              {tx("pages.freelancerEarnings.withdraw", undefined, "Withdraw")}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: tx(
                "pages.freelancerEarnings.totalEarned",
                undefined,
                "Total Earned",
              ),
              value: `${formatAmount(wallet?.total_earned ?? 0)} TND`,
              icon: Wallet,
            },
            {
              label: tx(
                "pages.freelancerEarnings.thisMonth",
                undefined,
                "This Month",
              ),
              value: `${formatAmount(thisMonth)} TND`,
              trend: isTrendUp,
              icon: isTrendUp ? TrendingUp : TrendingDown,
            },
            {
              label: tx(
                "pages.freelancerEarnings.completedContracts",
                undefined,
                "Completed Contracts",
              ),
              value: String(completedContracts),
              icon: CheckCircle,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-5 border flex items-start gap-4"
              style={{
                background: "var(--color-background-elevated)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background:
                    "var(--workspace-primary-dim, rgba(147,51,234,0.1))",
                  color: "var(--workspace-primary)",
                }}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {stat.label}
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Earnings Chart */}
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "var(--color-background-elevated)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {tx(
                "pages.freelancerEarnings.earningsOverview",
                undefined,
                "Earnings Overview",
              )}
            </h2>
            <div
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{
                color: isTrendUp
                  ? "var(--color-status-success)"
                  : "var(--color-status-error)",
              }}
            >
              {isTrendUp ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {isTrendUp
                ? tx(
                    "pages.freelancerEarnings.upVsLastMonth",
                    undefined,
                    "Up vs last month",
                  )
                : tx(
                    "pages.freelancerEarnings.downVsLastMonth",
                    undefined,
                    "Down vs last month",
                  )}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--workspace-primary)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--workspace-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-background-elevated)",
                    border: "1px solid var(--color-border-subtle)",
                    borderRadius: 10,
                    color: "var(--color-text-primary)",
                    fontSize: 12,
                  }}
                  cursor={{ stroke: "var(--color-border-default)" }}
                  formatter={(val) => [
                    `${formatAmount(Number(val ?? 0))} TND`,
                    tx(
                      "pages.freelancerEarnings.earnings",
                      undefined,
                      "Earnings",
                    ),
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--workspace-primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#earningsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h2
            className="text-base font-semibold mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            {tx(
              "pages.freelancerEarnings.paymentHistory",
              undefined,
              "Payment History",
            )}
          </h2>

          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "var(--color-background-elevated)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            {isTxLoading ? (
              <div className="p-5">
                <SkeletonList count={5} />
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title={tx(
                  "pages.freelancerEarnings.noEarningsTitle",
                  undefined,
                  "No transactions yet",
                )}
                description={tx(
                  "pages.freelancerEarnings.noEarningsDescription",
                  undefined,
                  "Complete your first project to see earnings here.",
                )}
                action={{
                  label: tx(
                    "pages.freelancerEarnings.browseJobs",
                    undefined,
                    "Browse Jobs",
                  ),
                  onClick: () => navigate("/jobs"),
                  variant: "primary",
                }}
              />
            ) : (
              <div>
                {transactions.map((tx_row, i) => (
                  <div
                    key={tx_row.id}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors"
                    style={{
                      borderTop:
                        i > 0
                          ? "1px solid var(--color-border-subtle)"
                          : undefined,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--color-background-subtle)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background:
                            tx_row.amount > 0
                              ? "rgba(16,185,129,0.1)"
                              : "var(--color-background-muted)",
                          color:
                            tx_row.amount > 0
                              ? "var(--color-status-success)"
                              : "var(--color-text-secondary)",
                        }}
                      >
                        {tx_row.amount > 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {tx_row.description ||
                            tx(
                              "pages.freelancerEarnings.contractPayment",
                              undefined,
                              "Contract payment",
                            )}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {formatDate(tx_row.created_at)}
                        </p>
                      </div>
                    </div>
                    <p
                      className="text-sm font-semibold shrink-0 ml-4"
                      style={{
                        color:
                          tx_row.amount > 0
                            ? "var(--color-status-success)"
                            : "var(--color-text-primary)",
                      }}
                    >
                      {tx_row.amount > 0 ? "+" : ""}
                      {formatAmount(tx_row.amount)} TND
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
