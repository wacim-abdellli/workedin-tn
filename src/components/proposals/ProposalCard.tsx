import { useState, memo } from 'react';
import { Star, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import type { Proposal } from '../../types/proposal';
import { useTranslation } from '../../i18n';

interface ProposalListItemProps {
    proposal: Proposal;
    isSelected: boolean;
    onClick: () => void;
}

function statusMeta(status: string) {
    const s = status === 'pending' ? 'new' : status;
    if (s === 'new') return { label: 'New', dot: '#6366f1', bg: 'rgba(99,102,241,0.14)', text: '#818cf8' };
    if (s === 'shortlisted') return { label: 'Shortlisted', dot: '#f59e0b', bg: 'rgba(245,158,11,0.14)', text: '#fbbf24' };
    if (s === 'archived') return { label: 'Archived', dot: '#64748b', bg: 'rgba(100,116,139,0.14)', text: '#94a3b8' };
    if (s === 'accepted') return { label: 'Accepted', dot: '#22c55e', bg: 'rgba(34,197,94,0.14)', text: '#4ade80' };
    if (s === 'rejected') return { label: 'Declined', dot: '#ef4444', bg: 'rgba(239,68,68,0.14)', text: '#f87171' };
    return { label: s, dot: '#64748b', bg: 'rgba(100,116,139,0.14)', text: '#94a3b8' };
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
            className="w-full text-left flex gap-3 px-4 py-3.5 border-b transition-colors relative focus:outline-none"
            style={{
                background: isSelected
                    ? 'color-mix(in srgb, var(--workspace-primary) 8%, var(--card-bg))'
                    : 'transparent',
                borderColor: 'color-mix(in srgb, var(--border) 45%, transparent)',
            }}
        >
            {/* Active indicator */}
            {isSelected && (
                <span
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
                    style={{ background: 'var(--workspace-primary)' }}
                />
            )}

            {/* Avatar */}
            <div className="relative shrink-0 mt-0.5">
                {freelancer.avatar_url ? (
                    <img
                        src={freelancer.avatar_url}
                        alt={freelancer.full_name}
                        className="w-10 h-10 rounded-xl object-cover"
                        style={{ border: '1.5px solid color-mix(in srgb, var(--border) 60%, transparent)' }}
                    />
                ) : (
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
                        style={{
                            background: `linear-gradient(135deg, ${meta.bg}, color-mix(in srgb, ${meta.dot} 8%, var(--card-bg)))`,
                            color: meta.text,
                            border: `1.5px solid ${meta.bg}`,
                        }}
                    >
                        {initials}
                    </div>
                )}
                {freelancer.is_online && (
                    <span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                        style={{ background: '#22c55e', borderColor: 'var(--card-bg)' }}
                    />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Name row */}
                <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                        className="font-bold text-sm truncate"
                        style={{ color: isSelected ? 'var(--workspace-primary-mid)' : 'var(--text-primary)' }}
                    >
                        {freelancer.full_name}
                    </span>
                    <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(created_at)}
                    </span>
                </div>

                {/* Title */}
                {freelancer.title && (
                    <p className="text-[11px] truncate mb-1" style={{ color: 'var(--text-muted)' }}>
                        {freelancer.title}
                    </p>
                )}

                {/* Cover preview */}
                <p
                    className="text-xs truncate mb-2 leading-snug"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {cover_letter || 'No cover letter'}
                </p>

                {/* Footer row */}
                <div className="flex items-center justify-between gap-2">
                    <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: meta.bg, color: meta.text }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
                        {meta.label}
                    </span>
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {(freelancer.rating ?? 0) > 0 && (
                            <span className="flex items-center gap-0.5">
                                <Star className="w-3 h-3" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                                {freelancer.rating?.toFixed(1)}
                            </span>
                        )}
                        <span className="flex items-center gap-0.5 font-bold" style={{ color: 'var(--workspace-primary-mid)' }}>
                            <DollarSign className="w-3 h-3" />
                            {bid_amount}
                        </span>
                        {duration > 0 && (
                            <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {duration}d
                            </span>
                        )}
                        {status === 'accepted' && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />}
                    </div>
                </div>
            </div>
        </button>
    );
}

export default memo(ProposalListItem);
