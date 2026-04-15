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
                focus: 'focus:border-purple-500 focus:ring-purple-500/20',
                icon: 'text-purple-400',
                optionHover: 'hover:bg-purple-500/20',
                optionSelected: 'bg-purple-500/30 text-purple-300',
                checkIcon: 'text-purple-400',
            }
            : {
                focus: 'focus:border-[#E8820C] focus:ring-[#E8820C]/20',
                icon: 'text-[#E8820C]',
                optionHover: 'hover:bg-[#E8820C]/20',
                optionSelected: 'bg-[#E8820C]/30 text-amber-300',
                checkIcon: 'text-[#E8820C]',
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
                            ${isOpen ? 'border-[var(--border-strong)]' : 'border-[var(--input-border)]'}
                            bg-[var(--input-bg)]
                            text-[var(--text-primary)]
                            text-base
                            font-medium
                            px-4
                            py-3
                            pe-10
                            shadow-sm
                            transition-all
                            duration-200
                            hover:border-[var(--border-strong)]
                            focus:outline-none 
                            focus:ring-2 
                            focus:ring-offset-0
                            text-left
                            truncate
                            ${colors.focus}
                            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
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
                                absolute z-50 w-full mt-2 
                                bg-[var(--card-bg)] 
                                border border-[var(--border)]
                                rounded-xl 
                                shadow-2xl shadow-black/50
                                overflow-hidden
                                animate-in fade-in slide-in-from-top-2 duration-200
                                backdrop-blur-sm
                            `}
                            role="listbox"
                        >
                            <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
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
                                                w-full px-4 py-3 text-left text-base
                                                transition-all duration-150
                                                flex items-center justify-between gap-3
                                                font-medium
                                                ${isSelected 
                                                    ? `${colors.optionSelected} font-semibold` 
                                                    : 'text-[var(--text-primary)]'
                                                }
                                                ${!option.disabled && !isSelected ? colors.optionHover : ''}
                                                ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                        >
                                            <span className="flex-1 truncate">{option.label}</span>
                                            {isSelected && (
                                                <Check className={`w-5 h-5 flex-shrink-0 ${colors.checkIcon}`} />
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
