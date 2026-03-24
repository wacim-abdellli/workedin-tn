import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, PlusCircle } from 'lucide-react';
import { Header } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type JobTab = 'all' | 'active' | 'in_review' | 'completed';

type ClientJobRow = {
  id: string;
  title: string;
  category: string | null;
  status: string | null;
  budget_min: number | null;
  budget_max: number | null;
  job_type: string | null;
  created_at: string;
  proposals?: { count?: number }[] | null;
};

const TABS: { key: JobTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'in_review', label: 'In Review' },
  { key: 'completed', label: 'Completed' },
];

function getDaysAgo(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  return days <= 0 ? 'today' : `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function ClientJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<JobTab>('all');

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['client-jobs', user?.id, activeTab],
    enabled: !!user?.id,
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select('id, title, category, status, budget_min, budget_max, job_type, created_at, proposals(count)')
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') query = query.eq('status', activeTab);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ClientJobRow[];
    },
  });

  const stats = useMemo(() => {
    const active = jobs.filter((job) => job.status === 'active' || job.status === 'open').length;
    const totalProposals = jobs.reduce((sum, job) => sum + (job.proposals?.[0]?.count ?? 0), 0);
    const completed = jobs.filter((job) => job.status === 'completed').length;
    return { active, totalProposals, completed };
  }, [jobs]);

  return (
    <div className="bg-gray-50 dark:bg-[#0f0e17] min-h-screen">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">My Projects</h1>
            <p className="text-gray-500 dark:text-gray-400">Track projects, proposals, and hiring progress.</p>
          </div>
          <button onClick={() => navigate('/jobs/new')} className="bg-amber-500 hover:bg-amber-400 text-white flex items-center gap-2 px-4 py-2 rounded-xl" type="button">
            <PlusCircle className="w-4 h-4" />
            Post a project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total proposals received</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalProposals}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1825] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.completed}</p>
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
              <div key={i} className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5 animate-pulse h-32" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-lg font-medium dark:text-white">No projects yet</h2>
            <p className="text-gray-500 dark:text-gray-400">Post your first project and receive proposals from verified professionals.</p>
            <Link to="/jobs/new" className="inline-block bg-amber-500 text-white px-5 py-2 rounded-xl mt-4">
              Post a project — it's free
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const proposalsCount = job.proposals?.[0]?.count ?? 0;
              return (
                <div key={job.id} className="bg-white dark:bg-[#1a1825] rounded-2xl p-5 border border-gray-100 dark:border-white/5 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold dark:text-white">{job.title}</h3>
                      {job.category && <span className="text-xs px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">{job.category}</span>}
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{job.status ?? 'draft'}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold dark:text-white">{job.budget_min ?? 0}–{job.budget_max ?? 0} TND</span>
                    <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5">{job.job_type ?? 'fixed_price'}</span>
                    <span>{proposalsCount} proposals</span>
                  </div>
                  <div className="mt-3 text-sm text-gray-400">Posted {getDaysAgo(job.created_at)}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {proposalsCount > 0 && (
                      <button onClick={() => navigate(`/client/jobs/${job.id}/proposals`)} className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400" type="button">
                        View proposals
                      </button>
                    )}
                    <button onClick={() => navigate(`/jobs/${job.id}/edit`)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300" type="button">
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
