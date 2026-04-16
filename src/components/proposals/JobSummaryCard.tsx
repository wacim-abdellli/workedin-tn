import { Calendar, DollarSign, Clock, ExternalLink, Share2, Sparkles, Users, BarChart2, Trophy, Inbox, Edit } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { ROUTES, getJobEditRoute } from '../../lib/routes';

interface ProposalJobSummary {
    id?: string;
    title?: string;
    budget_min: number;
    budget_max: number;
    job_type: 'fixed_price' | 'hourly' | string;
    duration: string;
    created_at?: string;
    stats?: {
        proposals: number;
        interviewing: number;
        shortlisted: number;
    };
}

interface JobSummaryProps {
    job: ProposalJobSummary | null;
}

function formatDuration(raw: string, tx: (key: string, params?: Record<string, string | number>, fallback?: string) => string): string {
    const map: Record<string, string> = {
        less_than_1_month: tx('pages.postJob.stepDetails.durationLessThan1Month', undefined, 'Less than 1 month'),
        one_to_three_months: tx('pages.postJob.stepDetails.duration1To3Months', undefined, '1–3 months'),
        three_to_six_months: tx('pages.postJob.stepDetails.duration3To6Months', undefined, '3–6 months'),
        more_than_six_months: tx('pages.postJob.stepDetails.durationMoreThan6Months', undefined, '6+ months'),
        ongoing: tx('jobProposals.durationOngoing', undefined, 'Ongoing'),
    };
    return map[raw] ?? raw?.replace(/_/g, ' ') ?? '—';
}

export default function JobEmptyPane({ job }: JobSummaryProps) {
    const { tx } = useTranslation();
    const navigate = useNavigate();
    const { jobId } = useParams<{ jobId: string }>();

    if (!job) return (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-8 text-center" style={{ color: 'var(--text-muted)' }}>
            <Inbox className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Select a proposal to view details</p>
        </div>
    );

    const currency = tx('common.currency', undefined, 'TND');
    const jobTypeLabel = job.job_type === 'fixed_price'
        ? tx('jobDetail.fixedPrice', undefined, 'Fixed Price')
        : tx('jobDetail.hourly', undefined, 'Hourly');

    const formattedDate = job.created_at
        ? new Date(job.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    const durationLabel = formatDuration(job.duration, tx);

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ background: 'var(--page-bg)' }}>

            {/* Empty prompt */}
            <div
                className="rounded-2xl border py-10 px-6 text-center"
                style={{ background: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}
            >
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}
                >
                    <Inbox className="w-7 h-7" style={{ color: 'var(--workspace-primary-mid)' }} />
                </div>
                <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Select a proposal
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Click any proposal from the list to review it here.
                </p>
            </div>

            {/* Stats */}
            {job.stats && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: Users, label: 'Proposals', value: job.stats.proposals, color: 'var(--workspace-primary-mid)', bg: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' },
                        { icon: BarChart2, label: 'Interviews', value: job.stats.interviewing, color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
                        { icon: Trophy, label: 'Shortlisted', value: job.stats.shortlisted, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
                    ].map(({ icon: Icon, label, value, color, bg }) => (
                        <div key={label}
                            className="rounded-2xl border p-4 text-center"
                            style={{ background: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: bg }}>
                                <Icon className="w-4 h-4" style={{ color }} />
                            </div>
                            <p className="text-xl font-black" style={{ color }}>{value}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Job details */}
            <div
                className="rounded-2xl border overflow-hidden"
                style={{ background: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}
            >
                <div
                    className="px-4 py-3 border-b relative overflow-hidden"
                    style={{ borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--workspace-primary) 7%, var(--card-bg)), var(--card-bg))' }}
                >
                    <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--workspace-primary-mid)' }}>
                        {tx('jobProposals.jobDetails', undefined, 'Job Details')}
                    </h3>
                </div>

                <div className="divide-y" style={{ borderColor: 'color-mix(in srgb, var(--border) 40%, transparent)' }}>
                    {[
                        { icon: DollarSign, iconBg: 'color-mix(in srgb, #22c55e 12%, transparent)', iconColor: '#22c55e', label: 'Budget', value: `${job.budget_min} – ${job.budget_max} ${currency}`, sub: jobTypeLabel },
                        { icon: Clock, iconBg: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)', iconColor: 'var(--workspace-primary-mid)', label: 'Duration', value: durationLabel, sub: null },
                        { icon: Calendar, iconBg: 'rgba(99,102,241,0.12)', iconColor: '#818cf8', label: 'Posted', value: formattedDate, sub: null },
                    ].map(({ icon: Icon, iconBg, iconColor, label, value, sub }) => (
                        <div key={label} className="flex items-center gap-3 px-4 py-3.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: iconBg }}>
                                <Icon className="w-4 h-4" style={{ color: iconColor }} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                                {sub && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-4 py-3 border-t grid grid-cols-2 gap-2"
                    style={{ borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
                    <button type="button"
                        onClick={() => {
                            if (navigator.share) navigator.share({ url: window.location.href });
                            else navigator.clipboard.writeText(window.location.href);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all hover:opacity-80"
                        style={{ borderColor: 'color-mix(in srgb, var(--border) 80%, transparent)', color: 'var(--text-secondary)' }}>
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                    </button>
                    <button type="button"
                        onClick={() => navigate(jobId ? getJobEditRoute(jobId) : ROUTES.jobs)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all hover:brightness-110"
                        style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 28%, transparent)', color: 'var(--workspace-primary-mid)', background: 'color-mix(in srgb, var(--workspace-primary) 5%, transparent)' }}>
                        <Edit className="w-3.5 h-3.5" />
                        Edit Job
                    </button>
                </div>
            </div>

            {/* AI card */}
            <div
                className="rounded-2xl p-5 relative overflow-hidden border"
                style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--workspace-primary) 16%, var(--card-bg)), var(--card-bg))', borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, transparent)' }}
            >
                <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-3xl opacity-25"
                    style={{ background: 'var(--workspace-primary)' }} />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 15%, transparent)' }}>
                            <Sparkles className="w-4 h-4" style={{ color: 'var(--workspace-primary-mid)' }} />
                        </div>
                        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI Recommendations</h3>
                    </div>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                        We analyzed your requirements and found 3 freelancers that match your project at 95%.
                    </p>
                    <button type="button"
                        className="w-full rounded-xl py-2.5 text-xs font-bold transition-all hover:brightness-110"
                        style={{ background: 'var(--workspace-primary)', color: '#fff', boxShadow: '0 4px 16px -4px color-mix(in srgb, var(--workspace-primary) 50%, transparent)' }}>
                        View Suggestions
                    </button>
                </div>
            </div>
        </div>
    );
}
