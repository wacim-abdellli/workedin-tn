import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle,
    ChevronRight,
    CircleCheck,
    Clock,
    FileArchive,
    FileCheck2,
    FileText,
    FolderOpen,
    GitPullRequest,
    Image,
    Lock,
    MoreHorizontal,
    PackageCheck,
    ShieldAlert,
    Star,
    User,
    Wallet,
} from 'lucide-react';

interface ContractMilestone {
    id?: string | null;
    title?: string | null;
    description?: string | null;
    amount?: number | null;
    status?: string | null;
    due_date?: string | null;
}

interface ContractSharedFile {
    id: string;
    name: string;
    url: string;
    type?: string | null;
    size?: number | string | null;
    uploadedAt?: string | null;
    senderName?: string;
    storageBucket?: string | null;
    storagePath?: string | null;
}

interface ContractDeliveryAsset {
    id: string;
    name: string;
    storagePath: string;
    storageBucket?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
    assetKind: 'review_asset' | 'final_asset';
    accessState: 'preview_available' | 'locked' | 'released';
}

interface ContractSidebarData {
    amount: number | null;
    revisionRequestsCount?: number | null;
    maxRevisionRounds?: number | null;
    fundedAt?: string | null;
    deliverySubmittedAt?: string | null;
    reviewDueAt?: string | null;
    reviewFiles?: ContractDeliveryAsset[];
    finalFiles?: ContractDeliveryAsset[];
    lockedFinalFilesCount?: number;
    job?: { title?: string | null; deadline?: string | null };
    milestones?: ContractMilestone[];
    sharedFiles?: ContractSharedFile[];
    freelancer?: { full_name?: string; avatar_url?: string | null };
    client?: { full_name?: string; avatar_url?: string | null };
}

export interface ContractActivityEvent {
    id: string;
    text: string;
    timestamp?: string | null;
    actorName?: string | null;
    actorRole?: 'client' | 'freelancer' | 'system' | null;
    actorAvatarUrl?: string | null;
    kind?: 'message' | 'delivery' | 'payment' | 'review' | 'revision' | 'dispute' | 'system';
    system?: boolean;
}

interface ContractDetailsSidebarProps {
    contract: ContractSidebarData | null;
    userRole: 'client' | 'freelancer';
    currentStatus: string;
    deliverySubmitted?: boolean;
    isActionLoading?: boolean;
    activityEvents?: ContractActivityEvent[];
    onDeliver: () => void;
    onRequestChanges: () => void;
    onAcceptAndPay: () => void;
    onDispute: () => void;
    onReview: () => void;
    hasLeftReview: boolean;
    onOpenSharedFile?: (file: ContractSharedFile) => void;
}

type WorkspaceTab = 'overview' | 'files' | 'milestones' | 'activity';
type FileFilter = 'all' | 'shared' | 'review' | 'final';

interface WorkspaceModel {
    st: string;
    status: { label: string; tone: string; accent: string; icon: ReactNode };
    milestones: ContractMilestone[];
    reviewFiles: ContractDeliveryAsset[];
    finalFiles: ContractDeliveryAsset[];
    sharedFiles: ContractSharedFile[];
    lockedFinalFilesCount: number;
    completedMilestones: number;
    progressPct: number;
    revLeft: number;
    revMax: number;
    revUsed: number;
    showFreelancerDeliver: boolean;
    showClientReview: boolean;
    showReviewConfirmation: boolean;
    showLeaveReview: boolean;
    canDispute: boolean;
    nextMove: { icon: ReactNode; title: string; body: string; primaryLabel: string | null; tone: string };
    otherParty?: { full_name?: string; avatar_url?: string | null } | null;
    allFileCount: number;
}

const ns = (s: string | null | undefined) => String(s || '').trim().toLowerCase();

const fmtDate = (v: string | null | undefined, fallback = 'No due date') => {
    if (!v) return fallback;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? fallback : d.toLocaleDateString();
};

const fmtTime = (v: string | null | undefined) => {
    if (!v) return '';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fmtSize = (size: number | string | null | undefined) => {
    const b = typeof size === 'string' ? Number(size) : (size ?? 0);
    if (!Number.isFinite(b) || b <= 0) return null;
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
};

const fmtAmount = (amount: number | null | undefined) => {
    const n = Number(amount ?? 0);
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0)} TND`;
};

const surface = 'border-[0.5px] border-[rgba(255,255,255,0.07)] bg-[#161719] rounded-[10px]';
const surfaceHover = 'transition-colors duration-[80ms] hover:border-[rgba(255,255,255,0.12)] hover:bg-[#1a1b1e]';
const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-[#55534F]';
const bodyClass = 'text-[14px] font-normal leading-[1.6] text-[#8A8880]';
const monoClass = 'font-mono text-[13px] text-[#8A8880]';
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0E]';

// Role-aware theme — amber = client (paying), violet = freelancer (delivering)
const roleTheme = (role: 'client' | 'freelancer') => role === 'client'
    ? {
        accent: '#E8A020',        // warm amber
        accentBg: 'bg-[#E8A020]',
        accentText: 'text-[#E8A020]',
        accentBorder: 'border-[#E8A020]',
        accentFill: 'bg-[#3D2A00]/60',
        roleLabel: 'Client',
        roleBadge: 'border-[#E8A020]/60 bg-[#E8A020]/10 text-[#E8A020]',
        headerStripe: 'from-[#E8A020]/20 to-transparent',
        primaryBtn: 'bg-[#E8A020] hover:bg-[#f0aa28] text-[#0D0D0E]',
        focusRingColor: 'focus-visible:ring-[#E8A020]',
        tabAccent: 'bg-[#E8A020]',
    }
    : {
        accent: '#9B8FF0',        // soft violet
        accentBg: 'bg-[#9B8FF0]',
        accentText: 'text-[#9B8FF0]',
        accentBorder: 'border-[#9B8FF0]',
        accentFill: 'bg-[#2D2660]/60',
        roleLabel: 'Freelancer',
        roleBadge: 'border-[#9B8FF0]/60 bg-[#9B8FF0]/10 text-[#9B8FF0]',
        headerStripe: 'from-[#9B8FF0]/15 to-transparent',
        primaryBtn: 'bg-[#9B8FF0] hover:bg-[#a99cf5] text-[#0D0D0E]',
        focusRingColor: 'focus-visible:ring-[#9B8FF0]',
        tabAccent: 'bg-[#9B8FF0]',
    };

const resolveStatus = (status: string) => {
    const st = ns(status);
    if (st === 'active') return { label: 'Active', tone: 'border-[#1D9E75] bg-[#0F6E56]/45 text-[#F0EFE8] animate-[pulse_2s_ease-in-out_infinite]', accent: 'bg-[#1D9E75]', icon: <Clock className="h-3.5 w-3.5" /> };
    if (st === 'delivery_submitted') return { label: 'Review', tone: 'border-[#BA7517] bg-[#633806]/65 text-[#F0EFE8]', accent: 'bg-[#BA7517]', icon: <FileCheck2 className="h-3.5 w-3.5" /> };
    if (st === 'revision_requested') return { label: 'Revision', tone: 'border-[#BA7517] bg-[#633806]/65 text-[#F0EFE8]', accent: 'bg-[#BA7517]', icon: <GitPullRequest className="h-3.5 w-3.5" /> };
    if (st === 'completed') return { label: 'Completed', tone: 'border-[#7F77DD] bg-[#3C3489]/70 text-[#F0EFE8]', accent: 'bg-[#7F77DD]', icon: <CheckCircle className="h-3.5 w-3.5" /> };
    if (st === 'disputed') return { label: 'Disputed', tone: 'border-[#A32D2D] bg-[#501313]/75 text-[#F0EFE8]', accent: 'bg-[#A32D2D]', icon: <ShieldAlert className="h-3.5 w-3.5" /> };
    if (st === 'pending_payment') return { label: 'Pending', tone: 'border-[#185FA5] bg-[#042C53]/75 text-[#F0EFE8]', accent: 'bg-[#185FA5]', icon: <Wallet className="h-3.5 w-3.5" /> };
    return { label: 'Syncing', tone: 'border-[rgba(255,255,255,0.07)] bg-white/[0.03] text-[#8A8880]', accent: 'bg-[#55534F]', icon: <AlertCircle className="h-3.5 w-3.5" /> };
};

export default function ContractDetailsSidebar({
    contract,
    userRole,
    currentStatus,
    deliverySubmitted = false,
    isActionLoading,
    activityEvents = [],
    onDeliver,
    onRequestChanges,
    onAcceptAndPay,
    onDispute,
    onReview,
    hasLeftReview,
    onOpenSharedFile,
}: ContractDetailsSidebarProps) {
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
    const [fileFilter, setFileFilter] = useState<FileFilter>('all');
    const [previewFile, setPreviewFile] = useState<ContractSharedFile | null>(null);
    const previewCloseRef = useRef<HTMLButtonElement | null>(null);

    const model = useMemo<WorkspaceModel | null>(() => {
        if (!contract) return null;

        const st = ns(currentStatus);
        const milestones = contract.milestones ?? [];
        const reviewFiles = contract.reviewFiles ?? [];
        const rawFinalFiles = contract.finalFiles ?? [];
        const sharedFiles = contract.sharedFiles ?? [];
        const lockedFinalFilesCount = contract.lockedFinalFilesCount ?? rawFinalFiles.filter(file => file.accessState !== 'released').length;
        const finalFiles = userRole === 'client'
            ? rawFinalFiles.filter(file => file.accessState === 'released')
            : rawFinalFiles;
        const completedMilestones = milestones.filter(m => ['completed', 'approved', 'paid'].includes(ns(m.status))).length;
        const progressPct = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : (st === 'completed' ? 100 : 0);
        const revUsed = Number(contract.revisionRequestsCount ?? 0);
        const revMax = Number(contract.maxRevisionRounds ?? 2);
        const revLeft = Math.max(revMax - revUsed, 0);
        const status = resolveStatus(st);
        const isActive = st === 'active';
        const isUnderReview = st === 'delivery_submitted';
        const isRevision = st === 'revision_requested';
        const isPendingPayment = st === 'pending_payment';
        const isCompleted = st === 'completed';
        const showFreelancerDeliver = userRole === 'freelancer' && (isActive || isRevision) && !deliverySubmitted;
        const showClientReview = userRole === 'client' && isUnderReview && deliverySubmitted;
        const showLeaveReview = isCompleted && !hasLeftReview;
        const showReviewConfirmation = isCompleted && hasLeftReview;
        const canDispute = isActive || isUnderReview || isRevision || isPendingPayment;
        const otherParty = userRole === 'client' ? contract.freelancer : contract.client;

        const nextMove = (() => {
            if (showFreelancerDeliver) {
                return {
                    icon: <PackageCheck className="h-5 w-5" />,
                    title: isRevision ? 'Submit revised delivery' : 'Submit delivery',
                    body: 'Attach review files and protected final files. Final assets stay locked until acceptance.',
                    primaryLabel: 'Submit delivery',
                    tone: 'border-l-[1.5px] border-l-[#1D9E75] border-[rgba(255,255,255,0.07)] bg-[#0F6E56]/35 text-[#F0EFE8]',
                };
            }
            if (showClientReview) {
                return {
                    icon: <FileCheck2 className="h-5 w-5" />,
                    title: 'Review submitted work',
                    body: 'Inspect review assets, then approve, request revision, or dispute before releasing payment.',
                    primaryLabel: 'Approve & release',
                    tone: 'border-l-[1.5px] border-l-[#1D9E75] border-[rgba(255,255,255,0.07)] bg-[#0F6E56]/35 text-[#F0EFE8]',
                };
            }
            if (showLeaveReview) {
                return {
                    icon: <Star className="h-5 w-5" />,
                    title: 'Leave a review',
                    body: 'The contract is complete. Add a rating to close the trust loop.',
                    primaryLabel: 'Leave review',
                    tone: 'border-l-[1.5px] border-l-[#1D9E75] border-[rgba(255,255,255,0.07)] bg-[#0F6E56]/35 text-[#F0EFE8]',
                };
            }
            if (isCompleted) {
                return {
                    icon: <CheckCircle className="h-5 w-5" />,
                    title: 'Contract closed',
                    body: 'Payment was released and the thread is read-only. This workspace is now a record.',
                    primaryLabel: null,
                    tone: 'border-l-[1.5px] border-l-[#7F77DD] border-[rgba(255,255,255,0.07)] bg-[#3C3489]/35 text-[#F0EFE8]',
                };
            }
            if (userRole === 'freelancer' && isUnderReview) {
                return {
                    icon: <Clock className="h-5 w-5" />,
                    title: 'Waiting for client review',
                    body: `Final files remain protected. Review due: ${fmtDate(contract.reviewDueAt, 'Not set')}.`,
                    primaryLabel: null,
                    tone: 'border-l-[1.5px] border-l-[#BA7517] border-[rgba(255,255,255,0.07)] bg-[#633806]/35 text-[#F0EFE8]',
                };
            }
            return {
                icon: <Clock className="h-5 w-5" />,
                title: isPendingPayment ? 'Payment pending' : 'No action required',
                body: isPendingPayment ? 'Funding must be confirmed before work begins.' : 'Keep the conversation open while work continues.',
                primaryLabel: null,
                tone: 'border-l-[1.5px] border-l-[rgba(255,255,255,0.12)] border-[rgba(255,255,255,0.07)] bg-[#161719] text-[#8A8880]',
            };
        })();

        return {
            st,
            status,
            milestones,
            reviewFiles,
            finalFiles,
            sharedFiles,
            lockedFinalFilesCount,
            completedMilestones,
            progressPct,
            revLeft,
            revMax,
            revUsed,
            showFreelancerDeliver,
            showClientReview,
            showReviewConfirmation,
            showLeaveReview,
            canDispute,
            nextMove,
            otherParty,
            allFileCount: sharedFiles.length + reviewFiles.length + finalFiles.length + lockedFinalFilesCount,
        };
    }, [contract, currentStatus, deliverySubmitted, hasLeftReview, userRole]);

    useEffect(() => {
        if (!previewFile) return;
        previewCloseRef.current?.focus();
        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') setPreviewFile(null);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [previewFile]);

    if (!contract || !model) return null;

    const tabs: Array<{ id: WorkspaceTab; label: string; icon: ReactNode }> = [
        { id: 'overview', label: 'Overview', icon: <Wallet className="h-4 w-4" /> },
        { id: 'files', label: 'Files', icon: <FolderOpen className="h-4 w-4" /> },
        { id: 'milestones', label: 'Milestones', icon: <GitPullRequest className="h-4 w-4" /> },
        { id: 'activity', label: 'Activity', icon: <Clock className="h-4 w-4" /> },
    ];

    const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
        event.preventDefault();
        const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
            ? tabs.length - 1
            : event.key === 'ArrowRight'
            ? (index + 1) % tabs.length
            : (index - 1 + tabs.length) % tabs.length;
        setActiveTab(tabs[nextIndex].id);
        window.requestAnimationFrame(() => {
            document.getElementById(`contract-workspace-tab-${tabs[nextIndex].id}`)?.focus();
        });
    };

    const openPreview = (file: ContractSharedFile) => {
        setPreviewFile(file);
    };

    const rt = roleTheme(userRole);

    return (
        <div className="min-h-[70vh] bg-[#0D0D0E] text-[#F0EFE8]">
            <style>{`
                @keyframes contractTabIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes pulseRole{0%,100%{opacity:1}50%{opacity:0.6}}
            `}</style>

            {/* Role-colored top stripe */}
            <div className={`h-[3px] w-full bg-gradient-to-r ${rt.headerStripe}`} />

            <header className="sticky top-0 z-30 border-b border-[rgba(255,255,255,0.06)] bg-[#0D0D0E]/96 px-5 py-3.5 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                    {/* Left: avatar + title + status */}
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="relative shrink-0">
                            <PartyAvatar party={model.otherParty} size="lg" />
                            {/* Online dot as role indicator */}
                            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0D0D0E] ${rt.accentBg}`} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <h2 className="truncate text-[16px] font-semibold tracking-[-0.02em] text-[#F0EFE8]">
                                    {contract.job?.title || 'Untitled contract'}
                                </h2>
                                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${model.status.tone}`}>
                                    {model.status.icon}{model.status.label}
                                </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${rt.roleBadge}`}>
                                    {rt.roleLabel}
                                </span>
                                <span className="text-[12px] text-[#55534F]">
                                    with {model.otherParty?.full_name || 'counterparty'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: amount chip + date chip */}
                    <div className="flex shrink-0 items-center gap-2">
                        <div className="hidden flex-col items-end sm:flex">
                            <span className={`text-[18px] font-bold tracking-[-0.02em] ${rt.accentText}`}>
                                {fmtAmount(contract.amount)}
                            </span>
                            <span className="text-[11px] text-[#55534F]">
                                {fmtDate(contract.job?.deadline, 'No deadline')}
                            </span>
                        </div>
                        <InfoChip icon={<Wallet className="h-3.5 w-3.5" />} label={fmtAmount(contract.amount)} className="sm:hidden" />
                    </div>
                </div>
            </header>

            {/* Tab bar */}
            <nav className="sticky top-[68px] z-20 border-b border-[rgba(255,255,255,0.06)] bg-[#0D0D0E]/95 px-5 backdrop-blur-xl">
                <div className="flex h-10 items-end gap-6 overflow-x-auto" role="tablist" aria-label="Contract workspace sections">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.id}
                            id={`contract-workspace-tab-${tab.id}`}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-controls={`contract-workspace-panel-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            onKeyDown={(event) => handleTabKeyDown(event, index)}
                            className={`relative flex h-10 shrink-0 items-center gap-1.5 text-[13px] font-medium transition-colors duration-100 ${focusRing} ${rt.focusRingColor} ${
                                activeTab === tab.id ? 'text-[#F0EFE8]' : 'text-[#55534F] hover:text-[#8A8880]'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {activeTab === tab.id
                                ? <span className={`absolute bottom-0 left-0 h-[2px] w-full rounded-full ${rt.tabAccent}`} />
                                : null}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Tab panels */}
            <main
                key={activeTab}
                id={`contract-workspace-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`contract-workspace-tab-${activeTab}`}
                className="animate-[contractTabIn_160ms_ease-out] p-5"
            >
                {activeTab === 'overview' ? (
                    <div className="space-y-4">
                        {model.showReviewConfirmation ? <CompletedSummary model={model} rt={rt} /> : null}
                        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
                            <ContractPulse model={model} rt={rt} />
                            <NextMoveCard model={model} rt={rt} isActionLoading={isActionLoading} onDeliver={onDeliver} onRequestChanges={onRequestChanges} onAcceptAndPay={onAcceptAndPay} onDispute={onDispute} onReview={onReview} setActiveTab={setActiveTab} />
                        </section>
                        {!model.showReviewConfirmation
                            ? <ActionDeck model={model} rt={rt} isActionLoading={isActionLoading} onDeliver={onDeliver} onRequestChanges={onRequestChanges} onAcceptAndPay={onAcceptAndPay} onDispute={onDispute} onReview={onReview} />
                            : null}
                    </div>
                ) : null}
                {activeTab === 'files' ? <FilesTab model={model} fileFilter={fileFilter} setFileFilter={setFileFilter} userRole={userRole} onPreviewFile={openPreview} onDeliver={onDeliver} rt={rt} /> : null}
                {activeTab === 'milestones' ? <MilestonesTab model={model} userRole={userRole} rt={rt} /> : null}
                {activeTab === 'activity' ? <ActivityTab events={activityEvents} model={model} contract={contract} rt={rt} /> : null}
            </main>

            {previewFile ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="File preview">
                    <div className="w-full max-w-lg rounded-[10px] bg-[#111214] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className={labelClass}>File preview</p>
                                <h3 className="mt-1 truncate text-[18px] font-medium tracking-[-0.01em] text-[#F0EFE8]">{previewFile.name}</h3>
                                <p className={monoClass}>{[previewFile.senderName, fmtDate(previewFile.uploadedAt, 'Unknown'), fmtSize(previewFile.size)].filter(Boolean).join(' · ') || 'Protected contract file'}</p>
                            </div>
                            <button ref={previewCloseRef} type="button" onClick={() => setPreviewFile(null)} className={`rounded-[10px] border-[0.5px] border-[rgba(255,255,255,0.07)] bg-[#161719] px-3 py-2 text-[13px] font-medium text-[#8A8880] hover:text-[#F0EFE8] ${focusRing}`}>Close</button>
                        </div>
                        <div className="mt-4 rounded-[10px] border-[0.5px] border-[rgba(255,255,255,0.07)] bg-[#0D0D0E] p-4">
                            <p className={bodyClass}>Preview opens in a secure focused step first. Use Open file to view or download the asset according to contract access rules.</p>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setPreviewFile(null)} className={`rounded-[10px] border-[0.5px] border-[rgba(255,255,255,0.07)] bg-[#161719] px-3 py-2 text-[14px] font-medium text-[#8A8880] hover:text-[#F0EFE8] ${focusRing}`}>Cancel</button>
                            <button type="button" onClick={() => { const file = previewFile; setPreviewFile(null); onOpenSharedFile?.(file); }} className={`rounded-[10px] bg-[#1D9E75] px-3 py-2 text-[14px] font-medium text-[#F0EFE8] hover:bg-[#24b889] ${focusRing}`}>Open file</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

type RoleTheme = ReturnType<typeof roleTheme>;

type ActionProps = {
    model: WorkspaceModel;
    rt: RoleTheme;
    isActionLoading?: boolean;
    onDeliver: () => void;
    onRequestChanges: () => void;
    onAcceptAndPay: () => void;
    onDispute: () => void;
    onReview: () => void;
};

function CompletedSummary({ model, rt }: { model: WorkspaceModel; rt: RoleTheme }) {
    return (
        <section className="rounded-[10px] border border-[#7F77DD]/30 bg-[#3C3489]/20 px-4 py-4">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#7F77DD]/15">
                    <CheckCircle className="h-5 w-5 text-[#7F77DD]" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className={labelClass}>Contract closed</p>
                    <h3 className="mt-1 text-[15px] font-semibold text-[#F0EFE8]">Work accepted · Payment released</h3>
                    <p className="mt-0.5 text-[13px] text-[#8A8880]">This workspace is now a read-only record.</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 font-mono text-[12px] ${rt.roleBadge}`}>
                    {model.revUsed}/{model.revMax} rev used
                </span>
            </div>
        </section>
    );
}

function ContractPulse({ model, rt }: { model: WorkspaceModel; rt: RoleTheme }) {
    const stats = [
        { label: 'Milestones', value: `${model.completedMilestones}/${model.milestones.length || 0}`, hint: 'completed' },
        { label: 'Files shared', value: model.allFileCount, hint: `${model.reviewFiles.length} review · ${model.finalFiles.length + model.lockedFinalFilesCount} final` },
        { label: 'Revisions', value: `${model.revUsed}/${model.revMax}`, hint: 'used' },
    ];

    return (
        <section className="rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[#111214] px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className={labelClass}>At a glance</p>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${model.status.tone}`}>{model.status.icon}{model.status.label}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[#161719] px-3 py-3">
                        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#55534F]">{stat.label}</p>
                        <p className={`mt-1.5 text-[22px] font-bold tracking-[-0.02em] ${rt.accentText}`}>{stat.value}</p>
                        <p className="text-[11px] text-[#55534F]">{stat.hint}</p>
                    </div>
                ))}
            </div>

            <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12px] text-[#55534F]">Progress</span>
                    <span className={`font-mono text-[12px] font-semibold ${rt.accentText}`}>{model.progressPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#1a1b1e]">
                    <div className={`h-full rounded-full transition-all duration-500 ${rt.accentBg}`} style={{ width: `${model.progressPct}%` }} />
                </div>
            </div>
        </section>
    );
}

function NextMoveCard({ model, rt, isActionLoading, onDeliver, onAcceptAndPay, onReview, setActiveTab }: ActionProps & { setActiveTab: (tab: WorkspaceTab) => void }) {
    const action = model.showFreelancerDeliver ? onDeliver
        : model.showClientReview ? onAcceptAndPay
        : model.showLeaveReview ? onReview
        : null;

    return (
        <section className={`rounded-[10px] border px-4 py-4 ${model.nextMove.tone}`}>
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/5">
                    {model.nextMove.icon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className={labelClass}>Next move</p>
                    <h3 className="mt-1 text-[15px] font-semibold text-[#F0EFE8]">{model.nextMove.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#8A8880]">{model.nextMove.body}</p>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
                {action && model.nextMove.primaryLabel ? (
                    <button type="button" onClick={action} disabled={Boolean(isActionLoading)}
                        className={`rounded-[10px] px-4 py-2 text-[14px] font-semibold transition-colors disabled:opacity-60 ${rt.primaryBtn} ${focusRing} ${rt.focusRingColor}`}>
                        {model.nextMove.primaryLabel}
                    </button>
                ) : null}
                <button type="button" onClick={() => setActiveTab('activity')}
                    className={`rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[#161719] px-3 py-2 text-[13px] font-medium text-[#8A8880] transition-colors hover:text-[#F0EFE8] ${focusRing} ${rt.focusRingColor}`}>
                    View history
                </button>
            </div>
        </section>
    );
}

function ActionDeck({ model, rt, isActionLoading, onDeliver, onRequestChanges, onAcceptAndPay, onDispute, onReview }: ActionProps) {
    if (model.showReviewConfirmation) return null;

    const hasActions = model.showFreelancerDeliver || model.showClientReview || model.showLeaveReview || model.canDispute;
    if (!hasActions) return null;

    return (
        <section className="rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[#111214] px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className={labelClass}>Quick actions</p>
                <span className="rounded-full border border-[rgba(255,255,255,0.07)] bg-[#161719] px-2.5 py-0.5 font-mono text-[11px] text-[#8A8880]">{model.revLeft} rev left</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {model.showFreelancerDeliver ? <PrimaryButton rt={rt} onClick={onDeliver} disabled={isActionLoading} icon={<PackageCheck className="h-4 w-4" />} label="Submit delivery" /> : null}
                {model.showClientReview ? <PrimaryButton rt={rt} onClick={onAcceptAndPay} disabled={isActionLoading} icon={<CircleCheck className="h-4 w-4" />} label="Approve & release" /> : null}
                {model.showClientReview ? <GhostButton onClick={onRequestChanges} disabled={isActionLoading || model.revLeft <= 0} icon={<GitPullRequest className="h-4 w-4" />} label={model.revLeft <= 0 ? 'Limit reached' : 'Request revision'} /> : null}
                {model.showLeaveReview ? <PrimaryButton rt={rt} onClick={onReview} disabled={isActionLoading} icon={<Star className="h-4 w-4" />} label="Leave review" /> : null}
                {model.canDispute ? <DangerButton onClick={onDispute} disabled={isActionLoading} icon={<ShieldAlert className="h-4 w-4" />} label="Open dispute" /> : null}
            </div>
        </section>
    );
}

function FilesTab({ model, rt, fileFilter, setFileFilter, userRole, onPreviewFile, onDeliver }: { model: WorkspaceModel; rt: RoleTheme; fileFilter: FileFilter; setFileFilter: (filter: FileFilter) => void; userRole: 'client' | 'freelancer'; onPreviewFile: (file: ContractSharedFile) => void; onDeliver: () => void }) {
    const filters: Array<{ id: FileFilter; label: string }> = [
        { id: 'all', label: 'All' },
        { id: 'shared', label: 'Shared' },
        { id: 'review', label: 'Review' },
        { id: 'final', label: 'Final' },
    ];
    const showShared = fileFilter === 'all' || fileFilter === 'shared';
    const showReview = fileFilter === 'all' || fileFilter === 'review';
    const showFinal = fileFilter === 'all' || fileFilter === 'final';

    return (
        <section className={`${surface} ${surfaceHover} px-4 py-[14px]`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className={labelClass}>File Manager</p>
                    <h3 className="mt-1 text-[18px] font-medium tracking-[-0.01em] text-[#F0EFE8]">Shared, review, and final assets</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {filters.map((filter) => (
                        <button key={filter.id} type="button" onClick={() => setFileFilter(filter.id)}
                            className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${focusRing} ${rt.focusRingColor} ${
                                fileFilter === filter.id
                                    ? `${rt.accentBg} border-transparent text-[#0D0D0E] font-semibold`
                                    : 'border-[rgba(255,255,255,0.07)] bg-[#161719] text-[#8A8880] hover:text-[#F0EFE8]'
                            }`}>
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-3 space-y-2">
                {showReview ? model.reviewFiles.map(file => <DeliveryFileRow key={file.id} file={file} type="review" userRole={userRole} onPreviewFile={onPreviewFile} />) : null}
                {showFinal && userRole === 'client' && model.lockedFinalFilesCount > 0 ? <LockedFinalNotice count={model.lockedFinalFilesCount} /> : null}
                {showFinal ? model.finalFiles.map(file => <DeliveryFileRow key={file.id} file={file} type="final" userRole={userRole} onPreviewFile={onPreviewFile} />) : null}
                {showShared ? model.sharedFiles.map(file => <SharedFileRow key={file.id} file={file} onPreviewFile={onPreviewFile} />) : null}
                {((showReview ? model.reviewFiles.length : 0) + (showFinal ? model.finalFiles.length + (userRole === 'client' ? model.lockedFinalFilesCount : 0) : 0) + (showShared ? model.sharedFiles.length : 0)) === 0 ? (
                    <FilesEmptyState userRole={userRole} canDeliver={model.showFreelancerDeliver} onDeliver={onDeliver} />
                ) : null}
            </div>
        </section>
    );
}

function MilestonesTab({ model, rt, userRole }: { model: WorkspaceModel; rt: RoleTheme; userRole: 'client' | 'freelancer' }) {
    return (
        <section className={`${surface} ${surfaceHover} px-4 py-[14px]`}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className={labelClass}>Milestones</p>
                    <h3 className="mt-1 text-[18px] font-medium tracking-[-0.01em] text-[#F0EFE8]">{model.completedMilestones}/{model.milestones.length} completed</h3>
                </div>
                {userRole === 'freelancer' && model.milestones.length === 0 ? (
                    <button type="button" disabled className={`rounded-[10px] border-[0.5px] border-[rgba(255,255,255,0.07)] bg-[#111214] px-3 py-2 text-[13px] font-medium text-[#55534F] ${focusRing}`}>+ Add milestone</button>
                ) : null}
            </div>

            {model.milestones.length === 0 ? (
                <div className="mt-4">
                    <CompactEmpty icon={<GitPullRequest className="h-4 w-4" />} title="No milestones defined" text="This contract is tracked through delivery, review, payment, and activity events." />
                </div>
            ) : (
                <div className="mt-6 overflow-x-auto pb-2">
                    <div className="relative flex min-w-max gap-5 px-1">
                        <div className="absolute left-5 right-5 top-5 h-px bg-white/10" />
                        <div className={`absolute left-5 top-5 h-px ${rt.accentBg}`} style={{ width: `calc(${model.progressPct}% - 2.5rem)` }} />
                        {model.milestones.map((milestone, index) => <TimelineMilestone key={milestone.id || index} milestone={milestone} index={index} rt={rt} />)}
                    </div>
                </div>
            )}
        </section>
    );
}

function FilesEmptyState({ userRole, canDeliver, onDeliver }: { userRole: 'client' | 'freelancer'; canDeliver: boolean; onDeliver: () => void }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-[10px] border-[0.5px] border-dashed border-[rgba(255,255,255,0.07)] bg-[#111214] px-4 py-[14px]">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-[0.5px] border-[rgba(255,255,255,0.07)] bg-[#161719] text-[#55534F]"><FolderOpen className="h-4 w-4" /></div>
                <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[#8A8880]">No files shared yet</p>
                    <p className="mt-0.5 text-[13px] text-[#55534F]">{userRole === 'freelancer' ? 'Upload a delivery when work is ready.' : 'Files will appear after the freelancer delivers or shares assets.'}</p>
                </div>
            </div>
            {userRole === 'freelancer' && canDeliver ? (
                <button type="button" onClick={onDeliver} className={`shrink-0 rounded-[10px] bg-[#1D9E75] px-3 py-2 text-[13px] font-medium text-[#F0EFE8] hover:bg-[#24b889] ${focusRing}`}>
                    Upload delivery
                </button>
            ) : null}
        </div>
    );
}

function ActivityTab({ events, model, contract, rt }: { events: ContractActivityEvent[]; model: WorkspaceModel; contract: ContractSidebarData; rt: RoleTheme }) {
    const fallbackEvents = useMemo<ContractActivityEvent[]>(() => {
        const items: ContractActivityEvent[] = [];
        if (contract.deliverySubmittedAt) items.push({ id: 'delivery-date', text: 'Work delivered and ready for review', timestamp: contract.deliverySubmittedAt, actorRole: 'freelancer', kind: 'delivery' });
        if (model.st === 'completed') items.push({ id: 'completed-state', text: 'Work has been accepted and payment released', timestamp: contract.reviewDueAt || contract.deliverySubmittedAt, actorRole: 'system', kind: 'payment', system: true });
        if (model.showReviewConfirmation) items.push({ id: 'review-state', text: '5 stars: No comment provided', timestamp: null, actorRole: 'client', kind: 'review' });
        return items;
    }, [contract.deliverySubmittedAt, contract.reviewDueAt, model.showReviewConfirmation, model.st]);
    const list = events.length > 0 ? events : fallbackEvents;

    return (
        <section className={`${surface} ${surfaceHover} px-4 py-[14px]`}>
            <div>
                <p className={labelClass}>Activity</p>
                <h3 className="mt-1 text-[18px] font-medium tracking-[-0.01em] text-[#F0EFE8]">Contract event history</h3>
            </div>
            <div className="mt-3 space-y-2">
                {list.length > 0 ? list.map(event => <ActivityRow key={event.id} event={event} />) : (
                    <CompactEmpty icon={<Clock className="h-4 w-4" />} title="No activity yet" text="Contract events will appear here chronologically." />
                )}
            </div>
        </section>
    );
}

function DeliveryFileRow({ file, type, userRole, onPreviewFile }: { file: ContractDeliveryAsset; type: 'review' | 'final'; userRole: 'client' | 'freelancer'; onPreviewFile: (file: ContractSharedFile) => void }) {
    const isFinal = type === 'final';
    const isReleased = file.accessState === 'released';
    const isLocked = isFinal && !isReleased;
    const canOpen = !isLocked || userRole === 'freelancer';
    const rowTone = !isFinal ? 'border-l-[#BA7517]' : isReleased ? 'border-l-[#7F77DD]' : 'border-l-[#55534F]';
    const badge = !isFinal ? 'Review Asset' : isReleased ? 'Released' : 'Pending';
    const badgeTone = !isFinal ? 'border-[#BA7517] bg-[#633806]/65 text-[#F0EFE8]' : isReleased ? 'border-[#7F77DD] bg-[#3C3489]/70 text-[#F0EFE8]' : 'border-[rgba(255,255,255,0.07)] bg-[#111214] text-[#8A8880]';
    const contractFile = { id: file.id, name: file.name, url: '', type: file.mimeType ?? null, size: file.sizeBytes ?? null, storageBucket: file.storageBucket ?? 'contract-files', storagePath: file.storagePath };

    return (
        <button type="button" onClick={() => canOpen ? onPreviewFile(contractFile) : undefined} disabled={!canOpen} className={`group flex w-full items-center gap-2 rounded-[10px] border-[0.5px] border-l-[3px] border-[rgba(255,255,255,0.07)] ${rowTone} bg-[#111214] px-4 py-[14px] text-left transition-colors duration-[60ms] hover:border-[rgba(255,255,255,0.12)] hover:bg-[#1a1b1e] disabled:cursor-default ${focusRing}`}>
            <FileIcon name={file.name} mimeType={file.mimeType} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-[#F0EFE8]">{file.name}</p>
                <p className={monoClass}>Freelancer · {fmtSize(file.sizeBytes) || 'Size unknown'}</p>
            </div>
            <span className={`hidden shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.06em] sm:inline-flex ${badgeTone}`}>{badge}</span>
            {canOpen ? <span className="hidden translate-x-1 text-[13px] font-medium text-[#8A8880] opacity-0 transition-all duration-[60ms] group-hover:translate-x-0 group-hover:text-[#F0EFE8] group-hover:opacity-100 sm:inline">Preview</span> : null}
            {canOpen ? <ChevronRight className="h-4 w-4 text-[#55534F] transition-colors duration-[60ms] group-hover:text-[#F0EFE8]" /> : <Lock className="h-4 w-4 text-[#55534F]" />}
        </button>
    );
}

function SharedFileRow({ file, onPreviewFile }: { file: ContractSharedFile; onPreviewFile: (file: ContractSharedFile) => void }) {
    return (
        <button type="button" onClick={() => onPreviewFile(file)} className={`group flex w-full items-center gap-2 rounded-[10px] border-[0.5px] border-l-[3px] border-[rgba(255,255,255,0.07)] border-l-[#185FA5] bg-[#111214] px-4 py-[14px] text-left transition-colors duration-[60ms] hover:border-[rgba(255,255,255,0.12)] hover:bg-[#1a1b1e] disabled:cursor-default ${focusRing}`}>
            <FileIcon name={file.name} mimeType={file.type} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-[#F0EFE8]">{file.name}</p>
                <p className={monoClass}>{[file.senderName || 'Client upload', fmtDate(file.uploadedAt, 'Unknown'), fmtSize(file.size)].filter(Boolean).join(' · ')}</p>
            </div>
            <span className="hidden shrink-0 rounded-full border border-[#185FA5] bg-[#042C53]/75 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-[#F0EFE8] sm:inline-flex">Shared</span>
            <span className="hidden translate-x-1 text-[13px] font-medium text-[#8A8880] opacity-0 transition-all duration-[60ms] group-hover:translate-x-0 group-hover:text-[#F0EFE8] group-hover:opacity-100 sm:inline">Preview</span>
            <ChevronRight className="h-4 w-4 text-[#55534F] transition-colors duration-[60ms] group-hover:text-[#F0EFE8]" />
        </button>
    );
}

function ActivityRow({ event }: { event: ContractActivityEvent }) {
    const isSystem = event.system || event.actorRole === 'system' || event.kind === 'payment' || event.kind === 'system';
    if (isSystem) {
        return (
            <div className="flex justify-center">
                <div className="rounded-full border-[0.5px] border-[rgba(255,255,255,0.07)] bg-[#111214] px-3 py-1.5 text-center text-[13px] font-medium text-[#8A8880]">
                    {event.text}{event.timestamp ? ` — ${fmtTime(event.timestamp)}` : ''}
                </div>
            </div>
        );
    }

    return (
        <div className={`${surface} ${surfaceHover} flex gap-3 px-4 py-[14px]`}>
            <PartyAvatar party={{ full_name: event.actorName || undefined, avatar_url: event.actorAvatarUrl }} />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-medium text-[#F0EFE8]">{event.actorName || (event.actorRole === 'client' ? 'Client' : 'Freelancer')}</p>
                    {event.actorRole ? <span className="rounded-full border-[0.5px] border-[rgba(255,255,255,0.07)] bg-[#111214] px-2 py-0.5 text-[11px] font-medium text-[#8A8880]">{event.actorRole}</span> : null}
                    {event.timestamp ? <span className={monoClass}>{fmtTime(event.timestamp)}</span> : null}
                </div>
                <p className={bodyClass}>{event.text}</p>
            </div>
        </div>
    );
}

function TimelineMilestone({ milestone, index, rt }: { milestone: ContractMilestone; index: number; rt: RoleTheme }) {
    const done = ['completed', 'approved', 'paid'].includes(ns(milestone.status));
    const title = milestone.title || milestone.description || `Milestone ${index + 1}`;
    return (
        <div className="relative w-48 shrink-0 pt-10">
            <div className={`absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full border ${
                done ? `${rt.accentBg} border-transparent text-[#0D0D0E]` : 'border-[rgba(255,255,255,0.07)] bg-[#111214] text-[#55534F]'
            }`}>
                {done ? <CheckCircle className="h-4 w-4" /> : <span className="text-[13px] font-semibold">{index + 1}</span>}
            </div>
            <div className="rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[#161719] px-3 py-3">
                <p className="truncate text-[13px] font-semibold text-[#F0EFE8]">{title}</p>
                <p className="mt-0.5 text-[11px] text-[#55534F]">{fmtDate(milestone.due_date)}</p>
                <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    done ? `${rt.accentBorder} ${rt.accentFill} ${rt.accentText}` : 'border-[rgba(255,255,255,0.07)] bg-[#111214] text-[#55534F]'
                }`}>{done ? 'Done' : 'Open'}</span>
            </div>
        </div>
    );
}

function InfoChip({ icon, label, hideOnMobile, className }: { icon: ReactNode; label: string; hideOnMobile?: boolean; className?: string }) {
    return <span className={`items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.07)] bg-[#161719] px-2.5 py-1 font-mono text-[12px] text-[#8A8880] ${hideOnMobile ? 'hidden sm:inline-flex' : 'inline-flex'} ${className ?? ''}`}>{icon}{label}</span>;
}

function FileIcon({ name, mimeType }: { name?: string | null; mimeType?: string | null }) {
    const value = `${name || ''} ${mimeType || ''}`.toLowerCase();
    const Icon = value.includes('image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(value) ? Image : value.includes('zip') || value.includes('archive') ? FileArchive : FileText;
    return <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border-[0.5px] border-[rgba(255,255,255,0.07)] bg-[#161719] text-[#8A8880]"><Icon className="h-4 w-4" /></div>;
}

function LockedFinalNotice({ count }: { count: number }) {
    return (
        <div className="flex items-start gap-3 rounded-[10px] border-[0.5px] border-l-[3px] border-[#BA7517] border-l-[#BA7517] bg-[#633806]/35 px-4 py-[14px] text-[#F0EFE8]">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
                <p className="text-[14px] font-medium">{count} final {count === 1 ? 'file is' : 'files are'} pending release</p>
                <p className={bodyClass}>Client can see the count, but not filenames or download links until payment release.</p>
            </div>
        </div>
    );
}

function CompactEmpty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
    return (
        <div className="flex items-center gap-3 rounded-[10px] border-[0.5px] border-dashed border-[rgba(255,255,255,0.07)] bg-[#111214] px-4 py-[14px]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-[0.5px] border-[rgba(255,255,255,0.07)] bg-[#161719] text-[#55534F]">{icon}</div>
            <div><p className="text-[14px] font-medium text-[#8A8880]">{title}</p><p className="mt-0.5 text-[13px] text-[#55534F]">{text}</p></div>
        </div>
    );
}

function PartyAvatar({ party, size = 'md' }: { party?: { full_name?: string; avatar_url?: string | null } | null; size?: 'md' | 'lg' }) {
    const dim = size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
    return (
        <div className={`relative flex ${dim} shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.07)] bg-[#161719] text-[#8A8880]`}>
            {party?.avatar_url ? <img src={party.avatar_url} alt={party.full_name || 'User'} className="h-full w-full object-cover" /> : <User className="h-4 w-4" />}
        </div>
    );
}

function PrimaryButton({ rt, onClick, disabled, icon, label }: { rt: RoleTheme; onClick?: () => void; disabled?: boolean; icon: ReactNode; label: string }) {
    return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-[14px] font-semibold transition-colors disabled:opacity-50 ${rt.primaryBtn} ${focusRing} ${rt.focusRingColor}`}>{icon}{label}</button>;
}

function GhostButton({ onClick, disabled, icon, label }: { onClick?: () => void; disabled?: boolean; icon: ReactNode; label: string }) {
    return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-2 rounded-[10px] border-[0.5px] border-[rgba(255,255,255,0.07)] bg-[#161719] px-3 py-2 text-[14px] font-medium text-[#8A8880] transition-colors duration-[80ms] hover:border-[rgba(255,255,255,0.12)] hover:bg-[#1a1b1e] hover:text-[#F0EFE8] disabled:opacity-35 ${focusRing}`}>{icon}{label}</button>;
}

function DangerButton({ onClick, disabled, icon, label }: { onClick?: () => void; disabled?: boolean; icon: ReactNode; label: string }) {
    return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-2 rounded-[10px] border-[0.5px] border-[#A32D2D] bg-[#501313]/75 px-3 py-2 text-[14px] font-medium text-[#F0EFE8] transition-colors duration-[80ms] hover:bg-[#6a1919] disabled:opacity-50 ${focusRing}`}>{icon}{label}</button>;
}
