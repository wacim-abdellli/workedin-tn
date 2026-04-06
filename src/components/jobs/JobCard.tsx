import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { JobCardErrorFallback } from '../ErrorFallback';
import { Clock, Heart, TrendingUp, MapPin, Sparkles } from 'lucide-react';

import { useTranslation } from '../../i18n';
import OptimizedImage from '../common/OptimizedImage';
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
  category?: string;
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
  onToggleSave: (job: JobForCard) => Awaitable<void>;
  onClick: (jobId: string) => void;
}

type Awaitable<T> = T | Promise<T>;

// 🎨 VIBRANT CATEGORY COLORS
const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string; gradient: string }> = {
  design: { border: '#EC4899', bg: '#FCE7F3', text: '#BE185D', gradient: 'from-pink-500 to-rose-500' },
  development: { border: '#8B5CF6', bg: '#EDE9FE', text: '#6D28D9', gradient: 'from-purple-500 to-indigo-500' },
  writing: { border: '#06B6D4', bg: '#CFFAFE', text: '#0E7490', gradient: 'from-cyan-500 to-blue-500' },
  translation: { border: '#10B981', bg: '#D1FAE5', text: '#047857', gradient: 'from-emerald-500 to-teal-500' },
  marketing: { border: '#F59E0B', bg: '#FEF3C7', text: '#D97706', gradient: 'from-amber-500 to-orange-500' },
  video: { border: '#EF4444', bg: '#FEE2E2', text: '#DC2626', gradient: 'from-red-500 to-pink-500' },
  data: { border: '#3B82F6', bg: '#DBEAFE', text: '#1E40AF', gradient: 'from-blue-500 to-cyan-500' },
  other: { border: '#6B7280', bg: '#F3F4F6', text: '#374151', gradient: 'from-gray-500 to-slate-500' },
};

function JobCard({ job, isSaved, onToggleSave, onClick }: JobCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { t, language } = useTranslation();
  const [from, to] = getAvatarGradient(job.client?.full_name || 'Khedma');
  
  const categoryColor = CATEGORY_COLORS[job.category || 'other'] || CATEGORY_COLORS.other;

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
      className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'var(--color-background-elevated)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${categoryColor.border}`,
      }}
    >
      {/* Gradient Overlay on Hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${categoryColor.bg}20 0%, transparent 100%)`,
        }}
      />

      {/* Floating Save Button */}
      <button
        onClick={async (event) => {
          event.stopPropagation();
          if (isSaving) return;
          setIsSaving(true);
          try {
            await onToggleSave(job);
          } finally {
            setIsSaving(false);
          }
        }}
        disabled={isSaving}
        className="absolute top-4 right-4 z-10 p-2 rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
        style={{
          background: 'var(--color-background-elevated)',
          boxShadow: isSaved ? `0 4px 12px ${categoryColor.border}40` : '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Heart 
          className="w-5 h-5 transition-colors" 
          fill={isSaved ? categoryColor.border : 'none'}
          stroke={isSaved ? categoryColor.border : '#9CA3AF'}
        />
      </button>

      {/* Category Badge */}
      {job.category && (
        <div 
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
          style={{
            background: categoryColor.bg,
            color: categoryColor.text,
          }}
        >
          <Sparkles className="w-3 h-3" />
          {job.category}
        </div>
      )}

      {/* Title - Large and Bold */}
      <h3
        className="text-xl font-bold mb-2 line-clamp-2 transition-colors pe-10"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {job.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4"
         style={{ color: 'var(--color-text-secondary)' }}>
        {job.description}
      </p>

      {/* Budget - Large and Prominent */}
      <div className="mb-4">
        <div
          className="inline-flex items-baseline gap-2 px-4 py-2 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${categoryColor.border}15, ${categoryColor.border}05)`,
          }}
        >
          <span className="text-2xl font-bold" style={{ color: categoryColor.border }}>
            {job.job_type === 'fixed_price'
              ? `${job.budget_min ?? '?'}-${job.budget_max ?? '?'}`
              : (job.hourly_rate ?? '?')
            }
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {job.job_type === 'fixed_price' ? 'TND' : 'TND/h'}
          </span>
        </div>
      </div>

      {/* Skills - Tokenized Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.skills.slice(0, 4).map((skill, idx) => (
          <span
            key={idx}
            className="px-3 py-1 rounded-full text-xs font-medium border"
            style={{
              background: 'color-mix(in srgb, var(--workspace-primary) 8%, transparent)',
              borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, transparent)',
              color: 'var(--workspace-primary)',
            }}
          >
            {skill}
          </span>
        ))}
        {job.skills.length > 4 && (
          <span
            className="px-3 py-1 rounded-full text-xs font-medium border"
            style={{
              background: 'var(--color-background-muted)',
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            +{job.skills.length - 4}
          </span>
        )}
      </div>

      {/* Footer - Client & Stats */}
      <div
        className="flex items-center justify-between pt-4 border-t"
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        {/* Client Info */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white overflow-hidden"
            style={{
              background: job.client?.avatar_url ? `linear-gradient(135deg, ${from}, ${to})` : `linear-gradient(135deg, ${categoryColor.border}, ${categoryColor.text})`,
              boxShadow: `0 4px 12px ${categoryColor.border}30`,
            }}
          >
            {job.client?.avatar_url ? (
              <OptimizedImage
                src={job.client.avatar_url}
                alt={job.client.full_name}
                className="h-full w-full"
                imgClassName="rounded-full"
                width={32}
                height={32}
              />
            ) : (
              getInitials(job.client?.full_name || 'C')
            )}
          </div>
          <div>
            <p className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--color-text-primary)' }}>
              {job.client?.full_name || 'Client'}
              {job.client?.is_verified && (
                <span
                  className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-white"
                  style={{ background: 'var(--color-status-success)', fontSize: '8px' }}
                  title="Verified"
                >✓</span>
              )}
            </p>
            {job.client?.location && (
              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                <MapPin className="w-3 h-3" />
                {job.client.location}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-status-success)' }} />
            <span>{job.proposals_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" style={{ color: 'var(--color-status-info)' }} />
            <span>{timeAgo(job.posted_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const JobCardErrorBoundary = (props: JobCardProps) => (
  <ErrorBoundary FallbackComponent={JobCardErrorFallback}>
    <JobCard {...props} />
  </ErrorBoundary>
);

export default React.memo(JobCardErrorBoundary);
