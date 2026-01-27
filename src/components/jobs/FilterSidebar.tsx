import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Filter,
    X,
    ChevronDown,
    ChevronUp,
    Check
} from 'lucide-react';
import Button from '../ui/Button';

// Move interfaces here if they are not global
interface FilterSidebarProps {
    filters: any;
    onFilterChange: (key: string, value: any) => void;
    categoryCounts: Record<string, number>;
    onClearAll: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const CATEGORIES = [
    { value: 'design', label: 'تصميم', labelEn: 'Design' },
    { value: 'development', label: 'برمجة', labelEn: 'Development' },
    { value: 'writing', label: 'كتابة', labelEn: 'Writing' },
    { value: 'marketing', label: 'تسويق', labelEn: 'Marketing' },
    { value: 'translation', label: 'ترجمة', labelEn: 'Translation' },
    { value: 'video', label: 'فيديو وتحريك', labelEn: 'Video & Animation' },
    { value: 'business', label: 'أعمال', labelEn: 'Business' },
    { value: 'data', label: 'بيانات', labelEn: 'Data' },
];

const EXPERIENCE_LEVELS = [
    { value: 'entry', label: 'مبتدئ' },
    { value: 'intermediate', label: 'متوسط' },
    { value: 'expert', label: 'خبير' },
];

const JOB_TYPES = [
    { value: 'fixed_price', label: 'سعر ثابت' },
    { value: 'hourly', label: 'بالساعة' },
];



const POSTED_DATE_OPTIONS = [
    { value: '24h', label: 'آخر 24 ساعة' },
    { value: '3d', label: 'آخر 3 أيام' },
    { value: '1w', label: 'آخر أسبوع' },
    { value: '1m', label: 'آخر شهر' },
    { value: 'any', label: 'أي وقت' },
];

export default function FilterSidebar({
    filters,
    onFilterChange,
    categoryCounts,
    onClearAll,
    isOpen = false,
    onClose
}: FilterSidebarProps) {
    const { i18n } = useTranslation();
    const isRTL = i18n.dir() === 'rtl';
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        category: true,
        jobType: true,
        budget: true,
        experience: false,
        duration: false,
        postedDate: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const FilterSection = ({
        title,
        section,
        children
    }: {
        title: string;
        section: string;
        children: React.ReactNode
    }) => (
        <div className="border-b border-gray-100 dark:border-dark-700 py-4 last:border-0">
            <button
                onClick={() => toggleSection(section)}
                className="flex items-center justify-between w-full text-start mb-2 group"
            >
                <h3 className="font-semibold text-dark-900 dark:text-white group-hover:text-primary-600 transition-colors">
                    {title}
                </h3>
                {expandedSections[section] ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
                )}
            </button>
            <div className={`space-y-2 overflow-hidden transition-all duration-300 ${expandedSections[section] ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}>
                {children}
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed lg:sticky top-0 lg:top-24 left-0 h-full lg:h-[calc(100vh-8rem)]
                w-80 lg:w-72 bg-white dark:bg-dark-800 lg:bg-transparent lg:dark:bg-transparent
                z-50 lg:z-0 shadow-2xl lg:shadow-none
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
                lg:translate-x-0 overflow-y-auto custom-scrollbar p-6 lg:p-0
                ${isRTL ? 'right-0' : 'left-0'} lg:right-auto lg:left-auto
            `}>
                <div className="flex items-center justify-between mb-6 lg:hidden">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Filter className="w-5 h-5 text-primary-500" />
                        <span>تصفية النتائج</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5 shadow-sm sticky top-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg">تصفية</h2>
                        <button
                            onClick={onClearAll}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                            مسح الكل
                        </button>
                    </div>

                    {/* Categories */}
                    <FilterSection title="التصنيف" section="category">
                        {CATEGORIES.map(cat => (
                            <label key={cat.value} className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="checkbox peer"
                                        checked={filters.categories.includes(cat.value)}
                                        onChange={(e) => {
                                            const newCategories = e.target.checked
                                                ? [...filters.categories, cat.value]
                                                : filters.categories.filter((c: string) => c !== cat.value);
                                            onFilterChange('categories', newCategories);
                                        }}
                                    />
                                    <div className="checkbox-custom peer-checked:bg-primary-500 peer-checked:border-primary-500">
                                        <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                                    </div>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-primary-600 transition-colors">
                                    {cat.label}
                                </span>
                                <span className="ms-auto text-xs text-gray-400 bg-gray-50 dark:bg-dark-700 px-2 py-0.5 rounded-full">
                                    {categoryCounts[cat.value] || 0}
                                </span>
                            </label>
                        ))}
                    </FilterSection>

                    {/* Job Type */}
                    <FilterSection title="نوع العمل" section="jobType">
                        {JOB_TYPES.map(type => (
                            <label key={type.value} className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="checkbox peer"
                                        checked={filters.jobTypes?.includes(type.value)}
                                        onChange={(e) => {
                                            const currentTypes = filters.jobTypes || [];
                                            const newTypes = e.target.checked
                                                ? [...currentTypes, type.value]
                                                : currentTypes.filter((t: string) => t !== type.value);
                                            onFilterChange('jobTypes', newTypes);
                                        }}
                                    />
                                    <div className="checkbox-custom peer-checked:bg-primary-500 peer-checked:border-primary-500">
                                        <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                                    </div>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-primary-600 transition-colors">
                                    {type.label}
                                </span>
                            </label>
                        ))}
                    </FilterSection>

                    {/* Budget Range */}
                    <FilterSection title="الميزانية (د.ت)" section="budget">
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="number"
                                placeholder="من"
                                className="input py-1 text-sm text-center"
                                value={filters.budgetMin || ''}
                                onChange={(e) => onFilterChange('budgetMin', Number(e.target.value))}
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="number"
                                placeholder="إلى"
                                className="input py-1 text-sm text-center"
                                value={filters.budgetMax || ''}
                                onChange={(e) => onFilterChange('budgetMax', Number(e.target.value))}
                            />
                        </div>
                    </FilterSection>

                    {/* Experience Level */}
                    <FilterSection title="مستوى الخبرة" section="experience">
                        {EXPERIENCE_LEVELS.map(level => (
                            <label key={level.value} className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="checkbox peer"
                                        checked={filters.experienceLevel?.includes(level.value)}
                                        onChange={(e) => {
                                            const currentLevels = filters.experienceLevel || [];
                                            const newLevels = e.target.checked
                                                ? [...currentLevels, level.value]
                                                : currentLevels.filter((l: string) => l !== level.value);
                                            onFilterChange('experienceLevel', newLevels);
                                        }}
                                    />
                                    <div className="checkbox-custom peer-checked:bg-primary-500 peer-checked:border-primary-500">
                                        <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                                    </div>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-primary-600 transition-colors">
                                    {level.label}
                                </span>
                            </label>
                        ))}
                    </FilterSection>

                    {/* Posted Date */}
                    <FilterSection title="تاريخ النشر" section="postedDate">
                        {POSTED_DATE_OPTIONS.map(option => (
                            <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="radio"
                                        name="postedDate"
                                        className="radio peer"
                                        checked={filters.datePosted === option.value}
                                        onChange={() => onFilterChange('datePosted', option.value)}
                                    />
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-colors" />
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-primary-600 transition-colors">
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </FilterSection>

                    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-dark-700 lg:hidden">
                        <Button onClick={onClose} className="w-full">
                            عرض النتائج
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
}
