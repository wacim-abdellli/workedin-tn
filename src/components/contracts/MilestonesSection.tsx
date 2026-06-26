import { useTranslation } from '@/i18n';
import { CheckCircle, GitPullRequest } from 'lucide-react';
import { CountdownTimer } from '../ui';
import { ns, fmtDate, fmtAmount, labelClass, type RoleTheme } from './contractUtils';
import { CompactEmpty } from './sidebarPrimitives';
import type { WorkspaceModel } from './types';

export function MilestonesTab({
    model,
    userRole,
    onAcceptMilestone,
    onHoldMilestoneClearance,
}: {
    model: WorkspaceModel;
    rt: RoleTheme;
    userRole: 'client' | 'freelancer';
    onAcceptMilestone?: (milestoneId: string) => Promise<void>;
    onHoldMilestoneClearance?: (milestoneId: string) => void;
}) {
    const { tx } = useTranslation();
    const escrowPhases = [
        {
            key: 'funded',
            label: tx('pages.messages.contractDetails.escrowFundedPhase'),
            sub: tx('pages.messages.contractDetails.escrowFundedSub'),
            done: model.isEscrowFunded || ['active', 'delivery_submitted', 'revision_requested', 'completed'].includes(model.st),
        },
        {
            key: 'active',
            label: tx('pages.messages.contractDetails.workInProgressPhase'),
            sub: tx('pages.messages.contractDetails.workInProgressSub'),
            done: ['active', 'delivery_submitted', 'revision_requested', 'completed'].includes(model.st),
        },
        {
            key: 'submitted',
            label: tx('pages.messages.contractDetails.deliverySubmittedPhase'),
            sub: tx('pages.messages.contractDetails.deliverySubmittedSub'),
            done: ['delivery_submitted', 'revision_requested', 'completed'].includes(model.st) || model.st === 'revision_requested',
        },
        {
            key: 'approved',
            label: tx('pages.messages.contractDetails.clientApprovedPhase'),
            sub: tx('pages.messages.contractDetails.clientApprovedSub'),
            done: model.st === 'completed',
        },
        {
            key: 'released',
            label: tx('pages.messages.contractDetails.paymentReleasedPhase'),
            sub: tx('pages.messages.contractDetails.paymentReleasedSub'),
            done: model.st === 'completed',
        },
    ];

    const activeIndex = escrowPhases.filter(p => p.done).length - 1;

    return (
        <section className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-5 flex flex-col gap-4">
            <div className="border-b border-zinc-805/50 pb-3">
                <p className={labelClass}>{tx('pages.messages.contractDetails.milestones')}</p>
                <h3 className="text-[15px] font-bold text-white mt-0.5">{tx('pages.messages.contractDetails.escrowLifecycle')}</h3>
            </div>

            <div className="relative flex flex-col gap-6 pl-8 mt-2">
                <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-zinc-800" />

                {activeIndex >= 0 && (
                    <div
                        className="absolute left-2.5 top-2.5 w-0.5 bg-emerald-600 transition-all duration-500"
                        style={{ height: `${(activeIndex / (escrowPhases.length - 1)) * 100}%`, maxHeight: 'calc(100% - 20px)' }}
                    />
                )}

                {escrowPhases.map((phase, idx) => {
                    const done = phase.done;
                    const isCurrent = idx === activeIndex + 1;
                    return (
                        <div key={phase.key} className="relative flex items-start gap-4">
                            <div className={`absolute -start-[30px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                done
                                    ? 'bg-emerald-600 border-transparent text-white'
                                    : isCurrent
                                    ? 'border-emerald-600 bg-[#0d0d11]'
                                    : 'border-zinc-700 bg-[#0d0d11]'
                            } transition-all duration-300`}>
                                {done && <CheckCircle className="h-3 w-3 text-white" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-[13px] font-bold ${done ? 'text-zinc-100' : isCurrent ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                        {phase.label}
                                    </p>
                                    {done && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">
                                            {tx('pages.messages.contractDetails.completed')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-zinc-400 mt-0.5">{phase.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {model.milestones.length > 0 ? (
                <div className="border-t border-zinc-805/50 pt-4 mt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">
                        {tx('pages.messages.contractDetails.contractMilestones', { done: model.completedMilestones, total: model.milestones.length })}
                    </p>
                    <div className="relative flex flex-col gap-4 pl-6">
                        <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-zinc-800" />
                        {model.milestones.map((milestone, index) => {
                            const mDone = ['completed', 'approved', 'paid'].includes(ns(milestone.status));
                            const title = milestone.title || milestone.description || tx('pages.messages.contractDetails.milestoneDefaultTitle', { index: index + 1 });
                            return (
                                <div key={milestone.id || index} className="relative flex items-start gap-3">
                                    <div className={`absolute -left-[24px] top-1.5 flex h-2 w-2 rounded-full border ${
                                        mDone
                                            ? 'bg-emerald-600 border-transparent'
                                            : 'border-zinc-750 bg-[#0d0d11]'
                                    }`} />
                                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                        <div>
                                            <p className={`text-[13px] font-bold ${mDone ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                                {title}
                                            </p>
                                            <p className="text-[11px] text-zinc-400 mt-0.5">
                                                {milestone.due_date ? `${tx('pages.messages.contractDetails.due')} ${fmtDate(milestone.due_date)}` : tx('pages.messages.contractDetails.noDueDate')}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[12px] font-semibold text-zinc-350">
                                                {fmtAmount(milestone.amount)}
                                            </span>

                                            {ns(milestone.status) === 'submitted' && userRole === 'client' && onAcceptMilestone ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onAcceptMilestone(milestone.id!)}
                                                    className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 text-[10px] font-bold transition-all shadow active:scale-95 cursor-pointer border-none"
                                                >
                                                    {tx('pages.messages.contractDetails.approve')}
                                                </button>
                                            ) : milestone.escrow_pending_clearance_until && new Date(milestone.escrow_pending_clearance_until).getTime() > Date.now() && !milestone.escrow_hold_disputed ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="border border-amber-500/20 bg-amber-500/5 text-amber-300 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider leading-none flex items-center gap-1">
                                                        {tx('pages.messages.contractDetails.holdPayout')} (<CountdownTimer targetDate={milestone.escrow_pending_clearance_until} className="text-amber-300 font-bold" /> {tx('common.time.left')})
                                                    </span>

                                                    {userRole === 'client' && onHoldMilestoneClearance && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onHoldMilestoneClearance(milestone.id!)}
                                                            className="rounded-full bg-red-600 hover:bg-red-500 text-white px-3 py-1 text-[10px] font-bold transition-all shadow active:scale-95 cursor-pointer border-none"
                                                        >
                                                            {tx('pages.messages.contractDetails.holdPayout')}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : milestone.escrow_hold_disputed ? (
                                                <span className="border border-red-500/20 bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                                    {tx('pages.messages.contractDetails.frozen')}
                                                </span>
                                            ) : (
                                                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                                    mDone ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-zinc-750 bg-zinc-850 text-zinc-400'
                                                }`}>
                                                    {mDone ? tx('pages.messages.contractDetails.paid') : milestone.status ? milestone.status : tx('pages.messages.contractDetails.pending')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="border-t border-zinc-805/50 pt-4 mt-2">
                    <CompactEmpty icon={<GitPullRequest className="h-3.5 w-3.5" />} title={tx('pages.messages.contractDetails.noCustomMilestones')} text={tx('pages.messages.contractDetails.noCustomMilestonesDesc')} />
                </div>
            )}
        </section>
    );
}
