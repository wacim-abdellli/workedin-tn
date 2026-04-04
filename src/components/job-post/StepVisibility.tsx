import { useFormContext } from 'react-hook-form';
import { Eye, Lock, Globe, Users } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function StepVisibility() {
    const { register, watch } = useFormContext();
    const { tx } = useTranslation();
    const visibility = watch('visibility');

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:border-white/10 dark:border-gray-800 dark:white/[0.04] dark:text-primary-200">
                    <Eye className="w-3.5 h-3.5" />
                    {tx('jobs.new.stepVisibility.badge', undefined, 'Audience control')}
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#171420] dark:text-white">
                    {tx('jobs.new.stepVisibility.title', undefined, 'من يمكنه رؤية وظيفتك؟')}
                </h3>
                <p className="max-w-3xl text-sm leading-7 text-[#5c5971] dark:text-[#aca9bd] sm:text-base">
                    {tx('jobs.new.stepVisibility.subtitle', undefined, 'حدد مستوى الخصوصية المناسب لمشروعك.')}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={`cursor-pointer rounded-[1.8rem] border-2 p-6 transition-all ${visibility === 'public' ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600 shadow-[0_20px_40px_-30px_rgba(109,40,217,0.35)] dark:bg-primary-500/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-200 hover:bg-primary-50/40 dark:border-white/10 dark:border-gray-800 dark:bg-[#1a1825] dark:hover:border-primary-500/20 dark:hover:bg-white dark:bg-gray-800/[0.06]'}`}>
                    <input type="radio" value="public" {...register('visibility')} className="sr-only" />
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`rounded-lg p-2 ${visibility === 'public' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-100 text-gray-500 dark:text-gray-400 dark:bg-white/10 dark:text-gray-400'}`}>
                            <Globe className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white">{tx('jobs.new.stepVisibility.publicTitle', undefined, 'عام للجميع')}</span>
                    </div>
                    <p className="pe-14 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                        {tx('jobs.new.stepVisibility.publicDescription', undefined, 'يمكن لجميع المستقلين رؤية الوظيفة وتقديم عروضهم. الخيار الأفضل للحصول على أكبر عدد من العروض.')}
                    </p>
                </label>

                <label className={`cursor-pointer rounded-[1.8rem] border-2 p-6 transition-all ${visibility === 'invite_only' ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600 shadow-[0_20px_40px_-30px_rgba(109,40,217,0.35)] dark:bg-primary-500/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-200 hover:bg-primary-50/40 dark:border-white/10 dark:border-gray-800 dark:bg-[#1a1825] dark:hover:border-primary-500/20 dark:hover:bg-white dark:bg-gray-800/[0.06]'}`}>
                    <input type="radio" value="invite_only" {...register('visibility')} className="sr-only" />
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`rounded-lg p-2 ${visibility === 'invite_only' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-100 text-gray-500 dark:text-gray-400 dark:bg-white/10 dark:text-gray-400'}`}>
                            <Lock className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white">{tx('jobs.new.stepVisibility.inviteOnlyTitle', undefined, 'دعوة فقط')}</span>
                    </div>
                    <p className="pe-14 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                        {tx('jobs.new.stepVisibility.inviteOnlyDescription', undefined, 'لن تظهر الوظيفة في البحث. فقط المستقلون الذين تقوم بدعوتهم يمكنهم تقديم العروض.')}
                    </p>
                </label>
            </div>

            <div className="flex gap-3 rounded-[1.6rem] border border-primary-100/80 bg-primary-50/70 p-5 shadow-sm dark:border-white/10 dark:border-gray-800 dark:white/[0.04]">
                <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-300" />
                <div className="text-sm text-primary-800 dark:text-primary-100">
                    <p className="font-bold mb-1">{tx('jobs.new.stepVisibility.tipTitle', undefined, 'نصيحة:')}</p>
                    <p>
                        {tx('jobs.new.stepVisibility.tipDescription', undefined, 'إذا كنت تبحث عن مهارات نادرة أو لديك مشروع حساس، فإن خيار "دعوة فقط" يمنحك تحكماً أكبر. أما للمشاريع العامة، فإن "عام للجميع" يضمن لك تنافسية أفضل في الأسعار.')}
                    </p>
                </div>
            </div>
        </div>
    );
}
