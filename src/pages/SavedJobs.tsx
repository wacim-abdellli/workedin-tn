import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, MapPin, Clock, Star, Briefcase } from 'lucide-react';
import { Header } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import * as profilesService from '@/services/profiles';
import { useTranslation } from '@/i18n';

type SavedItemsRole = 'client' | 'freelancer';

interface SavedJobItem {
  id: string;
  title: string;
  jobType: 'Fixed-price' | 'Hourly';
  budget: string;
  postedAgo: string;
}

interface SavedTalentItem {
  id: string;
  name: string;
  title: string;
  location: string;
  rating: number;
  hourlyRate: number;
}

interface SavedJobRecord {
  id: string;
  title: string;
  job_type: 'fixed_price' | 'hourly';
  budget_min?: number | null;
  budget_max?: number | null;
  hourly_rate?: number | null;
  posted_at: string;
}

interface SavedJobRow {
  jobs?: SavedJobRecord | SavedJobRecord[] | null;
}

interface SavedFreelancerProfile {
  id: string;
  full_name?: string | null;
  location?: string | null;
  freelancer_profiles?: {
    title?: string | null;
    hourly_rate?: number | null;
    success_rate?: number | null;
  }[];
}

interface SavedItemsProps {
  role: SavedItemsRole;
  savedJobs?: SavedJobItem[];
  savedTalent?: SavedTalentItem[];
  isLoading?: boolean;
}

const formatTimeAgo = (value: string, tx: (key: string, params?: any, fallback?: string) => string) => {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) {
    return tx('common.postedRecently', undefined, 'Posted recently');
  }

  const diffMs = Date.now() - then;
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) return tx('common.postedToday', undefined, 'Posted today');
  if (diffDays === 1) return tx('common.posted1DayAgo', undefined, 'Posted 1 day ago');
  if (diffDays < 7) return tx('common.postedDaysAgo', { days: diffDays }, `Posted ${diffDays} days ago`);
  const weeks = Math.floor(diffDays / 7);
  return tx('common.postedWeeksAgo', { weeks }, `Posted ${weeks} week${weeks > 1 ? 's' : ''} ago`);
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

export function SavedItems({
  role,
  savedJobs = [],
  savedTalent = [],
  isLoading = false,
}: SavedItemsProps) {
  const { tx } = useTranslation();
  const isFreelancer = role === 'freelancer';
  const title = isFreelancer ? tx('pages.savedJobs.title', undefined, 'Saved Jobs') : tx('pages.savedJobs.savedTalent', undefined, 'Saved Talent');
  const subtitle = isFreelancer
    ? tx('pages.savedJobs.subtitle', undefined, 'Keep track of jobs you want to apply for.')
    : tx('pages.savedJobs.subtitleTalent', undefined, 'Keep track of top freelancers for your projects.');

  const roleItems = isFreelancer ? savedJobs : savedTalent;

  const titleHoverClass = isFreelancer
    ? 'group-hover:text-purple-400'
    : 'group-hover:text-orange-500';
  const actionButtonClass = isFreelancer
    ? 'bg-purple-600 hover:bg-purple-700'
    : 'bg-orange-500 hover:bg-orange-600';
  const heartClass = isFreelancer
    ? 'text-purple-500 fill-purple-500'
    : 'text-orange-500 fill-orange-500';

  return (
    <div className="min-h-screen page-bg-base py-8 pt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-bold mb-2 text-on-surface">{title}</h1>
          <p className="text-on-surface-muted mb-8">{subtitle}</p>
        </header>

        <section className="surface-card border rounded-2xl overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <div className="h-14 rounded-xl border border-surface surface-sunken animate-pulse" />
              <div className="h-14 rounded-xl border border-surface surface-sunken animate-pulse" />
              <div className="h-14 rounded-xl border border-surface surface-sunken animate-pulse" />
            </div>
          ) : roleItems.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Heart className="w-12 h-12 text-on-surface-subtle mb-4" />
              <h2 className="text-xl font-bold text-on-surface mb-2">{tx('pages.savedJobs.empty.title', undefined, 'Nothing saved yet')}</h2>
              <button
                type="button"
                className={`text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${actionButtonClass}`}
              >
                {isFreelancer ? tx('pages.savedJobs.browseJobs', undefined, 'Browse Jobs') : tx('pages.savedJobs.browseFreelancers', undefined, 'Browse Freelancers')}
              </button>
            </div>
          ) : isFreelancer ? (
            savedJobs.map((job) => (
              <article
                key={job.id}
                className="p-6 border-b border-surface last:border-b-0 hover-surface transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                <div className="min-w-0">
                  <h3 className={`text-lg font-bold text-on-surface transition-colors line-clamp-1 mb-2 cursor-pointer ${titleHoverClass}`}>
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      {job.jobType}
                    </span>
                    <span>
                      {tx('pages.savedJobs.labels.budget', undefined, 'Budget:')} <span className="text-on-surface">{job.budget}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {job.postedAgo}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <button
                    type="button"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  >
                    {tx('pages.savedJobs.actions.applyNow', undefined, 'Apply Now')}
                  </button>
                  <button
                    type="button"
                    aria-label={tx('pages.savedJobs.actions.removeSavedJob', undefined, 'Remove saved job')}
                    className={`p-2 rounded-full border border-surface surface-sunken hover:text-on-surface-muted hover:fill-transparent transition-all cursor-pointer ${heartClass}`}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))
          ) : (
            savedTalent.map((talent) => (
              <article
                key={talent.id}
                className="p-6 border-b border-surface last:border-b-0 hover-surface transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full surface-sunken border border-surface shrink-0 flex items-center justify-center text-sm font-semibold text-on-surface">
                    {getInitials(talent.name)}
                  </div>

                  <div className="min-w-0">
                    <h3 className={`text-lg font-bold text-on-surface transition-colors line-clamp-1 cursor-pointer ${titleHoverClass}`}>
                      {talent.name}
                    </h3>
                    <p className="text-sm text-on-surface-muted mb-1 line-clamp-1">{talent.title}</p>
                    <p className="inline-flex items-center gap-1.5 text-xs text-on-surface-subtle">
                      <MapPin className="w-3.5 h-3.5" />
                      {talent.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-4 text-sm mr-4">
                    <span className="inline-flex items-center gap-1 text-on-surface-muted">
                      <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                      <span className="text-on-surface">{talent.rating.toFixed(1)}</span>
                    </span>
                    <span className="text-on-surface font-medium">{talent.hourlyRate} TND/hr</span>
                  </div>

                  <button
                    type="button"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  >
                    {tx('pages.savedJobs.actions.inviteToJob', undefined, 'Invite to Job')}
                  </button>

                  <button
                    type="button"
                    aria-label={tx('pages.savedJobs.actions.removeSavedFreelancer', undefined, 'Remove saved freelancer')}
                    className={`p-2 rounded-full border border-surface surface-sunken hover:text-on-surface-muted hover:fill-transparent transition-all cursor-pointer ${heartClass}`}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

export default function SavedJobsPage() {
  const { activeMode, user } = useAuth();
  const { tx } = useTranslation();
  const role: SavedItemsRole = activeMode === 'client' ? 'client' : 'freelancer';

  const {
    data: savedJobs = [],
    isLoading: isSavedJobsLoading,
  } = useQuery({
    queryKey: ['saved-jobs-page', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as SavedJobItem[];

      const { data, error } = await profilesService.getSavedJobs(user.id);
      if (error) {
        console.error('getSavedJobs error:', error);
        return [] as SavedJobItem[];
      }

      return ((data ?? []) as SavedJobRow[])
        .map((row) => (Array.isArray(row.jobs) ? row.jobs[0] : row.jobs))
        .filter((job): job is SavedJobRecord => Boolean(job))
        .map((job) => ({
          id: job.id,
          title: job.title,
          jobType: (job.job_type === 'hourly' ? tx('common.hourly', undefined, 'Hourly') : tx('common.fixedPrice', undefined, 'Fixed-price')) as SavedJobItem['jobType'],
          budget:
            job.job_type === 'hourly'
              ? `${job.hourly_rate ?? 0} TND/hr`
              : `${job.budget_min ?? 0} - ${job.budget_max ?? 0} TND`,
          postedAgo: formatTimeAgo(job.posted_at, tx),
        }));
    },
    enabled: role === 'freelancer' && Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: savedFreelancerIds = [],
    isLoading: isSavedFreelancerIdsLoading,
  } = useQuery({
    queryKey: ['saved-freelancer-ids-page', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as string[];

      const { data, error } = await profilesService.getSavedFreelancerIds(user.id);
      if (error) {
        console.error('getSavedFreelancerIds error:', error);
        return [] as string[];
      }

      return (data ?? [])
        .map((row) => row.freelancer_id)
        .filter((id): id is string => Boolean(id));
    },
    enabled: role === 'client' && Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: savedFreelancerPool = [],
    isLoading: isSavedFreelancerPoolLoading,
  } = useQuery({
    queryKey: ['saved-freelancer-pool-page', user?.id, savedFreelancerIds.join(',')],
    queryFn: async () => {
      if (!savedFreelancerIds.length) {
        return [] as SavedFreelancerProfile[];
      }

      const { data, error } = await profilesService.supabase
        .from('public_profiles')
        .select(`
          id,
          full_name,
          location,
          freelancer_profiles!inner (
            title,
            hourly_rate,
            success_rate
          )
        `)
        .in('id', savedFreelancerIds);

      if (error) {
        console.error('getSavedFreelancerProfiles error:', error);
        return [] as SavedFreelancerProfile[];
      }

      return (data ?? []) as SavedFreelancerProfile[];
    },
    enabled: role === 'client' && Boolean(user?.id) && savedFreelancerIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const savedTalent = useMemo(() => {
    if (role !== 'client' || savedFreelancerIds.length === 0) {
      return [] as SavedTalentItem[];
    }

    const freelancerById = new Map(savedFreelancerPool.map((freelancer) => [freelancer.id, freelancer]));

    return savedFreelancerIds
      .map((id) => {
        const freelancer = freelancerById.get(id);
        if (!freelancer) return null;

        const profile = Array.isArray(freelancer.freelancer_profiles)
          ? freelancer.freelancer_profiles[0]
          : undefined;

        const successRate = Number(profile?.success_rate ?? 0);

        return {
          id: freelancer.id,
          name: freelancer.full_name || tx('common.freelancer', undefined, 'Freelancer'),
          title: profile?.title || tx('common.freelancer', undefined, 'Freelancer'),
          location: freelancer.location || tx('common.tunisia', undefined, 'Tunisia'),
          rating: successRate > 0 ? Math.min(5, successRate / 20) : 0,
          hourlyRate: Number(profile?.hourly_rate ?? 0),
        };
      })
      .filter((freelancer): freelancer is SavedTalentItem => Boolean(freelancer));
  }, [role, savedFreelancerIds, savedFreelancerPool]);

  const isLoading =
    role === 'freelancer'
      ? isSavedJobsLoading
      : isSavedFreelancerIdsLoading || isSavedFreelancerPoolLoading;

  return (
    <>
      <Header />
      <SavedItems
        role={role}
        savedJobs={savedJobs}
        savedTalent={savedTalent}
        isLoading={isLoading}
      />
    </>
  );
}

