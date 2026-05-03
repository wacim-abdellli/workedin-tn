/**
 * ProfileSection
 * Consistent section wrapper used throughout both profile pages.
 * - surface-card background + rounded border
 * - Title bar with optional icon, edit button, and trailing slot
 * - Smooth animate-in on mount
 * - Staggered delay via `animationDelay` for sequential reveal
 */

import type { ReactNode } from 'react';
import { Edit2 } from 'lucide-react';

interface ProfileSectionProps {
    title?: string;
    icon?: ReactNode;
    /** Slot in the title row trailing area (e.g. count badge, action button) */
    trailing?: ReactNode;
    /** Fires when the pencil edit button is clicked */
    onEdit?: () => void;
    editLabel?: string;
    children: ReactNode;
    className?: string;
    /** Optional stagger delay in ms for the entrance animation */
    animationDelay?: number;
    /** If true, no internal padding — useful for full-bleed content like portfolio grids */
    noPadding?: boolean;
}

export function ProfileSection({
    title,
    icon,
    trailing,
    onEdit,
    editLabel = 'Edit',
    children,
    className = '',
    animationDelay = 0,
    noPadding = false,
}: ProfileSectionProps) {
    return (
        <section
            className={`surface-card border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-400 ${className}`}
            style={{
                borderColor: 'var(--color-border-subtle)',
                animationDelay: animationDelay > 0 ? `${animationDelay}ms` : undefined,
                animationFillMode: 'both',
            }}
        >
            {/* Title bar */}
            {(title || trailing || onEdit) && (
                <div
                    className="flex items-center justify-between gap-3 px-5 py-4 border-b"
                    style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                    {title && (
                        <div className="flex items-center gap-2 min-w-0">
                            {icon && (
                                <span className="shrink-0 text-[var(--color-text-tertiary)]">{icon}</span>
                            )}
                            <h2 className="text-sm font-bold uppercase tracking-widest truncate" style={{ color: 'var(--color-text-secondary)' }}>
                                {title}
                            </h2>
                        </div>
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                        {trailing}
                        {onEdit && (
                            <button
                                type="button"
                                onClick={onEdit}
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all duration-150 hover:bg-white/5"
                                style={{ color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border-subtle)' }}
                            >
                                <Edit2 className="w-3 h-3" />
                                {editLabel}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className={noPadding ? '' : 'p-5'}>
                {children}
            </div>
        </section>
    );
}

/** Small accent pill used inside sections (e.g. skill tags, tool pills) */
export function ProfileTag({
    label,
    accentColor = '#8B5CF6',
    size = 'sm',
}: {
    label: string;
    accentColor?: string;
    size?: 'xs' | 'sm';
}) {
    const padding = size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';
    return (
        <span
            className={`inline-flex items-center ${padding} rounded-full border font-medium`}
            style={{
                background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                color: accentColor,
                borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
            }}
        >
            {label}
        </span>
    );
}

/** Empty state placeholder within a section */
export function ProfileEmptySlot({
    message,
    cta,
}: {
    message: string;
    cta?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{message}</p>
            {cta}
        </div>
    );
}
