import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Filter, Share2, MoreVertical, Edit } from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import ProposalCard from '../components/proposals/ProposalCard';
import ProposalFiltersSidebar from '../components/proposals/ProposalFiltersSidebar';
import JobSummaryCard from '../components/proposals/JobSummaryCard';
import type { Proposal } from '../types/proposal';
import ProposalDetailModal from '../components/proposals/ProposalDetailModal';
import EmptyState from '../components/common/EmptyState';

// Mock Data
import type { ProposalStatus } from '../types/proposal';

const MOCK_PROPOSALS: Array<{
    id: string;
    freelancer: {
        full_name: string;
        title: string;
        avatar_url: string;
        country: string;
        rating: number;
        reviews_count: number;
        jobs_completed: number;
        success_rate: number;
        is_verified: boolean;
        is_online: boolean;
        bio: string;
    };
    cover_letter: string;
    bid_amount: number;
    duration: number;
    created_at: string;
    status: ProposalStatus;
    attachments: Array<{ name: string; size: string }>;
}> = [
        {
            id: '1',
            freelancer: {
                full_name: 'أحمد محمد',
                title: 'مطور ويب Full Stack',
                avatar_url: 'https://i.pravatar.cc/150?img=68',
                country: 'تونس',
                rating: 4.9,
                reviews_count: 42,
                jobs_completed: 35,
                success_rate: 98,
                is_verified: true,
                is_online: true,
                bio: 'مطور برمجيات ذو خبرة واسعة في بناء تطبيقات الويب باستخدام أحدث التقنيات.'
            },
            cover_letter: 'مرحباً، قرأت تفاصيل مشروعك بعناية وأنا مستعد لتنفيذه باحترافية. لدي خبرة 5 سنوات في تطوير المتاجر الإلكترونية باستخدام React و Node.js. سأقوم بتسليم المشروع في الوقت المحدد مع ضمان الجودة...\n\nمميزاتي:\n- كود نظيف وقابل للصيانة\n- تصميم متجاوب مع جميع الشاشات\n- دعم فني لمدة شهر بعد التسليم',
            bid_amount: 1500,
            duration: 15,
            created_at: new Date().toISOString(),
            status: 'new',
            attachments: [{ name: 'previous_work.pdf', size: '2.5MB' }]
        },
        {
            id: '2',
            freelancer: {
                full_name: 'سارة التونسي',
                title: 'مصممة UI/UX',
                avatar_url: 'https://i.pravatar.cc/150?img=44',
                country: 'صفاقس',
                rating: 4.7,
                reviews_count: 18,
                jobs_completed: 12,
                success_rate: 95,
                is_verified: true,
                is_online: false,
                bio: 'مصممة واجهات مستخدم شغوفة بتقديم تجارب مستخدم فريدة وجذابة.'
            },
            cover_letter: 'أهلاً بك. يمكنني تصميم واجهة مستخدم عصرية وجذابة لمتجرك. أركز على تجربة المستخدم وسهولة الاستخدام. يمكنك الاطلاع على معرض أعمالي...',
            bid_amount: 1200,
            duration: 20,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            status: 'shortlisted',
            attachments: []
        }
    ];

export default function JobProposals() {
    const { jobId } = useParams<{ jobId: string }>();
    const [activeTab, setActiveTab] = useState('all');
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

    // TODO: Replace with actual API call to fetch proposals
    // This should use the jobId to fetch data from Supabase
    void jobId; // Acknowledge jobId usage for linter

    // Mock Job Data
    const job = {
        title: "تصميم ومتجر إلكتروني متكامل",
        status: "open",
        budget_min: 1000,
        budget_max: 2000,
        job_type: 'fixed_price',
        duration: '1_3_months',
        created_at: new Date().toISOString(),
        stats: {
            proposals: 12,
            interviewing: 3,
            shortlisted: 5,
            hired: 0
        }
    };

    // TODO: Implement message freelancer - should open chat/messaging modal
    const handleMessage = (_id: string) => {
        // Navigate to message page or open chat modal
    };

    // TODO: Implement shortlist functionality - add to shortlisted proposals
    const handleShortlist = (_id: string) => {
        // Update proposal status to 'shortlisted' via Supabase
    };

    // TODO: Implement hire functionality - create contract
    const handleHire = (_id: string) => {
        // Navigate to contract creation or open hire modal
    };

    // TODO: Implement filter change - filter proposals list
    const handleFilterChange = (_filters: Record<string, unknown>) => {
        // Apply filters to proposals list
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 pb-20 transition-colors duration-300">
            <Header />

            {/* Top Section: Job Info */}
            <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 pt-8 pb-8 transition-colors duration-300">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
                                <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-800">
                                    مفتوح
                                </span>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <strong className="text-gray-900 dark:text-white">{job.stats.proposals}</strong> عروض
                                </span>
                                <span className="flex items-center gap-1">
                                    <strong className="text-gray-900 dark:text-white">{job.stats.interviewing}</strong> مقابلات
                                </span>
                                <span className="flex items-center gap-1">
                                    <strong className="text-gray-900 dark:text-white">{job.stats.shortlisted}</strong> قائمة قصيرة
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" leftIcon={<Share2 className="w-4 h-4" />}>
                                مشاركة
                            </Button>
                            <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                                تعديل
                            </Button>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-custom py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Left Sidebar: Filters */}
                    <div className="hidden lg:block lg:col-span-3">
                        <ProposalFiltersSidebar
                            totalProposals={job.stats.proposals}
                            filters={{}}
                            onFilterChange={handleFilterChange}
                        />
                    </div>

                    {/* Center: Proposals List */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* Mobile Filter Toggle */}
                        <div className="lg:hidden">
                            <Button variant="outline" className="w-full" leftIcon={<Filter className="w-4 h-4" />}>
                                تصفية وعرض
                            </Button>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-1 flex overflow-x-auto">
                            {['all', 'new', 'shortlisted', 'archived'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                                        ${activeTab === tab
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'}
                                    `}
                                >
                                    {tab === 'all' && 'كل العروض'}
                                    {tab === 'new' && 'جديدة'}
                                    {tab === 'shortlisted' && 'قائمة قصيرة'}
                                    {tab === 'archived' && 'مؤرشفة'}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="space-y-4">
                            {MOCK_PROPOSALS.length > 0 ? (
                                MOCK_PROPOSALS.map(proposal => (
                                    <div key={proposal.id} onClick={() => setSelectedProposal(proposal)} className="cursor-pointer transition-transform hover:scale-[1.01]">
                                        <ProposalCard
                                            proposal={proposal}
                                            onHire={handleHire}
                                            onMessage={handleMessage}
                                            onShortlist={handleShortlist}
                                        />
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon={Filter}
                                    title="لا توجد عروض بعد"
                                    description="لم تتلقى أي عروض لهذا المشروع حتى الآن. جرب مشاركة المشروع لزيادة المشاهدات."
                                    action={{
                                        label: "مشاركة المشروع",
                                        onClick: () => { },
                                        variant: "outline"
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar: Job Summary */}
                    <div className="hidden lg:block lg:col-span-3">
                        <JobSummaryCard job={job} />
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            <ProposalDetailModal
                proposal={selectedProposal}
                isOpen={!!selectedProposal}
                onClose={() => setSelectedProposal(null)}
                onHire={() => selectedProposal?.id && handleHire(selectedProposal.id)}
                onMessage={() => selectedProposal?.id && handleMessage(selectedProposal.id)}
                onShortlist={() => selectedProposal?.id && handleShortlist(selectedProposal.id)}
                onArchive={() => {
                    // TODO: Implement archive functionality
                    void selectedProposal?.id;
                }}
            />
        </div>


    );
}
