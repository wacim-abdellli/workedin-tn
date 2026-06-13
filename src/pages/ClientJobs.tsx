import {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef } from 'react'
import { useNavigate,
  useSearchParams } from 'react-router-dom'
import { getJobEditRoute } from '@/lib/routes'
import { 
  FolderOpen,
  Search,
  LayoutGrid,
  List,
  Table,
  Trash2,
  Edit,
  Clock,
  Coins,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Briefcase,
  X
} from "lucide-react"
import { Header } from '@/components/layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/i18n'

import { useToast } from '@/components/ui/Toast'
import Modal from '@/components/ui/Modal'

interface JobProposalCountRow {
  count: number;
}

interface ClientJobRow {
  id: string;
  title: string;
  category: string | null;
  subcategory?: string | null;
  description?: string | null;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  hourly_rate?: number | null;
  job_type: string | null;
  duration?: string | null;
  experience_level?: string | null;
  visibility?: string | null;
  deadline?: string | null;
  required_skills?: unknown[] | null;
  reference_links?: string[] | null;
  created_at: string;
  proposals?: JobProposalCountRow[];
}

interface ContractStatusRow {
  id: string;
  job_id: string;
  client_id?: string | null;
  freelancer_id?: string | null;
  status: string;
  payment_status: string | null;
  created_at: string;
  updated_at?: string | null;
}

type JobListTab = 'all' | 'active' | 'proposals' | 'attention' | 'finished';
type DerivedJobStatus = 'open' | 'in_progress' | 'needs_attention' | 'finished_success' | 'finished_unsuccessful';

type EnrichedClientJob = ClientJobRow & {
  latestContract: ContractStatusRow | null;
  derivedStatus: DerivedJobStatus;
};

type RepostPrefillData = {
  sourceJobId: string;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  job_type: 'fixed_price' | 'hourly';
  budget_min?: number;
  budget_max?: number;
  hourly_rate?: number;
  estimated_hours?: number;
  duration: string;
  experience_level: 'beginner' | 'intermediate' | 'expert';
  deadline: string;
  visibility: 'public' | 'invite_only';
  required_skills: unknown[];
  reference_links: string[];
};

const REPOST_DEFAULT_DURATION = '1_3_months';

const toDateInputString = (date: Date) => date.toISOString().slice(0, 10);

const getFutureDeadline = (rawDeadline: string | null | undefined) => {
  const candidate = rawDeadline ? new Date(rawDeadline) : null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (candidate && !Number.isNaN(candidate.getTime()) && candidate >= startOfToday) {
    return toDateInputString(candidate);
  }

  const fallback = new Date(startOfToday);
  fallback.setDate(fallback.getDate() + 14);
  return toDateInputString(fallback);
};

const normalizeJobTypeForRepost = (jobType: string | null | undefined): 'fixed_price' | 'hourly' => {
  const normalized = normalize(jobType);
  return normalized === 'hourly' ? 'hourly' : 'fixed_price';
};

const normalizeExperienceForRepost = (level: string | null | undefined): 'beginner' | 'intermediate' | 'expert' => {
  const normalized = normalize(level);
  if (normalized === 'beginner' || normalized === 'expert') return normalized;
  return 'intermediate';
};

const normalizeVisibilityForRepost = (visibility: string | null | undefined): 'public' | 'invite_only' => {
  return normalize(visibility) === 'invite_only' ? 'invite_only' : 'public';
};

const normalize = (value: string | null | undefined) => String(value || '').toLowerCase();

const deriveJobStatus = (
  jobStatus: string,
  contract: ContractStatusRow | null,
  proposalsCount: number,
): DerivedJobStatus => {
  const normalizedJobStatus = normalize(jobStatus);
  const normalizedContractStatus = normalize(contract?.status);

  if (contract) {
    if (normalizedContractStatus === 'pending_payment') return 'needs_attention';
    if (normalizedContractStatus === 'delivery_submitted') return 'needs_attention';
    if (normalizedContractStatus === 'completed') return 'finished_success';
    if (normalizedContractStatus === 'cancelled' || normalizedContractStatus === 'canceled') return 'finished_unsuccessful';
    if (normalizedContractStatus === 'disputed') return 'needs_attention';
    return 'in_progress';
  }

  if (normalizedJobStatus === 'completed') return 'finished_success';
  if (normalizedJobStatus === 'cancelled' || normalizedJobStatus === 'canceled' || normalizedJobStatus === 'closed') return 'finished_unsuccessful';
  if (normalizedJobStatus === 'disputed' || normalizedJobStatus === 'in_review') return 'needs_attention';

  if ((normalizedJobStatus === 'in_progress' || normalizedJobStatus === 'matched') && proposalsCount > 0) {
    return 'in_progress';
  }

  return 'open';
};

const pickLatestContractByJob = (rows: ContractStatusRow[]) => {
  const latestByJob = new Map<string, ContractStatusRow>();

  rows.forEach((row) => {
    const current = latestByJob.get(row.job_id);
    if (!current) {
      latestByJob.set(row.job_id, row);
      return;
    }

    const currentTime = new Date(current.updated_at || current.created_at).getTime();
    const nextTime = new Date(row.updated_at || row.created_at).getTime();
    if (nextTime >= currentTime) {
      latestByJob.set(row.job_id, row);
    }
  });

  return latestByJob;
};

export default function ClientJobs() {
  const { user } = useAuth()
  const { tx } = useTranslation()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<JobListTab>(() => {
    const tab = searchParams.get('tab') as JobListTab | null
    return tab && ['all', 'active', 'proposals', 'attention', 'finished'].includes(tab) ? tab : 'all'
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'budget' | 'proposals'>('newest')
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortContainerRef.current && !sortContainerRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSortOpen])

  // Sync tab when URL changes (e.g. clicking nav links)
  useEffect(() => {
    const tab = searchParams.get('tab') as JobListTab | null
    if (tab && ['all', 'active', 'proposals', 'attention', 'finished'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const [jobToConfirmDelete, setJobToConfirmDelete] = useState<EnrichedClientJob | null>(null)

  const { data: allJobs = [], isLoading } = useQuery<EnrichedClientJob[]>({
    queryKey: ['client-jobs-v3', user?.id],
    queryFn: async () => {
      const jobsResult = await supabase
        .from('jobs')
        .select('id, title, category, subcategory, description, status, budget_min, budget_max, hourly_rate, job_type, duration, experience_level, visibility, deadline, required_skills, reference_links, created_at')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (jobsResult.error) throw jobsResult.error;

      const jobsRows = ((jobsResult.data ?? []) as unknown as ClientJobRow[]);
      const jobIds = jobsRows.map((job) => job.id);

      const [contractsResult, proposalsResult] = await Promise.all([
        supabase
          .from('contracts')
          .select('id, job_id, client_id, freelancer_id, status, payment_status, created_at, updated_at')
          .eq('client_id', user?.id),
        jobIds.length > 0
          ? supabase
              .from('proposals')
              .select('job_id')
              .in('job_id', jobIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const contractsRows = contractsResult.error
        ? []
        : ((contractsResult.data ?? []) as ContractStatusRow[]);

      const proposalCountsByJob = new Map<string, number>();
      if (!proposalsResult.error) {
        for (const row of (proposalsResult.data ?? []) as Array<{ job_id: string | null }>) {
          if (!row.job_id) continue;
          proposalCountsByJob.set(row.job_id, (proposalCountsByJob.get(row.job_id) ?? 0) + 1);
        }
      }

      const latestContractByJob = pickLatestContractByJob(contractsRows);

      return jobsRows.map((job) => {
        const latestContract = latestContractByJob.get(job.id) ?? null;
        const proposalsCount = proposalCountsByJob.get(job.id) ?? 0;
        return {
          ...job,
          proposals: [{ count: proposalsCount }],
          latestContract,
          derivedStatus: deriveJobStatus(job.status, latestContract, proposalsCount),
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const jobs = useMemo(() => {
    let result = [...allJobs];
    if (activeTab === 'active') {
      result = result.filter((job) => job.derivedStatus === 'open' || job.derivedStatus === 'in_progress');
    } else if (activeTab === 'proposals') {
      result = result.filter((job) => (job.proposals?.[0]?.count || 0) > 0);
    } else if (activeTab === 'attention') {
      result = result.filter((job) => job.derivedStatus === 'needs_attention');
    } else if (activeTab === 'finished') {
      result = result.filter((job) => job.derivedStatus === 'finished_success' || job.derivedStatus === 'finished_unsuccessful');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          (job.description && job.description.toLowerCase().includes(q)) ||
          (job.category && job.category.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'budget') {
        const getBudgetVal = (j: EnrichedClientJob) => {
          if (normalizeJobTypeForRepost(j.job_type) === 'hourly') {
            return Number(j.hourly_rate ?? 0) * 40; // Approx project size
          }
          return Math.max(Number(j.budget_min ?? 0), Number(j.budget_max ?? 0));
        };
        return getBudgetVal(b) - getBudgetVal(a);
      }
      if (sortBy === 'proposals') {
        const countA = a.proposals?.[0]?.count || 0;
        const countB = b.proposals?.[0]?.count || 0;
        return countB - countA;
      }
      return 0;
    });

    return result;
  }, [activeTab, allJobs, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const open = allJobs.filter((job) => job.derivedStatus === 'open').length;
    const inProgress = allJobs.filter((job) => job.derivedStatus === 'in_progress').length;
    const needsAttention = allJobs.filter((job) => job.derivedStatus === 'needs_attention').length;
    const finished = allJobs.filter((job) => job.derivedStatus === 'finished_success' || job.derivedStatus === 'finished_unsuccessful').length;
    const finishedSuccess = allJobs.filter((job) => job.derivedStatus === 'finished_success').length;
    const finishedUnsuccessful = allJobs.filter((job) => job.derivedStatus === 'finished_unsuccessful').length;
    return {
      open,
      inProgress,
      needsAttention,
      finished,
      finishedSuccess,
      finishedUnsuccessful,
      jobsWithProposals: allJobs.filter((job) => (job.proposals?.[0]?.count || 0) > 0).length,
      proposals: allJobs.reduce((acc, curr) => acc + (curr.proposals?.[0]?.count || 0), 0),
    };
  }, [allJobs]);

  const formatDaysAgo = (dateStr: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24))
    if (days === 0) return tx('pages.clientJobs.today', undefined, 'Today')
    if (days === 1) return tx('pages.clientJobs.oneDayAgo', undefined, '1 day ago')
    return tx('pages.clientJobs.daysAgo', { days }, `${days} days ago`)
  }

  const tabLabel = (tab: JobListTab) => {
    if (tab === 'all') return `${tx('pages.clientJobs.all', undefined, 'All')} (${allJobs.length})`
    if (tab === 'active') return `${tx('pages.clientJobs.active', undefined, 'Active')} (${stats.open + stats.inProgress})`
    if (tab === 'proposals') return `${tx('pages.clientJobs.withProposals', undefined, 'With Proposals')} (${stats.jobsWithProposals})`
    if (tab === 'attention') return `${tx('pages.clientJobs.needsAttention', undefined, 'Needs attention')} (${stats.needsAttention})`
    return `${tx('pages.clientJobs.finished', undefined, 'Finished')} (${stats.finished})`
  }

  const statusLabel = (job: EnrichedClientJob) => {
    if (job.derivedStatus === 'open') return tx('pages.clientJobs.status.open', undefined, 'Open')
    if (job.derivedStatus === 'in_progress') return tx('pages.clientJobs.status.inProgress', undefined, 'In Progress')
    if (job.derivedStatus === 'needs_attention') {
      const contractStatus = normalize(job.latestContract?.status);
      if (contractStatus === 'disputed' || normalize(job.status) === 'disputed') return tx('pages.clientJobs.status.disputed', undefined, 'Disputed');
      if (contractStatus === 'delivery_submitted') return tx('pages.clientJobs.status.reviewNeeded', undefined, 'Review Needed');
      return tx('pages.clientJobs.status.actionRequired', undefined, 'Action Required');
    }
    return tx('pages.clientJobs.status.finished', undefined, 'Finished');
  }

  const outcomeText = (job: EnrichedClientJob) => {
    if (job.derivedStatus === 'finished_success') {
      return tx('pages.clientJobs.result.success', undefined, 'Result: Success (completed and paid)');
    }
    if (job.derivedStatus === 'finished_unsuccessful') {
      return tx('pages.clientJobs.result.unsuccessful', undefined, 'Result: Unsuccessful (contract cancelled)');
    }
    if (job.derivedStatus === 'needs_attention') {
      if (normalize(job.latestContract?.status) === 'delivery_submitted') {
        return tx('pages.clientJobs.result.deliveryReview', undefined, 'Result: Delivery submitted, awaiting your review');
      }
      return tx('pages.clientJobs.result.attention', undefined, 'Result: Action required before proceeding');
    }
    if (job.derivedStatus === 'in_progress') {
      return tx('pages.clientJobs.result.progress', undefined, 'Result: Work in progress');
    }
    return tx('pages.clientJobs.result.open', undefined, 'Result: Waiting for a hire decision');
  }

  const statusPillClass = (job: EnrichedClientJob) => {
    if (job.derivedStatus === 'open') return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    if (job.derivedStatus === 'in_progress') return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
    if (job.derivedStatus === 'finished_success') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    if (job.derivedStatus === 'needs_attention') return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    return 'bg-white/5 text-white/50 border-white/10';
  }

  const resultTextClass = (job: EnrichedClientJob) => {
    if (job.derivedStatus === 'finished_success') return 'text-emerald-400';
    if (job.derivedStatus === 'finished_unsuccessful') return 'text-rose-400';
    if (job.derivedStatus === 'needs_attention') return 'text-rose-400';
    if (job.derivedStatus === 'in_progress') return 'text-sky-400';
    return 'text-white/40';
  }

  const formatBudget = (job: EnrichedClientJob) => {
    if (normalizeJobTypeForRepost(job.job_type) === 'hourly') {
      const hourlyRate = Number(job.hourly_rate ?? 0);
      if (hourlyRate > 0) return `${hourlyRate} ${tx('common.currency', undefined, 'TND')}/h`;
    }

    const min = Number(job.budget_min ?? 0);
    const max = Number(job.budget_max ?? 0);
    if (!min && !max) return tx('pages.clientJobs.budgetNotSet', undefined, 'Budget not set');
    if (min && max) return `${min}-${max} ${tx('common.currency', undefined, 'TND')}`;
    return `${Math.max(min, max)} ${tx('common.currency', undefined, 'TND')}`;
  }

  const handleRepost = (job: EnrichedClientJob) => {
    const normalizedJobType = normalizeJobTypeForRepost(job.job_type);
    const minBudget = Number(job.budget_min ?? 0);
    const maxBudget = Number(job.budget_max ?? 0);
    const hourlyRate = Number(job.hourly_rate ?? 0);

    const repostFromJob: RepostPrefillData = {
      sourceJobId: job.id,
      title: job.title,
      category: job.category || '',
      subcategory: job.subcategory || '',
      description: job.description || '',
      job_type: normalizedJobType,
      budget_min: normalizedJobType === 'fixed_price' && minBudget > 0 ? minBudget : undefined,
      budget_max: normalizedJobType === 'fixed_price' && maxBudget > 0 ? maxBudget : undefined,
      hourly_rate: normalizedJobType === 'hourly' && hourlyRate > 0 ? hourlyRate : undefined,
      estimated_hours: normalizedJobType === 'hourly' ? 20 : undefined,
      duration: job.duration || REPOST_DEFAULT_DURATION,
      experience_level: normalizeExperienceForRepost(job.experience_level),
      deadline: getFutureDeadline(job.deadline),
      visibility: normalizeVisibilityForRepost(job.visibility),
      required_skills: Array.isArray(job.required_skills) ? job.required_skills : [],
      reference_links: Array.isArray(job.reference_links) ? job.reference_links : [],
    };

    navigate('/jobs/new', { state: { repostFromJob } });
  };

  const handleDeleteJob = useCallback((job: EnrichedClientJob) => {
    if (!user?.id) return;

    if (job.latestContract) {
      showToast(tx('pages.clientJobs.deleteBlocked', undefined, 'Cannot delete a project that already has a contract.'), 'info');
      return;
    }

    setJobToConfirmDelete(job);
  }, [showToast, tx, user?.id]);

  const confirmDeleteJob = useCallback(async () => {
    const job = jobToConfirmDelete;
    if (!job || !user?.id) return;

    try {
      setDeletingJobId(job.id);
      setJobToConfirmDelete(null);
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', job.id)
        .eq('client_id', user.id);

      if (error) throw error;

      showToast(tx('pages.clientJobs.deleteSuccess', undefined, 'Project deleted'), 'success');
      await queryClient.invalidateQueries({ queryKey: ['client-jobs-v3', user.id] });
    } catch {
      showToast(tx('pages.clientJobs.deleteError', undefined, 'Failed to delete project'), 'error');
    } finally {
      setDeletingJobId(null);
    }
  }, [jobToConfirmDelete, queryClient, showToast, tx, user?.id]);

  const sortOptions = useMemo(() => [
    { value: 'newest' as const, label: 'Newest First' },
    { value: 'budget' as const, label: 'Budget (High to Low)' },
    { value: 'proposals' as const, label: 'Proposals (Most First)' },
  ], []);

  const currentSortLabel = useMemo(() => {
    return sortOptions.find(opt => opt.value === sortBy)?.label || 'Newest First';
  }, [sortBy, sortOptions]);

  return (
    <div className="min-h-screen page-bg-base">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {tx('pages.clientJobs.title', undefined, 'My Projects')}
            </h1>
            <p className="text-sm text-white/50 mt-1">
              {tx('pages.clientJobs.subtitle', undefined, 'Manage your posted projects and active contracts')}
            </p>
          </div>
          <button
            onClick={() => navigate('/jobs/new')}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg transition-colors"
          >
            {tx('pages.clientJobs.postProject', undefined, 'Post a project')}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Card 1: Open */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-amber-500/[0.03] to-transparent p-5 hover:border-amber-500/20 transition-all duration-300 group hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider">{tx('pages.clientJobs.open', undefined, 'Open')}</p>
                <p className="text-3xl font-black text-amber-400 mt-2">{stats.open}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500/20" />
          </div>

          {/* Card 2: In Progress */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-sky-500/[0.03] to-transparent p-5 hover:border-sky-500/20 transition-all duration-300 group hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider">{tx('pages.clientJobs.inProgress', undefined, 'In progress')}</p>
                <p className="text-3xl font-black text-sky-400 mt-2">{stats.inProgress}</p>
              </div>
              <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform duration-300">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-500/20" />
          </div>

          {/* Card 3: Needs Attention */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-rose-500/[0.03] to-transparent p-5 hover:border-rose-500/20 transition-all duration-300 group hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider">{tx('pages.clientJobs.needsAttention', undefined, 'Needs attention')}</p>
                <p className="text-3xl font-black text-rose-400 mt-2">{stats.needsAttention}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose-500/20" />
          </div>

          {/* Card 4: Finished */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-emerald-500/[0.03] to-transparent p-5 hover:border-emerald-500/20 transition-all duration-300 group hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider">{tx('pages.clientJobs.finished', undefined, 'Finished')}</p>
                <p className="text-3xl font-black text-emerald-400 mt-2">{stats.finished}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[9px] font-semibold text-white/30 mt-2.5 uppercase tracking-wider">
              {tx('pages.clientJobs.finishedBreakdown', { success: stats.finishedSuccess, unsuccessful: stats.finishedUnsuccessful }, `${stats.finishedSuccess} success / ${stats.finishedUnsuccessful} unsuccessful`) }
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500/20" />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex overflow-x-auto scrollbar-hide mb-6 border-b border-white/5">
          {(['all', 'active', 'proposals', 'attention', 'finished'] as const).map(tab => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold transition-all shrink-0 ${active ? "text-amber-400" : "text-white/40 hover:text-white/70"}`}
              >
                {tabLabel(tab)}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Search, Sort & View Mode Toolbar */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your projects by title or category..."
              className="w-full pl-11 pr-10 py-2.5 text-sm bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & View Mode controls */}
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            {/* Sort Dropdown */}
            <div className="relative" ref={sortContainerRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 bg-black/20 hover:bg-black/35 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all select-none cursor-pointer"
              >
                <span className="text-white/40 uppercase tracking-wider">Sort:</span>
                <span>{currentSortLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Custom Dropdown Menu */}
              {isSortOpen && (
                <div 
                  className="absolute right-0 z-50 w-52 mt-1.5 bg-[#121214]/95 border border-zinc-800/80 rounded-xl shadow-[0_12px_45px_rgba(0,0,0,0.55)] p-1.5 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-md"
                >
                  <div className="space-y-0.5">
                    {sortOptions.map((option) => {
                      const isSelected = option.value === sortBy;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSortBy(option.value);
                            setIsSortOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium transition-all duration-150 flex items-center justify-between gap-2 ${
                            isSelected 
                              ? 'bg-amber-500/15 text-amber-300 font-semibold' 
                              : 'text-zinc-300 hover:bg-amber-500/10 hover:text-amber-300'
                          }`}
                        >
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Toggle (The Three Ways) */}
            <div className="flex items-center bg-black/20 border border-white/10 rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-amber-500/20 text-amber-400' : 'text-white/40 hover:text-white/80'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-amber-500/20 text-amber-400' : 'text-white/40 hover:text-white/80'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'compact' ? 'bg-amber-500/20 text-amber-400' : 'text-white/40 hover:text-white/80'}`}
                title="Compact Table View"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--workspace-primary)' }}></div>
          </div>
        ) : !jobs || jobs.length === 0 ? (
          allJobs.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] flex flex-col items-center text-center py-16 px-8">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-5 bg-amber-500/10">
                <FolderOpen className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {tx('pages.clientJobs.emptyTitle', undefined, 'No projects yet')}
              </h3>
              <p className="text-sm text-white/40 mb-6 max-w-md">
                {tx('pages.clientJobs.emptyDescription', undefined, 'Post your first project and receive proposals from verified professionals.')}
              </p>
              <button
                type="button"
                onClick={() => navigate('/jobs/new')}
                className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
              >
                {tx('pages.clientJobs.postFree', undefined, "Post a project — it's free")}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] px-6 py-16 text-center">
              <h3 className="text-lg font-bold text-white mb-2">
                {tx('pages.clientJobs.emptyFilteredTitle', undefined, 'No projects in this tab')}
              </h3>
              <p className="text-sm text-white/40 mb-6">
                {tx('pages.clientJobs.emptyFilteredDescription', undefined, 'Try another tab or adjust search to see your other projects.')}
              </p>
              <button
                type="button"
                onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
                className="inline-flex items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                {tx('pages.clientJobs.showAll', undefined, 'Reset search and show all')}
              </button>
            </div>
          )
        ) : (
          <div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                {jobs.map((job) => (
                  <div key={job.id} className="flex flex-col bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group">
                    {/* Category and Status badges */}
                    <div className="flex justify-between items-center gap-2 mb-3">
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold text-white/50 uppercase tracking-wider">
                        {job.category || tx('pages.clientJobs.uncategorized', undefined, 'Uncategorized')}
                      </span>
                      <span className={`whitespace-nowrap rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusPillClass(job)}`}>
                        {statusLabel(job)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 
                      onClick={() => {
                        if (job.latestContract?.id) {
                          navigate(`/workspace/${job.latestContract?.id}`, {
                            state: { otherUserId: job.latestContract?.freelancer_id || null }
                          });
                        } else {
                          navigate(`/client/jobs/${job.id}/proposals`);
                        }
                      }}
                      className="mb-2 text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 min-h-[3rem] cursor-pointer"
                    >
                      {job.title}
                    </h3>

                    {/* Description Snippet */}
                    {job.description && (
                      <p className="text-xs text-white/40 line-clamp-3 mb-4 leading-relaxed flex-1">
                        {job.description}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="border-t border-white/5 pt-4 mt-auto space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40 flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-amber-500" /> Budget</span>
                        <span className="font-bold text-white">{formatBudget(job)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Proposals</span>
                        <span className="font-bold text-amber-400">{job.proposals?.[0]?.count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-white/30" /> Posted</span>
                        <span className="text-white/60">{formatDaysAgo(job.created_at)}</span>
                      </div>
                    </div>

                    {/* Result box if needed */}
                    <div className="mt-4 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] font-bold tracking-wide uppercase text-center">
                      <span className={resultTextClass(job)}>{outcomeText(job)}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                      {job.latestContract?.id ? (
                        <button
                          onClick={() => navigate(`/workspace/${job.latestContract?.id}`, {
                            state: { otherUserId: job.latestContract?.freelancer_id || null }
                          })}
                          className="flex-1 inline-flex items-center justify-center rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-2 text-xs font-bold text-amber-400 transition-colors gap-1.5"
                        >
                          <Briefcase className="w-3.5 h-3.5" /> {job.derivedStatus === 'finished_success' || job.derivedStatus === 'finished_unsuccessful' ? 'View result' : 'Workspace'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate(`/client/jobs/${job.id}/proposals`)}
                          className="flex-1 inline-flex items-center justify-center rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-2 text-xs font-bold text-amber-400 transition-colors gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> View proposals
                        </button>
                      )}

                      {job.derivedStatus === 'open' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => navigate(getJobEditRoute(job.id))}
                            className="inline-flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-white transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => void handleDeleteJob(job)}
                            disabled={deletingJobId === job.id}
                            className="inline-flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 text-xs font-bold text-rose-400 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      
                      {job.derivedStatus === 'finished_unsuccessful' && (
                        <button
                          onClick={() => handleRepost(job)}
                          className="flex-1 inline-flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-white transition-colors"
                        >
                          Repost project
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : viewMode === 'compact' ? (
              <div className="overflow-x-auto border border-white/5 rounded-2xl bg-white/[0.01] animate-in fade-in duration-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/40">
                      <th className="py-4 px-4">Project Title</th>
                      <th className="py-4 px-4">Category</th>
                      <th className="py-4 px-4">Budget</th>
                      <th className="py-4 px-4 text-center">Proposals</th>
                      <th className="py-4 px-4">Status / Result</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-white/[0.01] transition-colors group">
                        <td className="py-4 px-4 font-bold text-white group-hover:text-amber-400 transition-colors max-w-xs truncate">
                          <span 
                            onClick={() => {
                              if (job.latestContract?.id) {
                                navigate(`/workspace/${job.latestContract?.id}`, {
                                  state: { otherUserId: job.latestContract?.freelancer_id || null }
                                });
                              } else {
                                navigate(`/client/jobs/${job.id}/proposals`);
                              }
                            }}
                            className="cursor-pointer"
                          >
                            {job.title}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs">
                          <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/50 border border-white/5 uppercase tracking-wider">
                            {job.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-xs text-white">
                          {formatBudget(job)}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-xs text-amber-400">
                          {job.proposals?.[0]?.count || 0}
                        </td>
                        <td className="py-4 px-4 text-xs space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${statusPillClass(job)}`}>
                              {statusLabel(job)}
                            </span>
                          </div>
                          <div className={`text-[10px] font-semibold uppercase tracking-wider ${resultTextClass(job)}`}>
                            {outcomeText(job)}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {job.latestContract?.id ? (
                              <button
                                onClick={() => navigate(`/workspace/${job.latestContract?.id}`, {
                                  state: { otherUserId: job.latestContract?.freelancer_id || null }
                                })}
                                className="inline-flex items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
                              >
                                Workspace
                              </button>
                            ) : (
                              <button 
                                onClick={() => navigate(`/client/jobs/${job.id}/proposals`)}
                                className="inline-flex items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
                              >
                                Proposals
                              </button>
                            )}

                            {job.derivedStatus === 'open' && (
                              <>
                                <button
                                  onClick={() => navigate(getJobEditRoute(job.id))}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => void handleDeleteJob(job)}
                                  disabled={deletingJobId === job.id}
                                  className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors disabled:opacity-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {job.derivedStatus === 'finished_unsuccessful' && (
                              <button
                                onClick={() => handleRepost(job)}
                                className="inline-flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-colors"
                              >
                                Repost
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.01] to-transparent overflow-hidden divide-y divide-white/5 animate-in fade-in duration-200">
                {jobs.map((job) => (
                  <div 
                    key={job.id}
                    className="p-6 hover:bg-white/[0.015] transition-all duration-300 flex flex-col lg:flex-row lg:items-start justify-between gap-6 group"
                  >
                    <div className="min-w-0 flex-1 space-y-3">
                      {/* Title */}
                      <h3 
                        onClick={() => {
                          if (job.latestContract?.id) {
                            navigate(`/workspace/${job.latestContract?.id}`, {
                              state: { otherUserId: job.latestContract?.freelancer_id || null }
                            });
                          } else {
                            navigate(`/client/jobs/${job.id}/proposals`);
                          }
                        }}
                        className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors cursor-pointer inline-block"
                      >
                        {job.title}
                      </h3>

                      {/* Categories / Tags / Statuses */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/60 uppercase tracking-wider">
                          {job.category || tx('pages.clientJobs.uncategorized', undefined, 'Uncategorized')}
                        </span>
                        <span className={`whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusPillClass(job)}`}>
                          {statusLabel(job)}
                        </span>
                      </div>
                      
                      {/* Metadata section */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/50">
                        <div className="flex items-center gap-1.5 text-white font-semibold">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <span>{formatBudget(job)}</span>
                        </div>
                        <div className="h-3 w-px bg-white/10"></div>
                        <span className="uppercase text-[10px] font-bold tracking-wider">
                          {job.job_type === 'fixed' || job.job_type === 'fixed_price'
                            ? tx('pages.clientJobs.fixedPrice', undefined, 'Fixed Price')
                            : tx('pages.clientJobs.hourlyRate', undefined, 'Hourly Rate')}
                        </span>
                        <div className="h-3 w-px bg-white/10"></div>
                        <div className="flex items-center gap-1 text-amber-400 font-semibold">
                          <MessageSquare className="w-4 h-4" />
                          <span>{tx('pages.clientJobs.proposalsCount', { count: job.proposals?.[0]?.count || 0 }, `${job.proposals?.[0]?.count || 0} proposals`)}</span>
                        </div>
                        <div className="h-3 w-px bg-white/10"></div>
                        <div className="flex items-center gap-1 text-white/40">
                          <Clock className="w-4 h-4" />
                          <span>{tx('pages.clientJobs.postedAgo', { time: formatDaysAgo(job.created_at) }, `Posted ${formatDaysAgo(job.created_at)}`)}</span>
                        </div>
                      </div>

                      {/* Outcome Box */}
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        {job.derivedStatus === 'needs_attention' ? (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : job.derivedStatus === 'finished_success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : null}
                        <span className={resultTextClass(job)}>{outcomeText(job)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5 sm:flex-col sm:items-end shrink-0 self-center lg:self-start">
                      {job.latestContract?.id ? (
                        <button
                          onClick={() => navigate(`/workspace/${job.latestContract?.id}`, {
                            state: {
                              otherUserId: job.latestContract?.freelancer_id || null,
                            },
                          })}
                          className="inline-flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all duration-200 gap-1.5 shadow-[0_2px_8px_rgba(245,158,11,0.05)]"
                        >
                          <Briefcase className="w-4 h-4" />
                          {job.derivedStatus === 'finished_success' || job.derivedStatus === 'finished_unsuccessful'
                            ? tx('pages.clientJobs.viewResult', undefined, 'View result')
                            : tx('pages.clientJobs.openContract', undefined, 'Workspace')}
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate(`/client/jobs/${job.id}/proposals`)}
                          className="inline-flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all duration-200 gap-1.5 shadow-[0_2px_8px_rgba(245,158,11,0.05)]"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {tx('pages.clientJobs.viewProposals', undefined, 'View proposals')}
                        </button>
                      )}

                      {job.derivedStatus === 'open' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(getJobEditRoute(job.id))}
                            className="inline-flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all duration-200 border border-white/5 hover:border-white/10"
                          >
                            {tx('pages.clientJobs.edit', undefined, 'Edit')}
                          </button>
                          <button
                            onClick={() => void handleDeleteJob(job)}
                            disabled={deletingJobId === job.id}
                            className="inline-flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 disabled:opacity-60 transition-all duration-200"
                          >
                            {deletingJobId === job.id
                              ? tx('pages.clientJobs.deleting', undefined, 'Deleting...')
                              : tx('pages.clientJobs.delete', undefined, 'Delete')}
                          </button>
                        </div>
                      )}
                      
                      {job.derivedStatus === 'finished_unsuccessful' && (
                        <button
                          onClick={() => handleRepost(job)}
                          className="inline-flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all duration-200 border border-white/5"
                        >
                          {tx('pages.clientJobs.repostProject', undefined, 'Repost project')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Modal
        isOpen={!!jobToConfirmDelete}
        onClose={() => setJobToConfirmDelete(null)}
        title={tx('pages.clientJobs.deleteConfirmTitle', undefined, 'Delete Project')}
        size="md"
        footer={
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setJobToConfirmDelete(null)}
              className="px-5 py-2 rounded-lg text-white/50 hover:text-white font-bold transition-colors bg-white/5 hover:bg-white/10"
            >
              {tx('common.cancel', undefined, 'Cancel')}
            </button>
            <button
              onClick={confirmDeleteJob}
              disabled={!!deletingJobId}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
            >
              {tx('pages.clientJobs.delete', undefined, 'Delete')}
            </button>
          </div>
        }
      >
        <p className="text-white/60 mt-2 text-sm">
          {tx('pages.clientJobs.deleteConfirmText', undefined, 'Are you sure you want to delete this project permanently? This action cannot be undone.')}
        </p>
      </Modal>
    </div>
  )
}


