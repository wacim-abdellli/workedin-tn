import { useFormContext } from 'react-hook-form';
import { Eye, Lock, Globe, Users } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function StepVisibility() {
    const { register, watch } = useFormContext();
    const { tx } = useTranslation();
    const visibility = watch('visibility');

    return (
        <div className="space-y-6">
            <header className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                    <Eye className="h-3.5 w-3.5" />
                    {tx('jobs.new.stepVisibility.badge', undefined, 'Audience control')}
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {tx('jobs.new.stepVisibility.title', undefined, 'من يمكنه رؤية وظيفتك؟')}
                </h3>
                <p className="text-sm leading-6 text-[#b3b3b3]">
                    {tx('jobs.new.stepVisibility.subtitle', undefined, 'حدد مستوى الخصوصية المناسب لمشروعك.')}
                </p>
            </header>

            <section className="grid gap-3 sm:grid-cols-2">
                <label
                    className={`cursor-pointer rounded-xl border p-4 transition ${visibility === 'public'
                        ? 'border-orange-500/45 bg-orange-500/10'
                        : 'border-[#2d2d2d] bg-[#101010] hover:border-orange-500/35 hover:bg-orange-500/5'
                        }`}
                >
                    <input type="radio" value="public" {...register('visibility')} className="sr-only" />
                    <div className="flex items-start gap-3">
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${visibility === 'public' ? 'bg-orange-500 text-white' : 'bg-[#222] text-[#8f8f8f]'}`}>
                            <Globe className="h-4.5 w-4.5" />
                        </span>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-white">{tx('jobs.new.stepVisibility.publicTitle', undefined, 'عام للجميع')}</p>
                            <p className="text-xs leading-5 text-[#9a9a9a]">
                                {tx('jobs.new.stepVisibility.publicDescription', undefined, 'يمكن لجميع المستقلين رؤية الوظيفة وتقديم عروضهم. الخيار الأفضل للحصول على أكبر عدد من العروض.')}
                            </p>
                        </div>
                    </div>
                </label>

                <label
                    className={`cursor-pointer rounded-xl border p-4 transition ${visibility === 'invite_only'
                        ? 'border-orange-500/45 bg-orange-500/10'
                        : 'border-[#2d2d2d] bg-[#101010] hover:border-orange-500/35 hover:bg-orange-500/5'
                        }`}
                >
                    <input type="radio" value="invite_only" {...register('visibility')} className="sr-only" />
                    <div className="flex items-start gap-3">
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${visibility === 'invite_only' ? 'bg-orange-500 text-white' : 'bg-[#222] text-[#8f8f8f]'}`}>
                            <Lock className="h-4.5 w-4.5" />
                        </span>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-white">{tx('jobs.new.stepVisibility.inviteOnlyTitle', undefined, 'دعوة فقط')}</p>
                            <p className="text-xs leading-5 text-[#9a9a9a]">
                                {tx('jobs.new.stepVisibility.inviteOnlyDescription', undefined, 'لن تظهر الوظيفة في البحث. فقط المستقلون الذين تقوم بدعوتهم يمكنهم تقديم العروض.')}
                            </p>
                        </div>
                    </div>
                </label>
            </section>

            <section className="flex gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-sm text-[#cfcfcf]">
                <Users className="mt-0.5 h-4.5 w-4.5 shrink-0 text-orange-300" />
                <div className="text-[#b3b3b3]">
                    <p className="mb-1 font-semibold text-orange-200">{tx('jobs.new.stepVisibility.tipTitle', undefined, 'نصيحة:')}</p>
                    <p>
                        {tx('jobs.new.stepVisibility.tipDescription', undefined, 'إذا كنت تبحث عن مهارات نادرة أو لديك مشروع حساس، فإن خيار "دعوة فقط" يمنحك تحكماً أكبر. أما للمشاريع العامة، فإن "عام للجميع" يضمن لك تنافسية أفضل في الأسعار.')}
                    </p>
                </div>
            </section>
        </div>
    );
}
