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
            className={`flex flex-col items-center justify-center py-20 px-6 text-center ${className}`}
        >
            {illustration ? (
                <div className="mb-8">{illustration}</div>
            ) : (
                <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative mb-8"
                >
                    {/* Glow ring behind icon */}
                    <div className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-xl scale-150" />
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-950/20 border border-primary-200/50 dark:border-primary-500/20 flex items-center justify-center">
                        <Icon className="w-10 h-10 text-primary-500 dark:text-primary-400" />
                    </div>
                </motion.div>
            )}

            <h3 className="text-xl font-bold text-[#1a1825] dark:text-white mb-3">
                {title}
            </h3>

            <p className="text-[#6b6880] dark:text-[#8b8aa0] max-w-md mb-8 leading-relaxed">
                {description}
            </p>

            {(action || secondaryAction) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {action && (
                        <Button
                            onClick={action.onClick}
                            variant={action.variant || 'primary'}
                            className="shadow-lg shadow-primary-500/20"
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
