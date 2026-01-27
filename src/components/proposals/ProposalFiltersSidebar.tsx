import { Filter, Search, SortAsc } from 'lucide-react';

interface ProposalFiltersProps {
    totalProposals: number;
    filters: any;
    onFilterChange: (filters: any) => void;
}

export default function ProposalFiltersSidebar({ totalProposals }: ProposalFiltersProps) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        تصفية العروض
                    </h3>
                    <span className="text-xs font-medium bg-white px-2 py-1 rounded-md border border-gray-200">
                        {totalProposals} عرض
                    </span>
                </div>

                <div className="p-4 space-y-6">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="بحث في العروض..."
                            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                    </div>

                    {/* Sort */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <SortAsc className="w-4 h-4" />
                            الترتيب حسب
                        </label>
                        <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500">
                            <option value="recommended">الموصى به (الأفضل تطابقاً)</option>
                            <option value="lowest_price">الأقل سعراً</option>
                            <option value="highest_price">الأعلى سعراً</option>
                            <option value="newest">الأحدث</option>
                            <option value="rating">تقييم المستقل</option>
                        </select>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Freelancer Level */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">مستوى المستقل</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900">مبتدئ</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900">متوسط الخبرة</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900">خبير</span>
                            </label>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Other Filters */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">خصائص أخرى</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900">حساب موثق فقط</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900">تقييم 4 نجوم وأكثر</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900">لديه معرض أعمال</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
