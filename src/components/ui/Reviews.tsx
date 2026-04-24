import { useState } from 'react';
import { Star, User, ThumbsUp, MessageSquare } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import { useTranslation } from '../../i18n';

interface Review {
    id: string;
    reviewer: {
        id: string;
        name: string;
        avatar_url?: string;
        type: 'client' | 'freelancer';
    };
    rating: number;
    comment: string;
    job_title: string;
    created_at: string;
    helpful_count: number;
    response?: string;
}

interface ReviewCardProps {
    review: Review;
    onMarkHelpful: (id: string) => void;
    onRespond?: (id: string, response: string) => void;
    canRespond?: boolean;
}

export function ReviewCard({ review, onMarkHelpful, onRespond, canRespond }: ReviewCardProps) {
    const { tx } = useTranslation();
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [responseText, setResponseText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-TN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleSubmitResponse = async () => {
        if (!responseText.trim()) return;
        setIsSubmitting(true);
        try {
            await onRespond?.(review.id, responseText);
            setShowResponseModal(false);
            setResponseText('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                        {review.reviewer.avatar_url ? (
                            <img
                                src={review.reviewer.avatar_url}
                                alt={review.reviewer.name}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <User className="w-6 h-6" />
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{review.reviewer.name}</p>
                        <p className="text-sm text-muted">
                            {review.reviewer.type === 'client' ? tx('reviews.client', undefined, 'Client') : tx('reviews.freelancer', undefined, 'Freelancer')}
                        </p>
                    </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`w-5 h-5 ${i < review.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-muted'
                                }`}
                        />
                    ))}
                </div>
            </div>

            <p className="text-sm text-muted mb-2">
                <span className="font-medium">{tx('reviews.jobLabel', undefined, 'Job:')}</span> {review.job_title}
            </p>

            {/* Comment */}
            <p className="text-foreground leading-relaxed mb-4">{review.comment}</p>

            {review.response && (
                <div className="bg-surface rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-muted mb-1">{tx('reviews.response', undefined, 'Response')}</p>
                    <p className="text-sm text-foreground">{review.response}</p>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{formatDate(review.created_at)}</span>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onMarkHelpful(review.id)}
                        className="flex items-center gap-1 text-muted hover:text-primary-600 transition-colors"
                    >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{tx('reviews.helpful', undefined, 'Helpful')} ({review.helpful_count})</span>
                    </button>

                    {canRespond && !review.response && (
                        <button
                            onClick={() => setShowResponseModal(true)}
                            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 transition-colors"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span>{tx('reviews.respond', undefined, 'Respond')}</span>
                        </button>
                    )}
                </div>
            </div>

            <Modal
                isOpen={showResponseModal}
                onClose={() => setShowResponseModal(false)}
                title={tx('reviews.responseTitle', undefined, 'Write a response')}
            >
                <div className="space-y-4">
                    <p className="text-muted text-sm">
                        {tx('reviews.responseTo', undefined, 'Responding to')} {review.reviewer.name}
                    </p>
                    <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder={tx('reviews.responsePlaceholder', undefined, 'Type your response...')}
                        rows={4}
                        className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-primary-500 transition-colors"
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setShowResponseModal(false)}>
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmitResponse}
                            isLoading={isSubmitting}
                            disabled={!responseText.trim()}
                        >
                            {tx('reviews.submitResponse', undefined, 'Submit Response')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Star Rating Input Component
interface StarRatingInputProps {
    value: number;
    onChange: (rating: number) => void;
    size?: 'sm' | 'md' | 'lg';
}

export function StarRatingInput({ value, onChange, size = 'md' }: StarRatingInputProps) {
    const [hovered, setHovered] = useState(0);

    const sizeMap = {
        sm: 'w-5 h-5',
        md: 'w-7 h-7',
        lg: 'w-10 h-10',
    };

    const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    return (
        <div className="flex gap-1" role="group" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hovered || value) >= star;
                return (
                    <button
                        key={star}
                        type="button"
                        aria-label={labels[star - 1]}
                        aria-pressed={value >= star}
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="cursor-pointer transition-transform hover:scale-115 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
                    >
                        <Star
                            className={`${sizeMap[size]} transition-colors duration-100 ${
                                isActive
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-zinc-600 fill-transparent'
                            }`}
                        />
                    </button>
                );
            })}
        </div>
    );
}

// Review Form Component
interface ReviewFormProps {
    jobTitle: string;
    recipientName: string;
    onSubmit: (rating: number, comment: string) => Promise<void>;
    onCancel: () => void;
}

export function ReviewForm({ jobTitle, recipientName, onSubmit, onCancel }: ReviewFormProps) {
    const { tx } = useTranslation();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            await onSubmit(rating, comment);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
                <p className="text-zinc-400 text-sm mb-1">{tx('reviews.leavingReviewFor', undefined, 'Leaving a review for:')} <span className="font-semibold text-zinc-200">{recipientName}</span></p>
                <p className="text-xs text-zinc-500">{tx('reviews.jobLabel', undefined, 'Job:')} {jobTitle}</p>
            </div>

            {/* Star Rating */}
            <div className="flex flex-col items-center justify-center p-4">
                <label className="block text-sm font-medium mb-3 text-zinc-300">{tx('reviews.ratingLabel', undefined, 'How was your experience?')}</label>
                <StarRatingInput value={rating} onChange={setRating} size="lg" />
                <div className="h-6 mt-2">
                    {rating > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                            {rating === 5 && tx('reviews.rating5', undefined, 'Excellent! 🌟')}
                            {rating === 4 && tx('reviews.rating4', undefined, 'Very Good 👍')}
                            {rating === 3 && tx('reviews.rating3', undefined, 'Good')}
                            {rating === 2 && tx('reviews.rating2', undefined, 'Fair')}
                            {rating === 1 && tx('reviews.rating1', undefined, 'Poor')}
                        </span>
                    )}
                </div>
            </div>

            {/* Comment */}
            <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">{tx('reviews.commentLabel', undefined, 'Add a comment (optional)')}</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={tx('reviews.commentPlaceholder', undefined, 'Share details of your experience...')}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-[#0f0f0f] px-4 py-3 text-sm text-zinc-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-zinc-600"
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
                <Button variant="ghost" type="button" onClick={onCancel} className="text-zinc-400 hover:text-white">
                    {tx('common.cancel', undefined, 'Cancel')}
                </Button>
                <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={rating === 0}
                    className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold shadow-lg shadow-amber-500/20"
                >
                    {tx('reviews.submitAction', undefined, 'Submit Review')}
                </Button>
            </div>
        </form>
    );
}

// Reviews Summary Component
interface ReviewsSummaryProps {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
}

export function ReviewsSummary({ totalReviews, averageRating, ratingDistribution }: ReviewsSummaryProps) {
    const { tx } = useTranslation();
    return (
        <div className="bg-surface rounded-xl p-6">
            <div className="flex items-center gap-8">
                {/* Overall Rating */}
                <div className="text-center">
                    <p className="text-5xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
                    <div className="flex justify-center my-2">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-5 h-5 ${i < Math.round(averageRating)
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-muted'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-muted">{totalReviews} {tx('reviews.reviewCountLabel', undefined, 'reviews')}</p>
                </div>

                {/* Distribution */}
                <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingDistribution[star] || 0;
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                        return (
                            <div key={star} className="flex items-center gap-2">
                                <span className="text-sm w-8">{star} ⭐</span>
                                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-500 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-sm text-muted w-8">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default ReviewCard;
