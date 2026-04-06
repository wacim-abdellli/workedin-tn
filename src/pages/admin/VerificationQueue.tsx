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
import { getPendingVerifications, subscribeToPendingQueue } from '@/lib/verificationStatus';
import { adminInsetClass, adminInputClass, adminPanelClass, adminPillClass } from './adminTheme';


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
     const { tx } = useTranslation();

    const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
    const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        fetchPendingVerifications();
        
        // Real-time sync - admin queue updates automatically
        const unsubscribe = subscribeToPendingQueue(() => {
            fetchPendingVerifications();
        });
        
        return unsubscribe;
    }, []);

    const fetchPendingVerifications = async () => {
        setError(null);
        try {
            // Use shared helper - single source of truth
            const data = await getPendingVerifications();
            
            // Transform to match component interface
            const transformed = data.map(v => ({
                id: v.id,
                user_id: v.user_id,
                cin_number: v.cin_number,
                cin_front_url: 'cin_front_url' in v && typeof v.cin_front_url === 'string' ? v.cin_front_url : '',
                cin_back_url: 'cin_back_url' in v && typeof v.cin_back_url === 'string' ? v.cin_back_url : '',
                selfie_url: 'selfie_url' in v && typeof v.selfie_url === 'string' ? v.selfie_url : '',
                status: 'pending' as const,
                rejection_reason: null,
                submitted_at: v.submitted_at,
                profile: {
                    full_name: v.profile?.full_name || 'Unknown',
                    email: v.profile?.email || '',
                    avatar_url: v.profile?.avatar_url || ''
                }
            }));
            
            setVerifications(transformed);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.error('Error fetching verifications:', err);
            setError(msg || tx('dashboard.admin.verificationQueue.loadError', undefined, 'Failed to load verification requests'));
            showToast(tx('dashboard.admin.verificationQueue.loadError', undefined, 'Failed to load verification requests'), 'error');
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
            const { error: updateError } = await supabase.rpc('update_verification_status', {
                p_user_id: selectedVerification.user_id,
                p_action: 'approved',
                p_reviewed_at: new Date().toISOString(),
                p_admin_note: null,
            });

            if (updateError) throw updateError;

            // User will be notified via notification center
            setSelectedVerification(null);
            fetchPendingVerifications();
         } catch (error) {
             logger.error('Error approving verification:', error);
             showToast(tx('dashboard.admin.verificationQueue.approveFailed', undefined, 'Failed to approve verification'), 'error');
         } finally {
                 setActionLoading(false);
         }
    };

    const handleReject = async () => {
        if (!selectedVerification || !user || !rejectionReason) return;

        setActionLoading(true);
        try {
            const { error: updateError } = await supabase.rpc('update_verification_status', {
                p_user_id: selectedVerification.user_id,
                p_action: 'rejected',
                p_reviewed_at: new Date().toISOString(),
                p_admin_note: rejectionReason,
            });

            if (updateError) throw updateError;

             // User will be notified via notification center
            setSelectedVerification(null);
            setShowRejectModal(false);
            setRejectionReason('');
            fetchPendingVerifications();
         } catch (error) {
             logger.error('Error rejecting verification:', error);
             showToast(tx('dashboard.admin.verificationQueue.rejectFailed', undefined, 'Failed to reject verification'), 'error');
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

         if (diffHours < 1) return tx('dashboard.admin.verificationQueue.minutesAgo', undefined, 'Minutes ago');
         if (diffHours < 24) return `${tx('dashboard.admin.verificationQueue.since', undefined, 'Since')} ${diffHours} ${tx('dashboard.admin.verificationQueue.hours', undefined, 'hours')}`;
         return `${tx('dashboard.admin.verificationQueue.since', undefined, 'Since')} ${diffDays} ${tx('dashboard.admin.verificationQueue.days', undefined, 'days')}`;
     };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-primary)]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                 <div className={`${adminPanelClass} max-w-md p-8 text-center`}>
                     <AlertCircle className="w-12 h-12 text-[var(--color-status-error)] mx-auto mb-4" />
                     <h2 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)] dark:text-white mb-2">{tx('dashboard.admin.verificationQueue.errorTitle', undefined, 'Loading error')}</h2>
                     <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)] mb-4">{error}</p>
                     <button
                         onClick={() => {
                             setLoading(true);
                             fetchPendingVerifications();
                         }}
                         className="rounded-xl bg-[var(--color-brand-primary)] px-6 py-2 text-white transition-colors hover:bg-[var(--color-brand-primary-hover)]"
                      >
                         {tx('dashboard.admin.verificationQueue.retry', undefined, 'Retry')}
                     </button>
                 </div>
            </div>
        );
    }

    return (
         <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_24%),linear-gradient(180deg,#eef3fb_0%,#e8eef8_100%)] py-8 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_22%),linear-gradient(180deg,#050811_0%,#08101c_42%,#0a1220_100%)]">
             <SEO title={tx('dashboard.admin.verificationQueue.seoTitle', undefined, 'Identity verification requests - Admin dashboard')} description={tx('dashboard.admin.verificationQueue.seoDescription', undefined, 'Review and manage submitted identity verification requests')} />
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 {/* Header */}
                 <div className="mb-8">
                     <div className="flex items-center gap-3 mb-2">
                         <Shield className="w-8 h-8 text-[var(--color-brand-primary)]" />
                         <h1 className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)] dark:text-white">
                             {tx('dashboard.admin.verificationQueue.title', undefined, 'Identity verification requests')}
                         </h1>
                     </div>
                     <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)]">
                         {tx('dashboard.admin.verificationQueue.description', undefined, 'Review and manage identity verification requests submitted by users')}
                     </p>
                 </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      <div className={`${adminPanelClass} p-4`}>
                          <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${adminPillClass('amber')}`}>
                                  <Clock className="w-5 h-5 text-[var(--color-status-warning)]" />
                              </div>
                             <div>
                                 <p className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)] dark:text-white">{verifications.length}</p>
                                 <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)]">{tx('dashboard.admin.verificationQueue.pending', undefined, 'Pending')}</p>
                             </div>
                         </div>
                     </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Queue List */}
                     <div className="space-y-4">
                         <h2 className="text-lg font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)] dark:text-white">
                             {tx('dashboard.admin.verificationQueue.queueTitle', undefined, 'Pending requests')}
                         </h2>

                         {verifications.length === 0 ? (
                             <div className="bg-white dark:bg-[var(--color-bg-elevated)] rounded-xl p-8 text-center border border-[var(--color-border-subtle)] dark:border-[var(--color-border-strong)] dark:border-[var(--color-border-default)]">
                                 <CheckCircle2 className="w-12 h-12 text-[var(--color-status-success)] mx-auto mb-4" />
                                 <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)]">
                                     {tx('dashboard.admin.verificationQueue.noPending', undefined, 'No pending verification requests')}
                                 </p>
                             </div>
                        ) : (
                            verifications.map((verification) => (
                             <div
                                     key={verification.id}
                                     onClick={() => setSelectedVerification(verification)}
                                     className={`${adminPanelClass} cursor-pointer p-4 transition-all ${selectedVerification?.id === verification.id
                                         ? 'border-[var(--color-brand-primary)] shadow-lg shadow-primary-500/10'
                                         : 'hover:border-white/70 dark:hover:border-white/14 hover:shadow-md'
                                         }`}
                                 >
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={verification.profile.avatar_url || '/default-avatar.png'}
                                            alt={verification.profile.full_name}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-[var(--color-border-subtle)] dark:border-[var(--color-border-strong)] dark:border-[var(--color-border-default)]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)] dark:text-white truncate">
                                                {verification.profile.full_name}
                                            </h3>
                                            <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)] truncate">
                                                {verification.profile.email}
                                            </p>
                                            <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)]">
                                                {formatDate(verification.submitted_at)}
                                            </p>
                                        </div>
                                        <ChevronLeft className="w-5 h-5 text-[var(--color-text-muted)] rtl:rotate-180" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                     {/* Verification Review Panel */}
                     {selectedVerification ? (
                         <div className={`${adminPanelClass} sticky top-8 p-6`}>
                             <h2 className="text-xl font-bold mb-6 text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)] dark:text-white flex items-center gap-2">
                                 <Eye className="w-5 h-5" />
                                 {tx('dashboard.admin.verificationQueue.reviewTitle', undefined, 'Review verification')}
                             </h2>

                            {/* User Info */}
                             <div className="mb-6 border-b border-slate-200/70 pb-6 dark:border-white/8">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={selectedVerification.profile.avatar_url || '/default-avatar.png'}
                                        alt={selectedVerification.profile.full_name}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-border-subtle)] dark:border-[var(--color-border-strong)] dark:border-[var(--color-border-default)]"
                                    />
                                    <div>
                                        <p className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)] dark:text-white">
                                            {selectedVerification.profile.full_name}
                                        </p>
                                        <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)]">
                                            {selectedVerification.profile.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                             {/* CIN Number */}
                             <div className="mb-6">
                                 <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)] mb-1">{tx('dashboard.admin.verificationQueue.idNumber', undefined, 'ID number')}</p>
                                 <p className="text-3xl font-mono font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)] dark:text-white tracking-wider" dir="ltr">
                                     {selectedVerification.cin_number}
                                 </p>
                             </div>

                             {/* Document Images */}
                             <div className="space-y-4 mb-6">
                                 <div>
                                     <p className="text-sm font-medium mb-2 text-[var(--color-text-secondary)] dark:text-[var(--color-text-disabled)]">{tx('dashboard.admin.verificationQueue.cardFront', undefined, 'Card front')}</p>
                                     {documentUrls.front ? (
                                         <img
                                              src={documentUrls.front}
                                              className="w-full rounded-lg border border-slate-200/80 dark:border-white/10"
                                              alt={tx('dashboard.admin.verificationQueue.cardFrontAlt', undefined, 'ID card front side')}
                                          />
                                      ) : (
                                          <div className={`flex h-40 w-full items-center justify-center rounded-lg ${adminInsetClass}`}>
                                              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
                                          </div>
                                      )}
                                 </div>
                                 <div>
                                     <p className="text-sm font-medium mb-2 text-[var(--color-text-secondary)] dark:text-[var(--color-text-disabled)]">{tx('dashboard.admin.verificationQueue.cardBack', undefined, 'Card back')}</p>
                                     {documentUrls.back ? (
                                         <img
                                              src={documentUrls.back}
                                              className="w-full rounded-lg border border-slate-200/80 dark:border-white/10"
                                              alt={tx('dashboard.admin.verificationQueue.cardBackAlt', undefined, 'ID card back side')}
                                          />
                                      ) : (
                                          <div className={`flex h-40 w-full items-center justify-center rounded-lg ${adminInsetClass}`}>
                                              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
                                          </div>
                                      )}
                                 </div>
                                 <div>
                                     <p className="text-sm font-medium mb-2 text-[var(--color-text-secondary)] dark:text-[var(--color-text-disabled)]">{tx('dashboard.admin.verificationQueue.selfie', undefined, 'Selfie')}</p>
                                     {documentUrls.selfie ? (
                                         <img
                                              src={documentUrls.selfie}
                                              className="w-full rounded-lg border border-slate-200/80 dark:border-white/10"
                                              alt={tx('dashboard.admin.verificationQueue.selfieAlt', undefined, 'Selfie')}
                                          />
                                      ) : (
                                          <div className={`flex h-40 w-full items-center justify-center rounded-lg ${adminInsetClass}`}>
                                              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
                                          </div>
                                      )}
                                 </div>
                             </div>

                             {/* Verification Checklist */}
                             <div className={`${adminInsetClass} mb-6 p-4`}>
                                 <p className="text-sm font-medium mb-3 text-[var(--color-text-secondary)] dark:text-[var(--color-text-disabled)]">{tx('dashboard.admin.verificationQueue.checklist', undefined, 'Verification checklist:')}</p>
                                 <ul className="space-y-2 text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)]">
                                     <li className="flex items-center gap-2">
                                         <input type="checkbox" className="w-4 h-4 text-[var(--color-brand-primary)] rounded" />
                                         <span>{tx('dashboard.admin.verificationQueue.checkFront', undefined, 'Details are clear on front image')}</span>
                                     </li>
                                     <li className="flex items-center gap-2">
                                         <input type="checkbox" className="w-4 h-4 text-[var(--color-brand-primary)] rounded" />
                                         <span>{tx('dashboard.admin.verificationQueue.checkBack', undefined, 'Barcode is clear on back image')}</span>
                                     </li>
                                     <li className="flex items-center gap-2">
                                         <input type="checkbox" className="w-4 h-4 text-[var(--color-brand-primary)] rounded" />
                                         <span>{tx('dashboard.admin.verificationQueue.checkMatch', undefined, 'Selfie matches ID card photo')}</span>
                                     </li>
                                     <li className="flex items-center gap-2">
                                         <input type="checkbox" className="w-4 h-4 text-[var(--color-brand-primary)] rounded" />
                                         <span>{tx('dashboard.admin.verificationQueue.checkDigits', undefined, 'ID number contains 8 digits')}</span>
                                     </li>
                                 </ul>
                             </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-status-success)] text-white rounded-xl font-medium hover:bg-[var(--color-status-success-hover)] disabled:opacity-50 transition-colors"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4" />
                                    )}
                                     {tx('dashboard.admin.verificationQueue.approve', undefined, 'Approve')}
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-status-error)] text-white rounded-xl font-medium hover:bg-[var(--color-status-error-hover)] disabled:opacity-50 transition-colors"
                                >
                                    <XCircle className="w-4 h-4" />
                                    {tx('dashboard.admin.verificationQueue.reject', undefined, 'Reject')}
                                </button>
                            </div>
                        </div>
                         ) : (
                         <div className={`${adminPanelClass} p-8 text-center`}>
                             <User className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                             <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)]">
                                 {tx('dashboard.admin.verificationQueue.selectRequest', undefined, 'Select a request from the list to review')}
                             </p>
                         </div>
                     )}
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`${adminPanelClass} max-w-md w-full p-6`}>
                        <div className="flex items-center gap-3 mb-4">
                             <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${adminPillClass('red')}`}>
                                 <AlertCircle className="w-5 h-5 text-[var(--color-status-error)]" />
                             </div>
                             <h3 className="text-lg font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)] dark:text-white">
                                 {tx('dashboard.admin.verificationQueue.rejectReason', undefined, 'Rejection reason')}
                             </h3>
                         </div>

                         <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)] mb-4">
                             {tx('dashboard.admin.verificationQueue.rejectDescription', undefined, 'Please provide the rejection reason so the user can fix the issue')}
                         </p>

                         <textarea
                             value={rejectionReason}
                             onChange={(e) => setRejectionReason(e.target.value)}
                             placeholder={tx('dashboard.admin.verificationQueue.rejectExample', undefined, 'Example: The image is unclear, please retake it...')}
                             className={`${adminInputClass} h-auto min-h-[110px] resize-none px-4 py-3`}
                             rows={3}
                         />

                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                className="flex-1 px-4 py-3 bg-[var(--color-bg-subtle)] dark:bg-[var(--color-bg-elevated)] dark:bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] dark:text-[var(--color-text-disabled)] rounded-xl font-medium hover:bg-[var(--color-bg-muted)] dark:hover:bg-gray-600 transition-colors"
                             >
                                 {tx('dashboard.admin.verificationQueue.cancel', undefined, 'Cancel')}
                             </button>
                             <button
                                 onClick={handleReject}
                                 disabled={!rejectionReason || actionLoading}
                                 className="flex-1 px-4 py-3 bg-[var(--color-status-error)] text-white rounded-xl font-medium hover:bg-[var(--color-status-error-hover)] disabled:opacity-50 transition-colors"
                             >
                                 {actionLoading ? (
                                     <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                 ) : (
                                     tx('dashboard.admin.verificationQueue.confirmReject', undefined, 'Confirm rejection')
                                 )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
