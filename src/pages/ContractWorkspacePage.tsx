import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, MessageSquare, Users, PackageCheck, GitPullRequest, ShieldAlert, X, Upload, Paperclip, Trash2, XCircle, Loader2 } from 'lucide-react';
import { Header } from '../components/layout';
import ContractDetailsSidebar, { type ContractActivityEvent } from '@/components/contracts/ContractDetailsSidebar';
import { RequestChangesModal, OpenDisputeModal, CancelContractModal } from '../components/contracts/ContractModals';
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
    const [latestDelivery, setLatestDelivery] = useState<LatestDelivery | null>(null);
    const [lastRevisionNote, setLastRevisionNote] = useState<string | null>(null);
    const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [counterpartyProfile, setCounterpartyProfile] = useState<{ full_name: string; avatar_url: string | null }>({ full_name: '', avatar_url: null });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ─── Action modal state ───────────────────────────────────────────────────
    const [deliverOpen, setDeliverOpen] = useState(false);
    const [deliverNote, setDeliverNote] = useState('');
    const [changesOpen, setChangesOpen] = useState(false);
    const [disputeOpen, setDisputeOpen] = useState(false);
    const [fundEscrowOpen, setFundEscrowOpen] = useState(false);
    const [confirmReleaseOpen, setConfirmReleaseOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [reviewFiles, setReviewFiles] = useState<File[]>([]);
    const [finalFiles, setFinalFiles] = useState<File[]>([]);
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

            // ── Fetch counterparty profile ──
            const cpRole = contractData.client_id === user.id ? 'freelancer' : 'client';
            const counterpartyId = cpRole === 'freelancer' ? contractData.freelancer_id : contractData.client_id;
            if (counterpartyId) {
                try {
                    const { data: cpData } = await supabase
                        .from('public_profiles')
                        .select('full_name, avatar_url')
                        .eq('id', counterpartyId)
                        .maybeSingle();
                    if (cpData) {
                        setCounterpartyProfile({
                            full_name: cpData.full_name || (cpRole === 'freelancer' ? 'Freelancer' : 'Client'),
                            avatar_url: cpData.avatar_url ?? null,
                        });
                    } else {
                        setCounterpartyProfile({ full_name: cpRole === 'freelancer' ? 'Freelancer' : 'Client', avatar_url: null });
                    }
                } catch (e) {
                    console.warn('[ContractWorkspacePage] Failed to load counterparty profile:', e);
                    setCounterpartyProfile({ full_name: cpRole === 'freelancer' ? 'Freelancer' : 'Client', avatar_url: null });
                }
            }

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

            // ── 5. Shared files and revision notes from conversation ──
            const { data: convData } = await supabase
                .from('conversations').select('id').eq('contract_id', realId).limit(1).maybeSingle();

            if (convData?.id) {
                const { data: revMsgData } = await supabase
                    .from('messages')
                    .select('content')
                    .eq('conversation_id', convData.id)
                    .eq('message_type', 'feedback')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (revMsgData?.content) {
                    setLastRevisionNote(revMsgData.content.replace(/^Changes requested:\s*/i, '').trim());
                }

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
            lastRevisionNote,
            milestones: [],
            sharedFiles,
            client: userRole === 'client' ? selfProfile : counterpartyProfile,
            freelancer: userRole === 'freelancer' ? selfProfile : counterpartyProfile,
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
        acceptWork,
        requestChanges,
        openDispute,
        cancelContract,
        isDelivering,
        isAccepting,
        isDisputing,
        isCancelling,
        canCancel,
    } = useContractState({
        contractId: resolvedContractId,
        userId: user?.id ?? '',
        userRole,
    });

    const isActionLoading = isDelivering || isAccepting || isDisputing || isCancelling;

    // ─── Navigation helpers ──────────────────────────────────────────────────
    const handleGoBack = () => { if (window.history.length > 1) navigate(-1); else navigate(ROUTES.messages); };
    const handleGoToMessages = () => {
        if (!resolvedContractId) { navigate(ROUTES.messages); return; }
        navigate(`${ROUTES.messages}?contract=${encodeURIComponent(resolvedContractId)}`);
    };

    // ─── Action handlers (real RPCs) ─────────────────────────────────────────
    const handleDeliver = () => {
        setDeliverNote('');
        setReviewFiles([]);
        setFinalFiles([]);
        setUploadProgress({ current: 0, total: 0, currentBytes: 0, totalBytes: 0 });
        setDeliverOpen(true);
        setTimeout(() => deliverTextareaRef.current?.focus(), 60);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isFinal: boolean) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        const validFiles = newFiles.filter(file => {
            if (file.size > 100 * 1024 * 1024) {
                showToast(`File "${file.name}" exceeds 100MB limit.`, 'error');
                return false;
            }
            return true;
        });
        if (isFinal) {
            setFinalFiles(prev => [...prev, ...validFiles]);
        } else {
            setReviewFiles(prev => [...prev, ...validFiles]);
        }
        e.target.value = '';
    };

    const handleSubmitDelivery = async () => {
        if (!deliverNote.trim()) return;
        if (reviewFiles.length === 0) { showToast('At least one review file (preview) is required.', 'error'); return; }
        if (finalFiles.length === 0) { showToast('At least one final file is required.', 'error'); return; }

        setIsUploading(true);
        try {
            const uid = user?.id;
            const cid = resolvedContractId;
            if (!uid || !cid) throw new Error('Missing user or contract ID');

            const uploadFile = async (file: File, kind: 'review' | 'final') => {
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const path = `${uid}/${cid}/submissions/${kind}/${Date.now()}_${safeName}`;
                const { error: uploadErr } = await supabase.storage.from('contract-files').upload(path, file, { upsert: false });
                if (uploadErr) throw new Error(`Upload failed for ${file.name}: ${uploadErr.message}`);
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

            const totalFiles = reviewFiles.length + finalFiles.length;
            const totalBytes = [...reviewFiles, ...finalFiles].reduce((sum, f) => sum + f.size, 0);
            setUploadProgress({ current: 0, total: totalFiles, currentBytes: 0, totalBytes });

            // Upload sequentially or in small batches if total files are many.
            // Using a simple loop to update progress reliably
            const reviewAssets = [];
            for (const f of reviewFiles) reviewAssets.push(await uploadFile(f, 'review'));
            
            const finalAssets = [];
            for (const f of finalFiles) finalAssets.push(await uploadFile(f, 'final'));

            setIsUploading(false);
            await deliverWork(deliverNote.trim(), reviewAssets, finalAssets);
            setDeliverOpen(false);
            setDeliverNote('');
            setReviewFiles([]);
            setFinalFiles([]);
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
            showToast(tx('contractWorkspace.paymentReleased', {}, 'Payment released! Final files are now unlocked.'), 'success');
        } catch (err) {
            showToast((err as Error).message || tx('contractWorkspace.releaseFailed', {}, 'Failed to release payment.'), 'error');
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

            {/* Role-colored gradient line */}
            {!isLoading && !error ? (
                <div className={`shrink-0 h-[2px] w-full bg-gradient-to-r ${roleAccent.stripe} to-transparent`} />
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
                                escrow_funded: contract.escrow_funded === true,
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
                escrowFunded={contract?.escrow_funded === true}
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
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#9B8FF0]/15">
                                <PackageCheck className="h-5 w-5 text-[#9B8FF0]" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Submit delivery</p>
                                <h2 id="modal-deliver-title" className="text-[16px] font-semibold text-[var(--color-text-primary)]">Package your delivery</h2>
                            </div>
                        </div>
                        <textarea
                            ref={deliverTextareaRef}
                            value={deliverNote}
                            onChange={e => setDeliverNote(e.target.value)}
                            placeholder="Describe what you've completed, any important notes for the client…"
                            rows={3}
                            className="w-full resize-none rounded-[10px] border border-white/[0.08] bg-[var(--color-bg-base)] px-4 py-3 text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[#9B8FF0]/60 focus:outline-none focus:ring-1 focus:ring-[#9B8FF0]/40"
                        />

                        {/* Review Files Upload */}
                        <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#9B8FF0]">Review files <span className="text-[var(--color-text-tertiary)] font-normal normal-case">— client sees immediately</span></p>
                                <span className="text-[11px] text-[var(--color-text-tertiary)]">{reviewFiles.length} file{reviewFiles.length !== 1 ? 's' : ''}</span>
                            </div>
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#9B8FF0]/30 bg-[#9B8FF0]/5 px-4 py-4 transition-colors hover:border-[#9B8FF0]/50 hover:bg-[#9B8FF0]/10">
                                <Upload className="h-5 w-5 text-[#9B8FF0]/60" />
                                <span className="text-[13px] text-[var(--color-text-secondary)]">Drop previews, screenshots, watermarked versions</span>
                                <span className="text-[11px] text-[var(--color-text-tertiary)]">Max 100 MB per file · any type</span>
                                <input type="file" multiple className="hidden" onChange={e => handleFileSelect(e, false)} />
                            </label>
                            {reviewFiles.length > 0 ? (
                                <ul className="mt-2 space-y-1">
                                    {reviewFiles.map((f, i) => (
                                        <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-[8px] bg-[var(--color-bg-base)] px-3 py-2">
                                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-[#9B8FF0]" />
                                            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-text-primary)]">{f.name}</span>
                                            <span className="shrink-0 text-[11px] text-[var(--color-text-tertiary)]">{(f.size / 1048576).toFixed(1)} MB</span>
                                            <button type="button" onClick={() => setReviewFiles(prev => prev.filter((_, j) => j !== i))} className="shrink-0 text-[var(--color-text-tertiary)] hover:text-red-400">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>

                        {/* Final Files Upload */}
                        <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1D9E75]">Final files <span className="text-[var(--color-text-tertiary)] font-normal normal-case">— locked until payment</span></p>
                                <span className="text-[11px] text-[var(--color-text-tertiary)]">{finalFiles.length} file{finalFiles.length !== 1 ? 's' : ''}</span>
                            </div>
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#1D9E75]/30 bg-[#1D9E75]/5 px-4 py-4 transition-colors hover:border-[#1D9E75]/50 hover:bg-[#1D9E75]/10">
                                <Upload className="h-5 w-5 text-[#1D9E75]/60" />
                                <span className="text-[13px] text-[var(--color-text-secondary)]">Source files, full-res assets, unwatermarked work</span>
                                <span className="text-[11px] text-[var(--color-text-tertiary)]">Max 100 MB per file · stays locked until approval</span>
                                <input type="file" multiple className="hidden" onChange={e => handleFileSelect(e, true)} />
                            </label>
                            {finalFiles.length > 0 ? (
                                <ul className="mt-2 space-y-1">
                                    {finalFiles.map((f, i) => (
                                        <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-[8px] bg-[var(--color-bg-base)] px-3 py-2">
                                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-[#1D9E75]" />
                                            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-text-primary)]">{f.name}</span>
                                            <span className="shrink-0 text-[11px] text-[var(--color-text-tertiary)]">{(f.size / 1048576).toFixed(1)} MB</span>
                                            <button type="button" onClick={() => setFinalFiles(prev => prev.filter((_, j) => j !== i))} className="shrink-0 text-[var(--color-text-tertiary)] hover:text-red-400">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>

                        <div className="mt-3 rounded-[8px] border border-white/[0.05] bg-[var(--color-bg-base)] px-3 py-2">
                            <p className="text-[12px] text-[var(--color-text-tertiary)] leading-relaxed">
                                🛡️ Review files are visible immediately. Final files stay <strong className="text-[var(--color-text-primary)]">locked</strong> until the client approves and releases payment. The client has 3 days to review.
                            </p>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setDeliverOpen(false)} disabled={isDelivering || isUploading}
                                className="rounded-[10px] border border-white/[0.07] bg-[#161719] px-4 py-2 text-[14px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40">
                                Cancel
                            </button>
                            <button type="button" onClick={() => void handleSubmitDelivery()} disabled={isDelivering || isUploading || !deliverNote.trim() || reviewFiles.length === 0 || finalFiles.length === 0}
                                className="inline-flex items-center gap-2 rounded-[10px] bg-[#9B8FF0] px-4 py-2 text-[14px] font-semibold text-[var(--color-bg-base)] transition-colors hover:bg-[#a99cf5] disabled:opacity-50">
                                {isUploading || isDelivering ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {isUploading 
                                    ? `Uploading ${(uploadProgress.currentBytes / 1024 / 1024).toFixed(1)}MB / ${(uploadProgress.totalBytes / 1024 / 1024).toFixed(1)}MB…` 
                                    : isDelivering ? 'Submitting…' : `Submit delivery (${reviewFiles.length + finalFiles.length} files)`}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* ─── Confirm Release Payment Modal ──────────────────────────── */}
            {confirmReleaseOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="modal-release-title" onClick={() => setConfirmReleaseOpen(false)}>
                    <div className="w-full max-w-md rounded-[14px] border border-white/[0.08] bg-[#111113] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]" onClick={e => e.stopPropagation()}>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1D9E75]/15">
                                <PackageCheck className="h-5 w-5 text-[#1D9E75]" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Release payment</p>
                                <h2 id="modal-release-title" className="text-[16px] font-semibold text-[var(--color-text-primary)]">Approve & release funds?</h2>
                            </div>
                        </div>
                        <div className="mb-4 rounded-[10px] border border-[#1D9E75]/20 bg-[#0F6E56]/10 px-4 py-3">
                            <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                                This will release the escrowed funds to the freelancer and unlock all final delivery files. <strong className="text-[var(--color-text-primary)]">This action cannot be undone.</strong>
                            </p>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setConfirmReleaseOpen(false)} disabled={isAccepting}
                                className="rounded-[10px] border border-white/[0.07] bg-[#161719] px-4 py-2 text-[14px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40">
                                Cancel
                            </button>
                            <button type="button" onClick={() => void handleConfirmRelease()} disabled={isAccepting}
                                className="inline-flex items-center gap-2 rounded-[10px] bg-[#1D9E75] px-4 py-2 text-[14px] font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[#24b889] disabled:opacity-50">
                                {isAccepting ? 'Releasing…' : 'Approve & release'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
