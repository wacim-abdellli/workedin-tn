import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'

import { Header } from '@/components/layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/i18n'

type ProposalTab = 'all' | 'pending' | 'accepted' | 'rejected'

type ProposalRow = {
  id: string
  bid_amount: number
  created_at: string
  delivery_days: number
  status: 'pending' | 'accepted' | 'rejected' | string
  jobs?: {
    title?: string | null
    category?: string | null
  } | null
}

export default function MyProposals() {
  const { user } = useAuth()
  const { tx } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ProposalTab>('all')

  const { data: proposals, isLoading } = useQuery({
    queryKey: ['my-proposals', user?.id, activeTab],
    queryFn: async () => {
      let query = supabase
        .from('proposals')
        .select(
          `
            *,
            jobs (
              title,
              category
            )
          `
        )
        .eq('freelancer_id', user?.id)
        .order('created_at', { ascending: false })

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as ProposalRow[]
    },
    enabled: !!user?.id,
  })

  const { data: allProposals } = useQuery({
    queryKey: ['my-proposals-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('status')
        .eq('freelancer_id', user?.id)

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })

  const stats = {
    sent: allProposals?.length || 0,
    accepted: allProposals?.filter((proposal) => proposal.status === 'accepted').length || 0,
    pending: allProposals?.filter((proposal) => proposal.status === 'pending').length || 0,
  }

  const formatDaysAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 3600 * 24))
    if (days === 0) return tx('pages.myProposals.today', undefined, 'Today')
    if (days === 1) return tx('pages.myProposals.oneDayAgo', undefined, '1 day ago')
    return tx('pages.myProposals.daysAgo', { days }, `${days} days ago`)
  }

  const tabLabel = (tab: ProposalTab) => {
    if (tab === 'all') return tx('pages.myProposals.all', undefined, 'All')
    if (tab === 'pending') return tx('pages.myProposals.pending', undefined, 'Pending')
    if (tab === 'accepted') return tx('pages.myProposals.accepted', undefined, 'Accepted')
    return tx('pages.myProposals.rejected', undefined, 'Rejected')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0e17]">
      <Header />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tx('pages.myProposals.title', undefined, 'My Proposals')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{tx('pages.myProposals.subtitle', undefined, "Track every proposal you've sent")}</p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{tx('pages.myProposals.sent', undefined, 'Sent')}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.sent}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{tx('pages.myProposals.accepted', undefined, 'Accepted')}</p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{stats.accepted}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{tx('pages.myProposals.pending', undefined, 'Pending')}</p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
          </div>
        </div>

        <div className="tabs-row mb-6 overflow-x-auto pb-2">
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-pill whitespace-nowrap ${
                activeTab === tab
                  ? 'tab-pill-active bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
          </div>
        ) : !proposals || proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-4 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{tx('pages.myProposals.emptyTitle', undefined, 'No proposals yet')}</h3>
            <p className="mt-1 max-w-sm text-gray-500 dark:text-gray-400">
              {tx('pages.myProposals.emptyDescription', undefined, 'Browse open projects and send your first proposal.')}
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="btn-secondary btn-sm mt-4"
            >
              {tx('pages.myProposals.browseJobs', undefined, 'Browse jobs')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="list-card group"
              >
                <div className="mb-2 flex items-start justify-between gap-4">
                  <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                    {proposal.jobs?.title || tx('pages.myProposals.unknownProject', undefined, 'Unknown Project')}
                  </h3>
                  <span
                    className={`whitespace-nowrap ${
                      proposal.status === 'pending'
                        ? 'status-pill-pending'
                        : proposal.status === 'accepted'
                          ? 'status-pill-completed'
                          : 'status-pill-cancelled'
                    }`}
                  >
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </span>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {tx('pages.myProposals.yourBid', { amount: proposal.bid_amount }, `Your bid: ${proposal.bid_amount} TND`)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tx('pages.myProposals.deliveryDays', { days: proposal.delivery_days }, `${proposal.delivery_days} days delivery`)}
                  </p>
                </div>

                <p className="text-sm text-gray-400">{tx('pages.myProposals.submittedAgo', { time: formatDaysAgo(proposal.created_at) }, `Submitted ${formatDaysAgo(proposal.created_at)}`)}</p>

                {proposal.status === 'accepted' ? (
                  <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/5">
                    <button
                      onClick={() => navigate('/contracts')}
                      className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      {`${tx('pages.myProposals.viewContract', undefined, 'View contract')} ->`}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
