import { CheckCircle, XCircle, Calendar, Clock, Globe, GraduationCap, ShieldCheck, Check } from 'lucide-react';
import type { FreelancerData } from '@/types/freelancer';
import { useTranslation } from '../../../i18n';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
    freelancer: FreelancerData;
}

function SidebarCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-white/7 p-5 md:p-6 mb-4 shadow-[0_25px_60px_-48px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2 mb-5">
                <Icon className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
            </div>
            {children}
        </div>
    );
}

export default function ProfileSidebar({ freelancer }: SidebarProps) {
    const { tx, language } = useTranslation();
    const { user } = useAuth();
    const isOwner = user?.id === freelancer.id;
    const accent = isOwner ? '#8B5CF6' : '#F59E0B';

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString(
            language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US',
            { year: 'numeric', month: 'long' }
        );

    const availConfig = {
        available: {
            label: tx('pages.freelancerProfile.available', undefined, 'Available for work'),
            color: '#34d399',
            bg: 'rgba(16,185,129,0.1)',
            border: 'rgba(16,185,129,0.2)',
        },
        busy: {
            label: tx('pages.freelancerProfile.busy', undefined, 'Busy right now'),
            color: '#F59E0B',
            bg: 'rgba(245,158,11,0.12)',
            border: 'rgba(245,158,11,0.24)',
        },
        offline: {
            label: tx('pages.freelancerProfile.offline', undefined, 'Offline'),
            color: 'var(--text-muted)',
            bg: 'rgba(255,255,255,0.05)',
            border: 'rgba(255,255,255,0.1)',
        },
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
            <SidebarCard title={tx('pages.freelancerProfile.workInfo', undefined, 'Work information')} icon={Clock}>
                <div>
                    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                        <span className="text-sm text-[var(--text-muted)]">
                            {tx('pages.freelancerProfile.status', undefined, 'Status')}
                        </span>
                        <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                            style={{ background: avail.bg, color: avail.color, borderColor: avail.border }}
                        >
                            {avail.label}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                        <span className="text-sm text-[var(--text-muted)]">
                            {tx('pages.freelancerProfile.memberSince', undefined, 'Member since')}
                        </span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{formatDate(freelancer.joined_at)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                        <span className="text-sm text-[var(--text-muted)]">
                            {tx('pages.freelancerProfile.lastSeen', undefined, 'Last seen')}
                        </span>
                        <span className="text-sm font-medium text-emerald-400">
                            {tx('pages.freelancerProfile.lastSeenRecently', undefined, 'Recently')}
                        </span>
                    </div>
                </div>
            </SidebarCard>

            <SidebarCard title={tx('pages.freelancerProfile.verifications', undefined, 'Verifications')} icon={ShieldCheck}>
                <div>
                    {verifications.map(({ key, label, done }) => (
                        <div key={key} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-2">
                                {done ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-white/20" />}
                                <span
                                    className="text-sm"
                                    style={{ color: done ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: done ? 500 : 400 }}
                                >
                                    {label}
                                </span>
                            </div>
                            {done ? (
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            </SidebarCard>

            {freelancer.languages.length > 0 ? (
                <SidebarCard title={tx('pages.freelancerProfile.languages', undefined, 'Languages')} icon={Globe}>
                    <div className="space-y-2.5">
                        {freelancer.languages.map((lang, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                                <span className="text-sm text-[var(--text-primary)]">{lang.language}</span>
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: `color-mix(in srgb, ${accent} 25%, transparent)`, color: accent }}>
                                    {lang.proficiency}
                                </span>
                            </div>
                        ))}
                    </div>
                </SidebarCard>
            ) : null}

            {freelancer.education.length > 0 ? (
                <SidebarCard title={tx('pages.freelancerProfile.education', undefined, 'Education')} icon={GraduationCap}>
                    <div className="space-y-4">
                        {freelancer.education.map((edu, idx) => (
                            <div key={idx} className="ps-3 border-s-2" style={{ borderColor: `color-mix(in srgb, ${accent} 35%, transparent)` }}>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{edu.institution}</p>
                                <p className="text-xs mt-0.5" style={{ color: accent }}>{edu.degree} - {edu.field}</p>
                                <p className="text-xs mt-0.5 text-[var(--text-muted)]">{edu.startYear} - {edu.endYear}</p>
                            </div>
                        ))}
                    </div>
                </SidebarCard>
            ) : null}
        </div>
    );
}
