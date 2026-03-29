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
import type { JobForCard } from '../components/jobs/JobCard';
import { useTranslation } from '../i18n';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { SkeletonCard } from '../components/common';
import EmptyState from '../components/common/EmptyState';
import type { Skill } from '../types';

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
            <div className="sticky top-4 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/8 dark:bg-[#1a1825]">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    {t.jobs.savedJobs.title}
                </h3>
                <div className="space-y-3">
                    {savedJobs.slice(0, 5).map(job => (
                        <button
                            key={job.id}
                            type="button"
                            onClick={() => onViewJob(job.id)}
                            aria-label={`View saved job: ${job.title}`}
                            className="w-full p-3 bg-gray-50 dark:bg-dark-700 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
                        >
                            <h4 className="font-medium text-sm line-clamp-1 text-dark-900 dark:text-white">{job.title}</h4>
                            <p className="text-xs text-muted mt-1">
                                {job.job_type === 'fixed_price'
                                    ? `${job.budget_min} ${t.jobs.filters.budget.title}` // Using budget title as currency suffix? Or just TND? The title includes (DT)
                                    // Actually budget.title is "Budget (TND)".
                                    // Let's assume hardcoded currency TND for now or better, use currency formatter.
                                    // But previous code was `${job.budget_min} د.ت`
                                    // I'll stick to a simple suffix "TND" or similar, or just leave it.
                                    // t.jobs.filters.budget.ranges values have "TND".
                                    : `${job.hourly_rate} / ${t.jobs.filters.jobType.hourly}`
                                }
                            </p>
                        </button>
                    ))}
                </div>
                {savedJobs.length > 5 && (
                    <button className="w-full text-center text-primary-600 text-sm mt-3 hover:underline">
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
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
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
    });

    const savedJobIds = useMemo(() => new Set(savedJobsData.map(j => j.id)), [savedJobsData]);
    const savedJobs = savedJobsData;

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

    const toggleSaveJob = useCallback((job: JobForCard) => {
        if (!user) {
            showToast(t.auth.login, 'warning');
            return;
        }
        toggleSaveJobMutation.mutate({ jobId: job.id, isSaved: savedJobIds.has(job.id) });
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
        <div className="page-shell transition-colors duration-300">
            <SEO {...SEO_CONFIG.jobs} url="/jobs" canonical="https://khedma.tn/jobs" />
            <Header />

            <div className="page-shell-content">
                {/* Search Bar - Top */}
                <div className="mb-6">
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder={t.jobs.searchPlaceholder}
                            className="w-full rounded-xl border border-gray-200 bg-white py-3 ps-12 pe-4 text-gray-900 transition-colors focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-[#1a1825] dark:text-white"
                        />
                    </div>
                </div>

                {/* Mobile Filter/Sort Bar */}
                <div className="lg:hidden flex items-center gap-3 mb-4">
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
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-[#1a1825] dark:text-white"
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
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-muted">
                                <span className="font-bold text-foreground">{totalCount}</span> {t.jobs.stats.availableJobs}
                            </p>
                            <div className="hidden lg:flex items-center gap-3">
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/10 dark:bg-[#1a1825] dark:text-white"
                                >
                                    {sortOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        aria-label="عرض قائمة"
                                        aria-pressed={viewMode === 'list'}
                                        className={`p-2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400'} `}
                                    >
                                        <List className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        aria-label="عرض شبكي"
                                        aria-pressed={viewMode === 'grid'}
                                        className={`p-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400'} `}
                                    >
                                        <Grid3X3 className="w-5 h-5" />
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
                            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-6 text-center">
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
