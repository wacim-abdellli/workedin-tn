import { Header, Footer } from '../components/layout';
import { LoginForm } from '../components/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { useTheme } from '../contexts/ThemeContext';

function Login() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, profile } = useAuth();
    const { theme } = useTheme();

    // Redirect authenticated users to appropriate dashboard
    useEffect(() => {
        if (isLoading || !isAuthenticated) return;

        if (!profile?.user_type) {
            navigate('/signup?step=select-type');
            return;
        }

        if (!profile.onboarding_completed) {
            const onboardingRoute = profile.user_type === 'client'
                ? '/onboarding/client'
                : '/onboarding/freelancer';
            navigate(onboardingRoute);
            return;
        }

        const dashboardRoute = profile.user_type === 'client'
            ? '/client/dashboard'
            : '/freelancer/dashboard';
        navigate(dashboardRoute);
    }, [isAuthenticated, isLoading, profile, navigate]);

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
                    <div className="card-glass shadow-2xl shadow-primary-500/10 dark:shadow-black/50">
                        <LoginForm
                            onSuccess={handleSuccess}
                            onSwitchToSignup={() => navigate('/signup')}
                        />
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Login;
