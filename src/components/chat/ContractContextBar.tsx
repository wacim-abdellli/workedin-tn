import { useState } from 'react';
import {
    ChevronDown, Shield, Clock, AlertTriangle, CheckCircle2,
    Send, RotateCcw, ExternalLink, Star, Lock, Zap,
} from 'lucide-react';
import type { ContractMessagingStatus } from '@/lib/messagingLifecycle';
import { useTranslation } from '../../i18n';

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
    glowColor: string;
    icon: React.ReactNode;
}

function getStatusConfig(
    status: ContractMessagingStatus | null,
    role: 'client' | 'freelancer',
    tx: any,
): StatusConfig {
    switch (status) {
        case 'pending_payment':
            return {
                label: tx('contract.contextBar.statusAwaitingPayment', undefined, 'Awaiting Payment'),
                chipStyle: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
                glowColor: 'bg-amber-500/10',
                icon: <Lock className="w-3 h-3 text-amber-400" />,
            };
        case 'active':
            return {
                label: role === 'client' ? tx('contract.contextBar.statusInProgress', undefined, 'In Progress') : tx('contract.contextBar.statusActive', undefined, 'Active'),
                chipStyle: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
                glowColor: 'bg-emerald-500/10',
                icon: <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />,
            };
        case 'delivery_submitted':
            return {
                label: tx('contract.contextBar.statusUnderReview', undefined, 'Under Review'),
                chipStyle: 'border-sky-400/30 bg-sky-500/10 text-sky-300',
                glowColor: 'bg-sky-500/10',
                icon: <Clock className="w-3 h-3 text-sky-400" />,
            };
        case 'revision_requested':
            return {
                label: tx('contract.contextBar.statusRevisionRequested', undefined, 'Revision Requested'),
                chipStyle: 'border-orange-400/30 bg-orange-500/10 text-orange-300',
                glowColor: 'bg-orange-500/10',
                icon: <RotateCcw className="w-3 h-3 text-orange-400" />,
            };
        case 'disputed':
            return {
                label: tx('contract.contextBar.statusDisputed', undefined, 'Disputed'),
                chipStyle: 'border-red-400/30 bg-red-500/10 text-red-300',
                glowColor: 'bg-red-500/10',
                icon: <AlertTriangle className="w-3 h-3 text-red-400 animate-bounce" />,
            };
        case 'completed':
            return {
                label: tx('contract.contextBar.statusCompleted', undefined, 'Completed'),
                chipStyle: 'border-teal-400/30 bg-teal-500/10 text-teal-300',
                glowColor: 'bg-teal-500/10',
                icon: <CheckCircle2 className="w-3 h-3 text-teal-400" />,
            };
        case 'cancelled':
            return {
                label: tx('contract.contextBar.statusCancelled', undefined, 'Cancelled'),
                chipStyle: 'border-white/10 bg-white/5 text-zinc-400',
                glowColor: 'bg-white/5',
                icon: null,
            };
        default:
            return {
                label: tx('contract.contextBar.statusContract', undefined, 'Contract'),
                chipStyle: 'border-white/10 bg-white/5 text-zinc-400',
                glowColor: 'bg-white/5',
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
    const { tx } = useTranslation();

    const cfg = getStatusConfig(status, userRole, tx);
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
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8A020] px-3.5 py-1.5 text-[11px] font-bold text-black transition hover:bg-[#f0aa28] active:scale-95 disabled:opacity-50"
                >
                    <Shield className="w-3.5 h-3.5" />
                    {tx('contract.contextBar.btnFundEscrow', undefined, 'Fund Escrow')}
                </button>
            );
        }
        if ((status === 'active' || status === 'revision_requested') && userRole === 'freelancer') {
            return (
                <button
                    type="button"
                    onClick={onDeliver}
                    disabled={isActing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B8FF0] px-3.5 py-1.5 text-[11px] font-bold text-black transition hover:bg-[#a99cf5] active:scale-95 disabled:opacity-50"
                >
                    <Send className="w-3.5 h-3.5" />
                    {tx('contract.contextBar.btnDeliverWork', undefined, 'Deliver Work')}
                </button>
            );
        }
        if (status === 'delivery_submitted' && userRole === 'client') {
            return (
                <button
                    type="button"
                    onClick={onAccept}
                    disabled={isActing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {tx('contract.contextBar.btnAcceptPay', undefined, 'Accept & Pay')}
                </button>
            );
        }
        if (status === 'completed' && !hasReview) {
            return (
                <button
                    type="button"
                    onClick={onLeaveReview}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8A020] px-3.5 py-1.5 text-[11px] font-bold text-black transition hover:bg-[#f0aa28] active:scale-95"
                >
                    <Star className="w-3.5 h-3.5" />
                    {tx('contract.contextBar.btnLeaveReview', undefined, 'Leave Review')}
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
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {tx('contract.contextBar.btnRequestRevision', { remaining: revisionRemaining }, `Request Revision (${revisionRemaining} left)`)}
                </button>
            );
        }
        return null;
    })();

    return (
        <div className="relative mx-4 mt-3 md:mx-6 overflow-hidden rounded-[16px] border border-white/[0.06] bg-[#0d0d12]/90 backdrop-blur-md shadow-[0_16px_36px_rgba(0,0,0,0.5)] transition-all duration-300">
            {/* Ambient status indicator glow */}
            <div className={`absolute -left-10 -top-10 h-24 w-24 rounded-full opacity-[0.08] blur-2xl ${cfg.glowColor}`} />

            {/* ── Collapsed header row ── */}
            <button
                type="button"
                onClick={() => setExpanded(p => !p)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.01] transition-colors"
            >
                {/* Status chip */}
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${cfg.chipStyle}`}>
                    {cfg.icon}
                    {cfg.label}
                </span>

                {/* Title */}
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white/95 leading-none">
                    {title}
                </span>

                {/* Quick amount pill */}
                <span className="shrink-0 rounded-full border border-white/[0.08] bg-black/35 px-3 py-0.5 text-[11px] font-bold text-[#9B8FF0]">
                    {fmtAmount(amount)} TND
                </span>

                {/* Chevron */}
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                />
            </button>

            {/* ── Expanded content ── */}
            {expanded && (
                <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 space-y-4">
                    {/* Info chips grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {deadline && (
                            <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.01] p-2.5">
                                <Clock className="w-4 h-4 text-zinc-400" />
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 leading-none">{tx('contract.contextBar.infoDeadline', undefined, 'Deadline')}</p>
                                    <p className="mt-1 text-[12px] font-semibold text-white/80 leading-none">{fmt(deadline)}</p>
                                </div>
                            </div>
                        )}
                        {status === 'delivery_submitted' && reviewDueAt && (
                            <div className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-2.5">
                                <Clock className="w-4 h-4 text-sky-400 animate-pulse" />
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-sky-400/70 leading-none">{tx('contract.contextBar.infoReviewPeriod', undefined, 'Review Period')}</p>
                                    <p className="mt-1 text-[12px] font-semibold text-sky-200 leading-none">{tx('contract.contextBar.infoReviewBy', { date: fmt(reviewDueAt) }, `Review by ${fmt(reviewDueAt)}`)}</p>
                                </div>
                            </div>
                        )}
                        {status === 'delivery_submitted' && deliverySubmittedAt && (
                            <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.01] p-2.5">
                                <Clock className="w-4 h-4 text-zinc-400" />
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 leading-none">{tx('contract.contextBar.infoDeliveredOn', undefined, 'Delivered On')}</p>
                                    <p className="mt-1 text-[12px] font-semibold text-white/80 leading-none">{fmt(deliverySubmittedAt)}</p>
                                </div>
                            </div>
                        )}
                        {!isTerminal && maxRevisions > 0 && (
                            <div className={`flex items-center gap-2 rounded-xl border p-2.5 ${revisionRemaining === 0 ? 'border-red-500/20 bg-red-500/5' : 'border-white/[0.04] bg-white/[0.01]'}`}>
                                <RotateCcw className={`w-4 h-4 ${revisionRemaining === 0 ? 'text-red-400' : 'text-zinc-400'}`} />
                                <div className="min-w-0">
                                    <p className={`text-[10px] uppercase font-bold tracking-wider leading-none ${revisionRemaining === 0 ? 'text-red-400/70' : 'text-zinc-500'}`}>{tx('contract.contextBar.infoRevisionsUsed', undefined, 'Revisions Used')}</p>
                                    <p className={`mt-1 text-[12px] font-semibold leading-none ${revisionRemaining === 0 ? 'text-red-300' : 'text-white/80'}`}>{revisionCount} / {maxRevisions}</p>
                                </div>
                            </div>
                        )}
                        {!escrowFunded && status === 'pending_payment' && (
                            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
                                <Lock className="w-4 h-4 text-amber-400" />
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400/70 leading-none">{tx('contract.contextBar.infoEscrowStatus', undefined, 'Escrow Status')}</p>
                                    <p className="mt-1 text-[12px] font-semibold text-amber-200 leading-none">{tx('contract.contextBar.infoEscrowNotFunded', undefined, 'Escrow not funded')}</p>
                                </div>
                            </div>
                        )}
                        {escrowFunded && (
                            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                                <Shield className="w-4 h-4 text-emerald-400" />
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/70 leading-none">{tx('contract.contextBar.infoEscrowStatus', undefined, 'Escrow Status')}</p>
                                    <p className="mt-1 text-[12px] font-semibold text-emerald-300 leading-none">{tx('contract.contextBar.infoEscrowSecured', undefined, 'Escrow secured')}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action buttons bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04]">
                        {primaryCta}
                        {secondaryCta}
                        <button
                            type="button"
                            onClick={onOpenWorkspace}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/80 transition hover:bg-white/10 hover:text-white ml-auto"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {tx('contract.contextBar.btnFullWorkspace', undefined, 'Full Workspace')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
