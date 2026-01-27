import { useFormContext } from 'react-hook-form';
import { FileText, DollarSign, Calendar, Clock, MapPin, Briefcase, File, Globe, Lock } from 'lucide-react';

export default function StepReview() {
    const { watch } = useFormContext();
    const values = watch();

    // Helper text mappings
    const durationMap: any = {
        'less_than_1_month': 'أقل من شهر',
        '1_3_months': '1 - 3 أشهر',
        '3_6_months': '3 - 6 أشهر',
        'more_than_6_months': 'أكثر من 6 أشهر'
    };

    const experienceMap: any = {
        'beginner': 'مبتدئ',
        'intermediate': 'متوسط الخبرة',
        'expert': 'خبير'
    };

    return (
        <div className="space-y-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 text-sm text-yellow-800">
                <FileText className="w-5 h-5 flex-shrink-0" />
                <p>يرجى مراجعة تفاصيل الوظيفة بدقة قبل النشر. بعد النشر، ستتمكن من تعديل بعض التفاصيل فقط.</p>
            </div>

            <div className="space-y-6">
                {/* Header Preview */}
                <div className="border-b border-gray-100 pb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{values.title}</h2>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                            <Briefcase className="w-4 h-4" />
                            {values.category}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                            <Clock className="w-4 h-4" />
                            {values.posted_at ? new Date(values.posted_at).toLocaleDateString('ar-TN') : 'الآن'}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-3">وصف المشروع</h3>
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                        {values.description}
                    </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-6">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900">الميزانية</h4>
                                <p className="text-gray-600">
                                    {values.job_type === 'fixed_price'
                                        ? `${values.budget_min} - ${values.budget_max} د.ت`
                                        : `${values.hourly_rate} د.ت / ساعة`
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900">المستوى المطلوب</h4>
                                <p className="text-gray-600">{experienceMap[values.experience_level]}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900">مدة المشروع</h4>
                                <p className="text-gray-600">{durationMap[values.duration]}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900">الموقع</h4>
                                <p className="text-gray-600">{values.visibility === 'invite_only' ? 'خاص (دعوة فقط)' : 'عام (الجميع)'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visibility */}
                <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        {values.visibility === 'public' ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">مستوى الخصوصية</p>
                        <p className="font-medium text-gray-900">
                            {values.visibility === 'public' ? 'عام للجميع' : 'دعوة فقط'}
                        </p>
                    </div>
                </div>

                {/* Attachments */}
                {values.attachments_files && values.attachments_files.length > 0 && (
                    <div className="flex items-start gap-3 pt-6 border-t border-gray-100">
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                            <File className="w-5 h-5" />
                        </div>
                        <div className="w-full">
                            <p className="text-sm text-gray-500 mb-2">الملفات المرفقة</p>
                            <div className="space-y-2">
                                {values.attachments_files.map((file: File, index: number) => (
                                    <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <span className="font-medium text-gray-700 truncate">{file.name}</span>
                                        <span className="text-muted text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Skills */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-3">المهارات المطلوبة</h3>
                    <div className="flex flex-wrap gap-2">
                        {values.required_skills?.map((skill: any) => (
                            <span key={skill.id} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                                {skill.name_ar}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
