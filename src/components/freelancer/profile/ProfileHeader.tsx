import { Star, MapPin, CheckCircle, MessageSquare, Pause, Volume2, User, Wallet, Clock3, BriefcaseBusiness } from 'lucide-react';
import { OptimizedImage } from '../../common';
import Button from '../../ui/Button';
import type { FreelancerData } from '@/types/freelancer';
import { useTranslation } from '../../../i18n';

interface ProfileHeaderProps {
    freelancer: FreelancerData;
    onContact: () => void;
    onMessage: () => void;
    onPlayVoice: () => void;
    isPlayingVoice: boolean;
}

export default function ProfileHeader({
    freelancer,
    onContact,
    onMessage,
    onPlayVoice,
    isPlayingVoice
}: ProfileHeaderProps) {
    const { tx } = useTranslation();

    return (
        <>
            <div className="relative overflow-hidden border-b border-border/70 bg-[linear-gradient(135deg,#24163d_0%,#4c1d95_40%,#7c3aed_70%,#d97706_100%)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.14),transparent_24%)]" />
                {freelancer.cover_url ? (
                    <OptimizedImage
                        src={freelancer.cover_url}
                        alt={tx('pages.freelancerProfile.coverAlt', undefined, 'Cover')}
                        className="absolute inset-0 h-full w-full"
                        imgClassName="h-full w-full object-cover opacity-18"
                        priority={true}
                    />
                ) : null}
                <div className="relative h-[260px] sm:h-[300px]" />
            </div>

            <div className="container-custom relative">
                <section className="relative z-10 -mt-24 mb-10 rounded-[2rem] border border-black/[0.06] bg-white px-6 pb-6 pt-0 shadow-[0_32px_90px_-40px_rgba(26,24,37,0.24)] dark:border-white/10 dark:bg-[#171421] sm:px-8 sm:pb-8 lg:-mt-28">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_320px] lg:gap-8">
                        <div>
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                                <div className="relative -mt-12 sm:-mt-14">
                                    <div className="h-28 w-28 overflow-hidden rounded-[1.75rem] border-[5px] border-white bg-white shadow-[0_20px_44px_-22px_rgba(26,24,37,0.4)] dark:border-[#171421] dark:bg-[#231d33] sm:h-32 sm:w-32">
                                        {freelancer.avatar_url ? (
                                            <OptimizedImage
                                                src={freelancer.avatar_url}
                                                alt={freelancer.full_name}
                                                className="h-full w-full"
                                                imgClassName="h-full w-full object-cover"
                                                priority={true}
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-[var(--surface-bg)]">
                                                <User className="h-12 w-12 text-[var(--text-muted)]" />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`absolute bottom-2 end-2 h-4 w-4 rounded-full border-2 border-white dark:border-[#171421] ${freelancer.availability === 'available' ? 'bg-emerald-500' : freelancer.availability === 'busy' ? 'bg-amber-400' : 'bg-slate-400'}`} />
                                </div>

                                <div className="min-w-0 flex-1 pt-2 sm:pt-0">
                                    <div className="inline-flex items-center rounded-full border border-[color:var(--workspace-primary)]/18 bg-[color:var(--workspace-primary)]/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--workspace-primary)]">
                                        {tx('auth.accountPanel.freelancerLabel', undefined, 'Freelancer')}
                                    </div>
                                    <h1 className="mt-3 text-3xl font-black leading-tight text-[var(--text-primary)] sm:text-4xl">
                                        {freelancer.full_name}
                                    </h1>
                                    <p className="mt-2 text-lg font-semibold text-[color:var(--workspace-primary)]">
                                        {freelancer.title || tx('auth.accountPanel.freelancerLabel', undefined, 'Freelancer')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2.5">
                                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--surface-bg)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                                    <MapPin className="h-4 w-4 text-[var(--text-muted)]" />
                                    {freelancer.location}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--surface-bg)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                                    <Star className="h-4 w-4 text-[color:var(--brand-accent)]" />
                                    {freelancer.stats.rating} • {tx('pages.freelancerProfile.reviewsCount', { count: freelancer.stats.reviews_count }, `${freelancer.stats.reviews_count} reviews`)}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--surface-bg)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    {freelancer.stats.success_rate}% {tx('pages.freelancerProfile.successRate', undefined, 'success')}
                                </span>
                            </div>

                            <p className="mt-6 max-w-3xl text-[15px] leading-8 text-[var(--text-secondary)]">
                                {freelancer.bio || tx('settings.noBio', undefined, 'No bio added yet')}
                            </p>
                        </div>

                        <aside className="rounded-[1.75rem] border border-border bg-[var(--surface-bg)] p-5 lg:mt-6">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                                {tx('pages.searchModal.quickActions', undefined, 'Quick actions')}
                            </div>
                            <div className="mt-4 space-y-3">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={onContact}
                                    className="h-12 w-full rounded-2xl"
                                >
                                    {tx('pages.freelancerProfile.hireNow', undefined, 'Hire now')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={onMessage}
                                    leftIcon={<MessageSquare className="h-4 w-4" />}
                                    className="h-12 w-full rounded-2xl"
                                >
                                    {tx('pages.freelancerProfile.message', undefined, 'Message')}
                                </Button>
                                {freelancer.voice_intro_url ? (
                                    <button
                                        onClick={onPlayVoice}
                                        className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition-all ${isPlayingVoice ? 'border-[color:var(--workspace-primary)] bg-[color:var(--workspace-primary)]/[0.08] text-[color:var(--workspace-primary)]' : 'border-border bg-white text-[var(--text-secondary)] hover:bg-white/80 dark:bg-white/[0.02]'}`}
                                        title={tx('pages.freelancerProfile.voiceIntro', undefined, 'Voice intro')}
                                    >
                                        {isPlayingVoice ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                        {tx('pages.freelancerProfile.voiceIntro', undefined, 'Voice intro')}
                                    </button>
                                ) : null}
                            </div>
                        </aside>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-[1.5rem] bg-[#171421] px-5 py-5 text-white shadow-[0_16px_30px_-22px_rgba(26,24,37,0.45)] dark:bg-[#100d16]">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-[color:var(--workspace-primary)]">
                                <BriefcaseBusiness className="h-5 w-5" />
                            </div>
                            <p className="text-4xl font-black leading-none">{freelancer.stats.jobs_completed}</p>
                            <p className="mt-2 text-sm text-white/70">{tx('pages.freelancerProfile.completedJobs', undefined, 'Completed jobs')}</p>
                        </div>
                        <div className="rounded-[1.5rem] bg-[#171421] px-5 py-5 text-white shadow-[0_16px_30px_-22px_rgba(26,24,37,0.45)] dark:bg-[#100d16]">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-[color:var(--workspace-primary)]">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <p className="text-4xl font-black leading-none">{freelancer.stats.total_earnings.toLocaleString()} {tx('common.tnd', undefined, 'TND')}</p>
                            <p className="mt-2 text-sm text-white/70">{tx('pages.freelancerProfile.totalEarnings', undefined, 'Total earnings')}</p>
                        </div>
                        <div className="rounded-[1.5rem] bg-[#171421] px-5 py-5 text-white shadow-[0_16px_30px_-22px_rgba(26,24,37,0.45)] dark:bg-[#100d16]">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-[color:var(--workspace-primary)]">
                                <Clock3 className="h-5 w-5" />
                            </div>
                            <p className="text-4xl font-black leading-none">{freelancer.stats.response_time_hours} {tx('dashboard.responseTime', undefined, 'h')}</p>
                            <p className="mt-2 text-sm text-white/70">{tx('pages.freelancerProfile.responseSpeed', undefined, 'Response speed')}</p>
                        </div>
                        <div className="rounded-[1.5rem] bg-[#171421] px-5 py-5 text-white shadow-[0_16px_30px_-22px_rgba(26,24,37,0.45)] dark:bg-[#100d16]">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-[color:var(--workspace-primary)]">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <p className="text-4xl font-black leading-none">{freelancer.hourly_rate} {tx('common.tnd', undefined, 'TND')}</p>
                            <p className="mt-2 text-sm text-white/70">{tx('findFreelancers.hourlyRate', undefined, 'Hourly rate')}</p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
