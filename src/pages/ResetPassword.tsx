import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../i18n';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';

// Password validation schema
const resetPasswordSchema = z.object({
    password: z.string()
        .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
        .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير واحد على الأقل')
        .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Password strength calculator
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'ضعيفة', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'متوسطة', color: 'bg-yellow-500' };
    return { score, label: 'قوية', color: 'bg-green-500' };
};

const ResetPassword = () => {
    const { dir } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isValidToken, setIsValidToken] = useState(true);
    const [isCheckingToken, setIsCheckingToken] = useState(true);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const password = watch('password', '');
    const passwordStrength = getPasswordStrength(password);

    // Check for valid recovery session
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                // Check if URL contains recovery type
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const type = hashParams.get('type');
                const accessToken = hashParams.get('access_token');

                if (type === 'recovery' && accessToken) {
                    // Valid recovery link
                    setIsValidToken(true);
                } else if (!session) {
                    // No session and no recovery token
                    setIsValidToken(false);
                }
            } catch (error) {
                console.error('Session check error:', error);
                setIsValidToken(false);
            } finally {
                setIsCheckingToken(false);
            }
        };

        checkSession();
    }, []);

    const onSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) {
                if (error.message.includes('expired') || error.message.includes('invalid')) {
                    setIsValidToken(false);
                    showToast('رابط إعادة التعيين منتهي الصلاحية', 'error');
                    return;
                }
                throw error;
            }

            // Sign out all other sessions for security
            await supabase.auth.signOut({ scope: 'others' });

            setIsSuccess(true);
            showToast('تم تغيير كلمة المرور بنجاح', 'success');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error: any) {
            console.error('Password update error:', error);
            showToast(error.message || 'حدث خطأ أثناء تغيير كلمة المرور', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isCheckingToken) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 flex items-center justify-center p-4"
                dir={dir}
            >
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">جاري التحقق...</p>
                </div>
            </div>
        );
    }

    // Invalid/expired token state
    if (!isValidToken) {
        return (
            <div
                className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 flex items-center justify-center p-4"
                dir={dir}
            >
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            رابط منتهي الصلاحية
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.
                        </p>
                        <Button
                            onClick={() => navigate('/forgot-password')}
                            className="w-full"
                        >
                            طلب رابط جديد
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 flex items-center justify-center p-4"
            dir={dir}
        >
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                    {!isSuccess ? (
                        <>
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    تعيين كلمة مرور جديدة
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    أدخل كلمة المرور الجديدة لحسابك
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* New Password Field */}
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                    >
                                        كلمة المرور الجديدة
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            {...register('password')}
                                            className={`w-full ps-10 pe-12 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.password
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-200 dark:border-gray-600'
                                                }`}
                                            placeholder="أدخل كلمة المرور الجديدة"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-2 text-sm text-red-500">
                                            {errors.password.message}
                                        </p>
                                    )}

                                    {/* Password Strength Indicator */}
                                    {password && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-500">قوة كلمة المرور</span>
                                                <span className={`text-xs font-medium ${passwordStrength.color === 'bg-red-500' ? 'text-red-500' :
                                                    passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-500' :
                                                        'text-green-500'
                                                    }`}>
                                                    {passwordStrength.label}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                    >
                                        تأكيد كلمة المرور
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            {...register('confirmPassword')}
                                            className={`w-full ps-10 pe-12 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${errors.confirmPassword
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-200 dark:border-gray-600'
                                                }`}
                                            placeholder="أعد إدخال كلمة المرور"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="mt-2 text-sm text-red-500">
                                            {errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>

                                {/* Password Requirements */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        متطلبات كلمة المرور:
                                    </p>
                                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <li className={password.length >= 8 ? 'text-green-600' : ''}>
                                            • 8 أحرف على الأقل
                                        </li>
                                        <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                                            • حرف كبير واحد على الأقل
                                        </li>
                                        <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                                            • حرف صغير واحد على الأقل
                                        </li>
                                        <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                                            • رقم واحد على الأقل
                                        </li>
                                    </ul>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                                            جاري التحديث...
                                        </>
                                    ) : (
                                        'تعيين كلمة المرور الجديدة'
                                    )}
                                </Button>
                            </form>
                        </>
                    ) : (
                        /* Success State */
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                تم تغيير كلمة المرور بنجاح!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                جاري تحويلك لصفحة تسجيل الدخول...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
