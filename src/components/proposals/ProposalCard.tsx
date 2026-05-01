import { useState, memo } from 'react';
import { Star, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import type { Proposal } from '../../types/proposal';
import { useTranslation } from '../../i18n';

interface ProposalListItemProps {
    proposal: Proposal;
    isSelected: boolean;
    onClick: () => void;
    onHire?: (proposalId: string) => void;
}

function statusMeta(status: string) {
    const s = status === 'pending' ? 'new' : status;
    if (s === 'new') return { label: 'New', dot: 'bg-indigo-400', bg: 'bg-indigo-500/10', text: 'text-indigo-400' };
    if (s === 'shortlisted') return { label: 'Shortlisted', dot: 'bg-amber-400', bg: 'bg-amber-500/10', text: 'text-amber-400' };
    if (s === 'archived') return { label: 'Archived', dot: 'bg-slate-400', bg: 'bg-white/5', text: 'text-[var(--color-text-primary)]/50' };
    if (s === 'accepted') return { label: 'Accepted', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
    if (s === 'rejected') return { label: 'Declined', dot: 'bg-rose-400', bg: 'bg-rose-500/10', text: 'text-rose-400' };
    return { label: s, dot: 'bg-slate-400', bg: 'bg-white/5', text: 'text-[var(--color-text-primary)]/50' };
}

function timeAgo(dateStr: string) {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
    if (mins < 2) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return d === 1 ? '1d ago' : `${d}d ago`;
}

function ProposalListItem({ proposal, isSelected, onClick }: ProposalListItemProps) {
    const { freelancer, cover_letter, bid_amount, duration, created_at, status } = proposal;
    const meta = statusMeta(status);
    const initials = freelancer.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left flex gap-3 px-4 py-4 border-b transition-colors relative focus:outline-none ${isSelected ? 'bg-amber-500/5 border-amber-500/20' : 'bg-transparent border-white/5 hover:bg-[var(--color-bg-elevated)]'}`}
        >
            {/* Active indicator */}
            {isSelected && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500 rounded-r-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            )}

            {/* Avatar */}
            <div className="relative shrink-0 mt-0.5">
                {freelancer.avatar_url ? (
                    <img
                        src={freelancer.avatar_url}
                        alt={freelancer.full_name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10"
                    />
                ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border border-white/5 ${meta.bg} ${meta.text}`}>
                        {initials}
                    </div>
                )}
                {freelancer.is_online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a] bg-emerald-500" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Name row */}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`font-bold text-sm truncate ${isSelected ? 'text-amber-400' : 'text-[var(--color-text-primary)]'}`}>
                        {freelancer.full_name}
                    </span>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--color-text-primary)]/40 shrink-0">
                        {timeAgo(created_at)}
                    </span>
                </div>

                {/* Title */}
                {freelancer.title && (
                    <p className="text-xs truncate mb-1 text-[var(--color-text-primary)]/50">
                        {freelancer.title}
                    </p>
                )}

                {/* Cover preview */}
                <p className="text-xs truncate mb-2 leading-snug text-[var(--color-text-primary)]/60">
                    {cover_letter || 'No cover letter'}
                </p>

                {/* Footer row */}
                <div className="flex items-center justify-between gap-2 mt-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-primary)]/50 font-semibold">
                        {(freelancer.rating ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                {freelancer.rating?.toFixed(1)}
                            </span>
                        )}
                        <span className="flex items-center gap-0.5 font-bold text-amber-400">
                            <DollarSign className="w-3.5 h-3.5" />
                            {bid_amount}
                        </span>
                        {duration > 0 && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {duration}d
                            </span>
                        )}
                        {status === 'accepted' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                </div>
            </div>
        </button>
    );
}

export default memo(ProposalListItem);


