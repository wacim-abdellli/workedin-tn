import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search,
    Grid3X3,
    List,
    Heart,
    SlidersHorizontal,
} from 'lucide-react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as jobsService from '../services/jobs';
import * as profilesService from '../services/profiles';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { FilterSidebar, JobCard } from '../components/jobs';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../components/ErrorFallback';
import type { JobForCard } from '../components/jobs/JobCard';
import { useTranslation } from '../i18n';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { SkeletonCard } from '../components/common';
import EmptyState from '../components/ui/EmptyState';
import type { Skill } from '../types';
import { cn } from '../lib/utils';
import { canSaveJob, getAccessMessage } from '../lib/marketplaceAccess';

// Types
interface Job {
    id: string;
    client_id: string;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    job_type: 'fixed_price' | 'hourly';
    budget_min?: number;
    budget_max?: number;
    hourly_rate?: number;
    duration?: string;
    experience_level: string;
    required_skills: string[];
    visibility: string;
    status: string;
    proposals_count: number;
    views_count: number;
    posted_at: string;
    deadline?: string;
    client?: {
        id: string;
        full_name: string;
        avatar_url?: string;
        location?: string;
    };
}

// Category options (Values only needed for logic)
const CATEGORY_VALUES = [
    'design', 'development', 'writing', 'translation', 'video', 'marketing', 'data', 'other'
];

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}



// Saved Jobs Sidebar
function SavedJobsSidebar({ savedJobs, onViewJob }: { savedJobs: Job[]; onViewJob: (id: string) => void }) {
    const { t, tx } = useTranslation();
    if (savedJobs.length === 0) return null;

    return (
        <div className="hidden xl:block w-80 flex-shrink-0">
            <div className={cn(
                'sticky top-4 rounded-lg p-5',
                'bg-[var(--card-bg)]',
                'border border-[var(--border)]',
                'shadow-sm dark:shadow-none'
            )}>
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <Heart className="w-4 h-4 text-[var(--color-error)] fill-current" />
                    {t.jobs.savedJobs.title}
                </h3>
                <div className="space-y-2">
                    {savedJobs.slice(0, 5).map(job => (
                        <button
                            key={job.id}
                            type="button"
                            onClick={() => onViewJob(job.id)}
                            aria-label={`View saved job: ${job.title}`}
                            className={cn(
                                'w-full p-3 rounded-lg text-left transition-all',
                                'bg-[var(--input-bg)]',
                                'hover:bg-[var(--surface-bg)]',
                                'border border-transparent hover:border-[var(--border)]'
                            )}
                        >
                            <h4 className="font-medium text-xs line-clamp-1 text-[var(--text-primary)]">{job.title}</h4>
                            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                                {job.job_type === 'fixed_price'
                                    ? `${job.budget_min} - ${job.budget_max} ${tx('common.currency', undefined, 'TND')}`
                                    : `${job.hourly_rate} ${tx('common.currencyPerHour', undefined, 'TND/h')}`
                                }
                            </p>
                        </button>
                    ))}
                </div>
                {savedJobs.length > 5 && (
                    <button className={cn(
                        'w-full text-center text-[var(--workspace-primary)] text-xs font-medium mt-4 p-2 min-h-[44px] rounded transition-colors',
                        'hover:bg-[var(--workspace-primary)]/5 dark:hover:bg-[var(--workspace-primary)]/10'
                    )}>
                        {t.jobs.savedJobs.viewAll} ({savedJobs.length})
                    </button>
                )}
            </div>
        </div>
    );
}

// Skeleton loader removed in favor of shared component

// Main Component
function JobBoard() {
    const navigate = useNavigate();
    const { user, profile, freelancerProfile } = useAuth();
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const { t, language, tx } = useTranslation();
    const queryClient = useQueryClient();
    const saveDecision = canSaveJob({
        isAuthenticated: !!user,
        profile,
        freelancerProfile,
    });

    // State
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Filters from URL params
    const [filters, setFilters] = useState({
        search: searchParams.get('q') || '',
        categories: searchParams.get('cat')?.split(',').filter(Boolean) || [],
        jobType: searchParams.get('type') || null,
        budgetRange: searchParams.get('budget') || null,
        experienceLevels: searchParams.get('exp')?.split(',').filter(Boolean) || [],
        postedWithin: searchParams.get('posted') || 'any',
        sortBy: searchParams.get('sort') || 'newest',
    });

    const debouncedSearch = useDebounce(filters.search, 300);

    const sortOptions = useMemo(() => [
        { value: 'newest', label: t.jobs.sort.newest },
        { value: 'budget_high', label: t.jobs.sort.budgetHigh },
        { value: 'budget_low', label: t.jobs.sort.budgetLow },
        { value: 'proposals_high', label: t.jobs.sort.proposalsHigh },
        { value: 'proposals_low', label: t.jobs.sort.proposalsLow },
    ], [t]);

    // Update URL params
    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.search) params.set('q', filters.search);
        if (filters.categories.length) params.set('cat', filters.categories.join(','));
        if (filters.jobType) params.set('type', filters.jobType);
        if (filters.budgetRange) params.set('budget', filters.budgetRange);
        if (filters.experienceLevels.length) params.set('exp', filters.experienceLevels.join(','));
        if (filters.postedWithin !== 'any') params.set('posted', filters.postedWithin);
        if (filters.sortBy !== 'newest') params.set('sort', filters.sortBy);
        setSearchParams(params, { replace: true });
    }, [filters, setSearchParams]);

    // Fetch jobs
    const {
        data: jobsData,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        error: jobsError,
    } = useInfiniteQuery({
        queryKey: ['jobs', filters, debouncedSearch],
        queryFn: ({ pageParam }) => jobsService.getJobs({ ...filters, search: debouncedSearch }, pageParam as number, 10),
        initialPageParam: 1,
        getNextPageParam: (lastPage: { data: Job[], count: number }, pages: { data: Job[], count: number }[]) =>
            lastPage.data?.length === 10 ? pages.length + 1 : undefined,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
    });

    const jobs = useMemo(() => jobsData?.pages.flatMap((p) => p.data || []) || [], [jobsData]);
    const jobCards = useMemo<JobForCard[]>(
        () => jobs.map((job) => ({
            ...job,
            skills: (job.required_skills || []).map((skill: string | Skill) => {
                if (typeof skill === 'string') {
                    return skill;
                }

                const skillRecord = skill as Skill;
                return language === 'ar'
                    ? skillRecord.name_ar
                    : language === 'fr'
                        ? skillRecord.name_fr
                        : skillRecord.name_en;
            }),
        })),
        [jobs, language]
    );
    const totalCount = jobsData?.pages[0]?.count || 0;
    const isLoading = isFetching && !isFetchingNextPage;

    // Fetch category counts
    const { data: categoryCounts = {} } = useQuery({
        queryKey: ['categoryCounts'],
        queryFn: () => jobsService.getCategoryCounts(CATEGORY_VALUES),
          staleTime: 10 * 60 * 1000, // 10 mins cache to prevent query flood
      });

      // Fetch saved jobs
      const { data: savedJobsData = [] } = useQuery({
          queryKey: ['savedJobs', user?.id],
          queryFn: async () => {
              if (!user) return [];
              const { data } = await profilesService.getSavedJobs(user.id);
              return (data?.map(f => f.jobs).filter(Boolean) as unknown as Job[]) || [];
          },
          enabled: !!user,
          staleTime: 5 * 60 * 1000,
      });
      
      const savedJobs = savedJobsData;
      const savedJobIds = useMemo(() => new Set(savedJobs.map(job => job.id)), [savedJobs]);

    // Toggle save job
    const toggleSaveJobMutation = useMutation({
        mutationFn: async ({ jobId, isSaved }: { jobId: string, isSaved: boolean }) => {
            await profilesService.toggleFavorite(user!.id, jobId, isSaved);
            return { jobId, isSaved };
        },
        onSuccess: ({ isSaved }) => {
            queryClient.invalidateQueries({ queryKey: ['savedJobs', user?.id] });
            showToast(isSaved ? t.jobs.unsave : t.jobs.saved, 'success');
        },
        onError: () => {
             showToast(tx('jobBoard.error', undefined, 'Error'), 'error');
        }
    });

    const toggleSaveJob = useCallback(async (job: JobForCard) => {
        if (!saveDecision.allowed) {
            showToast(getAccessMessage(saveDecision.reason, saveDecision.completion), 'warning');
            if (saveDecision.nextStepPath) {
                navigate(saveDecision.nextStepPath, { state: { from: '/jobs' } });
            }
            return;
        }
        await toggleSaveJobMutation.mutateAsync({ jobId: job.id, isSaved: savedJobIds.has(job.id) });
    }, [navigate, saveDecision, savedJobIds, showToast, toggleSaveJobMutation]);

    const handleJobClick = useCallback((jobId: string) => {
        navigate(`/jobs/${jobId}`);
    }, [navigate]);

    // Update filter
    const updateFilter = (key: string, value: unknown) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Clear all filters
    const clearAllFilters = () => {
        setFilters({
            search: '',
            categories: [],
            jobType: null,
            budgetRange: null,
            experienceLevels: [],
            postedWithin: 'any',
            sortBy: 'newest',
        });
    };

    return (
        <div className="page-enter page-shell transition-colors duration-300">
            <SEO {...SEO_CONFIG.jobs} url="/jobs" canonical="https://khedmetna.tn/jobs" />
            <Header />

            <div className="page-shell-content">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{t.jobs.title}</h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        {tx('jobBoard.subtitle', undefined, 'Browse and apply to freelance opportunities')}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder={t.jobs.searchPlaceholder}
                            className={cn(
                                'w-full rounded-lg border py-3 ps-12 pe-4 text-sm',
                                'bg-[var(--input-bg)]',
                                'border-[var(--input-border)] text-[var(--input-text)]',
                                'placeholder:text-[var(--input-placeholder)]',
                                'focus:outline-none focus:border-[var(--input-border-focus)]',
                                'focus:ring-2 focus:ring-[var(--workspace-primary)]/10'
                            )}
                        />
                    </div>
                </div>

                {/* Mobile Filter/Sort Bar */}
                <div className="lg:hidden flex items-center gap-3 mb-6">
                    <Button
                        variant="outline"
                        onClick={() => setShowMobileFilters(true)}
                        leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                        className="flex-1"
                    >
                        {t.jobs.filters.title}
                    </Button>
                    <select
                        value={filters.sortBy}
                        onChange={(e) => updateFilter('sortBy', e.target.value)}
                        className={cn(
                            'flex-1 rounded-lg border px-3 py-2 text-sm',
                            'bg-[var(--input-bg)] text-[var(--input-text)]',
                            'border-[var(--input-border)]',
                            'focus:outline-none focus:border-[var(--input-border-focus)]'
                        )}
                    >
                        {sortOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-6">
                    {/* Unified Filter Sidebar - Handles both Desktop (Sticky) and Mobile (Drawer) */}
                    <FilterSidebar
                        filters={filters}
                        onFilterChange={updateFilter}
                        categoryCounts={categoryCounts}
                        onClearAll={clearAllFilters}
                        isOpen={showMobileFilters}
                        onClose={() => setShowMobileFilters(false)}
                    />

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Results Bar */}
                        <div className={cn(
                            'flex flex-col gap-3 mb-4 px-4 py-3 rounded-xl',
                            'bg-[var(--card-bg)]',
                            'border border-[var(--border)]/50'
                        )}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-[var(--text-muted)]">
                                    {tx('jobBoard.showing', undefined, 'Showing')} <span className="font-semibold text-[var(--text-primary)]">{totalCount}</span> {tx('jobBoard.jobs', undefined, 'jobs')}
                                </p>
                                <div className="hidden lg:flex items-center gap-3">
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => updateFilter('sortBy', e.target.value)}
                                        className={cn(
                                            'rounded-lg border px-3 py-2 text-sm',
                                            'bg-[var(--input-bg)] text-[var(--input-text)]',
                                            'border-[var(--input-border)]',
                                            'focus:outline-none focus:border-[var(--input-border-focus)]'
                                        )}
                                    >
                                        {sortOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <div className={cn(
                                        'flex overflow-hidden rounded-lg border',
                                        'border-[var(--border)]',
                                        'bg-[var(--card-bg)]'
                                    )}>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('list')}
                                            aria-label={tx('jobBoard.listView', undefined, 'List view')}
                                            aria-pressed={viewMode === 'list'}
                                            className={cn(
                                                'p-2 min-w-[44px] min-h-[44px] transition-colors',
                                                viewMode === 'list'
                                                    ? 'bg-[var(--workspace-primary)]/10 text-[var(--workspace-primary)]'
                                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                            )}
                                        >
                                            <List className="w-6 h-6" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('grid')}
                                            aria-label={tx('jobBoard.gridView', undefined, 'Grid view')}
                                            aria-pressed={viewMode === 'grid'}
                                            className={cn(
                                                'p-2 min-w-[44px] min-h-[44px] transition-colors',
                                                viewMode === 'grid'
                                                    ? 'bg-[var(--workspace-primary)]/10 text-[var(--workspace-primary)]'
                                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                            )}
                                        >
                                            <Grid3X3 className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* Active filter chips */}
                            {(filters.categories.length > 0 || filters.jobType || filters.budgetRange || filters.experienceLevels.length > 0 || filters.search) && (
                                <div className="flex flex-wrap gap-2">
                                    {filters.search && (
                                        <button
                                            onClick={() => updateFilter('search', '')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border"
                                            style={{
                                                background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)',
                                                borderColor: 'color-mix(in srgb, var(--workspace-primary) 25%, transparent)',
                                                color: 'var(--workspace-primary)',
                                            }}
                                        >
                                            "{filters.search}" <span aria-hidden>Ã—</span>
                                        </button>
                                    )}
                                    {filters.categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => updateFilter('categories', filters.categories.filter(c => c !== cat))}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border"
                                            style={{
                                                background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)',
                                                borderColor: 'color-mix(in srgb, var(--workspace-primary) 25%, transparent)',
                                                color: 'var(--workspace-primary)',
                                            }}
                                        >
                                            {cat} <span aria-hidden>Ã—</span>
                                        </button>
                                    ))}
                                    {filters.jobType && (
                                        <button
                                            onClick={() => updateFilter('jobType', null)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border"
                                            style={{
                                                background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)',
                                                borderColor: 'color-mix(in srgb, var(--workspace-primary) 25%, transparent)',
                                                color: 'var(--workspace-primary)',
                                            }}
                                        >
                                            {filters.jobType} <span aria-hidden>Ã—</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={clearAllFilters}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border"
                                        style={{
                                            background: 'var(--color-background-muted)',
                                            borderColor: 'var(--color-border-subtle)',
                                            color: 'var(--color-text-secondary)',
                                        }}
                                    >
                                        {tx('jobBoard.clearAll', undefined, 'Clear all')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Jobs List */}
                        {isLoading && jobs.length === 0 ? (
                            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}>
                                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : jobsError ? (
                            <div className="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-light)] dark:bg-[var(--color-error)]/10 p-6 text-center">
                                <p className="text-[var(--color-error-dark)] dark:text-[var(--color-error)] font-medium">{t.jobs?.loadError || tx('jobBoard.loadError', undefined, 'Failed to load jobs')}</p>
                                <p className="text-[var(--color-error)] text-sm mt-1">{(jobsError as Error)?.message || t.common?.error || tx('jobBoard.unknownError', undefined, 'Unknown error')}</p>
                            </div>
                        ) : jobs.length === 0 ? (
                            <EmptyState
                                icon={Search}
                                title={t.jobs?.empty?.title || tx('jobBoard.emptyTitle', undefined, 'No jobs match your search')}
                                description={tx('jobBoard.emptyDescription', undefined, 'Try different keywords or clear your filters to see more relevant freelance opportunities.')}
                                illustration={(
                                    <svg width="220" height="160" viewBox="0 0 220 160" fill="none" aria-hidden="true">
                                        <rect x="52" y="26" width="102" height="76" rx="18" fill="url(#empty-card)" />
                                        <rect x="68" y="48" width="70" height="8" rx="4" fill="rgba(255,255,255,0.72)" />
                                        <rect x="68" y="64" width="52" height="8" rx="4" fill="rgba(255,255,255,0.48)" />
                                        <path d="M149 95L174 120" stroke="var(--workspace-primary)" strokeWidth="10" strokeLinecap="round" />
                                        <circle cx="132" cy="79" r="30" fill="color-mix(in srgb, var(--workspace-primary) 12%, transparent)" stroke="var(--workspace-primary)" strokeWidth="8" />
                                        <path d="M120 79L128 87L145 70" stroke="var(--workspace-primary)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                                        <defs>
                                            <linearGradient id="empty-card" x1="52" y1="26" x2="154" y2="102" gradientUnits="userSpaceOnUse">
                                                <stop stopColor="var(--workspace-primary)" />
                                                <stop offset="1" stopColor="var(--workspace-accent)" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                )}
                                action={{
                                    label: t.jobs?.empty?.action || tx('jobBoard.clearFilters', undefined, 'Clear filters'),
                                    onClick: clearAllFilters,
                                    variant: 'primary'
                                }}
                                secondaryAction={{
                                    label: tx('jobBoard.browseCategories', undefined, 'Browse Categories'),
                                    onClick: () => navigate('/jobs/new')
                                }}
                            />
                        ) : (
                            <>
                                <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
                                  <div className={`${viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}`}>
                                    {jobCards.map(job => (
                                        <JobCard
                                            key={job.id}
                                            job={job}
                                            isSaved={savedJobIds.has(job.id)}
                                            onToggleSave={toggleSaveJob}
                                            onClick={handleJobClick}
                                        />
                                    ))}
                                </div>
                                </ErrorBoundary>

                                {/* Load More */}
                                {hasNextPage && (
                                    <div className="text-center mt-8">
                                        <Button
                                            variant="outline"
                                            onClick={() => fetchNextPage()}
                                            disabled={isFetchingNextPage}
                                            isLoading={isFetchingNextPage}
                                        >
                                            {isFetchingNextPage ? tx('jobBoard.loading', undefined, 'Loading...') : t.jobs.loadMore}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right Sidebar - Saved Jobs */}
                    <SavedJobsSidebar
                        savedJobs={savedJobs}
                        onViewJob={(id) => navigate(`/jobs/${id}`)}
                    />
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default JobBoard;


