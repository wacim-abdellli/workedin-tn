import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import EmptyState from '../components/common/EmptyState';
import type { Skill } from '../types';
import { cn } from '../lib/utils';

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
    const { t } = useTranslation();
    if (savedJobs.length === 0) return null;

    return (
        <div className="hidden xl:block w-80 flex-shrink-0">
            <div className={cn(
                'sticky top-4 rounded-lg p-5',
                'bg-card',
                'border border-border',
                'shadow-sm dark:shadow-none'
            )}>
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm text-foreground">
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
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
                                'bg-input',
                                'hover:bg-surface',
                                'border border-transparent hover:border-border'
                            )}
                        >
                            <h4 className="font-medium text-xs line-clamp-1 text-foreground">{job.title}</h4>
                            <p className="text-[11px] text-muted mt-1.5">
                                {job.job_type === 'fixed_price'
                                    ? `${job.budget_min} - ${job.budget_max} TND`
                                    : `${job.hourly_rate} TND/h`
                                }
                            </p>
                        </button>
                    ))}
                </div>
                {savedJobs.length > 5 && (
                    <button className={cn(
                        'w-full text-center text-[color:var(--workspace-primary)] text-xs font-medium mt-4 p-2 min-h-[44px] rounded transition-colors',
                        'hover:bg-[color:var(--workspace-primary)]/5 dark:hover:bg-[color:var(--workspace-primary)]/10'
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
    const { user } = useAuth();
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const { t, language } = useTranslation();
    const tr = (ar: string, en: string, fr?: string) => language === "ar" ? ar : language === "fr" ? (fr || en) : en;
    const queryClient = useQueryClient();

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
             showToast('Error', 'error');
        }
    });

    const toggleSaveJob = useCallback(async (job: JobForCard) => {
        if (!user) {
            showToast(t.auth.login, 'warning');
            return;
        }
        await toggleSaveJobMutation.mutateAsync({ jobId: job.id, isSaved: savedJobIds.has(job.id) });
    }, [savedJobIds, showToast, t.auth.login, toggleSaveJobMutation, user]);

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
            <SEO {...SEO_CONFIG.jobs} url="/jobs" canonical="https://khedma.tn/jobs" />
            <Header />

            <div className="page-shell-content">
                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{t.jobs.title}</h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        {tr("تصفح وقدم على فرص العمل المستقل", "Browse and apply to freelance opportunities", "Parcourez et postulez aux offres")}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder={t.jobs.searchPlaceholder}
                            className={cn(
                                'w-full rounded-lg border py-3 ps-12 pe-4 text-sm',
                                'bg-card',
                                'border-border text-foreground',
                                'focus:outline-none focus:border-[color:var(--workspace-primary)]',
                                'focus:ring-2 focus:ring-[color:var(--workspace-primary)]/10'
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
                            'flex-1 rounded-lg border bg-input px-3 py-2 text-sm text-foreground',
                            'border-border',
                            'bg-card text-foreground'
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
                            'flex items-center justify-between mb-4 px-4 py-3 rounded-xl',
                            'bg-card',
                            'border border-border/50'
                        )}>
                            <p className="text-sm text-[var(--text-muted)]">
                                Showing <span className="font-semibold text-[var(--text-primary)]">{totalCount}</span> jobs
                            </p>
                            <div className="hidden lg:flex items-center gap-3">
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                                    className={cn(
                                        'rounded-lg border px-3 py-2 text-sm',
                                        'bg-card',
                                        'border-border text-foreground',
                                        'focus:outline-none focus:border-[color:var(--workspace-primary)]'
                                    )}
                                >
                                    {sortOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <div className={cn(
                                    'flex overflow-hidden rounded-lg border',
                                    'border-[var(--border)]',
                                    'bg-[var(--surface-bg)]'
                                )}>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        aria-label="عرض قائمة"
                                        aria-pressed={viewMode === 'list'}
                                        className={cn(
                                            'p-2 min-w-[44px] min-h-[44px] transition-colors',
                                            viewMode === 'list'
                                                ? 'bg-[color:var(--workspace-primary)]/10 text-[color:var(--workspace-primary)]'
                                                : 'text-muted hover:text-foreground'
                                        )}
                                    >
                                        <List className="w-6 h-6" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        aria-label="عرض شبكي"
                                        aria-pressed={viewMode === 'grid'}
                                        className={cn(
                                            'p-2 min-w-[44px] min-h-[44px] transition-colors',
                                            viewMode === 'grid'
                                                ? 'bg-[color:var(--workspace-primary)]/10 text-[color:var(--workspace-primary)]'
                                                : 'text-muted hover:text-foreground'
                                        )}
                                    >
                                        <Grid3X3 className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Jobs List */}
                        {isLoading && jobs.length === 0 ? (
                            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}>
                                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : jobsError ? (
                            <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-6 text-center">
                                <p className="text-red-600 dark:text-red-400 font-medium">{t.jobs?.loadError || 'Failed to load jobs'}</p>
                                <p className="text-red-500 dark:text-red-500 text-sm mt-1">{(jobsError as Error)?.message || t.common?.error || 'Unknown error'}</p>
                            </div>
                        ) : jobs.length === 0 ? (
                            <EmptyState
                                icon={Search}
                                title={t.jobs?.empty?.title || 'No jobs match your search'}
                                description="Try different keywords or clear your filters to see more relevant freelance opportunities."
                                illustration={(
                                    <svg width="220" height="160" viewBox="0 0 220 160" fill="none" aria-hidden="true">
                                        <rect x="52" y="26" width="102" height="76" rx="18" fill="url(#empty-card)" />
                                        <rect x="68" y="48" width="70" height="8" rx="4" fill="rgba(255,255,255,0.72)" />
                                        <rect x="68" y="64" width="52" height="8" rx="4" fill="rgba(255,255,255,0.48)" />
                                        <path d="M149 95L174 120" stroke="#8B5CF6" strokeWidth="10" strokeLinecap="round" />
                                        <circle cx="132" cy="79" r="30" fill="rgba(139,92,246,0.12)" stroke="#8B5CF6" strokeWidth="8" />
                                        <path d="M120 79L128 87L145 70" stroke="#8B5CF6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                                        <defs>
                                            <linearGradient id="empty-card" x1="52" y1="26" x2="154" y2="102" gradientUnits="userSpaceOnUse">
                                                <stop stopColor="#8B5CF6" />
                                                <stop offset="1" stopColor="#F59E0B" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                )}
                                action={{
                                    label: t.jobs?.empty?.action || 'Clear filters',
                                    onClick: clearAllFilters,
                                    variant: 'primary'
                                }}
                                secondaryAction={{
                                    label: "تصفح الفئات",
                                    onClick: () => navigate('/jobs/new')
                                }}
                            />
                        ) : (
                            <>
                                <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
                                  <div className={`${viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'} cv-auto`}>
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
                                            {isFetchingNextPage ? 'Loading...' : t.jobs.loadMore}
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

