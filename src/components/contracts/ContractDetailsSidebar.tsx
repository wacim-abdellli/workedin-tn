import { useMemo } from 'react';
import {
    Activity,
    CalendarDays,
    CheckCircle,
    CircleCheck,
    DollarSign,
    FileText,
    FolderOpen,
    ShieldAlert,
    Sparkles,
    User,
} from 'lucide-react';
import Button from '../ui/Button';
import { useTranslation } from '../../i18n';

interface ContractMilestone {
    id?: string | null;
    title?: string | null;
    description?: string | null;
    amount?: number | null;
    status?: string | null;
    due_date?: string | null;
}

interface ContractSharedFile {
    id: string;
    name: string;
    url: string;
    type?: string | null;
    size?: number | string | null;
    uploadedAt?: string | null;
    senderName?: string;
}

interface ContractSidebarData {
    amount: number | null;
    job?: {
        title?: string | null;
        deadline?: string | null;
    };
    milestones?: ContractMilestone[];
    sharedFiles?: ContractSharedFile[];
    freelancer?: {
        full_name?: string;
        avatar_url?: string | null;
    };
    client?: {
        full_name?: string;
        avatar_url?: string | null;
    };
}

interface ContractDetailsSidebarProps {
    contract: ContractSidebarData | null;
    userRole: 'client' | 'freelancer';
    currentStatus: string;
    deliverySubmitted?: boolean;
    isActionLoading?: boolean;
    onDeliver: () => void;
    onRequestChanges: () => void;
    onAcceptAndPay: () => void;
    onDispute: () => void;
    onReview: () => void;
    hasLeftReview: boolean;
    onOpenSharedFile?: (file: ContractSharedFile) => void;
}

const normalizeStatus = (status: string | null | undefined) => String(status || '').trim().toLowerCase();

const formatDate = (value: string | null | undefined, fallback: string) => {
    if (!value) return fallback;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return fallback;

    return parsed.toLocaleDateString();
};

const formatAttachmentSize = (size: number | string | null | undefined) => {
    if (size === null || size === undefined || size === '') return null;

    const bytes = typeof size === 'string' ? Number(size) : size;
    if (!Number.isFinite(bytes) || bytes <= 0) return null;

    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    const decimals = value >= 10 || unitIndex === 0 ? 0 : 1;
    return `${value.toFixed(decimals)} ${units[unitIndex]}`;
};

const formatAmount = (amount: number | null | undefined, currencyLabel: string) => {
    const numericAmount = Number(amount ?? 0);
    if (!Number.isFinite(numericAmount)) return `0 ${currencyLabel}`;

    const formatter = new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
    });

    return `${formatter.format(numericAmount)} ${currencyLabel}`;
};

const milestoneStatusMeta = (
    status: string | null | undefined,
    tx: (key: string, params?: Record<string, string | number>, fallback?: string) => string,
) => {
    const normalizedStatus = normalizeStatus(status);

    if (normalizedStatus === 'completed' || normalizedStatus === 'approved' || normalizedStatus === 'paid') {
        return {
            label: tx('contract.milestoneCompleted', undefined, 'Completed'),
            className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
        };
    }

    if (normalizedStatus === 'in_progress' || normalizedStatus === 'active') {
        return {
            label: tx('contract.milestoneInProgress', undefined, 'In progress'),
            className: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
        };
    }

    if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
        return {
            label: tx('contract.milestoneCancelled', undefined, 'Cancelled'),
            className: 'border-red-500/30 bg-red-500/10 text-red-200',
        };
    }

    return {
        label: tx('contract.pending', undefined, 'Pending'),
        className: 'border-[#4c3928] bg-[#20160f] text-[#e6c9a8]',
    };
};

export default function ContractDetailsSidebar({
    contract,
    userRole,
    currentStatus,
    deliverySubmitted = false,
    isActionLoading,
    onDeliver,
    onRequestChanges,
    onAcceptAndPay,
    onDispute,
    onReview,
    hasLeftReview,
    onOpenSharedFile,
}: ContractDetailsSidebarProps) {
    const { t, tx } = useTranslation();
    const contractText = (t as { contract?: Record<string, string> } | undefined)?.contract || {};

    const normalizedContractStatus = normalizeStatus(currentStatus);
    const milestones = contract?.milestones || [];
    const sharedFiles = contract?.sharedFiles || [];
    const otherParty = userRole === 'client' ? contract?.freelancer : contract?.client;

    const deadlineDeltaDays = useMemo(() => {
        if (!contract?.job?.deadline) return null;

        const dueTime = new Date(contract.job.deadline).getTime();
        if (Number.isNaN(dueTime)) return null;

        return Math.ceil((dueTime - Date.now()) / (1000 * 60 * 60 * 24));
    }, [contract?.job?.deadline]);

    const milestoneSummary = useMemo(() => {
        const completedStatuses = new Set(['completed', 'approved', 'paid']);
        let completed = 0;

        for (const milestone of milestones) {
            if (completedStatuses.has(normalizeStatus(milestone.status))) {
                completed += 1;
            }
        }

        return {
            total: milestones.length,
            completed,
            remaining: Math.max(milestones.length - completed, 0),
        };
    }, [milestones]);

    const nextMilestone = useMemo(() => {
        return milestones.find((milestone) => {
            const status = normalizeStatus(milestone.status);
            return status !== 'completed'
                && status !== 'approved'
                && status !== 'paid'
                && status !== 'cancelled'
                && status !== 'canceled';
        }) || null;
    }, [milestones]);

    const statusMeta = useMemo(() => {
        if (normalizedContractStatus === 'active') {
            return {
                chipClass: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
                label: contractText.inProgress || tx('contract.inProgress', undefined, 'In progress'),
            };
        }

        if (normalizedContractStatus === 'completed') {
            return {
                chipClass: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
                label: tx('contract.completed', undefined, 'Completed'),
            };
        }

        if (normalizedContractStatus === 'disputed') {
            return {
                chipClass: 'border-red-400/30 bg-red-500/10 text-red-200',
                label: contractText.disputeOpened || tx('contract.disputeOpened', undefined, 'Dispute opened'),
            };
        }

        if (normalizedContractStatus === 'revision_requested') {
            return {
                chipClass: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
                label: tx('contract.revisionRequested', undefined, 'Revision requested'),
            };
        }

        if (normalizedContractStatus === 'pending_payment') {
            return {
                chipClass: 'border-[#c48a39]/30 bg-[#c48a39]/10 text-[#f4cf93]',
                label: tx('contract.pendingPayment', undefined, 'Pending payment'),
            };
        }

        if (normalizedContractStatus === 'cancelled' || normalizedContractStatus === 'canceled') {
            return {
                chipClass: 'border-red-400/30 bg-red-500/10 text-red-200',
                label: tx('contract.cancelled', undefined, 'Cancelled'),
            };
        }

        return {
            chipClass: 'border-[#4b3c31] bg-[#1a1410] text-[#d5c4b5]',
            label: tx('contract.statusUnavailable', undefined, 'Status unavailable'),
        };
    }, [contractText.inProgress, contractText.disputeOpened, normalizedContractStatus, tx]);

    const amountLabel = formatAmount(contract?.amount, tx('dynamic_key_1524267', undefined, 'TND'));
    const noDueDateLabel = tx('pages.dashboard.freelancer.noDueDate', undefined, 'No due date');
    const timelinePrimaryLabel = formatDate(contract?.job?.deadline || null, noDueDateLabel);
    const timelineSecondaryLabel =
        deadlineDeltaDays === null
            ? tx('contract.timelineNoDeadlineHint', undefined, 'Timeline will update when a due date is set.')
            : deadlineDeltaDays > 0
                ? tx('contract.daysRemaining', { days: deadlineDeltaDays }, `${deadlineDeltaDays} days remaining`)
                : deadlineDeltaDays === 0
                    ? tx('contract.dueToday', undefined, 'Due today')
                    : tx('contract.overdueByDays', { days: Math.abs(deadlineDeltaDays) }, `Overdue by ${Math.abs(deadlineDeltaDays)} days`);

    const progressPct = milestoneSummary.total > 0
        ? Math.max(0, Math.min(100, Math.round((milestoneSummary.completed / milestoneSummary.total) * 100)))
        : 0;

    const statusDescription =
        normalizedContractStatus === 'active'
            ? tx('contract.statusActiveHint', undefined, 'Everything is live. Keep momentum with fast updates and clear deliverables.')
            : normalizedContractStatus === 'completed'
                ? tx('contract.statusCompletedHint', undefined, 'Contract is complete. You can still review outcomes and submitted files.')
                : normalizedContractStatus === 'disputed'
                    ? tx('contract.statusDisputedHint', undefined, 'This session is under dispute. Keep communication focused and factual.')
                    : normalizedContractStatus === 'revision_requested'
                        ? tx('contract.statusRevisionRequestedHint', undefined, 'A revision was requested. Use this workspace to share only the required updates.')
                        : normalizedContractStatus === 'pending_payment'
                            ? tx('contract.statusPendingPaymentHint', undefined, 'Payment confirmation is pending. Messaging stays open during processing.')
                            : normalizedContractStatus === 'cancelled' || normalizedContractStatus === 'canceled'
                                ? tx('contract.statusCancelledHint', undefined, 'Contract is cancelled. Historical details remain available below.')
                                : tx('contract.statusUnavailableHint', undefined, 'Status is temporarily unavailable. This chat is still available.');

    const nextFocus = useMemo(() => {
        if (normalizedContractStatus === 'active' && nextMilestone) {
            const title = nextMilestone.title
                || nextMilestone.description
                || tx('contract.nextMilestoneTitle', undefined, 'Upcoming milestone');
            const dueLabel = formatDate(nextMilestone.due_date, noDueDateLabel);

            return {
                label: tx('contract.nextFocus', undefined, 'Next focus'),
                title,
                description: nextMilestone.due_date
                    ? tx('contract.nextMilestoneDueHint', { date: dueLabel }, `Target ${dueLabel} and keep updates moving in chat.`)
                    : tx('contract.nextMilestoneHint', undefined, 'Use the thread for crisp updates, files, and decisions as this milestone moves forward.'),
            };
        }

        if (normalizedContractStatus === 'active' && userRole === 'freelancer') {
            return {
                label: tx('contract.nextFocus', undefined, 'Next focus'),
                title: deliverySubmitted
                    ? tx('contract.deliveryAwaitingReviewTitle', undefined, 'Delivery is waiting for review')
                    : tx('contract.prepareDeliveryTitle', undefined, 'Prepare your next delivery'),
                description: deliverySubmitted
                    ? tx('contract.deliveryAwaitingReviewHint', undefined, 'Stay available in chat for review notes and fast clarifications.')
                    : tx('contract.prepareDeliveryHint', undefined, 'Bundle files, summarize progress clearly, and keep the client warm with concise updates.'),
            };
        }

        if (normalizedContractStatus === 'revision_requested' && userRole === 'freelancer') {
            return {
                label: tx('contract.nextFocus', undefined, 'Next focus'),
                title: tx('contract.revisionUpdateTitle', undefined, 'Prepare and re-deliver the requested changes'),
                description: tx('contract.revisionUpdateHint', undefined, 'Address the requested updates directly, then deliver the revised work in this thread.'),
            };
        }

        if (normalizedContractStatus === 'revision_requested' && userRole === 'client') {
            return {
                label: tx('contract.nextFocus', undefined, 'Next focus'),
                title: tx('contract.awaitRevisionTitle', undefined, 'Waiting for revised delivery'),
                description: tx('contract.awaitRevisionHint', undefined, 'The freelancer is revising the work. You can approve or request another round after the next delivery.'),
            };
        }

        if (normalizedContractStatus === 'active' && userRole === 'client') {
            return {
                label: tx('contract.nextFocus', undefined, 'Next focus'),
                title: deliverySubmitted
                    ? tx('contract.reviewDeliveryTitle', undefined, 'Review the submitted delivery')
                    : tx('contract.awaitDeliveryTitle', undefined, 'Keep delivery expectations aligned'),
                description: deliverySubmitted
                    ? tx('contract.reviewDeliveryHint', undefined, 'Approve the work or request changes so the contract keeps momentum.')
                    : tx('contract.awaitDeliveryHint', undefined, 'Use the thread to confirm priorities, scope details, and files before the next handoff.'),
            };
        }

        return {
            label: tx('contract.workspacePulse', undefined, 'Workspace pulse'),
            title: tx('contract.timelineOverviewTitle', undefined, 'Everything important stays visible here'),
            description: tx('contract.timelineOverviewHint', undefined, 'Use this panel to track milestones, files, and the people driving the work forward.'),
        };
    }, [deliverySubmitted, nextMilestone, normalizedContractStatus, noDueDateLabel, tx, userRole]);

    const contactRoleLabel = userRole === 'client'
        ? tx('mobileNav.freelancer', undefined, 'Freelancer')
        : tx('mobileNav.client', undefined, 'Client');

    const contactHint = userRole === 'client'
        ? tx('contract.primaryContactFreelancerHint', undefined, 'Leading delivery and day-to-day execution on this workspace.')
        : tx('contract.primaryContactClientHint', undefined, 'Owns approvals, priorities, and project direction for this workspace.');

    const previewMilestones = milestones.slice(0, 3);
    const previewFiles = sharedFiles.slice(0, 4);

    if (!contract) return null;

    return (
        <div className="h-full overflow-y-auto bg-[linear-gradient(180deg,#090909_0%,#070605_100%)] p-5 text-white">
            <div className="space-y-5">
                <section className="overflow-hidden rounded-[30px] border border-[#30251d] bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_28%),linear-gradient(180deg,#15100c_0%,#0d0a08_100%)] shadow-[0_28px_70px_-45px_rgba(0,0,0,0.95)]">
                    <div className="border-b border-[#2b2119] px-5 py-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#4a3828] bg-[#120d09]">
                                {otherParty?.avatar_url ? (
                                    <img src={otherParty.avatar_url} alt={otherParty.full_name || 'User'} className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-6 w-6 text-[#b29982]" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] uppercase tracking-[0.18em] text-[#b89f88]">
                                        {tx('contract.workspaceTitle', undefined, 'Workspace')}
                                    </span>
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta.chipClass}`}>
                                        {statusMeta.label}
                                    </span>
                                </div>

                                <h2 className="mt-2 text-[24px] font-semibold leading-[1.15] text-[#fff6ed]">
                                    {contract.job?.title || tx('contract.untitledJob', undefined, 'Untitled job')}
                                </h2>

                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#d8c3af]">
                                    <span className="rounded-full border border-[#443327] bg-[#17110d] px-2.5 py-1">
                                        {otherParty?.full_name || tx('pages.messages.userFallback', undefined, 'User')}
                                    </span>
                                    <span className="rounded-full border border-[#443327] bg-[#17110d] px-2.5 py-1 text-[#f1ce9d]">
                                        {contactRoleLabel}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="mt-4 max-w-[34ch] text-sm leading-6 text-[#cbb4a0]">{statusDescription}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-[#2b2119]">
                        <div className="bg-[#0f0b08] px-5 py-4">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8d7663]">{tx('contract.amount', undefined, 'Amount')}</p>
                            <p className="mt-2 flex items-center gap-2 text-base font-semibold text-[#fff4e7]">
                                <DollarSign className="h-4 w-4 text-[#f0b35d]" />
                                {amountLabel}
                            </p>
                        </div>

                        <div className="bg-[#0f0b08] px-5 py-4">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8d7663]">{tx('contract.timeline', undefined, 'Timeline')}</p>
                            <p className="mt-2 flex items-center gap-2 text-base font-semibold text-[#fff4e7]">
                                <CalendarDays className="h-4 w-4 text-[#f0b35d]" />
                                {timelinePrimaryLabel}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#a8917d]">{timelineSecondaryLabel}</p>
                        </div>
                    </div>
                </section>

                <section className="space-y-5">
                    <div className="rounded-[28px] border border-[#261d17] bg-[#0d0a08] p-5 shadow-[0_22px_55px_-42px_rgba(0,0,0,0.95)]">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.16em] text-[#8d7663]">{nextFocus.label}</p>
                                <h3 className="mt-2 text-lg font-semibold text-[#fff4e7]">{nextFocus.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-[#c7b2a0]">{nextFocus.description}</p>
                            </div>
                            <div className="rounded-2xl border border-[#4c3928] bg-[#17110d] p-3 text-[#f0b35d]">
                                <Sparkles className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-[#31261d] bg-[#120d09] px-4 py-4">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-[#836c5a]">{tx('contract.progress', undefined, 'Progress')}</p>
                                <p className="mt-2 text-2xl font-semibold text-[#fff4e7]">{progressPct}%</p>
                                <p className="mt-1 text-[11px] text-[#a8917d]">{tx('contract.milestoneProgressLabel', { completed: milestoneSummary.completed, total: milestoneSummary.total }, `${milestoneSummary.completed} / ${milestoneSummary.total} milestones complete`)}</p>
                            </div>

                            <div className="rounded-2xl border border-[#31261d] bg-[#120d09] px-4 py-4">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-[#836c5a]">{tx('contract.milestones', undefined, 'Milestones')}</p>
                                <p className="mt-2 text-2xl font-semibold text-[#fff4e7]">{milestoneSummary.remaining}</p>
                                <p className="mt-1 text-[11px] text-[#a8917d]">{tx('contract.pending', undefined, 'Pending')} {tx('contract.milestones', undefined, 'Milestones').toLowerCase()}</p>
                            </div>

                            <div className="rounded-2xl border border-[#31261d] bg-[#120d09] px-4 py-4">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-[#836c5a]">{tx('contract.sharedFiles', undefined, 'Shared files')}</p>
                                <p className="mt-2 text-2xl font-semibold text-[#fff4e7]">{sharedFiles.length}</p>
                                <p className="mt-1 text-[11px] text-[#a8917d]">{tx('contract.filesCount', { count: sharedFiles.length }, `${sharedFiles.length} files in this workspace`)}</p>
                            </div>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-full bg-[#211811]">
                            <div className="h-2 rounded-full bg-gradient-to-r from-[#f59e0b] via-[#f97316] to-[#fb7185]" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-[#261d17] bg-[#0d0a08] p-5 shadow-[0_22px_55px_-42px_rgba(0,0,0,0.95)]">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#8d7663]">{tx('contract.requiredActions', undefined, 'Required actions')}</p>

                        <div className="mt-4 space-y-3">
                            {userRole === 'freelancer' && (normalizedContractStatus === 'active' || normalizedContractStatus === 'revision_requested') ? (
                                deliverySubmitted ? (
                                    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                        {tx('contract.deliverySubmittedWaiting', undefined, 'Delivery submitted. Waiting for client review.')}
                                    </div>
                                ) : (
                                    <Button
                                        variant="primary"
                                        className="w-full justify-center"
                                        onClick={onDeliver}
                                        isLoading={Boolean(isActionLoading)}
                                        leftIcon={<CheckCircle className="h-4 w-4" />}
                                    >
                                        {contractText.deliverWork || tx('contract.deliverWork', undefined, 'Deliver work')}
                                    </Button>
                                )
                            ) : null}

                            {userRole === 'client' && normalizedContractStatus === 'active' ? (
                                deliverySubmitted ? (
                                    <div className="space-y-2">
                                        <Button
                                            variant="primary"
                                            className="w-full justify-center"
                                            onClick={onAcceptAndPay}
                                            isLoading={Boolean(isActionLoading)}
                                            leftIcon={<CircleCheck className="h-4 w-4" />}
                                        >
                                            {contractText.acceptAndPay || tx('contract.acceptAndPay', undefined, 'Accept and pay')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-center"
                                            onClick={onRequestChanges}
                                            disabled={Boolean(isActionLoading)}
                                        >
                                            {contractText.requestChanges || tx('contract.requestChanges', undefined, 'Request changes')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-[#35291f] bg-[#130d09] px-4 py-3 text-sm leading-6 text-[#c5af99]">
                                        {tx('contract.waitingForDelivery', undefined, 'Waiting for freelancer delivery before review.')}
                                    </div>
                                )
                            ) : null}

                            {userRole === 'client' && normalizedContractStatus === 'revision_requested' ? (
                                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                    {tx('contract.waitingForRevision', undefined, 'Waiting for freelancer to submit the requested revision.')}
                                </div>
                            ) : null}

                            {normalizedContractStatus === 'completed' && !hasLeftReview ? (
                                <Button variant="secondary" className="w-full justify-center" onClick={onReview}>
                                    {tx('contract.addReview', undefined, 'Add your review')}
                                </Button>
                            ) : null}

                            {normalizedContractStatus === 'completed' && hasLeftReview ? (
                                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                                    {tx('contract.reviewAlreadySubmitted', undefined, 'Review submitted. Contract closed successfully.')}
                                </div>
                            ) : null}

                            {normalizedContractStatus === 'pending_payment' ? (
                                <div className="rounded-2xl border border-[#c48a39]/25 bg-[#c48a39]/10 px-4 py-3 text-sm text-[#f3d29f]">
                                    {tx('contract.pendingPaymentNotice', undefined, 'Payment is being confirmed. Messaging remains open.')}
                                </div>
                            ) : null}

                            {normalizedContractStatus === 'cancelled' || normalizedContractStatus === 'canceled' ? (
                                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {tx('contract.cancelledNotice', undefined, 'This contract is cancelled and actions are locked.')}
                                </div>
                            ) : null}

                            {(normalizedContractStatus === 'active' || normalizedContractStatus === 'revision_requested') ? (
                                <button
                                    type="button"
                                    onClick={onDispute}
                                    disabled={Boolean(isActionLoading)}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#4b2a22] bg-[#1b0f0d] px-4 py-3 text-sm font-medium text-[#f1b39f] transition-colors hover:bg-[#241310] disabled:opacity-60"
                                >
                                    <ShieldAlert className="h-4 w-4" />
                                    {contractText.openDispute || tx('contract.openDispute', undefined, 'Open dispute')}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="space-y-5">
                    <div className="rounded-[28px] border border-[#261d17] bg-[#0d0a08] p-5 shadow-[0_22px_55px_-42px_rgba(0,0,0,0.95)]">
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#4a3828] bg-[#120d09]">
                                {otherParty?.avatar_url ? (
                                    <img src={otherParty.avatar_url} alt={otherParty.full_name || 'User'} className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-5 w-5 text-[#b29982]" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] uppercase tracking-[0.16em] text-[#8d7663]">{tx('contract.primaryContact', undefined, 'Primary contact')}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <p className="truncate text-lg font-semibold text-[#fff4e7]">{otherParty?.full_name}</p>
                                    <span className="rounded-full border border-[#4c3928] bg-[#17110d] px-2.5 py-1 text-[11px] font-medium text-[#f1ce9d]">
                                        {contactRoleLabel}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-[#c7b2a0]">{contactHint}</p>
                                <p className="mt-3 flex items-center gap-1.5 text-xs text-[#f0c87a]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#f0b35d]" />
                                    {tx('contract.onlineNow', undefined, 'Online now')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-[#261d17] bg-[#0d0a08] p-5 shadow-[0_22px_55px_-42px_rgba(0,0,0,0.95)]">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-[#32271f] bg-[#120d09] px-4 py-4">
                                <div className="flex items-center gap-2 text-[#f0b35d]">
                                    <Activity className="h-4 w-4" />
                                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#8d7663]">{tx('contract.progress', undefined, 'Progress')}</p>
                                </div>
                                <p className="mt-3 text-3xl font-semibold text-[#fff4e7]">{progressPct}%</p>
                            </div>

                            <div className="rounded-2xl border border-[#32271f] bg-[#120d09] px-4 py-4">
                                <div className="flex items-center gap-2 text-[#f0b35d]">
                                    <FolderOpen className="h-4 w-4" />
                                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#8d7663]">{tx('contract.sharedFiles', undefined, 'Shared files')}</p>
                                </div>
                                <p className="mt-3 text-3xl font-semibold text-[#fff4e7]">{sharedFiles.length}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-[28px] border border-[#261d17] bg-[#0d0a08] p-5 shadow-[0_22px_55px_-42px_rgba(0,0,0,0.95)]">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8d7663]">{tx('contract.milestones', undefined, 'Milestones')}</p>
                            <h3 className="mt-2 text-lg font-semibold text-[#fff4e7]">
                                {nextMilestone?.title || nextMilestone?.description || tx('contract.noMilestonesYetTitle', undefined, 'No milestones added yet')}
                            </h3>
                        </div>
                        <span className="rounded-full border border-[#433428] bg-[#17110d] px-3 py-1 text-xs font-medium text-[#e6c9a8]">
                            {milestoneSummary.total}
                        </span>
                    </div>

                    {previewMilestones.length > 0 ? (
                        <div className="mt-5 space-y-3">
                            {previewMilestones.map((milestone, index) => {
                                const status = milestoneStatusMeta(milestone.status, tx);
                                const milestoneTitle = milestone.title
                                    || milestone.description
                                    || tx('contract.milestoneFallbackTitle', { index: index + 1 }, `Milestone ${index + 1}`);

                                return (
                                    <div key={milestone.id || `${index}`} className="grid gap-3 rounded-2xl border border-[#32271f] bg-[#120d09] px-4 py-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#49382a] bg-[#1a130e] text-[#f0b35d]">
                                            <CheckCircle className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-[#fff4e7]">{milestoneTitle}</p>
                                            {milestone.title && milestone.description ? (
                                                <p className="mt-1 text-xs leading-5 text-[#bfa996]">{milestone.description}</p>
                                            ) : null}
                                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#c7b2a0]">
                                                <span className="rounded-full border border-[#443327] bg-[#17110d] px-2.5 py-1">
                                                    {formatAmount(milestone.amount, tx('dynamic_key_1524267', undefined, 'TND'))}
                                                </span>
                                                <span className="rounded-full border border-[#443327] bg-[#17110d] px-2.5 py-1">
                                                    {formatDate(milestone.due_date, noDueDateLabel)}
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`justify-self-start rounded-full border px-2.5 py-1 text-[11px] font-medium md:justify-self-end ${status.className}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-[#43362a] bg-[#120d09] p-5 text-center">
                            <CheckCircle className="mx-auto mb-3 h-5 w-5 text-[#8d7663]" />
                            <p className="text-sm font-medium text-[#fff4e7]">{tx('contract.noMilestonesYetTitle', undefined, 'No milestones added yet')}</p>
                            <p className="mt-1 text-xs leading-5 text-[#b39c87]">{tx('contract.noMilestonesYetHint', undefined, 'Define clear deliverables and due dates to track progress here.')}</p>
                        </div>
                    )}
                </section>

                <section className="rounded-[28px] border border-[#261d17] bg-[#0d0a08] p-5 shadow-[0_22px_55px_-42px_rgba(0,0,0,0.95)]">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.16em] text-[#8d7663]">{tx('contract.sharedFiles', undefined, 'Shared files')}</p>
                            <h3 className="mt-2 text-lg font-semibold text-[#fff4e7]">{tx('contract.filesCount', { count: sharedFiles.length }, `${sharedFiles.length} files in this workspace`)}</h3>
                        </div>
                        <div className="rounded-2xl border border-[#49382a] bg-[#17110d] p-3 text-[#f0b35d]">
                            <FileText className="h-5 w-5" />
                        </div>
                    </div>

                    {previewFiles.length > 0 ? (
                        <div className="mt-5 space-y-3">
                            {previewFiles.map((file) => {
                                const fileSize = formatAttachmentSize(file.size);

                                return (
                                    <button
                                        key={file.id}
                                        type="button"
                                        onClick={() => onOpenSharedFile?.(file)}
                                        disabled={!onOpenSharedFile}
                                        className="flex w-full items-start gap-3 rounded-2xl border border-[#32271f] bg-[#120d09] px-4 py-4 text-left transition-colors hover:bg-[#17110d] disabled:cursor-default"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#49382a] bg-[#1a130e] text-[#f0b35d]">
                                            <FolderOpen className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-[#fff4e7]">{file.name}</p>
                                            <p className="mt-1 truncate text-xs text-[#bca693]">
                                                {[
                                                    file.senderName,
                                                    formatDate(file.uploadedAt || null, tx('pages.messages.time.now', undefined, 'Now')),
                                                    fileSize,
                                                ].filter(Boolean).join(' • ')}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-[#43362a] bg-[#120d09] p-5 text-center">
                            <FolderOpen className="mx-auto mb-3 h-5 w-5 text-[#8d7663]" />
                            <p className="text-sm font-medium text-[#fff4e7]">{tx('contract.noSharedFilesTitle', undefined, 'No shared files yet')}</p>
                            <p className="mt-1 text-xs leading-5 text-[#b39c87]">{tx('contract.noSharedFilesHint', undefined, 'Attachments sent in this chat will appear here automatically.')}</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
