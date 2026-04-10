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
    const { t, tx } = useTranslation();
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
                            {review.reviewer.type === 'client' ? t.reviews.client : t.reviews.freelancer}
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

            {/* Job Title */}
            <p className="text-sm text-muted mb-2">
                <span className="font-medium">{t.reviews.jobLabel}:</span> {review.job_title}
            </p>

            {/* Comment */}
            <p className="text-foreground leading-relaxed mb-4">{review.comment}</p>

            {/* Response if exists */}
            {review.response && (
                <div className="bg-surface rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-muted mb-1">{tx('dynamic_key_890920977')}</p>
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
                        <span>{tx('dynamic_key_233190025')}{review.helpful_count})</span>
                    </button>

                    {canRespond && !review.response && (
                        <button
                            onClick={() => setShowResponseModal(true)}
                            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 transition-colors"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span>{tx('dynamic_key_50718')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Response Modal */}
            <Modal
                isOpen={showResponseModal}
                onClose={() => setShowResponseModal(false)}
                title={tx('dynamic_key_2001555607')}
            >
                <div className="space-y-4">
                    <p className="text-muted text-sm">
                        {tx('dynamic_key_18255446')}{review.reviewer.name}
                    </p>
                    <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder={tx('dynamic_key_979253881')}
                        rows={4}
                        className="input-base w-full resize-none"
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setShowResponseModal(false)}>
                            {tx('dynamic_key_1502065525')}</Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmitResponse}
                            isLoading={isSubmitting}
                            disabled={!responseText.trim()}
                        >
                            {tx('dynamic_key_639337527')}</Button>
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
    const { tx } = useTranslation();
    const [hovered, setHovered] = useState(0);

    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-7 h-7',
        lg: 'w-9 h-9',
    };

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110"
                >
                    <Star
                        className={`
                            ${sizeClasses[size]}
                            ${(hovered || value) >= star
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-muted'
                            }
                        `}
                    />
                </button>
            ))}
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
            <div>
                <p className="text-muted mb-2">{tx('dynamic_key_1016245850')}{recipientName}</p>
                <p className="text-sm text-muted mb-1">{tx('dynamic_key_2132806281')}{jobTitle}</p>
            </div>

            {/* Star Rating */}
            <div>
                <label className="block text-sm font-medium mb-3">{tx('dynamic_key_2137084368')}</label>
                <StarRatingInput value={rating} onChange={setRating} size="lg" />
                {rating > 0 && (
                    <p className="text-sm text-muted mt-2">
                        {rating === 5 && 'ممتاز! 🌟'}
                        {rating === 4 && 'جيد جداً 👍'}
                        {rating === 3 && 'جيد'}
                        {rating === 2 && 'مقبول'}
                        {rating === 1 && 'سيء'}
                    </p>
                )}
            </div>

            {/* Comment */}
            <div>
                <label className="block text-sm font-medium mb-2">{tx('dynamic_key_669258706')}</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={tx('dynamic_key_72742741')}
                    rows={4}
                    className="input-base w-full resize-none"
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
                <Button variant="outline" type="button" onClick={onCancel}>
                    {tx('dynamic_key_1502065525')}</Button>
                <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={rating === 0}
                >
                    {tx('dynamic_key_1679990796')}</Button>
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
                    <p className="text-sm text-muted">{totalReviews} {tx('dynamic_key_1506640045')}</p>
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
