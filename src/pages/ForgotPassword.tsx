import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, RotateCcw, ShieldCheck, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import { AuthShell } from '../components/auth';

// Validation schema
const getForgotPasswordSchema = (tx: any) => z.object({
    email: z.string().email(tx('auth.validation.invalidEmail', undefined, 'أدخل بريد إلكتروني صحيح')),
});

type ForgotPasswordFormData = z.infer<ReturnType<typeof getForgotPasswordSchema>>;

const ForgotPassword = () => {
    const { t, tx } = useTranslation();
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
        resolver: zodResolver(getForgotPasswordSchema(tx)),
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
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error('Password reset error:', error);
            showToast(msg || t.auth.forgotPasswordForm.error, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell
            badge={t.auth.forgotPasswordForm.sendTitle}
            title={tx('pages.forgotPassword.title', undefined, 'Reset your password without losing your place')}
            description={tx('pages.forgotPassword.subtitle', undefined, 'Enter your email and we will send a secure recovery link so you can get back into your workspace quickly.')}
            highlights={[
                {
                    icon: KeyRound,
                    title: t.auth.forgotPasswordForm.sendTitle,
                    description: tx('pages.forgotPassword.subtitle', undefined, 'Enter your email and we will send a secure recovery link so you can get back into your workspace quickly.'),
                },
                {
                    icon: ShieldCheck,
                    title: t.auth.forgotPasswordForm.rateLimited,
                    description: tx('pages.forgotPassword.protection', undefined, 'We protect this flow with rate limits and one-time recovery sessions.'),
                    tone: 'cyan',
                },
                {
                    icon: RotateCcw,
                    title: tx('pages.forgotPassword.checkSpamTitle', undefined, 'Check spam if needed'),
                    description: tx('pages.forgotPassword.checkSpamDescription', undefined, 'If the email takes a minute, check your spam folder before retrying.'),
                    tone: 'accent',
                },
            ]}
            topAction={
                <Link
                    to="/login"
                    className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                    {tx('pages.forgotPassword.backToLogin', undefined, 'Back to sign in')}
                </Link>
            }
        >
            <div>
                    {!isSuccess ? (
                        <>
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
                                    {tx('pages.forgotPassword.title', undefined, 'Reset your password')}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {tx('pages.forgotPassword.subtitle', undefined, 'Enter your email and we will send a secure recovery link so you can get back into your workspace quickly.')}
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
                                            {t.auth.forgotPasswordForm.rateLimited}
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
                                            {tx('common.loading', undefined, 'Loading...')}
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
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-3">
                                {tx('pages.forgotPassword.sentTitle', undefined, 'Check your email')}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                                {tx('pages.forgotPassword.sentDescription', undefined, 'We sent a reset link to')}
                            </p>
                            <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-white mb-6">
                                {getValues('email')}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                                {tx('pages.forgotPassword.checkSpamDescription', undefined, 'If the email takes a minute, check your spam folder before retrying.')}
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                            >
                                {tx('pages.forgotPassword.backToLogin', undefined, 'Back to sign in')}
                            </Link>
                        </div>
                    )}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    {tx('pages.forgotPassword.needHelp', undefined, 'Need help?')} {' '}
                    <a href="mailto:support@khedma.tn" className="text-primary-600 hover:underline">
                        {tx('pages.forgotPassword.contactUs', undefined, 'Contact us')}
                    </a>
                </p>
            </div>
        </AuthShell>
    );
};

export default ForgotPassword;
