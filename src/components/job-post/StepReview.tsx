import { useFormContext } from 'react-hook-form';
import { FileText, DollarSign, Calendar, Clock, MapPin, Briefcase, File, Globe, Lock } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { Skill } from '../../types';
import { getCategoryName, getSubcategoryName } from '../../lib/jobCategories';

interface StepReviewValues {
    title?: string;
    category?: string;
    subcategory?: string;
    posted_at?: string;
    description?: string;
    job_type?: 'fixed_price' | 'hourly';
    budget_min?: number;
    budget_max?: number;
    hourly_rate?: number;
    estimated_hours?: number;
    experience_level?: string;
    duration?: string;
    deadline?: string;
    visibility?: 'public' | 'invite_only';
    attachments_files?: File[];
    required_skills?: Skill[];
}

export default function StepReview() {
    const { watch } = useFormContext<StepReviewValues>();
    const { language, tx } = useTranslation();
    const values = watch();

    // Helper text mappings
    const durationMap: Record<string, string> = {
        'less_than_1_month': tx('jobs.new.stepReview.durationLessThan1Month', undefined, 'أقل من شهر'),
        '1_3_months': tx('jobs.new.stepReview.duration1To3Months', undefined, '1 - 3 أشهر'),
        '3_6_months': tx('jobs.new.stepReview.duration3To6Months', undefined, '3 - 6 أشهر'),
        'more_than_6_months': tx('jobs.new.stepReview.durationMoreThan6Months', undefined, 'أكثر من 6 أشهر')
    };

    const experienceMap: Record<string, string> = {
        'beginner': tx('jobs.new.stepReview.beginner', undefined, 'مبتدئ'),
        'intermediate': tx('jobs.new.stepReview.intermediate', undefined, 'متوسط الخبرة'),
        'expert': tx('jobs.new.stepReview.expert', undefined, 'خبير')
    };

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-primary-200">
                    <FileText className="w-3.5 h-3.5" />
                    {tx('jobs.new.stepReview.badge', undefined, 'Final check')}
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#171420] dark:text-white">
                    {tx('jobs.new.stepReview.title', undefined, 'Review and publish')}
                </h3>
                <p className="max-w-3xl text-sm leading-7 text-[#5c5971] dark:text-[#aca9bd] sm:text-base">
                    {tx('jobs.new.stepReview.subtitle', undefined, 'Review the brief one last time before it goes live to freelancers.')}
                </p>
            </div>

            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                <FileText className="w-5 h-5 flex-shrink-0" />
                <p>{tx('jobs.new.stepReview.warning', undefined, 'يرجى مراجعة تفاصيل الوظيفة بدقة قبل النشر. بعد النشر، ستتمكن من تعديل بعض التفاصيل فقط.')}</p>
            </div>

            <div className="space-y-6">
                {/* Header Preview */}
                <div className="rounded-[1.85rem] border border-primary-100/70 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                    <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{values.title}</h2>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 dark:bg-white/10">
                            <Briefcase className="w-4 h-4" />
                            {getCategoryName(values.category, language)}
                        </span>
                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 dark:bg-white/10">
                            <MapPin className="w-4 h-4" />
                            {getSubcategoryName(values.category, values.subcategory, language)}
                        </span>
                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 dark:bg-white/10">
                            <Clock className="w-4 h-4" />
                            {values.posted_at ? new Date(values.posted_at).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US') : tx('jobs.new.stepReview.now', undefined, 'الآن')}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h3 className="mb-3 font-bold text-gray-900 dark:text-white">{tx('jobs.new.stepReview.projectDescription', undefined, 'وصف المشروع')}</h3>
                    <p className="whitespace-pre-line leading-relaxed text-gray-600 dark:text-gray-300">
                        {values.description}
                    </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 gap-6 rounded-[1.85rem] border border-primary-100/70 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <DollarSign className="mt-1 h-5 w-5 text-gray-400 dark:text-gray-500" />
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{tx('jobs.new.stepReview.budget', undefined, 'الميزانية')}</h4>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {values.job_type === 'fixed_price'
                                        ? `${values.budget_min} - ${values.budget_max} د.ت`
                                        : tx('jobs.new.stepReview.hourlyBudget', { rate: values.hourly_rate ?? 0 }, `${values.hourly_rate ?? 0} د.ت / ساعة`)
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Briefcase className="mt-1 h-5 w-5 text-gray-400 dark:text-gray-500" />
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{tx('jobs.new.stepReview.experienceLevel', undefined, 'المستوى المطلوب')}</h4>
                                <p className="text-gray-600 dark:text-gray-400">{values.experience_level ? experienceMap[values.experience_level] : '—'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <Calendar className="mt-1 h-5 w-5 text-gray-400 dark:text-gray-500" />
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{tx('jobs.new.stepReview.projectDuration', undefined, 'مدة المشروع')}</h4>
                                <p className="text-gray-600 dark:text-gray-400">{values.duration ? durationMap[values.duration] : '—'}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Calendar className="mt-1 h-5 w-5 text-gray-400 dark:text-gray-500" />
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{tx('jobs.new.stepReview.deadline', undefined, 'الموعد النهائي')}</h4>
                                <p className="text-gray-600 dark:text-gray-400">{values.deadline ? new Date(values.deadline).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US') : '—'}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <MapPin className="mt-1 h-5 w-5 text-gray-400 dark:text-gray-500" />
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{tx('jobs.new.stepReview.visibility', undefined, 'الموقع')}</h4>
                                <p className="text-gray-600 dark:text-gray-400">{values.visibility === 'invite_only' ? tx('jobs.new.stepReview.inviteOnlyVisibility', undefined, 'خاص (دعوة فقط)') : tx('jobs.new.stepReview.publicVisibility', undefined, 'عام (الجميع)')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {values.job_type === 'hourly' && values.estimated_hours ? (
                    <div className="rounded-[1.5rem] border border-primary-100/70 bg-primary-50/60 px-4 py-3 text-sm text-primary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-primary-200">
                        {tx('jobs.new.stepReview.estimatedHours', { hours: values.estimated_hours }, `${values.estimated_hours} estimated hours per week`)}
                    </div>
                ) : null}

                {/* Visibility */}
                <div className="rounded-[1.85rem] border border-primary-100/70 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
                            {values.visibility === 'public' ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{tx('jobs.new.stepReview.privacyLevel', undefined, 'مستوى الخصوصية')}</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {values.visibility === 'public'
                                    ? tx('jobs.new.stepVisibility.publicTitle', undefined, 'عام للجميع')
                                    : tx('jobs.new.stepVisibility.inviteOnlyTitle', undefined, 'دعوة فقط')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Attachments */}
                {values.attachments_files && values.attachments_files.length > 0 && (
                    <div className="rounded-[1.85rem] border border-primary-100/70 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                        <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-gray-50 p-2 text-gray-500 dark:bg-white/10 dark:text-gray-400">
                                <File className="w-5 h-5" />
                            </div>
                            <div className="w-full">
                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">{tx('jobs.new.stepReview.attachments', undefined, 'الملفات المرفقة')}</p>
                                <div className="space-y-2">
                                    {values.attachments_files.map((file: File, index: number) => (
                                        <div key={index} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2 text-sm dark:border-white/10 dark:bg-white/[0.03]">
                                            <span className="truncate font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
                                            <span className="text-muted text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Skills */}
                <div className="rounded-[1.85rem] border border-primary-100/70 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                    <h3 className="mb-3 font-bold text-gray-900 dark:text-white">{tx('jobs.new.stepReview.requiredSkills', undefined, 'المهارات المطلوبة')}</h3>
                    <div className="flex flex-wrap gap-2">
                        {values.required_skills?.map((skill) => (
                            <span key={skill.id} className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                                {language === 'ar' ? skill.name_ar : language === 'fr' ? skill.name_fr : skill.name_en}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
