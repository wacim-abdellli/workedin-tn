import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Briefcase, Clock, Heart, MapPin, Shield, Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import { useTranslation } from '@/i18n';

export interface Freelancer {
  id: string; name: string; title: string; avatar: string | null;
  rating: number; reviews: number; hourly_rate: number; location: string;
  skills: string[]; success_rate: number; jobs_completed: number;
  response_time: string; is_verified: boolean; is_available: boolean;
}

interface FreelancerCardProps {
  freelancer: Freelancer; viewMode?: 'grid' | 'list';
  isSaved?: boolean; onToggleSave?: (id: string) => void;
}

function FreelancerCard({ freelancer, viewMode = 'grid', isSaved = false, onToggleSave }: FreelancerCardProps) {
  const navigate = useNavigate();
  const { tx } = useTranslation();
  const [from, to] = getAvatarGradient(freelancer.name);

  const badges = [
    freelancer.is_verified
      ? { icon: BadgeCheck, label: tx('pages.freelancerCard.badges.verified', undefined, 'Verified'), color: '#34d399' }
      : null,
    freelancer.rating >= 4.8
      ? { icon: Sparkles, label: tx('pages.freelancerCard.badges.topRated', undefined, 'Top Rated'), color: '#fbbf24' }
      : null,
    (freelancer.response_time.includes('1') || freelancer.response_time.includes('2'))
      ? { icon: Zap, label: tx('pages.freelancerCard.badges.fastResponder', undefined, 'Fast'), color: '#60a5fa' }
      : null,
    freelancer.jobs_completed <= 3
      ? { icon: Shield, label: tx('pages.freelancerCard.badges.newTalent', undefined, 'New'), color: '#a78bfa' }
      : null,
  ].filter(Boolean) as Array<{ icon: typeof Shield; label: string; color: string }>;

  if (viewMode === 'list') {
    return (
      <div
        className="group flex flex-col sm:flex-row items-start gap-4 rounded-2xl border border-white/8 p-5 cursor-pointer transition-all duration-200 hover:border-white/16 hover:-translate-y-0.5"
        style={{ background: 'rgba(255,255,255,0.025)' }}
        onClick={() => navigate(`/freelancer/${freelancer.id}`)}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="h-14 w-14 rounded-2xl overflow-hidden ring-2 ring-white/8">
            {freelancer.avatar
              ? <img src={freelancer.avatar} alt={freelancer.name} className="h-full w-full object-cover" />
              : <div className="h-full w-full flex items-center justify-center text-base font-bold text-white" style={{ background: `linear-gradient(135deg,${from},${to})` }}>{getInitials(freelancer.name)}</div>
            }
          </div>
          {freelancer.is_available && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0f0f15]" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-white transition-colors group-hover:[color:var(--workspace-primary)]">
                {freelancer.name}
                {freelancer.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </h3>
              <p className="text-xs text-white/45 mt-0.5">{freelancer.title}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-base font-black text-white">{freelancer.hourly_rate} <span className="text-xs font-normal text-white/40">TND/hr</span></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40 mb-3">
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {freelancer.rating > 0 ? freelancer.rating.toFixed(1) : '—'} ({freelancer.reviews})</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {freelancer.location || '—'}</span>
            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {freelancer.jobs_completed} {tx('pages.freelancerCard.completedJobs', { count: freelancer.jobs_completed }, 'jobs')}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {freelancer.response_time}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {freelancer.skills.slice(0, 4).map((s) => (
                <span key={s} className="text-[11px] px-2.5 py-0.5 rounded-full border border-white/8 bg-white/4 text-white/55">{s}</span>
              ))}
              {freelancer.skills.length > 4 && <span className="text-[11px] text-white/30">+{freelancer.skills.length - 4}</span>}
            </div>
            {onToggleSave && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSave(freelancer.id); }}
                className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/10 bg-white/4 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all shrink-0"
              >
                <Heart className={cn('w-3.5 h-3.5 transition-colors', isSaved ? 'fill-rose-400 text-rose-400' : 'text-white/40')} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // GRID
  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-white/8 p-5 cursor-pointer transition-all duration-200 hover:border-white/16 hover:-translate-y-0.5"
      style={{ background: 'rgba(255,255,255,0.025)' }}
      onClick={() => navigate(`/freelancer/${freelancer.id}`)}
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: 'linear-gradient(135deg,color-mix(in srgb,var(--workspace-primary,#8b5cf6) 8%,transparent) 0%,transparent 65%)' }} />

      {/* Save button */}
      {onToggleSave && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(freelancer.id); }}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-xl border border-white/10 bg-white/4 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all z-10"
        >
          <Heart className={cn('w-3.5 h-3.5 transition-colors', isSaved ? 'fill-rose-400 text-rose-400' : 'text-white/40')} />
        </button>
      )}

      {/* Avatar */}
      <div className="relative mb-4 self-start">
        <div
          className="absolute -inset-1 rounded-2xl opacity-50 blur-sm transition-opacity group-hover:opacity-80"
          style={{ background: `linear-gradient(135deg,${from},${to})` }}
        />
        <div className="relative h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-black/40">
          {freelancer.avatar
            ? <img src={freelancer.avatar} alt={freelancer.name} className="h-full w-full object-cover" />
            : <div className="h-full w-full flex items-center justify-center text-lg font-bold text-white" style={{ background: `linear-gradient(135deg,${from},${to})` }}>{getInitials(freelancer.name)}</div>
          }
        </div>
        {freelancer.is_available && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0f0f15]" />
        )}
      </div>

      {/* Name + title */}
      <div className="mb-3">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-white transition-colors group-hover:[color:var(--workspace-primary)]">
          {freelancer.name}
          {freelancer.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
        </h3>
        <p className="text-xs text-white/45 mt-0.5 line-clamp-1">{freelancer.title || '—'}</p>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {badges.slice(0, 2).map((b) => (
            <span key={b.label} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border"
              style={{ color: b.color, background: `color-mix(in srgb,${b.color} 12%,transparent)`, borderColor: `color-mix(in srgb,${b.color} 25%,transparent)` }}>
              <b.icon className="w-2.5 h-2.5" />
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Rating + location */}
      <div className="flex items-center gap-3 text-xs text-white/40 mb-4">
        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{freelancer.rating > 0 ? freelancer.rating.toFixed(1) : '—'} ({freelancer.reviews})</span>
        {freelancer.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{freelancer.location}</span>}
      </div>

      {/* Rate + success */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-xl bg-black/20 border border-white/6 p-2.5 text-center">
          <p className="text-base font-black text-white">{freelancer.hourly_rate}<span className="text-[10px] font-normal text-white/35 ml-0.5">TND</span></p>
          <p className="text-[10px] text-white/35 mt-0.5">per hour</p>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/6 p-2.5 text-center">
          <p className="text-base font-black" style={{ color: 'var(--workspace-primary,#8b5cf6)' }}>{freelancer.success_rate}%</p>
          <p className="text-[10px] text-white/35 mt-0.5">success</p>
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {freelancer.skills.slice(0, 3).map((s) => (
          <span key={s} className="text-[11px] px-2.5 py-0.5 rounded-full border border-white/8 bg-white/4 text-white/55">{s}</span>
        ))}
        {freelancer.skills.length > 3 && <span className="text-[11px] text-white/30 self-center">+{freelancer.skills.length - 3}</span>}
      </div>
    </div>
  );
}

export default React.memo(FreelancerCard);
