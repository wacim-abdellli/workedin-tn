import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';
import { useTranslation } from '@/i18n';
import Button from '@/components/ui/Button';

interface Props {
    children: ReactNode;
    titleAr?: string;
    titleFr?: string;
    titleEn?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundaryInner extends Component<Props & { language: string }, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('ErrorBoundary caught an error:', error, errorInfo);
        
        // Send error to Sentry in production
        if (import.meta.env.PROD) {
            Sentry.captureException(error, {
                contexts: {
                    react: {
                        componentStack: errorInfo.componentStack,
                    },
                },
            });
        }
    }

    public render() {
        if (this.state.hasError) {
            const isAr = this.props.language === 'ar';
            const isFr = this.props.language === 'fr';

            const title = isAr 
                ? (this.props.titleAr || 'عذراً، حدث خطأ غير متوقع')
                : isFr 
                ? (this.props.titleFr || 'Oups, une erreur inattendue s\'est produite')
                : (this.props.titleEn || 'Oops, an unexpected error occurred');
                
            const description = isAr 
                ? 'لقد واجهنا مشكلة في تحميل هذا المكون. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.' 
                : isFr 
                ? 'Nous avons rencontré un problème lors du chargement de ce composant. Veuillez rafraîchir la page et réessayer.' 
                : 'We encountered an issue loading this component. Please refresh the page and try again.';
                
            const reloadBtn = isAr ? 'إعادة تحميل' : isFr ? 'Recharger' : 'Reload';

            return (
                <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/30 text-center shadow-lg my-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6 mx-auto">{description}</p>
                    <Button variant="primary" onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {reloadBtn}
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function ErrorBoundary(props: Props) {
    const { language } = useTranslation();
    return <ErrorBoundaryInner {...props} language={language} />;
}
