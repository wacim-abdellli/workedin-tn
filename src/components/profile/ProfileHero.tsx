/**
 * ProfileHero
 * Full-width hero banner that appears at the top of both FreelancerProfile
 * and ClientProfile. Handles:
 *   - Workspace-tinted radial gradient background
 *   - Large avatar with ring + optional camera overlay (owner only)
 *   - Name, subtitle, badge pills
 *   - Meta row (location, member since, quick stats)
 *   - Contextual action buttons (owner edit | visitor contact/invite)
 *
 * Designed to be data-agnostic: callers pass pre-processed strings.
 */

import { Camera, Loader2, MapPin, Calendar, CheckCircle, Edit2 } from 'lucide-react';
import type { ReactNode } from 'react';

export type ProfileHeroVariant = 'freelancer' | 'client';

interface ProfileHeroBadge {
    label: string;
    /** Filled pill or outlined */
    style?: 'filled' | 'outlined' | 'success' | 'neutral';
    icon?: ReactNode;
}

interface ProfileHeroMeta {
    icon: ReactNode;
    label: string;
}

interface ProfileHeroProps {
    variant: ProfileHeroVariant;
    name: string;
    subtitle?: string;
    avatarUrl?: string | null;
    badges?: ProfileHeroBadge[];
    meta?: ProfileHeroMeta[];

    /** Slot for action buttons in top-right — pass pre-built buttons */
    actions?: ReactNode;

    /** Owner avatar upload */
    isOwner?: boolean;
    isUploadingAvatar?: boolean;
    onAvatarUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;

    /** Optional extra row rendered below meta (e.g. availability pill) */
    extraRow?: ReactNode;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const VARIANT_CONFIG = {
    freelancer: {
        accent: '#8B5CF6',
        accentAlpha18: 'rgba(139,92,246,0.18)',
        accentAlpha12: 'rgba(139,92,246,0.12)',
        accentAlpha35: 'rgba(139,92,246,0.35)',
        ringClass: 'ring-[#8B5CF6]/25',
        gradientOrb: 'rgba(139,92,246,0.20)',
    },
    client: {
        accent: '#F59E0B',
        accentAlpha18: 'rgba(245,158,11,0.18)',
        accentAlpha12: 'rgba(245,158,11,0.12)',
        accentAlpha35: 'rgba(245,158,11,0.35)',
        ringClass: 'ring-[#F59E0B]/25',
        gradientOrb: 'rgba(245,158,11,0.20)',
    },
} as const;

function getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
}

function getBadgeStyle(
    style: ProfileHeroBadge['style'] = 'filled',
    accent: string,
    accentAlpha12: string,
    accentAlpha35: string,
): React.CSSProperties {
    if (style === 'filled') return { background: accentAlpha12, color: accent, borderColor: accentAlpha35 };
    if (style === 'success') return { background: 'rgba(16,185,129,0.10)', color: '#10B981', borderColor: 'rgba(16,185,129,0.25)' };
    if (style === 'neutral') return { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.12)' };
    // outlined
    return { background: 'transparent', color: accent, borderColor: accentAlpha35 };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileHero({
    variant,
    name,
    subtitle,
    avatarUrl,
    badges = [],
    meta = [],
    actions,
    isOwner = false,
    isUploadingAvatar = false,
    onAvatarUpload,
    extraRow,
}: ProfileHeroProps) {
    const cfg = VARIANT_CONFIG[variant];

    return (
        <div
            className="relative overflow-hidden"
            style={{
                background: `radial-gradient(ellipse at 85% 0%, ${cfg.accentAlpha18} 0%, transparent 55%),
                             radial-gradient(ellipse at 10% 100%, ${cfg.gradientOrb} 0%, transparent 40%),
                             var(--color-background-base)`,
                borderBottom: `1px solid ${cfg.accentAlpha35}`,
            }}
        >
            {/* Decorative blur orb */}
            <div
                className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full blur-3xl"
                style={{ background: cfg.gradientOrb }}
                aria-hidden
            />

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                    {/* ── Avatar ────────────────────────────────────────── */}
                    <div className="relative shrink-0 group">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={name}
                                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-offset-2 transition-transform duration-300 ${cfg.ringClass}`}
                                style={{ ringOffsetColor: 'var(--color-background-base)' }}
                            />
                        ) : (
                            <div
                                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-3xl font-black text-white ring-4 ring-offset-2 select-none ${cfg.ringClass}`}
                                style={{
                                    background: `linear-gradient(135deg, ${cfg.accent}, color-mix(in srgb, ${cfg.accent} 60%, #1a1a2e))`,
                                    ringOffsetColor: 'var(--color-background-base)',
                                }}
                            >
                                {getInitials(name)}
                            </div>
                        )}

                        {/* Camera overlay (owner only) */}
                        {isOwner && onAvatarUpload && (
                            <label className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                                {isUploadingAvatar
                                    ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    : <Camera className="w-6 h-6 text-white" />
                                }
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,.gif"
                                    className="hidden"
                                    onChange={onAvatarUpload}
                                    disabled={isUploadingAvatar}
                                />
                            </label>
                        )}
                    </div>

                    {/* ── Info column ───────────────────────────────────── */}
                    <div className="flex-1 min-w-0">
                        {/* Name + actions row */}
                        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                                    {name}
                                </h1>
                                {subtitle && (
                                    <p className="mt-1 text-sm sm:text-base font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
                        </div>

                        {/* Badge pills */}
                        {badges.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {badges.map((badge, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold"
                                        style={getBadgeStyle(badge.style, cfg.accent, cfg.accentAlpha12, cfg.accentAlpha35)}
                                    >
                                        {badge.icon}
                                        {badge.label}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Meta row (location, date, etc.) */}
                        {meta.length > 0 && (
                            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                {meta.map((item, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5">
                                        {item.icon}
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Extra slot (e.g. availability, rating preview) */}
                        {extraRow && <div className="mt-3">{extraRow}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Re-export helpers so consumers don't need to duplicate ──────────────────
export { MapPin, Calendar, CheckCircle, Edit2 };
export type { ProfileHeroBadge, ProfileHeroMeta };
