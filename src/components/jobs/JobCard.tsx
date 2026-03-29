import React from 'react';
import { Briefcase, Clock, Heart, MapPin, ShieldCheck } from 'lucide-react';

import { useTranslation } from '../../i18n';
import IconButton from '../ui/IconButton';
import OptimizedImage from '../common/OptimizedImage';
import { cn } from '../../lib/utils';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import RatingStars from '@/components/ui/RatingStars';
import ReportButton from '@/components/settings/ReportButton';

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
  onToggleSave: (job: JobForCard) => void;
  onClick: (jobId: string) => void;
}

function JobCard({ job, isSaved, onToggleSave, onClick }: JobCardProps) {
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
      onClick={() => onClick(job.id)}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
        event.currentTarget.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
      }}
      className={cn(
        'group relative rounded-xl p-6 cursor-pointer transition-all duration-200',
        'bg-white dark:bg-[#1a1825]',
        'border border-gray-100 dark:border-white/6',
        'shadow-sm dark:shadow-none',
        'hover:shadow-md dark:hover:shadow-lg hover:border-[color:var(--workspace-primary-mid)] dark:hover:border-[color:var(--workspace-primary-mid)]'
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[color:var(--workspace-primary)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      <div className="flex flex-col gap-5 md:flex-row">
        {/* Client Avatar */}
        <div className="hidden shrink-0 md:block">
          <div 
            className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl text-lg font-bold text-white shadow-sm transition-transform group-hover:scale-105" 
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            {job.client?.avatar_url ? (
              <OptimizedImage
                src={job.client.avatar_url}
                alt={job.client.full_name}
                className="h-full w-full"
                imgClassName="rounded-xl"
                width={56}
                height={56}
              />
            ) : (
              getInitials(job.client?.full_name || 'Khedma')
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Header: Title + Budget */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className={cn(
                'mb-2 text-base font-semibold text-gray-900 dark:text-white',
                'transition-colors group-hover:text-[color:var(--workspace-primary)]'
              )}>
                {job.title}
              </h3>
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {timeAgo(job.posted_at)}
                </span>
                <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                {job.location && (
                  <>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  </>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {job.proposals_count} {t.jobs.proposals}
                </span>
              </div>
            </div>

            {/* Budget Chip */}
            <div className={cn(
              'flex flex-col items-end gap-3 rounded-lg border p-3',
              'border-gray-100 dark:border-white/8',
              'bg-gray-50/50 dark:bg-white/3'
            )}>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {job.job_type === 'fixed_price' ? t.jobs.budget : t.jobs.hourlyRate}
                </div>
                <div className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                  {job.job_type === 'fixed_price'
                    ? `${job.budget_min} - ${job.budget_max} TND`
                    : `${job.hourly_rate} TND/h`}
                </div>
              </div>
              <IconButton
                icon={<Heart className={cn('h-4 w-4 transition-all', isSaved && 'fill-current')} />}
                label={isSaved ? t.jobs.unsave : t.jobs.save}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleSave(job);
                }}
                isActive={isSaved}
                variant="danger"
                size="sm"
                className="!rounded-full"
              />
            </div>
          </div>

          {/* Description */}
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            {job.description}
          </p>

          {/* Footer: Skills + Verification */}
          <div className={cn(
            'flex flex-wrap items-center justify-between gap-3 pt-3.5',
            'border-t border-gray-100 dark:border-white/8'
          )}>
            {/* Skills Pills */}
            <div className="flex flex-wrap gap-2">
              {job.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className={cn(
                    'rounded-md px-2 py-1 text-xs font-medium transition-all',
                    'border border-[color:var(--workspace-primary-mid)]/30',
                    'bg-[color:var(--workspace-primary-light)]',
                    'text-[color:var(--workspace-primary)]',
                    'dark:bg-[color:var(--workspace-primary)]/10',
                    'dark:text-[color:var(--workspace-primary-mid)]',
                    'dark:border-[color:var(--workspace-primary)]/40',
                    'group-hover:bg-[color:var(--workspace-primary)]/5 dark:group-hover:bg-[color:var(--workspace-primary)]/20'
                  )}
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 4 ? (
                <span className="px-2 py-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                  +{job.skills.length - 4}
                </span>
              ) : null}
            </div>

            {/* Right Info: Verified + Rating */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {job.client?.is_verified ? (
                <span className="flex items-center gap-1 text-[color:var(--workspace-primary)]" title={t.jobs.verifiedPayment}>
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden text-xs sm:inline">{t.jobs.verifiedPayment}</span>
                </span>
              ) : null}
              <RatingStars
                rating={job.client?.rating || 5}
                reviews={job.client?.rating ? 18 : undefined}
                snippet="Clear brief, quick replies, and a serious product-focused client."
              />
              <ReportButton reportedType="job" reportedId={job.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(JobCard);
