import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
    hint?: string;
}

/**
 * Toggle switch component with design system tokens.
 * 
 * @component
 * @example
 * <Toggle label="Enable notifications" />
 * <Toggle label="Dark mode" defaultChecked />
 */
const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
    ({ label, error, hint, className = '', ...props }, ref) => {
        const toggleId = props.id || props.name;
        const errorId = error ? `${toggleId}-error` : undefined;
        const hintId = hint ? `${toggleId}-hint` : undefined;
        const descriptionIds = [errorId, hintId].filter(Boolean).join(' ');

        return (
            <div className="w-full">
                <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            ref={ref}
                            type="checkbox"
                            id={toggleId}
                            aria-invalid={!!error}
                            aria-describedby={descriptionIds || undefined}
                            className="sr-only peer"
                            {...props}
                        />
                        <div className={`
                            w-11 h-6
                            rounded-full
                            transition-all duration-[var(--animation-focus-duration)] ease-[var(--animation-focus-easing)]
                            ${error
                                ? 'bg-[var(--red-200)] peer-checked:bg-[var(--red-500)]'
                                : 'bg-[var(--color-border-default)] peer-checked:bg-[var(--color-brand-primary)]'
                            }
                            peer-focus:outline-none 
                            peer-focus:ring-2 
                            peer-focus:ring-offset-2
                            peer-focus:ring-[var(--color-brand-primary)]/30
                            peer-disabled:cursor-not-allowed 
                            peer-disabled:opacity-50
                            after:content-['']
                            after:absolute
                            after:top-[2px]
                            after:start-[2px]
                            after:bg-white
                            after:rounded-full
                            after:h-5
                            after:w-5
                            after:transition-all
                            after:duration-[var(--animation-focus-duration)]
                            peer-checked:after:translate-x-full
                            peer-checked:after:border-white
                            ${className}
                        `}></div>
                    </label>
                    {label && (
                        <label
                            htmlFor={toggleId}
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

Toggle.displayName = 'Toggle';

export default Toggle;
