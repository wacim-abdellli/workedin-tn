import { useState } from 'react';
import { Star, ThumbsUp, ChevronDown, ChevronUp, Flag, MessageSquare } from 'lucide-react';

interface Review {
    id: string;
    reviewer: {
        id: string;
        name: string;
        avatar: string | null;
        is_anonymous: boolean;
    };
    overall_rating: number;
    detailed_ratings: {
        communication: number;
        quality?: number;
        deadlines?: number;
        professionalism: number;
        paymentOnTime?: number;
        clearRequirements?: number;
    };
    review_text: string;
    project_title: string;
    created_at: string;
    helpful_count: number;
    response?: {
        text: string;
        created_at: string;
    };
}

interface ReviewDisplayProps {
    reviews: Review[];
    aggregateRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
    detailedAverages: {
        communication: number;
        quality?: number;
        deadlines?: number;
        professionalism: number;
        paymentOnTime?: number;
        clearRequirements?: number;
    };
    userType: 'freelancer' | 'client';
}

export default function ReviewDisplay({
    reviews,
    aggregateRating,
    totalReviews,
    ratingDistribution,
    detailedAverages,
    userType,
}: ReviewDisplayProps) {
    const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest' | 'helpful'>('recent');
    const [expandedReview, setExpandedReview] = useState<string | null>(null);

    const sortedReviews = [...reviews].sort((a, b) => {
        switch (sortBy) {
            case 'highest': return b.overall_rating - a.overall_rating;
            case 'lowest': return a.overall_rating - b.overall_rating;
            case 'helpful': return b.helpful_count - a.helpful_count;
            default: return 0; // recent is already sorted
        }
    });

    const detailedCategories = userType === 'freelancer'
        ? [
            { key: 'communication', label: 'التواصل' },
            { key: 'quality', label: 'جودة العمل' },
            { key: 'deadlines', label: 'الالتزام بالمواعيد' },
            { key: 'professionalism', label: 'الاحترافية' },
        ]
        : [
            { key: 'communication', label: 'التواصل' },
            { key: 'paymentOnTime', label: 'الدفع في الوقت' },
            { key: 'clearRequirements', label: 'وضوح المتطلبات' },
            { key: 'professionalism', label: 'الاحترافية' },
        ];

    return (
        <div className="space-y-8">
            {/* Aggregate Stats */}
            <div className="card">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Overall Rating */}
                    <div className="text-center">
                        <div className="text-5xl font-bold text-foreground mb-2">{aggregateRating.toFixed(1)}</div>
                        <div className="flex justify-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                    key={star}
                                    className={`w-6 h-6 ${star <= Math.round(aggregateRating)
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-muted">{totalReviews} تقييم</p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(stars => {
                            const count = ratingDistribution[stars] || 0;
                            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                            return (
                                <div key={stars} className="flex items-center gap-2">
                                    <span className="w-8 text-sm text-muted">{stars}</span>
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-500 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="w-10 text-sm text-muted text-left">{Math.round(percentage)}%</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detailed Averages */}
                    <div className="space-y-3">
                        {detailedCategories.map(cat => {
                            const value = detailedAverages[cat.key as keyof typeof detailedAverages] || 0;
                            return (
                                <div key={cat.key} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{cat.label}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-500 rounded-full"
                                                style={{ width: `${(value / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium w-8">{value.toFixed(1)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Sort & Filter */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">التقييمات ({reviews.length})</h3>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800"
                >
                    <option value="recent">الأحدث</option>
                    <option value="highest">الأعلى تقييماً</option>
                    <option value="lowest">الأقل تقييماً</option>
                    <option value="helpful">الأكثر فائدة</option>
                </select>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {sortedReviews.map(review => (
                    <div key={review.id} className="card">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold">
                                    {review.reviewer.is_anonymous ? '؟' : review.reviewer.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">
                                        {review.reviewer.is_anonymous ? 'مجهول' : review.reviewer.name}
                                    </h4>
                                    <p className="text-sm text-muted">{review.project_title}</p>
                                </div>
                            </div>
                            <div className="text-left">
                                <div className="flex gap-0.5 mb-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                            key={star}
                                            className={`w-5 h-5 ${star <= review.overall_rating
                                                ? 'text-yellow-500 fill-yellow-500'
                                                : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-muted">{review.created_at}</p>
                            </div>
                        </div>

                        {/* Review Text */}
                        {review.review_text && (
                            <p className="text-gray-700 dark:text-gray-300 mb-4">{review.review_text}</p>
                        )}

                        {/* Detailed Ratings (expandable) */}
                        <button
                            onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-4"
                        >
                            {expandedReview === review.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            عرض التفاصيل
                        </button>

                        {expandedReview === review.id && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl mb-4">
                                {detailedCategories.map(cat => {
                                    const value = review.detailed_ratings[cat.key as keyof typeof review.detailed_ratings] || 0;
                                    return (
                                        <div key={cat.key} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">{cat.label}</span>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        className={`w-4 h-4 ${star <= value
                                                            ? 'text-yellow-500 fill-yellow-500'
                                                            : 'text-gray-300'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Response */}
                        {review.response && (
                            <div className="bg-primary-50 border-r-4 border-primary-500 p-4 rounded-lg mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-primary-600" />
                                    <span className="text-sm font-medium text-primary-700">رد المالك</span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{review.response.text}</p>
                                <p className="text-xs text-muted mt-2">{review.response.created_at}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button className="flex items-center gap-2 text-sm text-muted hover:text-primary-600 transition-colors">
                                <ThumbsUp className="w-4 h-4" />
                                مفيد ({review.helpful_count})
                            </button>
                            <button className="flex items-center gap-2 text-sm text-muted hover:text-red-600 transition-colors">
                                <Flag className="w-4 h-4" />
                                إبلاغ
                            </button>
                        </div>
                    </div>
                ))}

                {reviews.length === 0 && (
                    <div className="card text-center py-12">
                        <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-muted">لا توجد تقييمات بعد</p>
                    </div>
                )}
            </div>
        </div>
    );
}
