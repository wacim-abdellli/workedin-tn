import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Check, ChevronDown, FileText, Grid, Lightbulb } from 'lucide-react';
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
    const { register, control, formState: { errors }, watch, setValue } = useFormContext<StepJobBasicsFormValues>();
    const { language, tx } = useTranslation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [openDropdown, setOpenDropdown] = useState<'category' | 'subcategory' | null>(null);
    const description = watch('description') || '';
    const selectedCategory = watch('category') || '';
    const selectedSubcategory = watch('subcategory') || '';
    const selectedSkills = watch('required_skills') || [];
    const categories = getJobCategories(language);
    const subcategories = categories.find((category) => category.id === selectedCategory)?.subcategories ?? [];
    const selectedCategoryLabel = categories.find((category) => category.id === selectedCategory)?.name || '';
    const selectedSubcategoryLabel = subcategories.find((subcategory) => subcategory.id === selectedSubcategory)?.name || '';

    const categoryOptions = useMemo(() => categories.map((category) => ({
        value: category.id,
        label: category.name,
    })), [categories]);

    const subcategoryOptions = useMemo(() => subcategories.map((subcategory) => ({
        value: subcategory.id,
        label: subcategory.name,
    })), [subcategories]);

    useEffect(() => {
        if (selectedSubcategory && !subcategories.some((item) => item.id === selectedSubcategory)) {
            setValue('subcategory', '');
        }
    }, [selectedSubcategory, setValue, subcategories]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!dropdownRef.current?.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpenDropdown(null);
            }
        };

        window.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('mousedown', handlePointerDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const toggleSkill = (skill: JobSkill) => {
        const current = selectedSkills;
        const exists = current.find((s) => s.id === skill.id);

        if (exists) {
            setValue('required_skills', current.filter((s) => s.id !== skill.id));
        } else if (current.length < 5) {
            setValue('required_skills', [...current, skill]);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{
                        borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, transparent)',
                        background: 'color-mix(in srgb, var(--workspace-primary) 12%, var(--card-bg))',
                        color: 'var(--workspace-primary)',
                    }}
                >
                    <FileText className="w-3.5 h-3.5" />
                    {tx('jobs.new.stepBasics.badge', undefined, 'Project brief')}
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#171420] dark:text-white">
                    {tx('jobs.new.stepBasics.title', undefined, 'تفاصيل المهمة')}
                </h3>
                <p className="max-w-3xl text-sm leading-7 text-[#5c5971] dark:text-[#aca9bd] sm:text-base">
                    {tx('jobs.new.stepBasics.subtitle', undefined, 'ابدأ بعنوان واضح ووصف دقيق لمشروعك لجذب أفضل المستقلين.')}
                </p>
            </div>

            <section
                className="space-y-6 rounded-[1.8rem] border p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_64px_-48px_var(--workspace-primary-shadow,rgba(109,40,217,0.28))]"
                style={{
                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, var(--border))',
                    background: 'linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 94%, var(--page-bg)), color-mix(in srgb, var(--surface-bg) 90%, var(--page-bg)))',
                    boxShadow: '0 24px 60px -48px rgba(15,23,42,0.46)',
                }}
            >
                <Input
                    label={tx('jobs.new.stepBasics.projectTitle', undefined, 'عنوان المشروع')}
                    placeholder={tx('jobs.new.stepBasics.projectTitlePlaceholder', undefined, 'مثال: تصميم شعار لشركة مواد غذائية')}
                    error={errors.title?.message as string}
                    {...register('title')}
                    leftIcon={<FileText className="w-5 h-5 text-gray-400" />}
                />

                <div ref={dropdownRef} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="group space-y-2 relative">
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors group-hover:text-[color:var(--workspace-primary)]" style={{ color: 'var(--text-muted)' }}>{tx('jobs.new.stepBasics.mainCategory', undefined, 'التصنيف الرئيسي')}</label>
                        <button
                            type="button"
                            onClick={() => setOpenDropdown((current) => current === 'category' ? null : 'category')}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-[color:var(--workspace-primary)]/6 hover:shadow-[0_18px_34px_-26px_var(--workspace-primary-shadow,rgba(109,40,217,0.24))]"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--workspace-primary) 16%, var(--border))',
                                background: 'var(--card-bg)',
                                color: selectedCategory ? 'var(--text-primary)' : 'var(--text-muted)',
                                boxShadow: openDropdown === 'category' ? '0 16px 36px -26px rgba(15,23,42,0.42)' : 'none',
                            }}
                        >
                            <span className="flex items-center gap-3 min-w-0">
                                <Grid className="w-4.5 h-4.5 shrink-0 text-[color:var(--text-muted)]" />
                                <span className="truncate font-medium">{selectedCategoryLabel || tx('jobs.new.stepBasics.selectCategory', undefined, 'اختر التصنيف')}</span>
                            </span>
                            <ChevronDown className={`w-4.5 h-4.5 shrink-0 text-[color:var(--text-muted)] transition-transform ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
                        </button>
                        <input type="hidden" {...register('category')} value={selectedCategory} />
                        {openDropdown === 'category' && (
                            <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border shadow-[0_24px_60px_-40px_rgba(15,23,42,0.46)]" style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 16%, var(--border))', background: 'var(--card-bg)' }}>
                                <button type="button" onClick={() => { setValue('category', ''); setValue('subcategory', ''); setOpenDropdown(null); }} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-[color:var(--workspace-primary)]/12 hover:ps-5" style={{ color: selectedCategory ? 'var(--text-secondary)' : 'var(--workspace-primary)' }}>
                                    <span>{tx('jobs.new.stepBasics.selectCategory', undefined, 'اختر التصنيف')}</span>
                                    {!selectedCategory && <Check className="h-4 w-4" />}
                                </button>
                                {categoryOptions.map((option) => {
                                    const isSelected = selectedCategory === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                setValue('category', option.value, { shouldDirty: true, shouldValidate: true });
                                                setValue('subcategory', '');
                                                setOpenDropdown(null);
                                            }}
                                            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-[color:var(--workspace-primary)]/12 hover:ps-5"
                                            style={{ color: isSelected ? 'var(--workspace-primary)' : 'var(--text-primary)' }}
                                        >
                                            <span className="font-medium">{option.label}</span>
                                            {isSelected && <Check className="h-4 w-4" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {errors.category && (
                            <p className="text-red-500 text-xs">{errors.category.message as string}</p>
                        )}
                    </div>

                    <div className="group space-y-2 relative">
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors group-hover:text-[color:var(--workspace-primary)]" style={{ color: 'var(--text-muted)' }}>{tx('jobs.new.stepBasics.subcategory', undefined, 'التخصص الفرعي')}</label>
                        <button
                            type="button"
                            disabled={!selectedCategory}
                            onClick={() => selectedCategory && setOpenDropdown((current) => current === 'subcategory' ? null : 'subcategory')}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-[color:var(--workspace-primary)]/6 hover:shadow-[0_18px_34px_-26px_var(--workspace-primary-shadow,rgba(109,40,217,0.24))] disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--workspace-primary) 16%, var(--border))',
                                background: 'var(--card-bg)',
                                color: selectedSubcategory ? 'var(--text-primary)' : 'var(--text-muted)',
                                boxShadow: openDropdown === 'subcategory' ? '0 16px 36px -26px rgba(15,23,42,0.42)' : 'none',
                            }}
                        >
                            <span className="flex items-center gap-3 min-w-0">
                                <Grid className="w-4.5 h-4.5 shrink-0 text-[color:var(--text-muted)]" />
                                <span className="truncate font-medium">{selectedSubcategoryLabel || tx('jobs.new.stepBasics.selectSubcategory', undefined, 'اختر التخصص الفرعي')}</span>
                            </span>
                            <ChevronDown className={`w-4.5 h-4.5 shrink-0 text-[color:var(--text-muted)] transition-transform ${openDropdown === 'subcategory' ? 'rotate-180' : ''}`} />
                        </button>
                        <input type="hidden" {...register('subcategory')} value={selectedSubcategory} />
                        {openDropdown === 'subcategory' && selectedCategory && (
                            <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border shadow-[0_24px_60px_-40px_rgba(15,23,42,0.46)]" style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 16%, var(--border))', background: 'var(--card-bg)' }}>
                                <button type="button" onClick={() => { setValue('subcategory', ''); setOpenDropdown(null); }} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-[color:var(--workspace-primary)]/12 hover:ps-5" style={{ color: selectedSubcategory ? 'var(--text-secondary)' : 'var(--workspace-primary)' }}>
                                    <span>{tx('jobs.new.stepBasics.selectSubcategory', undefined, 'اختر التخصص الفرعي')}</span>
                                    {!selectedSubcategory && <Check className="h-4 w-4" />}
                                </button>
                                {subcategoryOptions.map((option) => {
                                    const isSelected = selectedSubcategory === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                setValue('subcategory', option.value, { shouldDirty: true, shouldValidate: true });
                                                setOpenDropdown(null);
                                            }}
                                            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-all duration-200 hover:bg-[color:var(--workspace-primary)]/12 hover:ps-5"
                                            style={{ color: isSelected ? 'var(--workspace-primary)' : 'var(--text-primary)' }}
                                        >
                                            <span className="font-medium">{option.label}</span>
                                            {isSelected && <Check className="h-4 w-4" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {errors.subcategory && (
                            <p className="text-red-500 text-xs">{errors.subcategory.message as string}</p>
                        )}
                    </div>
                </div>

                <div className="group space-y-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors group-hover:text-[color:var(--workspace-primary)]" style={{ color: 'var(--text-muted)' }}>{tx('jobs.new.stepBasics.projectDescription', undefined, 'وصف المشروع')}</label>
                    <textarea
                        {...register('description')}
                        rows={8}
                        className="w-full resize-none rounded-[1.4rem] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100 dark:text-white placeholder:text-gray-400 transition-all duration-200 hover:border-[color:var(--workspace-primary)]/30 hover:bg-[color:var(--workspace-primary)]/5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:border-gray-800 dark:bg-[var(--color-bg-muted)] dark:text-white dark:placeholder:text-gray-600 dark:text-gray-300"
                        placeholder={tx('jobs.new.stepBasics.projectDescriptionPlaceholder', undefined, 'اشرح تفاصيل المشروع، المخرجات المتوقعة، وأي متطلبات خاصة...')}
                    />
                    <div className="flex justify-between px-1 text-xs">
                        <span
                            className="inline-flex items-center rounded-full border px-3 py-1 font-semibold"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--workspace-primary) 22%, transparent)',
                                background: 'color-mix(in srgb, var(--workspace-primary) 12%, var(--card-bg))',
                                color: 'var(--workspace-primary)',
                            }}
                        >
                            {tx('jobs.new.stepBasics.characterCount', { current: description.length, max: 2000 }, `${description.length} / 2000 characters`)}
                        </span>
                        {errors.description && (
                            <span className="text-red-500">{errors.description.message as string}</span>
                        )}
                    </div>

                    <div
                        className="mt-3 flex gap-3 rounded-[1.2rem] border p-4 text-sm"
                        style={{
                            borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, transparent)',
                            background: 'color-mix(in srgb, var(--workspace-primary) 10%, var(--card-bg))',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        <Lightbulb className="w-5 h-5 flex-shrink-0" />
                        <ul className="space-y-1 list-disc list-inside" style={{ color: 'var(--text-secondary)' }}>
                            <li>{tx('jobs.new.stepBasics.tip1', undefined, 'كن دقيقاً في وصف المطلوب')}</li>
                            <li>{tx('jobs.new.stepBasics.tip2', undefined, 'حدد المخرجات النهائية بوضوح')}</li>
                            <li>{tx('jobs.new.stepBasics.tip3', undefined, 'أضف روابط لمشاريع مشابهة إن وجدت')}</li>
                            <li>{tx('jobs.new.stepBasics.tip4', undefined, 'وضح ما الذي يجب تسليمه ومتى تتوقع الانتهاء')}</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section
                className="space-y-3 rounded-[1.8rem] border p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-48px_var(--workspace-primary-shadow,rgba(109,40,217,0.22))]"
                style={{
                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, var(--border))',
                    background: 'linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 94%, var(--page-bg)), color-mix(in srgb, var(--surface-bg) 90%, var(--page-bg)))',
                    boxShadow: '0 24px 60px -48px rgba(15,23,42,0.42)',
                }}
            >
                <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tx('jobs.new.stepBasics.requiredSkills', undefined, 'المهارات المطلوبة (بحد أقصى 5)')}</label>
                <div className="flex flex-wrap gap-2">
                    {PREDEFINED_SKILLS.map(skill => {
                        const isSelected = selectedSkills.find((s) => s.id === skill.id);
                        return (
                            <button
                                key={skill.id}
                                type="button"
                                onClick={() => toggleSkill(skill)}
                                className={`px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 hover:-translate-y-0.5 ${isSelected
                                    ? 'border-[color:var(--workspace-primary)]/35 bg-[color:var(--workspace-primary)]/14 text-[color:var(--workspace-primary)]'
                                    : 'border-border bg-[var(--surface-bg)] text-[var(--text-secondary)] hover:border-[color:var(--workspace-primary)]/28 hover:bg-[color:var(--workspace-primary)]/10'
                                    }`}
                            >
                                {language === 'ar' ? skill.name_ar : language === 'fr' ? skill.name_fr : skill.name_en}
                            </button>
                        );
                    })}
                </div>
                {errors.required_skills && (
                    <p className="text-red-500 text-xs">{errors.required_skills.message as string}</p>
                )}
            </section>

            <section
                className="space-y-3 rounded-[1.8rem] border p-6 shadow-sm"
                style={{
                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, var(--border))',
                    background: 'linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 94%, var(--page-bg)), color-mix(in srgb, var(--surface-bg) 90%, var(--page-bg)))',
                    boxShadow: '0 24px 60px -48px rgba(15,23,42,0.42)',
                }}
            >
                <Controller
                    name="attachments_files"
                    control={control}
                    render={({ field }) => (
                        <FileUpload
                            value={field.value || []}
                            onChange={field.onChange}
                            label={tx('jobs.new.stepBasics.attachments', undefined, 'المرفقات (اختياري)')}
                            description={tx('jobs.new.stepBasics.attachmentsDescription', undefined, 'PDF, DOC, DOCX, TXT, PNG, JPG, WEBP, ZIP - حد أقصى 10MB لكل ملف')}
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.zip,.rar"
                            maxSize={10}
                            maxFiles={5}
                        />
                    )}
                />
            </section>
        </div>
    );
}
