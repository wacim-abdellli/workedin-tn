import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search,
    Grid3X3,
    List,
    Heart,
    Briefcase,
    SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { FilterSidebar, JobCard } from '../components/jobs';

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

// Category options
const CATEGORIES = [
    { value: 'design', label: 'تصميم', labelEn: 'Design' },
    { value: 'development', label: 'برمجة', labelEn: 'Development' },
    { value: 'writing', label: 'كتابة', labelEn: 'Writing' },
    { value: 'translation', label: 'ترجمة', labelEn: 'Translation' },
    { value: 'video', label: 'فيديو', labelEn: 'Video' },
    { value: 'marketing', label: 'تسويق', labelEn: 'Marketing' },
    { value: 'data', label: 'بيانات', labelEn: 'Data Entry' },
    { value: 'other', label: 'أخرى', labelEn: 'Other' },
];

const BUDGET_RANGES = [
    { value: '0-50', label: '0 - 50 د.ت', min: 0, max: 50 },
    { value: '50-100', label: '50 - 100 د.ت', min: 50, max: 100 },
    { value: '100-250', label: '100 - 250 د.ت', min: 100, max: 250 },
    { value: '250-500', label: '250 - 500 د.ت', min: 250, max: 500 },
    { value: '500+', label: '500+ د.ت', min: 500, max: 999999 },
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'الأحدث أولاً' },
    { value: 'budget_high', label: 'الميزانية: الأعلى' },
    { value: 'budget_low', label: 'الميزانية: الأقل' },
    { value: 'proposals_high', label: 'أكثر العروض' },
    { value: 'proposals_low', label: 'أقل العروض' },
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
    if (savedJobs.length === 0) return null;

    return (
        <div className="hidden xl:block w-80 flex-shrink-0">
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 sticky top-4 border border-gray-100 dark:border-dark-700">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    الوظائف المحفوظة
                </h3>
                <div className="space-y-3">
                    {savedJobs.slice(0, 5).map(job => (
                        <div
                            key={job.id}
                            onClick={() => onViewJob(job.id)}
                            className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <h4 className="font-medium text-sm line-clamp-1">{job.title}</h4>
                            <p className="text-xs text-muted mt-1">
                                {job.job_type === 'fixed_price'
                                    ? `${job.budget_min} د.ت`
                                    : `${job.hourly_rate} د.ت / ساعة`
                                }
                            </p>
                        </div>
                    ))}
                </div>
                {savedJobs.length > 5 && (
                    <button className="w-full text-center text-primary-600 text-sm mt-3 hover:underline">
                        عرض الكل ({savedJobs.length})
                    </button>
                )}
            </div>
        </div>
    );
}

// Skeleton loader
function JobCardSkeleton() {
    return (
        <div className="card animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 rounded-full w-20" />
                <div className="h-6 bg-gray-200 rounded-full w-16" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 rounded w-16" />
                <div className="h-6 bg-gray-200 rounded w-20" />
                <div className="h-6 bg-gray-200 rounded w-14" />
            </div>
            <div className="h-12 bg-gray-200 rounded mt-4" />
        </div>
    );
}

// Main Component
function JobBoard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    // State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
    const [savedJobs, setSavedJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

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
    const fetchJobs = useCallback(async (reset = false) => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('jobs')
                .select(`
    *,
    client: profiles!client_id(id, full_name, avatar_url, location)
                `, { count: 'exact' })
                .eq('status', 'open')
                .eq('visibility', 'public');

            // Search
            if (debouncedSearch) {
                query = query.or(`title.ilike.% ${debouncedSearch}%, description.ilike.% ${debouncedSearch}% `);
            }

            // Category filter
            if (filters.categories.length > 0) {
                query = query.in('category', filters.categories);
            }

            // Job type filter
            if (filters.jobType) {
                query = query.eq('job_type', filters.jobType);
            }

            // Budget range filter
            if (filters.budgetRange) {
                const range = BUDGET_RANGES.find(r => r.value === filters.budgetRange);
                if (range) {
                    query = query.gte('budget_min', range.min).lte('budget_min', range.max);
                }
            }

            // Experience level filter
            if (filters.experienceLevels.length > 0) {
                query = query.in('experience_level', filters.experienceLevels);
            }

            // Posted date filter
            if (filters.postedWithin && filters.postedWithin !== 'any') {
                const now = new Date();
                let since: Date;
                switch (filters.postedWithin) {
                    case '24h': since = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
                    case '3d': since = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); break;
                    case '1w': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
                    case '1m': since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
                    default: since = new Date(0);
                }
                query = query.gte('posted_at', since.toISOString());
            }

            // Sorting
            switch (filters.sortBy) {
                case 'budget_high':
                    query = query.order('budget_max', { ascending: false, nullsFirst: false });
                    break;
                case 'budget_low':
                    query = query.order('budget_min', { ascending: true });
                    break;
                case 'proposals_high':
                    query = query.order('proposals_count', { ascending: false });
                    break;
                case 'proposals_low':
                    query = query.order('proposals_count', { ascending: true });
                    break;
                default:
                    query = query.order('posted_at', { ascending: false });
            }

            // Pagination
            const currentPage = reset ? 1 : page;
            const perPage = 20;
            query = query.range((currentPage - 1) * perPage, currentPage * perPage - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            if (reset) {
                setJobs(data || []);
                setPage(1);
            } else {
                setJobs(prev => [...prev, ...(data || [])]);
            }

            setTotalCount(count || 0);
            setHasMore((data?.length || 0) === perPage);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            showToast('حدث خطأ في تحميل الوظائف', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, filters, page, showToast]);

    // Fetch category counts
    const fetchCategoryCounts = useCallback(async () => {
        try {
            const counts: Record<string, number> = {};
            for (const cat of CATEGORIES) {
                const { count } = await supabase
                    .from('jobs')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'open')
                    .eq('visibility', 'public')
                    .eq('category', cat.value);
                counts[cat.value] = count || 0;
            }
            setCategoryCounts(counts);
        } catch (error) {
            console.error('Error fetching category counts:', error);
        }
    }, []);

    // Fetch saved jobs
    const fetchSavedJobs = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from('favorites')
                .select('job_id, jobs(*)')
                .eq('user_id', user.id)
                .not('job_id', 'is', null);

            if (data) {
                const jobIds = new Set(data.map(f => f.job_id));
                setSavedJobIds(jobIds as Set<string>);
                setSavedJobs(data.map(f => f.jobs).filter(Boolean) as unknown as Job[]);
            }
        } catch (error) {
            console.error('Error fetching saved jobs:', error);
        }
    }, [user]);

    // Initial fetch
    useEffect(() => {
        fetchJobs(true);
        fetchCategoryCounts();
        fetchSavedJobs();
    }, []);

    // Re-fetch on filter change
    useEffect(() => {
        fetchJobs(true);
    }, [debouncedSearch, filters.categories, filters.jobType, filters.budgetRange, filters.experienceLevels, filters.postedWithin, filters.sortBy]);

    // Load more
    const loadMore = () => {
        if (!isLoading && hasMore) {
            setPage(prev => prev + 1);
            fetchJobs(false);
        }
    };

    // Toggle save job
    const toggleSaveJob = async (job: Job) => {
        if (!user) {
            showToast('سجل الدخول لحفظ الوظائف', 'warning');
            return;
        }

        const isSaved = savedJobIds.has(job.id);
        try {
            if (isSaved) {
                await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('job_id', job.id);
                setSavedJobIds(prev => { const next = new Set(prev); next.delete(job.id); return next; });
                setSavedJobs(prev => prev.filter(j => j.id !== job.id));
                showToast('تم إزالة الوظيفة من المحفوظات', 'success');
            } else {
                await supabase
                    .from('favorites')
                    .insert({ user_id: user.id, job_id: job.id });
                setSavedJobIds(prev => new Set(prev).add(job.id));
                setSavedJobs(prev => [job, ...prev]);
                showToast('تم حفظ الوظيفة', 'success');
            }
        } catch (error) {
            showToast('حدث خطأ', 'error');
        }
    };

    // Update filter
    const updateFilter = (key: string, value: any) => {
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
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
            <Header />

            <div className="container-custom py-8">
                {/* Search Bar - Top */}
                <div className="mb-6">
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder="ابحث عن وظائف..."
                            className="w-full ps-12 pe-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-foreground dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
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
                        الفلاتر
                    </Button>
                    <select
                        value={filters.sortBy}
                        onChange={(e) => updateFilter('sortBy', e.target.value)}
                        className="flex-1 py-2 px-3 rounded-xl border border-gray-200 text-sm"
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-6">
                    {/* Left Sidebar - Filters */}
                    <FilterSidebar
                        filters={filters}
                        onFilterChange={updateFilter}
                        categoryCounts={categoryCounts}
                        onClearAll={clearAllFilters}
                    />

                    {/* Mobile Filters Modal */}
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
                                <span className="font-bold text-foreground">{totalCount}</span> وظيفة متاحة
                            </p>
                            <div className="hidden lg:flex items-center gap-3">
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                                    className="py-2 px-3 rounded-lg border border-gray-200 text-sm bg-white"
                                >
                                    {SORT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p - 2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400'} `}
                                    >
                                        <List className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p - 2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400'} `}
                                    >
                                        <Grid3X3 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Jobs List */}
                        {isLoading && jobs.length === 0 ? (
                            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}>
                                {[...Array(6)].map((_, i) => <JobCardSkeleton key={i} />)}
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-16">
                                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-foreground mb-2">لا توجد وظائف</h3>
                                <p className="text-muted mb-4">جرب تغيير معايير البحث أو الفلاتر</p>
                                <Button variant="primary" onClick={clearAllFilters}>
                                    مسح الفلاتر
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'}>
                                    {jobs.map(job => (
                                        <JobCard
                                            key={job.id}
                                            // @ts-ignore - mismatch between local Job type and JobCard Job type
                                            job={{ ...job, skills: job.required_skills || [] }}
                                            isSaved={savedJobIds.has(job.id)}
                                            onToggleSave={() => toggleSaveJob(job)}
                                            onClick={() => navigate(`/jobs/${job.id}`)}
                                        />
                                    ))}
                                </div>

                                {/* Load More */}
                                {hasMore && (
                                    <div className="text-center mt-8">
                                        <Button
                                            variant="outline"
                                            onClick={loadMore}
                                            isLoading={isLoading}
                                        >
                                            تحميل المزيد
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right Sidebar - Saved Jobs */}
                    <SavedJobsSidebar
                        savedJobs={savedJobs}
                        onViewJob={(id) => navigate(`/ jobs / ${id} `)}
                    />
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default JobBoard;
