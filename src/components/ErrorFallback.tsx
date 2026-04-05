import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './ui/Button';
import { useTranslation } from '../i18n';

export function ErrorFallback({ error, resetErrorBoundary }: { error: unknown, resetErrorBoundary: () => void }) {
    const { tx } = useTranslation();
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while rendering this section.';
    return (
        <div className="p-6 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">{tx('errors.generic.title', undefined, 'Something went wrong')}</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4 max-w-md">
                {errorMessage}
            </p>
            <Button
                variant="outline"
                onClick={resetErrorBoundary}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="text-red-600 border-red-200 hover:bg-red-100 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/30"
            >
                {tx('errors.generic.retry', undefined, 'Try again')}
            </Button>
        </div>
    );
}

export function JobCardErrorFallback({ resetErrorBoundary }: { error?: unknown, resetErrorBoundary: () => void }) {
    const { tx } = useTranslation();
    return (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-400">{tx('errors.jobCard.loadFailed', undefined, 'Failed to load job card')}</p>
            </div>
            <button onClick={resetErrorBoundary} className="p-2 text-red-600 hover:bg-red-100 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30">
                <RefreshCw className="w-4 h-4" />
            </button>
        </div>
    );
}
