import { useState } from 'react';
import { Check, Eye, Loader2, RefreshCw, Shield, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import SkeletonList from '@/components/common/SkeletonList';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { useTranslation } from '@/i18n';
import type {
    IdentityVerification,
    IdentityVerificationLegacyRow,
    IdentityVerificationPrimaryRow,
} from '@/types/admin';

export type { IdentityVerification } from '@/types/admin';

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

async function resolveIdentityDocumentUrl(url?: string | null): Promise<string | null> {
    const parsed = parseStorageReference(url);
    if (!parsed) return null;
    if (parsed.kind === 'external') return parsed.url;

    const candidates = parsed.bucket
        ? [parsed.bucket, ...IDENTITY_BUCKET_CANDIDATES.filter(b => b !== parsed.bucket)]
        : IDENTITY_BUCKET_CANDIDATES;

    for (const bucket of candidates) {
        try {
            const { data, error } = await supabase.storage.from(bucket).createSignedUrl(parsed.path, 60 * 60);
            if (!error && data?.signedUrl) return data.signedUrl;
        } catch { /* try next */ }
    }

    const fallbackBucket = parsed.bucket || IDENTITY_DOCS_BUCKET;
    return `${SUPA_URL}/storage/v1/object/public/${fallbackBucket}/${parsed.path}`;
}

async function mapPrimaryVerificationRow(item: IdentityVerificationPrimaryRow): Promise<IdentityVerification> {
    return {
        id: item.id,
        user_id: item.user_id,
        cin_number: item.cin_number ?? null,
        document_type: 'CIN',
        front_image_url: await resolveIdentityDocumentUrl(item.cin_front_url),
        back_image_url: await resolveIdentityDocumentUrl(item.cin_back_url),
        selfie_url: await resolveIdentityDocumentUrl(item.selfie_url),
        status: item.status,
        submitted_at: item.submitted_at,
        profile: Array.isArray(item.profile) ? (item.profile[0] ?? null) : (item.profile ?? null),
    };
}

async function mapLegacyVerificationRow(item: IdentityVerificationLegacyRow): Promise<IdentityVerification> {
    return {
        id: item.id,
        user_id: item.user_id,
        cin_number: item.cin_number ?? null,
        document_type: item.document_type || 'CIN',
        front_image_url: await resolveIdentityDocumentUrl(item.front_image_url),
        back_image_url: await resolveIdentityDocumentUrl(item.back_image_url),
        selfie_url: null,
        status: item.status,
        submitted_at: item.submitted_at,
        profile: Array.isArray(item.profile) ? (item.profile[0] ?? null) : (item.profile ?? null),
    };
}

export async function fetchVerifications(): Promise<IdentityVerification[]> {
    const client = supabase;
    try {
        const { data } = await supabaseWithRetry(() =>
            client
                .from('identity_verifications')
                .select('id,user_id,cin_number,cin_front_url,cin_back_url,selfie_url,status,submitted_at,profile:profiles!identity_verifications_user_id_fkey(full_name,email,phone,location,avatar_url)')
                .eq('status', 'pending')
                .order('submitted_at', { ascending: true })
        );
        const rows = (data ?? []) as IdentityVerificationPrimaryRow[];
        return await Promise.all(rows.map(mapPrimaryVerificationRow));
    } catch {
        // Fallback for alternate schema naming
        const { data: legacy } = await supabaseWithRetry(() =>
            client
                .from('identity_verifications')
                .select('id,user_id,cin_number,document_type,front_image_url,back_image_url,status,submitted_at,profile:profiles!identity_verifications_user_id_fkey(full_name,email,phone,location,avatar_url)')
                .eq('status', 'pending')
                .order('submitted_at', { ascending: true })
        );
        const legacyRows = (legacy ?? []) as IdentityVerificationLegacyRow[];
        return await Promise.all(legacyRows.map(mapLegacyVerificationRow));
    }
}

export default function VerificationsTab() {
     const { showToast } = useToast();
     const { language, tx } = useTranslation();
     const locale = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';

    const [verifications, setVerifications] = useState<IdentityVerification[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

    const panelClass = 'card border-white/45 dark:border-white/10 bg-white/80 dark:bg-slate-950/55 backdrop-blur-xl shadow-[0_16px_45px_-24px_rgba(21,84,247,0.38)]';

     const load = async () => {
         setLoading(true);
         try {
             const data = await fetchVerifications();
             setVerifications(data);
             setLoaded(true);
         } catch (err) {
             console.error('Failed to fetch verifications:', err);
             showToast(tx('dashboard.admin.verification.loadError', undefined, 'Failed to load verification requests'), 'error');
         } finally {
             setLoading(false);
         }
     };

    // Auto-load on first render
    if (!loaded && !loading) {
        void load();
    }

    const handleAction = async (id: string, action: 'approved' | 'rejected') => {
        setActioningId(id);
        try {
            const client = supabase;
            const { data: updatedRows } = await supabaseWithRetry(() =>
                client
                    .from('identity_verifications')
                    .update({ status: action, reviewed_at: new Date().toISOString() })
                    .eq('id', id)
                    .select('id,user_id')
            );
             if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
                 throw new Error(tx('dashboard.admin.verification.notUpdated', undefined, 'Verification request was not updated.'));
             }

            const verification = verifications.find(v => v.id === id);
            const userId = verification?.user_id || updatedRows[0]?.user_id;

            if (userId) {
                // Resolve any duplicate pending rows for same user
                await supabaseWithRetry(() =>
                    client
                        .from('identity_verifications')
                        .update({ status: action, reviewed_at: new Date().toISOString() })
                        .eq('user_id', userId)
                        .eq('status', 'pending')
                        .select('id')
                ).catch(() => null);

                if (action === 'approved') {
                    await Promise.all([
                        supabaseWithRetry(() =>
                            client.from('profiles').update({ cin_verified: true, cin_submitted: false }).eq('id', userId)
                        ),
                        supabaseWithRetry(() =>
                            client.from('freelancer_profiles').update({ cin_verified: true }).eq('id', userId)
                        ).catch(() => null),
                        supabaseWithRetry(() =>
                             client.from('notifications').insert({
                                 user_id: userId,
                                 type: 'system',
                                 title: tx('dashboard.admin.verification.approvedTitle', undefined, 'Your identity has been verified'),
                                 body: tx('dashboard.admin.verification.approvedBody', undefined, 'Congratulations! Your identity was successfully verified. You can now access all platform features.'),
                                 is_read: false,
                             })
                         ).catch(() => null),
                    ]);
                } else {
                    await Promise.all([
                        supabaseWithRetry(() =>
                            client.from('profiles').update({ cin_verified: false, cin_submitted: false }).eq('id', userId)
                        ),
                        supabaseWithRetry(() =>
                            client.from('freelancer_profiles').update({ cin_verified: false }).eq('id', userId)
                        ).catch(() => null),
                        supabaseWithRetry(() =>
                             client.from('notifications').insert({
                                 user_id: userId,
                                 type: 'system',
                                 title: tx('dashboard.admin.verification.rejectedTitle', undefined, 'Verification request rejected'),
                                 body: tx('dashboard.admin.verification.rejectedBody', undefined, 'Sorry, your identity verification request was rejected. Please ensure document images are clear and apply again.'),
                                 is_read: false,
                             })
                         ).catch(() => null),
                    ]);
                }
            }

            setVerifications(prev => prev.filter(v => v.id !== id));
            showToast(
                 action === 'approved'
                     ? tx('dashboard.admin.verification.approvedToast', undefined, 'Verification approved ✓')
                     : tx('dashboard.admin.verification.rejectedToast', undefined, 'Verification rejected'),
                 action === 'approved' ? 'success' : 'warning'
             );
         } catch (err) {
             console.error('Verification action error:', err);
             showToast(tx('dashboard.admin.verification.actionFailed', undefined, 'Action failed'), 'error');
         } finally {
             setActioningId(null);
         }
     };

    return (
        <ErrorBoundary
            titleAr="فشل تحميل قسم طلبات التحقق — حاول التحديث"
            titleFr="Echec du chargement des verifications — essayez de rafraichir"
            titleEn="Failed to load Verifications tab — try refreshing"
        >
            <div className="space-y-6">
                <div className={panelClass}>
                    <div className="flex items-center justify-between mb-6">
                         <h3 className="font-bold text-foreground flex items-center gap-2">
                             <Shield className="w-5 h-5 text-yellow-600" />
                             {tx('dashboard.admin.verification.title', undefined, 'Identity verification requests')}
                             {verifications.length > 0 && (
                                 <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                     {verifications.length} {tx('dashboard.admin.verification.pending', undefined, 'pending')}
                                 </span>
                             )}
                         </h3>
                         <Button variant="outline" size="sm" onClick={load}>
                             <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
                             {tx('dashboard.admin.verification.refresh', undefined, 'Refresh')}
                         </Button>
                     </div>

                    {loading ? (
                        <SkeletonList count={3} />
                    ) : verifications.length === 0 ? (
                         <div className="text-center py-12">
                             <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                             <p className="text-foreground font-medium">{tx('dashboard.admin.verification.noPending', undefined, 'No pending requests')}</p>
                             <p className="text-sm text-muted">{tx('dashboard.admin.verification.allProcessed', undefined, 'All verification requests are processed')}</p>
                         </div>
                    ) : (
                        <div className="space-y-4">
                            {verifications.map(v => (
                                <div key={v.id} className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                                    <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-900/60">
                                            <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                {v.profile?.avatar_url ? (
                                                    <img src={v.profile.avatar_url} alt={v.profile.full_name || 'user'} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Shield className="w-6 h-6 text-gray-400 dark:text-gray-300" />
                                                )}
                                            </div>
                                             <div>
                                                 <p className="font-bold text-foreground">{v.profile?.full_name || tx('dashboard.admin.verification.user', undefined, 'User')}</p>
                                                 <p className="text-sm text-muted">{v.profile?.email || ''}</p>
                                                 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted">
                                                     {v.profile?.phone ? <span>{v.profile.phone}</span> : null}
                                                     {v.profile?.location ? <span>{v.profile.location}</span> : null}
                                                     {v.cin_number ? <span>{tx('dashboard.admin.verification.idNumber', undefined, 'ID number')}: {v.cin_number}</span> : null}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{v.document_type || 'CIN'}</span>
                                                    <span className="text-xs text-muted">{new Date(v.submitted_at).toLocaleString(locale)}</span>
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
                                                 {expandedDocId === v.id ? tx('dashboard.admin.verification.hide', undefined, 'Hide') : tx('dashboard.admin.verification.viewDocs', undefined, 'View documents')}
                                             </Button>
                                            <Button
                                                 variant="primary"
                                                 size="sm"
                                                 disabled={actioningId === v.id}
                                                 onClick={() => handleAction(v.id, 'approved')}
                                             >
                                                 {actioningId === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 ml-1" />}
                                                 {tx('dashboard.admin.verification.approve', undefined, 'Approve')}
                                             </Button>
                                            <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 className="text-red-600 hover:bg-red-50"
                                                 disabled={actioningId === v.id}
                                                 onClick={() => handleAction(v.id, 'rejected')}
                                             >
                                                 <X className="w-4 h-4 ml-1" />
                                                 {tx('dashboard.admin.verification.reject', undefined, 'Reject')}
                                             </Button>
                                        </div>
                                    </div>

                                    {expandedDocId === v.id && (
                                        <div className="p-4 bg-white/70 dark:bg-slate-900/50 border-t border-gray-100 dark:border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                 <p className="text-sm font-medium text-muted mb-2">{tx('dashboard.admin.verification.frontSide', undefined, 'Front side')}</p>
                                                 {v.front_image_url ? (
                                                     <a href={v.front_image_url} target="_blank" rel="noopener noreferrer">
                                                         <img src={v.front_image_url} alt="front" className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-white/10 hover:opacity-90 transition" />
                                                     </a>
                                                 ) : (
                                                     <div className="w-full rounded-lg aspect-video bg-gray-100 dark:bg-white/10 flex items-center justify-center text-muted text-sm">{tx('dashboard.admin.verification.noImage', undefined, 'No image')}</div>
                                                 )}
                                             </div>
                                            <div>
                                                 <p className="text-sm font-medium text-muted mb-2">{tx('dashboard.admin.verification.backSide', undefined, 'Back side')}</p>
                                                 {v.back_image_url ? (
                                                     <a href={v.back_image_url} target="_blank" rel="noopener noreferrer">
                                                         <img src={v.back_image_url} alt="back" className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-white/10 hover:opacity-90 transition" />
                                                     </a>
                                                 ) : (
                                                     <div className="w-full rounded-lg aspect-video bg-gray-100 dark:bg-white/10 flex items-center justify-center text-muted text-sm">{tx('dashboard.admin.verification.noImage', undefined, 'No image')}</div>
                                                 )}
                                             </div>
                                            <div>
                                                 <p className="text-sm font-medium text-muted mb-2">{tx('dashboard.admin.verification.selfie', undefined, 'Selfie')}</p>
                                                 {v.selfie_url ? (
                                                     <a href={v.selfie_url} target="_blank" rel="noopener noreferrer">
                                                         <img src={v.selfie_url} alt="selfie" className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-white/10 hover:opacity-90 transition" />
                                                     </a>
                                                 ) : (
                                                     <div className="w-full rounded-lg aspect-video bg-gray-100 dark:bg-white/10 flex items-center justify-center text-muted text-sm">{tx('dashboard.admin.verification.noImage', undefined, 'No image')}</div>
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
    );
}
