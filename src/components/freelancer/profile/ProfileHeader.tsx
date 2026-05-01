import { Star, MapPin, CheckCircle, Pause, Volume2, User, Wallet, Clock3, BriefcaseBusiness, Sparkles, Send, Pencil, Settings, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from '../../common';
import Button from '../../ui/Button';
import type { FreelancerData } from '@/types/freelancer';
import { useTranslation } from '../../../i18n';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';

interface ProfileHeaderProps {
    freelancer: FreelancerData;
    onContact: () => void;
    onMessage: () => void;
    onPlayVoice: () => void;
    isPlayingVoice: boolean;
}

function RatingStars({ rating }: { rating: number }) {
    const roundedRating = Math.round(Number(rating) || 0);

    return (
        <div className="flex items-center gap-0.5" aria-hidden>
            {[...Array(5)].map((_, index) => (
                <Star
                    key={index}
                    className={`h-4 w-4 ${index < roundedRating ? 'fill-current' : ''}`}
                    style={{ color: index < roundedRating ? '#F59E0B' : 'rgba(255,255,255,0.2)' }}
                />
            ))}
        </div>
    );
}

export default function ProfileHeader({ freelancer, onContact, onMessage, onPlayVoice, isPlayingVoice }: ProfileHeaderProps) {
    const { tx } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isOwnProfile = user?.id === freelancer.id || user?.id === (freelancer as any).profile?.id;
    const accent = isOwnProfile ? '#8B5CF6' : '#F59E0B';
    const profileStrength = Math.max(0, Math.min(100, freelancer.stats.success_rate || 0));

    const strengthColor = profileStrength <= 30
        ? '#f87171'
        : profileStrength <= 70
            ? '#F59E0B'
            : '#34d399';

    const heroAccent = isOwnProfile ? '#8B5CF6' : '#F59E0B';

    return (
        <div className="pt-8 pb-6">
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── Hero Card ── */}
                <div
                    className="relative overflow-hidden rounded-3xl bg-[var(--card-bg)] border border-white/7 p-7 md:p-9 lg:p-10 mb-7 shadow-[0_35px_80px_-55px_rgba(0,0,0,0.9)]"
                >
                    <div
                        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                        style={{ background: `linear-gradient(90deg, ${heroAccent} 0%, color-mix(in srgb, ${heroAccent} 65%, transparent) 45%, transparent 100%)` }}
                    />
                    <div className="pointer-events-none absolute -top-28 -left-16 w-72 h-72 rounded-full blur-3xl opacity-25"
                        style={{ background: `radial-gradient(circle, ${heroAccent} 0%, transparent 70%)` }} />
                    <div className="pointer-events-none absolute -bottom-24 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20"
                        style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 72%)' }} />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-10">

                        {/* Left: avatar + info */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-6 lg:gap-7">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div
                                    className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden"
                                    style={{
                                        boxShadow: `0 0 0 2px var(--card-bg), 0 0 0 8px color-mix(in srgb, ${heroAccent} 22%, transparent), 0 22px 42px -26px rgba(0,0,0,0.95)`,
                                        background: 'var(--card-bg)',
                                    }}
                                >
                                    {freelancer.avatar_url ? (
                                        <OptimizedImage src={freelancer.avatar_url} alt={freelancer.full_name}
                                            className="h-full w-full" imgClassName="h-full w-full object-cover" priority />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center"
                                            style={{ background: `color-mix(in srgb, ${heroAccent} 10%, var(--surface-bg))` }}>
                                            <User className="h-10 w-10" style={{ color: heroAccent }} />
                                        </div>
                                    )}
                                </div>
                                {/* availability dot */}
                                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2"
                                    style={{ boxShadow: '0 0 0 2px var(--card-bg)' }} />
                            </div>

                            {/* Name / title / tags */}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                                    {freelancer.full_name}
                                </h1>
                                <p className="text-base sm:text-lg font-medium mt-2 text-[var(--text-secondary)]">
                                    {freelancer.title || tx('auth.accountPanel.freelancerLabel', undefined, 'Freelancer')}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2.5">
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-full text-sm font-semibold px-3.5 py-1.5 border"
                                        style={{
                                            background: `color-mix(in srgb, ${heroAccent} 12%, transparent)`,
                                            color: heroAccent,
                                            borderColor: `color-mix(in srgb, ${heroAccent} 28%, transparent)`,
                                        }}
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {tx('auth.accountPanel.freelancerLabel', undefined, 'Freelancer')}
                                    </span>
                                    {freelancer.availability === 'available' && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full text-sm font-semibold px-3.5 py-1.5"
                                            style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                                            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-status-success)' }} />
                                            {tx('pages.freelancerProfile.available', undefined, 'Available')}
                                        </span>
                                    )}
                                </div>

                                {/* meta tags */}
                                <div className="mt-5 flex items-center gap-4 sm:gap-6 flex-wrap">
                                    <span className="inline-flex items-center gap-2 text-sm sm:text-base text-[var(--text-secondary)]">
                                        <MapPin className="w-4 h-4" style={{ color: '#F59E0B' }} />
                                        {freelancer.location}
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-sm sm:text-base text-[var(--text-secondary)]">
                                        <RatingStars rating={freelancer.stats.rating} />
                                        <span>
                                            {freelancer.stats.rating.toFixed(1)} · {freelancer.stats.reviews_count} {tx('pages.freelancerProfile.reviews', undefined, 'reviews')}
                                        </span>
                                    </span>
                                    <span className="inline-flex items-center gap-2 text-sm sm:text-base text-[var(--text-secondary)]">
                                        <CheckCircle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                                        {freelancer.stats.success_rate}% {tx('pages.freelancerProfile.successRate', undefined, 'success')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: action panel */}
                        <aside className="lg:w-[320px] shrink-0">
                            {isOwnProfile ? (
                                <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/8 p-6 sticky top-20 shadow-[0_22px_50px_-35px_rgba(0,0,0,0.95)]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)] mb-4 ps-3 border-s-2"
                                        style={{ borderColor: heroAccent }}>
                                        {tx('pages.freelancerProfile.manageProfile', undefined, 'Manage Profile')}
                                    </p>
                                    <button
                                        onClick={() => navigate(ROUTES.settingsProfile)}
                                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3.5 rounded-xl transition-all duration-200 text-black shadow-sm"
                                        style={{
                                            background: heroAccent,
                                            boxShadow: `0 14px 34px -22px ${heroAccent}`,
                                        }}
                                    >
                                        <Pencil className="h-3.5 w-3.5 shrink-0" />
                                        {tx('settings.editProfile', undefined, 'Edit Profile')}
                                    </button>
                                    <button onClick={() => navigate(ROUTES.freelancerPortfolio)}
                                        className="w-full flex items-center justify-center gap-2 mt-2 border border-white/10 text-[var(--text-secondary)] text-sm font-medium py-3 rounded-xl transition-all duration-200"
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = `color-mix(in srgb, ${heroAccent} 30%, transparent)`;
                                            e.currentTarget.style.background = `color-mix(in srgb, ${heroAccent} 5%, transparent)`;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                            e.currentTarget.style.background = 'transparent';
                                        }}>
                                        <Upload className="h-3.5 w-3.5 shrink-0" />
                                        {tx('pages.freelancerProfile.addPortfolio', undefined, 'Add Portfolio')}
                                    </button>
                                    <button onClick={() => navigate(ROUTES.settings)}
                                        className="w-full flex items-center justify-center gap-2 mt-1 text-[var(--text-muted)] text-sm py-2.5 rounded-xl transition-colors"
                                        onMouseEnter={e => {
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.color = 'var(--text-muted)';
                                        }}>
                                        <Settings className="h-3.5 w-3.5 shrink-0" />
                                        {tx('nav.settings', undefined, 'Settings')}
                                    </button>
                                    {/* profile strength */}
                                    <div className="border-t border-white/7 mt-4 pt-4">
                                        <div className="flex justify-between mb-1.5">
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {tx('pages.freelancerProfile.profileStrength', undefined, 'Profile strength')}
                                            </span>
                                            <span className="text-xs font-bold" style={{ color: strengthColor }}>
                                                {profileStrength}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden bg-white/10 mt-2">
                                            <div className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${profileStrength}%`,
                                                    background: `linear-gradient(90deg, ${heroAccent} 0%, color-mix(in srgb, ${heroAccent} 60%, transparent) 100%)`,
                                                }} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/8 p-6 shadow-[0_22px_50px_-35px_rgba(0,0,0,0.95)]">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4 ps-3 border-s-2"
                                        style={{ borderColor: '#F59E0B' }}>
                                        {tx('pages.searchModal.quickActions', undefined, "Let's Connect")}
                                    </p>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={onContact}
                                        className="w-full justify-center text-black font-semibold py-3.5"
                                        style={{ background: '#F59E0B' }}
                                    >
                                        {tx('pages.freelancerProfile.hireNow', undefined, 'Hire Now')}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={onMessage}
                                        leftIcon={<Send className="h-3.5 w-3.5" />} className="w-full justify-center py-3">
                                        {tx('pages.freelancerProfile.message', undefined, 'Send Message')}
                                    </Button>
                                    {freelancer.voice_intro_url && (
                                        <button onClick={onPlayVoice}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg border text-sm font-medium transition-colors"
                                            style={{
                                                borderColor: isPlayingVoice ? '#F59E0B' : 'var(--color-border-default)',
                                                background: isPlayingVoice ? 'rgba(245,158,11,0.08)' : 'var(--color-background-elevated)',
                                                color: isPlayingVoice ? '#F59E0B' : 'var(--color-text-secondary)',
                                            }}>
                                            {isPlayingVoice
                                                ? <><Pause className="h-3.5 w-3.5" /> {tx('ui.playing')}</>
                                                : <><Volume2 className="h-3.5 w-3.5" /> {tx('pages.freelancerProfile.hearVoice', undefined, 'Voice intro')}</>}
                                        </button>
                                    )}
                                </div>
                            )}
                        </aside>
                    </div>
                </div>

                {/* ── Stats row ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                        { icon: BriefcaseBusiness, value: freelancer.stats.jobs_completed, label: tx('pages.freelancerProfile.completedJobs', undefined, 'Completed') },
                        { icon: Wallet, value: `${freelancer.stats.total_earnings.toLocaleString()} TND`, label: tx('pages.freelancerProfile.totalEarnings', undefined, 'Earned') },
                        { icon: Clock3, value: `${freelancer.stats.response_time_hours}h`, label: tx('pages.freelancerProfile.responseSpeed', undefined, 'Response'), fast: true },
                        { icon: Wallet, value: `${freelancer.hourly_rate} TND/h`, label: tx('findFreelancers.hourlyRate', undefined, 'Rate') },
                    ].map(({ icon: Icon, value, label, fast }) => (
                        <div
                            key={label}
                            className="bg-[var(--card-bg)] rounded-2xl border border-white/7 p-5 md:p-6 transition-all duration-200 min-h-[132px]"
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = 'rgba(245,158,11,0.24)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                                e.currentTarget.style.transform = 'translateY(0px)';
                            }}
                        >
                            <div className="w-10 h-10 p-2 rounded-xl mb-3 flex items-center justify-center bg-[#F59E0B]/10 text-[#F59E0B]">
                                <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-2xl md:text-[28px] leading-none font-black text-[var(--text-primary)]">
                                {value}
                                {fast ? <span className="ml-1.5 text-xs text-emerald-400 font-semibold align-middle">Fast</span> : null}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-2 font-medium tracking-wide uppercase">{label}</p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

