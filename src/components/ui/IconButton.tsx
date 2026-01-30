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
            sm: 'w-9 h-9',
            md: 'w-11 h-11',
            lg: 'w-14 h-14'
        };

        const variantClasses = {
            ghost: 'hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-500 dark:text-gray-400 hover:text-dark-900 dark:hover:text-white',
            filled: 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600 text-gray-700 dark:text-gray-200',
            outline: 'border-2 border-transparent hover:border-gray-200 dark:hover:border-dark-700 text-gray-500 dark:text-gray-400',
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
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    icon
                )}
            </button>
        );
    }
);

IconButton.displayName = 'IconButton';

export default IconButton;
