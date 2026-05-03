import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { m, useReducedMotion } from 'framer-motion';
import Button from './Button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    variant?: 'default' | 'error';
    action?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    };
    illustration?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    variant = 'default',
    action,
    secondaryAction,
    illustration,
    className = ''
}) => {
    const prefersReducedMotion = useReducedMotion();
    const isError = variant === 'error';
    const primaryColor = isError ? 'var(--color-status-error)' : 'var(--workspace-primary)';
    const bgColor = isError ? 'var(--color-status-error-bg)' : 'var(--workspace-primary-light)';

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl border ${className}`}
            style={{
                background: `linear-gradient(180deg, color-mix(in srgb, ${bgColor} 60%, transparent), transparent 55%)`,
                borderColor: 'var(--color-border-subtle)',
            }}
        >
            {illustration ? (
                <div className="mb-8">{illustration}</div>
            ) : (
                <m.div
                    animate={prefersReducedMotion ? {} : { y: [0, -6, 0] }}
                    transition={prefersReducedMotion ? {} : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative mb-8"
                >
                    <div
                        className="absolute inset-0 rounded-full blur-xl scale-150 opacity-20"
                        style={{ backgroundColor: primaryColor }}
                    />
                    <div
                        className="relative w-20 h-20 rounded-full flex items-center justify-center border"
                        style={{
                            borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, var(--color-border-subtle))',
                            backgroundColor: 'var(--color-background-elevated)',
                            boxShadow: 'var(--shadow-md)',
                        }}
                    >
                        <Icon className="w-10 h-10" style={{ color: primaryColor }} />
                    </div>
                </m.div>
            )}

            <h3
                className="text-2xl font-semibold tracking-tight mb-3"
                style={{ color: 'var(--color-text-primary)' }}
            >
                {title}
            </h3>

            <p
                className="max-w-md mb-8 leading-relaxed text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
            >
                {description}
            </p>

            {(action || secondaryAction) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {action && (
                        <Button
                            onClick={action.onClick}
                            variant={action.variant || (isError ? 'danger' : 'primary')}
                        >
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button
                            onClick={secondaryAction.onClick}
                            variant={secondaryAction.variant || 'outline'}
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </m.div>
    );
};

export default EmptyState;
