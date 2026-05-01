
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Briefcase, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, Sparkles, Lock, CheckCircle2 } from 'lucide-react';

import { useTranslation } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import type { UserType } from '../../types';
import { useToast } from '../ui/Toast';
import { getWorkspaceOnboardingPath } from '@/lib/workspaceRoutes';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface SignupFormProps {
    onComplete?: () => void;
}

function SignupForm({ onComplete }: SignupFormProps) {
    const { t, tx, dir } = useTranslation();
    const { profile, refreshProfile, setUserType, signUpWithEmail } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlStep = searchParams.get('step');
    const [step, setStep] = useState<'email' | 'userType'>(urlStep === 'select-type' ? 'userType' : 'email');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [attempts, setAttempts] = useState(0);
    const [lockoutUntil, setLockoutTime] = useState<number | null>(() => {
        const item = localStorage.getItem('workedin_signup_lockout');
        if (item) {
            const parsed = parseInt(item, 10);
            if (parsed > Date.now()) return parsed;
            localStorage.removeItem('workedin_signup_lockout');
        }
        return null;
    });

    useEffect(() => {
        if (urlStep === 'select-type') {
            setStep('userType');
        } else {
            setStep('email');
        }
    }, [urlStep]);

    useEffect(() => {
        if (profile && !profile.user_type) {
            setStep('userType');
        }
    }, [profile]);



    useEffect(() => {
        if (step === 'userType') return;
        if (!profile?.user_type) return;

        navigate('/dashboard');
    }, [navigate, profile, step]);

    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    const signupSchema = z.object({
        email: z.string().email(t.auth.invalidEmail),
        password: z.string()
            .min(8, tx('authPages.signup.validation.passwordMinLength', undefined, 'Password must be at least 8 characters'))
            .regex(/[A-Z]/, tx('authPages.signup.validation.passwordUppercase', undefined, 'Must contain at least one uppercase letter'))
            .regex(/[a-z]/, tx('authPages.signup.validation.passwordLowercase', undefined, 'Must contain at least one lowercase letter'))
            .regex(/[0-9]/, tx('authPages.signup.validation.passwordNumber', undefined, 'Must contain at least one number')),
        confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: t.auth.passwordMismatch,
        path: ['confirmPassword'],
    });

    type SignupFormData = z.infer<typeof signupSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        mode: 'onChange',
    });

    const userTypes: { type: UserType; icon: React.ReactNode; title: string; description: string; color: string; bg: string }[] = [
        {
            type: 'freelancer',
            icon: <User className="h-7 w-7" />,
            color: '#a78bfa',
            bg: 'rgba(139, 92, 246, 0.2)',
            title: t.auth.freelancer,
            description: t.auth.userTypeFreelancerDesc,
        },
        {
            type: 'client',
            icon: <Briefcase className="h-7 w-7" />,
            color: '#E8820C',
            bg: 'rgba(232, 130, 12, 0.2)',
            title: t.auth.client,
            description: t.auth.userTypeClientDesc,
        },
    ];

    const onSubmit = async (data: SignupFormData) => {
        if (lockoutUntil && Date.now() < lockoutUntil) {
            const minutes = Math.ceil((lockoutUntil - Date.now()) / 60000);
            setError(tx('authPages.signup.rateLimitErrorMinutes', { minutes: String(minutes) }, 'Too many attempts. Please try again in {{minutes}} minutes.'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await signUpWithEmail(data.email, data.password);
            
            setAttempts(0);
            localStorage.removeItem('workedin_signup_lockout');

            // Redirect to email verification page
            navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
        } catch (err) {
            const newAttempts = attempts + 1;
             setAttempts(newAttempts);
             if (newAttempts >= 5) {
                 const lockout = Date.now() + 15 * 60 * 1000;
                 setLockoutTime(lockout);
                 localStorage.setItem('workedin_signup_lockout', lockout.toString());
                 const msg = tx('authPages.signup.rateLimitError15Min', undefined, 'Too many attempts. Please try again in 15 minutes.');
                 setError(msg);
                 showToast(msg, 'error');
                 setIsLoading(false);
                 return;
             }

            const message = (err as Error).message;
            if (message.includes('User already registered')) {
                setError(t.auth.emailExists);
                showToast(t.auth.emailExists, 'error');
            } else {
                setError(message || t.common.error);
                showToast(message || t.common.error, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectUserType = async (userType: UserType) => {
        setIsLoading(true);
        setError(null);
        try {
            await setUserType(userType);
            await refreshProfile();

            // 'both' â†’ start with freelancer onboarding first
            // 'client' â†’ go to client onboarding
            // 'freelancer' â†’ go to freelancer onboarding
            const startWorkspace = userType === 'client' ? 'client' : 'freelancer';
            navigate(getWorkspaceOnboardingPath(startWorkspace), { replace: true });
            onComplete?.();
        } catch (selectError) {
            const message = selectError instanceof Error ? selectError.message : String(selectError) || t.common.error;
            setError(message);
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };


    if (profile?.user_type && step !== 'userType') return null;

    return (
        <div className="mx-auto w-full max-w-md">
            {step === 'email' ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Header */}
                    <div className="mb-7">
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                            {t.auth.signupTitle}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--color-text-primary)]/40">
                            {t.auth.signupSubtitle}
                        </p>
                    </div>

                    {/* Google Button */}
                    <button
                        type="button"
                        onClick={async () => {
                            setIsLoading(true);
                            try {
                                const { error: oauthError } = await (await import('../../lib/supabase')).supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: `${window.location.origin}/auth/callback`,
                                        queryParams: { access_type: 'offline', prompt: 'select_account' },
                                    },
                                });
                                if (oauthError) throw oauthError;
                            } catch {
                                setIsLoading(false);
                                showToast(t.auth.googleLoginError, 'error');
                            }
                        }}
                        className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
                    >
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>{t.auth.googleLogin}</span>
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

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]/60">
                            <Mail className="w-3.5 h-3.5" />
                            {t.auth.email}
                        </label>
                        <input
                            type="email"
                            placeholder={t.auth.emailPlaceholder}
                            dir="ltr"
                            autoComplete="email"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/25 outline-none transition-all hover:border-white/20 focus:border-[var(--workspace-primary)] focus:ring-2 focus:ring-[var(--workspace-primary)]/20"
                            {...register('email')}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]/60">
                            <Lock className="w-3.5 h-3.5" />
                            {t.auth.password.label}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t.auth.passwordPlaceholder}
                                dir="ltr"
                                autoComplete="new-password"
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/25 outline-none transition-all hover:border-white/20 focus:border-[var(--workspace-primary)] focus:ring-2 focus:ring-[var(--workspace-primary)]/20"
                                {...register('password')}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[var(--color-text-primary)]/30 hover:text-[var(--color-text-primary)]/60 transition-colors">
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]/60">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t.auth.confirmPassword}
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t.auth.confirmPasswordPlaceholder}
                            dir="ltr"
                            autoComplete="new-password"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/25 outline-none transition-all hover:border-white/20 focus:border-[var(--workspace-primary)] focus:ring-2 focus:ring-[var(--workspace-primary)]/20"
                            {...register('confirmPassword')}
                        />
                        {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>}
                    </div>

                    {error && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                            <p className="text-center text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || (lockoutUntil ? Date.now() < lockoutUntil : false)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--workspace-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-1"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {t.auth.createAccount}
                                <ArrowIcon className="h-4 w-4" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-sm text-[var(--color-text-primary)]/30">
                        {t.auth.hasAccount}{' '}
                        <button type="button" onClick={() => navigate('/login')}
                            className="text-[var(--color-text-primary)]/70 font-semibold hover:text-[var(--color-text-primary)] transition-colors">
                            {t.nav.login}
                        </button>
                    </p>
                </form>
            ) : (
                <div className="animate-fade-in space-y-6">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--purple-600)] shadow-lg shadow-[var(--color-brand-primary)]/30">
                            <Briefcase className="h-8 w-8 text-[var(--color-text-primary)]" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold text-[var(--color-text-primary)]">
                            {t.auth.selectUserType}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            {t.auth.selectUserTypeSubtitle}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {userTypes.map((item) => (
                            <button
                                key={item.type}
                                type="button"
                                onClick={() => handleSelectUserType(item.type)}
                                disabled={isLoading}
                                className={`group relative w-full overflow-hidden rounded-[20px] border p-5 text-start transition-all duration-200 focus:outline-none ${
                                    isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                }`}
                                style={{
                                    background: 'var(--color-bg-subtle)',
                                    borderColor: '#2a2a2a',
                                }}
                                onMouseEnter={e => {
                                    if (!isLoading) {
                                        (e.currentTarget as HTMLElement).style.borderColor = item.color;
                                        (e.currentTarget as HTMLElement).style.background = '#161616';
                                    }
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a';
                                    (e.currentTarget as HTMLElement).style.background = '#111';
                                }}
                            >
                                <div className="relative z-10 flex items-center gap-4">
                                    <div
                                        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl shadow-lg"
                                        style={{ background: item.bg, color: item.color }}
                                    >
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="mb-1 text-lg font-bold text-[var(--color-text-primary)]">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm" style={{ color: '#888' }}>
                                            {item.description}
                                        </p>
                                    </div>
                                    <div
                                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors"
                                        style={{ borderColor: '#333' }}
                                    >
                                        <ArrowIcon className="h-4 w-4" style={{ color: item.color }} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {error ? (
                        <div className="rounded-xl border border-[var(--red-200)] dark:border-[var(--red-800)] bg-[var(--color-status-error)] p-4">
                            <p className="text-center text-sm font-medium text-[var(--red-600)] dark:text-[var(--red-400)]">{error}</p>
                        </div>
                    ) : (
                        <p className="text-center text-sm text-[var(--color-text-secondary)]">
                            {t.auth.selectUserTypeSubtitle}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default SignupForm;




