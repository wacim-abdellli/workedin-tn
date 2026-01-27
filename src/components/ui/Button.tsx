import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            children,
            className = '',
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles = `
      inline-flex items-center justify-center gap-2 font-medium rounded-xl
      transition-all duration-200 focus:outline-none focus-visible:ring-2
      focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
      disabled:transform-none
    `;

        const variants = {
            primary: `
        bg-primary-600 text-white hover:bg-primary-700
        focus-visible:ring-primary-600
        shadow-lg shadow-primary-600/25
        hover:shadow-xl hover:shadow-primary-600/30
        hover:-translate-y-0.5 active:translate-y-0
      `,
            secondary: `
        bg-secondary-600 text-white hover:bg-secondary-700
        focus-visible:ring-secondary-600
        shadow-lg shadow-secondary-600/25
        hover:shadow-xl hover:shadow-secondary-600/30
        hover:-translate-y-0.5 active:translate-y-0
      `,
            outline: `
        border-2 border-primary-600 text-primary-600
        hover:bg-primary-600 hover:text-white
        focus-visible:ring-primary-600
      `,
            ghost: `
        text-gray-600 hover:bg-gray-100
        focus-visible:ring-gray-400
      `,
            danger: `
        bg-red-600 text-white hover:bg-red-700
        focus-visible:ring-red-600
        shadow-lg shadow-red-600/25
        hover:shadow-xl hover:shadow-red-600/30
        hover:-translate-y-0.5 active:translate-y-0
      `,
        };

        const sizes = {
            sm: 'px-4 py-2 text-sm rounded-lg',
            md: 'px-6 py-3 text-base',
            lg: 'px-8 py-4 text-lg rounded-2xl',
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                        {children}
                        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
