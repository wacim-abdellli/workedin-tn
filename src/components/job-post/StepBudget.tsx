import { useFormContext } from 'react-hook-form';
import { DollarSign, Clock, Calendar, TrendingUp, Check } from 'lucide-react';
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
        'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-500 hover:border-white/20 hover:bg-white/[0.05] focus:bg-white/[0.05] focus:border-workspace-primary focus:ring-4 focus:ring-workspace-primary/10 shadow-inner backdrop-blur-sm';

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
            {/* Pricing Mode Radio Cards */}
            <section className="grid gap-4 sm:grid-cols-2">
                <label
                    className={`relative cursor-pointer rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between h-full group ${
                        jobType === 'fixed_price'
                            ? 'border-workspace-primary/50 bg-workspace-primary/5 shadow-[0_0_20px_color-mix(in_srgb,var(--workspace-primary)_12%,transparent)]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                >
                    <input type="radio" value="fixed_price" {...register('job_type')} className="sr-only" />
                    <div className="flex items-start gap-4">
                        <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                            jobType === 'fixed_price'
                                ? 'bg-workspace-primary text-white shadow-[0_0_15px_var(--workspace-shadow)]'
                                : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'
                        }`}>
                            <DollarSign className="h-5.5 w-5.5" />
                        </span>
                        <div className="space-y-1">
                            <p className={`text-base font-bold transition-colors ${
                                jobType === 'fixed_price' ? 'text-workspace-primary' : 'text-white'
                            }`}>
                                {tx('jobs.new.stepBudget.fixedPrice', undefined, 'Fixed price')}
                            </p>
                            <p className="text-xs leading-relaxed text-gray-400">
                                {tx('jobs.new.stepBudget.fixedPriceDescription', undefined, 'Pay a set budget for the entire project, released as milestones are completed.')}
                            </p>
                        </div>
                    </div>
                    {jobType === 'fixed_price' && (
                        <div className="absolute top-4 right-4 h-5.5 w-5.5 rounded-full bg-workspace-primary flex items-center justify-center shadow-lg">
                            <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />
                        </div>
                    )}
                </label>

                <label
                    className={`relative cursor-pointer rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between h-full group ${
                        jobType === 'hourly'
                            ? 'border-workspace-primary/50 bg-workspace-primary/5 shadow-[0_0_20px_color-mix(in_srgb,var(--workspace-primary)_12%,transparent)]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                >
                    <input type="radio" value="hourly" {...register('job_type')} className="sr-only" />
                    <div className="flex items-start gap-4">
                        <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                            jobType === 'hourly'
                                ? 'bg-workspace-primary text-white shadow-[0_0_15px_var(--workspace-shadow)]'
                                : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'
                        }`}>
                            <Clock className="h-5.5 w-5.5" />
                        </span>
                        <div className="space-y-1">
                            <p className={`text-base font-bold transition-colors ${
                                jobType === 'hourly' ? 'text-workspace-primary' : 'text-white'
                            }`}>
                                {tx('jobs.new.stepBudget.hourly', undefined, 'Hourly rate')}
                            </p>
                            <p className="text-xs leading-relaxed text-gray-400">
                                {tx('jobs.new.stepBudget.hourlyDescription', undefined, 'Pay by the hour based on tracked time, ideal for dynamic or iterative projects.')}
                            </p>
                        </div>
                    </div>
                    {jobType === 'hourly' && (
                        <div className="absolute top-4 right-4 h-5.5 w-5.5 rounded-full bg-workspace-primary flex items-center justify-center shadow-lg">
                            <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />
                        </div>
                    )}
                </label>
            </section>

            {/* Pricing Fields Container */}
            <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 transition-colors duration-300 hover:border-white/10">
                {jobType === 'fixed_price' ? (
                    <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            {tx('jobs.new.stepBudget.estimatedBudget', undefined, 'Estimated Project Budget (TND)')}
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">
                                    {tx('jobs.new.stepBudget.min', undefined, 'Minimum')}
                                </label>
                                <input
                                    type="number"
                                    className={fieldClass}
                                    placeholder={tx('jobs.new.stepBudget.minPlaceholder', undefined, 'Example: 600')}
                                    {...register('budget_min', { valueAsNumber: true })}
                                />
                                {errors.budget_min ? <p className="text-xs text-red-400 mt-1">{errors.budget_min.message as string}</p> : null}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">
                                    {tx('jobs.new.stepBudget.max', undefined, 'Maximum')}
                                </label>
                                <input
                                    type="number"
                                    className={fieldClass}
                                    placeholder={tx('jobs.new.stepBudget.maxPlaceholder', undefined, 'Example: 1200')}
                                    {...register('budget_max', { valueAsNumber: true })}
                                />
                                {errors.budget_max ? <p className="text-xs text-red-400 mt-1">{errors.budget_max.message as string}</p> : null}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            {tx('jobs.new.stepBudget.hourlySetup', undefined, 'Hourly Pricing Setup')}
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">
                                    {tx('jobs.new.stepBudget.hourlyRate', undefined, 'Hourly Rate (TND)')}
                                </label>
                                <input
                                    type="number"
                                    className={fieldClass}
                                    placeholder={tx('jobs.new.stepBudget.hourlyRateExample', undefined, 'Example: 35')}
                                    {...register('hourly_rate', { valueAsNumber: true })}
                                />
                                {errors.hourly_rate ? <p className="text-xs text-red-400 mt-1">{errors.hourly_rate.message as string}</p> : null}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">
                                    {tx('jobs.new.stepBudget.weeklyHours', undefined, 'Estimated Hours per Week')}
                                </label>
                                <input
                                    type="number"
                                    className={fieldClass}
                                    placeholder={tx('jobs.new.stepBudget.weeklyHoursExample', undefined, 'Example: 15')}
                                    {...register('estimated_hours', { valueAsNumber: true })}
                                />
                                {errors.estimated_hours ? <p className="text-xs text-red-400 mt-1">{errors.estimated_hours.message as string}</p> : null}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Duration and Deadline Grid */}
            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                {/* Duration Selector */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 transition-colors duration-300 hover:border-white/10 flex flex-col justify-between">
                    <div className="space-y-3 w-full">
                        <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            <Calendar className="h-4 w-4 text-workspace-primary" />
                            {tx('jobs.new.stepBudget.duration', undefined, 'Project Duration')}
                        </label>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                            {durationOptions.map((option) => {
                                const isSelected = duration === option.value;
                                return (
                                    <label
                                        key={option.value}
                                        className={`relative cursor-pointer rounded-xl border px-4 py-3 text-xs font-medium transition-all duration-200 text-center flex items-center justify-center min-h-[48px] group ${
                                            isSelected
                                                ? 'border-workspace-primary/50 bg-workspace-primary/5 text-white shadow-[0_0_15px_color-mix(in_srgb,var(--workspace-primary)_8%,transparent)] font-bold'
                                                : 'border-white/10 bg-white/[0.01] text-gray-400 hover:border-white/20 hover:bg-white/[0.03] hover:text-white'
                                        }`}
                                    >
                                        <input type="radio" value={option.value} {...register('duration')} className="sr-only" />
                                        {option.label}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                    {errors.duration ? <p className="text-xs text-red-400 mt-2">{errors.duration.message as string}</p> : null}
                </div>

                {/* Deadline Selector */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 transition-colors duration-300 hover:border-white/10 flex flex-col justify-between">
                    <div className="space-y-3 w-full">
                        <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            <Calendar className="h-4 w-4 text-workspace-primary" />
                            {tx('jobs.new.stepBudget.deadline', undefined, 'Deadline')}
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                min={allowPastDeadline ? undefined : today}
                                className={fieldClass}
                                {...register('deadline')}
                            />
                        </div>
                    </div>
                    {errors.deadline ? <p className="text-xs text-red-400 mt-2">{errors.deadline.message as string}</p> : null}
                </div>
            </section>

            {/* Experience Level Selector */}
            <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 transition-colors duration-300 hover:border-white/10">
                <div className="space-y-3">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        <TrendingUp className="h-4 w-4 text-workspace-primary" />
                        {tx('jobs.new.stepBudget.experienceLevel', undefined, 'Required Experience Level')}
                    </label>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {experienceOptions.map((option) => {
                            const isSelected = experienceLevel === option.value;
                            return (
                                <label
                                    key={option.value}
                                    className={`relative cursor-pointer rounded-xl border px-4 py-3 text-xs font-semibold tracking-wide transition-all duration-200 text-center flex items-center justify-center min-h-[48px] group ${
                                        isSelected
                                            ? 'border-workspace-primary/50 bg-workspace-primary/5 text-white shadow-[0_0_15px_color-mix(in_srgb,var(--workspace-primary)_8%,transparent)]'
                                            : 'border-white/10 bg-white/[0.01] text-gray-400 hover:border-white/20 hover:bg-white/[0.03] hover:text-white'
                                    }`}
                                >
                                    <input type="radio" value={option.value} {...register('experience_level')} className="sr-only" />
                                    {option.label}
                                </label>
                            );
                        })}
                    </div>
                </div>
                {errors.experience_level ? <p className="text-xs text-red-400 mt-2">{errors.experience_level.message as string}</p> : null}
            </section>
        </div>
    );
}
