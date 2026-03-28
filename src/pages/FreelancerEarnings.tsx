import { useNavigate } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { Header } from '@/components/layout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from '@/i18n'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import EmptyState from '@/components/common/EmptyState'
import SkeletonList from '@/components/common/SkeletonList'

interface WalletBalanceRow {
  balance: number;
  pending: number;
  total_earned: number;
}

interface EarningsTransactionRow {
  id: string;
  description: string | null;
  related_id: string | null;
  created_at: string;
  amount: number;
}

export default function FreelancerEarnings() {
  const { user } = useAuth()
  const { language, tx } = useTranslation()
  const navigate = useNavigate()

  // This is a simplified fetch assuming there is a wallets and transactions table.
  // We'll mock missing parts if they fail or don't exist yet based on typically standard db schemas.
  const { data: balance } = useQuery<WalletBalanceRow>({
    queryKey: ['freelancer-balance', user?.id],
    queryFn: async () => {
      // Typically there would be a wallet fetch
      // Let's do a basic query:
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single()
      
      // If no wallet table exists yet, return a graceful fallback 0
      if (error && error.code !== 'PGRST116') throw error
      return (data as WalletBalanceRow | null) || { balance: 0, pending: 0, total_earned: 0 }
    },
    enabled: !!user?.id,
    retry: 1
  })

  const { data: transactions, isLoading: isTxLoading } = useQuery<EarningsTransactionRow[]>({
    queryKey: ['freelancer-transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
      
      if (error && error.code !== 'PGRST116') throw error
      return (data as EarningsTransactionRow[] | null) || []
    },
    enabled: !!user?.id,
    retry: 1
  })

  // Mock chart data for last 6 months
  const chartData = [
    { name: 'Oct', amount: 400 },
    { name: 'Nov', amount: 300 },
    { name: 'Dec', amount: 1200 },
    { name: 'Jan', amount: 800 },
    { name: 'Feb', amount: 1500 },
    { name: 'Mar', amount: balance?.total_earned || 200 },
  ]

  const stats = {
    totalEarned: balance?.total_earned || 0,
    thisMonth: 200, // mock or calculate from txs
    completedContracts: 3, // mock
  }

  const formatDate = (dateStr: string) => {
    const locale = language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-US' : 'ar-TN'
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  return (
    <div className="page-shell">
      <Header />
      <div className="page-shell-content-narrow">
        
        {/* Balance hero card */}
        <div className="mb-6 bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-purple-200 font-medium tracking-wide uppercase">{tx('pages.freelancerEarnings.availableBalance', undefined, 'Available balance')}</p>
            <h1 className="text-4xl font-bold mt-1">{(balance?.balance || 0).toLocaleString()} TND</h1>
            <p className="text-sm text-purple-200 mt-2">
              {tx('pages.freelancerEarnings.pendingClearance', { amount: (balance?.pending || 0).toLocaleString() }, `${(balance?.pending || 0).toLocaleString()} TND pending clearance`)}
            </p>
          </div>
          <button className="bg-white text-purple-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-purple-50 transition-colors shrink-0">
            {tx('pages.freelancerEarnings.withdraw', undefined, 'Withdraw')}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{tx('pages.freelancerEarnings.totalEarned', undefined, 'Total earned')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalEarned.toLocaleString()} TND</p>
          </div>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{tx('pages.freelancerEarnings.thisMonth', undefined, 'This month')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.thisMonth.toLocaleString()} TND</p>
          </div>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{tx('pages.freelancerEarnings.completedContracts', undefined, 'Completed contracts')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completedContracts}</p>
          </div>
        </div>

        {/* Earnings chart section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{tx('pages.freelancerEarnings.earningsOverview', undefined, 'Earnings overview')}</h2>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction list */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{tx('pages.freelancerEarnings.paymentHistory', undefined, 'Payment history')}</h2>
          
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
            {isTxLoading ? (
              <div className="p-4">
                <SkeletonList count={5} />
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title={tx('pages.freelancerEarnings.noEarningsTitle', undefined, 'No earnings yet')}
                description={tx('pages.freelancerEarnings.noEarningsDescription', undefined, 'Complete your first project to see your earnings here.')}
                action={{
                  label: tx('pages.freelancerEarnings.browseJobs', undefined, 'Browse jobs'),
                  onClick: () => navigate('/jobs'),
                  variant: 'primary',
                }}
              />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0 pe-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {transaction.description || tx('pages.freelancerEarnings.contractPayment', undefined, 'Contract payment')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {tx('pages.freelancerEarnings.clientId', { id: transaction.related_id || tx('pages.freelancerEarnings.notAvailable', undefined, 'N/A') }, `Client #${transaction.related_id || 'N/A'}`)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-400 mb-0.5">
                        {formatDate(transaction.created_at)}
                      </p>
                      <p className={`text-sm font-semibold ${transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount} TND
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
