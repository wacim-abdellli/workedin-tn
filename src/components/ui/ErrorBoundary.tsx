import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { logger } from '@/lib/logger';

import Button from './Button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f5ff] p-4 dark:bg-[#09070f]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_24%)]" />
                    <div className="relative w-full max-w-xl rounded-[32px] border border-white/60 bg-white/85 p-8 text-center shadow-2xl shadow-primary-500/10 backdrop-blur-xl dark:border-white/8 dark:bg-white/5 dark:shadow-none">
                        <img
                            src="/logos/logo-social.svg"
                            alt="Khedma TN"
                            width="88"
                            height="88"
                            className="mx-auto mb-6 h-[88px] w-[88px] rounded-[22px] shadow-xl shadow-primary-500/15"
                        />
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
                            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-300" />
                        </div>
                        <h1 className="mb-3 text-3xl font-bold tracking-[-0.02em] text-[#171420] dark:text-white">
                            Something went wrong
                        </h1>
                        <p className="mx-auto mb-6 max-w-md text-base leading-7 text-[#625c78] dark:text-[#a7a2ba]">
                            An unexpected error interrupted this page. Refresh and try again, or head back to the homepage.
                        </p>
                        <div className="flex flex-col justify-center gap-3 sm:flex-row">
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                                leftIcon={<RefreshCw className="h-4 w-4" />}
                            >
                                Refresh page
                            </Button>
                            <Button variant="primary" onClick={() => { window.location.href = '/'; }}>
                                Back to home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
