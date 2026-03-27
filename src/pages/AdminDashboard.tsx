import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Users, Briefcase, DollarSign, FileText, AlertTriangle, Flag,
    Settings, BarChart3, Shield, ChevronLeft, Eye, Check, X,
    TrendingUp, UserPlus, Activity, RefreshCw, CreditCard, Loader2,
} from 'lucide-react';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import Modal from '../components/ui/Modal';
import { getStuckTransactions, reconcilePayment } from '../services/payments';
import type { StuckTransaction } from '../types/payment';
import { useToast } from '../components/ui/Toast';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { supabaseWithRetry } from '../lib/supabaseWithRetry';
import { useTranslation } from '../i18n';
import UsersTab, { ADMIN_USERS_QUERY_KEY, fetchAdminUsers } from './admin/UsersTab';
import JobsTab, { ADMIN_JOBS_QUERY_KEY, fetchAdminJobs } from './admin/JobsTab';
import VerificationsTab, { fetchVerifications } from './admin/VerificationsTab';
import type { IdentityVerification } from './admin/VerificationsTab';
import ReportsTab from './admin/ReportsTab';

const ACTIVE_TAB_KEY = 'admin_active_tab';

async function countWithRetry(queryFn: () => PromiseLike<{ count: number | null; error: unknown }>) {
    const { count } = await supabaseWithRetry(queryFn);
    return count ?? 0;
}

interface AdminStats {
    totalUsers: number; activeJobs: number; activeContracts: number;
    totalRevenue: number; todaySignups: number; todayContracts: number;
}

interface DisputeRecord {
    id: string; contract_id: string; opened_at: string; reason: string; status: string;
    contract: { id: string; amount: number; job: { title: string } } | null;
    opener: { full_name: string; email: string } | null;
}

type Tab = 'overview' | 'users' | 'jobs' | 'payments' | 'verifications' | 'disputes' | 'reports' | 'settings';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { language } = useTranslation();
    const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';
    const tr = (ar: string, en: string, fr?: string) => language === 'ar' ? ar : language === 'fr' ? (fr || en) : en;

    const [activeTab, setActiveTab] = useState<Tab>(() => {
        const stored = sessionStorage.getItem(ACTIVE_TAB_KEY);
        const allowed: Tab[] = ['overview', 'users', 'jobs', 'payments', 'verifications', 'disputes', 'reports', 'settings'];
        return stored && allowed.includes(stored as Tab) ? (stored as Tab) : 'overview';
    });

    const [stuckPayments, setStuckPayments] = useState<StuckTransaction[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const [verifications, setVerifications] = useState<IdentityVerification[]>([]);
    const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
    const [loadingDisputes, setLoadingDisputes] = useState(false);
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0, todaySignups: 0, todayContracts: 0 });
    const [autoRefresh, setAutoRefresh] = useState(() => localStorage.getItem('admin_auto_refresh') === '1');
    const [refreshIntervalSec, setRefreshIntervalSec] = useState(() => Number(localStorage.getItem('admin_refresh_interval') || 45));
    const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean; title: string; message: string; actionType: 'danger' | 'warning' | 'primary'; onConfirm: () => void }>
        ({ isOpen: false, title: '', message: '', actionType: 'primary', onConfirm: () => {} });
    const closeConfirm = () => setConfirmAction(prev => ({ ...prev, isOpen: false }));

    useEffect(() => { void refreshActiveTabData(activeTab); }, [activeTab]);
    useEffect(() => { sessionStorage.setItem(ACTIVE_TAB_KEY, activeTab); }, [activeTab]);
    useEffect(() => { localStorage.setItem('admin_auto_refresh', autoRefresh ? '1' : '0'); }, [autoRefresh]);
    useEffect(() => { localStorage.setItem('admin_refresh_interval', String(refreshIntervalSec)); }, [refreshIntervalSec]);
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = window.setInterval(() => void refreshActiveTabData(activeTab, true), Math.max(15, refreshIntervalSec) * 1000);
        return () => window.clearInterval(interval);
    }, [autoRefresh, refreshIntervalSec, activeTab]);

    const fetchStats = async () => {
        try {
            const client = supabaseAdmin || supabase;
            const today = new Date().toISOString().split('T')[0];
            const [usersCount, jobsCount, contractsCount, signupsCount, todayContractsCount] = await Promise.all([
                countWithRetry(() => client.from('profiles').select('id', { count: 'exact', head: true })),
                countWithRetry(() => client.from('jobs').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress'])),
                countWithRetry(() => client.from('contracts').select('id', { count: 'exact', head: true }).eq('status', 'active')),
                countWithRetry(() => client.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today)),
                countWithRetry(() => client.from('contracts').select('id', { count: 'exact', head: true }).gte('created_at', today)),
            ]);
            setStats({ totalUsers: usersCount, activeJobs: jobsCount, activeContracts: contractsCount, totalRevenue: 0, todaySignups: signupsCount, todayContracts: todayContractsCount });
        } catch (err) { console.error('Stats fetch error:', err); }
    };

    const loadVerifications = async () => {
        try { setVerifications(await fetchVerifications()); } catch { /* handled inside */ }
    };

    const fetchDisputes = async () => {
        setLoadingDisputes(true);
        try {
            const client = supabaseAdmin || supabase;
            const { data } = await supabaseWithRetry(() =>
                client.from('disputes')
                    .select('id,contract_id,opened_at,reason,status,contract:contracts!disputes_contract_id_fkey(id,amount,job:jobs(title)),opener:profiles!disputes_opened_by_fkey(full_name,email)')
                    .eq('status', 'open').order('opened_at', { ascending: true })
            );
            setDisputes((data || []) as unknown as DisputeRecord[]);
        } catch (err) {
            console.error('Failed to fetch disputes:', err);
            showToast(tr('فشل تحميل النزاعات', 'Failed to load disputes', 'Echec du chargement des litiges'), 'error');
        } finally { setLoadingDisputes(false); }
    };

    const refreshActiveTabData = async (tab: Tab, silent = false) => {
        try {
            if (tab === 'overview') { await Promise.all([fetchStats(), loadVerifications(), fetchDisputes()]); return; }
            if (tab === 'payments') { setLoadingPayments(true); try { setStuckPayments(await getStuckTransactions()); } finally { setLoadingPayments(false); } return; }
            if (tab === 'verifications') { await loadVerifications(); return; }
            if (tab === 'disputes') { await fetchDisputes(); return; }
            if (tab === 'users') { await queryClient.fetchQuery({ queryKey: ADMIN_USERS_QUERY_KEY, queryFn: fetchAdminUsers }); return; }
            if (tab === 'jobs') { await queryClient.fetchQuery({ queryKey: ADMIN_JOBS_QUERY_KEY, queryFn: fetchAdminJobs }); return; }
        } catch (error) {
            if (!silent) showToast(tr('حدث خطأ أثناء التحديث', 'An error occurred while refreshing', 'Une erreur est survenue pendant l actualisation'), 'error');
            console.error('Refresh tab error:', error);
        }
    };

    const refreshAllData = async () => {
        setLoadingPayments(true);
        try {
            await Promise.all([
                fetchStats(),
                queryClient.fetchQuery({ queryKey: ADMIN_USERS_QUERY_KEY, queryFn: fetchAdminUsers }),
                queryClient.fetchQuery({ queryKey: ADMIN_JOBS_QUERY_KEY, queryFn: fetchAdminJobs }),
                loadVerifications(), fetchDisputes(),
                getStuckTransactions().then(setStuckPayments),
            ]);
            showToast(tr('تم تحديث جميع بيانات لوحة الإدارة', 'All admin dashboard data has been refreshed', 'Toutes les donnees du tableau admin ont ete actualisees'), 'success');
        } catch { showToast(tr('تعذر تحديث بعض البيانات', 'Some sections could not be refreshed', 'Certaines sections n ont pas pu etre actualisees'), 'warning'); }
        finally { setLoadingPayments(false); }
    };

    const handleResolveDispute = async (disputeId: string, resolution: string, note?: string) => {
        setResolvingId(disputeId);
        try {
            const client = supabaseAdmin || supabase;
            await supabaseWithRetry(() => client.rpc('resolve_dispute', { p_dispute_id: disputeId, p_resolution: resolution, p_admin_note: note || null }));
            setDisputes(prev => prev.filter(d => d.id !== disputeId));
            showToast(tr('تم حل النزاع بنجاح ✓', 'Dispute resolved successfully ✓', 'Litige resolu avec succes ✓'), 'success');
        } catch (err) {
            console.error('Resolve dispute error:', err);
            showToast(tr('فشل حل النزاع', 'Failed to resolve dispute', 'Echec de la resolution du litige'), 'error');
        } finally { setResolvingId(null); }
    };

    const handleRetryPayment = async (txId: string) => {
        setRetryingId(txId);
        const result = await reconcilePayment(txId);
        setRetryingId(null);
        if (result.success) { showToast(result.message, 'success'); setStuckPayments(prev => prev.filter(t => t.id !== txId)); }
        else showToast(result.message, 'error');
    };

    const panelClass = 'card border-white/45 dark:border-white/10 bg-white/80 dark:bg-slate-950/55 backdrop-blur-xl shadow-[0_16px_45px_-24px_rgba(21,84,247,0.38)]';
    const panelElevatedClass = 'card border-white/50 dark:border-white/12 bg-white/88 dark:bg-slate-950/65 backdrop-blur-xl shadow-[0_24px_60px_-28px_rgba(14,65,227,0.42)] hover:-translate-y-0.5 transition-all duration-300';
    const selectClass = 'h-12 px-4 border rounded-xl bg-white/92 dark:bg-slate-900/70 border-gray-200 dark:border-white/12 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/35 focus:border-primary-400/40';

    const StatCard = ({ icon: Icon, label, value, trend, color }: { icon: React.ElementType; label: string; value: string | number; trend?: number; color: string }) => (
        <div className={panelElevatedClass}>
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-md`}><Icon className="w-6 h-6 text-white" /></div>
                {trend !== undefined && (
                    <span className={`text-sm flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />{Math.abs(trend)}%
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

    const unresolvedSignals = verifications.length + disputes.length + stuckPayments.length;
    const systemHealthLevel = unresolvedSignals === 0 ? 'stable' : unresolvedSignals <= 5 ? 'moderate' : 'critical';

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(1200px_circle_at_10%_10%,rgba(21,84,247,0.12),transparent_45%),radial-gradient(900px_circle_at_90%_5%,rgba(147,51,234,0.14),transparent_35%),linear-gradient(180deg,#f4f7ff_0%,#edf2fb_100%)] dark:bg-[radial-gradient(1100px_circle_at_8%_12%,rgba(14,65,227,0.2),transparent_42%),radial-gradient(900px_circle_at_92%_8%,rgba(147,51,234,0.16),transparent_36%),linear-gradient(180deg,#070b14_0%,#0a1220_100%)]">
            <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-80 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(21,84,247,0.2),transparent_24%),radial-gradient(circle_at_30%_78%,rgba(248,101,69,0.14),transparent_26%)]" />

            {/* Header */}
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
                            <RefreshCw className="w-4 h-4 ml-1" />{tr('تحديث الكل', 'Refresh all', 'Tout actualiser')}
                        </Button>
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" className="border border-white/45 dark:border-white/15 bg-white/75 dark:bg-slate-900/65" onClick={() => navigate('/')}>
                            <ChevronLeft className="w-4 h-4 ml-1" />{tr('العودة للموقع', 'Back to site', 'Retour au site')}
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
                                            : 'text-foreground border-transparent hover:bg-white/75 dark:hover:bg-slate-800/70 hover:border-primary-300/30 dark:hover:border-primary-500/20'}`}
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
                        {/* ── Overview ── */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard icon={Users} label={tr('إجمالي المستخدمين', 'Total users', 'Utilisateurs totaux')} value={stats.totalUsers} color="bg-[#1554f7]" />
                                    <StatCard icon={Briefcase} label={tr('وظائف نشطة', 'Active jobs', 'Offres actives')} value={stats.activeJobs} color="bg-[#0e41e3]" />
                                    <StatCard icon={FileText} label={tr('عقود نشطة', 'Active contracts', 'Contrats actifs')} value={stats.activeContracts} color="bg-[#9333ea]" />
                                    <StatCard icon={DollarSign} label={tr('الإيرادات (د.ت)', 'Revenue (TND)', 'Revenus (TND)')} value={stats.totalRevenue} color="bg-[#f86545]" />
                                </div>
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <div className={panelClass}>
                                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-cyan-500" />{tr('نشاط اليوم', 'Today activity', 'Activite du jour')}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2"><UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-300" /><span className="text-emerald-800 dark:text-emerald-200 font-medium">{tr('تسجيلات جديدة', 'New signups', 'Nouvelles inscriptions')}</span></div>
                                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.todaySignups}</p>
                                            </div>
                                            <div className="p-4 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-300" /><span className="text-cyan-800 dark:text-cyan-200 font-medium">{tr('عقود جديدة', 'New contracts', 'Nouveaux contrats')}</span></div>
                                                <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{stats.todayContracts}</p>
                                            </div>
                                        </div>
                                    </div>
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
                                                            <p className="font-medium text-foreground">{v.profile?.full_name || tr('مستخدم', 'User', 'Utilisateur')}</p>
                                                            <p className="text-sm text-muted">{new Date(v.submitted_at).toLocaleString(locale)}</p>
                                                        </div>
                                                        <Button variant="outline" size="sm" onClick={() => setActiveTab('verifications')}>{tr('مراجعة', 'Review', 'Verifier')}</Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={panelClass}>
                                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Flag className="w-5 h-5 text-red-600" />{tr('البلاغات', 'Reports', 'Signalements')}</h3>
                                    <p className="text-sm text-muted text-center py-6">{tr('لا توجد بلاغات حالياً', 'No reports for now', 'Aucun signalement pour le moment')}</p>
                                </div>
                            </div>
                        )}

                        {/* ── Delegated tabs ── */}
                        {activeTab === 'users' && <UsersTab />}
                        {activeTab === 'jobs' && <JobsTab />}
                        {activeTab === 'verifications' && <VerificationsTab />}

                        {/* ── Payments ── */}
                        {activeTab === 'payments' && (
                            <div className="space-y-6">
                                <div className={panelClass}>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-foreground flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-yellow-600" />
                                            {tr('المدفوعات المعلقة (أكثر من ساعة)', 'Stuck payments (older than 1 hour)', 'Paiements bloques (plus d une heure)')}
                                        </h3>
                                        <Button variant="outline" size="sm" onClick={() => { setLoadingPayments(true); getStuckTransactions().then(setStuckPayments).finally(() => setLoadingPayments(false)); }}>
                                            <RefreshCw className={`w-4 h-4 ml-1 ${loadingPayments ? 'animate-spin' : ''}`} />{tr('تحديث', 'Refresh', 'Actualiser')}
                                        </Button>
                                    </div>
                                    {loadingPayments ? (
                                        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" /><p className="text-muted">{tr('جاري التحميل...', 'Loading...', 'Chargement...')}</p></div>
                                    ) : stuckPayments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                            <p className="text-foreground font-medium">{tr('لا توجد مدفوعات معلقة', 'No stuck payments', 'Aucun paiement bloque')}</p>
                                            <p className="text-sm text-muted">{tr('جميع المعاملات تمت بنجاح', 'All transactions completed successfully', 'Toutes les transactions ont reussi')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {stuckPayments.map(tx => (
                                                <div key={tx.id} className="flex items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-xl">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs rounded-full">{tx.type}</span>
                                                            <span className="font-medium text-foreground">{tx.amount} د.ت</span>
                                                        </div>
                                                        <p className="text-sm text-muted">ID: {tx.id.slice(0, 8)}... • {new Date(tx.created_at).toLocaleString(locale)}</p>
                                                    </div>
                                                    <Button variant="primary" size="sm" disabled={retryingId === tx.id} onClick={() => handleRetryPayment(tx.id)}>
                                                        {retryingId === tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 ml-1" />{tr('إعادة المحاولة', 'Retry', 'Reessayer')}</>}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Disputes ── */}
                        {activeTab === 'disputes' && (
                            <div className="space-y-6">
                                <div className={panelClass}>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-foreground flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                            {tr('نزاعات مفتوحة', 'Open disputes', 'Litiges ouverts')}
                                            {disputes.length > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-sm">{disputes.length}</span>}
                                        </h3>
                                        <Button variant="outline" size="sm" onClick={fetchDisputes}>
                                            <RefreshCw className={`w-4 h-4 ml-1 ${loadingDisputes ? 'animate-spin' : ''}`} />{tr('تحديث', 'Refresh', 'Actualiser')}
                                        </Button>
                                    </div>
                                    {loadingDisputes ? (
                                        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" /><p className="text-muted">{tr('جاري التحميل...', 'Loading...', 'Chargement...')}</p></div>
                                    ) : disputes.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                            <p className="text-foreground font-medium">{tr('لا توجد نزاعات مفتوحة', 'No open disputes', 'Aucun litige ouvert')}</p>
                                            <p className="text-sm text-muted">{tr('كل النزاعات تمت معالجتها', 'All disputes are handled', 'Tous les litiges sont traites')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {disputes.map(d => (
                                                <div key={d.id} className="border border-red-200 dark:border-red-500/30 rounded-xl overflow-hidden">
                                                    <div className="p-4 bg-red-50/85 dark:bg-red-500/10">
                                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-foreground">{(d.contract?.job as any)?.title || tr('عقد', 'Contract', 'Contrat')}</p>
                                                                <p className="text-sm text-muted">{tr('فتحه', 'Opened by', 'Ouvert par')}: {d.opener?.full_name} — {d.opener?.email}</p>
                                                                <p className="text-xs text-muted mt-1">{new Date(d.opened_at).toLocaleString(locale)}</p>
                                                                <div className="mt-3 p-3 bg-white/85 dark:bg-slate-900/55 rounded-lg border border-red-100 dark:border-red-500/20">
                                                                    <p className="text-sm text-foreground"><strong>{tr('سبب النزاع', 'Dispute reason', 'Raison du litige')}:</strong> {d.reason}</p>
                                                                </div>
                                                                {d.contract?.amount && <p className="text-sm font-medium text-muted mt-2">{tr('مبلغ العقد', 'Contract amount', 'Montant du contrat')}: {d.contract.amount} د.ت</p>}
                                                            </div>
                                                            <div className="flex flex-col gap-2 shrink-0">
                                                                <Button size="sm" variant="outline" onClick={() => window.open(`/contracts/${d.contract_id}`, '_blank')}>
                                                                    <Eye className="w-4 h-4 ml-1" />{tr('عرض العقد', 'View contract', 'Voir le contrat')}
                                                                </Button>
                                                                <Button size="sm" variant="primary" disabled={resolvingId === d.id} onClick={() => handleResolveDispute(d.id, 'resolved_freelancer', tr('نزاع لصالح المستقل', 'Dispute resolved for freelancer', 'Litige resolu en faveur du freelance'))}>
                                                                    {resolvingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 ml-1" />}
                                                                    {tr('لصالح المستقل', 'For freelancer', 'Pour le freelance')}
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" disabled={resolvingId === d.id} onClick={() => handleResolveDispute(d.id, 'resolved_client', tr('نزاع لصالح العميل', 'Dispute resolved for client', 'Litige resolu en faveur du client'))}>
                                                                    <X className="w-4 h-4 ml-1" />{tr('لصالح العميل', 'For client', 'Pour le client')}
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="text-gray-500 hover:bg-gray-100" disabled={resolvingId === d.id} onClick={() => handleResolveDispute(d.id, 'cancelled', tr('إلغاء النزاع', 'Dispute cancelled', 'Litige annule'))}>
                                                                    {tr('إلغاء النزاع', 'Cancel dispute', 'Annuler le litige')}
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

                        {/* ── Reports ── */}
                        {activeTab === 'reports' && <ReportsTab />}

                        {/* ── Settings ── */}
                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                <div className={panelClass}>
                                    <h3 className="font-bold text-foreground mb-5 flex items-center gap-2"><Settings className="w-5 h-5 text-cyan-500" />{tr('إعدادات لوحة الإدارة', 'Admin dashboard settings', 'Parametres du tableau admin')}</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/55">
                                            <span className="text-sm font-medium text-foreground">{tr('التحديث التلقائي', 'Auto refresh', 'Actualisation automatique')}</span>
                                            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="h-5 w-5 accent-cyan-600" />
                                        </label>
                                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/55">
                                            <span className="text-sm font-medium text-foreground">{tr('فاصل التحديث', 'Refresh interval', 'Intervalle d actualisation')}</span>
                                            <select value={refreshIntervalSec} onChange={e => setRefreshIntervalSec(Number(e.target.value))} className={selectClass}>
                                                <option value={20}>20 {tr('ثانية', 'seconds', 'secondes')}</option>
                                                <option value={30}>30 {tr('ثانية', 'seconds', 'secondes')}</option>
                                                <option value={45}>45 {tr('ثانية', 'seconds', 'secondes')}</option>
                                                <option value={60}>60 {tr('ثانية', 'seconds', 'secondes')}</option>
                                            </select>
                                        </label>
                                    </div>
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <Button variant="primary" onClick={refreshAllData}><RefreshCw className="w-4 h-4 ml-1" />{tr('مزامنة جميع الأقسام', 'Sync all sections', 'Synchroniser toutes les sections')}</Button>
                                        <Button variant="outline" onClick={() => refreshActiveTabData(activeTab)}>{tr('تحديث القسم الحالي', 'Refresh current section', 'Actualiser la section actuelle')}</Button>
                                    </div>
                                </div>
                                <div className={panelClass}>
                                    <h4 className="font-bold text-foreground mb-3">{tr('صحة النظام', 'System health', 'Sante du systeme')}</h4>
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/55">
                                        <span className="text-muted">{tr('حالة المراقبة', 'Monitoring status', 'Etat de supervision')}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${systemHealthLevel === 'stable' ? 'bg-emerald-100 text-emerald-700' : systemHealthLevel === 'moderate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                            {systemHealthLevel === 'stable' ? tr('مستقر', 'Stable', 'Stable') : systemHealthLevel === 'moderate' ? tr('متوسط', 'Moderate', 'Modere') : tr('يتطلب تدخل', 'Needs attention', 'Necessite une intervention')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={confirmAction.isOpen} onClose={closeConfirm} title={confirmAction.title} size="md">
                <div className="space-y-6 pt-2">
                    <p className="text-muted leading-relaxed font-medium">{confirmAction.message}</p>
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/10 mt-6">
                        <Button variant="ghost" className="text-muted hover:bg-gray-100 dark:hover:bg-white/5" onClick={closeConfirm}>{tr('إلغاء', 'Cancel', 'Annuler')}</Button>
                        <Button
                            variant={confirmAction.actionType === 'danger' ? 'danger' : 'primary'}
                            className={confirmAction.actionType === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent shadow shadow-amber-600/30' : ''}
                            onClick={() => { closeConfirm(); confirmAction.onConfirm(); }}
                        >{tr('تأكيد', 'Confirm', 'Confirmer')}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
