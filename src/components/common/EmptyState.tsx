import type { LucideIcon } from 'lucide-react';
import Button from '../ui/Button';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = ''
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 dark:border-dark-700 rounded-2xl bg-gray-50/50 dark:bg-dark-800/50 ${className}`}>
            {Icon && (
                <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
            )}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="outline">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
