import { Star, MapPin, CheckCircle, Pause, Volume2, User, Wallet, Clock3, BriefcaseBusiness, Sparkles, Send, Pencil, Settings, Eye, Upload, TrendingUp } from 'lucide-react';
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

export default function ProfileHeader({
    freelancer,
    onContact,
    onMessage,
    onPlayVoice,
    isPlayingVoice
}: ProfileHeaderProps) {
    const { tx } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isOwnProfile = user?.id === freelancer.id || user?.id === (freelancer as any).profile?.id;

    return (
        <div className="relative pb-8 pt-12 md:pt-20 overflow-hidden sm:overflow-visible">
            {/* Vibrant Ambient Mesh Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] -z-10 opacity-50 dark:opacity-30 pointer-events-none">
                <div className="absolute top-[-15%] left-[10%] w-[45%] h-[80%] rounded-full bg-[var(--workspace-primary)] blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute top-[15%] right-[10%] w-[40%] h-[70%] rounded-full bg-[var(--workspace-accent)] blur-[120px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
                <div className="absolute bottom-[10%] left-[40%] w-[30%] h-[50%] rounded-full bg-[color-mix(in_srgb,var(--workspace-primary)_70%,var(--workspace-accent)_30%)] blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
            </div>

            <div className="container-custom relative z-10">
                {/* Main Profile Card - Premium Glassmorphic Design */}
                <div className="mb-8 rounded-[2rem] border-2 bg-[var(--color-background-elevated)]/90 backdrop-blur-3xl p-6 shadow-2xl sm:p-10 lg:p-12 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_20px_60px_-15px_var(--workspace-primary-shadow)]" style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, var(--color-border-subtle))' }}>
                    {/* Animated gradient border glow */}
                    <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(135deg, var(--workspace-primary) 0%, transparent 50%, var(--workspace-accent) 100%)', filter: 'blur(20px)', transform: 'scale(1.02)' }} />
                    
                    {/* Top highlight with gradient */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--workspace-primary)] to-transparent opacity-60" />
                    
                    <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12">
                        
                        {/* Main Profile Info */}
                        <div className="flex-1">
                            <div className="flex flex-col items-start sm:flex-row sm:items-center gap-6 sm:gap-8">
                                {/* Avatar with Premium Ring */}
                                <div className="relative shrink-0 group/avatar">
                                    {/* Animated gradient ring */}
                                    <div className="absolute inset-0 rounded-full p-1 bg-gradient-to-br from-[var(--workspace-primary)] via-[var(--workspace-accent)] to-[var(--workspace-primary)] animate-spin" style={{ animationDuration: '3s' }}>
                                        <div className="w-full h-full rounded-full bg-[var(--color-background-elevated)]" />
                                    </div>
                                    <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--color-background-elevated)] bg-[var(--surface-bg)] shadow-xl transition-all duration-300 group-hover/avatar:scale-110 group-hover/avatar:shadow-2xl" style={{ boxShadow: '0 10px 40px -10px var(--workspace-primary-shadow)' }}>
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
                                    
                                    {/* Availability Dot with Pulse */}
                                    <span 
                                        className={`absolute bottom-2 end-2 h-6 w-6 rounded-full border-4 border-[var(--color-background-elevated)] shadow-lg ${
                                            freelancer.availability === 'available' ? 'bg-emerald-500 animate-pulse' : freelancer.availability === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                                        }`}
                                        title={freelancer.availability}
                                        style={{ animationDuration: '2s' }}
                                    >
                                        {freelancer.availability === 'available' && (
                                            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" style={{ animationDuration: '2s' }} />
                                        )}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    <div className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl" style={{ background: 'linear-gradient(135deg, var(--workspace-primary), var(--workspace-accent))', boxShadow: '0 4px 15px -3px var(--workspace-primary-shadow)' }}>
                                        <Sparkles className="h-3.5 w-3.5 animate-pulse" style={{ animationDuration: '2s' }} />
                                        {tx('auth.accountPanel.freelancerLabel', undefined, 'Freelancer')}
                                    </div>
                                    <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--workspace-primary)] bg-clip-text text-transparent">
                                        {freelancer.full_name}
                                    </h1>
                                    <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--workspace-primary)' }}>
                                        {freelancer.title || tx('auth.accountPanel.freelancerLabel', undefined, 'Freelancer')}
                                    </p>
                                </div>
                            </div>

                            {/* Premium Tags Section */}
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg" style={{ borderColor: 'color-mix(in srgb, var(--color-status-warning) 30%, transparent)', background: 'color-mix(in srgb, var(--color-status-warning) 8%, var(--color-background-elevated))', color: 'var(--color-text-primary)' }}>
                                    <MapPin className="h-4 w-4 shrink-0 text-amber-500" />
                                    {freelancer.location}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg" style={{ borderColor: 'color-mix(in srgb, var(--color-status-warning) 30%, transparent)', background: 'color-mix(in srgb, var(--color-status-warning) 8%, var(--color-background-elevated))', color: 'var(--color-text-primary)' }}>
                                    <Star className="h-4 w-4 shrink-0 text-amber-500 fill-amber-500" />
                                    {freelancer.stats.rating} • {tx('pages.freelancerProfile.reviewsCount', { count: freelancer.stats.reviews_count }, `${freelancer.stats.reviews_count} reviews`)}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg" style={{ borderColor: 'color-mix(in srgb, var(--color-status-success) 30%, transparent)', background: 'color-mix(in srgb, var(--color-status-success) 8%, var(--color-background-elevated))', color: 'var(--color-text-primary)' }}>
                                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                                    {freelancer.stats.success_rate}% {tx('pages.freelancerProfile.successRate', undefined, 'success')}
                                </span>
                            </div>
                        </div>

                        {/* Quick Actions Sidebar */}
                        <aside className="mt-8 w-full lg:mt-0 lg:w-[320px] shrink-0">
                            <div className="rounded-2xl p-6 border-2 backdrop-blur-sm transition-all duration-300 hover:shadow-xl" style={{ background: 'color-mix(in srgb, var(--color-background-elevated) 95%, var(--workspace-primary) 5%)', borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, var(--color-border-subtle))', boxShadow: '0 8px 30px -8px var(--workspace-primary-shadow)' }}>

                                {isOwnProfile ? (
                                    /* ── OWNER VIEW ── */
                                    <>
                                        <div className="flex items-center gap-2 mb-5">
                                            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, var(--workspace-primary), var(--workspace-accent))' }}>
                                                <Pencil className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <h3 className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-[var(--workspace-primary)] to-[var(--workspace-accent)] bg-clip-text text-transparent">
                                                {tx('pages.freelancerProfile.manageProfile', undefined, 'Manage Profile')}
                                            </h3>
                                        </div>

                                        <div className="space-y-2.5">
                                            {/* Edit Profile */}
                                            <button
                                                onClick={() => navigate('/settings?tab=profile')}
                                                className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                                                style={{ background: 'linear-gradient(135deg, var(--workspace-primary), var(--workspace-accent))', borderColor: 'transparent', color: '#fff', boxShadow: '0 4px 15px -4px var(--workspace-primary-shadow)' }}
                                            >
                                                <Pencil className="h-4 w-4 shrink-0" />
                                                <span className="flex-1 text-left">{tx('settings.editProfile', undefined, 'Edit Profile')}</span>
                                            </button>

                                            {/* Upload Portfolio */}
                                            <button
                                                onClick={() => navigate('/portfolio')}
                                                className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                                                style={{ borderColor: 'color-mix(in srgb, #10b981 30%, var(--color-border-subtle))', background: 'color-mix(in srgb, #10b981 8%, var(--color-background-elevated))', color: '#10b981' }}
                                            >
                                                <Upload className="h-4 w-4 shrink-0" />
                                                <span className="flex-1 text-left">{tx('pages.freelancerProfile.addPortfolio', undefined, 'Add Portfolio Work')}</span>
                                            </button>

                                            {/* View as visitor */}
                                            <button
                                                onClick={() => window.open(window.location.href, '_blank')}
                                                className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                                                style={{ borderColor: 'color-mix(in srgb, #3b82f6 30%, var(--color-border-subtle))', background: 'color-mix(in srgb, #3b82f6 8%, var(--color-background-elevated))', color: '#3b82f6' }}
                                            >
                                                <Eye className="h-4 w-4 shrink-0" />
                                                <span className="flex-1 text-left">{tx('pages.freelancerProfile.previewProfile', undefined, 'Preview as Visitor')}</span>
                                            </button>

                                            {/* Settings */}
                                            <button
                                                onClick={() => navigate('/settings')}
                                                className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                                                style={{ borderColor: 'color-mix(in srgb, var(--color-text-tertiary) 20%, var(--color-border-subtle))', background: 'var(--color-background-subtle)', color: 'var(--color-text-secondary)' }}
                                            >
                                                <Settings className="h-4 w-4 shrink-0" />
                                                <span className="flex-1 text-left">{tx('nav.settings', undefined, 'Settings')}</span>
                                            </button>
                                        </div>

                                        {/* Profile strength hint */}
                                        <div className="mt-5 pt-4 border-t-2" style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 15%, var(--color-border-subtle))' }}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="h-3.5 w-3.5" style={{ color: 'var(--workspace-primary)' }} />
                                                <span className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {tx('pages.freelancerProfile.profileStrength', undefined, 'Profile strength')}
                                                </span>
                                                <span className="ms-auto text-xs font-bold" style={{ color: 'var(--workspace-primary)' }}>
                                                    {freelancer.stats.success_rate || 0}%
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-background-muted)' }}>
                                                <div className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${freelancer.stats.success_rate || 0}%`, background: 'linear-gradient(90deg, var(--workspace-primary), var(--workspace-accent))' }} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* ── VISITOR VIEW ── */
                                    <>
                                        <h3 className="text-xs font-bold uppercase tracking-widest mb-5 bg-gradient-to-r from-[var(--workspace-primary)] to-[var(--workspace-accent)] bg-clip-text text-transparent">
                                            {tx('pages.searchModal.quickActions', undefined, "Let's Connect")}
                                        </h3>
                                        <div className="space-y-3">
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                onClick={onContact}
                                                className="w-full h-12 rounded-xl text-sm font-bold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl text-white border-0"
                                                style={{ background: 'linear-gradient(135deg, var(--workspace-primary), var(--workspace-accent))', boxShadow: '0 8px 25px -8px var(--workspace-primary-shadow)' }}
                                            >
                                                {tx('pages.freelancerProfile.hireNow', undefined, 'Hire Me Now')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={onMessage}
                                                leftIcon={<Send className="h-4 w-4" />}
                                                className="w-full h-12 rounded-xl text-sm font-bold border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                                style={{ borderColor: 'color-mix(in srgb, var(--workspace-primary) 30%, var(--color-border-subtle))', background: 'var(--color-background-elevated)', color: 'var(--workspace-primary)' }}
                                            >
                                                {tx('pages.freelancerProfile.message', undefined, 'Send Message')}
                                            </Button>

                                            {freelancer.voice_intro_url && (
                                                <button
                                                    onClick={onPlayVoice}
                                                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                                    style={{
                                                        borderColor: isPlayingVoice ? 'var(--workspace-primary)' : 'color-mix(in srgb, var(--workspace-primary) 20%, var(--color-border-subtle))',
                                                        background: isPlayingVoice ? 'color-mix(in srgb, var(--workspace-primary) 15%, var(--color-background-elevated))' : 'var(--color-background-elevated)',
                                                        color: isPlayingVoice ? 'var(--workspace-primary)' : 'var(--color-text-secondary)',
                                                    }}
                                                >
                                                    {isPlayingVoice
                                                        ? <><Pause className="h-4 w-4 animate-pulse" /> Playing...</>
                                                        : <><Volume2 className="h-4 w-4" /> {tx('pages.freelancerProfile.hearVoice', undefined, 'Hear my Voice')}</>
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>

                {/* Premium Stats Grid with Vibrant Colors */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
                    {/* Jobs Completed - Blue Theme */}
                    <div className="group rounded-3xl p-6 shadow-lg border-2 backdrop-blur-sm relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, #3b82f6 12%, var(--color-background-elevated)), var(--color-background-elevated))', borderColor: 'color-mix(in srgb, #3b82f6 25%, transparent)', boxShadow: '0 8px 25px -8px rgba(59, 130, 246, 0.3)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}>
                            <BriefcaseBusiness className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-4xl font-bold text-[var(--color-text-primary)] relative z-10 mb-1">{freelancer.stats.jobs_completed}</p>
                        <p className="text-xs font-bold uppercase tracking-wider relative z-10" style={{ color: '#3b82f6' }}>{tx('pages.freelancerProfile.completedJobs', undefined, 'Completed')}</p>
                    </div>

                    {/* Total Earnings - Green Theme */}
                    <div className="group rounded-3xl p-6 shadow-lg border-2 backdrop-blur-sm relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, #10b981 12%, var(--color-background-elevated)), var(--color-background-elevated))', borderColor: 'color-mix(in srgb, #10b981 25%, transparent)', boxShadow: '0 8px 25px -8px rgba(16, 185, 129, 0.3)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                            <Wallet className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-4xl font-bold text-[var(--color-text-primary)] relative z-10 mb-1">{freelancer.stats.total_earnings.toLocaleString()}</p>
                        <p className="text-xs font-bold uppercase tracking-wider relative z-10" style={{ color: '#10b981' }}>{tx('pages.freelancerProfile.totalEarnings', undefined, 'Earned TND')}</p>
                    </div>

                    {/* Response Time - Amber Theme */}
                    <div className="group rounded-3xl p-6 shadow-lg border-2 backdrop-blur-sm relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, #f59e0b 12%, var(--color-background-elevated)), var(--color-background-elevated))', borderColor: 'color-mix(in srgb, #f59e0b 25%, transparent)', boxShadow: '0 8px 25px -8px rgba(245, 158, 11, 0.3)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                            <Clock3 className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-4xl font-bold text-[var(--color-text-primary)] relative z-10 mb-1">{freelancer.stats.response_time_hours}h</p>
                        <p className="text-xs font-bold uppercase tracking-wider relative z-10" style={{ color: '#f59e0b' }}>{tx('pages.freelancerProfile.responseSpeed', undefined, 'Response Time')}</p>
                    </div>

                    {/* Hourly Rate - Purple Theme */}
                    <div className="group rounded-3xl p-6 shadow-lg border-2 backdrop-blur-sm relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--workspace-primary) 12%, var(--color-background-elevated)), var(--color-background-elevated))', borderColor: 'color-mix(in srgb, var(--workspace-primary) 25%, transparent)', boxShadow: '0 8px 25px -8px var(--workspace-primary-shadow)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" style={{ background: 'radial-gradient(circle, var(--workspace-primary) 0%, transparent 70%)' }} />
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" style={{ background: 'linear-gradient(135deg, var(--workspace-primary), var(--workspace-accent))' }}>
                            <Wallet className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-4xl font-bold text-[var(--color-text-primary)] relative z-10 mb-1">{freelancer.hourly_rate}</p>
                        <p className="text-xs font-bold uppercase tracking-wider relative z-10" style={{ color: 'var(--workspace-primary)' }}>{tx('findFreelancers.hourlyRate', undefined, 'Rate / Hr')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
