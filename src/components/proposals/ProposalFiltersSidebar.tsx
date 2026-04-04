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
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 dark:text-white flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        تصفية العروض
                    </h3>
                    <span className="text-xs font-medium bg-white dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                        {totalProposals} عرض
                    </span>
                </div>

                <div className="p-4 space-y-6">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="بحث في العروض..."
                            className="w-full ps-4 pe-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute end-3 top-3" />
                    </div>

                    {/* Sort */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-200 flex items-center gap-2">
                            <SortAsc className="w-4 h-4" />
                            الترتيب حسب
                        </label>
                        <select className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary-500">
                            <option value="recommended">الموصى به (الأفضل تطابقاً)</option>
                            <option value="lowest_price">الأقل سعراً</option>
                            <option value="highest_price">الأعلى سعراً</option>
                            <option value="newest">الأحدث</option>
                            <option value="rating">تقييم المستقل</option>
                        </select>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

                    {/* Freelancer Level */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-200">مستوى المستقل</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 dark:text-white">مبتدئ</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 dark:text-white">متوسط الخبرة</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 dark:text-white">خبير</span>
                            </label>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

                    {/* Other Filters */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-200">خصائص أخرى</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 dark:text-white">حساب موثق فقط</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 dark:text-white">تقييم 4 نجوم وأكثر</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 dark:text-white">لديه معرض أعمال</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
