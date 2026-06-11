import { useState, useRef, useEffect, useMemo } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectOption {
    id: string;
    label: string;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    max?: number;
    className?: string;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = 'Select options...',
    max = 5,
    className,
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Filtered options based on search query
    const filteredOptions = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return options;
        return options.filter(option =>
            option.label.toLowerCase().includes(query)
        );
    }, [options, searchQuery]);

    // Handle clicks outside of dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (optionId: string) => {
        const isAlreadySelected = selected.includes(optionId);
        if (isAlreadySelected) {
            onChange(selected.filter(id => id !== optionId));
        } else {
            if (selected.length < max) {
                onChange([...selected, optionId]);
            }
        }
        setSearchQuery('');
    };

    const handleRemove = (optionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter(id => id !== optionId));
    };

    // Helper to get labels of selected items
    const selectedOptionsMap = useMemo(() => {
        return new Map(options.map(opt => [opt.id, opt.label]));
    }, [options]);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "min-h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white flex flex-wrap items-center gap-2 cursor-pointer transition-all duration-200",
                    "focus-within:border-violet-500/50 focus-within:bg-white/[0.07]",
                    isOpen && "border-violet-500/50 bg-white/[0.07] ring-1 ring-violet-500/20",
                    className
                )}
            >
                {/* Selected Tags */}
                {selected.map(id => {
                    const label = selectedOptionsMap.get(id) || id;
                    return (
                        <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold font-sans animate-in fade-in zoom-in-95 duration-150"
                        >
                            {label}
                            <button
                                type="button"
                                onClick={(e) => handleRemove(id, e)}
                                className="hover:bg-violet-500/20 rounded-md p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    );
                })}

                {/* Input for searching when open */}
                {isOpen ? (
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={selected.length === 0 ? placeholder : ''}
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 text-sm py-1 min-w-[120px] font-sans"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    selected.length === 0 && (
                        <span className="text-white/30 text-sm select-none font-sans">
                            {placeholder}
                        </span>
                    )
                )}

                <div className="ms-auto flex items-center gap-2">
                    {selected.length > 0 && (
                        <span className="text-[10px] font-mono text-white/30 font-bold">
                            {selected.length}/{max}
                        </span>
                    )}
                    <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform duration-200", isOpen && "rotate-180")} />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[#121214]/95 border border-zinc-800/80 rounded-xl shadow-[0_12px_45px_rgba(0,0,0,0.55)] p-1.5 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const isSelected = selected.includes(option.id);
                                const isLimitReached = selected.length >= max && !isSelected;

                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        disabled={isLimitReached}
                                        onClick={() => handleSelect(option.id)}
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-lg text-sm text-left flex items-center justify-between gap-3 transition-all duration-150 font-sans",
                                            isSelected
                                                ? "bg-violet-500/15 text-violet-300 font-semibold"
                                                : "text-zinc-300 hover:text-white hover:bg-violet-500/10",
                                            isLimitReached && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-zinc-300"
                                        )}
                                    >
                                        <span className="truncate">{option.label}</span>
                                        {isSelected && (
                                            <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-3.5 py-3 text-sm text-zinc-500 text-center font-sans">
                                No options found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
