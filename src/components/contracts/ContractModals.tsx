import React, { useState, useRef, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { GitPullRequest, ShieldAlert, XCircle } from 'lucide-react';
import Button from '../ui/Button';

// Reusable animated modal backdrop and container
const ModalWrapper = ({ isOpen, onClose, children, titleId }: { isOpen: boolean, onClose: () => void, children: React.ReactNode, titleId: string }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                    {/* Backdrop */}
                    <m.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    {/* Modal Content */}
                    <m.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md rounded-2xl border bg-[var(--color-bg-elevated)] p-6 shadow-2xl"
                        style={{ borderColor: 'var(--color-border-subtle)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// 1. Request Changes Modal
export const RequestChangesModal = ({ 
    isOpen, 
    onClose, 
    onSubmit 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSubmit: (note: string) => Promise<void>;
}) => {
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setNote('');
            setTimeout(() => textareaRef.current?.focus(), 60);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!note.trim()) return;
        setIsSubmitting(true);
        try {
            await onSubmit(note.trim());
        } finally {
            setIsSubmitting(false);
            onClose();
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} titleId="modal-changes-title">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-status-warning-light)' }}>
                    <GitPullRequest className="h-5 w-5" style={{ color: 'var(--color-status-warning)' }} />
                </div>
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>Request revision</p>
                    <h2 id="modal-changes-title" className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>What needs to change?</h2>
                </div>
            </div>
            <textarea
                ref={textareaRef}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Be specific — describe exactly what needs to be revised so the freelancer can act immediately…"
                rows={4}
                className="w-full resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ 
                    backgroundColor: 'var(--color-bg-base)', 
                    borderColor: 'var(--color-border-subtle)',
                    color: 'var(--color-text-primary)',
                }}
            />
            <div className="mt-5 flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || !note.trim()}>
                    {isSubmitting ? 'Sending...' : 'Send revision request'}
                </Button>
            </div>
        </ModalWrapper>
    );
};

// 2. Open Dispute Modal
export const OpenDisputeModal = ({
    isOpen,
    onClose,
    onSubmit
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<void>;
}) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setReason('');
            setTimeout(() => textareaRef.current?.focus(), 60);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setIsSubmitting(true);
        try {
            await onSubmit(reason.trim());
        } finally {
            setIsSubmitting(false);
            onClose();
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} titleId="modal-dispute-title">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-status-error-light)' }}>
                    <ShieldAlert className="h-5 w-5" style={{ color: 'var(--color-status-error)' }} />
                </div>
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>Open dispute</p>
                    <h2 id="modal-dispute-title" className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Describe the issue</h2>
                </div>
            </div>
            <div className="mb-4 rounded-xl border p-3" style={{ borderColor: 'var(--color-status-error)', backgroundColor: 'var(--color-status-error-light)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-status-error)' }}>
                    Opening a dispute freezes the contract and notifies our team. All messaging is locked while the case is reviewed. Use this only if revision requests have failed.
                </p>
            </div>
            <textarea
                ref={textareaRef}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain clearly what went wrong, what you expected, and what you received…"
                rows={4}
                className="w-full resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ 
                    backgroundColor: 'var(--color-bg-base)', 
                    borderColor: 'var(--color-border-subtle)',
                    color: 'var(--color-text-primary)',
                }}
            />
            <div className="mt-5 flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
                    {isSubmitting ? 'Opening...' : 'Open dispute'}
                </Button>
            </div>
        </ModalWrapper>
    );
};

// 3. Cancel Contract Modal
export const CancelContractModal = ({
    isOpen,
    onClose,
    onSubmit,
    escrowFunded
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<void>;
    escrowFunded: boolean;
}) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setReason('');
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setIsSubmitting(true);
        try {
            await onSubmit(reason.trim());
        } finally {
            setIsSubmitting(false);
            onClose();
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} titleId="modal-cancel-title">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-status-warning-light)' }}>
                    <XCircle className="h-5 w-5" style={{ color: 'var(--color-status-warning)' }} />
                </div>
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-tertiary)' }}>Cancel contract</p>
                    <h2 id="modal-cancel-title" className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Why are you cancelling?</h2>
                </div>
            </div>
            {escrowFunded && (
                <div className="mb-4 rounded-xl border p-3" style={{ borderColor: 'var(--color-status-warning)', backgroundColor: 'var(--color-status-warning-light)' }}>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-status-warning)' }}>
                        ⚠️ Escrow has been funded. Cancelling will trigger an <strong>automatic refund</strong> to the client.
                    </p>
                </div>
            )}
            <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain why you're cancelling this contract…"
                rows={3}
                className="w-full resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
                style={{ 
                    backgroundColor: 'var(--color-bg-base)', 
                    borderColor: 'var(--color-border-subtle)',
                    color: 'var(--color-text-primary)',
                }}
            />
            <div className="mt-5 flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Go back</Button>
                <Button variant="danger" onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
                    {isSubmitting ? 'Cancelling...' : 'Cancel contract'}
                </Button>
            </div>
        </ModalWrapper>
    );
};
