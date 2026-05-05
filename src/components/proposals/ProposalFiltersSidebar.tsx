import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search, SortAsc } from 'lucide-react';
import type { ProposalFilters } from '../../types/proposal';
import { useTranslation } from '../../i18n';

interface ProposalFiltersProps {
    filters: ProposalFilters;
    onFilterChange: (filters: ProposalFilters) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

export default function ProposalFilterBar({ filters, onFilterChange, searchQuery, onSearchChange }: ProposalFiltersProps) {
    const { tx } = useTranslation();
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortMenuRef = useRef<HTMLDivElement>(null);

    const sortOptions = [
        { value: 'newest', label: tx('jobProposals.sort.recommended', undefined, 'Best Match') },
        { value: 'lowest_bid', label: tx('jobProposals.sort.lowestBid', undefined, 'Lowest Bid') },
        { value: 'highest_bid', label: tx('jobProposals.sort.highestBid', undefined, 'Highest Bid') },
        { value: 'rating', label: tx('jobProposals.sort.rating', undefined, 'Top Rated') },
    ] as const;

    const selectedSort = filters.sortBy ?? 'newest';
    const selectedSortLabel = sortOptions.find(option => option.value === selectedSort)?.label ?? sortOptions[0].label;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
                setIsSortOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsSortOpen(false);
            }
        };

        if (isSortOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isSortOpen]);

    return (
        <div className="flex items-center gap-2 px-4 py-3 shrink-0 border-b border-white/5 bg-[var(--color-bg-base)]">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-primary)]/30" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder={tx('jobProposals.searchPlaceholder', undefined, 'Search proposals...')}
                    className="w-full ps-9 pe-3 py-2 rounded-lg text-xs focus:outline-none transition-colors bg-white/5 border border-white/10 text-[var(--color-text-primary)] focus:border-amber-500/50"
                />
            </div>
            {/* Sort */}
            <div ref={sortMenuRef} className="relative shrink-0 min-w-[180px]">
                <button
                    type="button"
                    onClick={() => setIsSortOpen(prev => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isSortOpen}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-medium text-[var(--color-text-primary)]/85 transition-colors hover:border-amber-500/40 hover:bg-white/7 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                >
                    <span className="flex min-w-0 items-center gap-2">
                        <SortAsc className="h-3.5 w-3.5 shrink-0 text-amber-400/80" />
                        <span className="truncate">{selectedSortLabel}</span>
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[var(--color-text-primary)]/45 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortOpen && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[var(--color-bg-base)] shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-sm">
                        <div className="p-1" role="listbox" aria-label={tx('jobProposals.sort.label', undefined, 'Sort proposals')}>
                            {sortOptions.map(option => {
                                const isSelected = option.value === selectedSort;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => {
                                            onFilterChange({ ...filters, sortBy: option.value as ProposalFilters['sortBy'] });
                                            setIsSortOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors ${isSelected ? 'bg-amber-500/15 text-amber-300' : 'text-[var(--color-text-primary)]/85 hover:bg-white/6 hover:text-white'}`}
                                    >
                                        <span className="truncate">{option.label}</span>
                                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-amber-300" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


