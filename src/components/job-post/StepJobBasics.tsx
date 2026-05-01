import { useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { ExternalLink, FileText, Grid, Lightbulb, Trash2 } from 'lucide-react';
import Input from '../ui/Input';
import { FileUpload } from '../common/FileUpload';
import JobLinksInput from './JobLinksInput';
import { PREDEFINED_SKILLS } from '../../types';
import { useTranslation } from '../../i18n';
import type { Skill } from '../../types';
import { getJobCategories } from '../../lib/jobCategories';
import { MAX_JOB_REFERENCE_LINKS } from '../../lib/jobLinks';
import { supabase } from '../../lib/supabase';

type JobSkill = Skill;

interface StepJobBasicsFormValues {
    title?: string;
    category?: string;
    subcategory?: string;
    description?: string;
    required_skills?: JobSkill[];
    attachments_files?: File[];
    existing_attachments?: string[];
    reference_links?: string[];
}

function resolveExistingAttachmentUrl(rawValue: string): string {
    const trimmed = rawValue.trim();
    if (!trimmed) return '';

    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    const normalizedPath = trimmed.replace(/^\/+/, '').replace(/^attachments\//i, '');
    return supabase.storage.from('attachments').getPublicUrl(normalizedPath).data.publicUrl;
}

function extractAttachmentName(rawValue: string, index: number): string {
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

export default function StepJobBasics() {
    const {
        register,
        control,
        formState: { errors },
        watch,
        setValue,
    } = useFormContext<StepJobBasicsFormValues>();
    const { language, tx } = useTranslation();

    const description = watch('description') || '';
    const selectedCategory = watch('category') || '';
    const selectedSubcategory = watch('subcategory') || '';
    const selectedSkills = watch('required_skills') || [];
    const existingAttachments = watch('existing_attachments') || [];

    const categories = getJobCategories(language);
    const subcategories = categories.find((category) => category.id === selectedCategory)?.subcategories ?? [];

    useEffect(() => {
        if (selectedSubcategory && !subcategories.some((item) => item.id === selectedSubcategory)) {
            setValue('subcategory', '');
        }
    }, [selectedSubcategory, setValue, subcategories]);

    const toggleSkill = (skill: JobSkill) => {
        const exists = selectedSkills.find((selected) => selected.id === skill.id);

        if (exists) {
            setValue(
                'required_skills',
                selectedSkills.filter((selected) => selected.id !== skill.id),
                { shouldDirty: true, shouldValidate: true }
            );
            return;
        }

        if (selectedSkills.length >= 5) return;

        setValue('required_skills', [...selectedSkills, skill], { shouldDirty: true, shouldValidate: true });
    };

    const categoryRegister = register('category');
    const subcategoryRegister = register('subcategory');

    const removeExistingAttachment = (targetIndex: number) => {
        setValue(
            'existing_attachments',
            existingAttachments.filter((_, index) => index !== targetIndex),
            { shouldDirty: true, shouldValidate: true }
        );
    };

    return (
        <div className="space-y-6">
            <header className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                    <FileText className="h-3.5 w-3.5" />
                    {tx('jobs.new.stepBasics.badge', undefined, 'Project brief')}
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
                    {tx('jobs.new.stepBasics.title', undefined, 'تفاصيل المهمة')}
                </h3>
                <p className="text-sm leading-6 text-[#b3b3b3]">
                    {tx('jobs.new.stepBasics.subtitle', undefined, 'ابدأ بعنوان واضح ووصف دقيق لمشروعك لجذب أفضل المستقلين.')}
                </p>
            </header>

            <section className="space-y-4 rounded-xl border border-[#2d2d2d] bg-[var(--color-bg-base)] p-4 sm:p-5">
                <Input
                    label={tx('jobs.new.stepBasics.projectTitle', undefined, 'عنوان المشروع')}
                    placeholder={tx('jobs.new.stepBasics.projectTitlePlaceholder', undefined, 'مثال: تصميم شعار لشركة مواد غذائية')}
                    error={errors.title?.message as string}
                    {...register('title')}
                    leftIcon={<FileText className="h-4.5 w-4.5 text-[#8f8f8f]" />}
                    className="!rounded-xl !border-[#2d2d2d] !bg-[var(--color-bg-base)] !text-[var(--color-text-primary)] placeholder:!text-[#707070] focus:!border-orange-500/70 focus:!ring-orange-500/25"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                            <Grid className="h-4 w-4" />
                            {tx('jobs.new.stepBasics.mainCategory', undefined, 'التصنيف الرئيسي')}
                        </label>
                        <select
                            {...categoryRegister}
                            value={selectedCategory}
                            onChange={(event) => {
                                categoryRegister.onChange(event);
                                setValue('subcategory', '', { shouldDirty: true, shouldValidate: true });
                            }}
                            className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/25"
                        >
                            <option value="">{tx('jobs.new.stepBasics.selectCategory', undefined, 'اختر التصنيف')}</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {errors.category ? <p className="mt-1 text-xs text-red-400">{errors.category.message as string}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                            <Grid className="h-4 w-4" />
                            {tx('jobs.new.stepBasics.subcategory', undefined, 'التخصص الفرعي')}
                        </label>
                        <select
                            {...subcategoryRegister}
                            value={selectedSubcategory}
                            disabled={!selectedCategory}
                            className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">{tx('jobs.new.stepBasics.selectSubcategory', undefined, 'اختر التخصص الفرعي')}</option>
                            {subcategories.map((subcategory) => (
                                <option key={subcategory.id} value={subcategory.id}>
                                    {subcategory.name}
                                </option>
                            ))}
                        </select>
                        {errors.subcategory ? <p className="mt-1 text-xs text-red-400">{errors.subcategory.message as string}</p> : null}
                    </div>
                </div>

                <div>
                    <label className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d7d7d]">
                        {tx('jobs.new.stepBasics.projectDescription', undefined, 'وصف المشروع')}
                    </label>
                    <textarea
                        {...register('description')}
                        rows={6}
                        className="w-full resize-y rounded-xl border border-[#2d2d2d] bg-[var(--color-bg-base)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[#707070] focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/25"
                        placeholder={tx('jobs.new.stepBasics.projectDescriptionPlaceholder', undefined, 'اشرح تفاصيل المشروع، المخرجات المتوقعة، وأي متطلبات خاصة...')}
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-300">
                            {tx('jobs.new.stepBasics.characterCount', { current: description.length, max: 2000 }, `${description.length} / 2000 characters`)}
                        </span>
                        {errors.description ? <span className="text-xs text-red-400">{errors.description.message as string}</span> : null}
                    </div>
                </div>

                <div className="flex gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-sm text-[#cfcfcf]">
                    <Lightbulb className="mt-0.5 h-4.5 w-4.5 shrink-0 text-orange-300" />
                    <ul className="list-inside list-disc space-y-1 text-[#b3b3b3]">
                        <li>{tx('jobs.new.stepBasics.tip1', undefined, 'كن دقيقاً في وصف المطلوب')}</li>
                        <li>{tx('jobs.new.stepBasics.tip2', undefined, 'حدد المخرجات النهائية بوضوح')}</li>
                        <li>{tx('jobs.new.stepBasics.tip3', undefined, 'أضف روابط لمشاريع مشابهة إن وجدت')}</li>
                        <li>{tx('jobs.new.stepBasics.tip4', undefined, 'وضح ما الذي يجب تسليمه ومتى تتوقع الانتهاء')}</li>
                    </ul>
                </div>
            </section>

            <section className="space-y-3 rounded-xl border border-[#2d2d2d] bg-[var(--color-bg-base)] p-4 sm:p-5">
                <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                    {tx('jobs.new.stepBasics.requiredSkills', undefined, 'المهارات المطلوبة (بحد أقصى 5)')}
                </label>
                <div className="flex flex-wrap gap-2">
                    {PREDEFINED_SKILLS.map((skill) => {
                        const isSelected = selectedSkills.some((selected) => selected.id === skill.id);
                        return (
                            <button
                                key={skill.id}
                                type="button"
                                onClick={() => toggleSkill(skill)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${isSelected
                                    ? 'border-orange-500/45 bg-orange-500/10 text-orange-200'
                                    : 'border-[#313131] bg-[var(--color-bg-elevated)] text-[#b3b3b3] hover:border-orange-500/35 hover:bg-orange-500/5'
                                    }`}
                            >
                                {language === 'ar' ? skill.name_ar : language === 'fr' ? skill.name_fr : skill.name_en}
                            </button>
                        );
                    })}
                </div>
                {errors.required_skills ? <p className="text-xs text-red-400">{errors.required_skills.message as string}</p> : null}
            </section>

            <section className="rounded-xl border border-[#2d2d2d] bg-[var(--color-bg-base)] p-4 sm:p-5">
                <Controller
                    name="reference_links"
                    control={control}
                    render={({ field }) => (
                        <JobLinksInput
                            value={field.value || []}
                            onChange={field.onChange}
                            maxLinks={MAX_JOB_REFERENCE_LINKS}
                        />
                    )}
                />
                {errors.reference_links ? (
                    <p className="mt-2 text-xs text-red-400">{errors.reference_links.message as string}</p>
                ) : null}
            </section>

            <section className="rounded-xl border border-[#2d2d2d] bg-[var(--color-bg-base)] p-4 sm:p-5">
                {existingAttachments.length > 0 ? (
                    <div className="mb-4 space-y-2 rounded-xl border border-[#2d2d2d] bg-[var(--color-bg-elevated)] p-3.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a9a9a]">
                            {tx('jobs.new.stepBasics.currentAttachments', undefined, 'Current attachments')}
                        </p>
                        {existingAttachments.map((attachment, index) => {
                            const attachmentUrl = resolveExistingAttachmentUrl(attachment);
                            const filename = extractAttachmentName(attachment, index);

                            return (
                                <div
                                    key={`${attachment}-${index}`}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-[#2d2d2d] bg-[var(--color-bg-base)] px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                            {tx('jobs.new.stepBasics.attachmentLabel', { index: index + 1 }, `Attachment ${index + 1}`)}
                                        </p>
                                        <a
                                            href={attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-[#9a9a9a] transition hover:text-orange-300"
                                        >
                                            <span className="truncate">{filename}</span>
                                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                        </a>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeExistingAttachment(index)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8f8f8f] transition hover:bg-white/5 hover:text-red-300"
                                        aria-label={tx('jobs.new.stepBasics.removeExistingAttachment', undefined, 'Remove attachment')}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : null}

                <Controller
                    name="attachments_files"
                    control={control}
                    render={({ field }) => (
                        <FileUpload
                            value={field.value || []}
                            onChange={field.onChange}
                            label={tx('jobs.new.stepBasics.attachments', undefined, 'المرفقات (اختياري)')}
                            description={tx('jobs.new.stepBasics.attachmentsDescription', undefined, 'PDF, DOC, DOCX, TXT, PNG, JPG, WEBP - حد أقصى 10MB لكل ملف')}
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                            maxSize={10}
                            maxFiles={5}
                        />
                    )}
                />
            </section>
        </div>
    );
}




