import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Wallet as WalletIcon,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  Phone,
  X,
  Info,
  CheckCircle,
  Plus,
  AlertCircle,
  Loader2,
  ReceiptText,
  CreditCard,
  ChevronRight,
  BadgeCheck,
} from 'lucide-react';
import { Header } from '@/components/layout';
import SEO from '@/components/common/SEO';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceStore } from '@/lib/workspaceState';
import { initiatePayment } from '@/lib/flouci';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';
import { useToast } from '@/components/ui/Toast';
import { getWallet, getTransactions, getWithdrawals } from '@/services/payments';
import {
  formatCurrency,
  formatTransactionType,
  formatTransactionStatus,
  formatWithdrawalMethod,
  getStatusColor,
  isCreditTransaction,
  isDebitTransaction,
  validateWithdrawalAmount,
} from '@/lib/currencyUtils';
import { MIN_WITHDRAWAL_AMOUNT } from '@/types/payment';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import { PaymentMethodCard } from '@/components/payment/PaymentMethodCard';
import type {
  Transaction,
  TransactionsPage,
  Wallet as WalletType,
  Withdrawal,
  WithdrawalMethod,
  WithdrawalStatus,
} from '@/types/payment';

type WalletTab = 'overview' | 'withdraw' | 'deposit' | 'transactions';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string, language: string): string {
  const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Sub-component: Balance Hero ─────────────────────────────────────────────

function BalanceHero({
  wallet,
  activeTab,
  setActiveTab,
  isFreelancer,
  language,
  t,
  tx,
}: {
  wallet: WalletType | null | undefined;
  activeTab: WalletTab;
  setActiveTab: (tab: WalletTab) => void;
  isFreelancer: boolean;
  language: string;
  t: Record<string, any>;
  tx: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
}) {
  const tabs: { id: WalletTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: tx('wallet.tabs.overview', undefined, 'Overview'), icon: <WalletIcon className="w-4 h-4" /> },
    ...(isFreelancer
      ? [{ id: 'withdraw' as WalletTab, label: tx('wallet.tabs.withdraw', undefined, 'Withdraw'), icon: <ArrowUpRight className="w-4 h-4" /> }]
      : [{ id: 'deposit' as WalletTab, label: tx('wallet.tabs.deposit', undefined, 'Deposit'), icon: <Plus className="w-4 h-4" /> }]),
    { id: 'transactions', label: tx('wallet.tabs.transactions', undefined, 'Transactions'), icon: <ReceiptText className="w-4 h-4" /> },
  ];

  const accentColor = isFreelancer ? 'var(--color-purple-500, #a855f7)' : 'var(--workspace-primary)';

  return (
    <div
      className="mb-6 rounded-2xl overflow-hidden shadow-xl"
      style={{
        background: 'radial-gradient(130% 160% at 0% 0%, color-mix(in srgb, var(--workspace-primary) 18%, transparent) 0%, transparent 60%), var(--color-bg-elevated)',
        border: '1px solid color-mix(in srgb, var(--workspace-primary) 15%, var(--color-border-subtle))',
      }}
    >
      {/* Top section: balance + quick actions */}
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner"
                style={{ background: 'var(--workspace-primary-dim)', border: '1px solid color-mix(in srgb, var(--workspace-primary) 25%, transparent)' }}
              >
                <WalletIcon className="w-6 h-6" style={{ color: 'var(--workspace-primary)' }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
                  {t.wallet?.title || 'My Wallet'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl md:text-4xl font-black" style={{ color: 'var(--color-text-primary)' }}>
                    {formatCurrency(wallet?.balance ?? 0, true, language)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {t.wallet?.pendingBalance || 'Pending in Escrow'}:{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(wallet?.pending_balance ?? 0, true, language)}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {isFreelancer ? (
              <button
                onClick={() => setActiveTab('withdraw')}
                disabled={!wallet || wallet.balance < MIN_WITHDRAWAL_AMOUNT}
                className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                style={{ background: 'var(--workspace-primary)', color: '#fff' }}
              >
                <ArrowUpRight className="w-4 h-4" />
                {t.wallet?.requestWithdrawal || 'Withdraw'}
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('deposit')}
                className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
                style={{ background: 'var(--workspace-primary)', color: '#fff' }}
              >
                <Plus className="w-4 h-4" />
                {tx('wallet.deposit', undefined, 'Deposit Funds')}
              </button>
            )}
            <button
              onClick={() => setActiveTab('transactions')}
              className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm border"
              style={{
                background: 'var(--workspace-primary-dim)',
                borderColor: 'color-mix(in srgb, var(--workspace-primary) 30%, transparent)',
                color: 'var(--workspace-primary)',
              }}
            >
              <ReceiptText className="w-4 h-4" />
              {tx('wallet.tabs.transactions', undefined, 'Transactions')}
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-t" style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 10%, var(--color-border-subtle))' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all duration-150 flex-1 justify-center"
              style={{
                color: isActive ? 'var(--workspace-primary)' : 'var(--color-text-secondary)',
                background: isActive ? 'color-mix(in srgb, var(--workspace-primary) 6%, transparent)' : 'transparent',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ background: 'var(--workspace-primary)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sub-component: Stats Row ────────────────────────────────────────────────

function StatsRow({
  wallet,
  language,
  t,
}: {
  wallet: WalletType | null | undefined;
  language: string;
  t: Record<string, any>;
}) {
  const stats = [
    { icon: <TrendingUp className="w-5 h-5" />, label: t.wallet?.totalEarned || 'Total Earned', value: formatCurrency(wallet?.total_earned ?? 0, true, language), color: 'var(--color-text-primary)' },
    { icon: <ArrowUpRight className="w-5 h-5" />, label: t.wallet?.totalWithdrawn || 'Total Withdrawn', value: formatCurrency(wallet?.total_withdrawn ?? 0, true, language), color: 'var(--color-text-primary)' },
    { icon: <WalletIcon className="w-5 h-5" />, label: t.wallet?.balance || 'Available Balance', value: formatCurrency(wallet?.balance ?? 0, true, language), color: 'var(--color-status-success)' },
    { icon: <Clock className="w-5 h-5" />, label: t.wallet?.pendingBalance || 'Pending in Escrow', value: formatCurrency(wallet?.pending_balance ?? 0, true, language), color: 'var(--color-status-warning)' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s, i) => (
        <div key={i} className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            {s.icon}
            <span>{s.label}</span>
          </div>
          <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Sub-component: Transactions Panel ───────────────────────────────────────

function TransactionsPanel({
  transactions,
  withdrawals,
  transactionsLoading,
  withdrawalsLoading,
  totalPages,
  page,
  setPage,
  language,
  t,
}: {
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  transactionsLoading: boolean;
  withdrawalsLoading: boolean;
  totalPages: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  language: string;
  t: Record<string, any>;
}) {
  const withdrawalStatusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    approved: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    processing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    completed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  };

  return (
    <div className="space-y-8">
      {/* Transaction History */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <ReceiptText className="w-5 h-5" style={{ color: 'var(--workspace-primary)' }} />
          {t.wallet?.transactionHistory || 'Transaction History'}
        </h2>
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--card-bg)' }}>
          {transactionsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--workspace-primary)' }} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--color-bg-subtle)' }}>
                <WalletIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{t.wallet?.noTransactions || 'No transactions yet'}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.wallet?.noTransactionsDesc || 'Your transaction history will appear here'}</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="data-table">
                  <thead className="data-table-head">
                    <tr>
                      <th className="data-table-th text-start">{t.wallet?.date || 'Date'}</th>
                      <th className="data-table-th text-start">{t.wallet?.type || 'Type'}</th>
                      <th className="data-table-th text-start">{t.wallet?.description || 'Description'}</th>
                      <th className="data-table-th text-end">{t.wallet?.amount || 'Amount'}</th>
                      <th className="data-table-th text-center">{t.wallet?.statusLabel || 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: Transaction) => {
                      const isCredit = isCreditTransaction(tx.type);
                      const isDebit = isDebitTransaction(tx.type);
                      return (
                        <tr key={tx.id} className="data-table-row">
                          <td className="data-table-td whitespace-nowrap text-muted-foreground">{formatDate(tx.created_at, language)}</td>
                          <td className="data-table-td whitespace-nowrap">
                            <span className="status-pill bg-muted text-muted-foreground">{formatTransactionType(tx.type, language)}</span>
                          </td>
                          <td className="data-table-td text-foreground">{tx.description || t.wallet?.transactionLabel || 'Transaction'}</td>
                          <td className="data-table-td whitespace-nowrap text-end">
                            <span className="text-sm font-semibold" style={{ color: isCredit ? 'var(--color-status-success)' : isDebit ? 'var(--color-status-error)' : 'var(--color-text-primary)' }}>
                              {isCredit ? '+' : isDebit ? '-' : ''}{formatCurrency(tx.amount, true, language)}
                            </span>
                          </td>
                          <td className="data-table-td whitespace-nowrap text-center">
                            <span className={`status-pill ${getStatusColor(tx.status)}`}>{formatTransactionStatus(tx.status, language)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3 p-4">
                {transactions.map((tx: Transaction) => {
                  const isCredit = isCreditTransaction(tx.type);
                  const isDebit = isDebitTransaction(tx.type);
                  return (
                    <div key={tx.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="status-pill bg-muted text-muted-foreground text-xs">{formatTransactionType(tx.type, language)}</span>
                          <p className="text-sm text-muted-foreground mt-1">{formatDate(tx.created_at, language)}</p>
                        </div>
                        <span className={`text-base font-bold ${isCredit ? 'text-emerald-400' : isDebit ? 'text-rose-400' : 'text-foreground'}`}>
                          {isCredit ? '+' : isDebit ? '-' : ''}{formatCurrency(tx.amount, true, language)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{tx.description || t.wallet?.transactionLabel || 'Transaction'}</p>
                      <div className="flex items-center justify-between border-t border-border pt-2">
                        <span className="text-xs text-muted-foreground">{t.wallet?.statusLabel || 'Status'}</span>
                        <span className={`status-pill text-xs ${getStatusColor(tx.status)}`}>{formatTransactionStatus(tx.status, language)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-6 py-4" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed">
                    {t.wallet?.previous || 'Previous'}
                  </button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed">
                    {t.wallet?.next || 'Next'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Withdrawal History */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5" style={{ color: 'var(--workspace-primary)' }} />
          {t.wallet?.withdrawalHistory || 'Withdrawal History'}
        </h2>
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--card-bg)' }}>
          {withdrawalsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--workspace-primary)' }} />
            </div>
          ) : !withdrawals || withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--color-bg-subtle)' }}>
                <ArrowUpRight className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{t.wallet?.noWithdrawals || 'No withdrawals yet'}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.wallet?.noWithdrawalsDesc || 'Request a withdrawal to see it here'}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="data-table">
                  <thead className="data-table-head">
                    <tr>
                      <th className="data-table-th text-start">{t.wallet?.date || 'Date'}</th>
                      <th className="data-table-th text-end">{t.wallet?.amount || 'Amount'}</th>
                      <th className="data-table-th text-end">{t.wallet?.netAmount || 'Net Amount'}</th>
                      <th className="data-table-th text-center">{t.wallet?.method || 'Method'}</th>
                      <th className="data-table-th text-center">{t.wallet?.statusLabel || 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w: Withdrawal) => (
                      <tr key={w.id} className="data-table-row">
                        <td className="data-table-td whitespace-nowrap text-muted-foreground">{formatDate(w.created_at, language)}</td>
                        <td className="data-table-td whitespace-nowrap text-end font-medium text-foreground">{formatCurrency(w.amount, true, language)}</td>
                        <td className="data-table-td whitespace-nowrap text-end font-semibold text-emerald-400">{formatCurrency(w.net_amount ?? (w.amount - (w.fee ?? 0)), true, language)}</td>
                        <td className="data-table-td whitespace-nowrap text-center"><span className="status-pill bg-muted text-muted-foreground">{formatWithdrawalMethod(w.method, language)}</span></td>
                        <td className="data-table-td whitespace-nowrap text-center"><span className={`status-pill ${withdrawalStatusColors[w.status] ?? withdrawalStatusColors.pending}`}>{t.wallet?.status?.[w.status] ?? w.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3 p-4">
                {withdrawals.map((w: Withdrawal) => (
                  <div key={w.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="status-pill bg-muted text-muted-foreground text-xs">{formatWithdrawalMethod(w.method, language)}</span>
                        <p className="text-sm text-muted-foreground mt-1">{formatDate(w.created_at, language)}</p>
                      </div>
                      <span className={`status-pill text-xs ${withdrawalStatusColors[w.status] ?? withdrawalStatusColors.pending}`}>{t.wallet?.status?.[w.status] ?? w.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                      <div><p className="text-xs text-muted-foreground">{t.wallet?.amount || 'Amount'}</p><p className="text-base font-bold text-foreground mt-0.5">{formatCurrency(w.amount, true, language)}</p></div>
                      <div><p className="text-xs text-muted-foreground">{t.wallet?.netAmount || 'Net Amount'}</p><p className="text-base font-bold text-emerald-400 mt-0.5">{formatCurrency(w.net_amount ?? (w.amount - (w.fee ?? 0)), true, language)}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: Withdraw Panel ────────────────────────────────────────────

function WithdrawPanel({
  wallet,
  onSuccess,
  language,
  t,
  tx,
}: {
  wallet: WalletType;
  onSuccess: () => void;
  language: string;
  t: Record<string, any>;
  tx: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<WithdrawalMethod>('bank_transfer');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const amountValue = parseFloat(amount) || 0;
  const validation = validateWithdrawalAmount(amountValue, wallet.balance, MIN_WITHDRAWAL_AMOUNT, language as any);

  const bankNameError = touched && method === 'bank_transfer' && !bankName.trim() ? tx('wallet.errors.bankNameRequired', undefined, 'Bank name is required') : null;
  const bankAccountNameError = touched && method === 'bank_transfer' && !bankAccountName.trim() ? tx('wallet.errors.accountHolderRequired', undefined, 'Account holder name is required') : null;
  const bankIbanError =
    touched && method === 'bank_transfer' && !bankIban.trim()
      ? tx('wallet.errors.ibanRequired', undefined, 'IBAN is required')
      : touched && method === 'bank_transfer' && bankIban.trim() && !/^TN\d{2}/i.test(bankIban.trim())
      ? tx('wallet.errors.ibanInvalid', undefined, 'IBAN must start with TN')
      : null;
  const phoneError =
    touched && (method === 'd17' || method === 'flouci') && !phoneNumber.trim()
      ? tx('wallet.errors.phoneRequired', undefined, 'Phone number is required')
      : touched && (method === 'd17' || method === 'flouci') && phoneNumber.trim() && !/^\+?[0-9]{8,15}$/.test(phoneNumber.replace(/\s/g, ''))
      ? tx('wallet.errors.phoneInvalid', undefined, 'Enter a valid phone number')
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!validation.valid) { showToast(validation.error || 'Invalid amount', 'error'); return; }
    if (method === 'bank_transfer' && (!bankName.trim() || !bankAccountName.trim() || !bankIban.trim())) return;
    if ((method === 'd17' || method === 'flouci') && !phoneNumber.trim()) return;
    if (bankNameError || bankAccountNameError || bankIbanError || phoneError) return;

    setLoading(true);
    try {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.rpc('request_withdrawal_atomic', {
        p_wallet_id: wallet.id,
        p_amount: amountValue,
        p_method: method,
        p_client_request_id: crypto.randomUUID(),
        p_bank_name: method === 'bank_transfer' ? bankName : null,
        p_bank_account_name: method === 'bank_transfer' ? bankAccountName : null,
        p_bank_iban: method === 'bank_transfer' ? bankIban : null,
        p_phone_number: method !== 'bank_transfer' ? phoneNumber : null,
      });
      if (error) throw error;
      setSubmitted(true);
      showToast(t.wallet?.withdrawalSuccess || 'Withdrawal request submitted successfully', 'success');
      setTimeout(() => onSuccess(), 2500);
    } catch {
      showToast(t.wallet?.withdrawalError || 'Failed to submit withdrawal request', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'color-mix(in srgb, var(--color-status-success) 15%, transparent)' }}>
          <CheckCircle className="w-10 h-10" style={{ color: 'var(--color-status-success)' }} />
        </div>
        <h3 className="text-2xl font-black text-foreground mb-2">{t.wallet?.withdrawalSubmittedTitle || 'Request Submitted!'}</h3>
        <p className="text-muted-foreground max-w-sm">{t.wallet?.withdrawalSubmittedDesc || 'Your request will be reviewed within 2-5 business days'}</p>
        <p className="text-3xl font-black mt-4" style={{ color: 'var(--workspace-primary)' }}>{formatCurrency(amountValue, true, language)}</p>
      </div>
    );
  }

  const fieldClass = (hasError: boolean | null) =>
    `w-full px-4 py-3 min-h-[48px] rounded-xl border text-sm text-foreground bg-[var(--color-bg-subtle)] transition-all outline-none focus:ring-2 focus:border-transparent ${
      hasError ? 'border-rose-500 focus:ring-rose-500/30' : 'border-border focus:ring-[color:var(--workspace-primary)]/30'
    }`;

  const fee = amountValue > 0 ? Math.max(0.5, amountValue * 0.01) : 0;
  const netAmount = amountValue > 0 ? amountValue - fee : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
      {/* ── Left: Form ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-elevated)' }}>
        {/* Header stripe */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border-subtle)', background: 'color-mix(in srgb, var(--workspace-primary) 5%, transparent)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Request Withdrawal</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Transfer earnings to your payment method</p>
            </div>
            <div className="text-end">
              <p className="text-xs text-muted-foreground font-medium">Available</p>
              <p className="text-lg font-black" style={{ color: 'var(--color-status-success)' }}>{formatCurrency(wallet.balance, true, language)}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
          {/* Amount with MAX button */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground">
                {t.wallet?.amount || 'Withdrawal Amount'} <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(wallet.balance))}
                className="text-xs font-bold px-2.5 py-1 rounded-lg transition-colors"
                style={{ background: 'var(--workspace-primary-dim)', color: 'var(--workspace-primary)' }}
              >
                MAX
              </button>
            </div>
            <div className="relative">
              <input
                type="number" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min ${MIN_WITHDRAWAL_AMOUNT}`}
                min={MIN_WITHDRAWAL_AMOUNT} max={wallet.balance} step="0.001" dir="ltr"
                className={`${fieldClass(amount ? !validation.valid : null)} text-lg font-bold pe-16`}
              />
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">TND</span>
            </div>
            {/* Quick preset amounts */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[50, 100, 200, 500].map((v) => (
                <button
                  key={v} type="button"
                  onClick={() => setAmount(String(Math.min(v, wallet.balance)))}
                  disabled={wallet.balance < v}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-30 ${
                    amount === String(v) ? 'border-[color:var(--workspace-primary)] text-[color:var(--workspace-primary)]' : 'border-border text-foreground hover:border-[color:var(--workspace-primary)]/40'
                  }`}
                  style={{ background: amount === String(v) ? 'var(--workspace-primary-dim)' : 'var(--color-bg-subtle)' }}
                >
                  {v} TND
                </button>
              ))}
            </div>
            {amount && !validation.valid && <p className="text-rose-500 text-sm mt-2" role="alert">{validation.error}</p>}
          </div>

          {/* Method selector */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              {t.wallet?.method || 'Withdrawal Method'} <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              <PaymentMethodCard
                id="bank"
                name="Bank Transfer"
                description={tx('wallet.bankTransferDesc', undefined, 'Withdraw directly to your local bank account')}
                status="live"
                selected={method === 'bank_transfer'}
                showRadio
                onSelect={() => { setMethod('bank_transfer'); setTouched(false); }}
              />
              <PaymentMethodCard
                id="d17"
                name="D17 (La Poste)"
                description={tx('wallet.d17Desc', undefined, 'Withdraw via e-Dinar. Coming soon.')}
                status="soon"
                selected={method === 'd17'}
                disabled
              />
              <PaymentMethodCard
                id="flouci"
                name="Flouci"
                description={tx('wallet.flouciDesc', undefined, 'Withdraw via Flouci mobile wallet. Coming soon.')}
                status="soon"
                selected={method === 'flouci'}
                disabled
              />
            </div>
          </div>

          {/* Bank fields */}
          {method === 'bank_transfer' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Bank Name</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. BNA, STB, Attijari…" className={fieldClass(!!bankNameError)} />
                {bankNameError && <p className="text-rose-500 text-sm mt-1">{bankNameError}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Account Holder Name</label>
                <input type="text" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Full name as on your account" className={fieldClass(!!bankAccountNameError)} />
                {bankAccountNameError && <p className="text-rose-500 text-sm mt-1">{bankAccountNameError}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">IBAN</label>
                <input type="text" value={bankIban} onChange={(e) => setBankIban(e.target.value.toUpperCase())} placeholder="TN59 XXXX XXXX XXXX XXXX" aria-label="IBAN" className={`${fieldClass(!!bankIbanError)} font-mono tracking-wider`} dir="ltr" />
                {bankIbanError && <p className="text-rose-500 text-sm mt-1">{bankIbanError}</p>}
              </div>
            </div>
          )}

          {/* Phone for D17/Flouci */}
          {(method === 'd17' || method === 'flouci') && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                {method === 'd17' ? 'D17 Phone Number' : 'Flouci Phone Number'}
              </label>
              <div className="relative" dir="ltr">
                <span className="absolute start-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">+216</span>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="00 000 000" className={`${fieldClass(!!phoneError)} ps-14 font-mono`} dir="ltr" />
              </div>
              {phoneError && <p className="text-rose-500 text-sm mt-1">{phoneError}</p>}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full justify-center min-h-[52px] text-base font-bold" disabled={loading || amountValue < MIN_WITHDRAWAL_AMOUNT || amountValue > wallet.balance || !amountValue}>
            {loading ? <><Loader2 className="me-2 h-5 w-5 animate-spin" />{t.wallet?.submitting || 'Submitting...'}</> : <><ArrowUpRight className="me-2 h-5 w-5" />{t.wallet?.requestWithdrawal || 'Request Withdrawal'}</>}
          </Button>
        </form>
      </div>

      {/* ── Right: Summary sidebar ── */}
      <div className="space-y-4">
        {/* Live summary card */}
        <div className="rounded-2xl p-5 space-y-4" style={{ border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-elevated)' }}>
          <h3 className="text-sm font-bold text-foreground">Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You withdraw</span>
              <span className="font-bold text-foreground">{amountValue > 0 ? formatCurrency(amountValue, true, language) : '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform fee (~1%)</span>
              <span className="font-medium text-foreground">{amountValue > 0 ? `− ${formatCurrency(fee, true, language)}` : '—'}</span>
            </div>
            <div className="border-t pt-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-foreground">You receive</span>
                <span className="text-lg font-black" style={{ color: 'var(--color-status-success)' }}>{amountValue > 0 ? formatCurrency(netAmount, true, language) : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl p-5" style={{ border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-elevated)' }}>
          <h3 className="text-sm font-bold text-foreground mb-4">How it works</h3>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Submit request', desc: 'Fill and submit your withdrawal details' },
              { step: '2', title: 'Review (2–5 days)', desc: 'Our team verifies your request' },
              { step: '3', title: 'Transfer sent', desc: 'Funds hit your account' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black" style={{ background: 'var(--workspace-primary-dim)', color: 'var(--workspace-primary)' }}>{step}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: 'color-mix(in srgb, var(--color-status-warning) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-status-warning) 25%, transparent)' }}>
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-status-warning)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Minimum withdrawal is <strong>{MIN_WITHDRAWAL_AMOUNT} TND</strong>. Requests are reviewed manually before processing.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: Deposit Panel ─────────────────────────────────────────────

function DepositPanel({
  onSuccess,
  language,
  t,
  tx,
}: {
  onSuccess: () => void;
  language: string;
  t: Record<string, any>;
  tx: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
}) {
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('dhmad');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const MIN_DEPOSIT = 10;
  const MAX_DEPOSIT = 5000;

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) {
      setDepositError(tx('wallet.depositAmountError', { min: MIN_DEPOSIT, max: MAX_DEPOSIT }, `Amount must be between ${MIN_DEPOSIT} and ${MAX_DEPOSIT} TND`));
      return;
    }
    if (selectedPaymentMethod !== 'dhmad') return;
    setIsDepositing(true);
    setDepositError(null);
    try {
      const payment = await initiatePayment({ amount: Math.round(amount * 1000), success_link: `${window.location.origin}/payment/success`, fail_link: `${window.location.origin}/payment/failed` });
      if (payment.link) { window.location.href = payment.link; }
      else { throw new Error(tx('wallet.noPaymentLink', undefined, 'Payment link was not generated')); }
    } catch (err) {
      setDepositError(err instanceof Error ? err.message : tx('wallet.genericError', undefined, 'An error occurred. Please try again.'));
    } finally {
      setIsDepositing(false);
    }
  };

  const depositAmountNum = parseFloat(depositAmount) || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      {/* ── Left: Form ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-elevated)' }}>
        {/* Header stripe */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border-subtle)', background: 'color-mix(in srgb, var(--workspace-primary) 5%, transparent)' }}>
          <h2 className="text-base font-bold text-foreground">Deposit Funds</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Top up your wallet securely via escrow</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment method */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">{tx('wallet.paymentMethod', undefined, 'Payment Method')}</h3>
            <PaymentMethodSelector selectedMethod={selectedPaymentMethod} onSelect={setSelectedPaymentMethod} />
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground">{tx('wallet.depositAmountLabel', undefined, 'Amount (TND)')}</label>
              <span className="text-xs text-muted-foreground">{MIN_DEPOSIT} – {MAX_DEPOSIT} TND</span>
            </div>
            <div className="relative">
              <input
                type="number" min={MIN_DEPOSIT} max={MAX_DEPOSIT} step="0.500" dir="ltr"
                value={depositAmount}
                onChange={(e) => { setDepositAmount(e.target.value); setDepositError(null); }}
                placeholder="0.000"
                className="w-full px-4 py-3.5 min-h-[56px] rounded-xl border border-border bg-[var(--color-bg-subtle)] text-2xl font-black text-foreground outline-none focus:ring-2 focus:ring-[color:var(--workspace-primary)]/30 focus:border-[color:var(--workspace-primary)] transition-all pe-16"
              />
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">TND</span>
            </div>
            {depositError && (
              <div className="flex items-center gap-2 mt-2 text-rose-500 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {depositError}
              </div>
            )}
          </div>

          {/* Quick presets */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Amounts</p>
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 250, 500].map((amt) => (
                <button
                  key={amt} type="button"
                  onClick={() => { setDepositAmount(String(amt)); setDepositError(null); }}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                    depositAmount === String(amt)
                      ? 'border-[color:var(--workspace-primary)] text-[color:var(--workspace-primary)]'
                      : 'border-border text-foreground hover:border-[color:var(--workspace-primary)]/40'
                  }`}
                  style={{ background: depositAmount === String(amt) ? 'var(--workspace-primary-dim)' : 'var(--color-bg-subtle)' }}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button" variant="primary"
            className="w-full justify-center min-h-[52px] text-base font-bold"
            disabled={isDepositing || selectedPaymentMethod !== 'dhmad'}
            onClick={handleDeposit}
          >
            {isDepositing
              ? <><Loader2 className="me-2 h-5 w-5 animate-spin" />Processing…</>
              : <><ArrowDownLeft className="me-2 h-5 w-5" />{tx('wallet.deposit', undefined, 'Deposit Funds')}</>}
          </Button>
        </div>
      </div>

      {/* ── Right: Info sidebar ── */}
      <div className="space-y-4">
        {/* Live preview */}
        <div className="rounded-2xl p-5" style={{ border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-elevated)' }}>
          <h3 className="text-sm font-bold text-foreground mb-4">Deposit Preview</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You pay</span>
              <span className="font-bold text-foreground">{depositAmountNum > 0 ? formatCurrency(depositAmountNum, true, language) : '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing fee</span>
              <span className="font-medium" style={{ color: 'var(--color-status-success)' }}>Free</span>
            </div>
            <div className="border-t pt-3" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-foreground">Added to wallet</span>
                <span className="text-lg font-black" style={{ color: 'var(--workspace-primary)' }}>{depositAmountNum > 0 ? formatCurrency(depositAmountNum, true, language) : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Why escrow */}
        <div className="rounded-2xl p-5" style={{ border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-elevated)' }}>
          <h3 className="text-sm font-bold text-foreground mb-4">Why Dhmad Escrow?</h3>
          <div className="space-y-3">
            {[
              { icon: <BadgeCheck className="w-4 h-4" />, text: 'Funds held securely until work approved' },
              { icon: <CheckCircle className="w-4 h-4" />, text: 'Dispute resolution built in' },
              { icon: <Info className="w-4 h-4" />, text: 'Zero deposit fees — pay only what you deposit' },
            ].map(({ icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <span style={{ color: 'var(--workspace-primary)' }} className="shrink-0 mt-0.5">{icon}</span>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Wallet() {
  const { user } = useAuth();
  const { t, tx, language } = useTranslation();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspaceStore();
  const isFreelancer = activeWorkspace !== 'client';

  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Derive tab from URL
  const tabFromUrl = searchParams.get('tab') as WalletTab | null;
  const validTabs: WalletTab[] = ['overview', 'withdraw', 'deposit', 'transactions'];
  const [activeTab, setActiveTabState] = useState<WalletTab>(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl)) return tabFromUrl;
    return 'overview';
  });

  const setActiveTab = useCallback((tab: WalletTab) => {
    setActiveTabState(tab);
    if (tab === 'overview') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  }, [setSearchParams]);

  // Sync tab from URL changes (e.g. clicking navbar links)
  useEffect(() => {
    const tab = searchParams.get('tab') as WalletTab | null;
    if (tab && validTabs.includes(tab)) {
      setActiveTabState(tab);
    } else if (!tab) {
      setActiveTabState('overview');
    }
  }, [searchParams]);

  // Fetch wallet
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async (): Promise<WalletType | null> => {
      if (!user?.id) return null;
      const { data, error } = await getWallet(user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', user?.id, page],
    queryFn: async (): Promise<TransactionsPage> => {
      if (!user?.id) return { data: [], count: 0 };
      const { data, error, count } = await getTransactions(user.id, page, pageSize);
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    enabled: !!user?.id,
  });

  // Fetch withdrawals
  const { data: withdrawals = [], isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useQuery({
    queryKey: ['withdrawals', user?.id],
    queryFn: async (): Promise<Withdrawal[]> => {
      if (!user?.id) return [];
      const { data, error } = await getWithdrawals(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Real-time wallet balance updates
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`wallet:${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, () => refetchWallet())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refetchWallet]);

  const transactions = transactionsData?.data || [];
  const totalPages = Math.ceil((transactionsData?.count || 0) / pageSize);

  if (walletLoading) {
    return (
      <ErrorBoundary>
        <div className="page-shell">
          <Header />
          <div className="page-shell-content">
            <div className="animate-pulse space-y-6">
              <div className="h-52 rounded-2xl" style={{ background: 'var(--card-bg)' }} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl" style={{ background: 'var(--card-bg)' }} />)}
              </div>
              <div className="h-64 rounded-2xl" style={{ background: 'var(--card-bg)' }} />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="page-shell">
        <SEO
          title={tx('wallet.seo.title', undefined, 'Wallet')}
          description={tx('wallet.seo.description', undefined, 'Track your balance, transactions, and withdrawal requests.')}
          url="/wallet"
          noIndex
        />
        <Header />
        <div className="page-shell-content">
          {/* Hero + Tab Bar */}
          <BalanceHero
            wallet={wallet}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isFreelancer={isFreelancer}
            language={language}
            t={t}
            tx={tx}
          />

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              <StatsRow wallet={wallet} language={language} t={t} />

              {/* Quick links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {isFreelancer ? (
                  <button
                    onClick={() => setActiveTab('withdraw')}
                    disabled={!wallet || wallet.balance < MIN_WITHDRAWAL_AMOUNT}
                    className="flex items-center justify-between p-5 rounded-2xl border transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--workspace-primary-dim)' }}>
                        <CreditCard className="w-5 h-5" style={{ color: 'var(--workspace-primary)' }} />
                      </div>
                      <div className="text-start">
                        <p className="font-bold text-foreground text-sm">{t.wallet?.requestWithdrawal || 'Request Withdrawal'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Move earnings to your bank</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('deposit')}
                    className="flex items-center justify-between p-5 rounded-2xl border transition-all group"
                    style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--workspace-primary-dim)' }}>
                        <Plus className="w-5 h-5" style={{ color: 'var(--workspace-primary)' }} />
                      </div>
                      <div className="text-start">
                        <p className="font-bold text-foreground text-sm">{tx('wallet.deposit', undefined, 'Deposit Funds')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Top up your wallet securely</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="flex items-center justify-between p-5 rounded-2xl border transition-all group"
                  style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--workspace-primary-dim)' }}>
                      <ReceiptText className="w-5 h-5" style={{ color: 'var(--workspace-primary)' }} />
                    </div>
                    <div className="text-start">
                      <p className="font-bold text-foreground text-sm">{tx('wallet.tabs.transactions', undefined, 'Transactions')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">View full payment history</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Recent transactions preview */}
              {transactions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-foreground">Recent Transactions</h2>
                    <button onClick={() => setActiveTab('transactions')} className="text-sm font-semibold transition-colors" style={{ color: 'var(--workspace-primary)' }}>
                      View all →
                    </button>
                  </div>
                  <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--card-bg)' }}>
                    {transactions.slice(0, 5).map((tx: Transaction) => {
                      const isCredit = isCreditTransaction(tx.type);
                      const isDebit = isDebitTransaction(tx.type);
                      return (
                        <div key={tx.id} className="flex items-center justify-between px-5 py-4 border-b last:border-b-0" style={{ borderColor: 'var(--color-border-subtle)' }}>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{tx.description || 'Transaction'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.created_at, language)}</p>
                          </div>
                          <span className={`text-sm font-bold ${isCredit ? 'text-emerald-400' : isDebit ? 'text-rose-400' : 'text-foreground'}`}>
                            {isCredit ? '+' : isDebit ? '-' : ''}{formatCurrency(tx.amount, true, language)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'withdraw' && isFreelancer && wallet && (
            <WithdrawPanel
              wallet={wallet}
              onSuccess={() => { refetchWallet(); refetchWithdrawals(); setActiveTab('overview'); }}
              language={language}
              t={t}
              tx={tx}
            />
          )}

          {activeTab === 'deposit' && !isFreelancer && (
            <DepositPanel
              onSuccess={() => setActiveTab('overview')}
              language={language}
              t={t}
              tx={tx}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsPanel
              transactions={transactions}
              withdrawals={withdrawals}
              transactionsLoading={transactionsLoading}
              withdrawalsLoading={withdrawalsLoading}
              totalPages={totalPages}
              page={page}
              setPage={setPage}
              language={language}
              t={t}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
