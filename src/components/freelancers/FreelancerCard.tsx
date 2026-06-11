import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Briefcase, Clock, Heart, MapPin, Shield, Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import { useTranslation } from '@/i18n';
import { localizeGovernorate } from '@/lib/governorates';

export interface Freelancer {
  id: string; name: string; title: string; avatar: string | null;
  rating: number; reviews: number; hourly_rate: number; location: string;
  skills: string[]; success_rate: number; jobs_completed: number;
  response_time: string; is_verified: boolean; is_available: boolean;
}

interface FreelancerCardProps {
  freelancer: Freelancer; viewMode?: 'grid' | 'list';
  isSaved?: boolean; onToggleSave?: (id: string) => void;
  isOnline?: boolean;
}

function FreelancerCard({ freelancer, viewMode = 'grid', isSaved = false, onToggleSave, isOnline = false }: FreelancerCardProps) {
  const navigate = useNavigate();
  const { tx, language } = useTranslation();
  const [from, to] = getAvatarGradient(freelancer.name);

  const badges = [
    freelancer.rating >= 4.8
      ? { icon: Sparkles, label: tx('pages.freelancerCard.badges.topRated', undefined, 'Top Rated'), color: '#fbbf24' }
      : null,
    (freelancer.response_time.includes('1') || freelancer.response_time.includes('2'))
      ? { icon: Zap, label: tx('pages.freelancerCard.badges.fastResponder', undefined, 'Fast'), color: '#60a5fa' }
      : null,
    freelancer.jobs_completed <= 3
      ? { icon: Shield, label: tx('pages.freelancerCard.badges.newTalent', undefined, 'New'), color: '#a78bfa' }
      : null,
    freelancer.is_available
      ? { icon: Zap, label: tx('pages.freelancerCard.badges.availableNow', undefined, 'Available'), color: '#f472b6' }
      : null,
  ].filter(Boolean) as Array<{ icon: typeof Shield; label: string; color: string }>;

  const localizedLocation = freelancer.location ? localizeGovernorate(freelancer.location, language) : '';

  if (viewMode === 'list') {
    return (
      <div
        className="group relative flex flex-col md:flex-row items-start gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 cursor-pointer transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.025] hover:-translate-y-0.5 shadow-sm hover:shadow-md"
        onClick={() => navigate(`/freelancer/${freelancer.id}`)}
      >
        {/* Save button (top right) */}
        {onToggleSave && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(freelancer.id); }}
            className="absolute top-5 right-5 h-9 w-9 flex items-center justify-center rounded-xl border border-white/8 bg-white/4 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all shrink-0 z-10"
          >
            <Heart className={cn('w-4 h-4 transition-colors', isSaved ? 'fill-rose-400 text-rose-400' : 'text-white/40')} />
          </button>
        )}

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-white/10 shadow-lg">
            {freelancer.avatar
              ? <img src={freelancer.avatar} alt={freelancer.name} className="h-full w-full object-cover" />
              : <div className="h-full w-full flex items-center justify-center text-lg font-bold text-white" style={{ background: `linear-gradient(135deg,${from},${to})` }}>{getInitials(freelancer.name)}</div>
            }
          </div>
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full bg-emerald-400 ring-2 ring-[#0f0f15]" />
          )}
        </div>

        {/* Info content */}
        <div className="flex-1 min-w-0 pr-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
            <div>
              <h3 className="flex items-center gap-2 text-base font-extrabold text-white transition-colors group-hover:text-[var(--workspace-primary,#8b5cf6)]">
                {freelancer.name}
                {freelancer.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
              </h3>
              <p className="text-xs font-semibold text-white/55 mt-0.5">{freelancer.title || 'Freelancer'}</p>
            </div>
            <div className="shrink-0">
              <p className="text-lg font-black text-white">{freelancer.hourly_rate} <span className="text-xs font-normal text-white/40">TND/hr</span></p>
            </div>
          </div>

          {/* Location / rating row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-white/45 mb-4">
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" /> <strong className="text-white">{freelancer.rating > 0 ? freelancer.rating.toFixed(1) : '—'}</strong> ({freelancer.reviews} reviews)</span>
            <span className="text-white/20">•</span>
            {freelancer.success_rate > 0 && (
              <>
                <span className="font-semibold text-emerald-400">{freelancer.success_rate}% Success</span>
                <span className="text-white/20">•</span>
              </>
            )}
            {localizedLocation && (
              <>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /> {localizedLocation}</span>
                <span className="text-white/20">•</span>
              </>
            )}
            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 shrink-0" /> {freelancer.jobs_completed} {tx('pages.freelancerCard.completedJobs', { count: freelancer.jobs_completed }, 'jobs')}</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 shrink-0" /> {freelancer.response_time}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Skills */}
            <div className="flex flex-wrap gap-1.5">
              {freelancer.skills.slice(0, 5).map((s) => (
                <span key={s} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-white/6 bg-white/4 text-white/60 hover:text-white hover:border-white/12 transition-colors">{s}</span>
              ))}
              {freelancer.skills.length > 5 && <span className="text-[11px] font-medium text-white/30 self-center">+{freelancer.skills.length - 5}</span>}
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-1.5">
                {badges.slice(0, 2).map((b) => (
                  <span key={b.label} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border"
                    style={{ color: b.color, background: `color-mix(in srgb,${b.color} 10%,transparent)`, borderColor: `color-mix(in srgb,${b.color} 20%,transparent)` }}>
                    <b.icon className="w-2.5 h-2.5" />
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // GRID
  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 cursor-pointer transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.025] hover:-translate-y-0.5 shadow-sm hover:shadow-md h-full"
      onClick={() => navigate(`/freelancer/${freelancer.id}`)}
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-300"
        style={{ background: 'linear-gradient(135deg,color-mix(in srgb,var(--workspace-primary,#8b5cf6) 6%,transparent) 0%,transparent 65%)' }} />

      {/* Header section (Avatar + Save button inside layout to avoid overlap) */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-md">
          {freelancer.avatar
            ? <img src={freelancer.avatar} alt={freelancer.name} className="h-full w-full object-cover" />
            : <div className="h-full w-full flex items-center justify-center text-xl font-extrabold text-white" style={{ background: `linear-gradient(135deg,${from},${to})` }}>{getInitials(freelancer.name)}</div>
          }
        </div>

        {onToggleSave && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(freelancer.id); }}
            className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/8 bg-white/4 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all"
          >
            <Heart className={cn('w-3.5 h-3.5 transition-colors', isSaved ? 'fill-rose-400 text-rose-400' : 'text-white/40')} />
          </button>
        )}
      </div>

      {/* Name + title */}
      <div className="mb-2">
        <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-white transition-colors group-hover:text-[var(--workspace-primary,#8b5cf6)]">
          {freelancer.name}
          {freelancer.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
        </h3>
        <p className="text-xs font-semibold text-white/50 mt-0.5 line-clamp-1">{freelancer.title || 'Freelancer'}</p>
      </div>

      {/* Badges row (Clean placement, no absolute overlaps) */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {badges.slice(0, 2).map((b) => (
            <span key={b.label} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold border"
              style={{ color: b.color, background: `color-mix(in srgb,${b.color} 10%,transparent)`, borderColor: `color-mix(in srgb,${b.color} 20%,transparent)` }}>
              <b.icon className="w-2.5 h-2.5" />
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Rating + location */}
      <div className="flex items-center gap-3 text-xs text-white/40 mb-4">
        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" /><strong className="text-white">{freelancer.rating > 0 ? freelancer.rating.toFixed(1) : '—'}</strong> ({freelancer.reviews})</span>
        {localizedLocation && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" />{localizedLocation}</span>}
      </div>

      {/* Rate + success + jobs (Clean layout, no bulky boxes) */}
      <div className="flex items-center justify-between py-3 border-y border-white/[0.05] mb-4 text-xs">
        <div>
          <span className="block text-sm font-black text-white">{freelancer.hourly_rate} <span className="text-[10px] font-normal text-white/40">TND/hr</span></span>
          <span className="block text-[9px] text-white/35 uppercase tracking-wider mt-0.5">{tx('pages.freelancerCard.perHour', undefined, 'Rate')}</span>
        </div>
        <div className="w-[1px] h-6 bg-white/[0.08]" />
        <div className="text-center">
          <span className="block text-sm font-black text-emerald-400">{freelancer.success_rate || 100}%</span>
          <span className="block text-[9px] text-white/35 uppercase tracking-wider mt-0.5">{tx('pages.freelancerCard.success', undefined, 'Success')}</span>
        </div>
        <div className="w-[1px] h-6 bg-white/[0.08]" />
        <div className="text-right">
          <span className="block text-sm font-black text-white">{freelancer.jobs_completed}</span>
          <span className="block text-[9px] text-white/35 uppercase tracking-wider mt-0.5">Jobs</span>
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mt-auto">
        {freelancer.skills.slice(0, 3).map((s) => (
          <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-white/6 bg-white/4 text-white/60">{s}</span>
        ))}
        {freelancer.skills.length > 3 && <span className="text-[10px] font-medium text-white/30 self-center ml-0.5">+{freelancer.skills.length - 3}</span>}
      </div>
    </div>
  );
}

export default React.memo(FreelancerCard);
