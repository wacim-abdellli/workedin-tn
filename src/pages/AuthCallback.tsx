import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';
import { logger } from '@/lib/logger';

/**
 * AuthCallback — handles the OAuth redirect after Google sign-in.
 *
 * Strategy:
 * 1. Try to exchange the code from the URL manually (in case detectSessionInUrl missed it)
 * 2. Then poll getSession() until a session appears
 * 3. Redirect to "/" and let the app's routing handle it
 */
const AuthCallback = () => {
    const { dir } = useTranslation();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const handleAuth = async () => {
            try {
                // Step 1: Check if there's already a session (e.g., detectSessionInUrl worked)
                const { data: { session: existingSession } } = await supabase.auth.getSession();
                if (existingSession && !cancelled) {
                    logger.info('AuthCallback: existing session found');
                    navigate('/', { replace: true });
                    return;
                }

                // Step 2: Manually exchange the code from the URL
                const url = new URL(window.location.href);
                const code = url.searchParams.get('code');

                if (code) {
                    logger.info('AuthCallback: exchanging code manually');
                    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                    if (exchangeError) {
                        // Code might have already been used by detectSessionInUrl
                        logger.warn('AuthCallback: code exchange error (may be already used):', exchangeError.message);
                    }

                    if (data?.session && !cancelled) {
                        logger.info('AuthCallback: session created via manual exchange');
                        navigate('/', { replace: true });
                        return;
                    }
                }

                // Step 3: Poll getSession() as last resort — the session might appear
                // after detectSessionInUrl finishes in the background
                for (let i = 0; i < 15 && !cancelled; i++) {
                    await new Promise(r => setTimeout(r, 500));
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session && !cancelled) {
                        logger.info('AuthCallback: session found after polling attempt', i + 1);
                        navigate('/', { replace: true });
                        return;
                    }
                }

                // If we get here, nothing worked
                if (!cancelled) {
                    setError('انتهت مهلة تسجيل الدخول. يرجى المحاولة مرة أخرى.');
                }
            } catch (err) {
                if (!cancelled) {
                    logger.error('AuthCallback error:', err);
                    setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
                }
            }
        };

        handleAuth();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    const handleRetry = () => {
        navigate('/login');
    };

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
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                            <button
                                onClick={handleRetry}
                                className="w-full btn-primary justify-center"
                            >
                                إعادة المحاولة
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full btn-secondary justify-center"
                            >
                                تسجيل الخروج
                            </button>
                        </div>
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
