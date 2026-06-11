import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { ReviewForm } from '../../components/ui/Reviews';
import SubmitDeliveryForm from '@/components/contracts/SubmitDeliveryForm';
import ContractDetailsSidebar from '@/components/contracts/ContractDetailsSidebar';
import FundEscrow from '../../components/payments/FundEscrow';
import { getContractWorkspaceRoute } from '@/lib/routes';

interface MessageModalsProps {
    // Deliver Work modal props
    isDeliverModalOpen: boolean;
    setIsDeliverModalOpen: (open: boolean) => void;
    deliverModalTitle: string;
    deliveryNote: string;
    setDeliveryNote: (note: string) => void;
    deliveryFiles: File[];
    setDeliveryFiles: React.Dispatch<React.SetStateAction<File[]>>;
    isDeliveringContractWork: boolean;
    deliveryActionError: string | null;
    setDeliveryActionError: (error: string | null) => void;
    handleDeliverContractWork: (links?: any[], fileStages?: Record<number, 'review' | 'final'>) => Promise<void>;
    selectedContractStatus: string | null;

    // Accept and Pay modal props
    isAcceptModalOpen: boolean;
    setIsAcceptModalOpen: (open: boolean) => void;
    isAcceptingContractWork: boolean;
    handleAcceptContractAndPay: () => Promise<void>;

    // Open Dispute modal props
    isDisputeModalOpen: boolean;
    setIsDisputeModalOpen: (open: boolean) => void;
    isOpeningContractDispute: boolean;
    disputeReason: string;
    setDisputeReason: (reason: string) => void;
    handleOpenContractDispute: () => Promise<void>;

    // Review Experience modal props
    isReviewModalOpen: boolean;
    setIsReviewModalOpen: (open: boolean) => void;
    contractSidebarData: any;
    selectedConversation: any;
    handleSubmitContractReview: (rating: number, comment: string) => Promise<void>;

    // Contract Workspace (mobile) modal props
    isContractWorkspaceOpen: boolean;
    setIsContractWorkspaceOpen: (open: boolean) => void;
    isContractSidebarDataLoading: boolean;
    selectedContractUserRole: 'client' | 'freelancer';
    contractDeliverySubmitted: boolean;
    isAnyContractActionLoading: boolean;
    selectedContractActivityEvents: any[];
    handleRequestContractChanges: () => Promise<void>;
    handleOpenContractSidebarFile: (file: any) => Promise<void>;
    selectedContractHasReview: boolean;
    isFundEscrowOpen: boolean;
    setIsFundEscrowOpen: (open: boolean) => void;
    selectedWorkspaceContractId: string | null;
    navigate: any;

    // Delete Message modal props
    messagePendingDelete: any;
    setMessagePendingDelete: (msg: any) => void;
    deletingMessageId: string | null;
    confirmDeleteMessage: (type: 'me' | 'everyone') => Promise<void>;
    deleteModalWorkspaceVars?: React.CSSProperties;

    // Fund Escrow modal props
    selectedContractMeta: any;
    syncContractStatusLocally: (contractId: string, status: any) => void;
    setContractSessionMetaById: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    selectedContractId: string | null;

    // Report User modal props
    isReportModalOpen: boolean;
    setIsReportModalOpen: (open: boolean) => void;
    reportReason: string;
    setReportReason: (reason: string) => void;
    customReportReason: string;
    setCustomReportReason: (reason: string) => void;
    isSubmittingReport: boolean;
    reportTouched: boolean;
    setReportTouched: (touched: boolean) => void;
    handleReportUser: () => Promise<void>;

    tx: any;
}

export const MessageModals: React.FC<MessageModalsProps> = ({
    isDeliverModalOpen,
    setIsDeliverModalOpen,
    deliverModalTitle,
    deliveryNote,
    setDeliveryNote,
    deliveryFiles,
    setDeliveryFiles,
    isDeliveringContractWork,
    deliveryActionError,
    setDeliveryActionError,
    handleDeliverContractWork,
    selectedContractStatus,
    isAcceptModalOpen,
    setIsAcceptModalOpen,
    isAcceptingContractWork,
    handleAcceptContractAndPay,
    isDisputeModalOpen,
    setIsDisputeModalOpen,
    isOpeningContractDispute,
    disputeReason,
    setDisputeReason,
    handleOpenContractDispute,
    isReviewModalOpen,
    setIsReviewModalOpen,
    contractSidebarData,
    selectedConversation,
    handleSubmitContractReview,
    isContractWorkspaceOpen,
    setIsContractWorkspaceOpen,
    isContractSidebarDataLoading,
    selectedContractUserRole,
    contractDeliverySubmitted,
    isAnyContractActionLoading,
    selectedContractActivityEvents,
    handleRequestContractChanges,
    handleOpenContractSidebarFile,
    selectedContractHasReview,
    isFundEscrowOpen,
    setIsFundEscrowOpen,
    selectedWorkspaceContractId,
    navigate,
    messagePendingDelete,
    setMessagePendingDelete,
    deletingMessageId,
    confirmDeleteMessage,
    deleteModalWorkspaceVars,
    selectedContractMeta,
    syncContractStatusLocally,
    setContractSessionMetaById,
    selectedContractId,
    isReportModalOpen,
    setIsReportModalOpen,
    reportReason,
    setReportReason,
    customReportReason,
    setCustomReportReason,
    isSubmittingReport,
    reportTouched,
    setReportTouched,
    handleReportUser,
    tx,
}) => {
    return (
        <>
            {/* Deliver Work Modal */}
            <Modal
                isOpen={isDeliverModalOpen}
                onClose={() => {
                    if (isDeliveringContractWork) return;
                    setIsDeliverModalOpen(false);
                    setDeliveryActionError(null);
                }}
                title={deliverModalTitle}
                size="md"
            >
                <SubmitDeliveryForm
                    deliveryNote={deliveryNote}
                    files={deliveryFiles}
                    isSubmitting={isDeliveringContractWork}
                    actionError={deliveryActionError}
                    submitLabel={selectedContractStatus === 'revision_requested' ? 'Resubmit delivery' : 'Submit delivery'}
                    submittingLabel="Submitting delivery..."
                    onNoteChange={(value) => {
                        if (deliveryActionError) {
                            setDeliveryActionError(null);
                        }
                        setDeliveryNote(value);
                    }}
                    onAddFiles={(files) => {
                        setDeliveryActionError(null);
                        setDeliveryFiles((prev) => [...prev, ...files]);
                    }}
                    onRemoveFile={(index) => setDeliveryFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                    onSubmit={(links, fileStages) => {
                        void handleDeliverContractWork(links, fileStages);
                    }}
                    onCancel={() => {
                        setIsDeliverModalOpen(false);
                        setDeliveryActionError(null);
                        setDeliveryFiles([]);
                    }}
                />
            </Modal>

            {/* Accept & Pay Modal */}
            <Modal
                isOpen={isAcceptModalOpen}
                onClose={() => setIsAcceptModalOpen(false)}
                title={tx('contract.acceptAndPay', undefined, 'Accept and Pay')}
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {tx('contract.acceptAndPayConfirm', undefined, 'This will mark the contract as completed and release payment.')}
                    </p>
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsAcceptModalOpen(false)}>
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                void handleAcceptContractAndPay();
                            }}
                            isLoading={isAcceptingContractWork}
                            leftIcon={<CheckCircle className="h-4 w-4" />}
                        >
                            {tx('contract.acceptAndPay', undefined, 'Accept and Pay')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Dispute Modal */}
            <Modal
                isOpen={isDisputeModalOpen}
                onClose={() => setIsDisputeModalOpen(false)}
                title={tx('contract.openDispute', undefined, 'Open Dispute')}
                size="md"
            >
                <div className="space-y-4">
                    <div className="rounded-xl border border-[var(--color-status-warning)]/35 bg-[var(--color-status-warning)]/10 px-3 py-2 text-sm text-amber-200">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>
                                {tx('contract.disputeWarning', undefined, 'Opening a dispute will suspend the contract while it is reviewed.')}
                            </p>
                        </div>
                    </div>
                    <textarea
                        value={disputeReason}
                        onChange={(event) => setDisputeReason(event.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-xl border border-[#333] bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-status-warning)]"
                        placeholder={tx('contract.disputeReasonPlaceholder', undefined, 'Explain reason for dispute...')}
                        aria-label={tx('contract.disputeReasonAria', undefined, 'Dispute reason')}
                    />
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsDisputeModalOpen(false)}>
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                void handleOpenContractDispute();
                            }}
                            isLoading={isOpeningContractDispute}
                            disabled={!disputeReason.trim()}
                        >
                            {tx('contract.openDisputeAction', undefined, 'Open Dispute')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Review Experience Modal */}
            <Modal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                title={tx('contract.reviewExperience', undefined, 'Review Experience')}
                size="md"
            >
                <ReviewForm
                    jobTitle={contractSidebarData?.job?.title || tx('contract.untitledJob', undefined, 'Untitled job')}
                    recipientName={selectedConversation?.otherUser.full_name || tx('pages.messages.userFallback', undefined, 'User')}
                    onSubmit={handleSubmitContractReview}
                    onCancel={() => setIsReviewModalOpen(false)}
                />
            </Modal>

            {/* Mobile Contract Workspace Modal */}
            <Modal
                isOpen={isContractWorkspaceOpen}
                onClose={() => setIsContractWorkspaceOpen(false)}
                title={tx('pages.messages.contractWorkspaceTitle', undefined, 'Contract Workspace')}
                size="full"
            >
                <div className="mx-auto max-w-5xl overflow-hidden rounded-[10px] bg-[var(--color-bg-elevated)] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
                    {isContractSidebarDataLoading ? (
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
                            contract={contractSidebarData}
                            userRole={selectedContractUserRole}
                            currentStatus={selectedContractStatus || 'unknown'}
                            deliverySubmitted={contractDeliverySubmitted}
                            isActionLoading={isAnyContractActionLoading}
                            activityEvents={selectedContractActivityEvents}
                            onDeliver={() => {
                                setDeliveryActionError(null);
                                setIsContractWorkspaceOpen(false);
                                setIsDeliverModalOpen(true);
                            }}
                            onRequestChanges={() => {
                                void handleRequestContractChanges();
                            }}
                            onAcceptAndPay={() => {
                                setIsContractWorkspaceOpen(false);
                                setIsAcceptModalOpen(true);
                            }}
                            onDispute={() => {
                                setIsContractWorkspaceOpen(false);
                                setIsDisputeModalOpen(true);
                            }}
                            onReview={() => {
                                setIsContractWorkspaceOpen(false);
                                setIsReviewModalOpen(true);
                            }}
                            onOpenSharedFile={(file: any) => {
                                void handleOpenContractSidebarFile(file);
                            }}
                            hasLeftReview={selectedContractHasReview}
                            onFundEscrow={() => {
                                setIsContractWorkspaceOpen(false);
                                setIsFundEscrowOpen(true);
                            }}
                            onOpenWorkspace={() => selectedWorkspaceContractId && navigate(getContractWorkspaceRoute(selectedWorkspaceContractId))}
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

            {/* Delete Message Modal */}
            <Modal
                isOpen={!!messagePendingDelete}
                onClose={() => {
                    if (deletingMessageId) return;
                    setMessagePendingDelete(null);
                }}
                title={tx('pages.messages.deleteMessage', undefined, 'Delete message')}
                size="sm"
            >
                <div className="space-y-4" style={deleteModalWorkspaceVars}>
                    <p className="text-xs text-zinc-400 mt-1">
                        {tx('pages.messages.deleteMessagePrompt', undefined, 'Choose how you want to delete this message:')}
                    </p>

                    {messagePendingDelete?.content ? (
                        <div className="rounded-xl border border-white/[0.04] bg-white/[0.012] ps-3 py-2 pe-4 text-xs text-zinc-300 border-s-2 border-s-zinc-500 italic max-h-24 overflow-y-auto">
                            {messagePendingDelete.content}
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-2.5">
                        <button
                            type="button"
                            onClick={() => void confirmDeleteMessage('me')}
                            disabled={!!deletingMessageId}
                            className="w-full text-center bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-zinc-200 hover:text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50"
                        >
                            {tx('pages.messages.deleteForMe', undefined, 'Delete for me')}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => void confirmDeleteMessage('everyone')}
                            disabled={!!deletingMessageId}
                            className="w-full text-center bg-[var(--color-status-error)]/10 hover:bg-[var(--color-status-error)]/20 border border-[var(--color-status-error)]/20 text-red-200 hover:text-red-100 font-semibold px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {deletingMessageId ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-200" />
                            ) : null}
                            <span>{tx('pages.messages.deleteForEveryone', undefined, 'Delete for everyone')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMessagePendingDelete(null)}
                            disabled={!!deletingMessageId}
                            className="w-full text-center text-zinc-500 hover:text-zinc-300 text-xs py-1.5 transition-colors font-medium cursor-pointer"
                        >
                            {tx('common.cancel', undefined, 'Cancel')}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Fund Escrow Modal */}
            {isFundEscrowOpen && selectedContractMeta && (
                <Modal
                    isOpen={isFundEscrowOpen}
                    onClose={() => setIsFundEscrowOpen(false)}
                    title={tx('payment.fundEscrowTitle', undefined, 'Fund Escrow')}
                    size="md"
                >
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <FundEscrow
                            contract={{
                                id: selectedWorkspaceContractId,
                                budget: selectedContractMeta.amount || 0,
                                freelancer_id: selectedContractMeta.freelancer_id,
                                funded_at: selectedContractMeta.funded_at ?? null
                            } as any}
                            onSuccess={() => {
                                setIsFundEscrowOpen(false);
                                if (selectedContractId) {
                                    syncContractStatusLocally(selectedContractId, 'active');
                                    setContractSessionMetaById((prev) => {
                                        const existing = prev[selectedContractId];
                                        if (!existing) return prev;
                                        return {
                                            ...prev,
                                            [selectedContractId]: {
                                                ...existing,
                                                status: 'active',
                                                funded_at: new Date().toISOString()
                                            }
                                        };
                                    });
                                }
                            }}
                            onError={() => setIsFundEscrowOpen(false)}
                        />
                    </div>
                </Modal>
            )}

            {/* Report User Modal */}
            <Modal
                isOpen={isReportModalOpen}
                onClose={() => {
                    setIsReportModalOpen(false);
                    setReportReason('');
                    setCustomReportReason('');
                    setReportTouched(false);
                }}
                title={tx('pages.messages.reportUserTitle', undefined, 'Report User')}
                size="sm"
            >
                <div className="space-y-4 pt-2">
                    <p className="text-xs text-white/50 leading-relaxed">
                        {tx('pages.messages.reportUserDescription', undefined, 'Tell us why you are reporting this user. Our team will review their profile and recent activity.')}
                    </p>
                    <div className="space-y-2">
                        {[
                            { value: 'spam', label: 'Spam or misleading' },
                            { value: 'inappropriate', label: 'Inappropriate behavior or content' },
                            { value: 'fraud', label: 'Fraud or scam attempt' },
                            { value: 'harassment', label: 'Harassment or abuse' },
                            { value: 'other', label: 'Other' }
                        ].map((r) => (
                            <label
                                key={r.value}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                    reportReason === r.value ? 'border-violet-500 bg-violet-500/10' : 'border-white/5 bg-white/[0.02]'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="user-report-reason"
                                    value={r.value}
                                    checked={reportReason === r.value}
                                    onChange={() => setReportReason(r.value)}
                                    className="accent-violet-500"
                                />
                                <span className="text-sm font-bold text-white">
                                    {tx(`pages.messages.reportReason.${r.value}`, undefined, r.label)}
                                </span>
                            </label>
                        ))}
                    </div>

                    {reportReason === 'other' && (
                        <div>
                            <textarea
                                value={customReportReason}
                                onChange={(e) => setCustomReportReason(e.target.value)}
                                placeholder={tx('common.reportDescribePlaceholder', undefined, 'Please describe the issue...')}
                                rows={3}
                                className={`w-full resize-none rounded-xl border bg-[#0f0f0f] px-3 py-2 text-sm text-white outline-none focus:border-violet-500 ${
                                    reportTouched && !customReportReason.trim() ? 'border-[var(--color-status-error)]' : 'border-white/5'
                                }`}
                            />
                            {reportTouched && !customReportReason.trim() && (
                                <p className="text-[var(--color-status-error)] text-xs mt-1" role="alert">
                                    {tx('common.reportDescribePlaceholder', undefined, 'Please describe the issue')}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-3 border-t border-white/5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setIsReportModalOpen(false);
                                setReportReason('');
                                setCustomReportReason('');
                                setReportTouched(false);
                            }}
                            disabled={isSubmittingReport}
                        >
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                                setReportTouched(true);
                                void handleReportUser();
                            }}
                            isLoading={isSubmittingReport}
                            disabled={!reportReason || (reportReason === 'other' && !customReportReason.trim())}
                        >
                            {tx('common.reportSubmitButton', undefined, 'Submit report')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
