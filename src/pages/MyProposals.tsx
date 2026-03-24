import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { Header } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type ProposalTab = 'all' | 'pending' | 'accepted' | 'rejected';

type ProposalRow = {
  id: string;
  bid_amount: number | null;
  estimated_duration: number | null;
  status: string | null;
  created_at: string;
  jobs?: { title?: string | null; category?: string | null } | null;
};

const TABS: { key: ProposalTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
];

const statusClassMap: Record<string, string> = {
  pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  accepted: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

function formatDaysAgo(date: string) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  return days === 0 ? 'today' : `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function MyProposals() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProposalTab>('all');

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['my-proposals', user?.id, activeTab],
    enabled: !!user?.id,
    queryFn: async () => {
      let query = supabase
        .from('proposals')
        .select('id, bid_amount, estimated_duration, status, created_at, jobs(title, category)')
        .eq('freelancer_id', user!.id)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') query = query.eq('status', activeTab);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ProposalRow[];
    },
  });

  const stats = useMemo(
    () => ({
      sent: proposals.length,
      accepted: proposals.filter((p) => p.status === 'accepted').length,
      pending: proposals.filter((p) => p.status === 'pending').length,
    }),
    [proposals]
  );

  return (
    <div className="bg-gray-50 dark:bg-[#0f0e17] min-h-screen">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark:text-white">My Proposals</h1>
          <p className="text-gray-500 dark:text-gray-400">Track every proposal you've sent</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Sent</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.sent}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Accepted</p>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{stats.accepted}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{stats.pending}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm font-medium px-4 py-2 rounded-lg ${
                activeTab === tab.key
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5 animate-pulse h-28" />
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-lg font-medium dark:text-white">No proposals yet</h2>
            <p className="text-gray-500 dark:text-gray-400">Browse open projects and send your first proposal.</p>
            <Link to="/jobs" className="inline-block bg-purple-600 text-white px-5 py-2 rounded-xl mt-4">
              Browse jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => {
              const normalizedStatus = proposal.status ?? 'pending';
              return (
                <div key={proposal.id} className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5 hover:border-purple-200 dark:hover:border-purple-500/30 transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold dark:text-white">{proposal.jobs?.title ?? 'Untitled project'}</h3>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClassMap[normalizedStatus] ?? statusClassMap.pending}`}>
                      {normalizedStatus}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-purple-600 dark:text-purple-400 font-medium">Your bid: {proposal.bid_amount ?? 0} TND</span>
                    <span className="text-gray-500 dark:text-gray-400">{proposal.estimated_duration ?? 0} days delivery</span>
                  </div>
                  <div className="mt-3 text-sm text-gray-400">Submitted {formatDaysAgo(proposal.created_at)}</div>
                  {normalizedStatus === 'accepted' && (
                    <Link to="/contracts" className="inline-flex mt-4 text-sm font-medium text-purple-600 dark:text-purple-400">
                      View contract →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}