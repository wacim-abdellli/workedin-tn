import { useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, PackageCheck } from 'lucide-react';
import { Header } from '@/components/layout';
import ContractDetailsSidebar, { type ContractActivityEvent } from '@/components/contracts/ContractDetailsSidebar';
import SubmitDeliveryForm from '@/components/contracts/SubmitDeliveryForm';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { normalizeContractStatus } from '@/lib/messagingLifecycle';
import { ROUTES } from '@/lib/routes';
import { useContractState } from '@/hooks/useContractState';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

import {
    WorkspaceSkeleton,
    useWorkspaceData,
    WorkspaceModals,
    type DeliveryAsset,
} from './contractWorkspace';
import {
    handleDeliver as startDeliver,
    addDeliveryFiles,
    handleSubmitDelivery as submitDelivery,
    handleConfirmRelease as confirmRelease,
    handleSubmitChanges as submitChanges,
    handleSubmitDispute as submitDispute,
    handleSubmitHoldClearance as submitHoldClearance,
    handleSubmitCancel as submitCancel,
} from './contractWorkspace/useWorkspaceActions';

export default function ContractWorkspacePage() {
    const { contractId } = useParams<{ contractId: string }>();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { showToast } = useToast();

    const ws = useWorkspaceData({ contractId });
    const deliverTextareaRef = useRef<HTMLTextAreaElement>(null);

    const userRole: 'client' | 'freelancer' = useMemo(() => {
        if (!user?.id || !ws.contract) return 'freelancer';
        return ws.contract.client_id === user.id ? 'client' : 'freelancer';
    }, [user?.id, ws.contract]);

    const currentStatus = useMemo(() => {
        if (!ws.contract) return 'unknown';
        return normalizeContractStatus(ws.contract.status ?? 'unknown', {
            fundedAt: ws.contract.funded_at,
            deliverySubmittedAt: ws.contract.delivery_submitted_at,
            reviewDueAt: ws.contract.review_due_at,
            revisionRequestsCount: ws.contract.revision_requests_count ?? 0,
            maxRevisionRounds: ws.contract.max_revision_rounds ?? 2,
        });
    }, [ws.contract]);

    const resolvedContractId = ws.contract?.id ?? contractId ?? '';

    const deliverySubmitted = Boolean(
        ws.contract?.delivery_submitted_at ||
        (ws.latestDelivery && typeof ws.latestDelivery === 'object' && 'id' in ws.latestDelivery),
    );

    const contractSidebarData = useMemo(() => {
        if (!ws.contract) return null;
        const resolvedTitle = (typeof ws.contract.title === 'string' && ws.contract.title.trim() ? ws.contract.title.trim() : null) ?? ws.jobTitle ?? 'Contract';
        const latestAssets = ws.latestDelivery?.assets ?? [];
        const deliveryAssetMap = new Map<string, DeliveryAsset>();
        latestAssets.forEach((asset) => {
            const key = `${asset.storage_path || asset.id}|${asset.name}`;
            if (!deliveryAssetMap.has(key)) {
                deliveryAssetMap.set(key, asset);
            }
        });
        const deliveryFiles = Array.from(deliveryAssetMap.values()).map(a => ({
            id: a.id, name: a.name, storagePath: a.storage_path,
            storageBucket: a.storage_bucket ?? 'contract-files',
            mimeType: a.mime_type ?? null, sizeBytes: a.size_bytes ?? null,
            assetKind: a.asset_kind as 'review_asset' | 'final_asset',
            accessState: a.access_state as 'preview_available' | 'locked' | 'released',
        }));
        const deliveryLinks = ws.latestDelivery?.links ?? [];
        const reviewFilesOnly = deliveryFiles.filter(f => f.assetKind === 'review_asset');
        const finalFilesOnly = deliveryFiles.filter(f => f.assetKind === 'final_asset');
        const selfProfile = { full_name: profile?.full_name || 'You', avatar_url: profile?.avatar_url ?? null };
        return {
            amount: ws.contract.total_amount ?? ws.contract.amount ?? 0,
            revisionRequestsCount: ws.contract.revision_requests_count ?? 0,
            maxRevisionRounds: ws.contract.max_revision_rounds ?? 2,
            fundedAt: ws.contract.funded_at ?? null,
            escrowFunded: Boolean(ws.contract.funded_at),
            deliverySubmittedAt: ws.contract.delivery_submitted_at ?? null,
            reviewDueAt: ws.contract.review_due_at ?? ws.latestDelivery?.review_due_at ?? null,
            reviewFiles: reviewFilesOnly,
            finalFiles: finalFilesOnly,
            deliveryLinks,
            lockedFinalFilesCount: finalFilesOnly.filter(f => f.accessState === 'locked').length,
            job: { title: resolvedTitle, deadline: ws.jobDeadline },
            lastRevisionNote: ws.lastRevisionNote,
            milestones: ws.contract.milestones || [],
            sharedFiles: ws.sharedFiles,
            client: userRole === 'client' ? selfProfile : ws.counterpartyProfile,
            freelancer: userRole === 'freelancer' ? selfProfile : ws.counterpartyProfile,
            escrowPendingClearanceUntil: ws.contract.escrow_pending_clearance_until ?? null,
            escrowHoldDisputed: ws.contract.escrow_hold_disputed ?? false,
            paymentStatus: ws.contract.payment_status ?? null,
        };
    }, [ws.contract, ws.jobTitle, ws.jobDeadline, ws.latestDelivery, ws.sharedFiles, ws.lastRevisionNote, userRole, profile, ws.counterpartyProfile]);

    const activityEvents = useMemo<ContractActivityEvent[]>(() => {
        if (!ws.contract) return [];
        const events: ContractActivityEvent[] = [];
        if (ws.contract.funded_at) {
            events.push({ id: 'funded', text: 'Escrow funded — work can begin', timestamp: ws.contract.funded_at, actorRole: 'client', kind: 'payment' });
        }
        if (ws.contract.delivery_submitted_at) {
            events.push({ id: 'delivered', text: 'Work delivered for review', timestamp: ws.contract.delivery_submitted_at, actorRole: 'freelancer', kind: 'delivery' });
        }
        if (ws.contract.review_due_at) {
            events.push({ id: 'review-due', text: `Review due by ${new Date(ws.contract.review_due_at).toLocaleDateString()}`, timestamp: ws.contract.review_due_at, actorRole: 'system', kind: 'system', system: true });
        }
        if ((ws.contract.revision_requests_count ?? 0) > 0) {
            events.push({ id: 'revision', text: `Revision requested (${ws.contract.revision_requests_count}/${ws.contract.max_revision_rounds ?? 2})`, timestamp: null, actorRole: 'client', kind: 'revision' });
        }
        return events.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
    }, [ws.contract]);

    const {
        deliverWork,
        deliverMilestoneWork,
        acceptWork,
        acceptMilestoneWork,
        requestChanges,
        openDispute,
        cancelContract,
        holdClearancePayment,
        holdMilestoneClearance,
        isDelivering,
        isAccepting,
        isDisputing,
        isCancelling,
    } = useContractState({
        contractId: resolvedContractId,
        userId: user?.id ?? '',
        userRole,
        contract: ws.contract as any,
        setContract: ws.setContract as any,
    });

    const isActionLoading = isDelivering || isAccepting || isDisputing || isCancelling;

    const handleGoBack = () => { if (window.history.length > 1) navigate(-1); else navigate(ROUTES.messages); };
    const handleGoToMessages = () => {
        if (!resolvedContractId) { navigate(ROUTES.messages); return; }
        navigate(`${ROUTES.messages}?contract=${encodeURIComponent(resolvedContractId)}`);
    };

    const handleDeliver = (milestoneId?: string) => {
        startDeliver({
            setDeliverNote: ws.setDeliverNote,
            setReviewFiles: ws.setReviewFiles,
            uploadedAssetsRef: ws.uploadedAssetsRef,
            setUploadedAssets: ws.setUploadedAssets,
            setUploadProgress: ws.setUploadProgress,
            setSelectedMilestoneId: ws.setSelectedMilestoneId,
            setDeliverOpen: ws.setDeliverOpen,
            deliverTextareaRef,
        });
        if (milestoneId && typeof milestoneId === 'string') {
            ws.setSelectedMilestoneId(milestoneId);
        }
    };

    const handleSubmitDelivery = async (links: Array<Record<string, unknown>> = [], fileStages: Record<number, 'review' | 'final'> = {}) => {
        await submitDelivery({
            reviewFiles: ws.reviewFiles,
            links,
            fileStages,
            user,
            resolvedContractId,
            uploadedAssetsRef: ws.uploadedAssetsRef,
            setUploadedAssets: ws.setUploadedAssets,
            setUploadProgress: ws.setUploadProgress,
            setUploadingFileName: ws.setUploadingFileName,
            setIsUploading: ws.setIsUploading,
            selectedMilestoneId: ws.selectedMilestoneId,
            deliverNote: ws.deliverNote,
            setDeliverOpen: ws.setDeliverOpen,
            setDeliverNote: ws.setDeliverNote,
            setReviewFiles: ws.setReviewFiles,
            setSelectedMilestoneId: ws.setSelectedMilestoneId,
            showToast,
            loadWorkspace: ws.loadWorkspace,
            deliverWork,
            deliverMilestoneWork,
            uploadTusFile: ws.uploadTusFile,
            isUploadPausedRef: ws.isUploadPausedRef,
        });
    };

    const handleConfirmRelease = async () => {
        ws.setConfirmReleaseOpen(false);
        await confirmRelease(acceptWork, ws.loadWorkspace, showToast);
    };

    const handleSubmitChanges = async (note: string) => {
        await submitChanges(note, requestChanges, ws.setChangesOpen, ws.loadWorkspace, showToast);
    };

    const handleSubmitDispute = async (reason: string) => {
        await submitDispute(reason, openDispute, ws.setDisputeOpen, ws.loadWorkspace, showToast);
    };

    const handleSubmitHoldClearance = async (reason: string) => {
        await submitHoldClearance(
            reason, ws.selectedMilestoneId,
            holdMilestoneClearance, holdClearancePayment,
            ws.setHoldClearanceOpen, ws.setSelectedMilestoneId, ws.setIsHoldingClearance,
            ws.loadWorkspace, showToast,
        );
    };

    const handleSubmitCancel = async (reason: string) => {
        await submitCancel(reason, cancelContract, ws.setCancelOpen, ws.loadWorkspace, showToast);
    };

    const handleOpenSharedFile = async (file: { url?: string; storageBucket?: string; storagePath?: string }) => {
        const bucket = file.storageBucket || 'contract-files';
        const path = file.storagePath || '';
        if (file.url && !path) {
            window.open(file.url, '_blank', 'noopener');
            return;
        }
        if (!path) { showToast('File path not available.', 'error'); return; }
        try {
            const { data, error: urlErr } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
            if (urlErr) throw urlErr;
            if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
        } catch (err) {
            showToast('Unable to open file. Access may be restricted.', 'error');
            logger.error('[ContractWorkspacePage] File open failed:', err);
        }
    };

    return (
        <div className="flex h-[100dvh] flex-col bg-[var(--color-bg-base)] overflow-hidden">
            <Header />

            {!ws.isLoading && !ws.error ? (
                <div className="shrink-0 h-px w-full bg-zinc-800" />
            ) : null}

            <main className="flex-1 flex flex-col overflow-y-auto relative">
                {ws.isLoading ? (
                    <div className="mx-auto w-full max-w-5xl px-4 py-6">
                        <WorkspaceSkeleton />
                    </div>
                ) : ws.error ? (
                    <div className="flex min-h-[60vh] items-center justify-center px-4">
                        <div className="max-w-sm space-y-5 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                                <AlertCircle className="h-7 w-7 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Unable to load workspace</h2>
                                <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{ws.error}</p>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button type="button" onClick={() => void ws.loadWorkspace()}
                                    className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--workspace-primary)] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--workspace-primary-hover)]">
                                    Retry
                                </button>
                                <button type="button" onClick={handleGoBack}
                                    className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-muted)]">
                                    <ArrowLeft className="h-4 w-4" /> Go back
                                </button>
                            </div>
                        </div>
                    </div>
                ) : contractSidebarData ? (
                    <ContractDetailsSidebar
                        contract={contractSidebarData}
                        userRole={userRole}
                        currentStatus={currentStatus}
                        deliverySubmitted={deliverySubmitted}
                        isActionLoading={isActionLoading}
                        activityEvents={activityEvents}
                        onDeliver={handleDeliver}
                        onOpenSharedFile={handleOpenSharedFile}
                        onRequestChanges={() => ws.setChangesOpen(true)}
                        onAcceptAndPay={() => ws.setConfirmReleaseOpen(true)}
                        onDispute={() => ws.setDisputeOpen(true)}
                        onCancel={() => ws.setCancelOpen(true)}
                        onFundEscrow={() => ws.setFundEscrowOpen(true)}
                        onReview={() => { if (resolvedContractId) navigate(`/contracts/${resolvedContractId}/review`); }}
                        hasLeftReview={ws.hasReviewed}
                        onGoBack={handleGoBack}
                        onGoToMessages={handleGoToMessages}
                        onHoldClearance={() => { ws.setHoldClearanceOpen(true); ws.setHoldClearanceReason(''); }}
                        onAcceptMilestone={async (milestoneId) => {
                            try {
                                await acceptMilestoneWork(milestoneId);
                                showToast('Milestone payment released.', 'success');
                                await ws.loadWorkspace();
                            } catch (err) {
                                showToast((err as Error).message || 'Failed to release milestone payment.', 'error');
                            }
                        }}
                        onHoldMilestoneClearance={(milestoneId) => {
                            ws.setSelectedMilestoneId(milestoneId);
                            ws.setHoldClearanceOpen(true);
                        }}
                    />
                ) : null}
            </main>

            {/* Submit Delivery Modal */}
            {ws.deliverOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-deliver-title"
                    onClick={() => ws.setDeliverOpen(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-[14px] border border-white/[0.08] bg-[#111113] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)] max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <SubmitDeliveryForm
                            deliveryNote={ws.deliverNote}
                            files={ws.reviewFiles}
                            isSubmitting={isDelivering || ws.isUploading || ws.isTusUploading}
                            submitLabel={currentStatus === 'revision_requested' ? 'Resubmit delivery' : 'Submit delivery'}
                            submittingLabel="Submitting delivery..."
                            uploadProgressLabel={ws.isUploading
                                ? ws.isTusUploading
                                    ? `Uploading ${ws.uploadingFileName} (${ws.tusProgress}%)...`
                                    : `Uploading ${(ws.uploadProgress.currentBytes / 1024 / 1024).toFixed(1)}MB / ${(ws.uploadProgress.totalBytes / 1024 / 1024).toFixed(1)}MB...`
                                : null}
                            textareaRef={deliverTextareaRef}
                            onNoteChange={ws.setDeliverNote}
                            onAddFiles={(files) => addDeliveryFiles(files, ws.setReviewFiles, showToast)}
                            onRemoveFile={(index) => ws.setReviewFiles(prev => prev.filter((_, fileIndex) => fileIndex !== index))}
                            onSubmit={(links, fileStages) => void handleSubmitDelivery(links, fileStages)}
                            onCancel={() => {
                                ws.setDeliverOpen(false);
                                ws.setReviewFiles([]);
                                ws.setUploadedAssets([]);
                                ws.setSelectedMilestoneId('');
                            }}
                            jobCategory={ws.jobCategory}
                            milestones={ws.contract?.milestones}
                            selectedMilestoneId={ws.selectedMilestoneId}
                            onMilestoneChange={ws.setSelectedMilestoneId}
                            isUploadPaused={ws.isUploadPaused}
                            onPauseUpload={ws.handlePauseUpload}
                            onResumeUpload={ws.handleResumeUpload}
                            uploadProgress={ws.uploadProgress}
                            uploadingFileName={ws.uploadingFileName}
                            tusProgress={ws.tusProgress}
                        />
                    </div>
                </div>
            ) : null}

            <WorkspaceModals
                fundEscrowOpen={ws.fundEscrowOpen}
                setFundEscrowOpen={ws.setFundEscrowOpen}
                contract={ws.contract!}
                loadWorkspace={ws.loadWorkspace}
                changesOpen={ws.changesOpen}
                setChangesOpen={ws.setChangesOpen}
                handleSubmitChanges={handleSubmitChanges}
                disputeOpen={ws.disputeOpen}
                setDisputeOpen={ws.setDisputeOpen}
                handleSubmitDispute={handleSubmitDispute}
                cancelOpen={ws.cancelOpen}
                setCancelOpen={ws.setCancelOpen}
                handleSubmitCancel={handleSubmitCancel}
                confirmReleaseOpen={ws.confirmReleaseOpen}
                setConfirmReleaseOpen={ws.setConfirmReleaseOpen}
                handleConfirmRelease={handleConfirmRelease}
                isAccepting={isAccepting}
                holdClearanceOpen={ws.holdClearanceOpen}
                setHoldClearanceOpen={ws.setHoldClearanceOpen}
                holdClearanceReason={ws.holdClearanceReason}
                setHoldClearanceReason={ws.setHoldClearanceReason}
                isHoldingClearance={ws.isHoldingClearance}
                handleSubmitHoldClearance={handleSubmitHoldClearance}
            />
        </div>
    );
}
