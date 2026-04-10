import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { Loader2, ShieldCheck, Lock, Globe2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '../components/ui/Toast';
import { useAuthRateLimit } from '../hooks/useAuthRateLimit';
import { Logo } from '../components/ui/Logo';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, isLoading: authLoading, isFullyReady, signInWithEmail } = useAuth();
    const { t, tx } = useTranslation();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { recordAttempt, isLockedOut } = useAuthRateLimit('login');
    
    const isOAuthResume = searchParams.get('oauth') === 'resume';
    const redirectTarget = typeof location.state === 'object' && location.state && 'from' in location.state
        ? (location.state.from as { pathname?: string; search?: string; hash?: string } | undefined)
        : undefined;
    const rawPostLoginPath = redirectTarget?.pathname
        ? `${redirectTarget.pathname}${redirectTarget.search ?? ''}${redirectTarget.hash ?? ''}`
        : null;

    const isAuthOrOnboardingPath = rawPostLoginPath && (
        rawPostLoginPath.startsWith('/login') ||
        rawPostLoginPath.startsWith('/signup') ||
        rawPostLoginPath.startsWith('/onboarding')
    );
    const postLoginPath = isAuthOrOnboardingPath ? null : rawPostLoginPath;

    useEffect(() => {
        if (!isFullyReady || !isAuthenticated) return;
        navigate(postLoginPath || '/', { replace: true });
    }, [isAuthenticated, isFullyReady, navigate, postLoginPath]);

    const emailSchema = z.object({
        email: z.string().email(t.auth.invalidEmail),
        password: z.string().min(6, t.auth.passwordMinLength),
    });
    type EmailFormData = z.infer<typeof emailSchema>;

    const { register, handleSubmit, formState: { errors } } = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
        mode: 'onChange',
    });

    const onSubmit = async (data: EmailFormData) => {
        if (isLockedOut) {
            setError(tx('authPages.login.rateLimitError', undefined, 'Too many attempts. Please try again later.'));
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await recordAttempt(() => signInWithEmail(data.email, data.password));
        } catch (err) {
            const message = (err as Error).message;
            if (message.includes('Too many') || message.includes('Rate limit')) {
                setError(message); showToast(message, 'error');
            } else if (message.includes('Invalid login credentials')) {
                setError(t.auth.invalidCredentials); showToast(t.auth.invalidCredentials, 'error');
            } else if (message.includes('Email not confirmed')) {
                setError(t.auth.emailNotConfirmed); showToast(t.auth.emailNotConfirmed, 'warning');
            } else {
                setError(message || t.common.error); showToast(message || t.common.error, 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogle = async () => {
        setIsLoading(true);
        try {
            const { error } = await (await import('../lib/supabase')).supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: { access_type: 'offline', prompt: 'select_account' },
                },
            });
            if (error) throw error;
        } catch {
            setIsLoading(false);
            showToast(t.auth.googleLoginError, 'error');
        }
    };

    if (isOAuthResume && authLoading) {
        return (
            <>
                <SEO {...SEO_CONFIG.login} url="/login" noIndex />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0c0c0c', fontFamily: "'Outfit', sans-serif" }}>
                    <div style={{ textAlign: 'center' }}>
                        <Loader2 style={{ width: 48, height: 48, color: '#E8820C', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                            {tx('authPages.login.finishingSignIn', undefined, 'Securing session...')}
                        </h1>
                        <p style={{ fontSize: 14, color: '#888' }}>
                            {tx('authPages.login.finishingSignInDescription', undefined, 'Hang tight while we prepare your workspace.')}
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEO {...SEO_CONFIG.login} url="/login" noIndex />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                    .login-container { grid-template-columns: 1fr !important; }
                    .login-left-panel { display: none !important; }
                    .login-right-panel { border-left: none !important; }
                    .mobile-logo { display: flex !important; }
                }
                .mobile-logo { display: none; }
            `}</style>
            <div className="login-container" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                minHeight: '100vh',
                background: '#0c0c0c',
                fontFamily: "'Outfit', sans-serif",
            }}>
                {/* LEFT PANEL */}
                <div className="login-left-panel" style={{
                    padding: '52px 48px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: '#0c0c0c',
                    position: 'relative',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none',
                        background: 'radial-gradient(circle at 20% 80%, rgba(232,130,12,0.08) 0%, transparent 60%)',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <Logo variant="full" size="sm" mode="client" />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 0', position: 'relative', zIndex: 1 }}>
                        <p style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
                            textTransform: 'uppercase', color: '#E8820C', marginBottom: 20,
                        }}>
                            # Tunisia's Freelance Platform
                        </p>

                        <h1 style={{
                            fontSize: 'clamp(36px, 4vw, 52px)',
                            fontWeight: 800, lineHeight: 1.05,
                            letterSpacing: '-1.5px', color: '#fff', marginBottom: 20,
                        }}>
                            Work smarter.<br />
                            <span style={{ color: '#E8820C' }}>Earn fairly.</span>
                        </h1>

                        <p style={{ fontSize: 15, color: '#888', lineHeight: 1.6, maxWidth: 340, marginBottom: 40 }}>
                            Connect with verified talent, manage projects securely,
                            and get paid in TND — every time.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            {[
                                { 
                                    title: 'Verified profiles', 
                                    sub: 'Every identity confirmed',
                                    icon: ShieldCheck,
                                    color: '#10b981',
                                    bgColor: 'rgba(16, 185, 129, 0.1)'
                                },
                                { 
                                    title: 'Escrow payments', 
                                    sub: 'Funds held until delivery',
                                    icon: Lock,
                                    color: '#E8820C',
                                    bgColor: 'rgba(232, 130, 12, 0.1)'
                                },
                                { 
                                    title: 'Local & global', 
                                    sub: 'Optimised for Tunisia',
                                    icon: Globe2,
                                    color: '#3b82f6',
                                    bgColor: 'rgba(59, 130, 246, 0.1)'
                                },
                            ].map((f) => {
                                const IconComponent = f.icon;
                                return (
                                    <div key={f.title} style={{
                                        background: '#161616', border: '1px solid #222',
                                        borderRadius: 12, padding: '18px 16px',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = f.color;
                                        e.currentTarget.style.background = '#181818';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = '#222';
                                        e.currentTarget.style.background = '#161616';
                                    }}
                                    >
                                        <div style={{
                                            width: 36, height: 36, background: f.bgColor,
                                            borderRadius: 8, marginBottom: 14,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <IconComponent style={{ width: 18, height: 18, color: f.color, strokeWidth: 2.5 }} />
                                        </div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 5, lineHeight: 1.3 }}>{f.title}</p>
                                        <p style={{ fontSize: 11, color: '#777', lineHeight: 1.5 }}>{f.sub}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="login-right-panel" style={{
                    background: '#111',
                    padding: '52px 48px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    borderLeft: '1px solid #1a1a1a',
                }}>
                    <div className="mobile-logo" style={{ marginBottom: 32 }}>
                        <Logo variant="full" size="sm" mode="client" />
                    </div>

                    <div style={{ marginBottom: 36 }}>
                        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>
                            Welcome back.
                        </h2>
                        <p style={{ fontSize: 14, color: '#666' }}>Sign in to your WorkedIn workspace.</p>
                    </div>

                    <button
                        onClick={handleGoogle}
                        disabled={isLoading}
                        style={{
                            width: '100%', padding: '13px', background: '#1a1a1a',
                            border: '1px solid #2a2a2a', borderRadius: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 10, cursor: isLoading ? 'not-allowed' : 'pointer', marginBottom: 24,
                            fontFamily: "'Outfit', sans-serif", opacity: isLoading ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { if (!isLoading) (e.target as HTMLElement).style.background = '#222'; }}
                        onMouseLeave={e => { if (!isLoading) (e.target as HTMLElement).style.background = '#1a1a1a'; }}
                    >
                        <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Continue with Google</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
                        <span style={{ fontSize: 12, color: '#444', fontWeight: 600 }}>or sign in with email</span>
                        <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{
                                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                                textTransform: 'uppercase', color: '#555', marginBottom: 8, display: 'block',
                            }}>Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                {...register('email')}
                                style={{
                                    width: '100%', padding: '13px 16px',
                                    background: '#161616', border: '1px solid #222',
                                    borderRadius: 10, fontSize: 14, color: '#fff',
                                    fontFamily: "'Outfit', sans-serif", outline: 'none',
                                }}
                                onFocus={e => { e.target.style.borderColor = '#E8820C'; e.target.style.background = '#181818'; }}
                                onBlur={e => { e.target.style.borderColor = '#222'; e.target.style.background = '#161616'; }}
                            />
                            {errors.email && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{errors.email.message}</p>}
                        </div>

                        <div style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <label style={{
                                    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                                    textTransform: 'uppercase', color: '#555',
                                }}>Password</label>
                                <button
                                    type="button"
                                    onClick={() => navigate('/forgot-password')}
                                    style={{ fontSize: 12, color: '#E8820C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                {...register('password')}
                                style={{
                                    width: '100%', padding: '13px 16px',
                                    background: '#161616', border: '1px solid #222',
                                    borderRadius: 10, fontSize: 14, color: '#fff',
                                    fontFamily: "'Outfit', sans-serif", outline: 'none',
                                }}
                                onFocus={e => { e.target.style.borderColor = '#E8820C'; e.target.style.background = '#181818'; }}
                                onBlur={e => { e.target.style.borderColor = '#222'; e.target.style.background = '#161616'; }}
                            />
                            {errors.password && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{errors.password.message}</p>}
                        </div>

                        {error && (
                            <p style={{ fontSize: 13, color: '#ef4444', marginTop: 12, marginBottom: 12, textAlign: 'center' }}>{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || isLockedOut}
                            style={{
                                width: '100%', padding: 14,
                                background: (isLoading || isLockedOut) ? '#9a5608' : '#E8820C',
                                border: 'none', borderRadius: 10,
                                fontSize: 15, fontWeight: 800, color: '#fff',
                                cursor: (isLoading || isLockedOut) ? 'not-allowed' : 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                                marginTop: 8, letterSpacing: '-0.3px',
                            }}
                            onMouseEnter={e => { if (!isLoading && !isLockedOut) (e.target as HTMLElement).style.background = '#d4750a'; }}
                            onMouseLeave={e => { if (!isLoading && !isLockedOut) (e.target as HTMLElement).style.background = '#E8820C'; }}
                        >
                            {isLoading ? 'Signing in…' : 'Sign in →'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#555' }}>
                        Don't have an account?{' '}
                        <button
                            onClick={() => navigate('/signup', { state: location.state })}
                            style={{ color: '#E8820C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 13 }}
                        >
                            Create one free
                        </button>
                    </p>
                </div>
            </div>
        </>
    );
}

export default Login;

