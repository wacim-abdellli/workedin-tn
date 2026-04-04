import { useEffect, useMemo, useState } from 'react';
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
    { value: 'spam', labelKey: 'report.reasonSpam', defaultLabel: 'Spam or misleading' },
    { value: 'inappropriate', labelKey: 'report.reasonInappropriate', defaultLabel: 'Inappropriate content' },
    { value: 'fraud', labelKey: 'report.reasonFraud', defaultLabel: 'Fraud or scam' },
    { value: 'harassment', labelKey: 'report.reasonHarassment', defaultLabel: 'Harassment or abuse' },
    { value: 'fake', labelKey: 'report.reasonFake', defaultLabel: 'Fake profile or listing' },
    { value: 'other', labelKey: 'report.reasonOther', defaultLabel: 'Other' },
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
    const { t, tx } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [touched, setTouched] = useState(false);

    const customReasonError = touched && reason === 'other' && !customReason.trim()
        ? tx('common.reportDescribePlaceholder', undefined, 'Please describe the issue')
        : null;

    const sessionKey = useMemo(() => {
        if (!user?.id) {
            return null;
        }

        return `report-submitted:${user.id}:${reportedType}:${reportedId}`;
    }, [reportedId, reportedType, user?.id]);

    const [isReportedThisSession, setIsReportedThisSession] = useState(() => {
        if (typeof window === 'undefined' || !user?.id) {
            return false;
        }

        return window.sessionStorage.getItem(`report-submitted:${user.id}:${reportedType}:${reportedId}`) === '1';
    });

    useEffect(() => {
        if (typeof window === 'undefined' || !sessionKey) {
            setIsReportedThisSession(false);
            return;
        }

        setIsReportedThisSession(window.sessionStorage.getItem(sessionKey) === '1');
    }, [sessionKey]);

    const mutation = useMutation({
        mutationFn: () => {
            if (!user?.id) throw new Error(tx('common.notAuthenticated', undefined, 'Not authenticated'));
            const finalReason = reason === 'other' ? customReason.trim() : reason;
            if (!finalReason) throw new Error(tx('common.selectReason', undefined, 'Please select a reason'));
            return submitReport(user.id, reportedType, reportedId, finalReason);
        },
        onSuccess: () => {
            if (typeof window !== 'undefined' && sessionKey) {
                window.sessionStorage.setItem(sessionKey, '1');
            }

            setIsReportedThisSession(true);
            showToast(t.common.reportSubmitted || tx('common.reportSubmittedSuccess', undefined, 'Report submitted. Our team will review it shortly.'), 'success');
            setIsOpen(false);
            setReason('');
            setCustomReason('');
            setTouched(false);
        },
        onError: (err: Error) => {
            showToast(err.message || t.common.reportError || tx('common.reportFailed', undefined, 'Failed to submit report'), 'error');
        },
    });

    if (!user) return null;

    return (
        <>
            <button
                type="button"
                onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!isReportedThisSession) {
                        setIsOpen(true);
                    }
                }}
                title={isReportedThisSession ? tx('common.alreadyReportedSession', undefined, 'Already reported in this session') : (t.common.reportTitle || tx('common.reportContent', undefined, "Report this content"))}
                disabled={isReportedThisSession}
                className={className ?? 'inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-gray-400'}
            >
                <Flag className="w-3.5 h-3.5" />
                <span>{isReportedThisSession ? tx('common.reported', undefined, 'Reported') : t.common.report}</span>
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={t.common.reportContent || tx('common.reportContentTitle', undefined, "Report content")} size="sm">
                <div className="space-y-4 pt-1">
                    <p className="text-sm text-muted">{tx('common.whyReport', { type: reportedType }, `Why are you reporting this ${reportedType}?`)}</p>

                    <div className="space-y-2">
                        {REASONS.map(r => (
                            <label key={r.value} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:border-white/10 dark:border-gray-800 hover:bg-gray-50 dark:bg-gray-900 dark:bg-gray-800 dark:hover:bg-white cursor-pointer transition-colors">
                                <input
                                    type="radio"
                                    name="report-reason"
                                    value={r.value}
                                    checked={reason === r.value}
                                    onChange={() => setReason(r.value)}
                                    className="accent-primary-600"
                                />
                                <span className="text-sm text-foreground">{tx(r.labelKey, undefined, r.defaultLabel)}</span>
                            </label>
                        ))}
                    </div>

                    {reason === 'other' && (
                        <div>
                            <textarea
                                value={customReason}
                                onChange={e => setCustomReason(e.target.value)}
                                placeholder={tx('common.reportDescribePlaceholder', undefined, 'Please describe the issue...')}
                                rows={3}
                                className={`input-base w-full resize-none text-sm ${customReasonError ? 'border-red-400 dark:border-red-500' : ''}`}
                            />
                            {customReasonError && (
                                <p className="text-red-500 text-xs mt-1" role="alert">{customReasonError}</p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 dark:border-white/10">
                        <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={mutation.isPending}>
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => { setTouched(true); mutation.mutate(); }}
                            isLoading={mutation.isPending}
                            disabled={!reason || (reason === 'other' && !customReason.trim())}
                        >
                            {tx('common.reportSubmitButton', undefined, 'Submit report')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
