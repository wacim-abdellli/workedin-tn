import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
    AlertCircle,
    ArrowLeft,
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
    MessageSquare,
    MoreHorizontal,
    PackageCheck,
    ShieldAlert,
    Shield,
    Star,
    User,
    Wallet,
    Timer,
} from 'lucide-react';

// ── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(targetIso: string | null | undefined) {
    const calc = useCallback(() => {
        if (!targetIso) return null;
        const diff = new Date(targetIso).getTime() - Date.now();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
        const totalMin = Math.floor(diff / 60000);
        return { days: Math.floor(totalMin / 1440), hours: Math.floor((totalMin % 1440) / 60), minutes: totalMin % 60, expired: false };
    }, [targetIso]);
    const [tick, setTick] = useState(calc);
    useEffect(() => {
        if (!targetIso) return;
        const id = setInterval(() => setTick(calc()), 60000);
        return () => clearInterval(id);
    }, [targetIso, calc]);
    return tick;
}

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
    escrowFunded?: boolean;
    deliverySubmittedAt?: string | null;
    reviewDueAt?: string | null;
    reviewFiles?: ContractDeliveryAsset[];
    finalFiles?: ContractDeliveryAsset[];
    lockedFinalFilesCount?: number;
    job?: { title?: string | null; deadline?: string | null };
    lastRevisionNote?: string | null;
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
    onCancel?: () => void;
    onFundEscrow?: () => void;
    onReview: () => void;
    hasLeftReview: boolean;
    onOpenSharedFile?: (file: ContractSharedFile) => void;
    onGoBack?: () => void;
    onGoToMessages?: () => void;
    isSidebar?: boolean;
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
    isEscrowFunded: boolean;
    showFreelancerDeliver: boolean;
    showClientReview: boolean;
    showReviewConfirmation: boolean;
    showLeaveReview: boolean;
    canDispute: boolean;
    nextMove: { icon: ReactNode; title: string; body: string; primaryLabel: string | null; tone: string };
    otherParty?: { full_name?: string; avatar_url?: string | null } | null;
    allFileCount: number;
    lastRevisionNote: string | null;
    reviewDueAt: string | null;
    amount: number | null;
    fundedAt: string | null;
    deliverySubmittedAt: string | null;
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

const surface = 'border border-white/[0.06] bg-[#0d0d11] rounded-xl relative overflow-hidden';
const surfaceHover = 'transition-all duration-200 hover:border-white/[0.12]';
const labelClass = 'text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400';
const bodyClass = 'text-[13px] font-normal leading-normal text-zinc-300';
const monoClass = 'font-mono text-[11px] text-zinc-500';
const focusRing = 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-offset-[#09090b]';

// Role-aware theme — amber = client (paying), violet = freelancer (delivering)
const roleTheme = (role: 'client' | 'freelancer') => role === 'client'
    ? {
        accent: '#E8A020',        // warm amber
        accentBg: 'bg-[#E8A020]',
        accentText: 'text-[#E8A020]',
        accentBorder: 'border-[#E8A020]',
        accentFill: 'bg-[#3D2A00]/60',
        roleLabel: 'Client',
        roleBadge: 'border-[#E8A020]/20 bg-[#E8A020]/10 text-[#E8A020]',
        headerStripe: 'from-[#E8A020]/20 to-transparent',
        primaryBtn: 'bg-[#E8A020] hover:bg-[#f0aa28] text-[#0A0A0B]',
        focusRingColor: 'focus-visible:ring-[#E8A020]',
        tabAccent: 'bg-[#E8A020]',
        tabActiveBg: 'bg-[#E8A020]/15',
    }
    : {
        accent: '#9B8FF0',        // soft violet
        accentBg: 'bg-[#9B8FF0]',
        accentText: 'text-[#9B8FF0]',
        accentBorder: 'border-[#9B8FF0]',
        accentFill: 'bg-[#2D2660]/60',
        roleLabel: 'Freelancer',
        roleBadge: 'border-[#9B8FF0]/20 bg-[#9B8FF0]/10 text-[#9B8FF0]',
        headerStripe: 'from-[#9B8FF0]/15 to-transparent',
        primaryBtn: 'bg-[#9B8FF0] hover:bg-[#a99cf5] text-[#0A0A0B]',
        focusRingColor: 'focus-visible:ring-[#9B8FF0]',
        tabAccent: 'bg-[#9B8FF0]',
        tabActiveBg: 'bg-[#9B8FF0]/15',
    };

const resolveStatus = (status: string) => {
    const st = ns(status);
    if (st === 'active') return { label: 'Active', tone: 'border-[#1D9E75]/30 bg-[#0F6E56]/20 text-white', accent: 'bg-[#1D9E75]', icon: <Clock className="h-3 w-3" /> };
    if (st === 'delivery_submitted') return { label: 'Review', tone: 'border-[#BA7517]/30 bg-[#633806]/35 text-white', accent: 'bg-[#BA7517]', icon: <FileCheck2 className="h-3 w-3" /> };
    if (st === 'revision_requested') return { label: 'Revision', tone: 'border-[#BA7517]/30 bg-[#633806]/35 text-white', accent: 'bg-[#BA7517]', icon: <GitPullRequest className="h-3 w-3" /> };
    if (st === 'completed') return { label: 'Completed', tone: 'border-[#7F77DD]/30 bg-[#3C3489]/40 text-white', accent: 'bg-[#7F77DD]', icon: <CheckCircle className="h-3 w-3" /> };
    if (st === 'disputed') return { label: 'Disputed', tone: 'border-[#A32D2D]/30 bg-[#501313]/40 text-white', accent: 'bg-[#A32D2D]', icon: <ShieldAlert className="h-3 w-3" /> };
    if (st === 'pending_payment') return { label: 'Pending', tone: 'border-[#185FA5]/30 bg-[#042C53]/45 text-white', accent: 'bg-[#185FA5]', icon: <Wallet className="h-3 w-3" /> };
    return { label: 'Syncing', tone: 'border-white/10 bg-white/5 text-zinc-400', accent: 'bg-zinc-500', icon: <AlertCircle className="h-3 w-3" /> };
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
    onCancel,
    onFundEscrow,
    onReview,
    hasLeftReview,
    onOpenSharedFile,
    onGoBack,
    onGoToMessages,
    isSidebar = false,
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
        const isEscrowFunded = contract.escrowFunded === true || Boolean(contract.fundedAt);
        const showFreelancerDeliver = userRole === 'freelancer' && ((isActive && !deliverySubmitted) || isRevision);
        const showClientReview = userRole === 'client' && isUnderReview && deliverySubmitted;
        const showLeaveReview = isCompleted && !hasLeftReview;
        const showReviewConfirmation = isCompleted && hasLeftReview;
        const canDispute = isActive || isUnderReview || isRevision || isPendingPayment;
        const otherParty = userRole === 'client' ? contract.freelancer : contract.client;

        const reviewDueAt = contract.reviewDueAt ?? null;
        const lastRevisionNote = contract.lastRevisionNote ?? null;
        const amount = contract.amount ?? null;
        const fundedAt = contract.fundedAt ?? null;
        const deliverySubmittedAt = contract.deliverySubmittedAt ?? null;

        const nextMove = (() => {
            // ── ESCROW GATE (pending_payment) ────────────────────────────────
            if (isPendingPayment) {
                if (userRole === 'client' && !isEscrowFunded) {
                    return {
                        icon: <Wallet className="h-4.5 w-4.5" />,
                        title: 'Fund escrow to start',
                        body: `Secure ${fmtAmount(contract.amount)} in escrow. The freelancer will begin work immediately. Funds are released only after you approve the final delivery.`,
                        primaryLabel: 'Fund escrow',
                        accentColor: 'text-[#E8A020]',
                        iconColor: 'text-[#E8A020] bg-[#E8A020]/10 ring-[#E8A020]/20',
                    };
                }
                if (userRole === 'freelancer' && !isEscrowFunded) {
                    return {
                        icon: <Lock className="h-4.5 w-4.5" />,
                        title: 'Waiting for escrow',
                        body: 'The client must secure funds before you begin. You will be notified the moment work can start.',
                        primaryLabel: null,
                        accentColor: 'text-zinc-500',
                        iconColor: 'text-zinc-400 bg-white/5 ring-white/10',
                    };
                }
                return {
                    icon: <CheckCircle className="h-4.5 w-4.5" />,
                    title: userRole === 'freelancer' ? 'Escrow funded — start working' : 'Escrow funded',
                    body: userRole === 'freelancer'
                        ? `${fmtAmount(contract.amount)} is secured. Deliver your work when ready and submit for payment.`
                        : 'Funds are secured. The freelancer has been notified and work is underway.',
                    primaryLabel: userRole === 'freelancer' ? 'Submit delivery' : null,
                    accentColor: 'text-[#1D9E75]',
                    iconColor: 'text-[#1D9E75] bg-[#1D9E75]/10 ring-[#1D9E75]/20',
                };
            }
            if (showFreelancerDeliver) {
                return {
                    icon: <PackageCheck className="h-4.5 w-4.5" />,
                    title: isRevision ? 'Submit revised delivery' : 'Submit delivery',
                    body: 'Attach review files and protected final files. Final assets stay locked until the client approves and releases payment.',
                    primaryLabel: isRevision ? 'Resubmit delivery' : 'Submit delivery',
                    accentColor: 'text-[#1D9E75]',
                    iconColor: 'text-[#1D9E75] bg-[#1D9E75]/10 ring-[#1D9E75]/20',
                };
            }
            if (showClientReview) {
                return {
                    icon: <FileCheck2 className="h-4.5 w-4.5" />,
                    title: 'Review submitted work',
                    body: 'Inspect review assets, then approve to release payment and unlock final files, request a revision, or open a dispute.',
                    primaryLabel: 'Approve & release',
                    accentColor: 'text-[#1D9E75]',
                    iconColor: 'text-[#1D9E75] bg-[#1D9E75]/10 ring-[#1D9E75]/20',
                };
            }
            if (userRole === 'freelancer' && isUnderReview) {
                return {
                    icon: <Timer className="h-4.5 w-4.5" />,
                    title: 'Awaiting client review',
                    body: contract.reviewDueAt
                        ? `Your funds are protected. If the client takes no action, payment auto-releases on ${fmtDate(contract.reviewDueAt)}.`
                        : 'Final files remain locked and protected until the client approves.',
                    primaryLabel: null,
                    accentColor: 'text-[#BA7517]',
                    iconColor: 'text-[#E8A020] bg-[#E8A020]/10 ring-[#E8A020]/20',
                };
            }
            if (showLeaveReview) {
                return {
                    icon: <Star className="h-4.5 w-4.5" />,
                    title: 'Leave a review',
                    body: 'The contract is complete. Add a rating to build trust and close the loop.',
                    primaryLabel: 'Leave review',
                    accentColor: 'text-[#1D9E75]',
                    iconColor: 'text-[#1D9E75] bg-[#1D9E75]/10 ring-[#1D9E75]/20',
                };
            }
            if (isCompleted) {
                return {
                    icon: <CheckCircle className="h-4.5 w-4.5" />,
                    title: 'Contract closed',
                    body: 'Payment was released and final files are now available. This workspace is a permanent record.',
                    primaryLabel: null,
                    accentColor: 'text-[#7F77DD]',
                    iconColor: 'text-[#9B8FF0] bg-[#9B8FF0]/10 ring-[#9B8FF0]/20',
                };
            }
            return {
                icon: <Clock className="h-4.5 w-4.5" />,
                title: 'Work in progress',
                body: 'Keep the conversation open while work continues.',
                primaryLabel: null,
                accentColor: 'text-zinc-400',
                iconColor: 'text-zinc-400 bg-white/5 ring-white/10',
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
            isEscrowFunded,
            showFreelancerDeliver,
            showClientReview,
            showReviewConfirmation,
            showLeaveReview,
            canDispute,
            nextMove,
            otherParty,
            allFileCount: sharedFiles.length + reviewFiles.length + finalFiles.length + lockedFinalFilesCount,
            lastRevisionNote,
            reviewDueAt,
            amount,
            fundedAt,
            deliverySubmittedAt,
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
        { id: 'overview', label: 'Overview', icon: <Wallet className="h-3.5 w-3.5" /> },
        { id: 'files', label: 'Files', icon: <FolderOpen className="h-3.5 w-3.5" /> },
        { id: 'milestones', label: 'Milestones', icon: <GitPullRequest className="h-3.5 w-3.5" /> },
        { id: 'activity', label: 'Activity', icon: <Clock className="h-3.5 w-3.5" /> },
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
    const otherPartyRt = roleTheme(userRole === 'client' ? 'freelancer' : 'client');

    return (
        <div className="flex w-full flex-col bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
            <style>{`
                @keyframes contractTabIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes pulseRole{0%,100%{opacity:1}50%{opacity:0.6}}
            `}</style>

            {/* Role-colored top stripe */}
            <div className={`h-[3px] w-full bg-gradient-to-r ${rt.headerStripe}`} />

            {/* ── Premium Unified Compact Header ── */}
            <header className="sticky top-0 z-30 flex flex-col border-b border-white/[0.04] bg-[#0A0A0B]/95 backdrop-blur-md">
                {/* Main Compact Row */}
                <div className={`flex flex-col gap-3 py-3.5 ${isSidebar ? 'px-4' : 'px-6'}`}>
                    {/* Row 1: Avatar, Title, and Amount */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <PartyAvatar party={model.otherParty} size="md" />
                            <div className="flex flex-col min-w-0">
                                <h2 className="text-[14px] sm:text-[15px] font-bold text-white leading-tight truncate">
                                    {contract.job?.title || 'Untitled contract'}
                                </h2>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-500">
                                    <span className={`font-bold uppercase tracking-wider ${otherPartyRt.accentText}`}>
                                        {userRole === 'client' ? 'Freelancer' : 'Client'}
                                    </span>
                                    <span>•</span>
                                    <span className="truncate">{model.otherParty?.full_name || 'counterparty'}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Amount & Escrow block */}
                        <div className="flex flex-col items-end shrink-0 pl-2">
                            <span className={`text-[15px] sm:text-[16px] font-extrabold leading-tight ${rt.accentText}`}>
                                {fmtAmount(contract.amount)}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1D9E75] leading-none">
                                <Shield className="h-3 w-3 text-[#1D9E75]" />
                                <span>{model.isEscrowFunded ? 'In escrow' : 'Pending escrow'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Status alerts and navigation */}
                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-2 mt-0.5">
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase leading-none ${model.status.tone}`}>
                                {model.status.icon}{model.status.label}
                            </span>
                            {contract.job?.deadline && (
                                <span className="text-[11px] text-zinc-500">
                                    Due {fmtDate(contract.job.deadline)}
                                </span>
                            )}
                        </div>
                        
                        {/* Navigation Actions (only rendered if defined) */}
                        {(onGoBack || onGoToMessages) && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                {onGoBack && (
                                    <button type="button" onClick={onGoBack} className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors border border-white/[0.02]">
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                {onGoToMessages && (
                                    <button type="button" onClick={onGoToMessages} className="flex h-7 items-center gap-1 rounded-md px-2 bg-white/[0.03] text-[11px] font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors border border-white/[0.02]">
                                        <MessageSquare className="h-3 w-3" />
                                        Messages
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Bar Row */}
                <div className={`flex flex-col gap-2 ${isSidebar ? 'px-4' : 'px-6'} pb-1`}>
                    <div className="flex items-center justify-between w-full">
                        <nav className="flex h-10 gap-1 overflow-x-auto" role="tablist" aria-label="Contract workspace sections">
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
                                    className={`relative flex items-center gap-1.5 rounded-t-[6px] text-[12px] font-semibold transition-colors duration-150 border-b-2 ${focusRing} ${rt.focusRingColor} ${
                                        isSidebar ? 'px-2 gap-1 text-[11px]' : 'px-3 gap-1.5'
                                    } ${
                                        activeTab === tab.id
                                            ? `border-b-[var(--color-text-primary)] text-[var(--color-text-primary)]`
                                            : 'border-b-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-white/[0.02]'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        {/* Progress Pill right aligned next to tabs */}
                        {!isSidebar && (
                            <div className="hidden lg:flex items-center gap-3.5 rounded-full border border-white/[0.06] bg-[#161719] px-4 py-1.5 shadow-sm mb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">Progress</span>
                                <div className="w-[180px] h-1.5 overflow-hidden rounded-full bg-white/[0.06] border border-white/[0.02]">
                                    <div className={`h-full rounded-full transition-all duration-1000 ease-out relative ${rt.accentBg}`} style={{ width: `${model.progressPct}%` }}>
                                        <div className="absolute inset-0 bg-white/20 rounded-full mix-blend-overlay" />
                                    </div>
                                </div>
                                <span className={`text-[11px] font-black tracking-wider ${rt.accentText}`}>{model.progressPct}%</span>
                            </div>
                        )}
                    </div>

                    {/* Progress Pill stacked in sidebar mode */}
                    {isSidebar && (
                        <div className="flex items-center justify-between w-full pb-2 pt-1 border-t border-white/[0.04]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Progress</span>
                            <div className="flex items-center gap-2 flex-grow max-w-[200px] mx-3">
                                <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${rt.accentBg}`} style={{ width: `${model.progressPct}%` }} />
                                </div>
                            </div>
                            <span className={`text-[11px] font-black tracking-wider ${rt.accentText}`}>{model.progressPct}%</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Tab panels */}
            <main
                key={activeTab}
                id={`contract-workspace-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`contract-workspace-tab-${activeTab}`}
                className={`flex-grow animate-[contractTabIn_160ms_ease-out] ${isSidebar ? 'p-3.5' : 'px-4 py-8 sm:px-8 sm:py-10'}`}
            >
                <div className="mx-auto w-full max-w-[1800px]">
                {activeTab === 'overview' ? (
                    <div className={isSidebar ? "flex flex-col gap-4" : "grid grid-cols-1 lg:grid-cols-4 gap-6 items-start"}>
                        <div className={isSidebar ? "flex flex-col gap-4" : "lg:col-span-3 flex flex-col gap-4"}>
                            {model.st === 'completed' ? <CompletedSummary model={model} rt={rt} onReview={onReview} /> : null}
                            {model.st !== 'completed' || model.showLeaveReview ? <NextMoveCard model={model} rt={rt} isActionLoading={isActionLoading} onDeliver={onDeliver} onRequestChanges={onRequestChanges} onAcceptAndPay={onAcceptAndPay} onDispute={onDispute} onCancel={onCancel} onFundEscrow={onFundEscrow} onReview={onReview} setActiveTab={setActiveTab} /> : null}
                        </div>
                        <div className={isSidebar ? "w-full" : "lg:col-span-1"}>
                            <ContractPulse model={model} rt={rt} userRole={userRole} onGoToMessages={onGoToMessages} isSidebar={isSidebar} />
                        </div>
                    </div>
                ) : null}
                {activeTab === 'files' ? <FilesTab model={model} fileFilter={fileFilter} setFileFilter={setFileFilter} userRole={userRole} onPreviewFile={openPreview} onDeliver={onDeliver} rt={rt} /> : null}
                {activeTab === 'milestones' ? <MilestonesTab model={model} userRole={userRole} rt={rt} /> : null}
                {activeTab === 'activity' ? <ActivityTab events={activityEvents} model={model} contract={contract} rt={rt} /> : null}
                </div>
            </main>
            {previewFile ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="File preview">
                    <div className="w-full max-w-lg rounded-xl bg-[#0d0d11] border border-white/[0.06] p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className={labelClass}>File preview</p>
                                <h3 className="mt-1 truncate text-[16px] font-bold text-white">{previewFile.name}</h3>
                                <p className={monoClass}>{[previewFile.senderName, fmtDate(previewFile.uploadedAt, 'Unknown'), fmtSize(previewFile.size)].filter(Boolean).join(' · ') || 'Protected contract file'}</p>
                            </div>
                            <button ref={previewCloseRef} type="button" onClick={() => setPreviewFile(null)} className={`rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[12px] font-medium text-zinc-300 hover:text-white ${focusRing}`}>Close</button>
                        </div>
                        <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.01] p-4">
                            <p className={bodyClass}>Preview opens in a secure focused step first. Use Open file to view or download the asset according to contract access rules.</p>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setPreviewFile(null)} className={`rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[12px] font-medium text-zinc-300 hover:text-white ${focusRing}`}>Cancel</button>
                            <button type="button" onClick={() => { const file = previewFile; setPreviewFile(null); onOpenSharedFile?.(file); }} className={`rounded-lg bg-[#1D9E75] px-3 py-1.5 text-[12px] font-bold text-[#0A0A0B] hover:bg-[#24b889] ${focusRing}`}>Open file</button>
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
    onCancel?: () => void;
    onFundEscrow?: () => void;
    onReview: () => void;
};

function CompletedSummary({ model, rt, onReview }: { model: WorkspaceModel; rt: RoleTheme; onReview: () => void }) {
    return (
        <section className="rounded-xl border border-white/[0.06] bg-[#0d0d11] p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                    <CheckCircle className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className={labelClass}>Contract Status</p>
                    <h3 className="mt-1 text-[15px] font-bold text-white">
                        {fmtAmount(model.amount)} released to freelancer
                    </h3>
                    <div className="mt-1.5 flex flex-col gap-1 text-[12px] text-zinc-400">
                        {model.fundedAt && <p>• Escrow funded: {fmtDate(model.fundedAt)}</p>}
                        {model.deliverySubmittedAt && <p>• Delivery submitted: {fmtDate(model.deliverySubmittedAt)}</p>}
                    </div>
                </div>
                <span className="rounded-full border border-white/[0.06] bg-[#161719] px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                    {model.revUsed}/{model.revMax} rev used
                </span>
            </div>
            {model.showLeaveReview ? (
                <div className="mt-3 flex justify-end">
                    <button type="button" onClick={onReview} className="text-[12px] font-semibold text-zinc-300 hover:text-white underline transition-colors">
                        Leave a review
                    </button>
                </div>
            ) : null}
        </section>
    );
}

function ContractPulse({ model, rt, userRole, onGoToMessages, isSidebar = false }: { model: WorkspaceModel; rt: RoleTheme; userRole: 'client' | 'freelancer'; onGoToMessages?: () => void; isSidebar?: boolean }) {
    return (
        <section className="flex flex-col gap-3">
            <div className={`${surface} p-4 flex flex-col gap-3`}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-white/[0.04]">
                    Contract Terms
                </p>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="text-zinc-400">Escrow Balance</span>
                        <span className={`font-bold ${rt.accentText}`}>{fmtAmount(model.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="text-zinc-400">Milestones</span>
                        <span className="font-semibold text-white">
                            {model.completedMilestones} / {model.milestones.length || 0} completed
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="text-zinc-400">Files Shared</span>
                        <span className="font-semibold text-white">
                            {model.allFileCount} total
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="text-zinc-400">Revisions Used</span>
                        <span className="font-semibold text-white">
                            {model.revUsed} / {model.revMax}
                        </span>
                    </div>
                </div>
            </div>

            {model.otherParty ? (
                <div className={`${surface} p-4 flex flex-col gap-3`}>
                    <div className="flex items-center gap-3">
                        <PartyAvatar party={model.otherParty} size="md" />
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                {userRole === 'client' ? 'Freelancer' : 'Client'}
                            </p>
                            <h4 className="truncate text-[13px] font-bold text-white mt-0.5">
                                {model.otherParty.full_name || 'Counterparty'}
                            </h4>
                        </div>
                    </div>
                    {onGoToMessages && (
                        <button
                            type="button"
                            onClick={onGoToMessages}
                            className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] py-2 text-[12px] font-semibold text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-all ${focusRing} ${rt.focusRingColor}`}
                        >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Send message
                        </button>
                    )}
                </div>
            ) : null}
        </section>
    );
}

function ReviewCountdown({ targetIso }: { targetIso: string }) {
    const tick = useCountdown(targetIso);
    if (!tick || tick.expired) return (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-950/20 px-2.5 py-1 border border-red-900/30">
            <Timer className="h-3.5 w-3.5 text-red-400" />
            <span className="text-[12px] font-medium text-red-400">Review period expired</span>
        </div>
    );
    return (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-950/20 px-2.5 py-1 border border-amber-900/30">
            <Timer className="h-3.5 w-3.5 text-[#E8A020]" />
            <span className="text-[12px] font-medium text-[#E8A020]">
                Review due: {tick.days}d {tick.hours}h {tick.minutes}m
            </span>
        </div>
    );
}

function NextMoveCard({ model, rt, isActionLoading, onDeliver, onAcceptAndPay, onRequestChanges, onDispute, onCancel, onFundEscrow, onReview, setActiveTab }: ActionProps & { setActiveTab: (tab: WorkspaceTab) => void }) {
    const isPendingEscrow = model.st === 'pending_payment' && !model.isEscrowFunded && model.nextMove.primaryLabel === 'Fund escrow';
    const action = isPendingEscrow ? undefined
        : model.showFreelancerDeliver || (model.st === 'pending_payment' && model.isEscrowFunded && model.nextMove.primaryLabel) ? onDeliver
        : model.showClientReview ? onAcceptAndPay
        : model.showLeaveReview ? onReview
        : null;

    const showSecondaryActions = model.showClientReview;

    return (
        <section className={`${surface} flex flex-col gap-0`}>
            <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400">
                        Current Status
                    </span>
                </div>
                
                <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${model.nextMove.iconColor || 'bg-white/5 text-zinc-400'} border border-white/[0.06]`}>
                        <span className="[&>svg]:h-4.5 [&>svg]:w-4.5">{model.nextMove.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-bold text-white leading-snug">{model.nextMove.title}</h3>
                        <p className="mt-1 text-[13px] text-zinc-400 leading-normal">{model.nextMove.body}</p>
                    </div>
                </div>

                {model.st === 'revision_requested' && model.lastRevisionNote && (
                    <div className="mt-2 rounded-lg border border-[#BA7517]/20 bg-[#633806]/10 p-3">
                        <p className="text-[11px] font-bold text-[#BA7517] uppercase tracking-wider mb-1">Feedback</p>
                        <p className="text-[13px] text-zinc-300 whitespace-pre-wrap">{model.lastRevisionNote}</p>
                    </div>
                )}

                {model.showClientReview && model.reviewDueAt && (
                    <ReviewCountdown targetIso={model.reviewDueAt} />
                )}

                {model.st === 'pending_payment' && model.isEscrowFunded && (
                    <div className="flex items-center gap-2 rounded-lg border border-[#1D9E75]/20 bg-[#0F6E56]/10 px-3 py-2">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#1D9E75]" />
                        <span className="text-[12px] font-medium text-[#1D9E75]">Escrow funded — payment secured</span>
                    </div>
                )}

                {isPendingEscrow && (
                    <div className="flex items-center gap-2 rounded-lg border border-[#E8A020]/20 bg-[#3D2A00]/25 px-3 py-2">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#E8A020]" />
                        <span className="text-[12px] font-medium text-[#E8A020]">Escrow unfunded</span>
                    </div>
                )}
            </div>

            <div className="border-t border-white/[0.04] p-3 flex flex-wrap items-center gap-2 bg-[#0c0c0f]">
                {action && model.nextMove.primaryLabel ? (
                    <button type="button" onClick={action} disabled={Boolean(isActionLoading)}
                        className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-60 ${rt.primaryBtn} ${focusRing} ${rt.focusRingColor}`}>
                        {isActionLoading ? 'Processing…' : model.nextMove.primaryLabel}
                    </button>
                ) : isPendingEscrow ? (
                    <button type="button" onClick={() => onFundEscrow?.()}
                        className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${rt.primaryBtn} ${focusRing} ${rt.focusRingColor}`}>
                        Fund escrow now
                    </button>
                ) : null}

                {showSecondaryActions && (
                    <GhostButton
                        onClick={onRequestChanges}
                        disabled={isActionLoading || model.revLeft <= 0}
                        icon={<GitPullRequest className="h-3.5 w-3.5" />}
                        label={model.revLeft <= 0 ? 'Limit reached' : `Request revision (${model.revLeft} left)`}
                    />
                )}

                {model.canDispute && (
                    <DangerButton onClick={onDispute} disabled={Boolean(isActionLoading)} icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Dispute" />
                )}

                {(model.st === 'pending_payment' || model.st === 'active') && onCancel && (
                    <GhostButton
                        onClick={onCancel}
                        disabled={Boolean(isActionLoading)}
                        icon={<AlertCircle className="h-3.5 w-3.5" />}
                        label="Cancel"
                    />
                )}

                <button type="button" onClick={() => setActiveTab('activity')}
                    className={`ml-auto rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors ${focusRing} ${rt.focusRingColor}`}>
                    History →
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
        <section className="rounded-xl border border-white/[0.06] bg-[#0d0d11] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/[0.04]">
                <p className={labelClass}>Quick actions</p>
                <span className="rounded-full border border-white/[0.06] bg-[#161719] px-2 py-0.5 font-mono text-[10px] text-zinc-300">{model.revLeft} rev left</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {model.showFreelancerDeliver ? <PrimaryButton rt={rt} onClick={onDeliver} disabled={isActionLoading} icon={<PackageCheck className="h-3.5 w-3.5" />} label="Submit delivery" /> : null}
                {model.showClientReview ? <PrimaryButton rt={rt} onClick={onAcceptAndPay} disabled={isActionLoading} icon={<CircleCheck className="h-3.5 w-3.5" />} label="Approve & release" /> : null}
                {model.showClientReview ? <GhostButton onClick={onRequestChanges} disabled={isActionLoading || model.revLeft <= 0} icon={<GitPullRequest className="h-3.5 w-3.5" />} label={model.revLeft <= 0 ? 'Limit reached' : 'Request revision'} /> : null}
                {model.showLeaveReview ? <PrimaryButton rt={rt} onClick={onReview} disabled={isActionLoading} icon={<Star className="h-3.5 w-3.5" />} label="Leave review" /> : null}
                {model.canDispute ? <DangerButton onClick={onDispute} disabled={isActionLoading} icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Open dispute" /> : null}
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
        <section className={`${surface} p-4 flex flex-col gap-4`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.04] pb-3">
                <div>
                    <p className={labelClass}>File Manager</p>
                    <h3 className="text-[15px] font-bold text-white mt-0.5">Shared & Delivery Assets</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {filters.map((filter) => (
                        <button key={filter.id} type="button" onClick={() => setFileFilter(filter.id)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors border ${
                                fileFilter === filter.id
                                    ? `${rt.accentBorder} ${rt.accentBg} text-[#0A0A0B] font-semibold`
                                    : 'border-white/[0.06] bg-white/[0.01] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12]'
                            }`}>
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
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
    // Escrow lifecycle phases
    const escrowPhases = [
        {
            key: 'funded',
            label: 'Escrow Funded',
            sub: 'Client secures contract budget',
            done: model.isEscrowFunded || ['active', 'delivery_submitted', 'revision_requested', 'completed'].includes(model.st),
        },
        {
            key: 'active',
            label: 'Work in Progress',
            sub: 'Freelancer works on deliverables',
            done: ['active', 'delivery_submitted', 'revision_requested', 'completed'].includes(model.st),
        },
        {
            key: 'submitted',
            label: 'Delivery Submitted',
            sub: 'Files submitted for review',
            done: ['delivery_submitted', 'revision_requested', 'completed'].includes(model.st) || model.st === 'revision_requested',
        },
        {
            key: 'approved',
            label: 'Client Approved',
            sub: 'Delivery approved by client',
            done: model.st === 'completed',
        },
        {
            key: 'released',
            label: 'Payment Released',
            sub: 'Escrow budget sent to freelancer',
            done: model.st === 'completed',
        },
    ];

    return (
        <section className={`${surface} p-4 flex flex-col gap-4`}>
            <div className="border-b border-white/[0.04] pb-3">
                <p className={labelClass}>Milestones</p>
                <h3 className="text-[15px] font-bold text-white mt-0.5">Escrow Lifecycle</h3>
            </div>

            {/* Vertical timeline */}
            <div className="relative flex flex-col gap-5 pl-6 mt-1">
                {/* Vertical connection track line */}
                <div className="absolute left-1.5 top-1 bottom-1 w-px bg-white/[0.08]" />
                {escrowPhases.map((phase, idx) => (
                    <div key={phase.key} className="relative flex items-start gap-3">
                        {/* Dot node */}
                        <div className={`absolute -left-[24px] top-1.5 flex h-2 w-2 rounded-full border ${
                            phase.done
                                ? `${rt.accentBg} border-transparent shadow-[0_0_8px_rgba(155,143,240,0.35)]`
                                : 'border-white/20 bg-[#0d0d11]'
                        }`} />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <p className={`text-[13px] font-bold ${phase.done ? 'text-white' : 'text-zinc-500'}`}>
                                    {phase.label}
                                </p>
                                {phase.done && (
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${rt.accentText}`}>
                                        Done
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{phase.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom Milestones list */}
            {model.milestones.length > 0 ? (
                <div className="border-t border-white/[0.04] pt-4 mt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">
                        Contract Milestones ({model.completedMilestones} / {model.milestones.length} completed)
                    </p>
                    <div className="relative flex flex-col gap-4 pl-6">
                        <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-white/[0.08]" />
                        {model.milestones.map((milestone, index) => {
                            const done = ['completed', 'approved', 'paid'].includes(ns(milestone.status));
                            const title = milestone.title || milestone.description || `Milestone ${index + 1}`;
                            return (
                                <div key={milestone.id || index} className="relative flex items-start gap-3">
                                    <div className={`absolute -left-[24px] top-1.5 flex h-2 w-2 rounded-full border ${
                                        done
                                            ? `${rt.accentBg} border-transparent`
                                            : 'border-white/20 bg-[#0d0d11]'
                                    }`} />
                                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                        <div>
                                            <p className={`text-[13px] font-bold ${done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                                {title}
                                            </p>
                                            <p className="text-[11px] text-zinc-400 mt-0.5">
                                                {milestone.due_date ? `Due ${fmtDate(milestone.due_date)}` : 'No due date'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-semibold text-zinc-300">
                                                {fmtAmount(milestone.amount)}
                                            </span>
                                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                                done ? 'border-green-500/20 bg-green-500/5 text-green-400' : 'border-white/10 bg-white/5 text-zinc-400'
                                            }`}>
                                                {done ? 'Paid' : 'Funded'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="border-t border-white/[0.04] pt-4 mt-2">
                    <CompactEmpty icon={<GitPullRequest className="h-3.5 w-3.5" />} title="No Custom Milestones" text="This contract uses the standard escrow lifecycle above." />
                </div>
            )}
        </section>
    );
}

function FilesEmptyState({ userRole, canDeliver, onDeliver }: { userRole: 'client' | 'freelancer'; canDeliver: boolean; onDeliver: () => void }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-400">
                    <FolderOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white">No files shared yet</p>
                    <p className="text-[12px] text-zinc-400 mt-0.5 leading-normal">{userRole === 'freelancer' ? 'Submit a delivery when files are ready.' : 'Files will appear here once freelancer delivers.'}</p>
                </div>
            </div>
            {userRole === 'freelancer' && canDeliver ? (
                <button type="button" onClick={onDeliver} className={`shrink-0 rounded-lg bg-[#1D9E75] px-3 py-1.5 text-[12px] font-bold text-[#0A0A0B] hover:bg-[#24b889] ${focusRing}`}>
                    Submit Delivery
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
        <section className={`${surface} p-4 flex flex-col gap-4`}>
            <div className="border-b border-white/[0.04] pb-3">
                <p className={labelClass}>Activity</p>
                <h3 className="text-[15px] font-bold text-white mt-0.5">Contract Event History</h3>
            </div>
            {list.length > 0 ? (
                <div className="relative flex flex-col gap-5 pl-6 mt-1">
                    {/* Vertical connector line */}
                    <div className="absolute left-1.5 top-1 bottom-1 w-px bg-white/[0.08]" />
                    {list.map(event => (
                        <ActivityRow key={event.id} event={event} rt={rt} />
                    ))}
                </div>
            ) : (
                <CompactEmpty icon={<Clock className="h-3.5 w-3.5" />} title="No activity yet" text="Contract events will appear here chronologically." />
            )}
        </section>
    );
}

function DeliveryFileRow({ file, type, userRole, onPreviewFile }: { file: ContractDeliveryAsset; type: 'review' | 'final'; userRole: 'client' | 'freelancer'; onPreviewFile: (file: ContractSharedFile) => void }) {
    const isFinal = type === 'final';
    const isReleased = file.accessState === 'released';
    const isLocked = isFinal && !isReleased;
    const canOpen = !isLocked || userRole === 'freelancer';
    
    const badge = !isFinal ? 'Review' : isReleased ? 'Released' : 'Locked';
    const badgeTone = !isFinal 
        ? 'border-amber-500/20 bg-amber-500/5 text-amber-400' 
        : isReleased 
        ? 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400' 
        : 'border-white/10 bg-white/5 text-zinc-400';
        
    const contractFile = { id: file.id, name: file.name, url: '', type: file.mimeType ?? null, size: file.sizeBytes ?? null, storageBucket: file.storageBucket ?? 'contract-files', storagePath: file.storagePath };

    return (
        <button type="button" onClick={() => canOpen ? onPreviewFile(contractFile) : undefined} disabled={!canOpen} 
            className={`group flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.01] p-3 text-left transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.03] disabled:cursor-default disabled:opacity-60 ${focusRing}`}>
            <FileIcon name={file.name} mimeType={file.mimeType} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-white group-hover:text-white transition-colors">{file.name}</p>
                <p className={`${monoClass} mt-0.5`}>Freelancer · {fmtSize(file.sizeBytes) || 'Size unknown'}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeTone}`}>{badge}</span>
            {canOpen ? (
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-200 transition-colors shrink-0" />
            ) : (
                <Lock className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            )}
        </button>
    );
}

function SharedFileRow({ file, onPreviewFile }: { file: ContractSharedFile; onPreviewFile: (file: ContractSharedFile) => void }) {
    return (
        <button type="button" onClick={() => onPreviewFile(file)} 
            className={`group flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.01] p-3 text-left transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.03] disabled:cursor-default ${focusRing}`}>
            <FileIcon name={file.name} mimeType={file.type} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-white group-hover:text-white transition-colors">{file.name}</p>
                <p className={`${monoClass} mt-0.5`}>{[file.senderName || 'Client upload', fmtDate(file.uploadedAt, 'Unknown'), fmtSize(file.size)].filter(Boolean).join(' · ')}</p>
            </div>
            <span className="shrink-0 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">Shared</span>
            <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-200 transition-colors shrink-0" />
        </button>
    );
}

function ActivityRow({ event, rt }: { event: ContractActivityEvent; rt: RoleTheme }) {
    const isSystem = event.system || event.actorRole === 'system' || event.kind === 'payment' || event.kind === 'system';
    
    const dotColor = isSystem 
        ? 'border-zinc-700 bg-[#0d0d11]' 
        : event.actorRole === 'client' 
        ? 'border-[#E8A020] bg-[#3D2A00]/60' 
        : 'border-[#9B8FF0] bg-[#2D2660]/60';

    return (
        <div className="relative flex flex-col gap-1">
            <div className={`absolute -left-[24px] top-1.5 flex h-2 w-2 rounded-full border-2 ${dotColor}`} />

            {isSystem ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="text-[12px] font-medium text-zinc-400">{event.text}</p>
                    {event.timestamp && (
                        <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                            {fmtTime(event.timestamp)}
                        </span>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <PartyAvatar party={{ full_name: event.actorName || undefined, avatar_url: event.actorAvatarUrl }} size="sm" />
                          <div className="min-w-0">
                              <p className="text-[13px] font-bold text-white truncate">
                                  {event.actorName || (event.actorRole === 'client' ? 'Client' : 'Freelancer')}
                              </p>
                          </div>
                        </div>
                        {event.timestamp && (
                            <span className="text-[10px] text-zinc-500 font-mono shrink-0 pt-0.5">
                                {fmtTime(event.timestamp)}
                            </span>
                        )}
                    </div>
                    <div className="text-[12px] text-zinc-300 leading-normal pl-8 mt-0.5">
                        {event.text}
                    </div>
                </div>
            )}
        </div>
    );
}

function TimelineMilestone({ milestone, index, rt }: { milestone: ContractMilestone; index: number; rt: RoleTheme }) {
    return null;
}

function InfoChip({ icon, label, hideOnMobile, className }: { icon: ReactNode; label: string; hideOnMobile?: boolean; className?: string }) {
    return <span className={`items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.01] px-2.5 py-1 font-mono text-[11px] text-zinc-400 ${hideOnMobile ? 'hidden sm:inline-flex' : 'inline-flex'} ${className ?? ''}`}>{icon}{label}</span>;
}

function FileIcon({ name, mimeType }: { name?: string | null; mimeType?: string | null }) {
    const value = `${name || ''} ${mimeType || ''}`.toLowerCase();
    const isImage = value.includes('image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(value);
    const isArchive = value.includes('zip') || value.includes('archive') || /\.(zip|rar|7z|tar|gz)$/i.test(value);
    const isPdf = value.includes('pdf') || /\.pdf$/i.test(value);
    
    const Icon = isImage ? Image : isArchive ? FileArchive : isPdf ? FileCheck2 : FileText;
    const bg = isImage ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        : isArchive ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
        : isPdf ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-sky-500/10 text-sky-400 border-sky-500/20';
        
    return (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${bg}`}>
            <Icon className="h-4 w-4" />
        </div>
    );
}

function LockedFinalNotice({ count }: { count: number }) {
    return (
        <div className="flex items-start gap-2.5 rounded-lg border border-[#BA7517]/25 bg-[#633806]/10 px-3.5 py-2.5 text-white">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#BA7517]" />
            <div>
                <p className="text-[13px] font-bold">{count} final {count === 1 ? 'file is' : 'files are'} pending release</p>
                <p className="text-[12px] text-zinc-400 leading-normal mt-0.5">Files remain locked and encrypted for the client until payments are approved.</p>
            </div>
        </div>
    );
}

function CompactEmpty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-500">{icon}</div>
            <div>
                <p className="text-[13px] font-semibold text-zinc-300">{title}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{text}</p>
            </div>
        </div>
    );
}

function PartyAvatar({ party, size = 'md' }: { party?: { full_name?: string; avatar_url?: string | null } | null; size?: 'sm' | 'md' | 'lg' }) {
    const dim = size === 'lg' ? 'h-9 w-9' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
    return (
        <div className={`relative flex ${dim} shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/[0.06] bg-white/[0.02] text-zinc-400`}>
            {party?.avatar_url ? <img src={party.avatar_url} alt={party.full_name || 'User'} className="h-full w-full object-cover" /> : <User className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
        </div>
    );
}

function PrimaryButton({ rt, onClick, disabled, icon, label }: { rt: RoleTheme; onClick?: () => void; disabled?: boolean; icon: ReactNode; label: string }) {
    return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50 ${rt.primaryBtn} ${focusRing} ${rt.focusRingColor}`}>{icon}{label}</button>;
}

function GhostButton({ onClick, disabled, icon, label }: { onClick?: () => void; disabled?: boolean; icon: ReactNode; label: string }) {
    return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[12px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-35 ${focusRing}`}>{icon}{label}</button>;
}

function DangerButton({ onClick, disabled, icon, label }: { onClick?: () => void; disabled?: boolean; icon: ReactNode; label: string }) {
    return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 rounded-lg border border-red-900/30 bg-red-950/20 px-3 py-1.5 text-[12px] font-medium text-red-400 transition-colors hover:bg-red-950/40 disabled:opacity-50 ${focusRing}`}>{icon}{label}</button>;
}
