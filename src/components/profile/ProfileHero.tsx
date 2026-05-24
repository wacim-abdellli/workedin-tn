/**
 * ProfileHero - Upwork-style Profile Header
 * Clean, professional header matching Upwork's exact design
 * Features:
 *   - Large circular avatar with green availability dot
 *   - Name with inline verification checkmark
 *   - Location and stats in a single clean row
 *   - Minimal, professional styling
 */

import { Camera, Loader2, MapPin, Calendar, CheckCircle, Edit2, ShieldCheck, AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export type ProfileHeroVariant = 'freelancer' | 'client';

interface ProfileHeroBadge {
    label: string;
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
    rate?: string;
    avatarUrl?: string | null;
    badges?: ProfileHeroBadge[];
    meta?: ProfileHeroMeta[];
    actions?: ReactNode;
    isOwner?: boolean;
    isUploadingAvatar?: boolean;
    onAvatarUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    verificationStatus?: 'verified' | 'unverified' | null;
    onVerify?: () => void;
    extraRow?: ReactNode;
    availabilityStatus?: 'available' | 'busy' | 'offline';
}

function getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileHero({
    variant,
    name,
    subtitle,
    rate,
    avatarUrl,
    badges = [],
    meta = [],
    actions,
    isOwner = false,
    isUploadingAvatar = false,
    onAvatarUpload,
    verificationStatus,
    onVerify,
    extraRow,
    availabilityStatus,
}: ProfileHeroProps) {
    return (
        <div
            className="relative overflow-hidden border-b"
            style={{
                background: 'var(--color-bg-base)',
                borderColor: 'var(--color-border-subtle)',
            }}
        >
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    {/* ── Avatar - Upwork style with green dot ────────────────────── */}
                    <div className="relative shrink-0 group">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={name}
                                className="w-28 h-28 rounded-full object-cover border-4"
                                style={{ borderColor: 'var(--color-bg-base)' }}
                            />
                        ) : (
                            <div
                                className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold text-white select-none border-4"
                                style={{
                                    background: '#14A800',
                                    borderColor: 'var(--color-bg-base)',
                                }}
                            >
                                {getInitials(name)}
                            </div>
                        )}
                        
                        {/* Availability dot - bottom-right corner */}
                        {availabilityStatus === 'available' && (
                            <span
                                className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-4"
                                style={{
                                    background: '#14A800',
                                    borderColor: 'var(--color-bg-base)',
                                }}
                                aria-hidden="true"
                            />
                        )}

                        {/* Camera overlay (owner only) */}
                        {isOwner && onAvatarUpload && (
                            <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
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
                        {/* Name + verification + actions */}
                        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                    {name}
                                </h1>
                                
                                {/* Verification badge */}
                                {verificationStatus === 'verified' && (
                                    <CheckCircle 
                                        className="w-5 h-5 shrink-0" 
                                        style={{ color: '#14A800' }}
                                        aria-label="Verified"
                                    />
                                )}
                            </div>
                            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
                        </div>

                        {/* Subtitle (title) */}
                        {subtitle && (
                            <p className="text-base mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                                {subtitle}
                            </p>
                        )}

                        {/* Meta row - location, rating, stats */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            {meta.map((item, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                    <span style={{ color: 'var(--color-text-tertiary)' }}>{item.icon}</span>
                                    <span>{item.label}</span>
                                </span>
                            ))}
                        </div>

                        {/* Extra slot */}
                        {extraRow && <div className="mt-3">{extraRow}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Re-export helpers ──────────────────────────────────────────────────────
export { MapPin, Calendar, CheckCircle, Edit2, ShieldCheck, AlertCircle };
export type { ProfileHeroBadge, ProfileHeroMeta };
