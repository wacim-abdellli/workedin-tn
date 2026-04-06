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
                <div
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{
                        borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, transparent)',
                        background: 'color-mix(in srgb, var(--workspace-primary) 12%, var(--card-bg))',
                        color: 'var(--workspace-primary)',
                    }}
                >
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
                <label className={`cursor-pointer rounded-[1.8rem] border-2 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-30px_rgba(245,158,11,0.28)] ${visibility === 'public' ? 'border-[color:var(--workspace-primary)]/45 bg-[color:var(--workspace-primary)]/12 ring-1 ring-[color:var(--workspace-primary)]/30 shadow-[0_20px_40px_-30px_rgba(245,158,11,0.35)]' : 'border-border bg-[var(--card-bg)] hover:border-[color:var(--workspace-primary)]/24 hover:bg-[color:var(--workspace-primary)]/8'}`}>
                    <input type="radio" value="public" {...register('visibility')} className="sr-only" />
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`rounded-lg p-2 ${visibility === 'public' ? 'bg-[color:var(--workspace-primary)]/18 text-[color:var(--workspace-primary)]' : 'bg-[var(--surface-bg)] text-[var(--text-muted)]'}`}>
                            <Globe className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{tx('jobs.new.stepVisibility.publicTitle', undefined, 'عام للجميع')}</span>
                    </div>
                    <p className="pe-14 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {tx('jobs.new.stepVisibility.publicDescription', undefined, 'يمكن لجميع المستقلين رؤية الوظيفة وتقديم عروضهم. الخيار الأفضل للحصول على أكبر عدد من العروض.')}
                    </p>
                </label>

                <label className={`cursor-pointer rounded-[1.8rem] border-2 p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-30px_rgba(245,158,11,0.28)] ${visibility === 'invite_only' ? 'border-[color:var(--workspace-primary)]/45 bg-[color:var(--workspace-primary)]/12 ring-1 ring-[color:var(--workspace-primary)]/30 shadow-[0_20px_40px_-30px_rgba(245,158,11,0.35)]' : 'border-border bg-[var(--card-bg)] hover:border-[color:var(--workspace-primary)]/24 hover:bg-[color:var(--workspace-primary)]/8'}`}>
                    <input type="radio" value="invite_only" {...register('visibility')} className="sr-only" />
                    <div className="flex items-center gap-4 mb-2">
                        <div className={`rounded-lg p-2 ${visibility === 'invite_only' ? 'bg-[color:var(--workspace-primary)]/18 text-[color:var(--workspace-primary)]' : 'bg-[var(--surface-bg)] text-[var(--text-muted)]'}`}>
                            <Lock className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{tx('jobs.new.stepVisibility.inviteOnlyTitle', undefined, 'دعوة فقط')}</span>
                    </div>
                    <p className="pe-14 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {tx('jobs.new.stepVisibility.inviteOnlyDescription', undefined, 'لن تظهر الوظيفة في البحث. فقط المستقلون الذين تقوم بدعوتهم يمكنهم تقديم العروض.')}
                    </p>
                </label>
            </div>

            <div
                className="flex gap-3 rounded-[1.6rem] border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-28px_var(--workspace-primary-shadow,rgba(109,40,217,0.22))]"
                style={{
                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, transparent)',
                    background: 'color-mix(in srgb, var(--workspace-primary) 10%, var(--card-bg))',
                }}
            >
                <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--workspace-primary)]" />
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <p className="font-bold mb-1">{tx('jobs.new.stepVisibility.tipTitle', undefined, 'نصيحة:')}</p>
                    <p>
                        {tx('jobs.new.stepVisibility.tipDescription', undefined, 'إذا كنت تبحث عن مهارات نادرة أو لديك مشروع حساس، فإن خيار "دعوة فقط" يمنحك تحكماً أكبر. أما للمشاريع العامة، فإن "عام للجميع" يضمن لك تنافسية أفضل في الأسعار.')}
                    </p>
                </div>
            </div>
        </div>
    );
}
