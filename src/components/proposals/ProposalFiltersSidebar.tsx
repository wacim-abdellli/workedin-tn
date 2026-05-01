import { Search, SortAsc } from 'lucide-react';
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
            <div className="flex items-center gap-2 shrink-0 bg-white/5 border border-white/10 rounded-lg px-2">
                <SortAsc className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-primary)]/30" />
                <select
                    value={filters.sortBy ?? 'newest'}
                    onChange={e => onFilterChange({ ...filters, sortBy: e.target.value as ProposalFilters['sortBy'] })}
                    className="text-xs py-2 focus:outline-none cursor-pointer bg-transparent text-[var(--color-text-primary)]/80 appearance-none font-medium"
                >
                    <option value="newest" className="bg-[var(--color-bg-subtle)]">{tx('jobProposals.sort.recommended', undefined, 'Best Match')}</option>
                    <option value="lowest_bid" className="bg-[var(--color-bg-subtle)]">{tx('jobProposals.sort.lowestBid', undefined, 'Lowest Bid')}</option>
                    <option value="highest_bid" className="bg-[var(--color-bg-subtle)]">{tx('jobProposals.sort.highestBid', undefined, 'Highest Bid')}</option>
                    <option value="rating" className="bg-[var(--color-bg-subtle)]">{tx('jobProposals.sort.rating', undefined, 'Top Rated')}</option>
                </select>
            </div>
        </div>
    );
}


