import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Briefcase,
    Star,
    MapPin,
    Clock,
    X,
    TrendingUp,
    AlertCircle,
    Lightbulb,
    ChevronRight,
    Sparkles,
    HeartHandshake
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import SEO, { SEO_CONFIG } from '../components/common/SEO';

import { getJobs } from '../services/jobs';
import { getFreelancers } from '../services/profiles';
import { useTranslation } from '../i18n';
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';

type Tab = 'all' | 'jobs' | 'freelancers';

// Generic hook
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const h = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(h);
    }, [value, delay]);
    return debounced;
}

const CATEGORIES = [
    { value: 'development', labelKey: 'categories.development' },
    { value: 'design', labelKey: 'categories.design' },
    { value: 'marketing', labelKey: 'categories.marketing' },
    { value: 'writing', labelKey: 'categories.writing' }
];

const BUDGETS = [
    { value: '0-50', label: '0 - 50 TND' },
    { value: '50-100', label: '50 - 100 TND' },
    { value: '100-250', label: '100 - 250 TND' },
    { value: '250-500', label: '250 - 500 TND' },
    { value: '500+', label: '500+ TND' }
];

// Add shimmer animation styles
const SHIMMER_STYLE = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  @keyframes drift {
    0%, 100% {
      transform: translateX(0px);
    }
    50% {
      transform: translateX(4px);
    }
  }
`;

export default function SearchResults() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { tx, language } = useTranslation();

    const query = searchParams.get('q') || '';
    const typeParam = (searchParams.get('type') as Tab) || 'all';
    const categoryParam = searchParams.get('category') || '';
    const budgetParam = searchParams.get('budget') || '';

    const [inputValue, setInputValue] = useState(query);
    const [activeTab, setActiveTab] = useState<Tab>(typeParam);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    const debouncedQuery = useDebounce(query, 300);
    const dateLocale = language === 'ar' ? ar : language === 'fr' ? fr : enUS;

    // React cleanly when URL params change independently
    useEffect(() => {
        setInputValue(query);
        setActiveTab((searchParams.get('type') as Tab) || 'all');
    }, [query, searchParams]);

    const updateFilterParams = (updates: Record<string, string | null>) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, val]) => {
            if (val === null || val === '') {
                next.delete(key);
            } else {
                next.set(key, val);
            }
        });
        setSearchParams(next);
    };

    const handleSearch = (q: string) => {
        updateFilterParams({ q });
    };

    const handleTabChange = (tab: Tab) => {
        updateFilterParams({ type: tab === 'all' ? null : tab });
    };

    // Queries
    const {
        data: jobsData,
        isLoading: jobsLoading,
        error: jobsError,
    } = useQuery({
        queryKey: ['search-jobs', debouncedQuery, categoryParam, budgetParam],
        queryFn: () => getJobs({ 
            search: debouncedQuery || undefined, 
            categories: categoryParam ? [categoryParam] : undefined,
            budgetRange: budgetParam || undefined
        }, 1, 12),
        enabled: (activeTab === 'all' || activeTab === 'jobs') && debouncedQuery.length > 0,
        staleTime: 30_000,
    });

    const {
        data: freelancersData,
        isLoading: freelancersLoading,
        error: freelancersError,
    } = useQuery({
        queryKey: ['search-freelancers', debouncedQuery, categoryParam],
        queryFn: () => getFreelancers({ 
            search: debouncedQuery || undefined,
            // category mapping for freelancer might map to availability or skills
        }, 1, 12),
        enabled: (activeTab === 'all' || activeTab === 'freelancers') && debouncedQuery.length > 0,
        staleTime: 30_000,
    });

    const jobs = jobsData?.data ?? [];
    const freelancers = (freelancersData?.data ?? []) as any[];
    const totalCount = jobs.length + freelancers.length;

    const isLoading = (jobsLoading || freelancersLoading) && debouncedQuery.length > 0;
    const hasError = jobsError || freelancersError;
    const hasResults = totalCount > 0;

    const trendingTags = [
        tx('search.suggestions.logoDesign', undefined, 'Logo Design'),
        tx('search.suggestions.reactJs', undefined, 'React JS'),
        tx('search.suggestions.translation', undefined, 'Translation'),
        'UI/UX'
    ];

    const activeFiltersCount = [categoryParam, budgetParam].filter(Boolean).length;

    return (
        <div className="page-shell bg-[var(--background)]">
            <style>{SHIMMER_STYLE}</style>
            <SEO {...SEO_CONFIG.search} url="/search" />
            <Header />

            <div className="page-shell-content pt-4 pb-20">
                {/* Search Master Bar (Top) */}
                <div className="mb-8 p-4 md:p-6 lg:p-8 card glass-card border-[color:var(--workspace-primary)]/20 shadow-[0_8px_32px_-12px_rgba(109,40,217,0.15)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[color:var(--workspace-primary)]/5 to-transparent z-0"></div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 relative w-full">
                            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--workspace-primary)] group-hover:scale-110 transition-transform" />
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch(inputValue);
                                }}
                                placeholder={tx('globalSearch.placeholder', undefined, 'Search jobs, freelancers, skills...')}
                                className="w-full bg-[var(--surface-bg)] text-lg placeholder:text-muted py-4 pe-4 ps-14 rounded-2xl border border-border focus:border-[color:var(--workspace-primary)]/50 focus:ring-4 focus:ring-[color:var(--workspace-primary)]/10 outline-none transition-all shadow-inner hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(109,40,217,0.1)]"
                            />
                            {inputValue && (
                                <button onClick={() => setInputValue('')} className="absolute end-4 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-foreground hover:bg-[var(--surface-bg)] rounded-lg transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <Button 
                            className="w-full md:w-auto py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" 
                            variant="primary"
                            onClick={() => handleSearch(inputValue)}
                        >
                            <Search className="w-5 h-5 me-2" />
                            {tx('common.search', undefined, 'Search')}
                        </Button>
                    </div>

                    {/* Results Counter & Filter Trigger */}
                    <div className="mt-4 flex md:hidden items-center justify-between">
                        {query && (
                            <p className="text-sm font-semibold text-muted">
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[color:var(--workspace-primary)] animate-pulse" />
                                        {tx('search.status.searching', undefined, 'Searching...')}
                                    </span>
                                ) : totalCount === 0 ? (
                                    tx('search.status.noResults', undefined, 'No results found')
                                ) : (
                                    <span className="text-foreground font-bold">{totalCount} <span className="font-normal text-muted">{tx('search.status.resultsFound', undefined, 'results found')}</span></span>
                                )}
                            </p>
                        )}
                        <Button 
                            variant="outline" 
                            className="bg-[var(--surface-bg)] rounded-xl py-2 hover:bg-[color:var(--workspace-primary)]/10"
                            onClick={() => setIsMobileFiltersOpen(true)}
                        >
                            <Filter className="w-4 h-4 me-2" />
                            {tx('search.filters', undefined, 'Filters')}
                            {activeFiltersCount > 0 && <span className="ms-2 px-1.5 py-0.5 bg-[color:var(--workspace-primary)] text-white text-[10px] rounded-full font-bold">{activeFiltersCount}</span>}
                        </Button>
                    </div>
                </div>

                {/* Master Layout */}
                <div className="flex flex-col md:flex-row gap-8 items-start relative">
                    
                    {/* Sticky Sidebar Filters */}
                    <aside className={`w-full md:w-72 shrink-0 glass-card p-6 rounded-3xl sticky top-24 z-30 transition-all duration-300 md:translate-x-0 ${isMobileFiltersOpen ? 'fixed inset-x-4 top-24 shadow-2xl elevation-modal translate-x-0 max-h-[80vh] overflow-y-auto' : 'hidden md:block'}`}>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="font-black text-foreground text-xl">{tx('search.filtersTitle', undefined, 'Filters')}</h3>
                                <p className="text-xs text-muted mt-1">{tx('search.filtersSubtitle', undefined, 'Fine-tune your search')}</p>
                            </div>
                            <button className="md:hidden p-2 rounded-full bg-[color:var(--workspace-primary)]/10 text-[color:var(--workspace-primary)] hover:bg-[color:var(--workspace-primary)]/20 transition-colors" onClick={() => setIsMobileFiltersOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-8">
                            {/* Filter: Category */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Briefcase className="w-3.5 h-3.5 text-[color:var(--workspace-primary)]" />
                                    {tx('search.filters.category', undefined, 'Category')}
                                </label>
                                <div className="space-y-2.5">
                                    {CATEGORIES.map(c => (
                                        <label key={c.value} className="flex items-center gap-3 group cursor-pointer p-2 rounded-lg hover:bg-[color:var(--workspace-primary)]/5 transition-colors">
                                            <div className="relative flex items-center justify-center w-5 h-5 border-2 border-border group-hover:border-[color:var(--workspace-primary)] rounded-lg transition-all overflow-hidden">
                                                <input 
                                                    type="radio" 
                                                    name="category"
                                                    className="peer absolute inset-0 opacity-0 cursor-pointer"
                                                    checked={categoryParam === c.value}
                                                    onChange={() => updateFilterParams({ category: c.value })}
                                                />
                                                <div className="w-full h-full bg-gradient-to-r from-[color:var(--workspace-primary)] to-[color:var(--brand-accent)] opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                    <div className="w-2.5 h-2.5 rounded-sm bg-white" />
                                                </div>
                                            </div>
                                            <span className={`text-sm font-medium transition-all ${categoryParam === c.value ? 'font-bold text-foreground' : 'text-secondary group-hover:text-foreground'}`}>
                                                {tx(c.labelKey, undefined, c.labelKey.split('.')[1])}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Filter: Budget */}
                            {(activeTab === 'all' || activeTab === 'jobs') && (
                                <div className="space-y-4 pt-8 border-t border-border/50">
                                    <label className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                                        <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                                        {tx('search.filters.budgetRange', undefined, 'Budget Range')}
                                    </label>
                                    <div className="space-y-2.5">
                                        {BUDGETS.map(b => (
                                            <label key={b.value} className="flex items-center gap-3 group cursor-pointer p-2 rounded-lg hover:bg-amber-500/5 transition-colors">
                                                <div className="relative flex items-center justify-center w-5 h-5 border-2 border-border group-hover:border-amber-500 rounded-lg transition-all overflow-hidden">
                                                    <input 
                                                        type="radio" 
                                                        name="budget"
                                                        className="peer absolute inset-0 opacity-0 cursor-pointer"
                                                        checked={budgetParam === b.value}
                                                        onChange={() => updateFilterParams({ budget: b.value })}
                                                    />
                                                    <div className="w-full h-full bg-amber-500 opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                        <div className="w-2.5 h-2.5 rounded-sm bg-white" />
                                                    </div>
                                                </div>
                                                <span className={`text-sm font-medium transition-all ${budgetParam === b.value ? 'font-bold text-foreground' : 'text-secondary group-hover:text-foreground'}`}>
                                                    {b.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reset Filters */}
                            {activeFiltersCount > 0 && (
                                <div className="pt-6 border-t border-border/50">
                                    <Button 
                                        variant="ghost" 
                                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 font-semibold rounded-lg py-2.5"
                                        onClick={() => updateFilterParams({ category: null, budget: null })}
                                    >
                                        <X className="w-4 h-4 me-2" />
                                        {tx('search.resetFilters', undefined, 'Clear all filters')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Results Area */}
                    <div className="flex-1 min-w-0">
                        {/* Tabs Row */}
                        <div className="flex bg-[var(--surface-bg)] rounded-2xl p-1.5 mb-6 border border-border overflow-x-auto hide-scrollbar">
                            {(['all', 'jobs', 'freelancers'] as Tab[]).map((tab) => (
                                <button
                                    key={tab}
                                    className={`flex-1 min-w-[120px] whitespace-nowrap text-sm font-semibold rounded-xl py-2.5 px-4 transition-all duration-200 ${
                                        activeTab === tab 
                                        ? 'bg-[var(--card-bg)] shadow-md text-foreground ring-1 ring-[color:var(--workspace-primary)]/10' 
                                        : 'text-muted hover:text-foreground hover:bg-[color:var(--workspace-primary)]/5'
                                    }`}
                                    onClick={() => handleTabChange(tab)}
                                >
                                    {tx(`search.tabs.${tab}`, undefined, tab.charAt(0).toUpperCase() + tab.slice(1))}
                                </button>
                            ))}
                        </div>

                        {/* Empty Search State - Welcome Screen */}
                        {!query && (
                            <div className="relative">
                                {/* Animated Background Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--workspace-primary)]/5 via-transparent to-[color:var(--brand-accent)]/5 rounded-3xl blur-3xl -z-10" />
                                
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    {/* Icon with Animation */}
                                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[color:var(--workspace-primary)]/20 to-[color:var(--brand-accent)]/20 flex items-center justify-center mb-8 animate-pulse">
                                        <div className="absolute inset-4 bg-gradient-to-tr from-[color:var(--workspace-primary)]/10 to-transparent rounded-full animate-spin" style={{ animationDuration: '6s' }} />
                                        <Search className="w-14 h-14 text-[color:var(--workspace-primary)] relative z-10" />
                                    </div>

                                    {/* Main Message */}
                                    <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 max-w-xl leading-tight">
                                        {tx('search.empty.titlePrefix', undefined, 'Find Your Perfect')} <span className="bg-gradient-to-r from-[color:var(--workspace-primary)] to-[color:var(--brand-accent)] bg-clip-text text-transparent">{tx('search.empty.titleHighlight', undefined, 'Match')}</span>
                                    </h2>
                                    
                                    {/* Subtitle */}
                                    <p className="text-lg text-muted max-w-2xl mb-4 leading-relaxed">
                                        {tx('search.empty.subtitle', undefined, "Discover talented freelancers and amazing projects in just a few clicks. Whether you're looking for a React expert or a logo designer, we'll help you find exactly what you need.")}
                                    </p>

                                    {/* Trending Section */}
                                    <div className="w-full max-w-2xl mt-12">
                                        <div className="flex items-center gap-2 justify-center mb-6 text-sm font-bold text-muted uppercase tracking-widest">
                                            <Sparkles className="w-4 h-4 text-[color:var(--workspace-primary)]" /> {tx('search.empty.trendingTitle', undefined, 'Trending Right Now')}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {trendingTags.map((tag, idx) => (
                                                <button 
                                                    key={tag}
                                                    onClick={() => handleSearch(tag)}
                                                    className="group relative p-4 rounded-2xl border border-border bg-[var(--surface-bg)] text-foreground hover:border-[color:var(--workspace-primary)]/60 hover:shadow-lg hover:shadow-[color:var(--workspace-primary)]/10 transition-all duration-300 overflow-hidden"
                                                    style={{ animationDelay: `${idx * 50}ms` }}
                                                >
                                                    {/* Hover glow effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[color:var(--workspace-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-full group-hover:translate-x-0" />
                                                    
                                                    <div className="relative flex flex-col items-center gap-2">
                                                        <span className="text-xl md:text-2xl">
                                                            {tag === 'Logo Design' ? '🎨' : tag === 'React JS' ? '⚛️' : tag === 'Translation' ? '🌐' : '✨'}
                                                        </span>
                                                        <span className="text-xs md:text-sm font-semibold line-clamp-2 group-hover:text-[color:var(--workspace-primary)] transition-colors">{tag}</span>
                                                        <ChevronRight className="w-3 h-3 mt-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tips Section */}
                                    <div className="grid md:grid-cols-3 gap-4 mt-16 w-full max-w-3xl">
                                        <div className="p-5 rounded-2xl border border-[color:var(--workspace-primary)]/20 bg-[color:var(--workspace-primary)]/5 text-start">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-lg bg-[color:var(--workspace-primary)]/20 flex items-center justify-center">
                                                    <Lightbulb className="w-4 h-4 text-[color:var(--workspace-primary)]" />
                                                </div>
                                                <span className="text-xs font-bold text-[color:var(--workspace-primary)] uppercase">Tip</span>
                                            </div>
                                            <p className="text-sm text-secondary leading-relaxed">{tx('search.empty.tipSpecific', undefined, 'Be specific with keywords to find the best match faster')}</p>
                                        </div>

                                        <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-start">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                                    <TrendingUp className="w-4 h-4 text-amber-500" />
                                                </div>
                                                <span className="text-xs font-bold text-amber-500 uppercase">Popular</span>
                                            </div>
                                            <p className="text-sm text-secondary leading-relaxed">{tx('search.empty.tipPopular', undefined, 'React and UI/UX design are trending this week')}</p>
                                        </div>

                                        <div className="p-5 rounded-2xl border border-green-500/20 bg-green-500/5 text-start">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                                    <HeartHandshake className="w-4 h-4 text-green-500" />
                                                </div>
                                                <span className="text-xs font-bold text-green-500 uppercase">{tx('search.empty.proTipLabel', undefined, 'Pro Tip')}</span>
                                            </div>
                                            <p className="text-sm text-secondary leading-relaxed">{tx('search.empty.tipFilters', undefined, 'Use filters to narrow results by budget and category')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="flex items-center gap-2 mb-6 opacity-60">
                                    <div className="w-2 h-2 rounded-full bg-[color:var(--workspace-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-[color:var(--workspace-primary)] animate-bounce" style={{ animationDelay: '100ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-[color:var(--workspace-primary)] animate-bounce" style={{ animationDelay: '200ms' }} />
                                    <span className="text-sm text-muted ms-2">{tx('search.loading.bestMatches', undefined, 'Searching for the best matches...')}</span>
                                </div>
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="card glass-card p-6 animate-pulse">
                                        <div className="flex items-start gap-4 md:gap-6">
                                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[var(--surface-bg)] shrink-0" />
                                            <div className="flex-1">
                                                <div className="h-4 bg-[var(--surface-bg)] rounded-lg w-20 mb-3" />
                                                <div className="h-6 bg-[var(--surface-bg)] rounded-lg w-3/4 mb-4" />
                                                <div className="flex gap-4">
                                                    <div className="h-4 bg-[var(--surface-bg)] rounded w-24" />
                                                    <div className="h-4 bg-[var(--surface-bg)] rounded w-32" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {hasError && (
                            <div className="rounded-3xl border-2 border-dashed border-red-300 dark:border-red-800 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40 p-12 text-center animate-in fade-in duration-300">
                                <div className="flex justify-center mb-6">
                                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-2">{tx('search.error.title', undefined, 'Something went wrong')}</h3>
                                <p className="text-muted max-w-md mx-auto mb-6">{tx('search.error.description', undefined, "We're having trouble searching right now. Please try again in a moment.")}</p>
                                <Button 
                                    variant="outline" 
                                    className="px-6 py-3 rounded-xl"
                                    onClick={() => window.location.reload()}
                                >
                                    <Search className="w-4 h-4 me-2" />
                                    {tx('search.error.retry', undefined, 'Try Again')}
                                </Button>
                            </div>
                        )}

                        {!isLoading && !hasError && !hasResults && query && (
                            <div className="py-16 px-6">
                                {/* No Results Container */}
                                <div className="rounded-3xl border-2 border-dashed border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-12 text-center">
                                    
                                    {/* Illustration */}
                                    <div className="flex justify-center mb-8">
                                        <div className="relative w-28 h-28">
                                            <div className="absolute inset-0 bg-amber-300/20 rounded-full blur-2xl animate-pulse" />
                                            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg">
                                                <AlertCircle className="w-12 h-12 text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Message - Empathetic */}
                                    <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">
                                        {tx('search.noResults.title', undefined, 'Hmm, nothing found for')} <span className="text-amber-600 dark:text-amber-400">"{query}"</span>
                                    </h2>
                                    
                                    {/* Supportive Message */}
                                    <p className="text-lg text-muted max-w-lg mx-auto mb-8 leading-relaxed">
                                        {tx('search.noResults.subtitle', undefined, "Don't worry! Let's help you find what you're looking for. Try one of these suggestions:")}
                                    </p>

                                    {/* Suggestions Grid */}
                                    <div className="space-y-4 max-w-2xl mx-auto mb-10">
                                        {/* Suggestion 1: Adjust Filters */}
                                        <div className="p-5 rounded-2xl border border-amber-300 dark:border-amber-800 bg-white/50 dark:bg-foreground/5 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group text-start"
                                             onClick={() => setIsMobileFiltersOpen(true)}>
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-colors">
                                                    <Filter className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-foreground mb-1">{tx('search.noResults.suggestionFiltersTitle', undefined, 'Broaden Your Filters')}</h4>
                                                    <p className="text-sm text-secondary">{tx('search.noResults.suggestionFiltersBody', undefined, 'Try removing budget or category filters to see more results')}</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-muted group-hover:text-amber-600 transition-colors shrink-0 group-hover:translate-x-1" />
                                            </div>
                                        </div>

                                        {/* Suggestion 2: Try Similar Search */}
                                        <div className="p-5 rounded-2xl border border-orange-300 dark:border-orange-800 bg-white/50 dark:bg-foreground/5 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group text-start"
                                             onClick={() => handleSearch('freelancer')}>
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
                                                    <Sparkles className="w-5 h-5 text-orange-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-foreground mb-1">{tx('search.noResults.suggestionKeywordsTitle', undefined, 'Try Alternative Keywords')}</h4>
                                                    <p className="text-sm text-secondary">{tx('search.noResults.suggestionKeywordsBody', undefined, 'Sometimes different wording finds better results')}</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-muted group-hover:text-orange-600 transition-colors shrink-0 group-hover:translate-x-1" />
                                            </div>
                                        </div>

                                        {/* Suggestion 3: Browse Category */}
                                        <div className="p-5 rounded-2xl border border-red-300 dark:border-red-800 bg-white/50 dark:bg-foreground/5 hover:border-red-400 hover:shadow-md transition-all cursor-pointer group text-start"
                                             onClick={() => updateFilterParams({ category: 'development' })}>
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                                                    <TrendingUp className="w-5 h-5 text-red-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-foreground mb-1">{tx('search.noResults.suggestionCategoriesTitle', undefined, 'Browse Popular Categories')}</h4>
                                                    <p className="text-sm text-secondary">{tx('search.noResults.suggestionCategoriesBody', undefined, 'Check out trending skills and categories')}</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-muted group-hover:text-red-600 transition-colors shrink-0 group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Help Message */}
                                    <div className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white/60 dark:bg-foreground/10 border border-amber-200 dark:border-amber-800">
                                        <HeartHandshake className="w-4 h-4 text-[color:var(--workspace-primary)]" />
                                        <p className="text-sm font-medium text-secondary">{tx('search.noResults.helpCta', undefined, 'Still need help? Contact our support team')}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rendering Jobs */}
                        {!isLoading && query && (
                            <div className="space-y-4">
                                {(activeTab === 'all' || activeTab === 'jobs') && jobs.map(job => {
                                    const postedAt = job.posted_at ? formatDistanceToNow(new Date(job.posted_at), { addSuffix: true, locale: dateLocale }) : '';
                                    const budgetStr = job.job_type === 'fixed_price' 
                                        ? `${job.budget_min ?? '?'} - ${job.budget_max ?? '?'} ${tx('common.tnd', undefined, 'TND')}`
                                        : `${job.hourly_rate ?? '?'} ${tx('common.tnd', undefined, 'TND')}/hr`;
                                    
                                    return (
                                        <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="group cursor-pointer">
                                            <div className="card glass-card hover:border-[color:var(--workspace-primary)]/40 hover:shadow-[0_12px_40px_-8px_rgba(109,40,217,0.2)] dark:hover:shadow-[0_12px_40px_-8px_rgba(109,40,217,0.25)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                                                {/* Shine Effect on Hover */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 dark:group-hover:opacity-5 transition-opacity duration-300 -translate-x-full group-hover:translate-x-full" style={{ animation: 'shimmer 0.6s ease-in-out' }} />
                                                
                                                <div className="flex items-start gap-4 md:gap-6">
                                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[color:var(--brand-accent)]/20 to-[color:var(--brand-accent)]/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                                                        <Briefcase className="w-6 h-6 md:w-7 md:h-7 text-[color:var(--brand-accent)]" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-[10px] md:text-xs font-black tracking-widest uppercase text-[color:var(--brand-accent)] mb-1 block group-hover:text-[color:var(--workspace-primary)] transition-colors">{job.category}</span>
                                                                <h3 className="font-black text-base md:text-lg text-foreground group-hover:text-[color:var(--workspace-primary)] transition-colors line-clamp-2 leading-tight">{job.title}</h3>
                                                            </div>
                                                            <span className="text-[color:var(--workspace-primary)] font-black whitespace-nowrap bg-gradient-to-r from-[color:var(--workspace-primary)]/15 to-[color:var(--brand-accent)]/10 border border-[color:var(--workspace-primary)]/30 px-3 py-1.5 rounded-xl text-sm md:text-base shrink-0 group-hover:border-[color:var(--workspace-primary)]/60 group-hover:shadow-md transition-all">
                                                                {budgetStr}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs md:text-sm text-muted font-medium">
                                                            {job.client?.location && (
                                                                <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                                                                    <MapPin className="w-4 h-4 text-[color:var(--workspace-primary)]/60" /> {job.client.location}
                                                                </span>
                                                            )}
                                                            {postedAt && (
                                                                <span className="flex items-center gap-1.5 text-secondary hover:text-foreground transition-colors">
                                                                    <Clock className="w-4 h-4 text-[color:var(--workspace-primary)]/60" /> {postedAt}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}

                                {(activeTab === 'all' || activeTab === 'freelancers') && freelancers.map(freelancer => {
                                    const fp = freelancer.freelancer_profiles;
                                    const initials = freelancer.full_name?.charAt(0)?.toUpperCase() ?? '?';
                                    
                                    return (
                                        <div key={freelancer.id} onClick={() => navigate(`/freelancer/${freelancer.id}`)} className="group cursor-pointer">
                                            <div className="card glass-card hover:border-[color:var(--workspace-primary)]/40 hover:shadow-[0_12px_40px_-8px_rgba(109,40,217,0.2)] dark:hover:shadow-[0_12px_40px_-8px_rgba(109,40,217,0.25)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                                                {/* Shine Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 dark:group-hover:opacity-5 transition-opacity duration-300 -translate-x-full group-hover:translate-x-full" style={{ animation: 'shimmer 0.6s ease-in-out' }} />
                                                
                                                <div className="flex items-start gap-4 md:gap-6">
                                                    {freelancer.avatar_url ? (
                                                        <img src={freelancer.avatar_url} alt={freelancer.full_name} className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover shrink-0 ring-4 ring-transparent group-hover:ring-[color:var(--workspace-primary)]/30 transition-all duration-300 group-hover:scale-110" />
                                                    ) : (
                                                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[color:var(--workspace-primary)] to-[color:var(--brand-accent)] flex items-center justify-center text-white font-black text-xl shrink-0 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                                                            {initials}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-black text-base md:text-lg text-foreground group-hover:text-[color:var(--workspace-primary)] transition-colors">{freelancer.full_name}</h3>
                                                                {fp?.title && <p className="text-secondary text-xs md:text-sm font-semibold mt-0.5 max-w-md line-clamp-1 group-hover:text-foreground transition-colors">{fp.title}</p>}
                                                            </div>
                                                            {fp?.hourly_rate && (
                                                                <span className="text-[color:var(--workspace-primary)] font-black whitespace-nowrap bg-gradient-to-r from-[color:var(--workspace-primary)]/15 to-[color:var(--brand-accent)]/10 border border-[color:var(--workspace-primary)]/30 px-3 py-1.5 rounded-xl text-sm md:text-base shrink-0 group-hover:border-[color:var(--workspace-primary)]/60 group-hover:shadow-md transition-all">
                                                                    {fp.hourly_rate} {tx('common.tnd', undefined, 'TND')}/hr
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs md:text-sm text-muted font-medium">
                                                            {fp?.jobs_completed > 0 && (
                                                                <span className="flex items-center gap-1.5 text-amber-500 font-semibold group-hover:text-amber-600 transition-colors">
                                                                    <Star className="w-4 h-4 fill-current" /> {fp.jobs_completed} {tx('profile.client.projectsCompleted', undefined, 'Projects')}
                                                                </span>
                                                            )}
                                                            {freelancer.location && (
                                                                <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                                                                    <MapPin className="w-4 h-4 text-[color:var(--workspace-primary)]/60" /> {freelancer.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>
            {isMobileFiltersOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsMobileFiltersOpen(false)} />}
            <Footer />
        </div>
    );
}
