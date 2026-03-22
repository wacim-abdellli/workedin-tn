import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';

const AuthCallback = () => {
    const { dir } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, profile } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isStuck, setIsStuck] = useState(false);
    const hasRedirected = useRef(false);

    // Route the user once AuthContext has both a session AND a profile
    useEffect(() => {
        if (hasRedirected.current) return;
        if (isLoading) return; // AuthContext still initializing
        if (!isAuthenticated) return; // No session yet, keep waiting

        // We have a session. If profile is loaded, route now.
        if (profile) {
            hasRedirected.current = true;

            if (profile.user_type === 'admin') {
                navigate('/admin', { replace: true });
            } else if (!profile.user_type) {
                navigate('/signup?step=select-type', { replace: true });
            } else if (!profile.onboarding_completed) {
                if (profile.user_type === 'freelancer' || profile.user_type === 'both') {
                    navigate('/onboarding/freelancer', { replace: true });
                } else {
                    navigate('/onboarding/client', { replace: true });
                }
            } else {
                if (profile.user_type === 'freelancer' || profile.user_type === 'both') {
                    navigate('/freelancer/dashboard', { replace: true });
                } else {
                    navigate('/client/dashboard', { replace: true });
                }
            }
        }
    }, [isAuthenticated, isLoading, profile, navigate]);

    // Handle case where session exists but no profile (new OAuth user)
    useEffect(() => {
        if (hasRedirected.current) return;
        if (isLoading) return;
        if (isAuthenticated && !profile) {
            // Wait a moment for profile to load, then redirect to signup
            const timer = setTimeout(() => {
                if (!hasRedirected.current && !profile) {
                    hasRedirected.current = true;
                    navigate('/signup?step=select-type', { replace: true });
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, isLoading, profile, navigate]);

    // Safety timeout: if nothing happens within 12s, show error
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (!hasRedirected.current) {
                setError('انتهت مهلة تسجيل الدخول. يرجى المحاولة مرة أخرى.');
                setIsStuck(true);
            }
        }, 12000);
        return () => clearTimeout(timeoutId);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 flex items-center justify-center p-4"
            dir={dir}
        >
            <div className="text-center max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
                {error ? (
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">حدث خطأ</h3>
                        <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>

                        {isStuck && (
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={handleLogout}
                                    className="w-full btn-secondary justify-center"
                                >
                                    تسجيل الخروج والمحاولة مرة أخرى
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 font-medium">جاري تسجيل الدخول...</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
