import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

export default function MyProposals() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')

  const { data: proposals, isLoading } = useQuery({
    queryKey: ['my-proposals', user?.id, activeTab],
    queryFn: async () => {
      let q = supabase
        .from('proposals')
        .select(`
          *,
          jobs (
            title,
            category
          )
        `)
        .eq('freelancer_id', user?.id)
        .order('created_at', { ascending: false })
      
      if (activeTab !== 'all') {
        q = q.eq('status', activeTab)
      }
      
      const { data, error } = await q
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Calculate stats logically instead of fetching everything again if possible, or just mock stats from total data if we fetched all.
  // We'll just fetch all for stats
  const { data: allProposals } = useQuery({
    queryKey: ['my-proposals-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('status')
        .eq('freelancer_id', user?.id)
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  const stats = {
    sent: allProposals?.length || 0,
    accepted: allProposals?.filter(p => p.status === 'accepted').length || 0,
    pending: allProposals?.filter(p => p.status === 'pending').length || 0,
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Proposals</h1>
          <p className="text-gray-500 dark:text-gray-400">Track every proposal you've sent</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Sent</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.sent}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Accepted</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.accepted}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pending</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'pending', 'accepted', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap transition-colors
                ${activeTab === tab 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-十二">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : !proposals || proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No proposals yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              Browse open projects and send your first proposal.
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="mt-4 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl transition-colors font-medium"
            >
              Browse jobs
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal: any) => (
              <div 
                key={proposal.id}
                className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5 hover:border-purple-200 dark:hover:border-purple-500/30 transition-all group"
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {proposal.jobs?.title || 'Unknown Project'}
                  </h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap
                    ${proposal.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : ''}
                    ${proposal.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                    ${proposal.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : ''}
                  `}>
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                  <p className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                    Your bid: {proposal.bid_amount} TND
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {proposal.delivery_days} days delivery
                  </p>
                </div>
                
                <p className="text-sm text-gray-400">
                  Submitted {formatDaysAgo(proposal.created_at)}
                </p>

                {proposal.status === 'accepted' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                    <button 
                      onClick={() => navigate('/contracts')}
                      className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                    >
                      View contract →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}