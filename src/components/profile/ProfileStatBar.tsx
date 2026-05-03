/**
 * ProfileStatBar
 * A horizontal strip of 4 key stats rendered immediately below the ProfileHero.
 * - Accent-tinted icon background
 * - Large bold value, small label
 * - Subtle dividers between items
 * - Responsive: 2×2 grid on mobile, single row on sm+
 */

import type { ReactNode } from 'react';
import type { ProfileHeroVariant } from './ProfileHero';

export interface ProfileStat {
    icon: ReactNode;
    label: string;
    value: string | number;
    /** If provided, renders as a highlighted value (e.g. earnings) */
    highlight?: boolean;
}

interface ProfileStatBarProps {
    stats: ProfileStat[];
    variant: ProfileHeroVariant;
}

const ACCENT: Record<ProfileHeroVariant, { color: string; bg: string; border: string }> = {
    freelancer: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)' },
    client:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.15)'  },
};

export function ProfileStatBar({ stats, variant }: ProfileStatBarProps) {
    const ac = ACCENT[variant];

    return (
        <div
            className="max-w-6xl mx-auto px-4 sm:px-6"
            style={{ borderBottom: `1px solid var(--color-border-subtle)` }}
        >
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0"
                 style={{ divideColor: 'var(--color-border-subtle)' }}>
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-4 sm:py-5 transition-colors duration-150 hover:bg-white/[0.02]"
                    >
                        {/* Icon */}
                        <div
                            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: ac.bg, color: ac.color }}
                        >
                            {stat.icon}
                        </div>

                        {/* Value + Label */}
                        <div className="min-w-0">
                            <p
                                className="text-lg font-black leading-none truncate"
                                style={{ color: stat.highlight ? ac.color : 'var(--color-text-primary)' }}
                            >
                                {stat.value !== '' && stat.value !== null && stat.value !== undefined
                                    ? stat.value
                                    : <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                                }
                            </p>
                            <p className="text-[11px] font-medium mt-0.5 uppercase tracking-wide truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                                {stat.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
