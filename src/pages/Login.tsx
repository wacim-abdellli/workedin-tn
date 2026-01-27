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
        // Check if profile needs user type selection
        if (!profile?.user_type) {
            navigate('/signup');
        } else {
            navigate(profile.user_type === 'client' ? '/client/dashboard' : '/freelancer/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <div className="flex-1 flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md">
                    <div className="card">
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
