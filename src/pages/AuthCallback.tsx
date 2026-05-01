import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

import { logger } from '@/lib/logger';
import Button from '@/components/ui/Button';
import { supabase, withTimeout } from '../lib/supabase';
import { useTranslation } from '../i18n';
import { Logo } from '../components/ui/Logo';

type CallbackState = 'loading' | 'error';

const MAX_WAIT_MS = 8000;
const POLL_INTERVAL_MS = 200;
const PRE_EXCHANGE_WAIT_MS = 300;
const EXCHANGE_TIMEOUT_MS = 4000;
const POST_AUTH_ROUTE = '/login?oauth=resume';

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const AuthCallback = () => {
    const { dir, tx } = useTranslation();
    const [status, setStatus] = useState<CallbackState>('loading');
    const [errorDetails, setErrorDetails] = useState<{ code?: string; message?: string } | null>(null);

    useEffect(() => {
        let cancelled = false;

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
            subscription.unsubscribe();
        };
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-base)] px-5">
            <div className="w-full max-w-[440px] bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-2xl p-12 text-center shadow-xl">
                <div className="mb-8 flex justify-center">
                    <Logo variant="full" size="md" mode="client" />
                </div>

                {status === 'loading' ? (
                    <>
                        <div className="w-14 h-14 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-[rgba(232,130,12,0.1)]">
                            <Loader2 className="w-7 h-7 text-[#E8820C] animate-spin" />
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] mb-3">
                            {tx('pages.authCallback.signingIn', undefined, 'Signing you in')}
                        </h1>
                        <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed max-w-xs mx-auto">
                            {tx('pages.authCallback.signingInDescription', undefined, 'We are finishing your secure login. This should only take a moment.')}
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-14 h-14 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-red-500/10">
                            <RefreshCw className="w-7 h-7 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] mb-3">
                            {tx('pages.authCallback.loginIncomplete', undefined, 'Login did not complete')}
                        </h1>
                        <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed mb-6">
                            {tx('pages.authCallback.loginIncompleteDescription', undefined, 'We could not confirm your session yet. Try again, or return to login and retry the provider sign-in.')}
                        </p>
                        {errorDetails && (
                            <div className="mb-6 p-3.5 rounded-xl text-left text-sm bg-red-500/10 border border-red-500/20 text-red-400">
                                {errorDetails.code && <p className="font-bold mb-1">{tx('pages.authCallback.errorCode', { code: errorDetails.code }, `Error code: ${errorDetails.code}`)}</p>}
                                {errorDetails.message && <p>{errorDetails.message}</p>}
                            </div>
                        )}
                        <div className="flex flex-col gap-2.5">
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
