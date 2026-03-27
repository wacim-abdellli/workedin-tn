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
    ShieldOff,
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
import Modal from '../components/ui/Modal';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { getStuckTransactions, reconcilePayment, type StuckTransaction } from '../services/payments';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { supabaseWithRetry } from '../lib/supabaseWithRetry';
import { useAuth } from '../contexts/AuthContext';
import { hasAdminAccess } from '../lib/adminAccess';
import { useTranslation } from '../i18n';

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ACTIVE_TAB_KEY = 'admin_active_tab';
const IDENTITY_DOCS_BUCKET = 'identity-documents';
const FALLBACK_IDENTITY_BUCKETS = ['identity-documents', 'identity_documents', 'verification-documents', 'verification_documents'];
const ENV_IDENTITY_BUCKETS = (import.meta.env.VITE_IDENTITY_DOCS_BUCKETS as string | undefined)
    ?.split(',')
    .map(v => v.trim())
    .filter(Boolean) ?? [];
const IDENTITY_BUCKET_CANDIDATES = Array.from(new Set([IDENTITY_DOCS_BUCKET, ...ENV_IDENTITY_BUCKETS, ...FALLBACK_IDENTITY_BUCKETS]));

async function countWithRetry(
    queryFn: () => PromiseLike<{ count: number | null; error: unknown; status?: number }>
) {
    const { count } = await supabaseWithRetry(queryFn);
    return count ?? 0;
}

type ParsedStorageRef =
    | { kind: 'external'; url: string }
    | { kind: 'storage'; bucket: string | null; path: string }
    | null;

function parseStorageReference(input?: string | null): ParsedStorageRef {
    if (!input) return null;
    const trimmed = String(input).trim();
    if (!trimmed) return null;

    const parseStoragePath = (rawPath: string): { bucket: string; path: string } | null => {
        const cleanPath = rawPath.replace(/^\/+/, '').split('?')[0];
        const storagePrefixes = [
            'storage/v1/object/public/',
            'storage/v1/object/sign/',
            'storage/v1/object/',
        ];

        for (const prefix of storagePrefixes) {
            if (cleanPath.startsWith(prefix)) {
                const rest = cleanPath.slice(prefix.length);
                const slashIndex = rest.indexOf('/');
                if (slashIndex <= 0) return null;
                return {
                    bucket: rest.slice(0, slashIndex),
                    path: rest.slice(slashIndex + 1),
                };
            }
        }

        return null;
    };

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            const supabaseHost = new URL(SUPA_URL).host;
            if (parsed.host !== supabaseHost) {
                return { kind: 'external', url: trimmed };
            }

            const parsedStorage = parseStoragePath(parsed.pathname);
            if (parsedStorage) {
                return { kind: 'storage', bucket: parsedStorage.bucket, path: parsedStorage.path };
            }

            return { kind: 'external', url: trimmed };
        } catch {
            return { kind: 'external', url: trimmed };
        }
    }

    const parsedStorage = parseStoragePath(trimmed);
    if (parsedStorage) {
        return { kind: 'storage', bucket: parsedStorage.bucket, path: parsedStorage.path };
    }

    const clean = trimmed.replace(/^\/+/, '');
    const bucketMatch = IDENTITY_BUCKET_CANDIDATES.find(bucket => clean.startsWith(`${bucket}/`));
    if (bucketMatch) {
        return {
            kind: 'storage',
            bucket: bucketMatch,
            path: clean.slice(bucketMatch.length + 1),
        };
    }

    return { kind: 'storage', bucket: null, path: clean };
}

async function resolveIdentityDocumentUrl(url?: string | null): Promise<string | null> {
    const parsed = parseStorageReference(url);
    if (!parsed) return null;

    if (parsed.kind === 'external') {
        return parsed.url;
    }

    const candidates = parsed.bucket
        ? [parsed.bucket, ...IDENTITY_BUCKET_CANDIDATES.filter(b => b !== parsed.bucket)]
        : IDENTITY_BUCKET_CANDIDATES;

    for (const bucket of candidates) {
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .createSignedUrl(parsed.path, 60 * 60);

            if (!error && data?.signedUrl) {
                return data.signedUrl;
            }
        } catch {
            // Try next bucket candidate.
        }
    }

    const fallbackBucket = parsed.bucket || IDENTITY_DOCS_BUCKET;
    return `${SUPA_URL}/storage/v1/object/public/${fallbackBucket}/${parsed.path}`;
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
    const { user, profile } = useAuth();
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

    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        actionType: 'danger' | 'warning' | 'primary';
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', actionType: 'primary', onConfirm: () => {} });
    const closeConfirm = () => setConfirmAction(prev => ({ ...prev, isOpen: false }));

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
                countWithRetry(() => supabase.from('profiles').select('id', { count: 'exact', head: true })),
                countWithRetry(() =>
                    supabase
                        .from('jobs')
                        .select('id', { count: 'exact', head: true })
                        .in('status', ['open', 'in_progress'])
                ),
                countWithRetry(() =>
                    supabase
                        .from('contracts')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'active')
                ),
                countWithRetry(() =>
                    supabase
                        .from('profiles')
                        .select('id', { count: 'exact', head: true })
                        .gte('created_at', today)
                ),
                countWithRetry(() =>
                    supabase
                        .from('contracts')
                        .select('id', { count: 'exact', head: true })
                        .gte('created_at', today)
                ),
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
            const { data } = await supabaseWithRetry(() =>
                supabase
                    .from('profiles')
                    .select('id,full_name,email,user_type,active_mode,cin_verified,is_admin,created_at')
                    .order('created_at', { ascending: false })
                    .limit(100)
            );
            setRealUsers((data || []).map((u: any) => ({
                id: u.id,
                name: u.full_name || tr('مستخدم', 'User', 'Utilisateur'),
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
            showToast(tr('فشل تحميل المستخدمين', 'Failed to load users', 'Echec du chargement des utilisateurs'), 'error');
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
                showToast(tr('حدث خطأ أثناء التحديث', 'An error occurred while refreshing', 'Une erreur est survenue pendant l actualisation'), 'error');
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
            showToast(tr('تم تحديث جميع بيانات لوحة الإدارة', 'All admin dashboard data has been refreshed', 'Toutes les donnees du tableau admin ont ete actualisees'), 'success');
        } catch (error) {
            console.error('Refresh all error:', error);
            showToast(tr('تعذر تحديث بعض البيانات', 'Some sections could not be refreshed', 'Certaines sections n ont pas pu etre actualisees'), 'warning');
        } finally {
            setLoadingPayments(false);
        }
    };

    const handleToggleUserMode = async (user: AdminUser) => {
        const nextMode: 'client' | 'freelancer' = user.active_mode === 'freelancer' ? 'client' : 'freelancer';
        setUserActionLoadingId(user.id);
        try {
            await supabaseWithRetry(() =>
                supabase
                    .from('profiles')
                    .update({
                        active_mode: nextMode,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', user.id)
            );

            setRealUsers(prev => prev.map(u => (u.id === user.id ? { ...u, active_mode: nextMode } : u)));
            setSelectedUser(prev => (prev?.id === user.id ? { ...prev, active_mode: nextMode } : prev));
            showToast(
                tr('تم تحويل وضع المستخدم إلى', 'User mode switched to', 'Mode utilisateur bascule vers') +
                ` ${nextMode === 'freelancer' ? tr('مستقل', 'Freelancer', 'Freelance') : tr('عميل', 'Client', 'Client')}`,
                'success'
            );
        } catch (error) {
            console.error('Toggle user mode error:', error);
            showToast(tr('فشل تغيير وضع المستخدم', 'Failed to switch user mode', 'Echec du changement de mode utilisateur'), 'error');
        } finally {
            setUserActionLoadingId(null);
        }
    };

    const executeDeleteUser = async (user: AdminUser) => {
        setUserActionLoadingId(user.id);
        try {
            await supabaseWithRetry(() =>
                supabase
                    .from('profiles')
                    .delete()
                    .eq('id', user.id)
            );
            setRealUsers(prev => prev.filter(u => u.id !== user.id));
            setSelectedUser(prev => (prev?.id === user.id ? null : prev));
            showToast(tr('تم حذف المستخدم بنجاح', 'User deleted successfully', 'Utilisateur supprime avec succes'), 'success');
        } catch (error) {
            console.error('Delete user error:', error);
            showToast(tr('تعذر حذف المستخدم', 'Unable to delete user', 'Impossible de supprimer l utilisateur'), 'error');
        } finally {
            setUserActionLoadingId(null);
        }
    };

    const handleDeleteUser = (user: AdminUser) => {
        setConfirmAction({
            isOpen: true,
            title: tr('حذف المستخدم', 'Delete User', 'Supprimer l\'utilisateur'),
            message: `${tr('هل تريد حذف المستخدم', 'Do you want to delete user', 'Voulez-vous supprimer l utilisateur')} ${user.name}? ${tr('هذا الإجراء لا يمكن التراجع عنه.', 'This action cannot be undone.', 'Cette action est irreversible.')}`,
            actionType: 'danger',
            onConfirm: () => executeDeleteUser(user)
        });
    };

    const executeRevokeVerification = async (user: AdminUser) => {
        setUserActionLoadingId(user.id);
        try {
            await Promise.all([
                supabaseWithRetry(() =>
                    supabase
                        .from('profiles')
                        .update({
                            cin_verified: false,
                            cin_submitted: false,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', user.id)
                ),
                supabaseWithRetry(() =>
                    supabase
                        .from('freelancer_profiles')
                        .update({ cin_verified: false })
                        .eq('id', user.id)
                ).catch(() => null),
                supabaseWithRetry(() =>
                    supabase
                        .from('identity_verifications')
                        .delete()
                        .eq('user_id', user.id)
                ).catch(() => null)
            ]);

            setRealUsers(prev => prev.map(u => (u.id === user.id ? { ...u, cin_verified: false } : u)));
            setSelectedUser(prev => (prev?.id === user.id ? { ...prev, cin_verified: false } : prev));
            showToast(tr('تم إلغاء التوثيق بنجاح', 'Verification revoked successfully', 'Vérification révoquée avec succès'), 'success');
        } catch (error) {
            console.error('Revoke verification error:', error);
            showToast(tr('تعذر إلغاء التوثيق', 'Unable to revoke verification', 'Impossible de révoquer la vérification'), 'error');
        } finally {
            setUserActionLoadingId(null);
        }
    };

    const handleRevokeVerification = (user: AdminUser) => {
        setConfirmAction({
            isOpen: true,
            title: tr('إلغاء التوثيق', 'Revoke Verification', 'Révoquer la vérification'),
            message: tr('هل أنت متأكد من إلغاء توثيق هذا المستخدم؟ سيحتاج لتقديم هويته مجدداً.', 'Are you sure you want to revoke verification for this user? They will need to submit their ID again.', 'Êtes-vous sûr de vouloir révoquer la vérification de cet utilisateur ?'),
            actionType: 'warning',
            onConfirm: () => executeRevokeVerification(user)
        });
    };

    const fetchJobs = async () => {
        setLoadingJobs(true);
        try {
            try {
                const { data } = await supabaseWithRetry(() =>
                    supabase
                        .from('jobs')
                        .select('id,title,status,budget_min,budget_max,hourly_rate,created_at,client:profiles!client_id(full_name,email)')
                        .order('created_at', { ascending: false })
                        .limit(100)
                );
                setJobs((data || []) as unknown as AdminJob[]);
            } catch {
                // Fallback for older schema variants that expose a single budget column.
                const { data: legacy } = await supabaseWithRetry(() =>
                    supabase
                        .from('jobs')
                        .select('id,title,status,budget,created_at,client:profiles!client_id(full_name,email)')
                        .order('created_at', { ascending: false })
                        .limit(100)
                );
                const normalized = (legacy || []).map((j: any) => ({
                    ...j,
                    budget_min: typeof j.budget === 'number' ? j.budget : null,
                    budget_max: null,
                    hourly_rate: null,
                })) as unknown as AdminJob[];
                setJobs(normalized);
            }
        } catch (err) {
            console.error('Jobs fetch error:', err);
            showToast(tr('حدث خطأ أثناء تحميل الوظائف', 'An error occurred while loading jobs', 'Une erreur est survenue lors du chargement des offres'), 'error');
        } finally {
            setLoadingJobs(false);
        }
    };

    const executeDeleteJob = async (id: string) => {
        try {
            await supabaseWithRetry(() =>
                supabase
                    .from('jobs')
                    .delete()
                    .eq('id', id)
            );
            showToast(tr('تم حذف الوظيفة بنجاح', 'Job deleted successfully', 'Offre supprimee avec succes'), 'success');
            setJobs(prev => prev.filter(j => j.id !== id));
        } catch (error) {
            console.error('Error deleting job:', error);
            showToast(tr('حدث خطأ أثناء الحذف', 'An error occurred while deleting', 'Une erreur est survenue lors de la suppression'), 'error');
        }
    };

    const handleDeleteJob = (id: string) => {
        setConfirmAction({
            isOpen: true,
            title: tr('حذف الوظيفة', 'Delete Job', 'Supprimer l\'offre'),
            message: tr('هل أنت متأكد من حذف هذه الوظيفة؟', 'Are you sure you want to delete this job?', 'Voulez-vous vraiment supprimer cette offre ?'),
            actionType: 'danger',
            onConfirm: () => executeDeleteJob(id)
        });
    };

    const fetchVerifications = async () => {
        setLoadingVerifications(true);
        try {
            try {
                const { data } = await supabaseWithRetry(() =>
                    supabase
                        .from('identity_verifications')
                        .select('id,user_id,cin_front_url,cin_back_url,selfie_url,status,submitted_at,profile:profiles!identity_verifications_user_id_fkey(full_name,email)')
                        .eq('status', 'pending')
                        .order('submitted_at', { ascending: true })
                );
                const normalized = await Promise.all((data || []).map(async (item: any) => ({
                    id: item.id,
                    user_id: item.user_id,
                    document_type: 'CIN',
                    front_image_url: await resolveIdentityDocumentUrl(item.cin_front_url),
                    back_image_url: await resolveIdentityDocumentUrl(item.cin_back_url),
                    selfie_url: await resolveIdentityDocumentUrl(item.selfie_url),
                    status: item.status,
                    submitted_at: item.submitted_at,
                    profile: item.profile ?? null,
                }))) as IdentityVerification[];
                setVerifications(normalized);
            } catch {
                // Fallback for earlier/alternate schema naming.
                const { data: legacy } = await supabaseWithRetry(() =>
                    supabase
                        .from('identity_verifications')
                        .select('id,user_id,document_type,front_image_url,back_image_url,status,submitted_at,profile:profiles!identity_verifications_user_id_fkey(full_name,email)')
                        .eq('status', 'pending')
                        .order('submitted_at', { ascending: true })
                );
                const normalized = await Promise.all((legacy || []).map(async (item: any) => ({
                    id: item.id,
                    user_id: item.user_id,
                    document_type: item.document_type || 'CIN',
                    front_image_url: await resolveIdentityDocumentUrl(item.front_image_url),
                    back_image_url: await resolveIdentityDocumentUrl(item.back_image_url),
                    selfie_url: null,
                    status: item.status,
                    submitted_at: item.submitted_at,
                    profile: item.profile ?? null,
                }))) as IdentityVerification[];
                setVerifications(normalized);
            }
        } catch (err) {
            console.error('Failed to fetch verifications:', err);
            showToast(tr('فشل تحميل طلبات التحقق', 'Failed to load verification requests', 'Echec du chargement des demandes de verification'), 'error');
        } finally {
            setLoadingVerifications(false);
        }
    };

    const fetchDisputes = async () => {
        setLoadingDisputes(true);
        try {
            const { data } = await supabaseWithRetry(() =>
                supabase
                    .from('disputes')
                    .select('id,contract_id,opened_at,reason,status,contract:contracts!disputes_contract_id_fkey(id,amount,job:jobs(title)),opener:profiles!disputes_opened_by_fkey(full_name,email)')
                    .eq('status', 'open')
                    .order('opened_at', { ascending: true })
            );
            setDisputes((data || []) as unknown as DisputeRecord[]);
        } catch (err) {
            console.error('Failed to fetch disputes:', err);
            showToast(tr('فشل تحميل النزاعات', 'Failed to load disputes', 'Echec du chargement des litiges'), 'error');
        } finally {
            setLoadingDisputes(false);
        }
    };

    const handleResolveDispute = async (disputeId: string, resolution: string, note?: string) => {
        setResolvingId(disputeId);
        try {
            await supabaseWithRetry(() =>
                supabase.rpc('resolve_dispute', {
                    p_dispute_id: disputeId,
                    p_resolution: resolution,
                    p_admin_note: note || null,
                })
            );
            setDisputes(prev => prev.filter(d => d.id !== disputeId));
            showToast(tr('تم حل النزاع بنجاح ✓', 'Dispute resolved successfully ✓', 'Litige resolu avec succes ✓'), 'success');
        } catch (err) {
            console.error('Resolve dispute error:', err);
            showToast(tr('فشل حل النزاع', 'Failed to resolve dispute', 'Echec de la resolution du litige'), 'error');
        } finally {
            setResolvingId(null);
        }
    };

    const handleVerificationAction = async (id: string, action: 'approved' | 'rejected') => {
        setActioningId(id);
        try {
            const { data: updatedRows } = await supabaseWithRetry(() =>
                supabase
                    .from('identity_verifications')
                    .update({
                        status: action,
                        reviewed_at: new Date().toISOString(),
                    })
                    .eq('id', id)
                    .select('id,user_id')
            );

            if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
                throw new Error(tr('لم يتم تحديث طلب التحقق. قد تكون الصلاحيات غير كافية.', 'Verification request was not updated. Permissions may be insufficient.', 'La demande de verification n a pas ete mise a jour. Les permissions peuvent etre insuffisantes.'));
            }

            const verification = verifications.find(v => v.id === id);
            const verificationUserId = verification?.user_id || updatedRows[0]?.user_id;

            if (verificationUserId) {
                // Resolve legacy duplicate pending rows for the same user in one action.
                await supabaseWithRetry(() =>
                    supabase
                        .from('identity_verifications')
                        .update({
                            status: action,
                            reviewed_at: new Date().toISOString(),
                        })
                        .eq('user_id', verificationUserId)
                        .eq('status', 'pending')
                        .select('id')
                ).catch(() => null);

                if (action === 'approved') {
                    await Promise.all([
                        supabaseWithRetry(() =>
                            supabase
                                .from('profiles')
                                .update({
                                    cin_verified: true,
                                    cin_submitted: false,
                                })
                                .eq('id', verificationUserId)
                        ),
                        supabaseWithRetry(() =>
                            supabase
                                .from('freelancer_profiles')
                                .update({ cin_verified: true })
                                .eq('id', verificationUserId)
                        ).catch(() => null),
                    ]);
                } else {
                    await supabaseWithRetry(() =>
                        supabase
                            .from('profiles')
                            .update({
                                cin_verified: false,
                                cin_submitted: false,
                            })
                            .eq('id', verificationUserId)
                    );
                }
            }

            setVerifications(prev => prev.filter(v => v.id !== id));
            showToast(
                action === 'approved'
                    ? tr('تم قبول التحقق ✓', 'Verification approved ✓', 'Verification approuvee ✓')
                    : tr('تم رفض التحقق', 'Verification rejected', 'Verification refusee'),
                action === 'approved' ? 'success' : 'warning'
            );
        } catch (err) {
            console.error('Verification action error:', err);
            showToast(tr('فشل تنفيذ الإجراء', 'Action failed', 'Echec de l action'), 'error');
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
        return tr('غير محدد', 'Not specified', 'Non specifie');
    };

    const unresolvedSignals = verifications.length + disputes.length + stuckPayments.length;
    const systemHealthLevel = unresolvedSignals === 0 ? 'stable' : unresolvedSignals <= 5 ? 'moderate' : 'critical';
    const hasDbAdminPrivileges = profile?.is_admin === true;
    const hasUiAdminAccess = hasAdminAccess(user, profile);
    const showRlsAccessWarning = hasUiAdminAccess && !hasDbAdminPrivileges;

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
                {showRlsAccessWarning ? (
                    <div className="mb-6 rounded-2xl border border-amber-300/50 bg-amber-50/90 p-4 text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                            <div className="space-y-1 text-sm">
                                <p className="font-semibold">
                                    {tr('وصول لوحة الإدارة مفعل، لكن صلاحيات قاعدة البيانات غير مكتملة.', 'Admin panel access is enabled, but database admin privileges are not fully enabled.', 'Acces au tableau admin actif, mais les privileges base de donnees ne sont pas complets.')}
                                </p>
                                <p>
                                    {tr('قد تظهر أقسام مثل طلبات التحقق فارغة بسبب سياسات RLS. عيّن حسابك كمشرف في جدول profiles (is_admin = true).', 'Sections like verification requests may appear empty due to RLS. Mark this account as admin in the profiles table (is_admin = true).', 'Des sections comme les verifications peuvent sembler vides a cause du RLS. Marquez ce compte admin dans la table profiles (is_admin = true).')}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}

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
                                                            <p className="font-medium text-foreground">{v.profile?.full_name || tr('مستخدم', 'User', 'Utilisateur')}</p>
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
                                        {tr('البلاغات', 'Reports', 'Signalements')}
                                    </h3>
                                    <p className="text-sm text-muted text-center py-6">{tr('لا توجد بلاغات حالياً', 'No reports for now', 'Aucun signalement pour le moment')}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <ErrorBoundary
                                titleAr="فشل تحميل قسم المستخدمين — حاول التحديث"
                                titleFr="Échec du chargement des utilisateurs — essayez de rafraîchir"
                                titleEn="Failed to load Users tab — try refreshing"
                            >
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
                                                                {user.cin_verified && (
                                                                    <button
                                                                        disabled={userActionLoadingId === user.id}
                                                                        onClick={() => handleRevokeVerification(user)}
                                                                        title={tr('إلغاء التوثيق', 'Revoke Verification', 'Révoquer la vérification')}
                                                                        className={`${iconActionClass} hover:text-yellow-600 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 disabled:opacity-50`}
                                                                    >
                                                                        <ShieldOff className="w-4 h-4" />
                                                                    </button>
                                                                )}
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
                                                {user.cin_verified && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-amber-600 hover:bg-amber-50 flex-1 justify-center"
                                                        disabled={userActionLoadingId === user.id}
                                                        onClick={() => handleRevokeVerification(user)}
                                                    >
                                                        <ShieldOff className="w-4 h-4 ml-1" />
                                                        {tr('إلغاء', 'Revoke', 'Révoquer')}
                                                    </Button>
                                                )}
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
                            </ErrorBoundary>
                        )}

                        {activeTab === 'verifications' && (
                            <ErrorBoundary 
                                titleAr="فشل تحميل قسم طلبات التحقق — حاول التحديث"
                                titleFr="Échec du chargement des vérifications — essayez de rafraîchir"
                                titleEn="Failed to load Verifications tab — try refreshing"
                            >
                            <div className="space-y-6">
                                <div className={panelClass}>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-foreground flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-yellow-600" />
                                            {tr('طلبات التحقق من الهوية', 'Identity verification requests', 'Demandes de verification d identite')}
                                            {verifications.length > 0 && (
                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                                    {verifications.length} {tr('معلق', 'pending', 'en attente')}
                                                </span>
                                            )}
                                        </h3>
                                        <Button variant="outline" size="sm" onClick={fetchVerifications}>
                                            <RefreshCw className={`w-4 h-4 ml-1 ${loadingVerifications ? 'animate-spin' : ''}`} />
                                            {tr('تحديث', 'Refresh', 'Actualiser')}
                                        </Button>
                                    </div>

                                    {loadingVerifications ? (
                                        <div className="text-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                                            <p className="text-muted">{tr('جاري التحميل...', 'Loading...', 'Chargement...')}</p>
                                        </div>
                                    ) : verifications.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                            <p className="text-foreground font-medium">{tr('لا توجد طلبات معلقة', 'No pending requests', 'Aucune demande en attente')}</p>
                                            <p className="text-sm text-muted">{tr('جميع طلبات التحقق تمت معالجتها', 'All verification requests are processed', 'Toutes les demandes de verification sont traitees')}</p>
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
                                                                <p className="font-bold text-foreground">{v.profile?.full_name || tr('مستخدم', 'User', 'Utilisateur')}</p>
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
                                                                {expandedDocId === v.id
                                                                    ? tr('إخفاء', 'Hide', 'Masquer')
                                                                    : tr('عرض المستندات', 'View documents', 'Afficher les documents')}
                                                            </Button>
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                disabled={actioningId === v.id}
                                                                onClick={() => handleVerificationAction(v.id, 'approved')}
                                                            >
                                                                {actioningId === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 ml-1" />}
                                                                {tr('قبول', 'Approve', 'Approuver')}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600 hover:bg-red-50"
                                                                disabled={actioningId === v.id}
                                                                onClick={() => handleVerificationAction(v.id, 'rejected')}
                                                            >
                                                                <X className="w-4 h-4 ml-1" />
                                                                {tr('رفض', 'Reject', 'Refuser')}
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Document Images — collapsible */}
                                                    {expandedDocId === v.id && (
                                                        <div className="p-4 bg-white/70 dark:bg-slate-900/50 border-t border-gray-100 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-muted mb-2">{tr('الوجه الأمامي', 'Front side', 'Recto')}</p>
                                                                {v.front_image_url ? (
                                                                    <a href={v.front_image_url} target="_blank" rel="noopener noreferrer">
                                                                        <img
                                                                            src={v.front_image_url}
                                                                            alt={tr('وجه أمامي', 'Front side', 'Recto')}
                                                                            className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-white/10 hover:opacity-90 transition"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <div className="w-full rounded-lg aspect-video bg-gray-100 dark:bg-white/10 flex items-center justify-center text-muted text-sm">{tr('لا توجد صورة', 'No image', 'Aucune image')}</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-muted mb-2">{tr('الوجه الخلفي', 'Back side', 'Verso')}</p>
                                                                {v.back_image_url ? (
                                                                    <a href={v.back_image_url} target="_blank" rel="noopener noreferrer">
                                                                        <img
                                                                            src={v.back_image_url}
                                                                            alt={tr('وجه خلفي', 'Back side', 'Verso')}
                                                                            className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-white/10 hover:opacity-90 transition"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <div className="w-full rounded-lg aspect-video bg-gray-100 dark:bg-white/10 flex items-center justify-center text-muted text-sm">{tr('لا توجد صورة', 'No image', 'Aucune image')}</div>
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
                            </ErrorBoundary>
                        )}

                        {activeTab === 'payments' && (
                            <div className="space-y-6">
                                <div className={panelClass}>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-foreground flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-yellow-600" />
                                            {tr('المدفوعات المعلقة (أكثر من ساعة)', 'Stuck payments (older than 1 hour)', 'Paiements bloques (plus d une heure)')}
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
                                            {tr('تحديث', 'Refresh', 'Actualiser')}
                                        </Button>
                                    </div>

                                    {loadingPayments ? (
                                        <div className="text-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                                            <p className="text-muted">{tr('جاري التحميل...', 'Loading...', 'Chargement...')}</p>
                                        </div>
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
                                                                {tr('إعادة المحاولة', 'Retry', 'Reessayer')}
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
                                            {tr('نزاعات مفتوحة', 'Open disputes', 'Litiges ouverts')}
                                            {disputes.length > 0 && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-sm">
                                                    {disputes.length}
                                                </span>
                                            )}
                                        </h3>
                                        <Button variant="outline" size="sm" onClick={fetchDisputes}>
                                            <RefreshCw className={`w-4 h-4 ml-1 ${loadingDisputes ? 'animate-spin' : ''}`} />
                                            {tr('تحديث', 'Refresh', 'Actualiser')}
                                        </Button>
                                    </div>

                                    {loadingDisputes ? (
                                        <div className="text-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                                            <p className="text-muted">{tr('جاري التحميل...', 'Loading...', 'Chargement...')}</p>
                                        </div>
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
                                                                <p className="font-bold text-foreground">
                                                                    {(d.contract?.job as any)?.title || tr('عقد', 'Contract', 'Contrat')}
                                                                </p>
                                                                <p className="text-sm text-muted">{tr('فتحه', 'Opened by', 'Ouvert par')}: {d.opener?.full_name} — {d.opener?.email}</p>
                                                                <p className="text-xs text-muted mt-1">{new Date(d.opened_at).toLocaleString(locale)}</p>
                                                                <div className="mt-3 p-3 bg-white/85 dark:bg-slate-900/55 rounded-lg border border-red-100 dark:border-red-500/20">
                                                                    <p className="text-sm text-foreground"><strong>{tr('سبب النزاع', 'Dispute reason', 'Raison du litige')}:</strong> {d.reason}</p>
                                                                </div>
                                                                {d.contract?.amount && (
                                                                    <p className="text-sm font-medium text-muted mt-2">{tr('مبلغ العقد', 'Contract amount', 'Montant du contrat')}: {d.contract.amount} د.ت</p>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-2 shrink-0">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => window.open(`/contracts/${d.contract_id}`, '_blank')}
                                                                >
                                                                    <Eye className="w-4 h-4 ml-1" />
                                                                    {tr('عرض العقد', 'View contract', 'Voir le contrat')}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="primary"
                                                                    disabled={resolvingId === d.id}
                                                                    onClick={() => handleResolveDispute(d.id, 'resolved_freelancer', tr('نزاع لصالح المستقل', 'Dispute resolved for freelancer', 'Litige resolu en faveur du freelance'))}
                                                                >
                                                                    {resolvingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 ml-1" />}
                                                                    {tr('لصالح المستقل', 'For freelancer', 'Pour le freelance')}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-blue-600 hover:bg-blue-50"
                                                                    disabled={resolvingId === d.id}
                                                                    onClick={() => handleResolveDispute(d.id, 'resolved_client', tr('نزاع لصالح العميل', 'Dispute resolved for client', 'Litige resolu en faveur du client'))}
                                                                >
                                                                    <X className="w-4 h-4 ml-1" />
                                                                    {tr('لصالح العميل', 'For client', 'Pour le client')}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-gray-500 hover:bg-gray-100"
                                                                    disabled={resolvingId === d.id}
                                                                    onClick={() => handleResolveDispute(d.id, 'cancelled', tr('إلغاء النزاع', 'Dispute cancelled', 'Litige annule'))}
                                                                >
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

                        {activeTab === 'jobs' && (
                            <ErrorBoundary 
                                titleAr="فشل تحميل قسم الوظائف — حاول التحديث"
                                titleFr="Échec du chargement des offres — essayez de rafraîchir"
                                titleEn="Failed to load Jobs tab — try refreshing"
                            >
                            <div className="space-y-6">
                                <div className={panelClass}>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex-1 relative">
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={jobSearch}
                                                onChange={(e) => setJobSearch(e.target.value)}
                                                placeholder={tr('بحث في الوظائف...', 'Search jobs...', 'Rechercher des offres...')}
                                                className={inputClass}
                                            />
                                        </div>
                                        <select
                                            value={jobFilter}
                                            onChange={(e) => setJobFilter(e.target.value as any)}
                                            className={selectClass}
                                        >
                                            <option value="all">{tr('جميع الحالات', 'All statuses', 'Tous les statuts')}</option>
                                            <option value="open">{tr('مفتوحة', 'Open', 'Ouvertes')}</option>
                                            <option value="in_progress">{tr('قيد التنفيذ', 'In progress', 'En cours')}</option>
                                            <option value="completed">{tr('مكتملة', 'Completed', 'Terminees')}</option>
                                            <option value="cancelled">{tr('ملغاة', 'Cancelled', 'Annulees')}</option>
                                        </select>
                                    </div>
                                </div>

                                {loadingJobs ? (
                                    <div className={`${panelClass} text-center py-12`}>
                                        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                                        <p className="text-muted">{tr('جاري تحميل الوظائف...', 'Loading jobs...', 'Chargement des offres...')}</p>
                                    </div>
                                ) : (
                                    <div className={`${tableShellClass} block`}>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className={tableHeadClass}>
                                                    <tr>
                                                        <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">{tr('الوظيفة', 'Job', 'Offre')}</th>
                                                        <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">{tr('العميل', 'Client', 'Client')}</th>
                                                        <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">{tr('الميزانية', 'Budget', 'Budget')}</th>
                                                        <th className="px-6 py-4 text-right text-sm font-medium text-muted whitespace-nowrap">{tr('الحالة', 'Status', 'Statut')}</th>
                                                        <th className="px-6 py-4 text-center text-sm font-medium text-muted whitespace-nowrap">{tr('إجراءات', 'Actions', 'Actions')}</th>
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
                                                                    {job.status === 'open' ? tr('مفتوحة', 'Open', 'Ouverte') : 
                                                                     job.status === 'in_progress' ? tr('قيد التنفيذ', 'In progress', 'En cours') : 
                                                                     job.status === 'completed' ? tr('مكتملة', 'Completed', 'Terminee') : tr('ملغاة', 'Cancelled', 'Annulee')}
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
                                                                        {tr('مراجعة', 'Review', 'Verifier')}
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm" 
                                                                        className="text-red-600 hover:bg-red-50"
                                                                        onClick={() => handleDeleteJob(job.id)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4 ml-1" />
                                                                        {tr('حذف', 'Delete', 'Supprimer')}
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {filteredJobs.length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-8 text-center text-muted">
                                                                {tr('لا يوجد وظائف', 'No jobs found', 'Aucune offre trouvee')}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                            </ErrorBoundary>
                        )}

                        {activeTab === 'reports' && (
                            <ErrorBoundary 
                                titleAr="فشل تحميل قسم البلاغات — حاول التحديث"
                                titleFr="Échec du chargement des signalements — essayez de rafraîchir"
                                titleEn="Failed to load Flagged Content tab — try refreshing"
                            >
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className={`${panelElevatedClass} border-amber-300/50 dark:border-amber-500/30`}>
                                        <p className="text-sm text-muted">{tr('تحققات معلقة', 'Pending verifications', 'Verifications en attente')}</p>
                                        <p className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-300">{verifications.length}</p>
                                        <Button size="sm" variant="ghost" className="mt-4" onClick={() => setActiveTab('verifications')}>
                                            {tr('فتح قسم التحقق', 'Open verification section', 'Ouvrir la section verification')}
                                        </Button>
                                    </div>
                                    <div className={`${panelElevatedClass} border-red-300/50 dark:border-red-500/30`}>
                                        <p className="text-sm text-muted">{tr('نزاعات مفتوحة', 'Open disputes', 'Litiges ouverts')}</p>
                                        <p className="mt-2 text-3xl font-extrabold text-red-600 dark:text-red-300">{disputes.length}</p>
                                        <Button size="sm" variant="ghost" className="mt-4" onClick={() => setActiveTab('disputes')}>
                                            {tr('فتح قسم النزاعات', 'Open disputes section', 'Ouvrir la section litiges')}
                                        </Button>
                                    </div>
                                    <div className={`${panelElevatedClass} border-cyan-300/50 dark:border-cyan-500/30`}>
                                        <p className="text-sm text-muted">{tr('مدفوعات تحتاج متابعة', 'Payments needing follow-up', 'Paiements a suivre')}</p>
                                        <p className="mt-2 text-3xl font-extrabold text-cyan-600 dark:text-cyan-300">{stuckPayments.length}</p>
                                        <Button size="sm" variant="ghost" className="mt-4" onClick={() => setActiveTab('payments')}>
                                            {tr('فتح قسم المدفوعات', 'Open payments section', 'Ouvrir la section paiements')}
                                        </Button>
                                    </div>
                                </div>

                                <div className={panelClass}>
                                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                        <Flag className="w-5 h-5 text-red-500" />
                                        {tr('مركز التنبيهات', 'Alerts center', 'Centre des alertes')}
                                    </h3>
                                    {unresolvedSignals === 0 ? (
                                        <p className="text-muted">{tr('لا توجد تنبيهات حالياً، النظام يعمل بشكل طبيعي.', 'No active alerts right now. System is operating normally.', 'Aucune alerte active pour le moment. Le systeme fonctionne normalement.')}</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {verifications.slice(0, 5).map(v => (
                                                <div key={v.id} className="p-3 rounded-xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/85 dark:bg-amber-500/10">
                                                    <p className="text-sm font-medium text-foreground">{tr('تحقق جديد', 'New verification', 'Nouvelle verification')}: {v.profile?.full_name || tr('مستخدم', 'User', 'Utilisateur')}</p>
                                                    <p className="text-xs text-muted">{new Date(v.submitted_at).toLocaleString(locale)}</p>
                                                </div>
                                            ))}
                                            {disputes.slice(0, 5).map(d => (
                                                <div key={d.id} className="p-3 rounded-xl border border-red-200/80 dark:border-red-500/20 bg-red-50/85 dark:bg-red-500/10">
                                                    <p className="text-sm font-medium text-foreground">{tr('نزاع مفتوح', 'Open dispute', 'Litige ouvert')}: {(d.contract?.job as any)?.title || tr('عقد', 'Contract', 'Contrat')}</p>
                                                    <p className="text-xs text-muted">{new Date(d.opened_at).toLocaleString(locale)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            </ErrorBoundary>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                <div className={panelClass}>
                                    <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-cyan-500" />
                                        {tr('إعدادات لوحة الإدارة', 'Admin dashboard settings', 'Parametres du tableau admin')}
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/55">
                                            <span className="text-sm font-medium text-foreground">{tr('التحديث التلقائي', 'Auto refresh', 'Actualisation automatique')}</span>
                                            <input
                                                type="checkbox"
                                                checked={autoRefresh}
                                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                                className="h-5 w-5 accent-cyan-600"
                                            />
                                        </label>

                                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/55">
                                            <span className="text-sm font-medium text-foreground">{tr('فاصل التحديث', 'Refresh interval', 'Intervalle d actualisation')}</span>
                                            <select
                                                value={refreshIntervalSec}
                                                onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
                                                className={selectClass}
                                            >
                                                <option value={20}>20 {tr('ثانية', 'seconds', 'secondes')}</option>
                                                <option value={30}>30 {tr('ثانية', 'seconds', 'secondes')}</option>
                                                <option value={45}>45 {tr('ثانية', 'seconds', 'secondes')}</option>
                                                <option value={60}>60 {tr('ثانية', 'seconds', 'secondes')}</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <Button variant="primary" onClick={refreshAllData}>
                                            <RefreshCw className="w-4 h-4 ml-1" />
                                            {tr('مزامنة جميع الأقسام', 'Sync all sections', 'Synchroniser toutes les sections')}
                                        </Button>
                                        <Button variant="outline" onClick={() => refreshActiveTabData(activeTab)}>
                                            {tr('تحديث القسم الحالي', 'Refresh current section', 'Actualiser la section actuelle')}
                                        </Button>
                                    </div>
                                </div>

                                <div className={panelClass}>
                                    <h4 className="font-bold text-foreground mb-3">{tr('صحة النظام', 'System health', 'Sante du systeme')}</h4>
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/55">
                                        <span className="text-muted">{tr('حالة المراقبة', 'Monitoring status', 'Etat de supervision')}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            systemHealthLevel === 'stable'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : systemHealthLevel === 'moderate'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-red-100 text-red-700'
                                        }`}>
                                            {systemHealthLevel === 'stable'
                                                ? tr('مستقر', 'Stable', 'Stable')
                                                : systemHealthLevel === 'moderate'
                                                    ? tr('متوسط', 'Moderate', 'Modere')
                                                    : tr('يتطلب تدخل', 'Needs attention', 'Necessite une intervention')}
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
                                <h3 className="text-lg font-bold text-foreground">{tr('تفاصيل المستخدم', 'User details', 'Details utilisateur')}</h3>
                                <p className="text-sm text-muted">{selectedUser.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                                aria-label={tr('إغلاق', 'Close', 'Fermer')}
                            >
                                <X className="w-4 h-4 text-muted" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <p><strong>{tr('الاسم', 'Name', 'Nom')}:</strong> {selectedUser.name}</p>
                            <p><strong>{tr('البريد', 'Email', 'Email')}:</strong> {selectedUser.email || '-'}</p>
                            <p><strong>{tr('نوع الحساب', 'Account type', 'Type de compte')}:</strong> {selectedUser.type}</p>
                            <p><strong>{tr('الوضع النشط', 'Active mode', 'Mode actif')}:</strong> {selectedUser.active_mode || tr('عميل', 'Client', 'Client')}</p>
                            <p><strong>{tr('توثيق الهوية', 'Identity verification', 'Verification d identite')}:</strong> {selectedUser.cin_verified ? tr('نعم', 'Yes', 'Oui') : tr('لا', 'No', 'Non')}</p>
                            <p><strong>{tr('مشرف', 'Admin', 'Admin')}:</strong> {selectedUser.is_admin ? tr('نعم', 'Yes', 'Oui') : tr('لا', 'No', 'Non')}</p>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                disabled={userActionLoadingId === selectedUser.id}
                                onClick={() => handleToggleUserMode(selectedUser)}
                            >
                                <Ban className="w-4 h-4 ml-1" />
                                {tr('تبديل الوضع', 'Switch mode', 'Basculer le mode')}
                            </Button>
                            <Button
                                variant="danger"
                                disabled={userActionLoadingId === selectedUser.id}
                                onClick={() => handleDeleteUser(selectedUser)}
                            >
                                <Trash2 className="w-4 h-4 ml-1" />
                                {tr('حذف المستخدم', 'Delete user', 'Supprimer l utilisateur')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <Modal isOpen={confirmAction.isOpen} onClose={closeConfirm} title={confirmAction.title} size="md">
                <div className="space-y-6 pt-2">
                    <p className="text-muted leading-relaxed font-medium">{confirmAction.message}</p>
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/10 mt-6">
                        <Button variant="ghost" className="text-muted hover:bg-gray-100 dark:hover:bg-white/5" onClick={closeConfirm}>
                            {tr('إلغاء', 'Cancel', 'Annuler')}
                        </Button>
                        <Button
                            variant={confirmAction.actionType === 'danger' ? 'danger' : 'primary'}
                            className={confirmAction.actionType === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent shadow shadow-amber-600/30' : ''}
                            onClick={() => {
                                closeConfirm();
                                confirmAction.onConfirm();
                            }}
                        >
                            {tr('تأكيد', 'Confirm', 'Confirmer')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
