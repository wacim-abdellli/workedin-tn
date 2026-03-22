import { logger } from '@/lib/logger';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase, withTimeout } from '../lib/supabase';
import { useTranslation } from '../i18n';

const AuthCallback = () => {
    const { dir } = useTranslation();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isStuck, setIsStuck] = useState(false);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');

                if (code) {
                    // CRITICAL: Sign out any existing session first to prevent
                    // stale tokens from blocking the new code exchange (account switching fix)
                    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
                    
                    // Now exchange the fresh code for a new session
                    const { error: exchangeError } = await withTimeout(
                        supabase.auth.exchangeCodeForSession(code),
                        8000,
                        'exchangeCode'
                    );
                    if (exchangeError) throw exchangeError;
                }

                const { data: { session }, error: sessionError } = await withTimeout(
                    supabase.auth.getSession(), 5000, 'getSession'
                );

                if (sessionError) throw sessionError;

                if (session) {
                    // Check if user has completed onboarding
                    const { data: profile, error: profileError } = await withTimeout(
                        supabase
                            .from('profiles')
                            .select('user_type, onboarding_completed')
                            .eq('id', session.user.id)
                            .single(),
                        5000,
                        'fetchProfile'
                    );

                    if (profileError) {
                        if (profileError.code !== 'PGRST116') {
                            logger.error('Profile fetch error:', profileError);
                            if (profileError.message?.includes('schema cache')) {
                                throw new Error('Database schema synchronization required. Please contact admin.');
                            }
                            throw profileError;
                        }
                    }

                    if (!profile) {
                        navigate('/signup?step=select-type');
                    } else if (profile.user_type === 'admin') {
                        navigate('/admin');
                    } else if (!profile.user_type) {
                        navigate('/signup?step=select-type');
                    } else if (!profile.onboarding_completed) {
                        if (profile.user_type === 'freelancer' || profile.user_type === 'both') {
                            navigate('/onboarding/freelancer');
                        } else {
                            navigate('/onboarding/client');
                        }
                    } else {
                        if (profile.user_type === 'freelancer' || profile.user_type === 'both') {
                            navigate('/freelancer/dashboard');
                        } else {
                            navigate('/client/dashboard');
                        }
                    }
                } else {
                    setError('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
                    setTimeout(() => navigate('/login'), 3000);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول';
                logger.error('Auth callback error:', err);
                setError(errorMessage);
                setIsStuck(true);
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
