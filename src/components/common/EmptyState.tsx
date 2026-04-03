import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
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
    action,
    secondaryAction,
    illustration,
    className = ''
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`empty-state ${className}`}
            style={{
                background: 'linear-gradient(180deg, color-mix(in srgb, var(--workspace-primary) 5%, transparent), transparent 55%)',
                borderColor: 'color-mix(in srgb, var(--workspace-primary) 12%, var(--dash-border))',
            }}
        >
            {illustration ? (
                <div className="mb-8">{illustration}</div>
            ) : (
                <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative mb-8"
                >
                    <div
                        className="absolute inset-0 rounded-full blur-xl scale-150"
                        style={{ background: 'color-mix(in srgb, var(--workspace-primary) 14%, transparent)' }}
                    />
                    <div
                        className="empty-state-icon-shell"
                        style={{
                            borderColor: 'color-mix(in srgb, var(--workspace-primary) 22%, transparent)',
                            background: 'radial-gradient(circle at top, color-mix(in srgb, var(--workspace-primary) 14%, transparent), color-mix(in srgb, var(--dash-card) 78%, transparent))',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 40px -28px color-mix(in srgb, var(--workspace-primary) 45%, transparent)',
                        }}
                    >
                        <Icon className="w-10 h-10" style={{ color: 'var(--workspace-primary)' }} />
                    </div>
                </motion.div>
            )}

            <h3 className="font-display text-[1.75rem] font-semibold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
                {title}
            </h3>

            <p className="max-w-md mb-8 leading-relaxed text-[15px]" style={{ color: 'var(--text-muted)' }}>
                {description}
            </p>

            {(action || secondaryAction) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {action && (
                        <Button
                            onClick={action.onClick}
                            variant={action.variant || 'primary'}
                            className="shadow-lg"
                            style={{ boxShadow: '0 18px 38px -24px color-mix(in srgb, var(--workspace-primary) 52%, transparent)' }}
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
