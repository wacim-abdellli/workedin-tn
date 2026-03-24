import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { useWorkspaceStore } from '@/lib/workspaceState'

export default function ContractsList() {
  const { user } = useAuth()
  const { activeWorkspace } = useWorkspaceStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'disputed'>('all')

  const isFreelancer = activeWorkspace === 'freelancer'

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts', user?.id, activeTab],
    queryFn: async () => {
      let q = supabase
        .from('contracts')
        .select(`
          *,
          jobs (title),
          freelancer:freelancer_id(full_name, avatar_url),
          client:client_id(full_name, avatar_url)
        `)
        
      if (isFreelancer) {
        q = q.eq('freelancer_id', user?.id)
      } else {
        q = q.eq('client_id', user?.id)
      }

      if (activeTab !== 'all') {
        q = q.eq('status', activeTab)
      }

      q = q.order('created_at', { ascending: false })
      
      const { data, error } = await q
      if (error && error.code !== 'PGRST116') throw error
      return data || []
    },
    enabled: !!user?.id
  })

  // Count milestones logic would normally fetch milestones, but we'll mock basic progress based on what exists on the contract record or fetch it if needed.
  // For now we'll just show mock progress for the UI or use total_milestones/completed_milestones on contract if available.

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const activeCount = contracts?.filter(c => c.status === 'active').length || 0

  return (
    <div className="bg-gray-50 dark:bg-[#0f0e17] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contracts</h1>
            {activeCount > 0 && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                isFreelancer 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              }`}>
                {activeCount} Active
              </span>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'active', 'completed', 'disputed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap transition-colors
                ${activeTab === tab 
                  ? isFreelancer 
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
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
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isFreelancer ? 'border-purple-600' : 'border-amber-500'}`}></div>
          </div>
        ) : !contracts || contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No contracts yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              {isFreelancer 
                ? "Send proposals to get your first contract." 
                : "Hire a freelancer to create your first contract."}
            </p>
            <button
              onClick={() => navigate(isFreelancer ? '/jobs' : '/jobs/new')}
              className={`mt-4 px-5 py-2 rounded-xl transition-colors font-medium text-white
                ${isFreelancer ? 'bg-purple-600 hover:bg-purple-500' : 'bg-amber-500 hover:bg-amber-400'}
              `}
            >
              {isFreelancer ? 'Browse jobs' : 'Post a project'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract: any) => {
              const partner = isFreelancer ? contract.client : contract.freelancer
              const roleLabel = isFreelancer ? 'Client' : 'Freelancer'
              const progressIndicatorColor = isFreelancer ? 'bg-purple-500' : 'bg-amber-500'
              const progressPercentage = 30 // Mock 30%

              return (
                <div 
                  key={contract.id}
                  className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                        {contract.jobs?.title || 'Unknown Project'}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap
                          ${contract.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}
                          ${contract.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                          ${contract.status === 'disputed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : ''}
                        `}>
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{contract.amount} TND</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Started {formatDate(contract.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{roleLabel}:</p>
                    <div className="flex items-center gap-1.5">
                      {partner?.avatar_url ? (
                        <img src={partner.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500">
                          {partner?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{partner?.full_name || 'Unknown User'}</span>
                    </div>
                  </div>
                  
                  {/* Milestone progress bar - visual mock */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">1 of 3 milestones complete</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${progressIndicatorColor}`} style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
                    <button 
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                      className={`text-sm font-medium transition-colors ${
                        isFreelancer 
                          ? 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300' 
                          : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
                      }`}
                    >
                      Open workspace →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
