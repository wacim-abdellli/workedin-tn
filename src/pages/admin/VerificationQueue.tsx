import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    XCircle,
    ChevronLeft,
    User,
    Clock,
    Shield,
    AlertCircle,
    Loader2,
    Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import SEO from '@/components/common/SEO';
import { useTranslation } from '@/i18n';


interface VerificationRequest {
    id: string;
    user_id: string;
    cin_number: string;
    cin_front_url: string;
    cin_back_url: string;
    selfie_url: string;
    status: 'pending' | 'approved' | 'rejected' | 'requires_resubmit';
    rejection_reason: string | null;
    submitted_at: string;
    profile: {
        full_name: string;
        email: string;
        avatar_url: string;
    };
}

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
const IDENTITY_DOCS_BUCKET = 'identity-documents';
const FALLBACK_IDENTITY_BUCKETS = ['identity-documents', 'identity_documents', 'verification-documents', 'verification_documents'];
const ENV_IDENTITY_BUCKETS = (import.meta.env.VITE_IDENTITY_DOCS_BUCKETS as string | undefined)
    ?.split(',').map(v => v.trim()).filter(Boolean) ?? [];
const IDENTITY_BUCKET_CANDIDATES = Array.from(new Set([IDENTITY_DOCS_BUCKET, ...ENV_IDENTITY_BUCKETS, ...FALLBACK_IDENTITY_BUCKETS]));

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
        const storagePrefixes = ['storage/v1/object/public/', 'storage/v1/object/sign/', 'storage/v1/object/'];
        for (const prefix of storagePrefixes) {
            if (cleanPath.startsWith(prefix)) {
                const rest = cleanPath.slice(prefix.length);
                const slashIndex = rest.indexOf('/');
                if (slashIndex <= 0) return null;
                return { bucket: rest.slice(0, slashIndex), path: rest.slice(slashIndex + 1) };
            }
        }
        return null;
    };

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            const supabaseHost = new URL(SUPA_URL).host;
            if (parsed.host !== supabaseHost) return { kind: 'external', url: trimmed };
            const parsedStorage = parseStoragePath(parsed.pathname);
            if (parsedStorage) return { kind: 'storage', bucket: parsedStorage.bucket, path: parsedStorage.path };
            return { kind: 'external', url: trimmed };
        } catch {
            return { kind: 'external', url: trimmed };
        }
    }

    const parsedStorage = parseStoragePath(trimmed);
    if (parsedStorage) return { kind: 'storage', bucket: parsedStorage.bucket, path: parsedStorage.path };

    const clean = trimmed.replace(/^\/+/, '');
    const bucketMatch = IDENTITY_BUCKET_CANDIDATES.find(bucket => clean.startsWith(`${bucket}/`));
    if (bucketMatch) return { kind: 'storage', bucket: bucketMatch, path: clean.slice(bucketMatch.length + 1) };

    return { kind: 'storage', bucket: null, path: clean };
}

export default function VerificationQueue() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { language } = useTranslation();
    const tr = (ar: string, en: string, fr?: string) => {
        if (language === 'ar') return ar;
        if (language === 'fr') return fr || en;
        return en;
    };

    const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
    const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        fetchPendingVerifications();
    }, []);

    const fetchPendingVerifications = async () => {
        setError(null);
        try {
            // Add timeout of 10 seconds
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const { data, error: fetchError } = await supabase
                .from('identity_verifications')
                .select(`
                    *,
                    profile:profiles(full_name, email, avatar_url)
                `)
                .eq('status', 'pending')
                .order('submitted_at', { ascending: true });

            clearTimeout(timeoutId);

            if (fetchError) {
                logger.error('Supabase error:', fetchError);
                setError(`${tr('خطأ', 'Error', 'Erreur')}: ${fetchError.message}`);
                return;
            }
            setVerifications(data || []);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.error('Error fetching verifications:', err);
            if (err instanceof Error && err.name === 'AbortError') {
                setError(tr('انتهت مهلة الاتصال. تحقق من اتصالك بالإنترنت أو من إعدادات Supabase.', 'Connection timed out. Check your internet connection or Supabase settings.', 'Delai de connexion depasse. Verifiez votre connexion internet ou les parametres Supabase.'));
            } else {
                setError(msg || tr('فشل في تحميل طلبات التحقق', 'Failed to load verification requests', 'Echec du chargement des demandes de verification'));
            }
            showToast(tr('فشل في تحميل طلبات التحقق', 'Failed to load verification requests', 'Echec du chargement des demandes de verification'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const resolveIdentityDocumentUrl = async (url?: string | null) => {
        const parsed = parseStorageReference(url);
        if (!parsed) return '';
        if (parsed.kind === 'external') return parsed.url;

        const candidates = parsed.bucket
            ? [parsed.bucket, ...IDENTITY_BUCKET_CANDIDATES.filter(bucket => bucket !== parsed.bucket)]
            : IDENTITY_BUCKET_CANDIDATES;

        for (const bucket of candidates) {
            try {
                const { data, error } = await supabase.storage.from(bucket).createSignedUrl(parsed.path, 3600);
                if (!error && data?.signedUrl) return data.signedUrl;
            } catch {
                // Try next candidate bucket.
            }
        }

        const fallbackBucket = parsed.bucket || IDENTITY_DOCS_BUCKET;
        return `${SUPA_URL}/storage/v1/object/public/${fallbackBucket}/${parsed.path}`;
    };

    const [documentUrls, setDocumentUrls] = useState<{
        front: string;
        back: string;
        selfie: string;
    }>({ front: '', back: '', selfie: '' });

    useEffect(() => {
        if (selectedVerification) {
            loadDocumentUrls(selectedVerification);
        }
    }, [selectedVerification]);

    const loadDocumentUrls = async (verification: VerificationRequest) => {
        setDocumentUrls({ front: '', back: '', selfie: '' });
        const [front, back, selfie] = await Promise.all([
            resolveIdentityDocumentUrl(verification.cin_front_url),
            resolveIdentityDocumentUrl(verification.cin_back_url),
            resolveIdentityDocumentUrl(verification.selfie_url),
        ]);
        setDocumentUrls({ front, back, selfie });
    };

    const handleApprove = async () => {
        if (!selectedVerification || !user) return;

        setActionLoading(true);
        try {
            // Update verification status
            const { error: updateError } = await supabase
                .from('identity_verifications')
                .update({
                    status: 'approved',
                    reviewed_by: user.id,
                    reviewed_at: new Date().toISOString(),
                })
                .eq('id', selectedVerification.id);

            if (updateError) throw updateError;

            // Update user's profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    cin_verified: true,
                    cin_submitted: false,
                })
                .eq('id', selectedVerification.user_id);

            if (profileError) throw profileError;

            // Send notification to user
            await supabase.from('notifications').insert({
                user_id: selectedVerification.user_id,
                type: 'identity_verified',
                title: tr('تم التحقق من هويتك', 'Your identity has been verified', 'Votre identite a ete verifiee'),
                message: tr('مبروك! تم التحقق من هويتك بنجاح. يمكنك الآن الوصول لجميع ميزات المنصة.', 'Congratulations! Your identity was successfully verified. You can now access all platform features.', 'Felicitations ! Votre identite a ete verifiee avec succes. Vous pouvez maintenant acceder a toutes les fonctionnalites de la plateforme.'),
                read: false,
            });

            showToast(tr('تم الموافقة على التحقق بنجاح', 'Verification approved successfully', 'Verification approuvee avec succes'), 'success');
            setSelectedVerification(null);
            fetchPendingVerifications();
        } catch (error) {
            logger.error('Error approving verification:', error);
            showToast(tr('فشل في الموافقة على التحقق', 'Failed to approve verification', 'Echec de l approbation de la verification'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedVerification || !user || !rejectionReason) return;

        setActionLoading(true);
        try {
            // Update verification status
            const { error: updateError } = await supabase
                .from('identity_verifications')
                .update({
                    status: 'rejected',
                    rejection_reason: rejectionReason,
                    reviewed_by: user.id,
                    reviewed_at: new Date().toISOString(),
                })
                .eq('id', selectedVerification.id);

            if (updateError) throw updateError;

            // Update user's profile
            await supabase
                .from('profiles')
                .update({ cin_submitted: false })
                .eq('id', selectedVerification.user_id);

            // Send notification to user
            await supabase.from('notifications').insert({
                user_id: selectedVerification.user_id,
                type: 'identity_rejected',
                title: tr('تم رفض طلب التحقق', 'Verification request rejected', 'Demande de verification refusee'),
                message: `${tr('عذراً، تم رفض طلب التحقق من الهوية. السبب', 'Sorry, your identity verification request was rejected. Reason', 'Desole, votre demande de verification d identite a ete refusee. Raison')}: ${rejectionReason}`,
                read: false,
            });

            showToast(tr('تم رفض التحقق', 'Verification rejected', 'Verification refusee'), 'success');
            setSelectedVerification(null);
            setShowRejectModal(false);
            setRejectionReason('');
            fetchPendingVerifications();
        } catch (error) {
            logger.error('Error rejecting verification:', error);
            showToast(tr('فشل في رفض التحقق', 'Failed to reject verification', 'Echec du refus de la verification'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return tr('منذ دقائق', 'Minutes ago', 'Il y a quelques minutes');
        if (diffHours < 24) return `${tr('منذ', 'Since', 'Depuis')} ${diffHours} ${tr('ساعة', 'hours', 'heures')}`;
        return `${tr('منذ', 'Since', 'Depuis')} ${diffDays} ${tr('يوم', 'days', 'jours')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{tr('خطأ في التحميل', 'Loading error', 'Erreur de chargement')}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={() => {
                            setLoading(true);
                            fetchPendingVerifications();
                        }}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        {tr('إعادة المحاولة', 'Retry', 'Reessayer')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <SEO title={tr('طلبات التحقق من الهوية - لوحة الإدارة', 'Identity verification requests - Admin dashboard', 'Demandes de verification d identite - Tableau admin')} description={tr('مراجعة وإدارة طلبات التحقق من الهوية المقدمة', 'Review and manage submitted identity verification requests', 'Examiner et gerer les demandes de verification d identite soumises')} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-8 h-8 text-primary-600" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {tr('طلبات التحقق من الهوية', 'Identity verification requests', 'Demandes de verification d identite')}
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        {tr('مراجعة وإدارة طلبات التحقق من الهوية المقدمة من المستخدمين', 'Review and manage identity verification requests submitted by users', 'Examiner et gerer les demandes de verification d identite soumises par les utilisateurs')}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{verifications.length}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{tr('قيد الانتظار', 'Pending', 'En attente')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Queue List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {tr('الطلبات المعلقة', 'Pending requests', 'Demandes en attente')}
                        </h2>

                        {verifications.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    {tr('لا توجد طلبات تحقق معلقة', 'No pending verification requests', 'Aucune demande de verification en attente')}
                                </p>
                            </div>
                        ) : (
                            verifications.map((verification) => (
                                <div
                                    key={verification.id}
                                    onClick={() => setSelectedVerification(verification)}
                                    className={`bg-white dark:bg-gray-800 rounded-xl p-4 cursor-pointer border-2 transition-all ${selectedVerification?.id === verification.id
                                        ? 'border-primary-500 shadow-lg'
                                        : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={verification.profile.avatar_url || '/default-avatar.png'}
                                            alt={verification.profile.full_name}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                {verification.profile.full_name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                {verification.profile.email}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                {formatDate(verification.submitted_at)}
                                            </p>
                                        </div>
                                        <ChevronLeft className="w-5 h-5 text-gray-400 rtl:rotate-180" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Verification Review Panel */}
                    {selectedVerification ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 sticky top-8">
                            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                {tr('مراجعة التحقق', 'Review verification', 'Examiner la verification')}
                            </h2>

                            {/* User Info */}
                            <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={selectedVerification.profile.avatar_url || '/default-avatar.png'}
                                        alt={selectedVerification.profile.full_name}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {selectedVerification.profile.full_name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {selectedVerification.profile.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CIN Number */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{tr('رقم البطاقة', 'ID number', 'Numero d identite')}</p>
                                <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white tracking-wider" dir="ltr">
                                    {selectedVerification.cin_number}
                                </p>
                            </div>

                            {/* Document Images */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{tr('وجه البطاقة', 'Card front', 'Recto de la carte')}</p>
                                    {documentUrls.front ? (
                                        <img
                                            src={documentUrls.front}
                                            className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600"
                                            alt={tr('الوجه الأمامي لبطاقة التعريف', 'ID card front side', 'Recto de la carte d identite')}
                                        />
                                    ) : (
                                        <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{tr('ظهر البطاقة', 'Card back', 'Verso de la carte')}</p>
                                    {documentUrls.back ? (
                                        <img
                                            src={documentUrls.back}
                                            className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600"
                                            alt={tr('الوجه الخلفي لبطاقة التعريف', 'ID card back side', 'Verso de la carte d identite')}
                                        />
                                    ) : (
                                        <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{tr('الصورة الشخصية', 'Selfie', 'Selfie')}</p>
                                    {documentUrls.selfie ? (
                                        <img
                                            src={documentUrls.selfie}
                                            className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600"
                                            alt={tr('الصورة الشخصية', 'Selfie', 'Selfie')}
                                        />
                                    ) : (
                                        <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Verification Checklist */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
                                <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">{tr('قائمة التحقق:', 'Verification checklist:', 'Liste de verification :')}</p>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                                        <span>{tr('البيانات واضحة في صورة الوجه', 'Details are clear on front image', 'Les details sont clairs sur l image recto')}</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                                        <span>{tr('الباركود واضح في صورة الظهر', 'Barcode is clear on back image', 'Le code-barres est clair sur l image verso')}</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                                        <span>{tr('الصورة الشخصية تطابق صورة البطاقة', 'Selfie matches ID card photo', 'Le selfie correspond a la photo de la carte')}</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                                        <span>{tr('رقم البطاقة مكون من 8 أرقام', 'ID number contains 8 digits', 'Le numero d identite contient 8 chiffres')}</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4" />
                                    )}
                                    {tr('موافقة', 'Approve', 'Approuver')}
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    <XCircle className="w-4 h-4" />
                                    {tr('رفض', 'Reject', 'Refuser')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700">
                            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">
                                {tr('اختر طلباً من القائمة للمراجعة', 'Select a request from the list to review', 'Selectionnez une demande dans la liste pour l examiner')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {tr('سبب الرفض', 'Rejection reason', 'Raison du refus')}
                            </h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {tr('يرجى كتابة سبب رفض طلب التحقق ليتمكن المستخدم من تصحيح المشكلة', 'Please provide the rejection reason so the user can fix the issue', 'Veuillez indiquer la raison du refus pour que l utilisateur puisse corriger le probleme')}
                        </p>

                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={tr('مثال: الصورة غير واضحة، يرجى إعادة التقاطها...', 'Example: The image is unclear, please retake it...', 'Exemple : L image est floue, veuillez la reprendre...')}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                            rows={3}
                        />

                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                {tr('إلغاء', 'Cancel', 'Annuler')}
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason || actionLoading}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                    tr('تأكيد الرفض', 'Confirm rejection', 'Confirmer le refus')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
