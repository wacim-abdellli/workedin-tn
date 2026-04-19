import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { logger } from '@/lib/logger';
import { useTranslation } from '@/i18n';

import Button from './Button';
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

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="relative flex min-h-screen items-center justify-center overflow-hidden page-bg-base px-4">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.15),transparent_68%)] blur-[110px]" />
                    <div className="relative z-10 w-full max-w-xl rounded-[32px] border border-[var(--color-border-default)] surface-card p-8 text-center shadow-[0_40px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl animate-[fade-in_0.5s_ease-out]">
                        <div className="flex justify-center mb-6">
                            <div className="inline-flex items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 shadow-[0_14px_45px_-30px_rgba(245,158,11,0.9)]">
                                <Logo variant="full" size="sm" mode="client" className="scale-[1.02]" />
                            </div>
                        </div>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-rose-400/25 bg-rose-500/10">
                            <AlertTriangle className="h-8 w-8 text-rose-300" />
                        </div>
                        <h1 className="mb-3 text-3xl font-bold tracking-[-0.02em] text-on-surface sm:text-[2rem]">
                            {this.props.tx('pages.errorBoundary.title', undefined, 'Something went wrong')}
                        </h1>
                        <p className="mx-auto mb-6 max-w-md text-base leading-7 text-on-surface-muted">
                            {this.props.tx('pages.errorBoundary.description', undefined, 'An unexpected error interrupted this page. Refresh and try again, or head back to the homepage.')}
                        </p>
                        <div className="flex flex-col justify-center gap-3 sm:flex-row">
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                                leftIcon={<RefreshCw className="h-4 w-4" />}
                            >
                                {this.props.tx('pages.errorBoundary.refresh', undefined, 'Refresh page')}
                            </Button>
                            <Button variant="primary" onClick={() => { window.location.href = '/'; }}>
                                {this.props.tx('pages.errorBoundary.backHome', undefined, 'Back to home')}
                            </Button>
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
