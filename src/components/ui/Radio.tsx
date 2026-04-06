import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
    hint?: string;
}

/**
 * Radio button component with design system tokens.
 * 
 * @component
 * @example
 * <Radio name="plan" value="basic" label="Basic Plan" />
 * <Radio name="plan" value="pro" label="Pro Plan" defaultChecked />
 */
const Radio = forwardRef<HTMLInputElement, RadioProps>(
    ({ label, error, hint, className = '', ...props }, ref) => {
        const radioId = props.id || `${props.name}-${props.value}`;
        const errorId = error ? `${radioId}-error` : undefined;
        const hintId = hint ? `${radioId}-hint` : undefined;
        const descriptionIds = [errorId, hintId].filter(Boolean).join(' ');

        return (
            <div className="w-full">
                <div className="flex items-start gap-3">
                    <div className="relative flex items-center">
                        <input
                            ref={ref}
                            type="radio"
                            id={radioId}
                            aria-invalid={!!error}
                            aria-describedby={descriptionIds || undefined}
                            className={`
                                peer
                                w-5 h-5
                                appearance-none
                                rounded-full
                                border-2
                                bg-[var(--color-background-base)]
                                transition-all duration-[var(--animation-focus-duration)] ease-[var(--animation-focus-easing)]
                                cursor-pointer
                                ${error
                                    ? 'border-[var(--red-500)]'
                                    : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]'
                                }
                                checked:border-[var(--color-brand-primary)]
                                checked:border-[6px]
                                focus:outline-none 
                                focus:ring-2 
                                focus:ring-offset-2
                                focus:ring-[var(--color-brand-primary)]/30
                                disabled:cursor-not-allowed 
                                disabled:opacity-50
                                ${className}
                            `}
                            {...props}
                        />
                    </div>
                    {label && (
                        <label
                            htmlFor={radioId}
                            className="text-[var(--font-fontSize-sm)] text-[var(--color-text-primary)] cursor-pointer select-none"
                        >
                            {label}
                        </label>
                    )}
                </div>
                {error && (
                    <p
                        id={errorId}
                        role="alert"
                        className="mt-1.5 text-[var(--font-fontSize-sm)] text-[var(--red-500)] font-[var(--font-fontWeight-medium)]"
                    >
                        {error}
                    </p>
                )}
                {hint && !error && (
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

Radio.displayName = 'Radio';

export default Radio;
