import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronDown,
  Clock,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../contexts/AuthContext';
import * as jobsService from '../services/jobs';
import * as profilesService from '../services/profiles';
import { Header, Footer } from '../components/layout';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import type { Skill } from '../types';
import { canSaveJob, getAccessMessage } from '../lib/marketplaceAccess';

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
  experience_level: string;
  required_skills: Array<string | Skill>;
  visibility: string;
  status: string;
  proposals_count: number;
  posted_at: string;
  client?: {
    id: string;
    full_name?: string;
    location?: string;
    payment_verified?: boolean;
  };
}

interface FilterState {
  search: string;
  categories: string[];
  jobType: 'fixed_price' | 'hourly' | null;
  budgetRange: string | null;
  sortBy: string;
}

const CATEGORY_VALUES = [
  'design',
  'development',
  'writing',
  'translation',
  'video',
  'marketing',
  'data',
  'other',
] as const;

const JOB_TYPE_OPTIONS = [
  { value: 'fixed_price' as const, label: 'Fixed-price' },
  { value: 'hourly' as const, label: 'Hourly' },
] as const;

const BUDGET_OPTIONS = [
  { value: '0-50', label: '0 - 50 TND' },
  { value: '50-100', label: '50 - 100 TND' },
  { value: '100-250', label: '100 - 250 TND' },
  { value: '250-500', label: '250 - 500 TND' },
  { value: '500+', label: '500+ TND' },
] as const;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'budget_high', label: 'Budget: High to Low' },
  { value: 'budget_low', label: 'Budget: Low to High' },
  { value: 'proposals_high', label: 'Most Proposals' },
  { value: 'proposals_low', label: 'Least Proposals' },
] as const;

const DEFAULT_FILTERS: FilterState = {
  search: '',
  categories: [],
  jobType: null,
  budgetRange: null,
  sortBy: 'newest',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debouncedValue;
}

function formatTimeAgo(dateInput: string): string {
  const now = Date.now();
  const then = new Date(dateInput).getTime();

  if (!Number.isFinite(then)) {
    return 'just now';
  }

  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
}

function toSkillLabel(skill: string | Skill, language: 'ar' | 'fr' | 'en'): string {
  if (typeof skill === 'string') return skill;

  if (language === 'ar') return skill.name_ar || skill.name_en || 'Skill';
  if (language === 'fr') return skill.name_fr || skill.name_en || 'Skill';
  return skill.name_en || 'Skill';
}

function getBudgetLabel(job: Job): string {
  if (job.job_type === 'hourly') {
    return `${job.hourly_rate ?? 0} TND/h`;
  }

  if (typeof job.budget_min === 'number' || typeof job.budget_max === 'number') {
    return `${job.budget_min ?? 0}-${job.budget_max ?? 0} TND`;
  }

  return 'Budget not specified';
}

function getCategoryLabel(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function JobBoard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user, profile, freelancerProfile } = useAuth();
  const { showToast } = useToast();
  const { language } = useTranslation();

  const saveDecision = canSaveJob({
    isAuthenticated: Boolean(user),
    profile,
    freelancerProfile,
  });

  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('q') || DEFAULT_FILTERS.search,
    categories: searchParams.get('cat')?.split(',').filter(Boolean) || DEFAULT_FILTERS.categories,
    jobType: (searchParams.get('type') as FilterState['jobType']) || DEFAULT_FILTERS.jobType,
    budgetRange: searchParams.get('budget') || DEFAULT_FILTERS.budgetRange,
    sortBy: searchParams.get('sort') || DEFAULT_FILTERS.sortBy,
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search.trim()) params.set('q', filters.search.trim());
    if (filters.categories.length > 0) params.set('cat', filters.categories.join(','));
    if (filters.jobType) params.set('type', filters.jobType);
    if (filters.budgetRange) params.set('budget', filters.budgetRange);
    if (filters.sortBy !== 'newest') params.set('sort', filters.sortBy);

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const {
    data: categoryCounts = {},
  } = useQuery({
    queryKey: ['category-counts'],
    queryFn: () => jobsService.getCategoryCounts([...CATEGORY_VALUES]),
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: jobsPages,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['jobs-feed-v2', filters, debouncedSearch],
    queryFn: ({ pageParam }) =>
      jobsService.getJobs(
        {
          search: debouncedSearch,
          categories: filters.categories,
          jobType: filters.jobType,
          budgetRange: filters.budgetRange,
          sortBy: filters.sortBy,
        },
        pageParam as number,
        12,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage?.data || lastPage.data.length < 12) return undefined;
      return pages.length + 1;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const jobs = useMemo<Job[]>(() => {
    return jobsPages?.pages.flatMap((page) => page.data as Job[]) || [];
  }, [jobsPages]);

  const totalCount = jobsPages?.pages[0]?.count || 0;
  const isLoading = isFetching && !isFetchingNextPage;

  const { data: savedJobsData = [] } = useQuery({
    queryKey: ['saved-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await profilesService.getSavedJobs(user.id);
      const rows = (data ?? []) as unknown as Array<{ jobs?: Job | Job[] | null }>;
      return rows
        .map((row) => {
          if (Array.isArray(row.jobs)) {
            return row.jobs[0];
          }
          return row.jobs;
        })
        .filter((job): job is Job => Boolean(job));
    },
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });

  const savedJobIds = useMemo(() => {
    return new Set(savedJobsData.map((job) => job.id));
  }, [savedJobsData]);

  const toggleSaveMutation = useMutation({
    mutationFn: async ({ jobId, isSaved }: { jobId: string; isSaved: boolean }) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      await profilesService.toggleFavorite(user.id, jobId, isSaved);
      return { isSaved };
    },
    onSuccess: ({ isSaved }) => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs', user?.id] });
      showToast(isSaved ? 'Removed from saved jobs' : 'Saved job', 'success');
    },
    onError: () => {
      showToast('Could not update saved jobs', 'error');
    },
  });

  const handleToggleCategory = (category: string) => {
    setFilters((prev) => {
      const isActive = prev.categories.includes(category);
      return {
        ...prev,
        categories: isActive
          ? prev.categories.filter((item) => item !== category)
          : [...prev.categories, category],
      };
    });
  };

  const handleToggleJobType = (jobType: FilterState['jobType']) => {
    setFilters((prev) => ({
      ...prev,
      jobType: prev.jobType === jobType ? null : jobType,
    }));
  };

  const handleToggleBudget = (rangeValue: string) => {
    setFilters((prev) => ({
      ...prev,
      budgetRange: prev.budgetRange === rangeValue ? null : rangeValue,
    }));
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleToggleSave = useCallback(
    async (job: Job) => {
      if (!saveDecision.allowed) {
        showToast(getAccessMessage(saveDecision.reason, saveDecision.completion), 'warning');
        if (saveDecision.nextStepPath) {
          navigate(saveDecision.nextStepPath, { state: { from: '/jobs' } });
        }
        return;
      }

      await toggleSaveMutation.mutateAsync({
        jobId: job.id,
        isSaved: savedJobIds.has(job.id),
      });
    },
    [navigate, saveDecision, savedJobIds, showToast, toggleSaveMutation],
  );

  const renderFilterItem = (
    id: string,
    label: string,
    checked: boolean,
    onChange: () => void,
    activeCount?: number,
  ) => {
    return (
      <label
        key={id}
        htmlFor={id}
        className="flex items-center justify-between gap-3"
      >
        <div className="inline-flex items-center min-w-0">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="accent-orange-500 w-4 h-4 bg-[#0a0a0a] border-[#262626] rounded"
          />
          <span className="text-sm text-gray-300 ml-3 cursor-pointer break-words">{label}</span>
        </div>

        {checked ? (
          <span className="bg-orange-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full shrink-0">
            {activeCount ?? 1}
          </span>
        ) : null}
      </label>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SEO {...SEO_CONFIG.jobs} url="/jobs" canonical="https://workedin.tn/jobs" />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header>
          <h1 className="text-3xl font-bold mb-2">Find Work</h1>
          <p className="text-gray-400 mb-8">Browse and apply to freelance opportunities in Tunisia.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="flex flex-col gap-6 sticky top-8">
              <section className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="inline-flex items-center gap-2 text-white font-semibold">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                  </h2>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm text-orange-500 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Category</h3>
                    <div className="flex flex-col gap-3">
                      {CATEGORY_VALUES.map((category) => {
                        const checked = filters.categories.includes(category);
                        return renderFilterItem(
                          `category-${category}`,
                          getCategoryLabel(category),
                          checked,
                          () => handleToggleCategory(category),
                          Number(categoryCounts[category] ?? 0),
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Job Type</h3>
                    <div className="flex flex-col gap-3">
                      {JOB_TYPE_OPTIONS.map((item) =>
                        renderFilterItem(
                          `job-type-${item.value}`,
                          item.label,
                          filters.jobType === item.value,
                          () => handleToggleJobType(item.value),
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Budget</h3>
                    <div className="flex flex-col gap-3">
                      {BUDGET_OPTIONS.map((item) =>
                        renderFilterItem(
                          `budget-${item.value}`,
                          item.label,
                          filters.budgetRange === item.value,
                          () => handleToggleBudget(item.value),
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </aside>
          <section className="lg:col-span-3">
            <div className="flex flex-col gap-6">
              <div className="flex flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, search: event.target.value }))
                    }
                    placeholder="Search jobs..."
                    className="w-full bg-[#141414] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-white transition-all"
                  />
                </div>

                <div className="relative w-full sm:w-auto">
                  <select
                    value={filters.sortBy}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, sortBy: event.target.value }))
                    }
                    className="appearance-none w-full bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 pr-10 text-sm text-gray-300 flex items-center gap-2 cursor-pointer hover:bg-[#262626]"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <p className="text-sm text-gray-400">Showing {totalCount} jobs</p>

              {isLoading && jobs.length === 0 ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="bg-[#141414] border border-[#262626] rounded-2xl p-6 animate-pulse"
                    >
                      <div className="h-6 w-2/3 bg-[#262626] rounded mb-4" />
                      <div className="h-4 w-1/2 bg-[#262626] rounded mb-3" />
                      <div className="h-4 w-full bg-[#262626] rounded mb-2" />
                      <div className="h-4 w-5/6 bg-[#262626] rounded" />
                    </div>
                  ))}
                </div>
              ) : null}

              {error ? (
                <div className="bg-[#141414] border border-red-500/40 rounded-2xl p-6">
                  <p className="text-red-300 text-sm">Failed to load jobs. Please try again.</p>
                </div>
              ) : null}

              {!isLoading && !error && jobs.length === 0 ? (
                <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 text-center">
                  <p className="text-gray-300">No jobs found for the selected filters.</p>
                </div>
              ) : null}

              {!error && jobs.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {jobs.map((job) => {
                    const isSaved = savedJobIds.has(job.id);
                    const skillLabels = (job.required_skills || [])
                      .map((skill) => toSkillLabel(skill, language))
                      .filter(Boolean)
                      .slice(0, 8);
                    const postedAgo = formatTimeAgo(job.posted_at);
                    const isVerified = Boolean(job.client?.payment_verified);

                    return (
                      <article
                        key={job.id}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="bg-[#141414] border border-[#262626] rounded-2xl p-6 hover:border-[#404040] transition-all cursor-pointer flex flex-col gap-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-xl font-bold text-white hover:text-orange-500 transition-colors line-clamp-1 break-words min-w-0">
                            {job.title || 'Untitled job'}
                          </h3>

                          <button
                            type="button"
                            aria-label={isSaved ? 'Unsave job' : 'Save job'}
                            className="text-gray-500 hover:text-orange-500 border border-[#262626] rounded-full p-2 shrink-0"
                            onClick={async (event) => {
                              event.stopPropagation();
                              await handleToggleSave(job);
                            }}
                          >
                            <Heart
                              className="w-4 h-4"
                              fill={isSaved ? 'currentColor' : 'none'}
                            />
                          </button>
                        </div>

                        <div className="text-xs text-gray-400 flex flex-wrap items-center gap-4">
                          <span>{job.job_type === 'fixed_price' ? 'Fixed-price' : 'Hourly'}</span>
                          <span>
                            Est. Budget:{' '}
                            <span className="text-white font-semibold text-sm">{getBudgetLabel(job)}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Posted {postedAgo}
                          </span>
                        </div>

                        <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed break-words">
                          {job.description || 'No description provided.'}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {skillLabels.length > 0 ? (
                            skillLabels.map((skill) => (
                              <span
                                key={`${job.id}-${skill}`}
                                className="bg-[#262626] text-gray-300 px-3 py-1 rounded-full text-xs"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="bg-[#262626] text-gray-300 px-3 py-1 rounded-full text-xs">
                              General
                            </span>
                          )}
                        </div>

                        <div className="border-t border-[#262626] pt-4 mt-2">
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                            <span className="inline-flex items-center gap-1.5">
                              <BadgeCheck className={`w-4 h-4 ${isVerified ? 'text-green-500' : 'text-gray-500'}`} />
                              Payment verified
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              Client in {job.client?.location || 'Tunis'}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}

              {hasNextPage ? (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="bg-[#141414] border border-[#262626] rounded-xl px-5 py-2.5 text-sm text-gray-200 hover:bg-[#1f1f1f] disabled:opacity-60"
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default JobBoard;
