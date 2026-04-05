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
      w-full rounded-xl border bg-white dark:bg-zinc-900/50 text-gray-900 dark:text-white shadow-sm transition-all duration-200
      placeholder:text-gray-400 dark:placeholder:text-zinc-600
      focus:outline-none focus:ring-2 focus:ring-[color:var(--workspace-accent)]/20
      ${error
                ? 'border-red-500 focus:border-red-500'
                                : 'border-gray-200 dark:border-white/10 hover:border-[color:var(--workspace-accent)]/35 hover:bg-[color:var(--workspace-primary)]/[0.03] focus:border-[color:var(--workspace-accent)]'
            }
      ${leftIcon ? 'ps-11 py-3' : 'px-4 py-3'}
      ${rightIcon ? 'pe-11 py-3' : 'px-4 py-3'}
      disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-zinc-800
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
                        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] transition-colors"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400 transition-colors group-focus-within:text-[color:var(--workspace-primary)] dark:text-gray-500 dark:text-gray-400">
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
                        <div className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 dark:text-gray-500 dark:text-gray-400">
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
                        className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
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
