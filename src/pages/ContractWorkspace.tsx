import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle,
    MessageSquare,
    Info,
    FileText,
    AlertCircle,
    Briefcase,
    Calendar,
    DollarSign,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ReviewForm } from '@/components/ui/Reviews';
import PaymentModal from '@/components/ui/PaymentModal';
import { Header } from '@/components/layout';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useContractState } from '@/hooks/useContractState';
import { supabase } from '@/lib/supabase';
import { getContractById } from '@/services/contracts';
import { submitReview as submitReviewRequest } from '@/services/reviews';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SEO from '@/components/common/SEO';
import { sendDisputeOpenedEmail } from '@/lib/email';
import { Skeleton } from '@/components/common/SkeletonCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { resolveMessagingLifecyclePolicy } from '@/lib/messagingLifecycle';

// Components
import ChatSection from '@/components/contracts/ChatSection';
import ContractDetailsSidebar from '@/components/contracts/ContractDetailsSidebar';

function ContractWorkspaceComponent() {
    const { contractId } = useParams<{ contractId: string }>();
    const { t, tx } = useTranslation() as any;
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'details' | 'files'>('chat');

    // Modals
    const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    const [deliveryNote, setDeliveryNote] = useState('');
    const [disputeReason, setDisputeReason] = useState('');

    // Load initial contract data
    const {
        data: contractData,
        isLoading: isInitialLoading,
        isError: isContractError,
        error: contractError,
        refetch: refetchContract,
    } = useQuery({
        queryKey: ['contract', contractId],
        queryFn: async () => {
            if (!contractId) throw new Error('No contract id');
            const { data, error } = await getContractById(contractId);
            if (error || !data) throw error || new Error('Not found');
            
            // Extract first item from relationship arrays (Supabase returns arrays for foreign relations)
            const job = Array.isArray(data.job) ? data.job[0] : data.job;
            const freelancer = Array.isArray(data.freelancer) ? data.freelancer[0] : data.freelancer;
            const client = Array.isArray(data.client) ? data.client[0] : data.client;
            
            return {
                id: data.id,
                job_id: data.job_id,
                freelancer_id: data.freelancer_id,
                client_id: data.client_id,
                job: job || { id: '', title: '' },
                freelancer: freelancer || { id: '', full_name: '', avatar_url: null },
                client: client || { id: '', full_name: '', avatar_url: null },
                status: data.status,
                payment_status: (data as Record<string, unknown>).payment_status || 'pending',
                amount: data.amount,
                started_at: (data as Record<string, unknown>).started_at || new Date().toISOString(),
            };
        },
        enabled: !!contractId,
        retry: 5,
        retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 4000),
    });

    // Determine user role
    const userRole: 'client' | 'freelancer' =
        contractData?.client.id === user?.id ? 'client' : 'freelancer';

    // Real-time chat hook
    const {
        messages,
        isLoading: messagesLoading,
        sendMessage,
        isSending,
        setTyping,
        otherUserTyping,
    } = useRealtimeChat({
        contractId: contractId || '',
        userId: user?.id || '',
        enabled: !!contractId && !!user?.id,
    });

    // File upload hook
    const {
        upload,
        isUploading,
        progress,
    } = useFileUpload({
        bucket: 'attachments', // Use private attachments bucket
        maxSizeMB: 10,
    });

    // Contract state hook
    const {
        contract: contractState,
        deliverWork,
        acceptWork,
        requestChanges,
        openDispute,
        isDelivering,
        isAccepting,
        isDisputing,
        refresh: refreshContractState,
    } = useContractState({
        contractId: contractId || '',
        userId: user?.id || '',
        userRole,
        queryClient,
    });

    // Refresh contract state on mount
    useEffect(() => {
        if (contractId && user?.id) {
            refreshContractState();
        }
    }, [contractId, user?.id, refreshContractState]);

    // Check review status
    const { data: hasLeftReview = false } = useQuery({
        queryKey: ['review', contractId, user?.id],
        queryFn: async () => {
            if (!contractId || !user?.id) return false;
            const { data } = await supabase
                .from('reviews')
                .select('id')
                .eq('contract_id', contractId)
                .eq('reviewer_id', user.id)
                .single();
            return !!data;
        },
        enabled: !!contractId && !!user?.id,
    });

    const handleSendMessage = async (content: string) => {
        if (!contractData || !user) return;

        if (!lifecyclePolicy.canSend) {
            const blockedMessage = lifecyclePolicy.blockedReasonFallback || 'This conversation is read-only right now.';
            showToast(
                tx('pages.messages.readOnlyThread', { message: blockedMessage }, blockedMessage),
                'warning'
            );
            return;
        }

        const receiverId = userRole === 'client' ? contractData.freelancer.id : contractData.client.id;

        try {
            await sendMessage(content, receiverId);
            setTyping(false);
        } catch (error) {
            showToast(error instanceof Error ? error.message : t.contract.sendMessageError, 'error');
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!contractData || !user) return;

        if (!lifecyclePolicy.canSend || !lifecyclePolicy.canAttachFiles) {
            const blockedMessage = lifecyclePolicy.blockedReasonFallback || 'Attachments are disabled for this conversation.';
            showToast(
                tx('pages.messages.readOnlyThread', { message: blockedMessage }, blockedMessage),
                'warning'
            );
            return;
        }

        const receiverId = userRole === 'client' ? contractData.freelancer.id : contractData.client.id;

        try {
            const uploaded = await upload(file, `${user.id}/${contractId}`);
            await sendMessage(`📎 ${file.name}`, receiverId, [
                { name: file.name, url: uploaded.url, type: file.type, size: (file.size / 1024).toFixed(1) + 'KB' }
            ]);
            showToast(`${tx('contract.fileUploaded', undefined, 'File uploaded:')} ${file.name}`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : t.contract.fileUploadError, 'error');
        }
    };

    // Actions Mutations with retry logic
    const deliverWorkMutation = useMutation({
        mutationFn: async (note: string) => {
            await deliverWork(note);
        },
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        onSuccess: () => {
            showToast(t.contract.workDelivered, 'success');
            setIsDeliverModalOpen(false);
            setDeliveryNote('');
        },
        onError: () => {
            showToast(t.contract.deliverError, 'error');
        }
    });

    const acceptWorkMutation = useMutation({
        mutationFn: async () => {
            await acceptWork();
        },
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        onSuccess: () => {
            showToast(t.contract.workAccepted, 'success');
            setIsPaymentModalOpen(false);
            navigate('/client/dashboard');
        },
        onError: () => {
            showToast(t.contract.acceptError, 'error');
        }
    });

    const requestChangesMutation = useMutation({
        mutationFn: async (feedback: string) => {
            await requestChanges(feedback);
        },
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        onSuccess: () => {
            showToast(t.contract.revisionSent, 'info');
        },
        onError: () => {
            showToast(t.contract.error, 'error');
        }
    });

    const openDisputeMutation = useMutation({
        mutationFn: async (reason: string) => {
            await openDispute(reason);
            
            // Notify both parties by email — fire-and-forget
            if (contractData) {
                sendDisputeOpenedEmail(contractData.id);
            }
        },
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        onSuccess: () => {
            showToast(t.contract.disputeOpened, 'warning');
            setIsDisputeModalOpen(false);
            setDisputeReason('');
        },
        onError: () => {
            showToast(t.contract.disputeError, 'error');
        }
    });

    // Actions Handlers
    const handleDeliverWork = async () => {
        deliverWorkMutation.mutate(deliveryNote);
    };

    const isActionPending = useRef(false);

    const handleAcceptAndPay = async () => {
        if (isActionPending.current || acceptWorkMutation.isPending) return;
        isActionPending.current = true;
        try {
            acceptWorkMutation.mutate();
        } finally {
            isActionPending.current = false;
        }
    };

    const handleRequestChanges = async () => {
        requestChangesMutation.mutate(t.contract.requestRevision);
    };

    const handleOpenDispute = async () => {
        if (!disputeReason.trim()) return;
        openDisputeMutation.mutate(disputeReason);
    };

    const submitReviewMutation = useMutation({
        mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
            if (!contractId || !user?.id || !contractData) throw new Error('Missing data');
            const { error } = await submitReviewRequest(contractId, rating, comment);

            if (error) throw error;
        },
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['review', contractId, user?.id] });
            setIsReviewModalOpen(false);
            showToast(t.contract.reviewSent, 'success');
        },
        onError: () => {
            showToast(t.contract.error, 'error');
        }
    });

    const handleSubmitReview = async (rating: number, comment: string) => {
        submitReviewMutation.mutate({ rating, comment });
    };

    const currentStatus = contractState?.status || contractData?.status || 'active';
    const statusMeta = useMemo(() => {
        if (currentStatus === 'active') {
            return {
                dot: 'bg-emerald-400',
                chip: 'border-emerald-400/35 bg-emerald-400/12 text-emerald-300',
                label: t.contract.inProgress,
            };
        }

        if (currentStatus === 'completed') {
            return {
                dot: 'bg-sky-400',
                chip: 'border-sky-400/35 bg-sky-400/12 text-sky-300',
                label: tx('contract.completed', undefined, 'Completed'),
            };
        }

        if (currentStatus === 'disputed') {
            return {
                dot: 'bg-amber-400',
                chip: 'border-amber-400/35 bg-amber-400/12 text-amber-300',
                label: t.contract.disputeOpened,
            };
        }

        return {
            dot: 'bg-muted',
            chip: 'border-border bg-surface text-muted-foreground',
            label: currentStatus,
        };
    }, [currentStatus, t.contract.disputeOpened, t.contract.inProgress, tx]);

    const startedAtLabel = useMemo(() => {
        const source = contractData?.started_at;
        if (!source) return '—';

        const date = new Date(String(source));
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleDateString();
    }, [contractData?.started_at]);

    const amountLabel = `${contractData?.amount ?? 0} ${tx('dynamic_key_1524267')}`;

    const lifecyclePolicy = useMemo(() => {
        return resolveMessagingLifecyclePolicy({
            kind: 'contract',
            contractStatus: currentStatus,
        });
    }, [currentStatus]);

    const deliverySubmitted = useMemo(() => {
        if (currentStatus === 'completed') return true;
        if (contractState?.delivery_note) return true;

        const freelancerId = contractData?.freelancer?.id;
        if (!freelancerId) return false;

        return messages.some((message) => {
            if (message.sender_id !== freelancerId) return false;
            const normalized = String(message.content || '').trim().toLowerCase();
            return normalized.startsWith('[[delivery]]')
                || normalized.startsWith('work has been delivered:');
        });
    }, [contractData?.freelancer?.id, contractState?.delivery_note, currentStatus, messages]);

    if (isInitialLoading) {
        return (
            <div className="flex flex-col h-screen bg-card dark:bg-dark-900">
                <Header />
                {/* Contract header bar skeleton */}
                <div className="border-b border-border dark:border-dark-700 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-28 rounded-xl" />
                </div>
                {/* Main workspace skeleton */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Messages panel */}
                    <div className="flex-1 flex flex-col p-4 gap-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                                <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
                            </div>
                        ))}
                    </div>
                    {/* Sidebar skeleton */}
                    <div className="hidden lg:block w-72 border-s border-border dark:border-dark-700 p-4 space-y-4">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (isContractError) {
        const message =
            contractError instanceof Error
                ? contractError.message
                : tx('contract.loadFailedMessage', undefined, 'Unable to load this contract right now.');

        return (
            <div className="flex min-h-screen flex-col bg-card">
                <Header />
                <div className="flex flex-1 items-center justify-center px-4">
                    <div className="w-full max-w-xl rounded-2xl border border-red-500/20 bg-card p-6 text-center shadow-lg">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h2 className="mb-2 text-xl font-bold text-foreground dark:text-white">
                            {tx('contract.loadFailedTitle', undefined, 'Contract unavailable')}
                        </h2>
                        <p className="mb-5 text-sm text-muted">{message}</p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <Button variant="outline" onClick={() => refetchContract()}>
                                {tx('common.tryAgain', undefined, 'Try again')}
                            </Button>
                            <Button variant="primary" onClick={() => navigate('/contracts')}>
                                {tx('contract.backToContracts', undefined, 'Back to contracts')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!contractData) {
        return (
            <div className="flex min-h-screen flex-col bg-card">
                <Header />
                <div className="flex flex-1 items-center justify-center px-4">
                    <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
                        <h2 className="mb-2 text-xl font-bold text-foreground dark:text-white">
                            {tx('contract.notFoundTitle', undefined, 'Contract not found')}
                        </h2>
                        <p className="mb-5 text-sm text-muted">
                            {tx('contract.notFoundDescription', undefined, 'This contract may still be syncing. You can retry or return to your contracts list.')}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <Button variant="outline" onClick={() => refetchContract()}>
                                {tx('common.tryAgain', undefined, 'Try again')}
                            </Button>
                            <Button variant="primary" onClick={() => navigate('/contracts')}>
                                {tx('contract.backToContracts', undefined, 'Back to contracts')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-card via-card to-surface/70">
            <SEO
                title={contractData ? `${contractData.job.title} | ${t.contract.workspaceTitle}` : t.contract.workspaceTitle}
                description={t.contract.seoDescription || "Track conversation, files, and payment status for your contract from the workspace."}
                noIndex
            />
            <Header />

            <div className="sticky top-0 z-20 shrink-0 border-b border-border bg-card/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 md:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/60 text-muted-foreground transition-colors hover:bg-surface"
                            aria-label={t.common.back}
                        >
                            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
                        </button>

                        <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                {tx('contract.workspaceTitle', undefined, 'Workspace')}
                            </p>
                            <h1 className="mt-0.5 flex items-center gap-2 truncate text-lg font-semibold leading-tight text-foreground md:text-xl">
                                <span className="truncate">{contractData.job.title}</span>
                                {contractData.status === 'completed' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`hidden rounded-full border px-2.5 py-1 text-xs font-medium md:inline-flex ${statusMeta.chip}`}>
                            {statusMeta.label}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = `/jobs/${contractData.job.id}`}>
                        {tx('common.viewJob', undefined, 'View Job')}
                        </Button>
                    </div>
                </div>

                <div className="mx-auto hidden w-full max-w-[1600px] grid-cols-4 gap-3 px-6 pb-3 md:grid">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/70 px-3 py-2 text-xs text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>{tx('contract.role', undefined, 'Role')}: {userRole}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/70 px-3 py-2 text-xs text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{tx('contract.startedAt', undefined, 'Started')}: {startedAtLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/70 px-3 py-2 text-xs text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>{tx('contract.amount', undefined, 'Amount')}: {amountLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/70 px-3 py-2 text-xs text-muted-foreground">
                        <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.dot}`} />
                        <span>{t.contract.status}: {statusMeta.label}</span>
                    </div>
                </div>
            </div>

            <div className="md:hidden shrink-0 border-b border-border bg-card/95 px-3 py-2" role="tablist" aria-label={tx('contract.tabs.ariaLabel', undefined, 'Workspace tabs')}>
                <div className="flex min-w-max items-center gap-2 rounded-xl border border-border bg-surface/60 p-1">
                    <button
                        type="button"
                        onClick={() => setActiveMobileTab('chat')}
                        role="tab"
                        id="workspace-tab-chat"
                        aria-selected={activeMobileTab === 'chat'}
                        aria-controls="workspace-panel-chat"
                        aria-label={tx('contract.tabs.chatAria', undefined, 'Show chat')}
                        className={`flex min-h-[44px] min-w-[108px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeMobileTab === 'chat' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                    >
                        <MessageSquare className="w-4 h-4" />{tx('contract.tabs.chat', undefined, 'Chat')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveMobileTab('details')}
                        role="tab"
                        id="workspace-tab-details"
                        aria-selected={activeMobileTab === 'details'}
                        aria-controls="workspace-panel-details"
                        aria-label={tx('contract.tabs.detailsAria', undefined, 'Show details')}
                        className={`flex min-h-[44px] min-w-[108px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeMobileTab === 'details' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                    >
                        <Info className="w-4 h-4" />{tx('contract.tabs.details', undefined, 'Details')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveMobileTab('files')}
                        role="tab"
                        id="workspace-tab-files"
                        aria-selected={activeMobileTab === 'files'}
                        aria-controls="workspace-panel-files"
                        aria-label={tx('contract.tabs.filesAria', undefined, 'Show files')}
                        className={`flex min-h-[44px] min-w-[108px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeMobileTab === 'files' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                    >
                        <FileText className="w-4 h-4" />{tx('contract.tabs.files', undefined, 'Files')}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden md:px-4 md:pb-4">
                <div className="relative mx-auto flex h-full w-full max-w-[1600px] overflow-hidden md:gap-4 md:pt-4">
                    <div className={`
                    absolute inset-0 z-0 flex flex-col transition-transform duration-300
                    ${activeMobileTab === 'chat' ? 'translate-x-0' : 'translate-x-full'}
                    md:static md:w-[64%] md:translate-x-0 md:overflow-hidden md:rounded-3xl md:border md:border-border md:shadow-[0_18px_45px_-28px_rgba(0,0,0,0.6)]
                `}
                    id="workspace-panel-chat"
                    role="tabpanel"
                    aria-labelledby="workspace-tab-chat"
                >
                    <ChatSection
                        messages={messages}
                        currentUser={user}
                        onSendMessage={handleSendMessage}
                        onFileUpload={handleFileUpload}
                        isSending={isSending}
                        isUploading={isUploading}
                        uploadProgress={progress}
                        otherUserTyping={otherUserTyping}
                        onTyping={() => setTyping(true)}
                        isLoadingHistory={messagesLoading}
                        isComposerDisabled={!lifecyclePolicy.canSend}
                        disabledReason={lifecyclePolicy.blockedReasonFallback}
                        canAttachFiles={lifecyclePolicy.canAttachFiles}
                    />
                </div>

                    <div className={`
                    absolute inset-0 z-0 transition-transform duration-300
                    ${activeMobileTab === 'details' ? 'translate-x-0' : 'translate-x-full'}
                    md:static md:w-[36%] md:translate-x-0 md:overflow-hidden md:rounded-3xl md:border md:border-border md:shadow-[0_18px_45px_-28px_rgba(0,0,0,0.6)]
                `}
                    id="workspace-panel-details"
                    role="tabpanel"
                    aria-labelledby="workspace-tab-details"
                >
                    <ContractDetailsSidebar
                        contract={contractData}
                        userRole={userRole}
                        currentStatus={currentStatus}
                        deliverySubmitted={deliverySubmitted}
                        isActionLoading={isDelivering || isAccepting}
                        onDeliver={() => setIsDeliverModalOpen(true)}
                        onRequestChanges={handleRequestChanges}
                        onAcceptAndPay={() => setIsPaymentModalOpen(true)}
                        onDispute={() => setIsDisputeModalOpen(true)}
                        onReview={() => setIsReviewModalOpen(true)}
                        hasLeftReview={hasLeftReview}
                    />
                </div>

                    <div className={`
                    absolute inset-0 z-0 bg-card md:hidden transition-transform duration-300
                    ${activeMobileTab === 'files' ? 'translate-x-0' : 'translate-x-full'}
                `}
                    id="workspace-panel-files"
                    role="tabpanel"
                    aria-labelledby="workspace-tab-files"
                >
                    <div className="mx-4 mt-4 rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
                            <FileText className="h-7 w-7 opacity-60" />
                        </div>
                        <p className="text-sm">{tx('contract.filesListEmpty', undefined, 'Files list (check chat for attachments)')}</p>
                    </div>
                </div>
                </div>
            </div>

            {/* Deliver Work Modal */}
            <Modal
                isOpen={isDeliverModalOpen}
                onClose={() => setIsDeliverModalOpen(false)}
                title={t.contract.deliverWork}
            >
                <div className="space-y-4">
                    <p className="text-muted">{tx('contract.deliverNoteLabel', undefined, 'Add a note for the client')}</p>
                    <textarea
                        value={deliveryNote}
                        onChange={(e) => setDeliveryNote(e.target.value)}
                        placeholder={tx('contract.deliverNotePlaceholder', undefined, 'Delivery notes (optional)...')}
                        rows={4}
                        className="input resize-none w-full"
                        aria-label={tx('contract.deliverNoteAria', undefined, 'Delivery notes')}
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsDeliverModalOpen(false)}>{t.common?.cancel || 'Cancel'}</Button>
                        <Button
                            variant="primary"
                            onClick={handleDeliverWork}
                            isLoading={isDelivering}
                        >
                            {tx('contract.confirmDelivery', undefined, 'Confirm Delivery')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Payment Modal */}
            {contractData && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    amount={contractData.amount}
                    recipientName={contractData.freelancer.full_name}
                    contractId={contractData.id}
                    onSuccess={handleAcceptAndPay}
                />
            )}

            {/* Dispute Modal */}
            <Modal
                isOpen={isDisputeModalOpen}
                onClose={() => setIsDisputeModalOpen(false)}
                title={t.contract.openDispute}
            >
                <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-xl">
                        <p className="text-yellow-800">
                            {tx('contract.disputeWarning', undefined, 'Opening a dispute will suspend the contract. Our team will review your case within 48 hours.')}
                        </p>
                    </div>
                    <textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder={tx('contract.disputeReasonPlaceholder', undefined, 'Explain reason for dispute...')}
                        rows={4}
                        className="input resize-none w-full"
                        required
                        aria-label={tx('contract.disputeReasonAria', undefined, 'Dispute reason')}
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsDisputeModalOpen(false)}>{t.common?.cancel || 'Cancel'}</Button>
                        <Button
                            variant="secondary"
                            onClick={handleOpenDispute}
                            isLoading={isDisputing}
                            disabled={!disputeReason.trim()}
                        >
                            {tx('contract.openDisputeAction', undefined, 'Open Dispute')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Review Modal */}
            {contractData && (
                <Modal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    title={tx('contract.reviewExperience', undefined, 'Review Experience')}
                >
                    <ReviewForm
                        jobTitle={contractData.job.title}
                        recipientName={userRole === 'client'
                            ? contractData.freelancer.full_name
                            : contractData.client.full_name}
                        onSubmit={handleSubmitReview}
                        onCancel={() => setIsReviewModalOpen(false)}
                    />
                </Modal>
            )}
        </div>
    );
}

export default function ContractWorkspace() {
    return (
        <ErrorBoundary>
            <ContractWorkspaceComponent />
        </ErrorBoundary>
    );
}
