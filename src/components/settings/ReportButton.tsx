import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useTranslation } from '@/i18n';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { submitReport } from '@/services/reports';
import type { ReportedType } from '@/services/reports';

const REASONS = [
    { value: 'spam', label: 'Spam or misleading' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'fraud', label: 'Fraud or scam' },
    { value: 'harassment', label: 'Harassment or abuse' },
    { value: 'fake', label: 'Fake profile or listing' },
    { value: 'other', label: 'Other' },
];

interface ReportButtonProps {
    reportedType: ReportedType;
    reportedId: string;
    /** Optional class override for the trigger button */
    className?: string;
}

export default function ReportButton({ reportedType, reportedId, className }: ReportButtonProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [touched, setTouched] = useState(false);

    const customReasonError = touched && reason === 'other' && !customReason.trim()
        ? 'Please describe the issue'
        : null;

    const mutation = useMutation({
        mutationFn: () => {
            if (!user?.id) throw new Error('Not authenticated');
            const finalReason = reason === 'other' ? customReason.trim() : reason;
            if (!finalReason) throw new Error('Please select a reason');
            return submitReport(user.id, reportedType, reportedId, finalReason);
        },
        onSuccess: () => {
            showToast('Report submitted. Our team will review it shortly.', 'success');
            setIsOpen(false);
            setReason('');
            setCustomReason('');
            setTouched(false);
        },
        onError: (err: Error) => {
            showToast(err.message || 'Failed to submit report', 'error');
        },
    });

    if (!user) return null;

    return (
        <>
            <button
                type="button"
                onClick={e => { e.stopPropagation(); e.preventDefault(); setIsOpen(true); }}
                title="Report this content"
                className={className ?? 'inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors'}
            >
                <Flag className="w-3.5 h-3.5" />
                <span>{t.common.report}</span>
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Report content" size="sm">
                <div className="space-y-4 pt-1">
                    <p className="text-sm text-muted">Why are you reporting this {reportedType}?</p>

                    <div className="space-y-2">
                        {REASONS.map(r => (
                            <label key={r.value} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                                <input
                                    type="radio"
                                    name="report-reason"
                                    value={r.value}
                                    checked={reason === r.value}
                                    onChange={() => setReason(r.value)}
                                    className="accent-primary-600"
                                />
                                <span className="text-sm text-foreground">{r.label}</span>
                            </label>
                        ))}
                    </div>

                    {reason === 'other' && (
                        <div>
                            <textarea
                                value={customReason}
                                onChange={e => setCustomReason(e.target.value)}
                                placeholder="Please describe the issue..."
                                rows={3}
                                className={`input-base w-full resize-none text-sm ${customReasonError ? 'border-red-400 dark:border-red-500' : ''}`}
                            />
                            {customReasonError && (
                                <p className="text-red-500 text-xs mt-1" role="alert">{customReasonError}</p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
                        <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={mutation.isPending}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => { setTouched(true); mutation.mutate(); }}
                            isLoading={mutation.isPending}
                            disabled={!reason || (reason === 'other' && !customReason.trim())}
                        >
                            Submit report
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
