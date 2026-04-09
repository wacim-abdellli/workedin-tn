import { Filter, Search, SortAsc } from 'lucide-react';
import type { ProposalFilters } from '../../types/proposal';

interface ProposalFiltersProps {
    totalProposals: number;
    filters: ProposalFilters;
    onFilterChange: (filters: ProposalFilters) => void;
}

export default function ProposalFiltersSidebar({ totalProposals }: ProposalFiltersProps) {
    return (
        <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-surface flex justify-between items-center">
                    <h3 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        تصفية العروض
                    </h3>
                    <span className="text-xs font-medium bg-card px-2 py-1 rounded-md border border-border">
                        {totalProposals} عرض
                    </span>
                </div>

                <div className="p-4 space-y-6">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="بحث في العروض..."
                            className="w-full ps-4 pe-10 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                        />
                        <Search className="w-4 h-4 text-muted absolute end-3 top-3" />
                    </div>

                    {/* Sort */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <SortAsc className="w-4 h-4" />
                            الترتيب حسب
                        </label>
                        <select className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-primary-500">
                            <option value="recommended">الموصى به (الأفضل تطابقاً)</option>
                            <option value="lowest_price">الأقل سعراً</option>
                            <option value="highest_price">الأعلى سعراً</option>
                            <option value="newest">الأحدث</option>
                            <option value="rating">تقييم المستقل</option>
                        </select>
                    </div>

                    <div className="h-px bg-muted"></div>

                    {/* Freelancer Level */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">مستوى المستقل</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground">مبتدئ</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground">متوسط الخبرة</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground">خبير</span>
                            </label>
                        </div>
                    </div>

                    <div className="h-px bg-muted"></div>

                    {/* Other Filters */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">خصائص أخرى</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground dark:text-white">حساب موثق فقط</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground dark:text-white">تقييم 4 نجوم وأكثر</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-border text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-muted-foreground group-hover:text-foreground dark:text-white">لديه معرض أعمال</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
