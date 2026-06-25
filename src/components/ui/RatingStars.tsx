import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

export default function RatingStars({
  rating,
  reviews,
  snippet,
  className = '',
}: {
  rating: number;
  reviews?: number;
  snippet?: string;
  className?: string;
}) {
  const numRating = Number(rating) || 0;
  return (
    <div className={cn('group relative inline-flex items-center gap-2', className)} role="img" aria-label={`${numRating.toFixed(1)} out of 5 stars${typeof reviews === 'number' ? `, ${reviews} reviews` : ''}`}>
      <div className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => {
          const fill = Math.max(0, Math.min(1, numRating - index));
          return (
            <span key={index} className="relative h-4 w-4">
              <Star className="absolute inset-0 h-4 w-4 text-amber-200 dark:text-amber-900/50" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </span>
            </span>
          );
        })}
      </div>
      <span className="text-sm font-semibold text-[#1a1825] dark:text-white">
        {numRating.toFixed(1)}
        {typeof reviews === 'number' ? <span className="ml-1 text-[#6b6880] dark:text-[#8b8aa0]">({reviews})</span> : null}
      </span>

      {snippet ? (
        <div className="pointer-events-none absolute left-0 top-full z-30 mt-3 w-60 rounded-2xl border border-primary-100/70 bg-white dark:bg-[var(--color-bg-elevated)] p-3 text-xs leading-relaxed text-[#4e4a63] opacity-0 shadow-xl transition-opacity group-hover:opacity-100 dark:border-white/8 dark:text-[#aba9bc]">
          “{snippet}”
        </div>
      ) : null}
    </div>
  );
}
