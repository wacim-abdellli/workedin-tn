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
        <div className="flex items-center gap-2 px-4 py-3 shrink-0 border-b" style={{ borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
            {/* Search */}
            <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder={tx('jobProposals.searchPlaceholder', undefined, 'Search proposals...')}
                    className="w-full ps-8 pe-3 py-2 rounded-xl text-xs focus:outline-none transition-all"
                    style={{
                        background: 'var(--page-bg)',
                        border: '1.5px solid color-mix(in srgb, var(--border) 70%, transparent)',
                        color: 'var(--text-primary)',
                    }}
                />
            </div>
            {/* Sort */}
            <div className="flex items-center gap-1.5 shrink-0">
                <SortAsc className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                <select
                    value={filters.sortBy ?? 'newest'}
                    onChange={e => onFilterChange({ ...filters, sortBy: e.target.value as ProposalFilters['sortBy'] })}
                    className="text-xs rounded-xl px-2 py-2 focus:outline-none cursor-pointer"
                    style={{
                        background: 'var(--page-bg)',
                        border: '1.5px solid color-mix(in srgb, var(--border) 70%, transparent)',
                        color: 'var(--text-primary)',
                    }}
                >
                    <option value="newest">{tx('jobProposals.sort.recommended', undefined, 'Best Match')}</option>
                    <option value="lowest_bid">{tx('jobProposals.sort.lowestBid', undefined, 'Lowest Bid')}</option>
                    <option value="highest_bid">{tx('jobProposals.sort.highestBid', undefined, 'Highest Bid')}</option>
                    <option value="rating">{tx('jobProposals.sort.rating', undefined, 'Top Rated')}</option>
                </select>
            </div>
        </div>
    );
}
