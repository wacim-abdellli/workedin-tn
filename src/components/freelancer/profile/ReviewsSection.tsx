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
                <Star
                    key={i}
                    className={`${size} ${i < Math.round(rating) ? 'fill-current' : ''}`}
                    style={{ color: i < Math.round(rating) ? '#F59E0B' : 'rgba(255,255,255,0.2)' }}
                />
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
        <section className="bg-[var(--card-bg)] rounded-2xl border border-white/7 p-6 md:p-7 mb-4 hover:border-white/12 transition-colors shadow-[0_25px_60px_-48px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-[#F59E0B]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#F59E0B]">
                        {tx('pages.freelancerProfile.sectionLabelTrust', undefined, 'Client trust')}
                    </span>
                </div>
            </div>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5">
                {tx('reviews.title', undefined, 'Reviews & work history')}
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-7 p-5 rounded-xl border border-white/7 bg-white/2">
                <div className="text-center shrink-0">
                    <p className="text-4xl font-bold text-[var(--text-primary)]">{stats.rating}</p>
                    <Stars rating={stats.rating} size="h-4 w-4" />
                    <p className="text-xs mt-1 text-[var(--text-muted)]">
                        {stats.reviews_count} {tx('pages.freelancerProfile.reviews', undefined, 'reviews')}
                    </p>
                </div>
                <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter(r => Math.round(r.rating) === star).length;
                        const pct = stats.reviews_count > 0 ? (count / stats.reviews_count) * 100 : 0;
                        return (
                            <div key={star} className="flex items-center gap-2.5">
                                <span className="text-xs w-3 text-right text-[var(--text-muted)]">{star}</span>
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 hover:bg-[#F59E0B]"
                                        style={{ width: `${pct}%`, background: 'rgba(245,158,11,0.6)' }}
                                    />
                                </div>
                                <span className="text-xs w-7 text-right text-[var(--text-muted)]">
                                    {Math.round(pct)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="p-5 rounded-xl border border-white/7 bg-white/2">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
                                        {review.client_avatar ? (
                                            <OptimizedImage src={review.client_avatar} alt={review.client_name} className="w-full h-full" imgClassName="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#F59E0B]/10">
                                                <User className="w-4 h-4 text-[#F59E0B]" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{review.client_name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{formatDate(review.created_at)}</p>
                                    </div>
                                </div>
                                <Stars rating={review.rating} />
                            </div>
                            <p className="text-xs font-medium mb-1.5 text-[#F59E0B]">{review.job_title}</p>
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{review.comment}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-1 mb-3">
                        {[...Array(5)].map((_, idx) => (
                            <Star key={idx} className="w-5 h-5 text-[#F59E0B]/60" />
                        ))}
                    </div>
                    <p className="text-sm text-[var(--text-muted)] text-center">
                        {tx('pages.freelancerProfile.noReviewsTrust', undefined, 'No reviews yet - complete your first contract to receive feedback')}
                    </p>
                </div>
            )}
        </section>
    );
}
