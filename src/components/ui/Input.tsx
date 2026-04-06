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
            rounded-[var(--radius-md)]
            border
            bg-[var(--color-background-base)]
            text-[var(--color-text-primary)]
            text-[var(--font-fontSize-base)]
            shadow-[var(--shadow-elevation-0)]
            transition-all duration-[var(--animation-focus-duration)] ease-[var(--animation-focus-easing)]
            placeholder:text-[var(--color-text-disabled)]
            focus:outline-none 
            focus:ring-2 
            focus:ring-offset-0
            ${error
                ? 'border-[var(--red-500)] focus:border-[var(--red-500)] focus:ring-[var(--red-500)]/20'
                : success
                    ? 'border-[var(--green-500)] focus:border-[var(--green-500)] focus:ring-[var(--green-500)]/20'
                    : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]/20'
            }
            ${leftIcon ? 'ps-11' : 'px-[var(--input-padding-x)]'}
            ${rightIcon ? 'pe-11' : 'px-[var(--input-padding-x)]'}
            ${as === 'textarea' ? 'py-[var(--input-padding-y)]' : 'py-[var(--input-padding-y)]'}
            disabled:cursor-not-allowed 
            disabled:opacity-50 
            disabled:bg-[var(--color-background-muted)]
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
                        className="mb-2 block text-[var(--font-fontSize-sm)] font-[var(--font-fontWeight-medium)] text-[var(--color-text-secondary)] transition-colors"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-[var(--color-text-disabled)] transition-colors">
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
                        className="mt-1.5 text-[var(--font-fontSize-sm)] text-[var(--red-500)] font-[var(--font-fontWeight-medium)] animate-slide-up"
                    >
                        {error}
                    </p>
                )}
                {success && !error && (
                    <p
                        id={successId}
                        className="mt-1.5 text-[var(--font-fontSize-sm)] text-[var(--green-600)] font-[var(--font-fontWeight-medium)]"
                    >
                        {success}
                    </p>
                )}
                {hint && !error && !success && (
                    <p
                        id={hintId}
                        className="mt-1.5 text-[var(--font-fontSize-sm)] text-[var(--color-text-tertiary)]"
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
