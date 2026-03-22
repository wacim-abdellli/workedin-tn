import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';
import { logger } from '@/lib/logger';

/**
 * AuthCallback — handles the OAuth redirect after Google sign-in.
 *
 * Strategy (React Strict Mode Safe):
 * By enabling `detectSessionInUrl: true` in the Supabase client, the OAuth code
 * exchange is handled automatically in the background. We simply poll `getSession()`
 * until the session appears. This avoids race conditions where strict mode double-invocations
 * try to exchange the identical single-use OAuth code twice.
 */
const AuthCallback = () => {
    const { dir } = useTranslation();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const handleAuth = async () => {
            try {
                // Poll for up to 15 seconds (30 * 500ms) to give detectSessionInUrl enough time
                for (let i = 0; i < 30 && mounted; i++) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session && mounted) {
                        logger.info('AuthCallback: session found after polling attempt', i + 1);
                        navigate('/', { replace: true });
                        return;
                    }
                    await new Promise(r => setTimeout(r, 500));
                }

                if (mounted) {
                    setError('انتهت مهلة تسجيل الدخول. يرجى المحاولة مرة أخرى.');
                }
            } catch (err) {
                if (mounted) {
                    logger.error('AuthCallback polling error:', err);
                    setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
                }
            }
        };

        handleAuth();

        // Also listen for auth state changes as a backup
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session && mounted) {
                logger.info('AuthCallback: session found via onAuthStateChange');
                navigate('/', { replace: true });
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
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
