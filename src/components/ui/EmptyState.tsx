import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
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
    const isError = variant === 'error';
    const primaryColor = isError ? 'var(--color-status-error)' : 'var(--color-brand-primary)';
    const bgColor = isError ? 'var(--red-50)' : 'var(--color-brand-primary-light)';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
            }}
            className={`flex flex-col items-center justify-center text-center p-8 rounded-lg border ${className}`}
            style={{
                background: `linear-gradient(180deg, ${bgColor}, transparent 55%)`,
                borderColor: 'var(--color-border-subtle)',
                borderRadius: 'var(--radius-lg)',
            }}
        >
            {illustration ? (
                <div className="mb-8">{illustration}</div>
            ) : (
                <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                    className="relative mb-8"
                >
                    <div
                        className="absolute inset-0 rounded-full blur-xl scale-150 opacity-20"
                        style={{ backgroundColor: primaryColor }}
                    />
                    <div
                        className="relative w-20 h-20 rounded-full flex items-center justify-center border"
                        style={{
                            borderColor: 'var(--color-border-subtle)',
                            backgroundColor: 'var(--color-background-elevated)',
                            boxShadow: 'var(--shadow-elevation-2)',
                        }}
                    >
                        <Icon className="w-10 h-10" style={{ color: primaryColor }} />
                    </div>
                </motion.div>
            )}

            <h3
                className="text-2xl font-semibold tracking-tight mb-3"
                style={{
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-fontFamily-heading)',
                    fontWeight: 'var(--font-fontWeight-semibold)',
                }}
            >
                {title}
            </h3>

            <p
                className="max-w-md mb-8 leading-relaxed"
                style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: 'var(--font-fontSize-base)',
                    lineHeight: 'var(--font-lineHeight-relaxed)',
                }}
            >
                {description}
            </p>

            {(action || secondaryAction) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {action && (
                        <Button
                            onClick={action.onClick}
                            variant={action.variant || (isError ? 'danger' : 'primary')}
                            style={{
                                boxShadow: 'var(--shadow-elevation-1)',
                            }}
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
        </motion.div>
    );
};

export default EmptyState;
