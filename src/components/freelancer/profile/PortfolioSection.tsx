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
        <section className="rounded-[1.75rem] border border-black/[0.06] bg-white dark:bg-gray-800 p-6 shadow-[0_18px_40px_-28px_rgba(26,24,37,0.14)] dark:border-white/8 dark:bg-[#171421]">
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
                <div className="text-center py-12 bg-[var(--surface-bg)] rounded-2xl border border-dashed border-border">
                    <Briefcase className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-muted)]">{tx('pages.freelancerProfile.noPortfolio', undefined, 'This freelancer has not added work samples yet')}</p>
                </div>
            )}
        </section>
    );
}
