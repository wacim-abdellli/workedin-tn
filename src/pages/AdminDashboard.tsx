import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Briefcase,
    DollarSign,
    FileText,
    AlertTriangle,
    Flag,
    Settings,
    BarChart3,
    Shield,
    Search,
    ChevronLeft,
    Eye,
    Ban,
    Trash2,
    Check,
    X,
    TrendingUp,
    UserPlus,
    Activity,
    RefreshCw,
    CreditCard,
    Loader2,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { getStuckTransactions, reconcilePayment, type StuckTransaction } from '../services/payments';
import { useToast } from '../components/ui/Toast';

// Mock admin stats
const MOCK_STATS = {
    totalUsers: 1245,
    totalFreelancers: 890,
    totalClients: 355,
    activeJobs: 67,
    activeContracts: 34,
    totalRevenue: 12450,
    todaySignups: 8,
    todayContracts: 3,
};

// Mock pending verifications
const MOCK_VERIFICATIONS = [
    { id: 'v1', user_name: 'أحمد بن علي', submitted_at: 'منذ 2 ساعة', type: 'CIN' },
    { id: 'v2', user_name: 'سارة المنصوري', submitted_at: 'منذ 5 ساعات', type: 'CIN' },
    { id: 'v3', user_name: 'محمد الشريف', submitted_at: 'منذ يوم', type: 'CIN' },
];

// Mock flagged content
const MOCK_FLAGGED = [
    { id: 'f1', type: 'job', title: 'وظيفة مشبوهة', reporter: 'مستخدم', reason: 'محتوى غير مناسب', date: 'منذ ساعة' },
    { id: 'f2', type: 'review', title: 'تقييم مزيف', reporter: 'مستخدم', reason: 'معلومات خاطئة', date: 'منذ 3 ساعات' },
];

// Mock users
const MOCK_USERS = [
    { id: 'u1', name: 'أحمد بن علي', email: 'ahmed@example.com', type: 'freelancer', status: 'active', joined: '2024-01-15', last_active: 'منذ ساعة' },
    { id: 'u2', name: 'سارة المنصوري', email: 'sara@example.com', type: 'freelancer', status: 'active', joined: '2024-02-20', last_active: 'منذ يوم' },
    { id: 'u3', name: 'محمد العميل', email: 'mohamed@example.com', type: 'client', status: 'active', joined: '2024-03-10', last_active: 'الآن' },
    { id: 'u4', name: 'فاطمة حسن', email: 'fatma@example.com', type: 'freelancer', status: 'suspended', joined: '2024-01-05', last_active: 'منذ أسبوع' },
];

type Tab = 'overview' | 'users' | 'jobs' | 'payments' | 'verifications' | 'disputes' | 'reports' | 'settings';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [userFilter, setUserFilter] = useState<'all' | 'freelancer' | 'client'>('all');
    const [stuckPayments, setStuckPayments] = useState<StuckTransaction[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [retryingId, setRetryingId] = useState<string | null>(null);

    // Fetch stuck payments when payments tab is active
    useEffect(() => {
        if (activeTab === 'payments') {
            setLoadingPayments(true);
            getStuckTransactions()
                .then(setStuckPayments)
                .finally(() => setLoadingPayments(false));
        }
    }, [activeTab]);

    const handleRetryPayment = async (txId: string) => {
        setRetryingId(txId);
        const result = await reconcilePayment(txId);
        setRetryingId(null);
        if (result.success) {
            showToast(result.message, 'success');
            setStuckPayments(prev => prev.filter(t => t.id !== txId));
        } else {
            showToast(result.message, 'error');
        }
    };

    const StatCard = ({ icon: Icon, label, value, trend, color }: { icon: React.ElementType; label: string; value: string | number; trend?: number; color: string }) => (
        <div className="card">
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {trend !== undefined && (
                    <span className={`text-sm flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <p className="text-3xl font-bold text-foreground mt-4">{value}</p>
            <p className="text-sm text-muted">{label}</p>
        </div>
    );

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
        { id: 'users', label: 'المستخدمون', icon: Users },
        { id: 'jobs', label: 'الوظائف', icon: Briefcase },
        { id: 'payments', label: 'المدفوعات المعلقة', icon: CreditCard },
        { id: 'verifications', label: 'التحقق', icon: Shield },
        { id: 'disputes', label: 'النزاعات', icon: AlertTriangle },
        { id: 'reports', label: 'البلاغات', icon: Flag },
        { id: 'settings', label: 'الإعدادات', icon: Settings },
    ];

    const filteredUsers = MOCK_USERS.filter(u => {
        if (userFilter !== 'all' && u.type !== userFilter) return false;
        if (searchQuery && !u.name.includes(searchQuery) && !u.email.includes(searchQuery)) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Admin Header */}
            <header className="bg-gray-900 text-white">
                <div className="container-custom py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Shield className="w-8 h-8 text-primary-400" />
                        <div>
                            <h1 className="text-xl font-bold">لوحة الإدارة</h1>
                            <p className="text-sm text-gray-400">Khedma TN</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="text-white" onClick={() => navigate('/')}>
                            <ChevronLeft className="w-4 h-4 ml-1" />
                            العودة للموقع
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container-custom py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <div className="w-64 shrink-0">
                        <div className="card p-2 space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-colors ${activeTab === tab.id
                                        ? 'bg-primary-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard icon={Users} label="إجمالي المستخدمين" value={MOCK_STATS.totalUsers} trend={12} color="bg-blue-500" />
                                    <StatCard icon={Briefcase} label="وظائف نشطة" value={MOCK_STATS.activeJobs} trend={5} color="bg-green-500" />
                                    <StatCard icon={FileText} label="عقود نشطة" value={MOCK_STATS.activeContracts} trend={8} color="bg-purple-500" />
                                    <StatCard icon={DollarSign} label="الإيرادات (د.ت)" value={MOCK_STATS.totalRevenue} trend={15} color="bg-yellow-500" />
                                </div>

                                {/* Today's Activity */}
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <div className="card">
                                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-primary-600" />
                                            نشاط اليوم
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-green-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <UserPlus className="w-5 h-5 text-green-600" />
                                                    <span className="text-green-800 font-medium">تسجيلات جديدة</span>
                                                </div>
                                                <p className="text-2xl font-bold text-green-700">{MOCK_STATS.todaySignups}</p>
                                            </div>
                                            <div className="p-4 bg-blue-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                    <span className="text-blue-800 font-medium">عقود جديدة</span>
                                                </div>
                                                <p className="text-2xl font-bold text-blue-700">{MOCK_STATS.todayContracts}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pending Verifications */}
                                    <div className="card">
                                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-yellow-600" />
                                            طلبات التحقق المعلقة ({MOCK_VERIFICATIONS.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {MOCK_VERIFICATIONS.slice(0, 3).map(v => (
                                                <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                    <div>
                                                        <p className="font-medium text-foreground">{v.user_name}</p>
                                                        <p className="text-sm text-muted">{v.submitted_at}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Flagged Content */}
                                <div className="card">
                                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                        <Flag className="w-5 h-5 text-red-600" />
                                        محتوى مبلغ عنه
                                    </h3>
                                    <div className="space-y-3">
                                        {MOCK_FLAGGED.map(f => (
                                            <div key={f.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded-full">{f.type}</span>
                                                        <span className="font-medium text-foreground">{f.title}</span>
                                                    </div>
                                                    <p className="text-sm text-muted">السبب: {f.reason} • {f.date}</p>
                                                </div>
                                                <Button variant="outline" size="sm">مراجعة</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="space-y-6">
                                {/* Search & Filters */}
                                <div className="card">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex-1 relative">
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="بحث بالاسم أو البريد..."
                                                className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl"
                                            />
                                        </div>
                                        <select
                                            value={userFilter}
                                            onChange={(e) => setUserFilter(e.target.value as typeof userFilter)}
                                            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white"
                                        >
                                            <option value="all">جميع المستخدمين</option>
                                            <option value="freelancer">موظفين حرين</option>
                                            <option value="client">عملاء</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Users Table */}
                                {/* Desktop Table View */}
                                <div className="hidden md:block card p-0 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 whitespace-nowrap">المستخدم</th>
                                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 whitespace-nowrap">النوع</th>
                                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 whitespace-nowrap">الحالة</th>
                                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 whitespace-nowrap">آخر نشاط</th>
                                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 whitespace-nowrap">إجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredUsers.map(user => (
                                                    <tr key={user.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold shrink-0">
                                                                    {user.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-foreground whitespace-nowrap">{user.name}</p>
                                                                    <p className="text-sm text-muted whitespace-nowrap">{user.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${user.type === 'freelancer'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-purple-100 text-purple-700'
                                                                }`}>
                                                                {user.type === 'freelancer' ? 'موظف حر' : 'عميل'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${user.status === 'active'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {user.status === 'active' ? 'نشط' : 'معلق'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-muted whitespace-nowrap">{user.last_active}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-600 transition-colors">
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-yellow-600 transition-colors">
                                                                    <Ban className="w-4 h-4" />
                                                                </button>
                                                                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {filteredUsers.map(user => (
                                        <div key={user.id} className="card p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold shrink-0">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{user.name}</p>
                                                        <p className="text-xs text-muted">{user.email}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {user.status === 'active' ? 'نشط' : 'معلق'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                                <span className="text-sm text-gray-500">النوع</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.type === 'freelancer'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {user.type === 'freelancer' ? 'موظف حر' : 'عميل'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between py-2 mb-4">
                                                <span className="text-sm text-gray-500">آخر نشاط</span>
                                                <span className="text-sm text-foreground">{user.last_active}</span>
                                            </div>

                                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                                <Button size="sm" variant="outline" className="flex-1 justify-center">
                                                    <Eye className="w-4 h-4 ml-1" />
                                                    عرض
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-yellow-600 hover:bg-yellow-50 flex-1 justify-center">
                                                    <Ban className="w-4 h-4 ml-1" />
                                                    حظر
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 flex-1 justify-center">
                                                    <Trash2 className="w-4 h-4 ml-1" />
                                                    حذف
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'verifications' && (
                            <div className="space-y-6">
                                <div className="card">
                                    <h3 className="font-bold text-foreground mb-6">طلبات التحقق من الهوية</h3>
                                    <div className="space-y-4">
                                        {MOCK_VERIFICATIONS.map(v => (
                                            <div key={v.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center">
                                                        <Shield className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-lg">{v.user_name}</p>
                                                        <p className="text-muted">نوع التحقق: {v.type}</p>
                                                        <p className="text-sm text-muted">{v.submitted_at}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="w-4 h-4 ml-1" />
                                                        عرض المستندات
                                                    </Button>
                                                    <Button variant="primary" size="sm">
                                                        <Check className="w-4 h-4 ml-1" />
                                                        قبول
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                                                        <X className="w-4 h-4 ml-1" />
                                                        رفض
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="space-y-6">
                                <div className="card">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-foreground flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-yellow-600" />
                                            المدفوعات المعلقة (أكثر من ساعة)
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setLoadingPayments(true);
                                                getStuckTransactions()
                                                    .then(setStuckPayments)
                                                    .finally(() => setLoadingPayments(false));
                                            }}
                                        >
                                            <RefreshCw className={`w-4 h-4 ml-1 ${loadingPayments ? 'animate-spin' : ''}`} />
                                            تحديث
                                        </Button>
                                    </div>

                                    {loadingPayments ? (
                                        <div className="text-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                                            <p className="text-muted">جاري التحميل...</p>
                                        </div>
                                    ) : stuckPayments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                            <p className="text-foreground font-medium">لا توجد مدفوعات معلقة</p>
                                            <p className="text-sm text-muted">جميع المعاملات تمت بنجاح</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {stuckPayments.map(tx => (
                                                <div key={tx.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded-full">
                                                                {tx.type}
                                                            </span>
                                                            <span className="font-medium text-foreground">
                                                                {tx.amount} د.ت
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted">
                                                            ID: {tx.id.slice(0, 8)}... • 
                                                            {new Date(tx.created_at).toLocaleString('ar-TN')}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        disabled={retryingId === tx.id}
                                                        onClick={() => handleRetryPayment(tx.id)}
                                                    >
                                                        {retryingId === tx.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <RefreshCw className="w-4 h-4 ml-1" />
                                                                إعادة المحاولة
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {(activeTab === 'jobs' || activeTab === 'disputes' || activeTab === 'reports' || activeTab === 'settings') && (
                            <div className="card text-center py-16">
                                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-foreground mb-2">قريباً</h3>
                                <p className="text-muted">هذا القسم قيد التطوير</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
