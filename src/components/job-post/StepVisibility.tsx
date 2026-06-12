import { useFormContext } from 'react-hook-form';
import { Lock, Globe, Users, Check } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function StepVisibility() {
    const { register, watch } = useFormContext();
    const { tx } = useTranslation();
    const visibility = watch('visibility');

    return (
        <div className="space-y-6">
            {/* Visibility Mode Selection Grid */}
            <section className="grid gap-4 sm:grid-cols-2">
                <label
                    className={`relative cursor-pointer rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between h-full group ${
                        visibility === 'public'
                            ? 'border-workspace-primary/50 bg-workspace-primary/5 shadow-[0_0_20px_color-mix(in_srgb,var(--workspace-primary)_12%,transparent)]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                >
                    <input type="radio" value="public" {...register('visibility')} className="sr-only" />
                    <div className="flex items-start gap-4">
                        <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                            visibility === 'public'
                                ? 'bg-workspace-primary text-white shadow-[0_0_15px_var(--workspace-shadow)]'
                                : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'
                        }`}>
                            <Globe className="h-5.5 w-5.5" />
                        </span>
                        <div className="space-y-1">
                            <p className={`text-base font-bold transition-colors ${
                                visibility === 'public' ? 'text-workspace-primary' : 'text-white'
                            }`}>
                                {tx('jobs.new.stepVisibility.publicTitle', undefined, 'Public')}
                            </p>
                            <p className="text-xs leading-relaxed text-gray-400">
                                {tx('jobs.new.stepVisibility.publicDescription', undefined, 'All freelancers can view this project and submit proposals. Best for maximum bidding and speed.')}
                            </p>
                        </div>
                    </div>
                    {visibility === 'public' && (
                        <div className="absolute top-4 right-4 h-5.5 w-5.5 rounded-full bg-workspace-primary flex items-center justify-center shadow-lg">
                            <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />
                        </div>
                    )}
                </label>

                <label
                    className={`relative cursor-pointer rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between h-full group ${
                        visibility === 'invite_only'
                            ? 'border-workspace-primary/50 bg-workspace-primary/5 shadow-[0_0_20px_color-mix(in_srgb,var(--workspace-primary)_12%,transparent)]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                >
                    <input type="radio" value="invite_only" {...register('visibility')} className="sr-only" />
                    <div className="flex items-start gap-4">
                        <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                            visibility === 'invite_only'
                                ? 'bg-workspace-primary text-white shadow-[0_0_15px_var(--workspace-shadow)]'
                                : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'
                        }`}>
                            <Lock className="h-5.5 w-5.5" />
                        </span>
                        <div className="space-y-1">
                            <p className={`text-base font-bold transition-colors ${
                                visibility === 'invite_only' ? 'text-workspace-primary' : 'text-white'
                            }`}>
                                {tx('jobs.new.stepVisibility.inviteOnlyTitle', undefined, 'Invite Only')}
                            </p>
                            <p className="text-xs leading-relaxed text-gray-400">
                                {tx('jobs.new.stepVisibility.inviteOnlyDescription', undefined, 'Only freelancers you manually invite can view and apply to this project. Best for sensitive details or direct hires.')}
                            </p>
                        </div>
                    </div>
                    {visibility === 'invite_only' && (
                        <div className="absolute top-4 right-4 h-5.5 w-5.5 rounded-full bg-workspace-primary flex items-center justify-center shadow-lg">
                            <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />
                        </div>
                    )}
                </label>
            </section>

            {/* Visibility Tip Banner Callout */}
            <section className="flex gap-4 rounded-2xl border border-workspace-primary/15 bg-workspace-primary/[0.02] p-5 text-sm text-gray-300">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-workspace-primary" />
                <div className="space-y-1">
                    <p className="font-bold text-white">{tx('jobs.new.stepVisibility.tipTitle', undefined, 'Pro tip:')}</p>
                    <p className="text-xs leading-relaxed text-gray-400">
                        {tx('jobs.new.stepVisibility.tipDescription', undefined, 'Choose Public if you want competitive rates and quick applications. Choose Invite Only if you already have candidates in mind or want to keep your project brief hidden from general search results.')}
                    </p>
                </div>
            </section>
        </div>
    );
}
