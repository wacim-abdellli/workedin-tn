import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
    hint?: string;
}

/**
 * Checkbox component with design system tokens.
 * 
 * @component
 * @example
 * <Checkbox label="I agree to the terms and conditions" />
 * <Checkbox label="Subscribe to newsletter" defaultChecked />
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, error, hint, className = '', ...props }, ref) => {
        const checkboxId = props.id || props.name;
        const errorId = error ? `${checkboxId}-error` : undefined;
        const hintId = hint ? `${checkboxId}-hint` : undefined;
        const descriptionIds = [errorId, hintId].filter(Boolean).join(' ');

        return (
            <div className="w-full">
                <div className="flex items-start gap-3">
                    <div className="relative flex items-center">
                        <input
                            ref={ref}
                            type="checkbox"
                            id={checkboxId}
                            aria-invalid={!!error}
                            aria-describedby={descriptionIds || undefined}
                            className={`
                                peer
                                w-5 h-5
                                appearance-none
                                rounded-[var(--radius-sm)]
                                border-2
                                bg-[var(--color-background-base)]
                                transition-all duration-[var(--animation-focus-duration)] ease-[var(--animation-focus-easing)]
                                cursor-pointer
                                ${error
                                    ? 'border-[var(--red-500)]'
                                    : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]'
                                }
                                checked:bg-[var(--color-brand-primary)]
                                checked:border-[var(--color-brand-primary)]
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
                        <Check 
                            className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                            strokeWidth={3}
                        />
                    </div>
                    {label && (
                        <label
                            htmlFor={checkboxId}
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

Checkbox.displayName = 'Checkbox';

export default Checkbox;
