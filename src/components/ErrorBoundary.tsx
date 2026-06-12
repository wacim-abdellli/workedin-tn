import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useTranslation } from '@/i18n';
import { Logo } from './ui/Logo';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundaryInner extends Component<Props & {
    tx: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
    dir?: string;
}, State> {
    constructor(props: Props & { tx: any; dir?: string }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        logger.error('ErrorBoundary caught error:', error);
        logger.error('Error info:', errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const { tx, dir } = this.props;

            return (
                <div dir={dir} className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0B] px-4 py-10">
                    {/* Brand Header Floating Above */}
                    <div className="mb-10 flex flex-col items-center gap-5">
                        <Logo variant="full" size="md" />
                    </div>

                    <div className="relative flex w-full max-w-[460px] flex-col items-center overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#161719] p-10 text-center shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
                        {/* Top Accent Line */}
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#A32D2D]/60 to-transparent" />
                        
                        {/* Background ambient glow */}
                        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-red-500/5 blur-[80px]" />

                        {/* Error Icon */}
                        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-[18px] border border-[#A32D2D]/30 bg-[#501313]/60 shadow-inner ring-4 ring-[#A32D2D]/10">
                            <AlertTriangle className="h-8 w-8 text-[#A32D2D]" />
                        </div>

                        {/* Content */}
                        <h1 className="mb-3 text-[26px] font-black tracking-tight text-white">
                            {tx('pages.errorBoundary.title', undefined, 'Something went wrong')}
                        </h1>
                        <p className="mb-6 max-w-[340px] text-[15px] leading-relaxed text-zinc-400">
                            {tx('pages.errorBoundary.description', undefined, 'An unexpected error interrupted this page. Refresh and try again, or head back to the homepage.')}
                        </p>

                        {/* Error details inside premium design */}
                        {this.state.error && (
                            <div className="mb-8 w-full rounded-2xl border border-white/[0.06] bg-[#0E0E10] p-4 text-start text-xs font-mono text-zinc-400 max-h-32 overflow-auto shadow-inner">
                                <div className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-1">
                                    {tx('pages.errorBoundary.details', undefined, 'Error Details')}
                                </div>
                                <div className="break-all whitespace-pre-wrap leading-relaxed select-all">
                                    {this.state.error.message}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
                            <button
                                onClick={this.handleRetry}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-white/5 px-6 py-3.5 text-[14px] font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10 active:scale-[0.98] sm:w-auto"
                            >
                                <RefreshCw className="h-4 w-4" />
                                {tx('pages.errorBoundary.refresh', undefined, 'Refresh page')}
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-white px-6 py-3.5 text-[14px] font-bold text-[#0A0A0B] transition-all hover:bg-gray-200 active:scale-[0.98] sm:w-auto"
                            >
                                <Home className="h-4 w-4" />
                                {tx('pages.errorBoundary.backHome', undefined, 'Back to home')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export function ErrorBoundary(props: Props) {
    const { tx, dir } = useTranslation();
    return <ErrorBoundaryInner {...props} tx={tx} dir={dir} />;
}

export default ErrorBoundary;
