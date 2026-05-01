import { Briefcase, ExternalLink, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from '../../common';
import type { FreelancerData } from '@/types/freelancer';
import { useTranslation } from '../../../i18n';
import { ROUTES } from '@/lib/routes';
import { getPortfolioImageUrl } from '@/lib/portfolioMedia';

interface PortfolioSectionProps {
    workSamples: FreelancerData['work_samples'];
    onSelectSample: (id: string) => void;
}

export default function PortfolioSection({ workSamples, onSelectSample }: PortfolioSectionProps) {
    const { tx } = useTranslation();
    const navigate = useNavigate();

    return (
        <section className="bg-[var(--card-bg)] rounded-2xl border border-white/7 p-6 md:p-7 mb-4 hover:border-white/12 transition-colors shadow-[0_25px_60px_-48px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-[#F59E0B]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#F59E0B]">
                        {tx('pages.freelancerProfile.sectionLabelWork', undefined, 'Selected work')}
                    </span>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-lg border border-white/10 text-[var(--text-muted)]">
                    {workSamples.length} {tx('pages.freelancerProfile.works', undefined, 'works')}
                </span>
            </div>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5">
                {tx('pages.freelancerProfile.portfolioTitle', undefined, 'Portfolio')}
            </h2>

            {workSamples.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {workSamples.map((sample) => {
                        const previewImage = getPortfolioImageUrl(sample.thumbnail_url, sample.media_urls);

                        return (
                        <div
                            key={sample.id}
                            onClick={() => onSelectSample(sample.id)}
                            className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-[#F59E0B]/35 transition-all"
                        >
                            <OptimizedImage
                                src={previewImage}
                                alt={sample.title}
                                className="w-full h-full"
                                imgClassName="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div
                                className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-white text-sm font-semibold line-clamp-1">{sample.title}</p>
                                    <ExternalLink className="h-3.5 w-3.5 text-white shrink-0 ml-2" />
                                </div>
                                {sample.description ? <p className="text-white/70 text-xs line-clamp-1 mt-0.5">{sample.description}</p> : null}
                            </div>
                        </div>
                        );
                    })}
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-white/10 bg-gradient-to-br from-white/3 to-transparent p-14 text-center">
                    <Briefcase className="w-12 h-12 text-[#F59E0B]/30 mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-[var(--text-secondary)]">
                        {tx('pages.freelancerProfile.noPortfolio', undefined, 'No work samples added yet')}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        {tx('pages.freelancerProfile.noPortfolioDescription', undefined, 'Showcase case studies, shipped products, and measurable outcomes.')}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.freelancerPortfolio)}
                        className="mt-4 inline-flex items-center gap-2 bg-[#F59E0B] text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#D97706] transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {tx('pages.freelancerProfile.addFirstWorkSample', undefined, 'Add your first work sample')}
                    </button>
                </div>
            )}
        </section>
    );
}

