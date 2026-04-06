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

    const renderStars = (rating: number, size = 'w-4 h-4') => (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`${size} transition-colors ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-[var(--color-border-default)]'}`} />
            ))}
        </div>
    );

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString(
            language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US',
            { year: 'numeric', month: 'long' }
        );

    return (
        <section className="group relative rounded-3xl overflow-hidden border-2 p-6 sm:p-8 transition-all duration-500 hover:shadow-2xl"
            style={{
                borderColor: 'color-mix(in srgb, #f59e0b 20%, var(--color-border-subtle))',
                background: 'var(--color-background-elevated)',
                boxShadow: '0 4px 20px -8px rgba(245,158,11,0.25)',
            }}
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f59e0b] via-[#f97316] to-[#ef4444]" />
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }} />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                        <Star className="h-5 w-5 text-white fill-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#f59e0b' }}>
                            {tx('pages.freelancerProfile.sectionLabelTrust', undefined, 'Client trust')}
                        </p>
                        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                            {tx('reviews.title', undefined, 'Reviews & work history')}
                        </h2>
                    </div>
                </div>

                {/* Rating Breakdown */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-8 p-6 rounded-2xl border-2"
                    style={{ background: 'color-mix(in srgb, #f59e0b 5%, var(--color-background-subtle))', borderColor: 'color-mix(in srgb, #f59e0b 20%, var(--color-border-subtle))' }}>
                    <div className="text-center min-w-[120px]">
                        <div className="text-5xl font-black mb-2" style={{ color: 'var(--color-text-primary)' }}>{stats.rating}</div>
                        {renderStars(stats.rating, 'w-5 h-5')}
                        <p className="text-xs mt-2 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                            {stats.reviews_count} {tx('pages.freelancerProfile.reviews', undefined, 'reviews')}
                        </p>
                    </div>
                    <div className="flex-1 w-full space-y-2.5">
                        {[5, 4, 3, 2, 1].map((stars) => {
                            const count = reviews.filter(r => Math.round(r.rating) === stars).length;
                            const pct = stats.reviews_count > 0 ? (count / stats.reviews_count) * 100 : 0;
                            return (
                                <div key={stars} className="flex items-center gap-3">
                                    <span className="text-xs font-bold w-3" style={{ color: 'var(--color-text-secondary)' }}>{stars}</span>
                                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-background-muted)' }}>
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b, #f97316)' }} />
                                    </div>
                                    <span className="text-xs font-medium w-8 text-end" style={{ color: 'var(--color-text-tertiary)' }}>{Math.round(pct)}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-5">
                    {reviews.map((review) => (
                        <div key={review.id} className="p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
                            style={{ borderColor: 'color-mix(in srgb, #f59e0b 15%, var(--color-border-subtle))', background: 'color-mix(in srgb, #f59e0b 3%, var(--color-background-subtle))' }}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0"
                                        style={{ borderColor: 'color-mix(in srgb, #f59e0b 30%, transparent)' }}>
                                        {review.client_avatar ? (
                                            <OptimizedImage src={review.client_avatar} alt={review.client_name}
                                                className="w-full h-full" imgClassName="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{review.client_name}</h4>
                                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{formatDate(review.created_at)}</span>
                                    </div>
                                </div>
                                {renderStars(review.rating)}
                            </div>
                            <p className="text-xs font-semibold mb-2" style={{ color: '#f59e0b' }}>{review.job_title}</p>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{review.comment}</p>
                        </div>
                    ))}

                    {reviews.length === 0 && (
                        <div className="text-center py-14 rounded-2xl border-2 border-dashed group/empty transition-all duration-300 hover:border-[#f59e0b]"
                            style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-subtle)' }}>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg transition-all duration-300 group-hover/empty:scale-110 group-hover/empty:rotate-6"
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                                <Star className="w-7 h-7 text-white fill-white" />
                            </div>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                                {tx('pages.freelancerProfile.noReviews', undefined, 'No written reviews yet')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
