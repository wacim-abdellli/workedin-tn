import { useState, useEffect, useCallback, useRef, type CSSProperties, type TouchEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search, Filter, Briefcase, Star, MapPin, Clock,
    X, TrendingUp, AlertCircle, Lightbulb, ChevronRight,
    Sparkles, HeartHandshake, Users, ChevronLeft, ArrowUpDown,
    Shield,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Header, Footer } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { getJobs } from '../services/jobs';
import { getFreelancers } from '../services/profiles';
import { useTranslation } from '../i18n';
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';

/* ────────────────────────────── types ────────────────────────────── */

type Tab = 'all' | 'jobs' | 'freelancers';

type SearchPaginationToken = number | 'start-ellipsis' | 'end-ellipsis';

interface JobSkillObject {
    name?: string;
    name_en?: string;
    name_fr?: string;
    name_ar?: string;
}

type JobSkill = string | JobSkillObject;

interface JobResult {
    id: string;
    title: string;
    category: string;
    job_type: 'fixed_price' | 'hourly' | string;
    budget_min: number | null;
    budget_max: number | null;
    hourly_rate: number | null;
    posted_at: string | null;
    proposals_count?: number | null;
    required_skills?: JobSkill[] | null;
}

interface FreelancerProfileResult {
    id: string;
    title: string | null;
    hourly_rate: number | null;
    availability: string | null;
    skills: string[] | null;
    jobs_completed: number;
    success_rate: number | null;
    cin_verified: boolean;
}

interface FreelancerResult {
    id: string;
    full_name: string;
    avatar_url: string | null;
    location: string | null;
    user_type: string;
    freelancer_profiles: FreelancerProfileResult | FreelancerProfileResult[] | null;
}

function normalizeFreelancerProfile(
    profile: FreelancerResult['freelancer_profiles'],
): FreelancerProfileResult | null {
    if (!profile) return null;
    return Array.isArray(profile) ? profile[0] ?? null : profile;
}

function resolveJobSkillLabel(skill: JobSkill, language: string): string {
    if (typeof skill === 'string') {
        return skill;
    }

    if (language === 'ar') {
        return skill.name_ar || skill.name_en || skill.name_fr || skill.name || '';
    }

    if (language === 'fr') {
        return skill.name_fr || skill.name_en || skill.name_ar || skill.name || '';
    }

    return skill.name_en || skill.name_fr || skill.name_ar || skill.name || '';
}

function getJobSkillLabels(rawSkills: JobResult['required_skills'], language: string): string[] {
    if (!Array.isArray(rawSkills)) return [];

    return rawSkills
        .map((skill) => resolveJobSkillLabel(skill, language).trim())
        .filter((skill): skill is string => Boolean(skill))
        .slice(0, 4);
}

function buildPaginationTokens(currentPage: number, totalPages: number): SearchPaginationToken[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const tokens: SearchPaginationToken[] = [1];
    const windowStart = Math.max(2, currentPage - 1);
    const windowEnd = Math.min(totalPages - 1, currentPage + 1);

    if (windowStart > 2) {
        tokens.push('start-ellipsis');
    }

    for (let page = windowStart; page <= windowEnd; page += 1) {
        tokens.push(page);
    }

    if (windowEnd < totalPages - 1) {
        tokens.push('end-ellipsis');
    }

    tokens.push(totalPages);
    return tokens;
}

/* ────────────────────────────── hooks ────────────────────────────── */

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const h = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(h);
    }, [value, delay]);
    return debounced;
}

/* ────────────────────────────── constants ────────────────────────── */

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; bar: string }> = {
    development: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', text: '#60a5fa', bar: '#3b82f6' },
    design:      { bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.2)', text: '#f472b6', bar: '#ec4899' },
    marketing:   { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#34d399', bar: '#10b981' },
    writing:     { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#fbbf24', bar: '#f59e0b' },
};
const DEFAULT_CAT_COLOR = { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', text: '#a78bfa', bar: '#8b5cf6' };

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
    { value: 'newest',         labelKey: 'search.sort.newest' },
    { value: 'budget_high',    labelKey: 'search.sort.budgetHigh' },
    { value: 'budget_low',     labelKey: 'search.sort.budgetLow' },
    { value: 'proposals_high', labelKey: 'search.sort.proposalsHigh' },
] as const;

function FilterSidebarSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-8 rounded-xl skeleton-shimmer" />
            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`category-skeleton-${index}`} className="h-5 rounded-lg skeleton-shimmer" />
                ))}
            </div>

            <div className="h-px bg-white/10" />

            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={`budget-skeleton-${index}`} className="h-5 rounded-lg skeleton-shimmer" />
                ))}
            </div>
        </div>
    );
}

/* ────────────────────────────── FilterPanel ──────────────────────── */

interface FilterPanelProps {
    categoryParam: string;
    budgetParam: string;
    activeTab: Tab;
    activeFiltersCount: number;
    updateParams: (u: Record<string, string | null>) => void;
    tx: (key: string, params?: any, fallback?: string) => string;
}

function FilterPanel({ categoryParam, budgetParam, activeTab, activeFiltersCount, updateParams, tx }: FilterPanelProps) {
    const CATEGORIES = [
        { value: 'development', labelKey: 'search.categories.development' },
        { value: 'design',      labelKey: 'search.categories.design' },
        { value: 'marketing',   labelKey: 'search.categories.marketing' },
        { value: 'writing',     labelKey: 'search.categories.writing' },
    ];

    const BUDGETS = [
        { value: '0-50',    labelKey: 'search.budgets.0_50' },
        { value: '50-100',  labelKey: 'search.budgets.50_100' },
        { value: '100-250', labelKey: 'search.budgets.100_250' },
        { value: '250-500', labelKey: 'search.budgets.250_500' },
        { value: '500+',    labelKey: 'search.budgets.500_plus' },
    ];

    return (
        <div className="space-y-6">
            {/* Category */}
            <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3 flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" />{tx('search.filterSections.category', undefined, 'Category')}
                </p>
                <div className="space-y-1">
                    {CATEGORIES.map((c) => {
                        const active = categoryParam === c.value;
                        const colors = CATEGORY_COLORS[c.value] || DEFAULT_CAT_COLOR;
                        return (
                            <label key={c.value} className="flex items-center gap-2.5 cursor-pointer group rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]">
                                <div
                                    className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all"
                                    style={{
                                        borderColor: active ? colors.bar : 'rgba(255,255,255,0.15)',
                                        background: active ? colors.bar : 'transparent',
                                    }}
                                >
                                    {active && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    <input type="checkbox" className="sr-only" checked={active}
                                        onChange={() => updateParams({ category: active ? null : c.value })} />
                                </div>
                                <span className={`text-sm transition-colors ${active ? 'text-white font-semibold' : 'text-white/55 group-hover:text-white/80'}`}>
                                    {tx(c.labelKey, undefined, c.value)}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Budget — only for jobs */}
            {(activeTab === 'all' || activeTab === 'jobs') && (
                <div className="pt-5 border-t border-white/[0.06]">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3 flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-amber-400" />{tx('search.filterSections.budgetRange', undefined, 'Budget range')}
                    </p>
                    <div className="space-y-1">
                        {BUDGETS.map((b) => {
                            const active = budgetParam === b.value;
                            return (
                                <label key={b.value} className="flex items-center gap-2.5 cursor-pointer group rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]">
                                    <div
                                        className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all"
                                        style={{
                                            borderColor: active ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                                            background:  active ? '#fbbf24' : 'transparent',
                                        }}
                                    >
                                        {active && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                        <input type="checkbox" className="sr-only" checked={active}
                                            onChange={() => updateParams({ budget: active ? null : b.value })} />
                                    </div>
                                    <span className={`text-sm transition-colors ${active ? 'text-white font-semibold' : 'text-white/55 group-hover:text-white/80'}`}>
                                        {tx(b.labelKey, undefined, b.value)}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Clear */}
            {activeFiltersCount > 0 && (
                <button
                    type="button"
                    onClick={() => updateParams({ category: null, budget: null })}
                    className="w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-rose-400 hover:text-rose-300 hover:border-rose-500/30 transition-all"
                >
                    <X className="inline w-3.5 h-3.5 mr-1.5" />{tx('search.resetFilters', undefined, 'Clear all filters')}
                </button>
            )}
        </div>
    );
}

/* ────────────────────────────── Main page ────────────────────────── */

export default function SearchResults() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { tx, language } = useTranslation();

    const query        = searchParams.get('q')        || '';
    const typeParam    = (searchParams.get('type') as Tab) || 'all';
    const categoryParam = searchParams.get('category') || '';
    const budgetParam  = searchParams.get('budget')   || '';
    const sortParam    = searchParams.get('sort')      || 'newest';

    const [inputValue, setInputValue]               = useState(query);
    const [activeTab, setActiveTab]                 = useState<Tab>(typeParam);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [page, setPage]                           = useState(1);
    const [drawerOffset, setDrawerOffset]           = useState(0);
    const [isDraggingDrawer, setIsDraggingDrawer]   = useState(false);
    const drawerStartYRef = useRef<number | null>(null);

    const debouncedQuery = useDebounce(query, 300);
    const dateLocale = language === 'ar' ? ar : language === 'fr' ? fr : enUS;

    // Sync URL → state
    useEffect(() => {
        setInputValue(query);
        setActiveTab((searchParams.get('type') as Tab) || 'all');
    }, [query, searchParams]);

    // Reset page on filter/query changes
    useEffect(() => { setPage(1); }, [debouncedQuery, categoryParam, budgetParam, activeTab]);

    useEffect(() => {
        if (!isMobileFiltersOpen) {
            setDrawerOffset(0);
            setIsDraggingDrawer(false);
            drawerStartYRef.current = null;
        }
    }, [isMobileFiltersOpen]);

    const updateParams = useCallback((updates: Record<string, string | null>) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([k, v]) => {
            if (!v) next.delete(k); else next.set(k, v);
        });
        setSearchParams(next);
    }, [searchParams, setSearchParams]);

    const closeMobileFilters = useCallback(() => {
        setIsMobileFiltersOpen(false);
        setDrawerOffset(0);
        setIsDraggingDrawer(false);
        drawerStartYRef.current = null;
    }, []);

    const handleDrawerTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
        drawerStartYRef.current = event.touches[0]?.clientY ?? null;
        setIsDraggingDrawer(true);
    }, []);

    const handleDrawerTouchMove = useCallback((event: TouchEvent<HTMLDivElement>) => {
        const startY = drawerStartYRef.current;
        if (startY == null) return;

        const currentY = event.touches[0]?.clientY ?? startY;
        const delta = Math.max(0, currentY - startY);
        if (delta > 0) {
            event.preventDefault();
            setDrawerOffset(delta);
        }
    }, []);

    const handleDrawerTouchEnd = useCallback(() => {
        const shouldClose = drawerOffset > 90;
        setIsDraggingDrawer(false);
        drawerStartYRef.current = null;

        if (shouldClose) {
            closeMobileFilters();
            return;
        }

        setDrawerOffset(0);
    }, [closeMobileFilters, drawerOffset]);

    const handleSearch  = (q: string) => updateParams({ q: q || null });
    const handleTab     = (tab: Tab)  => updateParams({ type: tab === 'all' ? null : tab });
    const handleSort    = (s: string) => updateParams({ sort: s === 'newest' ? null : s });

    /* ── Data fetching ── */
    const { data: jobsData, isLoading: jobsLoading, error: jobsError } = useQuery({
        queryKey: ['search-jobs', debouncedQuery, categoryParam, budgetParam, sortParam, page],
        queryFn:  () => getJobs({
            search: debouncedQuery || undefined,
            categories: categoryParam ? [categoryParam] : undefined,
            budgetRange: budgetParam || undefined,
            sortBy: sortParam === 'newest' ? undefined : sortParam,
        }, page, PAGE_SIZE),
        enabled:  (activeTab === 'all' || activeTab === 'jobs') && debouncedQuery.length > 0,
        staleTime: 30_000,
    });

    const { data: freelancersData, isLoading: freelancersLoading, error: freelancersError } = useQuery({
        queryKey: ['search-freelancers', debouncedQuery, categoryParam, page],
        queryFn:  () => getFreelancers({ search: debouncedQuery || undefined }, page, PAGE_SIZE),
        enabled:  (activeTab === 'all' || activeTab === 'freelancers') && debouncedQuery.length > 0,
        staleTime: 30_000,
    });

    const jobs = (jobsData?.data ?? []) as JobResult[];
    const jobsCount = jobsData?.count ?? 0;

    const rawFreelancers = (freelancersData?.data ?? []) as FreelancerResult[];
    const freelancers = debouncedQuery
        ? rawFreelancers.filter((freelancer) => {
            const freelancerProfile = normalizeFreelancerProfile(freelancer.freelancer_profiles);
            const normalizedQuery = debouncedQuery.toLowerCase();

            return (
                freelancer.full_name?.toLowerCase().includes(normalizedQuery)
                || freelancerProfile?.title?.toLowerCase().includes(normalizedQuery)
            );
          })
        : rawFreelancers;
    const freelancersCount = freelancersData?.count ?? freelancers.length;

    const resultsCountValue = activeTab === 'jobs'
        ? jobsCount
        : activeTab === 'freelancers'
            ? freelancersCount
            : jobsCount + freelancersCount;

    const isLoading   = (jobsLoading || freelancersLoading) && debouncedQuery.length > 0;
    const hasError    = jobsError || freelancersError;
    const hasResults  = resultsCountValue > 0;
    const activeFiltersCount = [categoryParam, budgetParam].filter(Boolean).length;
    const activeTabIndex = (['all', 'jobs', 'freelancers'] as const).indexOf(activeTab);

    // Pagination
    const jobTotalPages = Math.max(1, Math.ceil(jobsCount / PAGE_SIZE));
    const freelancerTotalPages = Math.max(1, Math.ceil(freelancersCount / PAGE_SIZE));
    const totalPages = activeTab === 'jobs'
        ? jobTotalPages
        : activeTab === 'freelancers'
            ? freelancerTotalPages
            : Math.max(jobTotalPages, freelancerTotalPages);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const paginationTokens = buildPaginationTokens(page, totalPages);

    const trendingTags = [
        {
            label: tx('search.trending.logoDesign', undefined, 'Logo Design'),
            meta: tx('search.trendingMeta.logoDesign', undefined, 'Popular now'),
            emoji: '🎨',
        },
        {
            label: tx('search.trending.reactJs', undefined, 'React JS'),
            meta: tx('search.trendingMeta.reactJs', undefined, 'High demand'),
            emoji: '⚛️',
        },
        {
            label: tx('search.trending.translation', undefined, 'Translation'),
            meta: tx('search.trendingMeta.translation', undefined, 'Fast moving'),
            emoji: '🌐',
        },
        {
            label: tx('search.trending.uiux', undefined, 'UI/UX'),
            meta: tx('search.trendingMeta.uiux', undefined, 'Trending this week'),
            emoji: '✨',
        },
    ];

    const tabLabels: Record<Tab, string> = {
        all:         tx('search.tabs.all', undefined, 'All'),
        jobs:        tx('search.tabs.jobs', undefined, 'Jobs'),
        freelancers: tx('search.tabs.freelancers', undefined, 'Freelancers'),
    };

    const budgetLabelKeys: Record<string, string> = {
        '0-50': 'search.budgets.0_50',
        '50-100': 'search.budgets.50_100',
        '100-250': 'search.budgets.100_250',
        '250-500': 'search.budgets.250_500',
        '500+': 'search.budgets.500_plus',
    };

    const selectedBudgetLabel = budgetParam && budgetLabelKeys[budgetParam]
        ? tx(budgetLabelKeys[budgetParam], undefined, `${budgetParam} TND`)
        : budgetParam
            ? `${budgetParam} TND`
            : '';

    return (
        <div className="min-h-screen page-bg-base">
            <SEO {...SEO_CONFIG.search} url="/search" />
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── Search hero ── */}
                <div className="relative mb-8 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(160deg,rgba(139,92,246,0.06) 0%,rgba(99,102,241,0.03) 40%,transparent 70%)' }}>
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 30% 20%,rgba(139,92,246,0.08),transparent)' }} />
                    <div className="relative p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30 pointer-events-none" />
                                <input
                                    id="search-input"
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(inputValue)}
                                    placeholder={tx('search.placeholder', undefined, 'Search jobs, freelancers, skills...')}
                                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] pl-11 pr-10 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all backdrop-blur-sm"
                                />
                                {inputValue && (
                                    <button onClick={() => { setInputValue(''); handleSearch(''); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.08] text-white/50 hover:text-white transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <button
                                id="search-submit"
                                onClick={() => handleSearch(inputValue)}
                                className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.97] shrink-0"
                                style={{ background: 'linear-gradient(135deg,var(--workspace-primary,#8b5cf6),color-mix(in srgb,var(--workspace-primary,#8b5cf6) 70%,#4c1d95))' }}
                            >
                                <Search className="w-4 h-4" />
                                {tx('common.search', undefined, 'Search')}
                            </button>

                            {/* Mobile filter trigger */}
                            <button
                                id="mobile-filter-btn"
                                onClick={() => setIsMobileFiltersOpen(true)}
                                className="sm:hidden flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60 hover:text-white transition-all"
                            >
                                <Filter className="w-4 h-4" />
                                {tx('search.filters', undefined, 'Filters')}
                                {activeFiltersCount > 0 && (
                                    <span className="rounded-full bg-violet-500/25 border border-violet-500/30 text-violet-300 text-[10px] font-bold px-1.5 py-0.5">{activeFiltersCount}</span>
                                )}
                            </button>
                        </div>

                        {/* Active filter pills */}
                        {activeFiltersCount > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {categoryParam && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border"
                                        style={{ background: (CATEGORY_COLORS[categoryParam] || DEFAULT_CAT_COLOR).bg, borderColor: (CATEGORY_COLORS[categoryParam] || DEFAULT_CAT_COLOR).border, color: (CATEGORY_COLORS[categoryParam] || DEFAULT_CAT_COLOR).text }}>
                                        {tx(`search.categories.${categoryParam}`, undefined, categoryParam)}
                                        <button onClick={() => updateParams({ category: null })} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                                    </span>
                                )}
                                {budgetParam && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300">
                                        {selectedBudgetLabel}
                                        <button onClick={() => updateParams({ budget: null })} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Tab bar ── */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="relative grid grid-cols-3 rounded-2xl border border-white/[0.06] p-1.5 flex-1 sm:flex-none overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <span
                            aria-hidden
                            className="absolute top-1.5 bottom-1.5 w-1/3 rounded-xl transition-transform duration-300 ease-out"
                            style={{
                                transform: `translateX(${activeTabIndex * 100}%)`,
                                background: 'rgba(139,92,246,0.12)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                            }}
                        />
                        {(['all', 'jobs', 'freelancers'] as Tab[]).map((tab) => {
                            const active = activeTab === tab;
                            const count = tab === 'all' ? jobsCount + freelancersCount : tab === 'jobs' ? jobsCount : freelancersCount;
                            return (
                                <button
                                    key={tab}
                                    id={`tab-${tab}`}
                                    onClick={() => handleTab(tab)}
                                    className="relative z-10 flex-1 sm:px-5 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                                    style={{
                                        color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                                        background: 'transparent',
                                    }}
                                >
                                    {tabLabels[tab]}
                                    {query && !isLoading && (
                                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{
                                            background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                                            color: active ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                                        }}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                </div>

                {/* ── Layout ── */}
                <div className="flex gap-6 items-start">

                    {/* Desktop sidebar */}
                    <aside className="sticky top-24 hidden md:block w-64 shrink-0">
                        <div className="rounded-2xl border border-white/[0.06] max-h-[calc(100vh-7rem)] overflow-y-auto" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <div className="sticky top-0 z-10 px-5 py-4 border-b border-white/[0.06] backdrop-blur-sm" style={{ background: 'rgba(18,18,26,0.88)' }}>
                                <div className="flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                                        <Filter className="w-4 h-4 opacity-60" />
                                        {tx('search.filtersTitle', undefined, 'Filters')}
                                    </h2>
                                    {activeFiltersCount > 0 && (
                                        <span className="rounded-full text-[10px] font-bold px-2 py-0.5" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-5">
                                {isLoading ? (
                                    <FilterSidebarSkeleton />
                                ) : (
                                    <FilterPanel
                                        categoryParam={categoryParam}
                                        budgetParam={budgetParam}
                                        activeTab={activeTab}
                                        activeFiltersCount={activeFiltersCount}
                                        updateParams={updateParams}
                                        tx={tx}
                                    />
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* Main area */}
                    <div className="flex-1 min-w-0">

                        {/* ── Empty (no query) ── */}
                        {!query && (
                            <div className="flex flex-col items-center justify-center py-20 text-center" style={{ animation: 'searchFadeIn 0.4s ease-out' }}>
                                <div className="relative mb-8 h-36 w-72 rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
                                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(139,92,246,0.22), transparent 60%)' }} />
                                    <svg viewBox="0 0 288 144" className="h-full w-full">
                                        <defs>
                                            <linearGradient id="searchCardGrad" x1="0" x2="1" y1="0" y2="1">
                                                <stop offset="0%" stopColor="rgba(139,92,246,0.45)" />
                                                <stop offset="100%" stopColor="rgba(99,102,241,0.12)" />
                                            </linearGradient>
                                        </defs>
                                        <rect x="16" y="18" width="118" height="52" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" />
                                        <rect x="32" y="31" width="70" height="6" rx="3" fill="rgba(255,255,255,0.18)" />
                                        <rect x="32" y="45" width="48" height="5" rx="2.5" fill="rgba(255,255,255,0.12)" />

                                        <rect x="154" y="46" width="118" height="52" rx="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />
                                        <rect x="170" y="59" width="66" height="6" rx="3" fill="rgba(255,255,255,0.18)" />
                                        <rect x="170" y="73" width="40" height="5" rx="2.5" fill="rgba(255,255,255,0.12)" />

                                        <circle cx="128" cy="96" r="22" fill="url(#searchCardGrad)" />
                                        <circle cx="128" cy="92" r="9" fill="rgba(255,255,255,0.55)" />
                                        <rect x="116" y="103" width="24" height="12" rx="6" fill="rgba(255,255,255,0.45)" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-black mb-3">
                                    {tx('search.empty.titlePrefix', undefined, 'Find Your Perfect')}{' '}
                                    <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#8b5cf6,#6366f1)' }}>
                                        {tx('search.empty.titleHighlight', undefined, 'Match')}
                                    </span>
                                </h2>
                                <p className="text-white/45 text-sm max-w-md mb-10 leading-7">
                                    {tx('search.empty.subtitle', undefined, 'Discover talented freelancers and amazing projects in just a few clicks.')}
                                </p>

                                {/* Trending */}
                                <div className="w-full max-w-lg">
                                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold flex items-center justify-center gap-1.5 mb-4">
                                        <Sparkles className="w-3 h-3" />{tx('search.empty.trendingTitle', undefined, 'Trending')}
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {trendingTags.map(({ label, meta, emoji }) => (
                                            <button
                                                key={label}
                                                onClick={() => { setInputValue(label); handleSearch(label); }}
                                                className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center hover:border-white/[0.15] hover:bg-white/[0.05] hover:-translate-y-0.5 transition-all"
                                            >
                                                <span className="text-2xl mb-2 block">{emoji}</span>
                                                <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">{label}</span>
                                                <span className="mt-1 block text-[10px] text-white/35">{meta}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/jobs')}
                                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-violet-300 hover:text-violet-200 transition-colors"
                                    >
                                        {tx('search.empty.browseAllJobs', undefined, 'Or browse all jobs')}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Tips */}
                                <div className="grid sm:grid-cols-3 gap-3 mt-10 w-full max-w-2xl">
                                    {[
                                        { icon: Lightbulb, color: '#8b5cf6', colorBg: 'rgba(139,92,246,0.08)', colorBorder: 'rgba(139,92,246,0.15)', label: tx('search.empty.tipLabel', undefined, 'Tip'), text: tx('search.empty.tipSpecific', undefined, 'Be specific with keywords to find the best match faster') },
                                        { icon: TrendingUp, color: '#fbbf24', colorBg: 'rgba(251,191,36,0.06)', colorBorder: 'rgba(251,191,36,0.15)', label: tx('search.empty.popularLabel', undefined, 'Popular'), text: tx('search.empty.tipPopular', undefined, 'React and UI/UX design are trending this week') },
                                        { icon: HeartHandshake, color: '#34d399', colorBg: 'rgba(52,211,153,0.06)', colorBorder: 'rgba(52,211,153,0.15)', label: tx('search.empty.proTipLabel', undefined, 'Pro Tip'), text: tx('search.empty.tipFilters', undefined, 'Use filters to narrow results by budget and category') },
                                    ].map(({ icon: Icon, color, colorBg, colorBorder, label, text }) => (
                                        <div key={label} className="rounded-2xl border p-4 text-left" style={{ background: colorBg, borderColor: colorBorder }}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: colorBg }}>
                                                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>{label}</span>
                                            </div>
                                            <p className="text-xs text-white/50 leading-relaxed">{text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Loading — shimmer skeletons ── */}
                        {isLoading && (
                            <div className="space-y-3">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="rounded-2xl border border-white/[0.06] p-5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl shrink-0 skeleton-shimmer" />
                                            <div className="flex-1 space-y-2.5">
                                                <div className="h-3 rounded w-1/4 skeleton-shimmer" />
                                                <div className="h-5 rounded w-3/4 skeleton-shimmer" />
                                                <div className="h-3 rounded w-1/2 skeleton-shimmer" />
                                            </div>
                                            <div className="w-20 h-7 rounded-lg shrink-0 skeleton-shimmer" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Error ── */}
                        {hasError && !isLoading && (
                            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-10 text-center" style={{ animation: 'searchFadeIn 0.3s ease-out' }}>
                                <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-white mb-1">{tx('search.error.title', undefined, 'Something went wrong')}</h3>
                                <p className="text-sm text-white/45 mb-5">{tx('search.error.description', undefined, "We're having trouble searching right now.")}</p>
                                <button onClick={() => window.location.reload()}
                                    className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm text-white/70 hover:text-white transition-all">
                                    {tx('search.error.retry', undefined, 'Try Again')}
                                </button>
                            </div>
                        )}

                        {/* ── No results ── */}
                        {!isLoading && !hasError && !hasResults && query && (
                            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-10 text-center" style={{ animation: 'searchFadeIn 0.3s ease-out' }}>
                                <div className="relative mb-6 inline-block">
                                    <div className="w-20 h-20 rounded-full bg-amber-400/15 flex items-center justify-center">
                                        <AlertCircle className="w-9 h-9 text-amber-400" />
                                    </div>
                                    <div className="absolute -inset-2 rounded-full blur-xl opacity-20 bg-amber-400" />
                                </div>
                                <h2 className="text-2xl font-black mb-2">
                                    {tx('search.noResultsView.title', undefined, 'Nothing found for')}{' '}
                                    <span className="text-amber-400">"{query}"</span>
                                </h2>
                                <p className="text-sm text-white/45 max-w-md mx-auto mb-8">
                                    {tx('search.noResultsView.subtitle', undefined, "Don't worry! Try one of these suggestions:")}
                                </p>

                                {/* TODO: Wire an actual suggestion service (did-you-mean) once backend support is available. */}
                                <p className="text-xs text-white/35 mb-6">
                                    {tx('search.noResultsView.didYouMeanPlaceholder', { query }, 'Did you mean trying a broader keyword?')}
                                </p>

                                <div className="space-y-2.5 max-w-lg mx-auto">
                                    {[
                                        { Icon: Filter,    label: tx('search.noResultsView.suggestionFiltersTitle', undefined, 'Broaden Your Filters'),      desc: tx('search.noResultsView.suggestionFiltersBody', undefined, 'Remove budget or category filters'), action: () => updateParams({ category: null, budget: null }) },
                                        { Icon: Sparkles,  label: tx('search.noResultsView.suggestionKeywordsTitle', undefined, 'Try Alternative Keywords'),   desc: tx('search.noResultsView.suggestionKeywordsBody', undefined, 'Different wording finds better results'), action: () => { setInputValue(''); handleSearch(''); } },
                                        { Icon: TrendingUp,label: tx('search.noResultsView.suggestionCategoriesTitle', undefined, 'Browse Popular Categories'), desc: tx('search.noResultsView.suggestionCategoriesBody', undefined, 'Check out trending skills'), action: () => navigate('/jobs') },
                                    ].map(({ Icon, label, desc, action }) => (
                                        <button key={label} onClick={action}
                                            className="group w-full flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-left hover:border-white/15 hover:bg-white/[0.04] transition-all">
                                            <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{label}</p>
                                                <p className="text-xs text-white/35">{desc}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Results ── */}
                        {!isLoading && query && hasResults && (
                            <div className="space-y-3">
                                {/* Results count */}
                                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-white/35">
                                        {tx(
                                            'search.resultsCount',
                                            { count: resultsCountValue, query },
                                            `${resultsCountValue} results for "${query}"`,
                                        )}
                                    </p>

                                    {(activeTab === 'all' || activeTab === 'jobs') && (
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <ArrowUpDown className="w-3.5 h-3.5 text-white/25" />
                                            <select
                                                id="sort-select"
                                                value={sortParam}
                                                onChange={(e) => handleSort(e.target.value)}
                                                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/60 outline-none focus:border-violet-500/40 transition-colors appearance-none cursor-pointer"
                                                style={{ backgroundImage: 'none' }}
                                            >
                                                {SORT_OPTIONS.map(o => (
                                                    <option key={o.value} value={o.value} className="bg-[#1a1a2e]">
                                                        {tx(o.labelKey, undefined, o.value)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Job cards */}
                                {(activeTab === 'all' || activeTab === 'jobs') && jobs.map((job, i) => {
                                    const postedAt = job.posted_at ? formatDistanceToNow(new Date(job.posted_at), { addSuffix: true, locale: dateLocale }) : '';
                                    const isFixed = job.job_type === 'fixed_price';
                                    const budgetStr = isFixed
                                        ? (job.budget_min != null && job.budget_max != null)
                                            ? `${job.budget_min} – ${job.budget_max} TND`
                                            : tx('search.budgetNegotiable', undefined, 'Negotiable')
                                        : (job.hourly_rate != null)
                                            ? `${job.hourly_rate} TND/hr`
                                            : tx('search.budgetNegotiable', undefined, 'Negotiable');
                                    const catColors = CATEGORY_COLORS[job.category] || DEFAULT_CAT_COLOR;
                                    const skillLabels = getJobSkillLabels(job.required_skills, language);

                                    return (
                                        <article
                                            key={job.id}
                                            onClick={() => navigate(`/jobs/${job.id}`)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    navigate(`/jobs/${job.id}`);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            className="search-card group relative rounded-2xl border border-white/[0.06] cursor-pointer transition-all duration-200 hover:border-white/[0.14] hover:-translate-y-0.5 overflow-hidden"
                                            style={{ '--card-index': i, background: 'rgba(255,255,255,0.02)' } as CSSProperties}
                                        >
                                            {/* Category accent bar */}
                                            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl transition-opacity group-hover:opacity-100 opacity-60" style={{ background: catColors.bar }} />

                                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                                style={{ background: `linear-gradient(135deg,${catColors.bg},transparent 60%)` }} />
                                            <div className="relative flex items-start gap-4 p-5 pl-6">
                                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                                                    style={{ background: catColors.bg, border: `1px solid ${catColors.border}` }}>
                                                    <Briefcase className="w-5 h-5" style={{ color: catColors.text }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-1.5">
                                                        <div className="min-w-0">
                                                            <span className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-1"
                                                                style={{ background: catColors.bg, color: catColors.text, border: `1px solid ${catColors.border}` }}>
                                                                {tx(`search.categories.${job.category}`, undefined, job.category)}
                                                            </span>
                                                            <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">{job.title}</h3>
                                                        </div>
                                                        <span className="shrink-0 rounded-xl px-3 py-1 text-xs font-bold border"
                                                            style={{ background: isFixed ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', color: isFixed ? '#60a5fa' : '#34d399', borderColor: isFixed ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)' }}>
                                                            {budgetStr}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/35">
                                                        {postedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{postedAt}</span>}
                                                    </div>

                                                    {skillLabels.length > 0 && (
                                                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                            {skillLabels.map((skill) => (
                                                                <span
                                                                    key={`${job.id}-${skill}`}
                                                                    className="rounded-full border border-white/[0.12] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-white/65"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}

                                {/* Freelancer cards */}
                                {(activeTab === 'all' || activeTab === 'freelancers') && freelancers.map((f, i) => {
                                    const fp = normalizeFreelancerProfile(f.freelancer_profiles);
                                    const initials = f.full_name?.charAt(0)?.toUpperCase() ?? '?';
                                    const hasProjects = Boolean(fp && fp.jobs_completed > 0);
                                    const hasSuccessRate = Boolean(fp?.success_rate && fp.success_rate > 0);
                                    const hasLocation = Boolean(f.location);
                                    return (
                                        <article
                                            key={f.id}
                                            onClick={() => navigate(`/freelancer/${f.id}`)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    navigate(`/freelancer/${f.id}`);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            className="search-card group relative rounded-2xl border border-white/[0.06] cursor-pointer transition-all duration-200 hover:border-white/[0.14] hover:-translate-y-0.5 overflow-hidden"
                                            style={{ '--card-index': jobs.length + i, background: 'rgba(255,255,255,0.02)' } as CSSProperties}
                                        >
                                            {/* Accent bar */}
                                            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to bottom,#8b5cf6,#6d28d9)' }} />

                                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                                style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.04),transparent 60%)' }} />
                                            <div className="relative flex items-start gap-4 p-5 pl-6">
                                                {f.avatar_url ? (
                                                    <img src={f.avatar_url} alt={f.full_name}
                                                        className="w-12 h-12 rounded-2xl object-cover shrink-0 transition-transform group-hover:scale-105"
                                                        style={{ boxShadow: '0 0 0 2px rgba(139,92,246,0.3)' }} />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold text-white transition-transform group-hover:scale-105"
                                                        style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
                                                        {initials}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-1.5">
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 flex items-center gap-1">
                                                                <Users className="w-2.5 h-2.5" />{tx('search.labels.freelancer', undefined, 'Freelancer')}
                                                            </span>
                                                            <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors flex items-center gap-1.5">
                                                                {f.full_name}
                                                                {fp?.cin_verified && (
                                                                    <span title={tx('common.verified', undefined, 'Verified')} className="inline-flex">
                                                                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                                                    </span>
                                                                )}
                                                            </h3>
                                                            {fp?.title && <p className="text-xs text-white/45 line-clamp-1">{fp.title}</p>}
                                                        </div>
                                                        {fp?.hourly_rate && (
                                                            <span className="shrink-0 rounded-xl px-3 py-1 text-xs font-bold border border-violet-500/20 bg-violet-500/10 text-violet-300">
                                                                {fp.hourly_rate} TND/hr
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1 text-xs text-white/35">
                                                        {hasProjects && (
                                                            <span className="flex items-center gap-1 text-amber-400/70">
                                                                <Star className="w-3 h-3 fill-amber-400/70" />
                                                                {fp?.jobs_completed ?? 0} {tx('search.labels.projects', undefined, 'projects')}
                                                            </span>
                                                        )}
                                                        {hasProjects && (hasSuccessRate || hasLocation) && <span className="px-1 text-white/20">·</span>}
                                                        {hasSuccessRate && (
                                                            <span className="text-emerald-300/80">
                                                                {Math.round(fp?.success_rate ?? 0)}% {tx('search.labels.successRate', undefined, 'success')}
                                                            </span>
                                                        )}
                                                        {hasSuccessRate && hasLocation && <span className="px-1 text-white/20">·</span>}
                                                        {hasLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{f.location}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}

                                {/* ── Pagination ── */}
                                {totalPages > 1 && (
                                    <div className="pt-6 space-y-2">
                                        <p className="sm:hidden text-center text-xs text-white/45">
                                            {tx('search.pagination.pageOf', { page, total: totalPages }, `Page ${page} of ${totalPages}`)}
                                        </p>

                                        <div className="flex items-center justify-center gap-2">
                                        <button
                                            disabled={page <= 1}
                                            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/50 hover:text-white hover:border-white/15 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                            {tx('search.pagination.prev', undefined, 'Prev')}
                                        </button>

                                        <div className="hidden sm:flex items-center gap-1">
                                            {paginationTokens.map((token) => {
                                                if (token === 'start-ellipsis' || token === 'end-ellipsis') {
                                                    return (
                                                        <span key={token} className="w-9 h-9 inline-flex items-center justify-center text-xs text-white/35">
                                                            ...
                                                        </span>
                                                    );
                                                }

                                                const isActive = token === page;
                                                return (
                                                    <button
                                                        key={`page-${token}`}
                                                        onClick={() => { setPage(token); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                        className="w-9 h-9 rounded-xl text-xs font-semibold transition-all"
                                                        style={{
                                                            background: isActive ? 'var(--workspace-primary,#8b5cf6)' : 'transparent',
                                                            color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                                                            boxShadow: isActive ? '0 2px 8px rgba(139,92,246,0.3)' : 'none',
                                                        }}
                                                    >
                                                        {token}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="sm:hidden flex items-center">
                                            <button
                                                onClick={() => { setPage(Math.min(totalPages, page + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                className="w-9 h-9 rounded-xl text-xs font-semibold transition-all"
                                                style={{
                                                    background: 'var(--workspace-primary,#8b5cf6)',
                                                    color: '#fff',
                                                }}
                                            >
                                                {page}
                                            </button>
                                        </div>

                                        <button
                                            disabled={page >= totalPages}
                                            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/50 hover:text-white hover:border-white/15 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                        >
                                            {tx('search.pagination.next', undefined, 'Next')}
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile filter drawer */}
            {isMobileFiltersOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeMobileFilters}
                        style={{ animation: 'searchBackdropIn 0.2s ease-out' }} />
                    <div className="absolute inset-x-0 bottom-0 top-16 flex flex-col rounded-t-3xl border border-white/[0.08]"
                        style={{
                            background: '#12121a',
                            animation: 'searchDrawerUp 0.3s cubic-bezier(0.32,0.72,0,1)',
                            transform: `translateY(${drawerOffset}px)`,
                            transition: isDraggingDrawer ? 'none' : 'transform 0.2s ease-out',
                            touchAction: 'pan-y',
                        }}
                        onTouchStart={handleDrawerTouchStart}
                        onTouchMove={handleDrawerTouchMove}
                        onTouchEnd={handleDrawerTouchEnd}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-white/15" />
                        </div>
                        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                            <h2 className="text-base font-bold text-white">{tx('search.filtersTitle', undefined, 'Filters')}</h2>
                            <button onClick={closeMobileFilters}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] text-white/60 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-5">
                            <FilterPanel
                                categoryParam={categoryParam}
                                budgetParam={budgetParam}
                                activeTab={activeTab}
                                activeFiltersCount={activeFiltersCount}
                                updateParams={updateParams}
                                tx={tx}
                            />
                        </div>
                        <div className="border-t border-white/[0.06] p-5">
                            <button onClick={closeMobileFilters}
                                className="w-full h-12 rounded-2xl font-bold text-white text-sm"
                                style={{ background: 'linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)' }}>
                                {tx('common.apply', undefined, 'Apply Filters')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />

            {/* Animations */}
            <style>{`
                @keyframes searchFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes searchBackdropIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes searchDrawerUp {
                    from { transform: translateY(100%); }
                    to   { transform: translateY(0); }
                }
                .search-card {
                    animation: searchFadeIn 0.3s ease-out both;
                    animation-delay: calc(var(--card-index,0) * 60ms);
                }
                .skeleton-shimmer {
                    background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 8px;
                }
                @keyframes shimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    );
}

