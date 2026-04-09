import { Calendar, DollarSign, Clock, ExternalLink, Share2 } from 'lucide-react';
import Button from '../ui/Button';

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
    if (!job) return null;

    return (
        <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-surface">
                    <h3 className="font-bold text-foreground dark:text-white">تفاصيل الوظيفة</h3>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600 mt-1">
                            <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-muted">الميزانية</p>
                            <p className="font-medium text-foreground dark:text-white">
                                {job.budget_min} - {job.budget_max} د.ت
                            </p>
                            <p className="text-xs text-muted mt-0.5">{job.job_type === 'fixed_price' ? 'سعر ثابت' : 'بالساعة'}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-1">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-muted">المدة المتوقعة</p>
                            <p className="font-medium text-foreground dark:text-white">{job.duration}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600 mt-1">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-muted">تاريخ النشر</p>
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
                            مشاركة
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-center text-xs"
                            leftIcon={<ExternalLink className="w-3 h-3" />}
                        >
                            عرض الوظيفة
                        </Button>
                    </div>
                </div>
            </div>

            {/* AI Recommendations Teaser */}
            <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-xl p-5 text-white">
                <h3 className="font-bold mb-2">توصيات الذكاء الاصطناعي</h3>
                <p className="text-primary-100 text-sm mb-4">
                    قمنا بتحليل متطلباتك ووجدنا 3 مستقلين يطابقون مشروعك بنسبة 95%.
                </p>
                <button className="w-full py-2 bg-card text-primary-900 rounded-lg font-bold text-sm hover:bg-primary-50 transition-colors">
                    عرض التوصيات
                </button>
            </div>
        </div>
    );
}
