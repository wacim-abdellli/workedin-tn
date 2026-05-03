/**
 * ProfileActionSidebar
 * The right-column sidebar used by both FreelancerProfile and ClientProfile.
 *
 * Slots:
 *   primaryCta    — Main action button (Contact / Send Proposal / Invite)
 *   workspaceInfo — Key–value pairs (Location, Member since, Last seen, etc.)
 *   verifications — List of verification checks with pass/pending status
 *   ownerActions  — Quick-action links shown only to the profile owner
 *   extra         — Any additional content below
 */

import type { ReactNode } from 'react';
import { Check, Circle, ExternalLink } from 'lucide-react';
import type { ProfileHeroVariant } from './ProfileHero';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkspaceInfoItem {
    label: string;
    value: ReactNode;
}

export interface VerificationItem {
    label: string;
    passed: boolean;
}

export interface OwnerQuickAction {
    icon: ReactNode;
    label: string;
    description?: string;
    onClick: () => void;
    /** If true show an external link indicator */
    external?: boolean;
}

interface ProfileActionSidebarProps {
    variant: ProfileHeroVariant;
    primaryCta?: ReactNode;
    workspaceInfo?: WorkspaceInfoItem[];
    verifications?: VerificationItem[];
    ownerActions?: OwnerQuickAction[];
    extra?: ReactNode;
}

// ─── Accent config ────────────────────────────────────────────────────────────

const ACCENT: Record<ProfileHeroVariant, { color: string; bg: string; border: string; glow: string }> = {
    freelancer: {
        color:  '#8B5CF6',
        bg:     'rgba(139,92,246,0.08)',
        border: 'rgba(139,92,246,0.20)',
        glow:   'rgba(139,92,246,0.12)',
    },
    client: {
        color:  '#F59E0B',
        bg:     'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.20)',
        glow:   'rgba(245,158,11,0.10)',
    },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SidebarCard({
    title,
    children,
    accent,
}: {
    title?: string;
    children: ReactNode;
    accent: typeof ACCENT['freelancer'];
}) {
    return (
        <div
            className="surface-card border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-400"
            style={{ borderColor: 'var(--color-border-subtle)', animationFillMode: 'both' }}
        >
            {title && (
                <div
                    className="px-4 py-3 border-b flex items-center gap-2"
                    style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                    <span
                        className="w-1 h-4 rounded-full shrink-0"
                        style={{ background: accent.color }}
                        aria-hidden
                    />
                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
                        {title}
                    </h3>
                </div>
            )}
            <div className="p-4">{children}</div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileActionSidebar({
    variant,
    primaryCta,
    workspaceInfo = [],
    verifications = [],
    ownerActions = [],
    extra,
}: ProfileActionSidebarProps) {
    const ac = ACCENT[variant];

    return (
        <aside className="flex flex-col gap-4">
            {/* Primary CTA */}
            {primaryCta && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationFillMode: 'both' }}>
                    {primaryCta}
                </div>
            )}

            {/* Workspace info card */}
            {workspaceInfo.length > 0 && (
                <SidebarCard title="Workspace Info" accent={ac}>
                    <dl className="space-y-3">
                        {workspaceInfo.map((item, i) => (
                            <div key={i} className="flex items-start justify-between gap-3 text-sm">
                                <dt className="shrink-0 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                                    {item.label}
                                </dt>
                                <dd className="text-right font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                                    {item.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </SidebarCard>
            )}

            {/* Verifications */}
            {verifications.length > 0 && (
                <SidebarCard title="Verifications" accent={ac}>
                    <ul className="space-y-2.5">
                        {verifications.map((v, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm">
                                {v.passed ? (
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                    </span>
                                ) : (
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <Circle className="w-3 h-3" style={{ color: 'var(--color-text-tertiary)' }} />
                                    </span>
                                )}
                                <span style={{ color: v.passed ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                                    {v.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </SidebarCard>
            )}

            {/* Owner quick-actions */}
            {ownerActions.length > 0 && (
                <SidebarCard title="Quick Actions" accent={ac}>
                    <ul className="space-y-1 -mx-1">
                        {ownerActions.map((action, i) => (
                            <li key={i}>
                                <button
                                    type="button"
                                    onClick={action.onClick}
                                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group hover:bg-white/[0.04]"
                                >
                                    {/* Icon circle */}
                                    <span
                                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 transition-colors"
                                        style={{ background: ac.bg, color: ac.color }}
                                    >
                                        {action.icon}
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                            {action.label}
                                            {action.external && <ExternalLink className="w-3 h-3 opacity-50" />}
                                        </span>
                                        {action.description && (
                                            <span className="block text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                                                {action.description}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </SidebarCard>
            )}

            {/* Extra slot */}
            {extra}
        </aside>
    );
}
