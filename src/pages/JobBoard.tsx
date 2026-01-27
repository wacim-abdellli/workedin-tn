import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search,
    Filter,
    Grid3X3,
    List,
    Heart,
    MapPin,
    Clock,
    ChevronDown,
    ChevronUp,
    X,
    Briefcase,
    DollarSign,
    Users,
    SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

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

const EXPERIENCE_LEVELS = [
    { value: 'beginner', label: 'مبتدئ' },
    { value: 'intermediate', label: 'متوسط' },
    { value: 'expert', label: 'خبير' },
];

const BUDGET_RANGES = [
    { value: '0-50', label: '0 - 50 د.ت', min: 0, max: 50 },
    { value: '50-100', label: '50 - 100 د.ت', min: 50, max: 100 },
    { value: '100-250', label: '100 - 250 د.ت', min: 100, max: 250 },
    { value: '250-500', label: '250 - 500 د.ت', min: 250, max: 500 },
    { value: '500+', label: '500+ د.ت', min: 500, max: 999999 },
];

const POSTED_OPTIONS = [
    { value: '24h', label: 'آخر 24 ساعة' },
    { value: '3d', label: 'آخر 3 أيام' },
    { value: '1w', label: 'آخر أسبوع' },
    { value: '1m', label: 'آخر شهر' },
    { value: 'any', label: 'أي وقت' },
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'الأحدث أولاً' },
    { value: 'budget_high', label: 'الميزانية: الأعلى' },
    { value: 'budget_low', label: 'الميزانية: الأقل' },
    { value: 'proposals_high', label: 'أكثر العروض' },
    { value: 'proposals_low', label: 'أقل العروض' },
];

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// Time ago helper
function timeAgo(date: string): string {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
    return `منذ ${Math.floor(diffDays / 30)} شهر`;
}

// Job Card Component
function JobCard({ job, isSaved, onToggleSave, onClick }: {
    job: Job;
    isSaved: boolean;
    onToggleSave: () => void;
    onClick: () => void;
}) {
    return (
        <div
            className="card hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary-600 transition-colors line-clamp-1">
                        {job.title}
                    </h3>
                    <p className="text-sm text-muted flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4" />
                        {timeAgo(job.posted_at)}
                    </p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                    className={`p-2 rounded-full transition-colors ${isSaved ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                >
                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${job.job_type === 'fixed_price'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                    }`}>
                    {job.job_type === 'fixed_price' ? 'سعر ثابت' : 'بالساعة'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {EXPERIENCE_LEVELS.find(l => l.value === job.experience_level)?.label || job.experience_level}
                </span>
            </div>

            {/* Budget */}
            <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-primary-600" />
                <span className="font-bold text-primary-600">
                    {job.job_type === 'fixed_price' ? (
                        job.budget_min === job.budget_max || !job.budget_max
                            ? `${job.budget_min} د.ت`
                            : `${job.budget_min} - ${job.budget_max} د.ت`
                    ) : (
                        `${job.hourly_rate} د.ت/ساعة`
                    )}
                </span>
            </div>

            {/* Description */}
            <p className="text-muted text-sm line-clamp-2 mb-4">
                {job.description}
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
                {job.required_skills?.slice(0, 4).map((skill, index) => (
                    <span
                        key={index}
                        className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-lg"
                    >
                        {skill}
                    </span>
                ))}
                {job.required_skills?.length > 4 && (
                    <span className="px-2 py-1 text-muted text-xs">
                        +{job.required_skills.length - 4} أخرى
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    {job.client?.avatar_url ? (
                        <img
                            src={job.client.avatar_url}
                            alt={job.client.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-500" />
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium">{job.client?.full_name || 'عميل'}</p>
                        {job.client?.location && (
                            <p className="text-xs text-muted flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.client.location}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 text-muted text-sm">
                    <Briefcase className="w-4 h-4" />
                    <span>{job.proposals_count} عرض</span>
                </div>
            </div>
        </div>
    );
}

// Filter Sidebar Component
function FilterSidebar({
    filters,
    onFilterChange,
    categoryCounts,
    onClearAll,
    isOpen,
    onClose,
}: {
    filters: any;
    onFilterChange: (key: string, value: any) => void;
    categoryCounts: Record<string, number>;
    onClearAll: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}) {
    const [expandedSections, setExpandedSections] = useState({
        category: true,
        jobType: true,
        budget: true,
        experience: true,
        posted: false,
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section as keyof typeof prev] }));
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
        <div className="border-b border-gray-100 py-4">
            <button
                onClick={() => toggleSection(section)}
                className="flex items-center justify-between w-full text-start"
            >
                <span className="font-semibold text-foreground">{title}</span>
                {expandedSections[section as keyof typeof expandedSections]
                    ? <ChevronUp className="w-4 h-4 text-muted" />
                    : <ChevronDown className="w-4 h-4 text-muted" />
                }
            </button>
            {expandedSections[section as keyof typeof expandedSections] && (
                <div className="mt-3 space-y-2">
                    {children}
                </div>
            )}
        </div>
    );

    const sidebarContent = (
        <>
            {/* Header for mobile */}
            {onClose && (
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 lg:hidden">
                    <h2 className="text-lg font-bold">الفلاتر</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Categories */}
            <FilterSection title="التصنيف" section="category">
                {CATEGORIES.map(cat => (
                    <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.categories?.includes(cat.value) || false}
                            onChange={(e) => {
                                const current = filters.categories || [];
                                const updated = e.target.checked
                                    ? [...current, cat.value]
                                    : current.filter((c: string) => c !== cat.value);
                                onFilterChange('categories', updated);
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm flex-1">{cat.label}</span>
                        <span className="text-xs text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                            {categoryCounts[cat.value] || 0}
                        </span>
                    </label>
                ))}
            </FilterSection>

            {/* Job Type */}
            <FilterSection title="نوع العمل" section="jobType">
                {['fixed_price', 'hourly'].map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="jobType"
                            checked={filters.jobType === type}
                            onChange={() => onFilterChange('jobType', type)}
                            className="w-4 h-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm">
                            {type === 'fixed_price' ? 'سعر ثابت' : 'بالساعة'}
                        </span>
                    </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name="jobType"
                        checked={!filters.jobType}
                        onChange={() => onFilterChange('jobType', null)}
                        className="w-4 h-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">الكل</span>
                </label>
            </FilterSection>

            {/* Budget Range */}
            <FilterSection title="نطاق الميزانية" section="budget">
                {BUDGET_RANGES.map(range => (
                    <label key={range.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="budget"
                            checked={filters.budgetRange === range.value}
                            onChange={() => onFilterChange('budgetRange', range.value)}
                            className="w-4 h-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm">{range.label}</span>
                    </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name="budget"
                        checked={!filters.budgetRange}
                        onChange={() => onFilterChange('budgetRange', null)}
                        className="w-4 h-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">الكل</span>
                </label>
            </FilterSection>

            {/* Experience Level */}
            <FilterSection title="مستوى الخبرة" section="experience">
                {EXPERIENCE_LEVELS.map(level => (
                    <label key={level.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.experienceLevels?.includes(level.value) || false}
                            onChange={(e) => {
                                const current = filters.experienceLevels || [];
                                const updated = e.target.checked
                                    ? [...current, level.value]
                                    : current.filter((l: string) => l !== level.value);
                                onFilterChange('experienceLevels', updated);
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm">{level.label}</span>
                    </label>
                ))}
            </FilterSection>

            {/* Posted Date */}
            <FilterSection title="تاريخ النشر" section="posted">
                {POSTED_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="posted"
                            checked={filters.postedWithin === opt.value}
                            onChange={() => onFilterChange('postedWithin', opt.value)}
                            className="w-4 h-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm">{opt.label}</span>
                    </label>
                ))}
            </FilterSection>

            {/* Clear All */}
            <div className="pt-4">
                <Button
                    variant="ghost"
                    className="w-full"
                    onClick={onClearAll}
                >
                    مسح جميع الفلاتر
                </Button>
            </div>
        </>
    );

    // Mobile modal
    if (onClose !== undefined) {
        return (
            <div className={`
                fixed inset-0 z-50 lg:hidden
                ${isOpen ? 'block' : 'hidden'}
            `}>
                <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                <div className="absolute inset-y-0 start-0 w-80 bg-white p-4 overflow-y-auto">
                    {sidebarContent}
                </div>
            </div>
        );
    }

    return (
        <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl p-4 sticky top-4">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    الفلاتر
                </h2>
                {sidebarContent}
            </div>
        </div>
    );
}

// Saved Jobs Sidebar
function SavedJobsSidebar({ savedJobs, onViewJob }: { savedJobs: Job[]; onViewJob: (id: string) => void }) {
    if (savedJobs.length === 0) return null;

    return (
        <div className="hidden xl:block w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl p-4 sticky top-4">
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
                                    : `${job.hourly_rate} د.ت/ساعة`
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
                    client:profiles!client_id (id, full_name, avatar_url, location)
                `, { count: 'exact' })
                .eq('status', 'open')
                .eq('visibility', 'public');

            // Search
            if (debouncedSearch) {
                query = query.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);
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
        <div className="min-h-screen bg-gray-50">
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
                            className="w-full ps-12 pe-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                        className={`p-2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400'}`}
                                    >
                                        <List className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400'}`}
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
                                            job={job}
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
                        onViewJob={(id) => navigate(`/jobs/${id}`)}
                    />
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default JobBoard;
