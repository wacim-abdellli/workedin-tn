import { Header, Footer } from '../components/layout';
import { LoginForm } from '../components/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

function Login() {
    const navigate = useNavigate();
    const { isAuthenticated, profile } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && profile?.user_type) {
            navigate(profile.user_type === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
        }
    }, [isAuthenticated, profile, navigate]);

    const handleSuccess = () => {
        if (!profile?.user_type) {
            navigate('/signup');
        } else {
            navigate(profile.user_type === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-dark-50 dark:bg-dark-900">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 start-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse" />
                <div className="absolute bottom-0 end-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse animation-delay-200" />
            </div>

            <Header />

            <div className="flex-1 flex items-center justify-center py-16 px-4 relative z-10">
                <div className="w-full max-w-md animate-slide-up">
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
