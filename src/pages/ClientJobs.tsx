import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

export default function ClientJobs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'in review' | 'completed'>('all')

  const { data: jobs, isLoading } = useQuery({
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
      return data
    },
    enabled: !!user?.id
  })

  const { data: allJobs } = useQuery({
    queryKey: ['client-jobs-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('status, proposals(count)')
        .eq('client_id', user?.id)
      if (error) throw error
      return data
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
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }

  return (
    <div className="bg-gray-50 dark:bg-[#0f0e17] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your posted projects and proposals</p>
          </div>
          <button
            onClick={() => navigate('/jobs/new')}
            className="bg-amber-500 hover:bg-amber-400 text-white font-medium flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-colors"
          >
            Post a project
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Active</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total proposals received</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.proposals}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Completed</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'active', 'in review', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap transition-colors
                ${activeTab === tab 
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No projects yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              Post your first project and receive proposals from verified professionals.
            </p>
            <button
              onClick={() => navigate('/jobs/new')}
              className="mt-4 bg-amber-500 hover:bg-amber-400 text-white font-medium px-5 py-2 rounded-xl transition-colors"
            >
              Post a project - it's free
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <div 
                key={job.id}
                className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-medium px-2 py-1 rounded-full">
                        {job.category}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap
                        ${job.status === 'open' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : ''}
                        ${job.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}
                        ${job.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                        ${!['open', 'in_progress', 'completed'].includes(job.status) ? 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300' : ''}
                      `}>
                        {job.status.replace('_', ' ').charAt(0).toUpperCase() + job.status.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end flex-shrink-0">
                    {job.proposals && job.proposals[0]?.count > 0 && (
                      <button 
                        onClick={() => navigate(`/jobs/${job.id}/proposals`)}
                        className="text-sm bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        View proposals
                      </button>
                    )}
                    <button 
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                  <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-1">
                    {job.budget_min}-{job.budget_max} TND
                  </p>
                  <p className="text-sm bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                    {job.job_type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {job.proposals?.[0]?.count || 0} proposals
                  </p>
                </div>
                
                <p className="text-sm text-gray-400">
                  Posted {formatDaysAgo(job.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
