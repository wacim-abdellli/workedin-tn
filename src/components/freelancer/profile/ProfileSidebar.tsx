import { CheckCircle, XCircle, Calendar, Clock, Globe, GraduationCap, ShieldCheck } from 'lucide-react';
import type { FreelancerData } from '@/types/freelancer';
import { useTranslation } from '../../../i18n';

interface SidebarProps {
    freelancer: FreelancerData;
}

function SidebarCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border p-4"
            style={{ background: 'var(--color-background-elevated)', borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg"
                    style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: 'var(--workspace-primary)' }} />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
            </div>
            {children}
        </div>
    );
}

export default function ProfileSidebar({ freelancer }: SidebarProps) {
    const { tx, language } = useTranslation();

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString(
            language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US',
            { year: 'numeric', month: 'long' }
        );

    const availConfig = {
        available: { label: tx('pages.freelancerProfile.available', undefined, 'Available for work'), color: 'var(--color-status-success)', bg: 'color-mix(in srgb, var(--color-status-success) 10%, transparent)', border: 'color-mix(in srgb, var(--color-status-success) 25%, transparent)' },
        busy: { label: tx('pages.freelancerProfile.busy', undefined, 'Busy right now'), color: 'var(--color-status-warning)', bg: 'color-mix(in srgb, var(--color-status-warning) 10%, transparent)', border: 'color-mix(in srgb, var(--color-status-warning) 25%, transparent)' },
        offline: { label: tx('pages.freelancerProfile.offline', undefined, 'Offline'), color: 'var(--color-text-tertiary)', bg: 'var(--color-background-subtle)', border: 'var(--color-border-subtle)' },
    };
    const avail = availConfig[freelancer.availability as keyof typeof availConfig] ?? availConfig.offline;

    const verifications = [
        { key: 'cin', label: tx('pages.freelancerProfile.verificationIdentity', undefined, 'Identity'), done: freelancer.verifications.cin },
        { key: 'phone', label: tx('pages.freelancerProfile.verificationPhone', undefined, 'Phone'), done: freelancer.verifications.phone },
        { key: 'email', label: tx('pages.freelancerProfile.verificationEmail', undefined, 'Email'), done: freelancer.verifications.email },
        { key: 'payment', label: tx('pages.freelancerProfile.verificationPayment', undefined, 'Payment method'), done: freelancer.verifications.payment },
    ];

    return (
        <div className="space-y-4">
            {/* Work Info */}
            <SidebarCard title={tx('pages.freelancerProfile.workInfo', undefined, 'Work information')} icon={Clock}>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            {tx('pages.freelancerProfile.status', undefined, 'Status')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold border"
                            style={{ background: avail.bg, borderColor: avail.border, color: avail.color }}>
                            {avail.label}
                        </span>
                    </div>
                    <div className="h-px" style={{ background: 'var(--color-border-subtle)' }} />
                    <div className="flex items-center justify-between">
                        <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                            <Calendar className="h-3 w-3" />
                            {tx('pages.freelancerProfile.memberSince', undefined, 'Member since')}
                        </span>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {formatDate(freelancer.joined_at)}
                        </span>
                    </div>
                    <div className="h-px" style={{ background: 'var(--color-border-subtle)' }} />
                    <div className="flex items-center justify-between">
                        <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                            <Clock className="h-3 w-3" />
                            {tx('pages.freelancerProfile.lastSeen', undefined, 'Last seen')}
                        </span>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-status-success)' }}>
                            {tx('pages.freelancerProfile.lastSeenRecently', undefined, 'Recently')}
                        </span>
                    </div>
                </div>
            </SidebarCard>

            {/* Verifications */}
            <SidebarCard title={tx('pages.freelancerProfile.verifications', undefined, 'Verifications')} icon={ShieldCheck}>
                <div className="space-y-2">
                    {verifications.map(({ key, label, done }) => (
                        <div key={key} className="flex items-center gap-2.5 py-1">
                            {done
                                ? <CheckCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--color-status-success)' }} />
                                : <XCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-disabled)' }} />
                            }
                            <span className="text-sm" style={{ color: done ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                                {label}
                            </span>
                            {done && (
                                <span className="ms-auto text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                                    style={{ background: 'var(--color-status-success)' }}>✓</span>
                            )}
                        </div>
                    ))}
                </div>
            </SidebarCard>

            {/* Languages */}
            {freelancer.languages.length > 0 && (
                <SidebarCard title={tx('pages.freelancerProfile.languages', undefined, 'Languages')} icon={Globe}>
                    <div className="space-y-2.5">
                        {freelancer.languages.map((lang, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{lang.language}</span>
                                <span className="px-2 py-0.5 rounded text-xs font-medium border"
                                    style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-subtle)', color: 'var(--color-text-secondary)' }}>
                                    {lang.proficiency}
                                </span>
                            </div>
                        ))}
                    </div>
                </SidebarCard>
            )}

            {/* Education */}
            {freelancer.education.length > 0 && (
                <SidebarCard title={tx('pages.freelancerProfile.education', undefined, 'Education')} icon={GraduationCap}>
                    <div className="space-y-4">
                        {freelancer.education.map((edu, idx) => (
                            <div key={idx} className="ps-3 border-s-2"
                                style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 30%, var(--color-border-subtle))' }}>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{edu.institution}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--workspace-primary)' }}>{edu.degree} — {edu.field}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{edu.startYear} – {edu.endYear}</p>
                            </div>
                        ))}
                    </div>
                </SidebarCard>
            )}
        </div>
    );
}
