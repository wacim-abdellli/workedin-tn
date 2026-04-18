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
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#0c0c0c',
                fontFamily: "'Outfit', sans-serif",
                padding: '20px',
            }}
            dir={dir}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
            
            <div style={{
                width: '100%',
                maxWidth: 440,
                background: '#111',
                border: '1px solid #222',
                borderRadius: 20,
                padding: '48px 40px',
                textAlign: 'center',
            }}>
                <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
                    <Logo variant="full" size="md" mode="client" />
                </div>

                {status === 'loading' ? (
                    <>
                        <div style={{ 
                            width: 56, 
                            height: 56, 
                            margin: '0 auto 24px',
                            background: 'rgba(232, 130, 12, 0.1)',
                            borderRadius: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Loader2 style={{ 
                                width: 28, 
                                height: 28, 
                                color: '#E8820C',
                                animation: 'spin 1s linear infinite',
                            }} />
                        </div>
                        <h1 style={{ 
                            fontSize: 24, 
                            fontWeight: 800, 
                            color: '#fff', 
                            marginBottom: 12,
                            letterSpacing: '-0.5px',
                        }}>
                            {tx('pages.authCallback.signingIn', undefined, 'Signing you in')}
                        </h1>
                        <p style={{ 
                            fontSize: 14, 
                            color: '#888', 
                            lineHeight: 1.6,
                            maxWidth: 320,
                            margin: '0 auto',
                        }}>
                            {tx('pages.authCallback.signingInDescription', undefined, 'We are finishing your secure login. This should only take a moment.')}
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{
                            width: 56,
                            height: 56,
                            margin: '0 auto 24px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <RefreshCw style={{ width: 28, height: 28, color: '#ef4444' }} />
                        </div>
                        <h1 style={{
                            fontSize: 24,
                            fontWeight: 800,
                            color: '#fff',
                            marginBottom: 12,
                            letterSpacing: '-0.5px',
                        }}>
                            {tx('pages.authCallback.loginIncomplete', undefined, 'Login did not complete')}
                        </h1>
                        <p style={{
                            fontSize: 14,
                            color: '#888',
                            lineHeight: 1.6,
                            marginBottom: 24,
                        }}>
                            {tx('pages.authCallback.loginIncompleteDescription', undefined, 'We could not confirm your session yet. Try again, or return to login and retry the provider sign-in.')}
                        </p>
                        {errorDetails ? (
                            <div style={{
                                marginBottom: 24,
                                padding: '14px 16px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: 12,
                                textAlign: 'left',
                                fontSize: 13,
                                color: '#fca5a5',
                            }}>
                                {errorDetails.code ? (
                                    <p style={{ fontWeight: 700, marginBottom: 4 }}>
                                        {tx('pages.authCallback.errorCode', { code: errorDetails.code }, `Error code: ${errorDetails.code}`)}
                                    </p>
                                ) : null}
                                {errorDetails.message ? (
                                    <p>{errorDetails.message}</p>
                                ) : null}
                            </div>
                        ) : null}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
