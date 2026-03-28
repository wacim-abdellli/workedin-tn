import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen } from 'lucide-react'
import { Header } from '@/components/layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from '@/i18n'
import EmptyState from '@/components/common/EmptyState'

interface JobProposalCountRow {
  count: number;
}

interface ClientJobRow {
  id: string;
  title: string;
  category: string;
  status: string;
  budget_min: number;
  budget_max: number;
  job_type: string;
  created_at: string;
  proposals?: JobProposalCountRow[];
}

export default function ClientJobs() {
  const { user } = useAuth()
  const { tx } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'in review' | 'completed'>('all')

  const { data: jobs, isLoading } = useQuery<ClientJobRow[]>({
    queryKey: ['client-jobs', user?.id, activeTab],
    queryFn: async () => {
      let q = supabase
        .from('jobs')
        .select('*, proposals(count)')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false })
      
      if (activeTab === 'active') q = q.in('status', ['open', 'in_progress'])
      if (activeTab === 'in review') q = q.eq('status', 'in_review')
      if (activeTab === 'completed') q = q.eq('status', 'completed')
      
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as unknown as ClientJobRow[]
    },
    enabled: !!user?.id
  })

  const { data: allJobs } = useQuery<ClientJobRow[]>({
    queryKey: ['client-jobs-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('status, proposals(count)')
        .eq('client_id', user?.id)
      if (error) throw error
      return (data ?? []) as unknown as ClientJobRow[]
    },
    enabled: !!user?.id
  })

  const stats = {
    active: allJobs?.filter(j => ['open', 'in_progress'].includes(j.status)).length || 0,
    proposals: allJobs?.reduce((acc, curr) => acc + (curr.proposals?.[0]?.count || 0), 0) || 0,
    completed: allJobs?.filter(j => j.status === 'completed').length || 0,
  }

  const formatDaysAgo = (dateStr: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24))
    if (days === 0) return tx('pages.clientJobs.today', undefined, 'Today')
    if (days === 1) return tx('pages.clientJobs.oneDayAgo', undefined, '1 day ago')
    return tx('pages.clientJobs.daysAgo', { days }, `${days} days ago`)
  }

  const tabLabel = (tab: 'all' | 'active' | 'in review' | 'completed') => {
    if (tab === 'all') return tx('pages.clientJobs.all', undefined, 'All')
    if (tab === 'active') return tx('pages.clientJobs.active', undefined, 'Active')
    if (tab === 'in review') return tx('pages.clientJobs.inReview', undefined, 'In review')
    return tx('pages.clientJobs.completed', undefined, 'Completed')
  }

  const statusLabel = (status: string) => {
    if (status === 'open') return tx('pages.clientJobs.status.open', undefined, 'Open')
    if (status === 'in_progress') return tx('pages.clientJobs.status.inProgress', undefined, 'In Progress')
    if (status === 'in_review') return tx('pages.clientJobs.status.inReview', undefined, 'In Review')
    if (status === 'completed') return tx('pages.clientJobs.status.completed', undefined, 'Completed')
    return status.replace('_', ' ')
  }

  return (
    <div className="page-shell">
      <Header />
      <div className="page-shell-content">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tx('pages.clientJobs.title', undefined, 'My Projects')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{tx('pages.clientJobs.subtitle', undefined, 'Manage your posted projects and proposals')}</p>
          </div>
          <button
            onClick={() => navigate('/jobs/new')}
            className="bg-amber-500 hover:bg-amber-400 text-white font-medium flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-colors"
          >
            {tx('pages.clientJobs.postProject', undefined, 'Post a project')}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{tx('pages.clientJobs.active', undefined, 'Active')}</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.active}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{tx('pages.clientJobs.proposalsReceived', undefined, 'Total proposals received')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.proposals}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{tx('pages.clientJobs.completed', undefined, 'Completed')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="tabs-row mb-6 overflow-x-auto pb-2">
          {(['all', 'active', 'in review', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-pill whitespace-nowrap
                ${activeTab === tab 
                  ? 'tab-pill-active bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
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
                        {job.category}
                      </span>
                      <span className={`whitespace-nowrap
                        ${job.status === 'open' ? 'status-pill-pending' : ''}
                        ${job.status === 'in_progress' ? 'status-pill-progress' : ''}
                        ${job.status === 'completed' ? 'status-pill-completed' : ''}
                        ${!['open', 'in_progress', 'completed'].includes(job.status) ? 'status-pill-neutral' : ''}
                      `}>
                        {statusLabel(job.status)}
                      </span>
                    </div>
                  </div>
                  <div className="list-actions">
                    {job.proposals && job.proposals[0]?.count > 0 && (
                      <button 
                        onClick={() => navigate(`/jobs/${job.id}/proposals`)}
                        className="list-action-btn-primary"
                      >
                        {tx('pages.clientJobs.viewProposals', undefined, 'View proposals')}
                      </button>
                    )}
                    <button 
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="list-action-btn-secondary"
                    >
                      {tx('pages.clientJobs.edit', undefined, 'Edit')}
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                  <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-1">
                    {job.budget_min}-{job.budget_max} TND
                  </p>
                  <p className="status-pill-neutral px-2 py-0.5">
                    {job.job_type === 'fixed' ? tx('pages.clientJobs.fixedPrice', undefined, 'Fixed Price') : tx('pages.clientJobs.hourlyRate', undefined, 'Hourly Rate')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tx('pages.clientJobs.proposalsCount', { count: job.proposals?.[0]?.count || 0 }, `${job.proposals?.[0]?.count || 0} proposals`)}
                  </p>
                </div>
                
                <p className="text-sm text-gray-400">
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
