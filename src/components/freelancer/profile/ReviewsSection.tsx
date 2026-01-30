import { Star, User } from 'lucide-react';
import { OptimizedImage } from '../../common';
import type { FreelancerData } from '@/types/freelancer';

interface ReviewsSectionProps {
    reviews: FreelancerData['reviews'];
    stats: FreelancerData['stats'];
}

export default function ReviewsSection({ reviews, stats }: ReviewsSectionProps) {
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
        return new Date(dateString).toLocaleDateString('ar-TN', {
            year: 'numeric',
            month: 'long',
        });
    };

    return (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">تاريخ العمل والتقييمات</h2>

            {/* Rating Breakdown */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8 bg-gray-50 p-6 rounded-xl">
                <div className="text-center md:text-start min-w-[120px]">
                    <div className="text-4xl font-bold text-gray-900 mb-1">{stats.rating}</div>
                    {renderStars(stats.rating)}
                    <p className="text-sm text-muted mt-2">{stats.reviews_count} تقييم</p>
                </div>
                <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                        const count = reviews.filter(r => Math.round(r.rating) === stars).length;
                        const percentage = stats.reviews_count > 0
                            ? (count / stats.reviews_count) * 100
                            : 0;
                        return (
                            <div key={stars} className="flex items-center gap-3">
                                <span className="text-sm font-medium w-3 text-gray-600">{stars}</span>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-xs text-muted w-8 text-end">{Math.round(percentage)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {review.client_avatar ? (
                                        <OptimizedImage
                                            src={review.client_avatar}
                                            alt={review.client_name}
                                            className="w-full h-full"
                                            imgClassName="object-cover"
                                        />
                                    ) : (
                                        <User className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900">{review.client_name}</h4>
                                    <span className="text-xs text-muted">{formatDate(review.created_at)}</span>
                                </div>
                            </div>
                            {renderStars(review.rating)}
                        </div>
                        <h5 className="font-medium text-sm text-gray-700 mb-1">{review.job_title}</h5>
                        <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                ))}
                {reviews.length === 0 && (
                    <p className="text-center text-muted py-4">لا توجد تقييمات مكتوبة بعد</p>
                )}
            </div>
        </section>
    );
}
