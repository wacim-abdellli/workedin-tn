import Modal from '../ui/Modal';
import { useTranslation } from '@/i18n';
import { getPortfolioImageUrl } from '@/lib/portfolioMedia';
import { Calendar, Tag } from 'lucide-react';

interface PortfolioItem {
    id: string;
    title: string;
    description: string;
    media_url: string;
    category: string;
    completed_at: string;
    skills_used: string[];
    tools_used: string[];
}

interface PortfolioItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: PortfolioItem | null;
}

export default function PortfolioItemModal({ isOpen, onClose, item }: PortfolioItemModalProps) {
    const { tx } = useTranslation();

    if (!item) return null;

    const formattedDate = item.completed_at ? (() => {
        try {
            return new Date(item.completed_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return item.completed_at;
        }
    })() : '';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={item.title}
            size="2xl"
        >
            <div className="space-y-6">
                {/* Image */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <img
                        src={getPortfolioImageUrl(item.media_url)}
                        alt={item.title}
                        className="h-full w-full object-cover"
                    />
                </div>

                {/* Details */}
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-500 dark:text-zinc-400 font-sans">
                    {item.category && (
                        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                            <Tag className="w-3.5 h-3.5 text-[#8B5CF6]" />
                            <span>{item.category}</span>
                        </div>
                    )}
                    {formattedDate && (
                        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                            <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
                            <span>{formattedDate}</span>
                        </div>
                    )}
                </div>

                {/* Description */}
                {item.description && (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 font-sans">
                            {tx('portfolio.modal.description', undefined, 'Project Description')}
                        </h4>
                        <p className="text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                            {item.description}
                        </p>
                    </div>
                )}

                {/* Skills used */}
                {item.skills_used && item.skills_used.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2 font-sans">
                            {tx('portfolio.modal.skills', undefined, 'Skills Used')}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                            {item.skills_used.map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/5 border border-[#8B5CF6]/10 text-[#8B5CF6] text-xs font-bold font-sans"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tools used */}
                {item.tools_used && item.tools_used.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2 font-sans">
                            {tx('portfolio.modal.tools', undefined, 'Tools Used')}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                            {item.tools_used.map((tool, index) => (
                                <span
                                    key={index}
                                    className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-700 dark:text-zinc-300 text-xs font-semibold font-sans"
                                >
                                    {tool}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
