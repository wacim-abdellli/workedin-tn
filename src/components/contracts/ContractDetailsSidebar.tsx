import { useState } from 'react';
import {
    Clock, CheckCircle, User,
    ChevronDown, ChevronUp, FileText,
    DollarSign
} from 'lucide-react';
import Button from '../ui/Button';
import { useTranslation } from '../../i18n';

interface ContractSidebarData {
    amount: number;
    job?: {
        title?: string;
        deadline?: string;
    };
    freelancer?: {
        full_name?: string;
        avatar_url?: string | null;
    };
    client?: {
        full_name?: string;
        avatar_url?: string | null;
    };
}

interface ContractDetailsSidebarProps {
    contract: ContractSidebarData | null;
    userRole: 'client' | 'freelancer';
    currentStatus: string;
    isActionLoading?: boolean;
    onDeliver: () => void;
    onRequestChanges: () => void;
    onAcceptAndPay: () => void;
    onDispute: () => void;
    onReview: () => void;
    hasLeftReview: boolean;
}

export default function ContractDetailsSidebar({
    contract,
    userRole,
    currentStatus,
    isActionLoading,
    onDeliver,
    onRequestChanges,
    onAcceptAndPay,
    onDispute,
    onReview,
    hasLeftReview
}: ContractDetailsSidebarProps) {
    const { t, tx } = useTranslation();
    const [expandedSection, setExpandedSection] = useState<string | null>('actions');
    const milestonesPanelId = 'contract-milestones-panel';
    const filesPanelId = 'contract-files-panel';

    if (!contract) return null;

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const otherParty = userRole === 'client' ? contract.freelancer : contract.client;
    const daysRemaining = (() => {
        if (!contract.job?.deadline) return 0;
        const diff = new Date(contract.job.deadline).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    })();

    return (
        <div className="h-full flex flex-col bg-gray-50 border-s border-gray-200 overflow-y-auto">

            {/* 1. Status Banner */}
            <div className={`p-4 border-b border-gray-100 ${currentStatus === 'active' ? 'bg-blue-50/50' :
                currentStatus === 'completed' ? 'bg-green-50/50' :
                    currentStatus === 'disputed' ? 'bg-yellow-50/50' : 'bg-gray-50'
                }`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg text-gray-900">
                        {contract.job?.title}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStatus === 'active' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        currentStatus === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                            currentStatus === 'disputed' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                        {currentStatus === 'active' && t.contract.inProgress}
                        {currentStatus === 'completed' && tx('contract.completed', undefined, 'Completed')}
                        {currentStatus === 'disputed' && t.contract.disputeOpened}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{contract.amount} د.ت</span>
                    </div>
                    {currentStatus === 'active' && (
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{tx('contract.daysRemaining', { days: daysRemaining }, `${daysRemaining} ${t.contract.days} remaining`)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Actions Section */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{tx('contract.requiredActions', undefined, 'Required actions')}</h3>
                <div className="space-y-3">
                    {/* Freelancer: Deliver */}
                    {userRole === 'freelancer' && currentStatus === 'active' && (
                        <Button
                            variant="primary"
                            className="w-full justify-center"
                            onClick={onDeliver}
                            isLoading={isActionLoading}
                        >
                            <CheckCircle className="w-4 h-4 ml-2" />
                            {t.contract.deliverWork}
                        </Button>
                    )}

                    {/* Client: Accept or Request Changes */}
                    {userRole === 'client' && currentStatus === 'active' && (
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="primary"
                                className="w-full justify-center"
                                onClick={onAcceptAndPay}
                                isLoading={isActionLoading}
                            >
                                <CheckCircle className="w-4 h-4 ml-2" />
                                {t.contract.acceptAndPay}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-center"
                                onClick={onRequestChanges}
                            >
                                {t.contract.requestChanges}
                            </Button>
                        </div>
                    )}

                    {/* ReviewButton */}
                    {currentStatus === 'completed' && !hasLeftReview && (
                        <Button
                            variant="secondary"
                            className="w-full justify-center"
                            onClick={onReview}
                        >
                            {tx('contract.addReview', undefined, 'Add your review')}
                        </Button>
                    )}

                    {/* Dispute */}
                    {currentStatus === 'active' && (
                        <button
                            onClick={onDispute}
                            className="w-full text-center text-xs text-yellow-600 hover:text-yellow-700 hover:underline mt-2"
                        >
                            {t.contract.openDispute}
                        </button>
                    )}
                </div>
            </div>

            {/* 3. Milestones (Mock for now, waiting for real implementation) */}
            <div className="border-b border-gray-200 bg-white">
                <button
                    type="button"
                    onClick={() => toggleSection('milestones')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    aria-expanded={expandedSection === 'milestones'}
                    aria-controls={milestonesPanelId}
                >
                    <div className="flex items-center gap-2 font-medium text-sm">
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                        {tx('contract.milestones', undefined, 'Milestones')}
                    </div>
                    {expandedSection === 'milestones' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {expandedSection === 'milestones' && (
                    <div id={milestonesPanelId} className="p-4 bg-gray-50 space-y-3">
                        {/* Example Milestone - In future this comes from DB */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-sm">{tx('contract.finalDelivery', undefined, 'Final delivery')}</h4>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{tx('contract.pending', undefined, 'Pending')}</span>
                            </div>
                            <div className="text-xs text-gray-500 flex justify-between">
                                <span>{contract.amount} د.ت</span>
                                <span>{contract.job?.deadline ? new Date(contract.job.deadline).toLocaleDateString() : '—'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. Files */}
            <div className="border-b border-gray-200 bg-white">
                <button
                    type="button"
                    onClick={() => toggleSection('files')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    aria-expanded={expandedSection === 'files'}
                    aria-controls={filesPanelId}
                >
                    <div className="flex items-center gap-2 font-medium text-sm">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {tx('contract.sharedFiles', undefined, 'Shared files')}
                    </div>
                    {expandedSection === 'files' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {expandedSection === 'files' && (
                    <div id={filesPanelId} className="p-4 bg-gray-50 text-center text-sm text-gray-500">
                        {tx('contract.noSharedFiles', undefined, 'No shared files yet')}
                    </div>
                )}
            </div>

            {/* 5. Other Party Info */}
            <div className="mt-auto p-4 border-t border-gray-200 bg-gray-50">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    {userRole === 'client'
                        ? tx('contract.workingOnProject', undefined, 'Working on this project')
                        : tx('contract.employer', undefined, 'Employer')}
                </h4>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                        {otherParty?.avatar_url ? (
                            <img src={otherParty.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-sm text-gray-900">{otherParty?.full_name}</p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            {tx('contract.onlineNow', undefined, 'Online now')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
