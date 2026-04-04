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
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 dark:text-white">تفاصيل الوظيفة</h3>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600 mt-1">
                            <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">الميزانية</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-white">
                                {job.budget_min} - {job.budget_max} د.ت
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{job.job_type === 'fixed_price' ? 'سعر ثابت' : 'بالساعة'}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-1">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">المدة المتوقعة</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-white">{job.duration}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600 mt-1">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ النشر</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-white">
                                {new Date(job.created_at || Date.now()).toLocaleDateString('ar-TN')}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2">
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
                <button className="w-full py-2 bg-white dark:bg-gray-800 text-primary-900 rounded-lg font-bold text-sm hover:bg-primary-50 transition-colors">
                    عرض التوصيات
                </button>
            </div>
        </div>
    );
}
