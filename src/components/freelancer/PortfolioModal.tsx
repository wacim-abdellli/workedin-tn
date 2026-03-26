import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
// import { useToast } from '../ui/Toast'; // Optional: Use parent's toast

const portfolioSchema = z.object({
    title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
    description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
    project_url: z.string().url('رابط غير صحيح').optional().or(z.literal('')),
    skills_used: z.string().optional(), // Comma separated string for input
    completion_date: z.string().optional(),
    media_url: z.string().url('رابط الصورة غير صحيح').min(1, 'رابط الصورة مطلوب'), // Single URL for MVP
});

type PortfolioFormData = z.infer<typeof portfolioSchema>;

interface PortfolioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    isSubmitting?: boolean;
}

export default function PortfolioModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isSubmitting = false
}: PortfolioModalProps) {
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PortfolioFormData>({
        resolver: zodResolver(portfolioSchema),
        defaultValues: {
            title: '',
            description: '',
            project_url: '',
            skills_used: '',
            completion_date: '',
            media_url: '',
        }
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setValue('title', initialData.title);
            setValue('description', initialData.description || '');
            setValue('project_url', initialData.project_url || '');
            setValue('skills_used', initialData.skills_used ? initialData.skills_used.join(', ') : '');
            setValue('completion_date', initialData.completion_date || '');
            setValue('media_url', initialData.media_urls?.[0] || initialData.thumbnail_url || '');
        } else if (isOpen) {
            reset({
                title: '',
                description: '',
                project_url: '',
                skills_used: '',
                completion_date: '',
                media_url: '',
            });
        }
    }, [isOpen, initialData, setValue, reset]);

    const handleFormSubmit = async (data: PortfolioFormData) => {
        // Transform data
        const formattedData = {
            ...data,
            skills_used: data.skills_used ? data.skills_used.split(',').map(s => s.trim()).filter(Boolean) : [],
            media_urls: [data.media_url], // Wrap in array for schema compatibility
        };
        await onSubmit(formattedData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'تعديل العمل' : 'إضافة عمل جديد'}
            size="lg"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <Input
                    label="عنوان المشروع"
                    placeholder="مثال: تصميم متجر إلكتروني"
                    error={errors.title?.message}
                    {...register('title')}
                />

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">وصف المشروع</label>
                    <textarea
                        {...register('description')}
                        rows={4}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                        placeholder="اشرح تفاصيل المشروع وما قمت بإنجازه..."
                    />
                    {errors.description && (
                        <p className="text-red-500 text-xs">{errors.description.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="رابط المشروع (اختياري)"
                        placeholder="https://example.com"
                        error={errors.project_url?.message}
                        {...register('project_url')}
                        dir="ltr"
                    />

                    <Input
                        label="تاريخ الإنجاز"
                        type="date"
                        error={errors.completion_date?.message}
                        {...register('completion_date')}
                    />
                </div>

                <Input
                    label="المهارات المستخدمة"
                    placeholder="مثال: تصميم واجهات، تطوير واجهات، تحرير صور (افصل بينها بفاصلة)"
                    error={errors.skills_used?.message}
                    {...register('skills_used')}
                />

                <Input
                    label="رابط صورة العرض"
                    placeholder="https://..."
                    error={errors.media_url?.message}
                    {...register('media_url')}
                    dir="ltr"
                />
                <p className="text-xs text-gray-500 -mt-3">سنقوم بدعم رفع الملفات قريباً. يرجى استخدام رابط مباشر للصورة حالياً.</p>

                <div className="pt-4 flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                    >
                        {initialData ? 'حفظ التغييرات' : 'إضافة العمل'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
