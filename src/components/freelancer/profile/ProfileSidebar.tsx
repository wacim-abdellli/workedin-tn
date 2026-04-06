import { CheckCircle } from 'lucide-react';
import type { FreelancerData } from '@/types/freelancer';
import { useTranslation } from '../../../i18n';

interface SidebarProps {
    freelancer: FreelancerData;
}

export default function ProfileSidebar({ freelancer }: SidebarProps) {
    const { tx, language } = useTranslation();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', {
            year: 'numeric',
            month: 'long',
        });
    };

    return (
        <div className="space-y-6">
            {/* Availability Card */}
            <div className="rounded-[2rem] border border-[var(--border)] bg-white/80 dark:bg-[var(--color-bg-muted)]/80 backdrop-blur-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[var(--border-strong)] relative overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--workspace-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h3 className="font-bold text-[var(--text-primary)] mb-4">{tx('pages.freelancerProfile.workInfo', undefined, 'Work information')}</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-border/60 last:border-0">
                        <span className="text-[var(--text-secondary)]">{tx('pages.freelancerProfile.status', undefined, 'Status')}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${freelancer.availability === 'available' ? 'bg-[var(--color-success-light)] text-[var(--color-success-dark)]' :
                            freelancer.availability === 'busy' ? 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]' : 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]'
                            }`}>
                            {freelancer.availability === 'available' ? tx('pages.freelancerProfile.available', undefined, 'Available for work') :
                                freelancer.availability === 'busy' ? tx('pages.freelancerProfile.busy', undefined, 'Busy right now') : tx('pages.freelancerProfile.offline', undefined, 'Offline')}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/60 last:border-0">
                        <span className="text-[var(--text-secondary)]">{tx('pages.freelancerProfile.memberSince', undefined, 'Member since')}</span>
                        <span className="text-[var(--text-primary)]">{formatDate(freelancer.joined_at)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/60 last:border-0">
                        <span className="text-[var(--text-secondary)]">{tx('pages.freelancerProfile.lastSeen', undefined, 'Last seen')}</span>
                        <span className="text-[var(--text-primary)]">{tx('pages.freelancerProfile.lastSeenRecently', undefined, 'Recently')}</span>
                    </div>
                </div>
            </div>

            {/* Languages */}
            {freelancer.languages.length > 0 && (
                <div className="rounded-[2rem] border border-[var(--border)] bg-white/80 dark:bg-[var(--color-bg-muted)]/80 backdrop-blur-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[var(--border-strong)] relative overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--workspace-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <h3 className="font-bold text-[var(--text-primary)] mb-4">{tx('pages.freelancerProfile.languages', undefined, 'Languages')}</h3>
                    <div className="space-y-3">
                        {freelancer.languages.map((lang, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                                <span className="text-[var(--text-primary)]">{lang.language}</span>
                                <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-bg)] px-2 py-1 rounded">
                                    {lang.proficiency}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {freelancer.education.length > 0 && (
                <div className="rounded-[2rem] border border-[var(--border)] bg-white/80 dark:bg-[var(--color-bg-muted)]/80 backdrop-blur-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[var(--border-strong)] relative overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--workspace-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <h3 className="font-bold text-[var(--text-primary)] mb-4">{tx('pages.freelancerProfile.education', undefined, 'Education')}</h3>
                    <div className="space-y-4">
                        {freelancer.education.map((edu, idx) => (
                            <div key={idx} className="relative ps-4 border-s-2 border-border/70">
                                <h4 className="font-bold text-sm text-[var(--text-primary)]">{edu.institution}</h4>
                                <p className="text-xs text-[var(--text-secondary)] mb-1">{edu.degree} - {edu.field}</p>
                                <p className="text-xs text-[var(--text-muted)]">{edu.startYear} - {edu.endYear}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Verifications */}
            <div className="rounded-[2rem] border border-[var(--border)] bg-white/80 dark:bg-[var(--color-bg-muted)]/80 backdrop-blur-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[var(--border-strong)] relative overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--workspace-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h3 className="font-bold text-[var(--text-primary)] mb-4">{tx('pages.freelancerProfile.verifications', undefined, 'Verifications')}</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${freelancer.verifications.cin ? 'text-[var(--color-success)]' : 'text-[var(--color-text-disabled)]'}`} />
                        <span className={freelancer.verifications.cin ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>{tx('pages.freelancerProfile.verificationIdentity', undefined, 'Identity')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${freelancer.verifications.phone ? 'text-[var(--color-success)]' : 'text-[var(--color-text-disabled)]'}`} />
                        <span className={freelancer.verifications.phone ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>{tx('pages.freelancerProfile.verificationPhone', undefined, 'Phone')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${freelancer.verifications.email ? 'text-[var(--color-success)]' : 'text-[var(--color-text-disabled)]'}`} />
                        <span className={freelancer.verifications.email ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>{tx('pages.freelancerProfile.verificationEmail', undefined, 'Email')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${freelancer.verifications.payment ? 'text-[var(--color-success)]' : 'text-[var(--color-text-disabled)]'}`} />
                        <span className={freelancer.verifications.payment ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>{tx('pages.freelancerProfile.verificationPayment', undefined, 'Payment method')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
