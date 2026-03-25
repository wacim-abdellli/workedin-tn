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
import { supabase } from '../lib/supabase';

interface IdentityVerification {
    id: string;
    user_id: string;
    document_type: string;
    front_image_url: string | null;
    back_image_url: string | null;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
    profile: {
        full_name: string;
        email: string;
    } | null;
}

interface AdminStats {
    totalUsers: number;
    activeJobs: number;
    activeContracts: number;
    totalRevenue: number;
    todaySignups: number;
    todayContracts: number;
}

interface AdminUser {
    id: string;
    name: string;
    email: string;
    type: string;
    status: string;
    last_active: string;
}

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

    // Real identity verifications state
    const [verifications, setVerifications] = useState<IdentityVerification[]>([]);
    const [loadingVerifications, setLoadingVerifications] = useState(false);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

    // Real disputes state
    interface DisputeRecord {
        id: string;
        contract_id: string;
        opened_at: string;
        reason: string;
        status: string;
        contract: { id: string; amount: number; job: { title: string } } | null;
        opener: { full_name: string; email: string } | null;
    }
    const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
    const [loadingDisputes, setLoadingDisputes] = useState(false);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    // Real stats
    const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0, todaySignups: 0, todayContracts: 0 });

    // Real users
    const [realUsers, setRealUsers] = useState<AdminUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Fetch data per tab
    useEffect(() => {
        if (activeTab === 'overview') fetchStats();
        if (activeTab === 'payments') {
            setLoadingPayments(true);
            getStuckTransactions()
                .then(setStuckPayments)
                .finally(() => setLoadingPayments(false));
        }
        if (activeTab === 'verifications') fetchVerifications();
        if (activeTab === 'disputes') fetchDisputes();
        if (activeTab === 'users') fetchUsers();
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const [usersRes, jobsRes, contractsRes] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('jobs').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
                supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            ]);
            const today = new Date().toISOString().split('T')[0];
            const [signupsRes, todayContractsRes] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today),
                supabase.from('contracts').select('id', { count: 'exact', head: true }).gte('created_at', today),
            ]);
            setStats({
                totalUsers: usersRes.count || 0,
                activeJobs: jobsRes.count || 0,
                activeContracts: contractsRes.count || 0,
                totalRevenue: 0,
                todaySignups: signupsRes.count || 0,
                todayContracts: todayContractsRes.count || 0,
            });
        } catch (err) {
            console.error('Stats fetch error:', err);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, user_type, created_at')
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            setRealUsers((data || []).map(u => ({
                id: u.id,
                name: u.full_name || 'مستخدم',
                email: u.email || '',
                type: u.user_type || 'client',
                status: 'active',
                last_active: new Date(u.created_at).toLocaleDateString('ar-TN'),
            })));
        } catch (err) {
            console.error('Users fetch error:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchVerifications = async () => {
        setLoadingVerifications(true);
        try {
            const { data, error } = await supabase
                .from('identity_verifications')
                .select(`
                    id, user_id, document_type, front_image_url, back_image_url, status, submitted_at,
                    profile:profiles!identity_verifications_user_id_fkey(full_name, email)
                `)
                .eq('status', 'pending')
                .order('submitted_at', { ascending: true });

            if (error) throw error;
            setVerifications((data || []) as unknown as IdentityVerification[]);
        } catch (err) {
            console.error('Failed to fetch verifications:', err);
            showToast('فشل تحميل طلبات التحقق', 'error');
        } finally {
            setLoadingVerifications(false);
        }
    };

    const fetchDisputes = async () => {
        setLoadingDisputes(true);
        try {
            const { data, error } = await supabase
                .from('disputes')
                .select(`
                    id, contract_id, opened_at, reason, status,
                    contract:contracts!disputes_contract_id_fkey(id, amount, job:jobs(title)),
                    opener:profiles!disputes_opened_by_fkey(full_name, email)
                `)
                .eq('status', 'open')
                .order('opened_at', { ascending: true });

            if (error) throw error;
            setDisputes((data || []) as unknown as DisputeRecord[]);
        } catch (err) {
            console.error('Failed to fetch disputes:', err);
            showToast('فشل تحميل النزاعات', 'error');
        } finally {
            setLoadingDisputes(false);
        }
    };

    const handleResolveDispute = async (disputeId: string, resolution: string, note?: string) => {
        setResolvingId(disputeId);
        try {
            const { error } = await supabase.rpc('resolve_dispute', {
                p_dispute_id: disputeId,
                p_resolution: resolution,
                p_admin_note: note || null,
            });
            if (error) throw error;
            setDisputes(prev => prev.filter(d => d.id !== disputeId));
            showToast('تم حل النزاع بنجاح ✓', 'success');
        } catch (err) {
            console.error('Resolve dispute error:', err);
            showToast('فشل حل النزاع', 'error');
        } finally {
            setResolvingId(null);
        }
    };

    const handleVerificationAction = async (id: string, action: 'approved' | 'rejected') => {
        setActioningId(id);
        try {
            const { error } = await supabase
                .from('identity_verifications')
                .update({
                    status: action,
                    reviewed_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;

            // If approved, also set cin_verified on freelancer_profiles
            if (action === 'approved') {
                const verification = verifications.find(v => v.id === id);
                if (verification?.user_id) {
                    await supabase
                        .from('freelancer_profiles')
                        .update({ cin_verified: true })
                        .eq('id', verification.user_id);
                }
            }

            setVerifications(prev => prev.filter(v => v.id !== id));
            showToast(action === 'approved' ? 'تم قبول التحقق ✓' : 'تم رفض التحقق', action === 'approved' ? 'success' : 'warning');
        } catch (err) {
            console.error('Verification action error:', err);
            showToast('فشل تنفيذ الإجراء', 'error');
        } finally {
            setActioningId(null);
        }
    };

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

    const filteredUsers = realUsers.filter(u => {
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
                                    <StatCard icon={Users} label="إجمالي المستخدمين" value={stats.totalUsers} color="bg-blue-500" />
                                    <StatCard icon={Briefcase} label="وظائف نشطة" value={stats.activeJobs} color="bg-green-500" />
                                    <StatCard icon={FileText} label="عقود نشطة" value={stats.activeContracts} color="bg-purple-500" />
                                    <StatCard icon={DollarSign} label="الإيرادات (د.ت)" value={stats.totalRevenue} color="bg-yellow-500" />
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
                                                <p className="text-2xl font-bold text-green-700">{stats.todaySignups}</p>
                                            </div>
                                            <div className="p-4 bg-blue-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                    <span className="text-blue-800 font-medium">عقود جديدة</span>
                                                </div>
                                                <p className="text-2xl font-bold text-blue-700">{stats.todayContracts}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pending Verifications */}
                                    <div className="card">
                                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-yellow-600" />
                                            طلبات التحقق المعلقة ({verifications.length})
                                        </h3>
                                        {verifications.length === 0 ? (
                                            <p className="text-sm text-muted text-center py-4">لا توجد طلبات معلقة</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {verifications.slice(0, 3).map(v => (
                                                    <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                        <div>
                                                            <p className="font-medium text-foreground">{v.profile?.full_name || 'مستخدم'}</p>
                                                            <p className="text-sm text-muted">{new Date(v.submitted_at).toLocaleString('ar-TN')}</p>
                                                        </div>
                                                        <Button variant="outline" size="sm" onClick={() => setActiveTab('verifications')}>
                                                            مراجعة
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Flagged Content — placeholder */}
                                <div className="card">
                                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                        <Flag className="w-5 h-5 text-red-600" />
                                        محتوى مبلغ عنه
                                    </h3>
                                    <p className="text-sm text-muted text-center py-6">لا توجد بلاغات حالياً</p>
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

                                {loadingUsers ? (
                                    <div className="card text-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                                        <p className="text-muted">جاري تحميل المستخدمين...</p>
                                    </div>
                                ) : (<>

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
                                </>
                                )}
                            </div>
                        )}

                        {activeTab === 'verifications' && (
                            <div className="space-y-6">
                                <div className="card">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-foreground flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-yellow-600" />
                                            طلبات التحقق من الهوية
                                            {verifications.length > 0 && (
                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                                    {verifications.length} معلق
                                                </span>
                                            )}
                                        </h3>
                                        <Button variant="outline" size="sm" onClick={fetchVerifications}>
                                            <RefreshCw className={`w-4 h-4 ml-1 ${loadingVerifications ? 'animate-spin' : ''}`} />
                                            تحديث
                                        </Button>
                                    </div>

                                    {loadingVerifications ? (
                                        <div className="text-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                                            <p className="text-muted">جاري التحميل...</p>
                                        </div>
                                    ) : verifications.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                            <p className="text-foreground font-medium">لا توجد طلبات معلقة</p>
                                            <p className="text-sm text-muted">جميع طلبات التحقق تمت معالجتها</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {verifications.map(v => (
                                                <div key={v.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                                    <div className="flex items-center justify-between p-4 bg-gray-50">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                                                                <Shield className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground">{v.profile?.full_name || 'مستخدم'}</p>
                                                                <p className="text-sm text-muted">{v.profile?.email || ''}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                                        {v.document_type || 'CIN'}
                                                                    </span>
                                                                    <span className="text-xs text-muted">
                                                                        {new Date(v.submitted_at).toLocaleString('ar-TN')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setExpandedDocId(expandedDocId === v.id ? null : v.id)}
                                                            >
                                                                <Eye className="w-4 h-4 ml-1" />
                                                                {expandedDocId === v.id ? 'إخفاء' : 'عرض المستندات'}
                                                            </Button>
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                disabled={actioningId === v.id}
                                                                onClick={() => handleVerificationAction(v.id, 'approved')}
                                                            >
                                                                {actioningId === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 ml-1" />}
                                                                قبول
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600 hover:bg-red-50"
                                                                disabled={actioningId === v.id}
                                                                onClick={() => handleVerificationAction(v.id, 'rejected')}
                                                            >
                                                                <X className="w-4 h-4 ml-1" />
                                                                رفض
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Document Images — collapsible */}
                                                    {expandedDocId === v.id && (
                                                        <div className="p-4 bg-white border-t border-gray-100 grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-600 mb-2">الوجه الأمامي</p>
                                                                {v.front_image_url ? (
                                                                    <a href={v.front_image_url} target="_blank" rel="noopener noreferrer">
                                                                        <img
                                                                            src={v.front_image_url}
                                                                            alt="وجه أمامي"
                                                                            className="w-full rounded-lg object-cover aspect-video border border-gray-200 hover:opacity-90 transition"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <div className="w-full rounded-lg aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">لا توجد صورة</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-600 mb-2">الوجه الخلفي</p>
                                                                {v.back_image_url ? (
                                                                    <a href={v.back_image_url} target="_blank" rel="noopener noreferrer">
                                                                        <img
                                                                            src={v.back_image_url}
                                                                            alt="وجه خلفي"
                                                                            className="w-full rounded-lg object-cover aspect-video border border-gray-200 hover:opacity-90 transition"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <div className="w-full rounded-lg aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">لا توجد صورة</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
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

                        {activeTab === 'disputes' && (
                            <div className="space-y-6">
                                <div className="card">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-foreground flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                            نزاعات مفتوحة
                                            {disputes.length > 0 && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-sm">
                                                    {disputes.length}
                                                </span>
                                            )}
                                        </h3>
                                        <Button variant="outline" size="sm" onClick={fetchDisputes}>
                                            <RefreshCw className={`w-4 h-4 ml-1 ${loadingDisputes ? 'animate-spin' : ''}`} />
                                            تحديث
                                        </Button>
                                    </div>

                                    {loadingDisputes ? (
                                        <div className="text-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                                            <p className="text-muted">جاري التحميل...</p>
                                        </div>
                                    ) : disputes.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                            <p className="text-foreground font-medium">لا توجد نزاعات مفتوحة</p>
                                            <p className="text-sm text-muted">كل النزاعات تمت معالجتها</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {disputes.map(d => (
                                                <div key={d.id} className="border border-red-200 rounded-xl overflow-hidden">
                                                    <div className="p-4 bg-red-50">
                                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-foreground">
                                                                    {(d.contract?.job as any)?.title || 'عقد'}
                                                                </p>
                                                                <p className="text-sm text-muted">فتحه: {d.opener?.full_name} — {d.opener?.email}</p>
                                                                <p className="text-xs text-muted mt-1">{new Date(d.opened_at).toLocaleString('ar-TN')}</p>
                                                                <div className="mt-3 p-3 bg-white rounded-lg border border-red-100">
                                                                    <p className="text-sm text-gray-700"><strong>سبب النزاع:</strong> {d.reason}</p>
                                                                </div>
                                                                {d.contract?.amount && (
                                                                    <p className="text-sm font-medium text-gray-600 mt-2">مبلغ العقد: {d.contract.amount} د.ت</p>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-2 shrink-0">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => window.open(`/contracts/${d.contract_id}`, '_blank')}
                                                                >
                                                                    <Eye className="w-4 h-4 ml-1" />
                                                                    عرض العقد
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="primary"
                                                                    disabled={resolvingId === d.id}
                                                                    onClick={() => handleResolveDispute(d.id, 'resolved_freelancer', 'نزاع لصالح المستقل')}
                                                                >
                                                                    {resolvingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 ml-1" />}
                                                                    لصالح المستقل
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-blue-600 hover:bg-blue-50"
                                                                    disabled={resolvingId === d.id}
                                                                    onClick={() => handleResolveDispute(d.id, 'resolved_client', 'نزاع لصالح العميل')}
                                                                >
                                                                    <X className="w-4 h-4 ml-1" />
                                                                    لصالح العميل
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-gray-500 hover:bg-gray-100"
                                                                    disabled={resolvingId === d.id}
                                                                    onClick={() => handleResolveDispute(d.id, 'cancelled', 'إلغاء النزاع')}
                                                                >
                                                                    إلغاء النزاع
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {(activeTab === 'jobs' || activeTab === 'reports' || activeTab === 'settings') && (
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
