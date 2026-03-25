import { useState } from 'react';
import { Wallet as WalletIcon, TrendingUp, Clock, ArrowUpRight, Building, Phone, X, Info, CheckCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';
import { useToast } from '@/components/ui/Toast';
import { getWallet, getTransactions, getWithdrawals } from '@/services/payments';
import { formatCurrency, formatTransactionType, formatTransactionStatus, formatWithdrawalMethod, getStatusColor, validateWithdrawalAmount } from '@/lib/currencyUtils';
import { MIN_WITHDRAWAL_AMOUNT } from '@/types/payment';
import type { WithdrawalMethod } from '@/types/payment';

export default function Wallet() {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
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
    queryFn: async () => {
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
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await getWithdrawals(user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const transactions = transactionsData?.data || [];
  const totalPages = Math.ceil((transactionsData?.count || 0) / pageSize);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (walletLoading) {
    return (
      <div className="bg-gray-50 dark:bg-[#0f0e17] min-h-screen">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-[#0f0e17] min-h-screen">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* SECTION A: Header with Balance */}
        <div className="mb-6 bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <WalletIcon className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold">{t.wallet?.title || 'My Wallet'}</h1>
              </div>
              
              <div className="mb-2">
                <p className="text-sm text-purple-200 font-medium">{t.wallet?.balance || 'Available Balance'}</p>
                <h2 className="text-4xl font-bold mt-1">{formatCurrency(wallet?.balance || 0)}</h2>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <Clock className="w-4 h-4" />
                <span>{t.wallet?.pendingBalance || 'Pending in Escrow'}: {formatCurrency(wallet?.pending_balance || 0)}</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsWithdrawalModalOpen(true)}
              disabled={!wallet || wallet.balance < MIN_WITHDRAWAL_AMOUNT}
              className="bg-white text-purple-600 font-semibold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowUpRight className="w-5 h-5" />
              {t.wallet?.requestWithdrawal || 'Request Withdrawal'}
            </button>
          </div>
        </div>

        {/* SECTION B: Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>{t.wallet?.totalEarned || 'Total Earned'}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(wallet?.total_earned || 0)}</p>
          </div>
          
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-2">
              <ArrowUpRight className="w-4 h-4" />
              <span>{t.wallet?.totalWithdrawn || 'Total Withdrawn'}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(wallet?.total_withdrawn || 0)}</p>
          </div>
          
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-2">
              <WalletIcon className="w-4 h-4" />
              <span>{t.wallet?.balance || 'Available Balance'}</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(wallet?.balance || 0)}</p>
          </div>
          
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-2">
              <Clock className="w-4 h-4" />
              <span>{t.wallet?.pendingBalance || 'Pending in Escrow'}</span>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(wallet?.pending_balance || 0)}</p>
          </div>
        </div>

        {/* SECTION D: Transaction History */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.wallet?.transactionHistory || 'Transaction History'}</h2>
          
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
            {transactionsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <WalletIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.wallet?.noTransactions || 'No transactions yet'}</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t.wallet?.noTransactionsDesc || 'Your transaction history will appear here'}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.wallet?.date || 'Date'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.wallet?.type || 'Type'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.wallet?.description || 'Description'}</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.wallet?.amount || 'Amount'}</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{(t.wallet as any)?.status?.pending ? t.wallet?.status?.pending?.replace('قيد الانتظار', 'الحالة') : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {transactions.map((tx: any) => {
                        const isCredit = tx.type === 'deposit' || tx.type === 'release' || tx.type === 'escrow_release';
                        const isDebit = tx.type === 'withdrawal' || tx.type === 'fee' || tx.type === 'escrow';
                        
                        return (
                          <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(tx.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                {formatTransactionType(tx.type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {tx.description || 'Transaction'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className={`text-sm font-semibold ${
                                isCredit ? 'text-green-600 dark:text-green-400' : 
                                isDebit ? 'text-red-600 dark:text-red-400' : 
                                'text-gray-900 dark:text-white'
                              }`}>
                                {isCredit ? '+' : isDebit ? '-' : ''}{formatCurrency(tx.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tx.status)}`}>
                                {formatTransactionStatus(tx.status)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-white/5">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.wallet?.previous || 'Previous'}
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {(t.wallet?.pageOf || 'Page {{page}} of {{totalPages}}').replace('{{page}}', page.toString()).replace('{{totalPages}}', totalPages.toString())}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.wallet?.withdrawalHistory || 'Withdrawal History'}</h2>
          
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
            {withdrawalsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : !withdrawals || withdrawals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <ArrowUpRight className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.wallet?.noWithdrawals || 'No withdrawals yet'}</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t.wallet?.noWithdrawalsDesc || 'Request a withdrawal to see it here'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.wallet?.date || 'Date'}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.wallet?.amount || 'Amount'}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.wallet?.netAmount || 'Net Amount'}</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.wallet?.method || 'Method'}</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{(t.wallet as any)?.status?.pending ? t.wallet?.status?.pending?.replace('قيد الانتظار', 'الحالة') : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {withdrawals.map((withdrawal: any) => {
                      const statusColors = {
                        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                        approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                        processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                        completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                        rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                      };
                      
                      return (
                        <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(withdrawal.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(withdrawal.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(withdrawal.net_amount || (withdrawal.amount - (withdrawal.fee || 0)))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                              {formatWithdrawalMethod(withdrawal.method)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[withdrawal.status as keyof typeof statusColors] || statusColors.pending}`}>
                              {withdrawal.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION C: Withdrawal Modal */}
      {isWithdrawalModalOpen && wallet && (
        <WithdrawalModal
          wallet={wallet}
          onClose={() => setIsWithdrawalModalOpen(false)}
          onSuccess={() => {
            refetchWallet();
            refetchWithdrawals();
            setIsWithdrawalModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// Withdrawal Modal Component
function WithdrawalModal({ wallet, onClose, onSuccess }: { wallet: any; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<WithdrawalMethod>('bank_transfer');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const amountValue = parseFloat(amount) || 0;
  const validation = validateWithdrawalAmount(amountValue, wallet.balance, MIN_WITHDRAWAL_AMOUNT);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.valid) {
      showToast(validation.error || t.wallet?.invalidAmount || 'Invalid amount', 'error');
      return;
    }

    if (method === 'bank_transfer' && (!bankName || !bankAccountName || !bankIban)) {
      showToast(t.wallet?.fillBankDetails || 'Please fill all bank details', 'error');
      return;
    }

    if ((method === 'd17' || method === 'flouci') && !phoneNumber) {
      showToast(t.wallet?.enterPhone || 'Please enter phone number', 'error');
      return;
    }

    setLoading(true);

    try {
      if (!user) throw new Error(t.wallet?.notAuthenticated || 'Not authenticated');

      const { error } = await supabase.from('withdrawals').insert({
        user_id: user.id,
        wallet_id: wallet.id,
        amount: amountValue,
        method,
        status: 'pending',
        bank_name: method === 'bank_transfer' ? bankName : null,
        bank_account_name: method === 'bank_transfer' ? bankAccountName : null,
        iban: method === 'bank_transfer' ? bankIban : null,
        d17_phone: method !== 'bank_transfer' ? phoneNumber : null,
      });

      if (error) throw error;

      setSubmitted(true);
      showToast(t.wallet?.withdrawalSuccess || 'Withdrawal request submitted successfully', 'success');
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Withdrawal error:', error);
      showToast(t.wallet?.withdrawalError || 'Failed to submit withdrawal request', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t.wallet?.withdrawalSubmittedTitle || 'Withdrawal Request Submitted'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t.wallet?.withdrawalSubmittedDesc || 'Your request will be reviewed within 2-5 business days'}
          </p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(amountValue)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {t.wallet?.requestWithdrawal || 'Request Withdrawal'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="text-sm text-gray-500 mb-1">{t.wallet?.availableBalance || 'Available Balance'}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(wallet.balance)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.wallet?.amount || 'Amount'}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={(t.wallet?.minAmount || `Min ${MIN_WITHDRAWAL_AMOUNT} TND`).replace('{{min}}', MIN_WITHDRAWAL_AMOUNT.toString())}
              min={MIN_WITHDRAWAL_AMOUNT}
              max={wallet.balance}
              step="0.001"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              dir="ltr"
            />
            {amount && !validation.valid && (
              <p className="text-red-500 text-sm mt-1">{validation.error}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.wallet?.method || 'Withdrawal Method'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['bank_transfer', 'd17', 'flouci'] as WithdrawalMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`p-3 rounded-xl border-2 text-center transition-colors ${
                    method === m
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  {m === 'bank_transfer' && <Building className="w-5 h-5 mx-auto mb-1" />}
                  {m === 'd17' && <span className="font-bold text-lg">D17</span>}
                  {m === 'flouci' && <span className="font-bold text-lg">F</span>}
                  <div className="text-xs">{formatWithdrawalMethod(m)}</div>
                </button>
              ))}
            </div>
          </div>

          {method === 'bank_transfer' && (
            <div className="space-y-4">
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder={t.wallet?.bankName || "Bank Name"}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder={t.wallet?.accountHolder || "Account Holder Name"}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                placeholder="IBAN (TN59...)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                dir="ltr"
              />
            </div>
          )}

          {(method === 'd17' || method === 'flouci') && (
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+216 XX XXX XXX"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                dir="ltr"
              />
            </div>
          )}

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="text-sm text-purple-800 dark:text-purple-300">
            {t.wallet?.withdrawalSubmittedDesc || 'Withdrawal requests are reviewed within 2-5 business days'}
          </div>
        </div>
          </div>

          <Button
          type="submit"
          variant="primary"
          className="w-full justify-center mt-6"
          disabled={loading || amountValue < MIN_WITHDRAWAL_AMOUNT || amountValue > wallet.balance || !amountValue}
          onClick={handleSubmit}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              {t.wallet?.submitting || 'Submitting...'}
            </>
          ) : (
            t.wallet?.submitWithdrawal || 'Submit Withdrawal Request'
          )}
        </Button>
        </form>
      </div>
    </div>
  );
}
