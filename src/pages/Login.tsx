import { Header, Footer } from '../components/layout';
import { LoginForm } from '../components/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { useTheme } from '../contexts/ThemeContext';
import { Loader2 } from 'lucide-react';
import { getPostAuthWorkspacePath } from '@/lib/workspaceRoutes';

function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, isLoading, profile, freelancerProfile } = useAuth();
    const { theme } = useTheme();
    const isOAuthResume = searchParams.get('oauth') === 'resume';

    // Redirect authenticated users to appropriate dashboard
    useEffect(() => {
        if (isLoading || !isAuthenticated) return;

        navigate(getPostAuthWorkspacePath(profile, freelancerProfile));
    }, [freelancerProfile, isAuthenticated, isLoading, navigate, profile]);

    const handleSuccess = () => {
        // Navigation is handled by the useEffect above to avoid race conditions
        // where profile might not be loaded yet when this callback fires
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-dark-50 dark:bg-dark-900">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 start-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse" />
                <div className="absolute bottom-0 end-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse animation-delay-200" />
            </div>

            <SEO {...SEO_CONFIG.login} url="/login" noIndex />
            <Header />

            <div className="flex-1 flex items-center justify-center py-16 px-4 relative z-10">
                <div className="w-full max-w-md animate-slide-up">
                    <img
                        src={theme === 'dark' ? '/logos/logo-stacked-dark.svg' : '/logos/logo-stacked.svg'}
                        alt="Khedma TN"
                        style={{ height: '80px', width: 'auto', margin: '0 auto 2rem' }}
                    />
                    {isOAuthResume && isLoading ? (
                        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-xl shadow-gray-200/50 dark:border dark:border-white/8 dark:bg-[#1a1825] dark:shadow-black/50">
                            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
                            <h1 className="mb-2 text-2xl font-bold text-[#171420] dark:text-white">Finishing your sign in</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                We are confirming your secure session and sending you to the right workspace.
                            </p>
                        </div>
                    ) : (
                        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-gray-200/50 dark:border dark:border-white/8 dark:bg-[#1a1825] dark:shadow-black/50">
                            <LoginForm
                                onSuccess={handleSuccess}
                                onSwitchToSignup={() => navigate('/signup')}
                            />
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Login;
