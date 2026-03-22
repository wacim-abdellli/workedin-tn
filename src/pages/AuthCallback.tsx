import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';
import { logger } from '@/lib/logger';

/**
 * AuthCallback — handles the OAuth redirect after Google sign-in.
 *
 * Strategy (Hard Reload):
 * The Supabase JS client (`detectSessionInUrl: true`) automatically exchanges
 * the code in the URL. However, in certain environments (like React Strict Mode
 * + Vite SPA), this background exchange can deadlock the client's internal locks,
 * causing any subsequent `getSession()` calls to hang infinitely during single-page
 * navigation.
 *
 * FIX: We simply give Supabase 2.5 seconds to finish its background HTTP request
 * and save the tokens to localStorage. Then, we FORCE a hard browser refresh
 * (`window.location.replace('/')`). This destroys the deadlocked client instance
 * and builds a fresh one that reads the perfectly saved localStorage session.
 */
const AuthCallback = () => {
    const { dir } = useTranslation();

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        // 1. Listen for the native SIGNED_IN event from the background exchange.
        // If it fires, trigger the hard reload immediately.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                logger.info('AuthCallback: SIGNED_IN detected, forcing hard reload...');
                window.location.replace('/');
            }
        });

        // 2. Fallback: If the event was missed or silenced by the lock bug,
        // just hard reload after 2.5 seconds anyway. 2.5s is plenty of time
        // for the background fetch to exchange the code and save to localStorage.
        timer = setTimeout(() => {
            logger.info('AuthCallback: Timed out waiting for event, forcing hard reload as fallback...');
            window.location.replace('/');
        }, 2500);

        return () => {
            clearTimeout(timer);
            subscription.unsubscribe();
        };
    }, []);

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 flex items-center justify-center p-4"
            dir={dir}
        >
            <div className="text-center max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">جاري تسجيل الدخول...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
