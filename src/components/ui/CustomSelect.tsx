import { forwardRef, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface CustomSelectProps {
    label?: string;
    error?: string;
    hint?: string;
    placeholder?: string;
    options: SelectOption[];
    variant?: 'freelancer' | 'client';
    value?: string;
    onChange?: (value: string) => void;
    name?: string;
    id?: string;
    disabled?: boolean;
    className?: string;
}

const CustomSelect = forwardRef<HTMLButtonElement, CustomSelectProps>(
    ({ label, error, hint, placeholder, options, className = '', variant = 'client', value, onChange, name, id, disabled }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const [selectedValue, setSelectedValue] = useState(value || '');
        const containerRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (value !== undefined) {
                setSelectedValue(value);
            }
        }, [value]);

        // Role-specific accents
        const colors = variant === 'freelancer'
            ? {
                icon: 'text-purple-400',
                optionHover: 'hover:bg-purple-500/10 hover:text-purple-300',
                optionSelected: 'bg-purple-500/15 text-purple-300 font-semibold',
                checkIcon: 'text-purple-400',
            }
            : {
                icon: 'text-[#F59E0B]',
                optionHover: 'hover:bg-[#F59E0B]/10 hover:text-amber-300',
                optionSelected: 'bg-[#F59E0B]/15 text-amber-300 font-semibold',
                checkIcon: 'text-[#F59E0B]',
            };

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };

            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [isOpen]);

        const handleSelect = (optionValue: string) => {
            setSelectedValue(optionValue);
            setIsOpen(false);
            onChange?.(optionValue);
        };

        const selectedOption = options.find(opt => opt.value === selectedValue);
        const displayText = selectedOption?.label || placeholder || 'Select...';

        const selectId = id || name;
        const errorId = error ? `${selectId}-error` : undefined;
        const hintId = hint ? `${selectId}-hint` : undefined;
        const descriptionIds = [errorId, hintId].filter(Boolean).join(' ');

        return (
            <div className="w-full" ref={containerRef}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="mb-2 block text-sm font-medium text-[var(--text-secondary)] transition-colors"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
                    <button
                        ref={ref}
                        type="button"
                        id={selectId}
                        disabled={disabled}
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        aria-invalid={!!error}
                        aria-describedby={descriptionIds || undefined}
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        className={`
                            w-full
                            appearance-none
                            rounded-xl
                            border
                            border-[var(--color-border-default)]
                            bg-[var(--input-bg)]
                            text-[var(--text-primary)]
                            text-base
                            font-medium
                            px-4
                            py-3
                            pe-10
                            shadow-none
                            transition-all
                            duration-200
                            hover:border-[var(--color-border-strong)]
                            focus:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-[var(--workspace-primary)]
                            focus-visible:ring-offset-2
                            focus:border-[var(--workspace-primary)]
                            ${error ? 'border-red-500 focus:border-red-500' : ''}
                            text-left
                            truncate
                            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                            ${!selectedValue && placeholder ? 'text-[var(--text-muted)]' : ''}
                            ${className}
                        `}
                    >
                        <span className="block truncate">{displayText}</span>
                    </button>
                    <div className={`pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 ${colors.icon} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-5 h-5" />
                    </div>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div 
                            className={`
                                absolute z-50 w-full mt-1.5 
                                bg-[#121214]/95 dark:bg-[#121214]/95
                                border border-zinc-800/80 dark:border-zinc-800/80
                                rounded-xl 
                                shadow-[0_12px_45px_rgba(0,0,0,0.55)]
                                p-1.5
                                animate-in fade-in slide-in-from-top-2 duration-200
                                backdrop-blur-md
                            `}
                            role="listbox"
                        >
                            <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                {options.map((option) => {
                                    const isSelected = option.value === selectedValue;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            disabled={option.disabled}
                                            onClick={() => !option.disabled && handleSelect(option.value)}
                                            role="option"
                                            aria-selected={isSelected}
                                            className={`
                                                w-full px-3.5 py-2 rounded-lg text-sm text-left
                                                transition-all duration-150
                                                flex items-center justify-between gap-3
                                                ${isSelected 
                                                    ? `${colors.optionSelected}` 
                                                    : 'text-zinc-300 hover:text-white'
                                                }
                                                ${!option.disabled && !isSelected ? colors.optionHover : ''}
                                                ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                        >
                                            <span className="flex-1 truncate">{option.label}</span>
                                            {isSelected && (
                                                <Check className={`w-4 h-4 flex-shrink-0 ${colors.checkIcon}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
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
                        className="mt-1.5 text-sm text-[var(--text-muted)]"
                    >
                        {hint}
                    </p>
                )}
            </div>
        );
    }
);

CustomSelect.displayName = 'CustomSelect';

export default CustomSelect;

