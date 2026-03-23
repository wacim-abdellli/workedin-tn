import { memo } from 'react';
import { Briefcase, Clock, Heart, MapPin, ShieldCheck } from 'lucide-react';

import { useTranslation } from '../../i18n';
import IconButton from '../ui/IconButton';
import OptimizedImage from '../common/OptimizedImage';
import { cn } from '../../lib/utils';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import RatingStars from '@/components/ui/RatingStars';

export interface JobForCard {
  id: string;
  title: string;
  description: string;
  job_type: 'fixed_price' | 'hourly';
  budget_min?: number;
  budget_max?: number;
  hourly_rate?: number;
  skills: string[];
  proposals_count: number;
  posted_at: string;
  location?: string;
  client?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    rating?: number;
    is_verified?: boolean;
    location?: string;
  };
  views_count?: number;
}

interface JobCardProps {
  job: JobForCard;
  isSaved: boolean;
  onToggleSave: () => void;
  onClick: () => void;
}

const JobCard = memo(({ job, isSaved, onToggleSave, onClick }: JobCardProps) => {
  const { t, language } = useTranslation();
  const [from, to] = getAvatarGradient(job.client?.full_name || 'Khedma');

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t.jobs.time.now;

    const prefix = t.jobs.time.ago_prefix ? `${t.jobs.time.ago_prefix} ` : '';
    const suffix = t.jobs.time.ago ? ` ${t.jobs.time.ago}` : '';

    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return `${prefix}${mins}${language === 'en' ? ' ' : ''}${t.jobs.time.minute}${suffix}`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${prefix}${hours}${language === 'en' ? ' ' : ''}${t.jobs.time.hour}${suffix}`;
    }
    const days = Math.floor(seconds / 86400);
    return `${prefix}${days}${language === 'en' ? ' ' : ''}${t.jobs.time.day}${suffix}`;
  };

  return (
    <div
      onClick={onClick}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
        event.currentTarget.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
      }}
      className="group card card-hover card-hover-shine cursor-pointer rounded-[28px] p-6"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="hidden shrink-0 md:block">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold text-white shadow-sm transition-transform group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
            {job.client?.avatar_url ? (
              <OptimizedImage
                src={job.client.avatar_url}
                alt={job.client.full_name}
                className="h-full w-full"
                imgClassName="rounded-2xl"
                width={56}
                height={56}
              />
            ) : (
              getInitials(job.client?.full_name || 'Khedma')
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="mb-2 text-xl font-bold text-dark-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                {job.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {timeAgo(job.posted_at)}
                </span>
                <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location || t.jobs.location.remote}
                </span>
                <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {job.proposals_count} {t.jobs.proposals}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="rounded-2xl bg-gray-50 px-4 py-3 text-right dark:bg-dark-800">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                  {job.job_type === 'fixed_price' ? t.jobs.budget : t.jobs.hourlyRate}
                </div>
                <div className="mt-1 text-lg font-bold text-dark-900 dark:text-white">
                  {job.job_type === 'fixed_price'
                    ? `${job.budget_min} - ${job.budget_max} TND`
                    : `${job.hourly_rate} TND/h`}
                </div>
              </div>
              <IconButton
                icon={<Heart className={cn('h-5 w-5 transition-all', isSaved && 'fill-current')} />}
                label={isSaved ? t.jobs.unsave : t.jobs.save}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleSave();
                }}
                isActive={isSaved}
                variant="danger"
                size="sm"
                className="!rounded-full"
              />
            </div>
          </div>

          <p className="line-clamp-2 leading-relaxed text-gray-600 dark:text-gray-300">
            {job.description}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4 dark:border-dark-700">
            <div className="flex flex-wrap gap-2">
              {job.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors group-hover:bg-primary-50 group-hover:text-primary-600 dark:bg-dark-700 dark:text-gray-300 dark:group-hover:bg-primary-900/20 dark:group-hover:text-primary-400"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 4 ? (
                <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-400 dark:bg-dark-800">
                  +{job.skills.length - 4}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              {job.client?.is_verified ? (
                <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400" title={t.jobs.verifiedPayment}>
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden text-xs sm:inline">{t.jobs.verifiedPayment}</span>
                </span>
              ) : null}
              <RatingStars
                rating={job.client?.rating || 5}
                reviews={job.client?.rating ? 18 : undefined}
                snippet="Clear brief, quick replies, and a serious product-focused client."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => prev.job.id === next.job.id && prev.isSaved === next.isSaved);

export default JobCard;
