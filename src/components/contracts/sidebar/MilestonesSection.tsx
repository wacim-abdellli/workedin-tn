import { CheckCircle, Clock, Timer } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { WorkspaceModel, RoleTheme } from './types';
import { fmtAmount, labelClass } from './SidebarSharedComponents';

export function MilestonesTab({ model, _userRole }: { model: WorkspaceModel; rt: RoleTheme; _userRole: 'client' | 'freelancer'; onAcceptMilestone?: (id: string) => void; onHoldMilestoneClearance?: (id: string) => void }) {
    const { tx } = useTranslation();
    const milestones = model.milestones ?? [];

    return (
        <section className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-5 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-zinc-805/50 pb-4">
                <div>
                    <p className={labelClass}>{tx('contract.tabs.milestones')}</p>
                    <h3 className="text-[16px] font-bold text-zinc-100 mt-0.5">{tx('contract.status.inProgress')}</h3>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[14px] font-black text-white">{model.progressPct}%</span>
                    <div className="w-16 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${model.progressPct}%` }} />
                    </div>
                </div>
            </div>

            {milestones.length > 0 ? (
                <div className="space-y-5">
                    {milestones.map((m, idx) => {
                        const isCompleted = ['completed', 'approved', 'paid'].includes(m.status.toLowerCase());
                        const isCurrent = !isCompleted && (idx === 0 || ['completed', 'approved', 'paid'].includes(milestones[idx - 1].status.toLowerCase()));

                        return (
                            <div key={m.id} className="relative ps-8">
                                {/* Connector */}
                                {idx !== milestones.length - 1 && (
                                    <div className="absolute start-[11px] top-6 bottom-[-20px] w-px bg-zinc-800" />
                                )}

                                {/* Icon */}
                                <div className={`absolute start-0 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center z-10 transition-all duration-300 ${
                                    isCompleted 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                        : isCurrent 
                                            ? 'bg-[var(--color-status-warning)]/10 border-[var(--color-status-warning)]/30 text-[var(--color-status-warning)] shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                                }`}>
                                    {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between gap-4">
                                        <h4 className={`text-[13px] font-bold transition-colors ${isCompleted ? 'text-zinc-400' : 'text-zinc-100'}`}>{m.title}</h4>
                                        <span className="text-[12px] font-black text-white">{fmtAmount(m.amount)}</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">{m.description}</p>
                                    
                                    {/* Sub-status labels */}
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                                            isCompleted 
                                                ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/70' 
                                                : 'bg-zinc-950/40 border-zinc-800 text-zinc-500'
                                        }`}>
                                            {m.status}
                                        </span>
                                        {m.due_date && (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                                                <Timer className="h-3 w-3" />
                                                {new Date(m.due_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-4 text-center">
                    <p className="text-[12px] text-zinc-500 italic">{tx('contract.files.noFiles')}</p>
                </div>
            )}

            {/* Total Footer */}
            <div className="mt-2 pt-5 border-t border-zinc-805/50 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{tx('contract.amount')}</span>
                <span className="text-[18px] font-black text-white">{fmtAmount(model.totalAmount)}</span>
            </div>
        </section>
    );
}
