import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Briefcase, Clock, Heart, MapPin, Shield, Sparkles, Zap } from 'lucide-react';

import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import RatingStars from '../ui/RatingStars';
import { cn } from '../../lib/utils';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import { useTranslation } from '@/i18n';

export interface Freelancer {
  id: string;
  name: string;
  title: string;
  avatar: string | null;
  rating: number;
  reviews: number;
  hourly_rate: number;
  location: string;
  skills: string[];
  success_rate: number;
  jobs_completed: number;
  response_time: string;
  is_verified: boolean;
  is_available: boolean;
}

interface FreelancerCardProps {
  freelancer: Freelancer;
  viewMode?: 'grid' | 'list';
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}

const FreelancerCard = memo(function FreelancerCard({
  freelancer,
  viewMode = 'grid',
  isSaved = false,
  onToggleSave,
}: FreelancerCardProps) {
  const navigate = useNavigate();
  const { tx } = useTranslation();
  const [from, to] = getAvatarGradient(freelancer.name);
  const badges = [
    freelancer.is_verified ? { icon: BadgeCheck, label: tx('pages.freelancerCard.badges.verified', undefined, 'Verified'), title: tx('pages.freelancerCard.badges.verifiedTitle', undefined, 'Identity and payment details reviewed.') } : null,
    freelancer.rating >= 4.8 ? { icon: Sparkles, label: tx('pages.freelancerCard.badges.topRated', undefined, 'Top Rated'), title: tx('pages.freelancerCard.badges.topRatedTitle', undefined, 'Consistently excellent client feedback.') } : null,
    freelancer.response_time.toLowerCase().includes('1') || freelancer.response_time.toLowerCase().includes('2')
      ? { icon: Zap, label: tx('pages.freelancerCard.badges.fastResponder', undefined, 'Fast Responder'), title: tx('pages.freelancerCard.badges.fastResponderTitle', undefined, 'Usually replies quickly to new clients.') }
      : null,
    freelancer.jobs_completed <= 3 ? { icon: Shield, label: tx('pages.freelancerCard.badges.newTalent', undefined, 'New Talent'), title: tx('pages.freelancerCard.badges.newTalentTitle', undefined, 'Fresh profile with early momentum.') } : null,
  ].filter(Boolean) as Array<{ icon: typeof Shield; label: string; title: string }>;

  return (
    <div
      className={cn(
        'group card card-hover card-hover-shine cursor-pointer rounded-[28px]',
        viewMode === 'list' ? 'flex flex-col gap-6 p-6 md:flex-row' : 'flex flex-col p-6'
      )}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
        event.currentTarget.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
      }}
      onClick={() => navigate(`/freelancer/${freelancer.id}`)}
    >
      <div className={cn(
        viewMode === 'list'
          ? 'shrink-0 border-b border-gray-100 pb-4 md:w-48 md:border-b-0 md:border-l md:border-gray-100 md:pb-0 md:pl-6 dark:border-dark-700'
          : 'mb-6 text-center'
      )}>
        <div className="relative inline-block">
          <div className="absolute inset-0 h-20 w-20 rotate-3 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 transition-transform group-hover:rotate-6 dark:from-primary-900/20 dark:to-primary-800/20" />
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl text-2xl font-bold text-white shadow-lg shadow-primary-500/20 transition-transform duration-300 group-hover:scale-105">
            {freelancer.avatar ? (
              <img
                src={freelancer.avatar}
                alt={freelancer.name}
                loading="lazy"
                width="80"
                height="80"
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-2xl" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                {getInitials(freelancer.name)}
              </div>
            )}

            {freelancer.is_available ? (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white bg-green-500 dark:border-dark-900" title={tx('findFreelancers.availableNow', undefined, 'Available now')} />
            ) : null}
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="mt-4 text-center">
            <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
              {freelancer.hourly_rate} <span className="text-sm font-normal text-muted">{tx('pages.freelancerCard.tndPerHour', undefined, 'TND/hr')}</span>
            </div>
            <div className="mt-1 inline-block rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
              {tx('pages.freelancerCard.successRate', { rate: freelancer.success_rate }, `${freelancer.success_rate}% success rate`)}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex-1">
        <div className="mb-2 flex items-start justify-between">
          <div className={cn(viewMode === 'list' ? '' : 'w-full text-center')}>
            <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-dark-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 lg:justify-start">
              {freelancer.name}
              {freelancer.is_verified ? (
                <span title={tx('pages.freelancerCard.verifiedProfile', undefined, 'Verified profile')}>
                  <BadgeCheck className="h-4 w-4 text-blue-500" />
                </span>
              ) : null}
            </h3>
            <p className="mt-1 text-sm font-medium text-muted">{freelancer.title}</p>
            {badges.length > 0 ? (
              <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
                {badges.slice(0, 3).map((badge) => (
                  <span
                    key={badge.label}
                    title={badge.title}
                    className="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-primary-50/80 px-2.5 py-1 text-[11px] font-semibold text-primary-700 dark:border-white/8 dark:bg-white/5 dark:text-primary-200"
                  >
                    <badge.icon className="h-3 w-3" />
                    {badge.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {viewMode !== 'list' && onToggleSave ? (
            <div className="absolute left-4 top-4 z-10">
              <IconButton
                icon={<Heart className={cn('h-5 w-5 transition-all', isSaved && 'fill-current')} />}
                label={isSaved ? tx('common.unsaveFreelancer', undefined, 'Unsave freelancer') : tx('common.saveFreelancer', undefined, 'Save freelancer')}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleSave(freelancer.id);
                }}
                isActive={isSaved}
                variant="danger"
                size="sm"
              />
            </div>
          ) : null}
        </div>

        <div className={cn('mb-4 flex items-center gap-4 text-sm', viewMode === 'list' ? '' : 'justify-center border-b border-gray-50 pb-4 dark:border-dark-800')}>
          <RatingStars
            rating={freelancer.rating}
            reviews={freelancer.reviews}
            snippet={tx('pages.freelancerCard.snippet', undefined, 'Professional, responsive, and much more polished than typical marketplace profiles.')}
          />
          <div className="flex items-center gap-1.5 text-muted">
            <MapPin className="h-3.5 w-3.5" />
            {freelancer.location}
          </div>
        </div>

        {viewMode !== 'list' ? (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-gray-50 p-3 text-center dark:bg-dark-800">
              <div className="text-lg font-bold text-primary-600 dark:text-primary-400">{freelancer.hourly_rate} TND</div>
              <div className="text-[10px] text-muted">{tx('pages.freelancerCard.hourlyRate', undefined, 'Hourly rate')}</div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-3 text-center dark:bg-dark-800">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">{freelancer.success_rate}%</div>
              <div className="text-[10px] text-muted">{tx('pages.freelancerCard.successScore', undefined, 'Success score')}</div>
            </div>
          </div>
        ) : null}

        <div className={cn('flex flex-wrap gap-1.5', viewMode === 'list' ? 'mb-4' : 'justify-center')}>
          {freelancer.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 transition-colors group-hover:border-primary-200 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-300 dark:group-hover:border-primary-800"
            >
              {skill}
            </span>
          ))}
          {freelancer.skills.length > 3 ? <span className="px-2 py-1 text-xs text-muted">+ {freelancer.skills.length - 3}</span> : null}
        </div>

        {viewMode === 'list' ? (
          <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 dark:border-dark-700">
            <div className="flex items-center gap-6 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {tx('pages.freelancerCard.completedJobs', { count: freelancer.jobs_completed }, `${freelancer.jobs_completed} completed`)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {tx('pages.freelancerCard.repliesIn', { time: freelancer.response_time }, `Replies in ${freelancer.response_time}`)}
              </span>
            </div>
            <div className="flex gap-2">
              {onToggleSave ? (
                <IconButton
                  icon={<Heart className={cn('h-5 w-5 transition-all', isSaved && 'fill-current')} />}
                  label={isSaved ? tx('common.unsaveFreelancer', undefined, 'Unsave freelancer') : tx('common.saveFreelancer', undefined, 'Save freelancer')}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleSave(freelancer.id);
                  }}
                  isActive={isSaved}
                  variant={isSaved ? 'danger' : 'outline'}
                  size="md"
                  className={cn('rounded-xl', !isSaved && 'border-gray-200 dark:border-dark-600')}
                />
              ) : null}
              <Button
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/freelancer/${freelancer.id}`);
                }}
              >
                {tx('pages.freelancerCard.viewProfile', undefined, 'View profile')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
});

export default FreelancerCard;
