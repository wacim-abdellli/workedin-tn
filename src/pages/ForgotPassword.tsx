import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';

// Validation schema
const forgotPasswordSchema = z.object({
    email: z.string().email('أدخل بريد إلكتروني صحيح'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
    const { t, dir } = useTranslation();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [rateLimitError, setRateLimitError] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        setRateLimitError(false);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                // Handle rate limiting
                if (error.message.includes('rate') || error.status === 429) {
                    setRateLimitError(true);
                    showToast(t.auth.forgotPasswordForm.rateLimited, 'error');
                    return;
                }
                throw error;
            }

            setIsSuccess(true);
            showToast(t.auth.forgotPasswordForm.sent, 'success');
        } catch (error: any) {
            logger.error('Password reset error:', error);
            showToast(error.message || t.auth.forgotPasswordForm.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 flex items-center justify-center p-4"
            dir={dir}
        >
            <div className="w-full max-w-md">
                {/* Back to Login Link */}
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    <span>العودة لتسجيل الدخول</span>
                </Link>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                    {!isSuccess ? (
                        <>
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    نسيت كلمة المرور؟
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="label">
                                        {t.auth.email}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                            <Mail className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            {...register('email')}
                                            className={`input ps-10 pe-4 ${errors.email ? 'input-error' : ''}`}
                                            placeholder={t.auth.emailPlaceholder}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.email && <p className="form-error">{errors.email.message}</p>}
                                </div>

                                {/* Rate Limit Warning */}
                                {rateLimitError && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            تم تجاوز الحد الأقصى للطلبات. يرجى الانتظار 10 دقائق قبل المحاولة مرة أخرى.
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                                            {t.auth.loggingOut}
                                        </>
                                    ) : (
                                        t.auth.forgotPasswordForm.sendTitle
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
                                تحقق من بريدك الإلكتروني
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                                أرسلنا رابط إعادة التعيين إلى
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white mb-6">
                                {getValues('email')}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                                إذا لم تجد الرسالة، تحقق من مجلد البريد المزعج (Spam)
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                            >
                                العودة لتسجيل الدخول
                            </Link>
                        </div>
                    )}
                </div>

                {/* Help Text */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    هل تحتاج مساعدة؟{' '}
                    <a href="mailto:support@khedma.tn" className="text-primary-600 hover:underline">
                        تواصل معنا
                    </a>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
