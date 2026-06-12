/**
 * ProfileSection - Upwork-style section wrapper
 * Clean, minimal design matching Upwork's profile sections
 */

import type { ReactNode } from 'react';
import { Edit2 } from 'lucide-react';

interface ProfileSectionProps {
    title?: string;
    trailing?: ReactNode;
    children: ReactNode;
    className?: string;
    animationDelay?: number;
    noPadding?: boolean;
    onEdit?: () => void;
    editLabel?: string;
}

export function ProfileSection({
    title,
    trailing,
    children,
    className = '',
    animationDelay = 0,
    noPadding = false,
    onEdit,
    editLabel = 'Edit',
}: ProfileSectionProps) {
    return (
        <section
            className={`surface-card border rounded-lg overflow-hidden animate-in fade-in duration-200 ${className}`}
            style={{
                borderColor: 'var(--color-border-subtle)',
                animationDelay: animationDelay > 0 ? `${animationDelay}ms` : undefined,
                animationFillMode: 'both',
            }}
        >
            {/* Title bar */}
            {(title || trailing || onEdit) && (
                <div
                    className="flex items-center justify-between gap-3 px-6 py-4 border-b"
                    style={{
                        borderColor: 'var(--color-border-subtle)',
                    }}
                >
                    {title && (
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {title}
                        </h2>
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                        {trailing}
                        {onEdit && (
                            <button
                                type="button"
                                onClick={onEdit}
                                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-all duration-150"
                                style={{
                                    color: 'var(--color-text-secondary)',
                                    borderColor: 'var(--color-border-subtle)',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                {editLabel}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className={noPadding ? '' : 'p-6'}>
                {children}
            </div>
        </section>
    );
}

/** Skill/Tool tag - Upwork style */
export function ProfileTag({
    label,
    _accentColor = '#8B5CF6',
    size = 'sm',
}: {
    label: string;
    accentColor?: string;
    size?: 'xs' | 'sm';
}) {
    const padding = size === 'xs' ? 'px-3 py-1.5 text-xs' : 'px-3 py-1.5 text-sm';
    return (
        <span
            className={`inline-flex items-center ${padding} rounded-full border font-medium`}
            style={{
                background: 'var(--color-bg-subtle)',
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border-default)',
            }}
        >
            {label}
        </span>
    );
}

/** Empty state placeholder */
export function ProfileEmptySlot({
    message,
    cta,
}: {
    message: string;
    cta?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{message}</p>
            {cta}
        </div>
    );
}
