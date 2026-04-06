import { Star, User } from 'lucide-react';
import { OptimizedImage } from '../../common';
import type { FreelancerData } from '@/types/freelancer';
import { useTranslation } from '../../../i18n';

interface ReviewsSectionProps {
    reviews: FreelancerData['reviews'];
    stats: FreelancerData['stats'];
}

function Stars({ rating, size = 'h-3.5 w-3.5' }: { rating: number; size?: string }) {
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`${size} ${i < Math.round(rating) ? 'fill-current' : ''}`}
                    style={{ color: i < Math.round(rating) ? 'var(--color-status-warning)' : 'var(--color-border-default)' }} />
            ))}
        </div>
    );
}

export default function ReviewsSection({ reviews, stats }: ReviewsSectionProps) {
    const { tx, language } = useTranslation();

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString(
            language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US',
            { year: 'numeric', month: 'long' }
        );

    return (
        <section className="rounded-xl border p-5 sm:p-6"
            style={{ background: 'var(--color-background-elevated)', borderColor: 'var(--color-border-subtle)' }}>
            <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                    style={{ color: 'var(--workspace-primary)' }}>
                    {tx('pages.freelancerProfile.sectionLabelTrust', undefined, 'Client trust')}
                </p>
                <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {tx('reviews.title', undefined, 'Reviews & work history')}
                </h2>
            </div>

            {/* Rating summary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6 p-4 rounded-xl border"
                style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-subtle)' }}>
                <div className="text-center shrink-0">
                    <p className="text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.rating}</p>
                    <Stars rating={stats.rating} size="h-4 w-4" />
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                        {stats.reviews_count} {tx('pages.freelancerProfile.reviews', undefined, 'reviews')}
                    </p>
                </div>
                <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter(r => Math.round(r.rating) === star).length;
                        const pct = stats.reviews_count > 0 ? (count / stats.reviews_count) * 100 : 0;
                        return (
                            <div key={star} className="flex items-center gap-2.5">
                                <span className="text-xs w-3 text-right" style={{ color: 'var(--color-text-tertiary)' }}>{star}</span>
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                                    style={{ background: 'var(--color-border-subtle)' }}>
                                    <div className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%`, background: 'var(--workspace-primary)' }} />
                                </div>
                                <span className="text-xs w-7 text-right" style={{ color: 'var(--color-text-tertiary)' }}>
                                    {Math.round(pct)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Reviews list */}
            {reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="p-4 rounded-xl border"
                            style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-subtle)' }}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border"
                                        style={{ borderColor: 'var(--color-border-subtle)' }}>
                                        {review.client_avatar ? (
                                            <OptimizedImage src={review.client_avatar} alt={review.client_name}
                                                className="w-full h-full" imgClassName="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"
                                                style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, var(--color-background-muted))' }}>
                                                <User className="w-4 h-4" style={{ color: 'var(--workspace-primary)' }} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                            {review.client_name}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                            {formatDate(review.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <Stars rating={review.rating} />
                            </div>
                            <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--workspace-primary)' }}>
                                {review.job_title}
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                {review.comment}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-10 text-center rounded-xl border border-dashed"
                    style={{ borderColor: 'var(--color-border-default)', background: 'var(--color-background-subtle)' }}>
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3"
                        style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}>
                        <Star className="w-5 h-5" style={{ color: 'var(--workspace-primary)' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                        {tx('pages.freelancerProfile.noReviews', undefined, 'No written reviews yet')}
                    </p>
                </div>
            )}
        </section>
    );
}
