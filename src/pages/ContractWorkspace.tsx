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
import { getContract, supabase } from '../lib/supabase';

// Components
import ChatSection from '../components/contracts/ChatSection';
import ContractDetailsSidebar from '../components/contracts/ContractDetailsSidebar';

// Types
interface ContractData {
    id: string;
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

    const [contractData, setContractData] = useState<ContractData | null>(null);
    const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'details' | 'files'>('chat');

    // Modals
    const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [deliveryNote, setDeliveryNote] = useState('');
    const [disputeReason, setDisputeReason] = useState('');
    const [hasLeftReview, setHasLeftReview] = useState(false);

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

    // Load initial contract data
    useEffect(() => {
        loadContract();
    }, [contractId]);

    // Refresh contract state on mount
    useEffect(() => {
        if (contractId && user?.id) {
            refreshContractState();
        }
    }, [contractId, user?.id]);

    const loadContract = async () => {
        if (!contractId) return;
        setIsInitialLoading(true);

        try {
            const data = await getContract(contractId);
            if (data) {
                setContractData({
                    id: data.id,
                    job: data.job as ContractData['job'],
                    freelancer: data.freelancer as ContractData['freelancer'],
                    client: data.client as ContractData['client'],
                    status: data.status,
                    payment_status: data.payment_status,
                    amount: data.amount,
                    started_at: data.started_at,
                });
            }
        } catch (error) {
            showToast('حدث خطأ في تحميل العقد', 'error');
        } finally {
            setIsInitialLoading(false);
        }
    };

    // Check review status
    useEffect(() => {
        const checkReview = async () => {
            if (!contractId || !user?.id) return;
            const { data } = await supabase
                .from('reviews')
                .select('id')
                .eq('contract_id', contractId)
                .eq('reviewer_id', user.id)
                .single();
            if (data) setHasLeftReview(true);
        };
        checkReview();
    }, [contractId, user?.id]);

    const handleSendMessage = async (content: string) => {
        try {
            await sendMessage(content);
            setTyping(false);
        } catch {
            showToast('حدث خطأ في إرسال الرسالة', 'error');
        }
    };

    const handleFileUpload = async (file: File) => {
        try {
            const uploaded = await upload(file, `${contractId}/${Date.now()}_${file.name}`);
            await sendMessage(`📎 ${file.name}`, [
                { name: file.name, url: uploaded.url, type: file.type, size: (file.size / 1024).toFixed(1) + 'KB' }
            ]);
            showToast(`تم رفع: ${file.name}`, 'success');
        } catch (err) {
            showToast('حدث خطأ في رفع الملف', 'error');
        }
    };

    // Actions Handlers
    const handleDeliverWork = async () => {
        try {
            await deliverWork(deliveryNote);
            showToast('تم تسليم العمل بنجاح!', 'success');
            setIsDeliverModalOpen(false);
            setDeliveryNote('');
        } catch {
            showToast('حدث خطأ في تسليم العمل', 'error');
        }
    };

    const handleAcceptAndPay = async () => {
        try {
            await acceptWork();
            showToast('تم قبول العمل وإتمام الدفع!', 'success');
            setIsPaymentModalOpen(false);
            navigate('/client/dashboard');
        } catch {
            showToast('حدث خطأ في قبول العمل', 'error');
        }
    };

    const handleRequestChanges = async () => {
        try {
            await requestChanges('طلب تعديلات');
            showToast('تم إرسال طلب التعديلات', 'info');
        } catch {
            showToast('حدث خطأ', 'error');
        }
    };

    const handleOpenDispute = async () => {
        if (!disputeReason.trim()) return;
        try {
            await openDispute(disputeReason);
            showToast('تم فتح نزاع. سيتم المراجعة خلال 48 ساعة.', 'warning');
            setIsDisputeModalOpen(false);
            setDisputeReason('');
        } catch {
            showToast('حدث خطأ في فتح النزاع', 'error');
        }
    };

    const handleSubmitReview = async (rating: number, comment: string) => {
        if (!contractId || !user?.id || !contractData) return;
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
        setHasLeftReview(true);
        setIsReviewModalOpen(false);
        showToast('تم إرسال تقييمك بنجاح', 'success');
    };

    const currentStatus = contractState?.status || contractData?.status || 'active';

    if (isInitialLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full" />
                </div>
            </div>
        );
    }

    if (!contractData) return null;

    return (
        <div className="flex flex-col h-screen bg-white">
            <Header />

            {/* Contract Header Bar */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 bg-white z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full md:hidden">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
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
            <div className="md:hidden flex border-b border-gray-100 shrink-0 bg-white z-10">
                <button
                    onClick={() => setActiveMobileTab('chat')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeMobileTab === 'chat' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
                >
                    <MessageSquare className="w-4 h-4" />
                    المراسلة
                </button>
                <button
                    onClick={() => setActiveMobileTab('details')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeMobileTab === 'details' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
                >
                    <Info className="w-4 h-4" />
                    التفاصيل
                </button>
                <button
                    onClick={() => setActiveMobileTab('files')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeMobileTab === 'files' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}
                >
                    <FileText className="w-4 h-4" />
                    الملفات
                </button>
            </div>

            {/* Main Content Area (Split View) */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Left: Chat Section (60% Desktop) */}
                <div className={`
                    absolute inset-0 z-0 bg-white md:static md:w-[60%] flex flex-col transition-transform duration-300
                    ${activeMobileTab === 'chat' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}>
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
                `}>
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
                `}>
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
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsDeliverModalOpen(false)}>
                            إلغاء
                        </Button>
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
                    />
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setIsDisputeModalOpen(false)}>
                            إلغاء
                        </Button>
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
