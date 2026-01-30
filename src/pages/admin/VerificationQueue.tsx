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

export default function VerificationQueue() {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
    const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        fetchPendingVerifications();
    }, []);

    const fetchPendingVerifications = async () => {
        try {
            const { data, error } = await supabase
                .from('identity_verifications')
                .select(`
                    *,
                    profile:profiles(full_name, email, avatar_url)
                `)
                .eq('status', 'pending')
                .order('submitted_at', { ascending: true });

            if (error) throw error;
            setVerifications(data || []);
        } catch (error) {
            console.error('Error fetching verifications:', error);
            showToast('فشل في تحميل طلبات التحقق', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getSignedUrl = async (path: string) => {
        const { data, error } = await supabase.storage
            .from('identity-documents')
            .createSignedUrl(path, 3600); // 1 hour expiry

        if (error) {
            console.error('Error getting signed URL:', error);
            return '';
        }
        return data.signedUrl;
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
        const [front, back, selfie] = await Promise.all([
            getSignedUrl(verification.cin_front_url),
            getSignedUrl(verification.cin_back_url),
            getSignedUrl(verification.selfie_url),
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
                })
                .eq('id', selectedVerification.user_id);

            if (profileError) throw profileError;

            // Send notification to user
            await supabase.from('notifications').insert({
                user_id: selectedVerification.user_id,
                type: 'identity_verified',
                title: 'تم التحقق من هويتك',
                message: 'مبروك! تم التحقق من هويتك بنجاح. يمكنك الآن الوصول لجميع ميزات المنصة.',
                read: false,
            });

            showToast('تم الموافقة على التحقق بنجاح', 'success');
            setSelectedVerification(null);
            fetchPendingVerifications();
        } catch (error) {
            console.error('Error approving verification:', error);
            showToast('فشل في الموافقة على التحقق', 'error');
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
                title: 'تم رفض طلب التحقق',
                message: `عذراً، تم رفض طلب التحقق من الهوية. السبب: ${rejectionReason}`,
                read: false,
            });

            showToast('تم رفض التحقق', 'success');
            setSelectedVerification(null);
            setShowRejectModal(false);
            setRejectionReason('');
            fetchPendingVerifications();
        } catch (error) {
            console.error('Error rejecting verification:', error);
            showToast('فشل في رفض التحقق', 'error');
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

        if (diffHours < 1) return 'منذ دقائق';
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        return `منذ ${diffDays} يوم`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <SEO title="طلبات التحقق من الهوية - لوحة الإدارة" description="مراجعة وإدارة طلبات التحقق من الهوية المقدمة" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-8 h-8 text-primary-600" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            طلبات التحقق من الهوية
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        مراجعة وإدارة طلبات التحقق من الهوية المقدمة من المستخدمين
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
                                <p className="text-sm text-gray-600 dark:text-gray-400">قيد الانتظار</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Queue List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            الطلبات المعلقة
                        </h2>

                        {verifications.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    لا توجد طلبات تحقق معلقة
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
                                        <ChevronLeft className="w-5 h-5 text-gray-400" />
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
                                مراجعة التحقق
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
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">رقم البطاقة</p>
                                <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white tracking-wider" dir="ltr">
                                    {selectedVerification.cin_number}
                                </p>
                            </div>

                            {/* Document Images */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">وجه البطاقة</p>
                                    {documentUrls.front ? (
                                        <img
                                            src={documentUrls.front}
                                            className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600"
                                            alt="CIN Front"
                                        />
                                    ) : (
                                        <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">ظهر البطاقة</p>
                                    {documentUrls.back ? (
                                        <img
                                            src={documentUrls.back}
                                            className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600"
                                            alt="CIN Back"
                                        />
                                    ) : (
                                        <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">الصورة الشخصية</p>
                                    {documentUrls.selfie ? (
                                        <img
                                            src={documentUrls.selfie}
                                            className="w-full rounded-lg border-2 border-gray-200 dark:border-gray-600"
                                            alt="Selfie"
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
                                <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">قائمة التحقق:</p>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                                        <span>البيانات واضحة في صورة الوجه</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                                        <span>الباركود واضح في صورة الظهر</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                                        <span>الصورة الشخصية تطابق صورة البطاقة</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                                        <span>رقم البطاقة مكون من 8 أرقام</span>
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
                                    موافقة
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    <XCircle className="w-4 h-4" />
                                    رفض
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-700">
                            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">
                                اختر طلباً من القائمة للمراجعة
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
                                سبب الرفض
                            </h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            يرجى كتابة سبب رفض طلب التحقق ليتمكن المستخدم من تصحيح المشكلة
                        </p>

                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="مثال: الصورة غير واضحة، يرجى إعادة التقاطها..."
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
                                إلغاء
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason || actionLoading}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                    'تأكيد الرفض'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
