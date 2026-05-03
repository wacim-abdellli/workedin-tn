import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface BaseInputProps {
    label?: string;
    error?: string;
    hint?: string;
    success?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseInputProps {
    as?: 'input';
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseInputProps {
    as: 'textarea';
}

type CombinedInputProps = InputProps | TextareaProps;

/**
 * Form Input component with design system tokens.
 * Supports text, textarea, and various states (default, hover, focus, disabled, error, success).
 * 
 * @component
 * @example
 * <Input label="Email" type="email" placeholder="Enter your email" />
 * <Input as="textarea" label="Description" rows={4} />
 * <Input label="Username" error="Username is required" />
 */
const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, CombinedInputProps>(
    ({ label, error, hint, success, leftIcon, rightIcon, className = '', as = 'input', ...props }, ref) => {
        // Base input styles using design tokens
        const inputStyles = `
            w-full
            rounded-xl
            border
            bg-[var(--color-background-base)]
            text-[var(--color-text-primary)]
            text-sm
            transition-all duration-150
            placeholder:text-[var(--color-text-tertiary)]
            focus:outline-none
            focus:ring-1 focus:ring-[var(--workspace-primary)]/40
            ${error
                ? 'border-[var(--color-status-error)] focus:border-[var(--color-status-error)] focus:ring-[var(--color-status-error)]/20'
                : success
                    ? 'border-[var(--color-status-success)] focus:border-[var(--color-status-success)] focus:ring-[var(--color-status-success)]/20'
                    : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] focus:border-[var(--workspace-primary)]'
            }
            ${leftIcon ? 'ps-11' : 'px-4'}
            ${rightIcon ? 'pe-11' : 'px-4'}
            py-2.5
            disabled:cursor-not-allowed 
            disabled:opacity-50 
            disabled:bg-[var(--color-background-muted)]
            disabled:border-[var(--color-border-subtle)]
        `;

        const inputId = (props as any).id || (props as any).name;
        const errorId = error ? `${inputId}-error` : undefined;
        const successId = success ? `${inputId}-success` : undefined;
        const hintId = hint ? `${inputId}-hint` : undefined;
        const descriptionIds = [errorId, successId, hintId].filter(Boolean).join(' ');

        const InputElement = as === 'textarea' ? 'textarea' : 'input';

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)] transition-colors"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className={`pointer-events-none absolute start-0 flex ps-4 text-[var(--color-text-disabled)] transition-colors ${
                            as === 'textarea' ? 'items-start pt-3 top-0' : 'items-center inset-y-0'
                        }`}>
                            {leftIcon}
                        </div>
                    )}
                    <InputElement
                        ref={ref as any}
                        id={inputId}
                        aria-invalid={!!error}
                        aria-describedby={descriptionIds || undefined}
                        className={`${inputStyles} ${className}`}
                        {...(props as any)}
                    />
                    {rightIcon && (
                        <div className="absolute inset-y-0 end-0 flex items-center pe-4 text-[var(--color-text-disabled)]">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p
                        id={errorId}
                        role="alert"
                        className="mt-1.5 text-sm text-[var(--color-status-error)] font-medium animate-slide-up"
                    >
                        {error}
                    </p>
                )}
                {success && !error && (
                    <p
                        id={successId}
                        className="mt-1.5 text-sm text-[var(--color-status-success)] font-medium"
                    >
                        {success}
                    </p>
                )}
                {hint && !error && !success && (
                    <p
                        id={hintId}
                        className="mt-1.5 text-sm text-[var(--color-text-tertiary)]"
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
