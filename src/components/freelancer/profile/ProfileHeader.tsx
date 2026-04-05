import { Star, MapPin, CheckCircle, Pause, Volume2, User, Wallet, Clock3, BriefcaseBusiness, Sparkles, Send } from 'lucide-react';
import { OptimizedImage } from '../../common';
import Button from '../../ui/Button';
import type { FreelancerData } from '@/types/freelancer';
import { useTranslation } from '../../../i18n';
import { useAuth } from '@/contexts/AuthContext';

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
    const { user } = useAuth();
    const isOwnProfile = user?.id === freelancer.id || user?.id === (freelancer as any).profile?.id;

    return (
        <div className="relative pb-8 pt-12 md:pt-20 overflow-hidden sm:overflow-visible">
            {/* Ambient Mesh Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] -z-10 opacity-40 dark:opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[15%] w-[40%] h-[70%] rounded-full bg-[var(--workspace-primary)] blur-[100px] mix-blend-normal sm:blur-[120px]" />
                <div className="absolute top-[20%] right-[15%] w-[35%] h-[60%] rounded-full bg-[color-mix(in_srgb,var(--workspace-primary)_60%,white)] blur-[100px] mix-blend-normal sm:blur-[120px]" />
            </div>

            <div className="container-custom relative z-10">
                {/* Main Profile Card (Glassmorphic) */}
                <div className="mb-8 rounded-[2rem] border border-[var(--border)] bg-white/80 dark:bg-[#1a1825]/70 backdrop-blur-3xl p-6 shadow-2xl shadow-[var(--workspace-primary)]/5 dark:shadow-[var(--workspace-primary)]/5 sm:p-10 lg:p-12 relative overflow-hidden group">
                    {/* Subtle inner top highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
                    
                    <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12">
                        
                        {/* Main Profile Info */}
                        <div className="flex-1">
                            <div className="flex flex-col items-start sm:flex-row sm:items-center gap-6 sm:gap-8">
                                {/* Avatar */}
                                <div className="relative shrink-0 group">
                                    <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface-bg)] shadow-sm transition hover:scale-105">
                                        {freelancer.avatar_url ? (
                                            <OptimizedImage
                                                src={freelancer.avatar_url}
                                                alt={freelancer.full_name}
                                                className="h-full w-full"
                                                imgClassName="h-full w-full object-cover"
                                                priority={true}
                                            />
                                        ) : (
                                            <User className="h-14 w-14 text-[var(--text-muted)]" />
                                        )}
                                    </div>
                                    
                                    {/* Availability Dot */}
                                    <span 
                                        className={`absolute bottom-2 end-2 h-6 w-6 rounded-full border-4 border-[var(--card-bg)] shadow-sm ${
                                            freelancer.availability === 'available' ? 'bg-emerald-500' : freelancer.availability === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                                        }`}
                                        title={freelancer.availability}
                                    />
                                </div>

                                <div className="flex-1">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--workspace-primary)_12%,transparent)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--workspace-primary)]">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {tx('auth.accountPanel.freelancerLabel', undefined, 'Freelancer')}
                                    </div>
                                    <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
                                        {freelancer.full_name}
                                    </h1>
                                    <p className="mt-1 text-lg font-medium text-[color-mix(in_srgb,var(--text-primary)_70%,var(--workspace-primary))]">
                                        {freelancer.title || tx('auth.accountPanel.freelancerLabel', undefined, 'Freelancer')}
                                    </p>
                                </div>
                            </div>

                            {/* Tags Section */}
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-bg)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)]">
                                    <MapPin className="h-4 w-4 shrink-0 text-amber-500" />
                                    {freelancer.location}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-bg)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)]">
                                    <Star className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />
                                    {freelancer.stats.rating} • {tx('pages.freelancerProfile.reviewsCount', { count: freelancer.stats.reviews_count }, `${freelancer.stats.reviews_count} reviews`)}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-bg)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)]">
                                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                                    {freelancer.stats.success_rate}% {tx('pages.freelancerProfile.successRate', undefined, 'success')}
                                </span>
                            </div>
                        </div>

                        {/* Quick Actions Sidebar */}
                        <aside className="mt-8 w-full lg:mt-0 lg:w-[320px] shrink-0">
                            <div className="rounded-2xl bg-[var(--surface-bg)] p-6 border border-[var(--border)]">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-5">
                                    {tx('pages.searchModal.quickActions', undefined, 'Let\'s Connect')}
                               </h3>
                                
                                <div className="space-y-3">
                                    {!isOwnProfile && (
                                        <>
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                onClick={onContact}
                                                className="w-full h-12 rounded-xl text-sm font-bold shadow-sm"
                                                style={{ background: 'var(--workspace-primary)', color: 'white', borderColor: 'var(--workspace-primary-hover)' }}
                                            >
                                                {tx('pages.freelancerProfile.hireNow', undefined, 'Hire Me Now')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={onMessage}
                                                leftIcon={<Send className="h-4 w-4" />}
                                                className="w-full h-12 rounded-xl text-sm font-bold border border-[var(--border-strong)] bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--surface-bg)]"
                                            >
                                                {tx('pages.freelancerProfile.message', undefined, 'Send Message')}
                                            </Button>
                                        </>
                                    )}
                                    
                                    {freelancer.voice_intro_url ? (
                                        <button
                                            onClick={onPlayVoice}
                                            className={`group flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-colors ${
                                                isPlayingVoice 
                                                    ? 'border border-[color-mix(in_srgb,var(--workspace-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--workspace-primary)_12%,transparent)] text-[var(--workspace-primary)]'
                                                    : 'border border-[var(--border-strong)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-primary)]'
                                            }`}
                                        >
                                            {isPlayingVoice ? (
                                                <span className="flex items-center gap-2">
                                                    <Pause className="h-4 w-4 animate-pulse" /> 
                                                    Playing...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <Volume2 className="h-4 w-4" />
                                                    Hear my Voice
                                                </span>
                                            )}
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>

                {/* Stats Grid Bento Box */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
                    <div className="group rounded-3xl bg-white/60 dark:bg-[#1c1a2e]/60 backdrop-blur-md p-6 shadow-sm border border-[var(--border)] transition-all hover:border-[var(--border-strong)] hover:shadow-lg relative overflow-hidden">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--info-600)_15%,transparent)] text-[var(--info-600)] transition-transform group-hover:scale-110">
                            <BriefcaseBusiness className="h-5 w-5" />
                        </div>
                        <p className="text-3xl font-bold text-[var(--text-primary)] relative z-10">{freelancer.stats.jobs_completed}</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider relative z-10">{tx('pages.freelancerProfile.completedJobs', undefined, 'Completed')}</p>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[var(--info-600)]/5 rounded-full blur-2xl group-hover:bg-[var(--info-600)]/10 transition-colors" />
                    </div>

                    <div className="group rounded-3xl bg-white/60 dark:bg-[#1c1a2e]/60 backdrop-blur-md p-6 shadow-sm border border-[var(--border)] transition-all hover:border-[var(--border-strong)] hover:shadow-lg relative overflow-hidden">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--success-600)_15%,transparent)] text-[var(--success-600)] transition-transform group-hover:scale-110">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <p className="text-3xl font-bold text-[var(--text-primary)] relative z-10">{freelancer.stats.total_earnings.toLocaleString()}</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider relative z-10">{tx('pages.freelancerProfile.totalEarnings', undefined, 'Earned TND')}</p>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[var(--success-600)]/5 rounded-full blur-2xl group-hover:bg-[var(--success-600)]/10 transition-colors" />
                    </div>

                    <div className="group rounded-3xl bg-white/60 dark:bg-[#1c1a2e]/60 backdrop-blur-md p-6 shadow-sm border border-[var(--border)] transition-all hover:border-[var(--border-strong)] hover:shadow-lg relative overflow-hidden">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--warning-600)_20%,transparent)] text-[var(--warning-600)] transition-transform group-hover:scale-110">
                            <Clock3 className="h-5 w-5" />
                        </div>
                        <p className="text-3xl font-bold text-[var(--text-primary)] relative z-10">{freelancer.stats.response_time_hours}h</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider relative z-10">{tx('pages.freelancerProfile.responseSpeed', undefined, 'Response Time')}</p>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[var(--warning-600)]/5 rounded-full blur-2xl group-hover:bg-[var(--warning-600)]/10 transition-colors" />
                    </div>

                    <div className="group rounded-3xl bg-white/60 dark:bg-[#1c1a2e]/60 backdrop-blur-md p-6 shadow-sm border border-[var(--border)] transition-all hover:border-[var(--border-strong)] hover:shadow-lg relative overflow-hidden">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--workspace-primary)_15%,transparent)] text-[var(--workspace-primary)] transition-transform group-hover:scale-110">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <p className="text-3xl font-bold text-[var(--text-primary)] relative z-10">{freelancer.hourly_rate}</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider relative z-10">{tx('findFreelancers.hourlyRate', undefined, 'Rate / Hr')}</p>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[var(--workspace-primary)]/5 rounded-full blur-2xl group-hover:bg-[var(--workspace-primary)]/10 transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
}
