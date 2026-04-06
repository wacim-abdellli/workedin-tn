import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n';
import {
    Filter,
    X,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import Button from '../ui/Button';
import { getJobCategories } from '../../lib/jobCategories';

type FilterValue = string | string[] | null;

interface JobBoardFilters {
    search: string;
    categories: string[];
    jobType: string | null;
    budgetRange: string | null;
    experienceLevels: string[];
    postedWithin: string;
    sortBy: string;
}

// Move interfaces here if they are not global
interface FilterSidebarProps {
    filters: JobBoardFilters;
    onFilterChange: (key: keyof JobBoardFilters, value: FilterValue) => void;
    categoryCounts: Record<string, number>;
    onClearAll: () => void;
    isOpen?: boolean;
    onClose?: () => void;
    className?: string;
}

export default function FilterSidebar({
    filters,
    onFilterChange,
    categoryCounts,
    onClearAll,
    isOpen = false,
    onClose,
    className = ''
}: FilterSidebarProps) {
    const { t, tx, dir, language } = useTranslation();
    const isRTL = dir === 'rtl';
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        category: true,
        jobType: true,
        budget: true,
        experience: false,
        duration: false,
        postedDate: false
    });

    const categories = useMemo(() => (
        getJobCategories(language).map((category) => ({
            value: category.id,
            label: category.name,
        }))
    ), [language]);

    const experienceLevels = useMemo(() => [
        { value: 'entry', label: t.jobs.filters.experience.entry },
        { value: 'intermediate', label: t.jobs.filters.experience.intermediate },
        { value: 'expert', label: t.jobs.filters.experience.expert },
    ], [t]);

    const jobTypes = useMemo(() => [
        { value: 'fixed_price', label: t.jobs.filters.jobType.fixed_price },
        { value: 'hourly', label: t.jobs.filters.jobType.hourly },
    ], [t]);

    const postedDateOptions = useMemo(() => [
        { value: '24h', label: t.jobs.filters.postedDate.h24 },
        { value: '3d', label: t.jobs.filters.postedDate.d3 },
        { value: '1w', label: t.jobs.filters.postedDate.w1 },
        { value: '1m', label: t.jobs.filters.postedDate.m1 },
        { value: 'any', label: t.jobs.filters.postedDate.any },
    ], [t]);

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
        <div className="border-b border-purple-100 dark:border-purple-900/30 pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
            <button
                onClick={() => toggleSection(section)}
                className="flex items-center justify-between w-full text-start group mb-4 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 p-2 rounded-lg transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full bg-gradient-to-b from-purple-500 to-cyan-500" />
                    <span className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        {title}
                    </span>
                </div>
                {expandedSections[section] ? (
                    <ChevronUp className="w-5 h-5 text-purple-500 transition-transform" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                )}
            </button>
            <div className={`space-y-3 overflow-hidden transition-all duration-300 ${expandedSections[section] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
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
                fixed lg:sticky top-0 lg:top-24 h-full lg:h-[calc(100vh-8rem)]
                w-80 lg:w-72 bg-white dark:bg-[var(--color-bg-muted)] lg:bg-transparent lg:dark:bg-transparent
                z-50 lg:z-0 shadow-2xl lg:shadow-none
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
                lg:translate-x-0 overflow-y-auto custom-scrollbar p-6 lg:p-0
                ${isRTL ? 'right-0 left-auto' : 'left-0 right-auto'} lg:right-auto lg:left-auto
                ${className}
            `}>
                <div className="flex items-center justify-between mb-6 lg:hidden">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Filter className="w-6 h-6 text-primary-500" />
                        <span>{t.jobs.filters.title}</span>
                    </h2>
                    <button onClick={onClose} aria-label={tx('jobs.filters.closeAria', undefined, 'Close filters')} className="p-2 min-w-[44px] min-h-[44px] hover:bg-gray-100 dark:hover:bg-[var(--color-bg-elevated)] rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className={`
                    bg-gradient-to-br from-white to-purple-50/30 dark:from-[var(--color-bg-elevated)] dark:to-purple-950/10
                    rounded-2xl border-2 border-purple-100 dark:border-purple-900/30
                    p-6 shadow-xl shadow-purple-500/10 dark:shadow-none
                    sticky top-0
                `}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg">
                                <Filter className="w-5 h-5 text-white" />
                            </div>
                            {t.jobs.filters.title}
                        </h2>
                        <button
                            onClick={onClearAll}
                            className="text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:underline min-w-[44px] min-h-[44px] px-3 transition-colors"
                            aria-label={tx('jobs.filters.clearAria', undefined, 'Clear all filters')}
                        >
                            {t.jobs.filters.clearAll}
                        </button>
                    </div>

                    {/* Categories */}
                    <FilterSection title={t.jobs.filters.categories.title} section="category">
                        {categories.map(cat => (
                            <label key={cat.value} className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-cyan-50 dark:hover:from-purple-950/30 dark:hover:to-cyan-950/30 transition-all">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded-lg border-2 border-purple-300 dark:border-purple-700 text-purple-600 focus:ring-2 focus:ring-purple-500/30 transition-all"
                                    style={{ accentColor: '#9333ea' }}
                                    checked={filters.categories.includes(cat.value)}
                                    onChange={(e) => {
                                        const newCategories = e.target.checked
                                            ? [...filters.categories, cat.value]
                                            : filters.categories.filter((c: string) => c !== cat.value);
                                        onFilterChange('categories', newCategories);
                                    }}
                                />
                                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {cat.label}
                                </span>
                                {categoryCounts[cat.value] > 0 && (
                                    <span className="min-w-[28px] h-7 flex items-center justify-center px-2 text-xs font-bold rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg">
                                        {categoryCounts[cat.value]}
                                    </span>
                                )}
                            </label>
                        ))}
                    </FilterSection>

                    {/* Job Type */}
                    <FilterSection title={t.jobs.filters.jobType.title} section="jobType">
                        {jobTypes.map(type => (
                            <label key={type.value} className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-950/30 dark:hover:to-orange-950/30 transition-all">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded-lg border-2 border-amber-300 dark:border-amber-700 text-amber-600 focus:ring-2 focus:ring-amber-500/30 transition-all"
                                    style={{ accentColor: '#f59e0b' }}
                                    checked={filters.jobType === type.value}
                                    onChange={(e) => {
                                        onFilterChange('jobType', e.target.checked ? type.value : null);
                                    }}
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                    {type.label}
                                </span>
                            </label>
                        ))}
                    </FilterSection>

                    <FilterSection title={t.jobs.filters.budget.title} section="budget">
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 cursor-pointer group p-2 hover:bg-gray-50 dark:hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors">
                                <div className="relative flex items-center">
                                    <input
                                        type="radio"
                                        name="budgetRange"
                                        className="radio peer"
                                        checked={!filters.budgetRange}
                                        onChange={() => onFilterChange('budgetRange', null)}
                                    />
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-colors" />
                                </div>
                                <span className={`text-sm group-hover:text-primary-600 transition-colors ${!filters.budgetRange ? 'text-primary-600 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {t.jobs.filters.budget.all || 'الكل'}
                                </span>
                            </label>

                            {[
                                { value: '0-50', label: t.jobs.filters.budget.ranges?.r0_50 || 'أقل من 50 د.ت' },
                                { value: '50-100', label: t.jobs.filters.budget.ranges?.r50_100 || '50-100 د.ت' },
                                { value: '100-250', label: t.jobs.filters.budget.ranges?.r100_250 || '100-250 د.ت' },
                                { value: '250-500', label: t.jobs.filters.budget.ranges?.r250_500 || '250-500 د.ت' },
                                { value: '500+', label: t.jobs.filters.budget.ranges?.r500_plus || 'أكثر من 500 د.ت' },
                            ].map(range => (
                                <label key={range.value} className="flex items-center gap-2 cursor-pointer group p-2 hover:bg-gray-50 dark:hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors">
                                    <div className="relative flex items-center">
                                        <input
                                            type="radio"
                                            name="budgetRange"
                                            className="radio peer"
                                            checked={filters.budgetRange === range.value}
                                            onChange={() => onFilterChange('budgetRange', range.value)}
                                        />
                                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-colors" />
                                    </div>
                                    <span className={`text-sm group-hover:text-primary-600 transition-colors ${filters.budgetRange === range.value ? 'text-primary-600 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {range.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Experience Level */}
                    <FilterSection title={t.jobs.filters.experience.title} section="experience">
                        {experienceLevels.map(level => (
                            <label key={level.value} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-[var(--border)] text-[color:var(--workspace-primary)] focus:ring-2 focus:ring-[color:var(--workspace-primary)]/20"
                                    style={{ accentColor: 'var(--workspace-primary)' }}
                                    checked={filters.experienceLevels?.includes(level.value)}
                                    onChange={(e) => {
                                        const currentLevels = filters.experienceLevels || [];
                                        const newLevels = e.target.checked
                                            ? [...currentLevels, level.value]
                                            : currentLevels.filter((l: string) => l !== level.value);
                                        onFilterChange('experienceLevels', newLevels);
                                    }}
                                />
                                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                                    {level.label}
                                </span>
                            </label>
                        ))}
                    </FilterSection>

                    {/* Posted Date */}
                    <FilterSection title={t.jobs.filters.postedDate.title} section="postedDate">
                        {postedDateOptions.map(option => (
                            <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="radio"
                                        name="postedDate"
                                        className="radio peer"
                                        checked={filters.postedWithin === option.value} // Fix: JobBoard uses `postedWithin`
                                        onChange={() => onFilterChange('postedWithin', option.value)}
                                    />
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-colors" />
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-primary-600 transition-colors">
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </FilterSection>

                    <div className="pt-4 mt-4 border-t border-gray-100 dark:border-[var(--color-border-subtle)] lg:hidden">
                        <Button onClick={onClose} className="w-full">
                            {t.jobs.filters.viewResults}
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
}
