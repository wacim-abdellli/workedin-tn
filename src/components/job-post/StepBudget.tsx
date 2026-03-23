import { useFormContext } from 'react-hook-form';
import { DollarSign, Clock, Calendar, TrendingUp } from 'lucide-react';
import Input from '../ui/Input';

export default function StepBudget() {
    const { register, watch, formState: { errors } } = useFormContext();
    const jobType = watch('job_type');

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <DollarSign className="w-6 h-6 text-primary-600" />
                    الميزانية والمدة
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    حدد طريقة الدفع المناسبة وميزانية المشروع
                </p>
            </div>

            {/* Job Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`
                    cursor-pointer p-6 rounded-2xl border-2 transition-all
                    ${jobType === 'fixed_price'
                        ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600 dark:bg-primary-500/10'
                        : 'border-gray-100 bg-white hover:border-gray-200 dark:border-white/10 dark:bg-[#14111d]'
                    }
                `}>
                    <input
                        type="radio"
                        value="fixed_price"
                        {...register('job_type')}
                        className="sr-only"
                    />
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`p-2 rounded-lg ${jobType === 'fixed_price' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg">سعر ثابت</span>
                    </div>
                    <p className="text-sm text-gray-500 pr-14">
                        ادفع مبلغاً ثابتاً للمشروع بالكامل عند اكتماله.
                    </p>
                </label>

                <label className={`
                    cursor-pointer p-6 rounded-2xl border-2 transition-all
                    ${jobType === 'hourly'
                        ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600 dark:bg-primary-500/10'
                        : 'border-gray-100 bg-white hover:border-gray-200 dark:border-white/10 dark:bg-[#14111d]'
                    }
                `}>
                    <input
                        type="radio"
                        value="hourly"
                        {...register('job_type')}
                        className="sr-only"
                    />
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`p-2 rounded-lg ${jobType === 'hourly' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                            <Clock className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg">بالساعة</span>
                    </div>
                    <p className="text-sm text-gray-500 pr-14">
                        ادفع للمستقل بناءً على عدد ساعات العمل.
                    </p>
                </label>
            </div>

            {/* Budget Inputs */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/[0.03]">
                {jobType === 'fixed_price' ? (
                    <div className="space-y-4">
                        <label className="font-medium text-gray-900 block">ميزانية المشروع التقديرية (د.ت)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                placeholder="من"
                                type="number"
                                {...register('budget_min', { valueAsNumber: true })}
                                error={errors.budget_min?.message as string}
                            />
                            <Input
                                placeholder="إلى"
                                type="number"
                                {...register('budget_max', { valueAsNumber: true })}
                                error={errors.budget_max?.message as string}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="font-medium text-gray-900 block">السعر بالساعة (د.ت)</label>
                            <Input
                                placeholder="مثال: 20"
                                type="number"
                                {...register('hourly_rate', { valueAsNumber: true })}
                                error={errors.hourly_rate?.message as string}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="font-medium text-gray-900 block">الساعات المتوقعة أسبوعياً</label>
                            <Input
                                placeholder="مثال: 10-20"
                                {...register('estimated_hours')}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        مدة المشروع
                    </label>
                    <select
                        {...register('duration')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                    >
                        <option value="">اختر المدة</option>
                        <option value="less_than_1_month">أقل من شهر</option>
                        <option value="1_3_months">من 1 إلى 3 أشهر</option>
                        <option value="3_6_months">من 3 إلى 6 أشهر</option>
                        <option value="more_than_6_months">أكثر من 6 أشهر</option>
                    </select>
                    {errors.duration && (
                        <p className="text-red-500 text-xs">{errors.duration.message as string}</p>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="font-medium text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-500" />
                        مستوى الخبرة المطلوب
                    </label>
                    <div className="flex flex-col gap-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="beginner" {...register('experience_level')} className="text-primary-600 focus:ring-primary-500" />
                            <span className="text-gray-700">مبتدئ (Beginner)</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="intermediate" {...register('experience_level')} className="text-primary-600 focus:ring-primary-500" />
                            <span className="text-gray-700">متوسط (Intermediate)</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="expert" {...register('experience_level')} className="text-primary-600 focus:ring-primary-500" />
                            <span className="text-gray-700">خبير (Expert)</span>
                        </label>
                    </div>
                    {errors.experience_level && (
                        <p className="text-red-500 text-xs">{errors.experience_level.message as string}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
