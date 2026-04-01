import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, Eye, EyeOff, Sparkles, Lock } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { useAuthRateLimit } from '../../hooks/useAuthRateLimit';

interface LoginFormProps {
    onSuccess?: () => void;
    onSwitchToSignup?: () => void;
}
function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
    const { t, dir } = useTranslation();
    const { signInWithEmail } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const { recordAttempt, isLockedOut } = useAuthRateLimit('login');

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    const emailSchema = z.object({
        email: z.string().email(t.auth.invalidEmail),
        password: z.string().min(6, t.auth.passwordMinLength),
    });

    type EmailFormData = z.infer<typeof emailSchema>;
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
    });
    const onSubmit = async (data: EmailFormData) => {
        if (isLockedOut) {
            setError(`Too many attempts. Please try again later.`);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await recordAttempt(() => signInWithEmail(data.email, data.password));
            onSuccess?.();
        } catch (err) {
            const message = (err as Error).message;
            if (message.includes('Too many') || message.includes('Rate limit')) {
                setError(message);
                showToast(message, 'error');
            } else if (message.includes('Invalid login credentials')) {
                setError(t.auth.invalidCredentials);
                showToast(t.auth.invalidCredentials, 'error');
            } else if (message.includes('Email not confirmed')) {
                setError(t.auth.emailNotConfirmed);
                showToast(t.auth.emailNotConfirmed, 'warning');
            } else {
                setError(message || t.common.error);
                showToast(message || t.common.error, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }; 
    return (
        <div className="w-full max-w-md mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="relative inline-block">
                        <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[linear-gradient(140deg,#2455f5_0%,#6d28d9_55%,#c026d3_100%)] shadow-[0_20px_48px_-22px_rgba(109,40,217,0.75)]">
                            <Mail className="h-9 w-9 text-white" />
                        </div>
                        <div className="absolute -top-1 -end-1 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                    </div>
                    <h2 className="text-center text-2xl font-bold text-[#171420] dark:text-white mb-2">
                        {t.auth.loginTitle}
                    </h2>
                    <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
                        {t.auth.loginSubtitle}
                    </p>
                </div>

                {/* Google OAuth Button */}
                <button
                    type="button"
                    onClick={async () => {
                        setIsLoading(true);
                        try {
                            const { error } = await (await import('../../lib/supabase')).supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                    redirectTo: `${window.location.origin}/auth/callback`,
                                    queryParams: {
                                        access_type: 'offline',
                                        prompt: 'select_account',
                                        hl: dir === 'rtl' ? 'ar' : 'fr',
                                    },
                                },
                            });
                            if (error) throw error;
                        } catch {
                            setIsLoading(false);
                            showToast(t.auth.googleLoginError, 'error');
                        }
                    }}
                    className="w-full flex items-center justify-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-4 py-3.5 font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md dark:border-white/10 dark:bg-[#221d30] dark:text-gray-200 dark:hover:bg-[#2a2338]"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {isLoading ? <span>Loading...</span> : <span>{t.auth.googleLogin}</span>}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white text-gray-500 dark:bg-[#1a1825]">{t.auth.or}</span>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="form-stack">
                    <div className="relative">
                        <label className="label flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary-500" />
                            {t.auth.email}
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder={t.auth.emailPlaceholder}
                            className="input"
                            dir="ltr"
                        />
                        {errors.email && <p className="form-error">{errors.email.message}</p>}
                    </div>

                    <div className="relative">
                        <label className="label flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary-500" />
                            {t.auth.password.label}
                        </label>
                        <div className="relative">
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t.auth.passwordPlaceholder}
                                className="input pe-12"
                                dir="ltr"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute end-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-dark-600 dark:hover:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                                aria-label={showPassword ? t.auth.password.hide : t.auth.password.show}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.password && <p className="form-error">{errors.password.message}</p>}
                        <div className="mt-2 text-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                            >
                                {t.auth.forgotPassword}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800">
                        <p className="text-accent-600 dark:text-accent-400 text-sm text-center font-medium">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || isLockedOut}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(120deg,#6d28d9_0%,#9333ea_52%,#c026d3_100%)] px-6 py-3.5 font-semibold text-white shadow-[0_20px_48px_-24px_rgba(147,51,234,0.75)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-24px_rgba(192,38,211,0.85)]"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>{t.nav.login}</span>
                            <ArrowIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>

                {/* Switch to Signup */}
                {onSwitchToSignup && (
                    <p className="text-center text-muted">
                        {t.auth.noAccount}{' '}
                        <button
                            type="button"
                            onClick={onSwitchToSignup}
                            className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                        >
                            {t.nav.signup}
                        </button>
                    </p>
                )}
            </form>
        </div>
    );
}

export default LoginForm;
