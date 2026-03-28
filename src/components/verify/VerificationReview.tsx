import { AlertCircle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface ReviewChecklist {
    key: string;
    ok: boolean;
    label: string;
}

interface VerificationReviewProps {
    previews: { front: string; back: string; selfie: string };
    cinNumber: string;
    consent: boolean;
    loading: boolean;
    checklist: ReviewChecklist[];
    onCinChange: (value: string) => void;
    onConsentChange: (value: boolean) => void;
    onSubmit: () => void;
    onBack: () => void;
    onEditFront: () => void;
    onEditBack: () => void;
    onEditSelfie: () => void;
}

export default function VerificationReview({
    previews, cinNumber, consent, loading, checklist,
    onCinChange, onConsentChange, onSubmit, onBack,
    onEditFront, onEditBack, onEditSelfie,
}: VerificationReviewProps) {
    const { tx } = useTranslation();
    const completedCount = checklist.filter(i => i.ok).length;

    return (
        <div className="rounded-3xl border border-white/10 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-sm dark:border-white/10 dark:bg-[#1d2231]/90">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                {tx('verifyIdentity.review.title', undefined, 'مراجعة البيانات')}
            </h2>

            {/* Readiness score */}
            <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/50 px-4 py-2 text-xs dark:bg-white/5">
                <span className="font-medium text-gray-700 dark:text-gray-200">{tx('verifyIdentity.review.readiness', undefined, 'Readiness score')}</span>
                <span className="font-semibold text-primary-700 dark:text-primary-300">{completedCount}/{checklist.length}</span>
            </div>

            {/* Checklist */}
            <div className="mb-6 grid gap-3 md:grid-cols-3">
                {checklist.map((item, idx) => (
                    <div key={idx} className={`rounded-xl border px-3 py-2 text-xs font-medium ${item.ok ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300' : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300'}`}>
                        <span className="inline-flex items-center gap-1.5">
                            {item.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                {/* CIN input */}
                <div>
                    <label className="label">{tx('verifyIdentity.review.cinLabel', undefined, 'رقم بطاقة الهوية (8 أرقام)')}</label>
                    <input
                        type="text"
                        value={cinNumber}
                        onChange={e => onCinChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder={tx('verifyIdentity.review.cinPlaceholder', undefined, '12345678')}
                        className="input w-full text-center text-2xl tracking-widest"
                    />
                </div>

                {/* Image previews */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { title: tx('verifyIdentity.review.frontImage', undefined, 'وجه البطاقة'), src: previews.front },
                        { title: tx('verifyIdentity.review.backImage', undefined, 'ظهر البطاقة'), src: previews.back },
                        { title: tx('verifyIdentity.review.selfieImage', undefined, 'الصورة الشخصية'), src: previews.selfie },
                    ].map((item, idx) => (
                        <div key={idx} className="space-y-2">
                            <p className="text-xs text-center font-medium text-gray-500">{item.title}</p>
                            <img src={item.src} alt={item.title} className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                        </div>
                    ))}
                </div>

                {/* Edit buttons */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button type="button" onClick={onEditFront} className="rounded-lg border border-gray-300/80 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                        {tx('verifyIdentity.review.editFront', undefined, 'Edit front image')}
                    </button>
                    <button type="button" onClick={onEditBack} className="rounded-lg border border-gray-300/80 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                        {tx('verifyIdentity.review.editBack', undefined, 'Edit back image')}
                    </button>
                    <button type="button" onClick={onEditSelfie} className="rounded-lg border border-gray-300/80 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                        {tx('verifyIdentity.review.editSelfie', undefined, 'Edit selfie')}
                    </button>
                </div>

                {/* Privacy notice */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 border border-blue-200/60 dark:border-blue-500/30">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        {tx('verifyIdentity.review.privacyNotice', undefined, 'يتم تخزين بياناتك بشكل آمن ومشفر. لن يتم مشاركة معلومات هويتك مع أي طرف ثالث ويتم استخدامها فقط لغرض التحقق من الحساب.')}
                    </p>
                </div>

                {/* Consent checkbox */}
                <label htmlFor="identity-consent" className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                    <input
                        id="identity-consent"
                        type="checkbox"
                        checked={consent}
                        onChange={e => onConsentChange(e.target.checked)}
                        className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300 select-none">
                        {tx('verifyIdentity.review.consentPrefix', undefined, 'أوافق على استخدام معلوماتي الشخصية للتحقق من هويتي وفقاً لـ ')}
                        <span className="text-primary-600 hover:underline">{tx('verifyIdentity.review.privacyPolicy', undefined, 'سياسة الخصوصية')}</span>
                    </span>
                </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-8">
                <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                    <ChevronRight className="ms-1 w-5 h-5 rtl:rotate-180" />
                    {tx('common.back', undefined, 'Back')}
                </button>

                <button
                    onClick={onSubmit}
                    disabled={loading || !consent || cinNumber.length !== 8}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20 min-w-[160px] justify-center"
                >
                    {loading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /><span>{tx('verifyIdentity.review.submitting', undefined, 'جاري الإرسال...')}</span></>
                    ) : (
                        <><span>{tx('verifyIdentity.review.submit', undefined, 'تأكيد وإرسال')}</span><CheckCircle2 className="w-5 h-5" /></>
                    )}
                </button>
            </div>
        </div>
    );
}
