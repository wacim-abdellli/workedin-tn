import { CheckCircle, Lock, Timer, GitPullRequest, Clock, MessageSquare, Check, ShieldAlert, AlertCircle, PackageCheck } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useCountdown } from './useCountdown';
import { fmtAmount, fmtDate, roleTheme, focusRing, labelClass, type RoleTheme } from './contractUtils';
import { GhostButton, DangerButton, PartyAvatar } from './sidebarPrimitives';
import type { WorkspaceModel } from './types';

interface ActionProps {
    model: WorkspaceModel;
    rt: RoleTheme;
    isActionLoading?: boolean;
    onDeliver: () => void;
    onRequestChanges: () => void;
    onAcceptAndPay: () => void;
    onDispute: () => void;
    onCancel?: () => void;
    onFundEscrow?: () => void;
    onReview: () => void;
}

export function CompletedSummary({ model, rt: _rt, onReview }: { model: WorkspaceModel; rt: RoleTheme; onReview: () => void }) {
    const { tx } = useTranslation();
    return (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                    <CheckCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className={labelClass}>{tx('pages.messages.contractDetails.contractStatus')}</p>
                    <h3 className="mt-1 text-[15px] font-bold text-white">
                        {tx('pages.messages.contractDetails.amountReleased', { amount: fmtAmount(model.amount) })}
                    </h3>
                    <div className="mt-1.5 flex flex-col gap-1 text-[12px] text-zinc-400">
                        {model.fundedAt && <p>{tx('pages.messages.contractDetails.escrowFunded')} {fmtDate(model.fundedAt)}</p>}
                        {model.deliverySubmittedAt && <p>{tx('pages.messages.contractDetails.deliverySubmitted')} {fmtDate(model.deliverySubmittedAt)}</p>}
                    </div>
                </div>
                <span className="rounded-full border border-zinc-750 bg-zinc-850 px-2.5 py-0.5 text-[10px] font-mono text-zinc-350">
                    {tx('pages.messages.contractDetails.revUsed', { used: model.revUsed, max: model.revMax })}
                </span>
            </div>
            {model.showLeaveReview ? (
                <div className="mt-3 flex justify-end">
                    <button type="button" onClick={onReview} className="text-[12px] font-semibold text-zinc-400 hover:text-white underline transition-colors">
                        {tx('pages.messages.contractDetails.leaveReviewLink')}
                    </button>
                </div>
            ) : null}
        </section>
    );
}

export function ContractPulse({ model, rt: _rt, userRole, onGoToMessages, _isSidebar = false }: { model: WorkspaceModel; rt: RoleTheme; userRole: 'client' | 'freelancer'; onGoToMessages?: () => void; _isSidebar?: boolean }) {
    const { tx } = useTranslation();
    if (!model.otherParty) return null;
    return (
        <section className="flex flex-col gap-3">
            <div className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-4 flex flex-col gap-3.5">
                <div className="flex items-center gap-3">
                    <PartyAvatar party={model.otherParty} size="md" />
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            {userRole === 'client' ? tx('auth.accountPanel.freelancerLabel') : tx('auth.accountPanel.clientLabel')}
                        </p>
                        <h4 className="mt-0.5 truncate text-[14px] font-semibold text-zinc-100">
                            {model.otherParty.full_name || tx('pages.messages.contractDetails.counterparty')}
                        </h4>
                    </div>
                </div>
                {onGoToMessages && (
                    <button
                        type="button"
                        onClick={onGoToMessages}
                        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-zinc-700 bg-transparent py-2 text-[12px] font-medium text-zinc-350 transition-all hover:bg-zinc-800 hover:text-white ${focusRing}`}
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {tx('pages.messages.contractDetails.sendMessage')}
                    </button>
                )}
            </div>
        </section>
    );
}

export function ReviewCountdown({ targetIso }: { targetIso: string }) {
    const { tx } = useTranslation();
    const tick = useCountdown(targetIso);
    if (!tick || tick.expired) return (
        <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-red-950/20 bg-red-950/5 px-2.5 py-1">
            <Timer className="h-3.5 w-3.5 text-red-400" />
            <span className="text-[12px] font-medium text-red-400">{tx('pages.messages.contractDetails.reviewPeriodExpired')}</span>
        </div>
    );
    return (
        <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-amber-950/20 bg-amber-950/5 px-2.5 py-1">
            <Timer className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[12px] font-medium text-amber-500">
                {tx('pages.messages.contractDetails.reviewDue', { days: tick.days, hours: tick.hours, minutes: tick.minutes })}
            </span>
        </div>
    );
}

export function EscrowLifecycleStepper({ model, paymentStatus }: { model: WorkspaceModel; paymentStatus: string }) {
    const { tx } = useTranslation();
    const isFunded = model.isEscrowFunded;
    const isSubmitted = model.st === 'delivery_submitted' || model.st === 'revision_requested' || model.st === 'completed' || model.st === 'disputed';
    const isReleased = paymentStatus === 'released';

    const step1Status = 'completed' as const;
    const step2Status = isFunded ? 'completed' as const : 'active' as const;
    const step3Status = isSubmitted ? 'completed' as const : (isFunded ? 'active' as const : 'pending' as const);
    const step4Status = isReleased ? 'completed' as const : (isSubmitted ? 'active' as const : 'pending' as const);

    const getStepClasses = (status: 'completed' | 'active' | 'pending') => {
        if (status === 'completed') return {
            bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
            text: 'text-zinc-300 font-semibold',
            line: 'bg-emerald-500/40',
            icon: <Check className="w-3.5 h-3.5" />
        };
        if (status === 'active') return {
            bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse',
            text: 'text-white font-bold',
            line: 'bg-zinc-800',
            icon: <Clock className="w-3.5 h-3.5" />
        };
        return {
            bg: 'bg-zinc-900 border-zinc-800 text-zinc-500',
            text: 'text-zinc-500',
            line: 'bg-zinc-850',
            icon: <Lock className="w-3 h-3" />
        };
    };

    const s1 = getStepClasses(step1Status);
    const s2 = getStepClasses(step2Status);
    const s3 = getStepClasses(step3Status);
    const s4 = getStepClasses(step4Status);

    return (
        <section className="border border-zinc-805 bg-zinc-900/30 rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{tx('pages.messages.contractDetails.escrowProtection')}</h3>
            <div className="flex flex-col gap-4 relative pl-7">
                <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-zinc-800">
                    <div className="absolute top-0 bottom-0 w-full bg-emerald-500/40 transition-all duration-300" style={{
                        height: isReleased ? '100%' : (isSubmitted ? '66%' : (isFunded ? '33%' : '0%'))
                    }} />
                </div>
                <div className="flex items-center gap-3 relative">
                    <div className={`absolute -left-7 w-6 h-6 rounded-full border flex items-center justify-center ${s1.bg}`}>{s1.icon}</div>
                    <span className={`text-[12px] ${s1.text}`}>{tx('pages.messages.contractDetails.stepHired')}</span>
                </div>
                <div className="flex items-center gap-3 relative">
                    <div className={`absolute -left-7 w-6 h-6 rounded-full border flex items-center justify-center ${s2.bg}`}>{s2.icon}</div>
                    <span className={`text-[12px] ${s2.text}`}>{tx('pages.messages.contractDetails.stepFunded')}</span>
                </div>
                <div className="flex items-center gap-3 relative">
                    <div className={`absolute -left-7 w-6 h-6 rounded-full border flex items-center justify-center ${s3.bg}`}>{s3.icon}</div>
                    <span className={`text-[12px] ${s3.text}`}>{tx('pages.messages.contractDetails.stepDelivered')}</span>
                </div>
                <div className="flex items-center gap-3 relative">
                    <div className={`absolute -left-7 w-6 h-6 rounded-full border flex items-center justify-center ${s4.bg}`}>{s4.icon}</div>
                    <span className={`text-[12px] ${s4.text}`}>
                        {isReleased ? tx('pages.messages.contractDetails.stepPaymentCleared') : tx('pages.messages.contractDetails.stepPaymentApproved')}
                    </span>
                </div>
            </div>
        </section>
    );
}

export function NextMoveCard({ model, rt: _rt, userRole: _userRole, isActionLoading, onDeliver, onAcceptAndPay, onRequestChanges, onDispute, onCancel, onFundEscrow, onReview }: ActionProps & { userRole: 'client' | 'freelancer' }) {
    const { tx } = useTranslation();
    const isPendingEscrow = model.st === 'pending_payment' && !model.isEscrowFunded && model.nextMove.primaryLabel === tx('pages.messages.contractDetails.fundEscrowLabel');
    const action = isPendingEscrow ? undefined
        : model.showFreelancerDeliver || (model.st === 'pending_payment' && model.isEscrowFunded && model.nextMove.primaryLabel) ? onDeliver
        : (model.showClientReview && model.reviewFiles.length === 0 && model.reviewLinks.length === 0) ? onAcceptAndPay
        : model.showLeaveReview ? onReview
        : null;

    const showSecondaryActions = model.showClientReview && model.reviewFiles.length === 0 && model.reviewLinks.length === 0;

    return (
        <section className="border border-zinc-800 bg-zinc-900/30 rounded-xl flex flex-col gap-0 overflow-hidden relative">
            <div className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        {tx('pages.messages.contractDetails.workspaceControl')}
                    </span>
                </div>
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                        <span className="[&>svg]:h-5 [&>svg]:w-5">{model.nextMove.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-[16px] font-semibold leading-snug text-zinc-100">{model.nextMove.title}</h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">{model.nextMove.body}</p>
                    </div>
                </div>
                {model.st === 'revision_requested' && model.lastRevisionNote && (
                    <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 pl-4 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-500">{tx('pages.messages.contractDetails.revisionFeedback')}</p>
                        <p className="text-[13px] text-zinc-300 whitespace-pre-wrap leading-relaxed">{model.lastRevisionNote}</p>
                    </div>
                )}
                {model.showClientReview && model.reviewDueAt && (
                    <div className="mt-2">
                        <ReviewCountdown targetIso={model.reviewDueAt} />
                    </div>
                )}
                {model.st === 'pending_payment' && model.isEscrowFunded && (
                    <div className="mt-2 flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span className="text-[12px] font-medium text-emerald-500">{tx('pages.messages.contractDetails.escrowSecured')}</span>
                    </div>
                )}
                {isPendingEscrow && (
                    <div className="mt-2 flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span className="text-[12px] font-medium text-amber-500">{tx('pages.messages.contractDetails.escrowUnfunded')}</span>
                    </div>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 bg-zinc-950/20 px-5 py-3.5">
                {action && model.nextMove.primaryLabel ? (
                    <button type="button" onClick={action} disabled={Boolean(isActionLoading)}
                        className={`rounded-full px-5 py-2 text-[12px] font-semibold transition-all duration-150 disabled:opacity-60 shadow-md bg-emerald-600 hover:bg-emerald-500 text-white ${focusRing}`}>
                        {isActionLoading ? tx('pages.messages.contractDetails.processing') : model.nextMove.primaryLabel}
                    </button>
                ) : isPendingEscrow ? (
                    <button type="button" onClick={() => onFundEscrow?.()}
                        className={`rounded-full px-5 py-2 text-[12px] font-semibold transition-all duration-150 shadow-md bg-emerald-600 hover:bg-emerald-500 text-white ${focusRing}`}>
                        {tx('pages.messages.contractDetails.fundEscrowNow')}
                    </button>
                ) : null}
                {showSecondaryActions && (
                    <GhostButton
                        onClick={onRequestChanges}
                        disabled={isActionLoading || model.revLeft <= 0}
                        icon={<GitPullRequest className="h-3.5 w-3.5" />}
                        label={model.revLeft <= 0 ? tx('pages.messages.contractDetails.limitReached') : tx('pages.messages.contractDetails.requestRevisionLeft', { count: model.revLeft })}
                    />
                )}
                {model.canDispute && (
                    <DangerButton onClick={onDispute} disabled={Boolean(isActionLoading)} icon={<ShieldAlert className="h-3.5 w-3.5" />} label={tx('pages.messages.contractDetails.dispute')} />
                )}
                {(model.st === 'pending_payment' || model.st === 'active') && onCancel && (
                    <GhostButton
                        onClick={onCancel}
                        disabled={Boolean(isActionLoading)}
                        icon={<AlertCircle className="h-3.5 w-3.5" />}
                        label={tx('common.cancel')}
                    />
                )}
                <button type="button" onClick={() => document.getElementById('workspace-activity-log')?.scrollIntoView({ behavior: 'smooth' })}
                    className={`ml-auto rounded-full px-3 py-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:text-zinc-200 ${focusRing}`}>
                    {tx('pages.messages.contractDetails.historyLink')}
                </button>
            </div>
        </section>
    );
}
