import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    label: string;
    variant?: 'ghost' | 'filled' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isActive?: boolean;
    isLoading?: boolean;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({
        icon,
        label,
        className,
        variant = 'ghost',
        size = 'md',
        isActive,
        isLoading,
        disabled,
        ...props
    }, ref) => {
        const sizeClasses = {
            sm: 'w-11 h-11 min-h-[44px] min-w-[44px]',
            md: 'w-12 h-12 min-h-[48px] min-w-[48px]',
            lg: 'w-14 h-14 min-h-[56px] min-w-[56px]'
        };

        const variantClasses = {
            ghost: 'hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-dark-800 text-gray-500 dark:text-gray-400 hover:text-dark-900 dark:hover:text-white',
            filled: 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:border-gray-600 dark:hover:border-dark-600 text-gray-700 dark:text-gray-200',
            outline: 'border-2 border-transparent hover:border-gray-200 dark:border-gray-700 dark:hover:border-dark-700 text-gray-500 dark:text-gray-400',
            danger: 'hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500',
        };

        return (
            <button
                ref={ref}
                type="button"
                className={cn(
                    sizeClasses[size],
                    "flex items-center justify-center rounded-full transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                    "active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                    variantClasses[variant],
                    isActive && variant === 'ghost' && "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400",
                    isActive && variant === 'danger' && "bg-red-50 text-red-500 dark:bg-red-900/10",
                    className
                )}
                aria-label={label}
                aria-pressed={isActive}
                disabled={disabled || isLoading}
                title={label}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                    icon
                )}
            </button>
        );
    }
);

IconButton.displayName = 'IconButton';

export default IconButton;
