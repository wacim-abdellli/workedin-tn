import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { DollarSign, Clock, Calendar, TrendingUp, Check, Star, Shield, Award, Sliders } from 'lucide-react';
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

    // Initialize budget type: 'exact' if job_type is fixed_price and budget_min === budget_max
    const initialMin = watch('budget_min');
    const initialMax = watch('budget_max');
    const [budgetType, setBudgetType] = useState<'exact' | 'range'>(() => {
        if (initialMin && initialMax && initialMin === initialMax) {
            return 'exact';
        }
        return 'range';
    });

    // Derive active selection method for our three options
    const activeMethod = jobType === 'hourly' ? 'hourly' : (budgetType === 'exact' ? 'fixed_exact' : 'fixed_range');

    const handleMethodSelect = (method: 'fixed_exact' | 'fixed_range' | 'hourly') => {
        if (method === 'fixed_exact') {
            setValue('job_type', 'fixed_price', { shouldValidate: true, shouldDirty: true });
            setBudgetType('exact');
            setValue('hourly_rate', undefined);
            setValue('estimated_hours', undefined);
            const currentMin = watch('budget_min');
            if (currentMin) {
                setValue('budget_max', currentMin, { shouldValidate: true, shouldDirty: true });
            }
        } else if (method === 'fixed_range') {
            setValue('job_type', 'fixed_price', { shouldValidate: true, shouldDirty: true });
            setBudgetType('range');
            setValue('hourly_rate', undefined);
            setValue('estimated_hours', undefined);
            const currentMin = watch('budget_min');
            const currentMax = watch('budget_max');
            if (currentMin && currentMax && currentMin === currentMax) {
                setValue('budget_max', undefined);
            }
        } else if (method === 'hourly') {
            setValue('job_type', 'hourly', { shouldValidate: true, shouldDirty: true });
            setValue('budget_min', undefined);
            setValue('budget_max', undefined);
            if (!watch('estimated_hours')) {
                setValue('estimated_hours', 20, { shouldValidate: true });
            }
        }
    };

    const fieldClass =
        'w-full h-11 rounded-xl border border-white/10 bg-white/[0.01] pl-4 pr-12 text-sm text-white/90 outline-none transition-all duration-300 placeholder:text-gray-500 hover:border-white/20 focus:border-workspace-primary/40 focus:bg-white/[0.03] focus:ring-4 focus:ring-workspace-primary/5';

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
            subtitle: 'Simple tasks or budget-friendly options',
            Icon: Star,
        },
        {
            value: 'intermediate',
            title: tx('jobs.new.stepBudget.intermediate', undefined, 'Intermediate'),
            subtitle: 'Solid experience for standard goals',
            Icon: Shield,
        },
        {
            value: 'expert',
            title: tx('jobs.new.stepBudget.expert', undefined, 'Expert'),
            subtitle: 'High-tier specialists for complex needs',
            Icon: Award,
        },
    ] as const;

    const pricingOptions = [
        {
            value: 'fixed_exact',
            title: tx('jobs.new.stepBudget.fixedExact', undefined, 'Fixed Price (Exact)'),
            subtitle: 'Single fixed budget',
            description: tx('jobs.new.stepBudget.fixedExactDescription', undefined, 'Specify a set budget for the entire scope of work. Best for well-defined tasks.'),
            Icon: DollarSign,
        },
        {
            value: 'fixed_range',
            title: tx('jobs.new.stepBudget.fixedRange', undefined, 'Fixed Price (Range)'),
            subtitle: 'Budget min-max range',
            description: tx('jobs.new.stepBudget.fixedRangeDescription', undefined, 'Define a budget window to invite proposals matching your expected bracket.'),
            Icon: Sliders,
        },
        {
            value: 'hourly',
            title: tx('jobs.new.stepBudget.hourly', undefined, 'Hourly Rate'),
            subtitle: 'Time-logged billing',
            description: tx('jobs.new.stepBudget.hourlyDescription', undefined, 'Pay by the hour based on tracked logs. Best for ongoing or evolving work.'),
            Icon: Clock,
        },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Pricing Mode Radio Cards */}
            <section className="space-y-3">
                <h3 className="text-xs font-medium tracking-wide text-gray-400/80 flex items-center gap-2">
                    {tx('jobs.new.stepBudget.pricingMode', undefined, 'Pricing Model')}
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    {pricingOptions.map((option) => {
                        const isSelected = activeMethod === option.value;
                        const IconComponent = option.Icon;

                        return (
                            <label
                                key={option.value}
                                className={`relative cursor-pointer rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between h-full group backdrop-blur-md hover:-translate-y-0.5 ${
                                    isSelected
                                        ? 'border-workspace-primary/35 bg-workspace-primary/[0.02] shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
                                        : 'border-white/[0.04] bg-white/[0.01] hover:border-white/15 hover:bg-white/[0.02]'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="pricing_method"
                                    value={option.value}
                                    checked={isSelected}
                                    onChange={() => handleMethodSelect(option.value)}
                                    className="sr-only"
                                />
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                                            isSelected
                                                ? 'bg-workspace-primary/10 text-workspace-primary'
                                                : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'
                                        }`}>
                                            <IconComponent className="h-4.5 w-4.5" />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-white/90">
                                                {option.title}
                                            </p>
                                            <p className="text-[9px] text-gray-400/60 font-medium tracking-wider uppercase mt-0.5">
                                                {option.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs leading-relaxed text-gray-400/80 font-normal">
                                        {option.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-workspace-primary flex items-center justify-center shadow-md shadow-workspace-primary/15">
                                        <Check className="h-3 w-3 text-white stroke-[3px]" />
                                    </div>
                                )}
                            </label>
                        );
                    })}
                </div>
            </section>

            {/* Pricing Fields Container */}
            <section className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 backdrop-blur-md shadow-inner transition-all duration-300">
                {activeMethod === 'fixed_exact' && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-workspace-primary-light/80">
                                {tx('jobs.new.stepBudget.estimatedBudget', undefined, 'Estimated Project Budget')}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">Specify the exact fixed price for this project.</p>
                        </div>
                        <div className="space-y-1.5 max-w-md">
                            <label className="text-xs font-medium text-gray-400/95">
                                {tx('jobs.new.stepBudget.budgetAmount', undefined, 'Budget Amount')}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className={fieldClass}
                                    placeholder="Example: 500"
                                    value={watch('budget_min') || ''}
                                    onChange={(e) => {
                                        const val = e.target.value === '' ? undefined : Number(e.target.value);
                                        setValue('budget_min', val, { shouldValidate: true, shouldDirty: true });
                                        setValue('budget_max', val, { shouldValidate: true, shouldDirty: true });
                                    }}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                                    TND
                                </span>
                            </div>
                            {errors.budget_min ? <p className="text-xs text-red-400 mt-1">{errors.budget_min.message as string}</p> : null}
                        </div>
                    </div>
                )}

                {activeMethod === 'fixed_range' && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-workspace-primary-light/80">
                                {tx('jobs.new.stepBudget.estimatedBudget', undefined, 'Estimated Project Budget')}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">Specify a range to attract bids within your target cost.</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400/95">
                                    {tx('jobs.new.stepBudget.min', undefined, 'Minimum Budget')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className={fieldClass}
                                        placeholder="Example: 600"
                                        {...register('budget_min', { valueAsNumber: true })}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                                        TND
                                    </span>
                                </div>
                                {errors.budget_min ? <p className="text-xs text-red-400 mt-1">{errors.budget_min.message as string}</p> : null}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400/95">
                                    {tx('jobs.new.stepBudget.max', undefined, 'Maximum Budget')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className={fieldClass}
                                        placeholder="Example: 1200"
                                        {...register('budget_max', { valueAsNumber: true })}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                                        TND
                                    </span>
                                </div>
                                {errors.budget_max ? <p className="text-xs text-red-400 mt-1">{errors.budget_max.message as string}</p> : null}
                            </div>
                        </div>
                    </div>
                )}

                {activeMethod === 'hourly' && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-workspace-primary-light/80">
                                {tx('jobs.new.stepBudget.hourlySetup', undefined, 'Hourly Pricing Details')}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">Determine the hourly rate and weekly time commitment limit.</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400/95">
                                    {tx('jobs.new.stepBudget.hourlyRate', undefined, 'Hourly Rate')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className={fieldClass}
                                        placeholder="Example: 35"
                                        {...register('hourly_rate', { valueAsNumber: true })}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                                        TND / hr
                                    </span>
                                </div>
                                {errors.hourly_rate ? <p className="text-xs text-red-400 mt-1">{errors.hourly_rate.message as string}</p> : null}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400/95">
                                    {tx('jobs.new.stepBudget.weeklyHours', undefined, 'Weekly hours limit')}
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full h-11 rounded-xl border border-white/10 bg-[#0c0c0e] pl-4 pr-10 text-sm text-white/90 outline-none transition-all duration-300 focus:bg-[#0f0f12] focus:border-workspace-primary/40 focus:ring-4 focus:ring-workspace-primary/5 appearance-none cursor-pointer"
                                        onChange={(e) => setValue('estimated_hours', Number(e.target.value))}
                                        defaultValue={watch('estimated_hours') || 20}
                                    >
                                        <option value={10}>Part-time (up to 10 hrs/week)</option>
                                        <option value={20}>Part-time (up to 20 hrs/week)</option>
                                        <option value={30}>Full-time (up to 30 hrs/week)</option>
                                        <option value={40}>Full-time (up to 40 hrs/week)</option>
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
            <section className="space-y-3">
                <div>
                    <h3 className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-gray-400/80">
                        <TrendingUp className="h-4 w-4 text-workspace-primary" />
                        {tx('jobs.new.stepBudget.experienceLevel', undefined, 'Required Experience Level')}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Select the expertise level needed to ensure relevant applications.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {experienceOptions.map((option) => {
                        const isSelected = experienceLevel === option.value;
                        const IconComponent = option.Icon;

                        return (
                            <label
                                key={option.value}
                                className={`relative cursor-pointer rounded-2xl border p-4.5 transition-all duration-300 flex flex-col items-center justify-between text-center group backdrop-blur-md hover:-translate-y-0.5 ${
                                    isSelected
                                        ? 'border-workspace-primary/35 bg-workspace-primary/[0.02] shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
                                        : 'border-white/[0.04] bg-white/[0.01] text-gray-400 hover:border-white/15 hover:bg-white/[0.02] hover:text-white'
                                }`}
                            >
                                <input type="radio" value={option.value} {...register('experience_level')} className="sr-only" />
                                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3 transition-colors ${
                                    isSelected ? 'bg-workspace-primary/10 text-workspace-primary' : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'
                                }`}>
                                    <IconComponent className="h-4.5 w-4.5" />
                                </span>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-white/90">
                                        {option.title}
                                    </p>
                                    <p className="text-[10px] text-gray-400/60 leading-normal font-normal px-2">
                                        {option.subtitle}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-3 right-3 h-4.5 w-4.5 rounded-full bg-workspace-primary flex items-center justify-center shadow-md shadow-workspace-primary/15">
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
                <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-5.5 transition-all duration-300 hover:border-white/10 backdrop-blur-md flex flex-col justify-between shadow-inner">
                    <div className="space-y-4 w-full">
                        <label className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-gray-400/80">
                            <Clock className="h-4 w-4 text-workspace-primary" />
                            {tx('jobs.new.stepBudget.duration', undefined, 'Project Duration')}
                        </label>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                            {durationOptions.map((option) => {
                                const isSelected = duration === option.value;
                                return (
                                    <label
                                        key={option.value}
                                        className={`relative cursor-pointer rounded-xl border px-4 py-3 text-xs font-medium transition-all duration-300 text-center flex items-center justify-center min-h-[44px] group ${
                                            isSelected
                                                ? 'border-workspace-primary/35 bg-workspace-primary/[0.02] text-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
                                                : 'border-white/[0.04] bg-white/[0.01] text-gray-400 hover:border-white/15 hover:bg-white/[0.02] hover:text-white'
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
                <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-5.5 transition-all duration-300 hover:border-white/10 backdrop-blur-md flex flex-col justify-between shadow-inner">
                    <div className="space-y-4 w-full">
                        <label className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-gray-400/80">
                            <Calendar className="h-4 w-4 text-workspace-primary" />
                            {tx('jobs.new.stepBudget.deadline', undefined, 'Deadline Date')}
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                min={allowPastDeadline ? undefined : today}
                                className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.01] px-4 text-sm text-white/90 outline-none transition-all duration-300 placeholder:text-gray-500 hover:border-white/20 focus:border-workspace-primary/40 focus:bg-white/[0.03] focus:ring-4 focus:ring-workspace-primary/5"
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

