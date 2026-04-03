
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
        const item = localStorage.getItem('khedma_signup_lockout');
        if (item) {
            const parsed = parseInt(item, 10);
            if (parsed > Date.now()) return parsed;
            localStorage.removeItem('khedma_signup_lockout');
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
            .min(8, tx('auth.validation.password.minLength', undefined, 'Password must be at least 8 characters'))
            .regex(/[A-Z]/, tx('auth.validation.password.uppercase', undefined, 'Must contain at least one uppercase letter'))
            .regex(/[a-z]/, tx('auth.validation.password.lowercase', undefined, 'Must contain at least one lowercase letter'))
            .regex(/[0-9]/, tx('auth.validation.password.number', undefined, 'Must contain at least one number')),
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

    const userTypes: { type: UserType; icon: React.ReactNode; title: string; description: string }[] = [
        {
            type: 'freelancer',
            icon: <User className="h-7 w-7" />,
            title: t.auth.freelancer,
            description: t.auth.userTypeFreelancerDesc,
        },
        {
            type: 'client',
            icon: <Briefcase className="h-7 w-7" />,
            title: t.auth.client,
            description: t.auth.userTypeClientDesc,
        },
    ];

    const onSubmit = async (data: SignupFormData) => {
        if (lockoutUntil && Date.now() < lockoutUntil) {
            const minutes = Math.ceil((lockoutUntil - Date.now()) / 60000);
            setError(tx('auth.rateLimitErrorMinutes', { minutes: String(minutes) }, 'Too many attempts. Please try again in {{minutes}} minutes.'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await signUpWithEmail(data.email, data.password);
            
            setAttempts(0);
            localStorage.removeItem('khedma_signup_lockout');

            // Redirect to email verification page
            navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
        } catch (err) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            if (newAttempts >= 5) {
                const lockout = Date.now() + 15 * 60 * 1000;
                setLockoutTime(lockout);
                localStorage.setItem('khedma_signup_lockout', lockout.toString());
                const msg = tx('auth.rateLimitError15Min', undefined, 'Too many attempts. Please try again in 15 minutes.');
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

            // 'both' → start with freelancer onboarding first
            // 'client' → go to client onboarding
            // 'freelancer' → go to freelancer onboarding
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="mb-8 text-center">
                        <div className="relative inline-block">
                            <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[linear-gradient(140deg,#f97316_0%,#ec4899_45%,#7c3aed_100%)] shadow-[0_20px_48px_-22px_rgba(236,72,153,0.65)]">
                                <Sparkles className="h-10 w-10 text-white" />
                            </div>
                            <div className="absolute -top-1 -end-1 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-primary-400 to-primary-600 shadow-lg shadow-primary-500/30">
                                <User className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <h2 className="mb-2 text-center text-2xl font-bold text-[#171420] dark:text-white">
                            {t.auth.signupTitle}
                        </h2>
                        <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
                            {t.auth.signupSubtitle}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            setIsLoading(true);
                            try {
                                const { error: oauthError } = await (await import('../../lib/supabase')).supabase.auth.signInWithOAuth({
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
                                if (oauthError) throw oauthError;
                            } catch {
                                setIsLoading(false);
                                showToast(t.auth.googleLoginError, 'error');
                            }
                        }}
                        className="w-full flex items-center justify-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-4 py-3.5 font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md dark:border-white/10 dark:bg-[#221d30] dark:text-gray-200 dark:hover:bg-[#2a2338]"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>{t.auth.googleLogin}</span>
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-3 text-gray-500 dark:bg-[#1a1825]">{t.auth.or}</span>
                        </div>
                    </div>

                    <div className="form-stack">
                        <div className="relative">
                            <label className="label flex items-center gap-2">
                                <Mail className="h-4 w-4 text-primary-500" />
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
                                <Lock className="h-4 w-4 text-primary-500" />
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
                                    className="absolute end-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-dark-400 transition-colors hover:bg-dark-100 hover:text-dark-600 dark:hover:bg-dark-700 dark:hover:text-dark-300"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="form-error">{errors.password.message}</p>}
                        </div>

                        <div className="relative">
                            <label className="label flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary-500" />
                                {t.auth.confirmPassword}
                            </label>
                            <input
                                {...register('confirmPassword')}
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t.auth.confirmPasswordPlaceholder}
                                className="input"
                                dir="ltr"
                            />
                            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
                        </div>
                    </div>

                    {error ? (
                        <div className="rounded-xl border border-accent-200 bg-accent-50 p-4 dark:border-accent-800 dark:bg-accent-900/20">
                            <p className="text-center text-sm font-medium text-accent-600 dark:text-accent-400">{error}</p>
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isLoading || (lockoutUntil ? Date.now() < lockoutUntil : false)}
                        className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(120deg,#6d28d9_0%,#9333ea_52%,#c026d3_100%)] px-6 py-3.5 font-semibold text-white shadow-[0_20px_48px_-24px_rgba(147,51,234,0.75)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-24px_rgba(192,38,211,0.85)]"
                    >
                        {isLoading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                            <>
                                <span>{t.auth.createAccount}</span>
                                <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-muted">
                        {t.auth.hasAccount}{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
                        >
                            {t.nav.login}
                        </button>
                    </p>
                </form>
            ) : (
                <div className="animate-fade-in space-y-6">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
                            <Briefcase className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold text-[#171420] dark:text-white">
                            {t.auth.selectUserType}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
                                className={`group relative w-full overflow-hidden rounded-[24px] border p-5 text-start transition-all duration-300 focus:outline-none focus:ring-2 ring-offset-2 hover:-translate-y-1 hover:shadow-xl ${
                                    isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                } bg-white border-gray-200/90 hover:border-purple-200 hover:bg-purple-50/40 dark:bg-[#1a1825] dark:border-white/10 dark:hover:border-purple-500/30 dark:hover:bg-white/5`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-amber-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 p-3 text-purple-600 shadow-lg dark:bg-purple-900/40 dark:text-purple-300">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="mb-1 text-lg font-bold text-[#171420] dark:text-white">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {item.description}
                                        </p>
                                    </div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dark-200 transition-colors dark:border-dark-600">
                                        <ArrowIcon className="h-4 w-4 text-primary-500" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {error ? (
                        <div className="rounded-xl border border-accent-200 bg-accent-50 p-4 dark:border-accent-800 dark:bg-accent-900/20">
                            <p className="text-center text-sm font-medium text-accent-600 dark:text-accent-400">{error}</p>
                        </div>
                    ) : (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            {t.auth.selectUserTypeSubtitle}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default SignupForm;
