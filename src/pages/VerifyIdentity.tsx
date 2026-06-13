import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, Shield, Loader2, Sparkles, Lock, ScanLine, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { logger } from '@/lib/logger';
import { supabase, uploadFileWithMetadata, withTimeout } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { useToast } from '@/components/ui/Toast';
import SEO from '@/components/common/SEO';
import DocumentUpload from '@/components/verify/DocumentUpload';
import type { FileMeta } from '@/components/verify/DocumentUpload';
import VerificationStepper from '@/components/verify/VerificationStepper';
import VerificationReview from '@/components/verify/VerificationReview';
import { NOTIFICATIONS_QUERY_KEY } from '@/hooks/useRealtimeNotifications';
import { getVerificationStatus, subscribeToVerificationChanges, type VerificationStatus } from '@/lib/verificationStatus';

type UploadStep = 'front' | 'back' | 'selfie' | 'review' | 'submitted';

interface UploadState { front: File | null; back: File | null; selfie: File | null; }
interface PreviewState { front: string; back: string; selfie: string; }

export default function VerifyIdentity() {
    const { user, profile, session, refreshProfile } = useAuth();
    const { tx } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const [step, setStep] = useState<UploadStep>('front');
    const [uploads, setUploads] = useState<UploadState>({ front: null, back: null, selfie: null });
    const [cinNumber, setCinNumber] = useState('');
    const [previews, setPreviews] = useState<PreviewState>({ front: '', back: '', selfie: '' });
    const [fileMeta, setFileMeta] = useState<Record<'front' | 'back' | 'selfie', FileMeta | null>>({ front: null, back: null, selfie: null });
    const [fileErrors, setFileErrors] = useState<Record<'front' | 'back' | 'selfie', string>>({ front: '', back: '', selfie: '' });
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [consent, setConsent] = useState(false);
    const [resolvedIdentityStatus, setResolvedIdentityStatus] = useState<VerificationStatus | null>(null);

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

    // Use shared verification status helper - single source of truth
    useEffect(() => {
        if (!user?.id) {
            setResolvedIdentityStatus('missing');
            return;
        }

        let isCancelled = false;

        const fetchStatus = async () => {
            try {
                const state = await getVerificationStatus(user.id);
                if (!isCancelled) {
                    setResolvedIdentityStatus(state.status);
                    
                    // Verification approval is now server-owned. Just refresh local profile state.
                    if (state.status === 'verified' && !profile?.cin_verified) {
                        await refreshProfile?.();
                    }
                }
            } catch (error) {
                logger.error('Failed to fetch verification status', error);
                if (!isCancelled) {
                    setResolvedIdentityStatus(profile?.cin_verified ? 'verified' : 'missing');
                }
            }
        };

        fetchStatus();

        // Real-time sync - updates when admin approves/rejects
        const unsubscribe = subscribeToVerificationChanges(user.id, (state) => {
            if (!isCancelled) {
                setResolvedIdentityStatus(state.status);
            }
        });

        return () => {
            isCancelled = true;
            unsubscribe();
        };
    }, [user?.id, profile?.cin_verified]);

    const handleFileSelect = useCallback(async (type: 'front' | 'back' | 'selfie', file: File) => {
        setIsProcessingFile(true);
        setFileErrors(prev => ({ ...prev, [type]: '' }));

        if (file.size > 5 * 1024 * 1024) {
            const msg = tx('verifyIdentity.errors.fileTooLarge', undefined, 'File is too large (max 5MB)');
            showToast(msg, 'error');
            setFileErrors(prev => ({ ...prev, [type]: msg }));
            setIsProcessingFile(false);
            return;
        }
        if (!file.type.startsWith('image/')) {
            const msg = tx('verifyIdentity.errors.invalidImage', undefined, 'Please upload a valid image file');
            showToast(msg, 'error');
            setFileErrors(prev => ({ ...prev, [type]: msg }));
            setIsProcessingFile(false);
            return;
        }

        try {
            await new Promise<void>((resolve, reject) => {
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => {
                    const valid = img.width >= 640 && img.height >= 420;
                    URL.revokeObjectURL(url);
                    if (valid) {
                        resolve();
                    } else {
                        reject(new Error(tx('verifyIdentity.errors.lowResolution', undefined, 'Image resolution is too low. Use a clearer photo.')));
                    }
                };
                img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(tx('verifyIdentity.errors.invalidImage', undefined, 'Please upload a valid image file'))); };
                img.src = url;
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : tx('verifyIdentity.errors.invalidImage', undefined, 'Please upload a valid image file');
            showToast(msg, 'error');
            setFileErrors(prev => ({ ...prev, [type]: msg }));
            setIsProcessingFile(false);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
            setUploads(prev => ({ ...prev, [type]: file }));
            setFileMeta(prev => ({ ...prev, [type]: { name: file.name, sizeKB: Math.max(1, Math.round(file.size / 1024)) } }));
            setFileErrors(prev => ({ ...prev, [type]: '' }));
            setIsProcessingFile(false);
        };
        reader.onerror = () => {
            const msg = tx('verifyIdentity.errors.fileReadFailed', undefined, 'Failed to read this file. Please try another image.');
            setFileErrors(prev => ({ ...prev, [type]: msg }));
            showToast(msg, 'error');
            setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
    }, [showToast, tx]);

    const clearUpload = (type: 'front' | 'back' | 'selfie') => {
        setUploads(prev => ({ ...prev, [type]: null }));
        setPreviews(prev => ({ ...prev, [type]: '' }));
        setFileMeta(prev => ({ ...prev, [type]: null }));
        setFileErrors(prev => ({ ...prev, [type]: '' }));
    };

    const handleSubmit = async () => {
        if (!user) {
            showToast(tx('verifyIdentity.errors.noSession', undefined, 'No auth session - please login again'), 'error');
            navigate('/login');
            return;
        }
        if (loading) return;
        setLoading(true);

        try {
            if (!/^\d{8}$/.test(cinNumber)) {
                showToast(tx('verifyIdentity.errors.invalidCin', undefined, 'رقم البطاقة يجب أن يحتوي على 8 أرقام'), 'error');
                return;
            }
            if (!uploads.front || !uploads.back || !uploads.selfie) {
                showToast(tx('verifyIdentity.errors.missingImages', undefined, 'يرجى تحميل جميع الصور المطلوبة'), 'error');
                return;
            }

            const { data: { session: liveSessionDataSession } } = await supabase.auth.getSession();
            if (!liveSessionDataSession && !user) {
                showToast(tx('verifyIdentity.loginAgainError', undefined, 'Please log in again'), 'error');
                navigate('/login');
                return;
            }
            const liveSession = liveSessionDataSession ?? session;
            if (!liveSession) throw new Error(tx('verifyIdentity.errors.noSession', undefined, 'No auth session - please login again'));

            const sessionUser = liveSession.user;
            const authUserId = sessionUser?.id ?? user.id;
            const authUserMetadata = sessionUser?.user_metadata ?? user.user_metadata;

            // Block duplicate submissions and keep status screen in sync without waiting for refresh.
            const currentState = await getVerificationStatus(authUserId);
            if (currentState.status === 'pending') {
                setResolvedIdentityStatus('pending');
                setStep('submitted');
                showToast(tx('verifyIdentity.errors.alreadyUnderReview', undefined, 'Your verification request is already under review.'), 'info');
                return;
            }
            if (currentState.status === 'verified') {
                setResolvedIdentityStatus('verified');
                showToast(tx('verifyIdentity.errors.alreadyVerified', undefined, 'Your identity is already verified.'), 'info');
                return;
            }

            const runWithTimeout = <T,>(op: Promise<T>, ms: number, name: string) => withTimeout(op, ms, name);

            const uploadFile = async (file: File, path: string): Promise<string> => {
                const uploaded = await runWithTimeout(
                    uploadFileWithMetadata('identity-documents', path, file),
                    20000,
                    `Upload ${path}`,
                );

                return uploaded.path;
            };

            const ts = Date.now();
            const frontExt = uploads.front.name.split('.').pop() || 'jpg';
            const backExt = uploads.back.name.split('.').pop() || 'jpg';
            const selfieExt = uploads.selfie.name.split('.').pop() || 'jpg';
            const frontPath = await uploadFile(uploads.front, `${authUserId}/cin_front_${ts}.${frontExt}`);
            const backPath = await uploadFile(uploads.back, `${authUserId}/cin_back_${ts}.${backExt}`);
            const selfiePath = await uploadFile(uploads.selfie, `${authUserId}/selfie_${ts}.${selfieExt}`);

            // Ensure profile exists
            const { data: profileData } = await supabaseWithRetry(() =>
                supabase.from('profiles').select('id').eq('id', authUserId).maybeSingle()
            );

            if (!profileData) {
                await supabaseWithRetry(() =>
                    supabase.from('profiles').insert({
                        id: authUserId,
                        full_name: authUserMetadata?.full_name || user.email?.split('@')[0] || 'User',
                        user_type: profile?.user_type || 'client',
                    })
                );
            }

            const verificationPayload = {
                user_id: authUserId,
                cin_number: cinNumber,
                cin_front_url: frontPath,
                cin_back_url: backPath,
                selfie_url: selfiePath,
                status: 'pending' as const,
                submitted_at: new Date().toISOString(),
            };

            const insertVerification = () => runWithTimeout(
                supabaseWithRetry(
                    () => supabase.from('identity_verifications').insert(verificationPayload).select('id').single(),
                    { throwOnError: false }
                ),
                30000,
                'Verify identity insert'
            );

            let insertResult = await insertVerification();
            if (insertResult.error) {
                const insertError = (insertResult.error ?? {}) as { status?: number; code?: string; message?: string };
                const errorMessage = typeof insertError.message === 'string' ? insertError.message.toLowerCase() : '';

                if (insertError.status === 409 || insertError.code === '23505' || errorMessage.includes('duplicate key')) {
                    const latestState = await getVerificationStatus(authUserId);
                    if (latestState.status === 'pending') {
                        setResolvedIdentityStatus('pending');
                        setStep('submitted');
                        throw new Error(tx('verifyIdentity.errors.alreadyUnderReview', undefined, 'Your verification request is already under review.'));
                    }
                    if (latestState.status === 'verified') {
                        setResolvedIdentityStatus('verified');
                        throw new Error(tx('verifyIdentity.errors.alreadyVerified', undefined, 'Your identity is already verified.'));
                    }

                    // Recover from stale rejected rows by clearing the old request and inserting again once.
                    const cleanupResult = await supabaseWithRetry(
                        () => supabase.from('identity_verifications').delete().eq('user_id', authUserId),
                        { throwOnError: false }
                    );

                    if (cleanupResult.error) {
                        throw new Error(tx('verifyIdentity.errors.resubmitBlocked', undefined, 'Unable to reset your previous request. Please contact support.'));
                    }

                    insertResult = await insertVerification();
                    if (insertResult.error) throw insertResult.error;
                } else if (insertError.status === 403 || insertError.code === '42501') {
                    throw new Error(tx('verifyIdentity.errors.permissions', undefined, 'Permission denied. Please sign out and sign in again.'));
                } else {
                    throw insertResult.error;
                }
            }

            // No need to update cin_submitted - verification table is source of truth
            await refreshProfile?.();
            void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY(authUserId) });

            setResolvedIdentityStatus('pending');
            setStep('submitted');
            showToast(tx('verifyIdentity.success.submitted', undefined, 'تم تقديم طلب التحقق بنجاح'), 'success');
        } catch (error) {
            logger.error('Verification submission error:', error);
            const msg = error instanceof Error
                ? error.message.includes('timed out after')
                    ? tx('verifyIdentity.errors.insertTimeout', undefined, 'Database insert timed out after 30 seconds.')
                    : error.message
                : tx('verifyIdentity.errors.unexpected', undefined, 'An unexpected error occurred');
            showToast(tx('verifyIdentity.errors.withMessage', { message: msg }, `خطأ: ${msg}`), 'error');
        } finally {
            setLoading(false);
        }
    };

    const stepLabels = [
        tx('verifyIdentity.progress.front', undefined, 'وجه البطاقة'),
        tx('verifyIdentity.progress.back', undefined, 'ظهر البطاقة'),
        tx('verifyIdentity.progress.selfie', undefined, 'صورة شخصية'),
        tx('verifyIdentity.progress.review', undefined, 'المراجعة'),
    ];

    const uploadSteps = useMemo(() => [
        { key: 'front' as const, title: tx('verifyIdentity.steps.front.title', undefined, 'ID card front side'), description: tx('verifyIdentity.steps.front.description', undefined, 'Upload a clear image of the front side of your national ID card'), icon: <CheckCircle2 className="w-8 h-8" />, tip: tx('verifyIdentity.tips.front', undefined, 'Place the ID on a dark background and avoid flash reflections.'), captureMode: 'environment' as const },
        { key: 'back' as const, title: tx('verifyIdentity.steps.back.title', undefined, 'ID card back side'), description: tx('verifyIdentity.steps.back.description', undefined, 'Upload a clear image of the back side of your national ID card'), icon: <CheckCircle2 className="w-8 h-8" />, tip: tx('verifyIdentity.tips.back', undefined, 'Make sure all edges and numbers are visible and in focus.'), captureMode: 'environment' as const },
        { key: 'selfie' as const, title: tx('verifyIdentity.steps.selfie.title', undefined, 'Selfie photo'), description: tx('verifyIdentity.steps.selfie.description', undefined, 'Take a clear selfie for identity matching'), icon: <Camera className="w-8 h-8" />, tip: tx('verifyIdentity.tips.selfie', undefined, 'Face the camera in good light and avoid hats or sunglasses.'), captureMode: 'user' as const },
    ], [tx]);

    const checklist = useMemo(() => [
        { key: 'front', ok: Boolean(uploads.front), label: tx('verifyIdentity.review.checkFront', undefined, 'Front image added') },
        { key: 'back', ok: Boolean(uploads.back), label: tx('verifyIdentity.review.checkBack', undefined, 'Back image added') },
        { key: 'selfie', ok: Boolean(uploads.selfie), label: tx('verifyIdentity.review.checkSelfie', undefined, 'Selfie added') },
        { key: 'cin', ok: cinNumber.length === 8, label: tx('verifyIdentity.review.checkCin', undefined, 'CIN number valid') },
        { key: 'consent', ok: consent, label: tx('verifyIdentity.review.checkConsent', undefined, 'Privacy consent accepted') },
    ], [uploads.front, uploads.back, uploads.selfie, cinNumber.length, consent, tx]);

    const effectiveStatus = resolvedIdentityStatus ?? 'missing';

    // ── Status screens ──────────────────────────────────────────────────────────
    if (effectiveStatus === 'verified') {
        return (
            <div className="min-h-screen bg-zinc-950 text-white py-16 relative overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))]">
                <SEO title={tx('verifyIdentity.seo.title', undefined, 'التحقق من الهوية')} description="" />
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center border border-zinc-800/80 bg-zinc-950/50 backdrop-blur-2xl rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden shadow-emerald-950/5 animate-in fade-in zoom-in duration-500">
                        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400" />
                        <div className="w-20 h-20 bg-gradient-to-b from-emerald-500/15 to-teal-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:scale-105 transition-transform duration-300">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">{tx('verifyIdentity.verified.title', undefined, 'تم التحقق من هويتك بنجاح')}</h2>
                        <p className="text-zinc-400 text-base mb-8 max-w-md mx-auto leading-relaxed">{tx('verifyIdentity.verified.description', undefined, 'حسابك موثق الآن وحصلت على شارة التحقق الزرقاء.')}</p>
                        <button onClick={() => navigate('/settings?tab=profile')} className="bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-zinc-950 px-8 py-3.5 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/10">
                            {tx('verifyIdentity.backToSettings', undefined, 'العودة إلى الإعدادات')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (effectiveStatus === 'pending') {
        return (
            <div className="min-h-screen bg-zinc-950 text-white py-16 relative overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.12),rgba(255,255,255,0))]">
                <SEO title={tx('verifyIdentity.pending.seoTitle', undefined, 'طلب التحقق قيد المراجعة')} description="" />
                <div className="container mx-auto px-4">
                    <div className="relative max-w-2xl mx-auto text-center border border-zinc-800/80 bg-zinc-950/50 backdrop-blur-2xl rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden shadow-amber-950/5 animate-in fade-in zoom-in duration-500">
                        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400" />
                        <div className="w-20 h-20 bg-gradient-to-b from-amber-500/15 to-yellow-500/5 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(245,158,11,0.2)] hover:scale-105 transition-transform duration-300">
                            <Shield className="w-10 h-10 text-amber-400" />
                        </div>
                        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />{tx('verifyIdentity.pending.badge', undefined, 'قيد المراجعة')}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">{tx('verifyIdentity.pending.title', undefined, 'طلبك قيد المراجعة')}</h2>
                        <p className="text-zinc-400 text-base mb-6 leading-relaxed">{tx('verifyIdentity.pending.description', undefined, 'تم استلام طلب التحقق من هويتك بنجاح.')}</p>
                        <div className="bg-zinc-900/25 border border-zinc-800/60 rounded-2xl p-5 md:p-6 mb-8 backdrop-blur-sm shadow-inner">
                            <div className="flex items-center justify-center gap-3 text-zinc-350">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                <span className="font-semibold text-zinc-200">{tx('verifyIdentity.pending.reviewTime', undefined, 'مدة المراجعة: 24 ساعة كحد أقصى')}</span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-2">{tx('verifyIdentity.pending.emailNotice', undefined, 'سيتم إشعارك عبر البريد الإلكتروني فور اكتمال المراجعة')}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button onClick={() => navigate('/settings?tab=profile')} className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-zinc-950 px-8 py-3.5 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/10">
                                {tx('verifyIdentity.backToSettings', undefined, 'العودة إلى الإعدادات')}
                            </button>
                            <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto bg-zinc-900/40 border border-zinc-800/80 hover:bg-zinc-800/60 hover:text-white px-8 py-3.5 rounded-xl font-bold text-zinc-300 transition-all duration-300 shadow-md backdrop-blur-md">
                                {tx('verifyIdentity.goToDashboard', undefined, 'Go to dashboard')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'submitted') {
        return (
            <div className="min-h-screen bg-zinc-950 text-white py-16 relative overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.12),rgba(255,255,255,0))]">
                <SEO title={tx('verifyIdentity.submitted.seoTitle', undefined, 'تم تقديم الطلب')} description="" />
                <div className="container mx-auto px-4">
                    <div className="relative max-w-2xl mx-auto text-center border border-zinc-800/80 bg-zinc-950/50 backdrop-blur-2xl rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden shadow-purple-950/5 animate-in fade-in zoom-in duration-500">
                        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-400" />
                        <div className="w-20 h-20 bg-gradient-to-b from-purple-500/15 to-indigo-500/5 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(139,92,246,0.2)] hover:scale-105 transition-transform duration-300">
                            <Shield className="w-10 h-10 text-purple-450" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">{tx('verifyIdentity.submitted.title', undefined, 'تم استلام طلبك بنجاح')}</h2>
                        <p className="text-zinc-400 text-base mb-8 max-w-md mx-auto leading-relaxed">{tx('verifyIdentity.submitted.description', undefined, 'سيقوم فريقنا بمراجعة مستنداتك والرد عليك في أقرب وقت ممكن (عادة خلال 24 ساعة).')}</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button onClick={() => navigate('/settings?tab=profile')} className="w-full sm:w-auto bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 hover:from-purple-600 hover:to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/10">
                                {tx('verifyIdentity.backToSettings', undefined, 'العودة إلى الإعدادات')}
                            </button>
                            <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto bg-zinc-900/40 border border-zinc-800/80 hover:bg-zinc-800/60 hover:text-white px-8 py-3.5 rounded-xl font-bold text-zinc-300 transition-all duration-300 shadow-md backdrop-blur-md">
                                {tx('verifyIdentity.goToDashboard', undefined, 'Go to dashboard')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    // ── Main flow ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-zinc-950 text-white py-12 relative overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.12),rgba(255,255,255,0))]">
            <SEO title={tx('verifyIdentity.seo.title', undefined, 'التحقق من الهوية')} description={tx('verifyIdentity.seo.description', undefined, 'قم بتوثيق هويتك لزيادة ثقة العملاء وفتح جميع ميزات المنصة')} />
            
            {/* Background glowing decorations */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Header */}
                    <div className="mb-10 text-center px-1">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                            <Sparkles className="h-3.5 w-3.5" />
                            {tx('verifyIdentity.header.kicker', undefined, 'Secure Account Upgrade')}
                        </div>
                        <h1 className="mb-3 text-3xl font-extrabold text-white md:text-4xl tracking-tight">{tx('verifyIdentity.header.title', undefined, 'Identity verification')}</h1>
                        <p className="mx-auto max-w-2xl text-base text-zinc-400 leading-relaxed">{tx('verifyIdentity.header.subtitle', undefined, 'خطوة واحدة تفصلك عن زيادة ثقة عملائك وحماية حسابك')}</p>
                        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4.5 py-1.5 text-xs font-semibold text-cyan-400">
                            <Clock className="h-3.5 w-3.5 animate-pulse" />
                            {tx('verifyIdentity.header.eta', undefined, 'Takes about 2-3 minutes to complete')}
                        </div>
                    </div>

                    {/* Security badges */}
                    <div className="mb-8 grid gap-4 md:grid-cols-3">
                        {[
                            { icon: <Lock className="h-4.5 w-4.5" />, title: tx('verifyIdentity.security.title', undefined, 'Encrypted storage'), desc: tx('verifyIdentity.security.desc', undefined, 'Your documents are encrypted and only used for account verification.') },
                            { icon: <ScanLine className="h-4.5 w-4.5" />, title: tx('verifyIdentity.security.qualityTitle', undefined, 'Smart quality checks'), desc: tx('verifyIdentity.security.qualityDesc', undefined, 'We validate file format, size, and basic image quality before upload.') },
                            { icon: <Clock className="h-4.5 w-4.5" />, title: tx('verifyIdentity.security.reviewTitle', undefined, 'Fast review'), desc: tx('verifyIdentity.security.reviewDesc', undefined, 'Most verification requests are reviewed within 24 hours.') },
                        ].map((b, i) => (
                            <div key={i} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/45 backdrop-blur-xl p-5 text-sm text-zinc-300 hover:border-purple-500/30 hover:bg-zinc-900/20 transition-all duration-300 hover:scale-[1.02] group">
                                <div className="mb-3.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:border-purple-500/40 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all duration-300">{b.icon}</div>
                                <p className="font-bold text-white text-base">{b.title}</p>
                                <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Stepper */}
                    <VerificationStepper
                        step={step}
                        stepLabels={stepLabels}
                        onStepClick={setStep}
                    />

                    {/* Step content */}
                    <div className="transition-colors duration-200">
                        {(step === 'front' || step === 'back' || step === 'selfie') && (() => {
                            const idx = step === 'front' ? 0 : step === 'back' ? 1 : 2;
                            const s = uploadSteps[idx];
                            return (
                                <DocumentUpload
                                    key={step}
                                    stepIndex={idx}
                                    totalSteps={4}
                                    inputId={`${step}-upload`}
                                    title={s.title}
                                    description={s.description}
                                    icon={s.icon}
                                    tip={s.tip}
                                    captureMode={s.captureMode}
                                    preview={previews[step]}
                                    fileMeta={fileMeta[step]}
                                    errorMessage={fileErrors[step]}
                                    onFileSelect={file => handleFileSelect(step, file)}
                                    onClear={() => clearUpload(step)}
                                    onNext={() => setStep(step === 'front' ? 'back' : step === 'back' ? 'selfie' : 'review')}
                                    onBack={step !== 'front' ? () => setStep(step === 'back' ? 'front' : 'back') : undefined}
                                    canProceed={Boolean(uploads[step])}
                                    isUploading={isProcessingFile}
                                />
                            );
                        })()}

                        {step === 'review' && (
                            <VerificationReview
                                previews={previews}
                                cinNumber={cinNumber}
                                consent={consent}
                                loading={loading}
                                checklist={checklist}
                                onCinChange={setCinNumber}
                                onConsentChange={setConsent}
                                onSubmit={handleSubmit}
                                onBack={() => setStep('selfie')}
                                onEditFront={() => setStep('front')}
                                onEditBack={() => setStep('back')}
                                onEditSelfie={() => setStep('selfie')}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
