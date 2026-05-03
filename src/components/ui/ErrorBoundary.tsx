import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { logger } from '@/lib/logger';
import { useTranslation } from '@/i18n';

import { Logo } from './Logo';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

let Sentry: any = null;
if (import.meta.env.PROD) {
    import('@sentry/react').then(mod => Sentry = mod);
}

class ErrorBoundaryInner extends Component<Props & { tx: (key: string, params?: Record<string, string | number>, fallback?: string) => string }, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        Sentry?.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                },
            },
        });

        logger.error('ErrorBoundary caught error:', error, errorInfo);
    }

    private getLogoMode(): 'freelancer' | 'client' {
        // Detect workspace from URL path
        const pathname = window.location.pathname;
        
        if (pathname.startsWith('/admin')) {
            return 'freelancer'; // Admin uses freelancer colors (purple)
        }
        
        if (pathname.startsWith('/client') || pathname.startsWith('/jobs/new') || pathname.startsWith('/find-freelancers')) {
            return 'client';
        }
        
        if (pathname.startsWith('/freelancer') || pathname.startsWith('/jobs')) {
            return 'freelancer';
        }
        
        // Fallback: check localStorage for active_mode
        try {
            const storedProfile = localStorage.getItem('profile');
            if (storedProfile) {
                const profile = JSON.parse(storedProfile);
                if (profile?.active_mode === 'client') {
                    return 'client';
                }
            }
        } catch (e) {
            // Ignore localStorage errors
        }
        
        // Default to freelancer
        return 'freelancer';
    }

    private getWorkspaceClass(): string {
        const mode = this.getLogoMode();
        if (mode === 'client') return 'workspace-client';
        return ''; // Default is freelancer (no class needed)
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const logoMode = this.getLogoMode();
            const workspaceClass = this.getWorkspaceClass();

            return (
                <div className={`relative flex min-h-screen items-center justify-center overflow-hidden page-bg-base px-4 ${workspaceClass}`}>
                    <div 
                        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
                        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--workspace-primary) 15%, transparent), transparent 68%)' }}
                    />
                    <div 
                        className="relative z-10 w-full max-w-xl rounded-[32px] border surface-card p-8 text-center backdrop-blur-xl animate-[fade-in_0.5s_ease-out]"
                        style={{ 
                            borderColor: 'var(--color-border-default)',
                            boxShadow: 'var(--shadow-2xl)'
                        }}
                    >
                        <div className="flex justify-center mb-6">
                            <div 
                                className="inline-flex items-center justify-center rounded-2xl border px-4 py-3"
                                style={{ 
                                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 25%, transparent)',
                                    background: 'var(--workspace-primary-dim)',
                                    boxShadow: '0 14px 45px -30px var(--workspace-shadow)'
                                }}
                            >
                                <Logo variant="full" size="sm" mode={logoMode} className="scale-[1.02]" />
                            </div>
                        </div>
                        <div 
                            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border"
                            style={{ 
                                borderColor: 'color-mix(in srgb, var(--color-status-error) 25%, transparent)',
                                background: 'var(--color-status-error-bg)'
                            }}
                        >
                            <AlertTriangle 
                                className="h-8 w-8"
                                style={{ color: 'var(--color-status-error)' }}
                            />
                        </div>
                        <h1 
                            className="mb-3 text-3xl font-bold tracking-[-0.02em] sm:text-[2rem]"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {this.props.tx('pages.errorBoundary.title', undefined, 'Something went wrong')}
                        </h1>
                        <p 
                            className="mx-auto mb-6 max-w-md text-base leading-7"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            {this.props.tx('pages.errorBoundary.description', undefined, 'An unexpected error interrupted this page. Refresh and try again, or head back to the homepage.')}
                        </p>
                        <div className="flex flex-col justify-center gap-3 sm:flex-row">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    borderColor: 'var(--workspace-primary)',
                                    color: 'var(--workspace-primary)',
                                    background: 'transparent'
                                }}
                            >
                                <RefreshCw className="h-4 w-4" />
                                {this.props.tx('pages.errorBoundary.refresh', undefined, 'Refresh page')}
                            </button>
                            <button
                                onClick={() => { window.location.href = '/'; }}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    background: 'var(--workspace-primary)',
                                    color: 'var(--workspace-primary-text)',
                                    border: 'none'
                                }}
                            >
                                {this.props.tx('pages.errorBoundary.backHome', undefined, 'Back to home')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

function ErrorBoundary(props: Props) {
    const { tx } = useTranslation();
    return <ErrorBoundaryInner {...props} tx={tx} />;
}

export default ErrorBoundary;
