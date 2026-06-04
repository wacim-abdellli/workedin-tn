import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ChangeEvent } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileText, Trash2, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import CustomSelect from '../ui/CustomSelect';

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

type TranslationParams = Record<string, string | number>;
type TxFn = (key: string, params?: TranslationParams, fallback?: string) => string;

const createProposalSchema = (tx: TxFn) => z.object({
    cover_letter: z.string()
        .min(100, tx('proposalModal.validation.coverLetterMin', { count: 100 }, 'Cover letter must be at least {{count}} characters'))
        .max(1000, tx('proposalModal.validation.coverLetterMax', { count: 1000 }, 'Cover letter must be less than {{count}} characters')),
    bid_amount: z.number()
        .min(10, tx('proposalModal.validation.bidMin', { amount: 10, currency: tx('common.currency', undefined, 'TND') }, 'Minimum bid is {{amount}} {{currency}}'))
        .max(100000, tx('proposalModal.validation.bidMax', { amount: 100000, currency: tx('common.currency', undefined, 'TND') }, 'Maximum bid is {{amount}} {{currency}}')),
    delivery_days: z.number()
        .min(1, tx('proposalModal.validation.deliveryMin', { count: 1 }, 'Minimum delivery is {{count}} day'))
        .max(365, tx('proposalModal.validation.deliveryMax', { count: 365 }, 'Maximum delivery is {{count}} days')),
});

const PLATFORM_FEE_PERCENT = 5;

export default function ProposalModal({
    isOpen,
    onClose,
    job,
    onSubmit,
    isSubmitting,
}: ProposalModalProps) {
    const { tx } = useTranslation();
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const currency = tx('common.currency', undefined, 'TND');

    const proposalSchema = useMemo(() => createProposalSchema(tx), [tx]);
    const deliveryOptions = useMemo(() => [
        { value: '1', label: tx('proposalModal.delivery.oneDay', undefined, '1 day') },
        { value: '2', label: tx('proposalModal.delivery.twoDays', undefined, '2 days') },
        { value: '3', label: tx('proposalModal.delivery.threeDays', undefined, '3 days') },
        { value: '5', label: tx('proposalModal.delivery.fiveDays', undefined, '5 days') },
        { value: '7', label: tx('proposalModal.delivery.oneWeek', undefined, '1 week') },
        { value: '14', label: tx('proposalModal.delivery.twoWeeks', undefined, '2 weeks') },
        { value: '30', label: tx('proposalModal.delivery.oneMonth', undefined, '1 month') },
        { value: '60', label: tx('proposalModal.delivery.twoMonths', undefined, '2 months') },
    ], [tx]);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<ProposalFormData>({
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            cover_letter: '',
            bid_amount: job.job_type === 'fixed_price' ? (job.budget_min ?? 0) : (job.hourly_rate ?? 0),
            delivery_days: 7,
        },
    });

    useEffect(() => {
        if (isOpen) {
            setAttachments([]);
            reset({
                cover_letter: '',
                bid_amount: job.job_type === 'fixed_price' ? (job.budget_min ?? 0) : (job.hourly_rate ?? 0),
                delivery_days: 7,
            });
        }
    }, [isOpen, job.job_type, job.budget_min, job.hourly_rate, reset]);

    useEffect(() => {
        if (isOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);

    const bidAmount = useWatch({ control, name: 'bid_amount' }) || 0;
    const coverLetter = useWatch({ control, name: 'cover_letter' }) || '';
    const platformFee = (bidAmount * PLATFORM_FEE_PERCENT) / 100;
    const netAmount = bidAmount - platformFee;

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const validFiles = newFiles.filter(file => {
                const isValidSize = file.size <= 10 * 1024 * 1024;
                return isValidSize;
            });
            setAttachments(prev => [...prev, ...validFiles].slice(0, 5));
            e.target.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const onFormSubmit = async (data: ProposalFormData) => {
        await onSubmit(data, attachments);
    };

    const budgetLabel = job.job_type === 'fixed_price'
        ? `${job.budget_min ?? 0} - ${job.budget_max ?? 0} ${currency}`
        : `${job.hourly_rate ?? 0} ${currency} ${tx('jobDetail.perHour', undefined, '/hour')}`;

    if (!isOpen) {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-50 bg-[var(--color-bg-base)]/80 backdrop-blur-sm px-4 py-8 overflow-y-auto flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl bg-[var(--color-bg-base)] border border-white/5 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5 flex items-start justify-between gap-4 bg-[var(--color-bg-elevated)] flex-none rounded-t-2xl">
                    <div className="min-w-0">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] truncate">
                            {tx('jobDetail.submitProposal', undefined, 'Submit Proposal')}
                        </h2>
                        <p className="text-sm text-[var(--color-text-primary)]/50 mt-1 truncate">{job.title}</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg border border-white/5 text-[var(--color-text-primary)]/40 hover:text-[var(--color-text-primary)] hover:border-white/10 hover:bg-[var(--color-bg-elevated)] transition-colors"
                        aria-label={tx('common.close', undefined, 'Close')}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form & Scrollable Content */}
                <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col min-h-0 flex-1 overflow-hidden">
                    {/* Inner scroll container */}
                    <div className="px-6 py-6 overflow-y-auto space-y-7 min-h-0 flex-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                            <div className="rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-primary)]/40 mb-1">
                                    {tx('proposalModal.jobContext', undefined, 'Job context')}
                                </p>
                                <p className="text-sm text-[var(--color-text-primary)] font-medium line-clamp-2">{job.title}</p>
                                <p className="text-xs text-[var(--color-text-primary)]/60 mt-2">
                                    {tx('jobDetail.budget', undefined, 'Budget')}: {budgetLabel}
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]/70">
                                        {tx('jobDetail.yourBid', undefined, 'Your bid')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min={10}
                                            step={1}
                                            disabled={isSubmitting}
                                            {...register('bid_amount', { valueAsNumber: true })}
                                            className={`w-full rounded-xl bg-black/20 border px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${errors.bid_amount ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 focus:border-violet-500'}`}
                                            placeholder="0"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-primary)]/40">{currency}</span>
                                    </div>
                                    {errors.bid_amount ? (
                                        <p className="text-rose-400 text-xs">{errors.bid_amount.message}</p>
                                    ) : null}

                                    <div className="rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] p-3 space-y-1.5 text-sm">
                                        <div className="flex items-center justify-between text-[var(--color-text-primary)]/50">
                                            <span>
                                                {tx('proposalModal.platformFee', { percent: PLATFORM_FEE_PERCENT }, 'Platform fee ({{percent}}%)')}
                                            </span>
                                            <span>-{platformFee.toFixed(2)} {currency}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[var(--color-text-primary)] font-semibold pt-2 border-t border-white/5 mt-2">
                                            <span>{tx('proposalModal.youReceive', undefined, 'You will receive')}</span>
                                            <span className="text-violet-400">{netAmount.toFixed(2)} {currency}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]/70">
                                        {tx('proposalModal.deliveryTime', undefined, 'Delivery time')}
                                    </label>
                                    <Controller
                                        name="delivery_days"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomSelect
                                                variant="freelancer"
                                                name={field.name}
                                                value={String(field.value ?? 7)}
                                                onChange={(nextValue) => field.onChange(Number(nextValue))}
                                                options={deliveryOptions}
                                                error={errors.delivery_days?.message}
                                                disabled={isSubmitting}
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]/70">
                                    {tx('proposalModal.coverLetter', undefined, 'Cover letter')}
                                </label>
                                <textarea
                                    {...register('cover_letter')}
                                    rows={8}
                                    disabled={isSubmitting}
                                    className={`w-full rounded-xl bg-black/20 border px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/30 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${errors.cover_letter ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 focus:border-violet-500'}`}
                                    placeholder={tx('proposalModal.coverLetterPlaceholder', undefined, 'Explain your approach, relevant experience, and delivery plan...')}
                                />
                                <div className="flex items-center justify-between text-xs">
                                    {errors.cover_letter ? (
                                        <span className="text-rose-400">{errors.cover_letter.message}</span>
                                    ) : (
                                        <span className="text-[var(--color-text-primary)]/40">
                                            {tx('proposalModal.coverLetterMinHint', { count: 100 }, 'Minimum {{count}} characters required')}
                                        </span>
                                    )}
                                    <span className="text-[var(--color-text-primary)]/40">{coverLetter.length}/1000</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]/70">
                                    {tx('proposalModal.attachmentsOptional', undefined, 'Attachments (optional)')}
                                </label>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {attachments.map((file, index) => (
                                        <div
                                            key={`${file.name}-${index}`}
                                            className="relative group rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] p-3"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                disabled={isSubmitting}
                                                className="absolute -top-2 -right-2 rounded-full bg-rose-500 border border-white/10 p-1 text-[var(--color-text-primary)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 disabled:opacity-0 disabled:cursor-not-allowed"
                                                aria-label={tx('proposalModal.removeAttachmentAria', { name: file.name }, 'Remove attachment: {{name}}')}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            <div className="flex flex-col items-center gap-2 text-center">
                                                <FileText className="w-7 h-7 text-violet-400" />
                                                <span className="text-[11px] leading-4 text-[var(--color-text-primary)]/60 truncate w-full">
                                                    {file.name}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {attachments.length < 5 ? (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isSubmitting}
                                            className="rounded-xl border border-dashed border-white/20 bg-[var(--color-bg-elevated)] p-3 flex flex-col items-center justify-center gap-2 text-[var(--color-text-primary)]/40 hover:text-violet-300 hover:border-violet-500/50 hover:bg-violet-500/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Upload className="w-5 h-5" />
                                            <span className="text-[11px] font-bold uppercase tracking-wider leading-4 text-center">
                                                {tx('proposalModal.addFile', undefined, 'Add file')}
                                            </span>
                                        </button>
                                    ) : null}
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    multiple
                                    disabled={isSubmitting}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-primary)]/30">
                                    {tx('proposalModal.fileLimit', undefined, 'Up to 5 files, 10MB each')}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-white/5 bg-[var(--color-bg-elevated)] flex items-center justify-end gap-3 rounded-b-2xl flex-none">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-[var(--color-text-primary)]/50 hover:text-[var(--color-text-primary)] hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {tx('common.cancel', undefined, 'Cancel')}
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-bold text-[var(--color-text-primary)] shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.23)] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[170px]"
                            >
                                {isSubmitting
                                    ? tx('proposalModal.submitting', undefined, 'Submitting...')
                                    : tx('jobDetail.submitProposal', undefined, 'Submit Proposal')}
                            </button>
                        </div>
                    {/* </fieldset> was removed here */}
                </form>
            </div>
        </div>,
        document.body
    );
}




