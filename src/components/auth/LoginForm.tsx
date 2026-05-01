import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { useAuthRateLimit } from '../../hooks/useAuthRateLimit';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface LoginFormProps {
    onSuccess?: () => void;
    onSwitchToSignup?: () => void;
}

function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
    const { t, tx, dir } = useTranslation();
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

    const { register, handleSubmit, formState: { errors } } = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
        mode: 'onChange',
    });

    const onSubmit = async (data: EmailFormData) => {
        if (isLockedOut) {
            setError(tx('authPages.login.rateLimitError', undefined, 'Too many attempts. Please try again later.'));
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
                setError(message); showToast(message, 'error');
            } else if (message.includes('Invalid login credentials')) {
                setError(t.auth.invalidCredentials); showToast(t.auth.invalidCredentials, 'error');
            } else if (message.includes('Email not confirmed')) {
                setError(t.auth.emailNotConfirmed); showToast(t.auth.emailNotConfirmed, 'warning');
            } else {
                setError(message || t.common.error); showToast(message || t.common.error, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogle = async () => {
        setIsLoading(true);
        try {
            const { error } = await (await import('../../lib/supabase')).supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: { access_type: 'offline', prompt: 'select_account' },
                },
            });
            if (error) throw error;
        } catch {
            setIsLoading(false);
            showToast(t.auth.googleLoginError, 'error');
        }
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-7">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                    {t.auth.loginTitle}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-primary)]/40">
                    {t.auth.loginSubtitle}
                </p>
            </div>

            {/* Google Button */}
            <button
                type="button"
                onClick={handleGoogle}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98] disabled:opacity-50"
            >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t.auth.googleLogin}
            </button>

            {/* Divider */}
            <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/8" />
                </div>
                <div className="relative flex justify-center">
                    <span className="px-3 bg-[var(--color-bg-base)] text-xs text-[var(--color-text-primary)]/25 uppercase tracking-widest">{t.auth.or}</span>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]/60">
                        <Mail className="w-3.5 h-3.5" />
                        {t.auth.email}
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            placeholder={t.auth.emailPlaceholder}
                            dir="ltr"
                            autoComplete="email"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/25 outline-none transition-all hover:border-white/20 focus:border-[var(--workspace-primary)] focus:ring-2 focus:ring-[var(--workspace-primary)]/20"
                            {...register('email')}
                        />
                        {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]/60">
                            <Lock className="w-3.5 h-3.5" />
                            {t.auth.password.label}
                        </label>
                        <Link to="/forgot-password" className="text-xs text-[var(--workspace-primary)] hover:underline">
                            {t.auth.forgotPassword}
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t.auth.passwordPlaceholder}
                            dir="ltr"
                            autoComplete="current-password"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/25 outline-none transition-all hover:border-white/20 focus:border-[var(--workspace-primary)] focus:ring-2 focus:ring-[var(--workspace-primary)]/20"
                            {...register('password')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[var(--color-text-primary)]/30 hover:text-[var(--color-text-primary)]/60 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || isLockedOut}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--workspace-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-1"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            {t.nav.login}
                            <ArrowIcon className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            {/* Switch to signup */}
            {onSwitchToSignup && (
                <p className="mt-6 text-center text-sm text-[var(--color-text-primary)]/30">
                    {t.auth.noAccount}{' '}
                    <button
                        type="button"
                        onClick={onSwitchToSignup}
                        className="text-[var(--color-text-primary)]/70 font-semibold hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        {t.nav.signup}
                    </button>
                </p>
            )}
        </div>
    );
}

export default LoginForm;


