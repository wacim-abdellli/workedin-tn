import { Filter, Search, SortAsc } from 'lucide-react';
import type { ProposalFilters } from '../../types/proposal';
import { useTranslation } from "../../i18n";

interface ProposalFiltersProps {
    totalProposals: number;
    filters: ProposalFilters;
    onFilterChange: (filters: ProposalFilters) => void;
}

export default function ProposalFiltersSidebar({ totalProposals }: ProposalFiltersProps) {
    const { tx } = useTranslation();
    return (
        <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-surface flex justify-between items-center">
                    <h3 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        {tx('dynamic_key_872049934')}</h3>
                    <span className="text-xs font-medium bg-card px-2 py-1 rounded-md border border-border">
                        {totalProposals} {tx('dynamic_key_1581598')}</span>
                </div>

                <div className="p-4 space-y-6">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={tx('dynamic_key_1015995410')}
                            className="w-full ps-4 pe-10 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                        />
                        <Search className="w-4 h-4 text-muted absolute end-3 top-3" />
                    </div>

                    {/* Sort */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <SortAsc className="w-4 h-4" />
                            {tx('dynamic_key_476684698')}</label>
                        <select className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary-500">
                            <option value="recommended">{tx('dynamic_key_934974283')}</option>
                            <option value="lowest_price">{tx('dynamic_key_1716602825')}</option>
                            <option value="highest_price">{tx('dynamic_key_432874841')}</option>
                            <option value="newest">{tx('dynamic_key_624028093')}</option>
                            <option value="rating">{tx('dynamic_key_596156750')}</option>
                        </select>
                    </div>

                    <div className="h-px bg-muted"></div>

                    {/* Freelancer Level */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">{tx('dynamic_key_1545985538')}</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground">{tx('dynamic_key_1530768926')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground">{tx('dynamic_key_1475699192')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground">{tx('dynamic_key_48695393')}</span>
                            </label>
                        </div>
                    </div>

                    <div className="h-px bg-muted"></div>

                    {/* Other Filters */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">{tx('dynamic_key_525136044')}</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground dark:text-white">{tx('dynamic_key_1797922455')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground dark:text-white">{tx('dynamic_key_1828865552')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground dark:text-white">{tx('dynamic_key_257908957')}</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
