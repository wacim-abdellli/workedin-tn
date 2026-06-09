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
        <div className="space-y-6 text-white">
            {/* Warning Callout Box */}
            <section className="flex gap-4 rounded-2xl border border-workspace-primary/15 bg-workspace-primary/[0.02] p-5 text-sm text-gray-300">
                <FileText className="h-5 w-5 shrink-0 text-workspace-primary" />
                <p className="text-xs leading-relaxed text-gray-400">
                    {tx('jobs.new.stepReview.warning', undefined, 'Please review your project details carefully. Some details cannot be modified once the brief is published to protect active bids.')}
                </p>
            </section>

            {/* Brief Main Metadata Box */}
            <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex flex-col gap-4">
                <h4 className="text-xl font-bold text-white tracking-tight leading-snug">{values.title || '—'}</h4>
                <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-gray-300 font-medium">
                        <Briefcase className="h-3.5 w-3.5 text-workspace-primary" />
                        {getCategoryName(values.category, language) || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-gray-300 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-workspace-primary" />
                        {getSubcategoryName(values.category, values.subcategory, language) || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-gray-300 font-medium">
                        <Clock className="h-3.5 w-3.5 text-workspace-primary" />
                        {values.posted_at
                            ? new Date(values.posted_at).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')
                            : tx('jobs.new.stepReview.now', undefined, 'Just now')}
                    </span>
                </div>
            </section>

            {/* Description Card */}
            <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    {tx('jobs.new.stepReview.projectDescription', undefined, 'Project Scope & Description')}
                </h5>
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-300">{values.description || '—'}</p>
            </section>

            {/* Variables Grid (4 Columns) */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Budget */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 flex flex-col gap-2 hover:border-white/10 transition-colors">
                    <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <DollarSign className="h-4 w-4 text-workspace-primary" />
                        {tx('jobs.new.stepReview.budget', undefined, 'Budget')}
                    </p>
                    <p className="text-sm font-bold text-white">
                        {values.job_type === 'fixed_price'
                            ? (values.budget_min === values.budget_max
                                ? `${values.budget_min ?? 0} TND`
                                : tx('jobs.new.stepReview.budgetRange', { min: values.budget_min ?? 0, max: values.budget_max ?? 0 }, `${values.budget_min ?? 0} - ${values.budget_max ?? 0} TND`))
                            : tx('jobs.new.stepReview.hourlyBudget', { rate: values.hourly_rate ?? 0 }, `${values.hourly_rate ?? 0} TND / hr`)}
                    </p>
                </div>

                {/* Level */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 flex flex-col gap-2 hover:border-white/10 transition-colors">
                    <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <Briefcase className="h-4 w-4 text-workspace-primary" />
                        {tx('jobs.new.stepReview.experienceLevel', undefined, 'Experience')}
                    </p>
                    <p className="text-sm font-bold text-white">{values.experience_level ? experienceMap[values.experience_level] : '—'}</p>
                </div>

                {/* Duration */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 flex flex-col gap-2 hover:border-white/10 transition-colors">
                    <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <Clock className="h-4 w-4 text-workspace-primary" />
                        {tx('jobs.new.stepReview.projectDuration', undefined, 'Duration')}
                    </p>
                    <p className="text-sm font-bold text-white">{values.duration ? durationMap[values.duration] : '—'}</p>
                </div>

                {/* Deadline */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 flex flex-col gap-2 hover:border-white/10 transition-colors">
                    <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <Calendar className="h-4 w-4 text-workspace-primary" />
                        {tx('jobs.new.stepReview.deadline', undefined, 'Deadline')}
                    </p>
                    <p className="text-sm font-bold text-white">
                        {values.deadline
                            ? new Date(values.deadline).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')
                            : '—'}
                    </p>
                </div>
            </section>

            {/* Privacy Level & Hourly Hours */}
            <div className="grid gap-4 sm:grid-cols-2">
                <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 flex items-center gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-workspace-primary/10 text-workspace-primary">
                        {values.visibility === 'public' ? <Globe className="h-5.5 w-5.5" /> : <Lock className="h-5.5 w-5.5" />}
                    </span>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {tx('jobs.new.stepReview.privacyLevel', undefined, 'Privacy Level')}
                        </p>
                        <p className="text-sm font-bold text-white">
                            {values.visibility === 'public'
                                ? tx('jobs.new.stepVisibility.publicTitle', undefined, 'Public')
                                : tx('jobs.new.stepVisibility.inviteOnlyTitle', undefined, 'Invite Only')}
                        </p>
                    </div>
                </section>

                {values.job_type === 'hourly' && values.estimated_hours ? (
                    <section className="rounded-2xl border border-workspace-primary/15 bg-workspace-primary/5 p-5 flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-workspace-primary/10 text-workspace-primary">
                            <Clock className="h-5.5 w-5.5 animate-pulse" />
                        </span>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                {tx('jobs.new.stepReview.weeklyHoursBadge', undefined, 'Weekly Schedule')}
                            </p>
                            <p className="text-sm font-bold text-white">
                                {tx('jobs.new.stepReview.estimatedHours', { hours: values.estimated_hours }, `${values.estimated_hours} hrs/week`)}
                            </p>
                        </div>
                    </section>
                ) : null}
            </div>

            {/* Skills */}
            <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    {tx('jobs.new.stepReview.requiredSkills', undefined, 'Required Skills')}
                </h5>
                <div className="flex flex-wrap gap-2">
                    {values.required_skills?.length ? (
                        values.required_skills.map((skill) => (
                            <span key={skill.id} className="rounded-xl border border-workspace-primary/25 bg-workspace-primary/10 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:border-workspace-primary/40">
                                {language === 'ar' ? skill.name_ar : language === 'fr' ? skill.name_fr : skill.name_en}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-gray-500">—</span>
                    )}
                </div>
            </section>

            {/* New Uploaded Attachments */}
            {values.attachments_files && values.attachments_files.length > 0 ? (
                <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-workspace-primary" />
                        {tx('jobs.new.stepReview.attachments', undefined, 'New Attachments')}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {values.attachments_files.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-500">
                                        {tx('jobs.new.stepReview.attachmentLabel', { index: index + 1 }, `Attachment ${index + 1}`)}
                                    </p>
                                    <p className="text-sm font-bold text-white truncate mt-1">{file.name}</p>
                                </div>
                                <span className="inline-block mt-3 text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-md w-fit">
                                    {tx('jobs.new.stepReview.fileSize', { size: (file.size / 1024 / 1024).toFixed(2) }, `${(file.size / 1024 / 1024).toFixed(2)} MB`)}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* Existing Attachments */}
            {existingAttachments.length > 0 ? (
                <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-workspace-primary" />
                        {tx('jobs.new.stepReview.currentAttachments', undefined, 'Current attachments')}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {existingAttachments.map((attachment, index) => {
                            const href = /^https?:\/\//i.test(attachment.trim()) ? attachment.trim() : undefined;

                            return (
                                <div key={`${attachment}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            {tx('jobs.new.stepReview.attachmentLabel', { index: index + 1 }, `Attachment ${index + 1}`)}
                                        </p>
                                        <p className="text-sm font-bold text-white truncate mt-1">
                                            {extractExistingAttachmentName(attachment, index)}
                                        </p>
                                    </div>
                                    {href && (
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-flex items-center gap-1.5 text-xs text-workspace-primary hover:text-white transition-colors w-fit font-semibold"
                                        >
                                            <span>Open File</span>
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            {/* Reference Links */}
            {referenceLinks.length > 0 ? (
                <section className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-workspace-primary" />
                        {tx('jobs.new.stepReview.links', undefined, 'Reference links')}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {referenceLinks.map((link, index) => {
                            const meta = getJobReferenceLinkMeta(link);
                            if (!meta) return null;

                            return (
                                <a
                                    key={`${link}-${index}`}
                                    href={meta.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4 transition duration-300 hover:border-workspace-primary/45 hover:bg-workspace-primary/5 hover:text-white"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-500">
                                            {tx('jobs.new.stepReview.linkLabel', { index: index + 1 }, `Link ${index + 1}`)} - {meta.platformLabel}
                                        </p>
                                        <p className="truncate text-sm font-bold text-white mt-1 group-hover:text-workspace-primary transition-colors">{meta.hostname}</p>
                                    </div>
                                    <ExternalLink className="h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:text-workspace-primary" />
                                </a>
                            );
                        })}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
