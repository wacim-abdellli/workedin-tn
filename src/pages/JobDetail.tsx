import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Heart,
    Clock,
    MapPin,
    Star,
    Briefcase,
    User,
    Eye,
    Users,
    FileText,
    Download,
    Share2,
    Flag,
    CheckCircle,
    ChevronRight,
    Send,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as jobsService from '../services/jobs';
import * as profilesService from '../services/profiles';
import * as proposalsService from '../services/proposals';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import SEO from '../components/common/SEO';
import { Skeleton } from '../components/common/SkeletonCard';
import { useTranslation } from '../i18n';

import ProposalModal from '../components/proposals/ProposalModal';
import type { ProposalFormData } from '../components/proposals/ProposalModal';
import { sendNewProposalEmail } from '../lib/email';
import { spendConnects, refundConnects, getConnectsBalance, CONNECTS_COST } from '../services/connects';
import SimilarJobCard from '../components/jobs/SimilarJobCard';
import OptimizedImage from '../components/common/OptimizedImage';

// Types
interface Job {
    id: string;
    client_id: string;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    job_type: 'fixed_price' | 'hourly';
    budget_min?: number;
    budget_max?: number;
    hourly_rate?: number;
    estimated_hours?: number;
    duration?: string;
    experience_level: string;
    required_skills: string[];
    visibility: string;
    status: string;
    proposals_count: number;
    views_count: number;
    posted_at: string;
    deadline?: string;
    attachments?: string[];
    client?: {
        id: string;
        full_name: string;
        email?: string;
        avatar_url?: string;
        location?: string;
        created_at: string;
    };
}

interface Proposal {
    id: string;
    job_id: string;
    freelancer_id: string;
    cover_letter: string;
    bid_amount: number;
    delivery_days: number;
    status: string;
    created_at: string;
}



// Helper functions (Restored)
function timeAgo(date: string): string {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
    return `منذ ${Math.floor(diffDays / 30)} شهر`;
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-TN', {
        year: 'numeric',
        month: 'long',
    });
}

const EXPERIENCE_LABELS: Record<string, string> = {
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    expert: 'خبير',
};

const CATEGORY_LABELS: Record<string, string> = {
    design: 'تصميم',
    development: 'برمجة',
    writing: 'كتابة',
    translation: 'ترجمة',
    video: 'فيديو',
    marketing: 'تسويق',
    data: 'بيانات',
    other: 'أخرى',
};

// Main Component
function JobDetail() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { user, freelancerProfile } = useAuth();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const [showProposalModal, setShowProposalModal] = useState(false);

    // Job Fetch
    const { data: job, isLoading } = useQuery({
        queryKey: ['job', jobId],
        queryFn: async () => {
            if (!jobId) throw new Error('No job ID');
            const { data, error } = await jobsService.getJobById(jobId);
            if (error) throw error;
            
            // Increment view count in background
            jobsService.incrementJobViews(jobId, data.views_count || 0).catch(console.error);
            
            return data as Job;
        },
        enabled: !!jobId,
    });

    // Saved Status
    const { data: isSaved = false } = useQuery({
        queryKey: ['savedStatus', jobId, user?.id],
        queryFn: async () => {
            if (!user || !jobId) return false;
            const { data } = await profilesService.getFavoriteStatus(user.id, jobId);
            return !!data;
        },
        enabled: !!user && !!jobId,
    });

    // My Proposal
    const { data: myProposal = null } = useQuery({
        queryKey: ['myProposal', jobId, user?.id],
        queryFn: async () => {
            if (!user || !jobId) return null;
            const { data } = await proposalsService.getMyProposal(jobId, user.id);
            return data as Proposal | null;
        },
        enabled: !!user && !!jobId,
    });

    // Similar Jobs
    const { data: similarJobs = [] } = useQuery({
        queryKey: ['similarJobs', job?.category],
        queryFn: async () => {
            if (!job) return [];
            const { data } = await jobsService.getSimilarJobs(job.id, job.category);
            return (data as Job[]) || [];
        },
        enabled: !!job,
    });

    // Client Stats
    const { data: clientStats = { totalJobs: 0, totalSpent: 0, rating: 0 } } = useQuery({
        queryKey: ['clientStats', job?.client_id],
        queryFn: async () => {
            if (!job?.client_id) return { totalJobs: 0, totalSpent: 0, rating: 0 };
            return profilesService.getClientStats(job.client_id);
        },
        enabled: !!job?.client_id,
    });

    // Connects balance (only for freelancers)
    const { data: connectsBalance = { balance: 0, used: 0 } } = useQuery({
        queryKey: ['connectsBalance', user?.id],
        queryFn: () => getConnectsBalance(user!.id),
        enabled: !!user?.id && !!freelancerProfile,
    });
    const connectsAvailable = connectsBalance?.balance ?? 0;

    // Toggle Save Mutation
    const toggleSaveMutation = useMutation({
        mutationFn: async () => {
            await profilesService.toggleFavorite(user!.id, jobId!, isSaved);
            return !isSaved;
        },
        onSuccess: (newSavedStatus) => {
            queryClient.setQueryData(['savedStatus', jobId, user?.id], newSavedStatus);
            showToast(newSavedStatus ? 'تم حفظ الوظيفة' : 'تم إزالة الوظيفة من المحفوظات', 'success');
        },
        onError: () => showToast('حدث خطأ', 'error')
    });

    const toggleSave = () => {
        if (!user || !jobId) {
            showToast('سجل الدخول لحفظ الوظيفة', 'warning');
            return;
        }
        toggleSaveMutation.mutate();
    };

    // Submit Proposal Mutation
    const submitProposalMutation = useMutation({
        mutationFn: async ({ data, files }: { data: ProposalFormData, files: File[] }) => {
            if (!user || !jobId) throw new Error('Missing auth or job');

            // Check connects balance before submitting
            if (connectsAvailable < CONNECTS_COST) {
                throw new Error(`تحتاج إلى ${CONNECTS_COST} كونيكتس لإرسال عرض. رصيدك الحالي: ${connectsAvailable}`);
            }

            const { error, data: proposalId } = await proposalsService.createProposal({
                job_id: jobId,
                freelancer_id: user.id,
                cover_letter: data.cover_letter,
                bid_amount: data.bid_amount,
                delivery_time_days: data.delivery_days
            }, files);
            if (error) throw error;

            // Deduct connects atomically (fire-and-forget on failure is acceptable)
            if (proposalId) {
                const connectsResult = await spendConnects(user.id, proposalId);
                if (!connectsResult.success) {
                    logger.warn('[Connects] Spend failed after proposal created:', connectsResult.error);
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myProposal', jobId, user?.id] });
            queryClient.invalidateQueries({ queryKey: ['connectsBalance', user?.id] });
            showToast('تم إرسال العرض بنجاح!', 'success');
            setShowProposalModal(false);
            // Notify client by email (fire-and-forget)
            if (job?.client?.email && job.title && jobId) {
                sendNewProposalEmail(
                    job.client.email,
                    job.client.full_name || 'عميل',
                    job.title,
                    jobId,
                );
            }
        },
        onError: (err) => {
            logger.error('Error submitting proposal:', err);
            showToast(err instanceof Error ? err.message : 'حدث خطأ في إرسال العرض', 'error');
        }
    });

    const submitProposal = async (data: ProposalFormData, files: File[]) => {
        submitProposalMutation.mutate({ data, files });
    };

    // Withdraw Proposal Mutation
    const withdrawProposalMutation = useMutation({
        mutationFn: async () => {
            if (!myProposal) throw new Error('No proposal to withdraw');
            const { error } = await proposalsService.withdrawProposal(myProposal.id);
            if (error) throw error;
        },
        onSuccess: () => {
            // Refund connects
            if (user?.id && myProposal?.id) {
                refundConnects(user.id, myProposal.id);
            }
            queryClient.invalidateQueries({ queryKey: ['myProposal', jobId, user?.id] });
            queryClient.invalidateQueries({ queryKey: ['connectsBalance', user?.id] });
            showToast('تم سحب العرض واسترداد الكونيكتس', 'success');
        },
        onError: () => showToast('حدث خطأ في سحب العرض', 'error')
    });

    const withdrawProposal = () => withdrawProposalMutation.mutate();

    // Share
    const shareJob = () => {
        if (navigator.share) {
            navigator.share({
                title: job?.title,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast('تم نسخ الرابط', 'success');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
                <Header />
                <div className="container-custom py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-9 w-3/4" />
                            <div className="flex gap-3">
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-6 w-28 rounded-full" />
                            </div>
                            <Skeleton className="h-48 w-full rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-48 w-full rounded-2xl" />
                            <Skeleton className="h-32 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container-custom py-16 text-center">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">الوظيفة غير موجودة</h2>
                    <Button variant="primary" onClick={() => navigate('/jobs')}>
                        تصفح الوظائف
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
            <SEO
                title={job ? `${job.title} | ${t.seo.jobDetail.titleSuffix}` : t.seo.jobDetail.titleSuffix}
                description={job?.description?.slice(0, 160) || t.seo.jobDetail.descriptionFallback}
            />
            <Header />

            <div className="container-custom py-8">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-muted mb-6">
                    <Link to="/" className="hover:text-primary-600">الرئيسية</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link to="/jobs" className="hover:text-primary-600">الوظائف</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground">{CATEGORY_LABELS[job.category] || job.category}</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content */}
                    <div className="flex-1 space-y-6">
                        {/* Header Card */}
                        <div className="card">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-foreground mb-2">{job.title}</h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            نُشرت {timeAgo(job.posted_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {job.proposals_count} عرض
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-4 h-4" />
                                            {job.views_count} مشاهدة
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={toggleSave}
                                        className={`p-2 rounded-full transition-colors ${isSaved ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                                            }`}
                                    >
                                        <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={shareJob}
                                        className="p-2 rounded-full bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className={`px-4 py-2 rounded-full text-sm font-medium ${job.job_type === 'fixed_price'
                                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                    : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                    }`}>
                                    {job.job_type === 'fixed_price' ? 'سعر ثابت' : 'بالساعة'}
                                </span>
                                <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300">
                                    {EXPERIENCE_LABELS[job.experience_level] || job.experience_level}
                                </span>
                                {job.duration && (
                                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                                        {job.duration}
                                    </span>
                                )}
                            </div>

                            {/* Budget */}
                            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-6">
                                <p className="text-sm text-primary-600 dark:text-primary-400 mb-1">الميزانية</p>
                                <p className="text-3xl font-bold text-primary-700 dark:text-primary-300">
                                    {job.job_type === 'fixed_price' ? (
                                        job.budget_min === job.budget_max || !job.budget_max
                                            ? `${job.budget_min} د.ت`
                                            : `${job.budget_min} - ${job.budget_max} د.ت`
                                    ) : (
                                        <>
                                            {job.hourly_rate} د.ت<span className="text-lg font-normal">/ساعة</span>
                                            {job.estimated_hours && (
                                                <span className="text-sm font-normal text-primary-600 block mt-1">
                                                    ({job.estimated_hours} ساعة تقريباً)
                                                </span>
                                            )}
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="card">
                            <h2 className="text-lg font-bold mb-4">وصف المشروع</h2>
                            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="card">
                            <h2 className="text-lg font-bold mb-4">المهارات المطلوبة</h2>
                            <div className="flex flex-wrap gap-2">
                                {job.required_skills?.map((skill, index) => {
                                    const isMatch = freelancerProfile?.skills?.some(
                                        s => ('name_ar' in s) ? (s.name_ar === skill || s.name_en === skill) : s.name === skill
                                    );
                                    return (
                                        <span
                                            key={index}
                                            className={`px-3 py-1.5 rounded-lg text-sm ${isMatch
                                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                                : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            {isMatch && <CheckCircle className="w-3 h-3 inline me-1" />}
                                            {skill}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Attachments */}
                        {job.attachments && job.attachments.length > 0 && (
                            <div className="card">
                                <h2 className="text-lg font-bold mb-4">الملفات المرفقة</h2>
                                <div className="space-y-2">
                                    {job.attachments.map((url, index) => {
                                        const filename = url.split('/').pop() || `ملف ${index + 1}`;
                                        return (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-primary-600" />
                                                    <span className="text-sm">{filename}</span>
                                                </div>
                                                <Download className="w-4 h-4 text-muted" />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Similar Jobs */}
                        {similarJobs.length > 0 && (
                            <div className="card">
                                <h2 className="text-lg font-bold mb-4">وظائف مشابهة</h2>
                                <div className="grid gap-3">
                                    {similarJobs.map(j => (
                                        <SimilarJobCard
                                            key={j.id}
                                            job={j}
                                            onClick={() => navigate(`/jobs/${j.id}`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:w-80 space-y-4">
                        {/* Action Card */}
                        <div className="card sticky top-4">
                            {myProposal ? (
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">تم تقديم عرضك</h3>
                                    <p className="text-sm text-muted mb-4">
                                        عرضك: {myProposal.bid_amount} د.ت
                                    </p>
                                    <div className="space-y-2">
                                        <Button variant="outline" className="w-full">
                                            عرض عرضي
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full text-red-500 hover:bg-red-50"
                                            onClick={withdrawProposal}
                                        >
                                            سحب العرض
                                        </Button>
                                    </div>
                                </div>
                            ) : user?.id === job.client_id ? (
                                <div className="text-center">
                                    <p className="text-muted">هذه وظيفتك</p>
                                    <Button
                                        variant="primary"
                                        className="w-full mt-3"
                                        onClick={() => navigate(`/client/jobs/${job.id}`)}
                                    >
                                        إدارة الوظيفة
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full"
                                        onClick={() => setShowProposalModal(true)}
                                        rightIcon={<Send className="w-5 h-5" />}
                                        disabled={!!freelancerProfile && connectsAvailable < CONNECTS_COST}
                                    >
                                        أرسل عرض
                                    </Button>
                                    {/* Connects balance indicator */}
                                    {freelancerProfile && (
                                        <div className={`mt-2 flex items-center justify-between text-xs rounded-lg px-3 py-2 ${
                                            connectsAvailable >= CONNECTS_COST
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                        }`}>
                                            <span>رصيد الكونيكتس</span>
                                            <span className="font-bold">
                                                {connectsAvailable} / يحتاج {CONNECTS_COST}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Client Info */}
                        <div className="card">
                            <h3 className="font-bold mb-4">عن العميل</h3>
                            <div className="flex items-center gap-3 mb-4">
                                {job.client?.avatar_url ? (
                                    <OptimizedImage
                                        src={job.client.avatar_url}
                                        alt={job.client.full_name}
                                        className="w-12 h-12 rounded-full"
                                        imgClassName="object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                        <User className="w-6 h-6 text-gray-500" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold">{job.client?.full_name || 'عميل'}</p>
                                    {job.client?.location && (
                                        <p className="text-sm text-muted flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {job.client.location}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted">عضو منذ</span>
                                    <span>{job.client?.created_at ? formatDate(job.client.created_at) : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">الوظائف المنشورة</span>
                                    <span>{clientStats.totalJobs}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">إجمالي الإنفاق</span>
                                    <span>{clientStats.totalSpent.toLocaleString()} د.ت</span>
                                </div>
                                {clientStats.rating > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted">التقييم</span>
                                        <span className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            {clientStats.rating.toFixed(1)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <Link
                                to={`/profile/${job.client_id}`}
                                className="block w-full text-center text-primary-600 text-sm mt-4 hover:underline"
                            >
                                عرض الملف الشخصي
                            </Link>
                        </div>

                        {/* Job Stats */}
                        <div className="card">
                            <h3 className="font-bold mb-4">إحصائيات الوظيفة</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted">العروض</span>
                                    <span className="font-medium">{job.proposals_count}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">المشاهدات</span>
                                    <span className="font-medium">{job.views_count}</span>
                                </div>
                                {job.deadline && (
                                    <div className="flex justify-between">
                                        <span className="text-muted">الموعد النهائي</span>
                                        <span className="font-medium">
                                            {new Date(job.deadline).toLocaleDateString('ar-TN')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Report */}
                        <button className="w-full text-center text-sm text-muted hover:text-red-500 flex items-center justify-center gap-1">
                            <Flag className="w-4 h-4" />
                            الإبلاغ عن هذه الوظيفة
                        </button>
                    </div>
                </div>
            </div>

            <Footer />

            {job && (
                <ProposalModal
                    isOpen={showProposalModal}
                    onClose={() => setShowProposalModal(false)}
                    job={job}
                    onSubmit={submitProposal}
                    isSubmitting={submitProposalMutation.isPending}
                />
            )}
        </div>
    );
}

export default JobDetail;
