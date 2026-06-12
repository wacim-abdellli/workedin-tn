/**
 * ProfileActionSidebar - Upwork-style right sidebar
 * Clean, professional sidebar matching Upwork's exact design
 * Features:
 *   - Primary CTA button (Contact/Hire)
 *   - Availability & Rates card
 *   - Portfolio Links
 *   - Verifications with checkmarks
 *   - Languages
 *   - Education
 */

import type { ReactNode } from 'react';
import { Check, Circle, ChevronRight, Edit2 } from 'lucide-react';
import type { ProfileHeroVariant } from './ProfileHero';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkspaceInfoItem {
    label: string;
    value: ReactNode;
}

export interface AvailabilityItem {
    label: string;
    value: ReactNode;
}

export interface LanguageItem {
    language: string;
    proficiency: string;
}

export interface EducationItem {
    institution: string;
    degree: string;
    field: string;
    years: string;
}

export interface CertificationItem {
    name: string;
    issuer: string;
    year: string;
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
}

export interface PortfolioLink {
    icon: ReactNode;
    label: string;
    url: string;
}

interface ProfileActionSidebarProps {
    variant: ProfileHeroVariant;
    primaryCta?: ReactNode;
    workspaceInfo?: WorkspaceInfoItem[];
    availability?: AvailabilityItem[];
    languages?: LanguageItem[];
    verifications?: VerificationItem[];
    education?: EducationItem[];
    certifications?: CertificationItem[];
    ownerActions?: OwnerQuickAction[];
    portfolioLinks?: PortfolioLink[];
    extra?: ReactNode;
    onEditSection?: (section: string) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SidebarCard({
    title,
    children,
    onEdit,
}: {
    title?: string;
    children: ReactNode;
    onEdit?: () => void;
}) {
    return (
        <div
            className="surface-card border rounded-lg overflow-hidden animate-in fade-in duration-200"
            style={{ 
                borderColor: 'var(--color-border-subtle)', 
                animationFillMode: 'both',
            }}
        >
            {title && (
                <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {title}
                    </h3>
                    {onEdit && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="text-sm font-medium transition-colors"
                            style={{ color: 'var(--workspace-primary)' }}
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
            <div className="p-5">{children}</div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileActionSidebar({
    _variant,
    primaryCta,
    workspaceInfo = [],
    availability = [],
    languages = [],
    verifications = [],
    education = [],
    certifications = [],
    ownerActions = [],
    portfolioLinks = [],
    extra,
    onEditSection,
}: ProfileActionSidebarProps) {
    return (
        <aside className="flex flex-col gap-5">
            {/* Primary CTA */}
            {primaryCta && (
                <div className="animate-in fade-in duration-200" style={{ animationFillMode: 'both' }}>
                    {primaryCta}
                </div>
            )}

            {/* Availability & Rates */}
            {(workspaceInfo.length > 0 || availability.length > 0) && (
                <SidebarCard 
                    title="Availability & Rates"
                    onEdit={onEditSection ? () => onEditSection('availability') : undefined}
                >
                    <dl className="space-y-3">
                        {workspaceInfo.map((item, i) => (
                            <div key={i} className="flex items-start justify-between gap-3">
                                <dt className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                    {item.label}
                                </dt>
                                <dd className="text-sm font-semibold text-right" style={{ color: 'var(--color-text-primary)' }}>
                                    {item.value}
                                </dd>
                            </div>
                        ))}
                        {availability.map((item, i) => (
                            <div key={i} className="flex items-start justify-between gap-3">
                                <dt className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                    {item.label}
                                </dt>
                                <dd className="text-sm font-semibold text-right" style={{ color: 'var(--color-text-primary)' }}>
                                    {item.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </SidebarCard>
            )}

            {/* Portfolio Links */}
            {portfolioLinks.length > 0 && (
                <SidebarCard 
                    title="Portfolio Links"
                    onEdit={onEditSection ? () => onEditSection('portfolio') : undefined}
                >
                    <ul className="space-y-2.5">
                        {portfolioLinks.map((link, i) => (
                            <li key={i}>
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 text-sm transition-colors group"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--workspace-primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                                >
                                    <span style={{ color: 'var(--color-text-tertiary)' }}>{link.icon}</span>
                                    <span className="flex-1">{link.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </SidebarCard>
            )}

            {/* Verifications */}
            {verifications.length > 0 && (
                <SidebarCard title="Verifications">
                    <ul className="space-y-2.5">
                        {verifications.map((v, i) => (
                            <li key={i} className="flex items-center gap-2.5 text-sm">
                                {v.passed ? (
                                    <Check className="w-4 h-4 shrink-0" style={{ color: '#14A800' }} strokeWidth={2.5} />
                                ) : (
                                    <Circle className="w-4 h-4 shrink-0" style={{ color: 'var(--color-border-default)' }} strokeWidth={2} />
                                )}
                                <span style={{ color: v.passed ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                                    {v.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </SidebarCard>
            )}

            {/* Languages */}
            {languages.length > 0 && (
                <SidebarCard 
                    title="Languages"
                    onEdit={onEditSection ? () => onEditSection('languages') : undefined}
                >
                    <ul className="space-y-2.5">
                        {languages.map((lang, i) => (
                            <li key={i} className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                    {lang.language}
                                </span>
                                <span className="text-xs font-medium capitalize" style={{ color: 'var(--color-text-tertiary)' }}>
                                    {lang.proficiency}
                                </span>
                            </li>
                        ))}
                    </ul>
                </SidebarCard>
            )}

            {/* Education */}
            {education.length > 0 && (
                <SidebarCard 
                    title="Education"
                    onEdit={onEditSection ? () => onEditSection('education') : undefined}
                >
                    <ul className="space-y-4">
                        {education.map((edu, i) => (
                            <li key={i}>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                    {edu.institution}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                    {edu.degree} in {edu.field}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                                    {edu.years}
                                </p>
                            </li>
                        ))}
                    </ul>
                </SidebarCard>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
                <SidebarCard title="Certifications">
                    <ul className="space-y-4">
                        {certifications.map((cert, i) => (
                            <li key={i}>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                                    {cert.name}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                    {cert.issuer}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                                    {cert.year}
                                </p>
                            </li>
                        ))}
                    </ul>
                </SidebarCard>
            )}

            {/* Owner quick-actions */}
            {ownerActions.length > 0 && (
                <SidebarCard title="Quick Actions">
                    <ul className="space-y-1 -mx-1">
                        {ownerActions.map((action, i) => (
                            <li key={i}>
                                <button
                                    type="button"
                                    onClick={action.onClick}
                                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group"
                                    style={{
                                        background: 'transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--color-bg-subtle)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className="shrink-0 w-4 h-4 flex items-center justify-center"
                                            style={{ color: 'var(--workspace-primary)' }}
                                        >
                                            {action.icon}
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                                                {action.label}
                                            </span>
                                            {action.description && (
                                                <span className="block text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                                                    {action.description}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 shrink-0 opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--color-text-tertiary)' }} />
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
