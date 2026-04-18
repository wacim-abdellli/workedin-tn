import { useState, useEffect } from 'react';
import {
    MessageSquare, Star, MapPin, Clock, Briefcase,
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

const SERVICE_FEE_RATE = 0.10;

function Avatar({ name, url, online, size = 'lg' }: { name: string; url: string | null; online: boolean; size?: 'sm' | 'md' | 'lg' }) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const s = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-xs';
    const dot = size === 'lg' ? 'w-3.5 h-3.5 border-2 bottom-0 right-0' : 'w-2.5 h-2.5 border-2 bottom-0 right-0';
    return (
        <div className="relative shrink-0">
            {url ? (
                <img src={url} alt={name} className={`${s} rounded-2xl object-cover`}
                    style={{ border: '2px solid color-mix(in srgb, var(--border) 50%, transparent)' }} />
            ) : (
                <div className={`${s} rounded-2xl flex items-center justify-center font-black`}
                    style={{
                        background: 'linear-gradient(135deg, color-mix(in srgb, var(--workspace-primary) 22%, var(--card-bg)), color-mix(in srgb, var(--workspace-primary) 8%, var(--card-bg)))',
                        border: '2px solid color-mix(in srgb, var(--workspace-primary) 20%, transparent)',
                        color: 'var(--workspace-primary-mid)',
                    }}>
                    {initials || <User className="w-4 h-4" />}
                </div>
            )}
            {online && (
                <span className={`absolute ${dot} rounded-full`}
                    style={{ background: '#22c55e', borderColor: 'var(--card-bg)' }} />
            )}
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const s = status === 'pending' ? 'new' : status;
    const map: Record<string, { label: string; color: string; bg: string }> = {
        new: { label: 'New', color: '#818cf8', bg: 'rgba(99,102,241,0.14)' },
        shortlisted: { label: 'Shortlisted', color: '#fbbf24', bg: 'rgba(245,158,11,0.14)' },
        archived: { label: 'Archived', color: '#94a3b8', bg: 'rgba(100,116,139,0.14)' },
        accepted: { label: 'Accepted', color: '#4ade80', bg: 'rgba(34,197,94,0.14)' },
        rejected: { label: 'Declined', color: '#f87171', bg: 'rgba(239,68,68,0.14)' },
    };
    const b = map[s] ?? { label: s, color: '#94a3b8', bg: 'rgba(100,116,139,0.14)' };
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: b.bg, color: b.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
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
    const [activeTab, setActiveTab] = useState<Tab>('proposal');
    const [hireConfirm, setHireConfirm] = useState(false);
    const [archiveOpen, setArchiveOpen] = useState(false);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [resolvedBio, setResolvedBio] = useState('');
    const [resolvedRating, setResolvedRating] = useState(0);
    const [resolvedReviewCount, setResolvedReviewCount] = useState(0);
    const [resolvedJobsCompleted, setResolvedJobsCompleted] = useState(0);
    const [resolvedSuccessRate, setResolvedSuccessRate] = useState(0);
    const [portfolioItems, setPortfolioItems] = useState<PortfolioPreviewItem[]>([]);
    const [reviewItems, setReviewItems] = useState<ReviewPreviewItem[]>([]);

    useEffect(() => {
        setActiveTab('proposal');
        setHireConfirm(false);
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
        <div className="flex flex-col h-full min-h-0 overflow-hidden relative shadow-2xl" style={{ background: 'var(--page-bg)' }}>
            
            {/* ── COMPACT TOP HEADER ── */}
            <div className="flex items-center justify-between px-5 py-3 border-b shrink-0 z-20" style={{ background: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
                <div className="flex items-center gap-3">
                    <Avatar name={freelancer.full_name} url={freelancer.avatar_url} online={freelancer.is_online} size="sm" />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{freelancer.full_name}</h2>
                            <StatusPill status={proposal.status} />
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* ── MAIN SCROLLABLE ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative" style={{ minWidth: 0 }}>
                
                {/* HERO INFO (Scrolls with page) */}
                <div className="relative px-5 pt-6 pb-6 lg:pt-8 lg:pb-8 overflow-hidden border-b" style={{ background: 'linear-gradient(170deg, color-mix(in srgb, var(--workspace-primary) 6%, transparent) 0%, transparent 100%)', borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
                    <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] opacity-20"
                         style={{ background: 'var(--workspace-primary)' }} />
                         
                    <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6 z-10 w-full">
                        {/* Left: Info */}
                        <div className="flex-1 min-w-0 w-full">
                            <h1 className="text-2xl sm:text-3xl font-black mb-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {freelancer.title || 'Freelancer'}
                            </h1>
                            <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {freelancer.country && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 opacity-70" /> {freelancer.country}
                                    </span>
                                )}
                                {resolvedRating > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                                        <strong style={{ color: 'var(--text-primary)' }}>{resolvedRating.toFixed(1)}</strong>
                                        <span className="opacity-70">({resolvedReviewCount})</span>
                                    </span>
                                )}
                                {resolvedJobsCompleted > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4 opacity-70" />
                                        <strong style={{ color: 'var(--text-primary)' }}>{resolvedJobsCompleted}</strong> <span className="opacity-70">jobs</span>
                                    </span>
                                )}
                                {resolvedSuccessRate > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4 opacity-70" />
                                        <strong style={{ color: 'var(--text-primary)' }}>{resolvedSuccessRate}%</strong> <span className="opacity-70">success</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right: Bid Strip */}
                        <div className="shrink-0 rounded-2xl border px-6 py-5 shadow-lg w-full xl:w-auto min-w-[240px]"
                             style={{ background: 'color-mix(in srgb, var(--card-bg) 90%, transparent)', borderColor: 'color-mix(in srgb, var(--workspace-primary) 30%, transparent)' }}>
                            <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--workspace-primary-mid)' }}>Proposed Terms</p>
                            <div className="flex items-baseline gap-1.5 mb-2">
                                <DollarSign className="w-5 h-5" style={{ color: 'var(--workspace-primary-mid)' }} />
                                <span className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{proposal.bid_amount}</span>
                                <span className="text-sm font-bold opacity-70" style={{ color: 'var(--text-muted)' }}>TND</span>
                            </div>
                            {proposal.duration > 0 && (
                                <div className="flex items-center gap-1.5 text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                                    <Clock className="w-4 h-4" style={{ color: '#22c55e' }} />
                                    Delivery in <strong style={{ color: 'var(--text-primary)' }}>{proposal.duration} days</strong>
                                </div>
                            )}
                            <div className="pt-3 border-t text-[11px] font-semibold tracking-wide" style={{ borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)', color: 'var(--text-muted)' }}>
                                +{fee} TND fee → <strong style={{ color: 'var(--text-primary)' }}>{total} TND total</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── TABS (Sticky inside scroll) ── */}
                <div className="sticky top-0 z-10 flex border-b px-5 gap-6 backdrop-blur-2xl"
                     style={{ background: 'color-mix(in srgb, var(--card-bg) 85%, transparent)', borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className="relative py-4 px-1 text-sm font-bold transition-all border-b-[3px]"
                            style={{
                                borderBottomColor: activeTab === tab ? 'var(--workspace-primary)' : 'transparent',
                                color: activeTab === tab ? 'var(--workspace-primary-mid)' : 'var(--text-muted)',
                                marginBottom: '-2px',
                            }}
                        >
                            {tabLabels[tab]}
                        </button>
                    ))}
                </div>

            {/* ── CONTENT ── */}
            <div className="p-4 sm:p-5 md:p-6 pb-28 md:pb-32 w-full min-w-0" style={{ background: 'var(--page-bg)', minWidth: 0 }}>

                {/* PROPOSAL */}
                {activeTab === 'proposal' && (
                    <div className="space-y-5 animate-in fade-in duration-200 max-w-2xl w-full min-w-0 flex flex-col min-h-0">
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <Clock className="w-3.5 h-3.5" />
                            Submitted {new Date(proposal.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>

                        {/* Cover letter */}
                        <div className="w-full min-w-0">
                            <h3 className="text-sm font-bold mb-2.5" style={{ color: 'var(--text-primary)' }}>
                                {tx('jobProposals.modal.coverLetter', undefined, 'Cover Letter')}
                            </h3>
                            <div
                                className="rounded-2xl border p-4 sm:p-5 text-sm leading-relaxed whitespace-pre-wrap break-all w-full overflow-hidden"
                                style={{
                                    background: 'var(--card-bg)',
                                    borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)',
                                    color: 'var(--text-secondary)',
                                    overflowWrap: 'anywhere',
                                }}
                            >
                                {proposal.cover_letter || (
                                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        {tx('jobProposals.noCoverLetter', undefined, 'No cover letter provided.')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Attachments */}
                        {proposal.attachments && proposal.attachments.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold mb-2.5" style={{ color: 'var(--text-primary)' }}>
                                    {tx('jobProposals.modal.attachments', undefined, 'Attachments')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {proposal.attachments.map((file, idx) => (
                                        <div key={idx}
                                            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer group transition-all hover:brightness-95"
                                            style={{ background: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
                                            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}>
                                                <FileText className="w-4 h-4" style={{ color: 'var(--workspace-primary-mid)' }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{file.size}</p>
                                            </div>
                                            <Download className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* PROFILE */}
                {activeTab === 'profile' && (
                    <div className="space-y-5 animate-in fade-in duration-200 max-w-2xl">
                        {isLoadingInsights ? (
                            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading freelancer profile details...
                            </div>
                        ) : resolvedBio ? (
                            <div>
                                <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>About</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{resolvedBio}</p>
                            </div>
                        ) : (
                            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
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
                                <div key={label} className="rounded-2xl border p-4"
                                    style={{ background: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
                                    <Icon className="w-4 h-4 mb-2" style={{ color: 'var(--workspace-primary-mid)' }} />
                                    <p className="text-xl font-black mb-0.5" style={{ color: 'var(--text-primary)' }}>{String(value)}</p>
                                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PORTFOLIO */}
                {activeTab === 'portfolio' && (
                    <div className="animate-in fade-in duration-200">
                        {isLoadingInsights ? (
                            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading portfolio...
                            </div>
                        ) : portfolioItems.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {portfolioItems.map((item) => (
                                    <article key={item.id} className="rounded-2xl border overflow-hidden"
                                        style={{ background: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
                                        <div className="h-32 overflow-hidden" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 6%, transparent)' }}>
                                            {item.thumbnail_url ? (
                                                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                                                    <Briefcase className="w-6 h-6 opacity-40" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 space-y-1.5">
                                            <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</h4>
                                            {item.description && (
                                                <p className="text-xs line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                                            )}
                                            <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                                <span>{item.completion_date ? new Date(item.completion_date).toLocaleDateString() : 'Recent work'}</span>
                                                {item.project_url && (
                                                    <a href={item.project_url} target="_blank" rel="noreferrer" className="font-semibold" style={{ color: 'var(--workspace-primary-mid)' }}>
                                                        Open
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                    style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}>
                                    <Briefcase className="w-6 h-6" style={{ color: 'var(--workspace-primary-mid)', opacity: 0.6 }} />
                                </div>
                                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>No portfolio items</p>
                                <p className="text-xs">The freelancer hasn't added portfolio items yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* REVIEWS */}
                {activeTab === 'reviews' && (
                    <div className="animate-in fade-in duration-200">
                        {isLoadingInsights ? (
                            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading reviews...
                            </div>
                        ) : reviewItems.length > 0 ? (
                            <div className="space-y-3 max-w-2xl">
                                {reviewItems.map((review) => (
                                    <article key={review.id} className="rounded-2xl border p-4"
                                        style={{ background: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
                                        <div className="flex items-start gap-3">
                                            <Avatar
                                                name={review.reviewer_name}
                                                url={review.reviewer_avatar_url}
                                                online={false}
                                                size="sm"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{review.reviewer_name}</p>
                                                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 mb-2" style={{ color: '#f59e0b' }}>
                                                    {Array.from({ length: 5 }).map((_, index) => (
                                                        <Star
                                                            key={`${review.id}-${index}`}
                                                            className="w-3.5 h-3.5"
                                                            style={{ fill: index < review.rating ? '#f59e0b' : 'transparent' }}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                                                    {review.comment || 'Great collaboration experience.'}
                                                </p>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                    style={{ background: 'rgba(245,158,11,0.10)' }}>
                                    <Star className="w-6 h-6" style={{ color: '#fbbf24', opacity: 0.6 }} />
                                </div>
                                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>No reviews yet</p>
                                <p className="text-xs">Reviews appear after completed contracts.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            </div>

            {/* ── STICKY BOTTOM ACTION BAR ── */}
            <div className="absolute bottom-0 left-0 right-0 border-t px-5 py-4 flex items-center justify-between gap-3 z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl"
                 style={{ borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)', background: 'color-mix(in srgb, var(--card-bg) 85%, transparent)' }}>
                 
                {hireConfirm ? (
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            Confirm hire?
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            A contract will be created.
                        </span>
                        <button type="button" onClick={() => setHireConfirm(false)}
                            className="rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:opacity-80 ml-auto"
                            style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)', color: 'var(--text-secondary)' }}>
                            Cancel
                        </button>
                        <button type="button" onClick={() => { setHireConfirm(false); onHire(); }}
                            disabled={isHiring}
                            className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold transition-all hover:brightness-110 disabled:opacity-60"
                            style={{ background: '#22c55e', color: '#fff' }}>
                            {isHiring ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Yes, Hire!
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-1 items-center gap-3 overflow-x-auto scrollbar-hide py-1">
                        <button type="button" onClick={() => setHireConfirm(true)}
                            disabled={isHiring || !canHire}
                            className="flex items-center justify-center gap-2 rounded-xl px-8 py-2.5 text-sm font-bold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60 shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, var(--workspace-primary), color-mix(in srgb, var(--workspace-primary) 80%, black))',
                                color: '#fff',
                                boxShadow: '0 8px 24px -8px color-mix(in srgb, var(--workspace-primary) 60%, transparent)',
                            }}>
                            {isHiring ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {canHire
                                ? tx('jobProposals.hire', undefined, 'Hire Now')
                                : tx('jobProposals.hireDisabled', undefined, 'Cannot hire declined proposal')}
                        </button>

                        <button type="button" onClick={onMessage}
                            className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
                            style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)', color: 'var(--text-secondary)' }}>
                            <MessageSquare className="w-4 h-4" />
                            {tx('jobProposals.message', undefined, 'Chat')}
                        </button>

                        <button type="button" onClick={onShortlist}
                            className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:brightness-105 shrink-0"
                            style={{
                                borderColor: isShortlisted ? 'color-mix(in srgb, #f59e0b 40%, transparent)' : 'color-mix(in srgb, var(--border) 70%, transparent)',
                                color: isShortlisted ? '#fbbf24' : 'var(--text-secondary)',
                                background: isShortlisted ? 'rgba(245,158,11,0.1)' : 'transparent',
                            }}>
                            <Star className={`w-4 h-4 ${isShortlisted ? 'fill-current' : ''}`} />
                            {isShortlisted ? tx('jobProposals.saved', undefined, 'Saved') : tx('jobProposals.save', undefined, 'Save')}
                        </button>

                        {canReject && (
                            <button
                                type="button"
                                onClick={onReject}
                                className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-85 shrink-0"
                                style={{
                                    borderColor: 'rgba(239,68,68,0.35)',
                                    color: '#f87171',
                                    background: 'rgba(239,68,68,0.08)',
                                }}
                            >
                                <X className="w-4 h-4" />
                                {tx('jobProposals.modal.reject', undefined, 'Decline')}
                            </button>
                        )}

                        {/* Archive dropdown */}
                        <div className="relative ms-auto shrink-0">
                            <button type="button" onClick={() => setArchiveOpen(v => !v)}
                                className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-70"
                                style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)', color: 'var(--text-muted)' }}>
                                <Archive className="w-4 h-4" />
                                More
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${archiveOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {archiveOpen && (
                                <div
                                    className="absolute bottom-full right-0 mb-3 rounded-xl border shadow-2xl z-40 py-2 w-48 backdrop-blur-3xl"
                                    style={{ background: 'color-mix(in srgb, var(--card-bg) 95%, transparent)', borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}>
                                    {canReject && (
                                        <button type="button" onClick={() => { setArchiveOpen(false); onReject(); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:opacity-80 transition-opacity"
                                            style={{ color: '#f87171' }}>
                                            <X className="w-4 h-4" />
                                            {tx('jobProposals.modal.reject', undefined, 'Decline Proposal')}
                                        </button>
                                    )}
                                    <button type="button" onClick={() => { setArchiveOpen(false); if (isArchived) onUnarchive(); else onArchive(); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:opacity-80 transition-opacity"
                                        style={{ color: isArchived ? 'var(--workspace-primary-mid)' : '#f87171' }}>
                                        <Archive className="w-4 h-4" />
                                        {isArchived
                                            ? tx('jobProposals.modal.unarchive', undefined, 'Unarchive Proposal')
                                            : tx('jobProposals.modal.archive', undefined, 'Archive Proposal')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
