 import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, RotateCcw, ShieldCheck, CheckCircle } from 'lucide-react';
import { useTranslation } from '../i18n';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { AuthShell } from '../components/auth';

// Validation schema
const getForgotPasswordSchema = (tx: any) => z.object({
    email: z.string().email(tx('auth.validation.invalidEmail', undefined, 'Ø£Ø¯Ø®Ù„ Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØµØ­ÙŠØ­')),
});

type ForgotPasswordFormData = z.infer<ReturnType<typeof getForgotPasswordSchema>>;

const ForgotPassword = () => {
    const { t, tx } = useTranslation();
    const { showToast } = useToast();
    const navigate = useNavigate();
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
                    className="inline-flex items-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-background-base)]/60 px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] backdrop-blur-sm transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-background-muted)]"
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
                                <div className="w-16 h-16 bg-[var(--color-brand-primary-light)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-8 h-8 text-[var(--color-brand-primary)]" />
                                </div>
                                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                                    {tx('pages.forgotPassword.title', undefined, 'Reset your password')}
                                </h1>
                                <p className="text-[var(--color-text-secondary)]">
                                    {tx('pages.forgotPassword.subtitle', undefined, 'Enter your email and we will send a secure recovery link so you can get back into your workspace quickly.')}
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
                                {/* Email Field */}
                                <Input
                                    id="email"
                                    type="email"
                                    label={t.auth.email}
                                    leftIcon={<Mail className="w-5 h-5" />}
                                    placeholder={t.auth.emailPlaceholder}
                                    error={errors.email?.message}
                                    disabled={isLoading}
                                    {...register('email')}
                                />

                                {/* Rate Limit Warning */}
                                {rateLimitError && (
                                    <div className="p-4 bg-[var(--color-status-warning)] border border-[var(--amber-200)] dark:border-[var(--amber-800)] rounded-xl">
                                        <p className="text-sm text-[var(--amber-800)] dark:text-[var(--amber-200)]">
                                            {t.auth.forgotPasswordForm.rateLimited}
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    className="w-full"
                                    isLoading={isLoading}
                                    disabled={isLoading}
                                >
                                    {t.auth.forgotPasswordForm.sendTitle}
                                </Button>
                            </form>
                        </>
                    ) : (
                        /* Success State */
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-[var(--green-100)] dark:bg-[var(--green-900)] rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-[var(--green-600)] dark:text-[var(--green-400)]" />
                            </div>
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
                                {tx('pages.forgotPassword.sentTitle', undefined, 'Check your email')}
                            </h2>
                            <p className="text-[var(--color-text-secondary)] mb-2">
                                {tx('pages.forgotPassword.sentDescription', undefined, 'We sent a reset link to')}
                            </p>
                            <p className="font-medium text-[var(--color-text-primary)] mb-6">
                                {getValues('email')}
                            </p>
                            <p className="text-sm text-[var(--color-text-tertiary)] mb-8">
                                {tx('pages.forgotPassword.checkSpamDescription', undefined, 'If the email takes a minute, check your spam folder before retrying.')}
                            </p>
                            <Button
                                onClick={() => navigate('/login')}
                                variant="primary"
                                size="md"
                                className="w-full"
                            >
                                {tx('pages.forgotPassword.backToLogin', undefined, 'Back to sign in')}
                            </Button>
                        </div>
                    )}
                <p className="text-center text-sm text-[var(--color-text-tertiary)] mt-6">
                    {tx('pages.forgotPassword.needHelp', undefined, 'Need help?')} {' '}
                    <a href="mailto:support@workedin.tn" className="text-[var(--color-brand-primary)] hover:underline">
                        {tx('pages.forgotPassword.contactUs', undefined, 'Contact us')}
                    </a>
                </p>
            </div>
        </AuthShell>
    );
};

export default ForgotPassword;

