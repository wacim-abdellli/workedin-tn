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
        <section className="group relative rounded-3xl overflow-hidden border-2 p-6 sm:p-8 transition-all duration-500 hover:shadow-2xl"
            style={{
                borderColor: 'color-mix(in srgb, #10b981 20%, var(--color-border-subtle))',
                background: 'var(--color-background-elevated)',
                boxShadow: '0 4px 20px -8px rgba(16,185,129,0.25)',
            }}
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#10b981] via-[#06b6d4] to-[#3b82f6]" />
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                            <Briefcase className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#10b981' }}>
                                {tx('pages.freelancerProfile.sectionLabelWork', undefined, 'Selected work')}
                            </p>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                {tx('pages.freelancerProfile.portfolioTitle', undefined, 'Portfolio')}
                            </h2>
                        </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold border-2"
                        style={{ background: 'color-mix(in srgb, #10b981 10%, transparent)', borderColor: 'color-mix(in srgb, #10b981 30%, transparent)', color: '#10b981' }}>
                        {workSamples.length} {tx('pages.freelancerProfile.works', undefined, 'works')}
                    </span>
                </div>

                {workSamples.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {workSamples.map((sample) => (
                            <div key={sample.id} onClick={() => onSelectSample(sample.id)}
                                className="group/card relative aspect-video rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                                style={{ borderColor: 'color-mix(in srgb, #10b981 20%, var(--color-border-subtle))' }}
                            >
                                <OptimizedImage src={sample.thumbnail_url} alt={sample.title}
                                    className="w-full h-full"
                                    imgClassName="object-cover transition-transform duration-500 group-hover/card:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-white font-bold text-base line-clamp-1">{sample.title}</h3>
                                        <ExternalLink className="h-4 w-4 text-white shrink-0 ml-2" />
                                    </div>
                                    {sample.description && (
                                        <p className="text-white/70 text-xs line-clamp-1 mt-1">{sample.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 rounded-2xl border-2 border-dashed transition-all duration-300 hover:border-[#10b981] group/empty"
                        style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-subtle)' }}>
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg transition-all duration-300 group-hover/empty:scale-110 group-hover/empty:rotate-6"
                            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                            <Briefcase className="w-7 h-7 text-white" />
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                            {tx('pages.freelancerProfile.noPortfolio', undefined, 'No work samples added yet')}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
