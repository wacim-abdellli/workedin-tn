import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, PackageCheck, X } from 'lucide-react';
import { Header } from '../components/layout';
import ContractDetailsSidebar, { type ContractActivityEvent } from '@/components/contracts/ContractDetailsSidebar';
import SubmitDeliveryForm from '@/components/contracts/SubmitDeliveryForm';
import { RequestChangesModal, OpenDisputeModal, CancelContractModal } from '../components/contracts/ContractModals';
import FundEscrow from '../components/payments/FundEscrow';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { normalizeContractStatus } from '../lib/messagingLifecycle';
import { ROUTES } from '@/lib/routes';
import { useTranslation } from '@/i18n';
import { useContractState } from '../hooks/useContractState';
import { useTusUpload } from '@/hooks/useTusUpload';
import { logger } from '@/lib/logger';

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
    delivery_submitted_at: string | null;
    review_due_at: string | null;
    client_id: string | null;
    freelancer_id: string | null;
    job_id: string | null;
    escrow_pending_clearance_until?: string | null;
    escrow_hold_disputed?: boolean;
    payment_status?: string | null;
    milestones?: any[];
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
    'id, proposal_id, status, title, amount, total_amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id, escrow_pending_clearance_until, escrow_hold_disputed, payment_status, delivery_note, dhmad_escrow_id, dhmad_payment_url',
    'id, proposal_id, status, title, amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id, escrow_pending_clearance_until, escrow_hold_disputed, payment_status, delivery_note, dhmad_escrow_id, dhmad_payment_url',
    'id, proposal_id, status, title, amount, client_id, freelancer_id, job_id, escrow_pending_clearance_until, escrow_hold_disputed, payment_status, delivery_note, dhmad_escrow_id, dhmad_payment_url',
    'id, status, title, amount, total_amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id, escrow_pending_clearance_until, escrow_hold_disputed, payment_status, delivery_note, dhmad_escrow_id, dhmad_payment_url',
    'id, status, title, amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id, escrow_pending_clearance_until, escrow_hold_disputed, payment_status, delivery_note, dhmad_escrow_id, dhmad_payment_url',
    'id, status, title, amount, client_id, freelancer_id, job_id, escrow_pending_clearance_until, escrow_hold_disputed, payment_status, delivery_note, dhmad_escrow_id, dhmad_payment_url',
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
            <div className="border-b border-white/[0.06] bg-[var(--color-bg-base)] px-5 py-3.5">
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
            <div className="flex h-10 items-end gap-6 border-b border-white/[0.06] bg-[var(--color-bg-base)] px-5">
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
    const [jobCategory, setJobCategory] = useState<string | null>(null);
    const [latestDelivery, setLatestDelivery] = useState<LatestDelivery | null>(null);
    const [lastRevisionNote, setLastRevisionNote] = useState<string | null>(null);
    const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [counterpartyProfile, setCounterpartyProfile] = useState<{ full_name: string; avatar_url: string | null }>({ full_name: '', avatar_url: null });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Milestones and upload states
    const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
    const [savedLinks, setSavedLinks] = useState<any[]>([]);
    const [savedFileStages, setSavedFileStages] = useState<Record<number, 'review' | 'final'>>({});
    const [isUploadPaused, setIsUploadPaused] = useState(false);
    const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
    // Use a ref for the mutable accumulator and state only for rendering
    const uploadedAssetsRef = useRef<any[]>([]);
    const [uploadedAssets, setUploadedAssets] = useState<any[]>([]);
    const isUploadPausedRef = useRef(false);

    const {
        uploadFile: uploadTusFile,
        progress: tusProgress,
        isUploading: isTusUploading,
        pause: pauseTus,
        resume: resumeTus,
    } = useTusUpload();

    const handlePauseUpload = () => {
        isUploadPausedRef.current = true;
        setIsUploadPaused(true);
        pauseTus();
    };

    const handleResumeUpload = async () => {
        isUploadPausedRef.current = false;
        setIsUploadPaused(false);
        // Do NOT reset uploadedAssetsRef here — it holds the already-completed uploads
        // handleSubmitDelivery reads uploadedAssetsRef.current to skip completed files
        await handleSubmitDelivery(savedLinks, savedFileStages);
    };

    // ─── Action modal state ───────────────────────────────────────────────────
    const [deliverOpen, setDeliverOpen] = useState(false);
    const [deliverNote, setDeliverNote] = useState('');
    const [changesOpen, setChangesOpen] = useState(false);
    const [disputeOpen, setDisputeOpen] = useState(false);
    const [fundEscrowOpen, setFundEscrowOpen] = useState(false);
    const [confirmReleaseOpen, setConfirmReleaseOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [holdClearanceOpen, setHoldClearanceOpen] = useState(false);
    const [holdClearanceReason, setHoldClearanceReason] = useState('');
    const [isHoldingClearance, setIsHoldingClearance] = useState(false);
    const [reviewFiles, setReviewFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, currentBytes: 0, totalBytes: 0 });
    const deliverTextareaRef = useRef<HTMLTextAreaElement>(null);

    const userRole: 'client' | 'freelancer' = useMemo(() => {
        const mode = activeMode ?? profile?.active_mode;
        if (mode === 'client') return 'client';
        if (mode === 'freelancer') return 'freelancer';
        if (contract?.client_id && contract.client_id === user?.id) return 'client';
        return 'freelancer';
    }, [activeMode, profile?.active_mode, contract?.client_id, user?.id]);

    const currentStatus = useMemo(() => {
        const rawStatus = normalizeContractStatus(contract?.status) ?? 'unknown';
        const isEscrowFunded = Boolean(contract?.funded_at);
        if (rawStatus === 'active' && !isEscrowFunded) {
            return 'pending_payment';
        }
        return rawStatus;
    }, [contract?.status, contract?.funded_at]);
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
            if (contractData.client_id !== user.id && contractData.client_id !== user.id && contractData.freelancer_id !== user.id) {
                setError(tx('contractWorkspace.notParticipant', {}, 'You are not a participant in this contract.')); return;
            }
 
            let milestonesData: any[] = [];
            let cpData: any = null;
            let jobData: any = null;
            let deliveryData: any = null;
            let reviewData: any = null;
            let convData: any = null;

            const cpRole = contractData.client_id === user.id ? 'freelancer' : 'client';
            const counterpartyId = cpRole === 'freelancer' ? contractData.freelancer_id : contractData.client_id;

            // Fetch everything except message details in parallel
            const [
                milestonesRes,
                counterpartyRes,
                jobRes,
                deliveryRes,
                reviewRes,
                conversationRes
            ] = await Promise.all([
                supabase
                    .from('milestones')
                    .select('*')
                    .eq('contract_id', contractData.id)
                    .order('created_at', { ascending: true }),
                counterpartyId
                    ? supabase.from('public_profiles').select('full_name, avatar_url').eq('id', counterpartyId).maybeSingle()
                    : Promise.resolve({ data: null, error: null }),
                contractData.job_id
                    ? supabase.from('jobs').select('title, deadline, category').eq('id', contractData.job_id).maybeSingle()
                    : Promise.resolve({ data: null, error: null }),
                supabase.rpc('get_latest_contract_delivery', { p_contract_id: contractData.id }),
                supabase.from('reviews').select('id').eq('contract_id', contractData.id).eq('reviewer_id', user.id).maybeSingle(),
                supabase.from('conversations').select('id').eq('contract_id', contractData.id).limit(1).maybeSingle()
            ]);

            if (milestonesRes.error) {
                console.warn('[ContractWorkspacePage] Failed to load milestones:', milestonesRes.error);
            } else {
                milestonesData = milestonesRes.data || [];
            }

            if (counterpartyRes.error) {
                console.warn('[ContractWorkspacePage] Failed to load counterparty profile:', counterpartyRes.error);
            } else {
                cpData = counterpartyRes.data;
            }

            if (jobRes.error) {
                console.warn('[ContractWorkspacePage] Failed to load job details:', jobRes.error);
            } else {
                jobData = jobRes.data;
            }

            if (deliveryRes.error) {
                console.warn('[ContractWorkspacePage] Failed to load latest delivery:', deliveryRes.error);
            } else {
                deliveryData = deliveryRes.data;
            }

            if (reviewRes.error) {
                console.warn('[ContractWorkspacePage] Failed to load review status:', reviewRes.error);
            } else {
                reviewData = reviewRes.data;
            }

            if (conversationRes.error) {
                console.warn('[ContractWorkspacePage] Failed to load conversation:', conversationRes.error);
            } else {
                convData = conversationRes.data;
            }

            setContract({
                ...(contractData as ContractRow),
                milestones: milestonesData
            });

            if (cpData) {
                setCounterpartyProfile({
                    full_name: cpData.full_name || (cpRole === 'freelancer' ? 'Freelancer' : 'Client'),
                    avatar_url: cpData.avatar_url ?? null,
                });
            } else {
                setCounterpartyProfile({ full_name: cpRole === 'freelancer' ? 'Freelancer' : 'Client', avatar_url: null });
            }

            if (jobData) {
                setJobTitle(jobData.title ?? null);
                setJobDeadline((jobData as any).deadline ?? null);
                setJobCategory(jobData.category ?? null);
            }

            if (deliveryData && typeof deliveryData === 'object' && 'id' in deliveryData) {
                setLatestDelivery(deliveryData as LatestDelivery);
            } else {
                setLatestDelivery(null);
            }

            setHasReviewed(Boolean(reviewData?.id));

            if (convData?.id) {
                const [revMsgRes, messagesRes] = await Promise.all([
                    supabase
                        .from('messages')
                        .select('content')
                        .eq('conversation_id', convData.id)
                        .eq('message_type', 'feedback')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle(),
                    supabase
                        .from('messages')
                        .select('id, sender_id, attachments, created_at')
                        .eq('conversation_id', convData.id)
                        .not('attachments', 'is', null)
                        .order('created_at', { ascending: false })
                        .limit(50)
                ]);

                if (revMsgRes.data?.content) {
                    setLastRevisionNote(revMsgRes.data.content.replace(/^Changes requested:\s*/i, '').trim());
                } else {
                    setLastRevisionNote('');
                }

                const files: SharedFile[] = [];
                const seen = new Set<string>();
                for (const msg of messagesRes.data ?? []) {
                    for (const [i, att] of (Array.isArray(msg.attachments) ? msg.attachments : []).entries()) {
                        if (!att?.url) continue;
                        const key = `${att.url}|${att.name ?? ''}`;
                        if (seen.has(key)) continue;
                        seen.add(key);
                        files.push({
                            id: `${msg.id}-${i}`,
                            name: att.name ?? 'Attachment',
                            url: att.url as string,
                            type: att.type ?? null,
                            size: att.size ?? null,
                            uploadedAt: msg.created_at ?? null,
                            senderName: msg.sender_id === user.id ? (profile?.full_name || 'You') : 'Counterparty',
                        });
                        if (files.length >= 12) break;
                    }
                    if (files.length >= 12) break;
                }
                setSharedFiles(files);
            } else {
                setLastRevisionNote('');
                setSharedFiles([]);
            }

        } catch (err) {
            console.error('[ContractWorkspacePage] Failed to load:', err);
            setError(tx('contractWorkspace.loadError', {}, 'Failed to load contract details. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    }, [contractId, user?.id, profile?.full_name]);

    useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

    // ─── Real-time contract status subscription ──────────────────────────────
    useEffect(() => {
        if (!resolvedContractId) return;
        const channel = supabase
            .channel(`contract-watch:${resolvedContractId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'contracts',
                filter: `id=eq.${resolvedContractId}`,
            }, () => {
                void loadWorkspace();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [resolvedContractId, loadWorkspace]);

    const contractSidebarData = useMemo(() => {
        if (!contract) return null;
        const resolvedTitle = (typeof contract.title === 'string' && contract.title.trim() ? contract.title.trim() : null) ?? jobTitle ?? 'Contract';
        const latestAssets = latestDelivery?.assets ?? [];
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
        const deliveryLinks = latestDelivery?.links ?? [];
        const reviewFilesOnly = deliveryFiles.filter(f => f.assetKind === 'review_asset');
        const finalFilesOnly = deliveryFiles.filter(f => f.assetKind === 'final_asset');
        const visibleFinalFiles = finalFilesOnly;
        const selfProfile = { full_name: profile?.full_name || 'You', avatar_url: profile?.avatar_url ?? null };
        return {
            amount: contract.total_amount ?? contract.amount ?? 0,
            revisionRequestsCount: contract.revision_requests_count ?? 0,
            maxRevisionRounds: contract.max_revision_rounds ?? 2,
            fundedAt: contract.funded_at ?? null,
            escrowFunded: Boolean(contract.funded_at),
            deliverySubmittedAt: contract.delivery_submitted_at ?? null,
            reviewDueAt: contract.review_due_at ?? latestDelivery?.review_due_at ?? null,
            reviewFiles: reviewFilesOnly,
            finalFiles: visibleFinalFiles,
            deliveryLinks: deliveryLinks,
            lockedFinalFilesCount: finalFilesOnly.filter(f => f.accessState === 'locked').length,
            job: { title: resolvedTitle, deadline: jobDeadline },
            lastRevisionNote,
            milestones: contract.milestones || [],
            sharedFiles,
            client: userRole === 'client' ? selfProfile : counterpartyProfile,
            freelancer: userRole === 'freelancer' ? selfProfile : counterpartyProfile,
            escrowPendingClearanceUntil: contract.escrow_pending_clearance_until ?? null,
            escrowHoldDisputed: contract.escrow_hold_disputed ?? false,
            paymentStatus: contract.payment_status ?? null,
        };
    }, [contract, jobTitle, jobDeadline, latestDelivery, sharedFiles, lastRevisionNote, userRole, profile, counterpartyProfile]);


    // ─── Activity events synthesized from contract timestamps ─────────────────
    const activityEvents = useMemo<ContractActivityEvent[]>(() => {
        if (!contract) return [];
        const events: ContractActivityEvent[] = [];
        if (contract.funded_at) {
            events.push({ id: 'funded', text: 'Escrow funded — work can begin', timestamp: contract.funded_at, actorRole: 'client', kind: 'payment' });
        }
        if (contract.delivery_submitted_at) {
            events.push({ id: 'delivered', text: 'Work delivered for review', timestamp: contract.delivery_submitted_at, actorRole: 'freelancer', kind: 'delivery' });
        }
        if (contract.review_due_at) {
            events.push({ id: 'review-due', text: `Review due by ${new Date(contract.review_due_at).toLocaleDateString()}`, timestamp: contract.review_due_at, actorRole: 'system', kind: 'system', system: true });
        }
        if ((contract.revision_requests_count ?? 0) > 0) {
            events.push({ id: 'revision', text: `Revision requested (${contract.revision_requests_count}/${contract.max_revision_rounds ?? 2})`, timestamp: null, actorRole: 'client', kind: 'revision' });
        }
        return events.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
    }, [contract]);

    // ─── Contract action hook ────────────────────────────────────────────────
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
        canCancel,
    } = useContractState({
        contractId: resolvedContractId,
        userId: user?.id ?? '',
        userRole,
        contract: contract as any,
        setContract: setContract as any,
    });

    const isActionLoading = isDelivering || isAccepting || isDisputing || isCancelling;

    // ─── Navigation helpers ──────────────────────────────────────────────────
    const handleGoBack = () => { if (window.history.length > 1) navigate(-1); else navigate(ROUTES.messages); };
    const handleGoToMessages = () => {
        if (!resolvedContractId) { navigate(ROUTES.messages); return; }
        navigate(`${ROUTES.messages}?contract=${encodeURIComponent(resolvedContractId)}`);
    };

    // ─── Action handlers (real RPCs) ─────────────────────────────────────────
    const handleDeliver = (milestoneId?: string) => {
        setDeliverNote('');
        setReviewFiles([]);
        // Reset both ref and state when starting a fresh delivery
        uploadedAssetsRef.current = [];
        setUploadedAssets([]);
        setUploadProgress({ current: 0, total: 0, currentBytes: 0, totalBytes: 0 });
        if (milestoneId && typeof milestoneId === 'string') {
            setSelectedMilestoneId(milestoneId);
        } else {
            setSelectedMilestoneId('');
        }
        setDeliverOpen(true);
        setTimeout(() => deliverTextareaRef.current?.focus(), 60);
    };


    const addDeliveryFiles = (newFiles: File[]) => {
        const validFiles = newFiles.filter(file => {
            if (file.size > 1000 * 1024 * 1024) {
                showToast(`File "${file.name}" exceeds 1GB limit.`, 'error');
                return false;
            }
            return true;
        });
        setReviewFiles(prev => [...prev, ...validFiles]);
    };

    const handleSubmitDelivery = async (links: Array<any> = [], fileStages: Record<number, 'review' | 'final'> = {}) => {
        const hasReview = reviewFiles.some((_, idx) => fileStages[idx] === 'review') || links.some(l => l.link_kind === 'review_link');
        const hasFinal = reviewFiles.some((_, idx) => fileStages[idx] === 'final') || links.some(l => l.link_kind === 'final_link');
        if (!hasReview || !hasFinal) {
            showToast('Please provide deliverables for both review and final hand-off phases.', 'error');
            return;
        }

        setSavedLinks(links);
        setSavedFileStages(fileStages);
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
                    currentBytes: prev.currentBytes + file.size 
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

            // Use the ref as the source of truth for resume continuity
            const completedCount = uploadedAssetsRef.current.length;
            const completedBytes = uploadedAssetsRef.current.reduce((sum, a) => sum + Number(a.size_bytes), 0);

            setUploadProgress({
                current: completedCount,
                total: totalFiles,
                currentBytes: completedBytes,
                totalBytes
            });

            const reviewAssets = [...uploadedAssetsRef.current.filter(a => a.stage === 'review')];
            const finalAssets = [...uploadedAssetsRef.current.filter(a => a.stage === 'final')];

            for (let idx = completedCount; idx < reviewFiles.length; idx++) {
                const file = reviewFiles[idx];
                const stage = fileStages[idx] || 'review';
                setUploadingFileName(file.name);
                
                try {
                    const asset = await uploadFile(file, stage);
                    const assetWithStage = { ...asset, stage };

                    // Mutate the ref (safe — not a render trigger), then sync state for display
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
            await loadWorkspace();
            showToast(tx('contractWorkspace.deliverySubmitted', {}, 'Delivery submitted! The client will review your work.'), 'success');
        } catch (err) {
            setIsUploading(false);
            showToast((err as Error).message || tx('contractWorkspace.deliveryFailed', {}, 'Failed to submit delivery.'), 'error');
        }
    };

    const handleAcceptAndPay = () => {
        setConfirmReleaseOpen(true);
    };

    const handleConfirmRelease = async () => {
        setConfirmReleaseOpen(false);
        try {
            await acceptWork();
            await loadWorkspace();
            showToast(tx('contractWorkspace.paymentReleased', {}, 'Payment released and contract completed.'), 'success');
        } catch (err) {
            // Surface the real error reason, not just the generic fallback
            const rawMsg = err instanceof Error ? err.message : String(err);
            // Map internal error keys to user-friendly messages
            const friendlyMessages: Record<string, string> = {
                'payment.releaseFailed': 'Payment release failed. Please try again or contact support.',
                'payment.noResponse': 'No response from payment gateway. Please try again.',
                'payment.sessionFailed': 'Payment session error. Please refresh and try again.',
                'Invalid status transition': 'This contract is not in a state that allows payment release.',
                'Work must be delivered': 'Work must be submitted before payment can be released.',
            };
            const friendlyMsg = Object.entries(friendlyMessages).find(([key]) => rawMsg.includes(key))?.[1]
                ?? rawMsg
                ?? tx('contractWorkspace.releaseFailed', {}, 'Failed to release payment.');
            showToast(friendlyMsg, 'error');
            logger.error('[handleConfirmRelease] Payment release failed:', rawMsg);
        }
    };

    const handleRequestChanges = () => {
        setChangesOpen(true);
    };

    const handleSubmitChanges = async (note: string) => {
        try {
            await requestChanges(note);
            setChangesOpen(false);
            await loadWorkspace();
            showToast(tx('contractWorkspace.revisionRequested', {}, 'Revision requested. The freelancer has been notified.'), 'success');
        } catch (err) {
            showToast((err as Error).message || tx('contractWorkspace.revisionFailed', {}, 'Failed to request revision.'), 'error');
        }
    };

    const handleOpenDispute = () => {
        setDisputeOpen(true);
    };

    const handleSubmitDispute = async (reason: string) => {
        try {
            await openDispute(reason);
            setDisputeOpen(false);
            await loadWorkspace();
            showToast(tx('contractWorkspace.disputeOpened', {}, 'Dispute opened. Our team will review the case.'), 'info');
        } catch (err) {
            showToast((err as Error).message || tx('contractWorkspace.disputeFailed', {}, 'Failed to open dispute.'), 'error');
        }
    };

    const handleHoldClearance = () => {
        setHoldClearanceOpen(true);
        setHoldClearanceReason('');
    };

    const handleSubmitHoldClearance = async (reason: string) => {
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
    };

    const handleCancel = () => {
        setCancelOpen(true);
    };

    const handleSubmitCancel = async (reason: string) => {
        try {
            await cancelContract(reason);
            setCancelOpen(false);
            await loadWorkspace();
            showToast('Contract cancelled successfully.', 'success');
        } catch (err) {
            showToast((err as Error).message || 'Failed to cancel contract.', 'error');
        }
    };

    const jobTitle_ = contractSidebarData?.job?.title;

    return (
        <div className="flex h-[100dvh] flex-col bg-[var(--color-bg-base)] overflow-hidden">
            <Header />

            {/* Clean border line */}
            {!isLoading && !error ? (
                <div className="shrink-0 h-px w-full bg-zinc-800" />
            ) : null}

            <main className="flex-1 flex flex-col overflow-y-auto relative">
                {isLoading ? (
                    <div className="mx-auto w-full max-w-5xl px-4 py-6">
                        <WorkspaceSkeleton />
                    </div>
                ) : error ? (
                    <div className="flex min-h-[60vh] items-center justify-center px-4">
                        <div className="max-w-sm space-y-5 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                                <AlertCircle className="h-7 w-7 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)]">{tx('contractWorkspace.unableToLoad', {}, 'Unable to load workspace')}</h2>
                                <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{error}</p>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button type="button" onClick={() => void loadWorkspace()}
                                    className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--workspace-primary)] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--workspace-primary-hover)]">
                                    {tx('common.retry', {}, 'Retry')}
                                </button>
                                <button type="button" onClick={handleGoBack}
                                    className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-muted)]">
                                    <ArrowLeft className="h-4 w-4" /> {tx('common.goBack', {}, 'Go back')}
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
                        onOpenSharedFile={async (file) => {
                            const bucket = (file as any).storageBucket || 'contract-files';
                            const path = (file as any).storagePath || '';
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
                                console.error('[ContractWorkspacePage] File open failed:', err);
                            }
                        }}
                        onRequestChanges={handleRequestChanges}
                        onAcceptAndPay={handleAcceptAndPay}
                        onDispute={handleOpenDispute}
                        onCancel={handleCancel}
                        onFundEscrow={() => setFundEscrowOpen(true)}
                        onReview={() => { if (resolvedContractId) navigate(`/contracts/${resolvedContractId}/review`); }}
                        hasLeftReview={hasReviewed}
                        onGoBack={handleGoBack}
                        onGoToMessages={handleGoToMessages}
                        onHoldClearance={handleHoldClearance}
                        onAcceptMilestone={async (milestoneId) => {
                            try {
                                await acceptMilestoneWork(milestoneId);
                                showToast('Milestone payment released.', 'success');
                                await loadWorkspace();
                            } catch (err) {
                                showToast((err as Error).message || 'Failed to release milestone payment.', 'error');
                            }
                        }}
                        onHoldMilestoneClearance={(milestoneId) => {
                            setSelectedMilestoneId(milestoneId);
                            setHoldClearanceOpen(true);
                        }}
                    />
                ) : null}
            </main>

            {/* ─── Fund Escrow Modal ───────────────────────────────────────── */}
            {fundEscrowOpen && contract ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Fund escrow" onClick={() => setFundEscrowOpen(false)}>
                    <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">Fund escrow</p>
                            <button type="button" onClick={() => setFundEscrowOpen(false)}
                                className="rounded-[8px] border border-white/[0.07] bg-[#161719] p-1.5 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <FundEscrow
                            contract={{
                                id: contract.id,
                                client_id: contract.client_id ?? '',
                                freelancer_id: contract.freelancer_id ?? '',
                                budget: contract.amount ?? 0,
                                funded_at: contract.funded_at,
                            }}
                            onSuccess={() => { setFundEscrowOpen(false); void loadWorkspace(); }}
                            onError={() => setFundEscrowOpen(false)}
                        />
                    </div>
                </div>
            ) : null}

            {/* ─── Request Changes Modal ────────────────────────────────────── */}
            <RequestChangesModal
                isOpen={changesOpen}
                onClose={() => setChangesOpen(false)}
                onSubmit={handleSubmitChanges}
            />

            {/* ─── Open Dispute Modal ───────────────────────────────────────── */}
            <OpenDisputeModal
                isOpen={disputeOpen}
                onClose={() => setDisputeOpen(false)}
                onSubmit={handleSubmitDispute}
            />

            {/* ─── Cancel Contract Modal ──────────────────────────────────── */}
            <CancelContractModal
                isOpen={cancelOpen}
                onClose={() => setCancelOpen(false)}
                onSubmit={handleSubmitCancel}
                escrowFunded={Boolean(contract?.funded_at)}
            />

            {/* ─── Submit Delivery Modal ───────────────────────────────────── */}
            {deliverOpen ? (
                <div 
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" 
                    role="dialog" 
                    aria-modal="true" 
                    aria-labelledby="modal-deliver-title"
                    onClick={() => setDeliverOpen(false)}
                >
                    <div 
                        className="w-full max-w-lg rounded-[14px] border border-white/[0.08] bg-[#111113] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)] max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <SubmitDeliveryForm
                            deliveryNote={deliverNote}
                            files={reviewFiles}
                            isSubmitting={isDelivering || isUploading || isTusUploading}
                            submitLabel={currentStatus === 'revision_requested' ? 'Resubmit delivery' : 'Submit delivery'}
                            submittingLabel="Submitting delivery..."
                            uploadProgressLabel={isUploading
                                ? isTusUploading
                                    ? `Uploading ${uploadingFileName} (${tusProgress}%)...`
                                    : `Uploading ${(uploadProgress.currentBytes / 1024 / 1024).toFixed(1)}MB / ${(uploadProgress.totalBytes / 1024 / 1024).toFixed(1)}MB...`
                                : null}
                            textareaRef={deliverTextareaRef}
                            onNoteChange={setDeliverNote}
                            onAddFiles={addDeliveryFiles}
                            onRemoveFile={(index) => setReviewFiles(prev => prev.filter((_, fileIndex) => fileIndex !== index))}
                            onSubmit={(links, fileStages) => void handleSubmitDelivery(links, fileStages)}
                            onCancel={() => {
                                setDeliverOpen(false);
                                setReviewFiles([]);
                                setUploadedAssets([]);
                                setSelectedMilestoneId('');
                            }}
                            jobCategory={jobCategory}
                            milestones={contract?.milestones}
                            selectedMilestoneId={selectedMilestoneId}
                            onMilestoneChange={setSelectedMilestoneId}
                            isUploadPaused={isUploadPaused}
                            onPauseUpload={handlePauseUpload}
                            onResumeUpload={handleResumeUpload}
                            uploadProgress={uploadProgress}
                            uploadingFileName={uploadingFileName}
                            tusProgress={tusProgress}
                        />
                    </div>
                </div>
            ) : null}

            {/* ─── Confirm Release Payment Modal ──────────────────────────── */}
            {confirmReleaseOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="modal-release-title" onClick={() => setConfirmReleaseOpen(false)}>
                    <div className="w-full max-w-md rounded-[14px] border border-zinc-800 bg-[#111113] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]" onClick={e => e.stopPropagation()}>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                                <PackageCheck className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Release payment</p>
                                <h2 id="modal-release-title" className="text-[16px] font-semibold text-[var(--color-text-primary)]">Approve & release funds?</h2>
                            </div>
                        </div>
                        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                            <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                                This will release the escrowed funds to the freelancer and mark the contract as completed. <strong className="text-[var(--color-text-primary)]">This action cannot be undone.</strong>
                            </p>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setConfirmReleaseOpen(false)} disabled={isAccepting}
                                className="rounded-full border border-zinc-700 bg-transparent px-4 py-2 text-[14px] font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-40">
                                Cancel
                            </button>
                            <button type="button" onClick={() => void handleConfirmRelease()} disabled={isAccepting}
                                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-[14px] font-semibold text-white transition-colors disabled:opacity-50">
                                {isAccepting ? 'Releasing…' : 'Approve & release'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* ─── Hold Clearance Payment Modal ──────────────────────────── */}
            {holdClearanceOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="modal-hold-title" onClick={() => setHoldClearanceOpen(false)}>
                    <div className="w-full max-w-md rounded-[14px] border border-zinc-800 bg-[#111113] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]" onClick={e => e.stopPropagation()}>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Hold escrow clearance</p>
                                <h2 id="modal-hold-title" className="text-[16px] font-semibold text-[var(--color-text-primary)]">Suspend payment release?</h2>
                            </div>
                        </div>
                        <div className="mb-4">
                            <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)] mb-3">
                                Suspending payment clearance will stop the automatic 48-hour release timer and open a dispute review. Please explain what issues you found in the deliverables (e.g. broken repositories, incorrect credentials, missing source files).
                            </p>
                            <textarea
                                value={holdClearanceReason}
                                onChange={(e) => setHoldClearanceReason(e.target.value)}
                                placeholder="Describe the issues in detail..."
                                rows={4}
                                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-[13px] text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                            />
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setHoldClearanceOpen(false)} disabled={isHoldingClearance}
                                className="rounded-full border border-zinc-700 bg-transparent px-4 py-2 text-[14px] font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-40">
                                Cancel
                            </button>
                            <button type="button" onClick={() => void handleSubmitHoldClearance(holdClearanceReason)} disabled={isHoldingClearance || !holdClearanceReason.trim()}
                                className="inline-flex items-center gap-2 rounded-full bg-red-600 hover:bg-red-500 px-5 py-2 text-[14px] font-semibold text-white transition-colors disabled:opacity-50">
                                {isHoldingClearance ? 'Holding…' : 'Suspend & report issue'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
