import { useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, FileText, Search, Sparkles, Users } from 'lucide-react';

import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import { useTranslation } from '../i18n';

export default function JobPostSuccess() {
    const navigate = useNavigate();
    const { jobId } = useParams<{ jobId: string }>();
    const { tx } = useTranslation();

    const nextSteps = [
        {
            title: tx('jobs.posted.next.reviewTitle', undefined, 'Freelancers can start seeing the brief'),
            description: tx('jobs.posted.next.reviewDescription', undefined, 'Your posting is now available for the right talent to discover and respond to.'),
        },
        {
            title: tx('jobs.posted.next.compareTitle', undefined, 'Compare proposals with less noise'),
            description: tx('jobs.posted.next.compareDescription', undefined, 'As proposals arrive, shortlist stronger fits early so your hiring process stays focused.'),
        },
        {
            title: tx('jobs.posted.next.inviteTitle', undefined, 'Invite freelancers proactively if needed'),
            description: tx('jobs.posted.next.inviteDescription', undefined, 'If the role is niche or urgent, you can still bring specific freelancers into the brief.'),
        },
    ];

    return (
        <div className="page-shell" style={{ background: 'var(--page-bg)' }}>
            <Header />

            <main className="page-shell-content space-y-6">
                <section
                    className="radius-shell overflow-hidden border p-6 sm:p-8"
                    style={{
                        borderColor: 'color-mix(in srgb, var(--workspace-primary) 16%, var(--border))',
                        background: 'radial-gradient(circle at top left, color-mix(in srgb, #10b981 12%, transparent), transparent 28%), linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 96%, transparent), color-mix(in srgb, var(--surface-bg) 92%, transparent))',
                        boxShadow: '0 32px 90px -48px rgba(16,185,129,0.2)',
                    }}
                >
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_320px]">
                        <div className="space-y-5">
                            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] shadow-sm"
                                style={{
                                    borderColor: 'color-mix(in srgb, #10b981 25%, transparent)',
                                    background: 'color-mix(in srgb, #10b981 10%, var(--card-bg))',
                                    color: '#34d399',
                                }}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                {tx('jobs.posted.badge', undefined, 'Project published')}
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
                                    <CheckCircle2 className="h-9 w-9" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                                        {tx('jobs.posted.title', undefined, 'Your job is live and ready for proposals.')}
                                    </h1>
                                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                        {tx('jobs.posted.description', undefined, 'The brief is now in the system. You can review the posting, start discovering talent, and return to your dashboard without losing momentum.')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <div className="summary-chip">
                                    <FileText className="summary-chip-icon" />
                                    <span>{tx('jobs.posted.statusLive', undefined, 'Posting created successfully')}</span>
                                </div>
                                {jobId ? (
                                    <div className="summary-chip">
                                        <span className="summary-chip-label">{tx('ui.id')}</span>
                                        <span className="summary-chip-value">{jobId.slice(0, 8)}</span>
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="rounded-2xl px-5"
                                    onClick={() => navigate(jobId ? `/jobs/${jobId}` : '/jobs')}
                                    leftIcon={<FileText className="w-4 h-4" />}
                                >
                                    {tx('jobs.posted.viewJob', undefined, 'View job post')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="rounded-2xl px-5"
                                    onClick={() => navigate('/find-freelancers')}
                                    leftIcon={<Search className="w-4 h-4" />}
                                >
                                    {tx('jobs.posted.findFreelancers', undefined, 'Find freelancers')}
                                </Button>
                            </div>
                        </div>

                        <div
                            className="rounded-[1.75rem] border p-5 shadow-sm"
                            style={{
                                borderColor: 'color-mix(in srgb, var(--workspace-primary) 18%, var(--border))',
                                background: 'color-mix(in srgb, var(--surface-bg) 88%, transparent)',
                            }}
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                                {tx('jobs.posted.whatsNext', undefined, 'What happens next')}
                            </p>

                            <div className="mt-5 space-y-3">
                                {nextSteps.map((step, index) => (
                                    <div
                                        key={step.title}
                                        className="rounded-2xl border p-4"
                                        style={{
                                            borderColor: 'color-mix(in srgb, var(--workspace-primary) 16%, var(--border))',
                                            background: 'color-mix(in srgb, var(--workspace-primary) 8%, var(--card-bg))',
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</p>
                                                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{step.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <section className="premium-panel radius-shell p-6 sm:p-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/8 dark:text-primary-300">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                                    {tx('jobs.posted.improveResultsTitle', undefined, 'Want stronger results faster?')}
                                </h2>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                    {tx('jobs.posted.improveResultsDescription', undefined, 'The best client flows keep moving after publish. Review, invite, and compare before the best candidates disappear into other briefs.')}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            <div
                                className="rounded-[1.5rem] border p-5"
                                style={{
                                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 16%, var(--border))',
                                    background: 'color-mix(in srgb, var(--surface-bg) 90%, transparent)',
                                }}
                            >
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{tx('jobs.posted.cardReviewTitle', undefined, 'Check the brief')}</p>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{tx('jobs.posted.cardReviewDescription', undefined, 'Confirm the final wording, budget, and visibility are exactly how you want them.')}</p>
                            </div>
                            <div
                                className="rounded-[1.5rem] border p-5"
                                style={{
                                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 16%, var(--border))',
                                    background: 'color-mix(in srgb, var(--surface-bg) 90%, transparent)',
                                }}
                            >
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{tx('jobs.posted.cardInviteTitle', undefined, 'Invite selectively')}</p>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{tx('jobs.posted.cardInviteDescription', undefined, 'Bring in freelancers you already trust if you need stronger signal early.')}</p>
                            </div>
                            <div
                                className="rounded-[1.5rem] border p-5"
                                style={{
                                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 16%, var(--border))',
                                    background: 'color-mix(in srgb, var(--surface-bg) 90%, transparent)',
                                }}
                            >
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{tx('jobs.posted.cardDashboardTitle', undefined, 'Return to your dashboard')}</p>
                                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{tx('jobs.posted.cardDashboardDescription', undefined, 'Track pipeline activity, notifications, and proposal volume from your client workspace.')}</p>
                            </div>
                        </div>
                    </section>

                    <aside className="premium-panel radius-shell p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                            {tx('jobs.posted.quickActions', undefined, 'Quick actions')}
                        </p>
                        <div className="mt-5 space-y-3">
                            <Button variant="outline" className="w-full justify-between rounded-2xl text-start" rightIcon={<ArrowUpRight className="h-4 w-4" />} onClick={() => navigate(jobId ? `/jobs/${jobId}` : '/jobs')}>
                                {tx('jobs.posted.viewJob', undefined, 'View job post')}
                            </Button>
                            <Button variant="outline" className="w-full justify-between rounded-2xl text-start" rightIcon={<ArrowUpRight className="h-4 w-4" />} onClick={() => navigate('/client/dashboard')}>
                                {tx('jobs.posted.goToDashboard', undefined, 'Go to dashboard')}
                            </Button>
                            <Button variant="ghost" className="w-full justify-between rounded-2xl text-start" rightIcon={<ArrowUpRight className="h-4 w-4" />} onClick={() => navigate('/')}>
                                {tx('jobs.posted.home', undefined, 'Home')}
                            </Button>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
