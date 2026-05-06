import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobEditRoute } from '@/lib/routes'
import { FolderOpen } from 'lucide-react'
import { Header } from '@/components/layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/i18n'
import EmptyState from '@/components/ui/EmptyState'
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
    if (normalizedContractStatus === 'delivery_submitted') return 'in_progress';
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
  const [activeTab, setActiveTab] = useState<JobListTab>('all')
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
    if (activeTab === 'active') {
      return allJobs.filter((job) => job.derivedStatus === 'open' || job.derivedStatus === 'in_progress');
    }
    if (activeTab === 'proposals') {
      return allJobs.filter((job) => (job.proposals?.[0]?.count || 0) > 0);
    }
    if (activeTab === 'attention') {
      return allJobs.filter((job) => job.derivedStatus === 'needs_attention');
    }
    if (activeTab === 'finished') {
      return allJobs.filter((job) => job.derivedStatus === 'finished_success' || job.derivedStatus === 'finished_unsuccessful');
    }
    return allJobs;
  }, [activeTab, allJobs]);

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
    if (tab === 'all') return tx('pages.clientJobs.all', undefined, 'All')
    if (tab === 'active') return tx('pages.clientJobs.active', undefined, 'Active')
    if (tab === 'proposals') return tx('pages.clientJobs.withProposals', undefined, 'With Proposals')
    if (tab === 'attention') return tx('pages.clientJobs.needsAttention', undefined, 'Needs attention')
    return tx('pages.clientJobs.finished', undefined, 'Finished')
  }

  const statusLabel = (job: EnrichedClientJob) => {
    if (job.derivedStatus === 'open') return tx('pages.clientJobs.status.open', undefined, 'Open')
    if (job.derivedStatus === 'in_progress') return tx('pages.clientJobs.status.inProgress', undefined, 'In Progress')
    if (job.derivedStatus === 'needs_attention') {
      const isDisputed = normalize(job.latestContract?.status) === 'disputed' || normalize(job.status) === 'disputed';
      return isDisputed
        ? tx('pages.clientJobs.status.disputed', undefined, 'Disputed')
        : tx('pages.clientJobs.status.inReview', undefined, 'In Review');
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
      return tx('pages.clientJobs.result.attention', undefined, 'Result: Needs resolution before closing');
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] p-5">
            <p className="text-xs text-white/50 font-bold uppercase tracking-wider">{tx('pages.clientJobs.open', undefined, 'Open')}</p>
            <p className="text-2xl font-black text-amber-500 mt-1">{stats.open}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] p-5">
            <p className="text-xs text-white/50 font-bold uppercase tracking-wider">{tx('pages.clientJobs.inProgress', undefined, 'In progress')}</p>
            <p className="text-2xl font-black text-sky-400 mt-1">{stats.inProgress}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] p-5">
            <p className="text-xs text-white/50 font-bold uppercase tracking-wider">{tx('pages.clientJobs.needsAttention', undefined, 'Needs attention')}</p>
            <p className="text-2xl font-black text-rose-400 mt-1">{stats.needsAttention}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[var(--color-bg-base)] p-5">
            <p className="text-xs text-white/50 font-bold uppercase tracking-wider">{tx('pages.clientJobs.finished', undefined, 'Finished')}</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.finished}</p>
            <p className="text-[10px] font-semibold text-white/30 mt-1 uppercase tracking-widest">
              {tx('pages.clientJobs.finishedBreakdown', { success: stats.finishedSuccess, unsuccessful: stats.finishedUnsuccessful }, `${stats.finishedSuccess} success / ${stats.finishedUnsuccessful} unsuccessful`) }
            </p>
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
                {tx('pages.clientJobs.emptyFilteredDescription', undefined, 'Try another tab to see your other projects.')}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="inline-flex items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                {tx('pages.clientJobs.showAll', undefined, 'Show all projects')}
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col rounded-xl border border-white/5 bg-[var(--color-bg-base)] overflow-hidden">
            {jobs.map((job, index) => (
              <div 
                key={job.id}
                className={`p-6 hover:bg-white/[0.02] transition-colors flex flex-col lg:flex-row lg:items-start justify-between gap-6 group ${index < jobs.length - 1 ? "border-b border-white/5" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="mb-2 text-base font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/60 uppercase tracking-wider">
                      {job.category || tx('pages.clientJobs.uncategorized', undefined, 'Uncategorized')}
                    </span>
                    <span className={`whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusPillClass(job)}`}>
                      {statusLabel(job)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                    <p className="text-xs font-bold text-white">
                      {formatBudget(job)}
                    </p>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                      {job.job_type === 'fixed' || job.job_type === 'fixed_price'
                        ? tx('pages.clientJobs.fixedPrice', undefined, 'Fixed Price')
                        : tx('pages.clientJobs.hourlyRate', undefined, 'Hourly Rate')}
                    </p>
                    <p className="text-xs font-medium text-amber-400/80">
                      {tx('pages.clientJobs.proposalsCount', { count: job.proposals?.[0]?.count || 0 }, `${job.proposals?.[0]?.count || 0} proposals`)}
                    </p>
                  </div>

                  <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${resultTextClass(job)}`}>
                    {outcomeText(job)}
                  </p>
                  
                  <p className="text-xs text-white/30 font-medium">
                    {tx('pages.clientJobs.postedAgo', { time: formatDaysAgo(job.created_at) }, `Posted ${formatDaysAgo(job.created_at)}`)}
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
                  {job.latestContract?.id ? (
                    <button
                      onClick={() => navigate(`/workspace/${job.latestContract?.id}`, {
                        state: {
                          otherUserId: job.latestContract?.freelancer_id || null,
                        },
                      })}
                      className="inline-flex items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
                    >
                      {job.derivedStatus === 'finished_success' || job.derivedStatus === 'finished_unsuccessful'
                        ? tx('pages.clientJobs.viewResult', undefined, 'View result')
                        : tx('pages.clientJobs.openContract', undefined, 'Workspace')}
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/client/jobs/${job.id}/proposals`)}
                      className="inline-flex items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
                    >
                      {tx('pages.clientJobs.viewProposals', undefined, 'View proposals')}
                    </button>
                  )}
                  {job.derivedStatus === 'open' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(getJobEditRoute(job.id))}
                        className="inline-flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors"
                      >
                        {tx('pages.clientJobs.edit', undefined, 'Edit')}
                      </button>
                      <button
                        onClick={() => void handleDeleteJob(job)}
                        disabled={deletingJobId === job.id}
                        className="inline-flex items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 disabled:opacity-60 transition-colors"
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
                      className="inline-flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors"
                    >
                      {tx('pages.clientJobs.repostProject', undefined, 'Repost project')}
                    </button>
                  )}
                </div>
              </div>
            ))}
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


