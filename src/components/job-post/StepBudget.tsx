import { useFormContext } from 'react-hook-form';
import { DollarSign, Clock, Calendar, TrendingUp, Check, Star, Shield, Award, Sparkles } from 'lucide-react';
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
        setValue,
        formState: { errors },
    } = useFormContext<StepBudgetValues>();
    const { tx } = useTranslation();

    const jobType = watch('job_type') || 'fixed_price';
    const duration = watch('duration');
    const experienceLevel = watch('experience_level');
    const today = new Date().toISOString().split('T')[0];

    const fieldClass =
        'w-full h-12 rounded-xl border border-white/10 bg-white/[0.03] pl-4 pr-12 text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-500 hover:border-white/20 hover:bg-white/[0.05] focus:bg-white/[0.05] focus:border-workspace-primary focus:ring-4 focus:ring-workspace-primary/10 shadow-inner backdrop-blur-sm';

    const durationOptions = [
        {
            value: 'less_than_1_month',
            label: tx('jobs.new.stepBudget.durationLessThan1Month', undefined, 'Less than 1 month'),
        },
        {
            value: '1_3_months',
            label: tx('jobs.new.stepBudget.duration1To3Months', undefined, '1 to 3 months'),
        },
        {
            value: '3_6_months',
            label: tx('jobs.new.stepBudget.duration3To6Months', undefined, '3 to 6 months'),
        },
        {
            value: 'more_than_6_months',
            label: tx('jobs.new.stepBudget.durationMoreThan6Months', undefined, 'More than 6 months'),
        },
    ] as const;

    const experienceOptions = [
        {
            value: 'beginner',
            title: tx('jobs.new.stepBudget.beginner', undefined, 'Entry Level'),
            subtitle: 'New freelancers or budget-friendly tasks',
            Icon: Star,
        },
        {
            value: 'intermediate',
            title: tx('jobs.new.stepBudget.intermediate', undefined, 'Intermediate'),
            subtitle: 'Experienced professionals for standard goals',
            Icon: Shield,
        },
        {
            value: 'expert',
            title: tx('jobs.new.stepBudget.expert', undefined, 'Expert'),
            subtitle: 'High-tier specialists for critical projects',
            Icon: Award,
        },
    ] as const;

    return (
        <div className="space-y-8">
            {/* Pricing Mode Radio Cards */}
            <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {tx('jobs.new.stepBudget.pricingMode', undefined, 'Choose how you want to pay')}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Fixed Price Card */}
                    <label
                        className={`relative cursor-pointer rounded-2xl border p-6 transition-all duration-300 flex flex-col justify-between h-full group backdrop-blur-md hover:-translate-y-1 ${
                            jobType === 'fixed_price'
                                ? 'border-workspace-primary/50 bg-workspace-primary/[0.04] shadow-[0_15px_30px_color-mix(in_srgb,var(--workspace-primary)_8%,transparent)] ring-1 ring-workspace-primary/30'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] hover:shadow-lg'
                        }`}
                    >
                        <input type="radio" value="fixed_price" {...register('job_type')} className="sr-only" />
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                                    jobType === 'fixed_price'
                                        ? 'bg-workspace-primary text-white shadow-[0_0_15px_var(--workspace-shadow)]'
                                        : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'
                                }`}>
                                    <DollarSign className="h-6 w-6" />
                                </span>
                                <div>
                                    <p className="text-base font-bold text-white">
                                        {tx('jobs.new.stepBudget.fixedPrice', undefined, 'Fixed Price')}
                                    </p>
                                    <p className="text-[10px] text-workspace-primary font-semibold tracking-wider uppercase mt-0.5">
                                        Milestone Based
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-400">
                                {tx('jobs.new.stepBudget.fixedPriceDescription', undefined, 'Define structured milestones and release funds as project achievements are delivered.')}
                            </p>
                            
                            {/* Value Proposition bullets */}
                            <ul className="space-y-2 border-t border-white/5 pt-4 text-[11px] text-gray-400 leading-normal">
                                <li className="flex items-center gap-2">
                                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                    <span>Set milestones with clear scopes</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                    <span>Escrow protection adds confidence</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                    <span>Ideal for defined tasks & deliverables</span>
                                </li>
                            </ul>
                        </div>
                        {jobType === 'fixed_price' && (
                            <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-workspace-primary flex items-center justify-center shadow-lg">
                                <Check className="h-4 w-4 text-white stroke-[3px]" />
                            </div>
                        )}
                    </label>

                    {/* Hourly Card */}
                    <label
                        className={`relative cursor-pointer rounded-2xl border p-6 transition-all duration-300 flex flex-col justify-between h-full group backdrop-blur-md hover:-translate-y-1 ${
                            jobType === 'hourly'
                                ? 'border-workspace-primary/50 bg-workspace-primary/[0.04] shadow-[0_15px_30px_color-mix(in_srgb,var(--workspace-primary)_8%,transparent)] ring-1 ring-workspace-primary/30'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] hover:shadow-lg'
                        }`}
                    >
                        <input type="radio" value="hourly" {...register('job_type')} className="sr-only" />
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                                    jobType === 'hourly'
                                        ? 'bg-workspace-primary text-white shadow-[0_0_15px_var(--workspace-shadow)]'
                                        : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'
                                }`}>
                                    <Clock className="h-6 w-6" />
                                </span>
                                <div>
                                    <p className="text-base font-bold text-white">
                                        {tx('jobs.new.stepBudget.hourly', undefined, 'Hourly Rate')}
                                    </p>
                                    <p className="text-[10px] text-workspace-primary font-semibold tracking-wider uppercase mt-0.5">
                                        Time-Tracked
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-400">
                                {tx('jobs.new.stepBudget.hourlyDescription', undefined, 'Pay by the hour based on tracked time log submissions. Perfect for iterative support.')}
                            </p>

                            {/* Value Proposition bullets */}
                            <ul className="space-y-2 border-t border-white/5 pt-4 text-[11px] text-gray-400 leading-normal">
                                <li className="flex items-center gap-2">
                                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                    <span>Track logs using screen logs</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                    <span>Flexible weekly limits</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                    <span>Ideal for open-ended or scaling projects</span>
                                </li>
                            </ul>
                        </div>
                        {jobType === 'hourly' && (
                            <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-workspace-primary flex items-center justify-center shadow-lg">
                                <Check className="h-4 w-4 text-white stroke-[3px]" />
                            </div>
                        )}
                    </label>
                </div>
            </section>

            {/* Pricing Fields Container */}
            <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 transition-all duration-300 hover:border-white/10 backdrop-blur-sm">
                {jobType === 'fixed_price' ? (
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                {tx('jobs.new.stepBudget.estimatedBudget', undefined, 'Estimated Project Budget')}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Define a budget range to attract proposals within your expected cost bracket.</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">
                                    {tx('jobs.new.stepBudget.min', undefined, 'Minimum Budget')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className={fieldClass}
                                        placeholder={tx('jobs.new.stepBudget.minPlaceholder', undefined, '600')}
                                        {...register('budget_min', { valueAsNumber: true })}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 bg-white/5 px-2 py-1 rounded">
                                        TND
                                    </span>
                                </div>
                                {errors.budget_min ? <p className="text-xs text-red-400 mt-1">{errors.budget_min.message as string}</p> : null}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">
                                    {tx('jobs.new.stepBudget.max', undefined, 'Maximum Budget')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className={fieldClass}
                                        placeholder={tx('jobs.new.stepBudget.maxPlaceholder', undefined, '1200')}
                                        {...register('budget_max', { valueAsNumber: true })}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 bg-white/5 px-2 py-1 rounded">
                                        TND
                                    </span>
                                </div>
                                {errors.budget_max ? <p className="text-xs text-red-400 mt-1">{errors.budget_max.message as string}</p> : null}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                {tx('jobs.new.stepBudget.hourlySetup', undefined, 'Hourly Pricing Details')}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Determine the target rate and weekly resource commitment limits.</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">
                                    {tx('jobs.new.stepBudget.hourlyRate', undefined, 'Hourly Rate')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className={fieldClass}
                                        placeholder={tx('jobs.new.stepBudget.hourlyRateExample', undefined, '35')}
                                        {...register('hourly_rate', { valueAsNumber: true })}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 bg-white/5 px-2 py-1 rounded">
                                        TND / hr
                                    </span>
                                </div>
                                {errors.hourly_rate ? <p className="text-xs text-red-400 mt-1">{errors.hourly_rate.message as string}</p> : null}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">
                                    {tx('jobs.new.stepBudget.weeklyHours', undefined, 'Weekly hours limit')}
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.03] pl-4 pr-10 text-sm text-white outline-none transition-all duration-300 focus:bg-white/[0.05] focus:border-workspace-primary focus:ring-4 focus:ring-workspace-primary/10 appearance-none cursor-pointer"
                                        onChange={(e) => setValue('estimated_hours', Number(e.target.value))}
                                        defaultValue={watch('estimated_hours') || 20}
                                    >
                                        <option value={10} className="bg-[#0c0c0e]">Part-time (up to 10 hrs/week)</option>
                                        <option value={20} className="bg-[#0c0c0e]">Part-time (up to 20 hrs/week)</option>
                                        <option value={30} className="bg-[#0c0c0e]">Full-time (up to 30 hrs/week)</option>
                                        <option value={40} className="bg-[#0c0c0e]">Full-time (up to 40 hrs/week)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">
                                        ▼
                                    </div>
                                </div>
                                {errors.estimated_hours ? <p className="text-xs text-red-400 mt-1">{errors.estimated_hours.message as string}</p> : null}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Experience Level Selector */}
            <section className="space-y-4">
                <div>
                    <h3 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                        <TrendingUp className="h-4 w-4 text-workspace-primary" />
                        {tx('jobs.new.stepBudget.experienceLevel', undefined, 'Required Experience Level')}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Choose the level of expertise needed to ensure relevant freelancer matches.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {experienceOptions.map((option) => {
                        const isSelected = experienceLevel === option.value;
                        const IconComponent = option.Icon;

                        return (
                            <label
                                key={option.value}
                                className={`relative cursor-pointer rounded-2xl border p-5 transition-all duration-300 flex flex-col items-center justify-between text-center group backdrop-blur-md hover:-translate-y-0.5 ${
                                    isSelected
                                        ? 'border-workspace-primary/50 bg-workspace-primary/[0.04] shadow-[0_10px_20px_color-mix(in_srgb,var(--workspace-primary)_8%,transparent)] ring-1 ring-workspace-primary/20'
                                        : 'border-white/10 bg-white/[0.01] text-gray-400 hover:border-white/20 hover:bg-white/[0.03] hover:text-white'
                                }`}
                            >
                                <input type="radio" value={option.value} {...register('experience_level')} className="sr-only" />
                                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 transition-colors ${
                                    isSelected ? 'bg-workspace-primary/10 text-workspace-primary' : 'bg-white/5 text-gray-400 group-hover:text-white'
                                }`}>
                                    <IconComponent className="h-5.5 w-5.5" />
                                </span>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-white">
                                        {option.title}
                                    </p>
                                    <p className="text-[10px] text-gray-500 leading-normal px-2">
                                        {option.subtitle}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-workspace-primary flex items-center justify-center shadow-lg">
                                        <Check className="h-3 w-3 text-white stroke-[3px]" />
                                    </div>
                                )}
                            </label>
                        );
                    })}
                </div>
                {errors.experience_level ? <p className="text-xs text-red-400 mt-2">{errors.experience_level.message as string}</p> : null}
            </section>

            {/* Duration and Deadline Grid */}
            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                {/* Duration Selector */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 transition-all duration-300 hover:border-white/10 backdrop-blur-sm flex flex-col justify-between">
                    <div className="space-y-3 w-full">
                        <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            <Clock className="h-4 w-4 text-workspace-primary" />
                            {tx('jobs.new.stepBudget.duration', undefined, 'Project Duration')}
                        </label>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                            {durationOptions.map((option) => {
                                const isSelected = duration === option.value;
                                return (
                                    <label
                                        key={option.value}
                                        className={`relative cursor-pointer rounded-xl border px-4 py-3 text-xs font-semibold transition-all duration-200 text-center flex items-center justify-center min-h-[48px] group ${
                                            isSelected
                                                ? 'border-workspace-primary/50 bg-workspace-primary/[0.04] text-white shadow-[0_0_15px_color-mix(in_srgb,var(--workspace-primary)_8%,transparent)] ring-1 ring-workspace-primary/20'
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
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 transition-all duration-300 hover:border-white/10 backdrop-blur-sm flex flex-col justify-between">
                    <div className="space-y-3 w-full">
                        <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            <Calendar className="h-4 w-4 text-workspace-primary" />
                            {tx('jobs.new.stepBudget.deadline', undefined, 'Deadline Date')}
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                min={allowPastDeadline ? undefined : today}
                                className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-500 hover:border-white/20 hover:bg-white/[0.05] focus:bg-white/[0.05] focus:border-workspace-primary focus:ring-4 focus:ring-workspace-primary/10 shadow-inner backdrop-blur-sm"
                                {...register('deadline')}
                            />
                        </div>
                    </div>
                    {errors.deadline ? <p className="text-xs text-red-400 mt-2">{errors.deadline.message as string}</p> : null}
                </div>
            </section>
        </div>
    );
}
