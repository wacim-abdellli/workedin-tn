import { logger } from '@/lib/logger';
import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

// tx is not available in class components, so we'll use direct translation keys
const errorMessages = {
    title: 'حدث خطأ ما',
    description: 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
    goHome: 'العودة للرئيسية'
};

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * ErrorBoundary component to catch and handle React errors gracefully
 * Prevents entire app from crashing on component errors
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
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
            return this.props.fallback || (
                <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-dark-900 p-4">
                    <div className="bg-card dark:bg-dark-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-3">
                            {errorMessages.title}
                        </h2>

                        <p className="text-muted-foreground mb-6">
                            {errorMessages.description}
                        </p>

                        {this.state.error && (
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-6 text-sm text-red-600 dark:text-red-400 text-start overflow-auto max-h-24">
                                {this.state.error.message}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleRetry}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {errorMessages.retry}
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-muted dark:bg-dark-700 hover:bg-secondary dark:hover:bg-dark-600 text-muted-foreground rounded-xl font-medium transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                {errorMessages.goHome}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
