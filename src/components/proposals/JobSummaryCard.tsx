import { Calendar, DollarSign, Clock, Share2, Users, BarChart2, Trophy, Inbox, Edit } from 'lucide-react';
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
    hasActiveContract?: boolean;
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

export default function JobEmptyPane({ job, hasActiveContract = false }: JobSummaryProps) {
    const { tx } = useTranslation();
    const navigate = useNavigate();
    const { jobId } = useParams<{ jobId: string }>();

    if (!job) return (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-8 text-center text-[var(--color-text-primary)]/40">
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
        <>
            {/* Empty prompt */}
            <div className="rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] py-10 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-amber-500/10">
                    <Inbox className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-base font-bold mb-1 text-[var(--color-text-primary)]">
                    Select a proposal
                </h3>
                <p className="text-sm text-[var(--color-text-primary)]/50">
                    Click any proposal from the list to review it here.
                </p>
            </div>

            {/* Stats */}
            {job.stats && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: Users, label: 'Proposals', value: job.stats.proposals, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { icon: BarChart2, label: 'Interviews', value: job.stats.interviewing, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                        { icon: Trophy, label: 'Shortlisted', value: job.stats.shortlisted, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    ].map(({ icon: Icon, label, value, color, bg }) => (
                        <div key={label} className="rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] p-4 text-center">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${bg}`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <p className={`text-xl font-black ${color}`}>{value}</p>
                            <p className="text-[10px] mt-0.5 text-[var(--color-text-primary)]/50 uppercase tracking-wider font-bold">{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Job details */}
            <div className="rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-transparent">
                    <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">
                        {tx('jobProposals.jobDetails', undefined, 'Job Details')}
                    </h3>
                </div>

                <div className="divide-y divide-white/5">
                    {[
                        { icon: DollarSign, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400', label: 'Budget', value: `${job.budget_min} – ${job.budget_max} ${currency}`, sub: jobTypeLabel },
                        { icon: Clock, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400', label: 'Duration', value: durationLabel, sub: null },
                        { icon: Calendar, iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-400', label: 'Posted', value: formattedDate, sub: null },
                    ].map(({ icon: Icon, iconBg, iconColor, label, value, sub }) => (
                        <div key={label} className="flex items-center gap-3 px-4 py-3.5">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                                <Icon className={`w-4 h-4 ${iconColor}`} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5 text-[var(--color-text-primary)]/40">{label}</p>
                                <p className="text-sm font-bold text-[var(--color-text-primary)]">{value}</p>
                                {sub && <p className="text-[11px] text-[var(--color-text-primary)]/50">{sub}</p>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-4 py-3 border-t border-white/5 grid grid-cols-2 gap-2">
                    <button type="button"
                        onClick={() => {
                            if (navigator.share) navigator.share({ url: window.location.href });
                            else navigator.clipboard.writeText(window.location.href);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-xs font-semibold text-[var(--color-text-primary)]/70 hover:bg-white/5 transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                    </button>
                    <button type="button"
                        onClick={() => navigate(jobId ? getJobEditRoute(jobId) : ROUTES.jobs)}
                        disabled={hasActiveContract}
                        title={hasActiveContract ? 'Cannot edit job with active contract' : 'Edit job details'}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/20 py-2 text-xs font-bold transition-colors ${
                            hasActiveContract
                                ? 'bg-amber-500/5 text-amber-400/40 border-amber-500/10 cursor-not-allowed'
                                : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                        }`}>
                        <Edit className="w-3.5 h-3.5" />
                        Edit Job
                    </button>
                </div>
            </div>
        </>
    );
}


