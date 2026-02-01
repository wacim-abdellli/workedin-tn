
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Camera, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
// supabase SDK not needed - using direct REST API calls
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

// Helper Component for Upload Cards
interface UploadCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    preview: string;
    onFileSelect: (file: File) => void;
    onNext: () => void;
    onBack?: () => void;
    canProceed: boolean;
    inputId: string;
}

const UploadCard = ({
    title,
    description,
    icon,
    preview,
    onFileSelect,
    onNext,
    onBack,
    canProceed,
    inputId
}: UploadCardProps) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    {icon}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
            </div>

            <div className="mb-8">
                {preview ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-primary-500 group">
                        <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => document.getElementById(inputId)?.click()}
                                className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                            >
                                تغيير
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => document.getElementById(inputId)?.click()}
                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
                    >
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 group-hover:text-primary-500 mb-4 transition-colors">
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">اضغط لرفع الصورة</p>
                        <p className="text-sm text-gray-400 mt-1">JPG, PNG (Max 5MB)</p>
                    </div>
                )}
                <input
                    id={inputId}
                    type="file"
                    accept="image/*"
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
                    disabled={!canProceed}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
                >
                    {t.common.next}
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default function VerifyIdentity() {
    const { user, profile, session } = useAuth();
    // t is used in nested UploadCard component, not here
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
    const [loading, setLoading] = useState(false);
    const [consent, setConsent] = useState(false);

    const handleFileSelect = useCallback((type: 'front' | 'back' | 'selfie', file: File) => {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('حجم الملف كبير جداً (الحد الأقصى 5MB)', 'error');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('يجب تحميل صورة صالحة', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
            setUploads(prev => ({ ...prev, [type]: file }));
        };
        reader.readAsDataURL(file);
    }, [showToast]);

    const handleSubmitVerification = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Validate CIN number (8 digits)
            if (!/^\d{8}$/.test(cinNumber)) {
                showToast('رقم البطاقة يجب أن يحتوي على 8 أرقام', 'error');
                setLoading(false);
                return;
            }

            if (!uploads.front || !uploads.back || !uploads.selfie) {
                showToast('يرجى تحميل جميع الصور المطلوبة', 'error');
                setLoading(false);
                return;
            }

            console.log('Starting verification submission...');

            // Use session from context (already available)
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

            if (!session?.access_token) {
                throw new Error('No auth session - please login again');
            }
            console.log('Session available, starting uploads...');

            // Timeout helper - defined with explicit comma to avoid JSX confusion
            const withTimeout = <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
                return Promise.race([
                    promise,
                    new Promise<T>((_, reject) =>
                        setTimeout(() => reject(new Error(message)), ms)
                    )
                ]);
            };

            // Upload file with timeout using Promise.race
            const uploadFile = async (file: File, path: string): Promise<string> => {
                console.log(`📤 Uploading ${path} (${(file.size / 1024).toFixed(1)}KB)...`);

                const storageUrl = `${supabaseUrl}/storage/v1/object/identity-documents/${path}`;

                const fetchPromise = fetch(storageUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-upsert': 'true',
                    },
                    body: file,
                });

                // 20 second timeout per file
                const response = await withTimeout(fetchPromise, 20000, `Upload timeout for ${path}`);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ Upload failed (${response.status}):`, errorText);
                    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                console.log(`✅ Upload success: ${path}`);
                return data.Key || path;
            };

            const timestamp = Date.now();

            // Upload sequentially - use folder structure to match RLS policy
            // Policy checks: auth.uid()::text = (storage.foldername(name))[1]
            console.log('Uploading front...');
            const frontPath = await uploadFile(uploads.front, `${user.id}/cin_front_${timestamp}.jpg`);
            console.log('Uploading back...');
            const backPath = await uploadFile(uploads.back, `${user.id}/cin_back_${timestamp}.jpg`);
            console.log('Uploading selfie...');
            const selfiePath = await uploadFile(uploads.selfie, `${user.id}/selfie_${timestamp}.jpg`);

            console.log('All files uploaded, inserting to database...');

            // Use direct REST API instead of SDK (SDK hangs during Supabase maintenance)
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            // First, ensure profile exists (foreign key constraint requires it)
            console.log('Checking if profile exists...');
            const profileCheckResponse = await fetch(
                `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=id`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': supabaseKey,
                    }
                }
            );

            const profileData = await profileCheckResponse.json();
            console.log('Profile check result:', profileData);

            if (!profileData || profileData.length === 0) {
                // Profile doesn't exist, create it with required fields only
                console.log('Profile not found, creating...');
                const createProfileResponse = await fetch(
                    `${supabaseUrl}/rest/v1/profiles`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                            'apikey': supabaseKey,
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            id: user.id,
                            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                            user_type: 'freelancer',
                        })
                    }
                );

                if (!createProfileResponse.ok) {
                    const errorText = await createProfileResponse.text();
                    console.error('Profile creation failed:', errorText);
                    throw new Error(`Failed to create profile: ${errorText}`);
                }
                console.log('Profile created successfully');
            } else {
                console.log('Profile exists, proceeding...');
            }

            const verificationData = {
                user_id: user.id,
                cin_number: cinNumber,
                cin_front_url: frontPath,
                cin_back_url: backPath,
                selfie_url: selfiePath,
                status: 'pending',
                submitted_at: new Date().toISOString(),
            };

            console.log('Sending REST API request to insert verification...');

            // First, delete any existing verification (RLS UPDATE policy is restrictive)
            console.log('Deleting any existing verification record...');
            try {
                await fetch(
                    `${supabaseUrl}/rest/v1/identity_verifications?user_id=eq.${user.id}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                            'apikey': supabaseKey,
                        }
                    }
                );
                console.log('Delete completed (may have had no effect if no record existed)');
            } catch (deleteError) {
                console.log('Delete failed, proceeding anyway:', deleteError);
            }

            // Use fetch with timeout for database insert
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            try {
                const insertResponse = await fetch(
                    `${supabaseUrl}/rest/v1/identity_verifications`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                            'apikey': supabaseKey,
                            'Prefer': 'resolution=merge-duplicates,return=representation'
                        },
                        body: JSON.stringify(verificationData),
                        signal: controller.signal
                    }
                );

                clearTimeout(timeoutId);

                if (!insertResponse.ok) {
                    const errorText = await insertResponse.text();
                    console.error('Insert failed:', insertResponse.status, errorText);
                    throw new Error(`Database error: ${insertResponse.status} - ${errorText}`);
                }

                const insertResult = await insertResponse.json();
                console.log('Insert success:', insertResult);
            } catch (fetchError: any) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    throw new Error('Database insert timed out after 30 seconds. Supabase may be under maintenance.');
                }
                throw fetchError;
            }

            console.log('Database insert success, updating profile...');

            // Update profile using REST API too
            try {
                const updateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                            'apikey': supabaseKey,
                        },
                        body: JSON.stringify({ cin_submitted: true })
                    }
                );

                if (!updateResponse.ok) {
                    console.error('Profile update failed:', await updateResponse.text());
                }
            } catch (updateError) {
                console.error('Profile update error:', updateError);
                // Don't throw - verification was submitted successfully
            }

            setStep('submitted');
            showToast('تم تقديم طلب التحقق بنجاح', 'success');
        } catch (error: any) {
            console.error('Verification submission error:', error);
            const errorMessage = error.message || error.error_description || JSON.stringify(error);
            showToast(`خطأ: ${errorMessage}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const steps = ['front', 'back', 'selfie', 'review'];
    const stepLabels = ['وجه البطاقة', 'ظهر البطاقة', 'صورة شخصية', 'المراجعة'];
    const currentStepIndex = steps.indexOf(step);

    // If already verified, show success message
    if (profile?.cin_verified) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
                <SEO title="التحقق من الهوية" description="قم بتوثيق هويتك لزيادة ثقة العملاء وفتح جميع ميزات المنصة" />
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl border border-green-100 dark:border-green-900">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">تم التحقق من هويتك بنجاح</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
                            حسابك موثق الآن وحصلت على شارة التحقق الزرقاء. يمكنك الآن الاستمتاع بجميع ميزات المنصة.
                        </p>
                        <button
                            onClick={() => navigate('/settings?tab=profile')}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20"
                        >
                            العودة إلى الإعدادات
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // If verification is pending (submitted but not yet verified), show pending state
    if (profile?.cin_submitted && !profile?.cin_verified) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
                <SEO title="طلب التحقق قيد المراجعة" description="طلب التحقق من الهوية قيد المراجعة من قبل فريقنا" />
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl border-2 border-orange-200 dark:border-orange-900">
                        <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-12 h-12 text-orange-500 dark:text-orange-400" />
                        </div>
                        <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            قيد المراجعة
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">طلبك قيد المراجعة</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
                            تم استلام طلب التحقق من هويتك بنجاح. فريقنا يعمل على مراجعة مستنداتك.
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-8">
                            <div className="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                                <span>مدة المراجعة: <strong>24 ساعة كحد أقصى</strong></span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                سيتم إشعارك عبر البريد الإلكتروني فور اكتمال المراجعة
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/settings?tab=profile')}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20"
                        >
                            العودة إلى الإعدادات
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Success State (Submitted pending approval)
    if (step === 'submitted') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
                <SEO title="تم تقديم الطلب" description="تم استلام طلب التحقق من الهوية" />
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl border border-primary-100 dark:border-primary-900">
                        <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Shield className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">تم استلام طلبك بنجاح</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
                            سيقوم فريقنا بمراجعة مستنداتك والرد عليك في أقرب وقت ممكن (عادة خلال 24 ساعة). سنقوم بإشعارك عبر البريد الإلكتروني عند اكتمال المراجعة.
                        </p>
                        <button
                            onClick={() => navigate('/settings?tab=profile')}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20"
                        >
                            العودة إلى الإعدادات
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
            <SEO title="التحقق من الهوية" description="قم بتوثيق هويتك لزيادة ثقة العملاء وفتح جميع ميزات المنصة" />

            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">توثيق الهوية</h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            خطوة واحدة تفصلك عن زيادة ثقة عملائك وحماية حسابك
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mb-12 relative">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -z-10 rounded-full"></div>
                        <div className="absolute top-1/2 left-0 h-1 bg-primary-600 -z-10 rounded-full transition-all duration-500"
                            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}></div>

                        {stepLabels.map((label, idx) => {
                            const isCompleted = idx < currentStepIndex;
                            const isCurrent = idx === currentStepIndex;

                            return (
                                <div key={idx} className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 px-2">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted || isCurrent
                                        ? 'bg-primary-600 border-primary-600 text-white scale-110'
                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                                        }`}>
                                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <span>{idx + 1}</span>}
                                    </div>
                                    <span className={`text-xs mt-2 font-medium transition-colors ${isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'
                                        }`}>{label}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Form Content */}
                    <div className="transition-all duration-500">
                        {step === 'front' && (
                            <UploadCard
                                inputId="front-upload"
                                title="صورة وجه بطاقة التعريف"
                                description="يرجى تحميل صورة واضحة للوجه الأمامي لبطاقة التعريف الوطنية"
                                icon={<CheckCircle2 className="w-8 h-8" />}
                                preview={previews.front}
                                onFileSelect={(file) => handleFileSelect('front', file)}
                                onNext={() => setStep('back')}
                                canProceed={!!uploads.front}
                            />
                        )}

                        {step === 'back' && (
                            <UploadCard
                                inputId="back-upload"
                                title="صورة ظهر بطاقة التعريف"
                                description="يرجى تحميل صورة واضحة للوجه الخلفي لبطاقة التعريف الوطنية"
                                icon={<CheckCircle2 className="w-8 h-8" />}
                                preview={previews.back}
                                onFileSelect={(file) => handleFileSelect('back', file)}
                                onNext={() => setStep('selfie')}
                                onBack={() => setStep('front')}
                                canProceed={!!uploads.back}
                            />
                        )}

                        {step === 'selfie' && (
                            <UploadCard
                                inputId="selfie-upload"
                                title="صورة شخصية (سيلفي)"
                                description="يرجى التقاط صورة سيلفي واضحة للتحقق من هويتك"
                                icon={<Camera className="w-8 h-8" />}
                                preview={previews.selfie}
                                onFileSelect={(file) => handleFileSelect('selfie', file)}
                                onNext={() => setStep('review')}
                                onBack={() => setStep('back')}
                                canProceed={!!uploads.selfie}
                            />
                        )}

                        {step === 'review' && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">مراجعة البيانات</h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رقم بطاقة الهوية (8 أرقام)</label>
                                        <input
                                            type="text"
                                            value={cinNumber}
                                            onChange={(e) => setCinNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                            placeholder="12345678"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { title: 'وجه البطاقة', src: previews.front },
                                            { title: 'ظهر البطاقة', src: previews.back },
                                            { title: 'الصورة الشخصية', src: previews.selfie },
                                        ].map((item, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <p className="text-xs text-center font-medium text-gray-500">{item.title}</p>
                                                <img src={item.src} alt={item.title} className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            يتم تخزين بياناتك بشكل آمن ومشفر. لن يتم مشاركة معلومات هويتك مع أي طرف ثالث ويتم استخدامها فقط لغرض التحقق من الحساب.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => setConsent(!consent)}>
                                        <input
                                            type="checkbox"
                                            checked={consent}
                                            onChange={(e) => setConsent(e.target.checked)}
                                            className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-300 select-none">
                                            أوافق على استخدام معلوماتي الشخصية للتحقق من هويتي وفقاً لـ <span className="text-primary-600 hover:underline">سياسة الخصوصية</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-8">
                                    <button
                                        onClick={() => setStep('selfie')}
                                        className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5 ml-1" />
                                        Back
                                    </button>

                                    <button
                                        onClick={handleSubmitVerification}
                                        disabled={loading || !consent || cinNumber.length !== 8}
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20 min-w-[160px] justify-center"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>جاري الإرسال...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>تأكيد وإرسال</span>
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
