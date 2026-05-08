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

const surface = 'border border-white/5 bg-[#161719] rounded-[16px] shadow-sm';
const surfaceHover = 'transition-all duration-200 hover:border-white/10 hover:bg-[#1A1C1E] hover:shadow-md';
const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]';
const bodyClass = 'text-[14px] font-normal leading-[1.6] text-[var(--color-text-secondary)]';
const monoClass = 'font-mono text-[13px] text-[var(--color-text-secondary)]';
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]';

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
        primaryBtn: 'bg-[#E8A020] hover:bg-[#f0aa28] text-[var(--color-bg-base)]',
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
        roleBadge: 'border-[#9B8FF0]/60 bg-[#9B8FF0]/10 text-[#9B8FF0]',
        headerStripe: 'from-[#9B8FF0]/15 to-transparent',
        primaryBtn: 'bg-[#9B8FF0] hover:bg-[#a99cf5] text-[var(--color-bg-base)]',
        focusRingColor: 'focus-visible:ring-[#9B8FF0]',
        tabAccent: 'bg-[#9B8FF0]',
        tabActiveBg: 'bg-[#9B8FF0]/15',
    };

const resolveStatus = (status: string) => {
    const st = ns(status);
    if (st === 'active') return { label: 'Active', tone: 'border-[#1D9E75] bg-[#0F6E56]/45 text-[var(--color-text-primary)] animate-[pulse_2s_ease-in-out_infinite]', accent: 'bg-[#1D9E75]', icon: <Clock className="h-3.5 w-3.5" /> };
    if (st === 'delivery_submitted') return { label: 'Review', tone: 'border-[#BA7517] bg-[#633806]/65 text-[var(--color-text-primary)]', accent: 'bg-[#BA7517]', icon: <FileCheck2 className="h-3.5 w-3.5" /> };
    if (st === 'revision_requested') return { label: 'Revision', tone: 'border-[#BA7517] bg-[#633806]/65 text-[var(--color-text-primary)]', accent: 'bg-[#BA7517]', icon: <GitPullRequest className="h-3.5 w-3.5" /> };
    if (st === 'completed') return { label: 'Completed', tone: 'border-[#7F77DD] bg-[#3C3489]/70 text-[var(--color-text-primary)]', accent: 'bg-[#7F77DD]', icon: <CheckCircle className="h-3.5 w-3.5" /> };
    if (st === 'disputed') return { label: 'Disputed', tone: 'border-[#A32D2D] bg-[#501313]/75 text-[var(--color-text-primary)]', accent: 'bg-[#A32D2D]', icon: <ShieldAlert className="h-3.5 w-3.5" /> };
    if (st === 'pending_payment') return { label: 'Pending', tone: 'border-[#185FA5] bg-[#042C53]/75 text-[var(--color-text-primary)]', accent: 'bg-[#185FA5]', icon: <Wallet className="h-3.5 w-3.5" /> };
    return { label: 'Syncing', tone: 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]', accent: 'bg-[var(--color-text-tertiary)]', icon: <AlertCircle className="h-3.5 w-3.5" /> };
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
        const showFreelancerDeliver = userRole === 'freelancer' && (isActive || isRevision) && !deliverySubmitted;
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
                        icon: <Wallet className="h-5 w-5" />,
                        title: 'Fund escrow to start',
                        body: `Secure ${fmtAmount(contract.amount)} in escrow. The freelancer will be notified and work begins immediately. Funds are only released when you approve the final delivery.`,
                        primaryLabel: 'Fund escrow',
                        accentColor: 'text-[#E8A020]',
                        iconColor: 'text-[#E8A020] bg-[#E8A020]/10 ring-[#E8A020]/20',
                    };
                }
                if (userRole === 'freelancer' && !isEscrowFunded) {
                    return {
                        icon: <Lock className="h-5 w-5" />,
                        title: 'Waiting for escrow',
                        body: 'The client needs to secure funds before you begin. You will be notified the moment escrow is funded and work can start.',
                        primaryLabel: null,
                        accentColor: 'text-[var(--color-text-secondary)]',
                        iconColor: 'text-white/60 bg-white/5 ring-white/10',
                    };
                }
                // Funded but contract not yet active
                return {
                    icon: <CheckCircle className="h-5 w-5" />,
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
                    icon: <PackageCheck className="h-5 w-5" />,
                    title: isRevision ? 'Submit revised delivery' : 'Submit delivery',
                    body: 'Attach review files and protected final files. Final assets stay locked until the client approves and releases payment.',
                    primaryLabel: isRevision ? 'Resubmit delivery' : 'Submit delivery',
                    accentColor: 'text-[#1D9E75]',
                    iconColor: 'text-[#1D9E75] bg-[#1D9E75]/10 ring-[#1D9E75]/20',
                };
            }
            if (showClientReview) {
                return {
                    icon: <FileCheck2 className="h-5 w-5" />,
                    title: 'Review submitted work',
                    body: 'Inspect review assets, then approve to release payment and unlock final files, request a revision, or open a dispute.',
                    primaryLabel: 'Approve & release',
                    accentColor: 'text-[#1D9E75]',
                    iconColor: 'text-[#1D9E75] bg-[#1D9E75]/10 ring-[#1D9E75]/20',
                };
            }
            if (userRole === 'freelancer' && isUnderReview) {
                return {
                    icon: <Timer className="h-5 w-5" />,
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
                    icon: <Star className="h-5 w-5" />,
                    title: 'Leave a review',
                    body: 'The contract is complete. Add a rating to build trust and close the loop.',
                    primaryLabel: 'Leave review',
                    accentColor: 'text-[#1D9E75]',
                    iconColor: 'text-[#1D9E75] bg-[#1D9E75]/10 ring-[#1D9E75]/20',
                };
            }
            if (isCompleted) {
                return {
                    icon: <CheckCircle className="h-5 w-5" />,
                    title: 'Contract closed',
                    body: 'Payment was released and final files are now available. This workspace is a permanent record.',
                    primaryLabel: null,
                    accentColor: 'text-[#7F77DD]',
                    iconColor: 'text-[#9B8FF0] bg-[#9B8FF0]/10 ring-[#9B8FF0]/20',
                };
            }
            return {
                icon: <Clock className="h-5 w-5" />,
                title: 'Work in progress',
                body: 'Keep the conversation open while work continues.',
                primaryLabel: null,
                accentColor: 'text-[var(--color-text-secondary)]',
                iconColor: 'text-white/60 bg-white/5 ring-white/10',
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
                <div className="flex shrink-0 items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-4 min-w-0">
                        {/* Navigation Actions */}
                        <div className="flex items-center gap-2 pr-4 border-r border-white/10 shrink-0">
                            {onGoBack && (
                                <button type="button" onClick={onGoBack} className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white/[0.03] text-[var(--color-text-secondary)] hover:bg-white/[0.06] hover:text-white transition-colors border border-white/[0.02]">
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                            )}
                            {onGoToMessages && (
                                <button type="button" onClick={onGoToMessages} className="flex h-8 items-center gap-1.5 rounded-[8px] px-3 bg-white/[0.03] text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-white/[0.06] hover:text-white transition-colors border border-white/[0.02]">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Messages
                                </button>
                            )}
                        </div>

                        {/* Title & Status */}
                        <div className="flex items-center gap-3 min-w-0">
                            <PartyAvatar party={model.otherParty} size="sm" />
                            <div className="flex flex-col min-w-0 gap-0.5">
                                <div className="flex items-center gap-2">
                                    <h2 className="truncate text-[15px] font-bold text-white leading-tight">
                                        {contract.job?.title || 'Untitled contract'}
                                    </h2>
                                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-[1px] text-[9px] font-bold tracking-wide uppercase leading-none ${model.status.tone}`}>
                                        {model.status.icon}{model.status.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-tertiary)] leading-none">
                                    <span className={`inline-flex items-center rounded text-[10px] font-bold uppercase tracking-wider ${rt.accentText}`}>
                                        {rt.roleLabel}
                                    </span>
                                    <span>•</span>
                                    <span className="truncate">with {model.otherParty?.full_name || 'counterparty'}</span>
                                    {contract.job?.deadline ? (
                                        <>
                                            <span>•</span>
                                            <span>Due {fmtDate(contract.job.deadline)}</span>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Amount */}
                    <div className="hidden flex-col items-end shrink-0 pl-4 sm:flex">
                        <span className={`text-[16px] font-bold leading-tight ${rt.accentText}`}>
                            {fmtAmount(contract.amount)}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Shield className="h-3 w-3 text-[#1D9E75]" />
                            <span className="text-[10px] font-medium text-[#1D9E75] uppercase tracking-wider leading-none">
                                {model.isEscrowFunded ? 'In escrow' : 'Pending escrow'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tab Bar Row */}
                <div className="flex items-center justify-between px-6">
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
                                className={`relative flex items-center gap-1.5 rounded-t-[6px] px-3 text-[12px] font-semibold transition-colors duration-150 border-b-2 ${focusRing} ${rt.focusRingColor} ${
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
                    <div className="hidden lg:flex items-center gap-3.5 rounded-full border border-white/[0.06] bg-[#161719] px-4 py-1.5 shadow-sm mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">Progress</span>
                        <div className="w-[180px] h-1.5 overflow-hidden rounded-full bg-[#0A0A0B] shadow-inner ring-1 ring-inset ring-white/10">
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out relative ${rt.accentBg}`} style={{ width: `${model.progressPct}%` }}>
                                <div className="absolute inset-0 bg-white/20 rounded-full mix-blend-overlay" />
                            </div>
                        </div>
                        <span className={`text-[11px] font-black tracking-wider ${rt.accentText}`}>{model.progressPct}%</span>
                    </div>
                </div>
            </header>

            {/* Tab panels */}
            <main
                key={activeTab}
                id={`contract-workspace-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`contract-workspace-tab-${activeTab}`}
                className="flex-1 animate-[contractTabIn_160ms_ease-out] px-4 py-8 sm:px-8 sm:py-10"
            >
                <div className="mx-auto w-full max-w-[1600px]">
                {activeTab === 'overview' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {model.st === 'completed' ? <CompletedSummary model={model} rt={rt} onReview={onReview} /> : null}
                            {model.st !== 'completed' || model.showLeaveReview ? <NextMoveCard model={model} rt={rt} isActionLoading={isActionLoading} onDeliver={onDeliver} onRequestChanges={onRequestChanges} onAcceptAndPay={onAcceptAndPay} onDispute={onDispute} onCancel={onCancel} onFundEscrow={onFundEscrow} onReview={onReview} setActiveTab={setActiveTab} /> : null}
                        </div>
                        <div className="lg:col-span-1">
                            <ContractPulse model={model} rt={rt} />
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
                    <div className="w-full max-w-lg rounded-[10px] bg-[var(--color-bg-elevated)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className={labelClass}>File preview</p>
                                <h3 className="mt-1 truncate text-[18px] font-medium tracking-[-0.01em] text-[var(--color-text-primary)]">{previewFile.name}</h3>
                                <p className={monoClass}>{[previewFile.senderName, fmtDate(previewFile.uploadedAt, 'Unknown'), fmtSize(previewFile.size)].filter(Boolean).join(' · ') || 'Protected contract file'}</p>
                            </div>
                            <button ref={previewCloseRef} type="button" onClick={() => setPreviewFile(null)} className={`rounded-[10px] border-[0.5px] border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] ${focusRing}`}>Close</button>
                        </div>
                        <div className="mt-4 rounded-[10px] border-[0.5px] border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] p-4">
                            <p className={bodyClass}>Preview opens in a secure focused step first. Use Open file to view or download the asset according to contract access rules.</p>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setPreviewFile(null)} className={`rounded-[10px] border-[0.5px] border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2 text-[14px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] ${focusRing}`}>Cancel</button>
                            <button type="button" onClick={() => { const file = previewFile; setPreviewFile(null); onOpenSharedFile?.(file); }} className={`rounded-[10px] bg-[#1D9E75] px-3 py-2 text-[14px] font-medium text-[var(--color-text-primary)] hover:bg-[#24b889] ${focusRing}`}>Open file</button>
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
        <section className="rounded-[16px] border border-[var(--color-border-subtle)] bg-[#161719] px-5 py-5 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#9B8FF0]/10 ring-1 ring-[#9B8FF0]/20">
                    <CheckCircle className="h-5 w-5 text-[#9B8FF0]" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className={labelClass}>Contract closed</p>
                    <h3 className="mt-1 text-[16px] font-bold text-[var(--color-text-primary)]">
                        {fmtAmount(model.amount)} released to freelancer
                    </h3>
                    <div className="mt-2 flex flex-col gap-1 text-[13px] font-medium text-[var(--color-text-secondary)]">
                        {model.fundedAt && <p>• Escrow funded: {fmtDate(model.fundedAt)}</p>}
                        {model.deliverySubmittedAt && <p>• Delivery submitted: {fmtDate(model.deliverySubmittedAt)}</p>}
                    </div>
                </div>
                <span className={`rounded-full border px-2.5 py-1 font-mono text-[12px] ${rt.roleBadge}`}>
                    {model.revUsed}/{model.revMax} rev used
                </span>
            </div>
            {model.showLeaveReview ? (
                <div className="mt-4 flex justify-end">
                    <button type="button" onClick={onReview} className="text-[13px] font-medium text-[var(--color-text-primary)] underline transition-colors hover:text-[#9B8FF0]">
                        Leave a review to complete the record
                    </button>
                </div>
            ) : null}
        </section>
    );
}

function ContractPulse({ model, rt }: { model: WorkspaceModel; rt: RoleTheme }) {
    const stats = [
        { label: 'Milestones', value: `${model.completedMilestones}/${model.milestones.length || 0}`, hint: 'completed' },
        { label: 'Files', value: String(model.allFileCount), hint: `${model.reviewFiles.length} review · ${model.finalFiles.length + model.lockedFinalFilesCount} final` },
        { label: 'Revisions', value: `${model.revUsed}/${model.revMax}`, hint: 'used' },
    ];
    return (
        <section className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="relative overflow-hidden rounded-[16px] border border-white/5 bg-[#161719] p-5 shadow-sm transition-all hover:border-white/10 hover:bg-[#1A1C1E]">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">{stat.label}</p>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className={`text-[24px] font-black leading-none tracking-tight ${rt.accentText}`}>{stat.value}</span>
                        </div>
                        <p className="mt-1.5 text-[12px] font-medium text-[var(--color-text-secondary)]">{stat.hint}</p>
                        {/* Decorative background glow */}
                        <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-[0.03] blur-2xl ${rt.accentBg}`} />
                    </div>
                ))}
            </div>
        </section>
    );
}

function ReviewCountdown({ targetIso }: { targetIso: string }) {
    const tick = useCountdown(targetIso);
    if (!tick || tick.expired) return (
        <div className="mt-3 inline-flex items-center gap-2 rounded-[8px] bg-[#A32D2D]/20 px-3 py-1.5 border border-[#A32D2D]/30">
            <Timer className="h-4 w-4 text-[#A32D2D]" />
            <span className="text-[13px] font-medium text-[#A32D2D]">Review period expired</span>
        </div>
    );
    return (
        <div className="mt-3 inline-flex items-center gap-2 rounded-[8px] bg-[#BA7517]/20 px-3 py-1.5 border border-[#BA7517]/30">
            <Timer className="h-4 w-4 text-[#BA7517]" />
            <span className="text-[13px] font-medium text-[#BA7517]">
                Review due in {tick.days}d {tick.hours}h {tick.minutes}m
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
        <section className="relative overflow-hidden rounded-[16px] border border-white/5 bg-[#161719] shadow-md">
            {/* Subtle top glow from accent color */}
            <div className="absolute inset-x-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

            {/* Hero top: icon + label + title */}
            <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                    {/* Large icon */}
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] ${model.nextMove.iconColor || 'bg-white/5 text-white/70'} shadow-inner ring-1`}>
                        <span className="[&>svg]:h-6 [&>svg]:w-6">{model.nextMove.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className={`text-[11px] font-bold uppercase tracking-[0.1em] mb-1 ${model.nextMove.accentColor || 'text-[var(--color-text-tertiary)]'}`}>Current Status</p>
                        <h3 className="text-[20px] sm:text-[24px] font-bold leading-tight tracking-tight text-[var(--color-text-primary)]">{model.nextMove.title}</h3>
                        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)] max-w-xl">{model.nextMove.body}</p>
                        
                        {/* Task 3.2: Show Revision Feedback */}
                        {model.st === 'revision_requested' && model.lastRevisionNote ? (
                            <div className="mt-3 rounded-[10px] border border-[#BA7517]/30 bg-[#633806]/20 p-3">
                                <p className="text-[12px] font-semibold text-[#BA7517] uppercase tracking-wider mb-1">Client Feedback</p>
                                <p className="text-[14px] text-[var(--color-text-primary)] whitespace-pre-wrap">{model.lastRevisionNote}</p>
                            </div>
                        ) : null}
                        
                        {/* Task 3.1: Countdown Timer on Delivery Review */}
                        {model.showClientReview && model.reviewDueAt ? (
                            <ReviewCountdown targetIso={model.reviewDueAt} />
                        ) : null}
                    </div>
                </div>

                {/* Escrow funded indicator */}
                {model.st === 'pending_payment' && model.isEscrowFunded ? (
                    <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-[#1D9E75]/30 bg-[#0F6E56]/20 px-4 py-2.5">
                        <CheckCircle className="h-4 w-4 shrink-0 text-[#1D9E75]" />
                        <span className="text-[13px] font-medium text-[#1D9E75]">Escrow funded — funds secured by platform</span>
                    </div>
                ) : null}

                {/* Escrow unfunded warning */}
                {isPendingEscrow ? (
                    <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-[#E8A020]/30 bg-[#3D2A00]/40 px-4 py-2.5">
                        <AlertCircle className="h-4 w-4 shrink-0 text-[#E8A020]" />
                        <span className="text-[13px] font-medium text-[#E8A020]">No work begins until escrow is funded</span>
                    </div>
                ) : null}
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-white/5" />

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 p-4 sm:px-6 sm:py-4 bg-[#0A0A0B]/40">
                {/* Primary CTA */}
                {action && model.nextMove.primaryLabel ? (
                    <button type="button" onClick={action} disabled={Boolean(isActionLoading)}
                        className={`rounded-[8px] px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-60 ${rt.primaryBtn} ${focusRing} ${rt.focusRingColor}`}>
                        {isActionLoading ? 'Processing…' : model.nextMove.primaryLabel}
                    </button>
                ) : isPendingEscrow ? (
                    <button type="button" onClick={() => onFundEscrow?.()}
                        className={`rounded-[8px] px-4 py-2 text-[13px] font-bold transition-colors ${rt.primaryBtn} ${focusRing} ${rt.focusRingColor}`}>
                        Fund escrow now
                    </button>
                ) : null}

                {/* Request revision */}
                {showSecondaryActions ? (
                    <GhostButton
                        onClick={onRequestChanges}
                        disabled={isActionLoading || model.revLeft <= 0}
                        icon={<GitPullRequest className="h-4 w-4" />}
                        label={model.revLeft <= 0 ? 'Revision limit reached' : `Request revision (${model.revLeft} left)`}
                    />
                ) : null}

                {/* Dispute */}
                {model.canDispute ? (
                    <DangerButton onClick={onDispute} disabled={Boolean(isActionLoading)} icon={<ShieldAlert className="h-4 w-4" />} label="Open dispute" />
                ) : null}

                {/* Cancel contract */}
                {(model.st === 'pending_payment' || model.st === 'active') && onCancel ? (
                    <GhostButton
                        onClick={onCancel}
                        disabled={Boolean(isActionLoading)}
                        icon={<AlertCircle className="h-4 w-4" />}
                        label="Cancel contract"
                    />
                ) : null}

                {/* View history */}
                <button type="button" onClick={() => setActiveTab('activity')}
                    className={`ml-auto rounded-[10px] px-3 py-2 text-[13px] font-medium text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)] ${focusRing} ${rt.focusRingColor}`}>
                    View history →
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
        <section className="rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className={labelClass}>Quick actions</p>
                <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--color-text-secondary)]">{model.revLeft} rev left</span>
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
                    <h3 className="mt-1 text-[18px] font-medium tracking-[-0.01em] text-[var(--color-text-primary)]">Shared, review, and final assets</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {filters.map((filter) => (
                        <button key={filter.id} type="button" onClick={() => setFileFilter(filter.id)}
                            className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${focusRing} ${rt.focusRingColor} ${
                                fileFilter === filter.id
                                    ? `${rt.accentBg} border-transparent text-[var(--color-bg-base)] font-semibold`
                                    : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
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
    // Escrow lifecycle phases — always shown even with 0 DB milestones
    const escrowPhases = [
        {
            key: 'funded',
            label: 'Escrow Funded',
            sub: 'Client secures funds',
            done: model.isEscrowFunded || ['active', 'delivery_submitted', 'revision_requested', 'completed'].includes(model.st),
        },
        {
            key: 'active',
            label: 'Work in Progress',
            sub: 'Freelancer working',
            done: ['active', 'delivery_submitted', 'revision_requested', 'completed'].includes(model.st),
        },
        {
            key: 'submitted',
            label: 'Delivery Submitted',
            sub: 'Work sent for review',
            done: ['delivery_submitted', 'revision_requested', 'completed'].includes(model.st) || Boolean(model.st === 'revision_requested'),
        },
        {
            key: 'approved',
            label: 'Client Approved',
            sub: 'Review accepted',
            done: model.st === 'completed',
        },
        {
            key: 'released',
            label: 'Payment Released',
            sub: 'Funds sent to freelancer',
            done: model.st === 'completed',
        },
    ];

    return (
        <section className={`${surface} ${surfaceHover} px-4 py-[14px]`}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className={labelClass}>Milestones</p>
                    <h3 className="mt-1 text-[18px] font-medium tracking-[-0.01em] text-[var(--color-text-primary)]">Escrow lifecycle</h3>
                </div>
            </div>

            {/* Escrow timeline */}
            <div className="mt-5 overflow-x-auto pb-2">
                <div className="relative flex min-w-max gap-0 px-1">
                    {/* Connecting line */}
                    <div className="absolute left-5 right-5 top-4 h-px bg-white/10" />
                    <div
                        className={`absolute left-5 top-4 h-px transition-all duration-700 ${rt.accentBg}`}
                        style={{ width: `calc(${(escrowPhases.filter(p => p.done).length / (escrowPhases.length - 1)) * 100}% - 2.5rem)` }}
                    />
                    {escrowPhases.map((phase, idx) => (
                        <div key={phase.key} className={`relative flex w-36 shrink-0 flex-col items-center gap-2 pt-0 ${
                            idx === 0 ? 'items-start' : idx === escrowPhases.length - 1 ? 'items-end' : 'items-center'
                        }`}>
                            <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                phase.done
                                    ? `${rt.accentBg} border-transparent text-[var(--color-bg-base)]`
                                    : model.st !== 'completed' && escrowPhases[idx - 1]?.done
                                    ? `border-[${rt.accent}] bg-transparent text-[${rt.accent}]`
                                    : 'border-white/10 bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)]'
                            }`}>
                                {phase.done
                                    ? <CheckCircle className="h-4 w-4" />
                                    : <span className="text-[11px] font-bold">{idx + 1}</span>
                                }
                            </div>
                            <div className={`text-center ${
                                idx === 0 ? 'text-left' : idx === escrowPhases.length - 1 ? 'text-right' : 'text-center'
                            }`}>
                                <p className={`text-[12px] font-semibold ${
                                    phase.done ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'
                                }`}>{phase.label}</p>
                                <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">{phase.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* DB milestones (if any) */}
            {model.milestones.length > 0 ? (
                <div className="mt-6 overflow-x-auto pb-2">
                    <p className={`mb-3 ${labelClass}`}>Contract milestones ({model.completedMilestones}/{model.milestones.length} done)</p>
                    <div className="relative flex min-w-max gap-5 px-1">
                        <div className="absolute left-5 right-5 top-5 h-px bg-white/10" />
                        <div className={`absolute left-5 top-5 h-px ${rt.accentBg}`} style={{ width: `calc(${model.progressPct}% - 2.5rem)` }} />
                        {model.milestones.map((milestone, index) => <TimelineMilestone key={milestone.id || index} milestone={milestone} index={index} rt={rt} />)}
                    </div>
                </div>
            ) : (
                <div className="mt-4">
                    <CompactEmpty icon={<GitPullRequest className="h-4 w-4" />} title="No custom milestones" text="This contract uses the standard escrow lifecycle above." />
                </div>
            )}
        </section>
    );
}

function FilesEmptyState({ userRole, canDeliver, onDeliver }: { userRole: 'client' | 'freelancer'; canDeliver: boolean; onDeliver: () => void }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-[10px] border-[0.5px] border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-[14px]">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-[0.5px] border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)]"><FolderOpen className="h-4 w-4" /></div>
                <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[var(--color-text-secondary)]">No files shared yet</p>
                    <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">{userRole === 'freelancer' ? 'Upload a delivery when work is ready.' : 'Files will appear after the freelancer delivers or shares assets.'}</p>
                </div>
            </div>
            {userRole === 'freelancer' && canDeliver ? (
                <button type="button" onClick={onDeliver} className={`shrink-0 rounded-[10px] bg-[#1D9E75] px-3 py-2 text-[13px] font-medium text-[var(--color-text-primary)] hover:bg-[#24b889] ${focusRing}`}>
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
                <h3 className="mt-1 text-[18px] font-medium tracking-[-0.01em] text-[var(--color-text-primary)]">Contract event history</h3>
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
    const rowTone = !isFinal ? 'border-l-[#BA7517]' : isReleased ? 'border-l-[#7F77DD]' : 'border-l-[var(--color-text-tertiary)]';
    const badge = !isFinal ? 'Review Asset' : isReleased ? 'Released' : 'Pending';
    const badgeTone = !isFinal ? 'border-[#BA7517] bg-[#633806]/65 text-[var(--color-text-primary)]' : isReleased ? 'border-[#7F77DD] bg-[#3C3489]/70 text-[var(--color-text-primary)]' : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]';
    const contractFile = { id: file.id, name: file.name, url: '', type: file.mimeType ?? null, size: file.sizeBytes ?? null, storageBucket: file.storageBucket ?? 'contract-files', storagePath: file.storagePath };

    return (
        <button type="button" onClick={() => canOpen ? onPreviewFile(contractFile) : undefined} disabled={!canOpen} className={`group flex w-full items-center gap-2 rounded-[10px] border-[0.5px] border-l-[3px] border-[var(--color-border-subtle)] ${rowTone} bg-[var(--color-bg-elevated)] px-4 py-[14px] text-left transition-colors duration-[60ms] hover:border-[rgba(255,255,255,0.12)] hover:bg-[var(--color-bg-muted)] disabled:cursor-default ${focusRing}`}>
            <FileIcon name={file.name} mimeType={file.mimeType} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-[var(--color-text-primary)]">{file.name}</p>
                <p className={monoClass}>Freelancer · {fmtSize(file.sizeBytes) || 'Size unknown'}</p>
            </div>
            <span className={`hidden shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.06em] sm:inline-flex ${badgeTone}`}>{badge}</span>
            {canOpen ? <span className="hidden translate-x-1 text-[13px] font-medium text-[var(--color-text-secondary)] opacity-0 transition-all duration-[60ms] group-hover:translate-x-0 group-hover:text-[var(--color-text-primary)] group-hover:opacity-100 sm:inline">Preview</span> : null}
            {canOpen ? <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)] transition-colors duration-[60ms] group-hover:text-[var(--color-text-primary)]" /> : <Lock className="h-4 w-4 text-[var(--color-text-tertiary)]" />}
        </button>
    );
}

function SharedFileRow({ file, onPreviewFile }: { file: ContractSharedFile; onPreviewFile: (file: ContractSharedFile) => void }) {
    return (
        <button type="button" onClick={() => onPreviewFile(file)} className={`group flex w-full items-center gap-2 rounded-[10px] border-[0.5px] border-l-[3px] border-[var(--color-border-subtle)] border-l-[#185FA5] bg-[var(--color-bg-elevated)] px-4 py-[14px] text-left transition-colors duration-[60ms] hover:border-[rgba(255,255,255,0.12)] hover:bg-[var(--color-bg-muted)] disabled:cursor-default ${focusRing}`}>
            <FileIcon name={file.name} mimeType={file.type} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-[var(--color-text-primary)]">{file.name}</p>
                <p className={monoClass}>{[file.senderName || 'Client upload', fmtDate(file.uploadedAt, 'Unknown'), fmtSize(file.size)].filter(Boolean).join(' · ')}</p>
            </div>
            <span className="hidden shrink-0 rounded-full border border-[#185FA5] bg-[#042C53]/75 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-text-primary)] sm:inline-flex">Shared</span>
            <span className="hidden translate-x-1 text-[13px] font-medium text-[var(--color-text-secondary)] opacity-0 transition-all duration-[60ms] group-hover:translate-x-0 group-hover:text-[var(--color-text-primary)] group-hover:opacity-100 sm:inline">Preview</span>
            <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)] transition-colors duration-[60ms] group-hover:text-[var(--color-text-primary)]" />
        </button>
    );
}

function ActivityRow({ event }: { event: ContractActivityEvent }) {
    const isSystem = event.system || event.actorRole === 'system' || event.kind === 'payment' || event.kind === 'system';
    if (isSystem) {
        return (
            <div className="flex justify-center">
                <div className="rounded-full border-[0.5px] border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-center text-[13px] font-medium text-[var(--color-text-secondary)]">
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
                    <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{event.actorName || (event.actorRole === 'client' ? 'Client' : 'Freelancer')}</p>
                    {event.actorRole ? <span className="rounded-full border-[0.5px] border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">{event.actorRole}</span> : null}
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
                done ? `${rt.accentBg} border-transparent text-[var(--color-bg-base)]` : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)]'
            }`}>
                {done ? <CheckCircle className="h-4 w-4" /> : <span className="text-[13px] font-semibold">{index + 1}</span>}
            </div>
            <div className="rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-3">
                <p className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">{title}</p>
                <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">{fmtDate(milestone.due_date)}</p>
                <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    done ? `${rt.accentBorder} ${rt.accentFill} ${rt.accentText}` : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)]'
                }`}>{done ? 'Done' : 'Open'}</span>
            </div>
        </div>
    );
}

function InfoChip({ icon, label, hideOnMobile, className }: { icon: ReactNode; label: string; hideOnMobile?: boolean; className?: string }) {
    return <span className={`items-center gap-1.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-2.5 py-1 font-mono text-[12px] text-[var(--color-text-secondary)] ${hideOnMobile ? 'hidden sm:inline-flex' : 'inline-flex'} ${className ?? ''}`}>{icon}{label}</span>;
}

function FileIcon({ name, mimeType }: { name?: string | null; mimeType?: string | null }) {
    const value = `${name || ''} ${mimeType || ''}`.toLowerCase();
    const Icon = value.includes('image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(value) ? Image : value.includes('zip') || value.includes('archive') ? FileArchive : FileText;
    return <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border-[0.5px] border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]"><Icon className="h-4 w-4" /></div>;
}

function LockedFinalNotice({ count }: { count: number }) {
    return (
        <div className="flex items-start gap-3 rounded-[10px] border-[0.5px] border-l-[3px] border-[#BA7517] border-l-[#BA7517] bg-[#633806]/35 px-4 py-[14px] text-[var(--color-text-primary)]">
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
        <div className="flex items-center gap-3 rounded-[10px] border-[0.5px] border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-[14px]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-[0.5px] border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)]">{icon}</div>
            <div><p className="text-[14px] font-medium text-[var(--color-text-secondary)]">{title}</p><p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">{text}</p></div>
        </div>
    );
}

function PartyAvatar({ party, size = 'md' }: { party?: { full_name?: string; avatar_url?: string | null } | null; size?: 'sm' | 'md' | 'lg' }) {
    const dim = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
    return (
        <div className={`relative flex ${dim} shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]`}>
            {party?.avatar_url ? <img src={party.avatar_url} alt={party.full_name || 'User'} className="h-full w-full object-cover" /> : <User className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
        </div>
    );
}

function PrimaryButton({ rt, onClick, disabled, icon, label }: { rt: RoleTheme; onClick?: () => void; disabled?: boolean; icon: ReactNode; label: string }) {
    return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-[14px] font-semibold transition-colors disabled:opacity-50 ${rt.primaryBtn} ${focusRing} ${rt.focusRingColor}`}>{icon}{label}</button>;
}

function GhostButton({ onClick, disabled, icon, label }: { onClick?: () => void; disabled?: boolean; icon: ReactNode; label: string }) {
    return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-2 rounded-[10px] border-[0.5px] border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2 text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors duration-[80ms] hover:border-[rgba(255,255,255,0.12)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-35 ${focusRing}`}>{icon}{label}</button>;
}

function DangerButton({ onClick, disabled, icon, label }: { onClick?: () => void; disabled?: boolean; icon: ReactNode; label: string }) {
    return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-2 rounded-[10px] border-[0.5px] border-[#A32D2D] bg-[#501313]/75 px-3 py-2 text-[14px] font-medium text-[var(--color-text-primary)] transition-colors duration-[80ms] hover:bg-[#6a1919] disabled:opacity-50 ${focusRing}`}>{icon}{label}</button>;
}



