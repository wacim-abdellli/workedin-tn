import { useMemo } from 'react';
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
    Timer,
    Wallet,
} from 'lucide-react';
import { ns, fmtDate, fmtAmount } from './contractUtils';
import type { ContractSidebarData, WorkspaceModel } from './types';

export function useWorkspaceModel(
    contract: ContractSidebarData | null,
    currentStatus: string,
    deliverySubmitted: boolean,
    hasLeftReview: boolean,
    userRole: 'client' | 'freelancer',
): WorkspaceModel | null {
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

    return useMemo<WorkspaceModel | null>(() => {
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
}
