import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, Clock, ArrowUpRight, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    formatCurrency,
    isCreditTransaction,
    isDebitTransaction,
    formatTransactionType,
    formatTransactionStatus,
    getStatusColor
} from '../../lib/currencyUtils';
import type { Wallet as WalletType, Transaction, WalletCardProps } from '../../types/payment';

/**
 * WalletCard Component
 * Displays user wallet balance and recent transactions
 */
const WalletCard = ({ className = '', showWithdrawal = true }: WalletCardProps) => {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<WalletType | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWalletData = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            // Fetch wallet
            const { data: walletData, error: walletError } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (walletError) {
                // If wallet doesn't exist, it might not have been created yet
                if (walletError.code === 'PGRST116') {
                    logger.log('[WalletCard] No wallet found, user may need to refresh');
                    setWallet(null);
                } else {
                    throw walletError;
                }
            } else {
                setWallet(walletData);
            }

            // Fetch recent transactions
            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (txError) {
                logger.error('[WalletCard] Transaction fetch error:', txError);
            } else {
                setTransactions(txData || []);
            }
        } catch (err) {
            logger.error('[WalletCard] Error:', err);
            setError('فشل في تحميل بيانات المحفظة');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, [user]);

    if (loading) {
        return (
            <div className={`bg-card rounded-2xl border border-border p-6 ${className}`}>
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-secondary rounded w-1/3" />
                    <div className="h-10 bg-secondary rounded w-1/2" />
                    <div className="h-4 bg-secondary rounded w-2/3" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-card rounded-2xl border border-red-200 dark:border-red-800 p-6 ${className}`}>
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
                    <button
                        onClick={fetchWalletData}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        );
    }

    if (!wallet) {
        return (
            <div className={`bg-card rounded-2xl border border-border p-6 ${className}`}>
                <div className="text-center py-4">
                    <Wallet className="w-12 h-12 text-muted mx-auto mb-3" />
                    <p className="text-muted">لم يتم إنشاء محفظتك بعد</p>
                    <button
                        onClick={fetchWalletData}
                        className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                        تحديث
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-card rounded-2xl border border-border overflow-hidden ${className}`}>
            {/* Header with Balance */}
            <div className="p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg">محفظتي</h3>
                    </div>
                    <button
                        onClick={fetchWalletData}
                        className="p-2 rounded-lg hover:bg-card transition-colors"
                        title="تحديث"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                <div className="mb-1">
                    <span className="text-sm text-primary-100">الرصيد المتاح</span>
                </div>
                <div className="text-3xl font-bold mb-4">
                    {formatCurrency(wallet.balance)}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card rounded-xl p-3">
                        <div className="flex items-center gap-2 text-primary-100 text-xs mb-1">
                            <Clock className="w-3 h-3" />
                            <span>قيد الانتظار</span>
                        </div>
                        <div className="font-bold">{formatCurrency(wallet.pending_balance)}</div>
                    </div>
                    <div className="bg-card rounded-xl p-3">
                        <div className="flex items-center gap-2 text-primary-100 text-xs mb-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>إجمالي الأرباح</span>
                        </div>
                        <div className="font-bold">{formatCurrency(wallet.total_earned)}</div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {showWithdrawal && wallet.balance > 0 && (
                <div className="p-4 border-b border-border border-border">
                    <Link
                        to="/freelancer/earnings?action=withdraw"
                        className="btn-primary btn-md w-full justify-center"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>طلب سحب</span>
                    </Link>
                </div>
            )}

            {/* Recent Transactions */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground dark:text-white text-sm">
                        آخر المعاملات
                    </h4>
                    <Link
                        to="/freelancer/earnings"
                        className="text-xs text-primary-600 hover:text-primary-700"
                    >
                        عرض الكل
                    </Link>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-muted">لا توجد معاملات بعد</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((tx) => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between py-2 border-b border-border border-border last:border-0"
                            >
                                <div>
                                    <div className="font-medium text-sm text-foreground dark:text-white">
                                        {formatTransactionType(tx.type)}
                                    </div>
                                    <div className="text-xs text-muted">
                                        {new Date(tx.created_at).toLocaleDateString('ar-TN')}
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className={`font-bold text-sm ${isCreditTransaction(tx.type)
                                            ? 'text-green-600'
                                            : isDebitTransaction(tx.type)
                                                ? 'text-red-600'
                                                : 'text-foreground dark:text-white'
                                        }`}>
                                        {isCreditTransaction(tx.type) ? '+' : isDebitTransaction(tx.type) ? '-' : ''}
                                        {formatCurrency(tx.amount)}
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(tx.status)}`}>
                                        {formatTransactionStatus(tx.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletCard;
