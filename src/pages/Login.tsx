import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Globe2, ShieldCheck } from 'lucide-react';

import { AuthShell, LoginForm } from '../components/auth';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { Loader2 } from 'lucide-react';
import { getPostAuthWorkspacePath } from '@/lib/workspaceRoutes';
import { useTranslation } from '../i18n';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, isLoading, isFullyReady, profile, freelancerProfile } = useAuth();
    const { tx } = useTranslation();
    const isOAuthResume = searchParams.get('oauth') === 'resume';
    const redirectTarget = typeof location.state === 'object' && location.state && 'from' in location.state
        ? (location.state.from as { pathname?: string; search?: string; hash?: string } | undefined)
        : undefined;
    const postLoginPath = redirectTarget?.pathname
        ? `${redirectTarget.pathname}${redirectTarget.search ?? ''}${redirectTarget.hash ?? ''}`
        : null;

    // Redirect authenticated users to appropriate dashboard
    useEffect(() => {
        if (!isFullyReady || !isAuthenticated) return;

        navigate(postLoginPath || getPostAuthWorkspacePath(profile, freelancerProfile), { replace: true });
    }, [freelancerProfile, isAuthenticated, isFullyReady, navigate, postLoginPath, profile]);

    const handleSuccess = () => {
        // Navigation is handled by the useEffect above to avoid race conditions
        // where profile might not be loaded yet when this callback fires
    };

    return (
        <>
            <SEO {...SEO_CONFIG.login} url="/login" noIndex />
            <AuthShell
                badge={tx('pages.login.badge', undefined, 'Trusted freelance marketplace')}
                title={tx('pages.login.heroTitle', undefined, 'Sign in without the clutter and get back to work fast.')}
                description={tx('pages.login.heroDescription', undefined, 'A calmer auth flow for clients and freelancers, with clearer states, trusted payments, and workspace switching that stays out of your way.')}
                highlights={[
                    {
                        icon: ShieldCheck,
                        title: tx('pages.login.highlightTrustTitle', undefined, 'Verified identities'),
                        description: tx('pages.login.highlightTrustDescription', undefined, 'Profiles, contracts, and verification signals stay visible across your workspace.'),
                    },
                    {
                        icon: BadgeCheck,
                        title: tx('pages.login.highlightPaymentsTitle', undefined, 'Protected transactions'),
                        description: tx('pages.login.highlightPaymentsDescription', undefined, 'Escrow-first flows keep client payments and freelancer delivery aligned.'),
                        tone: 'accent',
                    },
                    {
                        icon: Globe2,
                        title: tx('pages.login.highlightLocaleTitle', undefined, 'Built for Tunisia'),
                        description: tx('pages.login.highlightLocaleDescription', undefined, 'Arabic, French, and English flows tuned for local freelance work.'),
                        tone: 'cyan',
                    },
                ]}
                topAction={
                    <Link
                        to="/signup"
                        className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                    >
                        {tx('pages.login.createAccountAction', undefined, 'Create account')}
                    </Link>
                }
            >
                <div className="animate-slide-up">
                    {isOAuthResume && isLoading ? (
                        <div className="rounded-3xl border border-white/10 bg-gray-50/70 p-8 text-center dark:bg-white/5">
                            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
                            <h1 className="mb-2 text-2xl font-bold text-[#171420] dark:text-white">{tx('pages.login.finishingSignIn', undefined, 'Finishing your sign in')}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {tx('pages.login.finishingSignInDescription', undefined, 'We are confirming your secure session and sending you to the right workspace.')}
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
