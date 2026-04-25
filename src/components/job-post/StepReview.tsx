import { useFormContext } from 'react-hook-form';
import { FileText, DollarSign, Calendar, Clock, MapPin, Briefcase, Paperclip, Globe, Lock, ExternalLink } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { Skill } from '../../types';
import { getCategoryName, getSubcategoryName } from '../../lib/jobCategories';
import { getJobReferenceLinkMeta, sanitizeJobReferenceLinks } from '../../lib/jobLinks';

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
    attachments_files?: globalThis.File[];
    existing_attachments?: string[];
    required_skills?: Skill[];
    reference_links?: string[];
}

function extractExistingAttachmentName(rawValue: string, index: number): string {
    const normalized = rawValue.split('?')[0].split('#')[0].replace(/\\/g, '/');
    const filename = normalized.split('/').pop();
    const fallback = `attachment-${index + 1}`;

    if (!filename) return fallback;

    try {
        return decodeURIComponent(filename);
    } catch {
        return filename;
    }
}

export default function StepReview() {
    const { watch } = useFormContext<StepReviewValues>();
    const { language, tx } = useTranslation();
    const values = watch();
    const existingAttachments = (values.existing_attachments || []).filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
    const referenceLinks = sanitizeJobReferenceLinks(values.reference_links || []);

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
        <div className="space-y-6">
            <header className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                    <FileText className="h-3.5 w-3.5" />
                    {tx('jobs.new.stepReview.badge', undefined, 'Final check')}
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {tx('jobs.new.stepReview.title', undefined, 'Review and publish')}
                </h3>
                <p className="text-sm leading-6 text-[#b3b3b3]">
                    {tx('jobs.new.stepReview.subtitle', undefined, 'Review the brief one last time before it goes live to freelancers.')}
                </p>
            </header>

            <section className="flex gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm text-[#cfcfcf]">
                <FileText className="h-4.5 w-4.5 shrink-0 text-orange-300" />
                <p className="text-[#b3b3b3]">
                    {tx('jobs.new.stepReview.warning', undefined, 'يرجى مراجعة تفاصيل الوظيفة بدقة قبل النشر. بعد النشر، ستتمكن من تعديل بعض التفاصيل فقط.')}
                </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5">
                <h4 className="text-lg font-semibold text-white">{values.title || '—'}</h4>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#b3b3b3]">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {getCategoryName(values.category, language) || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {getSubcategoryName(values.category, values.subcategory, language) || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1">
                        <Clock className="h-3.5 w-3.5" />
                        {values.posted_at
                            ? new Date(values.posted_at).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')
                            : tx('jobs.new.stepReview.now', undefined, 'الآن')}
                    </span>
                </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5">
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                    {tx('jobs.new.stepReview.projectDescription', undefined, 'وصف المشروع')}
                </h4>
                <p className="whitespace-pre-line text-sm leading-6 text-[#b3b3b3]">{values.description || '—'}</p>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                    <p className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                        <DollarSign className="h-4 w-4" />
                        {tx('jobs.new.stepReview.budget', undefined, 'الميزانية')}
                    </p>
                    <p className="text-sm text-white">
                        {values.job_type === 'fixed_price'
                            ? tx('jobs.new.stepReview.budgetRange', { min: values.budget_min ?? 0, max: values.budget_max ?? 0 }, `${values.budget_min ?? 0} - ${values.budget_max ?? 0} د.ت`)
                            : tx('jobs.new.stepReview.hourlyBudget', { rate: values.hourly_rate ?? 0 }, `${values.hourly_rate ?? 0} د.ت / ساعة`)}
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                    <p className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                        <Briefcase className="h-4 w-4" />
                        {tx('jobs.new.stepReview.experienceLevel', undefined, 'المستوى المطلوب')}
                    </p>
                    <p className="text-sm text-white">{values.experience_level ? experienceMap[values.experience_level] : '—'}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                    <p className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                        <Calendar className="h-4 w-4" />
                        {tx('jobs.new.stepReview.projectDuration', undefined, 'مدة المشروع')}
                    </p>
                    <p className="text-sm text-white">{values.duration ? durationMap[values.duration] : '—'}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                    <p className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                        <Calendar className="h-4 w-4" />
                        {tx('jobs.new.stepReview.deadline', undefined, 'الموعد النهائي')}
                    </p>
                    <p className="text-sm text-white">
                        {values.deadline
                            ? new Date(values.deadline).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')
                            : '—'}
                    </p>
                </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-300">
                        {values.visibility === 'public' ? <Globe className="h-4.5 w-4.5" /> : <Lock className="h-4.5 w-4.5" />}
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                            {tx('jobs.new.stepReview.privacyLevel', undefined, 'مستوى الخصوصية')}
                        </p>
                        <p className="text-sm font-medium text-white">
                            {values.visibility === 'public'
                                ? tx('jobs.new.stepVisibility.publicTitle', undefined, 'عام للجميع')
                                : tx('jobs.new.stepVisibility.inviteOnlyTitle', undefined, 'دعوة فقط')}
                        </p>
                    </div>
                </div>
            </section>

            {values.job_type === 'hourly' && values.estimated_hours ? (
                <section className="rounded-2xl border border-orange-500/25 bg-orange-500/5 px-4 py-3 text-sm text-orange-200">
                    {tx('jobs.new.stepReview.estimatedHours', { hours: values.estimated_hours }, `${values.estimated_hours} estimated hours per week`)}
                </section>
            ) : null}

            {values.attachments_files && values.attachments_files.length > 0 ? (
                <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5">
                    <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                        <Paperclip className="h-4 w-4" />
                        {tx('jobs.new.stepReview.attachments', undefined, 'الملفات المرفقة')}
                    </p>
                    <div className="space-y-2">
                        {values.attachments_files.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-[#b3b3b3]">
                                <p className="font-medium text-white">
                                    {tx('jobs.new.stepReview.attachmentLabel', { index: index + 1 }, `Attachment ${index + 1}`)}
                                </p>
                                <p className="text-xs text-[#8f8f8f] mt-0.5">{file.name}</p>
                                <span className="inline-block mt-1 text-xs text-[#8f8f8f]">
                                    {tx('jobs.new.stepReview.fileSize', { size: (file.size / 1024 / 1024).toFixed(2) }, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`)}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {existingAttachments.length > 0 ? (
                <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5">
                    <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                        <Paperclip className="h-4 w-4" />
                        {tx('jobs.new.stepReview.currentAttachments', undefined, 'Current attachments')}
                    </p>
                    <div className="space-y-2">
                        {existingAttachments.map((attachment, index) => {
                            const href = /^https?:\/\//i.test(attachment.trim()) ? attachment.trim() : undefined;

                            return (
                                <div key={`${attachment}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-[#b3b3b3]">
                                    <p className="font-medium text-white">
                                        {tx('jobs.new.stepReview.attachmentLabel', { index: index + 1 }, `Attachment ${index + 1}`)}
                                    </p>
                                    {href ? (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#8f8f8f] transition hover:text-orange-300"
                                        >
                                            <span>{extractExistingAttachmentName(attachment, index)}</span>
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    ) : (
                                        <p className="text-xs text-[#8f8f8f] mt-0.5">{extractExistingAttachmentName(attachment, index)}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            {referenceLinks.length > 0 ? (
                <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5">
                    <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                        <Globe className="h-4 w-4" />
                        {tx('jobs.new.stepReview.links', undefined, 'Reference links')}
                    </p>
                    <div className="space-y-2">
                        {referenceLinks.map((link, index) => {
                            const meta = getJobReferenceLinkMeta(link);
                            if (!meta) return null;

                            return (
                                <a
                                    key={`${link}-${index}`}
                                    href={meta.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-[#b3b3b3] transition hover:border-orange-500/35 hover:text-white"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-white">
                                            {tx('jobs.new.stepReview.linkLabel', { index: index + 1 }, `Link ${index + 1}`)} - {meta.platformLabel}
                                        </p>
                                        <p className="truncate text-xs text-[#8f8f8f]">{meta.hostname}</p>
                                    </div>
                                    <ExternalLink className="h-4 w-4 shrink-0 text-[#8f8f8f] transition group-hover:text-orange-300" />
                                </a>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            <section className="rounded-2xl border border-white/10 bg-[#101010] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-5">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                    {tx('jobs.new.stepReview.requiredSkills', undefined, 'المهارات المطلوبة')}
                </h4>
                <div className="flex flex-wrap gap-2">
                    {values.required_skills?.length ? (
                        values.required_skills.map((skill) => (
                            <span key={skill.id} className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-200">
                                {language === 'ar' ? skill.name_ar : language === 'fr' ? skill.name_fr : skill.name_en}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-[#8f8f8f]">—</span>
                    )}
                </div>
            </section>
        </div>
    );
}
