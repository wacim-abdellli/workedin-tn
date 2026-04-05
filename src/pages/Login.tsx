import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Globe2, ShieldCheck } from 'lucide-react';

import { AuthShell, LoginForm } from '../components/auth';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, isLoading, isFullyReady } = useAuth();
    const { tx } = useTranslation();
    const isOAuthResume = searchParams.get('oauth') === 'resume';
    const redirectTarget = typeof location.state === 'object' && location.state && 'from' in location.state
        ? (location.state.from as { pathname?: string; search?: string; hash?: string } | undefined)
        : undefined;
    const rawPostLoginPath = redirectTarget?.pathname
        ? `${redirectTarget.pathname}${redirectTarget.search ?? ''}${redirectTarget.hash ?? ''}`
        : null;

    // Filter out paths that we should never explicitly bounce back to after login
    // like onboarding pages (which have their own smart routing via /dashboard) or auth pages.
    const isAuthOrOnboardingPath = rawPostLoginPath && (
        rawPostLoginPath.startsWith('/login') ||
        rawPostLoginPath.startsWith('/signup') ||
        rawPostLoginPath.startsWith('/onboarding')
    );
    const postLoginPath = isAuthOrOnboardingPath ? null : rawPostLoginPath;

    // Redirect authenticated users — always go through /dashboard which waits
    // for full auth state before deciding where to go. This prevents routing to
    // /onboarding when the profile hasn't loaded yet.
    useEffect(() => {
        if (!isFullyReady || !isAuthenticated) return;

        // If the user was trying to reach a specific protected page, send them there.
        // Otherwise go to /dashboard which uses DashboardRedirect to safely resolve
        // the correct workspace page with a fully-loaded profile.
        navigate(postLoginPath || '/dashboard', { replace: true });
    }, [isAuthenticated, isFullyReady, navigate, postLoginPath]);

    const handleSuccess = () => {
        // Navigation is handled by the useEffect above to avoid race conditions
        // where profile might not be loaded yet when this callback fires
    };

    return (
        <>
            <SEO {...SEO_CONFIG.login} url="/login" noIndex />
            <AuthShell
                badge={tx('authPages.login.badge', undefined, 'Khedma TN')}
                title={tx('authPages.login.heroTitle', undefined, 'Welcome back. Let\'s get to work.')}
                description={tx('authPages.login.heroDescription', undefined, 'Access your workspace, manage projects securely, and connect with top talent across Tunisia.')}
                highlights={[
                    {
                        icon: ShieldCheck,
                        title: tx('authPages.login.highlightTrustTitle', undefined, 'Verified Profiles'),
                        description: tx('authPages.login.highlightTrustDescription', undefined, 'Work with confidence. Every profile and skill is verified.'),
                    },
                    {
                        icon: BadgeCheck,
                        title: tx('authPages.login.highlightPaymentsTitle', undefined, 'Secure Payments'),
                        description: tx('authPages.login.highlightPaymentsDescription', undefined, 'Funds are held safely until the milestone or project is delivered.'),
                        tone: 'accent',
                    },
                    {
                        icon: Globe2,
                        title: tx('authPages.login.highlightLocaleTitle', undefined, 'Local & Global'),
                        description: tx('authPages.login.highlightLocaleDescription', undefined, 'Optimized for local talent with fast transactions.'),
                        tone: 'cyan',
                    },
                ]}
                topAction={
                    <Link
                        to="/signup"
                        className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/12 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white/80 backdrop-blur-sm shadow-sm transition-colors hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                        {tx('authPages.login.createAccountAction', undefined, 'Create account')}
                    </Link>
                }
            >
                <div className="animate-slide-up">
                    {isOAuthResume && isLoading ? (
                        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-gray-200 dark:border-white/5 bg-white/50 p-8 text-center dark:bg-zinc-900/60 backdrop-blur-md">
                            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'color-mix(in srgb, var(--workspace-accent) 15%, transparent)' }}>
                                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--workspace-accent)' }} />
                            </div>
                            <h1 className="mb-3 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                {tx('authPages.login.finishingSignIn', undefined, 'Securing session...')}
                            </h1>
                            <p className="max-w-[280px] text-sm leading-relaxed text-gray-500 dark:text-zinc-400">
                                {tx('authPages.login.finishingSignInDescription', undefined, 'Hang tight while we prepare your workspace.')}
                            </p>
                        </div>
                    ) : (
                        <LoginForm
                            onSuccess={handleSuccess}
                            onSwitchToSignup={() => navigate('/signup', { state: location.state })}
                        />
                    )}
                </div>
            </AuthShell>
        </>
    );
}

export default Login;
