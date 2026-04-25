import { useFormContext } from 'react-hook-form';
import { DollarSign, Clock, Calendar, TrendingUp } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface StepBudgetValues {
    job_type?: 'fixed_price' | 'hourly';
    budget_min?: number;
    budget_max?: number;
    hourly_rate?: number;
    estimated_hours?: number;
    duration?: string;
    deadline?: string;
    experience_level?: 'beginner' | 'intermediate' | 'expert';
}

interface StepBudgetProps {
    allowPastDeadline?: boolean;
}

export default function StepBudget({ allowPastDeadline = false }: StepBudgetProps) {
    const {
        register,
        watch,
        formState: { errors },
    } = useFormContext<StepBudgetValues>();
    const { tx } = useTranslation();

    const jobType = watch('job_type') || 'fixed_price';
    const duration = watch('duration');
    const experienceLevel = watch('experience_level');
    const today = new Date().toISOString().split('T')[0];

    const fieldClass =
        'w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3.5 text-sm text-white caret-orange-300 outline-none transition-all duration-300 placeholder:text-gray-400 hover:border-white/20 hover:bg-white/[0.08] focus:bg-white/[0.1] focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20 shadow-inner backdrop-blur-sm';

    const durationOptions = [
        {
            value: 'less_than_1_month',
            label: tx('jobs.new.stepBudget.durationLessThan1Month', undefined, 'أقل من شهر'),
        },
        {
            value: '1_3_months',
            label: tx('jobs.new.stepBudget.duration1To3Months', undefined, 'من 1 إلى 3 أشهر'),
        },
        {
            value: '3_6_months',
            label: tx('jobs.new.stepBudget.duration3To6Months', undefined, 'من 3 إلى 6 أشهر'),
        },
        {
            value: 'more_than_6_months',
            label: tx('jobs.new.stepBudget.durationMoreThan6Months', undefined, 'أكثر من 6 أشهر'),
        },
    ] as const;

    const experienceOptions = [
        {
            value: 'beginner',
            label: tx('jobs.new.stepBudget.beginner', undefined, 'مبتدئ'),
        },
        {
            value: 'intermediate',
            label: tx('jobs.new.stepBudget.intermediate', undefined, 'متوسط'),
        },
        {
            value: 'expert',
            label: tx('jobs.new.stepBudget.expert', undefined, 'خبير'),
        },
    ] as const;

    return (
        <div className="space-y-6">
            <header className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                    <DollarSign className="h-3.5 w-3.5" />
                    {tx('jobs.new.stepBudget.badge', undefined, 'Pricing setup')}
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {tx('jobs.new.stepBudget.title', undefined, 'الميزانية والمدة')}
                </h3>
                <p className="text-sm leading-6 text-[#b3b3b3]">
                    {tx('jobs.new.stepBudget.subtitle', undefined, 'حدد طريقة الدفع المناسبة وميزانية المشروع')}
                </p>
            </header>

            <section className="grid gap-3 sm:grid-cols-2">
                <label
                    className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${jobType === 'fixed_price'
                        ? 'border-orange-500/45 bg-orange-500/10 shadow-[0_18px_50px_-42px_rgba(249,115,22,0.8)]'
                        : 'border-white/5 bg-white/[0.03] hover:border-orange-500/35 hover:bg-orange-500/5'
                        }`}
                >
                    <input type="radio" value="fixed_price" {...register('job_type')} className="sr-only" />
                    <div className="flex items-start gap-3">
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${jobType === 'fixed_price' ? 'bg-orange-500 text-white' : 'bg-[#222] text-[#8f8f8f]'}`}>
                            <DollarSign className="h-4.5 w-4.5" />
                        </span>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-white">{tx('jobs.new.stepBudget.fixedPrice', undefined, 'سعر ثابت')}</p>
                            <p className="text-xs leading-5 text-[#9a9a9a]">
                                {tx('jobs.new.stepBudget.fixedPriceDescription', undefined, 'ادفع مبلغاً ثابتاً للمشروع بالكامل عند اكتماله.')}
                            </p>
                        </div>
                    </div>
                </label>

                <label
                    className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${jobType === 'hourly'
                        ? 'border-orange-500/45 bg-orange-500/10 shadow-[0_18px_50px_-42px_rgba(249,115,22,0.8)]'
                        : 'border-white/5 bg-white/[0.03] hover:border-orange-500/35 hover:bg-orange-500/5'
                        }`}
                >
                    <input type="radio" value="hourly" {...register('job_type')} className="sr-only" />
                    <div className="flex items-start gap-3">
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${jobType === 'hourly' ? 'bg-orange-500 text-white' : 'bg-[#222] text-[#8f8f8f]'}`}>
                            <Clock className="h-4.5 w-4.5" />
                        </span>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-white">{tx('jobs.new.stepBudget.hourly', undefined, 'بالساعة')}</p>
                            <p className="text-xs leading-5 text-[#9a9a9a]">
                                {tx('jobs.new.stepBudget.hourlyDescription', undefined, 'ادفع للمستقل بناءً على عدد ساعات العمل.')}
                            </p>
                        </div>
                    </div>
                </label>
            </section>

            <section className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5 transition-colors hover:bg-white/[0.04] hover:border-white/10">
                {jobType === 'fixed_price' ? (
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                            {tx('jobs.new.stepBudget.estimatedBudget', undefined, 'ميزانية المشروع التقديرية (د.ت)')}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs text-[#9a9a9a]">
                                    {tx('jobs.new.stepBudget.min', undefined, 'من')}
                                </label>
                                <input
                                    type="number"
                                    className={fieldClass}
                                    placeholder={tx('jobs.new.stepBudget.minPlaceholder', undefined, 'Example: 600')}
                                    {...register('budget_min', { valueAsNumber: true })}
                                />
                                {errors.budget_min ? <p className="mt-1 text-xs text-red-400">{errors.budget_min.message as string}</p> : null}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-[#9a9a9a]">
                                    {tx('jobs.new.stepBudget.max', undefined, 'إلى')}
                                </label>
                                <input
                                    type="number"
                                    className={fieldClass}
                                    placeholder={tx('jobs.new.stepBudget.maxPlaceholder', undefined, 'Example: 1200')}
                                    {...register('budget_max', { valueAsNumber: true })}
                                />
                                {errors.budget_max ? <p className="mt-1 text-xs text-red-400">{errors.budget_max.message as string}</p> : null}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs text-[#9a9a9a]">
                                {tx('jobs.new.stepBudget.hourlyRate', undefined, 'السعر بالساعة (د.ت)')}
                            </label>
                            <input
                                type="number"
                                className={fieldClass}
                                placeholder={tx('jobs.new.stepBudget.hourlyRateExample', undefined, 'Example: 35')}
                                {...register('hourly_rate', { valueAsNumber: true })}
                            />
                            {errors.hourly_rate ? <p className="mt-1 text-xs text-red-400">{errors.hourly_rate.message as string}</p> : null}
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-[#9a9a9a]">
                                {tx('jobs.new.stepBudget.weeklyHours', undefined, 'الساعات المتوقعة أسبوعياً')}
                            </label>
                            <input
                                type="number"
                                className={fieldClass}
                                placeholder={tx('jobs.new.stepBudget.weeklyHoursExample', undefined, 'Example: 15')}
                                {...register('estimated_hours', { valueAsNumber: true })}
                            />
                            {errors.estimated_hours ? <p className="mt-1 text-xs text-red-400">{errors.estimated_hours.message as string}</p> : null}
                        </div>
                    </div>
                )}
            </section>

            <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5 transition-colors hover:bg-white/[0.04] hover:border-white/10">
                    <label className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                        <Calendar className="h-4 w-4" />
                        {tx('jobs.new.stepBudget.duration', undefined, 'مدة المشروع')}
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {durationOptions.map((option) => {
                            const isSelected = duration === option.value;
                            return (
                                <label
                                    key={option.value}
                                    className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition ${isSelected
                                        ? 'border-orange-500/45 bg-orange-500/10 text-orange-200'
                                        : 'border-[#313131] bg-[#141414] text-[#b3b3b3] hover:border-orange-500/35 hover:bg-orange-500/5'
                                        }`}
                                >
                                    <input type="radio" value={option.value} {...register('duration')} className="sr-only" />
                                    {option.label}
                                </label>
                            );
                        })}
                    </div>
                    {errors.duration ? <p className="mt-2 text-xs text-red-400">{errors.duration.message as string}</p> : null}
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5 transition-colors hover:bg-white/[0.04] hover:border-white/10">
                    <label className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                        <Calendar className="h-4 w-4" />
                        {tx('jobs.new.stepBudget.deadline', undefined, 'الموعد النهائي')}
                    </label>
                    <input type="date" min={allowPastDeadline ? undefined : today} className={fieldClass} {...register('deadline')} />
                    {errors.deadline ? <p className="mt-2 text-xs text-red-400">{errors.deadline.message as string}</p> : null}
                </div>
            </section>

            <section className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5 transition-colors hover:bg-white/[0.04] hover:border-white/10">
                <label className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                    <TrendingUp className="h-4 w-4" />
                    {tx('jobs.new.stepBudget.experienceLevel', undefined, 'مستوى الخبرة المطلوب')}
                </label>

                <div className="grid gap-2 sm:grid-cols-3">
                    {experienceOptions.map((option) => {
                        const isSelected = experienceLevel === option.value;
                        return (
                            <label
                                key={option.value}
                                className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition ${isSelected
                                    ? 'border-orange-500/45 bg-orange-500/10 text-orange-200'
                                    : 'border-[#313131] bg-[#141414] text-[#b3b3b3] hover:border-orange-500/35 hover:bg-orange-500/5'
                                    }`}
                            >
                                <input type="radio" value={option.value} {...register('experience_level')} className="sr-only" />
                                {option.label}
                            </label>
                        );
                    })}
                </div>
                {errors.experience_level ? <p className="mt-2 text-xs text-red-400">{errors.experience_level.message as string}</p> : null}
            </section>
        </div>
    );
}
