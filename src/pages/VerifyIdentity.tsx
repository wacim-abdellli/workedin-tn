
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload,
    Camera,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    Shield,
    Loader2,
    Sparkles,
    Lock,
    ScanLine,
    FileCheck2,
    X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { logger } from '@/lib/logger';
import { supabase, withTimeout } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { useToast } from '@/components/ui/Toast';
import SEO from '@/components/common/SEO';

type UploadStep = 'front' | 'back' | 'selfie' | 'review' | 'submitted';

interface UploadState {
    front: File | null;
    back: File | null;
    selfie: File | null;
}

interface PreviewState {
    front: string;
    back: string;
    selfie: string;
}

interface FileMeta {
    name: string;
    sizeKB: number;
}

interface UploadCardStep {
    key: 'front' | 'back' | 'selfie';
    title: string;
    description: string;
    icon: React.ReactNode;
    tip: string;
}

// Helper Component for Upload Cards
interface UploadCardProps {
    stepIndex: number;
    totalSteps: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    preview: string;
    fileMeta: FileMeta | null;
    errorMessage: string;
    onFileSelect: (file: File) => void;
    onClear: () => void;
    onNext: () => void;
    onBack?: () => void;
    canProceed: boolean;
    inputId: string;
    tip: string;
    isUploading?: boolean;
    captureMode?: 'user' | 'environment';
}

const UploadCard = ({
    stepIndex,
    totalSteps,
    title,
    description,
    icon,
    preview,
    fileMeta,
    errorMessage,
    onFileSelect,
    onClear,
    onNext,
    onBack,
    canProceed,
    inputId,
    tip,
    isUploading,
    captureMode
}: UploadCardProps) => {
    const { t, tx } = useTranslation();
    const [dragging, setDragging] = useState(false);

    const onDrop = (e: React.DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div className="rounded-3xl border border-white/10 bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-[#1d2231]/90 md:p-8">
            <div className="mb-5 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-400/30 bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                    <ScanLine className="h-3.5 w-3.5" />
                    {tx('verifyIdentity.stepCounter', { current: stepIndex + 1, total: totalSteps }, `Step ${stepIndex + 1} of ${totalSteps}`)}
                </span>
                <span className="text-xs font-medium text-muted">{Math.round(((stepIndex + 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    {icon}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
            </div>

            <div className="mb-4 rounded-2xl border border-blue-200/60 bg-blue-50/80 p-3 text-xs text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                <span className="font-semibold">{tx('verifyIdentity.tipLabel', undefined, 'Tip:')}</span> {tip}
            </div>

            <div className="mb-8">
                {preview ? (
                    <div className="relative overflow-hidden rounded-2xl border-2 border-primary-500/70 group">
                        <img src={preview} alt={tx('verifyIdentity.preview', undefined, 'Preview')} className="w-full h-64 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => document.getElementById(inputId)?.click()}
                                    className="rounded-lg bg-white px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-100"
                                >
                                    {tx('verifyIdentity.changeImage', undefined, 'Change')}
                                </button>
                                <button
                                    onClick={onClear}
                                    className="inline-flex items-center gap-1 rounded-lg border border-white/40 bg-white/15 px-4 py-2 font-medium text-white transition-colors hover:bg-white/25"
                                >
                                    <X className="h-4 w-4" />
                                    {tx('verifyIdentity.removeImage', undefined, 'Remove')}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => document.getElementById(inputId)?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        aria-label={tx('verifyIdentity.uploadHint', undefined, 'اضغط لرفع الصورة')}
                        className={`h-64 w-full cursor-pointer rounded-2xl border-2 border-dashed transition-colors group flex flex-col items-center justify-center ${dragging
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/15'
                            : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50 dark:border-gray-600 dark:hover:bg-primary-900/10'
                            }`}
                    >
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 group-hover:text-primary-500 mb-4 transition-colors">
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">{tx('verifyIdentity.uploadHint', undefined, 'Click to upload image')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tx('verifyIdentity.dragDropHint', undefined, 'or drag and drop here')}</p>
                        <p className="text-sm text-gray-400 mt-1">{tx('verifyIdentity.fileFormatHint', undefined, 'JPG, PNG (Max 5MB)')}</p>
                    </button>
                )}
                {fileMeta ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                        <FileCheck2 className="h-3.5 w-3.5 text-green-600 dark:text-green-300" />
                        <span>{fileMeta.name}</span>
                        <span className="text-gray-500 dark:text-gray-300">({fileMeta.sizeKB}KB)</span>
                    </div>
                ) : null}
                {errorMessage ? (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
                ) : null}
                <input
                    id={inputId}
                    type="file"
                    accept="image/*"
                    capture={captureMode}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onFileSelect(file);
                    }}
                    className="hidden"
                />
            </div>

            <div className="flex items-center justify-between">
                {onBack ? (
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 ml-1" />
                        {t.common.back}
                    </button>
                ) : (
                    <div></div>
                )}

                <button
                    onClick={onNext}
                    disabled={!canProceed || isUploading}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {tx('verifyIdentity.processing', undefined, 'Processing...')}
                        </>
                    ) : t.common.next}
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default function VerifyIdentity() {
    const { user, profile, session, refreshProfile } = useAuth();
    const { tx } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [step, setStep] = useState<UploadStep>('front');
    const [uploads, setUploads] = useState<UploadState>({
        front: null,
        back: null,
        selfie: null,
    });
    const [cinNumber, setCinNumber] = useState('');
    const [previews, setPreviews] = useState<PreviewState>({
        front: '',
        back: '',
        selfie: '',
    });
    const [fileMeta, setFileMeta] = useState<Record<'front' | 'back' | 'selfie', FileMeta | null>>({
        front: null,
        back: null,
        selfie: null,
    });
    const [fileErrors, setFileErrors] = useState<Record<'front' | 'back' | 'selfie', string>>({
        front: '',
        back: '',
        selfie: '',
    });
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [consent, setConsent] = useState(false);
    const [resolvedIdentityStatus, setResolvedIdentityStatus] = useState<'verified' | 'pending' | 'missing' | null>(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    useEffect(() => {
        let isCancelled = false;

        const deriveFromProfile = (): 'verified' | 'pending' | 'missing' => {
            if (profile?.cin_verified) return 'verified';
            if (profile?.cin_submitted) return 'pending';
            return 'missing';
        };

        const resolveIdentityStatus = async () => {
            if (!user?.id) {
                if (!isCancelled) setResolvedIdentityStatus('missing');
                return;
            }

            // Immediate fallback so UI stays responsive.
            if (!isCancelled) {
                setResolvedIdentityStatus(deriveFromProfile());
            }

            try {
                const { data: latestVerification } = await supabaseWithRetry(() =>
                    supabase
                        .from('identity_verifications')
                        .select('id,status,submitted_at,reviewed_at')
                        .eq('user_id', user.id)
                        .order('submitted_at', { ascending: false })
                        .limit(1)
                        .maybeSingle()
                );

                if (isCancelled) return;

                if (!latestVerification) {
                    setResolvedIdentityStatus(deriveFromProfile());
                    return;
                }

                if (latestVerification.status === 'approved') {
                    setResolvedIdentityStatus('verified');

                    // Self-heal stale profile flags for legacy records.
                    if (!profile?.cin_verified || profile?.cin_submitted) {
                        await supabaseWithRetry(() =>
                            supabase
                                .from('profiles')
                                .update({ cin_verified: true, cin_submitted: false })
                                .eq('id', user.id)
                        );
                        await refreshProfile?.();
                    }
                    return;
                }

                if (latestVerification.status === 'pending') {
                    setResolvedIdentityStatus('pending');
                    return;
                }

                // Rejected/other statuses should not keep users blocked in pending.
                setResolvedIdentityStatus('missing');
                if (profile?.cin_submitted && !profile?.cin_verified) {
                    await supabaseWithRetry(() =>
                        supabase
                            .from('profiles')
                            .update({ cin_submitted: false })
                            .eq('id', user.id)
                    );
                    await refreshProfile?.();
                }
            } catch (error) {
                logger.warn('Failed to resolve identity status from verification rows; using profile fallback.', error);
                if (!isCancelled) {
                    setResolvedIdentityStatus(deriveFromProfile());
                }
            }
        };

        void resolveIdentityStatus();

        return () => {
            isCancelled = true;
        };
    }, [user?.id, profile?.cin_verified, profile?.cin_submitted, refreshProfile]);

    const handleFileSelect = useCallback(async (type: 'front' | 'back' | 'selfie', file: File) => {
        setIsProcessingFile(true);
        setFileErrors(prev => ({ ...prev, [type]: '' }));

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            const message = tx('verifyIdentity.errors.fileTooLarge', undefined, 'File is too large (max 5MB)');
            showToast(message, 'error');
            setFileErrors(prev => ({ ...prev, [type]: message }));
            setIsProcessingFile(false);
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            const message = tx('verifyIdentity.errors.invalidImage', undefined, 'Please upload a valid image file');
            showToast(message, 'error');
            setFileErrors(prev => ({ ...prev, [type]: message }));
            setIsProcessingFile(false);
            return;
        }

        const checkImageDimensions = () =>
            new Promise<void>((resolve, reject) => {
                const objectUrl = URL.createObjectURL(file);
                const image = new Image();
                image.onload = () => {
                    const valid = image.width >= 640 && image.height >= 420;
                    URL.revokeObjectURL(objectUrl);
                    if (!valid) {
                        reject(new Error(tx('verifyIdentity.errors.lowResolution', undefined, 'Image resolution is too low. Use a clearer photo.')));
                        return;
                    }
                    resolve();
                };
                image.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error(tx('verifyIdentity.errors.invalidImage', undefined, 'Please upload a valid image file')));
                };
                image.src = objectUrl;
            });

        try {
            await checkImageDimensions();
        } catch (error) {
            const message = error instanceof Error ? error.message : tx('verifyIdentity.errors.invalidImage', undefined, 'Please upload a valid image file');
            showToast(message, 'error');
            setFileErrors(prev => ({ ...prev, [type]: message }));
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
            const message = tx('verifyIdentity.errors.fileReadFailed', undefined, 'Failed to read this file. Please try another image.');
            setFileErrors(prev => ({ ...prev, [type]: message }));
            showToast(message, 'error');
            setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
    }, [showToast]);

    const clearUpload = (type: 'front' | 'back' | 'selfie') => {
        setUploads(prev => ({ ...prev, [type]: null }));
        setPreviews(prev => ({ ...prev, [type]: '' }));
        setFileMeta(prev => ({ ...prev, [type]: null }));
        setFileErrors(prev => ({ ...prev, [type]: '' }));
    };

    const uploadSteps = useMemo<UploadCardStep[]>(() => [
        {
            key: 'front',
            title: tx('verifyIdentity.steps.front.title', undefined, 'ID card front side'),
            description: tx('verifyIdentity.steps.front.description', undefined, 'Please upload a clear image of the front side of your national ID card'),
            icon: <CheckCircle2 className="w-8 h-8" />,
            tip: tx('verifyIdentity.tips.front', undefined, 'Place the ID on a dark background and avoid flash reflections.'),
        },
        {
            key: 'back',
            title: tx('verifyIdentity.steps.back.title', undefined, 'ID card back side'),
            description: tx('verifyIdentity.steps.back.description', undefined, 'Please upload a clear image of the back side of your national ID card'),
            icon: <CheckCircle2 className="w-8 h-8" />,
            tip: tx('verifyIdentity.tips.back', undefined, 'Make sure all edges and numbers are visible and in focus.'),
        },
        {
            key: 'selfie',
            title: tx('verifyIdentity.steps.selfie.title', undefined, 'Selfie photo'),
            description: tx('verifyIdentity.steps.selfie.description', undefined, 'Take a clear selfie for identity matching'),
            icon: <Camera className="w-8 h-8" />,
            tip: tx('verifyIdentity.tips.selfie', undefined, 'Face the camera in good light and avoid hats or sunglasses.'),
        },
    ], [tx]);

    const handleSubmitVerification = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Validate CIN number (8 digits)
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

            logger.log('Starting verification submission...');

            const { data: liveSessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                throw sessionError;
            }

            const liveSession = liveSessionData.session ?? session;
            const sessionUser = liveSession?.user;
            const authUserId = sessionUser?.id ?? user.id;
            const authUserMetadata = sessionUser?.user_metadata ?? user.user_metadata;

            if (sessionUser?.id && sessionUser.id !== user.id) {
                logger.warn('Auth context user ID differs from live session user ID; using live session user ID for verification flow.', {
                    contextUserId: user.id,
                    sessionUserId: sessionUser.id,
                });
            }

            if (!liveSession) {
                throw new Error(tx('verifyIdentity.errors.noSession', undefined, 'No auth session - please login again'));
            }
            logger.log('Session available, starting uploads...');

            const runWithTimeout = <T,>(operation: Promise<T>, ms: number, operationName: string) =>
                withTimeout(operation, ms, operationName);

            // Upload file with timeout using the Supabase storage client
            const uploadIdentityFile = async (file: File, path: string): Promise<string> => {
                logger.log(`📤 Uploading ${path} (${(file.size / 1024).toFixed(1)}KB)...`);

                const { data, error } = await runWithTimeout(
                    supabase.storage.from('identity-documents').upload(path, file, {
                        upsert: true,
                        contentType: file.type || 'image/jpeg',
                    }),
                    20000,
                    `Upload ${path}`
                );

                if (error) {
                    logger.error('[VerifyIdentity] Upload failed:', error);
                    const response = { status: 'storage' };
                    const errorText = error.message;
                    logger.error(`❌ Upload failed (${response.status}):`, errorText);
                    throw error;
                }

                const uploadedPath = data?.path || path;
                logger.log(`✅ Upload success: ${path}`);
                return uploadedPath;
            };

            const timestamp = Date.now();

            // Upload sequentially - use folder structure to match RLS policy
            // Policy checks: auth.uid()::text = (storage.foldername(name))[1]
            logger.log('Uploading front...');
            const frontPath = await uploadIdentityFile(uploads.front, `${authUserId}/cin_front_${timestamp}.jpg`);
            logger.log('Uploading back...');
            const backPath = await uploadIdentityFile(uploads.back, `${authUserId}/cin_back_${timestamp}.jpg`);
            logger.log('Uploading selfie...');
            const selfiePath = await uploadIdentityFile(uploads.selfie, `${authUserId}/selfie_${timestamp}.jpg`);

            logger.log('All files uploaded, inserting to database...');

            // First, ensure profile exists (foreign key constraint requires it)
            logger.log('Checking if profile exists...');
            const { data: profileData } = await supabaseWithRetry(() =>
                supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', authUserId)
                    .maybeSingle()
            );
            logger.log('Profile check result:', profileData);

            if (!profileData) {
                // Profile doesn't exist, create it with required fields only
                logger.log('Profile not found, creating...');
                await supabaseWithRetry(() =>
                    supabase.from('profiles').insert({
                        id: authUserId,
                        full_name: authUserMetadata?.full_name || user.email?.split('@')[0] || 'User',
                        user_type: profile?.user_type || 'client',
                    })
                );
                logger.log('Profile created successfully');
            } else {
                logger.log('Profile exists, proceeding...');
            }

            const verificationData = {
                user_id: authUserId,
                cin_number: cinNumber,
                cin_front_url: frontPath,
                cin_back_url: backPath,
                selfie_url: selfiePath,
                status: 'pending',
                submitted_at: new Date().toISOString(),
            };

            logger.log('Sending verification insert via Supabase client...');

            // First, delete any existing verification (RLS UPDATE policy is restrictive)
            logger.log('Deleting any existing verification record...');
            try {
                await supabaseWithRetry(() =>
                    supabase
                        .from('identity_verifications')
                        .delete()
                        .eq('user_id', authUserId)
                );
                logger.log('Delete completed (may have had no effect if no record existed)');
            } catch (deleteError) {
                logger.log('Delete failed, proceeding anyway:', deleteError);
            }

            try {
                const { data: insertResult } = await runWithTimeout(
                    supabaseWithRetry(() =>
                        supabase
                            .from('identity_verifications')
                            .insert(verificationData)
                            .select()
                            .single()
                    ),
                    30000,
                    'Verify identity insert'
                );
                logger.log('Insert success:', insertResult);
            } catch (fetchError) {
                const status = typeof fetchError === 'object' && fetchError && 'status' in fetchError
                    ? fetchError.status
                    : undefined;
                const code = typeof fetchError === 'object' && fetchError && 'code' in fetchError
                    ? fetchError.code
                    : undefined;

                if (fetchError instanceof Error && fetchError.message.includes('timed out after')) {
                    throw new Error(tx('verifyIdentity.errors.insertTimeout', undefined, 'Database insert timed out after 30 seconds. Supabase may be under maintenance.'));
                }

                if (status === 409 || code === '23505') {
                    throw new Error(
                        tx(
                            'verifyIdentity.errors.alreadySubmitted',
                            undefined,
                            'You already have a verification request. Please wait for review or contact support.'
                        )
                    );
                }

                if (status === 403 || code === '42501') {
                    throw new Error(
                        tx(
                            'verifyIdentity.errors.permissions',
                            undefined,
                            'Permission denied while submitting verification. Please sign out and sign in again, then retry.'
                        )
                    );
                }

                throw fetchError;
            }

            logger.log('Database insert success, updating profile...');

            // Update profile using Supabase client too
            try {
                await supabaseWithRetry(() =>
                    supabase
                        .from('profiles')
                        .update({ cin_submitted: true })
                        .eq('id', authUserId)
                );
            } catch (updateError) {
                logger.error('Profile update error:', updateError);
                // Don't throw - verification was submitted successfully
            }

            setStep('submitted');
            showToast(tx('verifyIdentity.success.submitted', undefined, 'تم تقديم طلب التحقق بنجاح'), 'success');
        } catch (error) {
            logger.error('Verification submission error:', error);
            const errorMessage = error instanceof Error ? error.message : tx('verifyIdentity.errors.unexpected', undefined, 'An unexpected error occurred');
            showToast(tx('verifyIdentity.errors.withMessage', { message: errorMessage }, `خطأ: ${errorMessage}`), 'error');
        } finally {
            setLoading(false);
        }
    };

    const steps = ['front', 'back', 'selfie', 'review'];
    const stepLabels = [
        tx('verifyIdentity.progress.front', undefined, 'وجه البطاقة'),
        tx('verifyIdentity.progress.back', undefined, 'ظهر البطاقة'),
        tx('verifyIdentity.progress.selfie', undefined, 'صورة شخصية'),
        tx('verifyIdentity.progress.review', undefined, 'المراجعة'),
    ];
    const currentStepIndex = steps.indexOf(step);
    const stepMap: UploadStep[] = ['front', 'back', 'selfie', 'review'];

    const verificationChecklist = useMemo(() => {
        const checks = [
            { key: 'front', ok: Boolean(uploads.front), label: tx('verifyIdentity.review.checkFront', undefined, 'Front image added') },
            { key: 'back', ok: Boolean(uploads.back), label: tx('verifyIdentity.review.checkBack', undefined, 'Back image added') },
            { key: 'selfie', ok: Boolean(uploads.selfie), label: tx('verifyIdentity.review.checkSelfie', undefined, 'Selfie added') },
            { key: 'cin', ok: cinNumber.length === 8, label: tx('verifyIdentity.review.checkCin', undefined, 'CIN number valid') },
            { key: 'consent', ok: consent, label: tx('verifyIdentity.review.checkConsent', undefined, 'Privacy consent accepted') },
        ];
        return checks;
    }, [uploads.front, uploads.back, uploads.selfie, cinNumber.length, consent, tx]);

    const completedChecklist = verificationChecklist.filter(item => item.ok).length;

    const effectiveIdentityStatus = resolvedIdentityStatus
        ?? (profile?.cin_verified ? 'verified' : profile?.cin_submitted ? 'pending' : 'missing');

    // If already verified, show success message
    if (effectiveIdentityStatus === 'verified') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
                <SEO title={tx('verifyIdentity.seo.title', undefined, 'التحقق من الهوية')} description={tx('verifyIdentity.seo.description', undefined, 'قم بتوثيق هويتك لزيادة ثقة العملاء وفتح جميع ميزات المنصة')} />
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl border border-green-100 dark:border-green-900">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{tx('verifyIdentity.verified.title', undefined, 'تم التحقق من هويتك بنجاح')}</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
                            {tx('verifyIdentity.verified.description', undefined, 'حسابك موثق الآن وحصلت على شارة التحقق الزرقاء. يمكنك الآن الاستمتاع بجميع ميزات المنصة.')}
                        </p>
                        <button
                            onClick={() => navigate('/settings?tab=profile')}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20"
                        >
                            {tx('verifyIdentity.backToSettings', undefined, 'العودة إلى الإعدادات')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // If verification is pending (submitted but not yet verified), show pending state
    if (effectiveIdentityStatus === 'pending') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-10">
                <SEO title={tx('verifyIdentity.pending.seoTitle', undefined, 'طلب التحقق قيد المراجعة')} description={tx('verifyIdentity.pending.seoDescription', undefined, 'طلب التحقق من الهوية قيد المراجعة من قبل فريقنا')} />
                <div className="container mx-auto px-4">
                        <div className="relative max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-xl border-2 border-orange-200 dark:border-orange-900 overflow-hidden">
                            <div className="pointer-events-none absolute -top-16 -end-12 h-40 w-40 rounded-full bg-orange-300/20 blur-2xl" />
                            <div className="pointer-events-none absolute -bottom-20 -start-16 h-44 w-44 rounded-full bg-yellow-300/10 blur-2xl" />
                        <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-12 h-12 text-orange-500 dark:text-orange-400" />
                        </div>
                        <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {tx('verifyIdentity.pending.badge', undefined, 'قيد المراجعة')}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{tx('verifyIdentity.pending.title', undefined, 'طلبك قيد المراجعة')}</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
                            {tx('verifyIdentity.pending.description', undefined, 'تم استلام طلب التحقق من هويتك بنجاح. فريقنا يعمل على مراجعة مستنداتك.')}
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 md:p-6 mb-8">
                            <div className="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                                <span>{tx('verifyIdentity.pending.reviewTime', undefined, 'مدة المراجعة: 24 ساعة كحد أقصى')}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {tx('verifyIdentity.pending.emailNotice', undefined, 'سيتم إشعارك عبر البريد الإلكتروني فور اكتمال المراجعة')}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => navigate('/settings?tab=profile')}
                                className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20"
                            >
                                {tx('verifyIdentity.backToSettings', undefined, 'العودة إلى الإعدادات')}
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 px-8 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                {tx('verifyIdentity.goToDashboard', undefined, 'Go to dashboard')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success State (Submitted pending approval)
    if (step === 'submitted') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-10">
                <SEO title={tx('verifyIdentity.submitted.seoTitle', undefined, 'تم تقديم الطلب')} description={tx('verifyIdentity.submitted.seoDescription', undefined, 'تم استلام طلب التحقق من الهوية')} />
                <div className="container mx-auto px-4">
                        <div className="relative max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-xl border border-primary-100 dark:border-primary-900 overflow-hidden">
                            <div className="pointer-events-none absolute inset-0">
                                <div className="absolute top-8 left-[15%] h-2 w-2 rounded-full bg-primary-400 animate-ping" />
                                <div className="absolute top-20 right-[18%] h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                                <div className="absolute bottom-16 right-[24%] h-2 w-2 rounded-full bg-green-400 animate-ping" />
                                <div className="absolute bottom-10 left-[20%] h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse" />
                            </div>
                        <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Shield className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{tx('verifyIdentity.submitted.title', undefined, 'تم استلام طلبك بنجاح')}</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
                            {tx('verifyIdentity.submitted.description', undefined, 'سيقوم فريقنا بمراجعة مستنداتك والرد عليك في أقرب وقت ممكن (عادة خلال 24 ساعة). سنقوم بإشعارك عبر البريد الإلكتروني عند اكتمال المراجعة.')}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => navigate('/settings?tab=profile')}
                                className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20"
                            >
                                {tx('verifyIdentity.backToSettings', undefined, 'العودة إلى الإعدادات')}
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 px-8 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                {tx('verifyIdentity.goToDashboard', undefined, 'Go to dashboard')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#13294f_0%,_#0b1328_40%,_#0b1020_100%)] py-10">
            <SEO title={tx('verifyIdentity.seo.title', undefined, 'التحقق من الهوية')} description={tx('verifyIdentity.seo.description', undefined, 'قم بتوثيق هويتك لزيادة ثقة العملاء وفتح جميع ميزات المنصة')} />

            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-4xl">
                    {/* Header */}
                    <div className="mb-10 text-center px-1">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/90">
                            <Sparkles className="h-3.5 w-3.5" />
                            {tx('verifyIdentity.header.kicker', undefined, 'Secure Account Upgrade')}
                        </div>
                        <h1 className="mb-3 text-3xl font-bold text-white md:text-4xl">{tx('verifyIdentity.header.title', undefined, 'Identity verification')}</h1>
                        <p className="mx-auto max-w-2xl text-lg text-slate-300">
                            {tx('verifyIdentity.header.subtitle', undefined, 'خطوة واحدة تفصلك عن زيادة ثقة عملائك وحماية حسابك')}
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-100">
                            <Loader2 className="h-3.5 w-3.5" />
                            {tx('verifyIdentity.header.eta', undefined, 'Takes about 2-3 minutes to complete')}
                        </div>
                    </div>

                    <div className="mb-8 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 backdrop-blur-sm">
                            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-blue-200"><Lock className="h-4 w-4" /></div>
                            <p className="font-semibold text-white">{tx('verifyIdentity.security.title', undefined, 'Encrypted storage')}</p>
                            <p className="mt-1 text-xs text-slate-300">{tx('verifyIdentity.security.desc', undefined, 'Your documents are encrypted and only used for account verification.')}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 backdrop-blur-sm">
                            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-blue-200"><ScanLine className="h-4 w-4" /></div>
                            <p className="font-semibold text-white">{tx('verifyIdentity.security.qualityTitle', undefined, 'Smart quality checks')}</p>
                            <p className="mt-1 text-xs text-slate-300">{tx('verifyIdentity.security.qualityDesc', undefined, 'We validate file format, size, and basic image quality before upload.')}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 backdrop-blur-sm">
                            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-blue-200"><Loader2 className="h-4 w-4" /></div>
                            <p className="font-semibold text-white">{tx('verifyIdentity.security.reviewTitle', undefined, 'Fast review')}</p>
                            <p className="mt-1 text-xs text-slate-300">{tx('verifyIdentity.security.reviewDesc', undefined, 'Most verification requests are reviewed within 24 hours.')}</p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="relative mb-10 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-2 py-5 backdrop-blur-sm md:px-6 md:py-6">
                        <div className="absolute left-5 right-5 top-1/2 h-1 -z-10 rounded-full bg-white/15"></div>
                        <div className="absolute left-5 top-1/2 h-1 -z-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-[width] duration-300"
                            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}></div>

                        {stepLabels.map((label, idx) => {
                            const isCompleted = idx < currentStepIndex;
                            const isCurrent = idx === currentStepIndex;

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        if (idx <= currentStepIndex) {
                                            setStep(stepMap[idx]);
                                        }
                                    }}
                                    disabled={idx > currentStepIndex}
                                    className="flex flex-col items-center px-2 disabled:cursor-not-allowed"
                                >
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-200 ${isCompleted || isCurrent
                                        ? 'border-primary-500 bg-primary-500 text-white'
                                        : 'border-white/35 bg-[#0d1528] text-slate-300'
                                        }`}>
                                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <span>{idx + 1}</span>}
                                    </div>
                                    <span className={`mt-2 text-xs font-medium transition-colors ${isCurrent ? 'text-primary-300' : 'text-slate-400'
                                        }`}>{label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Form Content */}
                    <div className="transition-colors duration-200">
                        {step === 'front' && (
                            <UploadCard
                                stepIndex={0}
                                totalSteps={4}
                                inputId="front-upload"
                                title={uploadSteps[0].title}
                                description={uploadSteps[0].description}
                                icon={uploadSteps[0].icon}
                                tip={uploadSteps[0].tip}
                                preview={previews.front}
                                fileMeta={fileMeta.front}
                                errorMessage={fileErrors.front}
                                onFileSelect={(file) => handleFileSelect('front', file)}
                                onClear={() => clearUpload('front')}
                                onNext={() => setStep('back')}
                                canProceed={!!uploads.front}
                                isUploading={isProcessingFile}
                                captureMode="environment"
                            />
                        )}

                        {step === 'back' && (
                            <UploadCard
                                stepIndex={1}
                                totalSteps={4}
                                inputId="back-upload"
                                title={uploadSteps[1].title}
                                description={uploadSteps[1].description}
                                icon={uploadSteps[1].icon}
                                tip={uploadSteps[1].tip}
                                preview={previews.back}
                                fileMeta={fileMeta.back}
                                errorMessage={fileErrors.back}
                                onFileSelect={(file) => handleFileSelect('back', file)}
                                onClear={() => clearUpload('back')}
                                onNext={() => setStep('selfie')}
                                onBack={() => setStep('front')}
                                canProceed={!!uploads.back}
                                isUploading={isProcessingFile}
                                captureMode="environment"
                            />
                        )}

                        {step === 'selfie' && (
                            <UploadCard
                                stepIndex={2}
                                totalSteps={4}
                                inputId="selfie-upload"
                                title={uploadSteps[2].title}
                                description={uploadSteps[2].description}
                                icon={uploadSteps[2].icon}
                                tip={uploadSteps[2].tip}
                                preview={previews.selfie}
                                fileMeta={fileMeta.selfie}
                                errorMessage={fileErrors.selfie}
                                onFileSelect={(file) => handleFileSelect('selfie', file)}
                                onClear={() => clearUpload('selfie')}
                                onNext={() => setStep('review')}
                                onBack={() => setStep('back')}
                                canProceed={!!uploads.selfie}
                                isUploading={isProcessingFile}
                                captureMode="user"
                            />
                        )}

                        {step === 'review' && (
                            <div className="rounded-3xl border border-white/10 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-[#1d2231]/90">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">{tx('verifyIdentity.review.title', undefined, 'مراجعة البيانات')}</h2>

                                <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/50 px-4 py-2 text-xs dark:bg-white/5">
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{tx('verifyIdentity.review.readiness', undefined, 'Readiness score')}</span>
                                    <span className="font-semibold text-primary-700 dark:text-primary-300">{completedChecklist}/{verificationChecklist.length}</span>
                                </div>

                                <div className="mb-6 grid gap-3 md:grid-cols-3">
                                    {verificationChecklist.map((item, idx) => (
                                        <div key={idx} className={`rounded-xl border px-3 py-2 text-xs font-medium ${item.ok
                                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300'
                                            : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300'
                                            }`}>
                                            <span className="inline-flex items-center gap-1.5">
                                                {item.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="label">{tx('verifyIdentity.review.cinLabel', undefined, 'رقم بطاقة الهوية (8 أرقام)')}</label>
                                        <input
                                            type="text"
                                            value={cinNumber}
                                            onChange={(e) => setCinNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                            placeholder={tx('verifyIdentity.review.cinPlaceholder', undefined, '12345678')}
                                            className="input w-full text-center text-2xl tracking-widest"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { title: tx('verifyIdentity.review.frontImage', undefined, 'وجه البطاقة'), src: previews.front },
                                            { title: tx('verifyIdentity.review.backImage', undefined, 'ظهر البطاقة'), src: previews.back },
                                            { title: tx('verifyIdentity.review.selfieImage', undefined, 'الصورة الشخصية'), src: previews.selfie },
                                        ].map((item, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <p className="text-xs text-center font-medium text-gray-500">{item.title}</p>
                                                <img src={item.src} alt={item.title} className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                        <button
                                            type="button"
                                            onClick={() => setStep('front')}
                                            className="rounded-lg border border-gray-300/80 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            {tx('verifyIdentity.review.editFront', undefined, 'Edit front image')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep('back')}
                                            className="rounded-lg border border-gray-300/80 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            {tx('verifyIdentity.review.editBack', undefined, 'Edit back image')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep('selfie')}
                                            className="rounded-lg border border-gray-300/80 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                        >
                                            {tx('verifyIdentity.review.editSelfie', undefined, 'Edit selfie')}
                                        </button>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 border border-blue-200/60 dark:border-blue-500/30">
                                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            {tx('verifyIdentity.review.privacyNotice', undefined, 'يتم تخزين بياناتك بشكل آمن ومشفر. لن يتم مشاركة معلومات هويتك مع أي طرف ثالث ويتم استخدامها فقط لغرض التحقق من الحساب.')}
                                        </p>
                                    </div>

                                    <label htmlFor="identity-consent" className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                                        <input
                                            id="identity-consent"
                                            type="checkbox"
                                            checked={consent}
                                            onChange={(e) => setConsent(e.target.checked)}
                                            className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-300 select-none">
                                            {tx('verifyIdentity.review.consentPrefix', undefined, 'أوافق على استخدام معلوماتي الشخصية للتحقق من هويتي وفقاً لـ ')}<span className="text-primary-600 hover:underline">{tx('verifyIdentity.review.privacyPolicy', undefined, 'سياسة الخصوصية')}</span>
                                        </span>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between mt-8">
                                    <button
                                        onClick={() => setStep('selfie')}
                                        className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5 ml-1" />
                                        {tx('common.back', undefined, 'Back')}
                                    </button>

                                    <button
                                        onClick={handleSubmitVerification}
                                        disabled={loading || !consent || cinNumber.length !== 8}
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20 min-w-[160px] justify-center"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>{tx('verifyIdentity.review.submitting', undefined, 'جاري الإرسال...')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{tx('verifyIdentity.review.submit', undefined, 'تأكيد وإرسال')}</span>
                                                <CheckCircle2 className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
