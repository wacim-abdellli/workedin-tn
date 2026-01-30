import { Briefcase } from 'lucide-react';
import { OptimizedImage } from '../../common';
import type { FreelancerData } from '@/types/freelancer';

interface PortfolioSectionProps {
    workSamples: FreelancerData['work_samples'];
    onSelectSample: (id: string) => void;
}

export default function PortfolioSection({ workSamples, onSelectSample }: PortfolioSectionProps) {
    return (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">معرض الأعمال</h2>
                <span className="text-muted text-sm">{workSamples.length} عمل</span>
            </div>

            {workSamples.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workSamples.map((sample) => (
                        <div
                            key={sample.id}
                            onClick={() => onSelectSample(sample.id)}
                            className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer bg-gray-100"
                        >
                            <OptimizedImage
                                src={sample.thumbnail_url}
                                alt={sample.title}
                                className="w-full h-full"
                                imgClassName="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <h3 className="text-white font-bold text-lg line-clamp-1">{sample.title}</h3>
                                {sample.description && (
                                    <p className="text-white/80 text-sm line-clamp-1 mt-1">{sample.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted">لم يقم المستقل بإضافة أعمال بعد</p>
                </div>
            )}
        </section>
    );
}
