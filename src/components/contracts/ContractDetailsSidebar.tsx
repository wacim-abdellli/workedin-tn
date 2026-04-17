import { useState } from 'react';
import {
    Clock,
    CheckCircle,
    User,
    ChevronDown,
    ChevronUp,
    FileText,
    DollarSign,
    Sparkles,
    ShieldAlert,
    CircleCheck,
} from 'lucide-react';
import Button from '../ui/Button';
import { useTranslation } from '../../i18n';

interface ContractSidebarData {
    amount: number;
    job?: {
        title?: string;
        deadline?: string;
    };
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
}

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
    hasLeftReview
}: ContractDetailsSidebarProps) {
    const { t, tx } = useTranslation();
    const contractText = (t as { contract?: Record<string, string> } | undefined)?.contract || {};
    const [expandedSection, setExpandedSection] = useState<string | null>('milestones');
    const milestonesPanelId = 'contract-milestones-panel';
    const filesPanelId = 'contract-files-panel';

    if (!contract) return null;

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const otherParty = userRole === 'client' ? contract.freelancer : contract.client;
    const daysRemaining = (() => {
        if (!contract.job?.deadline) return null;
        const diff = new Date(contract.job.deadline).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    })();

    const statusMeta =
        currentStatus === 'active'
            ? {
                chipClass: 'border-emerald-300/60 bg-emerald-500/15 text-emerald-200',
                surfaceClass: 'border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-card to-card',
                label: contractText.inProgress || tx('contract.inProgress', undefined, 'In Progress'),
            }
            : currentStatus === 'completed'
                ? {
                    chipClass: 'border-sky-300/60 bg-sky-500/15 text-sky-200',
                    surfaceClass: 'border-sky-500/25 bg-gradient-to-br from-sky-500/15 via-card to-card',
                    label: tx('contract.completed', undefined, 'Completed'),
                }
                : currentStatus === 'disputed'
                    ? {
                        chipClass: 'border-amber-300/60 bg-amber-500/15 text-amber-200',
                        surfaceClass: 'border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-card to-card',
                        label: contractText.disputeOpened || tx('contract.disputeOpened', undefined, 'Dispute opened'),
                    }
                    : {
                        chipClass: 'border-border bg-surface text-muted-foreground',
                        surfaceClass: 'border-border bg-card',
                        label: currentStatus,
                    };

    const amountLabel = `${contract.amount} ${tx('dynamic_key_1524267')}`;

    return (
        <div className="h-full flex flex-col border-s border-border bg-gradient-to-b from-surface/80 via-card to-card">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                <section className={`rounded-2xl border p-4 shadow-sm ${statusMeta.surfaceClass}`}>
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                            {tx('contract.workspaceTitle', undefined, 'Workspace')}
                        </p>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta.chipClass}`}>
                            {statusMeta.label}
                        </span>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold leading-snug text-foreground">
                        {contract.job?.title || tx('contract.untitledJob', undefined, 'Untitled job')}
                    </h2>

                    <div className="mt-4 grid gap-2 text-xs">
                        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-3 py-2">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{amountLabel}</span>
                        </div>
                        {currentStatus === 'active' && daysRemaining !== null && (
                            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-3 py-2 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{tx('contract.daysRemaining', { days: daysRemaining }, `${daysRemaining} ${contractText.days || 'days'} remaining`)}</span>
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground">{tx('contract.requiredActions', undefined, 'Required actions')}</h3>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="space-y-2.5">
                        {userRole === 'freelancer' && currentStatus === 'active' && (
                            deliverySubmitted ? (
                                <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-center text-xs font-medium text-sky-200">
                                    {tx('contract.deliverySubmittedWaiting', undefined, 'Delivery submitted. Waiting for client review.')}
                                </div>
                            ) : (
                                <Button
                                    variant="primary"
                                    className="w-full justify-center"
                                    onClick={onDeliver}
                                    isLoading={isActionLoading}
                                    leftIcon={<CheckCircle className="h-4 w-4" />}
                                >
                                    {contractText.deliverWork || tx('contract.deliverWork', undefined, 'Deliver work')}
                                </Button>
                            )
                        )}

                        {userRole === 'client' && currentStatus === 'active' && (
                            deliverySubmitted ? (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <Button
                                        variant="primary"
                                        className="w-full justify-center"
                                        onClick={onAcceptAndPay}
                                        isLoading={isActionLoading}
                                        leftIcon={<CircleCheck className="h-4 w-4" />}
                                    >
                                        {contractText.acceptAndPay || tx('contract.acceptAndPay', undefined, 'Accept and pay')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-center"
                                        onClick={onRequestChanges}
                                    >
                                        {contractText.requestChanges || tx('contract.requestChanges', undefined, 'Request changes')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-border bg-surface/70 px-3 py-2 text-center text-xs text-muted-foreground">
                                    {tx('contract.waitingForDelivery', undefined, 'Waiting for freelancer delivery before review.')}
                                </div>
                            )
                        )}

                        {currentStatus === 'completed' && !hasLeftReview && (
                            <Button
                                variant="secondary"
                                className="w-full justify-center"
                                onClick={onReview}
                            >
                                {tx('contract.addReview', undefined, 'Add your review')}
                            </Button>
                        )}

                        {currentStatus === 'active' && (
                            <button
                                onClick={onDispute}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
                            >
                                <ShieldAlert className="h-3.5 w-3.5" />
                                {contractText.openDispute || tx('contract.openDispute', undefined, 'Open dispute')}
                            </button>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <button
                        type="button"
                        onClick={() => toggleSection('milestones')}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors"
                        aria-expanded={expandedSection === 'milestones'}
                        aria-controls={milestonesPanelId}
                    >
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            {tx('contract.milestones', undefined, 'Milestones')}
                        </div>
                        {expandedSection === 'milestones'
                            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {expandedSection === 'milestones' && (
                        <div id={milestonesPanelId} className="border-t border-border bg-surface/40 p-4">
                            <div className="rounded-xl border border-border bg-card p-3">
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <h4 className="text-sm font-medium text-foreground">
                                        {tx('contract.finalDelivery', undefined, 'Final delivery')}
                                    </h4>
                                    <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-200">
                                        {tx('contract.pending', undefined, 'Pending')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{amountLabel}</span>
                                    <span>{contract.job?.deadline ? new Date(contract.job.deadline).toLocaleDateString() : '—'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <button
                        type="button"
                        onClick={() => toggleSection('files')}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors"
                        aria-expanded={expandedSection === 'files'}
                        aria-controls={filesPanelId}
                    >
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {tx('contract.sharedFiles', undefined, 'Shared files')}
                        </div>
                        {expandedSection === 'files'
                            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {expandedSection === 'files' && (
                        <div id={filesPanelId} className="border-t border-border bg-surface/40 p-4 text-center text-sm text-muted-foreground">
                            {tx('contract.noSharedFiles', undefined, 'No shared files yet')}
                        </div>
                    )}
                </section>
            </div>

            <div className="border-t border-border bg-card/90 p-4 backdrop-blur">
                <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {userRole === 'client'
                        ? tx('contract.workingOnProject', undefined, 'Working on this project')
                        : tx('contract.employer', undefined, 'Employer')}
                </h4>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/60 px-3 py-3">
                    <div className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden">
                        {otherParty?.avatar_url ? (
                            <img src={otherParty.avatar_url} alt={otherParty.full_name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-muted" />
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-sm text-foreground">{otherParty?.full_name}</p>
                        <p className="text-xs text-emerald-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {tx('contract.onlineNow', undefined, 'Online now')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
