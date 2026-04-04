import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft, Building, Phone, X, Info, CheckCircle, Plus, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout';
import SEO from '@/components/common/SEO';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';
import { useToast } from '@/components/ui/Toast';
import { getWallet, getTransactions, getWithdrawals } from '@/services/payments';
import { formatCurrency, formatTransactionType, formatTransactionStatus, formatWithdrawalMethod, getStatusColor, validateWithdrawalAmount } from '@/lib/currencyUtils';
import { MIN_WITHDRAWAL_AMOUNT } from '@/types/payment';
import type {
  Transaction,
  TransactionsPage,
  Wallet as WalletType,
  Withdrawal,
  WithdrawalMethod,
  WithdrawalStatus,
} from '@/types/payment';

export default function Wallet() {
  const { user } = useAuth();
  const { t, tx, language } = useTranslation();
  
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch wallet data
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
  const { data: withdrawals, isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useQuery({
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Wallet] Real-time balance update:', payload);
          // Refetch wallet data when balance changes
          refetchWallet();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetchWallet]);

  const transactions = transactionsData?.data || [];
  const totalPages = Math.ceil((transactionsData?.count || 0) / pageSize);

  const MIN_DEPOSIT = 10;
  const MAX_DEPOSIT = 5000;

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) {
      setDepositError(tx('wallet.depositAmountError', { min: MIN_DEPOSIT, max: MAX_DEPOSIT }, `Amount must be between ${MIN_DEPOSIT} and ${MAX_DEPOSIT} TND`));
      return;
    }
    if (!user?.id) return;
    setIsDepositing(true);
    setDepositError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-flouci-payment', {
        body: {
          amount: Math.round(amount * 1000),
          user_id: user.id,
          success_link: `${window.location.origin}/payment/success`,
          fail_link: `${window.location.origin}/payment/failed`,
          note: tx('wallet.depositNote', undefined, 'Khedma TN Wallet Deposit'),
        },
      });
      if (error) throw new Error(error.message);
      const payUrl = data?.result?.link || data?.link;
      if (payUrl) {
        window.location.href = payUrl;
      } else {
        throw new Error(tx('wallet.noPaymentLink', undefined, 'Payment link was not generated'));
      }
    } catch (err) {
      setDepositError(err instanceof Error ? err.message : tx('wallet.genericError', undefined, 'An error occurred. Please try again.'));
    } finally {
      setIsDepositing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (walletLoading) {
    return (
      <ErrorBoundary>
      <div className="page-shell">
        <Header />
        <div className="page-shell-content">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-muted rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-muted rounded-2xl" />
              ))}
            </div>
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
        
        {/* SECTION A: Header with Balance */}
        <div className="mb-6 bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800/20 flex items-center justify-center">
                  <WalletIcon className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold">{t.wallet?.title || 'My Wallet'}</h1>
              </div>
              
              <div className="mb-2">
                <p className="text-sm text-purple-200 font-medium">{t.wallet?.balance || 'Available Balance'}</p>
                <h2 className="text-4xl font-bold mt-1">{formatCurrency(wallet?.balance || 0, true, language)}</h2>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <Clock className="w-4 h-4" />
                <span>{t.wallet?.pendingBalance || 'Pending in Escrow'}: {formatCurrency(wallet?.pending_balance || 0, true, language)}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsWithdrawalModalOpen(true)}
                disabled={!wallet || wallet.balance < MIN_WITHDRAWAL_AMOUNT}
                className="bg-white dark:bg-gray-800 text-purple-600 font-semibold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowUpRight className="w-5 h-5" />
                {t.wallet?.requestWithdrawal || 'Request Withdrawal'}
              </button>
              <button
                onClick={() => setIsDepositModalOpen(true)}
                className="bg-white dark:bg-gray-800/20 hover:bg-white dark:bg-gray-800/30 text-white font-semibold px-6 py-3 rounded-xl transition-colors shrink-0 flex items-center gap-2 border border-white/30 dark:border-gray-800/30"
              >
                <Plus className="w-5 h-5" />
                {tx('wallet.deposit', undefined, 'Deposit Funds')}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION B: Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>{t.wallet?.totalEarned || 'Total Earned'}</span>
            </div>
            <p className="stat-card-value">{formatCurrency(wallet?.total_earned || 0, true, language)}</p>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <ArrowUpRight className="w-4 h-4" />
              <span>{t.wallet?.totalWithdrawn || 'Total Withdrawn'}</span>
            </div>
            <p className="stat-card-value">{formatCurrency(wallet?.total_withdrawn || 0, true, language)}</p>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <WalletIcon className="w-4 h-4" />
              <span>{t.wallet?.balance || 'Available Balance'}</span>
            </div>
            <p className="stat-card-value text-green-600 dark:text-green-400">{formatCurrency(wallet?.balance || 0, true, language)}</p>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Clock className="w-4 h-4" />
              <span>{t.wallet?.pendingBalance || 'Pending in Escrow'}</span>
            </div>
            <p className="stat-card-value text-amber-600 dark:text-amber-400">{formatCurrency(wallet?.pending_balance || 0, true, language)}</p>
          </div>
        </div>

        {/* SECTION D: Transaction History */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t.wallet?.transactionHistory || 'Transaction History'}</h2>
          
          <div className="card overflow-hidden">
            {transactionsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <WalletIcon className="w-12 h-12 text-muted mb-4" />
                <h3 className="text-lg font-medium text-foreground">{t.wallet?.noTransactions || 'No transactions yet'}</h3>
                <p className="text-muted-foreground mt-1">{t.wallet?.noTransactionsDesc || 'Your transaction history will appear here'}</p>
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
                        const isCredit = tx.type === 'deposit' || tx.type === 'release' || tx.type === 'escrow_release';
                        const isDebit = tx.type === 'withdrawal' || tx.type === 'fee' || tx.type === 'escrow';
                        
                        return (
                          <tr key={tx.id} className="data-table-row">
                            <td className="data-table-td whitespace-nowrap text-muted-foreground">
                              {formatDate(tx.created_at)}
                            </td>
                            <td className="data-table-td whitespace-nowrap">
                              <span className="status-pill bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                {formatTransactionType(tx.type, language)}
                              </span>
                            </td>
                            <td className="data-table-td text-foreground">
                              {tx.description || t.wallet?.transactionLabel || 'Transaction'}
                            </td>
                            <td className="data-table-td whitespace-nowrap text-end">
                              <span className={`text-sm font-semibold ${
                                isCredit ? 'text-green-600 dark:text-green-400' : 
                                isDebit ? 'text-red-600 dark:text-red-400' : 
                                'text-foreground'
                              }`}>
                                {isCredit ? '+' : isDebit ? '-' : ''}{formatCurrency(tx.amount, true, language)}
                              </span>
                            </td>
                            <td className="data-table-td whitespace-nowrap text-center">
                              <span className={`status-pill ${getStatusColor(tx.status)}`}>
                                {formatTransactionStatus(tx.status, language)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card layout */}
                <div className="md:hidden space-y-3 p-4">
                  {transactions.map((tx: Transaction) => {
                    const isCredit = tx.type === 'deposit' || tx.type === 'release' || tx.type === 'escrow_release';
                    const isDebit = tx.type === 'withdrawal' || tx.type === 'fee' || tx.type === 'escrow';
                    
                    return (
                      <div key={tx.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <span className="status-pill bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 text-xs">
                              {formatTransactionType(tx.type, language)}
                            </span>
                            <p className="text-sm text-muted-foreground mt-1">{formatDate(tx.created_at)}</p>
                          </div>
                          <span className={`text-lg font-bold break-words sm:text-end ${
                            isCredit ? 'text-green-600 dark:text-green-400' : 
                            isDebit ? 'text-red-600 dark:text-red-400' : 
                            'text-foreground'
                          }`}>
                            {isCredit ? '+' : isDebit ? '-' : ''}{formatCurrency(tx.amount, true, language)}
                          </span>
                        </div>
                        <p className="text-sm break-words text-foreground">
                          {tx.description || t.wallet?.transactionLabel || 'Transaction'}
                        </p>
                        <div className="flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800 pt-2 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-xs text-muted-foreground">{t.wallet?.statusLabel || 'Status'}</span>
                          <span className={`status-pill text-xs ${getStatusColor(tx.status)}`}>
                            {formatTransactionStatus(tx.status, language)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col gap-3 border-t border-gray-100 dark:border-gray-800 px-4 py-4 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="min-h-[44px] px-3 md:px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.wallet?.previous || 'Previous'}
                    </button>
                    <span className="text-xs md:text-sm text-foreground">
                      {(t.wallet?.pageOf || 'Page {{page}} of {{totalPages}}').replace('{{page}}', page.toString()).replace('{{totalPages}}', totalPages.toString())}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="min-h-[44px] px-3 md:px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.wallet?.next || 'Next'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* SECTION E: Withdrawal History */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">{t.wallet?.withdrawalHistory || 'Withdrawal History'}</h2>
          
          <div className="card overflow-hidden">
            {withdrawalsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : !withdrawals || withdrawals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <ArrowUpRight className="w-12 h-12 text-muted mb-4" />
                <h3 className="text-lg font-medium text-foreground">{t.wallet?.noWithdrawals || 'No withdrawals yet'}</h3>
                <p className="text-muted-foreground mt-1">{t.wallet?.noWithdrawalsDesc || 'Request a withdrawal to see it here'}</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
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
                      {withdrawals.map((withdrawal: Withdrawal) => {
                        const statusColors: Record<WithdrawalStatus, string> = {
                          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                          approved: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
                          processing: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
                          completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                          rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                        };
                        
                        return (
                          <tr key={withdrawal.id} className="data-table-row">
                            <td className="data-table-td whitespace-nowrap text-muted-foreground">
                              {formatDate(withdrawal.created_at)}
                            </td>
                            <td className="data-table-td whitespace-nowrap text-end font-medium text-foreground">
                              {formatCurrency(withdrawal.amount, true, language)}
                            </td>
                            <td className="data-table-td whitespace-nowrap text-end font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(withdrawal.net_amount || (withdrawal.amount - (withdrawal.fee || 0)), true, language)}
                            </td>
                            <td className="data-table-td whitespace-nowrap text-center">
                              <span className="status-pill bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                {formatWithdrawalMethod(withdrawal.method, language)}
                              </span>
                            </td>
                            <td className="data-table-td whitespace-nowrap text-center">
                              <span className={`status-pill ${statusColors[withdrawal.status as keyof typeof statusColors] || statusColors.pending}`}>
                                {t.wallet?.status?.[withdrawal.status] || withdrawal.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card layout */}
                <div className="md:hidden space-y-3 p-4">
                  {withdrawals.map((withdrawal: Withdrawal) => {
                    const statusColors: Record<WithdrawalStatus, string> = {
                      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                      approved: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
                      processing: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
                      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                    };
                    
                    return (
                      <div key={withdrawal.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{formatDate(withdrawal.created_at)}</p>
                            <span className="status-pill bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 text-xs mt-1 inline-block">
                              {formatWithdrawalMethod(withdrawal.method, language)}
                            </span>
                          </div>
                          <span className={`status-pill text-xs ${statusColors[withdrawal.status as keyof typeof statusColors] || statusColors.pending}`}>
                            {t.wallet?.status?.[withdrawal.status] || withdrawal.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                          <div>
                            <p className="text-xs text-muted-foreground">{t.wallet?.amount || 'Amount'}</p>
                            <p className="text-base font-semibold text-foreground mt-0.5">
                              {formatCurrency(withdrawal.amount, true, language)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{t.wallet?.netAmount || 'Net Amount'}</p>
                            <p className="text-base font-bold text-green-600 dark:text-green-400 mt-0.5">
                              {formatCurrency(withdrawal.net_amount || (withdrawal.amount - (withdrawal.fee || 0)), true, language)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SECTION C: Withdrawal Modal */}
      {isWithdrawalModalOpen && wallet && (
        <ErrorBoundary>
          <WithdrawalModal
            wallet={wallet}
            onClose={() => setIsWithdrawalModalOpen(false)}
            onSuccess={() => {
              refetchWallet();
              refetchWithdrawals();
              setIsWithdrawalModalOpen(false);
            }}
          />
        </ErrorBoundary>
      )}

      {/* DEPOSIT MODAL */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label={tx('common.close', undefined, 'Close')} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsDepositModalOpen(false); setDepositError(null); setDepositAmount(''); }} />
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--surface-bg)] border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{tx('wallet.deposit', undefined, 'Deposit Funds')}</h3>
              </div>
              <button type="button" aria-label={tx('common.close', undefined, 'Close')} onClick={() => { setIsDepositModalOpen(false); setDepositError(null); setDepositAmount(''); }} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl border flex items-start gap-2" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, transparent)' }}>
              <CreditCard className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--workspace-primary)' }} />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{tx('wallet.flouciRedirectMsg', undefined, 'You will be redirected to the secure Flouci gateway to complete payment with your card or bank account.')}</p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-foreground mb-2">{tx('wallet.depositAmountLabel', undefined, 'Deposit Amount (TND)')}</label>
              <div className="relative">
                <input
                  type="number"
                  min={10}
                  max={5000}
                  step="0.500"
                  value={depositAmount}
                  onChange={(e) => { setDepositAmount(e.target.value); setDepositError(null); }}
                  placeholder="0.000"
                  className="input w-full text-lg font-bold ps-4 pe-16"
                  dir="ltr"
                />
                <span className="absolute end-4 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">TND</span>
              </div>
              <p className="text-xs text-muted mt-2">{tx('wallet.depositLimits', undefined, 'Min: 10 TND — Max: 5,000 TND')}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-5">
              {[50, 100, 250, 500].map(amt => (
                <button key={amt} type="button" onClick={() => setDepositAmount(String(amt))} className="py-2 rounded-xl text-sm font-semibold border border-border bg-secondary hover:border-[color:var(--workspace-primary)] hover:text-[color:var(--workspace-primary)] transition-colors">
                  {amt}
                </button>
              ))}
            </div>

            {depositError && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{depositError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => { setIsDepositModalOpen(false); setDepositError(null); setDepositAmount(''); }} className="flex-1 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-secondary transition-colors">
                {tx('common.cancel', undefined, 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeposit}
                disabled={isDepositing || !depositAmount}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDepositing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownLeft className="w-4 h-4" />}
                {isDepositing ? tx('wallet.processingDeposit', undefined, 'Processing...') : tx('wallet.continueToPayment', undefined, 'Continue to Payment')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

// Withdrawal Modal Component
function WithdrawalModal({ wallet, onClose, onSuccess }: { wallet: WalletType; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const { t, tx, language } = useTranslation();
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
  const validation = validateWithdrawalAmount(amountValue, wallet.balance, MIN_WITHDRAWAL_AMOUNT);

  // Inline field-level errors (shown after first submit attempt)
  const bankNameError = touched && method === 'bank_transfer' && !bankName.trim()
    ? tx('wallet.errors.bankNameRequired', undefined, 'Bank name is required')
    : null;
  const bankAccountNameError = touched && method === 'bank_transfer' && !bankAccountName.trim()
    ? tx('wallet.errors.accountHolderRequired', undefined, 'Account holder name is required')
    : null;
  const bankIbanError = touched && method === 'bank_transfer' && !bankIban.trim()
    ? tx('wallet.errors.ibanRequired', undefined, 'IBAN is required')
    : touched && method === 'bank_transfer' && bankIban.trim() && !/^TN\d{2}/i.test(bankIban.trim())
    ? tx('wallet.errors.ibanInvalid', undefined, 'IBAN must start with TN')
    : null;
  const phoneError = touched && (method === 'd17' || method === 'flouci') && !phoneNumber.trim()
    ? tx('wallet.errors.phoneRequired', undefined, 'Phone number is required')
    : touched && (method === 'd17' || method === 'flouci') && phoneNumber.trim() && !/^\+?[0-9]{8,15}$/.test(phoneNumber.replace(/\s/g, ''))
    ? tx('wallet.errors.phoneInvalid', undefined, 'Enter a valid phone number')
    : null;

  const hasFieldErrors = !!(bankNameError || bankAccountNameError || bankIbanError || phoneError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!validation.valid) {
      showToast(validation.error || t.wallet?.invalidAmount || 'Invalid amount', 'error');
      return;
    }

    if (method === 'bank_transfer' && (!bankName.trim() || !bankAccountName.trim() || !bankIban.trim())) return;
    if ((method === 'd17' || method === 'flouci') && !phoneNumber.trim()) return;
    if (hasFieldErrors) return;

    setLoading(true);

    try {
      if (!user) throw new Error(t.wallet?.notAuthenticated || 'Not authenticated');

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
      setTimeout(() => { onSuccess(); }, 2000);
    } catch (error) {
      console.error('Withdrawal error:', error);
      showToast(t.wallet?.withdrawalError || 'Failed to submit withdrawal request', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label={t.wallet?.withdrawalSubmittedTitle || 'Withdrawal Request Submitted'}>
        <div className="bg-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {t.wallet?.withdrawalSubmittedTitle || 'Withdrawal Request Submitted'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t.wallet?.withdrawalSubmittedDesc || 'Your request will be reviewed within 2-5 business days'}
          </p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(amountValue, true, language)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label={t.wallet?.requestWithdrawal || 'Request Withdrawal'}>
      <div className="bg-card rounded-2xl p-4 sm:p-6 max-w-md w-full my-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            {t.wallet?.requestWithdrawal || 'Request Withdrawal'}
          </h3>
          <button type="button" aria-label={t.common?.close || 'Close'} onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-4 sm:mb-6 p-4 bg-gray-50 dark:bg-gray-900 dark:bg-gray-700/50 rounded-xl">
          <div className="text-sm text-gray-500 mb-1">{t.wallet?.availableBalance || 'Available Balance'}</div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {formatCurrency(wallet.balance, true, language)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t.wallet?.amount || 'Amount'} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={(t.wallet?.minAmount || `Min ${MIN_WITHDRAWAL_AMOUNT} TND`).replace('{{min}}', MIN_WITHDRAWAL_AMOUNT.toString())}
              min={MIN_WITHDRAWAL_AMOUNT}
              max={wallet.balance}
              step="0.001"
              className={`w-full px-4 py-3 min-h-[48px] border rounded-lg bg-white dark:bg-gray-800 dark:bg-gray-700 text-foreground focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                amount && !validation.valid ? 'border-red-400 dark:border-red-500' : 'border-border'
              }`}
              dir="ltr"
            />
            {amount && !validation.valid && (
              <p className="text-red-500 text-sm mt-1" role="alert">{validation.error}</p>
            )}
          </div>

          {/* Method selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t.wallet?.method || 'Withdrawal Method'} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['bank_transfer', 'd17', 'flouci'] as WithdrawalMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMethod(m); setTouched(false); }}
                  className={`p-3 min-h-[72px] rounded-xl border-2 text-center transition-colors ${
                    method === m
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  {m === 'bank_transfer' && <Building className="w-5 h-5 mx-auto mb-1" />}
                  {m === 'd17' && <span className="font-bold text-lg">D17</span>}
                  {m === 'flouci' && <span className="font-bold text-lg">F</span>}
                  <div className="text-xs">{formatWithdrawalMethod(m, language)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bank transfer fields */}
          {method === 'bank_transfer' && (
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={t.wallet?.bankName || 'Bank Name'}
                  className={`w-full px-4 py-3 min-h-[48px] border rounded-lg bg-white dark:bg-gray-800 dark:bg-gray-700 text-foreground ${bankNameError ? 'border-red-400 dark:border-red-500' : 'border-border'}`}
                />
                {bankNameError && <p className="text-red-500 text-sm mt-1" role="alert">{bankNameError}</p>}
              </div>
              <div>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder={t.wallet?.accountHolder || 'Account Holder Name'}
                  className={`w-full px-4 py-3 min-h-[48px] border rounded-lg bg-white dark:bg-gray-800 dark:bg-gray-700 text-foreground ${bankAccountNameError ? 'border-red-400 dark:border-red-500' : 'border-border'}`}
                />
                {bankAccountNameError && <p className="text-red-500 text-sm mt-1" role="alert">{bankAccountNameError}</p>}
              </div>
              <div>
                <input
                  type="text"
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value)}
                  placeholder="TN59 ..."
                  aria-label={t.wallet?.iban || 'IBAN'}
                  className={`w-full px-4 py-3 min-h-[48px] border rounded-lg bg-white dark:bg-gray-800 dark:bg-gray-700 text-foreground ${bankIbanError ? 'border-red-400 dark:border-red-500' : 'border-border'}`}
                  dir="ltr"
                />
                {bankIbanError && <p className="text-red-500 text-sm mt-1" role="alert">{bankIbanError}</p>}
              </div>
            </div>
          )}

          {/* D17 / Flouci phone field */}
          {(method === 'd17' || method === 'flouci') && (
            <div>
              <div className="relative" dir="ltr">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+216 00 000 000"
                  className={`w-full ps-10 pe-4 py-3 min-h-[48px] border rounded-lg bg-white dark:bg-gray-800 dark:bg-gray-700 text-foreground ${phoneError ? 'border-red-400 dark:border-red-500' : 'border-border'}`}
                  dir="ltr"
                />
              </div>
              {phoneError && <p className="text-red-500 text-sm mt-1" role="alert">{phoneError}</p>}
            </div>
          )}

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {t.wallet?.withdrawalSubmittedDesc || 'Withdrawal requests are reviewed within 2-5 business days'}
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center mt-2 min-h-[48px]"
            disabled={loading || amountValue < MIN_WITHDRAWAL_AMOUNT || amountValue > wallet.balance || !amountValue}
          >
            {loading ? (
              <>
                <Loader2 className="me-3 h-5 w-5 animate-spin" />
                {t.wallet?.submitting || 'Submitting...'}
              </>
            ) : (
              t.wallet?.requestWithdrawal || 'Request Withdrawal'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}


