import { useState, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileText, Trash2, ChevronDown } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface ProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: {
        id: string;
        title: string;
        budget_min?: number;
        budget_max?: number;
        hourly_rate?: number;
        job_type: 'fixed_price' | 'hourly';
    };
    onSubmit: (data: ProposalFormData, files: File[]) => Promise<void>;
    isSubmitting: boolean;
}

export interface ProposalFormData {
    cover_letter: string;
    bid_amount: number;
    delivery_days: number;
}

// Validation schema
const proposalSchema = z.object({
    cover_letter: z.string()
        .min(100, 'الرسالة يجب أن تكون 100 حرف على الأقل')
        .max(1000, 'الرسالة يجب أن تكون أقل من 1000 حرف'),
    bid_amount: z.number()
        .min(10, 'الحد أدنى 10 دينار')
        .max(100000, 'الحد الأقصى للعرض 100,000 دينار'),
    delivery_days: z.number()
        .min(1, 'الحد الأدنى يوم واحد')
        .max(365, 'الحد الأقصى 365 يوم'),
});

const PLATFORM_FEE_PERCENT = 10;

const DELIVERY_OPTIONS = [
    { value: 1, label: 'يوم واحد' },
    { value: 2, label: 'يومين' },
    { value: 3, label: '3 أيام' },
    { value: 5, label: '5 أيام' },
    { value: 7, label: 'أسبوع' },
    { value: 14, label: 'أسبوعين' },
    { value: 30, label: 'شهر' },
    { value: 60, label: 'شهرين' },
];

export default function ProposalModal({
    isOpen,
    onClose,
    job,
    onSubmit,
    isSubmitting,
}: ProposalModalProps) {
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<ProposalFormData>({
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            bid_amount: job.job_type === 'fixed_price' ? job.budget_min : job.hourly_rate,
            delivery_days: 7,
        },
    });

    const bidAmount = useWatch({ control, name: 'bid_amount' }) || 0;
    const coverLetter = useWatch({ control, name: 'cover_letter' }) || '';
    const platformFee = (bidAmount * PLATFORM_FEE_PERCENT) / 100;
    const netAmount = bidAmount - platformFee;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const validFiles = newFiles.filter(file => {
                const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
                return isValidSize;
            });
            setAttachments(prev => [...prev, ...validFiles].slice(0, 5));
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const onFormSubmit = (data: ProposalFormData) => {
        onSubmit(data, attachments);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`تقديم عرض: ${job.title}`}
            size="lg"
        >
            <form onSubmit={handleSubmit(onFormSubmit)}>
                <fieldset disabled={isSubmitting} className="space-y-6">
                {/* Bid Details */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-dark-900 dark:text-gray-100">
                            قيمة العرض (د.ت)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                {...register('bid_amount', { valueAsNumber: true })}
                                className={`input w-full ps-10 ${errors.bid_amount ? 'border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="0.00"
                            />
                            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">د.ت</span>
                        </div>
                        {errors.bid_amount && (
                            <p className="text-red-500 text-xs mt-1">{errors.bid_amount.message}</p>
                        )}

                        <div className="bg-gray-50 dark:bg-gray-900 dark:bg-dark-800 rounded-lg p-3 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                                <span>رسوم المنصة ({PLATFORM_FEE_PERCENT}%)</span>
                                <span>-{platformFee.toFixed(2)} د.ت</span>
                            </div>
                            <div className="flex justify-between font-bold text-dark-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700 dark:border-dark-700">
                                <span>ستحصل على</span>
                                <span className="text-green-600">{netAmount.toFixed(2)} د.ت</span>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Time */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-dark-900 dark:text-gray-100">
                            مدة التسليم
                        </label>
                        <div className="relative">
                            <select
                                {...register('delivery_days', { valueAsNumber: true })}
                                className={`input w-full appearance-none ${errors.delivery_days ? 'border-red-500 focus:ring-red-500' : ''}`}
                            >
                                {DELIVERY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.delivery_days && (
                            <p className="text-red-500 text-xs mt-1">{errors.delivery_days.message}</p>
                        )}
                    </div>
                </div>

                {/* Cover Letter */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-dark-900 dark:text-gray-100">
                        رسالة العرض
                    </label>
                    <textarea
                        {...register('cover_letter')}
                        rows={6}
                        className={`input w-full resize-none ${errors.cover_letter ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="اشرح لماذا أنت الشخص المناسب لهذا المشروع..."
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        {errors.cover_letter ? (
                            <span className="text-red-500">{errors.cover_letter.message}</span>
                        ) : (
                            <span>يجب كتابة 100 حرف على الأقل</span>
                        )}
                        <span>{coverLetter.length}/1000</span>
                    </div>
                </div>

                {/* Attachments */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-dark-900 dark:text-gray-100">
                        مرفقات (اختياري)
                    </label>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {attachments.map((file, index) => (
                            <div key={index} className="relative group p-2 border border-gray-200 dark:border-gray-700 dark:border-dark-700 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(index)}
                                    className="absolute -top-2 -end-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label={`حذف المرفق: ${file.name}`}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                                <div className="flex flex-col items-center text-center gap-2">
                                    <FileText className="w-8 h-8 text-primary-500" />
                                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate w-full">
                                        {file.name}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {attachments.length < 5 && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors gap-2 text-gray-400 hover:text-primary-600"
                                aria-label="رفع ملف"
                            >
                                <Upload className="w-6 h-6" />
                                <span className="text-xs">رفع ملف</span>
                            </button>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.png"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        يمكنك رفع ملفات بصيغة PDF أو صور حتى 10MB
                    </p>
                </div>

                {/* Actions */}
                </fieldset>

                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 dark:border-dark-700">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isSubmitting}
                    >
                        إلغاء
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1"
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        إرسال العرض
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

// Icon component needed locally if not imported

