import { useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FileText, Grid, Lightbulb } from 'lucide-react';
import Input from '../ui/Input';
import { FileUpload } from '../common/FileUpload';
import { PREDEFINED_SKILLS } from '../../types';
import { useTranslation } from '../../i18n';
import type { Skill } from '../../types';
import { getJobCategories } from '../../lib/jobCategories';

type JobSkill = Skill;

interface StepJobBasicsFormValues {
    title?: string;
    category?: string;
    subcategory?: string;
    description?: string;
    required_skills?: JobSkill[];
    attachments_files?: File[];
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

    return (
        <div className="space-y-6">
            <header className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-300">
                    <FileText className="h-3.5 w-3.5" />
                    {tx('jobs.new.stepBasics.badge', undefined, 'Project brief')}
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {tx('jobs.new.stepBasics.title', undefined, 'تفاصيل المهمة')}
                </h3>
                <p className="text-sm leading-6 text-[#b3b3b3]">
                    {tx('jobs.new.stepBasics.subtitle', undefined, 'ابدأ بعنوان واضح ووصف دقيق لمشروعك لجذب أفضل المستقلين.')}
                </p>
            </header>

            <section className="space-y-4 rounded-xl border border-[#2d2d2d] bg-[#101010] p-4 sm:p-5">
                <Input
                    label={tx('jobs.new.stepBasics.projectTitle', undefined, 'عنوان المشروع')}
                    placeholder={tx('jobs.new.stepBasics.projectTitlePlaceholder', undefined, 'مثال: تصميم شعار لشركة مواد غذائية')}
                    error={errors.title?.message as string}
                    {...register('title')}
                    leftIcon={<FileText className="h-4.5 w-4.5 text-[#8f8f8f]" />}
                    className="!rounded-xl !border-[#2d2d2d] !bg-[#0f0f0f] !text-white placeholder:!text-[#707070] focus:!border-orange-500/70 focus:!ring-orange-500/25"
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
                        className="w-full resize-y rounded-xl border border-[#2d2d2d] bg-[#0f0f0f] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-[#707070] focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/25"
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

            <section className="space-y-3 rounded-xl border border-[#2d2d2d] bg-[#101010] p-4 sm:p-5">
                <label className="block text-sm font-medium text-white">
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
                                    : 'border-[#313131] bg-[#141414] text-[#b3b3b3] hover:border-orange-500/35 hover:bg-orange-500/5'
                                    }`}
                            >
                                {language === 'ar' ? skill.name_ar : language === 'fr' ? skill.name_fr : skill.name_en}
                            </button>
                        );
                    })}
                </div>
                {errors.required_skills ? <p className="text-xs text-red-400">{errors.required_skills.message as string}</p> : null}
            </section>

            <section className="rounded-xl border border-[#2d2d2d] bg-[#101010] p-4 sm:p-5">
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
