import { useState } from 'react';
import { Star, X, ThumbsUp, ThumbsDown, MessageSquare, Shield, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (review: ReviewData) => void;
    revieweeType: 'freelancer' | 'client';
    revieweeName: string;
    projectTitle: string;
}

interface ReviewData {
    overallRating: number;
    detailedRatings: {
        communication: number;
        quality?: number;
        deadlines?: number;
        professionalism: number;
        paymentOnTime?: number;
        clearRequirements?: number;
    };
    wouldWorkAgain: boolean;
    reviewText: string;
    visibility: 'public' | 'private' | 'anonymous';
}

const RATING_LABELS = ['ضعيف', 'أقل من المتوسط', 'متوسط', 'جيد', 'ممتاز'];

export default function ReviewModal({
    isOpen,
    onClose,
    onSubmit,
    revieweeType,
    revieweeName,
    projectTitle,
}: ReviewModalProps) {
    const [overallRating, setOverallRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [detailedRatings, setDetailedRatings] = useState({
        communication: 0,
        quality: 0,
        deadlines: 0,
        professionalism: 0,
        paymentOnTime: 0,
        clearRequirements: 0,
    });
    const [wouldWorkAgain, setWouldWorkAgain] = useState<boolean | null>(null);
    const [reviewText, setReviewText] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'private' | 'anonymous'>('public');

    if (!isOpen) return null;

    const handleDetailedRating = (category: string, value: number) => {
        setDetailedRatings(prev => ({ ...prev, [category]: value }));
    };

    const handleSubmit = () => {
        if (overallRating === 0) return;

        onSubmit({
            overallRating,
            detailedRatings: revieweeType === 'freelancer'
                ? {
                    communication: detailedRatings.communication,
                    quality: detailedRatings.quality,
                    deadlines: detailedRatings.deadlines,
                    professionalism: detailedRatings.professionalism,
                }
                : {
                    communication: detailedRatings.communication,
                    paymentOnTime: detailedRatings.paymentOnTime,
                    clearRequirements: detailedRatings.clearRequirements,
                    professionalism: detailedRatings.professionalism,
                },
            wouldWorkAgain: wouldWorkAgain ?? false,
            reviewText,
            visibility,
        });
        onClose();
    };

    const StarRating = ({ value, onChange, size = 'md' }: { value: number; onChange: (v: number) => void; size?: 'sm' | 'md' | 'lg' }) => {
        const [hover, setHover] = useState(0);
        const sizeClass = size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-6 h-6' : 'w-5 h-5';

        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => onChange(star)}
                        className="transition-transform hover:scale-110"
                    >
                        <Star
                            className={`${sizeClass} ${star <= (hover || value)
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300'
                                } transition-colors`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    const freelancerCategories = [
        { key: 'communication', label: 'التواصل' },
        { key: 'quality', label: 'جودة العمل' },
        { key: 'deadlines', label: 'الالتزام بالمواعيد' },
        { key: 'professionalism', label: 'الاحترافية' },
    ];

    const clientCategories = [
        { key: 'communication', label: 'التواصل' },
        { key: 'paymentOnTime', label: 'الدفع في الوقت' },
        { key: 'clearRequirements', label: 'وضوح المتطلبات' },
        { key: 'professionalism', label: 'الاحترافية' },
    ];

    const categories = revieweeType === 'freelancer' ? freelancerCategories : clientCategories;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 p-6 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">تقييم {revieweeName}</h2>
                        <p className="text-sm text-muted">مشروع: {projectTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Overall Rating */}
                    <div className="text-center">
                        <h3 className="font-semibold text-foreground mb-4">التقييم العام</h3>
                        <div className="flex justify-center gap-2 mb-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setOverallRating(star)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-12 h-12 ${star <= (hoverRating || overallRating)
                                                ? 'text-yellow-500 fill-yellow-500'
                                                : 'text-gray-300'
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                        {(hoverRating || overallRating) > 0 && (
                            <p className="text-primary-600 font-medium">
                                {RATING_LABELS[(hoverRating || overallRating) - 1]}
                            </p>
                        )}
                    </div>

                    {/* Detailed Ratings */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">تقييمات تفصيلية</h3>
                        <div className="space-y-4">
                            {categories.map(cat => (
                                <div key={cat.key} className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">{cat.label}</span>
                                    <StarRating
                                        value={detailedRatings[cat.key as keyof typeof detailedRatings]}
                                        onChange={(v) => handleDetailedRating(cat.key, v)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Would Work Again */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">
                            {revieweeType === 'freelancer' ? 'هل ستوظفه مجدداً؟' : 'هل ستعمل معه مجدداً؟'}
                        </h3>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setWouldWorkAgain(true)}
                                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${wouldWorkAgain === true
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                                    }`}
                            >
                                <ThumbsUp className="w-6 h-6" />
                                <span className="font-medium">نعم</span>
                            </button>
                            <button
                                onClick={() => setWouldWorkAgain(false)}
                                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${wouldWorkAgain === false
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
                                    }`}
                            >
                                <ThumbsDown className="w-6 h-6" />
                                <span className="font-medium">لا</span>
                            </button>
                        </div>
                    </div>

                    {/* Written Review */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-2">مراجعة مكتوبة (اختياري)</h3>
                        <p className="text-sm text-muted mb-3">شارك تجربتك مع الآخرين</p>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="ما الذي أعجبك؟ ما الذي يمكن تحسينه؟ هل توصي به للآخرين؟"
                            className="w-full h-32 p-4 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                            maxLength={1000}
                        />
                        <p className="text-sm text-muted text-left mt-1">{reviewText.length}/1000</p>
                    </div>

                    {/* Visibility */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">إعدادات الخصوصية</h3>
                        <div className="space-y-3">
                            {[
                                { value: 'public', label: 'عام', desc: 'مرئي على البروفايل', icon: Eye },
                                { value: 'private', label: 'خاص', desc: 'مرئي لك فقط', icon: EyeOff },
                                { value: 'anonymous', label: 'مجهول', desc: 'إخفاء اسمك', icon: Shield },
                            ].map(opt => (
                                <label
                                    key={opt.value}
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${visibility === opt.value
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value={opt.value}
                                        checked={visibility === opt.value}
                                        onChange={() => setVisibility(opt.value as typeof visibility)}
                                        className="sr-only"
                                    />
                                    <opt.icon className={`w-5 h-5 ${visibility === opt.value ? 'text-primary-600' : 'text-gray-400'}`} />
                                    <div>
                                        <p className="font-medium text-foreground">{opt.label}</p>
                                        <p className="text-sm text-muted">{opt.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Privacy Notice */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <MessageSquare className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="text-yellow-800 font-medium">ملاحظة</p>
                                <p className="text-yellow-700">التقييمات دائمة ولا يمكن تعديلها. يمكن للطرف الآخر الرد على تقييمك.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 p-6 flex gap-3">
                    <Button variant="ghost" onClick={onClose} className="flex-1">
                        تخطي الآن
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={overallRating === 0}
                        className="flex-1"
                    >
                        إرسال التقييم
                    </Button>
                </div>
            </div>
        </div>
    );
}
