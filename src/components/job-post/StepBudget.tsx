import { useFormContext } from 'react-hook-form';
import { DollarSign, Clock, Calendar, TrendingUp } from 'lucide-react';
import Input from '../ui/Input';
import { useTranslation } from '../../i18n';

export default function StepBudget() {
    const { register, watch, formState: { errors } } = useFormContext();
    const { tx } = useTranslation();
    const jobType = watch('job_type');

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <DollarSign className="w-6 h-6 text-primary-600" />
                    {tx('jobs.new.stepBudget.title', undefined, 'الميزانية والمدة')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    {tx('jobs.new.stepBudget.subtitle', undefined, 'حدد طريقة الدفع المناسبة وميزانية المشروع')}
                </p>
            </div>

            {/* Job Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`
                    cursor-pointer p-6 rounded-2xl border-2 transition-all
                    ${jobType === 'fixed_price'
                        ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600 dark:bg-primary-500/10'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-[#1a1825] dark:hover:border-white/20'
                    }
                `}>
                    <input
                        type="radio"
                        value="fixed_price"
                        {...register('job_type')}
                        className="sr-only"
                    />
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`rounded-lg p-2 ${jobType === 'fixed_price' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'}`}>
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{tx('jobs.new.stepBudget.fixedPrice', undefined, 'سعر ثابت')}</span>
                    </div>
                    <p className="pe-14 text-sm text-gray-500 dark:text-gray-400">
                        {tx('jobs.new.stepBudget.fixedPriceDescription', undefined, 'ادفع مبلغاً ثابتاً للمشروع بالكامل عند اكتماله.')}
                    </p>
                </label>

                <label className={`
                    cursor-pointer p-6 rounded-2xl border-2 transition-all
                    ${jobType === 'hourly'
                        ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600 dark:bg-primary-500/10'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-[#1a1825] dark:hover:border-white/20'
                    }
                `}>
                    <input
                        type="radio"
                        value="hourly"
                        {...register('job_type')}
                        className="sr-only"
                    />
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`rounded-lg p-2 ${jobType === 'hourly' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'}`}>
                            <Clock className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{tx('jobs.new.stepBudget.hourly', undefined, 'بالساعة')}</span>
                    </div>
                    <p className="pe-14 text-sm text-gray-500 dark:text-gray-400">
                        {tx('jobs.new.stepBudget.hourlyDescription', undefined, 'ادفع للمستقل بناءً على عدد ساعات العمل.')}
                    </p>
                </label>
            </div>

            {/* Budget Inputs */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1825]">
                {jobType === 'fixed_price' ? (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{tx('jobs.new.stepBudget.estimatedBudget', undefined, 'ميزانية المشروع التقديرية (د.ت)')}</label>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                placeholder={tx('jobs.new.stepBudget.min', undefined, 'من')}
                                type="number"
                                {...register('budget_min', { valueAsNumber: true })}
                                error={errors.budget_min?.message as string}
                            />
                            <Input
                                placeholder={tx('jobs.new.stepBudget.max', undefined, 'إلى')}
                                type="number"
                                {...register('budget_max', { valueAsNumber: true })}
                                error={errors.budget_max?.message as string}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{tx('jobs.new.stepBudget.hourlyRate', undefined, 'السعر بالساعة (د.ت)')}</label>
                            <Input
                                placeholder={tx('jobs.new.stepBudget.hourlyRateExample', undefined, 'مثال: 20')}
                                type="number"
                                {...register('hourly_rate', { valueAsNumber: true })}
                                error={errors.hourly_rate?.message as string}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{tx('jobs.new.stepBudget.weeklyHours', undefined, 'الساعات المتوقعة أسبوعياً')}</label>
                            <Input
                                placeholder={tx('jobs.new.stepBudget.weeklyHoursExample', undefined, 'مثال: 10-20')}
                                {...register('estimated_hours')}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        {tx('jobs.new.stepBudget.duration', undefined, 'مدة المشروع')}
                    </label>
                    <select
                        {...register('duration')}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 transition-all duration-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1a1825] dark:text-white"
                    >
                        <option value="">{tx('jobs.new.stepBudget.selectDuration', undefined, 'اختر المدة')}</option>
                        <option value="less_than_1_month">{tx('jobs.new.stepBudget.durationLessThan1Month', undefined, 'أقل من شهر')}</option>
                        <option value="1_3_months">{tx('jobs.new.stepBudget.duration1To3Months', undefined, 'من 1 إلى 3 أشهر')}</option>
                        <option value="3_6_months">{tx('jobs.new.stepBudget.duration3To6Months', undefined, 'من 3 إلى 6 أشهر')}</option>
                        <option value="more_than_6_months">{tx('jobs.new.stepBudget.durationMoreThan6Months', undefined, 'أكثر من 6 أشهر')}</option>
                    </select>
                    {errors.duration && (
                        <p className="text-red-500 text-xs">{errors.duration.message as string}</p>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <TrendingUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        {tx('jobs.new.stepBudget.experienceLevel', undefined, 'مستوى الخبرة المطلوب')}
                    </label>
                    <div className="flex flex-col gap-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="beginner" {...register('experience_level')} className="text-primary-600 focus:ring-primary-500" />
                            <span className="text-gray-700 dark:text-gray-300">{tx('jobs.new.stepBudget.beginner', undefined, 'مبتدئ (Beginner)')}</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="intermediate" {...register('experience_level')} className="text-primary-600 focus:ring-primary-500" />
                            <span className="text-gray-700 dark:text-gray-300">{tx('jobs.new.stepBudget.intermediate', undefined, 'متوسط (Intermediate)')}</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="expert" {...register('experience_level')} className="text-primary-600 focus:ring-primary-500" />
                            <span className="text-gray-700 dark:text-gray-300">{tx('jobs.new.stepBudget.expert', undefined, 'خبير (Expert)')}</span>
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
