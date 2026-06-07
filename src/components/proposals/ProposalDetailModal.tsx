import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare, Star, Bookmark, MapPin, Clock, Briefcase,
    Archive, CheckCircle, Loader2, User,
    DollarSign, TrendingUp, Shield, FileText, Download,
    ChevronDown, X,
} from 'lucide-react';
import type { ProposalAttachment } from '../../types/proposal';
import { useTranslation } from '../../i18n';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface ProposalDetailFreelancer {
    full_name: string;
    title: string;
    avatar_url: string | null;
    country: string;
    rating: number;
    reviews_count: number;
    jobs_completed: number;
    success_rate: number;
    is_online: boolean;
    availability?: string;
    bio: string;
}

interface ProposalDetailData {
    id: string;
    freelancer_id?: string;
    created_at: string;
    status: string;
    cover_letter: string;
    attachments: ProposalAttachment[];
    bid_amount: number;
    duration: number;
    freelancer: ProposalDetailFreelancer;
}

interface PortfolioPreviewItem {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string | null;
    project_url: string | null;
    completion_date: string | null;
}

interface ReviewPreviewItem {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    reviewer_name: string;
    reviewer_avatar_url: string | null;
}

interface ProposalDetailPaneProps {
    proposal: ProposalDetailData | null;
    isHiring?: boolean;
    onClose: () => void;
    onMessage: () => void;
    onShortlist: () => void;
    onReject: () => void;
    onHire: () => void;
    onArchive: () => void;
    onUnarchive: () => void;
    isShortlisted?: boolean;
}

const SERVICE_FEE_RATE = 0.05;

function Avatar({ name, url, online, size = 'lg' }: { name: string; url: string | null; online: boolean; size?: 'sm' | 'md' | 'lg' }) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const s = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-xs';
    const dot = size === 'lg' ? 'w-3.5 h-3.5 border-2 bottom-0 right-0' : 'w-2.5 h-2.5 border-2 bottom-0 right-0';
    return (
        <div className="relative shrink-0">
            {url ? (
                <img src={url} alt={name} className={`${s} rounded-2xl object-cover border-2 border-white/10`} />
            ) : (
                <div className={`${s} rounded-2xl flex items-center justify-center font-black bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 text-amber-400`}>
                    {initials || <User className="w-4 h-4" />}
                </div>
            )}
            {online && (
                <span className={`absolute ${dot} rounded-full bg-emerald-500 border-[#0a0a0a]`} />
            )}
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const s = status === 'pending' ? 'new' : status;
    const map: Record<string, { label: string; color: string; bg: string }> = {
        new: { label: 'New', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        shortlisted: { label: 'Shortlisted', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        archived: { label: 'Archived', color: 'text-slate-400', bg: 'bg-white/5' },
        accepted: { label: 'Accepted', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        rejected: { label: 'Declined', color: 'text-rose-400', bg: 'bg-rose-500/10' },
    };
    const b = map[s] ?? { label: s, color: 'text-slate-400', bg: 'bg-white/5' };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${b.bg} ${b.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-current opacity-80`} />
            {b.label}
        </span>
    );
}

const TABS = ['proposal', 'profile', 'portfolio', 'reviews'] as const;
type Tab = typeof TABS[number];

export default function ProposalDetailPane({
    proposal,
    isHiring = false,
    onClose,
    onMessage,
    onShortlist,
    onReject,
    onHire,
    onArchive,
    onUnarchive,
    isShortlisted = false,
}: ProposalDetailPaneProps) {
    const { tx } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('proposal');
    const [hireConfirm, setHireConfirm] = useState(false);
    const [rejectConfirm, setRejectConfirm] = useState(false);
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [resolvedBio, setResolvedBio] = useState('');
    const [resolvedRating, setResolvedRating] = useState(0);
    const [resolvedReviewCount, setResolvedReviewCount] = useState(0);
    const [resolvedJobsCompleted, setResolvedJobsCompleted] = useState(0);
    const [resolvedSuccessRate, setResolvedSuccessRate] = useState(0);
    const [portfolioItems, setPortfolioItems] = useState<PortfolioPreviewItem[]>([]);
    const [reviewItems, setReviewItems] = useState<ReviewPreviewItem[]>([]);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    useEffect(() => {
        setActiveTab('proposal');
        setHireConfirm(false);
        setRejectConfirm(false);
        setArchiveOpen(false);
    }, [proposal?.id, proposal?.status]);

    useEffect(() => {
        if (!proposal) return;

        const fallbackBio = proposal.freelancer.bio?.trim() || '';
        const fallbackRating = Number(proposal.freelancer.rating || 0);
        const fallbackReviewCount = Number(proposal.freelancer.reviews_count || 0);
        const fallbackJobsCompleted = Number(proposal.freelancer.jobs_completed || 0);
        const fallbackSuccessRate = Number(proposal.freelancer.success_rate || 0);

        setResolvedBio(fallbackBio);
        setResolvedRating(fallbackRating);
        setResolvedReviewCount(fallbackReviewCount);
        setResolvedJobsCompleted(fallbackJobsCompleted);
        setResolvedSuccessRate(fallbackSuccessRate);
        setPortfolioItems([]);
        setReviewItems([]);

        const freelancerId = proposal.freelancer_id;
        if (!freelancerId) {
            setIsLoadingInsights(false);
            return;
        }

        let isCancelled = false;

        const loadInsights = async () => {
            setIsLoadingInsights(true);
            try {
                const [publicProfileRes, freelancerProfileRes, portfolioRes, reviewsRes] = await Promise.all([
                    supabase.from('public_profiles')
                        .select('bio')
                        .eq('id', freelancerId)
                        .maybeSingle(),
                    supabase.from('freelancer_profiles')
                        .select('jobs_completed, success_rate')
                        .eq('id', freelancerId)
                        .maybeSingle(),
                    supabase.from('portfolio_items')
                        .select('id, title, description, thumbnail_url, project_url, completion_date')
                        .eq('freelancer_id', freelancerId)
                        .order('order_index', { ascending: true })
                        .limit(8),
                    supabase.from('reviews')
                        .select('id, reviewer_id, rating, comment, created_at')
                        .eq('reviewee_id', freelancerId)
                        .eq('is_public', true)
                        .order('created_at', { ascending: false })
                        .limit(8),
                ]);

                if (isCancelled) return;

                const reviewsRaw = (reviewsRes.data || []) as Array<Record<string, unknown>>;
                const reviewerIds = Array.from(new Set(
                    reviewsRaw
                        .map((review) => (typeof review.reviewer_id === 'string' ? review.reviewer_id : ''))
                        .filter(Boolean)
                ));

                const reviewerProfilesMap = new Map<string, { full_name: string; avatar_url: string | null }>();
                if (reviewerIds.length > 0) {
                    const reviewerProfilesRes = await supabase
                        .from('public_profiles')
                        .select('id, full_name, avatar_url')
                        .in('id', reviewerIds);

                    for (const profile of (reviewerProfilesRes.data || []) as Array<Record<string, unknown>>) {
                        const id = String(profile.id || '');
                        if (!id) continue;
                        reviewerProfilesMap.set(id, {
                            full_name: typeof profile.full_name === 'string' ? profile.full_name : 'Client',
                            avatar_url: typeof profile.avatar_url === 'string' ? profile.avatar_url : null,
                        });
                    }
                }

                const normalizedReviews: ReviewPreviewItem[] = reviewsRaw.map((review) => {
                    const reviewerId = typeof review.reviewer_id === 'string' ? review.reviewer_id : '';
                    const reviewer = reviewerProfilesMap.get(reviewerId);
                    return {
                        id: String(review.id || ''),
                        rating: Number(review.rating || 0),
                        comment: typeof review.comment === 'string' ? review.comment : '',
                        created_at: typeof review.created_at === 'string' ? review.created_at : new Date().toISOString(),
                        reviewer_name: reviewer?.full_name || 'Client',
                        reviewer_avatar_url: reviewer?.avatar_url || null,
                    };
                }).filter((review) => review.id);

                const avgRating = normalizedReviews.length > 0
                    ? normalizedReviews.reduce((sum, review) => sum + review.rating, 0) / normalizedReviews.length
                    : 0;

                const normalizedPortfolio: PortfolioPreviewItem[] = ((portfolioRes.data || []) as Array<Record<string, unknown>>)
                    .map((item) => ({
                        id: String(item.id || ''),
                        title: typeof item.title === 'string' ? item.title : 'Untitled project',
                        description: typeof item.description === 'string' ? item.description : '',
                        thumbnail_url: typeof item.thumbnail_url === 'string' ? item.thumbnail_url : null,
                        project_url: typeof item.project_url === 'string' ? item.project_url : null,
                        completion_date: typeof item.completion_date === 'string' ? item.completion_date : null,
                    }))
                    .filter((item) => item.id);

                setPortfolioItems(normalizedPortfolio);
                setReviewItems(normalizedReviews);

                setResolvedBio(
                    fallbackBio
                    || (typeof publicProfileRes.data?.bio === 'string' ? publicProfileRes.data.bio.trim() : '')
                );

                const jobsCompleted = Number(freelancerProfileRes.data?.jobs_completed || 0);
                const successRate = Number(freelancerProfileRes.data?.success_rate || 0);
                setResolvedJobsCompleted(fallbackJobsCompleted || jobsCompleted);
                setResolvedSuccessRate(fallbackSuccessRate || successRate);
                setResolvedRating(fallbackRating > 0 ? fallbackRating : Number(avgRating.toFixed(1)));
                setResolvedReviewCount(fallbackReviewCount > 0 ? fallbackReviewCount : normalizedReviews.length);
            } catch (error) {
                logger.warn('Failed to load proposal detail insights', error);
            } finally {
                if (!isCancelled) {
                    setIsLoadingInsights(false);
                }
            }
        };

        void loadInsights();

        return () => {
            isCancelled = true;
        };
    }, [proposal]);

    if (!proposal) return null;

    const { freelancer } = proposal;
    const isArchived = proposal.status === 'archived';
    const normalizedStatus = String(proposal.status || '').toLowerCase();
    const canHire = ['new', 'pending', 'shortlisted'].includes(normalizedStatus);
    const canReject = !isArchived
        && proposal.status !== 'accepted'
        && proposal.status !== 'hired'
        && proposal.status !== 'rejected';
    const fee = Math.round(proposal.bid_amount * SERVICE_FEE_RATE);
    const total = proposal.bid_amount + fee;

    const tabLabels: Record<Tab, string> = {
        proposal: tx('jobProposals.modal.tabProposal', undefined, 'Proposal'),
        profile: tx('jobProposals.modal.tabProfile', undefined, 'Profile'),
        portfolio: tx('jobProposals.modal.tabPortfolio', undefined, 'Portfolio'),
        reviews: tx('jobProposals.modal.tabReviews', undefined, 'Reviews'),
    };

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden relative shadow-2xl bg-[var(--color-bg-base)]">
            
            {/* ── COMPACT TOP HEADER ── */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0 z-20 bg-[var(--color-bg-base)]">
                <div className="flex items-center gap-3">
                    <div className="cursor-pointer transition-opacity hover:opacity-80" onClick={() => navigate(`/freelancer/${proposal.freelancer_id}`)}>
                        <Avatar name={freelancer.full_name} url={freelancer.avatar_url} online={freelancer.is_online} size="sm" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 
                                onClick={() => navigate(`/freelancer/${proposal.freelancer_id}`)}
                                className="text-sm font-bold truncate text-[var(--color-text-primary)] cursor-pointer hover:text-amber-400 transition-colors"
                            >
                                {freelancer.full_name}
                            </h2>
                            <StatusPill status={proposal.status} />
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/5 text-[var(--color-text-primary)]/50">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* ── MAIN SCROLLABLE ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative" style={{ minWidth: 0 }}>
                
                {/* HERO INFO (Scrolls with page) */}
                <div className="relative px-5 pt-6 pb-6 lg:pt-8 lg:pb-8 overflow-hidden border-b border-white/5 bg-gradient-to-b from-amber-500/5 to-transparent">
                    <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] opacity-20 bg-amber-500" />
                         
                    <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6 z-10 w-full">
                        {/* Left: Info */}
                        <div className="flex-1 min-w-0 w-full">
                            <h1 className="text-2xl sm:text-3xl font-black mb-3 leading-tight text-[var(--color-text-primary)]">
                                {freelancer.title || 'Freelancer'}
                            </h1>
                            <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-[var(--color-text-primary)]/70">
                                {freelancer.country && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 opacity-70" /> {freelancer.country}
                                    </span>
                                )}
                                {resolvedRating > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                        <strong className="text-[var(--color-text-primary)]">{resolvedRating.toFixed(1)}</strong>
                                        <span className="opacity-70">({resolvedReviewCount})</span>
                                    </span>
                                )}
                                {resolvedJobsCompleted > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4 opacity-70" />
                                        <strong className="text-[var(--color-text-primary)]">{resolvedJobsCompleted}</strong> <span className="opacity-70">jobs</span>
                                    </span>
                                )}
                                {resolvedSuccessRate > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4 opacity-70" />
                                        <strong className="text-[var(--color-text-primary)]">{resolvedSuccessRate}%</strong> <span className="opacity-70">success</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right: Bid Strip */}
                        <div className="shrink-0 rounded-2xl border border-amber-500/20 px-6 py-5 shadow-lg w-full xl:w-auto min-w-[240px] bg-[var(--color-bg-elevated)] backdrop-blur-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-amber-500">Proposed Terms</p>
                            <div className="flex items-baseline gap-1.5 mb-2">
                                <DollarSign className="w-5 h-5 text-amber-500" />
                                <span className="text-4xl font-black tracking-tight text-[var(--color-text-primary)]">{proposal.bid_amount}</span>
                                <span className="text-sm font-bold opacity-70 text-[var(--color-text-primary)]/50">TND</span>
                            </div>
                            {proposal.duration > 0 && (
                                <div className="flex items-center gap-1.5 text-sm font-medium mb-3 text-[var(--color-text-primary)]/70">
                                    <Clock className="w-4 h-4 text-emerald-400" />
                                    Delivery in <strong className="text-[var(--color-text-primary)]">{proposal.duration} days</strong>
                                </div>
                            )}
                            <div className="pt-3 border-t border-white/10 text-[11px] font-semibold tracking-wide text-[var(--color-text-primary)]/50">
                                +{fee} TND fee → <strong className="text-[var(--color-text-primary)]">{total} TND total</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── TABS (Sticky inside scroll) ── */}
                <div className="sticky top-0 z-10 flex border-b border-white/5 px-5 gap-6 backdrop-blur-2xl bg-[var(--color-bg-base)]/80">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`relative py-4 px-1 text-[11px] uppercase tracking-wider font-bold transition-all ${
                                activeTab === tab ? 'text-amber-400' : 'text-[var(--color-text-primary)]/40 hover:text-[var(--color-text-primary)]/70'
                            }`}
                        >
                            {tabLabels[tab]}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

            {/* ── CONTENT ── */}
            <div className="p-4 sm:p-5 md:p-6 pb-28 md:pb-32 w-full min-w-0 bg-[var(--color-bg-base)]">

                {/* PROPOSAL */}
                {activeTab === 'proposal' && (
                    <div className="space-y-5 animate-in fade-in duration-200 max-w-2xl w-full min-w-0 flex flex-col min-h-0">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-[var(--color-text-primary)]/40">
                            <Clock className="w-3.5 h-3.5" />
                            Submitted {new Date(proposal.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>

                        {/* Cover letter */}
                        <div className="w-full min-w-0">
                            <h3 className="text-xs uppercase tracking-wider font-black mb-2.5 text-[var(--color-text-primary)]/70">
                                {tx('jobProposals.modal.coverLetter', undefined, 'Cover Letter')}
                            </h3>
                            <div className="rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] p-4 sm:p-5 text-sm leading-relaxed whitespace-pre-wrap break-all w-full overflow-hidden text-[var(--color-text-primary)]/70">
                                {proposal.cover_letter || (
                                    <span className="text-[var(--color-text-primary)]/40 italic">
                                        {tx('jobProposals.noCoverLetter', undefined, 'No cover letter provided.')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Attachments */}
                        {proposal.attachments && proposal.attachments.length > 0 && (
                            <div>
                                <h3 className="text-xs uppercase tracking-wider font-black mb-2.5 text-[var(--color-text-primary)]/70">
                                    {tx('jobProposals.modal.attachments', undefined, 'Attachments')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {proposal.attachments.map((file, idx) => {
                                        const isImg = file.isImage || /\.(jpg|jpeg|png|webp|gif|bmp|avif)(\?.*)?$/i.test(file.name);
                                        return (
                                            <div key={idx}
                                                onClick={() => {
                                                    if (isImg && file.url) {
                                                        setLightboxImage(file.url);
                                                    } else if (file.url) {
                                                        window.open(file.url, '_blank');
                                                    }
                                                }}
                                                className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] cursor-pointer group transition-all hover:bg-white/5">
                                                {isImg && file.url ? (
                                                    <div className="h-9 w-9 rounded-xl shrink-0 overflow-hidden border border-white/10">
                                                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/10">
                                                        <FileText className="w-4 h-4 text-amber-500" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate text-[var(--color-text-primary)]">{file.name || 'Attachment'}</p>
                                                    {file.size && <p className="text-[10px] text-[var(--color-text-primary)]/50 uppercase tracking-wider font-semibold">{file.size}</p>}
                                                </div>
                                                <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-primary)]/50" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* PROFILE */}
                {activeTab === 'profile' && (
                    <div className="space-y-5 animate-in fade-in duration-200 max-w-2xl">
                        {isLoadingInsights ? (
                            <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]/50">
                                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--workspace-primary)' }} />
                                Loading freelancer profile details...
                            </div>
                        ) : resolvedBio ? (
                            <div>
                                <h3 className="text-xs uppercase tracking-wider font-black mb-2 text-[var(--color-text-primary)]/70">About</h3>
                                <p className="text-sm leading-relaxed text-[var(--color-text-primary)]/70 break-words">{resolvedBio}</p>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-[var(--color-text-primary)]/40">
                                <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No profile info available.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                { label: 'Jobs Completed', value: resolvedJobsCompleted, icon: Briefcase },
                                { label: 'Success Rate', value: `${resolvedSuccessRate}%`, icon: TrendingUp },
                                { label: 'Rating', value: resolvedRating > 0 ? `${resolvedRating.toFixed(1)} ★` : '—', icon: Star },
                                { label: 'Reviews', value: resolvedReviewCount, icon: Shield },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] p-4">
                                    <Icon className="w-4 h-4 mb-2 text-amber-500" />
                                    <p className="text-xl font-black mb-0.5 text-[var(--color-text-primary)]">{String(value)}</p>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-text-primary)]/40">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PORTFOLIO */}
                {activeTab === 'portfolio' && (
                    <div className="animate-in fade-in duration-200">
                        {isLoadingInsights ? (
                            <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]/50">
                                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--workspace-primary)' }} />
                                Loading portfolio...
                            </div>
                        ) : portfolioItems.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {portfolioItems.map((item) => (
                                    <article key={item.id} className="rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] overflow-hidden">
                                        <div className="h-32 overflow-hidden bg-amber-500/5">
                                            {item.thumbnail_url ? (
                                                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[var(--color-text-primary)]/40">
                                                    <Briefcase className="w-6 h-6 opacity-40" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 space-y-1.5">
                                            <h4 className="text-sm font-bold truncate text-[var(--color-text-primary)]">{item.title}</h4>
                                            {item.description && (
                                                <p className="text-xs line-clamp-3 text-[var(--color-text-primary)]/60">{item.description}</p>
                                            )}
                                            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-[var(--color-text-primary)]/40">
                                                <span>{item.completion_date ? new Date(item.completion_date).toLocaleDateString() : 'Recent work'}</span>
                                                {item.project_url && (
                                                    <a href={item.project_url} target="_blank" rel="noreferrer" className="text-amber-500 hover:text-amber-400 transition-colors">
                                                        Open
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-[var(--color-text-primary)]/40">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-amber-500/10">
                                    <Briefcase className="w-6 h-6 text-amber-500 opacity-60" />
                                </div>
                                <p className="text-sm font-bold mb-1 text-[var(--color-text-primary)]">No portfolio items</p>
                                <p className="text-xs">The freelancer hasn't added portfolio items yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* REVIEWS */}
                {activeTab === 'reviews' && (
                    <div className="animate-in fade-in duration-200">
                        {isLoadingInsights ? (
                            <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]/50">
                                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--workspace-primary)' }} />
                                Loading reviews...
                            </div>
                        ) : reviewItems.length > 0 ? (
                            <div className="space-y-3 max-w-2xl">
                                {reviewItems.map((review) => (
                                    <article key={review.id} className="rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] p-4">
                                        <div className="flex items-start gap-3">
                                            <Avatar
                                                name={review.reviewer_name}
                                                url={review.reviewer_avatar_url}
                                                online={false}
                                                size="sm"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className="text-sm font-bold truncate text-[var(--color-text-primary)]">{review.reviewer_name}</p>
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-text-primary)]/40">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 mb-2 text-amber-500">
                                                    {Array.from({ length: 5 }).map((_, index) => (
                                                        <Star
                                                            key={`${review.id}-${index}`}
                                                            className={`w-3.5 h-3.5 ${index < review.rating ? 'fill-current' : 'text-[var(--color-text-primary)]/10'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-sm leading-relaxed text-[var(--color-text-primary)]/70 break-words">
                                                    {review.comment || 'Great collaboration experience.'}
                                                </p>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-[var(--color-text-primary)]/40">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-amber-500/10">
                                    <Star className="w-6 h-6 text-amber-500 opacity-60" />
                                </div>
                                <p className="text-sm font-bold mb-1 text-[var(--color-text-primary)]">No reviews yet</p>
                                <p className="text-xs">Reviews appear after completed contracts.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            </div>

            {/* ── STICKY BOTTOM ACTION BAR ── */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 pl-5 pr-16 md:pr-20 py-4 flex items-center justify-between gap-3 z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] bg-[var(--color-bg-elevated)]">
                 
                {rejectConfirm ? (
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                        <span className="text-sm font-bold text-rose-400">
                            Decline this proposal?
                        </span>
                        <span className="text-xs text-[var(--color-text-primary)]/50 hidden sm:inline">
                            The freelancer will be notified.
                        </span>
                        <button type="button" onClick={() => setRejectConfirm(false)}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)]/70 hover:bg-white/5 transition-colors ml-auto">
                            Cancel
                        </button>
                        <button type="button" onClick={() => { setRejectConfirm(false); onReject(); }}
                            className="flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-bold transition-all hover:bg-rose-500 bg-rose-600 text-white">
                            <X className="w-4 h-4" />
                            Yes, Decline
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-between gap-3 overflow-x-auto scrollbar-hide py-1">
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => navigate(`/freelancer/${proposal.freelancer_id}`)}
                                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-[var(--color-text-primary)]/70 hover:bg-white/5 transition-colors shrink-0">
                                <User className="w-4 h-4 text-amber-400" />
                                Visit Profile
                            </button>

                            <button type="button" onClick={onMessage}
                                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-[var(--color-text-primary)]/70 hover:bg-white/5 transition-colors shrink-0">
                                <MessageSquare className="w-4 h-4" />
                                {tx('jobProposals.message', undefined, 'Chat')}
                            </button>

                            <button type="button" onClick={onShortlist}
                                className={`flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-white/5 shrink-0 ${isShortlisted ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' : 'border-white/10 text-[var(--color-text-primary)]/70'}`}>
                                <Bookmark className={`w-4 h-4 ${isShortlisted ? 'fill-current' : ''}`} />
                                {isShortlisted ? tx('jobProposals.saved', undefined, 'Saved') : tx('jobProposals.save', undefined, 'Save')}
                            </button>

                            {canReject && (
                                <button
                                    type="button"
                                    onClick={() => setRejectConfirm(true)}
                                    className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 px-4 py-2.5 text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                    {tx('jobProposals.modal.reject', undefined, 'Decline')}
                                </button>
                            )}

                            <button type="button" onClick={() => { if (isArchived) onUnarchive(); else onArchive(); }}
                                className={`flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${isArchived ? 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' : 'border-white/10 text-[var(--color-text-primary)]/50 hover:text-[var(--color-text-primary)]/80 hover:bg-white/5'}`}>
                                <Archive className="w-4 h-4" />
                                {isArchived ? tx('jobProposals.modal.unarchive', undefined, 'Unarchive') : tx('jobProposals.modal.archive', undefined, 'Archive')}
                            </button>
                        </div>

                        <button type="button" onClick={() => setHireConfirm(true)}
                            disabled={isHiring || !canHire}
                            className="flex items-center justify-center gap-2 rounded-lg px-8 py-2.5 text-sm font-bold transition-all hover:bg-amber-400 disabled:opacity-60 shrink-0 bg-amber-500 text-[#0a0a0a]">
                            {isHiring ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {canHire
                                ? tx('jobProposals.hire', undefined, 'Hire Now')
                                : tx('jobProposals.hireDisabled', undefined, 'Cannot hire declined proposal')}
                        </button>
                    </div>
                )}
            </div>

            {hireConfirm && createPortal(
                <div 
                    className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-4 flex justify-center items-start pt-10 sm:pt-20 pb-10 animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setHireConfirm(false);
                        }
                    }}
                >
                    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6 shadow-2xl space-y-6 relative overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setHireConfirm(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors hover:bg-white/5 text-white/50 hover:text-white z-10"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-white">Hire Confirmation</h3>
                            <p className="text-sm text-white/50">
                                You are about to hire <span className="font-bold text-white/80">{freelancer.full_name}</span>.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/5 bg-white/2 p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                {freelancer.avatar_url ? (
                                    <img
                                        src={freelancer.avatar_url}
                                        alt={freelancer.full_name}
                                        className="w-12 h-12 rounded-xl object-cover border border-white/10"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/60 font-bold border border-white/10">
                                        {freelancer.full_name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-sm font-bold text-white">{freelancer.full_name}</h4>
                                    <p className="text-xs text-white/40">Professional Freelancer</p>
                                </div>
                            </div>

                            <div className="h-px bg-white/5" />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-white/40">Bid Amount</p>
                                    <p className="font-black text-emerald-400">{proposal.bid_amount} TND</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/40">Delivery Time</p>
                                    <p className="font-bold text-white/80">{proposal.duration} days</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3.5">
                            <span className="text-lg mt-0.5">🔒</span>
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-emerald-300">Funds held securely in Escrow</p>
                                <p className="text-[11px] text-white/50 leading-relaxed">
                                    Your budget remains protected in escrow. Funds are only released to the freelancer after you review and approve their work.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setHireConfirm(false)}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-semibold text-white/70 hover:bg-white/5 active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setHireConfirm(false);
                                    onHire();
                                }}
                                disabled={isHiring}
                                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isHiring ? (
                                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Confirm & Hire
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {lightboxImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button 
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[var(--color-text-primary)] transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img 
                        src={lightboxImage} 
                        alt="Attachment Preview" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                    />
                </div>
            )}
        </div>
    );
}


