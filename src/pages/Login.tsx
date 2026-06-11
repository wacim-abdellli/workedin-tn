import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { Loader2, ShieldCheck, Lock, Globe2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../components/ui/Toast';
import { useAuthRateLimit } from '../hooks/useAuthRateLimit';
import { Logo } from '../components/ui/Logo';
import { getPostAuthWorkspacePath, shouldRequireUserTypeSelection } from '../lib/workspaceRoutes';
import { cn } from '../lib/utils';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, isLoading: authLoading, isFullyReady, signInWithEmail, profile, freelancerProfile } = useAuth();
    const { t, tx } = useTranslation();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { recordAttempt, isLockedOut } = useAuthRateLimit('login');
    
    const isOAuthResume = searchParams.get('oauth') === 'resume';
    const isSessionTimeout = searchParams.get('reason') === 'timeout';
    const redirectTarget = typeof location.state === 'object' && location.state && 'from' in location.state
        ? (location.state.from as { pathname?: string; search?: string; hash?: string } | undefined)
        : undefined;
    const rawPostLoginPath = redirectTarget?.pathname
        ? `${redirectTarget.pathname}${redirectTarget.search ?? ''}${redirectTarget.hash ?? ''}`
        : null;

    const isAuthOrOnboardingPath = rawPostLoginPath && (
        rawPostLoginPath.startsWith('/login') ||
        rawPostLoginPath.startsWith('/signup') ||
        rawPostLoginPath.startsWith('/onboarding')
    );
    const postLoginPath = isAuthOrOnboardingPath ? null : rawPostLoginPath;

    useEffect(() => {
        if (!isFullyReady || !isAuthenticated) return;
        // If user needs to select account type, go there directly — no home page flash
        if (shouldRequireUserTypeSelection(profile)) {
            navigate('/signup?step=select-type', { replace: true });
            return;
        }
        // Otherwise go to the intended destination or the correct workspace
        const destination = postLoginPath || getPostAuthWorkspacePath(profile, freelancerProfile);
        navigate(destination, { replace: true });
    }, [isAuthenticated, isFullyReady, navigate, postLoginPath, profile, freelancerProfile]);

    useEffect(() => {
        if (isSessionTimeout) {
            showToast(tx('auth.sessionExpired', undefined, 'Your session has expired. Please sign in again.'), 'warning');
        }
    }, [isSessionTimeout, showToast, tx]);

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

    if (isOAuthResume && authLoading) {
        return (
            <>
                <SEO {...SEO_CONFIG.login} url="/login" noIndex />
                <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-base)]">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-[#E8820C] animate-spin mx-auto mb-5" />
                        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                            {tx('authPages.login.finishingSignIn', undefined, 'Securing session...')}
                        </h1>
                        <p className="text-sm text-[var(--color-text-tertiary)]">
                            {tx('authPages.login.finishingSignInDescription', undefined, 'Hang tight while we prepare your workspace.')}
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEO {...SEO_CONFIG.login} url="/login" noIndex />
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
                            {tx('authPages.login.platformTagline', undefined, "# Tunisia's Freelance Platform")}
                        </p>

                        <h1 className="text-[clamp(36px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-1.5px] text-[var(--color-text-primary)] mb-5">
                            {tx('authPages.login.hero.workSmarter', undefined, 'Work smarter.')}<br />
                            <span className="text-[#E8820C]">{tx('authPages.login.hero.earnFairly', undefined, 'Earn fairly.')}</span>
                        </h1>

                        <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed max-w-[340px] mb-10">
                            {tx('authPages.login.platformSubtitle', undefined, 'Connect with verified talent, manage projects securely, and get paid in TND — every time.')}
                        </p>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { titleKey: 'authPages.login.featureCards.verified.title', subKey: 'authPages.login.featureCards.verified.sub', titleFb: 'Verified profiles', subFb: 'Every identity confirmed', icon: ShieldCheck, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                                { titleKey: 'authPages.login.featureCards.escrow.title', subKey: 'authPages.login.featureCards.escrow.sub', titleFb: 'Escrow payments', subFb: 'Funds held until delivery', icon: Lock, color: '#E8820C', bg: 'rgba(232,130,12,0.1)' },
                                { titleKey: 'authPages.login.featureCards.local.title', subKey: 'authPages.login.featureCards.local.sub', titleFb: 'Local & global', subFb: 'Optimised for Tunisia', icon: Globe2, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                            ].map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div key={f.titleKey}
                                        className="rounded-xl p-4 border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-md"
                                    >
                                        <div className="w-9 h-9 rounded-lg mb-3.5 flex items-center justify-center" style={{ background: f.bg }}>
                                            <Icon className="w-[18px] h-[18px]" style={{ color: f.color }} strokeWidth={2.5} />
                                        </div>
                                        <p className="text-[13px] font-bold text-[var(--color-text-primary)] mb-1 leading-snug">{tx(f.titleKey, undefined, f.titleFb)}</p>
                                        <p className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed">{tx(f.subKey, undefined, f.subFb)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <main className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-[var(--color-bg-base)] border-l border-[var(--color-border-subtle)]">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden mb-8">
                        <Logo variant="full" size="sm" mode="client" />
                    </div>

                    <div className="w-full max-w-[420px] mx-auto">
                        <div className="mb-9">
                            <h2 className="text-[26px] font-extrabold tracking-tight text-[var(--color-text-primary)] mb-1.5">
                                {tx('authPages.login.form.welcomeBack', undefined, 'Welcome back.')}
                            </h2>
                            <p className="text-sm text-[var(--color-text-tertiary)]">
                                {tx('authPages.login.form.subtitle', undefined, 'Sign in to your WorkedIn workspace.')}
                            </p>
                        </div>

                        {/* Google */}
                        <button
                            onClick={handleGoogle}
                            disabled={isLoading}
                            className={cn(
                                'w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 mb-6',
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
                            {tx('authPages.login.form.google', undefined, 'Continue with Google')}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
                            <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">
                                {tx('authPages.login.form.orEmail', undefined, 'or sign in with email')}
                            </span>
                            <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--color-text-tertiary)] mb-2">
                                    {tx('authPages.login.form.emailLabel', undefined, 'Email')}
                                </label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    {...register('email')}
                                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E8820C] focus:ring-2 focus:ring-[rgba(232,130,12,0.2)] transition-all"
                                />
                                {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email.message}</p>}
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[11px] font-bold tracking-[0.1em] uppercase text-[var(--color-text-tertiary)]">
                                        {tx('authPages.login.form.passwordLabel', undefined, 'Password')}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/forgot-password')}
                                        className="text-xs font-semibold text-[#E8820C] hover:text-[#d4750a] transition-colors"
                                    >
                                        {tx('authPages.login.form.forgotPassword', undefined, 'Forgot password?')}
                                    </button>
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    {...register('password')}
                                    className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E8820C] focus:ring-2 focus:ring-[rgba(232,130,12,0.2)] transition-all"
                                />
                                {errors.password && <p className="text-xs text-red-500 mt-1.5">{errors.password.message}</p>}
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 text-center py-1">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || isLockedOut}
                                className="w-full py-3.5 rounded-xl text-[15px] font-extrabold text-white tracking-tight transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
                                style={{ background: '#E8820C' }}
                            >
                                {isLoading ? tx('authPages.login.form.signingIn', undefined, 'Signing in…') : tx('authPages.login.form.signInButton', undefined, 'Sign in →')}
                            </button>
                        </form>

                        <p className="text-center mt-5 text-sm text-[var(--color-text-tertiary)]">
                            {tx('authPages.login.form.noAccount', undefined, "Don't have an account?")}{' '}
                            <button
                                onClick={() => navigate('/signup', { state: location.state })}
                                className="text-[#E8820C] font-bold hover:text-[#d4750a] transition-colors"
                            >
                                {tx('authPages.login.form.createOne', undefined, 'Create one')}
                            </button>
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
}

export default Login;

