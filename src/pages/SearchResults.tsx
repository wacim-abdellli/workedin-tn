import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search, Filter, Briefcase, Star, MapPin, Clock,
    X, TrendingUp, AlertCircle, Lightbulb, ChevronRight,
    Sparkles, HeartHandshake, Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Header, Footer } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { getJobs } from '../services/jobs';
import { getFreelancers } from '../services/profiles';
import { useTranslation } from '../i18n';
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';

type Tab = 'all' | 'jobs' | 'freelancers';

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const h = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(h);
    }, [value, delay]);
    return debounced;
}

const CATEGORIES = [
    { value: 'development', label: 'Development' },
    { value: 'design',      label: 'Design'       },
    { value: 'marketing',   label: 'Marketing'    },
    { value: 'writing',     label: 'Writing'      },
];

const BUDGETS = [
    { value: '0-50',    label: '0 – 50 TND'    },
    { value: '50-100',  label: '50 – 100 TND'  },
    { value: '100-250', label: '100 – 250 TND' },
    { value: '250-500', label: '250 – 500 TND' },
    { value: '500+',    label: '500+ TND'      },
];

const ACCENT = 'var(--workspace-primary,#8b5cf6)';

export default function SearchResults() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { tx, language } = useTranslation();

    const query        = searchParams.get('q')        || '';
    const typeParam    = (searchParams.get('type') as Tab) || 'all';
    const categoryParam = searchParams.get('category') || '';
    const budgetParam  = searchParams.get('budget')   || '';

    const [inputValue, setInputValue]               = useState(query);
    const [activeTab, setActiveTab]                 = useState<Tab>(typeParam);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    const debouncedQuery = useDebounce(query, 300);
    const dateLocale = language === 'ar' ? ar : language === 'fr' ? fr : enUS;

    useEffect(() => {
        setInputValue(query);
        setActiveTab((searchParams.get('type') as Tab) || 'all');
    }, [query, searchParams]);

    const updateParams = (updates: Record<string, string | null>) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([k, v]) => {
            if (!v) next.delete(k); else next.set(k, v);
        });
        setSearchParams(next);
    };

    const handleSearch  = (q: string) => updateParams({ q });
    const handleTab     = (tab: Tab)  => updateParams({ type: tab === 'all' ? null : tab });

    const { data: jobsData,        isLoading: jobsLoading,        error: jobsError }        = useQuery({
        queryKey: ['search-jobs', debouncedQuery, categoryParam, budgetParam],
        queryFn:  () => getJobs({ search: debouncedQuery || undefined, categories: categoryParam ? [categoryParam] : undefined, budgetRange: budgetParam || undefined }, 1, 12),
        enabled:  (activeTab === 'all' || activeTab === 'jobs') && debouncedQuery.length > 0,
        staleTime: 30_000,
    });

    const { data: freelancersData, isLoading: freelancersLoading, error: freelancersError } = useQuery({
        queryKey: ['search-freelancers', debouncedQuery, categoryParam],
        queryFn:  () => getFreelancers({ search: debouncedQuery || undefined }, 1, 12),
        enabled:  (activeTab === 'all' || activeTab === 'freelancers') && debouncedQuery.length > 0,
        staleTime: 30_000,
    });

    const jobs        = jobsData?.data        ?? [];
    const freelancers = (freelancersData?.data ?? []) as any[];
    const totalCount  = jobs.length + freelancers.length;
    const isLoading   = (jobsLoading || freelancersLoading) && debouncedQuery.length > 0;
    const hasError    = jobsError || freelancersError;
    const hasResults  = totalCount > 0;
    const activeFiltersCount = [categoryParam, budgetParam].filter(Boolean).length;

    const trendingTags = [
        { label: 'Logo Design', emoji: '🎨' },
        { label: 'React JS',    emoji: '⚛️' },
        { label: 'Translation', emoji: '🌐' },
        { label: 'UI/UX',       emoji: '✨' },
    ];

    /* ── Sidebar filter panel (reused for desktop & mobile drawer) ── */
    const FilterPanel = () => (
        <div className="space-y-6">
            {/* Category */}
            <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3 flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" />{tx('search.filters.category', undefined, 'Category')}
                </p>
                <div className="space-y-1">
                    {CATEGORIES.map((c) => {
                        const active = categoryParam === c.value;
                        return (
                            <label key={c.value} className="flex items-center gap-2.5 cursor-pointer group rounded-lg px-2 py-1.5 transition-colors hover:bg-white/4">
                                <div
                                    className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all"
                                    style={{
                                        borderColor: active ? ACCENT : 'rgba(255,255,255,0.2)',
                                        background: active ? ACCENT : 'transparent',
                                    }}
                                >
                                    {active && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    <input type="radio" name="category" className="sr-only" checked={active}
                                        onChange={() => updateParams({ category: active ? null : c.value })} />
                                </div>
                                <span className={`text-sm transition-colors ${active ? 'text-white font-semibold' : 'text-white/55 group-hover:text-white/80'}`}>{c.label}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Budget — only for jobs */}
            {(activeTab === 'all' || activeTab === 'jobs') && (
                <div className="pt-5 border-t border-white/8">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3 flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-amber-400" />{tx('search.filters.budgetRange', undefined, 'Budget range')}
                    </p>
                    <div className="space-y-1">
                        {BUDGETS.map((b) => {
                            const active = budgetParam === b.value;
                            return (
                                <label key={b.value} className="flex items-center gap-2.5 cursor-pointer group rounded-lg px-2 py-1.5 transition-colors hover:bg-white/4">
                                    <div
                                        className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all"
                                        style={{
                                            borderColor: active ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                                            background:  active ? '#fbbf24' : 'transparent',
                                        }}
                                    >
                                        {active && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                        <input type="radio" name="budget" className="sr-only" checked={active}
                                            onChange={() => updateParams({ budget: active ? null : b.value })} />
                                    </div>
                                    <span className={`text-sm transition-colors ${active ? 'text-white font-semibold' : 'text-white/55 group-hover:text-white/80'}`}>{b.label}</span>
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

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <SEO {...SEO_CONFIG.search} url="/search" />
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── Search bar ── */}
                <div className="mb-8">
                    <div
                        className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-white/8 p-4"
                        style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(inputValue)}
                                placeholder={tx('globalSearch.placeholder', undefined, 'Search jobs, freelancers, skills...')}
                                className="w-full rounded-xl bg-white/5 border border-white/8 pl-11 pr-10 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[var(--workspace-primary,#8b5cf6)] transition-colors"
                            />
                            {inputValue && (
                                <button onClick={() => setInputValue('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md bg-white/8 text-white/50 hover:text-white transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => handleSearch(inputValue)}
                            className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.97]"
                            style={{ background: 'linear-gradient(135deg,var(--workspace-primary,#8b5cf6),color-mix(in srgb,var(--workspace-primary,#8b5cf6) 70%,#4c1d95))' }}
                        >
                            <Search className="w-4 h-4" />
                            {tx('common.search', undefined, 'Search')}
                        </button>

                        {/* Mobile filter trigger */}
                        <button
                            onClick={() => setIsMobileFiltersOpen(true)}
                            className="sm:hidden flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white/60 hover:text-white transition-all"
                        >
                            <Filter className="w-4 h-4" />
                            {tx('search.filters', undefined, 'Filters')}
                            {activeFiltersCount > 0 && (
                                <span className="rounded-full bg-violet-500/25 border border-violet-500/30 text-violet-300 text-[10px] font-bold px-1.5 py-0.5">{activeFiltersCount}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Layout ── */}
                <div className="flex gap-6 items-start">

                    {/* Desktop sidebar */}
                    <aside className="sticky top-24 hidden md:block w-64 shrink-0">
                        <div className="rounded-2xl border border-white/8 p-5" style={{ background: 'rgba(255,255,255,0.025)' }}>
                            <div className="flex items-center justify-between mb-5">
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
                            <FilterPanel />
                        </div>
                    </aside>

                    {/* Main area */}
                    <div className="flex-1 min-w-0">

                        {/* Tab bar */}
                        <div className="flex gap-1 rounded-2xl border border-white/8 p-1.5 mb-6" style={{ background: 'rgba(255,255,255,0.025)' }}>
                            {(['all', 'jobs', 'freelancers'] as Tab[]).map((tab) => {
                                const active = activeTab === tab;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => handleTab(tab)}
                                        className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                                        style={{
                                            background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                                            color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                                            boxShadow: active ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                                        }}
                                    >
                                        {tab === 'all' ? 'All' : tab === 'jobs' ? 'Jobs' : 'Freelancers'}
                                        {query && !isLoading && (
                                            <span className="ml-1.5 text-[10px] opacity-50">
                                                {tab === 'all' ? totalCount : tab === 'jobs' ? jobs.length : freelancers.length}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Empty (no query) ── */}
                        {!query && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="relative mb-8">
                                    <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(99,102,241,0.08))' }}>
                                        <Search className="w-10 h-10 opacity-60" style={{ color: ACCENT }} />
                                    </div>
                                    <div className="absolute -inset-2 rounded-full blur-xl opacity-20" style={{ background: ACCENT }} />
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
                                        {trendingTags.map(({ label, emoji }) => (
                                            <button
                                                key={label}
                                                onClick={() => handleSearch(label)}
                                                className="group rounded-2xl border border-white/8 bg-white/3 p-4 text-center hover:border-white/16 hover:bg-white/6 hover:-translate-y-0.5 transition-all"
                                            >
                                                <span className="text-2xl mb-2 block">{emoji}</span>
                                                <span className="text-xs font-semibold text-white/60 group-hover:text-white transition-colors">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tips */}
                                <div className="grid sm:grid-cols-3 gap-3 mt-10 w-full max-w-2xl">
                                    {[
                                        { icon: Lightbulb, color: '#8b5cf6', colorBg: 'rgba(139,92,246,0.1)', colorBorder: 'rgba(139,92,246,0.2)', label: 'Tip', text: tx('search.empty.tipSpecific', undefined, 'Be specific with keywords to find the best match faster') },
                                        { icon: TrendingUp, color: '#fbbf24', colorBg: 'rgba(251,191,36,0.08)', colorBorder: 'rgba(251,191,36,0.2)', label: 'Popular', text: tx('search.empty.tipPopular', undefined, 'React and UI/UX design are trending this week') },
                                        { icon: HeartHandshake, color: '#34d399', colorBg: 'rgba(52,211,153,0.08)', colorBorder: 'rgba(52,211,153,0.2)', label: 'Pro Tip', text: tx('search.empty.tipFilters', undefined, 'Use filters to narrow results by budget and category') },
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

                        {/* ── Loading ── */}
                        {isLoading && (
                            <div className="space-y-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="rounded-2xl border border-white/8 p-5 animate-pulse" style={{ background: 'rgba(255,255,255,0.025)' }}>
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white/8 shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-white/8 rounded w-1/4" />
                                                <div className="h-5 bg-white/8 rounded w-3/4" />
                                                <div className="h-3 bg-white/5 rounded w-1/2" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Error ── */}
                        {hasError && !isLoading && (
                            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/6 p-10 text-center">
                                <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-white mb-1">{tx('search.error.title', undefined, 'Something went wrong')}</h3>
                                <p className="text-sm text-white/45 mb-5">{tx('search.error.description', undefined, "We're having trouble searching right now.")}</p>
                                <button onClick={() => window.location.reload()}
                                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/70 hover:text-white transition-all">
                                    {tx('search.error.retry', undefined, 'Try Again')}
                                </button>
                            </div>
                        )}

                        {/* ── No results ── */}
                        {!isLoading && !hasError && !hasResults && query && (
                            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-10 text-center">
                                <div className="relative mb-6 inline-block">
                                    <div className="w-20 h-20 rounded-full bg-amber-400/15 flex items-center justify-center">
                                        <AlertCircle className="w-9 h-9 text-amber-400" />
                                    </div>
                                    <div className="absolute -inset-2 rounded-full blur-xl opacity-20 bg-amber-400" />
                                </div>
                                <h2 className="text-2xl font-black mb-2">
                                    {tx('search.noResults.title', undefined, 'Nothing found for')}{' '}
                                    <span className="text-amber-400">"{query}"</span>
                                </h2>
                                <p className="text-sm text-white/45 max-w-md mx-auto mb-8">
                                    {tx('search.noResults.subtitle', undefined, "Don't worry! Try one of these suggestions:")}
                                </p>

                                <div className="space-y-2.5 max-w-lg mx-auto">
                                    {[
                                        { Icon: Filter,    label: tx('search.noResults.suggestionFiltersTitle', undefined, 'Broaden Your Filters'),      desc: tx('search.noResults.suggestionFiltersBody', undefined, 'Remove budget or category filters'), action: () => updateParams({ category: null, budget: null }) },
                                        { Icon: Sparkles,  label: tx('search.noResults.suggestionKeywordsTitle', undefined, 'Try Alternative Keywords'),   desc: tx('search.noResults.suggestionKeywordsBody', undefined, 'Different wording finds better results'), action: () => handleSearch('freelancer') },
                                        { Icon: TrendingUp,label: tx('search.noResults.suggestionCategoriesTitle', undefined, 'Browse Popular Categories'), desc: tx('search.noResults.suggestionCategoriesBody', undefined, 'Check out trending skills'), action: () => navigate('/jobs') },
                                    ].map(({ Icon, label, desc, action }) => (
                                        <button key={label} onClick={action}
                                            className="group w-full flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 p-4 text-left hover:border-white/15 hover:bg-white/5 transition-all">
                                            <div className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center shrink-0">
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
                                {/* Section label */}
                                <p className="text-xs text-white/35 mb-2">
                                    <span className="font-bold text-white">{totalCount}</span>{' '}results for "<span className="text-violet-300">{query}</span>"
                                </p>

                                {/* Jobs */}
                                {(activeTab === 'all' || activeTab === 'jobs') && jobs.map((job) => {
                                    const postedAt  = job.posted_at ? formatDistanceToNow(new Date(job.posted_at), { addSuffix: true, locale: dateLocale }) : '';
                                    const budgetStr = job.job_type === 'fixed_price'
                                        ? `${job.budget_min ?? '?'} – ${job.budget_max ?? '?'} TND`
                                        : `${job.hourly_rate ?? '?'} TND/hr`;
                                    const isFixed = job.job_type === 'fixed_price';
                                    return (
                                        <article
                                            key={job.id}
                                            onClick={() => navigate(`/jobs/${job.id}`)}
                                            className="group relative rounded-2xl border border-white/8 p-5 cursor-pointer transition-all duration-200 hover:border-white/16 hover:-translate-y-0.5"
                                            style={{ background: 'rgba(255,255,255,0.025)' }}
                                        >
                                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                                style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.04),transparent 60%)' }} />
                                            <div className="relative flex items-start gap-4">
                                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                                                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                                    <Briefcase className="w-5 h-5" style={{ color: ACCENT }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-1.5">
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 block">{job.category}</span>
                                                            <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">{job.title}</h3>
                                                        </div>
                                                        <span className="shrink-0 rounded-xl px-3 py-1 text-xs font-bold border"
                                                            style={{ background: isFixed ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', color: isFixed ? '#60a5fa' : '#34d399', borderColor: isFixed ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)' }}>
                                                            {budgetStr}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/35">
                                                        {job.client?.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.client.location}</span>}
                                                        {postedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{postedAt}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}

                                {/* Freelancers */}
                                {(activeTab === 'all' || activeTab === 'freelancers') && freelancers.map((f) => {
                                    const fp       = f.freelancer_profiles;
                                    const initials = f.full_name?.charAt(0)?.toUpperCase() ?? '?';
                                    return (
                                        <article
                                            key={f.id}
                                            onClick={() => navigate(`/freelancer/${f.id}`)}
                                            className="group relative rounded-2xl border border-white/8 p-5 cursor-pointer transition-all duration-200 hover:border-white/16 hover:-translate-y-0.5"
                                            style={{ background: 'rgba(255,255,255,0.025)' }}
                                        >
                                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                                style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.04),transparent 60%)' }} />
                                            <div className="relative flex items-start gap-4">
                                                {f.avatar_url ? (
                                                    <img src={f.avatar_url} alt={f.full_name}
                                                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white/8 shrink-0 transition-transform group-hover:scale-105" />
                                                ) : (
                                                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold text-white transition-transform group-hover:scale-105"
                                                        style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
                                                        {initials}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-1.5">
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 flex items-center gap-1"><Users className="w-2.5 h-2.5" />Freelancer</span>
                                                            <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">{f.full_name}</h3>
                                                            {fp?.title && <p className="text-xs text-white/45 line-clamp-1">{fp.title}</p>}
                                                        </div>
                                                        {fp?.hourly_rate && (
                                                            <span className="shrink-0 rounded-xl px-3 py-1 text-xs font-bold border border-violet-500/20 bg-violet-500/10 text-violet-300">
                                                                {fp.hourly_rate} TND/hr
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/35">
                                                        {fp?.jobs_completed > 0 && <span className="flex items-center gap-1 text-amber-400/70"><Star className="w-3 h-3 fill-amber-400/70" />{fp.jobs_completed} projects</span>}
                                                        {f.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{f.location}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile filter drawer */}
            {isMobileFiltersOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
                    <div className="absolute inset-x-0 bottom-0 top-16 flex flex-col rounded-t-3xl border border-white/8" style={{ background: '#12121a' }}>
                        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                            <h2 className="text-base font-bold text-white">{tx('search.filtersTitle', undefined, 'Filters')}</h2>
                            <button onClick={() => setIsMobileFiltersOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 text-white/60 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-5">
                            <FilterPanel />
                        </div>
                        <div className="border-t border-white/8 p-5">
                            <button onClick={() => setIsMobileFiltersOpen(false)}
                                className="w-full h-12 rounded-2xl font-bold text-white text-sm"
                                style={{ background: 'linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)' }}>
                                {tx('common.apply', undefined, 'Apply Filters')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
