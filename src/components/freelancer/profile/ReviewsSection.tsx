import { Star, User } from 'lucide-react';
import { OptimizedImage } from '../../common';
import type { FreelancerData } from '@/types/freelancer';
import { useTranslation } from '../../../i18n';

interface ReviewsSectionProps {
    reviews: FreelancerData['reviews'];
    stats: FreelancerData['stats'];
}

export default function ReviewsSection({ reviews, stats }: ReviewsSectionProps) {
    const { tx, language } = useTranslation();

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(rating)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', {
            year: 'numeric',
            month: 'long',
        });
    };

    return (
        <section className="rounded-[1.75rem] border border-black/[0.06] bg-white dark:bg-gray-800 p-6 shadow-[0_18px_40px_-28px_rgba(26,24,37,0.14)] dark:border-white/8 dark:bg-[#171421]">
            <div className="mb-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{tx('pages.freelancerProfile.sectionLabelTrust', undefined, 'Client trust')}</div>
                <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{tx('reviews.title', undefined, 'Reviews and work history')}</h2>
            </div>

            {/* Rating Breakdown */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8 bg-[var(--surface-bg)] p-6 rounded-2xl border border-border/60">
                <div className="text-center md:text-start min-w-[120px]">
                    <div className="text-4xl font-black text-[var(--text-primary)] mb-1">{stats.rating}</div>
                    {renderStars(stats.rating)}
                    <p className="text-sm text-[var(--text-muted)] mt-2">{tx('pages.freelancerProfile.reviewsCount', { count: stats.reviews_count }, `${stats.reviews_count} reviews`)}</p>
                </div>
                <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                        const count = reviews.filter(r => Math.round(r.rating) === stars).length;
                        const percentage = stats.reviews_count > 0
                            ? (count / stats.reviews_count) * 100
                            : 0;
                        return (
                            <div key={stars} className="flex items-center gap-3">
                                <span className="text-sm font-medium w-3 text-[var(--text-secondary)]">{stars}</span>
                                <div className="flex-1 h-2 bg-black/[0.08] dark:white/[0.08] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[linear-gradient(90deg,var(--workspace-primary),var(--brand-accent))] rounded-full"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-xs text-[var(--text-muted)] w-8 text-end">{Math.round(percentage)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.map((review) => (
                    <div key={review.id} className="border-b border-border/70 pb-6 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                    {review.client_avatar ? (
                                        <OptimizedImage
                                            src={review.client_avatar}
                                            alt={review.client_name}
                                            className="w-full h-full"
                                            imgClassName="object-cover"
                                        />
                                    ) : (
                                        <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{review.client_name}</h4>
                                    <span className="text-xs text-[var(--text-muted)]">{formatDate(review.created_at)}</span>
                                </div>
                            </div>
                            {renderStars(review.rating)}
                        </div>
                        <h5 className="font-medium text-sm text-[var(--text-secondary)] mb-1">{review.job_title}</h5>
                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{review.comment}</p>
                    </div>
                ))}
                {reviews.length === 0 && (
                    <p className="text-center text-[var(--text-muted)] py-4">{tx('pages.freelancerProfile.noReviews', undefined, 'No written reviews yet')}</p>
                )}
            </div>
        </section>
    );
}
