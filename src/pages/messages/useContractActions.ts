import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { sendContractMessage } from '../../services/messages';
import { submitReview as submitReviewRequest } from '../../services/reviews';
import { submitReport } from '../../services/reports';
import {
    canFreelancerDeliverForStatus,
    canClientRequestChangesForStatus,
    canOpenDisputeForStatus,
} from '../../lib/contractWorkflow';
import { normalizeContractStatus } from '../../lib/messagingLifecycle';
import { isEnumValueUnsupportedError, isMissingSchemaColumnError } from '../../lib/messageUtils';
import { getErrorMessage } from '../../lib/errorMessage';
import { validateUploadSelection } from '../../lib/uploadPolicy';
import { normalizeMimeType } from '../../lib/audioProcessing';
import type { Conversation } from '../../services/messages';
import type { ContractMessagingStatus } from '../../lib/messagingLifecycle';
import type { ContractSessionMeta } from './types';

interface UseContractActionsParams {
    selectedConversation: Conversation | null;
    selectedContractStatus: ContractMessagingStatus | null;
    selectedContractUserRole: string | null;
    selectedContractRevisionRemaining: number;
    contractDeliverySubmitted: boolean;
    selectedContractId: string | null;
    userId: string | undefined;
    tx: (key: string, params?: Record<string, unknown>, fallback?: string) => string;
    showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    syncContractStatusLocally: (contractId: string, status: ContractMessagingStatus) => void;
    refreshLatestContractDelivery: (contractId: string) => Promise<void>;
    setContractSessionMetaById: React.Dispatch<React.SetStateAction<Record<string, ContractSessionMeta>>>;
    setHasReviewedContractById: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    deliveryNote: string;
    deliveryFiles: File[];
    disputeReason: string;
    reportReason: string;
    customReportReason: string;
}

interface UseContractActionsReturn {
    isDeliveringContractWork: boolean;
    isRequestingContractChanges: boolean;
    isAcceptingContractWork: boolean;
    isOpeningContractDispute: boolean;
    isSubmittingReport: boolean;
    deliveryActionError: string | null;
    setDeliveryActionError: React.Dispatch<React.SetStateAction<string | null>>;
    setIsDeliverModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsAcceptModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsDisputeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsReportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsReviewModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setDisputeReason: React.Dispatch<React.SetStateAction<string>>;
    setReportReason: React.Dispatch<React.SetStateAction<string>>;
    setCustomReportReason: React.Dispatch<React.SetStateAction<string>>;
    setReportTouched: React.Dispatch<React.SetStateAction<boolean>>;
    handleDeliverContractWork: (links?: Array<Record<string, unknown>>, fileStages?: Record<number, 'review' | 'final'>) => Promise<void>;
    handleRequestContractChanges: () => Promise<void>;
    handleAcceptContractAndPay: () => Promise<void>;
    handleOpenContractDispute: () => Promise<void>;
    handleReportUser: () => Promise<void>;
    handleSubmitContractReview: (rating: number, comment: string) => Promise<void>;
}

export function useContractActions({
    selectedConversation,
    selectedContractStatus,
    selectedContractUserRole,
    selectedContractRevisionRemaining,
    contractDeliverySubmitted,
    selectedContractId,
    userId,
    tx,
    showToast,
    syncContractStatusLocally,
    refreshLatestContractDelivery,
    setContractSessionMetaById,
    setHasReviewedContractById,
    deliveryNote,
    deliveryFiles,
    disputeReason,
    reportReason,
    customReportReason,
}: UseContractActionsParams): UseContractActionsReturn {
    const [isDeliveringContractWork, setIsDeliveringContractWork] = useState(false);
    const [isRequestingContractChanges, setIsRequestingContractChanges] = useState(false);
    const [isAcceptingContractWork, setIsAcceptingContractWork] = useState(false);
    const [isOpeningContractDispute, setIsOpeningContractDispute] = useState(false);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [deliveryActionError, setDeliveryActionError] = useState<string | null>(null);
    const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [disputeReasonValue, setDisputeReason] = useState('');
    const [reportReasonValue, setReportReason] = useState('');
    const [customReportReasonValue, setCustomReportReason] = useState('');
    const [reportTouched, setReportTouched] = useState(false);

    const handleDeliverContractWork = useCallback(async (links: Array<Record<string, unknown>> = [], fileStages: Record<number, 'review' | 'final'> = {}) => {
        if (isDeliveringContractWork) return;
        if (!selectedConversation || !selectedConversation.contract_id || !userId) return;

        setDeliveryActionError(null);
        setIsDeliveringContractWork(true);
        try {
            if (selectedContractUserRole !== 'freelancer') {
                throw new Error(tx('contract.deliverBlocked', undefined, 'Only the freelancer can deliver work for this contract.'));
            }

            const workflowStatus = selectedContractStatus === 'unknown' ? null : selectedContractStatus;
            if (!canFreelancerDeliverForStatus(workflowStatus)) {
                throw new Error(tx('contract.deliverBlocked', undefined, 'This contract is not ready for delivery.'));
            }

            const contractId = selectedConversation.contract_id;
            const trimmedNote = deliveryNote.trim();
            const selectedDeliveryFiles = deliveryFiles;

            const hasReview = selectedDeliveryFiles.some((_, idx) => fileStages[idx] === 'review') || links.some(l => l.link_kind === 'review_link');
            const hasFinal = selectedDeliveryFiles.some((_, idx) => fileStages[idx] === 'final') || links.some(l => l.link_kind === 'final_link');
            if (!hasReview || !hasFinal) {
                setDeliveryActionError('Please provide deliverables for both review and final hand-off phases.');
                setIsDeliveringContractWork(false);
                return;
            }

            for (const file of selectedDeliveryFiles) {
                const validation = validateUploadSelection({
                    bucket: 'contract-files',
                    fileName: file.name,
                    mimeType: normalizeMimeType(file.type),
                    size: file.size,
                });

                if (!validation.ok) {
                    throw new Error(`${file.name}: ${validation.reason || 'Unsupported file type.'}`);
                }
            }

            const messageContent = trimmedNote
                ? `[[delivery]] ${trimmedNote}`
                : '[[delivery]] Work delivered and ready for review';

            const uploadFile = async (file: File, stage: 'review' | 'final') => {
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const path = `${userId}/${contractId}/submissions/${stage}/${Date.now()}_${safeName}`;

                const { error } = await supabase.storage.from('contract-files').upload(path, file, { upsert: false });
                if (error) throw new Error(tx('contract.lifecycle.uploadFailed', { stage: stage === 'review' ? 'Review' : 'Final', name: file.name, message: error.message }, `${stage === 'review' ? 'Review' : 'Final'} upload failed for ${file.name}: ${error.message}`));

                return {
                    name: file.name,
                    storage_path: path,
                    storage_bucket: 'contract-files',
                    mime_type: file.type || '',
                    size_bytes: file.size,
                };
            };

            const reviewAssets = [];
            const finalAssets = [];
            for (let idx = 0; idx < selectedDeliveryFiles.length; idx++) {
                const file = selectedDeliveryFiles[idx];
                const stage = fileStages[idx] || 'review';
                const asset = await uploadFile(file, stage);
                if (stage === 'review') {
                    reviewAssets.push(asset);
                } else {
                    finalAssets.push(asset);
                }
            }

            const { data: deliveryResult, error: deliveryError } = await supabase.rpc('submit_contract_delivery_atomic', {
                p_contract_id: contractId,
                p_delivery_note: trimmedNote || 'submitted',
                p_review_assets: reviewAssets,
                p_final_assets: finalAssets,
                p_delivery_links: links,
            });

            if (deliveryError) {
                throw new Error(`Delivery record failed: ${getErrorMessage(deliveryError, 'Delivery was blocked by database policy')}`);
            }

            const returnedStatus = normalizeContractStatus(
                deliveryResult && typeof deliveryResult === 'object' && 'status' in deliveryResult
                    ? String((deliveryResult as { status?: string }).status || '')
                    : null
            );

            if (returnedStatus !== 'unknown') {
                syncContractStatusLocally(contractId, returnedStatus);
            }

            await refreshLatestContractDelivery(contractId);

            const { error } = await sendContractMessage({
                contract_id: contractId,
                sender_id: userId,
                receiver_id: selectedConversation.otherUser.id,
                content: messageContent,
                message_type: 'delivery',
            });

            if (error) {
                throw new Error(`Delivery message failed: ${getErrorMessage(error, 'Message was blocked by database policy')}`);
            }

            setIsDeliverModalOpen(false);
            showToast(tx('contract.workDelivered', undefined, 'Work delivered successfully'), 'success');
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.deliverError', undefined, 'Failed to deliver work'));
            setDeliveryActionError(message);
            showToast(message, 'error');
        } finally {
            setIsDeliveringContractWork(false);
        }
    }, [deliveryFiles, deliveryNote, isDeliveringContractWork, refreshLatestContractDelivery, selectedConversation, selectedContractStatus, selectedContractUserRole, showToast, syncContractStatusLocally, tx, userId]);

    const handleRequestContractChanges = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.contract_id || !userId) return;

        setIsRequestingContractChanges(true);
        try {
            const workflowStatus = selectedContractStatus === 'unknown' ? null : selectedContractStatus;
            if (!canClientRequestChangesForStatus(workflowStatus, contractDeliverySubmitted)) {
                throw new Error(tx('contract.requestChangesBlocked', undefined, 'Changes can only be requested after a delivery is submitted.'));
            }
            if (selectedContractRevisionRemaining <= 0) {
                throw new Error(tx('contract.revisionLimitReached', undefined, 'Revision limit reached for this contract.'));
            }

            const contractId = selectedConversation.contract_id;
            let revisionStatusApplied = false;

            const { data: revisionResult, error: updateStatusError } = await supabase.rpc('request_contract_revision_atomic', {
                p_contract_id: contractId,
                p_reason: tx('contract.requestRevision', undefined, 'Please revise according to feedback'),
            });

            if (!updateStatusError) {
                revisionStatusApplied = true;
                syncContractStatusLocally(contractId, 'revision_requested');
                setContractSessionMetaById((prev) => {
                    const existing = prev[contractId];
                    if (!existing) return prev;

                    return {
                        ...prev,
                        [contractId]: {
                            ...existing,
                            status: 'revision_requested',
                            revision_requests_count:
                                revisionResult && typeof revisionResult === 'object' && 'revision_requests_count' in revisionResult
                                    ? Number((revisionResult as { revision_requests_count?: number }).revision_requests_count ?? existing.revision_requests_count ?? 0)
                                    : (existing.revision_requests_count ?? 0) + 1,
                            max_revision_rounds:
                                revisionResult && typeof revisionResult === 'object' && 'max_revision_rounds' in revisionResult
                                    ? Number((revisionResult as { max_revision_rounds?: number }).max_revision_rounds ?? existing.max_revision_rounds ?? 2)
                                    : (existing.max_revision_rounds ?? 2),
                        },
                    };
                });
            } else if (
                isEnumValueUnsupportedError(updateStatusError, 'contract_status_enum', 'revision_requested')
                || isMissingSchemaColumnError(updateStatusError, 'contracts', 'status')
            ) {
                console.warn('[Messages] Revision status update skipped for compatibility', updateStatusError);
            } else {
                console.warn('[Messages] Failed to update contract status to revision_requested', updateStatusError);
            }

            const changeNote = tx('contract.requestRevision', undefined, 'Please revise according to feedback');
            const { error } = await sendContractMessage({
                contract_id: contractId,
                sender_id: userId,
                receiver_id: selectedConversation.otherUser.id,
                content: `[[revision_requested]] ${changeNote}`,
                message_type: 'system',
            });

            if (error) throw error;

            if (revisionStatusApplied) {
                showToast(tx('contract.revisionSent', undefined, 'Revision request sent'), 'info');
            } else {
                showToast(
                    tx(
                        'contract.revisionSentCompatibilityNotice',
                        undefined,
                        'Revision request sent. Status update will apply once the latest contract enum migration is available.'
                    ),
                    'warning'
                );
            }
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.error', undefined, 'Action failed'));
            showToast(message, 'error');
        } finally {
            setIsRequestingContractChanges(false);
        }
    }, [contractDeliverySubmitted, selectedContractRevisionRemaining, selectedContractStatus, selectedConversation, showToast, syncContractStatusLocally, tx, userId]);

    const handleAcceptContractAndPay = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.contract_id || !userId) return;

        setIsAcceptingContractWork(true);
        try {
            if (import.meta.env.DEV) {
                const { data: contractData, error: fetchErr } = await supabase
                    .from('contracts')
                    .select('dhmad_escrow_id')
                    .eq('id', selectedConversation.contract_id)
                    .single();

                if (!fetchErr && contractData && !contractData.dhmad_escrow_id) {
                    const mockId = `dhmad_mock_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
                    const { error: updateError } = await supabase
                        .from('contracts')
                        .update({ dhmad_escrow_id: mockId })
                        .eq('id', selectedConversation.contract_id);

                    if (updateError) {
                        console.error('[DEV] Failed to auto-fund contract in messages:', updateError);
                    } else {
                        console.info('[DEV] Auto-funded contract in messages for release bypass:', mockId);
                    }
                }
            }

            const { error: releaseError } = await supabase.rpc('release_contract_payment_atomic', {
                p_contract_id: selectedConversation.contract_id,
            });

            if (releaseError) throw releaseError;

            syncContractStatusLocally(selectedConversation.contract_id, 'completed');
            await refreshLatestContractDelivery(selectedConversation.contract_id);

            const { error: messageError } = await sendContractMessage({
                contract_id: selectedConversation.contract_id,
                sender_id: userId,
                receiver_id: selectedConversation.otherUser.id,
                content: '[[contract_completed]] Work has been accepted and payment released',
                message_type: 'system',
            });

            if (messageError) throw messageError;

            setIsAcceptModalOpen(false);
            showToast(tx('contract.workAccepted', undefined, 'Work accepted and payment released'), 'success');
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.acceptError', undefined, 'Failed to accept work'));
            showToast(message, 'error');
        } finally {
            setIsAcceptingContractWork(false);
        }
    }, [contractDeliverySubmitted, refreshLatestContractDelivery, selectedContractStatus, selectedConversation, showToast, syncContractStatusLocally, tx, userId]);

    const handleOpenContractDispute = useCallback(async () => {
        if (!selectedConversation || !selectedConversation.contract_id || !userId) return;
        if (!disputeReasonValue.trim()) return;

        setIsOpeningContractDispute(true);
        try {
            const workflowStatus = selectedContractStatus === 'unknown' ? null : selectedContractStatus;
            if (!canOpenDisputeForStatus(workflowStatus)) {
                throw new Error(tx('contract.disputeBlocked', undefined, 'A dispute cannot be opened in the current contract state.'));
            }

            const { error: disputeError } = await supabase.rpc('open_dispute_atomic', {
                p_contract_id: selectedConversation.contract_id,
                p_reason: disputeReasonValue.trim(),
            });

            if (disputeError) throw disputeError;

            syncContractStatusLocally(selectedConversation.contract_id, 'disputed');

            const { error: messageError } = await sendContractMessage({
                contract_id: selectedConversation.contract_id,
                sender_id: userId,
                receiver_id: selectedConversation.otherUser.id,
                content: `[[dispute_opened]] Dispute opened: ${disputeReasonValue.trim()}`,
                message_type: 'dispute',
            });

            if (messageError) {
                console.warn('[Messages] Dispute opened but follow-up message failed', messageError);
            }

            setIsDisputeModalOpen(false);
            setDisputeReason('');
            showToast(tx('contract.disputeOpened', undefined, 'Dispute opened successfully'), 'warning');
        } catch (error) {
            const message = getErrorMessage(error, tx('contract.disputeError', undefined, 'Failed to open dispute'));
            showToast(message, 'error');
        } finally {
            setIsOpeningContractDispute(false);
        }
    }, [disputeReasonValue, selectedContractStatus, selectedConversation, showToast, syncContractStatusLocally, tx, userId]);

    const handleReportUser = useCallback(async () => {
        if (!selectedConversation || !userId) return;
        if (!reportReasonValue) return;
        const finalReason = reportReasonValue === 'other' ? customReportReasonValue.trim() : reportReasonValue;
        if (reportReasonValue === 'other' && !finalReason) return;

        setIsSubmittingReport(true);
        try {
            await submitReport(userId, 'user', selectedConversation.otherUser.id, finalReason);
            showToast(tx('pages.messages.reportSubmittedSuccess', undefined, 'Report submitted successfully. Our team will review it.'), 'success');
            setIsReportModalOpen(false);
            setReportReason('');
            setCustomReportReason('');
            setReportTouched(false);
        } catch (error) {
            console.error('[Messages] Failed to submit user report:', error);
            const errMsg = error instanceof Error ? error.message : String(error);
            showToast(errMsg || tx('common.reportFailed', undefined, 'Failed to submit report'), 'error');
        } finally {
            setIsSubmittingReport(false);
        }
    }, [selectedConversation, userId, reportReasonValue, customReportReasonValue, showToast, tx]);

    const handleSubmitContractReview = useCallback(async (rating: number, comment: string) => {
        if (!selectedContractId || !userId || !selectedConversation) {
            throw new Error('Missing contract context for review submission.');
        }

        const { error } = await submitReviewRequest(selectedContractId, rating, comment);
        if (error) {
            const errMessage = typeof error === 'object' && error !== null && 'message' in error
                ? String((error as { message?: string }).message || '')
                : '';
            throw new Error(errMessage || tx('contract.error', undefined, 'An error occurred'));
        }

        await sendContractMessage({
            contract_id: selectedContractId,
            sender_id: userId,
            receiver_id: selectedConversation.otherUser.id,
            content: `[[review_left]] ${rating} stars: ${comment || 'No comment provided'}`,
            message_type: 'system',
        });

        setHasReviewedContractById((prev) => ({
            ...prev,
            [selectedContractId]: true,
        }));
        setIsReviewModalOpen(false);
        showToast(tx('contract.reviewSent', undefined, 'Review submitted successfully'), 'success');
    }, [selectedContractId, selectedConversation, showToast, tx, userId]);

    return {
        isDeliveringContractWork,
        isRequestingContractChanges,
        isAcceptingContractWork,
        isOpeningContractDispute,
        isSubmittingReport,
        deliveryActionError,
        setDeliveryActionError,
        setIsDeliverModalOpen,
        setIsAcceptModalOpen,
        setIsDisputeModalOpen,
        setIsReportModalOpen,
        setIsReviewModalOpen,
        setDisputeReason,
        setReportReason,
        setCustomReportReason,
        setReportTouched,
        handleDeliverContractWork,
        handleRequestContractChanges,
        handleAcceptContractAndPay,
        handleOpenContractDispute,
        handleReportUser,
        handleSubmitContractReview,
    };
}
