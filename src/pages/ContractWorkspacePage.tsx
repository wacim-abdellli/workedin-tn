import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, MessageSquare, Users, PackageCheck, GitPullRequest, ShieldAlert, X } from 'lucide-react';
import { Header } from '../components/layout';
import ContractDetailsSidebar, { type ContractActivityEvent } from '@/components/contracts/ContractDetailsSidebar';
import FundEscrow from '../components/payments/FundEscrow';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { normalizeContractStatus } from '../lib/messagingLifecycle';
import { ROUTES } from '@/lib/routes';
import { useTranslation } from '@/i18n';
import { useContractState } from '../hooks/useContractState';

// ─── Types ───────────────────────────────────────────────────────────────────

type ContractRow = {
    id: string;
    proposal_id?: string | null;
    status: string | null;
    title: string | null;
    amount: number | null;
    total_amount: number | null;
    revision_requests_count: number | null;
    max_revision_rounds: number | null;
    funded_at: string | null;
    escrow_funded?: boolean | null;
    delivery_submitted_at: string | null;
    review_due_at: string | null;
    client_id: string | null;
    freelancer_id: string | null;
    job_id: string | null;
};

type DeliveryAsset = {
    id: string;
    asset_kind: 'review_asset' | 'final_asset';
    access_state: 'preview_available' | 'locked' | 'released';
    name: string;
    storage_bucket?: string | null;
    storage_path: string;
    mime_type?: string | null;
    size_bytes?: number | null;
};

type LatestDelivery = {
    id: string;
    submitted_at?: string | null;
    review_due_at?: string | null;
    locked_final_asset_count?: number | null;
    assets?: DeliveryAsset[];
};

type SharedFile = {
    id: string;
    name: string;
    url: string;
    type?: string | null;
    size?: number | string | null;
    uploadedAt?: string | null;
    senderName?: string;
};

const CONTRACT_SELECT_COLUMNS = [
    'id, proposal_id, status, title, amount, total_amount, revision_requests_count, max_revision_rounds, funded_at, escrow_funded, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id',
    'id, proposal_id, status, title, amount, revision_requests_count, max_revision_rounds, funded_at, escrow_funded, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id',
    'id, proposal_id, status, title, amount, total_amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id',
    'id, proposal_id, status, title, amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id',
    'id, proposal_id, status, title, amount, client_id, freelancer_id, job_id',
    'id, status, title, amount, total_amount, revision_requests_count, max_revision_rounds, funded_at, escrow_funded, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id',
    'id, status, title, amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id',
    'id, status, title, amount, client_id, freelancer_id, job_id',
];

async function fetchContractByColumn(
    column: 'id' | 'proposal_id' | 'job_id',
    value: string,
): Promise<{ data: ContractRow | null; error: unknown }> {
    let lastError: unknown = null;

    for (const selectColumns of CONTRACT_SELECT_COLUMNS) {
        if ((column === 'proposal_id' && !selectColumns.includes('proposal_id'))
            || (column === 'job_id' && !selectColumns.includes('job_id'))) {
            continue;
        }

        const { data, error } = await supabase
            .from('contracts')
            .select(selectColumns)
            .eq(column, value)
            .limit(1)
            .maybeSingle();

        if (!error) {
            return { data: data as ContractRow | null, error: null };
        }

        lastError = error;
    }

    return { data: null, error: lastError };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function WorkspaceSkeleton() {
    return (
        <div className="animate-pulse space-y-0">
            {/* header */}
            <div className="border-b border-white/[0.06] bg-[#0D0D0E] px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-[10px] bg-white/5" />
                    <div className="space-y-1.5">
                        <div className="h-4 w-40 rounded-full bg-white/5" />
                        <div className="h-3 w-24 rounded-full bg-white/[0.03]" />
                    </div>
                    <div className="ml-auto h-6 w-20 rounded-full bg-white/5" />
                </div>
            </div>
            {/* tabs */}
            <div className="flex h-10 items-end gap-6 border-b border-white/[0.06] bg-[#0D0D0E] px-5">
                {['Overview', 'Files', 'Milestones', 'Activity'].map(t => (
                    <div key={t} className="h-3 w-14 rounded-full bg-white/5" />
                ))}
            </div>
            {/* body */}
            <div className="space-y-3 p-5">
                <div className="h-20 w-full rounded-[10px] bg-white/5" />
                <div className="grid grid-cols-3 gap-2">
                    <div className="h-24 rounded-[10px] bg-white/5" />
                    <div className="h-24 rounded-[10px] bg-white/5" />
                    <div className="h-24 rounded-[10px] bg-white/5" />
                </div>
                <div className="h-32 w-full rounded-[10px] bg-white/5" />
            </div>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ContractWorkspacePage() {
    const { contractId } = useParams<{ contractId: string }>();
    const navigate = useNavigate();
    const { user, profile, activeMode } = useAuth();
    const { showToast } = useToast();
    const { tx } = useTranslation();

    const [contract, setContract] = useState<ContractRow | null>(null);
    const [jobTitle, setJobTitle] = useState<string | null>(null);
    const [jobDeadline, setJobDeadline] = useState<string | null>(null);
    const [latestDelivery, setLatestDelivery] = useState<LatestDelivery | null>(null);
    const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ─── Action modal state ───────────────────────────────────────────────────
    const [deliverOpen, setDeliverOpen] = useState(false);
    const [deliverNote, setDeliverNote] = useState('');
    const [changesOpen, setChangesOpen] = useState(false);
    const [changesNote, setChangesNote] = useState('');
    const [disputeOpen, setDisputeOpen] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [fundEscrowOpen, setFundEscrowOpen] = useState(false);
    const deliverTextareaRef = useRef<HTMLTextAreaElement>(null);
    const changesTextareaRef = useRef<HTMLTextAreaElement>(null);
    const disputeTextareaRef = useRef<HTMLTextAreaElement>(null);

    const userRole: 'client' | 'freelancer' = useMemo(() => {
        const mode = activeMode ?? profile?.active_mode;
        if (mode === 'client') return 'client';
        if (mode === 'freelancer') return 'freelancer';
        if (contract?.client_id && contract.client_id === user?.id) return 'client';
        return 'freelancer';
    }, [activeMode, profile?.active_mode, contract?.client_id, user?.id]);

    const currentStatus = useMemo(
        () => normalizeContractStatus(contract?.status) ?? 'unknown',
        [contract?.status],
    );
    const resolvedContractId = contract?.id ?? contractId ?? '';

    const deliverySubmitted = Boolean(
        latestDelivery?.submitted_at || contract?.delivery_submitted_at,
    );

    // Role-aware accent colors for the breadcrumb bar
    const roleAccent = userRole === 'client'
        ? { badge: 'border-[#E8A020]/60 bg-[#E8A020]/10 text-[#E8A020]', stripe: 'from-[#E8A020]/15', label: tx('contractWorkspace.clientView', {}, 'Client view') }
        : { badge: 'border-[#9B8FF0]/60 bg-[#9B8FF0]/10 text-[#9B8FF0]', stripe: 'from-[#9B8FF0]/12', label: tx('contractWorkspace.freelancerView', {}, 'Freelancer view') };

    const loadWorkspace = useCallback(async () => {
        if (!contractId || !user?.id) return;
        setIsLoading(true);
        setError(null);

        try {
            // ── 1. Load contract row — first try as a direct contract UUID ──
            const urlParamId = contractId ?? '';
            const { data: directContractData, error: contractError } = await fetchContractByColumn('id', urlParamId);
            let contractData = directContractData;

            if (contractError) throw contractError;

            // ── Fallback: URL param might be a legacy proposal/job ID ──
            if (!contractData) {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(urlParamId);
                if (isUuid) {
                    const proposalLookup = await fetchContractByColumn('proposal_id', urlParamId);
                    if (proposalLookup.error) {
                        console.warn('[ContractWorkspacePage] Proposal fallback failed:', proposalLookup.error);
                    }
                    contractData = proposalLookup.data;

                    if (!contractData) {
                        const jobLookup = await fetchContractByColumn('job_id', urlParamId);
                        if (jobLookup.error) {
                            console.warn('[ContractWorkspacePage] Job fallback failed:', jobLookup.error);
                        }
                        contractData = jobLookup.data;
                    }
                }
            }
            if (!contractData) { setError(tx('contractWorkspace.notFound', {}, 'Contract not found or you do not have access.')); return; }
            if (contractData.client_id !== user.id && contractData.freelancer_id !== user.id) {
                setError(tx('contractWorkspace.notParticipant', {}, 'You are not a participant in this contract.')); return;
            }

            setContract(contractData as ContractRow);

            // Use the real DB contract ID for all downstream queries —
            // critical when the URL param was a legacy proposal/job reference
            const realId = contractData.id;

            // ── 2. Load job title + deadline ──
            if (contractData.job_id) {
                try {
                    const { data: jobData } = await supabase
                        .from('jobs').select('title, deadline').eq('id', contractData.job_id).maybeSingle();
                    if (jobData) {
                        setJobTitle(jobData.title ?? null);
                        setJobDeadline((jobData as any).deadline ?? null);
                    }
                } catch (jobError) {
                    console.warn('[ContractWorkspacePage] Failed to load job details:', jobError);
                }
            }

            // ── 3. Latest delivery ──
            try {
                const { data: deliveryData, error: deliveryError } = await supabase.rpc(
                    'get_latest_contract_delivery', { p_contract_id: realId },
                );
                if (deliveryError) {
                    console.warn('[ContractWorkspacePage] Failed to load latest delivery:', deliveryError);
                } else if (deliveryData && typeof deliveryData === 'object' && 'id' in deliveryData) {
                    setLatestDelivery(deliveryData as LatestDelivery);
                }
            } catch (deliveryError) {
                console.warn('[ContractWorkspacePage] Failed to load latest delivery:', deliveryError);
            }

            // ── 4. Review status ──
            try {
                const { data: reviewData } = await supabase
                    .from('reviews').select('id')
                    .eq('contract_id', realId).eq('reviewer_id', user.id).maybeSingle();
                setHasReviewed(Boolean(reviewData?.id));
            } catch (reviewError) {
                console.warn('[ContractWorkspacePage] Failed to load review status:', reviewError);
                setHasReviewed(false);
            }

            // ── 5. Shared files from conversation messages ──
            const { data: convData } = await supabase
                .from('conversations').select('id').eq('contract_id', realId).limit(1).maybeSingle();

            if (convData?.id) {
                const { data: messagesData } = await supabase
                    .from('messages')
                    .select('id, sender_id, attachments, created_at')
                    .eq('conversation_id', convData.id)
                    .not('attachments', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(50);

                const files: SharedFile[] = [];
                const seen = new Set<string>();
                for (const msg of messagesData ?? []) {
                    for (const [i, att] of (Array.isArray(msg.attachments) ? msg.attachments : []).entries()) {
                        if (!att?.url) continue;
                        const key = `${att.url}|${att.name ?? ''}`;
                        if (seen.has(key)) continue;
                        seen.add(key);
                        files.push({
                            id: `${msg.id}-${i}`,
                            name: att.name ?? 'Attachment',
                            url: att.url as string,
                            type: att.type ?? null, size: att.size ?? null,
                            uploadedAt: msg.created_at ?? null,
                            senderName: msg.sender_id === user.id ? (profile?.full_name || 'You') : 'Counterparty',
                        });
                        if (files.length >= 12) break;
                    }
                    if (files.length >= 12) break;
                }
                setSharedFiles(files);
            }
        } catch (err) {
            console.error('[ContractWorkspacePage] Failed to load:', err);
            setError(tx('contractWorkspace.loadError', {}, 'Failed to load contract details. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    }, [contractId, user?.id, profile?.full_name]);

    useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

    const contractSidebarData = useMemo(() => {
        if (!contract) return null;
        const resolvedTitle = (typeof contract.title === 'string' && contract.title.trim() ? contract.title.trim() : null) ?? jobTitle ?? 'Contract';
        const latestAssets = latestDelivery?.assets ?? [];
        const reviewFiles = latestAssets.filter(a => a.asset_kind === 'review_asset').map(a => ({
            id: a.id, name: a.name, storagePath: a.storage_path,
            storageBucket: a.storage_bucket ?? 'contract-files',
            mimeType: a.mime_type ?? null, sizeBytes: a.size_bytes ?? null,
            assetKind: a.asset_kind as 'review_asset' | 'final_asset',
            accessState: a.access_state as 'preview_available' | 'locked' | 'released',
        }));
        const allFinalAssets = latestAssets.filter(a => a.asset_kind === 'final_asset');
        const visibleFinalFiles = userRole === 'client' ? allFinalAssets.filter(a => a.access_state === 'released') : allFinalAssets;
        const lockedFinalFilesCount = Number(latestDelivery?.locked_final_asset_count ?? allFinalAssets.filter(a => a.access_state !== 'released').length);
        const selfProfile = { full_name: profile?.full_name || 'You', avatar_url: profile?.avatar_url ?? null };
        return {
            amount: contract.total_amount ?? contract.amount ?? 0,
            revisionRequestsCount: contract.revision_requests_count ?? 0,
            maxRevisionRounds: contract.max_revision_rounds ?? 2,
            fundedAt: contract.funded_at ?? null,
            escrowFunded: contract.escrow_funded === true,
            deliverySubmittedAt: contract.delivery_submitted_at ?? null,
            reviewDueAt: contract.review_due_at ?? latestDelivery?.review_due_at ?? null,
            reviewFiles,
            finalFiles: visibleFinalFiles.map(a => ({
                id: a.id, name: a.name, storagePath: a.storage_path,
                storageBucket: a.storage_bucket ?? 'contract-files',
                mimeType: a.mime_type ?? null, sizeBytes: a.size_bytes ?? null,
                assetKind: a.asset_kind as 'review_asset' | 'final_asset',
                accessState: a.access_state as 'preview_available' | 'locked' | 'released',
            })),
            lockedFinalFilesCount,
            job: { title: resolvedTitle, deadline: jobDeadline },
            milestones: [],
            sharedFiles,
            client: userRole === 'client' ? selfProfile : { full_name: 'Client', avatar_url: null },
            freelancer: userRole === 'freelancer' ? selfProfile : { full_name: 'Freelancer', avatar_url: null },
        };
    }, [contract, jobTitle, jobDeadline, latestDelivery, sharedFiles, userRole, profile]);

    // Intentionally empty — activity events will be populated by real-time hooks in a future pass
    const activityEvents = useMemo<ContractActivityEvent[]>(() => [], []);

    // ─── Contract action hook ────────────────────────────────────────────────
    const {
        deliverWork,
        acceptWork,
        requestChanges,
        openDispute,
        isDelivering,
        isAccepting,
        isDisputing,
    } = useContractState({
        contractId: resolvedContractId,
        userId: user?.id ?? '',
        userRole,
    });

    const isActionLoading = isDelivering || isAccepting || isDisputing;

    // ─── Navigation helpers ──────────────────────────────────────────────────
    const handleGoBack = () => { if (window.history.length > 1) navigate(-1); else navigate(ROUTES.messages); };
    const handleGoToMessages = () => {
        if (!resolvedContractId) { navigate(ROUTES.messages); return; }
        navigate(`${ROUTES.messages}?contract=${encodeURIComponent(resolvedContractId)}`);
    };

    // ─── Action handlers (real RPCs) ─────────────────────────────────────────
    const handleDeliver = () => {
        if (!resolvedContractId) return;
        navigate(`${ROUTES.messages}?contract=${encodeURIComponent(resolvedContractId)}`, { state: { openDeliverModal: true } });
    };const handleAcceptAndPay = async () => {
        if (!window.confirm(tx('contractWorkspace.confirmRelease', {}, 'Approve work and release payment to the freelancer? This cannot be undone.'))) return;
        try {
            await acceptWork();
            await loadWorkspace();
            showToast(tx('contractWorkspace.paymentReleased', {}, 'Payment released! Final files are now unlocked.'), 'success');
        } catch (err) {
            showToast((err as Error).message || tx('contractWorkspace.releaseFailed', {}, 'Failed to release payment.'), 'error');
        }
    };

    const handleRequestChanges = () => {
        setChangesNote('');
        setChangesOpen(true);
        setTimeout(() => changesTextareaRef.current?.focus(), 60);
    };

    const handleSubmitChanges = async () => {
        if (!changesNote.trim()) return;
        try {
            await requestChanges(changesNote.trim());
            setChangesOpen(false);
            setChangesNote('');
            await loadWorkspace();
            showToast(tx('contractWorkspace.revisionRequested', {}, 'Revision requested. The freelancer has been notified.'), 'success');
        } catch (err) {
            showToast((err as Error).message || tx('contractWorkspace.revisionFailed', {}, 'Failed to request revision.'), 'error');
        }
    };

    const handleOpenDispute = () => {
        setDisputeReason('');
        setDisputeOpen(true);
        setTimeout(() => disputeTextareaRef.current?.focus(), 60);
    };

    const handleSubmitDispute = async () => {
        if (!disputeReason.trim()) return;
        try {
            await openDispute(disputeReason.trim());
            setDisputeOpen(false);
            setDisputeReason('');
            await loadWorkspace();
            showToast(tx('contractWorkspace.disputeOpened', {}, 'Dispute opened. Our team will review the case.'), 'info');
        } catch (err) {
            showToast((err as Error).message || tx('contractWorkspace.disputeFailed', {}, 'Failed to open dispute.'), 'error');
        }
    };

    const jobTitle_ = contractSidebarData?.job?.title;

    return (
        <div className="flex min-h-screen flex-col bg-[#0A0A0B]">
            <Header />

            {/* Role-colored gradient line */}
            {!isLoading && !error ? (
                <div className={`h-[2px] w-full bg-gradient-to-r ${roleAccent.stripe} to-transparent`} />
            ) : null}

            {/* Breadcrumb bar */}
            <div className="sticky top-[var(--header-height,64px)] z-30 flex h-12 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#0D0D0E]/92 px-4 backdrop-blur-xl sm:px-6">
                <button type="button" onClick={handleGoBack}
                    className="inline-flex items-center gap-1.5 rounded-[8px] border border-white/[0.07] bg-[#161719] px-3 py-1.5 text-[13px] font-medium text-[#8A8880] transition-colors hover:border-white/[0.12] hover:text-[#F0EFE8]">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {tx('common.back', {}, 'Back')}
                </button>

                <div className="h-3.5 w-px bg-white/[0.08]" />

                <button type="button" onClick={handleGoToMessages}
                    className="inline-flex items-center gap-1.5 text-[13px] text-[#55534F] transition-colors hover:text-[#F0EFE8]">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {tx('nav.messages', {}, 'Messages')}
                </button>

                <div className="flex-1" />

                {!isLoading && !error ? (
                    <div className="flex items-center gap-2">
                        {jobTitle_ ? (
                            <p className="hidden max-w-[220px] truncate text-[13px] text-[#8A8880] sm:block">
                                {jobTitle_}
                            </p>
                        ) : null}
                        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${roleAccent.badge}`}>
                            <Users className="h-2.5 w-2.5" />
                            {roleAccent.label}
                        </span>
                    </div>
                ) : null}
            </div>

            <main className="flex-1">
                {isLoading ? (
                    <div className="mx-auto max-w-5xl">
                        <WorkspaceSkeleton />
                    </div>
                ) : error ? (
                    <div className="flex min-h-[60vh] items-center justify-center px-4">
                        <div className="max-w-sm space-y-5 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                                <AlertCircle className="h-7 w-7 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-[18px] font-semibold text-[#F0EFE8]">{tx('contractWorkspace.unableToLoad', {}, 'Unable to load workspace')}</h2>
                                <p className="mt-1.5 text-[14px] leading-relaxed text-[#8A8880]">{error}</p>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button type="button" onClick={() => void loadWorkspace()}
                                    className="inline-flex items-center gap-2 rounded-[10px] bg-[#1D9E75] px-4 py-2.5 text-[14px] font-semibold text-[#F0EFE8] transition-colors hover:bg-[#24b889]">
                                    {tx('common.retry', {}, 'Retry')}
                                </button>
                                <button type="button" onClick={handleGoBack}
                                    className="inline-flex items-center gap-2 rounded-[10px] border border-white/[0.07] bg-[#161719] px-4 py-2.5 text-[14px] font-medium text-[#8A8880] transition-colors hover:text-[#F0EFE8]">
                                    <ArrowLeft className="h-4 w-4" /> {tx('common.goBack', {}, 'Go back')}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : contractSidebarData ? (
                    <div className="mx-auto max-w-5xl sm:px-4 sm:py-6">
                        <div className="overflow-hidden sm:rounded-[14px] sm:shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
                            <ContractDetailsSidebar
                                contract={contractSidebarData}
                                userRole={userRole}
                                currentStatus={currentStatus}
                                deliverySubmitted={deliverySubmitted}
                                isActionLoading={isActionLoading}
                                activityEvents={activityEvents}
                                onDeliver={handleDeliver}
                                onRequestChanges={handleRequestChanges}
                                onAcceptAndPay={handleAcceptAndPay}
                                onDispute={handleOpenDispute}
                                onFundEscrow={() => setFundEscrowOpen(true)}
                                onReview={() => { if (resolvedContractId) navigate(`/contracts/${resolvedContractId}/review`); }}
                                hasLeftReview={hasReviewed}
                            />
                        </div>
                    </div>
                ) : null}
            </main>

            {/* ─── Fund Escrow Modal ───────────────────────────────────────── */}
            {fundEscrowOpen && contract ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Fund escrow">
                    <div className="w-full max-w-md">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#55534F]">Fund escrow</p>
                            <button type="button" onClick={() => setFundEscrowOpen(false)}
                                className="rounded-[8px] border border-white/[0.07] bg-[#161719] p-1.5 text-[#55534F] transition-colors hover:text-[#F0EFE8]">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <FundEscrow
                            contract={{
                                id: contract.id,
                                client_id: contract.client_id ?? '',
                                freelancer_id: contract.freelancer_id ?? '',
                                budget: contract.amount ?? 0,
                                escrow_funded: contract.escrow_funded === true,
                            }}
                            onSuccess={() => { setFundEscrowOpen(false); void loadWorkspace(); }}
                            onError={() => setFundEscrowOpen(false)}
                        />
                    </div>
                </div>
            ) : null}

            {/* ─── Request Changes Modal ────────────────────────────────────── */}
            {changesOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="modal-changes-title">
                    <div className="w-full max-w-md rounded-[14px] border border-white/[0.08] bg-[#111113] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#E8A020]/15">
                                <GitPullRequest className="h-5 w-5 text-[#E8A020]" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#55534F]">Request revision</p>
                                <h2 id="modal-changes-title" className="text-[16px] font-semibold text-[#F0EFE8]">What needs to change?</h2>
                            </div>
                        </div>
                        <textarea
                            ref={changesTextareaRef}
                            value={changesNote}
                            onChange={e => setChangesNote(e.target.value)}
                            placeholder="Be specific — describe exactly what needs to be revised so the freelancer can act immediately…"
                            rows={4}
                            className="w-full resize-none rounded-[10px] border border-white/[0.08] bg-[#0D0D0E] px-4 py-3 text-[14px] text-[#F0EFE8] placeholder-[#55534F] focus:border-[#E8A020]/60 focus:outline-none focus:ring-1 focus:ring-[#E8A020]/40"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setChangesOpen(false)}
                                className="rounded-[10px] border border-white/[0.07] bg-[#161719] px-4 py-2 text-[14px] font-medium text-[#8A8880] hover:text-[#F0EFE8]">
                                Cancel
                            </button>
                            <button type="button" onClick={() => void handleSubmitChanges()} disabled={!changesNote.trim()}
                                className="inline-flex items-center gap-2 rounded-[10px] bg-[#E8A020] px-4 py-2 text-[14px] font-semibold text-[#0D0D0E] transition-colors hover:bg-[#f0aa28] disabled:opacity-50">
                                Send revision request
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* ─── Open Dispute Modal ───────────────────────────────────────── */}
            {disputeOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="modal-dispute-title">
                    <div className="w-full max-w-md rounded-[14px] border border-white/[0.08] bg-[#111113] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-red-500/15">
                                <ShieldAlert className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#55534F]">Open dispute</p>
                                <h2 id="modal-dispute-title" className="text-[16px] font-semibold text-[#F0EFE8]">Describe the issue</h2>
                            </div>
                        </div>
                        <div className="mb-4 rounded-[10px] border border-red-500/20 bg-red-500/10 px-4 py-3">
                            <p className="text-[13px] leading-relaxed text-red-300">Opening a dispute freezes the contract and notifies our team. All messaging is locked while the case is reviewed. Use this only if revision requests have failed.</p>
                        </div>
                        <textarea
                            ref={disputeTextareaRef}
                            value={disputeReason}
                            onChange={e => setDisputeReason(e.target.value)}
                            placeholder="Explain clearly what went wrong, what you expected, and what you received…"
                            rows={4}
                            className="w-full resize-none rounded-[10px] border border-white/[0.08] bg-[#0D0D0E] px-4 py-3 text-[14px] text-[#F0EFE8] placeholder-[#55534F] focus:border-red-500/60 focus:outline-none focus:ring-1 focus:ring-red-500/40"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setDisputeOpen(false)} disabled={isDisputing}
                                className="rounded-[10px] border border-white/[0.07] bg-[#161719] px-4 py-2 text-[14px] font-medium text-[#8A8880] hover:text-[#F0EFE8] disabled:opacity-40">
                                Cancel
                            </button>
                            <button type="button" onClick={() => void handleSubmitDispute()} disabled={isDisputing || !disputeReason.trim()}
                                className="inline-flex items-center gap-2 rounded-[10px] border border-red-500/40 bg-red-900/60 px-4 py-2 text-[14px] font-semibold text-red-200 transition-colors hover:bg-red-900 disabled:opacity-50">
                                {isDisputing ? 'Opening dispute…' : 'Open dispute'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
