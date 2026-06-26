import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from '@/i18n';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  FileCheck2,
  GitPullRequest,
  MessageSquare,
  PackageCheck,
  ShieldAlert,
  Shield,
  Star,
  Wallet,
  Timer,
  Globe,
} from "lucide-react";
import { CountdownTimer } from '../ui';
import MilestoneTimeline from './MilestoneTimeline';
import { ns, fmtDate, fmtTime, fmtSize, fmtAmount, roleTheme, labelClass, type RoleTheme } from './contractUtils';
import { useCountdown } from './useCountdown';
import { CompactEmpty, PartyAvatar } from './sidebarPrimitives';
import type { ContractSidebarData, ContractSharedFile, ContractMilestone, ContractActivityEvent, WorkspaceModel } from './types';
import { CompletedSummary, ContractPulse, ReviewCountdown, EscrowLifecycleStepper, NextMoveCard } from './ControlSections';
import { DeliveryFileHeroCard, DeliveryLinkHeroCard, EscrowVaultVisualizer, FilesTab } from './FileCardsSection';

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
    onOpenWorkspace?: () => void;
    onHoldClearance?: () => void;
    onAcceptMilestone?: (milestoneId: string) => Promise<void>;
    onHoldMilestoneClearance?: (milestoneId: string) => void;
}

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
    onOpenWorkspace,
    onHoldClearance,
    onAcceptMilestone,
    onHoldMilestoneClearance,
}: ContractDetailsSidebarProps) {
    const { tx } = useTranslation();
    const resolveStatus = (status: string) => {
        const st = ns(status);
        if (st === 'active') return { label: tx('pages.messages.contractDetails.statusActive'), tone: 'border-[#1D9E75]/30 bg-[#0F6E56]/20 text-white', accent: 'bg-[#1D9E75]', icon: <Clock className="h-3 w-3" /> };
        if (st === 'delivery_submitted') return { label: tx('pages.messages.contractDetails.statusReview'), tone: 'border-[#BA7517]/30 bg-[#633806]/35 text-white', accent: 'bg-[#BA7517]', icon: <FileCheck2 className="h-3 w-3" /> };
        if (st === 'revision_requested') return { label: tx('pages.messages.contractDetails.statusRevision'), tone: 'border-[#BA7517]/30 bg-[#633806]/35 text-white', accent: 'bg-[#BA7517]', icon: <GitPullRequest className="h-3 w-3" /> };
        if (st === 'completed') return { label: tx('pages.messages.contractDetails.statusCompleted'), tone: 'border-[#7F77DD]/30 bg-[#3C3489]/40 text-white', accent: 'bg-[#7F77DD]', icon: <CheckCircle className="h-3 w-3" /> };
        if (st === 'disputed') return { label: tx('pages.messages.contractDetails.statusDisputed'), tone: 'border-[#A32D2D]/30 bg-[#501313]/40 text-white', accent: 'bg-[#A32D2D]', icon: <ShieldAlert className="h-3 w-3" /> };
        if (st === 'pending_payment') return { label: tx('pages.messages.contractDetails.statusPending'), tone: 'border-[#185FA5]/30 bg-[#042C53]/45 text-white', accent: 'bg-[#185FA5]', icon: <Wallet className="h-3 w-3" /> };
        return { label: tx('pages.messages.contractDetails.statusSyncing'), tone: 'border-white/10 bg-white/5 text-zinc-400', accent: 'bg-zinc-500', icon: <AlertCircle className="h-3 w-3" /> };
    };
    const [fileFilter, setFileFilter] = useState<FileFilter>('all');
    const [previewFile, setPreviewFile] = useState<ContractSharedFile | null>(null);
    const previewCloseRef = useRef<HTMLButtonElement | null>(null);

    const [sandboxUrl, setSandboxUrl] = useState<string | null>(null);
    const [sandboxLabel, setSandboxLabel] = useState<string>('');
    const [sandboxViewport, setSandboxViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    const handleInspectPreview = (url: string, label: string, category: string) => {
        if (category === 'figma') {
            setSandboxUrl(`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`);
        } else {
            setSandboxUrl(url);
        }
        setSandboxLabel(label);
        setSandboxViewport('desktop');
    };

    const model = useMemo<WorkspaceModel | null>(() => {
        if (!contract) return null;

        const st = ns(currentStatus);
        const milestones = contract.milestones ?? [];
                const reviewFiles = contract.reviewFiles ?? [];
        const finalFiles = contract.finalFiles ?? [];
        const deliveryLinks = contract.deliveryLinks ?? [];
        const reviewLinks = deliveryLinks.filter(l => l.link_kind === 'review_link');
        const finalLinks = deliveryLinks.filter(l => l.link_kind === 'final_link');
        const sharedFiles = contract.sharedFiles ?? [];
        const lockedFinalFilesCount = contract.lockedFinalFilesCount ?? 0;
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
            if (isPendingPayment) {
                if (userRole === 'client' && !isEscrowFunded) {
                    return {
                        icon: <Wallet className="h-5 w-5" />,
                        title: tx('pages.messages.contractDetails.fundEscrowTitle'),
                        body: tx('pages.messages.contractDetails.fundEscrowBody', { amount: fmtAmount(contract.amount), name: otherParty?.full_name || '' }),
                        primaryLabel: tx('pages.messages.contractDetails.fundEscrowLabel'),
                        accentColor: 'text-[#E8A020]',
                        iconColor: 'text-[#E8A020] bg-[#E8A020]/10 ring-[#E8A020]/20',
                    };
                }
                if (userRole === 'freelancer' && !isEscrowFunded) {
                    return {
                        icon: <Lock className="h-5 w-5" />,
                        title: tx('pages.messages.contractDetails.waitingEscrowTitle'),
                        body: tx('pages.messages.contractDetails.waitingEscrowBody'),
                        primaryLabel: null,
                        accentColor: 'text-zinc-500',
                        iconColor: 'text-zinc-400 bg-white/5 ring-white/10',
                    };
                }
                return {
                    icon: <CheckCircle className="h-5 w-5" />,
                    title: userRole === 'freelancer' ? tx('pages.messages.contractDetails.escrowFundedTitle') : tx('pages.messages.contractDetails.escrowFundedTitle'),
                    body: userRole === 'freelancer'
                        ? tx('pages.messages.contractDetails.escrowFundedBody')
                        : tx('pages.messages.contractDetails.escrowFundedBody'),
                    primaryLabel: userRole === 'freelancer' ? tx('pages.messages.contractDetails.submitDeliveryLabel') : null,
                    accentColor: 'text-[#1D9E75]',
                    iconColor: 'text-[#1D9E75] bg-[#1D9E75]/10 ring-[#1D9E75]/20',
                };
            }
            if (showFreelancerDeliver) {
                return {
                    icon: <PackageCheck className="h-5 w-5" />,
                    title: isRevision ? tx('pages.messages.contractDetails.resubmitDeliveryTitle') : tx('pages.messages.contractDetails.submitDeliveryTitle'),
                    body: isRevision
                        ? tx('pages.messages.contractDetails.resubmitDeliveryBody')
                        : tx('pages.messages.contractDetails.submitDeliveryBody'),
                    primaryLabel: isRevision ? tx('pages.messages.contractDetails.resubmitDeliveryLabel') : tx('pages.messages.contractDetails.submitDeliveryLabel'),
                    accentColor: 'text-[#1D9E75]',
                    iconColor: 'text-[#1D9E75] bg-[#1D9E75]/10 ring-[#1D9E75]/20',
                };
            }
            if (showClientReview) {
                return {
                    icon: <FileCheck2 className="h-5 w-5" />,
                    title: tx('pages.messages.contractDetails.awaitingReviewTitle'),
                    body: contract.reviewDueAt
                        ? `${tx('pages.messages.contractDetails.awaitingReviewBody')} ${fmtDate(contract.reviewDueAt)}`
                        : tx('pages.messages.contractDetails.awaitingReviewBody'),
                    primaryLabel: tx('pages.messages.contractDetails.acceptReleaseLabel'),
                    accentColor: 'text-[#E8A020]',
                    iconColor: 'text-[#E8A020] bg-[#E8A020]/10 ring-[#E8A020]/20',
                };
            }
            if (userRole === 'freelancer' && isUnderReview) {
                return {
                    icon: <Timer className="h-5 w-5" />,
                    title: tx('pages.messages.contractDetails.awaitingClientReviewTitle'),
                    body: contract.reviewDueAt
                        ? `${tx('pages.messages.contractDetails.awaitingClientReviewBody')} ${fmtDate(contract.reviewDueAt)}`
                        : tx('pages.messages.contractDetails.awaitingClientReviewBody'),
                    primaryLabel: null,
                    accentColor: 'text-[#BA7517]',
                    iconColor: 'text-[#E8A020] bg-[#E8A020]/10 ring-[#E8A020]/20',
                };
            }
            if (userRole === 'client' && isRevision) {
                return {
                    icon: <GitPullRequest className="h-5 w-5" />,
                    title: tx('pages.messages.contractDetails.revisionRequestedTitle'),
                    body: tx('pages.messages.contractDetails.revisionRequestedBody'),
                    primaryLabel: null,
                    accentColor: 'text-[#BA7517]',
                    iconColor: 'text-[#E8A020] bg-[#E8A020]/10 ring-[#E8A020]/20',
                };
            }
            if (showLeaveReview) {
                return {
                    icon: <Star className="h-5 w-5" />,
                    title: tx('pages.messages.contractDetails.leaveReviewTitle'),
                    body: tx('pages.messages.contractDetails.leaveReviewBody'),
                    primaryLabel: tx('pages.messages.contractDetails.leaveReviewLabel'),
                    accentColor: 'text-[#1D9E75]',
                    iconColor: 'text-[#1D9E75] bg-[#1D9E75]/10 ring-[#1D9E75]/20',
                };
            }
            if (isCompleted) {
                return {
                    icon: <CheckCircle className="h-5 w-5" />,
                    title: tx('pages.messages.contractDetails.contractClosedTitle'),
                    body: tx('pages.messages.contractDetails.paymentReleasedBody'),
                    primaryLabel: null,
                    accentColor: 'text-[#7F77DD]',
                    iconColor: 'text-[#9B8FF0] bg-[#9B8FF0]/10 ring-[#9B8FF0]/20',
                };
            }
            return {
                icon: <Clock className="h-5 w-5" />,
                title: tx('pages.messages.contractDetails.workInProgressTitle'),
                body: tx('pages.messages.contractDetails.workInProgressBody'),
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
            reviewLinks,
            finalLinks,
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
            allFileCount: sharedFiles.length + reviewFiles.length + finalFiles.length + reviewLinks.length + finalLinks.length,
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

    const openPreview = (file: ContractSharedFile) => {
        setPreviewFile(file);
    };

    if (!contract || !model) return null;

    const isClearanceActive = Boolean(
        contract.escrowPendingClearanceUntil && 
        new Date(contract.escrowPendingClearanceUntil).getTime() > Date.now() && 
        contract.paymentStatus === 'in_escrow'
    );
    const isClearanceDisputed = Boolean(contract.escrowHoldDisputed);

    const rt = roleTheme(userRole, userRole === 'client' ? tx('pages.messages.contractDetails.clientFallback') : tx('pages.messages.contractDetails.freelancerFallback'));
    const _otherPartyRt = roleTheme(userRole === 'client' ? 'freelancer' : 'client', userRole === 'client' ? tx('pages.messages.contractDetails.freelancerFallback') : tx('pages.messages.contractDetails.clientFallback'));

    return (
        <div className="flex w-full flex-col bg-[#070709] text-[var(--color-text-primary)]">
            <style>{`
                @keyframes contractTabIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                @keyframes pulseRole{0%,100%{opacity:1}50%{opacity:0.6}}
                @keyframes lockGlow {
                    0%, 100% {
                        box-shadow: 0 0 15px rgba(245,158,11,0.06);
                        border-color: rgba(245,158,11,0.15);
                    }
                    50% {
                        box-shadow: 0 0 25px rgba(245,158,11,0.16);
                        border-color: rgba(245,158,11,0.3);
                    }
                }
                @keyframes unlockVault {
                    0% {
                        box-shadow: 0 0 20px rgba(245,158,11,0.12);
                        border-color: rgba(245,158,11,0.25);
                    }
                    50% {
                        box-shadow: 0 0 35px rgba(16,185,129,0.35);
                        border-color: rgba(16,185,129,0.45);
                    }
                    100% {
                        box-shadow: 0 0 20px rgba(16,185,129,0.1);
                        border-color: rgba(16,185,129,0.2);
                    }
                }
            `}</style>

            {/* Role-colored top stripe */}
            <div className="hidden" />

            {/* ── Premium Unified Compact Header ── */}
            <header className="sticky top-0 z-30 flex flex-col border-b border-white/[0.06] bg-[#070709]/95 backdrop-blur-md">
                {/* Main Compact Row */}
                <div className={`flex flex-col gap-3 py-3 ${isSidebar ? 'px-4' : 'px-6'}`}>
                    {/* Row 1: Avatar, Title, and Amount */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <PartyAvatar party={model.otherParty} size="md" />
                            <div className="flex min-w-0 flex-col">
                                <h2 className="line-clamp-2 text-[14px] font-semibold leading-snug text-zinc-100">
                                    {contract.job?.title || tx('pages.messages.contractDetails.untitledContract')}
                                </h2>
                                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
                                    <span className="font-semibold uppercase tracking-wider text-zinc-400">
                                        {userRole === 'client' ? tx('auth.accountPanel.freelancerLabel') : tx('auth.accountPanel.clientLabel')}
                                    </span>
                                    <span>•</span>
                                    <span className="truncate">{model.otherParty?.full_name || tx('pages.messages.contractDetails.counterparty')}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Amount & Escrow block */}
                        <div className="flex shrink-0 flex-col items-end pl-2">
                            <span className="text-[15px] font-semibold leading-tight text-zinc-100">
                                {fmtAmount(contract.amount)}
                            </span>
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 leading-none">
                                <Shield className="h-3 w-3 text-emerald-400" />
                                <span>{model.isEscrowFunded ? tx('pages.messages.contractDetails.inEscrow') : tx('pages.messages.contractDetails.pendingEscrow')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Status alerts and navigation */}
                    <div className="mt-0.5 flex items-center justify-between border-t border-white/[0.04] pt-2">
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase leading-none ${model.status.tone}`}>
                                {model.status.icon}{model.status.label}
                            </span>
                            {contract.job?.deadline && (
                                <span className="text-[11px] text-zinc-500">
                                    {tx('pages.messages.contractDetails.due')} {fmtDate(contract.job.deadline)}
                                </span>
                            )}
                        </div>
                        
                        {/* Navigation Actions */}
                        {(onGoBack || onGoToMessages || onOpenWorkspace) && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                {onOpenWorkspace && (
                                    <button
                                        type="button"
                                        onClick={onOpenWorkspace}
                                        aria-label={tx('pages.messages.contractDetails.openContractPage')}
                                        className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold border border-zinc-700 bg-zinc-900/30 text-zinc-350 transition-all hover:bg-zinc-800 hover:text-white cursor-pointer"
                                    >
                                        {tx('pages.messages.contractDetails.workspaceLink')}
                                    </button>
                                )}
                                {onGoBack && (
                                    <button type="button" onClick={onGoBack} className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/30 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-750">
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                {onGoToMessages && (
                                    <button type="button" onClick={onGoToMessages} className="flex h-7 items-center gap-1.5 rounded-full px-3 bg-zinc-900/30 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-750">
                                        <MessageSquare className="h-3 w-3" />
                                        {tx('pages.messages.contractDetails.goToMessages')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Unified Dashboard Grid Layout */}
            <main className={`flex-grow ${isSidebar ? 'p-3' : 'px-4 py-8 sm:px-8 sm:py-10'}`}>
                <div className="mx-auto w-full max-w-[1800px]">
                    {isClearanceActive && (
                        <div className="mb-6 rounded-xl border border-amber-500/25 bg-amber-500/[0.03] p-5 shadow-[0_0_20px_rgba(245,158,11,0.05)] backdrop-blur-md">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                        <Timer className="h-5 w-5 animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] font-bold text-zinc-100">{tx('pages.messages.contractDetails.safetyHoldTitle')}</h4>
                                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed animate-in fade-in duration-300">
                                            {tx('pages.messages.contractDetails.safetyHoldBody')}{' '}
                                            <CountdownTimer targetDate={contract.escrowPendingClearanceUntil!} className="text-amber-400 font-bold" />
                                        </p>

                                    </div>
                                </div>
                                {userRole === 'client' && onHoldClearance && (
                                    <button
                                        type="button"
                                        onClick={onHoldClearance}
                                        className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 px-4 py-2 text-[11px] font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                                    >
                                        {tx('pages.messages.contractDetails.holdPaymentReport')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {isClearanceDisputed && (
                        <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/[0.03] p-5 shadow-[0_0_20px_rgba(239,68,68,0.05)] backdrop-blur-md">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-[13px] font-bold text-zinc-100">{tx('pages.messages.contractDetails.clearanceSuspendedTitle')}</h4>
                                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                                        {tx('pages.messages.contractDetails.clearanceSuspendedBody')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {isSidebar ? (
                        /* Collapsible Message Sidebar Mode Layout (100% single vertical stack) */
                        <div className="flex flex-col gap-5">
                            
                            {/* 0. Escrow Stepper */}
                            <EscrowLifecycleStepper model={model} paymentStatus={contract.paymentStatus || 'pending'} />

                            {/* 1. Next Move Control Center Card */}
                            <NextMoveCard 
                                model={model} 
                                rt={rt} 
                                userRole={userRole} 
                                isActionLoading={isActionLoading} 
                                onDeliver={onDeliver} 
                                onRequestChanges={onRequestChanges} 
                                onAcceptAndPay={onAcceptAndPay} 
                                onDispute={onDispute} 
                                onCancel={onCancel} 
                                onFundEscrow={onFundEscrow} 
                                onReview={onReview} 
                            />

                            {/* 2. Counterparty Profile & Messaging */}
                            {!isSidebar && (
                                <ContractPulse model={model} rt={rt} userRole={userRole} onGoToMessages={onGoToMessages} isSidebar={isSidebar} />
                            )}

                            {/* 3. Escrow Progress Lifecycle (Timeline) */}
                            <MilestonesTab 
                                model={model} 
                                userRole={userRole} 
                                rt={rt} 
                                onAcceptMilestone={onAcceptMilestone}
                                onHoldMilestoneClearance={onHoldMilestoneClearance}
                            />

                            {/* 4. Completed Summary */}
                            {model.st === 'completed' && (
                                <CompletedSummary model={model} rt={rt} onReview={onReview} />
                            )}

                            {/* 5. Delivered Work Hero */}
                            {(model.reviewFiles.length > 0 || model.reviewLinks.length > 0 || model.finalFiles.length > 0 || model.finalLinks.length > 0) && (
                                <section className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center justify-between border-b border-zinc-805/50 pb-2">
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{tx('pages.messages.contractDetails.deliveredWork')}</p>
                                            <h3 className="text-[14px] font-bold text-zinc-100 mt-0.5">{tx('pages.messages.contractDetails.freelancerSubmissions')}</h3>
                                        </div>
                                        {model.st === 'delivery_submitted' && (
                                            <span className="rounded-full border border-zinc-750 bg-zinc-850 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-350">{tx('pages.messages.contractDetails.awaitingApproval')}</span>
                                        )}
                                    </div>
                                    
                                    {/* Review Phase */}
                                    {(model.reviewFiles.length > 0 || model.reviewLinks.length > 0) && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-semibold text-zinc-400">{tx('pages.messages.contractDetails.forReview')}</p>
                                            <div className="grid grid-cols-1 gap-3">
                                                {model.reviewFiles.map(file => (
                                                    <DeliveryFileHeroCard key={file.id} file={file} onPreviewFile={openPreview} />
                                                ))}
                                                {model.reviewLinks.map(link => (
                                                    <DeliveryLinkHeroCard key={link.id} link={link} reveal={true} onInspectPreview={handleInspectPreview} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Final Phase */}
                                    {(model.finalFiles.length > 0 || model.finalLinks.length > 0) && (
                                        <div className="space-y-3 border-t border-zinc-805/50 pt-2 flex flex-col gap-1">
                                            <p className="text-[10px] font-semibold text-zinc-400">{tx('pages.messages.contractDetails.finalDeliverablesLocked')}</p>
                                            <EscrowVaultVisualizer isLocked={model.st !== 'completed'} />
                                            <div className="grid grid-cols-1 gap-3">
                                                {model.finalFiles.map(file => (
                                                    <DeliveryFileHeroCard key={file.id} file={file} onPreviewFile={openPreview} />
                                                ))}
                                                {model.finalLinks.map(link => (
                                                    <DeliveryLinkHeroCard 
                                                        key={link.id} 
                                                        link={link} 
                                                        reveal={userRole === 'freelancer' || model.st === 'completed'} 
                                                        onInspectPreview={handleInspectPreview}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {model.showClientReview && (
                                        <div className="mt-2 flex flex-col gap-2 border-t border-zinc-805/50 pt-3">
                                            <button 
                                                type="button" 
                                                onClick={onAcceptAndPay} 
                                                disabled={Boolean(isActionLoading)}
                                                className="w-full rounded-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-[12px] font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <PackageCheck className="h-4 w-4" />
                                                {tx('pages.messages.contractDetails.approveReleasePayment')}
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={onRequestChanges} 
                                                disabled={isActionLoading || model.revLeft <= 0}
                                                className="w-full rounded-full border border-zinc-750 bg-transparent hover:bg-zinc-850 text-zinc-300 hover:text-white py-2 text-[12px] font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <GitPullRequest className="h-4 w-4" />
                                                {model.revLeft <= 0 ? tx('pages.messages.contractDetails.limitReached') : tx('pages.messages.contractDetails.requestRevisionLeft', { count: model.revLeft })}
                                            </button>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* 6. Workspace File Manager */}
                            {(model.sharedFiles.length > 0 || (model.reviewFiles.length === 0 && model.reviewLinks.length === 0)) && (
                                <FilesTab 
                                    model={model} 
                                    fileFilter={fileFilter} 
                                    setFileFilter={setFileFilter} 
                                    userRole={userRole} 
                                    onPreviewFile={openPreview} 
                                    onDeliver={onDeliver} 
                                    rt={rt} 
                                    isSidebar={isSidebar}
                                />
                            )}

                            {/* 7. Contract Event History */}
                            {!isSidebar && (
                                <div id="workspace-activity-log">
                                    <ActivityTab events={activityEvents} model={model} contract={contract} rt={rt} />
                                </div>
                            )}

                        </div>
                    ) : (
                        /* Full Desktop Page Layout (2 Columns: Main Left, Sidebar Right) */
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            
                            {/* RIGHT COLUMN: Sidebar Metadata & Controls (order-1 on mobile, order-2 on desktop) */}
                            <div className="lg:col-span-4 lg:order-2 flex flex-col gap-6">
                                
                                {/* Escrow Stepper */}
                                <EscrowLifecycleStepper model={model} paymentStatus={contract.paymentStatus || 'pending'} />

                                {/* Next Move Control Center Card */}
                                <NextMoveCard 
                                    model={model} 
                                    rt={rt} 
                                    userRole={userRole} 
                                    isActionLoading={isActionLoading} 
                                    onDeliver={onDeliver} 
                                    onRequestChanges={onRequestChanges} 
                                    onAcceptAndPay={onAcceptAndPay} 
                                    onDispute={onDispute} 
                                    onCancel={onCancel} 
                                    onFundEscrow={onFundEscrow} 
                                    onReview={onReview} 
                                />

                                {/* Counterparty Profile */}
                                <ContractPulse model={model} rt={rt} userRole={userRole} onGoToMessages={onGoToMessages} isSidebar={isSidebar} />

                                {/* Escrow Progress Lifecycle (Timeline & Milestones) */}
                                <MilestonesTab 
                                    model={model} 
                                    userRole={userRole} 
                                    rt={rt} 
                                    onAcceptMilestone={onAcceptMilestone}
                                    onHoldMilestoneClearance={onHoldMilestoneClearance}
                                />

                            </div>

                            {/* LEFT COLUMN: Main Workspace Contents (order-2 on mobile, order-1 on desktop) */}
                            <div className="lg:col-span-8 lg:order-1 flex flex-col gap-6">
                                
                                {/* Milestone Horizontal Timeline for Multi-Milestone Contracts */}
                                {model.milestones && model.milestones.length > 0 && (
                                    <MilestoneTimeline
                                        milestones={model.milestones as any}
                                        userRole={userRole}
                                        onDeliver={onDeliver}
                                        onAcceptMilestone={onAcceptMilestone}
                                        onHoldMilestoneClearance={onHoldMilestoneClearance}
                                        isActionLoading={isActionLoading}
                                    />
                                )}

                                {/* Completed Status Summary */}

                                {model.st === 'completed' && (
                                    <CompletedSummary model={model} rt={rt} onReview={onReview} />
                                )}

                                {/* Hero Section: Delivered Files Prominently Displayed for Review */}
                                {(model.reviewFiles.length > 0 || model.finalFiles.length > 0 || model.reviewLinks.length > 0 || model.finalLinks.length > 0) && (
                                    <section className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-5 flex flex-col gap-4">
                                        <div className="flex items-center justify-between border-b border-zinc-805/50 pb-3">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{tx('pages.messages.contractDetails.deliveredWork')}</p>
                                                <h3 className="text-[15px] font-bold text-zinc-100 mt-0.5">{tx('pages.messages.contractDetails.freelancerSubmissions')}</h3>
                                            </div>
                                            {model.st === 'delivery_submitted' && (
                                                <span className="rounded-full border border-zinc-750 bg-zinc-850 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-350">{tx('pages.messages.contractDetails.awaitingApproval')}</span>
                                            )}
                                        </div>
                                        
                                        {/* Review Phase */}
                                        {(model.reviewFiles.length > 0 || model.reviewLinks.length > 0) && (
                                            <div className="space-y-2">
                                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{tx('pages.messages.contractDetails.forClientReview')}</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {model.reviewFiles.map(file => (
                                                        <DeliveryFileHeroCard key={file.id} file={file} onPreviewFile={openPreview} />
                                                    ))}
                                                    {model.reviewLinks.map(link => (
                                                        <DeliveryLinkHeroCard key={link.id} link={link} reveal={true} onInspectPreview={handleInspectPreview} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Final Phase */}
                                        {(model.finalFiles.length > 0 || model.finalLinks.length > 0) && (
                                            <div className="space-y-3 border-t border-zinc-805/50 pt-3 flex flex-col gap-1">
                                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{tx('pages.messages.contractDetails.finalHandoffLocked')}</h4>
                                                <EscrowVaultVisualizer isLocked={model.st !== 'completed'} />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                                                    {model.finalFiles.map(file => (
                                                        <DeliveryFileHeroCard key={file.id} file={file} onPreviewFile={openPreview} />
                                                    ))}
                                                    {model.finalLinks.map(link => (
                                                        <DeliveryLinkHeroCard 
                                                            key={link.id} 
                                                            link={link} 
                                                            reveal={userRole === 'freelancer' || model.st === 'completed'} 
                                                            onInspectPreview={handleInspectPreview}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Primary Action Buttons (Approve & Release, Request Revision) directly under files for Client */}
                                        {model.showClientReview && (
                                            <div className="mt-2 flex flex-wrap items-center gap-2.5 border-t border-zinc-805/50 pt-4">
                                                <button 
                                                    type="button" 
                                                    onClick={onAcceptAndPay} 
                                                    disabled={Boolean(isActionLoading)}
                                                    className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-[12px] font-semibold shadow-md transition-all flex items-center gap-1.5"
                                                >
                                                    <PackageCheck className="h-4 w-4" />
                                                    {tx('pages.messages.contractDetails.approveReleasePayment')}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={onRequestChanges} 
                                                    disabled={isActionLoading || model.revLeft <= 0}
                                                    className="rounded-full border border-zinc-750 bg-transparent hover:bg-zinc-850 text-zinc-300 hover:text-white px-5 py-2 text-[12px] font-semibold shadow-md transition-all flex items-center gap-1.5"
                                                >
                                                    <GitPullRequest className="h-4 w-4" />
                                                    {model.revLeft <= 0 ? tx('pages.messages.contractDetails.limitReached') : tx('pages.messages.contractDetails.requestRevisionLeft', { count: model.revLeft })}
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {/* Workspace File Manager */}
                                <FilesTab 
                                    model={model} 
                                    fileFilter={fileFilter} 
                                    setFileFilter={setFileFilter} 
                                    userRole={userRole} 
                                    onPreviewFile={openPreview} 
                                    onDeliver={onDeliver} 
                                    rt={rt} 
                                />

                                {/* Contract Event History */}
                                <div id="workspace-activity-log">
                                    <ActivityTab events={activityEvents} model={model} contract={contract} rt={rt} />
                                </div>

                            </div>

                        </div>
                    )}
                </div>
            </main>

            {/* File Preview Overlay Modal */}
            {previewFile ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={tx('pages.messages.contractDetails.filePreviewAria')}>
                    <div className="w-full max-w-lg rounded-[14px] bg-[#111214] border border-white/[0.08] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-500">{tx('pages.messages.contractDetails.filePreview')}</p>
                                <h2 className="mt-1 truncate text-[18px] font-medium tracking-[-0.01em] text-white">{previewFile.name}</h2>
                                <p className="font-mono text-[13px] text-zinc-400">
                                    {[previewFile.senderName || tx('pages.messages.contractDetails.clientFallback'), previewFile.uploadedAt ? new Date(previewFile.uploadedAt).toLocaleDateString() : tx('pages.messages.contractDetails.unknownDate'), fmtSize(previewFile.size)].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                            <button type="button" ref={previewCloseRef} onClick={() => setPreviewFile(null)} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[14px] font-medium text-zinc-400 transition-colors hover:border-white/[0.12] hover:text-white">{tx('pages.messages.contractDetails.close')}</button>
                        </div>
                        <div className="mt-4 rounded-[10px] border border-white/[0.07] bg-[#0c0c0e] px-4 py-[14px]">
                            <p className="text-[14px] leading-[1.6] text-zinc-400">
                                {tx('pages.messages.contractDetails.previewOverlayDesc')}
                            </p>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setPreviewFile(null)} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[14px] font-medium text-zinc-400 transition-colors hover:border-white/[0.12] hover:text-white">{tx('pages.messages.contractDetails.cancel')}</button>
                            <button type="button" onClick={() => {
                                if (onOpenSharedFile) {
                                    onOpenSharedFile(previewFile);
                                } else {
                                    if (previewFile.url) window.open(previewFile.url, '_blank', 'noopener');
                                }
                                setPreviewFile(null);
                            }} className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-[14px] font-medium text-[#0A0A0B] transition-colors">{tx('pages.messages.contractDetails.openFile')}</button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Viewport Simulator Sandbox Modal */}
            {sandboxUrl ? (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setSandboxUrl(null)}
                >
                    <div 
                        className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#0c0c0e] shadow-[0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden w-full max-w-5xl h-[85vh] transition-all"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Sandbox Header */}
                        <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/40 px-4 py-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <Globe className="h-5 w-5 text-violet-400 shrink-0" />
                                <div className="min-w-0">
                                    <h3 className="text-xs font-semibold text-zinc-100 truncate">{sandboxLabel}</h3>
                                    <p className="text-[10px] text-zinc-550 font-mono truncate">{sandboxUrl}</p>
                                </div>
                            </div>

                            {/* Viewport Toggles */}
                            <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-[#070709] p-1">
                                <button
                                    type="button"
                                    onClick={() => setSandboxViewport('desktop')}
                                    className={`rounded px-2.5 py-1 text-[10px] font-semibold transition-all ${sandboxViewport === 'desktop' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                >
                                    {tx('pages.messages.contractDetails.desktop')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSandboxViewport('tablet')}
                                    className={`rounded px-2.5 py-1 text-[10px] font-semibold transition-all ${sandboxViewport === 'tablet' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                >
                                    {tx('pages.messages.contractDetails.tablet')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSandboxViewport('mobile')}
                                    className={`rounded px-2.5 py-1 text-[10px] font-semibold transition-all ${sandboxViewport === 'mobile' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                                >
                                    {tx('pages.messages.contractDetails.mobile')}
                                </button>
                            </div>

                            {/* Close button */}
                            <button
                                type="button"
                                onClick={() => setSandboxUrl(null)}
                                className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-[11px] font-semibold text-zinc-305 hover:bg-white/[0.06] hover:text-white transition-all"
                            >
                                {tx('pages.messages.contractDetails.close')}
                            </button>
                        </div>

                        {/* Sandbox Body / Simulator */}
                        <div className="flex-1 bg-zinc-950/40 p-6 flex items-center justify-center overflow-auto">
                            {sandboxViewport === 'desktop' ? (
                                <div className="w-full h-full flex flex-col border border-white/[0.08] bg-[#0c0c0e] rounded-xl overflow-hidden shadow-2xl transition-all duration-300">
                                    {/* Desktop Browser Chrome */}
                                    <div className="h-9 shrink-0 bg-zinc-900/90 border-b border-white/[0.05] px-4 flex items-center gap-3 select-none">
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
                                            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                                            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                                        </div>
                                        <div className="flex items-center gap-1 text-zinc-550 shrink-0 text-[10px]">
                                            <span className="p-1 rounded hover:bg-white/5 cursor-pointer">←</span>
                                            <span className="p-1 rounded hover:bg-white/5 cursor-pointer">→</span>
                                            <span className="p-1 rounded hover:bg-white/5 cursor-pointer">⟳</span>
                                        </div>
                                        <div className="flex-grow max-w-xl mx-auto h-6 bg-zinc-950/60 rounded border border-white/[0.05] flex items-center px-3 gap-2 text-[10px] text-zinc-400 font-mono truncate select-all">
                                            <Globe className="h-3 w-3 text-zinc-500 shrink-0" />
                                            {sandboxUrl}
                                        </div>
                                    </div>
                                    <iframe 
                                        src={sandboxUrl}
                                        title={tx('pages.messages.contractDetails.stagingSandboxPreview')}
                                        className="w-full flex-grow border-none bg-white"
                                    />
                                </div>
                            ) : sandboxViewport === 'tablet' ? (
                                <div className="w-[768px] h-full max-h-[720px] flex flex-col border-[12px] border-zinc-800 bg-zinc-900 rounded-[28px] overflow-hidden shadow-2xl relative transition-all duration-305 shrink-0">
                                    {/* Tablet Status Bar */}
                                    <div className="h-6 shrink-0 bg-zinc-900 px-6 flex items-center justify-between text-[9px] font-bold text-zinc-400 select-none">
                                        <span>9:41 AM</span>
                                        <div className="flex items-center gap-1.5">
                                            <span>📶</span>
                                            <span>🛜</span>
                                            <span>100% 🔋</span>
                                        </div>
                                    </div>
                                    
                                    <iframe 
                                        src={sandboxUrl}
                                        title={tx('pages.messages.contractDetails.stagingSandboxPreview')}
                                        className="w-full flex-grow border-none bg-white"
                                    />
                                    
                                    {/* Tablet Home Bar */}
                                    <div className="h-3 shrink-0 bg-zinc-900 flex items-center justify-center">
                                        <div className="w-32 h-1 bg-zinc-700 rounded-full" />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-[375px] h-full max-h-[660px] flex flex-col border-[12px] border-zinc-800 bg-zinc-900 rounded-[44px] overflow-hidden shadow-2xl relative transition-all duration-305 shrink-0">
                                    {/* Dynamic Island / Notch */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-20 flex items-center justify-end px-3">
                                        <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full border border-zinc-800/40" />
                                    </div>
                                    
                                    {/* Mobile Status Bar */}
                                    <div className="h-9 shrink-0 bg-zinc-900 px-6 flex items-end pb-1.5 justify-between text-[9px] font-bold text-zinc-400 select-none">
                                        <span>9:41</span>
                                        <div className="flex items-center gap-1">
                                            <span>📶</span>
                                            <span>5G</span>
                                            <span>🔋</span>
                                        </div>
                                    </div>
                                    
                                    <iframe 
                                        src={sandboxUrl}
                                        title={tx('pages.messages.contractDetails.stagingSandboxPreview')}
                                        className="w-full flex-grow border-none bg-white"
                                    />
                                    
                                    {/* Home Indicator */}
                                    <div className="h-4 shrink-0 bg-zinc-900 flex items-center justify-center pb-1">
                                        <div className="w-28 h-1 bg-zinc-700 rounded-full" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}











function MilestonesTab({ 
    model, 
    _rt, 
    userRole,
    onAcceptMilestone,
    onHoldMilestoneClearance,
}: { 
    model: WorkspaceModel; 
    rt: RoleTheme; 
    userRole: 'client' | 'freelancer';
    onAcceptMilestone?: (milestoneId: string) => Promise<void>;
    onHoldMilestoneClearance?: (milestoneId: string) => void;
}) {
    const { tx } = useTranslation();
    // Escrow lifecycle phases
    const escrowPhases = [
        {
            key: 'funded',
            label: tx('pages.messages.contractDetails.escrowFundedPhase'),
            sub: tx('pages.messages.contractDetails.escrowFundedSub'),
            done: model.isEscrowFunded || ['active', 'delivery_submitted', 'revision_requested', 'completed'].includes(model.st),
        },
        {
            key: 'active',
            label: tx('pages.messages.contractDetails.workInProgressPhase'),
            sub: tx('pages.messages.contractDetails.workInProgressSub'),
            done: ['active', 'delivery_submitted', 'revision_requested', 'completed'].includes(model.st),
        },
        {
            key: 'submitted',
            label: tx('pages.messages.contractDetails.deliverySubmittedPhase'),
            sub: tx('pages.messages.contractDetails.deliverySubmittedSub'),
            done: ['delivery_submitted', 'revision_requested', 'completed'].includes(model.st) || model.st === 'revision_requested',
        },
        {
            key: 'approved',
            label: tx('pages.messages.contractDetails.clientApprovedPhase'),
            sub: tx('pages.messages.contractDetails.clientApprovedSub'),
            done: model.st === 'completed',
        },
        {
            key: 'released',
            label: tx('pages.messages.contractDetails.paymentReleasedPhase'),
            sub: tx('pages.messages.contractDetails.paymentReleasedSub'),
            done: model.st === 'completed',
        },
    ];

    const activeIndex = escrowPhases.filter(p => p.done).length - 1;

    return (
        <section className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-5 flex flex-col gap-4">
            <div className="border-b border-zinc-805/50 pb-3">
                <p className={labelClass}>{tx('pages.messages.contractDetails.milestones')}</p>
                <h3 className="text-[15px] font-bold text-white mt-0.5">{tx('pages.messages.contractDetails.escrowLifecycle')}</h3>
            </div>

            {/* Vertical timeline */}
            <div className="relative flex flex-col gap-6 pl-8 mt-2">
                {/* Vertical connection track line */}
                <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-zinc-800" />
                
                {/* Colored track representing progress */}
                {activeIndex >= 0 && (
                    <div 
                        className="absolute left-2.5 top-2.5 w-0.5 bg-emerald-600 transition-all duration-500"
                        style={{ height: `${(activeIndex / (escrowPhases.length - 1)) * 100}%`, maxHeight: 'calc(100% - 20px)' }}
                    />
                )}

                {escrowPhases.map((phase, idx) => {
                    const done = phase.done;
                    const isCurrent = idx === activeIndex + 1; // next upcoming step
                    return (
                        <div key={phase.key} className="relative flex items-start gap-4">
                            {/* Dot node */}
                            <div className={`absolute -start-[30px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                done
                                    ? "bg-emerald-600 border-transparent text-white"
                                    : isCurrent
                                    ? "border-emerald-600 bg-[#0d0d11]"
                                    : "border-zinc-700 bg-[#0d0d11]"
                            } transition-all duration-300`}>
                                {done && <CheckCircle className="h-3 w-3 text-white" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-[13px] font-bold ${done ? 'text-zinc-100' : isCurrent ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                        {phase.label}
                                    </p>
                                    {done && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">
                                            {tx('pages.messages.contractDetails.completed')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-zinc-400 mt-0.5">{phase.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Custom Milestones list */}
            {model.milestones.length > 0 ? (
                <div className="border-t border-zinc-805/50 pt-4 mt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">
                        {tx('pages.messages.contractDetails.contractMilestones', { done: model.completedMilestones, total: model.milestones.length })}
                    </p>
                    <div className="relative flex flex-col gap-4 pl-6">
                        <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-zinc-800" />
                        {model.milestones.map((milestone, index) => {
                            const done = ['completed', 'approved', 'paid'].includes(ns(milestone.status));
                            const title = milestone.title || milestone.description || tx('pages.messages.contractDetails.milestoneDefaultTitle', { index: index + 1 });
                            return (
                                <div key={milestone.id || index} className="relative flex items-start gap-3">
                                    <div className={`absolute -left-[24px] top-1.5 flex h-2 w-2 rounded-full border ${
                                        done
                                            ? "bg-emerald-600 border-transparent"
                                            : "border-zinc-750 bg-[#0d0d11]"
                                    }`} />
                                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                        <div>
                                            <p className={`text-[13px] font-bold ${done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                                {title}
                                            </p>
                                            <p className="text-[11px] text-zinc-400 mt-0.5">
                                                {milestone.due_date ? `${tx('pages.messages.contractDetails.due')} ${fmtDate(milestone.due_date)}` : tx('pages.messages.contractDetails.noDueDate')}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[12px] font-semibold text-zinc-350">
                                                {fmtAmount(milestone.amount)}
                                            </span>
                                            
                                            {/* Milestone Status / Action buttons */}
                                            {ns(milestone.status) === 'submitted' && userRole === 'client' && onAcceptMilestone ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onAcceptMilestone(milestone.id!)}
                                                    className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 text-[10px] font-bold transition-all shadow active:scale-95 cursor-pointer border-none"
                                                >
                                                    {tx('pages.messages.contractDetails.approve')}
                                                </button>
                                            ) : milestone.escrow_pending_clearance_until && new Date(milestone.escrow_pending_clearance_until).getTime() > Date.now() && !milestone.escrow_hold_disputed ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="border border-amber-500/20 bg-amber-500/5 text-amber-300 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider leading-none flex items-center gap-1">
                                                        {tx('pages.messages.contractDetails.holdPayout')} (<CountdownTimer targetDate={milestone.escrow_pending_clearance_until} className="text-amber-300 font-bold" /> {tx('common.time.left')})
                                                    </span>

                                                    {userRole === 'client' && onHoldMilestoneClearance && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onHoldMilestoneClearance(milestone.id!)}
                                                            className="rounded-full bg-red-600 hover:bg-red-500 text-white px-3 py-1 text-[10px] font-bold transition-all shadow active:scale-95 cursor-pointer border-none"
                                                        >
                                                            {tx('pages.messages.contractDetails.holdPayout')}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : milestone.escrow_hold_disputed ? (
                                                <span className="border border-red-500/20 bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                                    {tx('pages.messages.contractDetails.frozen')}
                                                </span>
                                            ) : (
                                                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                                    done ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-zinc-750 bg-zinc-850 text-zinc-400'
                                                }`}>
                                                    {done ? tx('pages.messages.contractDetails.paid') : milestone.status ? milestone.status : tx('pages.messages.contractDetails.pending')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="border-t border-zinc-805/50 pt-4 mt-2">
                    <CompactEmpty icon={<GitPullRequest className="h-3.5 w-3.5" />} title={tx('pages.messages.contractDetails.noCustomMilestones')} text={tx('pages.messages.contractDetails.noCustomMilestonesDesc')} />
                </div>
            )}
        </section>
    );
}



function ActivityTab({ events, model, contract, rt }: { events: ContractActivityEvent[]; model: WorkspaceModel; contract: ContractSidebarData; rt: RoleTheme }) {
    const { tx } = useTranslation();
    const fallbackEvents = useMemo<ContractActivityEvent[]>(() => {
        const items: ContractActivityEvent[] = [];
        if (contract.deliverySubmittedAt) items.push({ id: 'delivery-date', text: tx('pages.messages.contractDetails.eventWorkDelivered'), timestamp: contract.deliverySubmittedAt, actorRole: 'freelancer', kind: 'delivery' });
        if (model.st === 'completed') items.push({ id: 'completed-state', text: tx('pages.messages.contractDetails.eventWorkAccepted'), timestamp: contract.reviewDueAt || contract.deliverySubmittedAt, actorRole: 'system', kind: 'payment', system: true });
        if (model.showReviewConfirmation) items.push({ id: 'review-state', text: tx('pages.messages.contractDetails.reviewStarsPlaceholder'), timestamp: null, actorRole: 'client', kind: 'review' });
        return items;
    }, [contract.deliverySubmittedAt, contract.reviewDueAt, model.showReviewConfirmation, model.st, tx]);
    const list = events.length > 0 ? events : fallbackEvents;

    return (
        <section className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-5 flex flex-col gap-4">
            <div className="border-b border-zinc-850/50 pb-3">
                <p className={labelClass}>{tx('pages.messages.contractDetails.activityLog')}</p>
                <h3 className="text-[15px] font-bold text-white mt-0.5">{tx('pages.messages.contractDetails.contractEventHistory')}</h3>
            </div>
            {list.length > 0 ? (
                <div className="relative flex flex-col gap-6 pl-8 mt-2">
                    {/* Vertical connector line */}
                    <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-zinc-800" />
                    {list.map(event => (
                        <ActivityRow key={event.id} event={event} rt={rt} />
                    ))}
                </div>
            ) : (
                <CompactEmpty icon={<Clock className="h-3.5 w-3.5" />} title={tx('pages.messages.contractDetails.noActivityYet')} text={tx('pages.messages.contractDetails.noActivityYetDesc')} />
            )}
        </section>
    );
}





function ActivityRow({ event, rt: _rt }: { event: ContractActivityEvent; rt: RoleTheme }) {
    const { tx } = useTranslation();
    const isSystem = event.system || event.actorRole === 'system' || event.kind === 'payment' || event.kind === 'system';
    
    const dotColor = isSystem 
        ? 'border-zinc-700 bg-zinc-800' 
        : event.actorRole === 'client' 
        ? 'border-emerald-600 bg-emerald-600/10' 
        : 'border-emerald-600 bg-emerald-600/10';

    return (
        <div className="relative flex flex-col gap-1">
            <div className={`absolute -start-[30px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${dotColor} bg-[#0d0d11]`} />

            {isSystem ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pl-2">
                    <p className="text-[12px] font-medium text-zinc-400 leading-relaxed">{event.text}</p>
                    {event.timestamp && (
                        <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                            {fmtTime(event.timestamp)}
                        </span>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-1 pl-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <PartyAvatar party={{ full_name: event.actorName || undefined, avatar_url: event.actorAvatarUrl }} size="sm" />
                          <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-zinc-100 truncate">
                                  {event.actorName || (event.actorRole === 'client' ? tx('pages.messages.contractDetails.clientFallback') : tx('pages.messages.contractDetails.freelancerFallback'))}
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

function _TimelineMilestone({ milestone: _milestone, index: _index, rt: _rt }: { milestone: ContractMilestone; index: number; rt: RoleTheme }) {
    return null;
}

function _InfoChip({ icon, label, hideOnMobile, className }: { icon: ReactNode; label: string; hideOnMobile?: boolean; className?: string }) {
    return <span className={`items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.01] px-2.5 py-1 font-mono text-[11px] text-zinc-400 ${hideOnMobile ? 'hidden sm:inline-flex' : 'inline-flex'} ${className ?? ''}`}>{icon}{label}</span>;
}








