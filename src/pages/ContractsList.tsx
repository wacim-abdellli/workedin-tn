import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { Header } from '@/components/layout'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/i18n'
import { supabase } from '@/lib/supabase'
import { useWorkspaceStore } from '@/lib/workspaceState'
import EmptyState from '@/components/common/EmptyState'

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
    <div className="page-shell">
      <Header />

      <div className="page-shell-content-narrow">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">{tx('contracts.title', undefined, 'Contracts')}</h1>
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

        <div className="tabs-row">
          {(['all', 'active', 'completed', 'disputed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? isFreelancer
                    ? 'header-nav-link-active-freelancer'
                    : 'header-nav-link-active-client'
                  : 'tab-pill'
              }
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
          <EmptyState
            icon={ClipboardList}
            title={tx('contracts.empty.title', undefined, 'No contracts yet')}
            description={isFreelancer
              ? tx('contracts.empty.freelancerDescription', undefined, 'Send proposals to get your first contract.')
              : tx('contracts.empty.clientDescription', undefined, 'Hire a freelancer to create your first contract.')}
            action={{
              label: isFreelancer
                ? tx('contracts.empty.freelancerCta', undefined, 'Browse jobs')
                : tx('contracts.empty.clientCta', undefined, 'Post a project'),
              onClick: () => navigate(isFreelancer ? '/jobs' : '/jobs/new'),
              variant: 'primary',
            }}
          />
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
                  className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-5 transition-colors hover:border-gray-200 dark:border-gray-700 dark:border-white/5 dark:bg-[#1a1825] dark:hover:border-white/10"
                >
                  <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">
                        {contract.jobs?.title || tx('contracts.unknownProject', undefined, 'Unknown Project')}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`whitespace-nowrap ${
                            contract.status === 'active'
                              ? 'status-pill-open'
                              : contract.status === 'completed'
                                ? 'status-pill-completed'
                                : 'status-pill-cancelled'
                          }`}
                        >
                          {statusLabel(contract.status)}
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white">{contract.amount} TND</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {tx('contracts.startedOn', { date: formatDate(contract.created_at) }, `Started ${formatDate(contract.created_at)}`)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{roleLabel}:</p>
                    <div className="flex items-center gap-1.5">
                      {partner?.avatar_url ? (
                          <img src={partner.avatar_url} alt={partner?.full_name || 'User'} className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 dark:bg-gray-800">
                          {partner?.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-white">
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

                  <div className="flex justify-end border-t border-gray-100 dark:border-gray-800 pt-4 dark:border-white/5">
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
