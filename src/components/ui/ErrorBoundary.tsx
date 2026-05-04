import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

import { logger } from '@/lib/logger';
import { getPersistedSupabaseUserId, loadWorkspaceForUser } from '@/lib/workspaceState';
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

    private getWorkspaceMode(): 'freelancer' | 'client' {
        const pathname = window.location.pathname;
        
        if (pathname.startsWith('/client') || pathname.startsWith('/jobs/new') || pathname.startsWith('/find-freelancers')) {
            return 'client';
        }
        
        if (pathname.startsWith('/freelancer') || pathname.startsWith('/jobs')) {
            return 'freelancer';
        }
        
        const userId = getPersistedSupabaseUserId();
        const persistedWorkspace = userId ? loadWorkspaceForUser(userId) : null;
        if (persistedWorkspace) {
            return persistedWorkspace;
        }

        try {
            const storedProfile = localStorage.getItem('profile');
            if (storedProfile) {
                const profile = JSON.parse(storedProfile);
                if (profile?.active_mode === 'client') {
                    return 'client';
                }
            }
        } catch {
            // Ignore localStorage errors
        }
        
        return 'freelancer';
    }

    private getWorkspaceClass(): string {
        return this.getWorkspaceMode() === 'client' ? 'workspace-client' : '';
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const workspaceMode = this.getWorkspaceMode();
            const workspaceClass = this.getWorkspaceClass();
            const workspaceLabel = workspaceMode === 'client' ? 'Client workspace' : 'Freelancer workspace';

            return (
                <div className={`flex min-h-screen items-center justify-center bg-[var(--color-bg-base)] px-4 py-10 ${workspaceClass}`}>
                    <div
                        className="w-full max-w-[520px] rounded-lg border bg-[var(--color-bg-elevated)] p-6 text-left shadow-[0_24px_70px_rgba(0,0,0,0.38)] sm:p-7"
                        style={{
                            borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, var(--color-border-subtle))',
                        }}
                    >
                        <div className="mb-7 flex items-center justify-between gap-4">
                            <Logo variant="full" size="sm" mode={workspaceMode} />
                            <div
                                className="rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                                style={{
                                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 28%, transparent)',
                                    color: 'var(--workspace-primary)',
                                    background: 'color-mix(in srgb, var(--workspace-primary) 8%, transparent)',
                                }}
                            >
                                {workspaceLabel}
                            </div>
                        </div>

                        <div
                            className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--color-status-error) 34%, transparent)',
                                background: 'color-mix(in srgb, var(--color-status-error) 12%, transparent)',
                            }}
                        >
                            <AlertTriangle
                                className="h-5 w-5"
                                style={{ color: 'var(--color-status-error)' }}
                            />
                        </div>

                        <h1
                            className="mb-2 text-[24px] font-semibold leading-tight"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {this.props.tx('pages.errorBoundary.title', undefined, 'Something went wrong')}
                        </h1>
                        <p
                            className="mb-6 max-w-[420px] text-[14px] leading-6"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            {this.props.tx('pages.errorBoundary.description', undefined, 'An unexpected error interrupted this page. Refresh and try again, or head back to the homepage.')}
                        </p>

                        <div
                            className="mb-6 h-px w-full"
                            style={{ background: 'var(--color-border-subtle)' }}
                        />

                        <div className="flex flex-col gap-2.5 sm:flex-row">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[var(--color-bg-muted)]"
                                style={{
                                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 44%, transparent)',
                                    color: 'var(--workspace-primary)',
                                }}
                            >
                                <RefreshCw className="h-4 w-4" />
                                {this.props.tx('pages.errorBoundary.refresh', undefined, 'Refresh page')}
                            </button>
                            <button
                                onClick={() => { window.location.href = '/'; }}
                                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors hover:opacity-90"
                                style={{
                                    background: 'var(--workspace-primary)',
                                    color: 'var(--workspace-primary-text)',
                                }}
                            >
                                <Home className="h-4 w-4" />
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
