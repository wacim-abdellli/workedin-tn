import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { ShieldCheck, Lock, Globe2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../components/ui/Toast';
import { Logo } from '../components/ui/Logo';
import SignupForm from '../components/auth/SignupForm';
import { cn } from '../lib/utils';

function Signup() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { signUpWithEmail } = useAuth();
    const { t, tx } = useTranslation();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const shouldShowTypeSelection = searchParams.get('step') === 'select-type';
    
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

    const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        mode: 'onChange',
    });

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

    const handleGoogle = async () => {
        setIsLoading(true);
        try {
            const { error } = await (await import('../lib/supabase')).supabase.auth.signInWithOAuth({
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

    if (shouldShowTypeSelection) {
        return (
            <>
                <SEO {...SEO_CONFIG.signup} url="/signup?step=select-type" noIndex />
                <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-bg-base)]">
                    <SignupForm />
                </div>
            </>
        );
    }

    return (
        <>
            <SEO {...SEO_CONFIG.signup} url="/signup" />
            <div className="grid lg:grid-cols-2 min-h-screen bg-[var(--color-bg-base)]">
                {/* LEFT PANEL */}
                <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-[var(--color-bg-subtle)] border-r border-[var(--color-border-subtle)] relative overflow-hidden">
                    <div className="pointer-events-none absolute inset-0"
                        style={{ background: 'radial-gradient(circle at 20% 80%, rgba(232,130,12,0.07) 0%, transparent 60%)' }} />

                    <div className="relative z-10">
                        <Logo variant="full" size="sm" mode="client" />
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E8820C] mb-5">
                            {tx('authPages.signup.badge', undefined, 'Join WorkedIn')}
                        </p>

                        <h1 className="text-[clamp(36px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-1.5px] text-[var(--color-text-primary)] mb-5">
                            {tx('authPages.signup.heroTitleTop', undefined, 'Ready for your')}<br />
                            <span className="text-[#E8820C]">{tx('authPages.signup.heroTitleAccent', undefined, 'next big project?')}</span>
                        </h1>

                        <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed max-w-[340px] mb-10">
                            {tx('authPages.signup.heroDescription', undefined, 'Join thousands of professionals across Tunisia. Set up your workspace and start working in minutes.')}
                        </p>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { title: tx('authPages.signup.featureCards.verified.title', undefined, 'Verified profiles'), sub: tx('authPages.signup.featureCards.verified.sub', undefined, 'Every identity confirmed'), icon: ShieldCheck, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                                { title: tx('authPages.signup.featureCards.escrow.title', undefined, 'Escrow payments'), sub: tx('authPages.signup.featureCards.escrow.sub', undefined, 'Funds held until delivery'), icon: Lock, color: '#E8820C', bg: 'rgba(232,130,12,0.1)' },
                                { title: tx('authPages.signup.featureCards.local.title', undefined, 'Local & global'), sub: tx('authPages.signup.featureCards.local.sub', undefined, 'Optimised for Tunisia'), icon: Globe2, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                            ].map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div key={f.title} className="rounded-xl p-4 border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-md">
                                        <div className="w-9 h-9 rounded-lg mb-3.5 flex items-center justify-center" style={{ background: f.bg }}>
                                            <Icon className="w-[18px] h-[18px]" style={{ color: f.color }} strokeWidth={2.5} />
                                        </div>
                                        <p className="text-[13px] font-bold text-[var(--color-text-primary)] mb-1 leading-snug">{f.title}</p>
                                        <p className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed">{f.sub}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-[var(--color-bg-base)] border-l border-[var(--color-border-subtle)] overflow-y-auto max-h-screen">
                    <div className="w-full max-w-[420px] mx-auto">
                        <div className="flex lg:hidden mb-8">
                            <Logo variant="full" size="sm" mode="client" />
                        </div>

                        <div className="mb-7">
                            <h2 className="text-[26px] font-extrabold tracking-tight text-[var(--color-text-primary)] mb-1.5">
                                {tx('authPages.signup.formTitle', undefined, 'Create your account')}
                            </h2>
                            <p className="text-sm text-[var(--color-text-tertiary)]">
                                {tx('authPages.signup.formSubtitle', undefined, 'Join 2,500+ professionals building their career on WorkedIn')}
                            </p>
                        </div>

                        {/* Google */}
                        <button
                            onClick={handleGoogle}
                            disabled={isLoading}
                            className={cn(
                                'w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 mb-5',
                                'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] text-[var(--color-text-primary)]',
                                'hover:bg-[var(--color-bg-muted)] hover:border-[var(--color-border-strong)]',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                            )}
                        >
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {tx('authPages.signup.continueWithGoogle', undefined, 'Continue with Google')}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
                            <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                                {tx('authPages.signup.orSignUpWithEmail', undefined, 'or sign up with email')}
                            </span>
                            <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                            <div>
                                <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--color-text-tertiary)] mb-1.5">
                                    {tx('authPages.signup.emailLabel', undefined, 'Email')}
                                </label>
                                <input
                                    type="email"
                                    placeholder={tx('authPages.signup.emailPlaceholder', undefined, 'you@example.com')}
                                    autoComplete="email"
                                    {...register('email')}
                                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E8820C] focus:ring-2 focus:ring-[rgba(232,130,12,0.2)] transition-all"
                                />
                                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--color-text-tertiary)] mb-1.5">
                                    {tx('authPages.signup.passwordLabel', undefined, 'Password')}
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    {...register('password')}
                                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E8820C] focus:ring-2 focus:ring-[rgba(232,130,12,0.2)] transition-all"
                                />
                                {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password.message}</p>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--color-text-tertiary)] mb-1.5">
                                    {tx('authPages.signup.confirmPasswordLabel', undefined, 'Confirm Password')}
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    {...register('confirmPassword')}
                                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E8820C] focus:ring-2 focus:ring-[rgba(232,130,12,0.2)] transition-all"
                                />
                                {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                            </div>

                            {error && (
                                <p className="text-xs text-red-500 text-center py-1">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || (lockoutUntil ? Date.now() < lockoutUntil : false)}
                                className="w-full py-3.5 rounded-xl text-[15px] font-extrabold text-white tracking-tight transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] mt-1"
                                style={{ background: '#E8820C' }}
                            >
                                {isLoading
                                    ? tx('authPages.signup.creatingAccount', undefined, 'Creating account…')
                                    : tx('authPages.signup.createAccountButton', undefined, 'Create account →')
                                }
                            </button>
                        </form>

                        <p className="text-center mt-4 text-sm text-[var(--color-text-tertiary)]">
                            {tx('authPages.signup.alreadyHaveAccount', undefined, 'Already have an account?')}{' '}
                            <button
                                onClick={() => navigate('/login', { state: location.state })}
                                className="text-[#E8820C] font-bold hover:text-[#d4750a] transition-colors"
                            >
                                {tx('authPages.signup.signInLink', undefined, 'Sign in')}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Signup;

