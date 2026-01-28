import { memo } from 'react';
import { useTranslation } from '../../i18n';

import {
    Heart,
    MapPin,
    Clock,
    Briefcase,
    Star,
    ShieldCheck
} from 'lucide-react';
import Button from '../ui/Button';
import OptimizedImage from '../common/OptimizedImage';

// Define Job interface locally or import it if you have a shared types file
// For now assuming existing Job type structure from JobBoard
interface Job {
    id: string;
    title: string;
    description: string;
    job_type: 'fixed_price' | 'hourly';
    budget_min?: number;
    budget_max?: number;
    hourly_rate?: number;
    skills: string[];
    proposals_count: number;
    posted_at: string;
    location?: string;
    client?: {
        id: string;
        full_name: string;
        avatar_url?: string;
        rating?: number;
        is_verified?: boolean;
        location?: string;
    };
    views_count?: number;
}

interface JobCardProps {
    job: Job;
    isSaved: boolean;
    onToggleSave: () => void;
    onClick: () => void;
}

const JobCard = memo(({ job, isSaved, onToggleSave, onClick }: JobCardProps) => {
    const { t, language } = useTranslation();

    // Helper for time ago (simple version, or import shared utility)
    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return t.jobs.time.now;

        const prefix = t.jobs.time.ago_prefix ? t.jobs.time.ago_prefix + ' ' : '';
        const suffix = t.jobs.time.ago ? ' ' + t.jobs.time.ago : '';

        if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            return `${prefix}${mins}${language === 'en' ? ' ' : ''}${t.jobs.time.minute}${suffix}`;
        }
        if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            return `${prefix}${hours}${language === 'en' ? ' ' : ''}${t.jobs.time.hour}${suffix}`;
        }
        const days = Math.floor(seconds / 86400);
        return `${prefix}${days}${language === 'en' ? ' ' : ''}${t.jobs.time.day}${suffix}`;
    };

    return (
        <div
            onClick={onClick}
            className="group card-hover p-6 cursor-pointer border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30 transition-all duration-300"
        >
            <div className="flex flex-col md:flex-row gap-6">
                {/* Client Avatar (Optional) */}
                <div className="hidden md:block flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/20 dark:to-primary-800/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                        {job.client?.avatar_url ? (
                            <OptimizedImage
                                src={job.client.avatar_url}
                                alt={job.client.full_name}
                                className="w-full h-full"
                                imgClassName="rounded-xl"
                            />
                        ) : (
                            job.client?.full_name?.[0]?.toUpperCase() || '?'
                        )}
                    </div>
                </div>

                <div className="flex-1 space-y-4">
                    {/* Header: Title, Price, Save */}
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-dark-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-2">
                                {job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {timeAgo(job.posted_at)}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {job.location || t.jobs.location.remote}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                <span className="flex items-center gap-1">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    {job.proposals_count} {t.jobs.proposals}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <div className="text-lg font-bold text-dark-900 dark:text-white flex items-center gap-1">
                                {job.job_type === 'fixed_price' ? (
                                    <>
                                        <span className="text-sm text-gray-500 font-normal">{t.jobs.budget}:</span>
                                        {job.budget_min} - {job.budget_max} {t.jobs.filters.budget.title.includes('TND') || t.jobs.filters.budget.title.includes('د.ت') ? '' : 'TND'}
                                        {/* Using TND suffix implicitly or relies on budget being number. */}
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm text-gray-500 font-normal">{t.jobs.hourlyRate}:</span>
                                        {job.hourly_rate} {t.jobs.filters.budget.title.includes('TND') ? 'TND' : ''}/h
                                    </>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSave();
                                }}
                                className={`
                                    !p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20
                                    ${isSaved ? 'text-red-500 bg-red-50 dark:bg-red-900/10' : 'text-gray-400 hover:text-red-500'}
                                `}
                            >
                                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {job.description}
                    </p>

                    {/* Footer: Skills & Client */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                        {/* Skills */}
                        <div className="flex flex-wrap gap-2">
                            {job.skills.slice(0, 4).map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                                >
                                    {skill}
                                </span>
                            ))}
                            {job.skills.length > 4 && (
                                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-50 dark:bg-dark-800 text-gray-400">
                                    +{job.skills.length - 4}
                                </span>
                            )}
                        </div>

                        {/* Client Mini Info (Mobile only or simplified) */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            {job.client?.is_verified && (
                                <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400" title={t.jobs.verifiedPayment}>
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="hidden sm:inline text-xs">{t.jobs.verifiedPayment}</span>
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                                <span>{job.client?.rating || t.jobs.newClient}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    return prev.job.id === next.job.id && prev.isSaved === next.isSaved;
});

export default JobCard;
