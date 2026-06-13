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
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/45 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <h2 className="text-2xl font-extrabold text-white mb-6 text-center tracking-tight">
                {tx('verifyIdentity.review.title', undefined, 'مراجعة البيانات')}
            </h2>

            {/* Readiness score */}
            <div className="mb-4 flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3 text-xs">
                <span className="font-semibold text-zinc-400">{tx('verifyIdentity.review.readiness', undefined, 'Readiness score')}</span>
                <span className="font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md">{completedCount}/{checklist.length}</span>
            </div>

            {/* Checklist */}
            <div className="mb-6 grid gap-3 md:grid-cols-3">
                {checklist.map((item, idx) => (
                    <div
                        key={idx}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-300 ${
                            item.ok
                                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                                : 'border-zinc-800 bg-zinc-900/20 text-zinc-500'
                        }`}
                    >
                        <span className="inline-flex items-center gap-1.5">
                            {item.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400 stroke-[2.5]" /> : <AlertCircle className="h-4 w-4 text-zinc-600" />}
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                {/* CIN input */}
                <div>
                    <label className="block text-sm font-bold text-zinc-300 mb-2">{tx('verifyIdentity.review.cinLabel', undefined, 'رقم بطاقة الهوية (8 أرقام)')}</label>
                    <input
                        type="text"
                        value={cinNumber}
                        onChange={e => onCinChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder={tx('verifyIdentity.review.cinPlaceholder', undefined, '12345678')}
                        className="w-full text-center text-3xl font-bold font-mono tracking-[0.25em] bg-zinc-900/60 border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 outline-none py-3.5 rounded-2xl transition-all duration-300 text-white placeholder-zinc-750"
                    />
                </div>

                {/* Image previews */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { title: tx('verifyIdentity.review.frontImage', undefined, 'وجه البطاقة'), src: previews.front },
                        { title: tx('verifyIdentity.review.backImage', undefined, 'ظهر البطاقة'), src: previews.back },
                        { title: tx('verifyIdentity.review.selfieImage', undefined, 'الصورة الشخصية'), src: previews.selfie },
                    ].map((item, idx) => (
                        <div key={idx} className="space-y-2 group">
                            <p className="text-xs text-center font-semibold text-zinc-400 group-hover:text-zinc-300 transition-colors">{item.title}</p>
                            <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-inner">
                                <img src={item.src} alt={item.title} className="w-full h-24 object-cover transition-transform duration-500 group-hover:scale-105" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Edit buttons */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button type="button" onClick={onEditFront} className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900/60 hover:border-zinc-700 transition-all duration-300">
                        {tx('verifyIdentity.review.editFront', undefined, 'Edit front image')}
                    </button>
                    <button type="button" onClick={onEditBack} className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900/60 hover:border-zinc-700 transition-all duration-300">
                        {tx('verifyIdentity.review.editBack', undefined, 'Edit back image')}
                    </button>
                    <button type="button" onClick={onEditSelfie} className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-3 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900/60 hover:border-zinc-700 transition-all duration-300">
                        {tx('verifyIdentity.review.editSelfie', undefined, 'Edit selfie')}
                    </button>
                </div>

                {/* Privacy notice */}
                <div className="border border-purple-500/20 bg-purple-500/5 p-4 rounded-xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-300 leading-relaxed">
                        {tx('verifyIdentity.review.privacyNotice', undefined, 'يتم تخزين بياناتك بشكل آمن ومشفر. لن يتم مشاركة معلومات هويتك مع أي طرف ثالث ويتم استخدامها فقط لغرض التحقق من الحساب.')}
                    </p>
                </div>

                {/* Consent checkbox */}
                <label htmlFor="identity-consent" className="flex items-start gap-3 p-4 border border-zinc-800 rounded-xl bg-zinc-900/10 hover:border-zinc-700 transition-all duration-300 cursor-pointer select-none">
                    <input
                        id="identity-consent"
                        type="checkbox"
                        checked={consent}
                        onChange={e => onConsentChange(e.target.checked)}
                        className="w-5 h-5 mt-0.5 rounded border-zinc-800 bg-zinc-900 text-purple-600 focus:ring-purple-500/40 focus:ring-offset-0 focus:ring-1"
                    />
                    <span className="text-xs text-zinc-400 leading-relaxed">
                        {tx('verifyIdentity.review.consentPrefix', undefined, 'أوافق على استخدام معلوماتي الشخصية للتحقق من هويتي وفقاً لـ ')}
                        <span className="text-purple-400 hover:underline font-semibold">{tx('verifyIdentity.review.privacyPolicy', undefined, 'سياسة الخصوصية')}</span>
                    </span>
                </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-8 border-t border-zinc-800/80 pt-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-1.5 font-bold text-zinc-400 hover:text-white transition-colors py-2"
                >
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                    {tx('common.back', undefined, 'Back')}
                </button>

                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={loading || !consent || cinNumber.length !== 8}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:scale-100 disabled:shadow-none shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:cursor-not-allowed min-w-[170px] justify-center"
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
