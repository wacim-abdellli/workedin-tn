import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Download,
    Clock,
    Wallet,
    PieChart,
    BarChart3,
    FileText,
    Award,
    Target,
    RefreshCw,
} from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import { WithdrawalForm } from '../components/payments';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    formatCurrency,
    formatTransactionType,
    formatTransactionStatus,
    getStatusColor
} from '../lib/currencyUtils';
import type { Wallet as WalletType, Transaction } from '../types/payment';

// Mock data for charts (to be replaced with real analytics later)
const MOCK_BY_CATEGORY = [
    { category: 'تصميم جرافيكي', amount: 3200, percentage: 37, color: 'bg-blue-500' },
    { category: 'برمجة وتطوير', amount: 2800, percentage: 32, color: 'bg-green-500' },
    { category: 'كتابة وترجمة', amount: 1500, percentage: 17, color: 'bg-purple-500' },
    { category: 'تسويق رقمي', amount: 1250, percentage: 14, color: 'bg-yellow-500' },
];

const MOCK_BY_CLIENT = [
    { client: 'شركة ABC', amount: 2400, projects: 5 },
    { client: 'أحمد بن علي', amount: 1800, projects: 3 },
    { client: 'محمد الشريف', amount: 1500, projects: 2 },
    { client: 'فاطمة حسن', amount: 1200, projects: 4 },
    { client: 'سارة المنصوري', amount: 850, projects: 2 },
];

export default function FreelancerEarnings() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [dateRange, setDateRange] = useState('this_month');
    const [transactionFilter, setTransactionFilter] = useState('all');
    const [showWithdrawModal, setShowWithdrawModal] = useState(
        searchParams.get('action') === 'withdraw'
    );

    // Real data state
    const [wallet, setWallet] = useState<WalletType | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({
        thisMonth: 0,
        previousMonth: 0,
        monthlyGoal: 3000,
    });

    const fetchData = async () => {
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

            if (walletError && walletError.code !== 'PGRST116') {
                throw walletError;
            }
            setWallet(walletData);

            // Fetch all transactions
            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (txError) {
                console.error('[FreelancerEarnings] Transaction error:', txError);
            }
            setTransactions(txData || []);

            // Calculate monthly stats
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            const thisMonthEarnings = (txData || [])
                .filter(t =>
                    (t.type === 'release' || t.type === 'deposit') &&
                    t.status === 'completed' &&
                    new Date(t.created_at) >= thisMonthStart
                )
                .reduce((sum, t) => sum + t.amount, 0);

            const lastMonthEarnings = (txData || [])
                .filter(t =>
                    (t.type === 'release' || t.type === 'deposit') &&
                    t.status === 'completed' &&
                    new Date(t.created_at) >= lastMonthStart &&
                    new Date(t.created_at) <= lastMonthEnd
                )
                .reduce((sum, t) => sum + t.amount, 0);

            setStats({
                thisMonth: thisMonthEarnings,
                previousMonth: lastMonthEarnings,
                monthlyGoal: 3000,
            });

        } catch (err) {
            console.error('[FreelancerEarnings] Error:', err);
            setError('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Handle URL action param
    useEffect(() => {
        if (searchParams.get('action') === 'withdraw' && wallet && wallet.balance > 0) {
            setShowWithdrawModal(true);
            // Clear the URL param
            setSearchParams({});
        }
    }, [wallet, searchParams]);

    const handleWithdrawSuccess = () => {
        setShowWithdrawModal(false);
        fetchData(); // Refresh data
    };

    const monthlyProgress = stats.monthlyGoal > 0
        ? (stats.thisMonth / stats.monthlyGoal) * 100
        : 0;
    const monthChange = stats.previousMonth > 0
        ? ((stats.thisMonth - stats.previousMonth) / stats.previousMonth) * 100
        : 0;

    const filteredTransactions = transactions.filter(t => {
        if (transactionFilter === 'all') return true;
        if (transactionFilter === 'payment') return t.type === 'release' || t.type === 'deposit';
        if (transactionFilter === 'withdrawal') return t.type === 'withdrawal';
        if (transactionFilter === 'fee') return t.type === 'fee';
        return true;
    });

    const StatCard = ({ title, value, subtitle, trend, icon: Icon, color }: {
        title: string;
        value: string;
        subtitle?: string;
        trend?: number;
        icon: React.ElementType;
        color: string;
    }) => (
        <div className="card">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{Math.abs(trend).toFixed(1)}%</span>
                    </div>
                )}
            </div>
            <p className="text-3xl font-bold text-foreground">{value} <span className="text-lg text-muted">د.ت</span></p>
            <p className="text-sm text-muted mt-1">{title}</p>
            {subtitle && <p className="text-xs text-muted mt-2">{subtitle}</p>}
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <div className="container-custom py-8">
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <div className="container-custom py-8">
                {/* Page Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">الأرباح والتحليلات</h1>
                        <p className="text-muted">تتبع أرباحك وحلل أدائك</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm"
                        >
                            <option value="this_week">هذا الأسبوع</option>
                            <option value="this_month">هذا الشهر</option>
                            <option value="last_month">الشهر الماضي</option>
                            <option value="last_3_months">آخر 3 أشهر</option>
                            <option value="all_time">كل الوقت</option>
                        </select>
                        <Button variant="outline" size="sm" onClick={fetchData}>
                            <RefreshCw className="w-4 h-4 ml-2" />
                            تحديث
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 ml-2" />
                            تصدير
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="إجمالي الأرباح"
                        value={formatCurrency(wallet?.total_earned || 0, false)}
                        icon={DollarSign}
                        color="bg-green-500"
                        trend={monthChange}
                    />

                    {/* Wallet Card with withdraw button */}
                    <div className="card">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-foreground">
                            {formatCurrency(wallet?.balance || 0, false)}
                            <span className="text-lg text-muted">د.ت</span>
                        </p>
                        <p className="text-sm text-muted mt-1">الرصيد المتاح</p>
                        <Button
                            variant="primary"
                            size="sm"
                            className="w-full mt-4"
                            onClick={() => setShowWithdrawModal(true)}
                            disabled={!wallet || wallet.balance <= 0}
                        >
                            سحب الأرباح
                        </Button>
                    </div>

                    <StatCard
                        title="قيد الانتظار"
                        value={formatCurrency(wallet?.pending_balance || 0, false)}
                        subtitle="سيتم تحريره عند اكتمال العمل"
                        icon={Clock}
                        color="bg-yellow-500"
                    />

                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <Target className="w-5 h-5 text-purple-600" />
                            <span className="text-sm text-muted">{monthlyProgress.toFixed(0)}%</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">
                            {formatCurrency(stats.thisMonth, false)}
                            <span className="text-lg text-muted">د.ت</span>
                        </p>
                        <p className="text-sm text-muted mt-1">هذا الشهر</p>
                        <div className="mt-3">
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted mt-1">
                                الهدف: {formatCurrency(stats.monthlyGoal)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {/* By Category */}
                    <div className="card">
                        <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-primary-600" />
                            الأرباح حسب التصنيف
                        </h3>
                        <div className="space-y-4">
                            {MOCK_BY_CATEGORY.map((cat, i) => (
                                <div key={i}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{cat.category}</span>
                                        <span className="text-sm font-medium">{cat.amount.toLocaleString()} د.ت</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${cat.color} rounded-full`}
                                            style={{ width: `${cat.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-center text-muted mt-4">
                            * بيانات تجريبية - سيتم تحديثها مع البيانات الحقيقية
                        </p>
                    </div>

                    {/* By Client */}
                    <div className="card">
                        <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary-600" />
                            أعلى العملاء
                        </h3>
                        <div className="space-y-4">
                            {MOCK_BY_CLIENT.map((client, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold">
                                            {client.client.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{client.client}</p>
                                            <p className="text-xs text-muted">{client.projects} مشاريع</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-foreground">{client.amount.toLocaleString()} د.ت</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-center text-muted mt-4">
                            * بيانات تجريبية - سيتم تحديثها مع البيانات الحقيقية
                        </p>
                    </div>
                </div>

                {/* Milestones */}
                <div className="card mb-8">
                    <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        الإنجازات
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                {transactions.filter(t => t.type === 'release' && t.status === 'completed').length}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-300">مدفوعات مستلمة</p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                {formatCurrency(wallet?.total_earned || 0, false)}
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-300">إجمالي الأرباح</p>
                        </div>
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                                {formatCurrency(wallet?.total_withdrawn || 0, false)}
                            </p>
                            <p className="text-sm text-purple-600 dark:text-purple-300">إجمالي السحوبات</p>
                        </div>
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-center">
                            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                                {transactions.length}
                            </p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-300">إجمالي المعاملات</p>
                        </div>
                    </div>
                </div>

                {/* Transactions */}
                <div className="card">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary-600" />
                            سجل المعاملات
                        </h3>
                        <div className="flex items-center gap-3">
                            <select
                                value={transactionFilter}
                                onChange={(e) => setTransactionFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800"
                            >
                                <option value="all">الكل</option>
                                <option value="payment">مدفوعات</option>
                                <option value="withdrawal">سحوبات</option>
                                <option value="fee">رسوم</option>
                            </select>
                        </div>
                    </div>

                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">لا توجد معاملات بعد</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">التاريخ</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">النوع</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">الوصف</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">المبلغ</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredTransactions.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="px-4 py-4 text-sm text-muted">
                                                {new Date(t.created_at).toLocaleDateString('ar-TN')}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm font-medium text-foreground">
                                                    {formatTransactionType(t.type)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-foreground">
                                                    {t.description || '-'}
                                                </p>
                                            </td>
                                            <td className={`px-4 py-4 font-bold ${t.type === 'release' || t.type === 'deposit'
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}>
                                                {t.type === 'release' || t.type === 'deposit' ? '+' : '-'}
                                                {formatCurrency(t.amount)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}>
                                                    {formatTransactionStatus(t.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && wallet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowWithdrawModal(false)} />
                    <div className="relative w-full max-w-md">
                        <WithdrawalForm
                            wallet={wallet}
                            onSuccess={handleWithdrawSuccess}
                            onCancel={() => setShowWithdrawModal(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
