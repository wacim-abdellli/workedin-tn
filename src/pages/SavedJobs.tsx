import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Briefcase, User, Trash2, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import SEO from '@/components/common/SEO';

interface SavedJob {
  job_id: string;
  jobs: {
    id: string;
    title: string;
    category: string;
    budget_min: number;
    budget_max: number;
    job_type: string;
    status: string;
    created_at: string;
  } | null;
}

interface SavedFreelancer {
  freelancer_id: string;
  freelancer_profiles: {
    id: string;
    title: string;
    hourly_rate: number;
    skills: { name: string }[];
    profiles: {
      id: string;
      full_name: string;
      avatar_url: string;
      username: string;
    };
  } | null;
}

export default function SavedJobs() {
  const { user } = useAuth();
  const { t, tx } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'jobs' | 'freelancers'>('jobs');

  // Fetch saved jobs
  const { data: savedJobs = [], isLoading: loadingJobs } = useQuery<SavedJob[]>({
    queryKey: ['saved-jobs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('job_id, jobs(id, title, category, budget_min, budget_max, job_type, status, created_at)')
        .eq('user_id', user!.id)
        .not('job_id', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SavedJob[];
    },
    enabled: !!user?.id,
  });

  // Fetch saved freelancers
  const { data: savedFreelancers = [], isLoading: loadingFreelancers } = useQuery<SavedFreelancer[]>({
    queryKey: ['saved-freelancers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('freelancer_id, freelancer_profiles(id, title, hourly_rate, skills, profiles(id, full_name, avatar_url, username))')
        .eq('user_id', user!.id)
        .not('freelancer_id', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SavedFreelancer[];
    },
    enabled: !!user?.id,
  });

  // Remove saved job mutation
  const removeJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user!.id)
        .eq('job_id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs', user?.id] });
      showToast(tx('savedJobs.removed', undefined, 'Removed from saved'), 'success');
    },
    onError: () => {
      showToast(tx('common.error', undefined, 'Something went wrong'), 'error');
    },
  });

  // Remove saved freelancer mutation
  const removeFreelancerMutation = useMutation({
    mutationFn: async (freelancerId: string) => {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user!.id)
        .eq('freelancer_id', freelancerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-freelancers', user?.id] });
      showToast(tx('savedFreelancers.removed', undefined, 'Removed from saved'), 'success');
    },
    onError: () => {
      showToast(tx('common.error', undefined, 'Something went wrong'), 'error');
    },
  });

  const isLoading = loadingJobs || loadingFreelancers;

  const validJobs = savedJobs.filter((item) => item.jobs !== null);
  const validFreelancers = savedFreelancers.filter((item) => item.freelancer_profiles !== null);

  return (
    <div className="page-shell">
      <SEO
        title={tx('savedJobs.seo.title', undefined, 'Saved Items')}
        description={tx('savedJobs.seo.description', undefined, 'View your saved jobs and freelancers')}
        noIndex
      />
      <Header />
      <div className="page-shell-content">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {tx('savedJobs.title', undefined, 'Saved Items')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            {tx('savedJobs.subtitle', undefined, 'Jobs and freelancers you bookmarked for later')}
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs-row mb-6">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`tab-pill ${activeTab === 'jobs' ? 'tab-pill-active' : ''}`}
          >
            <Briefcase className="w-4 h-4 mr-2" />
            {tx('savedJobs.jobsTab', undefined, 'Jobs')} ({validJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('freelancers')}
            className={`tab-pill ${activeTab === 'freelancers' ? 'tab-pill-active' : ''}`}
          >
            <User className="w-4 h-4 mr-2" />
            {tx('savedJobs.freelancersTab', undefined, 'Freelancers')} ({validFreelancers.length})
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--workspace-primary)' }} />
          </div>
        ) : activeTab === 'jobs' ? (
          validJobs.length === 0 ? (
            <EmptyState
              icon={Heart}
              title={tx('savedJobs.emptyJobsTitle', undefined, 'No saved jobs yet')}
              description={tx('savedJobs.emptyJobsDescription', undefined, 'Browse jobs and save the ones you like to view them here later.')}
              action={{
                label: tx('savedJobs.browseJobs', undefined, 'Browse jobs'),
                onClick: () => navigate('/jobs'),
                variant: 'primary',
              }}
            />
          ) : (
            <div className="space-y-3">
              {validJobs.map((item) => {
                const job = item.jobs!;
                return (
                  <div
                    key={item.job_id}
                    className="list-card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <Link to={`/jobs/${job.id}`} className="flex-1 min-w-0">
                        <h3 className="list-card-title hover:underline">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)' }}>
                            {job.category}
                          </span>
                          <span className="text-sm font-semibold" style={{ color: 'var(--workspace-primary)' }}>
                            {job.budget_min}-{job.budget_max} {tx('common.currency', undefined, 'TND')}
                          </span>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeJobMutation.mutate(job.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                        style={{ color: 'var(--color-text-tertiary)' }}
                        title={tx('savedJobs.remove', undefined, 'Remove from saved')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          validFreelancers.length === 0 ? (
            <EmptyState
              icon={User}
              title={tx('savedJobs.emptyFreelancersTitle', undefined, 'No saved freelancers yet')}
              description={tx('savedJobs.emptyFreelancersDescription', undefined, 'Find talent and save freelancers to contact them later.')}
              action={{
                label: tx('savedJobs.findFreelancers', undefined, 'Find freelancers'),
                onClick: () => navigate('/find-freelancers'),
                variant: 'primary',
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {validFreelancers.map((item) => {
                const freelancer = item.freelancer_profiles!;
                const profile = freelancer.profiles;
                return (
                  <div
                    key={item.freelancer_id}
                    className="rounded-xl border p-4 transition-all hover:shadow-md"
                    style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-elevated)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/freelancer/${profile.username || profile.id}`} className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: 'var(--workspace-primary)', color: 'white' }}
                        >
                          {profile.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {profile.full_name}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                            {freelancer.title}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFreelancerMutation.mutate(freelancer.id)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {freelancer.hourly_rate && (
                      <p className="text-sm font-semibold mt-3" style={{ color: 'var(--workspace-primary)' }}>
                        {freelancer.hourly_rate} {tx('common.currencyPerHour', undefined, 'TND/hr')}
                      </p>
                    )}
                    {freelancer.skills && freelancer.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {freelancer.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)' }}
                          >
                            {skill.name}
                          </span>
                        ))}
                        {freelancer.skills.length > 3 && (
                          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            +{freelancer.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
