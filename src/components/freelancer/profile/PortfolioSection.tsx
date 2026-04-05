import { Briefcase } from 'lucide-react';
import { OptimizedImage } from '../../common';
import type { FreelancerData } from '@/types/freelancer';
import { useTranslation } from '../../../i18n';

interface PortfolioSectionProps {
    workSamples: FreelancerData['work_samples'];
    onSelectSample: (id: string) => void;
}

export default function PortfolioSection({ workSamples, onSelectSample }: PortfolioSectionProps) {
    const { tx } = useTranslation();

    return (
        <section className="rounded-[2rem] border border-[var(--border)] bg-white/80 dark:bg-[#1c1a2e]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[var(--border-strong)] relative overflow-hidden group">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--workspace-primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{tx('pages.freelancerProfile.sectionLabelWork', undefined, 'Selected work')}</div>
                    <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{tx('pages.freelancerProfile.portfolioTitle', undefined, 'Portfolio')}</h2>
                </div>
                <span className="text-[var(--text-muted)] text-sm">{tx('pages.freelancerProfile.portfolioCount', { count: workSamples.length }, `${workSamples.length} works`)}</span>
            </div>

            {workSamples.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workSamples.map((sample) => (
                        <div
                            key={sample.id}
                            onClick={() => onSelectSample(sample.id)}
                            className="group relative aspect-video rounded-2xl overflow-hidden cursor-pointer bg-[var(--surface-bg)] border border-black/[0.05] dark:border-white/8"
                        >
                            <OptimizedImage
                                src={sample.thumbnail_url}
                                alt={sample.title}
                                className="w-full h-full"
                                imgClassName="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <h3 className="text-white font-bold text-lg line-clamp-1">{sample.title}</h3>
                                {sample.description && (
                                    <p className="text-white/80 text-sm line-clamp-1 mt-1">{sample.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white/50 dark:bg-[#141320]/50 rounded-[1.5rem] border border-dashed border-[var(--border-strong)] relative overflow-hidden group transition-colors hover:border-[var(--workspace-primary)]/50">
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[var(--workspace-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                    <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--card-bg)] border border-[var(--border)] shadow-xl shadow-[var(--workspace-primary)]/10 mb-5 relative top-0 group-hover:-translate-y-2 transition-transform duration-500">
                        <Briefcase className="w-8 h-8 text-[var(--workspace-primary)]" />
                    </div>
                    <p className="text-[var(--text-secondary)] font-medium text-lg relative z-10">{tx('pages.freelancerProfile.noPortfolio', undefined, 'This freelancer has not added work samples yet')}</p>
                </div>
            )}
        </section>
    );
}
