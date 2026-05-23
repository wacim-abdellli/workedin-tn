import { useState, type CSSProperties } from 'react';
import {
    ChevronDown, Shield, Clock, AlertTriangle, CheckCircle2,
    Send, RotateCcw, ExternalLink, Star, Lock, Zap,
} from 'lucide-react';
import type { ContractMessagingStatus } from '@/lib/messagingLifecycle';

export interface ContractContextBarProps {
    /** Job / contract title */
    title: string;
    /** Contract amount in TND */
    amount: number;
    /** Whether escrow has been funded */
    escrowFunded: boolean;
    /** Normalized contract lifecycle status */
    status: ContractMessagingStatus | null;
    /** Upcoming deadline or milestone due date (ISO string) */
    deadline: string | null;
    /** Number of revision requests so far */
    revisionCount: number;
    /** Max allowed revisions */
    maxRevisions: number;
    /** Role of the current viewer */
    userRole: 'client' | 'freelancer';
    /** ISO string: when delivery was submitted */
    deliverySubmittedAt: string | null;
    /** ISO string: review deadline */
    reviewDueAt: string | null;
    /** Whether the current user has left a review */
    hasReview: boolean;
    /** True while a modal is loading */
    isActing?: boolean;
    /** Accent color class for workspace */
    accentColor?: 'amber' | 'violet' | 'sky';
    onDeliver: () => void;
    onAccept: () => void;
    onRevision: () => void;
    onOpenWorkspace: () => void;
    onLeaveReview: () => void;
    onFundEscrow: () => void;
}

const fmt = (iso: string | null): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtAmount = (n: number): string =>
    new Intl.NumberFormat('fr-TN', { maximumFractionDigits: 2 }).format(n);

interface StatusConfig {
    label: string;
    chipStyle: string;
    shellStyle: string;
    icon: React.ReactNode;
}

function getStatusConfig(
    status: ContractMessagingStatus | null,
    role: 'client' | 'freelancer',
): StatusConfig {
    switch (status) {
        case 'pending_payment':
            return {
                label: 'Awaiting Payment',
                chipStyle: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
                shellStyle: 'border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent',
                icon: <Lock className="w-3 h-3" />,
            };
        case 'active':
            return {
                label: role === 'client' ? 'In Progress' : 'Active',
                chipStyle: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
                shellStyle: 'border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent',
                icon: <Zap className="w-3 h-3" />,
            };
        case 'delivery_submitted':
            return {
                label: 'Under Review',
                chipStyle: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
                shellStyle: 'border-sky-500/20 bg-gradient-to-r from-sky-500/5 to-transparent',
                icon: <Clock className="w-3 h-3" />,
            };
        case 'revision_requested':
            return {
                label: 'Revision Requested',
                chipStyle: 'border-orange-400/40 bg-orange-400/10 text-orange-200',
                shellStyle: 'border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-transparent',
                icon: <RotateCcw className="w-3 h-3" />,
            };
        case 'disputed':
            return {
                label: 'Disputed',
                chipStyle: 'border-red-400/40 bg-red-400/10 text-red-200',
                shellStyle: 'border-red-500/20 bg-gradient-to-r from-red-500/5 to-transparent',
                icon: <AlertTriangle className="w-3 h-3" />,
            };
        case 'completed':
            return {
                label: 'Completed',
                chipStyle: 'border-teal-400/40 bg-teal-400/10 text-teal-200',
                shellStyle: 'border-teal-500/20 bg-gradient-to-r from-teal-500/5 to-transparent',
                icon: <CheckCircle2 className="w-3 h-3" />,
            };
        case 'cancelled':
            return {
                label: 'Cancelled',
                chipStyle: 'border-red-400/30 bg-red-400/5 text-red-300/70',
                shellStyle: 'border-red-500/10 bg-transparent',
                icon: null,
            };
        default:
            return {
                label: 'Contract',
                chipStyle: 'border-white/15 bg-white/5 text-white/60',
                shellStyle: 'border-white/8 bg-transparent',
                icon: null,
            };
    }
}

export function ContractContextBar({
    title,
    amount,
    escrowFunded,
    status,
    deadline,
    revisionCount,
    maxRevisions,
    userRole,
    deliverySubmittedAt,
    reviewDueAt,
    hasReview,
    isActing = false,
    onDeliver,
    onAccept,
    onRevision,
    onOpenWorkspace,
    onLeaveReview,
    onFundEscrow,
}: ContractContextBarProps) {
    const [expanded, setExpanded] = useState(false);

    const cfg = getStatusConfig(status, userRole);
    const revisionRemaining = Math.max(maxRevisions - revisionCount, 0);
    const isTerminal = status === 'completed' || status === 'cancelled' || status === 'disputed';

    // ── Role-aware CTAs ──────────────────────────────────────────────────────
    const primaryCta = (() => {
        if (status === 'pending_payment' && userRole === 'client') {
            return (
                <button
                    type="button"
                    onClick={onFundEscrow}
                    disabled={isActing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-black transition hover:bg-amber-400 active:scale-95 disabled:opacity-50"
                >
                    <Shield className="w-3 h-3" />
                    Fund Escrow
                </button>
            );
        }
        if ((status === 'active' || status === 'revision_requested') && userRole === 'freelancer') {
            return (
                <button
                    type="button"
                    onClick={onDeliver}
                    disabled={isActing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-violet-500 active:scale-95 disabled:opacity-50"
                >
                    <Send className="w-3 h-3" />
                    Deliver Work
                </button>
            );
        }
        if (status === 'delivery_submitted' && userRole === 'client') {
            return (
                <button
                    type="button"
                    onClick={onAccept}
                    disabled={isActing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                >
                    <CheckCircle2 className="w-3 h-3" />
                    Accept & Pay
                </button>
            );
        }
        if (status === 'completed' && !hasReview) {
            return (
                <button
                    type="button"
                    onClick={onLeaveReview}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-black transition hover:bg-amber-400 active:scale-95"
                >
                    <Star className="w-3 h-3" />
                    Leave Review
                </button>
            );
        }
        return null;
    })();

    const secondaryCta = (() => {
        if (status === 'delivery_submitted' && userRole === 'client' && revisionRemaining > 0) {
            return (
                <button
                    type="button"
                    onClick={onRevision}
                    disabled={isActing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:bg-white/5 disabled:opacity-50"
                >
                    <RotateCcw className="w-3 h-3" />
                    Request Revision ({revisionRemaining} left)
                </button>
            );
        }
        return null;
    })();

    return (
        <div className={`relative mx-4 mt-3 md:mx-6 overflow-hidden rounded-xl border transition-all duration-200 ${cfg.shellStyle}`}>
            {/* ── Collapsed header row ── */}
            <button
                type="button"
                onClick={() => setExpanded(p => !p)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left"
            >
                {/* Status chip */}
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${cfg.chipStyle}`}>
                    {cfg.icon}
                    {cfg.label}
                </span>

                {/* Title */}
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-white/80">
                    {title}
                </span>

                {/* Quick amount pill */}
                <span className="shrink-0 rounded-md border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                    {fmtAmount(amount)} TND
                </span>

                {/* Chevron */}
                <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
                />
            </button>

            {/* ── Expanded content ── */}
            {expanded && (
                <div className="border-t border-white/[0.06] px-3 pb-3 pt-2.5 space-y-3">
                    {/* Info chips row */}
                    <div className="flex flex-wrap gap-1.5">
                        {deadline && (
                            <span className="flex items-center gap-1 rounded-md border border-white/8 bg-black/20 px-2 py-1 text-[11px] text-white/50">
                                <Clock className="w-3 h-3" />
                                Deadline <span className="ml-0.5 text-white/80 font-medium">{fmt(deadline)}</span>
                            </span>
                        )}
                        {status === 'delivery_submitted' && reviewDueAt && (
                            <span className="flex items-center gap-1 rounded-md border border-sky-500/20 bg-sky-500/5 px-2 py-1 text-[11px] text-sky-200/80">
                                <Clock className="w-3 h-3" />
                                Review by <span className="ml-0.5 text-sky-100 font-medium">{fmt(reviewDueAt)}</span>
                            </span>
                        )}
                        {status === 'delivery_submitted' && deliverySubmittedAt && (
                            <span className="flex items-center gap-1 rounded-md border border-white/8 bg-black/20 px-2 py-1 text-[11px] text-white/50">
                                Delivered on <span className="ml-0.5 text-white/70 font-medium">{fmt(deliverySubmittedAt)}</span>
                            </span>
                        )}
                        {!isTerminal && maxRevisions > 0 && (
                            <span className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] ${revisionRemaining === 0 ? 'border-red-500/20 bg-red-500/5 text-red-300' : 'border-white/8 bg-black/20 text-white/50'}`}>
                                <RotateCcw className="w-3 h-3" />
                                Revisions: <span className={`ml-0.5 font-semibold ${revisionRemaining === 0 ? 'text-red-300' : 'text-white/80'}`}>{revisionCount}/{maxRevisions}</span>
                            </span>
                        )}
                        {!escrowFunded && status === 'pending_payment' && (
                            <span className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                                <Lock className="w-3 h-3" />
                                Escrow not funded
                            </span>
                        )}
                        {escrowFunded && (
                            <span className="flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/8 px-2 py-1 text-[11px] text-emerald-300">
                                <Shield className="w-3 h-3" />
                                Escrow secured
                            </span>
                        )}
                    </div>

                    {/* Action buttons */}
                    {(primaryCta || secondaryCta || true) && (
                        <div className="flex flex-wrap items-center gap-2">
                            {primaryCta}
                            {secondaryCta}
                            <button
                                type="button"
                                onClick={onOpenWorkspace}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white/60 transition hover:bg-white/5 hover:text-white/90 ml-auto"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Full Workspace
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
