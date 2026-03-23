import { useFormContext } from 'react-hook-form';
import { Eye, Lock, Globe, Users } from 'lucide-react';

export default function StepVisibility() {
    const { register, watch } = useFormContext();
    const visibility = watch('visibility');

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <Eye className="w-6 h-6 text-primary-600" />
                    من يمكنه رؤية وظيفتك؟
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    حدد مستوى الخصوصية المناسب لمشروعك.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`cursor-pointer rounded-2xl border-2 p-6 transition-all ${visibility === 'public' ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600 dark:bg-primary-500/10' : 'border-gray-100 bg-white hover:border-gray-200 dark:border-white/10 dark:bg-[#14111d]'}`}>
                    <input type="radio" value="public" {...register('visibility')} className="sr-only" />
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`p-2 rounded-lg ${visibility === 'public' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                            <Globe className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg">عام للجميع</span>
                    </div>
                    <p className="text-sm text-gray-500 pr-14 leading-relaxed">
                        يمكن لجميع المستقلين رؤية الوظيفة وتقديم عروضهم. الخيار الأفضل للحصول على أكبر عدد من العروض.
                    </p>
                </label>

                <label className={`cursor-pointer rounded-2xl border-2 p-6 transition-all ${visibility === 'invite_only' ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600 dark:bg-primary-500/10' : 'border-gray-100 bg-white hover:border-gray-200 dark:border-white/10 dark:bg-[#14111d]'}`}>
                    <input type="radio" value="invite_only" {...register('visibility')} className="sr-only" />
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`p-2 rounded-lg ${visibility === 'invite_only' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                            <Lock className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg">دعوة فقط</span>
                    </div>
                    <p className="text-sm text-gray-500 pr-14 leading-relaxed">
                        لن تظهر الوظيفة في البحث. فقط المستقلون الذين تقوم بدعوتهم يمكنهم تقديم العروض.
                    </p>
                </label>
            </div>

            <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">نصيحة:</p>
                    <p>
                        إذا كنت تبحث عن مهارات نادرة أو لديك مشروع حساس، فإن خيار "دعوة فقط" يمنحك تحكماً أكبر. أما للمشاريع العامة، فإن "عام للجميع" يضمن لك تنافسية أفضل في الأسعار.
                    </p>
                </div>
            </div>
        </div>
    );
}
