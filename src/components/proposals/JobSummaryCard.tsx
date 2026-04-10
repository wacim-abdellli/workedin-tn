import { Calendar, DollarSign, Clock, ExternalLink, Share2 } from 'lucide-react';
import Button from '../ui/Button';
import { useTranslation } from "../../i18n";

interface ProposalJobSummary {
    budget_min: number;
    budget_max: number;
    job_type: 'fixed_price' | 'hourly' | string;
    duration: string;
    created_at?: string;
    stats?: {
        proposals: number;
        interviewing: number;
        shortlisted: number;
    };
}

interface JobSummaryProps {
    job: ProposalJobSummary | null;
}

export default function JobSummaryCard({ job }: JobSummaryProps) {
    const { tx } = useTranslation();
    if (!job) return null;

    return (
        <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-surface">
                    <h3 className="font-bold text-foreground dark:text-white">{tx('dynamic_key_936673124')}</h3>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600 mt-1">
                            <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-muted">{tx('dynamic_key_857615762')}</p>
                            <p className="font-medium text-foreground dark:text-white">
                                {job.budget_min} - {job.budget_max} {tx('dynamic_key_1524267')}</p>
                            <p className="text-xs text-muted mt-0.5">{job.job_type === 'fixed_price' ? 'سعر ثابت' : 'بالساعة'}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-1">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-muted">{tx('dynamic_key_236480406')}</p>
                            <p className="font-medium text-foreground dark:text-white">{job.duration}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600 mt-1">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-muted">{tx('dynamic_key_2053478334')}</p>
                            <p className="font-medium text-foreground dark:text-white">
                                {new Date(job.created_at || Date.now()).toLocaleDateString('ar-TN')}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-center text-xs"
                            leftIcon={<Share2 className="w-3 h-3" />}
                        >
                            {tx('dynamic_key_220193727')}</Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-center text-xs"
                            leftIcon={<ExternalLink className="w-3 h-3" />}
                        >
                            {tx('dynamic_key_1543783939')}</Button>
                    </div>
                </div>
            </div>

            {/* AI Recommendations Teaser */}
            <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-xl p-5 text-white">
                <h3 className="font-bold mb-2">{tx('dynamic_key_197805234')}</h3>
                <p className="text-primary-100 text-sm mb-4">
                    {tx('dynamic_key_1253092729')}</p>
                <button className="w-full py-2 bg-card text-primary-900 rounded-lg font-bold text-sm hover:bg-primary-50 transition-colors">
                    {tx('dynamic_key_232051787')}</button>
            </div>
        </div>
    );
}
