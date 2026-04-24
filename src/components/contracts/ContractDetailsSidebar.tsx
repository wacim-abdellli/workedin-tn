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
    Clock,
    TrendingUp,
    Star,
    AlertCircle,
    ChevronRight,
} from 'lucide-react';


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
    revisionRequestsCount?: number | null;
    maxRevisionRounds?: number | null;
    fundedAt?: string | null;
    deliverySubmittedAt?: string | null;
    reviewDueAt?: string | null;
    job?: { title?: string | null; deadline?: string | null };
    milestones?: ContractMilestone[];
    sharedFiles?: ContractSharedFile[];
    freelancer?: { full_name?: string; avatar_url?: string | null };
    client?: { full_name?: string; avatar_url?: string | null };
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

const ns = (s: string | null | undefined) => String(s || '').trim().toLowerCase();

const fmtDate = (v: string | null | undefined, fb: string) => {
    if (!v) return fb;
    const d = new Date(v);
    return isNaN(d.getTime()) ? fb : d.toLocaleDateString();
};

const fmtSize = (size: number | string | null | undefined) => {
    const b = typeof size === 'string' ? Number(size) : (size ?? 0);
    if (!Number.isFinite(b) || b <= 0) return null;
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
};

const fmtAmount = (amount: number | null | undefined, cur: string) => {
    const n = Number(amount ?? 0);
    if (!Number.isFinite(n)) return `0 ${cur}`;
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)} ${cur}`;
};

const statusChip = (status: string | null | undefined) => {
    const s = ns(status);
    if (['completed', 'approved', 'paid'].includes(s)) return { label: 'Completed', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' };
    if (['in_progress', 'active'].includes(s)) return { label: 'In Progress', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/25' };
    if (['cancelled', 'canceled'].includes(s)) return { label: 'Cancelled', cls: 'bg-red-500/15 text-red-300 border-red-500/25' };
    return { label: 'Pending', cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
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
    if (!contract) return null;

    const st = ns(currentStatus);
    const milestones = contract.milestones ?? [];
    const sharedFiles = contract.sharedFiles ?? [];
    const otherParty = userRole === 'client' ? contract.freelancer : contract.client;
    const contactRole = userRole === 'client' ? 'Freelancer' : 'Client';
    const cur = 'TND';

    const completed = milestones.filter(m => ['completed', 'approved', 'paid'].includes(ns(m.status))).length;
    const progressPct = milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0;
    const revUsed = Number(contract.revisionRequestsCount ?? 0);
    const revMax = Number(contract.maxRevisionRounds ?? 2);
    const revLeft = Math.max(revMax - revUsed, 0);
    const noDue = 'No due date';

    const contractStatusMeta = useMemo(() => {
        if (st === 'active') return { label: 'In Progress', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' };
        if (st === 'completed') return { label: 'Completed', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/25' };
        if (st === 'disputed') return { label: 'Disputed', cls: 'bg-red-500/15 text-red-300 border-red-500/25' };
        if (st === 'revision_requested') return { label: 'Revision Requested', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/25' };
        if (st === 'pending_payment') return { label: 'Pending Payment', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/25' };
        if (st === 'cancelled' || st === 'canceled') return { label: 'Cancelled', cls: 'bg-red-500/15 text-red-300 border-red-500/25' };
        return { label: 'Unknown', cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }, [st]);

    const isActive = st === 'active';
    const isRevision = st === 'revision_requested';
    const isPendingPayment = st === 'pending_payment';
    const isCompleted = st === 'completed';
    const isCancelled = st === 'cancelled' || st === 'canceled';
    // canOpenDisputeForStatus: pending_payment | active | revision_requested
    const canDispute = isActive || isRevision || isPendingPayment;
    // Freelancer delivers when status allows AND no delivery yet submitted
    const showFreelancerDeliver = userRole === 'freelancer' && (isActive || isRevision) && !deliverySubmitted;
    const showFreelancerWaiting = userRole === 'freelancer' && (isActive || isRevision) && deliverySubmitted;
    // canClientAcceptForStatus: status === 'active' && hasDeliveryEvidence
    const showClientActions = userRole === 'client' && isActive && deliverySubmitted;
    const showClientWaiting = userRole === 'client' && (isActive && !deliverySubmitted);
    const showClientPendingPayment = userRole === 'client' && isPendingPayment;
    const showClientRevisionWaiting = userRole === 'client' && isRevision;

    return (
        <div
            className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
            style={{ background: 'linear-gradient(180deg, #0a0a0b 0%, #080808 100%)' }}
        >
            <div className="space-y-4 p-5">

                {/* ── Hero Card ── */}
                <div
                    className="relative overflow-hidden rounded-2xl border border-zinc-800/80"
                    style={{ background: 'linear-gradient(135deg, #141210 0%, #0e0c0a 100%)' }}
                >
                    {/* Glow */}
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />

                    <div className="p-5">
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="h-14 w-14 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                                    {otherParty?.avatar_url
                                        ? <img src={otherParty.avatar_url} alt={otherParty.full_name} className="h-full w-full object-cover" />
                                        : <User className="h-6 w-6 text-zinc-500" />}
                                </div>
                                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-zinc-900 bg-emerald-500" />
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Workspace</span>
                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${contractStatusMeta.cls}`}>
                                        {contractStatusMeta.label}
                                    </span>
                                </div>
                                <h2 className="mt-1.5 text-lg font-bold leading-snug text-white">
                                    {contract.job?.title || 'Untitled Job'}
                                </h2>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    <span className="rounded-full border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-1 text-[11px] text-zinc-300">
                                        {otherParty?.full_name || 'User'}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-300 font-medium">
                                        {contactRole}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Amount + Timeline */}
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Amount</p>
                                <p className="mt-1.5 flex items-center gap-1.5 text-base font-bold text-white">
                                    <DollarSign className="h-4 w-4 text-amber-400 shrink-0" />
                                    {fmtAmount(contract.amount, cur)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Timeline</p>
                                <p className="mt-1.5 flex items-center gap-1.5 text-base font-bold text-white">
                                    <CalendarDays className="h-4 w-4 text-amber-400 shrink-0" />
                                    {fmtDate(contract.job?.deadline ?? null, noDue)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Progress Card ── */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-amber-400" />
                            <span className="text-sm font-semibold text-white">Progress</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{progressPct}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${progressPct}%`,
                                background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                            }}
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                        {[
                            { label: 'Progress', value: `${progressPct}%`, sub: `${completed}/${milestones.length} done` },
                            { label: 'Milestones', value: milestones.length - completed, sub: 'pending' },
                            { label: 'Files', value: sharedFiles.length, sub: 'shared' },
                        ].map(({ label, value, sub }) => (
                            <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-3 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
                                <p className="mt-1 text-xl font-bold text-white">{value}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Required Actions ── */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-semibold text-white">Required Actions</span>
                    </div>

                    <div className="space-y-2.5">
                        {/* Revision info */}
                        {showClientActions && (
                            <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-3 py-2.5 text-xs text-zinc-400">
                                <span className="font-medium text-zinc-300">{revLeft} revision{revLeft !== 1 ? 's' : ''} remaining</span>
                                {' '}({revUsed}/{revMax} used)
                            </div>
                        )}

                        {/* Freelancer: deliver */}
                        {showFreelancerDeliver && (
                            <button
                                type="button"
                                onClick={onDeliver}
                                disabled={Boolean(isActionLoading)}
                                className="group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
                            >
                                <CheckCircle className="h-4 w-4" />
                                Deliver Work
                            </button>
                        )}

                        {/* Freelancer: waiting */}
                        {showFreelancerWaiting && (
                            <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                <Clock className="h-4 w-4 shrink-0" />
                                Delivery submitted. Waiting for client review.
                            </div>
                        )}

                        {/* Client: accept + request changes */}
                        {showClientActions && (
                            <>
                                <button
                                    type="button"
                                    onClick={onAcceptAndPay}
                                    disabled={Boolean(isActionLoading)}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
                                >
                                    <CircleCheck className="h-4 w-4" />
                                    Accept and Pay
                                </button>
                                <button
                                    type="button"
                                    onClick={onRequestChanges}
                                    disabled={Boolean(isActionLoading) || revLeft <= 0}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-transparent px-4 py-3 text-sm font-semibold text-amber-300 transition-all hover:bg-amber-500/10 disabled:opacity-50"
                                >
                                    {revLeft <= 0 ? 'Revision limit reached' : 'Request Changes'}
                                </button>
                            </>
                        )}

                        {/* Client: waiting for delivery */}
                        {showClientWaiting && (
                            <div className="flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-4 py-3 text-sm text-zinc-400">
                                <Clock className="h-4 w-4 shrink-0" />
                                Waiting for freelancer delivery.
                            </div>
                        )}

                        {/* Client: pending payment */}
                        {showClientPendingPayment && (
                            <div className="flex items-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
                                <Clock className="h-4 w-4 shrink-0" />
                                Payment is being confirmed. Contract will become active shortly.
                            </div>
                        )}

                        {/* Client: waiting for revision */}
                        {showClientRevisionWaiting && (
                            <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                Revision requested. Waiting for freelancer to re-deliver.
                            </div>
                        )}

                        {/* Review */}
                        {isCompleted && !hasLeftReview && (
                            <button
                                type="button"
                                onClick={onReview}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/15"
                            >
                                <Star className="h-4 w-4" />
                                Leave a Review
                            </button>
                        )}

                        {/* Review done */}
                        {isCompleted && hasLeftReview && (
                            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                Review submitted. Contract closed.
                            </div>
                        )}

                        {/* Cancelled */}
                        {isCancelled && (
                            <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                This contract is cancelled.
                            </div>
                        )}

                        {/* Dispute */}
                        {canDispute && (
                            <button
                                type="button"
                                onClick={onDispute}
                                disabled={Boolean(isActionLoading)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-transparent px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-50"
                            >
                                <ShieldAlert className="h-4 w-4" />
                                Open Dispute
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Primary Contact ── */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-4">Primary Contact</p>
                    <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                            {otherParty?.avatar_url
                                ? <img src={otherParty.avatar_url} alt={otherParty.full_name} className="h-full w-full object-cover" />
                                : <User className="h-5 w-5 text-zinc-500" />}
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-emerald-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="truncate font-semibold text-white text-sm">{otherParty?.full_name || 'User'}</p>
                                <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                                    {contactRole}
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-emerald-400 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Online now
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Milestones ── */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-amber-400" />
                            <span className="text-sm font-semibold text-white">Milestones</span>
                        </div>
                        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                            {milestones.length}
                        </span>
                    </div>

                    {milestones.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-700/60 bg-zinc-800/30 p-5 text-center">
                            <CheckCircle className="mx-auto mb-2 h-5 w-5 text-zinc-600" />
                            <p className="text-sm font-medium text-zinc-400">No milestones yet</p>
                            <p className="mt-1 text-xs text-zinc-600">Define deliverables to track progress.</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {milestones.slice(0, 3).map((m, i) => {
                                const chip = statusChip(m.status);
                                const title = m.title || m.description || `Milestone ${i + 1}`;
                                return (
                                    <div key={m.id || i} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-amber-400">
                                            <CheckCircle className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-white">{title}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                {fmtAmount(m.amount, cur)} · {fmtDate(m.due_date, noDue)}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${chip.cls}`}>
                                            {chip.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Shared Files ── */}
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-amber-400" />
                            <span className="text-sm font-semibold text-white">Shared Files</span>
                        </div>
                        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                            {sharedFiles.length}
                        </span>
                    </div>

                    {sharedFiles.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-700/60 bg-zinc-800/30 p-5 text-center">
                            <FileText className="mx-auto mb-2 h-5 w-5 text-zinc-600" />
                            <p className="text-sm font-medium text-zinc-400">No shared files yet</p>
                            <p className="mt-1 text-xs text-zinc-600">Attachments appear here automatically.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sharedFiles.slice(0, 4).map(file => (
                                <button
                                    key={file.id}
                                    type="button"
                                    onClick={() => onOpenSharedFile?.(file)}
                                    disabled={!onOpenSharedFile}
                                    className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left transition-all hover:border-amber-500/30 hover:bg-zinc-800/60 disabled:cursor-default"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-amber-400">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-white">{file.name}</p>
                                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                                            {[file.senderName, fmtDate(file.uploadedAt ?? null, 'Unknown'), fmtSize(file.size)].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
