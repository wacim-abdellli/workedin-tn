import { useFormContext } from 'react-hook-form';
import { DollarSign, Clock, Calendar, TrendingUp } from 'lucide-react';
import Input from '../ui/Input';
import { useTranslation } from '../../i18n';

export default function StepBudget() {
    const { register, watch, formState: { errors } } = useFormContext();
    const { tx } = useTranslation();
    const jobType = watch('job_type');
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{
                        borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, transparent)',
                        background: 'color-mix(in srgb, var(--workspace-primary) 12%, var(--card-bg))',
                        color: 'var(--workspace-primary)',
                    }}
                >
                    <DollarSign className="w-3.5 h-3.5" />
                    {tx('jobs.new.stepBudget.badge', undefined, 'Pricing setup')}
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#171420] dark:text-white">
                    {tx('jobs.new.stepBudget.title', undefined, 'الميزانية والمدة')}
                </h3>
                <p className="max-w-3xl text-sm leading-7 text-[#5c5971] dark:text-[#aca9bd] sm:text-base">
                    {tx('jobs.new.stepBudget.subtitle', undefined, 'حدد طريقة الدفع المناسبة وميزانية المشروع')}
                </p>
            </div>

            {/* Job Type */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={`
                    cursor-pointer rounded-[1.7rem] border-2 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-30px_var(--workspace-primary-shadow,rgba(109,40,217,0.28))]
                    ${jobType === 'fixed_price'
                        ? 'border-[color:var(--brand-accent)]/40 bg-[color:var(--brand-accent)]/12 ring-1 ring-[color:var(--brand-accent)]/30 shadow-[0_20px_40px_-30px_rgba(245,158,11,0.35)]'
                            : 'border-border bg-[var(--card-bg)] hover:border-[color:var(--brand-accent)]/24 hover:bg-[color:var(--brand-accent)]/8'
                    }
                `}>
                    <input
                        type="radio"
                        value="fixed_price"
                        {...register('job_type')}
                        className="sr-only"
                    />
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`rounded-lg p-2 ${jobType === 'fixed_price' ? 'bg-[color:var(--brand-accent)]/18 text-[color:var(--brand-accent)]' : 'bg-[var(--surface-bg)] text-[var(--text-muted)]'}`}>
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{tx('jobs.new.stepBudget.fixedPrice', undefined, 'سعر ثابت')}</span>
                    </div>
                    <p className="pe-14 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {tx('jobs.new.stepBudget.fixedPriceDescription', undefined, 'ادفع مبلغاً ثابتاً للمشروع بالكامل عند اكتماله.')}
                    </p>
                </label>

                <label className={`
                    cursor-pointer rounded-[1.7rem] border-2 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-30px_var(--workspace-primary-shadow,rgba(109,40,217,0.28))]
                    ${jobType === 'hourly'
                        ? 'border-[color:var(--brand-accent)]/40 bg-[color:var(--brand-accent)]/12 ring-1 ring-[color:var(--brand-accent)]/30 shadow-[0_20px_40px_-30px_rgba(245,158,11,0.35)]'
                            : 'border-border bg-[var(--card-bg)] hover:border-[color:var(--brand-accent)]/24 hover:bg-[color:var(--brand-accent)]/8'
                    }
                `}>
                    <input
                        type="radio"
                        value="hourly"
                        {...register('job_type')}
                        className="sr-only"
                    />
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`rounded-lg p-2 ${jobType === 'hourly' ? 'bg-[color:var(--brand-accent)]/18 text-[color:var(--brand-accent)]' : 'bg-[var(--surface-bg)] text-[var(--text-muted)]'}`}>
                            <Clock className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{tx('jobs.new.stepBudget.hourly', undefined, 'بالساعة')}</span>
                    </div>
                    <p className="pe-14 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {tx('jobs.new.stepBudget.hourlyDescription', undefined, 'ادفع للمستقل بناءً على عدد ساعات العمل.')}
                    </p>
                </label>
            </div>

            {/* Budget Inputs */}
            <div
                className="rounded-[1.8rem] border p-6 shadow-sm"
                style={{
                    borderColor: 'color-mix(in srgb, var(--brand-accent) 18%, var(--border))',
                    background: 'linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 94%, var(--page-bg)), color-mix(in srgb, var(--surface-bg) 90%, var(--page-bg)))',
                    boxShadow: '0 24px 60px -48px rgba(15,23,42,0.42)',
                }}
            >
                {jobType === 'fixed_price' ? (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tx('jobs.new.stepBudget.estimatedBudget', undefined, 'ميزانية المشروع التقديرية (د.ت)')}</label>
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
                            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tx('jobs.new.stepBudget.hourlyRate', undefined, 'السعر بالساعة (د.ت)')}</label>
                            <Input
                                placeholder={tx('jobs.new.stepBudget.hourlyRateExample', undefined, 'مثال: 20')}
                                type="number"
                                {...register('hourly_rate', { valueAsNumber: true })}
                                error={errors.hourly_rate?.message as string}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tx('jobs.new.stepBudget.weeklyHours', undefined, 'الساعات المتوقعة أسبوعياً')}</label>
                            <Input
                                placeholder={tx('jobs.new.stepBudget.weeklyHoursExample', undefined, 'مثال: 20')}
                                type="number"
                                {...register('estimated_hours', { valueAsNumber: true })}
                                error={errors.estimated_hours?.message as string}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-3 rounded-[1.6rem] border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-28px_rgba(15,23,42,0.34)]" style={{ borderColor: 'color-mix(in srgb, var(--brand-accent) 16%, var(--border))', background: 'color-mix(in srgb, var(--card-bg) 94%, var(--page-bg))' }}>
                    <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        <Calendar className="h-5 w-5 text-[color:var(--text-muted)]" />
                        {tx('jobs.new.stepBudget.duration', undefined, 'مدة المشروع')}
                    </label>
                    <select
                        {...register('duration')}
                        className="w-full appearance-none rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100 dark:text-white transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:border-gray-800 dark:bg-[var(--color-bg-muted)] dark:text-white"
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

                <div className="space-y-3 rounded-[1.6rem] border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-28px_rgba(15,23,42,0.34)]" style={{ borderColor: 'color-mix(in srgb, var(--brand-accent) 16%, var(--border))', background: 'color-mix(in srgb, var(--card-bg) 94%, var(--page-bg))' }}>
                    <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        <Calendar className="h-5 w-5 text-[color:var(--text-muted)]" />
                        {tx('jobs.new.stepBudget.deadline', undefined, 'الموعد النهائي')}
                    </label>
                    <Input
                        type="date"
                        min={today}
                        {...register('deadline')}
                        error={errors.deadline?.message as string}
                    />
                </div>

                <div className="space-y-3 rounded-[1.6rem] border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-28px_rgba(15,23,42,0.34)]" style={{ borderColor: 'color-mix(in srgb, var(--brand-accent) 16%, var(--border))', background: 'color-mix(in srgb, var(--card-bg) 94%, var(--page-bg))' }}>
                    <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        <TrendingUp className="h-5 w-5 text-[color:var(--text-muted)]" />
                        {tx('jobs.new.stepBudget.experienceLevel', undefined, 'مستوى الخبرة المطلوب')}
                    </label>
                    <div className="grid gap-2">
                        <label className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2.5 cursor-pointer" style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
                            <input type="radio" value="beginner" {...register('experience_level')} className="text-[color:var(--brand-accent)] focus:ring-[color:var(--brand-accent)]" />
                            <span style={{ color: 'var(--text-secondary)' }}>{tx('jobs.new.stepBudget.beginner', undefined, 'مبتدئ (Beginner)')}</span>
                        </label>
                        <label className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2.5 cursor-pointer" style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
                            <input type="radio" value="intermediate" {...register('experience_level')} className="text-[color:var(--brand-accent)] focus:ring-[color:var(--brand-accent)]" />
                            <span style={{ color: 'var(--text-secondary)' }}>{tx('jobs.new.stepBudget.intermediate', undefined, 'متوسط (Intermediate)')}</span>
                        </label>
                        <label className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2.5 cursor-pointer" style={{ borderColor: 'var(--border)', background: 'var(--card-bg)' }}>
                            <input type="radio" value="expert" {...register('experience_level')} className="text-[color:var(--brand-accent)] focus:ring-[color:var(--brand-accent)]" />
                            <span style={{ color: 'var(--text-secondary)' }}>{tx('jobs.new.stepBudget.expert', undefined, 'خبير (Expert)')}</span>
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
