import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronDown,
  Clock,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
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

type JobEngagementState = {
  proposalJobIds: string[];
  activeContractJobIds: string[]; // jobs with active (non-completed, non-cancelled) contracts only
};

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

function toSkillLabel(skill: string | Skill, language: 'ar' | 'fr' | 'en', tx: (key: string, params?: any, fallback?: string) => string): string {
  if (typeof skill === 'string') return skill;

  if (language === 'ar') return skill.name_ar || skill.name_en || tx('common.skill', undefined, 'Skill');
  if (language === 'fr') return skill.name_fr || skill.name_en || tx('common.skill', undefined, 'Skill');
  return skill.name_en || tx('common.skill', undefined, 'Skill');
}

function getBudgetLabel(job: Job, tx: (key: string, params?: any, fallback?: string) => string): string {
  if (job.job_type === 'hourly') {
    return `${job.hourly_rate ?? 0} TND/h`;
  }

  if (typeof job.budget_min === 'number' || typeof job.budget_max === 'number') {
    return `${job.budget_min ?? 0}-${job.budget_max ?? 0} TND`;
  }

  return tx('pages.jobBoard.budgetNotSpecified', undefined, 'Budget not specified');
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
  const { language, tx } = useTranslation();
  const sortMenuRef = useRef<HTMLDivElement>(null);

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
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

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

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSortMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const isFreelancerViewer = Boolean(
    user?.id && ((profile?.active_mode ?? '') === 'freelancer' || freelancerProfile),
  );

  const listedJobIds = useMemo(() => {
    return Array.from(new Set(jobs.map((job) => job.id).filter(Boolean)));
  }, [jobs]);

  const listedJobIdsKey = useMemo(() => listedJobIds.join('|'), [listedJobIds]);

  const { data: jobEngagementState, isFetching: isEngagementFetching } = useQuery({
    queryKey: ['job-board-engagement-state', user?.id, listedJobIdsKey],
    enabled: isFreelancerViewer && listedJobIds.length > 0,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async (): Promise<JobEngagementState> => {
      const [proposalResult, contractResult] = await Promise.all([
        supabase
          .from('proposals')
          .select('job_id')
          .eq('freelancer_id', user!.id)
          .in('job_id', listedJobIds),
        supabase
          .from('contracts')
          .select('job_id, status')
          .eq('freelancer_id', user!.id)
          .in('job_id', listedJobIds),
      ]);

      if (proposalResult.error) {
        console.warn('[JobBoard] Failed to load proposal engagement state', proposalResult.error);
      }

      if (contractResult.error) {
        console.warn('[JobBoard] Failed to load contract engagement state', contractResult.error);
      }

      const proposalJobIds = Array.from(new Set(
        ((proposalResult.data ?? []) as Array<{ job_id: string | null }>)
          .map((row) => row.job_id)
          .filter((jobId): jobId is string => typeof jobId === 'string' && jobId.length > 0),
      ));

      const activeContractJobIds = Array.from(new Set(
        ((contractResult.data ?? []) as Array<{ job_id: string | null; status: string | null }>)
          .filter((row) => {
            const s = String(row.status || '').toLowerCase();
            // Only hide jobs where an ACTIVE contract exists.
            // Completed / cancelled contracts allow the job to still be visible.
            return s === 'active' || s === 'in_progress' || s === 'pending_payment';
          })
          .map((row) => row.job_id)
          .filter((jobId): jobId is string => typeof jobId === 'string' && jobId.length > 0),
      ));

      return {
        proposalJobIds,
        activeContractJobIds,
      };
    },
  });

  const proposalJobIds = useMemo(() => new Set(jobEngagementState?.proposalJobIds ?? []), [jobEngagementState]);
  const activeContractJobIds = useMemo(() => new Set(jobEngagementState?.activeContractJobIds ?? []), [jobEngagementState]);

  const visibleJobs = useMemo(() => {
    if (!isFreelancerViewer) return jobs;
    // Hide only jobs where the freelancer has an ACTIVE contract (they're already hired).
    // Jobs with pending proposals remain visible with an 'Applied' badge.
    // Jobs with completed/cancelled contracts are shown again (can re-apply or browse).
    return jobs.filter((job) => !activeContractJobIds.has(job.id));
  }, [activeContractJobIds, isFreelancerViewer, jobs]);

  const totalJobsCount = jobsPages?.pages?.[0]?.count ?? jobs.length;
  const displayedCount = isFreelancerViewer ? visibleJobs.length : totalJobsCount;

  // isEngagementReady: true when we have the data we need to safely filter jobs.
  // We gate on jobEngagementState !== undefined (data exists), NOT on !isFetching.
  // Reason: React Query takes 1 render to set isFetching=true after a query becomes enabled,
  // creating a window where isFetching=false but data is still undefined — causing a flash.
  const isEngagementReady =
    !isFreelancerViewer ||              // clients never need engagement state
    listedJobIds.length === 0 ||        // no jobs loaded yet, nothing to filter
    jobEngagementState !== undefined;   // state is loaded (even if stale — refetch is bg)

  // Show skeleton while the primary jobs query is running OR engagement state is not ready yet.
  const showSkeleton = (isFetching && !isFetchingNextPage) || !isEngagementReady;
  // Legacy alias used in a few conditions below
  const isLoading = showSkeleton;
  const selectedSortOption =
    SORT_OPTIONS.find((option) => option.value === filters.sortBy) || SORT_OPTIONS[0];

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
      showToast(isSaved ? tx('pages.jobBoard.toasts.removedFromSaved', undefined, 'Removed from saved jobs') : tx('pages.jobBoard.toasts.savedJob', undefined, 'Saved job'), 'success');
    },
    onError: () => {
      showToast(tx('pages.jobBoard.toasts.savedJobsUpdateError', undefined, 'Could not update saved jobs'), 'error');
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
            className="accent-purple-500 w-4 h-4 bg-[var(--color-bg-base)] border-[#262626] rounded"
          />
          <span className="text-sm text-gray-300 ml-3 cursor-pointer break-words">{label}</span>
        </div>

        {checked ? (
          <span 
            className="text-[10px] w-4 h-4 flex items-center justify-center rounded-full shrink-0"
            style={{ 
              background: 'var(--workspace-primary)',
              color: 'var(--workspace-primary-text)'
            }}
          >
            {activeCount ?? 1}
          </span>
        ) : null}
      </label>
    );
  };

  return (
    <div className="min-h-screen page-bg-base">
      <SEO {...SEO_CONFIG.jobs} url="/jobs" canonical="https://workedin.tn/jobs" />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black mb-1 text-on-surface">{tx('pages.jobBoard.header.title', undefined, 'Find Work')}</h1>
          <p className="text-on-surface-muted text-sm">{tx('pages.jobBoard.header.subtitle', undefined, 'Browse and apply to freelance opportunities in Tunisia.')}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Sidebar Filters ── */}
          <aside className="lg:col-span-1">
            <div className="">
              <div className="surface-card border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-on-surface">
                    <SlidersHorizontal className="w-4 h-4 opacity-60" />
                    {tx('pages.jobBoard.filters.clearAll', undefined, 'Filters')}
                  </h2>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs transition-colors"
                    style={{ color: 'var(--workspace-primary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--workspace-primary-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--workspace-primary)'}
                  >
                    {tx('pages.jobBoard.filters.clearAll', undefined, 'Clear all')}
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Category */}
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-subtle mb-3">Category</h3>
                    <div className="flex flex-col gap-2">
                      {CATEGORY_VALUES.map((category) => {
                        const checked = filters.categories.includes(category);
                        const count = Number(categoryCounts[category] ?? 0);
                        return (
                          <label key={category} htmlFor={`cat-${category}`} className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all"
                                style={{
                                  borderColor: checked ? 'var(--workspace-primary,#8b5cf6)' : 'var(--color-border-default)',
                                  background: checked ? 'var(--workspace-primary,#8b5cf6)' : 'transparent',
                                }}
                              >
                                {checked && (
                                  <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--workspace-primary-text)' }}>
                                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                                <input id={`cat-${category}`} type="checkbox" checked={checked} onChange={() => handleToggleCategory(category)} className="sr-only" />
                              </div>
                              <span className={`text-sm transition-colors ${checked ? 'text-on-surface' : 'text-on-surface-muted group-hover:text-on-surface'}`}>
                                {getCategoryLabel(category)}
                              </span>
                            </div>
                            {count > 0 && (
                              <span className={`ml-auto shrink-0 min-w-[20px] text-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums transition-colors ${
                                checked
                                  ? ''
                                  : 'text-on-surface-subtle bg-[var(--color-bg-muted)]'
                              }`}
                              style={checked ? { 
                                background: 'color-mix(in srgb, var(--workspace-primary) 25%, transparent)',
                                color: 'var(--workspace-primary-text)'
                              } : {}}
                              >{count}</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Job Type */}
                  <div className="pt-5 border-t border-surface">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-subtle mb-3">{tx('pages.jobBoard.filters.jobType', undefined, 'Job Type')}</h3>
                    <div className="flex flex-col gap-2">
                      {JOB_TYPE_OPTIONS.map((item) => {
                        const checked = filters.jobType === item.value;
                        return (
                          <label key={item.value} htmlFor={`type-${item.value}`} className="flex items-center gap-2.5 cursor-pointer group">
                            <div
                              className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all"
                              style={{
                                borderColor: checked ? 'var(--workspace-primary,#8b5cf6)' : 'var(--color-border-default)',
                                background: checked ? 'var(--workspace-primary,#8b5cf6)' : 'transparent',
                              }}
                            >
                              {checked && (
                                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                  <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              <input id={`type-${item.value}`} type="checkbox" checked={checked} onChange={() => handleToggleJobType(item.value)} className="sr-only" />
                            </div>
                            <span className={`text-sm transition-colors ${checked ? 'text-on-surface' : 'text-on-surface-muted group-hover:text-on-surface'}`}>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="pt-5 border-t border-surface">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-subtle mb-3">Budget</h3>
                    <div className="flex flex-col gap-2">
                      {BUDGET_OPTIONS.map((item) => {
                        const checked = filters.budgetRange === item.value;
                        return (
                          <label key={item.value} htmlFor={`budget-${item.value}`} className="flex items-center gap-2.5 cursor-pointer group">
                            <div
                              className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all"
                              style={{
                                borderColor: checked ? 'var(--workspace-primary,#8b5cf6)' : 'var(--color-border-default)',
                                background: checked ? 'var(--workspace-primary,#8b5cf6)' : 'transparent',
                              }}
                            >
                              {checked && (
                                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                  <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                              <input id={`budget-${item.value}`} type="checkbox" checked={checked} onChange={() => handleToggleBudget(item.value)} className="sr-only" />
                            </div>
                            <span className={`text-sm transition-colors ${checked ? 'text-on-surface' : 'text-on-surface-muted group-hover:text-on-surface'}`}>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <section className="lg:col-span-3 flex flex-col gap-5">

            {/* Search + Sort bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-subtle pointer-events-none" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder={tx('pages.jobBoard.filters.searchPlaceholder', undefined, 'Search jobs...')}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all"
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--workspace-primary,#8b5cf6)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; }}
                />
              </div>

              <div ref={sortMenuRef} className="relative sm:w-52">
                <button
                  type="button"
                  onClick={() => setIsSortMenuOpen((p) => !p)}
                  className="w-full rounded-xl px-4 py-3 text-sm text-on-surface-muted flex items-center justify-between gap-3 transition-all"
                  aria-haspopup="listbox"
                  aria-expanded={isSortMenuOpen}
                >
                  <span className="truncate">{selectedSortOption.label}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortMenuOpen && (
                  <div
                    className="absolute z-30 mt-2 right-0 w-full min-w-[200px] rounded-xl p-1 shadow-2xl surface-card border"
                    role="listbox"
                  >
                    {SORT_OPTIONS.map((option) => {
                      const isSelected = option.value === filters.sortBy;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => { setFilters((p) => ({ ...p, sortBy: option.value })); setIsSortMenuOpen(false); }}
                          className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors"
                          style={{
                            background: isSelected ? 'color-mix(in srgb,var(--workspace-primary,#8b5cf6) 15%,transparent)' : 'transparent',
                            color: isSelected ? 'var(--workspace-primary,#8b5cf6)' : 'var(--color-text-secondary)',
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Count — hidden while loading to avoid flickering numbers */}
            {!showSkeleton && (
              <p className="text-xs text-on-surface-subtle flex items-center gap-1.5">
                <span className="font-semibold text-on-surface tabular-nums">{displayedCount}</span>
                <span>{tx('pages.jobBoard.filters.showing', { count: displayedCount }, 'jobs')}</span>
              </p>
            )}

            {/* Loading skeletons — show while jobs OR engagement state are loading */}
            {showSkeleton && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-surface surface-card p-6 animate-pulse">
                    <div className="h-5 w-2/3 bg-[var(--color-bg-muted)] rounded-lg mb-3" />
                    <div className="h-3.5 w-1/2 bg-[var(--color-bg-muted)] rounded mb-2" />
                    <div className="h-3.5 w-full bg-[var(--color-bg-muted)] rounded mb-1" />
                    <div className="h-3.5 w-4/5 bg-[var(--color-bg-muted)] rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/8 p-5">
                <p className="text-rose-500 text-sm">{tx('pages.jobBoard.errors.loadFailed', undefined, 'Failed to load jobs. Please try again.')}</p>
              </div>
            )}

            {/* Empty state — only shown once everything is fully loaded */}
            {!showSkeleton && !error && isEngagementReady && visibleJobs.length === 0 && (
              <div className="rounded-2xl border border-surface surface-card p-10 text-center">
                <p className="text-on-surface-muted">{tx('pages.jobBoard.empty.filtered', undefined, 'No jobs found for the selected filters.')}</p>
              </div>
            )}

            {/* Job cards — render only once engagement state is ready for freelancers */}
            {!error && isEngagementReady && visibleJobs.length > 0 && (
              <div className="flex flex-col gap-3">
                {visibleJobs.map((job) => {
                  const isSaved = savedJobIds.has(job.id);
                  const isAlreadyApplied = isFreelancerViewer && proposalJobIds.has(job.id);
                  const skillLabels = (job.required_skills || []).map((s) => toSkillLabel(s, language, tx)).filter(Boolean).slice(0, 5);
                  const postedAgo = formatTimeAgo(job.posted_at);
                  const clientName = job.client?.full_name || 'Client';
                  const ratingValue = typeof (job.client as { rating?: number } | undefined)?.rating === 'number'
                    ? (job.client as { rating?: number }).rating!.toFixed(1)
                    : 'N/A';
                  const isFixed = job.job_type === 'fixed_price';

                  return (
                    <article
                      key={job.id}
                      role="button"
                      tabIndex={0}
                      aria-label={job.title || 'Untitled job'}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/jobs/${job.id}`);
                        }
                      }}
                      className="group relative rounded-xl border border-surface surface-card p-4 sm:p-5 cursor-pointer transition-all duration-200 hover:border-[var(--workspace-primary)] hover:shadow-[0_4px_20px_-4px_color-mix(in_srgb,var(--workspace-primary)_20%,transparent)] hover:-translate-y-0.5"
                    >
                      {/* Subtle glow on hover */}
                      <div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.03) 0%,transparent 60%)' }}
                      />

                      <div className="relative flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                        {/* Main Content Area */}
                        <div className="min-w-0 flex-1 flex flex-col">
                          {/* Top Row: Title & Budget */}
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <h3 className="text-sm font-bold text-on-surface transition-colors line-clamp-1 [overflow-wrap:anywhere]"
                                style={{ color: 'var(--color-text-primary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--workspace-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                              >
                                {job.title || 'Untitled job'}
                              </h3>
                              <span
                                className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  background: isFixed ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                                  color: isFixed ? '#3b82f6' : '#10b981',
                                  border: `1px solid ${isFixed ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)'}`,
                                }}
                              >
                                {isFixed ? 'Fixed' : 'Hourly'}
                              </span>
                            </div>
                            
                            {/* Budget */}
                            <span className="shrink-0 text-sm font-black whitespace-nowrap" style={{ color: 'var(--workspace-primary,#8b5cf6)' }}>
                              {getBudgetLabel(job, tx)}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-on-surface-muted line-clamp-1 mb-2.5 [overflow-wrap:anywhere] leading-relaxed pr-4">
                            {job.description || 'No description provided.'}
                          </p>

                          {/* Bottom Row: Meta & Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-on-surface-subtle">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 opacity-70" />
                                  {postedAgo}
                                </span>
                                <span className="flex items-center gap-1">
                                  <BadgeCheck className={`w-3 h-3 ${job.client?.payment_verified ? 'text-emerald-500' : 'opacity-70'}`} />
                                  {job.client?.payment_verified ? 'Verified' : 'Unverified'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-400/60" />
                                  <span>{clientName} ({ratingValue})</span>
                                </span>

                                {/* Minimal Skill tags */}
                                <div className="hidden sm:flex items-center gap-1 ml-2 border-l border-surface pl-3">
                                  {skillLabels.length > 0 ? (
                                    <>
                                      {skillLabels.slice(0, 3).map((skill) => (
                                          <span key={`${job.id}-${skill}`} className="text-[10px] px-1.5 py-0.5 rounded border border-surface surface-sunken text-on-surface-muted">
                                            {skill}
                                          </span>
                                      ))}
                                      {skillLabels.length > 3 && (
                                          <span className="text-[10px] text-on-surface-subtle">+{skillLabels.length - 3}</span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-surface surface-sunken text-on-surface-muted">General</span>
                                  )}
                                </div>
                            </div>

                            {/* Actions Group */}
                            <div className="flex items-center gap-2 shrink-0">
                                {isAlreadyApplied && (
                                  <span className="hidden sm:inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    ✓ Applied
                                  </span>
                                )}
                                <button
                                  type="button"
                                  aria-label={isSaved ? 'Unsave job' : 'Save job'}
                                  onClick={async (e) => { e.stopPropagation(); await handleToggleSave(job); }}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg border border-surface surface-sunken transition-all hover:bg-[var(--color-bg-muted)] group/save"
                                >
                                  <Heart className={`w-3.5 h-3.5 transition-colors ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-on-surface-muted group-hover/save:text-rose-500'}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
                                  className={`h-7 px-3 rounded-lg text-[11px] font-bold transition-all active:scale-[0.97] ${
                                    isAlreadyApplied
                                      ? 'text-on-surface-muted border border-surface surface-sunken hover-surface'
                                      : ''
                                  }`}
                                  style={isAlreadyApplied
                                    ? undefined
                                    : {
                                      background: 'linear-gradient(135deg,var(--workspace-primary) 0%,color-mix(in srgb,var(--workspace-primary) 70%,transparent) 100%)',
                                      color: 'var(--workspace-primary-text)'
                                    }}
                                  onMouseEnter={(e) => !isAlreadyApplied && (e.currentTarget.style.filter = 'brightness(1.1)')}
                                  onMouseLeave={(e) => !isAlreadyApplied && (e.currentTarget.style.filter = 'brightness(1)')}
                                >
                                  {isAlreadyApplied
                                    ? tx('pages.jobBoard.actions.applied', undefined, 'Applied')
                                    : tx('pages.jobBoard.actions.applyNow', undefined, 'Apply')}
                                </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Load more */}
            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-xl border px-6 py-2.5 text-sm transition-all disabled:opacity-50"
                  style={{ 
                    borderColor: 'var(--color-border-default)',
                    background: 'var(--color-bg-subtle)',
                    color: 'var(--color-text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-bg-muted)';
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-bg-subtle)';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default JobBoard;

