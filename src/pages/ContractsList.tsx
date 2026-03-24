import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { Header } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspaceStore } from '../lib/workspaceState';
import { supabase } from '../lib/supabase';

type ContractTab = 'all' | 'active' | 'completed' | 'disputed';

type ContractRow = {
  id: string;
  status: string | null;
  amount: number | null;
  started_at: string | null;
  freelancer_id: string;
  client_id: string;
  job?: { title?: string | null } | null;
  freelancer?: { full_name?: string | null; avatar_url?: string | null } | null;
  client?: { full_name?: string | null; avatar_url?: string | null } | null;
  milestones?: { status?: string | null }[] | null;
};

const tabs: { key: ContractTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'disputed', label: 'Disputed' },
];

const statusMap: Record<string, string> = {
  active: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  disputed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

export default function ContractsList() {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<ContractTab>('all');

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts-list', user?.id, activeTab],
    enabled: !!user?.id,
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select(`
          id, status, amount, started_at, freelancer_id, client_id,
          job:jobs(title),
          freelancer:profiles!freelancer_id(full_name, avatar_url),
          client:profiles!client_id(full_name, avatar_url),
          milestones(status)
        `)
        .or(`freelancer_id.eq.${user!.id},client_id.eq.${user!.id}`)
        .order('started_at', { ascending: false });

      if (activeTab !== 'all') query = query.eq('status', activeTab);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ContractRow[];
    },
  });

  const activeCount = useMemo(() => contracts.filter((c) => c.status === 'active').length, [contracts]);
  const isFreelancer = activeWorkspace === 'freelancer';
  const accentClass = isFreelancer ? 'bg-purple-500' : 'bg-amber-500';

  return (
    <div className="bg-gray-50 dark:bg-[#0f0e17] min-h-screen">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Contracts</h1>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-300">{activeCount} active</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
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
              <div key={i} className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5 animate-pulse h-40" />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-lg font-medium dark:text-white">No contracts yet</h2>
            <p className="text-gray-500 dark:text-gray-400">
              {isFreelancer ? 'Send proposals to get your first contract.' : 'Hire a freelancer to create your first contract.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => {
              const totalMilestones = contract.milestones?.length ?? 0;
              const completedMilestones = contract.milestones?.filter((m) => m.status === 'completed').length ?? 0;
              const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
              const counterpart = isFreelancer ? contract.client : contract.freelancer;

              return (
                <div key={contract.id} className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold dark:text-white">{contract.job?.title ?? 'Untitled project'}</h3>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusMap[contract.status ?? 'active'] ?? statusMap.active}`}>
                      {contract.status ?? 'active'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    {counterpart?.avatar_url ? (
                      <img src={counterpart.avatar_url} alt={counterpart.full_name ?? 'avatar'} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10" />
                    )}
                    <span>{isFreelancer ? 'Client' : 'Freelancer'}: {counterpart?.full_name ?? 'Unknown'}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold dark:text-white">{contract.amount ?? 0} TND</span>
                    <span>Start date {contract.started_at ? new Date(contract.started_at).toLocaleDateString() : '�'}</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>{completedMilestones} of {totalMilestones} milestones complete</span>
                    </div>
                    <div className="bg-gray-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className={`${accentClass} h-1.5 rounded-full`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <Link to={`/contracts/${contract.id}`} className="inline-flex mt-4 text-sm font-medium text-purple-600 dark:text-purple-400">
                    Open workspace →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
