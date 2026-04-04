import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

import { logger } from '@/lib/logger';
import Button from '@/components/ui/Button';
import { supabase, withTimeout } from '../lib/supabase';
import { useTranslation } from '../i18n';

type CallbackState = 'loading' | 'error';

const MAX_WAIT_MS = 12000;
const POLL_INTERVAL_MS = 400;
const PRE_EXCHANGE_WAIT_MS = 1800;
const EXCHANGE_TIMEOUT_MS = 5000;
const POST_AUTH_ROUTE = '/login?oauth=resume';

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const AuthCallback = () => {
    const { dir, tx } = useTranslation();
    const [status, setStatus] = useState<CallbackState>('loading');
    const [errorDetails, setErrorDetails] = useState<{ code?: string; message?: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fallbackRedirect = window.setTimeout(() => {
            if (!cancelled) {
                window.location.replace('/');
            }
        }, 5000);

        const redirectToPostAuth = () => {
            window.location.replace(POST_AUTH_ROUTE);
        };

        const waitForSession = async (deadline: number) => {
            while (!cancelled && Date.now() < deadline) {
                try {
                    const { data, error } = await withTimeout(
                        supabase.auth.getSession(),
                        2000,
                        'AuthCallback.getSession'
                    );

                    if (error) {
                        logger.error('AuthCallback: failed to read session', error);
                    }

                    if (data.session) {
                        return data.session;
                    }
                } catch (error) {
                    logger.error('AuthCallback: polling getSession failed', error);
                }

                await sleep(POLL_INTERVAL_MS);
            }

            return null;
        };

        const finishSignIn = async () => {
            const currentUrl = new URL(window.location.href);
            const authCode = currentUrl.searchParams.get('code');
            const authError = currentUrl.searchParams.get('error_description') || currentUrl.searchParams.get('error');
            const authErrorCode = currentUrl.searchParams.get('error_code') || undefined;
            const tokenHash = currentUrl.hash;

            if (authCode || authError || authErrorCode) {
                currentUrl.searchParams.delete('code');
                currentUrl.searchParams.delete('error');
                currentUrl.searchParams.delete('error_code');
                currentUrl.searchParams.delete('error_description');
                currentUrl.searchParams.delete('state');
                window.history.replaceState({}, document.title, `${currentUrl.pathname}${currentUrl.hash}`);
            }

            if (authError) {
                logger.error('AuthCallback: provider returned error', { authError, authErrorCode });
                if (!cancelled) {
                    setErrorDetails({ code: authErrorCode, message: authError });
                    setStatus('error');
                }
                return;
            }

            // Check if this is an email confirmation or recovery token
            if (tokenHash && (tokenHash.includes('type=signup') || tokenHash.includes('type=email') || tokenHash.includes('type=recovery'))) {
                logger.info('AuthCallback: detected email confirmation or recovery token');
                
                try {
                    // Let Supabase handle the token automatically
                    const { data, error } = await withTimeout(
                        supabase.auth.getSession(),
                        EXCHANGE_TIMEOUT_MS,
                        'AuthCallback.getSession'
                    );

                    if (error) {
                        logger.error('AuthCallback: failed to get session after email confirmation', error);
                    } else if (data.session) {
                        logger.info('AuthCallback: email confirmed, session established');
                        
                        // Check if this is a recovery token
                        if (tokenHash.includes('type=recovery')) {
                            window.location.replace('/reset-password');
                            return;
                        }
                        
                        // For email confirmation, redirect to onboarding
                        redirectToPostAuth();
                        return;
                    }
                } catch (error) {
                    logger.error('AuthCallback: email confirmation handling failed', error);
                }
            }

            const existingSession = await waitForSession(Date.now() + PRE_EXCHANGE_WAIT_MS);

            if (existingSession) {
                logger.info('AuthCallback: existing session detected, redirecting');
                redirectToPostAuth();
                return;
            }

            if (authCode) {
                try {
                    const { data, error } = await withTimeout(
                        supabase.auth.exchangeCodeForSession(authCode),
                        EXCHANGE_TIMEOUT_MS,
                        'AuthCallback.exchangeCodeForSession'
                    );

                    if (error) {
                        logger.error('AuthCallback: exchangeCodeForSession failed', error);
                    } else if (data.session) {
                        logger.info('AuthCallback: code exchanged successfully, redirecting');
                        redirectToPostAuth();
                        return;
                    }
                } catch (error) {
                    logger.warn('AuthCallback: explicit code exchange timed out, continuing to poll for session', error);
                }
            }

            const session = await waitForSession(Date.now() + MAX_WAIT_MS);

            if (session) {
                logger.info('AuthCallback: session detected after polling, redirecting to home');
                redirectToPostAuth();
                return;
            }

            if (!cancelled) {
                logger.warn('AuthCallback: no session detected before timeout, falling back to login route');
                redirectToPostAuth();
            }
        };

        finishSignIn();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (cancelled) return;

            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                logger.info(`AuthCallback: ${event} detected, redirecting`);
                redirectToPostAuth();
            }
        });

        return () => {
            cancelled = true;
            window.clearTimeout(fallbackRedirect);
            subscription.unsubscribe();
        };
    }, []);

    return (
        <div
            className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f7f5ff] via-white to-primary-50 p-4 dark:from-[#09070f] dark:via-[#0f0d16] dark:to-primary-950"
            dir={dir}
        >
            <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white dark:bg-gray-900 p-8 text-center shadow-2xl shadow-primary-500/10 backdrop-blur-xl dark:border-gray-800 dark:shadow-none">
                <img
                    src="/logos/logo-social.svg"
                    alt="Khedma TN"
                    width="88"
                    height="88"
                    className="mx-auto mb-6 h-[88px] w-[88px] rounded-[24px] shadow-xl shadow-primary-500/15"
                />

                {status === 'loading' ? (
                    <>
                        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
                        <h1 className="mb-3 text-2xl font-bold text-[#171420] dark:text-white">{tx('pages.authCallback.signingIn', undefined, 'Signing you in')}</h1>
                        <p className="text-[#625c78] dark:text-[#a7a2ba]">
                            {tx('pages.authCallback.signingInDescription', undefined, 'We are finishing your secure login. This should only take a moment.')}
                        </p>
                    </>
                ) : (
                    <>
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                            <RefreshCw className="h-7 w-7" />
                        </div>
                        <h1 className="mb-3 text-2xl font-bold text-[#171420] dark:text-white">{tx('pages.authCallback.loginIncomplete', undefined, 'Login did not complete')}</h1>
                        <p className="mb-6 text-[#625c78] dark:text-[#a7a2ba]">
                            {tx('pages.authCallback.loginIncompleteDescription', undefined, 'We could not confirm your session yet. Try again, or return to login and retry the provider sign-in.')}
                        </p>
                        {errorDetails ? (
                            <div className="mb-6 rounded-2xl border border-amber-200/70 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                                {errorDetails.code ? (
                                    <p className="font-semibold">{tx('pages.authCallback.errorCode', { code: errorDetails.code }, `Error code: ${errorDetails.code}`)}</p>
                                ) : null}
                                {errorDetails.message ? (
                                    <p className={errorDetails.code ? 'mt-1' : ''}>{errorDetails.message}</p>
                                ) : null}
                            </div>
                        ) : null}
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Button variant="outline" onClick={() => window.location.reload()}>
                                {tx('pages.authCallback.tryAgain', undefined, 'Try again')}
                            </Button>
                            <Button variant="primary" onClick={() => { window.location.replace('/login'); }}>
                                {tx('pages.authCallback.backToLogin', undefined, 'Back to login')}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
