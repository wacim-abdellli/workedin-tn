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
                <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050507] px-4">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--workspace-accent)_6%,transparent)] blur-[100px]" />
                    <div className="relative z-10 w-full max-w-xl rounded-[32px] border border-white/10 bg-zinc-950/80 p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.35)] backdrop-blur-xl animate-[fade-in_0.5s_ease-out]">
                        <div className="flex justify-center mb-6">
                            <div className="relative flex h-[88px] w-[88px] items-center justify-center">
                                <Logo variant="mark" size="lg" mode="black" />
                            </div>
                        </div>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
                            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-300" />
                        </div>
                        <h1 className="mb-3 text-3xl font-bold tracking-[-0.02em] text-white">
                            {this.props.tx('pages.errorBoundary.title', undefined, 'Something went wrong')}
                        </h1>
                        <p className="mx-auto mb-6 max-w-md text-base leading-7 text-zinc-300">
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
