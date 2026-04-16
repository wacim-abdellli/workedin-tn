import { useState, useEffect } from 'react';
import {
    MessageSquare, Star, MapPin, Clock, Briefcase,
    Archive, CheckCircle, Loader2, User,
    DollarSign, TrendingUp, Shield, FileText, Download,
    ChevronDown, X,
} from 'lucide-react';
import type { ProposalAttachment } from '../../types/proposal';
import { useTranslation } from '../../i18n';

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
    created_at: string;
    status: string;
    cover_letter: string;
    attachments: ProposalAttachment[];
    bid_amount: number;
    duration: number;
    freelancer: ProposalDetailFreelancer;
}

interface ProposalDetailPaneProps {
    proposal: ProposalDetailData | null;
    isHiring?: boolean;
    onClose: () => void;
    onMessage: () => void;
    onShortlist: () => void;
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
    onHire,
    onArchive,
    onUnarchive,
    isShortlisted = false,
}: ProposalDetailPaneProps) {
    const { tx } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>('proposal');
    const [hireConfirm, setHireConfirm] = useState(false);
    const [archiveOpen, setArchiveOpen] = useState(false);

    useEffect(() => {
        setActiveTab('proposal');
        setHireConfirm(false);
        setArchiveOpen(false);
    }, [proposal?.id]);

    if (!proposal) return null;

    const { freelancer } = proposal;
    const isArchived = proposal.status === 'archived';
    const fee = Math.round(proposal.bid_amount * SERVICE_FEE_RATE);
    const total = proposal.bid_amount + fee;

    const tabLabels: Record<Tab, string> = {
        proposal: tx('jobProposals.modal.tabProposal', undefined, 'Proposal'),
        profile: tx('jobProposals.modal.tabProfile', undefined, 'Profile'),
        portfolio: tx('jobProposals.modal.tabPortfolio', undefined, 'Portfolio'),
        reviews: tx('jobProposals.modal.tabReviews', undefined, 'Reviews'),
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── HERO HEADER ── */}
            <div
                className="relative px-6 pt-6 pb-5 shrink-0 border-b overflow-hidden"
                style={{
                    background: 'linear-gradient(160deg, color-mix(in srgb, var(--workspace-primary) 10%, var(--card-bg)) 0%, var(--card-bg) 70%)',
                    borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)',
                }}
            >
                {/* Glow blobs */}
                <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20"
                    style={{ background: 'var(--workspace-primary)' }} />

                {/* Close on mobile breakpoint */}
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 z-10" style={{ color: 'var(--text-muted)' }}>
                    <X className="w-4 h-4" />
                </button>

                <div className="relative flex items-start gap-4">
                    <Avatar name={freelancer.full_name} url={freelancer.avatar_url} online={freelancer.is_online} size="lg" />

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h2 className="text-lg font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {freelancer.full_name}
                            </h2>
                            <StatusPill status={proposal.status} />
                            {freelancer.is_online && (
                                <span className="text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: 'rgba(34,197,94,0.14)', color: '#4ade80' }}>
                                    Online
                                </span>
                            )}
                        </div>

                        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                            {freelancer.title || 'Freelancer'}
                        </p>

                        <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {freelancer.country && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {freelancer.country}
                                </span>
                            )}
                            {(freelancer.rating ?? 0) > 0 && (
                                <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                                    <strong style={{ color: 'var(--text-primary)' }}>{freelancer.rating.toFixed(1)}</strong>
                                    <span>({freelancer.reviews_count} reviews)</span>
                                </span>
                            )}
                            {(freelancer.jobs_completed ?? 0) > 0 && (
                                <span className="flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" />
                                    <strong style={{ color: 'var(--text-primary)' }}>{freelancer.jobs_completed}</strong> jobs
                                </span>
                            )}
                            {(freelancer.success_rate ?? 0) > 0 && (
                                <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    <strong style={{ color: 'var(--text-primary)' }}>{freelancer.success_rate}%</strong> success
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bid + delivery strip */}
                <div
                    className="relative mt-4 flex items-center justify-between gap-4 rounded-xl px-4 py-3 border"
                    style={{
                        background: 'color-mix(in srgb, var(--workspace-primary) 5%, var(--page-bg))',
                        borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, transparent)',
                    }}
                >
                    <div className="flex items-baseline gap-1.5">
                        <DollarSign className="w-4 h-4 mb-0.5" style={{ color: 'var(--workspace-primary-mid)' }} />
                        <span className="text-2xl font-black" style={{ color: 'var(--workspace-primary-mid)' }}>{proposal.bid_amount}</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>TND bid</span>
                    </div>
                    <div className="h-6 w-px" style={{ background: 'color-mix(in srgb, var(--border) 60%, transparent)' }} />
                    {proposal.duration > 0 && (
                        <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <Clock className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                            <strong style={{ color: 'var(--text-primary)' }}>{proposal.duration}</strong> day delivery
                        </div>
                    )}
                    <div className="h-6 w-px" style={{ background: 'color-mix(in srgb, var(--border) 60%, transparent)' }} />
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        +{fee} TND fee → <strong style={{ color: 'var(--text-primary)' }}>{total} TND total</strong>
                    </div>
                </div>
            </div>

            {/* ── ACTION BAR ── */}
            <div
                className="flex items-center gap-2 px-5 py-3 shrink-0 border-b"
                style={{ borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)', background: 'var(--card-bg)' }}
            >
                {hireConfirm ? (
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            Confirm hire?
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            A contract will be created.
                        </span>
                        <button type="button" onClick={() => setHireConfirm(false)}
                            className="rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                            style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)', color: 'var(--text-secondary)' }}>
                            Cancel
                        </button>
                        <button type="button" onClick={() => { setHireConfirm(false); onHire(); }}
                            disabled={isHiring}
                            className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all hover:brightness-110 disabled:opacity-60"
                            style={{ background: '#22c55e', color: '#fff' }}>
                            {isHiring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Yes, Hire!
                        </button>
                    </div>
                ) : (
                    <>
                        <button type="button" onClick={() => setHireConfirm(true)}
                            disabled={isHiring}
                            className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all hover:brightness-110 disabled:opacity-60"
                            style={{
                                background: 'var(--workspace-primary)',
                                color: '#fff',
                                boxShadow: '0 4px 16px -4px color-mix(in srgb, var(--workspace-primary) 55%, transparent)',
                            }}>
                            {isHiring ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {tx('jobProposals.hire', undefined, 'Hire Now')}
                        </button>

                        <button type="button" onClick={onMessage}
                            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)', color: 'var(--text-secondary)' }}>
                            <MessageSquare className="w-4 h-4" />
                            {tx('jobProposals.message', undefined, 'Chat')}
                        </button>

                        <button type="button" onClick={onShortlist}
                            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all hover:brightness-105"
                            style={{
                                borderColor: isShortlisted ? 'color-mix(in srgb, #f59e0b 40%, transparent)' : 'color-mix(in srgb, var(--border) 70%, transparent)',
                                color: isShortlisted ? '#fbbf24' : 'var(--text-secondary)',
                                background: isShortlisted ? 'rgba(245,158,11,0.1)' : 'transparent',
                            }}>
                            <Star className={`w-4 h-4 ${isShortlisted ? 'fill-current' : ''}`} />
                            {isShortlisted ? tx('jobProposals.saved', undefined, 'Saved') : tx('jobProposals.save', undefined, 'Save')}
                        </button>

                        {/* Archive dropdown */}
                        <div className="relative ms-auto">
                            <button type="button" onClick={() => setArchiveOpen(v => !v)}
                                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:opacity-70"
                                style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)', color: 'var(--text-muted)' }}>
                                <Archive className="w-3.5 h-3.5" />
                                More
                                <ChevronDown className={`w-3 h-3 transition-transform ${archiveOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {archiveOpen && (
                                <div
                                    className="absolute end-0 top-full mt-1 rounded-xl border shadow-xl z-20 py-1 w-40"
                                    style={{ background: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}>
                                    <button type="button" onClick={() => { setArchiveOpen(false); if (isArchived) onUnarchive(); else onArchive(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:opacity-80"
                                        style={{ color: isArchived ? 'var(--workspace-primary-mid)' : '#f87171' }}>
                                        <Archive className="w-3.5 h-3.5" />
                                        {isArchived
                                            ? tx('jobProposals.modal.unarchive', undefined, 'Unarchive Proposal')
                                            : tx('jobProposals.modal.archive', undefined, 'Archive Proposal')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ── TABS ── */}
            <div
                className="flex shrink-0 border-b px-5 gap-1"
                style={{ borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)', background: 'var(--card-bg)' }}
            >
                {TABS.map(tab => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className="relative py-3 px-1 text-xs font-bold transition-colors border-b-2"
                        style={{
                            borderBottomColor: activeTab === tab ? 'var(--workspace-primary)' : 'transparent',
                            color: activeTab === tab ? 'var(--workspace-primary-mid)' : 'var(--text-muted)',
                            marginBottom: '-1px',
                        }}
                    >
                        {tabLabels[tab]}
                    </button>
                ))}
            </div>

            {/* ── CONTENT ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6" style={{ background: 'var(--page-bg)', minWidth: 0 }}>

                {/* PROPOSAL */}
                {activeTab === 'proposal' && (
                    <div className="space-y-5 animate-in fade-in duration-200 max-w-2xl">
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <Clock className="w-3.5 h-3.5" />
                            Submitted {new Date(proposal.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>

                        {/* Cover letter */}
                        <div>
                            <h3 className="text-sm font-bold mb-2.5" style={{ color: 'var(--text-primary)' }}>
                                {tx('jobProposals.modal.coverLetter', undefined, 'Cover Letter')}
                            </h3>
                            <div
                                className="rounded-2xl border p-5 text-sm leading-relaxed"
                                style={{
                                    background: 'var(--card-bg)',
                                    borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)',
                                    color: 'var(--text-secondary)',
                                    /* All three properties needed to absolutely stop overflow */
                                    wordBreak: 'break-all',
                                    overflowWrap: 'anywhere',
                                    whiteSpace: 'pre-wrap',
                                    overflow: 'hidden',
                                    minWidth: 0,
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
                        {freelancer.bio ? (
                            <div>
                                <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>About</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{freelancer.bio}</p>
                            </div>
                        ) : (
                            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                                <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No profile info available.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                { label: 'Jobs Completed', value: freelancer.jobs_completed, icon: Briefcase },
                                { label: 'Success Rate', value: `${freelancer.success_rate}%`, icon: TrendingUp },
                                { label: 'Rating', value: freelancer.rating > 0 ? `${freelancer.rating.toFixed(1)} ★` : '—', icon: Star },
                                { label: 'Reviews', value: freelancer.reviews_count, icon: Shield },
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
                    <div className="text-center py-16 animate-in fade-in duration-200" style={{ color: 'var(--text-muted)' }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}>
                            <Briefcase className="w-6 h-6" style={{ color: 'var(--workspace-primary-mid)', opacity: 0.6 }} />
                        </div>
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>No portfolio items</p>
                        <p className="text-xs">The freelancer hasn't added portfolio items yet.</p>
                    </div>
                )}

                {/* REVIEWS */}
                {activeTab === 'reviews' && (
                    <div className="text-center py-16 animate-in fade-in duration-200" style={{ color: 'var(--text-muted)' }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'rgba(245,158,11,0.10)' }}>
                            <Star className="w-6 h-6" style={{ color: '#fbbf24', opacity: 0.6 }} />
                        </div>
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>No reviews yet</p>
                        <p className="text-xs">Reviews appear after completed contracts.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
