import React from 'react';
import { Clock, Heart, ShieldCheck } from 'lucide-react';

import { useTranslation } from '../../i18n';
import IconButton from '../ui/IconButton';
import OptimizedImage from '../common/OptimizedImage';
import { cn } from '../../lib/utils';
import { getAvatarGradient, getInitials } from '@/lib/avatar';

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
      className={cn(
        'group relative rounded-xl p-5 cursor-pointer transition-all duration-200',
        'bg-white dark:bg-[#1a1825]',
        'border border-black/[0.07] dark:border-white/[0.07]',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-none',
        'hover:shadow-md hover:border-[color:var(--workspace-primary)]/30',
        'dark:hover:border-[color:var(--workspace-primary)]/30'
      )}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl bg-[color:var(--workspace-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="space-y-3">
        {/* Header: Title */}
        <div className="flex items-start gap-3">
          {/* Client Avatar - inline with title */}
          <div className="shrink-0">
            <div 
              className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-[color:var(--workspace-primary)] bg-[color:var(--workspace-primary)]/10" 
              style={job.client?.avatar_url ? { background: `linear-gradient(135deg, ${from}, ${to})` } : undefined}
            >
              {job.client?.avatar_url ? (
                <OptimizedImage
                  src={job.client.avatar_url}
                  alt={job.client.full_name}
                  className="h-full w-full"
                  imgClassName="rounded-full"
                  width={28}
                  height={28}
                />
              ) : (
                getInitials(job.client?.full_name || 'K')
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'text-base font-semibold line-clamp-2 mb-1',
              'text-[var(--text-primary)]',
              'transition-colors group-hover:text-[color:var(--workspace-primary)]'
            )}>
              {job.title}
            </h3>
            {/* Client Info Row */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-secondary)]">{job.client?.full_name || 'Client'}</span>
              <span className="text-[var(--text-muted)]">•</span>
              {job.location && (
                <span className="text-xs text-[var(--text-muted)]">{job.location}</span>
              )}
            </div>
          </div>
        </div>

        {/* Budget Display - PROMINENT */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-lg font-bold text-[color:var(--workspace-primary)]">
            {job.job_type === 'fixed_price'
              ? `${job.budget_min} - ${job.budget_max} TND`
              : `${job.hourly_rate} TND/hr`}
          </div>
          <IconButton
            icon={<Heart className={cn('h-6 w-6 transition-all', isSaved && 'fill-current')} />}
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

        {/* Job Type + Experience Pills */}
        <div className="flex flex-wrap gap-2">
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
          )}>
            {job.job_type === 'fixed_price' ? 'Fixed price' : 'Hourly'}
          </span>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">
          {job.description}
        </p>

        {/* Skills Row */}
        <div className="flex flex-wrap gap-2">
          {job.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                'bg-[color:var(--workspace-primary)]/10',
                'text-[color:var(--workspace-primary)]',
                'border border-[color:var(--workspace-primary)]/20'
              )}
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="text-xs text-[var(--text-muted)]">
              +{job.skills.length - 3} more
            </span>
          )}
        </div>

        {/* Footer Row */}
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo(job.posted_at)}
          </span>
          <span className="flex items-center gap-1">
            {job.client?.is_verified && (
              <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--workspace-primary)]" />
            )}
            {job.proposals_count} {t.jobs.proposals}
          </span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(JobCard);
