import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJobEditRoute } from '@/lib/routes'
import { FolderOpen } from 'lucide-react'
import { Header } from '@/components/layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from '@/i18n'
import EmptyState from '@/components/ui/EmptyState'
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
  status: string;
  payment_status: string | null;
  created_at: string;
  updated_at?: string | null;
}

type JobListTab = 'all' | 'active' | 'attention' | 'finished';
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

const deriveJobStatus = (jobStatus: string, contract: ContractStatusRow | null): DerivedJobStatus => {
  const normalizedJobStatus = normalize(jobStatus);
  const normalizedContractStatus = normalize(contract?.status);

  if (normalizedContractStatus === 'completed' || normalizedJobStatus === 'completed') return 'finished_success';
  if (normalizedContractStatus === 'cancelled' || normalizedContractStatus === 'canceled' || normalizedJobStatus === 'cancelled') return 'finished_unsuccessful';
  if (normalizedContractStatus === 'disputed' || normalizedJobStatus === 'disputed' || normalizedJobStatus === 'in_review') return 'needs_attention';
  if (normalizedContractStatus === 'active' || normalizedJobStatus === 'in_progress' || normalizedJobStatus === 'matched') return 'in_progress';
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
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<JobListTab>('all')

  const { data: allJobs = [], isLoading } = useQuery<EnrichedClientJob[]>({
    queryKey: ['client-jobs-v3', user?.id],
    queryFn: async () => {
      const [jobsResult, contractsResult] = await Promise.all([
        supabase
          .from('jobs')
          .select('id, title, category, subcategory, description, status, budget_min, budget_max, hourly_rate, job_type, duration, experience_level, visibility, deadline, required_skills, reference_links, created_at, proposals(count)')
          .eq('client_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('contracts')
          .select('id, job_id, status, payment_status, created_at, updated_at')
          .eq('client_id', user?.id),
      ]);

      if (jobsResult.error) throw jobsResult.error;
      if (contractsResult.error && contractsResult.error.code !== 'PGRST116') throw contractsResult.error;

      const latestContractByJob = pickLatestContractByJob((contractsResult.data ?? []) as ContractStatusRow[]);

      return ((jobsResult.data ?? []) as unknown as ClientJobRow[]).map((job) => {
        const latestContract = latestContractByJob.get(job.id) ?? null;
        return {
          ...job,
          latestContract,
          derivedStatus: deriveJobStatus(job.status, latestContract),
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 20_000,
  });

  const jobs = useMemo(() => {
    if (activeTab === 'active') {
      return allJobs.filter((job) => job.derivedStatus === 'open' || job.derivedStatus === 'in_progress');
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
    if (job.derivedStatus === 'open') return 'status-pill-pending';
    if (job.derivedStatus === 'in_progress') return 'status-pill-progress';
    if (job.derivedStatus === 'finished_success') return 'status-pill-completed';
    if (job.derivedStatus === 'needs_attention') return 'status-pill-neutral';
    return 'status-pill-neutral';
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

  return (
    <div className="page-shell">
      <Header />
      <div className="page-shell-content">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-white">{tx('pages.clientJobs.title', undefined, 'My Projects')}</h1>
            <p className="text-muted mt-1">{tx('pages.clientJobs.subtitle', undefined, 'Manage your posted projects and proposals')}</p>
          </div>
          <button
            onClick={() => navigate('/jobs/new')}
            className="bg-amber-500 hover:bg-amber-400 text-white font-medium flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-colors"
          >
            {tx('pages.clientJobs.postProject', undefined, 'Post a project')}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-sm text-muted font-medium">{tx('pages.clientJobs.open', undefined, 'Open')}</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.open}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted font-medium">{tx('pages.clientJobs.inProgress', undefined, 'In progress')}</p>
            <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{stats.inProgress}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted font-medium">{tx('pages.clientJobs.needsAttention', undefined, 'Needs attention')}</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.needsAttention}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted font-medium">{tx('pages.clientJobs.finished', undefined, 'Finished')}</p>
            <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{stats.finished}</p>
            <p className="text-xs text-muted mt-1">
              {tx('pages.clientJobs.finishedBreakdown', { success: stats.finishedSuccess, unsuccessful: stats.finishedUnsuccessful }, `${stats.finishedSuccess} success / ${stats.finishedUnsuccessful} unsuccessful`) }
            </p>
          </div>
        </div>

        {/* Lifecycle legend */}
        <div className="rounded-2xl border px-4 py-3 mb-6"
          style={{ background: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {tx('pages.clientJobs.lifecycleLegendTitle', undefined, 'Project lifecycle')}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-status-warning)' }} />
              {tx('pages.clientJobs.legendOpen', undefined, 'Open: waiting for hiring decision')}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--workspace-primary)' }} />
              {tx('pages.clientJobs.legendProgress', undefined, 'In progress: active contract running')}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-status-error)' }} />
              {tx('pages.clientJobs.legendAttention', undefined, 'Needs attention: dispute/review action needed')}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-status-success)' }} />
              {tx('pages.clientJobs.legendFinished', undefined, 'Finished: completed or cancelled outcome')}
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="tabs-row mb-6 overflow-x-auto pb-2">
          {(['all', 'active', 'attention', 'finished'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-pill whitespace-nowrap
                ${activeTab === tab 
                  ? 'tab-pill-active bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' 
                  : 'text-muted hover:text-foreground'
                }`}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : !jobs || jobs.length === 0 ? (
          allJobs.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={tx('pages.clientJobs.emptyTitle', undefined, 'No projects yet')}
              description={tx('pages.clientJobs.emptyDescription', undefined, 'Post your first project and receive proposals from verified professionals.')}
              action={{
                label: tx('pages.clientJobs.postFree', undefined, "Post a project — it's free"),
                onClick: () => navigate('/jobs/new'),
                variant: 'primary',
              }}
            />
          ) : (
            <div className="rounded-2xl border px-6 py-10 text-center"
              style={{ background: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {tx('pages.clientJobs.emptyFilteredTitle', undefined, 'No projects in this tab')}
              </h3>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                {tx('pages.clientJobs.emptyFilteredDescription', undefined, 'Try another tab to see your other projects.')}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="list-action-btn-primary"
              >
                {tx('pages.clientJobs.showAll', undefined, 'Show all projects')}
              </button>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div 
                key={job.id}
                className="list-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="list-card-title mb-2">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-medium px-2 py-1 rounded-full">
                        {job.category || tx('pages.clientJobs.uncategorized', undefined, 'Uncategorized')}
                      </span>
                      <span className={`whitespace-nowrap ${statusPillClass(job)}`}>
                        {statusLabel(job)}
                      </span>
                    </div>
                  </div>
                  <div className="list-actions">
                    {job.latestContract?.id ? (
                      <button
                        onClick={() => navigate(`/contracts/${job.latestContract?.id}`)}
                        className="list-action-btn-primary"
                      >
                        {job.derivedStatus === 'finished_success' || job.derivedStatus === 'finished_unsuccessful'
                          ? tx('pages.clientJobs.viewResult', undefined, 'View result')
                          : tx('pages.clientJobs.openContract', undefined, 'Open contract')}
                      </button>
                    ) : job.proposals && job.proposals[0]?.count > 0 && (
                      <button 
                        onClick={() => navigate(`/client/jobs/${job.id}/proposals`)}
                        className="list-action-btn-primary"
                      >
                        {tx('pages.clientJobs.viewProposals', undefined, 'View proposals')}
                      </button>
                    )}
                    {job.derivedStatus === 'open' && (
                      <button
                        onClick={() => navigate(getJobEditRoute(job.id))}
                        className="list-action-btn-secondary"
                      >
                        {tx('pages.clientJobs.edit', undefined, 'Edit')}
                      </button>
                    )}
                    {job.derivedStatus === 'finished_unsuccessful' && (
                      <button
                        onClick={() => handleRepost(job)}
                        className="list-action-btn-secondary"
                      >
                        {tx('pages.clientJobs.repostProject', undefined, 'Repost project')}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                  <p className="text-foreground dark:text-white font-semibold flex items-center gap-1">
                    {formatBudget(job)}
                  </p>
                  <p className="status-pill-neutral px-2 py-0.5">
                    {job.job_type === 'fixed' || job.job_type === 'fixed_price'
                      ? tx('pages.clientJobs.fixedPrice', undefined, 'Fixed Price')
                      : tx('pages.clientJobs.hourlyRate', undefined, 'Hourly Rate')}
                  </p>
                  <p className="text-sm text-muted">
                    {tx('pages.clientJobs.proposalsCount', { count: job.proposals?.[0]?.count || 0 }, `${job.proposals?.[0]?.count || 0} proposals`)}
                  </p>
                </div>

                <p className="text-sm font-medium mb-2" style={{ color: 'var(--workspace-primary-mid)' }}>
                  {outcomeText(job)}
                </p>
                
                <p className="text-sm text-muted">
                  {tx('pages.clientJobs.postedAgo', { time: formatDaysAgo(job.created_at) }, `Posted ${formatDaysAgo(job.created_at)}`)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
