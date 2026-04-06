import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    placeholder?: string;
    options: Array<{ value: string; label: string; disabled?: boolean }>;
}

/**
 * Select component with design system tokens.
 * 
 * @component
 * @example
 * <Select 
 *   label="Country" 
 *   options={[
 *     { value: 'tn', label: 'Tunisia' },
 *     { value: 'fr', label: 'France' }
 *   ]} 
 * />
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, hint, placeholder, options, className = '', ...props }, ref) => {
        const selectStyles = `
            w-full
            appearance-none
            rounded-[var(--radius-md)]
            border
            bg-[var(--color-background-base)]
            text-[var(--color-text-primary)]
            text-[var(--font-fontSize-base)]
            px-[var(--input-padding-x)]
            py-[var(--input-padding-y)]
            pe-10
            shadow-[var(--shadow-elevation-0)]
            transition-all duration-[var(--animation-focus-duration)] ease-[var(--animation-focus-easing)]
            focus:outline-none 
            focus:ring-2 
            focus:ring-offset-0
            ${error
                ? 'border-[var(--red-500)] focus:border-[var(--red-500)] focus:ring-[var(--red-500)]/20'
                : 'border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]/20'
            }
            disabled:cursor-not-allowed 
            disabled:opacity-50 
            disabled:bg-[var(--color-background-muted)]
        `;

        const selectId = props.id || props.name;
        const errorId = error ? `${selectId}-error` : undefined;
        const hintId = hint ? `${selectId}-hint` : undefined;
        const descriptionIds = [errorId, hintId].filter(Boolean).join(' ');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="mb-2 block text-[var(--font-fontSize-sm)] font-[var(--font-fontWeight-medium)] text-[var(--color-text-secondary)] transition-colors"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        aria-invalid={!!error}
                        aria-describedby={descriptionIds || undefined}
                        className={`${selectStyles} ${className}`}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option 
                                key={option.value} 
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-[var(--color-text-disabled)]">
                        <ChevronDown className="w-5 h-5" />
                    </div>
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

Select.displayName = 'Select';

export default Select;
