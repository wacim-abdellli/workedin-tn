import { Clock, MapPin } from 'lucide-react';
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
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 3600) return tx('time.lessThanHour', undefined, 'منذ ساعة');
        if (seconds < 86400) return tx('time.hours', { count: Math.floor(seconds / 3600) }, `منذ ${Math.floor(seconds / 3600)} ساعة`);
        return tx('time.days', { count: Math.floor(seconds / 86400) }, `منذ ${Math.floor(seconds / 86400)} يوم`);
    };

    const skills = job.skills || job.required_skills || [];
    const budgetLabel = job.job_type === 'fixed_price'
        ? `${job.budget_min ?? '?'} - ${job.budget_max ?? '?'} ${tx('common.currency', undefined, 'TND')}`
        : `${job.hourly_rate ?? '?'} ${tx('common.currencyPerHour', undefined, 'TND/h')}`;
    const typeLabel = job.job_type === 'fixed_price'
        ? tx('jobs.type.fixed', undefined, 'سعر ثابت')
        : tx('jobs.type.hourly', undefined, 'بالساعة');

    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onClick?.()}
            className="group p-4 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 border"
            style={{
                background: 'var(--color-background-subtle)',
                borderColor: 'var(--color-border-subtle)',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--color-background-elevated)';
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--workspace-primary) 30%, transparent)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--color-background-subtle)';
                e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div className="flex justify-between items-start mb-2">
                <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                        color: 'var(--workspace-primary)',
                        background: 'var(--workspace-primary-light)',
                    }}
                >
                    {typeLabel}
                </span>
                <span
                    className="text-xs flex items-center gap-1"
                    style={{ color: 'var(--color-text-tertiary)' }}
                >
                    <Clock className="w-3 h-3" />
                    {timeAgo(job.posted_at)}
                </span>
            </div>

            <h4
                className="mb-2 line-clamp-2 break-words font-bold text-sm transition-colors [overflow-wrap:anywhere]"
                style={{ color: 'var(--color-text-primary)' }}
            >
                {job.title}
            </h4>

            <div className="flex items-center gap-2 mb-3 text-sm flex-wrap">
                <span className="font-semibold" style={{ color: 'var(--workspace-primary)' }}>
                    {budgetLabel}
                </span>
                {job.location && (
                    <>
                        <span style={{ color: 'var(--color-border-default)' }}>•</span>
                        <span
                            className="flex items-center gap-1 text-xs"
                            style={{ color: 'var(--color-text-tertiary)' }}
                        >
                            <MapPin className="w-3 h-3" />
                            {job.location}
                        </span>
                    </>
                )}
            </div>

            {skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 3).map((skill, index) => (
                        <span
                            key={index}
                            className="break-words rounded-md px-2 py-1 text-[10px] [overflow-wrap:anywhere] border"
                            style={{
                                background: 'var(--color-background-elevated)',
                                borderColor: 'var(--color-border-subtle)',
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            {skill}
                        </span>
                    ))}
                    {skills.length > 3 && (
                        <span
                            className="rounded-md px-2 py-1 text-[10px] border"
                            style={{
                                background: 'var(--color-background-elevated)',
                                borderColor: 'var(--color-border-subtle)',
                                color: 'var(--color-text-tertiary)',
                            }}
                        >
                            +{skills.length - 3}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
