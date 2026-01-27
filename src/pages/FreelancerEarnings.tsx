import { useState } from 'react';
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
    Building,
    Smartphone,
} from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';

// Mock earnings data
const MOCK_STATS = {
    totalEarnings: 8750,
    availableBalance: 2340,
    pendingClearance: 1500,
    thisMonth: 2100,
    previousMonth: 1850,
    monthlyGoal: 3000,
};

const MOCK_TRANSACTIONS = [
    { id: 't1', date: '2024-01-25', type: 'payment', description: 'تصميم لوجو - أحمد', amount: 350, status: 'completed', client: 'أحمد بن علي' },
    { id: 't2', date: '2024-01-22', type: 'payment', description: 'ترجمة وثائق', amount: 280, status: 'completed', client: 'شركة ABC' },
    { id: 't3', date: '2024-01-20', type: 'withdrawal', description: 'سحب إلى D17', amount: -500, status: 'completed', client: null },
    { id: 't4', date: '2024-01-18', type: 'payment', description: 'تطوير موقع', amount: 1200, status: 'pending', client: 'محمد الشريف' },
    { id: 't5', date: '2024-01-15', type: 'fee', description: 'رسوم المنصة (10%)', amount: -35, status: 'completed', client: null },
    { id: 't6', date: '2024-01-12', type: 'payment', description: 'كتابة محتوى', amount: 180, status: 'completed', client: 'فاطمة حسن' },
];

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
    const [dateRange, setDateRange] = useState('this_month');
    const [transactionFilter, setTransactionFilter] = useState('all');
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState('d17');

    const monthlyProgress = (MOCK_STATS.thisMonth / MOCK_STATS.monthlyGoal) * 100;
    const monthChange = ((MOCK_STATS.thisMonth - MOCK_STATS.previousMonth) / MOCK_STATS.previousMonth) * 100;

    const StatCard = ({ title, value, subtitle, trend, icon: Icon, color }: any) => (
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

    return (
        <div className="min-h-screen bg-gray-50">
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
                            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm"
                        >
                            <option value="this_week">هذا الأسبوع</option>
                            <option value="this_month">هذا الشهر</option>
                            <option value="last_month">الشهر الماضي</option>
                            <option value="last_3_months">آخر 3 أشهر</option>
                            <option value="all_time">كل الوقت</option>
                        </select>
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 ml-2" />
                            تصدير
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="إجمالي الأرباح"
                        value={MOCK_STATS.totalEarnings.toLocaleString()}
                        icon={DollarSign}
                        color="bg-green-500"
                        trend={monthChange}
                    />
                    <div className="card">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{MOCK_STATS.availableBalance.toLocaleString()} <span className="text-lg text-muted">د.ت</span></p>
                        <p className="text-sm text-muted mt-1">الرصيد المتاح</p>
                        <Button
                            variant="primary"
                            size="sm"
                            className="w-full mt-4"
                            onClick={() => setShowWithdrawModal(true)}
                        >
                            سحب الأرباح
                        </Button>
                    </div>
                    <StatCard
                        title="قيد المعالجة"
                        value={MOCK_STATS.pendingClearance.toLocaleString()}
                        subtitle="متوقع خلال 3-5 أيام"
                        icon={Clock}
                        color="bg-yellow-500"
                    />
                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <Target className="w-5 h-5 text-purple-600" />
                            <span className="text-sm text-muted">{monthlyProgress.toFixed(0)}%</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{MOCK_STATS.thisMonth.toLocaleString()} <span className="text-lg text-muted">د.ت</span></p>
                        <p className="text-sm text-muted mt-1">هذا الشهر</p>
                        <div className="mt-3">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted mt-1">الهدف: {MOCK_STATS.monthlyGoal.toLocaleString()} د.ت</p>
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
                                        <span className="text-sm text-gray-700">{cat.category}</span>
                                        <span className="text-sm font-medium">{cat.amount.toLocaleString()} د.ت</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${cat.color} rounded-full`}
                                            style={{ width: `${cat.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* By Client */}
                    <div className="card">
                        <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary-600" />
                            أعلى العملاء
                        </h3>
                        <div className="space-y-4">
                            {MOCK_BY_CLIENT.map((client, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
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
                    </div>
                </div>

                {/* Milestones */}
                <div className="card mb-8">
                    <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        الإنجازات
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-green-50 rounded-xl text-center">
                            <p className="text-2xl font-bold text-green-700">32</p>
                            <p className="text-sm text-green-600">مشروع مكتمل</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl text-center">
                            <p className="text-2xl font-bold text-blue-700">4.9</p>
                            <p className="text-sm text-blue-600">تقييم متوسط</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-xl text-center">
                            <p className="text-2xl font-bold text-purple-700">98%</p>
                            <p className="text-sm text-purple-600">معدل النجاح</p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-xl text-center">
                            <p className="text-2xl font-bold text-yellow-700">⭐</p>
                            <p className="text-sm text-yellow-600">موظف متميز</p>
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
                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                            >
                                <option value="all">الكل</option>
                                <option value="payment">مدفوعات</option>
                                <option value="withdrawal">سحوبات</option>
                                <option value="fee">رسوم</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">التاريخ</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الوصف</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">المبلغ</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {MOCK_TRANSACTIONS
                                    .filter(t => transactionFilter === 'all' || t.type === transactionFilter)
                                    .map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-sm text-muted">{t.date}</td>
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-foreground">{t.description}</p>
                                                {t.client && <p className="text-sm text-muted">{t.client}</p>}
                                            </td>
                                            <td className={`px-4 py-4 font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString()} د.ت
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {t.status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowWithdrawModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-foreground mb-6">سحب الأرباح</h3>

                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-xl">
                                <p className="text-sm text-blue-700">الرصيد المتاح</p>
                                <p className="text-2xl font-bold text-blue-800">{MOCK_STATS.availableBalance.toLocaleString()} د.ت</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">المبلغ</label>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    placeholder="أدخل المبلغ"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">طريقة السحب</label>
                                <div className="space-y-2">
                                    {[
                                        { id: 'd17', label: 'D17', desc: 'فوري', icon: Smartphone },
                                        { id: 'bank', label: 'تحويل بنكي', desc: '2-3 أيام', icon: Building },
                                    ].map(method => (
                                        <label
                                            key={method.id}
                                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${withdrawMethod === method.id
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-primary-200'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="method"
                                                value={method.id}
                                                checked={withdrawMethod === method.id}
                                                onChange={() => setWithdrawMethod(method.id)}
                                                className="sr-only"
                                            />
                                            <method.icon className="w-6 h-6 text-gray-600" />
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground">{method.label}</p>
                                                <p className="text-sm text-muted">{method.desc}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button variant="ghost" className="flex-1" onClick={() => setShowWithdrawModal(false)}>
                                    إلغاء
                                </Button>
                                <Button variant="primary" className="flex-1" disabled={!withdrawAmount}>
                                    تأكيد السحب
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
