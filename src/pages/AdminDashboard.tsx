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
import ThemeToggle from '../components/ui/ThemeToggle';
import { getStuckTransactions, reconcilePayment, type StuckTransaction } from '../services/payments';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const ACTIVE_TAB_KEY = 'admin_active_tab';

async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
}

async function rawFetch(endpoint: string, options: RequestInit = {}) {
    const token = await getToken();
    const headers: Record<string, string> = {
        'apikey': SUPA_KEY,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...((options.headers as Record<string, string>) || {})
    };
    const res = await fetch(`${SUPA_URL}${endpoint}`, { ...options, headers });
    if (!res.ok) {
        let errMessage = res.statusText;
        try {
            const errObj = await res.clone().json();
            errMessage = errObj.message || errObj.error || errMessage;
        } catch {
            const errText = await res.text();
            if (errText) errMessage = errText;
        }
        throw new Error(errMessage);
    }
    // Return null if 204 No Content
    if (res.status === 204) return null;
    return res.json();
}

async function rawCount(endpoint: string) {
    const token = await getToken();
    const res = await fetch(`${SUPA_URL}${endpoint}`, {
        method: 'HEAD',
        headers: {
            'apikey': SUPA_KEY,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'Prefer': 'count=exact'
        }
    });
    if (!res.ok) {
        throw new Error(`Count failed for ${endpoint}: ${res.status} ${res.statusText}`);
    }
    const range = res.headers.get('content-range');
    if (range) {
        const match = range.match(/\/(\d+)/);
        if (match) return parseInt(match[1], 10);
    }
    return 0;
}

interface IdentityVerification {
    id: string;
    user_id: string;
    document_type: string;
    front_image_url: string | null;
    back_image_url: string | null;
    selfie_url: string | null;
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
    active_mode: 'client' | 'freelancer' | null;
    cin_verified: boolean;
    is_admin: boolean;
}

interface AdminJob {
    id: string;
    title: string;
    status: string;
    budget_min: number | null;
    budget_max: number | null;
    hourly_rate: number | null;
    created_at: string;
    client: {
        full_name: string;
        email: string;
    } | null;
}

type Tab = 'overview' | 'users' | 'jobs' | 'payments' | 'verifications' | 'disputes' | 'reports' | 'settings';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { language } = useTranslation();
    const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';
    const tr = (ar: string, en: string, fr?: string) => {
        if (language === 'ar') return ar;
        if (language === 'fr') return fr || en;
        return en;
    };
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        const stored = sessionStorage.getItem(ACTIVE_TAB_KEY);
        const allowed: Tab[] = ['overview', 'users', 'jobs', 'payments', 'verifications', 'disputes', 'reports', 'settings'];
        return stored && allowed.includes(stored as Tab) ? (stored as Tab) : 'overview';
    });
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
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [userActionLoadingId, setUserActionLoadingId] = useState<string | null>(null);

    const [autoRefresh, setAutoRefresh] = useState<boolean>(() => localStorage.getItem('admin_auto_refresh') === '1');
    const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(() => Number(localStorage.getItem('admin_refresh_interval') || 45));

    // Real jobs
    const [jobs, setJobs] = useState<AdminJob[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [jobSearch, setJobSearch] = useState('');
    const [jobFilter, setJobFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'cancelled'>('all');

    // Fetch data per tab
    useEffect(() => {
        void refreshActiveTabData(activeTab);
    }, [activeTab]);

    useEffect(() => {
        sessionStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    }, [activeTab]);

    useEffect(() => {
        localStorage.setItem('admin_auto_refresh', autoRefresh ? '1' : '0');
    }, [autoRefresh]);

    useEffect(() => {
        localStorage.setItem('admin_refresh_interval', String(refreshIntervalSec));
    }, [refreshIntervalSec]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = window.setInterval(() => {
            void refreshActiveTabData(activeTab, true);
        }, Math.max(15, refreshIntervalSec) * 1000);

        return () => window.clearInterval(interval);
    }, [autoRefresh, refreshIntervalSec, activeTab]);

    const fetchStats = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const [usersCount, jobsCount, contractsCount, signupsCount, todayContractsCount] = await Promise.all([
                rawCount('/rest/v1/profiles?select=id'),
                rawCount('/rest/v1/jobs?select=id&status=in.(open,in_progress)'),
                rawCount('/rest/v1/contracts?select=id&status=eq.active'),
                rawCount(`/rest/v1/profiles?select=id&created_at=gte.${today}`),
                rawCount(`/rest/v1/contracts?select=id&created_at=gte.${today}`),
            ]);
            setStats({
                totalUsers: usersCount,
                activeJobs: jobsCount,
                activeContracts: contractsCount,
                totalRevenue: 0,
                todaySignups: signupsCount,
                todayContracts: todayContractsCount,
            });
        } catch (err) {
            console.error('Stats fetch error:', err);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const data = await rawFetch('/rest/v1/profiles?select=id,full_name,email,user_type,active_mode,cin_verified,is_admin,created_at&order=created_at.desc&limit=100');
            setRealUsers((data || []).map((u: any) => ({
                id: u.id,
                name: u.full_name || 'مستخدم',
                email: u.email || '',
                type: u.user_type || 'client',
                status: 'active',
                last_active: u.created_at,
                active_mode: u.active_mode ?? null,
                cin_verified: Boolean(u.cin_verified),
                is_admin: Boolean(u.is_admin),
            })));
        } catch (err) {
            console.error('Users fetch error:', err);
            showToast('فشل تحميل المستخدمين', 'error');
        } finally {
            setLoadingUsers(false);
        }
    };

    const refreshActiveTabData = async (tab: Tab, silent = false) => {
        try {
            if (tab === 'overview') {
                await Promise.all([
                    fetchStats(),
                    fetchVerifications(),
                    fetchDisputes(),
                ]);
                return;
            }

            if (tab === 'payments') {
                setLoadingPayments(true);
                try {
                    const payments = await getStuckTransactions();
                    setStuckPayments(payments);
                } finally {
                    setLoadingPayments(false);
                }
                return;
            }

            if (tab === 'verifications') {
                await fetchVerifications();
                return;
            }

            if (tab === 'disputes') {
                await fetchDisputes();
                return;
            }

            if (tab === 'users') {
                await fetchUsers();
                return;
            }

            if (tab === 'jobs') {
                await fetchJobs();
                return;
            }
        } catch (error) {
            if (!silent) {
                showToast('حدث خطأ أثناء التحديث', 'error');
            }
            console.error('Refresh tab error:', error);
        }
    };

    const refreshAllData = async () => {
        setLoadingPayments(true);
        try {
            await Promise.all([
                fetchStats(),
                fetchUsers(),
                fetchJobs(),
                fetchVerifications(),
                fetchDisputes(),
                getStuckTransactions().then(setStuckPayments),
            ]);
            showToast('تم تحديث جميع بيانات لوحة الإدارة', 'success');
        } catch (error) {
            console.error('Refresh all error:', error);
            showToast('تعذر تحديث بعض البيانات', 'warning');
        } finally {
            setLoadingPayments(false);
        }
    };

    const handleToggleUserMode = async (user: AdminUser) => {
        const nextMode: 'client' | 'freelancer' = user.active_mode === 'freelancer' ? 'client' : 'freelancer';
        setUserActionLoadingId(user.id);
        try {
            await rawFetch(`/rest/v1/profiles?id=eq.${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    active_mode: nextMode,
                    updated_at: new Date().toISOString(),
                }),
            });

            setRealUsers(prev => prev.map(u => (u.id === user.id ? { ...u, active_mode: nextMode } : u)));
            setSelectedUser(prev => (prev?.id === user.id ? { ...prev, active_mode: nextMode } : prev));
            showToast(`تم تحويل وضع المستخدم إلى ${nextMode === 'freelancer' ? 'مستقل' : 'عميل'}`, 'success');
        } catch (error) {
            console.error('Toggle user mode error:', error);
            showToast('فشل تغيير وضع المستخدم', 'error');
        } finally {
            setUserActionLoadingId(null);
        }
    };

    const handleDeleteUser = async (user: AdminUser) => {
        if (!confirm(`هل تريد حذف المستخدم ${user.name}؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
        setUserActionLoadingId(user.id);
        try {
            await rawFetch(`/rest/v1/profiles?id=eq.${user.id}`, { method: 'DELETE' });
            setRealUsers(prev => prev.filter(u => u.id !== user.id));
            setSelectedUser(prev => (prev?.id === user.id ? null : prev));
            showToast('تم حذف المستخدم بنجاح', 'success');
        } catch (error) {
            console.error('Delete user error:', error);
            showToast('تعذر حذف المستخدم', 'error');
        } finally {
            setUserActionLoadingId(null);
        }
    };

    const fetchJobs = async () => {
        setLoadingJobs(true);
        try {
            try {
                const data = await rawFetch('/rest/v1/jobs?select=id,title,status,budget_min,budget_max,hourly_rate,created_at,client:profiles!client_id(full_name,email)&order=created_at.desc&limit=100');
                setJobs((data || []) as AdminJob[]);
            } catch {
                // Fallback for older schema variants that expose a single budget column.
                const legacy = await rawFetch('/rest/v1/jobs?select=id,title,status,budget,created_at,client:profiles!client_id(full_name,email)&order=created_at.desc&limit=100');
                const normalized = (legacy || []).map((j: any) => ({
                    ...j,
                    budget_min: typeof j.budget === 'number' ? j.budget : null,
                    budget_max: null,
                    hourly_rate: null,
                })) as AdminJob[];
                setJobs(normalized);
            }
        } catch (err) {
            console.error('Jobs fetch error:', err);
            showToast('حدث خطأ أثناء تحميل الوظائف', 'error');
        } finally {
            setLoadingJobs(false);
        }
    };

    const handleDeleteJob = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الوظيفة؟')) return;
        
        try {
            await rawFetch(`/rest/v1/jobs?id=eq.${id}`, { method: 'DELETE' });
            showToast('تم حذف الوظيفة بنجاح', 'success');
            setJobs(prev => prev.filter(j => j.id !== id));
        } catch (error) {
            console.error('Error deleting job:', error);
            showToast('حدث خطأ أثناء الحذف', 'error');
        }
    };

    const fetchVerifications = async () => {
        setLoadingVerifications(true);
        try {
            try {
                const data = await rawFetch('/rest/v1/identity_verifications?select=id,user_id,cin_front_url,cin_back_url,selfie_url,status,submitted_at,profile:profiles!identity_verifications_user_id_fkey(full_name,email)&status=eq.pending&order=submitted_at.asc');
                const normalized = (data || []).map((item: any) => ({
                    id: item.id,
                    user_id: item.user_id,
                    document_type: 'CIN',
                    front_image_url: item.cin_front_url ?? null,
                    back_image_url: item.cin_back_url ?? null,
                    selfie_url: item.selfie_url ?? null,
                    status: item.status,
                    submitted_at: item.submitted_at,
                    profile: item.profile ?? null,
                })) as IdentityVerification[];
                setVerifications(normalized);
            } catch {
                // Fallback for earlier/alternate schema naming.
                const legacy = await rawFetch('/rest/v1/identity_verifications?select=id,user_id,document_type,front_image_url,back_image_url,status,submitted_at,profile:profiles!identity_verifications_user_id_fkey(full_name,email)&status=eq.pending&order=submitted_at.asc');
                const normalized = (legacy || []).map((item: any) => ({
                    id: item.id,
                    user_id: item.user_id,
                    document_type: item.document_type || 'CIN',
                    front_image_url: item.front_image_url ?? null,
                    back_image_url: item.back_image_url ?? null,
                    selfie_url: null,
                    status: item.status,
                    submitted_at: item.submitted_at,
                    profile: item.profile ?? null,
                })) as IdentityVerification[];
                setVerifications(normalized);
            }
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
            const data = await rawFetch('/rest/v1/disputes?select=id,contract_id,opened_at,reason,status,contract:contracts!disputes_contract_id_fkey(id,amount,job:jobs(title)),opener:profiles!disputes_opened_by_fkey(full_name,email)&status=eq.open&order=opened_at.asc');
            setDisputes((data || []) as DisputeRecord[]);
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
            await rawFetch('/rest/v1/rpc/resolve_dispute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    p_dispute_id: disputeId,
                    p_resolution: resolution,
                    p_admin_note: note || null,
                })
            });
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
            await rawFetch(`/rest/v1/identity_verifications?id=eq.${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: action,
                    reviewed_at: new Date().toISOString(),
                })
            });

            // If approved, also set cin_verified on freelancer_profiles
            if (action === 'approved') {
                const verification = verifications.find(v => v.id === id);
                if (verification?.user_id) {
                    await rawFetch(`/rest/v1/freelancer_profiles?id=eq.${verification.user_id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cin_verified: true })
                    });
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

    const panelClass = 'card border-white/45 dark:border-white/10 bg-white/80 dark:bg-slate-950/55 backdrop-blur-xl shadow-[0_16px_45px_-24px_rgba(21,84,247,0.38)]';
    const panelElevatedClass = 'card border-white/50 dark:border-white/12 bg-white/88 dark:bg-slate-950/65 backdrop-blur-xl shadow-[0_24px_60px_-28px_rgba(14,65,227,0.42)] hover:-translate-y-0.5 transition-all duration-300';
    const tableShellClass = 'hidden md:block card p-0 overflow-hidden border-white/40 dark:border-white/10 bg-white/75 dark:bg-slate-950/45';
    const tableHeadClass = 'bg-white/90 dark:bg-slate-900/88 border-b border-gray-200 dark:border-white/10 sticky top-0 z-10 backdrop-blur';
    const tableRowClass = 'group hover:bg-primary-50/60 dark:hover:bg-primary-500/10 transition-colors';
    const iconActionClass = 'p-2 rounded-xl bg-gray-100/85 dark:bg-white/5 text-gray-500 transition-colors';

    const StatCard = ({ icon: Icon, label, value, trend, color }: { icon: React.ElementType; label: string; value: string | number; trend?: number; color: string }) => (
        <div className={panelElevatedClass}>
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-md`}>
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
        { id: 'overview', label: tr('نظرة عامة', 'Overview', 'Vue d ensemble'), icon: BarChart3 },
        { id: 'users', label: tr('المستخدمون', 'Users', 'Utilisateurs'), icon: Users },
        { id: 'jobs', label: tr('الوظائف', 'Jobs', 'Offres'), icon: Briefcase },
        { id: 'payments', label: tr('المدفوعات المعلقة', 'Pending Payments', 'Paiements en attente'), icon: CreditCard },
        { id: 'verifications', label: tr('التحقق', 'Verification', 'Verification'), icon: Shield },
        { id: 'disputes', label: tr('النزاعات', 'Disputes', 'Litiges'), icon: AlertTriangle },
        { id: 'reports', label: tr('البلاغات', 'Reports', 'Signalements'), icon: Flag },
        { id: 'settings', label: tr('الإعدادات', 'Settings', 'Parametres'), icon: Settings },
    ];

    const filteredUsers = realUsers.filter(u => {
        if (userFilter !== 'all' && u.type !== userFilter) return false;
        if (searchQuery && !u.name.includes(searchQuery) && !u.email.includes(searchQuery)) return false;
        return true;
    });

    const filteredJobs = jobs.filter(j => {
        if (jobFilter !== 'all' && j.status !== jobFilter) return false;
        if (jobSearch && !j.title.includes(jobSearch)) return false;
        return true;
    });

    const formatAdminDate = (value: string) => {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    };

    const formatJobBudget = (job: AdminJob) => {
        if (typeof job.hourly_rate === 'number' && !Number.isNaN(job.hourly_rate)) {
            return `${job.hourly_rate} د.ت/ساعة`;
        }
        if (typeof job.budget_min === 'number' && typeof job.budget_max === 'number') {
            return `${job.budget_min} - ${job.budget_max} د.ت`;
        }
        if (typeof job.budget_max === 'number') {
            return `${job.budget_max} د.ت`;
        }
        if (typeof job.budget_min === 'number') {
            return `${job.budget_min} د.ت`;
        }
        return 'غير محدد';
    };

    const unresolvedSignals = verifications.length + disputes.length + stuckPayments.length;
    const systemHealthLabel = unresolvedSignals === 0 ? 'مستقر' : unresolvedSignals <= 5 ? 'متوسط' : 'يتطلب تدخل';

    const inputClass = 'w-full h-12 pr-11 pl-4 border rounded-xl bg-white/92 dark:bg-slate-900/70 border-gray-200 dark:border-white/12 text-foreground placeholder:text-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/35 focus:border-primary-400/40';
    const selectClass = 'h-12 px-4 border rounded-xl bg-white/92 dark:bg-slate-900/70 border-gray-200 dark:border-white/12 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/35 focus:border-primary-400/40';

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(1200px_circle_at_10%_10%,rgba(21,84,247,0.12),transparent_45%),radial-gradient(900px_circle_at_90%_5%,rgba(147,51,234,0.14),transparent_35%),linear-gradient(180deg,#f4f7ff_0%,#edf2fb_100%)] dark:bg-[radial-gradient(1100px_circle_at_8%_12%,rgba(14,65,227,0.2),transparent_42%),radial-gradient(900px_circle_at_92%_8%,rgba(147,51,234,0.16),transparent_36%),linear-gradient(180deg,#070b14_0%,#0a1220_100%)]">
            <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-80 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(21,84,247,0.2),transparent_24%),radial-gradient(circle_at_30%_78%,rgba(248,101,69,0.14),transparent_26%)]" />
            {/* Admin Header */}
            <header className="sticky top-0 z-40 border-b border-white/35 dark:border-white/10 bg-white/72 dark:bg-slate-950/58 backdrop-blur-2xl">
                <div className="container-custom py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1554f7] to-[#9333ea] shadow-lg shadow-[#1554f7]/35 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-foreground">{tr('لوحة الإدارة', 'Admin Dashboard', 'Tableau de bord admin')}</h1>
                            <p className="text-sm text-muted">Khedma TN • {tr('مركز المراقبة', 'Operations Center', 'Centre de supervision')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-primary-500/25 bg-primary-500/10 text-primary-700 dark:text-primary-300 text-sm font-medium">
                            <Activity className="w-4 h-4" />
                            {tr('الوضع الليلي جاهز', 'Night mode ready', 'Mode nuit pret')}
                        </div>
                        <Button variant="outline" size="sm" onClick={refreshAllData}>
                            <RefreshCw className="w-4 h-4 ml-1" />
                            {tr('تحديث الكل', 'Refresh all', 'Tout actualiser')}
                        </Button>
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" className="border border-white/45 dark:border-white/15 bg-white/75 dark:bg-slate-900/65" onClick={() => navigate('/')}>
                            <ChevronLeft className="w-4 h-4 ml-1" />
                            {tr('العودة للموقع', 'Back to site', 'Retour au site')}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="relative container-custom py-8">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Sidebar */}
                    <div className="w-full lg:w-72 shrink-0">
                        <div className="card p-2.5 bg-white/78 dark:bg-slate-950/60 backdrop-blur-2xl border-white/45 dark:border-white/10 shadow-[0_20px_56px_-30px_rgba(21,84,247,0.36)] sticky top-24">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-1 gap-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center justify-center lg:justify-start gap-2.5 px-3 lg:px-4 py-3 rounded-xl text-right transition-all duration-300 border ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-[#1554f7] to-[#9333ea] text-white border-transparent shadow-lg shadow-[#1554f7]/35 -translate-y-[1px]'
                                        : 'text-foreground border-transparent hover:bg-white/75 dark:hover:bg-slate-800/70 hover:border-primary-300/30 dark:hover:border-primary-500/20'
                                        }`}
                                >
                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${activeTab === tab.id ? 'bg-white/15' : 'bg-black/5 dark:bg-white/5'}`}>
                                        <tab.icon className="w-4 h-4" />
                                    </span>
                                    <span className="text-sm font-medium">{tab.label}</span>
                                </button>
                            ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard icon={Users} label={tr('إجمالي المستخدمين', 'Total users', 'Utilisateurs totaux')} value={stats.totalUsers} color="bg-[#1554f7]" />
                                    <StatCard icon={Briefcase} label={tr('وظائف نشطة', 'Active jobs', 'Offres actives')} value={stats.activeJobs} color="bg-[#0e41e3]" />
                                    <StatCard icon={FileText} label={tr('عقود نشطة', 'Active contracts', 'Contrats actifs')} value={stats.activeContracts} color="bg-[#9333ea]" />
                                    <StatCard icon={DollarSign} label={tr('الإيرادات (د.ت)', 'Revenue (TND)', 'Revenus (TND)')} value={stats.totalRevenue} color="bg-[#f86545]" />
                                </div>

                                {/* Today's Activity */}
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <div className={panelClass}>
                                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-cyan-500" />
                                            {tr('نشاط اليوم', 'Today activity', 'Activite du jour')}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                                                    <span className="text-emerald-800 dark:text-emerald-200 font-medium">{tr('تسجيلات جديدة', 'New signups', 'Nouvelles inscriptions')}</span>
                                                </div>
                                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.todaySignups}</p>
                                            </div>
                                            <div className="p-4 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-300" />
                                                    <span className="text-cyan-800 dark:text-cyan-200 font-medium">{tr('عقود جديدة', 'New contracts', 'Nouveaux contrats')}</span>
                                                </div>
                                                <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{stats.todayContracts}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pending Verifications */}
                                    <div className={panelClass}>
                                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-yellow-600" />
                                            {tr('طلبات التحقق المعلقة', 'Pending verifications', 'Verifications en attente')} ({verifications.length})
                                        </h3>
                                        {verifications.length === 0 ? (
                                            <p className="text-sm text-muted text-center py-4">{tr('لا توجد طلبات معلقة', 'No pending requests', 'Aucune demande en attente')}</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {verifications.slice(0, 3).map(v => (
                                                    <div key={v.id} className="flex items-center justify-between p-3 bg-white/70 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl">
                                                        <div>
                                                            <p className="font-medium text-foreground">{v.profile?.full_name || 'مستخدم'}</p>
                                                            <p className="text-sm text-muted">{new Date(v.submitted_at).toLocaleString(locale)}</p>
                                                        </div>
                                                        <Button variant="outline" size="sm" onClick={() => setActiveTab('verifications')}>
                                                            {tr('مراجعة', 'Review', 'Verifier')}
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Flagged Content — placeholder */}
                                <div className={panelClass}>
                                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                        <Flag className="w-5 h-5 text-red-600" />
                                        {tr('محتوى مبلغ عنه', 'Flagged content', 'Contenu signale')}
                                    </h3>
                                    <p className="text-sm text-muted text-center py-6">{tr('لا توجد بلاغات حالياً', 'No reports for now', 'Aucun signalement pour le moment')}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="space-y-6">
                                {/* Search & Filters */}
                                <div className={panelClass}>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex-1 relative">
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder={tr('بحث بالاسم أو البريد...', 'Search by name or email...', 'Rechercher par nom ou email...')}
                                                className={inputClass}
                                            />
                                        </div>
                                        <select
                                            value={userFilter}
                                            onChange={(e) => setUserFilter(e.target.value as typeof userFilter)}
                                            className={`${selectClass} min-w-[180px]`}
                                        >
                                            <option value="all">{tr('جميع المستخدمين', 'All users', 'Tous les utilisateurs')}</option>
                                            <option value="freelancer">{tr('موظفين حرين', 'Freelancers', 'Freelances')}</option>
                                            <option value="client">{tr('عملاء', 'Clients', 'Clients')}</option>
                                        </select>
                                    </div>
                                </div>

                                {loadingUsers ? (
                                    <div className={`${panelClass} text-center py-12`}>
                                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                                        <p className="text-muted">{tr('جاري تحميل المستخدمين...', 'Loading users...', 'Chargement des utilisateurs...')}</p>
                                    </div>
                                ) : (<>

                                {/* Users Table */}
                                {/* Desktop Table View */}
                                <div className={tableShellClass}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className={tableHeadClass}>
                                                <tr>
                                                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tr('المستخدم', 'User', 'Utilisateur')}</th>
                                                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tr('النوع', 'Type', 'Type')}</th>
                                                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tr('الحالة', 'Status', 'Statut')}</th>
                                                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tr('آخر نشاط', 'Last activity', 'Derniere activite')}</th>
                                                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted whitespace-nowrap tracking-wide">{tr('إجراءات', 'Actions', 'Actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                {filteredUsers.map(user => (
                                                    <tr key={user.id} className={tableRowClass}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-cyan-700/20">
                                                                    {user.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-foreground whitespace-nowrap">{user.name}</p>
                                                                    <p className="text-sm text-muted whitespace-nowrap">{user.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${user.type === 'freelancer'
                                                                ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                                                : 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300'
                                                                }`}>
                                                                {user.type === 'freelancer' ? tr('موظف حر', 'Freelancer', 'Freelance') : tr('عميل', 'Client', 'Client')}
                                                            </span>
                                                            <span className="ms-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-primary-100 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300">
                                                                {tr('الوضع', 'Mode', 'Mode')}: {user.active_mode === 'freelancer' ? tr('مستقل', 'Freelancer', 'Freelance') : tr('عميل', 'Client', 'Client')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${user.cin_verified
                                                                ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                                                : 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                                                }`}>
                                                                {user.cin_verified ? tr('موثق', 'Verified', 'Verifie') : tr('غير موثق', 'Unverified', 'Non verifie')}
                                                            </span>
                                                            {user.is_admin && (
                                                                <span className="ms-2 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">{tr('مشرف', 'Admin', 'Admin')}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-muted whitespace-nowrap">{formatAdminDate(user.last_active)}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setSelectedUser(user)}
                                                                    className={`${iconActionClass} hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-500/10`}
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    disabled={userActionLoadingId === user.id}
                                                                    onClick={() => handleToggleUserMode(user)}
                                                                    className={`${iconActionClass} hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 disabled:opacity-50`}
                                                                >
                                                                    <Ban className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    disabled={userActionLoadingId === user.id}
                                                                    onClick={() => handleDeleteUser(user)}
                                                                    className={`${iconActionClass} hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50`}
                                                                >
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
                                        <div key={user.id} className={`${panelClass} p-4`}>
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
                                                    {user.cin_verified ? tr('موثق', 'Verified', 'Verifie') : tr('غير موثق', 'Unverified', 'Non verifie')}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                                <span className="text-sm text-muted">{tr('النوع', 'Type', 'Type')}</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.type === 'freelancer'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {user.type === 'freelancer' ? tr('موظف حر', 'Freelancer', 'Freelance') : tr('عميل', 'Client', 'Client')}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/10">
                                                <span className="text-sm text-muted">{tr('الوضع النشط', 'Active mode', 'Mode actif')}</span>
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                                    {user.active_mode === 'freelancer' ? tr('مستقل', 'Freelancer', 'Freelance') : tr('عميل', 'Client', 'Client')}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between py-2 mb-4">
                                                <span className="text-sm text-muted">{tr('آخر نشاط', 'Last activity', 'Derniere activite')}</span>
                                                <span className="text-sm text-foreground">{formatAdminDate(user.last_active)}</span>
                                            </div>

                                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
                                                <Button size="sm" variant="outline" className="flex-1 justify-center" onClick={() => setSelectedUser(user)}>
                                                    <Eye className="w-4 h-4 ml-1" />
                                                    {tr('عرض', 'View', 'Voir')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-yellow-600 hover:bg-yellow-50 flex-1 justify-center"
                                                    disabled={userActionLoadingId === user.id}
                                                    onClick={() => handleToggleUserMode(user)}
                                                >
                                                    <Ban className="w-4 h-4 ml-1" />
                                                    {tr('تبديل', 'Switch', 'Basculer')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:bg-red-50 flex-1 justify-center"
                                                    disabled={userActionLoadingId === user.id}
                                                    onClick={() => handleDeleteUser(user)}
                                                >
                                                    <Trash2 className="w-4 h-4 ml-1" />
                                                    {tr('حذف', 'Delete', 'Supprimer')}
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
                                <div className={panelClass}>
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
                                                <div key={v.id} className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                                                    <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-900/60">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                                                                <Shield className="w-6 h-6 text-gray-400 dark:text-gray-300" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground">{v.profile?.full_name || 'مستخدم'}</p>
                                                                <p className="text-sm text-muted">{v.profile?.email || ''}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                                        {v.document_type || 'CIN'}
                                                                    </span>
                                                                    <span className="text-xs text-muted">
                                                                        {new Date(v.submitted_at).toLocaleString(locale)}
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
                                                        <div className="p-4 bg-white/70 dark:bg-slate-900/50 border-t border-gray-100 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-muted mb-2">الوجه الأمامي</p>
                                                                {v.front_image_url ? (
                                                                    <a href={v.front_image_url} target="_blank" rel="noopener noreferrer">
                                                                        <img
                                                                            src={v.front_image_url}
                                                                            alt="وجه أمامي"
                                                                            className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-white/10 hover:opacity-90 transition"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <div className="w-full rounded-lg aspect-video bg-gray-100 dark:bg-white/10 flex items-center justify-center text-muted text-sm">لا توجد صورة</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-muted mb-2">الوجه الخلفي</p>
                                                                {v.back_image_url ? (
                                                                    <a href={v.back_image_url} target="_blank" rel="noopener noreferrer">
                                                                        <img
                                                                            src={v.back_image_url}
                                                                            alt="وجه خلفي"
                                                                            className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-white/10 hover:opacity-90 transition"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <div className="w-full rounded-lg aspect-video bg-gray-100 dark:bg-white/10 flex items-center justify-center text-muted text-sm">لا توجد صورة</div>
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
                                <div className={panelClass}>
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
                                                <div key={tx.id} className="flex items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-xl">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs rounded-full">
                                                                {tx.type}
                                                            </span>
                                                            <span className="font-medium text-foreground">
                                                                {tx.amount} د.ت
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted">
                                                            ID: {tx.id.slice(0, 8)}... • 
                                                            {new Date(tx.created_at).toLocaleString(locale)}
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
                                <div className={panelClass}>
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
                                                <div key={d.id} className="border border-red-200 dark:border-red-500/30 rounded-xl overflow-hidden">
                                                    <div className="p-4 bg-red-50/85 dark:bg-red-500/10">
                                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-foreground">
                                                                    {(d.contract?.job as any)?.title || 'عقد'}
                                                                </p>
                                                                <p className="text-sm text-muted">فتحه: {d.opener?.full_name} — {d.opener?.email}</p>
                                                                <p className="text-xs text-muted mt-1">{new Date(d.opened_at).toLocaleString(locale)}</p>
                                                                <div className="mt-3 p-3 bg-white/85 dark:bg-slate-900/55 rounded-lg border border-red-100 dark:border-red-500/20">
                                                                    <p className="text-sm text-foreground"><strong>سبب النزاع:</strong> {d.reason}</p>
                                                                </div>
                                                                {d.contract?.amount && (
                                                                    <p className="text-sm font-medium text-muted mt-2">مبلغ العقد: {d.contract.amount} د.ت</p>
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

                        {activeTab === 'jobs' && (
                            <div className="space-y-6">
                                <div className={panelClass}>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex-1 relative">
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={jobSearch}
                                                onChange={(e) => setJobSearch(e.target.value)}
                                                placeholder="بحث في الوظائف..."
                                                className={inputClass}
                                            />
                                        </div>
                                        <select
                                            value={jobFilter}
                                            onChange={(e) => setJobFilter(e.target.value as any)}
                                            className={selectClass}
                                        >
                                            <option value="all">جميع الحالات</option>
                                            <option value="open">مفتوحة</option>
                                            <option value="in_progress">قيد التنفيذ</option>
                                            <option value="completed">مكتملة</option>
                                            <option value="cancelled">ملغاة</option>
                                        </select>
                                    </div>
                                </div>

                                {loadingJobs ? (
                                    <div className={`${panelClass} text-center py-12`}>
                                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                                        <p className="text-muted">جاري تحميل الوظائف...</p>
                                    </div>
                                ) : (
                                    <div className={`${tableShellClass} block`}>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className={tableHeadClass}>
                                                    <tr>
                                                        <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">الوظيفة</th>
                                                        <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">العميل</th>
                                                        <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">الميزانية</th>
                                                        <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">الحالة</th>
                                                        <th className="px-6 py-4 text-center text-sm font-medium text-muted whitespace-nowrap">إجراءات</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                    {filteredJobs.map(job => (
                                                        <tr key={job.id} className={tableRowClass}>
                                                            <td className="px-6 py-4">
                                                                <p className="font-medium text-foreground">{job.title}</p>
                                                                <p className="text-xs text-muted">{new Date(job.created_at).toLocaleDateString(locale)}</p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <p className="font-medium text-foreground text-sm">{job.client?.full_name}</p>
                                                                <p className="text-xs text-muted">{job.client?.email}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-medium text-foreground">
                                                                {formatJobBudget(job)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                    job.status === 'open' ? 'bg-green-100 text-green-700' :
                                                                    job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                    job.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                    {job.status === 'open' ? 'مفتوحة' : 
                                                                     job.status === 'in_progress' ? 'قيد التنفيذ' : 
                                                                     job.status === 'completed' ? 'مكتملة' : 'ملغاة'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm"
                                                                        onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                                                                    >
                                                                        <Eye className="w-4 h-4 ml-1" />
                                                                        مراجعة
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm" 
                                                                        className="text-red-600 hover:bg-red-50"
                                                                        onClick={() => handleDeleteJob(job.id)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4 ml-1" />
                                                                        حذف
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {filteredJobs.length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-8 text-center text-muted">
                                                                لا يوجد وظائف
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className={`${panelElevatedClass} border-amber-300/50 dark:border-amber-500/30`}>
                                        <p className="text-sm text-muted">تحققات معلقة</p>
                                        <p className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-300">{verifications.length}</p>
                                        <Button size="sm" variant="ghost" className="mt-4" onClick={() => setActiveTab('verifications')}>
                                            فتح قسم التحقق
                                        </Button>
                                    </div>
                                    <div className={`${panelElevatedClass} border-red-300/50 dark:border-red-500/30`}>
                                        <p className="text-sm text-muted">نزاعات مفتوحة</p>
                                        <p className="mt-2 text-3xl font-extrabold text-red-600 dark:text-red-300">{disputes.length}</p>
                                        <Button size="sm" variant="ghost" className="mt-4" onClick={() => setActiveTab('disputes')}>
                                            فتح قسم النزاعات
                                        </Button>
                                    </div>
                                    <div className={`${panelElevatedClass} border-cyan-300/50 dark:border-cyan-500/30`}>
                                        <p className="text-sm text-muted">مدفوعات تحتاج متابعة</p>
                                        <p className="mt-2 text-3xl font-extrabold text-cyan-600 dark:text-cyan-300">{stuckPayments.length}</p>
                                        <Button size="sm" variant="ghost" className="mt-4" onClick={() => setActiveTab('payments')}>
                                            فتح قسم المدفوعات
                                        </Button>
                                    </div>
                                </div>

                                <div className={panelClass}>
                                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                        <Flag className="w-5 h-5 text-red-500" />
                                        مركز التنبيهات
                                    </h3>
                                    {unresolvedSignals === 0 ? (
                                        <p className="text-muted">لا توجد تنبيهات حالياً، النظام يعمل بشكل طبيعي.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {verifications.slice(0, 5).map(v => (
                                                <div key={v.id} className="p-3 rounded-xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/85 dark:bg-amber-500/10">
                                                    <p className="text-sm font-medium text-foreground">تحقق جديد: {v.profile?.full_name || 'مستخدم'}</p>
                                                    <p className="text-xs text-muted">{new Date(v.submitted_at).toLocaleString(locale)}</p>
                                                </div>
                                            ))}
                                            {disputes.slice(0, 5).map(d => (
                                                <div key={d.id} className="p-3 rounded-xl border border-red-200/80 dark:border-red-500/20 bg-red-50/85 dark:bg-red-500/10">
                                                    <p className="text-sm font-medium text-foreground">نزاع مفتوح: {(d.contract?.job as any)?.title || 'عقد'}</p>
                                                    <p className="text-xs text-muted">{new Date(d.opened_at).toLocaleString(locale)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                <div className={panelClass}>
                                    <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-cyan-500" />
                                        إعدادات لوحة الإدارة
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/55">
                                            <span className="text-sm font-medium text-foreground">التحديث التلقائي</span>
                                            <input
                                                type="checkbox"
                                                checked={autoRefresh}
                                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                                className="h-5 w-5 accent-cyan-600"
                                            />
                                        </label>

                                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/55">
                                            <span className="text-sm font-medium text-foreground">فاصل التحديث</span>
                                            <select
                                                value={refreshIntervalSec}
                                                onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
                                                className={selectClass}
                                            >
                                                <option value={20}>20 ثانية</option>
                                                <option value={30}>30 ثانية</option>
                                                <option value={45}>45 ثانية</option>
                                                <option value={60}>60 ثانية</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <Button variant="primary" onClick={refreshAllData}>
                                            <RefreshCw className="w-4 h-4 ml-1" />
                                            مزامنة جميع الأقسام
                                        </Button>
                                        <Button variant="outline" onClick={() => refreshActiveTabData(activeTab)}>
                                            تحديث القسم الحالي
                                        </Button>
                                    </div>
                                </div>

                                <div className={panelClass}>
                                    <h4 className="font-bold text-foreground mb-3">صحة النظام</h4>
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/55">
                                        <span className="text-muted">حالة المراقبة</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            systemHealthLabel === 'مستقر'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : systemHealthLabel === 'متوسط'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-red-100 text-red-700'
                                        }`}>
                                            {systemHealthLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedUser && (
                <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xl card bg-white/95 dark:bg-slate-950/95 border-white/30 dark:border-white/10 shadow-[0_32px_90px_-40px_rgba(6,182,212,0.55)]">
                        <div className="flex items-start justify-between gap-3 mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">تفاصيل المستخدم</h3>
                                <p className="text-sm text-muted">{selectedUser.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                                aria-label="close"
                            >
                                <X className="w-4 h-4 text-muted" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <p><strong>الاسم:</strong> {selectedUser.name}</p>
                            <p><strong>البريد:</strong> {selectedUser.email || '-'}</p>
                            <p><strong>نوع الحساب:</strong> {selectedUser.type}</p>
                            <p><strong>الوضع النشط:</strong> {selectedUser.active_mode || 'client'}</p>
                            <p><strong>توثيق الهوية:</strong> {selectedUser.cin_verified ? 'نعم' : 'لا'}</p>
                            <p><strong>مشرف:</strong> {selectedUser.is_admin ? 'نعم' : 'لا'}</p>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                disabled={userActionLoadingId === selectedUser.id}
                                onClick={() => handleToggleUserMode(selectedUser)}
                            >
                                <Ban className="w-4 h-4 ml-1" />
                                تبديل الوضع
                            </Button>
                            <Button
                                variant="danger"
                                disabled={userActionLoadingId === selectedUser.id}
                                onClick={() => handleDeleteUser(selectedUser)}
                            >
                                <Trash2 className="w-4 h-4 ml-1" />
                                حذف المستخدم
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
