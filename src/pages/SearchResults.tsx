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
    AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { SkeletonCard } from '../components/common';
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
            <SEO {...SEO_CONFIG.search} url="/search" />
            <Header />

            <div className="page-shell-content pt-4 pb-20">
                {/* Search Master Bar (Top) */}
                <div className="mb-8 p-4 md:p-6 lg:p-8 card glass-card border-[color:var(--workspace-primary)]/20 shadow-[0_8px_32px_-12px_rgba(109,40,217,0.15)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[color:var(--workspace-primary)]/5 to-transparent z-0"></div>
                    <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 relative w-full">
                            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--workspace-primary)]" />
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch(inputValue);
                                }}
                                placeholder={tx('globalSearch.placeholder', undefined, 'Search jobs, freelancers, skills...')}
                                className="w-full bg-[var(--surface-bg)] text-lg placeholder:text-muted py-4 pe-4 ps-14 rounded-2xl border border-border focus:border-[color:var(--workspace-primary)]/50 focus:ring-4 focus:ring-[color:var(--workspace-primary)]/10 outline-none transition-all shadow-inner"
                            />
                            {inputValue && (
                                <button onClick={() => setInputValue('')} className="absolute end-4 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <Button 
                            className="w-full md:w-auto py-4 rounded-2xl" 
                            variant="primary"
                            onClick={() => handleSearch(inputValue)}
                        >
                            {tx('common.search', undefined, 'Search')}
                        </Button>
                    </div>

                    {/* Filter triggers for mobile only */}
                    <div className="mt-4 flex md:hidden items-center justify-between">
                        <p className="text-sm text-muted font-medium">
                            {query ? tx('pages.searchModal.resultsCount', { count: totalCount }, `${totalCount} results`) : ''}
                        </p>
                        <Button 
                            variant="outline" 
                            className="bg-[var(--surface-bg)] rounded-xl py-2"
                            onClick={() => setIsMobileFiltersOpen(true)}
                        >
                            <Filter className="w-4 h-4 me-2" />
                            {tx('search.filters', undefined, 'Filters')}
                            {activeFiltersCount > 0 && <span className="ms-2 px-1.5 py-0.5 bg-[color:var(--workspace-primary)] text-white text-[10px] rounded-full">{activeFiltersCount}</span>}
                        </Button>
                    </div>
                </div>

                {/* Master Layout */}
                <div className="flex flex-col md:flex-row gap-8 items-start relative">
                    
                    {/* Sticky Sidebar Filters */}
                    <aside className={`w-full md:w-72 shrink-0 glass-card p-5 rounded-3xl sticky top-24 z-30 transition-transform duration-300 md:translate-x-0 ${isMobileFiltersOpen ? 'fixed inset-x-4 top-24 shadow-2xl elevation-modal translate-x-0' : 'hidden md:block'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-foreground text-lg">{tx('search.filtersTitle', undefined, 'Advanced Filters')}</h3>
                            <button className="md:hidden p-2 rounded-full bg-secondary text-muted" onClick={() => setIsMobileFiltersOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Filter: Category */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted uppercase tracking-wider">{tx('profile.freelancer.category', undefined, 'Category')}</label>
                                <div className="space-y-2">
                                    {CATEGORIES.map(c => (
                                        <label key={c.value} className="flex items-center gap-3 group cursor-pointer">
                                            <div className="relative flex items-center justify-center w-5 h-5 border border-border group-hover:border-[color:var(--workspace-primary)] rounded transition-colors overflow-hidden">
                                                <input 
                                                    type="radio" 
                                                    name="category"
                                                    className="peer absolute inset-0 opacity-0 cursor-pointer"
                                                    checked={categoryParam === c.value}
                                                    onChange={() => updateFilterParams({ category: c.value })}
                                                />
                                                <div className="w-full h-full bg-[color:var(--workspace-primary)] opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform" />
                                                </div>
                                            </div>
                                            <span className={`text-sm transition-colors ${categoryParam === c.value ? 'font-semibold text-foreground' : 'text-secondary group-hover:text-foreground'}`}>
                                                {tx(c.labelKey, undefined, c.labelKey.split('.')[1])}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Filter: Budget */}
                            {(activeTab === 'all' || activeTab === 'jobs') && (
                                <div className="space-y-3 pt-6 border-t border-border/50">
                                    <label className="text-xs font-bold text-muted uppercase tracking-wider">{tx('jobs.budget', undefined, 'Budget')}</label>
                                    <div className="space-y-2">
                                        {BUDGETS.map(b => (
                                            <label key={b.value} className="flex items-center gap-3 group cursor-pointer">
                                                <div className="relative flex items-center justify-center w-5 h-5 border border-border group-hover:border-[color:var(--workspace-primary)] rounded transition-colors overflow-hidden">
                                                    <input 
                                                        type="radio" 
                                                        name="budget"
                                                        className="peer absolute inset-0 opacity-0 cursor-pointer"
                                                        checked={budgetParam === b.value}
                                                        onChange={() => updateFilterParams({ budget: b.value })}
                                                    />
                                                    <div className="w-full h-full bg-[color:var(--workspace-primary)] opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform" />
                                                </div>
                                                </div>
                                                <span className={`text-sm transition-colors ${budgetParam === b.value ? 'font-semibold text-foreground' : 'text-secondary group-hover:text-foreground'}`}>
                                                    {b.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reset Filters */}
                            {activeFiltersCount > 0 && (
                                <Button 
                                    variant="ghost" 
                                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 mt-6"
                                    onClick={() => updateFilterParams({ category: null, budget: null })}
                                >
                                    {tx('search.resetFilters', undefined, 'Clear all filters')}
                                </Button>
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

                        {/* Loading / Empty States */}
                        {!query && (
                            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500 glass-card rounded-3xl border-dashed border-2">
                                <div className="w-24 h-24 rounded-full bg-[color:var(--workspace-primary)]/10 text-[color:var(--workspace-primary)] flex items-center justify-center mb-6">
                                    <Search className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-3">{tx('pages.searchModal.headerHint', undefined, 'Start searching the workspace')}</h3>
                                <p className="text-muted max-w-sm mb-10">{tx('pages.searchModal.tryDifferent', undefined, 'Use exact keywords to directly pinpoint top talent, live projects, or precise skillsets inside Khedma.')}</p>
                                
                                <div className="w-full max-w-md">
                                    <div className="flex items-center gap-2 justify-center mb-4 text-xs font-bold text-muted uppercase tracking-widest">
                                        <TrendingUp className="w-3.5 h-3.5" /> {tx('pages.searchModal.trendingNow', undefined, 'Trending Searches')}
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {trendingTags.map(tag => (
                                            <button 
                                                key={tag}
                                                onClick={() => handleSearch(tag)}
                                                className="px-4 py-2 rounded-xl text-sm font-medium border border-border bg-[var(--surface-bg)] text-secondary hover:text-[color:var(--workspace-primary)] hover:border-[color:var(--workspace-primary)]/40 hover:bg-[color:var(--workspace-primary)]/5 transition-colors"
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        )}

                        {hasError && (
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-500">
                                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-90" />
                                <p className="font-semibold">{tx('common.errorLoading', undefined, 'Failed to load results.')}</p>
                            </div>
                        )}

                        {!isLoading && !hasError && !hasResults && query && (
                            <div className="py-20 text-center glass-card rounded-3xl">
                                <div className="w-16 h-16 rounded-full mx-auto bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                                    <AlertCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">{tx('globalSearch.noResultsFor', { query }, `No results for "${query}"`)}</h3>
                                <p className="text-muted">{tx('search.adjustFilters', undefined, 'Try adjusting your filters or search terms.')}</p>
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
                                        <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="card glass-card hover:border-[color:var(--workspace-primary)]/30 hover:shadow-[0_8px_30px_-15px_rgba(109,40,217,0.2)] cursor-pointer group transition-all duration-300 transform hover:-translate-y-0.5">
                                            <div className="flex items-start gap-4 md:gap-6">
                                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[color:var(--brand-accent)]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                    <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-[color:var(--brand-accent)]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                                                        <div>
                                                            <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-[color:var(--brand-accent)] mb-1 block">{job.category}</span>
                                                            <h3 className="font-bold text-base md:text-xl text-foreground group-hover:text-[color:var(--workspace-primary)] transition-colors line-clamp-1">{job.title}</h3>
                                                        </div>
                                                        <span className="text-[color:var(--workspace-primary)] font-black whitespace-nowrap bg-[color:var(--workspace-primary)]/10 px-3 py-1.5 rounded-xl text-sm shrink-0 self-start">
                                                            {budgetStr}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap items-center gap-3 md:gap-5 mt-4 text-xs md:text-sm text-muted font-medium">
                                                        {job.client?.location && (
                                                            <span className="flex items-center gap-1.5">
                                                                <MapPin className="w-4 h-4" /> {job.client.location}
                                                            </span>
                                                        )}
                                                        {postedAt && (
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock className="w-4 h-4" /> {postedAt}
                                                            </span>
                                                        )}
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
                                        <div key={freelancer.id} onClick={() => navigate(`/freelancer/${freelancer.id}`)} className="card glass-card hover:border-[color:var(--workspace-primary)]/30 hover:shadow-[0_8px_30px_-15px_rgba(109,40,217,0.2)] cursor-pointer group transition-all duration-300 transform hover:-translate-y-0.5">
                                            <div className="flex items-start gap-4 md:gap-6">
                                                {freelancer.avatar_url ? (
                                                    <img src={freelancer.avatar_url} alt={freelancer.full_name} className="w-12 h-12 md:w-16 md:h-16 rounded-2xl object-cover shrink-0 ring-4 ring-transparent group-hover:ring-[color:var(--workspace-primary)]/20 transition-all" />
                                                ) : (
                                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr from-[color:var(--workspace-primary)] to-[color:var(--brand-accent)] flex items-center justify-center text-white font-black text-xl shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                                        {initials}
                                                    </div>
                                                )}
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                                                        <div>
                                                            <h3 className="font-bold text-base md:text-xl text-foreground group-hover:text-[color:var(--workspace-primary)] transition-colors">{freelancer.full_name}</h3>
                                                            {fp?.title && <p className="text-secondary text-sm font-medium mt-0.5 max-w-md line-clamp-1">{fp.title}</p>}
                                                        </div>
                                                        {fp?.hourly_rate && (
                                                            <span className="text-[color:var(--workspace-primary)] font-black whitespace-nowrap bg-[color:var(--workspace-primary)]/10 px-3 py-1.5 rounded-xl text-sm shrink-0 self-start">
                                                                {fp.hourly_rate} {tx('common.tnd', undefined, 'TND')}/hr
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap items-center gap-3 md:gap-5 mt-4 text-xs md:text-sm text-muted font-medium">
                                                        {fp?.jobs_completed > 0 && (
                                                            <span className="flex items-center gap-1.5 text-amber-500">
                                                                <Star className="w-4 h-4 fill-current" /> {fp.jobs_completed} {tx('profile.client.projectsCompleted', undefined, 'Projects')}
                                                            </span>
                                                        )}
                                                        {freelancer.location && (
                                                            <span className="flex items-center gap-1.5">
                                                                <MapPin className="w-4 h-4" /> {freelancer.location}
                                                            </span>
                                                        )}
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
