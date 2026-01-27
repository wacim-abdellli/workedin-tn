// import { useNavigate } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';

interface Job {
    id: string;
    title: string;
    job_type: 'fixed_price' | 'hourly';
    budget_min?: number;
    budget_max?: number;
    hourly_rate?: number;
    posted_at: string;
    location?: string;
    required_skills?: string[]; // Handling slightly different naming if necessary
    skills?: string[];
}

interface SimilarJobCardProps {
    job: Job;
    onClick?: () => void;
}

export default function SimilarJobCard({ job, onClick }: SimilarJobCardProps) {
    // Helper function for time ago - reusing logic
    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 3600) return 'منذ ساعة'; // simplified
        if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
        return `منذ ${Math.floor(seconds / 86400)} يوم`;
    };

    const skills = job.skills || job.required_skills || [];

    return (
        <div
            onClick={onClick}
            className="group p-4 bg-gray-50 dark:bg-dark-800/50 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-dark-800 hover:shadow-md transition-all duration-300 border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">
                    {job.job_type === 'fixed_price' ? 'سعر ثابت' : 'بالساعة'}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(job.posted_at)}
                </span>
            </div>

            <h4 className="font-bold text-dark-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                {job.title}
            </h4>

            <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                <span className="font-semibold text-dark-900 dark:text-white">
                    {job.job_type === 'fixed_price'
                        ? `${job.budget_min} - ${job.budget_max} د.ت`
                        : `${job.hourly_rate} د.ت/س`
                    }
                </span>
                {job.location && (
                    <>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1 text-xs">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                        </span>
                    </>
                )}
            </div>

            <div className="flex flex-wrap gap-1">
                {skills.slice(0, 3).map((skill, index) => (
                    <span
                        key={index}
                        className="text-[10px] px-2 py-1 bg-white dark:bg-dark-700 border border-gray-100 dark:border-dark-600 rounded-md text-gray-600 dark:text-gray-300"
                    >
                        {skill}
                    </span>
                ))}
            </div>
        </div>
    );
}
