import { Briefcase, ExternalLink } from 'lucide-react';
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
        <section className="rounded-xl border p-5 sm:p-6"
            style={{ background: 'var(--color-background-elevated)', borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                        style={{ color: 'var(--workspace-primary)' }}>
                        {tx('pages.freelancerProfile.sectionLabelWork', undefined, 'Selected work')}
                    </p>
                    <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {tx('pages.freelancerProfile.portfolioTitle', undefined, 'Portfolio')}
                    </h2>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-lg border"
                    style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-subtle)', color: 'var(--color-text-tertiary)' }}>
                    {workSamples.length} {tx('pages.freelancerProfile.works', undefined, 'works')}
                </span>
            </div>

            {workSamples.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {workSamples.map((sample) => (
                        <div key={sample.id} onClick={() => onSelectSample(sample.id)}
                            className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer border"
                            style={{ borderColor: 'var(--color-border-subtle)' }}>
                            <OptimizedImage src={sample.thumbnail_url} alt={sample.title}
                                className="w-full h-full"
                                imgClassName="object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
                                <div className="flex items-center justify-between">
                                    <p className="text-white text-sm font-semibold line-clamp-1">{sample.title}</p>
                                    <ExternalLink className="h-3.5 w-3.5 text-white shrink-0 ml-2" />
                                </div>
                                {sample.description && (
                                    <p className="text-white/70 text-xs line-clamp-1 mt-0.5">{sample.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center rounded-xl border border-dashed"
                    style={{ borderColor: 'var(--color-border-default)', background: 'var(--color-background-subtle)' }}>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
                        style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}>
                        <Briefcase className="w-5 h-5" style={{ color: 'var(--workspace-primary)' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                        {tx('pages.freelancerProfile.noPortfolio', undefined, 'No work samples added yet')}
                    </p>
                </div>
            )}
        </section>
    );
}
