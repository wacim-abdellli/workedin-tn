import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { Header } from '@/components/layout'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/i18n'
import { supabase } from '@/lib/supabase'
import { useWorkspaceStore } from '@/lib/workspaceState'

type ContractTab = 'all' | 'active' | 'completed' | 'disputed'

type ContractRow = {
  id: string
  amount: number
  created_at: string
  status: 'active' | 'completed' | 'disputed' | string
  jobs?: { title?: string | null } | null
  freelancer?: { full_name?: string | null; avatar_url?: string | null } | null
  client?: { full_name?: string | null; avatar_url?: string | null } | null
}

export default function ContractsList() {
  const { user } = useAuth()
  const { language, tx } = useTranslation()
  const { activeWorkspace } = useWorkspaceStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ContractTab>('all')

  const isFreelancer = activeWorkspace === 'freelancer'

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts', user?.id, activeTab, isFreelancer],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select(
          `
            *,
            jobs (title),
            freelancer:freelancer_id(full_name, avatar_url),
            client:client_id(full_name, avatar_url)
          `
        )

      query = isFreelancer
        ? query.eq('freelancer_id', user?.id)
        : query.eq('client_id', user?.id)

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error && error.code !== 'PGRST116') throw error
      return (data || []) as ContractRow[]
    },
    enabled: !!user?.id,
  })

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const tabLabel = (tab: ContractTab) => {
    if (tab === 'all') return tx('contracts.tabs.all', undefined, 'All')
    if (tab === 'active') return tx('contracts.tabs.active', undefined, 'Active')
    if (tab === 'completed') return tx('contracts.tabs.completed', undefined, 'Completed')
    return tx('contracts.tabs.disputed', undefined, 'Disputed')
  }

  const statusLabel = (status: string) => {
    if (status === 'active') return tx('contracts.status.active', undefined, 'Active')
    if (status === 'completed') return tx('contracts.status.completed', undefined, 'Completed')
    if (status === 'disputed') return tx('contracts.status.disputed', undefined, 'Disputed')
    return status
  }

  const activeCount = contracts?.filter((contract) => contract.status === 'active').length || 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0e17]">
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tx('contracts.title', undefined, 'Contracts')}</h1>
            {activeCount > 0 ? (
              <span
                className={`rounded-full px-2 py-1 text-xs font-bold ${
                  isFreelancer
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}
              >
                {tx('contracts.activeCount', { count: activeCount }, `${activeCount} Active`)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {(['all', 'active', 'completed', 'disputed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? isFreelancer
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div
              className={`h-8 w-8 animate-spin rounded-full border-b-2 ${
                isFreelancer ? 'border-purple-600' : 'border-amber-500'
              }`}
            />
          </div>
        ) : !contracts || contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="mb-4 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{tx('contracts.empty.title', undefined, 'No contracts yet')}</h3>
            <p className="mt-1 max-w-sm text-gray-500 dark:text-gray-400">
              {isFreelancer
                ? tx('contracts.empty.freelancerDescription', undefined, 'Send proposals to get your first contract.')
                : tx('contracts.empty.clientDescription', undefined, 'Hire a freelancer to create your first contract.')}
            </p>
            <button
              onClick={() => navigate(isFreelancer ? '/jobs' : '/jobs/new')}
              className={`mt-4 rounded-xl px-5 py-2 font-medium text-white transition-colors ${
                isFreelancer ? 'bg-purple-600 hover:bg-purple-500' : 'bg-amber-500 hover:bg-amber-400'
              }`}
            >
              {isFreelancer
                ? tx('contracts.empty.freelancerCta', undefined, 'Browse jobs')
                : tx('contracts.empty.clientCta', undefined, 'Post a project')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => {
              const partner = isFreelancer ? contract.client : contract.freelancer
              const roleLabel = isFreelancer
                ? tx('contracts.role.client', undefined, 'Client')
                : tx('contracts.role.freelancer', undefined, 'Freelancer')
              const progressIndicatorColor = isFreelancer ? 'bg-purple-500' : 'bg-amber-500'
              const progressPercentage = 30

              return (
                <div
                  key={contract.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-gray-200 dark:border-white/5 dark:bg-[#1a1825] dark:hover:border-white/10"
                >
                  <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {contract.jobs?.title || tx('contracts.unknownProject', undefined, 'Unknown Project')}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                            contract.status === 'active'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : contract.status === 'completed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {statusLabel(contract.status)}
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{contract.amount} TND</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {tx('contracts.startedOn', { date: formatDate(contract.created_at) }, `Started ${formatDate(contract.created_at)}`)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{roleLabel}:</p>
                    <div className="flex items-center gap-1.5">
                      {partner?.avatar_url ? (
                        <img src={partner.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 dark:bg-gray-800">
                          {partner?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {partner?.full_name || tx('contracts.unknownUser', undefined, 'Unknown User')}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{tx('contracts.milestonesProgress', undefined, '1 of 3 milestones complete')}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                      <div className={`h-full ${progressIndicatorColor}`} style={{ width: `${progressPercentage}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-white/5">
                    <button
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                      className={`text-sm font-medium transition-colors ${
                        isFreelancer
                          ? 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300'
                          : 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300'
                      }`}
                    >
                      {tx('contracts.openWorkspace', undefined, 'Open workspace ->')}
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
