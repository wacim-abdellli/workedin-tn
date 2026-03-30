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
            <div className="rounded-[1.75rem] p-6 border border-black/[0.06] bg-white shadow-[0_18px_40px_-28px_rgba(26,24,37,0.14)] dark:border-white/8 dark:bg-[#171421]">
                <h3 className="font-bold text-[var(--text-primary)] mb-4">{tx('pages.freelancerProfile.workInfo', undefined, 'Work information')}</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-border/60 last:border-0">
                        <span className="text-[var(--text-secondary)]">{tx('pages.freelancerProfile.status', undefined, 'Status')}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${freelancer.availability === 'available' ? 'bg-green-100 text-green-700' :
                            freelancer.availability === 'busy' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
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
                <div className="rounded-[1.75rem] p-6 border border-black/[0.06] bg-white shadow-[0_18px_40px_-28px_rgba(26,24,37,0.14)] dark:border-white/8 dark:bg-[#171421]">
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
                <div className="rounded-[1.75rem] p-6 border border-black/[0.06] bg-white shadow-[0_18px_40px_-28px_rgba(26,24,37,0.14)] dark:border-white/8 dark:bg-[#171421]">
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
            <div className="rounded-[1.75rem] p-6 border border-black/[0.06] bg-white shadow-[0_18px_40px_-28px_rgba(26,24,37,0.14)] dark:border-white/8 dark:bg-[#171421]">
                <h3 className="font-bold text-[var(--text-primary)] mb-4">{tx('pages.freelancerProfile.verifications', undefined, 'Verifications')}</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${freelancer.verifications.cin ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={freelancer.verifications.cin ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>{tx('pages.freelancerProfile.verificationIdentity', undefined, 'Identity')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${freelancer.verifications.phone ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={freelancer.verifications.phone ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>{tx('pages.freelancerProfile.verificationPhone', undefined, 'Phone')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${freelancer.verifications.email ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={freelancer.verifications.email ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>{tx('pages.freelancerProfile.verificationEmail', undefined, 'Email')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${freelancer.verifications.payment ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={freelancer.verifications.payment ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>{tx('pages.freelancerProfile.verificationPayment', undefined, 'Payment method')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
