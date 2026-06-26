import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from '@/i18n';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileCheck2,
  GitPullRequest,
  Lock,
  PackageCheck,
  ShieldAlert,
  Star,
  Wallet,
  Timer,
} from "lucide-react";
import MilestoneTimeline from './MilestoneTimeline';
import { ns, fmtDate, fmtSize, fmtAmount, roleTheme } from './contractUtils';
import type { ContractSidebarData, ContractSharedFile, ContractActivityEvent, WorkspaceModel } from './types';
import { CompletedSummary, ContractPulse, ReviewCountdown, EscrowLifecycleStepper, NextMoveCard } from './ControlSections';
import { DeliveryFileHeroCard, DeliveryLinkHeroCard, EscrowVaultVisualizer, FilesTab } from './FileCardsSection';
import { ActivityTab } from './ActivitySection';
import { MilestonesTab } from './MilestonesSection';
import ContractSidebarHeader from './ContractSidebarHeader';
import ContractClearanceBanner from './ContractClearanceBanner';
import FilePreviewModal from './FilePreviewModal';
import SandboxModal from './SandboxModal';

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

            <ContractSidebarHeader
              contract={contract}
              otherParty={model.otherParty}
              userRole={userRole}
              isEscrowFunded={model.isEscrowFunded}
              status={model.status}
              onGoBack={onGoBack}
              onGoToMessages={onGoToMessages}
              onOpenWorkspace={onOpenWorkspace}
              isSidebar={isSidebar}
            />

            {/* Main Unified Dashboard Grid Layout */}
            <main className={`flex-grow ${isSidebar ? 'p-3' : 'px-4 py-8 sm:px-8 sm:py-10'}`}>
                <div className="mx-auto w-full max-w-[1800px]">
                    <ContractClearanceBanner
                      isActive={isClearanceActive}
                      isDisputed={isClearanceDisputed}
                      escrowPendingClearanceUntil={contract.escrowPendingClearanceUntil}
                      userRole={userRole}
                      onHoldClearance={onHoldClearance}
                    />

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

            <FilePreviewModal
              file={previewFile}
              onClose={() => setPreviewFile(null)}
              onOpenFile={onOpenSharedFile}
              closeRef={previewCloseRef}
            />

            <SandboxModal
              url={sandboxUrl}
              label={sandboxLabel}
              viewport={sandboxViewport}
              onClose={() => setSandboxUrl(null)}
              onViewportChange={setSandboxViewport}
            />
        </div>
    );
}


























