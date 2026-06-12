/**
 * ContractModalsBundle.tsx
 * All contract-action modals for the messaging page in one place.
 * Extracted from the Messages.tsx God Component.
 *
 * Included modals:
 *   - DeliverWorkModal
 *   - AcceptAndPayModal
 *   - DisputeModal
 *   - ReviewModal
 *   - ContractWorkspaceModal
 *   - DeleteMessageModal
 */
import { useRef } from 'react';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { ReviewForm } from '../../components/ui/Reviews';
import ContractDetailsSidebar, { type ContractActivityEvent } from '@/components/contracts/ContractDetailsSidebar';
import type { Message } from '../../services/messages';
import { useTranslation } from '../../i18n';
import type { ContractMessagingStatus } from '../../lib/messagingLifecycle';

type ThreadMessage = Message & { status?: 'sending' | 'failed' };

// ─── Shared Types ─────────────────────────────────────────────────────────────

interface ContractSidebarData {
    job?: { title?: string | null } | null;
    [key: string]: unknown;
}

// ─── DeliverWorkModal ─────────────────────────────────────────────────────────

interface DeliverWorkModalProps {
    isOpen: boolean;
    isLoading: boolean;
    deliveryNote: string;
    reviewFiles: File[];
    finalFiles: File[];
    actionError: string | null;
    onNoteChange: (val: string) => void;
    onAddReviewFiles: (files: File[]) => void;
    onRemoveReviewFile: (index: number) => void;
    onAddFinalFiles: (files: File[]) => void;
    onRemoveFinalFile: (index: number) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export const DeliverWorkModal = ({
    isOpen, isLoading, deliveryNote, reviewFiles, finalFiles, actionError,
    onNoteChange, onAddReviewFiles, onRemoveReviewFile, onAddFinalFiles, onRemoveFinalFile,
    onConfirm, onClose,
}: DeliverWorkModalProps) => {
    const { tx } = useTranslation();
    const reviewInputRef = useRef<HTMLInputElement>(null);
    const finalInputRef = useRef<HTMLInputElement>(null);

    const canConfirm = reviewFiles.length > 0 && finalFiles.length > 0 && !isLoading;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { if (!isLoading) onClose(); }}
            title={tx('contract.deliverWork', undefined, 'Deliver Work')}
            size="md"
        >
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    {tx('contract.deliverNoteLabel', undefined, 'Add a note for the client')}
                </p>

                {actionError ? (
                    <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                        {actionError}
                    </div>
                ) : null}

                <textarea
                    value={deliveryNote}
                    onChange={(e) => onNoteChange(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-[#333] bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                    placeholder={tx('contract.deliverNotePlaceholder', undefined, 'Delivery notes (optional)...')}
                    aria-label={tx('contract.deliverNoteAria', undefined, 'Delivery notes')}
                />

                <div className="space-y-3 rounded-xl border border-[#2f2f2f] bg-[var(--color-bg-subtle)] p-3">
                    {/* Review Files */}
                    <div>
                        <p className="text-sm font-medium text-white">{tx('pages.messages.delivery.reviewFiles', {}, 'Review Files')}</p>
                        <p className="mt-1 text-xs text-zinc-400">{tx('pages.messages.delivery.reviewFilesDescription', {}, 'Files the client can review immediately before accepting.')}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => reviewInputRef.current?.click()} disabled={isLoading}>
                                Add Review Files
                            </Button>
                            <input
                                ref={reviewInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files ?? []);
                                    if (files.length > 0) onAddReviewFiles(files);
                                    e.currentTarget.value = '';
                                }}
                            />
                        </div>
                        {reviewFiles.length > 0 ? (
                            <div className="mt-2 space-y-1 text-xs text-zinc-300">
                                {reviewFiles.map((file, idx) => (
                                    <div key={`${file.name}-${idx}`} className="flex items-center justify-between rounded-lg bg-[#0d0d0d] px-2 py-1.5">
                                        <span className="truncate pr-3">{file.name}</span>
                                        <button type="button" className="text-zinc-500 hover:text-white" onClick={() => onRemoveReviewFile(idx)}>Remove</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-2 text-xs text-amber-300">Required before delivery can be submitted.</p>
                        )}
                    </div>

                    {/* Final Locked Files */}
                    <div>
                        <p className="text-sm font-medium text-white">{tx('pages.messages.delivery.finalLockedFiles', {}, 'Final Locked Files')}</p>
                        <p className="mt-1 text-xs text-zinc-400">{tx('pages.messages.delivery.finalLockedFilesDescription', {}, 'Files that stay locked until the client accepts and payment is released.')}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => finalInputRef.current?.click()} disabled={isLoading}>
                                Add Final Files
                            </Button>
                            <input
                                ref={finalInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files ?? []);
                                    if (files.length > 0) onAddFinalFiles(files);
                                    e.currentTarget.value = '';
                                }}
                            />
                        </div>
                        {finalFiles.length > 0 ? (
                            <div className="mt-2 space-y-1 text-xs text-zinc-300">
                                {finalFiles.map((file, idx) => (
                                    <div key={`${file.name}-${idx}`} className="flex items-center justify-between rounded-lg bg-[#0d0d0d] px-2 py-1.5">
                                        <span className="truncate pr-3">{file.name}</span>
                                        <button type="button" className="text-zinc-500 hover:text-white" onClick={() => onRemoveFinalFile(idx)}>Remove</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-2 text-xs text-amber-300">Required. These files stay hidden from the client until payment is released.</p>
                        )}
                    </div>
                </div>

                {!canConfirm && reviewFiles.length === 0 || !canConfirm && finalFiles.length === 0 ? (
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                        Add both a review file and a final locked file to confirm delivery.
                    </div>
                ) : null}

                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => { onClose(); }}
                        disabled={isLoading}
                    >
                        {tx('common.cancel', undefined, 'Cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        disabled={!canConfirm}
                        isLoading={isLoading}
                        leftIcon={<CheckCircle className="h-4 w-4" />}
                    >
                        {tx('contract.confirmDelivery', undefined, 'Confirm Delivery')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// ─── AcceptAndPayModal ────────────────────────────────────────────────────────

interface AcceptAndPayModalProps {
    isOpen: boolean;
    isLoading: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export const AcceptAndPayModal = ({ isOpen, isLoading, onConfirm, onClose }: AcceptAndPayModalProps) => {
    const { tx } = useTranslation();
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={tx('contract.acceptAndPay', undefined, 'Accept and Pay')} size="sm">
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    {tx('contract.acceptAndPayConfirm', undefined, 'This will mark the contract as completed and release payment.')}
                </p>
                <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>{tx('common.cancel', undefined, 'Cancel')}</Button>
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        isLoading={isLoading}
                        leftIcon={<CheckCircle className="h-4 w-4" />}
                    >
                        {tx('contract.acceptAndPay', undefined, 'Accept and Pay')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// ─── DisputeModal ─────────────────────────────────────────────────────────────

interface DisputeModalProps {
    isOpen: boolean;
    isLoading: boolean;
    reason: string;
    onReasonChange: (val: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export const DisputeModal = ({ isOpen, isLoading, reason, onReasonChange, onConfirm, onClose }: DisputeModalProps) => {
    const { tx } = useTranslation();
    return (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={tx('contract.openDispute', undefined, 'Open Dispute')} size="md">
            <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{tx('contract.disputeWarning', undefined, 'Opening a dispute will suspend the contract while it is reviewed.')}</p>
                    </div>
                </div>
                <textarea
                    value={reason}
                    onChange={(e) => onReasonChange(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-[#333] bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                    placeholder={tx('contract.disputeReasonPlaceholder', undefined, 'Explain reason for dispute...')}
                    aria-label={tx('contract.disputeReasonAria', undefined, 'Dispute reason')}
                />
                <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>{tx('common.cancel', undefined, 'Cancel')}</Button>
                    <Button
                        variant="danger"
                        onClick={onConfirm}
                        isLoading={isLoading}
                        disabled={!reason.trim()}
                    >
                        {tx('contract.openDisputeAction', undefined, 'Open Dispute')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// Fix the close handler
function setIsOpen(_: boolean) { /* placeholder — parent manages state */ }

// ─── ReviewModal ──────────────────────────────────────────────────────────────

interface ReviewModalProps {
    isOpen: boolean;
    jobTitle: string;
    recipientName: string;
    onSubmit: (rating: number, comment: string) => Promise<void>;
    onClose: () => void;
}

export const ReviewModal = ({ isOpen, jobTitle, recipientName, onSubmit, onClose }: ReviewModalProps) => {
    const { tx } = useTranslation();
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={tx('contract.reviewExperience', undefined, 'Review Experience')} size="md">
            <ReviewForm
                jobTitle={jobTitle}
                recipientName={recipientName}
                onSubmit={onSubmit}
                onCancel={onClose}
            />
        </Modal>
    );
};

// ─── ContractWorkspaceModal ───────────────────────────────────────────────────

interface ContractWorkspaceModalProps {
    isOpen: boolean;
    isLoading: boolean;
    contractSidebarData: ContractSidebarData | null;
    selectedContractStatus: ContractMessagingStatus | null | undefined;
    selectedContractUserRole: 'client' | 'freelancer' | null;
    deliverySubmitted: boolean;
    isActionLoading: boolean;
    activityEvents: ContractActivityEvent[];
    hasLeftReview: boolean;
    onClose: () => void;
    onDeliver: () => void;
    onRequestChanges: () => void;
    onAcceptAndPay: () => void;
    onDispute: () => void;
    onReview: () => void;
    onOpenSharedFile: (file: { url?: string; name: string; type?: string | null; size?: number | string | null; storageBucket?: string | null; storagePath?: string | null }) => void;
}

export const ContractWorkspaceModal = ({
    isOpen, isLoading, contractSidebarData, selectedContractStatus, selectedContractUserRole,
    deliverySubmitted, isActionLoading, activityEvents, hasLeftReview,
    onClose, onDeliver, onRequestChanges, onAcceptAndPay, onDispute, onReview, onOpenSharedFile,
}: ContractWorkspaceModalProps) => {
    const { tx } = useTranslation();
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={tx('pages.messages.contractWorkspaceTitle', undefined, 'Contract Workspace')} size="full">
            <div className="mx-auto max-w-5xl overflow-hidden rounded-[10px] bg-[var(--color-bg-elevated)] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
                {isLoading ? (
                    <div className="flex min-h-[420px] items-center justify-center px-6 text-center">
                        <div className="space-y-3">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-on-surface-subtle" />
                            <p className="text-xs text-on-surface-subtle">
                                {tx('pages.messages.loadingContractSidebar', undefined, 'Loading contract details...')}
                            </p>
                        </div>
                    </div>
                ) : contractSidebarData ? (
                    <ContractDetailsSidebar
                        contract={contractSidebarData as any}
                        userRole={selectedContractUserRole}
                        currentStatus={selectedContractStatus || 'unknown'}
                        deliverySubmitted={deliverySubmitted}
                        isActionLoading={isActionLoading}
                        activityEvents={activityEvents}
                        onDeliver={onDeliver}
                        onRequestChanges={onRequestChanges}
                        onAcceptAndPay={onAcceptAndPay}
                        onDispute={onDispute}
                        onReview={onReview}
                        onOpenSharedFile={onOpenSharedFile}
                        hasLeftReview={hasLeftReview}
                    />
                ) : (
                    <div className="flex min-h-[420px] items-center justify-center px-6 text-center">
                        <p className="text-xs text-on-surface-subtle">
                            {tx('pages.messages.contractSidebarUnavailable', undefined, 'Contract details are not available for this conversation yet.')}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

// ─── DeleteMessageModal ───────────────────────────────────────────────────────

interface DeleteMessageModalProps {
    message: ThreadMessage | null;
    isDeleting: boolean;
    workspaceVars?: React.CSSProperties;
    onDeleteForMe: () => void;
    onDeleteForEveryone: () => void;
    onClose: () => void;
}

export const DeleteMessageModal = ({
    message, isDeleting, workspaceVars, onDeleteForMe, onDeleteForEveryone, onClose,
}: DeleteMessageModalProps) => {
    const { tx } = useTranslation();
    return (
        <Modal
            isOpen={!!message}
            onClose={() => { if (!isDeleting) onClose(); }}
            title={tx('pages.messages.deleteMessage', undefined, 'Delete message')}
            size="sm"
        >
            <div className="space-y-5" style={workspaceVars}>
                <p className="text-sm text-muted-foreground">
                    {tx('pages.messages.deleteMessagePrompt', undefined, 'Choose how you want to delete this message:')}
                </p>

                {message?.content ? (
                    <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground">
                        {message.content}
                    </div>
                ) : null}

                <div className="flex flex-col gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onDeleteForMe}
                        disabled={isDeleting}
                        className="w-full border-2"
                    >
                        {tx('pages.messages.deleteForMe', undefined, 'Delete for me')}
                    </Button>

                    <Button
                        type="button"
                        variant="danger"
                        onClick={onDeleteForEveryone}
                        isLoading={isDeleting}
                        disabled={isDeleting}
                        className="w-full"
                    >
                        {tx('pages.messages.deleteForEveryone', undefined, 'Delete for everyone')}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="w-full"
                    >
                        {tx('common.cancel', undefined, 'Cancel')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
