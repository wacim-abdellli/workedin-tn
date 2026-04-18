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
  contractJobIds: string[];
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

  const { data: jobEngagementState } = useQuery({
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

      const contractJobIds = Array.from(new Set(
        ((contractResult.data ?? []) as Array<{ job_id: string | null; status: string | null }>)
          .filter((row) => {
            const normalizedStatus = String(row.status || '').toLowerCase();
            return normalizedStatus !== 'cancelled' && normalizedStatus !== 'canceled';
          })
          .map((row) => row.job_id)
          .filter((jobId): jobId is string => typeof jobId === 'string' && jobId.length > 0),
      ));

      return {
        proposalJobIds,
        contractJobIds,
      };
    },
  });

  const proposalJobIds = useMemo(() => new Set(jobEngagementState?.proposalJobIds ?? []), [jobEngagementState]);
  const contractJobIds = useMemo(() => new Set(jobEngagementState?.contractJobIds ?? []), [jobEngagementState]);

  const visibleJobs = useMemo(() => {
    if (!isFreelancerViewer) return jobs;
    // Find Work should only show opportunities the freelancer can still apply to.
    return jobs.filter((job) => !contractJobIds.has(job.id) && !proposalJobIds.has(job.id));
  }, [contractJobIds, isFreelancerViewer, jobs, proposalJobIds]);

  const totalJobsCount = jobsPages?.pages?.[0]?.count ?? jobs.length;
  const displayedCount = isFreelancerViewer ? visibleJobs.length : totalJobsCount;
  const isLoading = isFetching && !isFetchingNextPage;
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
      showToast(isSaved ? 'Removed from saved jobs' : 'Saved job', 'success');
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
            className="accent-purple-500 w-4 h-4 bg-[#0a0a0a] border-[#262626] rounded"
          />
          <span className="text-sm text-gray-300 ml-3 cursor-pointer break-words">{label}</span>
        </div>

        {checked ? (
          <span className="bg-purple-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full shrink-0">
            {activeCount ?? 1}
          </span>
        ) : null}
      </label>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <SEO {...SEO_CONFIG.jobs} url="/jobs" canonical="https://workedin.tn/jobs" />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black mb-1">{tx('pages.jobBoard.header.title', undefined, 'Find Work')}</h1>
          <p className="text-white/45 text-sm">{tx('pages.jobBoard.header.subtitle', undefined, 'Browse and apply to freelance opportunities in Tunisia.')}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Sidebar Filters ── */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8">
              <div
                className="rounded-2xl border border-white/8 p-5"
                style={{ background: 'rgba(255,255,255,0.025)' }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                    <SlidersHorizontal className="w-4 h-4 opacity-60" />
                    {tx('pages.jobBoard.filters.clearAll', undefined, 'Filters')}
                  </h2>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    {tx('pages.jobBoard.filters.clearAll', undefined, 'Clear all')}
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Category */}
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">Category</h3>
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
                                  borderColor: checked ? 'var(--workspace-primary,#8b5cf6)' : 'rgba(255,255,255,0.15)',
                                  background: checked ? 'var(--workspace-primary,#8b5cf6)' : 'transparent',
                                }}
                              >
                                {checked && (
                                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                                <input id={`cat-${category}`} type="checkbox" checked={checked} onChange={() => handleToggleCategory(category)} className="sr-only" />
                              </div>
                              <span className={`text-sm transition-colors ${checked ? 'text-white' : 'text-white/55 group-hover:text-white/80'}`}>
                                {getCategoryLabel(category)}
                              </span>
                            </div>
                            {count > 0 && (
                              <span className="text-[10px] text-white/30 tabular-nums">{count}</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Job Type */}
                  <div className="pt-5 border-t border-white/8">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">{tx('pages.jobBoard.filters.jobType', undefined, 'Job Type')}</h3>
                    <div className="flex flex-col gap-2">
                      {JOB_TYPE_OPTIONS.map((item) => {
                        const checked = filters.jobType === item.value;
                        return (
                          <label key={item.value} htmlFor={`type-${item.value}`} className="flex items-center gap-2.5 cursor-pointer group">
                            <div
                              className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all"
                              style={{
                                borderColor: checked ? 'var(--workspace-primary,#8b5cf6)' : 'rgba(255,255,255,0.15)',
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
                            <span className={`text-sm transition-colors ${checked ? 'text-white' : 'text-white/55 group-hover:text-white/80'}`}>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="pt-5 border-t border-white/8">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">Budget</h3>
                    <div className="flex flex-col gap-2">
                      {BUDGET_OPTIONS.map((item) => {
                        const checked = filters.budgetRange === item.value;
                        return (
                          <label key={item.value} htmlFor={`budget-${item.value}`} className="flex items-center gap-2.5 cursor-pointer group">
                            <div
                              className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all"
                              style={{
                                borderColor: checked ? 'var(--workspace-primary,#8b5cf6)' : 'rgba(255,255,255,0.15)',
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
                            <span className={`text-sm transition-colors ${checked ? 'text-white' : 'text-white/55 group-hover:text-white/80'}`}>{item.label}</span>
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
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder={tx('pages.jobBoard.filters.searchPlaceholder', undefined, 'Search jobs...')}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--workspace-primary,#8b5cf6)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
              </div>

              <div ref={sortMenuRef} className="relative sm:w-52">
                <button
                  type="button"
                  onClick={() => setIsSortMenuOpen((p) => !p)}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white/70 flex items-center justify-between gap-3 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={isSortMenuOpen}
                >
                  <span className="truncate">{selectedSortOption.label}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isSortMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortMenuOpen && (
                  <div
                    className="absolute z-30 mt-2 right-0 w-full min-w-[200px] rounded-xl p-1 shadow-2xl"
                    style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)' }}
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
                            color: isSelected ? 'var(--workspace-primary,#8b5cf6)' : 'rgba(255,255,255,0.65)',
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

            {/* Count */}
            <p className="text-xs text-white/35 flex items-center gap-1.5">
              <span className="font-semibold text-white tabular-nums">{displayedCount}</span>
              <span>{tx('pages.jobBoard.filters.showing', { count: displayedCount }, 'jobs')}</span>
            </p>

            {/* Loading skeletons */}
            {isLoading && jobs.length === 0 && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/8 p-6 animate-pulse" style={{ background: 'rgba(255,255,255,0.025)' }}>
                    <div className="h-5 w-2/3 bg-white/8 rounded-lg mb-3" />
                    <div className="h-3.5 w-1/2 bg-white/5 rounded mb-2" />
                    <div className="h-3.5 w-full bg-white/5 rounded mb-1" />
                    <div className="h-3.5 w-4/5 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/8 p-5">
                <p className="text-rose-300 text-sm">{tx('pages.jobBoard.errors.loadFailed', undefined, 'Failed to load jobs. Please try again.')}</p>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !error && visibleJobs.length === 0 && (
              <div className="rounded-2xl border border-white/8 p-10 text-center" style={{ background: 'rgba(255,255,255,0.025)' }}>
                <p className="text-white/50">{tx('pages.jobBoard.empty.filtered', undefined, 'No jobs found for the selected filters.')}</p>
              </div>
            )}

            {/* Job cards */}
            {!error && visibleJobs.length > 0 && (
              <div className="flex flex-col gap-3">
                {visibleJobs.map((job) => {
                  const isSaved = savedJobIds.has(job.id);
                  const isAlreadyApplied = isFreelancerViewer && proposalJobIds.has(job.id);
                  const skillLabels = (job.required_skills || []).map((s) => toSkillLabel(s, language)).filter(Boolean).slice(0, 5);
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
                      className="group relative rounded-2xl border border-white/8 p-5 sm:p-6 cursor-pointer transition-all duration-200 hover:border-white/16 hover:-translate-y-0.5"
                      style={{ background: 'rgba(255,255,255,0.025)' }}
                    >
                      {/* Subtle glow on hover */}
                      <div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.04) 0%,transparent 60%)' }}
                      />

                      <div className="relative flex flex-col md:flex-row gap-4 md:items-start md:justify-between">
                        {/* Left */}
                        <div className="min-w-0 flex-1">
                          {/* Type pill + title */}
                          <div className="flex items-start gap-2.5 mb-2">
                            <span
                              className="shrink-0 mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: isFixed ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)',
                                color: isFixed ? '#60a5fa' : '#34d399',
                                border: `1px solid ${isFixed ? 'rgba(59,130,246,0.22)' : 'rgba(16,185,129,0.22)'}`,
                              }}
                            >
                              {isFixed ? 'Fixed' : 'Hourly'}
                            </span>
                            <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1 [overflow-wrap:anywhere]">
                              {job.title || 'Untitled job'}
                            </h3>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-white/45 line-clamp-2 mb-3 [overflow-wrap:anywhere]">
                            {job.description || 'No description provided.'}
                          </p>

                          {/* Meta chips */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/40 mb-3">
                            <span className="font-semibold" style={{ color: 'var(--workspace-primary,#8b5cf6)' }}>
                              {getBudgetLabel(job)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {postedAgo}
                            </span>
                            <span className="flex items-center gap-1">
                              <BadgeCheck className={`w-3 h-3 ${job.client?.payment_verified ? 'text-emerald-400' : 'text-white/25'}`} />
                              {job.client?.payment_verified ? 'Payment verified' : 'Payment unverified'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.client?.location || 'Tunis'}
                            </span>
                          </div>

                          {/* Skill tags */}
                          <div className="flex flex-wrap gap-1.5">
                            {skillLabels.length > 0
                              ? skillLabels.map((skill) => (
                                  <span
                                    key={`${job.id}-${skill}`}
                                    className="text-[11px] px-2.5 py-0.5 rounded-full border border-white/8 bg-white/4 text-white/55"
                                  >
                                    {skill}
                                  </span>
                                ))
                              : (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-white/8 bg-white/4 text-white/40">General</span>
                              )
                            }
                          </div>
                        </div>

                        {/* Right actions */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0">
                          <div className="flex items-center gap-1 text-xs text-white/35">
                            <Star className="w-3 h-3 text-amber-400/60 fill-amber-400/40" />
                            <span>{clientName} ({ratingValue})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={isSaved ? 'Unsave job' : 'Save job'}
                              onClick={async (e) => { e.stopPropagation(); await handleToggleSave(job); }}
                              className="group/save flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/4 transition-all hover:border-rose-500/40 hover:bg-rose-500/10"
                            >
                              <Heart className={`w-3.5 h-3.5 transition-colors ${isSaved ? 'fill-rose-400 text-rose-400' : 'text-white/40 group-hover/save:text-rose-400'}`} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
                              className={`h-8 px-4 rounded-xl text-xs font-bold transition-all active:scale-[0.97] ${
                                isAlreadyApplied
                                  ? 'text-white/70 border border-white/15 bg-white/5 hover:bg-white/10'
                                  : 'text-white hover:brightness-110'
                              }`}
                              style={isAlreadyApplied
                                ? undefined
                                : {
                                  background: 'linear-gradient(135deg,var(--workspace-primary,#8b5cf6) 0%,color-mix(in srgb,var(--workspace-primary,#8b5cf6) 70%,#6d28d9) 100%)',
                                }}
                            >
                              {isAlreadyApplied
                                ? tx('pages.jobBoard.actions.applied', undefined, 'Applied')
                                : tx('pages.jobBoard.actions.applyNow', undefined, 'Apply Now')}
                            </button>
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
                  className="rounded-xl border border-white/10 bg-white/4 px-6 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/8 disabled:opacity-50 transition-all"
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
