import { useState } from 'react';
import { Star, X, PartyPopper } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface ContractCompletionBannerProps {
    otherUserName: string;
    hasReview: boolean;
    onLeaveReview: () => void;
}

export function ContractCompletionBanner({
    otherUserName,
    hasReview,
    onLeaveReview,
}: ContractCompletionBannerProps) {
    const [dismissed, setDismissed] = useState(false);
    const { tx } = useTranslation();
    if (dismissed) return null;

    return (
        <div className="mx-4 md:mx-6 mt-3 overflow-hidden rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent">
            <div className="flex items-center gap-3 p-3 pr-2">
                {/* Icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/25">
                    <PartyPopper className="w-4 h-4 text-teal-400" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-teal-100">{tx('contract.completionBanner.title', undefined, 'Contract completed!')} 🎉</p>
                    {hasReview ? (
                        <p className="text-[11px] text-white/50 mt-0.5">
                            {tx('contract.completionBanner.readOnly', undefined, 'This thread is now read-only.')}
                        </p>
                    ) : (
                        <p className="text-[11px] text-white/60 mt-0.5">
                            {tx('contract.completionBanner.leaveReview', { name: otherUserName }, `Help ${otherUserName} grow their reputation — leave a review.`)}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {!hasReview && (
                        <button
                            type="button"
                            onClick={onLeaveReview}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500/80 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-teal-400 active:scale-95"
                        >
                            <Star className="w-3 h-3" />
                            {tx('contract.completionBanner.reviewAction', undefined, 'Review')}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setDismissed(true)}
                        className="rounded-lg p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                        aria-label={tx('contract.completionBanner.dismiss', undefined, 'Dismiss')}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
