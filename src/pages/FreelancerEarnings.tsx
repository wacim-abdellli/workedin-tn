import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Header } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type WalletRow = {
  balance?: number | null;
  pending_balance?: number | null;
  total_earned?: number | null;
};

type TransactionRow = {
  id: string;
  amount: number;
  created_at: string;
  status?: string | null;
  type?: string | null;
  description?: string | null;
  reference_id?: string | null;
};

function monthLabel(date: string) {
  return new Date(date).toLocaleDateString('en', { month: 'short' });
}

export default function FreelancerEarnings() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['freelancer-earnings', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [walletResult, transactionsResult, completedContractsResult] = await Promise.all([
        supabase.from('wallets').select('balance, pending_balance, total_earned').eq('user_id', user!.id).maybeSingle(),
        supabase
          .from('transactions')
          .select('id, amount, created_at, status, type, description, reference_id')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('freelancer_id', user!.id).eq('status', 'completed'),
      ]);

      if (walletResult.error) throw walletResult.error;
      if (transactionsResult.error) throw transactionsResult.error;
      if (completedContractsResult.error) throw completedContractsResult.error;

      return {
        wallet: (walletResult.data ?? { balance: 0, pending_balance: 0, total_earned: 0 }) as WalletRow,
        transactions: (transactionsResult.data ?? []) as TransactionRow[],
        completedContracts: completedContractsResult.count ?? 0,
      };
    },
  });

  const wallet = data?.wallet ?? { balance: 0, pending_balance: 0, total_earned: 0 };
  const transactions = data?.transactions ?? [];

  const chartData = useMemo(() => {
    const monthly = new Map<string, number>();

    transactions.forEach((tx) => {
      const d = new Date(tx.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthly.set(key, (monthly.get(key) ?? 0) + tx.amount);
    });

    return Array.from(monthly.entries()).slice(-6).map(([key, amount]) => {
      const [year, month] = key.split('-').map(Number);
      const date = new Date(year, month, 1).toISOString();
      return { month: monthLabel(date), amount };
    });
  }, [transactions]);

  const thisMonth = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((tx) => {
        const d = new Date(tx.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  return (
    <div className="bg-gray-50 dark:bg-[#0f0e17] min-h-screen">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-6 text-white mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-purple-200">Available balance</p>
            <p className="text-4xl font-bold">{Number(wallet.balance ?? 0).toFixed(2)} TND</p>
            <p className="text-sm text-purple-200 mt-1">{Number(wallet.pending_balance ?? 0).toFixed(2)} TND pending clearance</p>
          </div>
          <button className="bg-white text-purple-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-purple-50" type="button">
            Withdraw
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total earned</p>
            <p className="text-2xl font-semibold dark:text-white">{Number(wallet.total_earned ?? 0).toFixed(2)} TND</p>
          </div>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400">This month</p>
            <p className="text-2xl font-semibold dark:text-white">{thisMonth.toFixed(2)} TND</p>
          </div>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed contracts</p>
            <p className="text-2xl font-semibold dark:text-white">{data?.completedContracts ?? 0}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5 mb-6">
          <h2 className="font-semibold dark:text-white mb-4">Earnings overview</h2>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" tickFormatter={(value) => `${value}`} />
                <Tooltip contentStyle={{ background: '#1a1825', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }} />
                <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fill="url(#earningsGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5">
          <h2 className="font-semibold dark:text-white mb-4">Payment history</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="py-3 border-b border-gray-100 dark:border-white/5 animate-pulse h-14" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
              <h3 className="mt-4 text-lg font-medium dark:text-white">No earnings yet</h3>
              <p className="text-gray-500 dark:text-gray-400">Complete your first project to see earnings here.</p>
              <Link to="/jobs" className="inline-block bg-purple-600 text-white px-5 py-2 rounded-xl mt-4">
                Browse jobs
              </Link>
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="py-3 border-b last:border-b-0 border-gray-100 dark:border-white/5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium dark:text-white">{tx.description || 'Project payment'}</p>
                  <p className="text-sm text-gray-500">{tx.reference_id || 'Client payment'}</p>
                </div>
                <div className="text-sm text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</div>
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">+{tx.amount} TND</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}