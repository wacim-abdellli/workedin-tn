import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, Shield, Loader2, Sparkles, Lock, ScanLine, AlertCircle } from 'lucide-react';
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
        setLoading(true);

        try {
            if (!/^\d{8}$/.test(cinNumber)) {
                showToast(tx('verifyIdentity.errors.invalidCin', undefined, 'رقم البطاقة يجب أن يحتوي على 8 أرقام'), 'error');
                setLoading(false);
                return;
            }
            if (!uploads.front || !uploads.back || !uploads.selfie) {
                showToast(tx('verifyIdentity.errors.missingImages', undefined, 'يرجى تحميل جميع الصور المطلوبة'), 'error');
                setLoading(false);
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

            // Delete any existing verification record
            try {
                await supabaseWithRetry(() => supabase.from('identity_verifications').delete().eq('user_id', authUserId));
            } catch { /* no-op */ }

            try {
                await runWithTimeout(
                    supabaseWithRetry(() =>
                        supabase.from('identity_verifications').insert({
                            user_id: authUserId, cin_number: cinNumber,
                            cin_front_url: frontPath, cin_back_url: backPath, selfie_url: selfiePath,
                            status: 'pending', submitted_at: new Date().toISOString(),
                        }).select().single()
                    ),
                    30000, 'Verify identity insert'
                );
            } catch (fetchError) {
                const fetchErrorMeta = typeof fetchError === 'object' && fetchError !== null
                    ? (fetchError as { status?: number; code?: string })
                    : {};
                const { status, code } = fetchErrorMeta;
                if (fetchError instanceof Error && fetchError.message.includes('timed out after'))
                    throw new Error(tx('verifyIdentity.errors.insertTimeout', undefined, 'Database insert timed out after 30 seconds.'));
                if (status === 409 || code === '23505')
                    throw new Error(tx('verifyIdentity.errors.alreadySubmitted', undefined, 'You already have a verification request.'));
                if (status === 403 || code === '42501')
                    throw new Error(tx('verifyIdentity.errors.permissions', undefined, 'Permission denied. Please sign out and sign in again.'));
                throw fetchError;
            }

            // No need to update cin_submitted - verification table is source of truth
            await refreshProfile?.();
            void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY(authUserId) });

            setStep('submitted');
            showToast(tx('verifyIdentity.success.submitted', undefined, 'تم تقديم طلب التحقق بنجاح'), 'success');
        } catch (error) {
            logger.error('Verification submission error:', error);
            const msg = error instanceof Error ? error.message : tx('verifyIdentity.errors.unexpected', undefined, 'An unexpected error occurred');
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
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
                <SEO title={tx('verifyIdentity.seo.title', undefined, 'التحقق من الهوية')} description="" />
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center bg-card bg-opacity-100 rounded-3xl p-12 shadow-xl border border-green-100 dark:border-green-900">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">{tx('verifyIdentity.verified.title', undefined, 'تم التحقق من هويتك بنجاح')}</h2>
                        <p className="text-muted-foreground text-lg mb-8">{tx('verifyIdentity.verified.description', undefined, 'حسابك موثق الآن وحصلت على شارة التحقق الزرقاء.')}</p>
                        <button onClick={() => navigate('/settings?tab=profile')} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20">
                            {tx('verifyIdentity.backToSettings', undefined, 'العودة إلى الإعدادات')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (effectiveStatus === 'pending') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-10">
                <SEO title={tx('verifyIdentity.pending.seoTitle', undefined, 'طلب التحقق قيد المراجعة')} description="" />
                <div className="container mx-auto px-4">
                    <div className="relative max-w-2xl mx-auto text-center bg-card bg-opacity-100 rounded-3xl p-8 md:p-12 shadow-xl border-2 border-orange-200 dark:border-orange-900 overflow-hidden">
                        <div className="pointer-events-none absolute -top-16 -end-12 h-40 w-40 rounded-full bg-orange-300/20 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-20 -start-16 h-44 w-44 rounded-full bg-yellow-300/10 blur-2xl" />
                        <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-12 h-12 text-orange-500 dark:text-orange-400" />
                        </div>
                        <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <Loader2 className="w-4 h-4 animate-spin" />{tx('verifyIdentity.pending.badge', undefined, 'قيد المراجعة')}
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">{tx('verifyIdentity.pending.title', undefined, 'طلبك قيد المراجعة')}</h2>
                        <p className="text-muted-foreground text-lg mb-6">{tx('verifyIdentity.pending.description', undefined, 'تم استلام طلب التحقق من هويتك بنجاح.')}</p>
                        <div className="bg-surface rounded-2xl p-5 md:p-6 mb-8">
                            <div className="flex items-center justify-center gap-3 text-muted-foreground">
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                                <span>{tx('verifyIdentity.pending.reviewTime', undefined, 'مدة المراجعة: 24 ساعة كحد أقصى')}</span>
                            </div>
                            <p className="text-sm text-muted mt-2">{tx('verifyIdentity.pending.emailNotice', undefined, 'سيتم إشعارك عبر البريد الإلكتروني فور اكتمال المراجعة')}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button onClick={() => navigate('/settings?tab=profile')} className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20">
                                {tx('verifyIdentity.backToSettings', undefined, 'العودة إلى الإعدادات')}
                            </button>
                            <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto border border-border px-8 py-3 rounded-xl font-medium text-foreground hover:bg-secondary transition-colors">
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
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-10">
                <SEO title={tx('verifyIdentity.submitted.seoTitle', undefined, 'تم تقديم الطلب')} description="" />
                <div className="container mx-auto px-4">
                    <div className="relative max-w-2xl mx-auto text-center bg-card bg-opacity-100 rounded-3xl p-8 md:p-12 shadow-xl border border-primary-100 dark:border-primary-900 overflow-hidden">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute top-8 left-[15%] h-2 w-2 rounded-full bg-primary-400 animate-ping" />
                            <div className="absolute top-20 right-[18%] h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                            <div className="absolute bottom-16 right-[24%] h-2 w-2 rounded-full bg-green-400 animate-ping" />
                            <div className="absolute bottom-10 left-[20%] h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse" />
                        </div>
                        <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Shield className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">{tx('verifyIdentity.submitted.title', undefined, 'تم استلام طلبك بنجاح')}</h2>
                        <p className="text-muted-foreground text-lg mb-8">{tx('verifyIdentity.submitted.description', undefined, 'سيقوم فريقنا بمراجعة مستنداتك والرد عليك في أقرب وقت ممكن (عادة خلال 24 ساعة).')}</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button onClick={() => navigate('/settings?tab=profile')} className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20">
                                {tx('verifyIdentity.backToSettings', undefined, 'العودة إلى الإعدادات')}
                            </button>
                            <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto border border-border px-8 py-3 rounded-xl font-medium text-foreground hover:bg-secondary transition-colors">
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
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#13294f_0%,_#0b1328_40%,_#0b1020_100%)] py-10">
            <SEO title={tx('verifyIdentity.seo.title', undefined, 'التحقق من الهوية')} description={tx('verifyIdentity.seo.description', undefined, 'قم بتوثيق هويتك لزيادة ثقة العملاء وفتح جميع ميزات المنصة')} />
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-4xl">
                    {/* Header */}
                    <div className="mb-10 text-center px-1">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 dark:bg-black/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/90">
                            <Sparkles className="h-3.5 w-3.5" />
                            {tx('verifyIdentity.header.kicker', undefined, 'Secure Account Upgrade')}
                        </div>
                        <h1 className="mb-3 text-3xl font-bold text-white md:text-4xl">{tx('verifyIdentity.header.title', undefined, 'Identity verification')}</h1>
                        <p className="mx-auto max-w-2xl text-lg text-slate-300">{tx('verifyIdentity.header.subtitle', undefined, 'خطوة واحدة تفصلك عن زيادة ثقة عملائك وحماية حسابك')}</p>
                        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-100">
                            <Loader2 className="h-3.5 w-3.5" />
                            {tx('verifyIdentity.header.eta', undefined, 'Takes about 2-3 minutes to complete')}
                        </div>
                    </div>

                    {/* Security badges */}
                    <div className="mb-8 grid gap-3 md:grid-cols-3">
                        {[
                            { icon: <Lock className="h-4 w-4" />, title: tx('verifyIdentity.security.title', undefined, 'Encrypted storage'), desc: tx('verifyIdentity.security.desc', undefined, 'Your documents are encrypted and only used for account verification.') },
                            { icon: <ScanLine className="h-4 w-4" />, title: tx('verifyIdentity.security.qualityTitle', undefined, 'Smart quality checks'), desc: tx('verifyIdentity.security.qualityDesc', undefined, 'We validate file format, size, and basic image quality before upload.') },
                            { icon: <Loader2 className="h-4 w-4" />, title: tx('verifyIdentity.security.reviewTitle', undefined, 'Fast review'), desc: tx('verifyIdentity.security.reviewDesc', undefined, 'Most verification requests are reviewed within 24 hours.') },
                        ].map((b, i) => (
                            <div key={i} className="rounded-2xl border border-white/10 dark:border-white/10 bg-white/10 dark:bg-black/20 p-4 text-sm text-slate-200 backdrop-blur-sm">
                                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 dark:bg-black/20 text-blue-200">{b.icon}</div>
                                <p className="font-semibold text-white">{b.title}</p>
                                <p className="mt-1 text-xs text-slate-300">{b.desc}</p>
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
