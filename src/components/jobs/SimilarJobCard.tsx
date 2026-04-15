import { Clock } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface Job {
    id: string;
    title: string;
    job_type: 'fixed_price' | 'hourly';
    budget_min?: number;
    budget_max?: number;
    hourly_rate?: number;
    posted_at: string;
    location?: string;
    required_skills?: string[];
    skills?: string[];
}

interface SimilarJobCardProps {
    job: Job;
    onClick?: () => void;
}

export default function SimilarJobCard({ job, onClick }: SimilarJobCardProps) {
    const { tx } = useTranslation();

    const timeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 3600) return tx('time.lessThanHour', undefined, 'Just now');
        if (seconds < 86400) return tx('time.hours', { count: Math.floor(seconds / 3600) }, `${Math.floor(seconds / 3600)}h ago`);
        return tx('time.days', { count: Math.floor(seconds / 86400) }, `${Math.floor(seconds / 86400)}d ago`);
    };

    const skills = job.skills || job.required_skills || [];

    const budgetLabel = job.job_type === 'fixed_price'
        ? `${job.budget_min ?? '?'} – ${job.budget_max ?? '?'} ${tx('common.currency', undefined, 'TND')}`
        : `${job.hourly_rate ?? '?'} ${tx('common.currencyPerHour', undefined, 'TND/h')}`;

    const isFixed = job.job_type === 'fixed_price';

    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
            className="group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border border-white/8 hover:border-white/16 hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.03)' }}
        >
            {/* Type + Time */}
            <div className="flex items-center justify-between mb-2.5">
                <span
                    className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{
                        background: isFixed ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)',
                        color: isFixed ? '#60a5fa' : '#34d399',
                        border: `1px solid ${isFixed ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)'}`,
                    }}
                >
                    {isFixed ? tx('jobs.type.fixed', undefined, 'Fixed') : tx('jobs.type.hourly', undefined, 'Hourly')}
                </span>
                <span className="text-[10px] text-white/35 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(job.posted_at)}
                </span>
            </div>

            {/* Title */}
            <h4 className="mb-2 line-clamp-2 font-bold text-sm text-white/85 group-hover:text-white transition-colors [overflow-wrap:anywhere]">
                {job.title}
            </h4>

            {/* Budget */}
            <p
                className="text-sm font-bold mb-3"
                style={{ color: 'var(--workspace-primary,#8b5cf6)' }}
            >
                {budgetLabel}
            </p>

            {/* Skills */}
            {skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 3).map((skill, i) => (
                        <span
                            key={i}
                            className="rounded-full px-2 py-0.5 text-[10px] border border-white/8 bg-white/4 text-white/50 [overflow-wrap:anywhere]"
                        >
                            {skill}
                        </span>
                    ))}
                    {skills.length > 3 && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] border border-white/8 bg-white/4 text-white/35">
                            +{skills.length - 3}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
