import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle,
    MessageSquare,
    Info,
    FileText
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { ReviewForm } from '../components/ui/Reviews';
import PaymentModal from '../components/ui/PaymentModal';
import { Header } from '../components/layout';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { useFileUpload } from '../hooks/useFileUpload';
import { useContractState } from '../hooks/useContractState';
import { supabase } from '../lib/supabase';
import { getContractById } from '../services/contracts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SEO from '../components/common/SEO';
import { sendDisputeOpenedEmail } from '../lib/email';
import { Skeleton } from '../components/common/SkeletonCard';

// Components
import ChatSection from '../components/contracts/ChatSection';
import ContractDetailsSidebar from '../components/contracts/ContractDetailsSidebar';

// Types
interface ContractData {
    id: string;
    job_id: string;
    freelancer_id: string;
    client_id: string;
    job: {
        id: string;
        title: string;
        description: string;
        budget: number;
        deadline: string;
    };
    freelancer: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    client: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };
    status: string;
    payment_status: string;
    amount: number;
    started_at: string;
}

export default function ContractWorkspace() {
    const { contractId } = useParams<{ contractId: string }>();
    const { t } = useTranslation() as any;
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
    const { data: contractData, isLoading: isInitialLoading } = useQuery({
        queryKey: ['contract', contractId],
        queryFn: async () => {
            if (!contractId) throw new Error('No contract id');
            const { data, error } = await getContractById(contractId);
            if (error || !data) throw error || new Error('Not found');
            return {
                id: data.id,
                job_id: data.job_id,
                freelancer_id: data.freelancer_id,
                client_id: data.client_id,
                job: data.job as ContractData['job'],
                freelancer: data.freelancer as ContractData['freelancer'],
                client: data.client as ContractData['client'],
                status: data.status,
                payment_status: data.payment_status,
                amount: data.amount,
                started_at: data.started_at,
            };
        },
        enabled: !!contractId,
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
        const receiverId = userRole === 'client' ? contractData.freelancer.id : contractData.client.id;

        try {
            const uploaded = await upload(file, `${contractId}/${Date.now()}_${file.name}`);
            await sendMessage(`📎 ${file.name}`, receiverId, [
                { name: file.name, url: uploaded.url, type: file.type, size: (file.size / 1024).toFixed(1) + 'KB' }
            ]);
            showToast(`تم رفع: ${file.name}`, 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : t.contract.fileUploadError, 'error');
        }
    };

    // Actions Handlers
    const handleDeliverWork = async () => {
        try {
            await deliverWork(deliveryNote);
            showToast(t.contract.workDelivered, 'success');
            setIsDeliverModalOpen(false);
            setDeliveryNote('');
        } catch {
            showToast(t.contract.deliverError, 'error');
        }
    };

    const handleAcceptAndPay = async () => {
        try {
            await acceptWork();
            showToast(t.contract.workAccepted, 'success');
            setIsPaymentModalOpen(false);
            navigate('/client/dashboard');
        } catch {
            showToast(t.contract.acceptError, 'error');
        }
    };

    const handleRequestChanges = async () => {
        try {
            await requestChanges(t.contract.requestRevision);
            showToast(t.contract.revisionSent, 'info');
        } catch {
            showToast(t.contract.error, 'error');
        }
    };

    const handleOpenDispute = async () => {
        if (!disputeReason.trim()) return;
        try {
            await openDispute(disputeReason);
            showToast(t.contract.disputeOpened, 'warning');
            setIsDisputeModalOpen(false);

            // Notify both parties by email — fire-and-forget
            if (contractData) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, email, full_name')
                    .in('id', [contractData.client.id, contractData.freelancer.id]);

                if (profiles) {
                    const client = profiles.find(p => p.id === contractData.client.id);
                    const freelancer = profiles.find(p => p.id === contractData.freelancer.id);
                    const contractId = contractData.id;

                    if (client?.email) {
                        sendDisputeOpenedEmail(
                            client.email, client.full_name,
                            contractId, userRole === 'client' ? 'client' : 'freelancer',
                            disputeReason,
                        );
                    }
                    if (freelancer?.email) {
                        sendDisputeOpenedEmail(
                            freelancer.email, freelancer.full_name,
                            contractId, userRole === 'client' ? 'client' : 'freelancer',
                            disputeReason,
                        );
                    }
                }
            }
            setDisputeReason('');
        } catch {
            showToast(t.contract.disputeError, 'error');
        }
    };

    const submitReviewMutation = useMutation({
        mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
            if (!contractId || !user?.id || !contractData) throw new Error('Missing data');
            const revieweeId = userRole === 'client' ? contractData.freelancer.id : contractData.client.id;

            const { error } = await supabase
                .from('reviews')
                .insert({
                    contract_id: contractId,
                    reviewer_id: user.id,
                    reviewee_id: revieweeId,
                    rating,
                    comment,
                });

            if (error) throw error;
        },
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

    if (isInitialLoading) {
        return (
            <div className="flex flex-col h-screen bg-white dark:bg-dark-900">
                <Header />
                {/* Contract header bar skeleton */}
                <div className="border-b border-gray-200 dark:border-dark-700 px-4 py-3 flex items-center justify-between">
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
                    <div className="hidden lg:block w-72 border-s border-gray-200 dark:border-dark-700 p-4 space-y-4">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!contractData) return null;

    return (
        <div className="flex flex-col h-screen bg-white">
            <SEO
                title={contractData ? `${contractData.job.title} | ${t.contract.workspaceTitle}` : t.contract.workspaceTitle}
                description="تابع المحادثة والملفات وحالة الدفع الخاصة بالعقد من مساحة العمل."
                noIndex
            />
            <Header />

            {/* Contract Header Bar */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 bg-white z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full md:hidden"
                        aria-label="الرجوع للخلف"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500 rtl:rotate-180" />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg leading-tight truncate max-w-[200px] md:max-w-md flex items-center gap-2">
                            {contractData.job.title}
                            {contractData.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className={`w-2 h-2 rounded-full ${currentStatus === 'active' ? 'bg-green-500' :
                                currentStatus === 'completed' ? 'bg-blue-500' : 'bg-gray-400'
                                }`}></span>
                            <span>{t.contract.status}: {currentStatus === 'active' ? t.contract.inProgress : currentStatus}</span>
                        </div>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `/jobs/${contractData.job.id}`}>
                        عرض الوظيفة
                    </Button>
                </div>
            </div>

            {/* Mobile Tabs */}
            <div className="md:hidden shrink-0 border-b border-gray-100 bg-white z-10 overflow-x-auto" role="tablist" aria-label="تبويبات مساحة العمل">
                <div className="flex min-w-max">
                    <button
                        type="button"
                        onClick={() => setActiveMobileTab('chat')}
                        role="tab"
                        id="workspace-tab-chat"
                        aria-selected={activeMobileTab === 'chat'}
                        aria-controls="workspace-panel-chat"
                        aria-label="إظهار المحادثة"
                        className={`flex min-h-[48px] min-w-[118px] shrink-0 items-center justify-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeMobileTab === 'chat' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
                    >
                        <MessageSquare className="w-4 h-4" />{t.common?.placeholder || 'المراسلة'}</button>
                    <button
                        type="button"
                        onClick={() => setActiveMobileTab('details')}
                        role="tab"
                        id="workspace-tab-details"
                        aria-selected={activeMobileTab === 'details'}
                        aria-controls="workspace-panel-details"
                        aria-label="إظهار التفاصيل"
                        className={`flex min-h-[48px] min-w-[118px] shrink-0 items-center justify-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeMobileTab === 'details' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
                    >
                        <Info className="w-4 h-4" />{t.common?.placeholder || 'التفاصيل'}</button>
                    <button
                        type="button"
                        onClick={() => setActiveMobileTab('files')}
                        role="tab"
                        id="workspace-tab-files"
                        aria-selected={activeMobileTab === 'files'}
                        aria-controls="workspace-panel-files"
                        aria-label="إظهار الملفات"
                        className={`flex min-h-[48px] min-w-[118px] shrink-0 items-center justify-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeMobileTab === 'files' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
                    >
                        <FileText className="w-4 h-4" />{t.common?.placeholder || 'الملفات'}</button>
                </div>
            </div>

            {/* Main Content Area (Split View) */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Left: Chat Section (60% Desktop) */}
                <div className={`
                    absolute inset-0 z-0 bg-white md:static md:w-[60%] flex flex-col transition-transform duration-300
                    ${activeMobileTab === 'chat' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
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
                    />
                </div>

                {/* Right: Contract Details (40% Desktop) */}
                <div className={`
                    absolute inset-0 z-0 bg-gray-50 md:static md:w-[40%] md:border-s md:border-gray-200 transition-transform duration-300
                    ${activeMobileTab === 'details' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}
                    id="workspace-panel-details"
                    role="tabpanel"
                    aria-labelledby="workspace-tab-details"
                >
                    <ContractDetailsSidebar
                        contract={contractData}
                        userRole={userRole}
                        currentStatus={currentStatus}
                        isActionLoading={isDelivering || isAccepting}
                        onDeliver={() => setIsDeliverModalOpen(true)}
                        onRequestChanges={handleRequestChanges}
                        onAcceptAndPay={() => setIsPaymentModalOpen(true)}
                        onDispute={() => setIsDisputeModalOpen(true)}
                        onReview={() => setIsReviewModalOpen(true)}
                        hasLeftReview={hasLeftReview}
                    />
                </div>

                {/* Files Tab (Mobile Only) */}
                <div className={`
                    absolute inset-0 z-0 bg-white md:hidden transition-transform duration-300
                    ${activeMobileTab === 'files' ? 'translate-x-0' : 'translate-x-full'}
                `}
                    id="workspace-panel-files"
                    role="tabpanel"
                    aria-labelledby="workspace-tab-files"
                >
                    <div className="p-8 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>قائمة الملفات (راجع تبويب المراسلة للمرفقات)</p>
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
                    <p className="text-muted">أضف ملاحظة للعميل حول التسليم</p>
                    <textarea
                        value={deliveryNote}
                        onChange={(e) => setDeliveryNote(e.target.value)}
                        placeholder="ملاحظات التسليم (اختياري)..."
                        rows={4}
                        className="input resize-none w-full"
                        aria-label="ملاحظات التسليم"
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsDeliverModalOpen(false)}>{t.common?.placeholder || 'إلغاء'}</Button>
                        <Button
                            variant="primary"
                            onClick={handleDeliverWork}
                            isLoading={isDelivering}
                        >
                            تأكيد التسليم
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
                            فتح نزاع سيعلق العمل حتى يتم حل المشكلة. سيقوم فريقنا بمراجعة الحالة خلال 48 ساعة.
                        </p>
                    </div>
                    <textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="اشرح سبب النزاع..."
                        rows={4}
                        className="input resize-none w-full"
                        required
                        aria-label="سبب النزاع"
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsDisputeModalOpen(false)}>{t.common?.placeholder || 'إلغاء'}</Button>
                        <Button
                            variant="secondary"
                            onClick={handleOpenDispute}
                            isLoading={isDisputing}
                            disabled={!disputeReason.trim()}
                        >
                            فتح نزاع
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Review Modal */}
            {contractData && (
                <Modal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    title="تقييم التجربة"
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
