import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { ContractRow, SharedFile } from './types';

type SharedAttachment = {
    url?: string;
    name?: string;
    type?: string;
    size?: number | string;
    [key: string]: unknown;
};

type ContractMilestoneRow = {
    id: string;
    [key: string]: unknown;
};

export function handleDeliver(
    params: {
        setDeliverNote: React.Dispatch<React.SetStateAction<string>>;
        setReviewFiles: React.Dispatch<React.SetStateAction<File[]>>;
        uploadedAssetsRef: React.MutableRefObject<ContractMilestoneRow[]>;
        setUploadedAssets: React.Dispatch<React.SetStateAction<ContractMilestoneRow[]>>;
        setUploadProgress: React.Dispatch<React.SetStateAction<{ current: number; total: number; currentBytes: number; totalBytes: number }>>;
        setSelectedMilestoneId: React.Dispatch<React.SetStateAction<string>>;
        setDeliverOpen: React.Dispatch<React.SetStateAction<boolean>>;
        deliverTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
    },
) {
    const { setDeliverNote, setReviewFiles, uploadedAssetsRef, setUploadedAssets, setUploadProgress, setSelectedMilestoneId, setDeliverOpen, deliverTextareaRef } = params;
    setDeliverNote('');
    setReviewFiles([]);
    uploadedAssetsRef.current = [];
    setUploadedAssets([]);
    setUploadProgress({ current: 0, total: 0, currentBytes: 0, totalBytes: 0 });
    setSelectedMilestoneId('');
    setDeliverOpen(true);
    setTimeout(() => deliverTextareaRef.current?.focus(), 60);
}

export function addDeliveryFiles(
    newFiles: File[],
    setReviewFiles: React.Dispatch<React.SetStateAction<File[]>>,
    showToast: (msg: string, type?: string) => void,
) {
    const validFiles = newFiles.filter(file => {
        if (file.size > 1000 * 1024 * 1024) {
            showToast(`File "${file.name}" exceeds 1GB limit.`, 'error');
            return false;
        }
        return true;
    });
    setReviewFiles(prev => [...prev, ...validFiles]);
}

export async function handleSubmitDelivery(params: {
    reviewFiles: File[];
    links: SharedAttachment[];
    fileStages: Record<number, 'review' | 'final'>;
    user: { id: string } | null;
    resolvedContractId: string;
    uploadedAssetsRef: React.MutableRefObject<ContractMilestoneRow[]>;
    setUploadedAssets: React.Dispatch<React.SetStateAction<ContractMilestoneRow[]>>;
    setUploadProgress: React.Dispatch<React.SetStateAction<{ current: number; total: number; currentBytes: number; totalBytes: number }>>;
    setUploadingFileName: React.Dispatch<React.SetStateAction<string | null>>;
    setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
    selectedMilestoneId: string;
    deliverNote: string;
    setDeliverOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setDeliverNote: React.Dispatch<React.SetStateAction<string>>;
    setReviewFiles: React.Dispatch<React.SetStateAction<File[]>>;
    setSelectedMilestoneId: React.Dispatch<React.SetStateAction<string>>;
    showToast: (msg: string, type?: string) => void;
    loadWorkspace: () => Promise<void>;
    deliverWork: (note: string, reviewAssets: SharedAttachment[], finalAssets: SharedAttachment[], links: SharedAttachment[]) => Promise<void>;
    deliverMilestoneWork: (milestoneId: string, note: string, reviewAssets: SharedAttachment[], finalAssets: SharedAttachment[], links: SharedAttachment[]) => Promise<void>;
    uploadTusFile: (file: File, bucket: string, path: string) => Promise<void>;
    isUploadPausedRef: React.MutableRefObject<boolean>;
}) {
    const {
        reviewFiles, links, fileStages, user, resolvedContractId,
        uploadedAssetsRef, setUploadedAssets, setUploadProgress,
        setUploadingFileName, setIsUploading, selectedMilestoneId, deliverNote,
        setDeliverOpen, setDeliverNote, setReviewFiles, setSelectedMilestoneId,
        showToast, loadWorkspace, deliverWork, deliverMilestoneWork,
        uploadTusFile, isUploadPausedRef,
    } = params;

    const hasReview = reviewFiles.some((_, idx) => fileStages[idx] === 'review') || links.some(l => l.link_kind === 'review_link');
    const hasFinal = reviewFiles.some((_, idx) => fileStages[idx] === 'final') || links.some(l => l.link_kind === 'final_link');
    if (!hasReview || !hasFinal) {
        showToast('Please provide deliverables for both review and final hand-off phases.', 'error');
        return;
    }

    setIsUploading(true);
    try {
        const uid = user?.id;
        const cid = resolvedContractId;
        if (!uid || !cid) throw new Error('Missing user or contract ID');

        const uploadFile = async (file: File, stage: 'review' | 'final') => {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${uid}/${cid}/submissions/${stage}/${Date.now()}_${safeName}`;

            if (file.size >= 100 * 1024 * 1024) {
                await uploadTusFile(file, 'contract-files', path);
            } else {
                const { error } = await supabase.storage.from('contract-files').upload(path, file, { upsert: false });
                if (error) throw new Error(`${stage === 'review' ? 'Review' : 'Final'} upload failed for ${file.name}: ${error.message}`);
            }

            setUploadProgress(prev => ({
                ...prev,
                current: prev.current + 1,
                currentBytes: prev.currentBytes + file.size,
            }));

            return {
                name: file.name,
                storage_path: path,
                storage_bucket: 'contract-files',
                mime_type: file.type || '',
                size_bytes: String(file.size),
            };
        };

        const totalFiles = reviewFiles.length;
        const totalBytes = reviewFiles.reduce((sum, f) => sum + f.size, 0);

        const completedCount = uploadedAssetsRef.current.length;
        const completedBytes = uploadedAssetsRef.current.reduce((sum, a) => sum + Number(a.size_bytes), 0);

        setUploadProgress({
            current: completedCount,
            total: totalFiles,
            currentBytes: completedBytes,
            totalBytes,
        });

        const reviewAssets = [...uploadedAssetsRef.current.filter(a => a.stage === 'review')] as SharedAttachment[];
        const finalAssets = [...uploadedAssetsRef.current.filter(a => a.stage === 'final')] as SharedAttachment[];

        for (let idx = completedCount; idx < reviewFiles.length; idx++) {
            const file = reviewFiles[idx];
            const stage = fileStages[idx] || 'review';
            setUploadingFileName(file.name);

            try {
                const asset = await uploadFile(file, stage);
                const assetWithStage = { ...asset, stage };

                uploadedAssetsRef.current = [...uploadedAssetsRef.current, assetWithStage];
                setUploadedAssets([...uploadedAssetsRef.current]);

                if (stage === 'review') {
                    reviewAssets.push(asset);
                } else {
                    finalAssets.push(asset);
                }
            } catch (err) {
                setUploadingFileName(null);
                if (isUploadPausedRef.current) {
                    logger.info('Upload paused by user.');
                    setIsUploading(false);
                    return;
                }
                throw err;
            }
        }

        setUploadingFileName(null);
        setIsUploading(false);

        if (selectedMilestoneId) {
            await deliverMilestoneWork(selectedMilestoneId, deliverNote.trim() || 'submitted', reviewAssets, finalAssets, links);
        } else {
            await deliverWork(deliverNote.trim() || 'submitted', reviewAssets, finalAssets, links);
        }
        setDeliverOpen(false);
        setDeliverNote('');
        setReviewFiles([]);
        setSelectedMilestoneId('');
        await loadWorkspace();
        showToast('Delivery submitted! The client will review your work.', 'success');
    } catch (err) {
        setIsUploading(false);
        showToast((err as Error).message || 'Failed to submit delivery.', 'error');
    }
}

export async function handleConfirmRelease(
    acceptWork: () => Promise<void>,
    loadWorkspace: () => Promise<void>,
    showToast: (msg: string, type?: string) => void,
) {
    try {
        await acceptWork();
        await loadWorkspace();
        showToast('Payment released and contract completed.', 'success');
    } catch (err) {
        const rawMsg = err instanceof Error ? err.message : String(err);
        const friendlyMessages: Record<string, string> = {
            'payment.releaseFailed': 'Payment release failed. Please try again or contact support.',
            'payment.noResponse': 'No response from payment gateway. Please try again.',
            'payment.sessionFailed': 'Payment session error. Please refresh and try again.',
            'Invalid status transition': 'This contract is not in a state that allows payment release.',
            'Work must be delivered': 'Work must be submitted before payment can be released.',
        };
        const friendlyMsg = Object.entries(friendlyMessages).find(([key]) => rawMsg.includes(key))?.[1]
            ?? rawMsg
            ?? 'Failed to release payment.';
        showToast(friendlyMsg, 'error');
        logger.error('[handleConfirmRelease] Payment release failed:', rawMsg);
    }
}

export async function handleSubmitChanges(
    note: string,
    requestChanges: (note: string) => Promise<void>,
    setChangesOpen: React.Dispatch<React.SetStateAction<boolean>>,
    loadWorkspace: () => Promise<void>,
    showToast: (msg: string, type?: string) => void,
) {
    try {
        await requestChanges(note);
        setChangesOpen(false);
        await loadWorkspace();
        showToast('Revision requested. The freelancer has been notified.', 'success');
    } catch (err) {
        showToast((err as Error).message || 'Failed to request revision.', 'error');
    }
}

export async function handleSubmitDispute(
    reason: string,
    openDispute: (reason: string) => Promise<void>,
    setDisputeOpen: React.Dispatch<React.SetStateAction<boolean>>,
    loadWorkspace: () => Promise<void>,
    showToast: (msg: string, type?: string) => void,
) {
    try {
        await openDispute(reason);
        setDisputeOpen(false);
        await loadWorkspace();
        showToast('Dispute opened. Our team will review the case.', 'info');
    } catch (err) {
        showToast((err as Error).message || 'Failed to open dispute.', 'error');
    }
}

export async function handleSubmitHoldClearance(
    reason: string,
    selectedMilestoneId: string,
    holdMilestoneClearance: (milestoneId: string, reason: string) => Promise<void>,
    holdClearancePayment: (reason: string) => Promise<void>,
    setHoldClearanceOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setSelectedMilestoneId: React.Dispatch<React.SetStateAction<string>>,
    setIsHoldingClearance: React.Dispatch<React.SetStateAction<boolean>>,
    loadWorkspace: () => Promise<void>,
    showToast: (msg: string, type?: string) => void,
) {
    setIsHoldingClearance(true);
    try {
        if (selectedMilestoneId) {
            await holdMilestoneClearance(selectedMilestoneId, reason);
        } else {
            await holdClearancePayment(reason);
        }
        setHoldClearanceOpen(false);
        setSelectedMilestoneId('');
        await loadWorkspace();
        showToast('Escrow clearance hold suspended successfully.', 'success');
    } catch (err) {
        showToast((err as Error).message || 'Failed to hold clearance payment.', 'error');
    } finally {
        setIsHoldingClearance(false);
    }
}

export async function handleSubmitCancel(
    reason: string,
    cancelContract: (reason: string) => Promise<void>,
    setCancelOpen: React.Dispatch<React.SetStateAction<boolean>>,
    loadWorkspace: () => Promise<void>,
    showToast: (msg: string, type?: string) => void,
) {
    try {
        await cancelContract(reason);
        setCancelOpen(false);
        await loadWorkspace();
        showToast('Contract cancelled successfully.', 'success');
    } catch (err) {
        showToast((err as Error).message || 'Failed to cancel contract.', 'error');
    }
}
