import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

/**
 * Form Select component with standard styling and error handling.
 * 
 * @component
 * @param {SelectProps} props
 * @returns {JSX.Element}
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, hint, options, placeholder, className = '', ...props }, ref) => {
        const selectStyles = `
      w-full px-4 py-3 bg-white dark:bg-dark-800 border rounded-xl
      text-dark-900 dark:text-white appearance-none cursor-pointer
      focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent
      transition-all duration-200 shadow-sm
      ${error
                ? 'border-red-500 focus:ring-red-500/30'
                : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600 focus:ring-primary-500/30 dark:focus:ring-primary-400/30 focus:border-primary-500 dark:focus:border-primary-400'
            }
      disabled:opacity-50 disabled:bg-dark-100 dark:disabled:bg-dark-900 disabled:cursor-not-allowed
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
                        className="block text-sm font-semibold text-dark-700 dark:text-dark-200 mb-2"
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
                            <option value="" disabled className="bg-white dark:bg-gray-800 dark:bg-dark-800 text-dark-500">
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option key={option.value} value={option.value} className="bg-white dark:bg-gray-800 dark:bg-dark-800 py-2">
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
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

Select.displayName = 'Select';

export default Select;
