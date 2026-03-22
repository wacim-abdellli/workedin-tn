import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';

/**
 * AuthCallback — handles the OAuth redirect.
 *
 * The Supabase client (`detectSessionInUrl: true`) automatically exchanges
 * the code in the URL for a session and stores it in localStorage.
 *
 * We simply wait for the SIGNED_IN event, then redirect to "/".
 * The rest of the app (AuthContext, ProtectedRoute, etc.) will read
 * the session from localStorage and route the user to the correct page.
 *
 * We intentionally do NOT query the database here because the Supabase
 * JS client can stall on DB calls immediately after a PKCE code exchange.
 */
const AuthCallback = () => {
    const { dir } = useTranslation();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event) => {
                if (event === 'SIGNED_IN') {
                    // Session is now in localStorage.
                    // Redirect to home — the app's normal routing will take over.
                    navigate('/', { replace: true });
                }
            }
        );

        // Safety: if nothing happens in 10s, show error
        const timeoutId = setTimeout(() => {
            setError('انتهت مهلة تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        }, 10000);

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
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
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={handleLogout}
                                className="w-full btn-secondary justify-center"
                            >
                                تسجيل الخروج والمحاولة مرة أخرى
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
