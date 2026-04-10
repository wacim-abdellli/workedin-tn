import { Star, MapPin, CheckCircle, Pause, Volume2, User, Wallet, Clock3, BriefcaseBusiness, Sparkles, Send, Pencil, Settings, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

export default function ProfileHeader({ freelancer, onContact, onMessage, onPlayVoice, isPlayingVoice }: ProfileHeaderProps) {
    const { tx } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isOwnProfile = user?.id === freelancer.id || user?.id === (freelancer as any).profile?.id;

    const availColor = freelancer.availability === 'available'
        ? 'var(--color-status-success)'
        : freelancer.availability === 'busy'
        ? 'var(--color-status-warning)'
        : 'var(--color-text-disabled)';

    return (
        <div className="pt-6 pb-4">
            <div className="container-custom">

                {/* ── Hero Card ── */}
                <div className="rounded-2xl border p-6 sm:p-8 mb-4 relative overflow-hidden"
                    style={{ background: 'var(--color-background-elevated)', borderColor: 'var(--color-border-subtle)' }}>
                    {/* top accent */}
                    <div className="absolute inset-x-0 top-0 h-0.5"
                        style={{ background: 'var(--workspace-primary)' }} />

                    <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">

                        {/* Left: avatar + info */}
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-start gap-5">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-2"
                                    style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 30%, var(--color-border-subtle))' }}>
                                    {freelancer.avatar_url ? (
                                        <OptimizedImage src={freelancer.avatar_url} alt={freelancer.full_name}
                                            className="h-full w-full" imgClassName="h-full w-full object-cover" priority />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center"
                                            style={{ background: 'color-mix(in srgb, var(--workspace-primary) 8%, var(--color-background-subtle))' }}>
                                            <User className="h-9 w-9" style={{ color: 'var(--workspace-primary)' }} />
                                        </div>
                                    )}
                                </div>
                                {/* availability dot */}
                                <span className="absolute -bottom-1 -end-1 h-4 w-4 rounded-full border-2"
                                    style={{ background: availColor, borderColor: 'var(--color-background-elevated)' }} />
                            </div>

                            {/* Name / title / tags */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
                                        style={{ background: 'var(--workspace-primary)' }}>
                                        <Sparkles className="h-2.5 w-2.5" />
                                        {tx('auth.accountPanel.freelancerLabel', undefined, 'Freelancer')}
                                    </span>
                                    {freelancer.availability === 'available' && (
                                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                            style={{ background: 'color-mix(in srgb, var(--color-status-success) 10%, transparent)', color: 'var(--color-status-success)', border: '1px solid color-mix(in srgb, var(--color-status-success) 25%, transparent)' }}>
                                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-status-success)' }} />
                                            {tx('pages.freelancerProfile.available', undefined, 'Available')}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight"
                                    style={{ color: 'var(--color-text-primary)' }}>
                                    {freelancer.full_name}
                                </h1>
                                <p className="text-sm font-medium mt-0.5"
                                    style={{ color: 'var(--workspace-primary)' }}>
                                    {freelancer.title || tx('auth.accountPanel.freelancerLabel', undefined, 'Freelancer')}
                                </p>

                                {/* meta tags */}
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border"
                                        style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-subtle)', color: 'var(--color-text-secondary)' }}>
                                        <MapPin className="h-3 w-3" style={{ color: 'var(--color-status-warning)' }} />
                                        {freelancer.location}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border"
                                        style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-subtle)', color: 'var(--color-text-secondary)' }}>
                                        <Star className="h-3 w-3 fill-current" style={{ color: 'var(--color-status-warning)' }} />
                                        {freelancer.stats.rating} · {freelancer.stats.reviews_count} {tx('pages.freelancerProfile.reviews', undefined, 'reviews')}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border"
                                        style={{ borderColor: 'color-mix(in srgb, var(--color-status-success) 20%, var(--color-border-subtle))', background: 'color-mix(in srgb, var(--color-status-success) 6%, var(--color-background-subtle))', color: 'var(--color-status-success)' }}>
                                        <CheckCircle className="h-3 w-3" />
                                        {freelancer.stats.success_rate}% {tx('pages.freelancerProfile.successRate', undefined, 'success')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: action panel */}
                        <aside className="mt-5 lg:mt-0 lg:w-64 shrink-0">
                            {isOwnProfile ? (
                                <div className="rounded-xl border p-4 space-y-2"
                                    style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-subtle)' }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                                        style={{ color: 'var(--workspace-primary)' }}>
                                        {tx('pages.freelancerProfile.manageProfile', undefined, 'Manage Profile')}
                                    </p>
                                    <button onClick={() => navigate('/settings?tab=profile')}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                        style={{ background: 'var(--workspace-primary)' }}>
                                        <Pencil className="h-3.5 w-3.5 shrink-0" />
                                        {tx('settings.editProfile', undefined, 'Edit Profile')}
                                    </button>
                                    <button onClick={() => navigate('/portfolio')}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                                        style={{ borderColor: 'var(--color-border-default)', background: 'var(--color-background-elevated)', color: 'var(--color-text-primary)' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--workspace-primary)'; e.currentTarget.style.color = 'var(--workspace-primary)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}>
                                        <Upload className="h-3.5 w-3.5 shrink-0" />
                                        {tx('pages.freelancerProfile.addPortfolio', undefined, 'Add Portfolio')}
                                    </button>
                                    <button onClick={() => navigate('/settings')}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors"
                                        style={{ borderColor: 'var(--color-border-subtle)', background: 'transparent', color: 'var(--color-text-tertiary)' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-tertiary)'; }}>
                                        <Settings className="h-3.5 w-3.5 shrink-0" />
                                        {tx('nav.settings', undefined, 'Settings')}
                                    </button>
                                    {/* profile strength */}
                                    <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                                        <div className="flex justify-between mb-1.5">
                                            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                                {tx('pages.freelancerProfile.profileStrength', undefined, 'Profile strength')}
                                            </span>
                                            <span className="text-xs font-bold" style={{ color: 'var(--workspace-primary)' }}>
                                                {freelancer.stats.success_rate || 0}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border-subtle)' }}>
                                            <div className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${freelancer.stats.success_rate || 0}%`, background: 'var(--workspace-primary)' }} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border p-4 space-y-2"
                                    style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-background-subtle)' }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                                        style={{ color: 'var(--workspace-primary)' }}>
                                        {tx('pages.searchModal.quickActions', undefined, "Let's Connect")}
                                    </p>
                                    <Button variant="primary" size="sm" onClick={onContact} className="w-full justify-center">
                                        {tx('pages.freelancerProfile.hireNow', undefined, 'Hire Now')}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={onMessage}
                                        leftIcon={<Send className="h-3.5 w-3.5" />} className="w-full justify-center">
                                        {tx('pages.freelancerProfile.message', undefined, 'Send Message')}
                                    </Button>
                                    {freelancer.voice_intro_url && (
                                        <button onClick={onPlayVoice}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
                                            style={{
                                                borderColor: isPlayingVoice ? 'var(--workspace-primary)' : 'var(--color-border-default)',
                                                background: isPlayingVoice ? 'color-mix(in srgb, var(--workspace-primary) 8%, var(--color-background-elevated))' : 'var(--color-background-elevated)',
                                                color: isPlayingVoice ? 'var(--workspace-primary)' : 'var(--color-text-secondary)',
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { icon: BriefcaseBusiness, value: freelancer.stats.jobs_completed, label: tx('pages.freelancerProfile.completedJobs', undefined, 'Completed') },
                        { icon: Wallet, value: `${freelancer.stats.total_earnings.toLocaleString()} TND`, label: tx('pages.freelancerProfile.totalEarnings', undefined, 'Earned') },
                        { icon: Clock3, value: `${freelancer.stats.response_time_hours}h`, label: tx('pages.freelancerProfile.responseSpeed', undefined, 'Response') },
                        { icon: Wallet, value: `${freelancer.hourly_rate} TND/h`, label: tx('findFreelancers.hourlyRate', undefined, 'Rate') },
                    ].map(({ icon: Icon, value, label }) => (
                        <div key={label} className="rounded-xl border p-4"
                            style={{ background: 'var(--color-background-elevated)', borderColor: 'var(--color-border-subtle)' }}>
                            <div className="p-1.5 rounded-lg w-fit mb-2"
                                style={{ background: 'color-mix(in srgb, var(--workspace-primary) 10%, transparent)' }}>
                                <Icon className="h-4 w-4" style={{ color: 'var(--workspace-primary)' }} />
                            </div>
                            <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
                            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
