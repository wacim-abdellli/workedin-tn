import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    placeholder?: string;
    options: Array<{ value: string; label: string; disabled?: boolean }>;
    variant?: 'freelancer' | 'client';
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
    ({ label, error, hint, placeholder, options, className = '', variant = 'client', ...props }, ref) => {
        // Role-specific colors
        const colors = variant === 'freelancer'
            ? {
                focus: 'focus:border-purple-500 focus:ring-purple-500/20',
                icon: 'text-purple-400',
                optionSelected: '[&>option:checked]:bg-purple-500/20 [&>option:checked]:text-purple-300',
                optionHover: '[&>option:hover]:bg-purple-500/10',
            }
            : {
                focus: 'focus:border-[#E8820C] focus:ring-[#E8820C]/20',
                icon: 'text-[#E8820C]',
                optionSelected: '[&>option:checked]:bg-[#E8820C]/20 [&>option:checked]:text-amber-300',
                optionHover: '[&>option:hover]:bg-[#E8820C]/10',
            };

        const selectStyles = `
            w-full
            appearance-none
            rounded-xl
            border
            border-gray-800
            bg-[#111111]
            text-white
            text-base
            px-4
            py-3
            pe-10
            shadow-sm
            transition-all
            duration-200
            hover:border-gray-700
            focus:outline-none 
            focus:ring-2 
            focus:ring-offset-0
            ${colors.focus}
            ${error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : ''
            }
            disabled:cursor-not-allowed 
            disabled:opacity-50 
            disabled:bg-[#0a0a0a]
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
                        className="mb-2 block text-sm font-medium text-gray-300 transition-colors"
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
                        style={{
                            colorScheme: 'dark',
                        }}
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
                    <div className={`pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 ${colors.icon}`}>
                        <ChevronDown className="w-5 h-5" />
                    </div>
                </div>
                {error && (
                    <p
                        id={errorId}
                        role="alert"
                        className="mt-1.5 text-sm text-red-400 font-medium"
                    >
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p
                        id={hintId}
                        className="mt-1.5 text-sm text-gray-400"
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
