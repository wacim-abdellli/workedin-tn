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
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import SEO from '../components/common/SEO';
import { Skeleton } from '../components/common/SkeletonCard';
import { useTranslation } from '../i18n';
import { cn } from '../lib/utils';
import type { Skill } from '../types';

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
    required_skills: Array<string | Skill>;
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

type SimilarJob = Pick<Job, 'id' | 'title' | 'job_type' | 'budget_min' | 'budget_max' | 'hourly_rate' | 'posted_at'> & {
    location?: string;
    required_skills?: string[];
};



// Helper functions (Restored)
function timeAgo(date: string, tx: any): string {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return tx('jobDetail.timeAgo.minutes', { count: diffMins }, `منذ ${diffMins} دقيقة`);
    if (diffHours < 24) return tx('jobDetail.timeAgo.hours', { count: diffHours }, `منذ ${diffHours} ساعة`);
    if (diffDays < 7) return tx('jobDetail.timeAgo.days', { count: diffDays }, `منذ ${diffDays} يوم`);
    if (diffDays < 30) return tx('jobDetail.timeAgo.weeks', { count: Math.floor(diffDays / 7) }, `منذ ${Math.floor(diffDays / 7)} أسبوع`);
    return tx('jobDetail.timeAgo.months', { count: Math.floor(diffDays / 30) }, `منذ ${Math.floor(diffDays / 30)} شهر`);
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('ar-TN', {
        year: 'numeric',
        month: 'long',
    });
}

const EXPERIENCE_LABELS: Record<string, string> = {
    beginner: 'beginner',
    intermediate: 'intermediate',
    expert: 'expert',
};

const CATEGORY_LABELS: Record<string, string> = {
    design: 'design',
    development: 'development',
    writing: 'writing',
    translation: 'translation',
    video: 'video',
    marketing: 'marketing',
    data: 'data',
    other: 'other',
};

// Main Component
function JobDetail() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { t, language, tx } = useTranslation();
    const { user, freelancerProfile } = useAuth();
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const [showProposalModal, setShowProposalModal] = useState(false);

    const getSkillLabel = (skill: string | Skill) => {
        if (typeof skill === 'string') {
            return skill;
        }

        return language === 'ar'
            ? skill.name_ar
            : language === 'fr'
                ? skill.name_fr
                : skill.name_en;
    };

    // Job Fetch
    const { data: job, isLoading } = useQuery({
        queryKey: ['job', jobId],
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
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
    const { data: similarJobs = [] } = useQuery<SimilarJob[]>({
        queryKey: ['similarJobs', job?.category],
        queryFn: async () => {
            if (!job) return [];
            const { data } = await jobsService.getSimilarJobs(job.id, job.category);
            return ((data as Job[]) || []).map((similarJob) => ({
                ...similarJob,
                required_skills: (similarJob.required_skills || []).map((skill) => getSkillLabel(skill)),
            }));
        },
        enabled: !!job,
    });

    // Client Stats
    const { data: clientStats = { totalJobs: 0, totalSpent: 0, rating: 0 } } = useQuery({
        queryKey: ['clientStats', job?.client_id],
        staleTime: 60 * 60 * 1000,
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
    const connectsRemainingAfterSubmit = Math.max(connectsAvailable - CONNECTS_COST, 0);

    // Toggle Save Mutation
    const toggleSaveMutation = useMutation({
        mutationFn: async () => {
            await profilesService.toggleFavorite(user!.id, jobId!, isSaved);
            return !isSaved;
        },
        onSuccess: (newSavedStatus) => {
            queryClient.setQueryData(['savedStatus', jobId, user?.id], newSavedStatus);
            showToast(newSavedStatus ? t.jobDetail.jobSaved : t.jobDetail.jobRemoved, 'success');
        },
        onError: () => showToast(t.jobDetail.error, 'error')
    });

    const toggleSave = () => {
        if (!user || !jobId) {
            showToast(t.jobDetail.loginToSave, 'warning');
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
            showToast(t.jobDetail.proposalSent, 'success');
            setShowProposalModal(false);
            // Notify client by email (fire-and-forget)
            if (job?.client?.email && job.title && jobId) {
                sendNewProposalEmail(
                    job.client.email,
                    job.client.full_name || t.jobDetail.defaultClient,
                    job.title,
                    jobId,
                );
            }
        },
        onError: (err) => {
            logger.error('Error submitting proposal:', err);
            showToast(err instanceof Error ? err.message : t.jobDetail.proposalError, 'error');
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
            showToast(t.jobDetail.proposalWithdrawn, 'success');
        },
        onError: () => showToast(t.jobDetail.withdrawError, 'error')
    });

    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    const withdrawProposal = () => setIsWithdrawModalOpen(true);

    const confirmWithdrawProposal = () => {
        withdrawProposalMutation.mutate(undefined, {
            onSettled: () => setIsWithdrawModalOpen(false)
        });
    };

    // Share
    const shareJob = () => {
        if (navigator.share) {
            navigator.share({
                title: job?.title,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast(t.jobDetail.linkCopied, 'success');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
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
                    <Briefcase className="w-16 h-16 text-muted mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">الوظيفة غير موجودة</h2>
                    <Button variant="primary" onClick={() => navigate('/jobs')}>
                        تصفح الوظائف
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-enter min-h-screen bg-background transition-colors duration-300">
            <SEO
                title={job ? `${job.title} | ${t.seo.jobDetail.titleSuffix}` : t.seo.jobDetail.titleSuffix}
                description={job?.description?.slice(0, 160) || t.seo.jobDetail.descriptionFallback}
            />
            <Header />

            <div className="container-custom py-8">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-muted mb-6">
                    <Link to="/" className="hover:text-primary-600">{t.nav.home}</Link>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    <Link to="/jobs" className="hover:text-primary-600">{t.nav.jobs}</Link>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    <span className="text-foreground">{t.jobDetail.category[CATEGORY_LABELS[job.category] as keyof typeof t.jobDetail.category] || job.category}</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content */}
                    <div className="flex-1 space-y-6">
                        {/* Header Card */}
                        <div className={cn(
                            'rounded-lg p-6 border',
                            'bg-card',
                            'border-border',
                            'shadow-sm dark:shadow-none'
                        )}>
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex-1">
                                    <h1 className={cn(
                                        'mb-3 text-2xl font-bold text-foreground',
                                        'break-words [overflow-wrap:anywhere]'
                                    )}>{job.title}</h1>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {tx('jobDetail.postedLabel', undefined, 'نُشرت')} {timeAgo(job.posted_at, tx)}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            {job.proposals_count} {tx('jobDetail.proposalsCountLabel', undefined, 'عرض')}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Eye className="w-3.5 h-3.5" />
                                            {job.views_count} {tx('jobDetail.viewsCountLabel', undefined, 'مشاهدة')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={toggleSave}
                                        className={cn(
                                            'p-2.5 rounded-lg transition-all',
                                            isSaved
                                                ? 'bg-red-50 dark:bg-red-500/15 text-red-500'
                                                : 'bg-secondary text-muted-foreground hover:text-red-500'
                                        )}
                                        title={isSaved ? tx('jobDetail.removeFromSaves', undefined, 'Remove from saves') : tx('jobDetail.saveJob', undefined, 'Save this job')}
                                    >
                                        <Heart className={cn('w-5 h-5', isSaved && 'fill-current')} />
                                    </button>
                                    <button
                                        onClick={shareJob}
                                        className={cn(
                                            'p-2.5 rounded-lg transition-colors',
                                            'bg-secondary text-muted-foreground hover:text-[color:var(--workspace-primary)]'
                                        )}
                                        title={tx('jobDetail.shareJob', undefined, 'Share this job')}
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Info Chips */}
                            <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-border">
                                <span className={cn(
                                    'inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold',
                                    job.job_type === 'fixed_price'
                                        ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                        : 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-300'
                                )}>
                                    {job.job_type === 'fixed_price' ? t.jobDetail.fixedPrice : t.jobDetail.hourly}
                                </span>
                                <span className={cn(
                                    'inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold',
                                    'bg-secondary text-foreground'
                                )}>
                                    {t.jobDetail.experience[EXPERIENCE_LABELS[job.experience_level] as keyof typeof t.jobDetail.experience] || job.experience_level}
                                </span>
                                {job.duration && (
                                    <span className={cn(
                                        'inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold',
                                        'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300'
                                    )}>
                                        {job.duration}
                                    </span>
                                )}
                            </div>

                            {/* Budget Highlight */}
                            <div className={cn(
                                'rounded-lg p-5 border-l-4',
                                'bg-[color:var(--workspace-primary-light)]/40 dark:bg-[color:var(--workspace-primary)]/8',
                                'border-l-[color:var(--workspace-primary)]'
                            )}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                    {t.jobDetail.budget}
                                </p>
                                <p className="text-2xl font-bold text-foreground">
                                            {job.job_type === 'fixed_price' ? (
                                        job.budget_min === job.budget_max || !job.budget_max
                                            ? `${job.budget_min} ${tx('common.currency', undefined, 'د.ت')}`
                                            : `${job.budget_min} - ${job.budget_max} ${tx('common.currency', undefined, 'د.ت')}`
                                    ) : (
                                        <>
                                            {job.hourly_rate} {tx('common.currency', undefined, 'د.ت')}<span className="text-sm font-normal">{t.jobDetail.perHour}</span>
                                            {job.estimated_hours && (
                                                <span className="text-xs font-normal text-muted-foreground block mt-1">
                                                    {t.jobDetail.approxHours.replace('{{count}}', String(job.estimated_hours))}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                         <div className={cn(
                             'rounded-lg p-6 border',
                             'bg-card',
                             'border-border',
                             'shadow-sm dark:shadow-none'
                         )}>
                             <h2 className="text-lg font-semibold mb-4 text-foreground">{t.jobDetail.description}</h2>
                             <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                 {job.description}
                             </div>
                         </div>

                        {/* Skills */}
                         <div className={cn(
                             'rounded-lg p-6 border',
                             'bg-card',
                             'border-border',
                             'shadow-sm dark:shadow-none'
                         )}>
                             <h2 className="text-lg font-semibold mb-4 text-foreground">{t.jobDetail.requiredSkills}</h2>
                             <div className="flex flex-wrap gap-2">
                                 {job.required_skills?.map((skill, index) => {
                                     const skillLabel = getSkillLabel(skill);
                                     const isMatch = freelancerProfile?.skills?.some(
                                         s => ('name_ar' in s) ? (s.name_ar === skillLabel || s.name_en === skillLabel || s.name_fr === skillLabel) : s.name === skillLabel
                                     );
                                     return (
                                         <span
                                             key={index}
                                             className={cn(
                                                 'break-words [overflow-wrap:anywhere] px-3 py-1.5 rounded-lg text-sm font-medium border',
                                                 isMatch
                                                     ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30'
                                                     : 'bg-gray-50 dark:bg-white/5 text-foreground border-gray-200 dark:border-white/10'
                                             )}
                                         >
                                             {isMatch && <CheckCircle className="w-3 h-3 inline me-1" />}
                                             {skillLabel}
                                         </span>
                                     );
                                 })}
                             </div>
                         </div>

                        {/* Attachments */}
                         {job.attachments && job.attachments.length > 0 && (
                             <div className={cn(
                                 'rounded-lg p-6 border',
                                 'bg-card',
                                 'border-border',
                                 'shadow-sm dark:shadow-none'
                             )}>
                                 <h2 className="text-lg font-semibold mb-4 text-foreground">{t.jobDetail.attachments}</h2>
                                 <div className="space-y-2">
                                     {job.attachments.map((url, index) => {
                                         const filename = url.split('/').pop() || t.jobDetail.file.replace('{{index}}', String(index + 1));
                                         return (
                                             <a
                                                 key={index}
                                                 href={url}
                                                 target="_blank"
                                                 rel="noopener noreferrer"
                                                 className={cn(
                                                     'flex items-center justify-between p-3 rounded-lg border',
                                                     'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10',
                                                     'hover:bg-gray-100 dark:hover:bg-white/8 transition-colors'
                                                 )}
                                             >
                                                 <div className="flex items-center gap-3">
                                                     <FileText className="w-5 h-5 text-[color:var(--workspace-primary)]" />
                                                     <span className="text-sm text-foreground">{filename}</span>
                                                 </div>
                                                 <Download className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                                             </a>
                                         );
                                     })}
                                 </div>
                             </div>
                         )}

                        {/* Similar Jobs */}
                         {similarJobs.length > 0 && (
                             <div className={cn(
                                 'rounded-lg p-6 border',
                                 'bg-card',
                                 'border-border',
                                 'shadow-sm dark:shadow-none'
                             )}>
                                 <h2 className="text-lg font-semibold mb-4 text-foreground">{tx('jobDetail.similarJobs', undefined, 'وظائف مشابهة')}</h2>
                                 <div className="grid gap-3 md:grid-cols-2">
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
                    <div className="lg:w-80 space-y-4 lg:sticky lg:top-24 lg:self-start">
                        {/* Action Card */}
                         <div className={cn(
                             'rounded-lg p-6 border',
                             'bg-card',
                             'border-border',
                             'shadow-sm dark:shadow-none',
                             'space-y-4'
                         )}>
                             {myProposal ? (
                                 <div className="text-center">
                                     <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center mx-auto mb-3">
                                         <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                     </div>
                                     <h3 className="font-semibold text-base text-foreground mb-1">{tx('jobDetail.proposalSubmitted', undefined, 'تم تقديم عرضك')}</h3>
                                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                         {tx('jobDetail.yourBid', undefined, 'عرضك:')} {myProposal.bid_amount} {tx('common.currency', undefined, 'د.ت')}
                                     </p>
                                     <div className="space-y-2">
                                         <Button variant="outline" className="w-full">
                                             {tx('jobDetail.viewProposal', undefined, 'عرض عرضي')}
                                         </Button>
                                         <Button
                                             variant="ghost"
                                             className="w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                             onClick={withdrawProposal}
                                         >
                                             {tx('jobDetail.withdrawProposal', undefined, 'سحب العرض')}
                                         </Button>
                                     </div>
                                 </div>
                             ) : user?.id === job.client_id ? (
                                 <div className="text-center">
                                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{tx('jobDetail.yourJob', undefined, 'هذه وظيفتك')}</p>
                                     <Button
                                         variant="primary"
                                         className="w-full"
                                         onClick={() => navigate(`/client/jobs/${job.id}`)}
                                     >
                                         {tx('jobDetail.manageJob', undefined, 'إدارة الوظيفة')}
                                     </Button>
                                 </div>
                             ) : (
                                 <div className="space-y-4">
                                     <Button
                                         variant="primary"
                                         size="lg"
                                         className="w-full"
                                         onClick={() => setShowProposalModal(true)}
                                         rightIcon={<Send className="w-5 h-5" />}
                                         disabled={!!freelancerProfile && connectsAvailable < CONNECTS_COST}
                                     >
                                         {tx('jobDetail.sendProposal', undefined, 'أرسل عرض')}
                                     </Button>

                                     {freelancerProfile && (
                                         <div className={cn(
                                             'rounded-lg border p-4',
                                             connectsAvailable >= CONNECTS_COST
                                                 ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10'
                                                 : 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10'
                                         )}>
                                             <div className={cn(
                                                 'flex items-center justify-between gap-4',
                                                 connectsAvailable >= CONNECTS_COST
                                                     ? 'text-blue-900 dark:text-blue-200'
                                                     : 'text-red-900 dark:text-red-200'
                                             )}>
                                                 <div>
                                                     <p className="text-sm font-semibold">متطلبات التقديم</p>
                                                     <p className="mt-1 text-xs opacity-80">يحتاج هذا العرض إلى كونيكتس قبل الإرسال.</p>
                                                 </div>
                                                 <span className={cn(
                                                     'rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap',
                                                     connectsAvailable >= CONNECTS_COST
                                                         ? 'bg-white/70 dark:bg-white/10 text-blue-700 dark:text-blue-300'
                                                         : 'bg-white/70 dark:bg-white/10 text-red-700 dark:text-red-300'
                                                 )}>
                                                     {connectsAvailable >= CONNECTS_COST ? 'جاهز للتقديم' : 'الرصيد غير كافٍ'}
                                                 </span>
                                             </div>

                                             <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                                                 <div className={cn(
                                                     'rounded-lg p-3 border',
                                                     connectsAvailable >= CONNECTS_COST
                                                         ? 'border-blue-200 dark:border-blue-500/30 bg-white/70 dark:bg-white/5'
                                                         : 'border-red-200 dark:border-red-500/30 bg-white/70 dark:bg-white/5'
                                                 )}>
                                                     <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">الرصيد</p>
                                                     <p className="mt-2 text-lg font-bold">{connectsAvailable}</p>
                                                 </div>
                                                 <div className={cn(
                                                     'rounded-lg p-3 border',
                                                     connectsAvailable >= CONNECTS_COST
                                                         ? 'border-blue-200 dark:border-blue-500/30 bg-white/70 dark:bg-white/5'
                                                         : 'border-red-200 dark:border-red-500/30 bg-white/70 dark:bg-white/5'
                                                 )}>
                                                     <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">المطلوب</p>
                                                     <p className="mt-2 text-lg font-bold">{CONNECTS_COST}</p>
                                                 </div>
                                                 <div className={cn(
                                                     'rounded-lg p-3 border',
                                                     connectsAvailable >= CONNECTS_COST
                                                         ? 'border-blue-200 dark:border-blue-500/30 bg-white/70 dark:bg-white/5'
                                                         : 'border-red-200 dark:border-red-500/30 bg-white/70 dark:bg-white/5'
                                                 )}>
                                                     <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">المتبقي</p>
                                                     <p className="mt-2 text-lg font-bold">{connectsRemainingAfterSubmit}</p>
                                                 </div>
                                             </div>

                                             <p className="mt-3 text-xs leading-6 opacity-80">
                                                 {connectsAvailable >= CONNECTS_COST
                                                     ? 'سيتم خصم 2 كونيكتس مباشرة بعد إرسال العرض.'
                                                     : `تحتاج إلى ${CONNECTS_COST - connectsAvailable} كونيكتس إضافية قبل إرسال هذا العرض.`}
                                             </p>
                                         </div>
                                     )}
                                 </div>
                             )}
                         </div>

                        {/* Client Info */}
                         <div className={cn(
                             'rounded-lg p-6 border',
                             'bg-card',
                             'border-border',
                             'shadow-sm dark:shadow-none'
                         )}>
                             <h3 className="font-semibold text-base text-foreground mb-4">{tx('jobDetail.aboutClient', undefined, 'عن العميل')}</h3>
                             <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
                                 {job.client?.avatar_url ? (
                                     <OptimizedImage
                                         src={job.client.avatar_url}
                                         alt={job.client.full_name}
                                         className="w-12 h-12 rounded-lg"
                                         imgClassName="object-cover"
                                     />
                                 ) : (
                                     <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                         <User className="w-6 h-6 text-muted-foreground" />
                                     </div>
                                 )}
                                 <div>
                                     <p className="font-semibold text-foreground">{job.client?.full_name || t.jobDetail.defaultClient}</p>
                                     {job.client?.location && (
                                         <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                                             <MapPin className="w-3 h-3" />
                                             {job.client.location}
                                         </p>
                                     )}
                                 </div>
                             </div>

                             <div className="space-y-3 text-sm mb-5">
                                 <div className="flex justify-between">
                                     <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">عضو منذ</span>
                                     <span className="font-medium text-foreground">{job.client?.created_at ? formatDate(job.client.created_at) : '-'}</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">الوظائف المنشورة</span>
                                     <span className="font-medium text-foreground">{clientStats.totalJobs}</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">إجمالي الإنفاق</span>
                                     <span className="font-medium text-foreground">{clientStats.totalSpent.toLocaleString()} د.ت</span>
                                 </div>
                                 {clientStats.rating > 0 && (
                                     <div className="flex justify-between items-center pt-2 border-t border-border">
                                         <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">التقييم</span>
                                         <span className="flex items-center gap-1.5 font-medium">
                                             <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                             <span className="text-foreground">{clientStats.rating.toFixed(1)}</span>
                                         </span>
                                     </div>
                                 )}
                             </div>

                             <Link
                                 to={`/profile/${job.client_id}`}
                                 className={cn(
                                     'block w-full text-center px-4 py-2.5 rounded-lg border transition-colors',
                                     'text-[color:var(--workspace-primary)] border-[color:var(--workspace-primary)]/20',
                                     'hover:bg-[color:var(--workspace-primary)]/5 text-sm font-medium'
                                 )}
                             >
                                 عرض الملف الشخصي
                             </Link>
                         </div>

                        {/* Job Stats */}
                         <div className={cn(
                             'rounded-lg p-6 border',
                             'bg-card',
                             'border-border',
                             'shadow-sm dark:shadow-none'
                         )}>
                             <h3 className="font-semibold text-base text-foreground mb-4">{tx('jobDetail.jobStats', undefined, 'إحصائيات الوظيفة')}</h3>
                             <div className="space-y-3 text-sm">
                                 <div className="flex justify-between pb-3 border-b border-border">
                                     <span className="text-gray-600 dark:text-gray-400 font-medium">العروض</span>
                                     <span className="font-semibold text-foreground">{job.proposals_count}</span>
                                 </div>
                                 <div className="flex justify-between pb-3 border-b border-border">
                                     <span className="text-gray-600 dark:text-gray-400 font-medium">المشاهدات</span>
                                     <span className="font-semibold text-foreground">{job.views_count}</span>
                                 </div>
                                 {job.deadline && (
                                     <div className="flex justify-between">
                                         <span className="text-gray-600 dark:text-gray-400 font-medium">الموعد النهائي</span>
                                         <span className="font-semibold text-foreground">
                                             {new Date(job.deadline).toLocaleDateString('ar-TN')}
                                         </span>
                                     </div>
                                 )}
                             </div>
                         </div>

                        {/* Report */}
                         <button className="w-full text-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center gap-1.5 py-2 transition-colors">
                             <Flag className="w-4 h-4" />
                             الإبلاغ عن هذه الوظيفة
                         </button>
                    </div>
                </div>
            </div>

            {!user ? <Footer /> : null}

            {job && (
                <ProposalModal
                    isOpen={showProposalModal}
                    onClose={() => setShowProposalModal(false)}
                    job={job}
                    onSubmit={submitProposal}
                    isSubmitting={submitProposalMutation.isPending}
                />
            )}

            <Modal
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                title={tx('jobDetail.confirmWithdrawal', undefined, 'Confirm Withdrawal')}
                size="md"
            >
                <div className="space-y-6 pt-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        {tx('jobDetail.withdrawConfirmDesc', undefined, 'Are you sure you want to withdraw this proposal? This action cannot be undone.')}
                    </p>
                    <div className="flex gap-3 justify-end pr-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsWithdrawModalOpen(false)}
                        >
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmWithdrawProposal}
                            isLoading={withdrawProposalMutation.isPending}
                        >
                            {tx('jobDetail.yesWithdraw', undefined, 'Yes, Withdraw Proposal')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default JobDetail;

