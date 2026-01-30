import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';

const AuthCallback = () => {
    const { dir } = useTranslation();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isStuck, setIsStuck] = useState(false);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                if (session) {
                    // Check if user has completed onboarding
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('user_type, onboarding_completed')
                        .eq('id', session.user.id)
                        .single();

                    if (profileError) {
                        // Handle critical schema/connection errors
                        if (profileError.code !== 'PGRST116') {
                            console.error('Profile fetch error:', profileError);
                            // If schema cache error, show specific message
                            if (profileError.message.includes('schema cache')) {
                                throw new Error('Database schema synchronization required. Please contact admin.');
                            }
                            throw profileError;
                        }
                        // PGRST116 = Row not found (new user) -> Continue to creation/selection
                    }

                    if (!profile) {
                        // New OAuth user -> Redirect to signup for role selection
                        navigate('/signup?step=select-type');
                    } else if (!profile.user_type) {
                        navigate('/signup?step=select-type');
                    } else if (!profile.onboarding_completed) {
                        if (profile.user_type === 'freelancer' || profile.user_type === 'both') {
                            navigate('/onboarding/freelancer');
                        } else {
                            navigate('/onboarding/client');
                        }
                    } else {
                        // Success -> Dashboard
                        if (profile.user_type === 'freelancer' || profile.user_type === 'both') {
                            navigate('/freelancer/dashboard');
                        } else {
                            navigate('/client/dashboard');
                        }
                    }
                } else {
                    // No session logic
                    setError('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
                    setTimeout(() => navigate('/login'), 3000);
                }
            } catch (err: any) {
                console.error('Auth callback error:', err);
                setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
                setIsStuck(true); // Show manual logout button
            }
        };

        handleCallback();
    }, [navigate]);

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
                                {error.includes('schema') && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        تنبيه للمسؤول: يرجى تحديث "Schema Cache" من لوحة تحكم Supabase.
                                    </p>
                                )}
                            </div>
                        )}
                        {!isStuck && <p className="text-sm text-gray-500">جاري التحويل لصفحة تسجيل الدخول...</p>}
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
