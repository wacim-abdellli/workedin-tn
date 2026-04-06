import { CheckCircle, XCircle, Calendar, Clock, Globe, GraduationCap, ShieldCheck } from 'lucide-react';
import type { FreelancerData } from '@/types/freelancer';
import { useTranslation } from '../../../i18n';

interface SidebarProps {
    freelancer: FreelancerData;
}

function SidebarCard({ children, accentColor, gradient }: { children: React.ReactNode; accentColor: string; gradient: string }) {
    return (
        <div className="group relative rounded-3xl overflow-hidden border-2 p-5 transition-all duration-500 hover:shadow-xl"
            style={{
                borderColor: `color-mix(in srgb, ${accentColor} 20%, var(--color-border-subtle))`,
                background: 'var(--color-background-elevated)',
                boxShadow: `0 4px 15px -6px color-mix(in srgb, ${accentColor} 30%, transparent)`,
            }}
        >
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: gradient }} />
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{ background: accentColor }} />
            <div className="relative z-10">{children}</div>
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

    const availabilityConfig = {
        available: { label: tx('pages.freelancerProfile.available', undefined, 'Available for work'), color: '#10b981', bg: 'color-mix(in srgb, #10b981 12%, transparent)', border: 'color-mix(in srgb, #10b981 30%, transparent)' },
        busy: { label: tx('pages.freelancerProfile.busy', undefined, 'Busy right now'), color: '#f59e0b', bg: 'color-mix(in srgb, #f59e0b 12%, transparent)', border: 'color-mix(in srgb, #f59e0b 30%, transparent)' },
        offline: { label: tx('pages.freelancerProfile.offline', undefined, 'Offline'), color: 'var(--color-text-tertiary)', bg: 'var(--color-background-subtle)', border: 'var(--color-border-subtle)' },
    };
    const avail = availabilityConfig[freelancer.availability as keyof typeof availabilityConfig] || availabilityConfig.offline;

    const verifications = [
        { key: 'cin', label: tx('pages.freelancerProfile.verificationIdentity', undefined, 'Identity'), done: freelancer.verifications.cin },
        { key: 'phone', label: tx('pages.freelancerProfile.verificationPhone', undefined, 'Phone'), done: freelancer.verifications.phone },
        { key: 'email', label: tx('pages.freelancerProfile.verificationEmail', undefined, 'Email'), done: freelancer.verifications.email },
        { key: 'payment', label: tx('pages.freelancerProfile.verificationPayment', undefined, 'Payment method'), done: freelancer.verifications.payment },
    ];

    return (
        <div className="space-y-5">
            {/* Work Info */}
            <SidebarCard accentColor="var(--workspace-primary)" gradient="linear-gradient(90deg, var(--workspace-primary), var(--workspace-accent))">
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="p-2 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, var(--workspace-primary), var(--workspace-accent))' }}>
                        <Clock className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {tx('pages.freelancerProfile.workInfo', undefined, 'Work information')}
                    </h3>
                </div>
                <div className="space-y-3">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            {tx('pages.freelancerProfile.status', undefined, 'Status')}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold border-2"
                            style={{ background: avail.bg, borderColor: avail.border, color: avail.color }}>
                            {avail.label}
                        </span>
                    </div>
                    <div className="h-px" style={{ background: 'var(--color-border-subtle)' }} />
                    {/* Member since */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                            <Calendar className="h-3.5 w-3.5" />
                            {tx('pages.freelancerProfile.memberSince', undefined, 'Member since')}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {formatDate(freelancer.joined_at)}
                        </span>
                    </div>
                    <div className="h-px" style={{ background: 'var(--color-border-subtle)' }} />
                    {/* Last seen */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                            <Clock className="h-3.5 w-3.5" />
                            {tx('pages.freelancerProfile.lastSeen', undefined, 'Last seen')}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: '#10b981' }}>
                            {tx('pages.freelancerProfile.lastSeenRecently', undefined, 'Recently')}
                        </span>
                    </div>
                </div>
            </SidebarCard>

            {/* Verifications */}
            <SidebarCard accentColor="#10b981" gradient="linear-gradient(90deg, #10b981, #06b6d4)">
                <div className="flex items-center gap-2.5 mb-5">
                    <div className="p-2 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                        <ShieldCheck className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {tx('pages.freelancerProfile.verifications', undefined, 'Verifications')}
                    </h3>
                </div>
                <div className="space-y-2.5">
                    {verifications.map(({ key, label, done }) => (
                        <div key={key} className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200"
                            style={{ background: done ? 'color-mix(in srgb, #10b981 8%, transparent)' : 'transparent' }}>
                            {done
                                ? <CheckCircle className="h-4 w-4 shrink-0 text-[#10b981]" />
                                : <XCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-disabled)' }} />
                            }
                            <span className="text-sm font-medium" style={{ color: done ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                                {label}
                            </span>
                            {done && <span className="ms-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#10b981' }}>✓</span>}
                        </div>
                    ))}
                </div>
            </SidebarCard>

            {/* Languages */}
            {freelancer.languages.length > 0 && (
                <SidebarCard accentColor="#3b82f6" gradient="linear-gradient(90deg, #3b82f6, #8b5cf6)">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="p-2 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                            <Globe className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {tx('pages.freelancerProfile.languages', undefined, 'Languages')}
                        </h3>
                    </div>
                    <div className="space-y-2.5">
                        {freelancer.languages.map((lang, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{lang.language}</span>
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold border-2"
                                    style={{ background: 'color-mix(in srgb, #3b82f6 10%, transparent)', borderColor: 'color-mix(in srgb, #3b82f6 25%, transparent)', color: '#3b82f6' }}>
                                    {lang.proficiency}
                                </span>
                            </div>
                        ))}
                    </div>
                </SidebarCard>
            )}

            {/* Education */}
            {freelancer.education.length > 0 && (
                <SidebarCard accentColor="#8b5cf6" gradient="linear-gradient(90deg, #8b5cf6, #ec4899)">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="p-2 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                            <GraduationCap className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {tx('pages.freelancerProfile.education', undefined, 'Education')}
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {freelancer.education.map((edu, idx) => (
                            <div key={idx} className="relative ps-4 border-s-2 rounded-sm"
                                style={{ borderColor: 'color-mix(in srgb, #8b5cf6 40%, transparent)' }}>
                                <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{edu.institution}</h4>
                                <p className="text-xs mt-0.5" style={{ color: '#8b5cf6' }}>{edu.degree} — {edu.field}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{edu.startYear} – {edu.endYear}</p>
                            </div>
                        ))}
                    </div>
                </SidebarCard>
            )}
        </div>
    );
}
