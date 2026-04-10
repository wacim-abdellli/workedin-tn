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
import { adminInsetClass, adminPanelClass, adminPillClass } from './adminTheme';

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

    // All signed URL attempts failed. Do NOT fall back to a public URL —
    // identity-documents is a private bucket and public URLs must never be
    // constructed for CIN/selfie documents. Return null so the caller renders
    // the "No image" placeholder instead.
    console.warn('[resolveIdentityDocumentUrl] Could not generate signed URL for identity document. Path:', parsed.path);
    return null;
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

    const panelClass = adminPanelClass;
    const actionTimeoutMs = 20_000;

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
            const verification = verifications.find(v => v.id === id);
            const userId = verification?.user_id ?? null;

            if (!userId) {
                throw new Error(tx('dashboard.admin.verification.notUpdated', undefined, 'Verification request was not updated.'));
            }

            const cinVerified = action === 'approved';

            // Try RPC first, fall back to direct updates if it fails
            const { error: rpcError } = await supabaseWithRetry(() =>
                client.rpc('update_verification_status', {
                    p_user_id: userId,
                    p_action: action,
                    p_reviewed_at: new Date().toISOString(),
                })
            , { timeoutMs: actionTimeoutMs, throwOnError: false });

            if (rpcError) {
                console.warn('[VerificationsTab] RPC failed, falling back to direct updates:', rpcError);

                // Fallback: direct table updates
                const { error: ivError } = await supabase
                    .from('identity_verifications')
                    .update({ status: action, reviewed_at: new Date().toISOString() })
                    .eq('user_id', userId)
                    .eq('status', 'pending');
                if (ivError) throw ivError;

                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ cin_verified: cinVerified, updated_at: new Date().toISOString() })
                    .eq('id', userId);
                if (profileError) throw profileError;

                // Best-effort update freelancer_profiles
                await supabase
                    .from('freelancer_profiles')
                    .update({ cin_verified: cinVerified })
                    .eq('id', userId);
            }

            console.log('[VerificationsTab] Verification status updated:', action);

            await Promise.resolve(load()).catch((reloadError) => {
                console.warn('Verification reload failed after action:', reloadError);
            });
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
                <div className={`${panelClass} p-5`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
                                <Shield className="w-4 h-4 text-amber-400" />
                            </div>
                            <h3 className="font-bold text-white text-base">
                                {tx('dashboard.admin.verification.title', undefined, 'Identity verification requests')}
                                {verifications.length > 0 && (
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${adminPillClass('amber')}`}>
                                        {verifications.length} {tx('dashboard.admin.verification.pending', undefined, 'pending')}
                                    </span>
                                )}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={load}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#111] px-4 text-sm font-semibold text-white transition-all hover:border-[#3a3a3a] hover:bg-[#1a1a1a]"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            {tx('dashboard.admin.verification.refresh', undefined, 'Refresh')}
                        </button>
                    </div>
                </div>

                <div className={panelClass}>
                    {loading ? (
                        <SkeletonList count={3} />
                    ) : verifications.length === 0 ? (
                         <div className="text-center py-12">
                             <Check className="w-12 h-12 text-[var(--color-status-success)] mx-auto mb-2" />
                             <p className="text-foreground font-medium">{tx('dashboard.admin.verification.noPending', undefined, 'No pending requests')}</p>
                             <p className="text-sm text-muted">{tx('dashboard.admin.verification.allProcessed', undefined, 'All verification requests are processed')}</p>
                         </div>
                    ) : (
                        <div className="space-y-4">
                            {verifications.map(v => (
                                <div key={v.id} className={`${adminInsetClass} overflow-hidden`}>
                                    <div className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-muted)] dark:bg-[var(--color-bg-muted)] dark:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                {v.profile?.avatar_url ? (
                                                    <img src={v.profile.avatar_url} alt={v.profile.full_name || 'user'} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Shield className="w-6 h-6 text-[var(--color-text-muted)] dark:text-[var(--color-text-disabled)]" />
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
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${adminPillClass('blue')}`}>{v.document_type || 'CIN'}</span>
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
                                                 className="text-[var(--color-status-error)] hover:bg-[var(--color-status-error-subtle)]"
                                                 disabled={actioningId === v.id}
                                                 onClick={() => handleAction(v.id, 'rejected')}
                                             >
                                                 <X className="w-4 h-4 ml-1" />
                                                 {tx('dashboard.admin.verification.reject', undefined, 'Reject')}
                                             </Button>
                                        </div>
                                    </div>

                                    {expandedDocId === v.id && (
                                        <div className="grid grid-cols-1 gap-4 border-t border-slate-200/70 p-4 dark:border-white/8 md:grid-cols-3">
                                            <div>
                                                 <p className="text-sm font-medium text-muted mb-2">{tx('dashboard.admin.verification.frontSide', undefined, 'Front side')}</p>
                                                 {v.front_image_url ? (
                                                     <a href={v.front_image_url} target="_blank" rel="noopener noreferrer">
                                                         <img src={v.front_image_url} alt={tx('ui.front')} className="w-full rounded-lg object-cover aspect-video border border-[var(--color-border-default)] dark:border-[var(--color-border-default)] dark:border-white/10 dark:border-[var(--color-border-strong)] hover:opacity-90 transition" />
                                                     </a>
                                                 ) : (
                                                     <div className="w-full rounded-lg aspect-video bg-[var(--color-bg-subtle)] dark:bg-white/10 flex items-center justify-center text-muted text-sm">{tx('dashboard.admin.verification.noImage', undefined, 'No image')}</div>
                                                 )}
                                             </div>
                                            <div>
                                                 <p className="text-sm font-medium text-muted mb-2">{tx('dashboard.admin.verification.backSide', undefined, 'Back side')}</p>
                                                 {v.back_image_url ? (
                                                     <a href={v.back_image_url} target="_blank" rel="noopener noreferrer">
                                                         <img src={v.back_image_url} alt={tx('ui.back')} className="w-full rounded-lg object-cover aspect-video border border-[var(--color-border-default)] dark:border-[var(--color-border-default)] dark:border-white/10 dark:border-[var(--color-border-strong)] hover:opacity-90 transition" />
                                                     </a>
                                                 ) : (
                                                     <div className="w-full rounded-lg aspect-video bg-[var(--color-bg-subtle)] dark:bg-white/10 flex items-center justify-center text-muted text-sm">{tx('dashboard.admin.verification.noImage', undefined, 'No image')}</div>
                                                 )}
                                             </div>
                                            <div>
                                                 <p className="text-sm font-medium text-muted mb-2">{tx('dashboard.admin.verification.selfie', undefined, 'Selfie')}</p>
                                                 {v.selfie_url ? (
                                                     <a href={v.selfie_url} target="_blank" rel="noopener noreferrer">
                                                         <img src={v.selfie_url} alt={tx('ui.selfie')} className="w-full rounded-lg object-cover aspect-video border border-[var(--color-border-default)] dark:border-[var(--color-border-default)] dark:border-white/10 dark:border-[var(--color-border-strong)] hover:opacity-90 transition" />
                                                     </a>
                                                 ) : (
                                                     <div className="w-full rounded-lg aspect-video bg-[var(--color-bg-subtle)] dark:bg-white/10 flex items-center justify-center text-muted text-sm">{tx('dashboard.admin.verification.noImage', undefined, 'No image')}</div>
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
