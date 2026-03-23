import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

/**
 * Form Input component with standard styling and error handling.
 * 
 * @component
 * @param {InputProps} props
 * @returns {JSX.Element}
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, leftIcon, rightIcon, className = '', ...props }, ref) => {
        const inputStyles = `
      w-full bg-white/85 dark:bg-dark-800/90 border rounded-2xl
      text-dark-900 dark:text-white placeholder-dark-400
      focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent
      transition-all duration-200 shadow-sm backdrop-blur-sm
      ${error
                ? 'border-red-500 focus:ring-red-500/30'
                : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600 focus:ring-primary-500/30 dark:focus:ring-primary-400/30 focus:border-primary-500 dark:focus:border-primary-400'
            }
      ${leftIcon ? 'ps-11 py-3' : 'px-4 py-3'}
      ${rightIcon ? 'pe-11 py-3' : 'px-4 py-3'}
      disabled:opacity-50 disabled:bg-dark-100 dark:disabled:bg-dark-900 disabled:cursor-not-allowed
    `;

        const inputId = props.id || props.name;
        const errorId = error ? `${inputId}-error` : undefined;
        const hintId = hint ? `${inputId}-hint` : undefined;
        const descriptionIds = [errorId, hintId].filter(Boolean).join(' ');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="mb-2 block text-sm font-semibold text-dark-700 dark:text-dark-200"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-dark-400 transition-colors group-focus-within:text-primary-500">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        aria-invalid={!!error}
                        aria-describedby={descriptionIds || undefined}
                        className={`${inputStyles} ${className}`}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute inset-y-0 end-0 flex items-center pe-4 text-dark-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p
                        id={errorId}
                        role="alert"
                        className="mt-1.5 text-sm text-red-500 font-medium animate-slide-up"
                    >
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p
                        id={hintId}
                        className="mt-1.5 text-sm text-dark-500"
                    >
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
