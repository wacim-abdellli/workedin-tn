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
    const { register, control, formState: { errors }, watch, setValue } = useFormContext<StepJobBasicsFormValues>();
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
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-primary-200">
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

            <section className="space-y-6 rounded-[1.8rem] border border-primary-100/70 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <Input
                    label={tx('jobs.new.stepBasics.projectTitle', undefined, 'عنوان المشروع')}
                    placeholder={tx('jobs.new.stepBasics.projectTitlePlaceholder', undefined, 'مثال: تصميم شعار لشركة مواد غذائية')}
                    error={errors.title?.message as string}
                    {...register('title')}
                    leftIcon={<FileText className="w-5 h-5 text-gray-400" />}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{tx('jobs.new.stepBasics.mainCategory', undefined, 'التصنيف الرئيسي')}</label>
                        <div className="relative">
                            <select
                                {...register('category')}
                                className="w-full appearance-none rounded-2xl border border-gray-200 bg-white ps-11 pe-10 py-3 text-gray-900 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-[#1a1825] dark:text-white"
                            >
                                <option value="">{tx('jobs.new.stepBasics.selectCategory', undefined, 'اختر التصنيف')}</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <Grid className="absolute start-4 top-3.5 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.category && (
                            <p className="text-red-500 text-xs">{errors.category.message as string}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{tx('jobs.new.stepBasics.subcategory', undefined, 'التخصص الفرعي')}</label>
                        <div className="relative">
                            <select
                                {...register('subcategory')}
                                disabled={!selectedCategory}
                                className="w-full appearance-none rounded-2xl border border-gray-200 bg-white ps-11 pe-10 py-3 text-gray-900 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-white/10 dark:bg-[#1a1825] dark:text-white dark:disabled:bg-[#14121f]"
                            >
                                <option value="">{tx('jobs.new.stepBasics.selectSubcategory', undefined, 'اختر التخصص الفرعي')}</option>
                                {subcategories.map((subcategory) => (
                                    <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                                ))}
                            </select>
                            <Grid className="absolute start-4 top-3.5 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.subcategory && (
                            <p className="text-red-500 text-xs">{errors.subcategory.message as string}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{tx('jobs.new.stepBasics.projectDescription', undefined, 'وصف المشروع')}</label>
                    <textarea
                        {...register('description')}
                        rows={8}
                        className="w-full resize-none rounded-[1.4rem] border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-[#1a1825] dark:text-white dark:placeholder:text-gray-600"
                        placeholder={tx('jobs.new.stepBasics.projectDescriptionPlaceholder', undefined, 'اشرح تفاصيل المشروع، المخرجات المتوقعة، وأي متطلبات خاصة...')}
                    />
                    <div className="flex justify-between px-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="rounded-full bg-primary-50 px-2.5 py-1 font-medium text-primary-700 dark:bg-white/[0.05] dark:text-primary-200">{tx('jobs.new.stepBasics.characterCount', { current: description.length, max: 2000 }, `${description.length} / 2000 حرف`)}</span>
                        {errors.description && (
                            <span className="text-red-500">{errors.description.message as string}</span>
                        )}
                    </div>

                    <div className="mt-3 flex items-start gap-3 rounded-[1.4rem] border border-primary-100/80 bg-primary-50/70 p-4 text-sm text-primary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-primary-200">
                        <Lightbulb className="w-5 h-5 flex-shrink-0" />
                        <ul className="space-y-1 list-disc list-inside">
                            <li>{tx('jobs.new.stepBasics.tip1', undefined, 'كن دقيقاً في وصف المطلوب')}</li>
                            <li>{tx('jobs.new.stepBasics.tip2', undefined, 'حدد المخرجات النهائية بوضوح')}</li>
                            <li>{tx('jobs.new.stepBasics.tip3', undefined, 'أضف روابط لمشاريع مشابهة إن وجدت')}</li>
                            <li>{tx('jobs.new.stepBasics.tip4', undefined, 'وضح ما الذي يجب تسليمه ومتى تتوقع الانتهاء')}</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="space-y-3 rounded-[1.8rem] border border-primary-100/70 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{tx('jobs.new.stepBasics.requiredSkills', undefined, 'المهارات المطلوبة (بحد أقصى 5)')}</label>
                <div className="flex flex-wrap gap-2">
                    {PREDEFINED_SKILLS.map(skill => {
                        const isSelected = selectedSkills.find((s) => s.id === skill.id);
                        return (
                            <button
                                key={skill.id}
                                type="button"
                                onClick={() => toggleSkill(skill)}
                                className={`px-3 py-2 rounded-full text-sm font-medium border transition-colors ${isSelected
                                    ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:bg-primary-50/50 dark:border-white/10 dark:bg-[#1a1825] dark:text-gray-300 dark:hover:border-primary-500/20 dark:hover:bg-white/[0.06]'
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

            <section className="space-y-3 rounded-[1.8rem] border border-primary-100/70 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <Controller
                    name="attachments_files"
                    control={control}
                    render={({ field }) => (
                        <FileUpload
                            value={field.value || []}
                            onChange={field.onChange}
                            label={tx('jobs.new.stepBasics.attachments', undefined, 'المرفقات (اختياري)')}
                            description={tx('jobs.new.stepBasics.attachmentsDescription', undefined, 'PDF, DOC, DOCX, TXT - حد أقصى 10MB لكل ملف')}
                            accept=".pdf,.doc,.docx,.txt"
                            maxSize={10}
                            maxFiles={5}
                        />
                    )}
                />
            </section>
        </div>
    );
}
