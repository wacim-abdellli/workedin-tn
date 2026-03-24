import { useFormContext, Controller } from 'react-hook-form';
import { FileText, Grid, Lightbulb } from 'lucide-react';
import Input from '../ui/Input';
import { FileUpload } from '../common/FileUpload';
import { PREDEFINED_SKILLS } from '../../types';

export default function StepJobBasics() {
    const { register, control, formState: { errors }, watch, setValue } = useFormContext();
    const description = watch('description') || '';
    const selectedSkills = watch('required_skills') || [];

    // Categories mock data - in real app, fetch from DB
    const categories = [
        { id: 'design', name: 'تصميم وإبداع' },
        { id: 'development', name: 'برمجة وتطوير' },
        { id: 'marketing', name: 'تسويق ومبيعات' },
        { id: 'writing', name: 'كتابة وترجمة' },
    ];

    const toggleSkill = (skill: any) => {
        const current = selectedSkills;
        const exists = current.find((s: any) => s.id === skill.id);

        if (exists) {
            setValue('required_skills', current.filter((s: any) => s.id !== skill.id));
        } else if (current.length < 5) {
            setValue('required_skills', [...current, skill]);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                    <FileText className="w-6 h-6 text-primary-600" />
                    تفاصيل المهمة
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    ابدأ بعنوان واضح ووصف دقيق لمشروعك لجذب أفضل المستقلين.
                </p>
            </div>

            <div className="space-y-6">
                <Input
                    label="عنوان المشروع"
                    placeholder="مثال: تصميم شعار لشركة مواد غذائية"
                    error={errors.title?.message as string}
                    {...register('title')}
                    leftIcon={<FileText className="w-5 h-5 text-gray-400" />}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">التصنيف الرئيسي</label>
                        <div className="relative">
                            <select
                                {...register('category')}
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-white pl-4 pr-10 py-3 text-gray-900 transition-all duration-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1a1825] dark:text-white"
                            >
                                <option value="">اختر التصنيف</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <Grid className="w-5 h-5 text-gray-400 absolute left-3 top-3.5 pointer-events-none" />
                        </div>
                        {errors.category && (
                            <p className="text-red-500 text-xs">{errors.category.message as string}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">وصف المشروع</label>
                    <textarea
                        {...register('description')}
                        rows={8}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-[#1a1825] dark:text-white dark:placeholder:text-gray-600"
                        placeholder="اشرح تفاصيل المشروع، المخرجات المتوقعة، وأي متطلبات خاصة..."
                    />
                    <div className="flex justify-between px-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{description.length} / 2000 حرف</span>
                        {errors.description && (
                            <span className="text-red-500">{errors.description.message as string}</span>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="mt-2 flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                        <Lightbulb className="w-5 h-5 flex-shrink-0" />
                        <ul className="space-y-1 list-disc list-inside">
                            <li>كن دقيقاً في وصف المطلوب</li>
                            <li>حدد المخرجات النهائية بوضوح</li>
                            <li>أضف روابط لمشاريع مشابهة إن وجدت</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المهارات المطلوبة (بحد أقصى 5)</label>
                    <div className="flex flex-wrap gap-2">
                        {PREDEFINED_SKILLS.map(skill => {
                            const isSelected = selectedSkills.find((s: any) => s.id === skill.id);
                            return (
                                <button
                                    key={skill.id}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`
                                        px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                                        ${isSelected
                                            ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-[#1a1825] dark:text-gray-300'
                                        }
                                    `}
                                >
                                    {skill.name_ar}
                                </button>
                            );
                        })}
                    </div>
                    {errors.required_skills && (
                        <p className="text-red-500 text-xs">{errors.required_skills.message as string}</p>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <Controller
                    name="attachments_files"
                    control={control}
                    render={({ field }) => (
                        <FileUpload
                            value={field.value || []}
                            onChange={field.onChange}
                            label="المرفقات (اختياري)"
                            description="PDF, DOC, DOCX, TXT - حد أقصى 10MB لكل ملف"
                            accept=".pdf,.doc,.docx,.txt"
                            maxSize={10}
                            maxFiles={5}
                        />
                    )}
                />
            </div>
        </div>
    );
}
