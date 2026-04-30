import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, MessageSquare, Users } from 'lucide-react';
import { Header } from '../components/layout';
import ContractDetailsSidebar, { type ContractActivityEvent } from '@/components/contracts/ContractDetailsSidebar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { normalizeContractStatus } from '../lib/messagingLifecycle';
import { ROUTES } from '@/lib/routes';

// ─── Types ───────────────────────────────────────────────────────────────────

type ContractRow = {
    id: string;
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

    const [contract, setContract] = useState<ContractRow | null>(null);
    const [jobTitle, setJobTitle] = useState<string | null>(null);
    const [jobDeadline, setJobDeadline] = useState<string | null>(null);
    const [latestDelivery, setLatestDelivery] = useState<LatestDelivery | null>(null);
    const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const deliverySubmitted = Boolean(
        latestDelivery?.submitted_at || contract?.delivery_submitted_at,
    );

    // Role-aware accent colors for the breadcrumb bar
    const roleAccent = userRole === 'client'
        ? { badge: 'border-[#E8A020]/60 bg-[#E8A020]/10 text-[#E8A020]', stripe: 'from-[#E8A020]/15', label: 'Client view' }
        : { badge: 'border-[#9B8FF0]/60 bg-[#9B8FF0]/10 text-[#9B8FF0]', stripe: 'from-[#9B8FF0]/12', label: 'Freelancer view' };

    const loadWorkspace = useCallback(async () => {
        if (!contractId || !user?.id) return;
        setIsLoading(true);
        setError(null);

        try {
            // ── 1. Load contract row ──
            let { data: contractData, error: contractError } = await supabase
                .from('contracts')
                .select(
                    'id, status, title, amount, total_amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id',
                )
                .eq('id', contractId)
                .maybeSingle();

            if (contractError && String(contractError.message).includes('total_amount')) {
                const { data: legacyData, error: legacyError } = await supabase
                    .from('contracts')
                    .select(
                        'id, status, title, amount, revision_requests_count, max_revision_rounds, funded_at, delivery_submitted_at, review_due_at, client_id, freelancer_id, job_id',
                    )
                    .eq('id', contractId)
                    .maybeSingle();
                contractData = legacyData as ContractRow | null;
                contractError = legacyError;
            }

            if (contractError) throw contractError;
            if (!contractData) { setError('Contract not found or you do not have access.'); return; }
            if (contractData.client_id !== user.id && contractData.freelancer_id !== user.id) {
                setError('You are not a participant in this contract.'); return;
            }

            setContract(contractData as ContractRow);

            // ── 2. Load job title + deadline ──
            if (contractData.job_id) {
                const { data: jobData } = await supabase
                    .from('jobs').select('title, deadline').eq('id', contractData.job_id).maybeSingle();
                if (jobData) {
                    setJobTitle(jobData.title ?? null);
                    setJobDeadline((jobData as any).deadline ?? null);
                }
            }

            // ── 3. Latest delivery ──
            const { data: deliveryData, error: deliveryError } = await supabase.rpc(
                'get_latest_contract_delivery', { p_contract_id: contractId },
            );
            if (!deliveryError && deliveryData && typeof deliveryData === 'object' && 'id' in deliveryData) {
                setLatestDelivery(deliveryData as LatestDelivery);
            }

            // ── 4. Review status ──
            const { data: reviewData } = await supabase
                .from('reviews').select('id')
                .eq('contract_id', contractId).eq('reviewer_id', user.id).maybeSingle();
            setHasReviewed(Boolean(reviewData?.id));

            // ── 5. Shared files from conversation messages ──
            const { data: convData } = await supabase
                .from('conversations').select('id').eq('contract_id', contractId).limit(1).maybeSingle();

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
            setError('Failed to load contract details. Please try again.');
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

    const activityEvents = useMemo<ContractActivityEvent[]>(() => [], []);

    const handleGoBack = () => { if (window.history.length > 1) navigate(-1); else navigate(ROUTES.messages); };
    const handleGoToMessages = () => {
        if (!contractId) { navigate(ROUTES.messages); return; }
        navigate(`${ROUTES.messages}?contract=${encodeURIComponent(contractId)}`);
    };
    const redirectToMessages = (message: string) => { showToast(message, 'info'); handleGoToMessages(); };

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
                    Back
                </button>

                <div className="h-3.5 w-px bg-white/[0.08]" />

                <button type="button" onClick={handleGoToMessages}
                    className="inline-flex items-center gap-1.5 text-[13px] text-[#55534F] transition-colors hover:text-[#F0EFE8]">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Messages
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
                                <h2 className="text-[18px] font-semibold text-[#F0EFE8]">Unable to load workspace</h2>
                                <p className="mt-1.5 text-[14px] leading-relaxed text-[#8A8880]">{error}</p>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button type="button" onClick={() => void loadWorkspace()}
                                    className="inline-flex items-center gap-2 rounded-[10px] bg-[#1D9E75] px-4 py-2.5 text-[14px] font-semibold text-[#F0EFE8] transition-colors hover:bg-[#24b889]">
                                    Retry
                                </button>
                                <button type="button" onClick={handleGoBack}
                                    className="inline-flex items-center gap-2 rounded-[10px] border border-white/[0.07] bg-[#161719] px-4 py-2.5 text-[14px] font-medium text-[#8A8880] transition-colors hover:text-[#F0EFE8]">
                                    <ArrowLeft className="h-4 w-4" /> Go back
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
                                isActionLoading={false}
                                activityEvents={activityEvents}
                                onDeliver={() => redirectToMessages('Open this contract in Messages to deliver work.')}
                                onRequestChanges={() => redirectToMessages('Open this contract in Messages to request changes.')}
                                onAcceptAndPay={() => redirectToMessages('Open this contract in Messages to release payment.')}
                                onDispute={() => redirectToMessages('Open this contract in Messages to open a dispute.')}
                                onReview={() => { if (contractId) navigate(`/contracts/${contractId}/review`); }}
                                hasLeftReview={hasReviewed}
                            />
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}
