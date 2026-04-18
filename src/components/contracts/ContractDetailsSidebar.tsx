import { useMemo, useState } from 'react';
import {
    Activity,
    CalendarDays,
    CheckCircle,
    ChevronDown,
    ChevronUp,
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
            className: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
        };
    }

    if (normalizedStatus === 'in_progress' || normalizedStatus === 'active') {
        return {
            label: tx('contract.milestoneInProgress', undefined, 'In progress'),
            className: 'border-sky-500/40 bg-sky-500/15 text-sky-200',
        };
    }

    if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
        return {
            label: tx('contract.milestoneCancelled', undefined, 'Cancelled'),
            className: 'border-red-500/40 bg-red-500/15 text-red-200',
        };
    }

    return {
        label: tx('contract.pending', undefined, 'Pending'),
        className: 'border-amber-500/40 bg-amber-500/15 text-amber-200',
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
    const [expandedSection, setExpandedSection] = useState<'milestones' | 'files' | null>('milestones');
    const milestonesPanelId = 'contract-milestones-panel';
    const filesPanelId = 'contract-files-panel';

    const normalizedContractStatus = normalizeStatus(currentStatus);
    const milestones = contract?.milestones || [];
    const sharedFiles = contract?.sharedFiles || [];

    const toggleSection = (section: 'milestones' | 'files') => {
        setExpandedSection((current) => (current === section ? null : section));
    };

    const otherParty = userRole === 'client' ? contract?.freelancer : contract?.client;

    const daysRemaining = useMemo(() => {
        if (!contract?.job?.deadline) return null;

        const dueTime = new Date(contract.job.deadline).getTime();
        if (Number.isNaN(dueTime)) return null;

        const diff = dueTime - Date.now();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
        };
    }, [milestones]);

    const statusMeta = useMemo(() => {
        if (normalizedContractStatus === 'active') {
            return {
                chipClass: 'border-emerald-300/60 bg-emerald-500/15 text-emerald-200',
                label: contractText.inProgress || tx('contract.inProgress', undefined, 'In progress'),
            };
        }

        if (normalizedContractStatus === 'completed') {
            return {
                chipClass: 'border-sky-300/60 bg-sky-500/15 text-sky-200',
                label: tx('contract.completed', undefined, 'Completed'),
            };
        }

        if (normalizedContractStatus === 'disputed') {
            return {
                chipClass: 'border-amber-300/60 bg-amber-500/15 text-amber-200',
                label: contractText.disputeOpened || tx('contract.disputeOpened', undefined, 'Dispute opened'),
            };
        }

        if (normalizedContractStatus === 'pending_payment') {
            return {
                chipClass: 'border-cyan-300/60 bg-cyan-500/15 text-cyan-200',
                label: tx('contract.pendingPayment', undefined, 'Pending payment'),
            };
        }

        if (normalizedContractStatus === 'cancelled' || normalizedContractStatus === 'canceled') {
            return {
                chipClass: 'border-red-300/60 bg-red-500/15 text-red-200',
                label: tx('contract.cancelled', undefined, 'Cancelled'),
            };
        }

        return {
            chipClass: 'border-[#4b5466] bg-[#2d3442] text-gray-200',
            label: tx('contract.statusUnknown', undefined, 'Unknown status'),
        };
    }, [contractText.disputeOpened, contractText.inProgress, normalizedContractStatus, tx]);

    const amountLabel = formatAmount(contract?.amount, tx('dynamic_key_1524267', undefined, 'TND'));
    const isActionInProgress = Boolean(isActionLoading);
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
                    : normalizedContractStatus === 'pending_payment'
                        ? tx('contract.statusPendingPaymentHint', undefined, 'Payment confirmation is pending. Messaging stays open during processing.')
                        : normalizedContractStatus === 'cancelled' || normalizedContractStatus === 'canceled'
                            ? tx('contract.statusCancelledHint', undefined, 'Contract is cancelled. Historical details remain available below.')
                            : tx('contract.statusUnknownHint', undefined, 'Status metadata is not fully synced yet. This chat is still available.');

    if (!contract) return null;

    return (
        <div className="h-full flex flex-col border-s border-[#2d3138] bg-[#12161d]">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                <section className="rounded-3xl border border-[#3a404d] bg-gradient-to-br from-[#1f2631] via-[#1a202a] to-[#141923] p-4 shadow-[0_18px_45px_-28px_rgba(0,0,0,0.75)]">
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-gray-400">
                            {tx('contract.workspaceTitle', undefined, 'Workspace')}
                        </p>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta.chipClass}`}>
                            {statusMeta.label}
                        </span>
                    </div>

                    <h2 className="mt-2 text-lg font-semibold leading-snug text-white">
                        {contract.job?.title || tx('contract.untitledJob', undefined, 'Untitled job')}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-gray-300">{statusDescription}</p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl border border-[#3a4150] bg-[#131821] px-3 py-2.5">
                            <p className="text-[10px] uppercase tracking-wide text-gray-500">{tx('contract.amount', undefined, 'Amount')}</p>
                            <p className="mt-1 flex items-center gap-1.5 font-semibold text-gray-100">
                                <DollarSign className="h-3.5 w-3.5 text-amber-300" />
                                {amountLabel}
                            </p>
                        </div>

                        <div className="rounded-xl border border-[#3a4150] bg-[#131821] px-3 py-2.5">
                            <p className="text-[10px] uppercase tracking-wide text-gray-500">{tx('contract.timeline', undefined, 'Timeline')}</p>
                            <p className="mt-1 flex items-center gap-1.5 font-semibold text-gray-100">
                                <CalendarDays className="h-3.5 w-3.5 text-amber-300" />
                                {normalizedContractStatus === 'active' && daysRemaining !== null
                                    ? tx('contract.daysRemaining', { days: daysRemaining }, `${daysRemaining} ${contractText.days || 'days'} remaining`)
                                    : tx('pages.dashboard.freelancer.noDueDate', undefined, 'No due date')}
                            </p>
                        </div>

                        <div className="col-span-2 rounded-xl border border-[#3a4150] bg-[#131821] px-3 py-2.5">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-500">
                                    <Activity className="h-3.5 w-3.5 text-amber-300" />
                                    {tx('contract.progress', undefined, 'Progress')}
                                </p>
                                <span className="text-[11px] font-semibold text-gray-300">{progressPct}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-[#2b313e]">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            <p className="mt-2 text-[11px] text-gray-400">
                                {tx(
                                    'contract.milestoneProgressLabel',
                                    { completed: milestoneSummary.completed, total: milestoneSummary.total },
                                    `${milestoneSummary.completed} / ${milestoneSummary.total} milestones complete`,
                                )}
                            </p>
                        </div>

                        <div className="col-span-2 rounded-xl border border-[#3a4150] bg-[#131821] px-3 py-2.5">
                            <p className="text-[10px] uppercase tracking-wide text-gray-500">{tx('contract.sharedFiles', undefined, 'Shared files')}</p>
                            <p className="mt-1 flex items-center gap-1.5 font-semibold text-gray-100">
                                <FolderOpen className="h-3.5 w-3.5 text-amber-300" />
                                {tx('contract.filesCount', { count: sharedFiles.length }, `${sharedFiles.length} files in this workspace`)}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-[#343946] bg-[#181d27] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
                            <Sparkles className="h-4 w-4 text-amber-300" />
                            {tx('contract.requiredActions', undefined, 'Required actions')}
                        </h3>
                    </div>

                    <div className="space-y-2.5">
                        {userRole === 'freelancer' && normalizedContractStatus === 'active' ? (
                            deliverySubmitted ? (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs font-medium text-amber-100">
                                    {tx('contract.deliverySubmittedWaiting', undefined, 'Delivery submitted. Waiting for client review.')}
                                </div>
                            ) : (
                                <Button
                                    variant="primary"
                                    className="w-full justify-center"
                                    onClick={onDeliver}
                                    isLoading={isActionInProgress}
                                    leftIcon={<CheckCircle className="h-4 w-4" />}
                                >
                                    {contractText.deliverWork || tx('contract.deliverWork', undefined, 'Deliver work')}
                                </Button>
                            )
                        ) : null}

                        {userRole === 'client' && normalizedContractStatus === 'active' ? (
                            deliverySubmitted ? (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <Button
                                        variant="primary"
                                        className="w-full justify-center"
                                        onClick={onAcceptAndPay}
                                        isLoading={isActionInProgress}
                                        leftIcon={<CircleCheck className="h-4 w-4" />}
                                    >
                                        {contractText.acceptAndPay || tx('contract.acceptAndPay', undefined, 'Accept and pay')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-center"
                                        onClick={onRequestChanges}
                                        disabled={isActionInProgress}
                                    >
                                        {contractText.requestChanges || tx('contract.requestChanges', undefined, 'Request changes')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-[#343946] bg-[#151b24] px-3 py-2 text-center text-xs text-gray-300">
                                    {tx('contract.waitingForDelivery', undefined, 'Waiting for freelancer delivery before review.')}
                                </div>
                            )
                        ) : null}

                        {normalizedContractStatus === 'completed' && !hasLeftReview ? (
                            <Button variant="secondary" className="w-full justify-center" onClick={onReview}>
                                {tx('contract.addReview', undefined, 'Add your review')}
                            </Button>
                        ) : null}

                        {normalizedContractStatus === 'completed' && hasLeftReview ? (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-xs font-medium text-emerald-100">
                                {tx('contract.reviewAlreadySubmitted', undefined, 'Review submitted. Contract closed successfully.')}
                            </div>
                        ) : null}

                        {normalizedContractStatus === 'pending_payment' ? (
                            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-center text-xs font-medium text-sky-100">
                                {tx('contract.pendingPaymentNotice', undefined, 'Payment is being confirmed. Messaging remains open.')}
                            </div>
                        ) : null}

                        {normalizedContractStatus === 'cancelled' || normalizedContractStatus === 'canceled' ? (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-200">
                                {tx('contract.cancelledNotice', undefined, 'This contract is cancelled and actions are locked.')}
                            </div>
                        ) : null}

                        {normalizedContractStatus === 'active' ? (
                            <button
                                onClick={onDispute}
                                disabled={isActionInProgress}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/12 px-3 py-2 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-500/20 disabled:opacity-60"
                            >
                                <ShieldAlert className="h-3.5 w-3.5" />
                                {contractText.openDispute || tx('contract.openDispute', undefined, 'Open dispute')}
                            </button>
                        ) : null}
                    </div>
                </section>

                <section className="rounded-2xl border border-[#343946] bg-[#181d27] overflow-hidden">
                    <button
                        type="button"
                        onClick={() => toggleSection('milestones')}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#222733] transition-colors"
                        aria-expanded={expandedSection === 'milestones'}
                        aria-controls={milestonesPanelId}
                    >
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-100">
                            <CheckCircle className="h-4 w-4 text-gray-400" />
                            {tx('contract.milestones', undefined, 'Milestones')}
                            <span className="rounded-full border border-[#3f4655] bg-[#151b24] px-2 py-0.5 text-[10px] text-gray-300">
                                {milestoneSummary.total}
                            </span>
                        </div>
                        {expandedSection === 'milestones'
                            ? <ChevronUp className="h-4 w-4 text-gray-400" />
                            : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>

                    {expandedSection === 'milestones' ? (
                        <div id={milestonesPanelId} className="border-t border-[#343946] bg-[#151b24] p-4">
                            {milestones.length > 0 ? (
                                <div className="space-y-2.5">
                                    {milestones.map((milestone, index) => {
                                        const status = milestoneStatusMeta(milestone.status, tx);
                                        const milestoneTitle = milestone.title
                                            || milestone.description
                                            || tx('contract.milestoneFallbackTitle', { index: index + 1 }, `Milestone ${index + 1}`);

                                        return (
                                            <div key={milestone.id || `${index}`} className="rounded-xl border border-[#343946] bg-[#10151d] p-3">
                                                <div className="mb-2 flex items-start justify-between gap-2">
                                                    <h4 className="text-sm font-medium text-gray-100">{milestoneTitle}</h4>
                                                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
                                                        {status.label}
                                                    </span>
                                                </div>

                                                {milestone.title && milestone.description ? (
                                                    <p className="mb-2 text-xs text-gray-400">{milestone.description}</p>
                                                ) : null}

                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                                                    <span>{formatAmount(milestone.amount, tx('dynamic_key_1524267', undefined, 'TND'))}</span>
                                                    <span>{formatDate(milestone.due_date, tx('pages.dashboard.freelancer.noDueDate', undefined, 'No due date'))}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-[#454d5e] bg-[#10151d] p-4 text-center">
                                    <CheckCircle className="mx-auto mb-2 h-5 w-5 text-gray-500" />
                                    <p className="text-sm font-medium text-gray-200">
                                        {tx('contract.noMilestonesYetTitle', undefined, 'No milestones added yet')}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                        {tx('contract.noMilestonesYetHint', undefined, 'Define clear deliverables and due dates to track progress here.')}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : null}
                </section>

                <section className="rounded-2xl border border-[#343946] bg-[#181d27] overflow-hidden">
                    <button
                        type="button"
                        onClick={() => toggleSection('files')}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#222733] transition-colors"
                        aria-expanded={expandedSection === 'files'}
                        aria-controls={filesPanelId}
                    >
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-100">
                            <FileText className="h-4 w-4 text-gray-400" />
                            {tx('contract.sharedFiles', undefined, 'Shared files')}
                            <span className="rounded-full border border-[#3f4655] bg-[#151b24] px-2 py-0.5 text-[10px] text-gray-300">
                                {sharedFiles.length}
                            </span>
                        </div>
                        {expandedSection === 'files'
                            ? <ChevronUp className="h-4 w-4 text-gray-400" />
                            : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>

                    {expandedSection === 'files' ? (
                        <div id={filesPanelId} className="border-t border-[#343946] bg-[#151b24] p-4">
                            {sharedFiles.length > 0 ? (
                                <div className="space-y-2">
                                    {sharedFiles.map((file) => {
                                        const fileSize = formatAttachmentSize(file.size);

                                        return (
                                            <button
                                                key={file.id}
                                                type="button"
                                                onClick={() => onOpenSharedFile?.(file)}
                                                disabled={!onOpenSharedFile}
                                                className="w-full rounded-xl border border-[#343946] bg-[#10151d] px-3 py-2 text-left transition-colors hover:bg-[#1a1f2a] disabled:cursor-default"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-medium text-gray-100">{file.name}</p>
                                                        <p className="truncate text-[11px] text-gray-400">
                                                            {[
                                                                file.senderName,
                                                                formatDate(file.uploadedAt || null, tx('pages.messages.time.now', undefined, 'Now')),
                                                                fileSize,
                                                            ].filter(Boolean).join(' - ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-[#454d5e] bg-[#10151d] p-4 text-center">
                                    <FolderOpen className="mx-auto mb-2 h-5 w-5 text-gray-500" />
                                    <p className="text-sm font-medium text-gray-200">
                                        {tx('contract.noSharedFilesTitle', undefined, 'No shared files yet')}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                        {tx('contract.noSharedFilesHint', undefined, 'Attachments sent in this chat will appear here automatically.')}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : null}
                </section>
            </div>

            <div className="border-t border-[#2d3138] bg-[#12161d] p-4">
                <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    {userRole === 'client'
                        ? tx('contract.workingOnProject', undefined, 'Working on this project')
                        : tx('contract.employer', undefined, 'Employer')}
                </h4>
                <div className="flex items-center gap-3 rounded-2xl border border-[#343946] bg-[#181d27] px-3 py-3">
                    <div className="w-11 h-11 rounded-full bg-[#111620] border border-[#343946] flex items-center justify-center overflow-hidden">
                        {otherParty?.avatar_url ? (
                            <img src={otherParty.avatar_url} alt={otherParty.full_name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-sm text-gray-100">{otherParty?.full_name}</p>
                        <p className="text-xs text-amber-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {tx('contract.onlineNow', undefined, 'Online now')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
