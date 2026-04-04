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
        <div className="relative pb-8">
            {/* Massive Hero Cover */}
            <div className="relative overflow-hidden border-b border-border/10 bg-gradient-to-tr from-indigo-950 via-purple-900 to-amber-600 dark:from-indigo-950 dark:via-[#0F081C] dark:to-orange-900">
                <div className="absolute inset-0 bg-[135deg,rgba(88,49,211,0.4),rgba(59,130,246,0.4)] mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {freelancer.cover_url ? (
                    <OptimizedImage
                        src={freelancer.cover_url}
                        alt="Cover"
                        className="absolute inset-0 h-full w-full mix-blend-overlay"
                        imgClassName="h-full w-full object-cover opacity-60 transition-transform duration-1000 hover:scale-105"
                        priority={true}
                    />
                ) : null}
                <div className="relative h-[320px] sm:h-[400px] w-full" />
            </div>

            {/* Content Container Overlapping */}
            <div className="container-custom relative z-10">
                <div className="-mt-32 sm:-mt-40 mb-10 rounded-[2.5rem] border border-white/40 bg-white/70 backdrop-blur-3xl px-6 pb-8 pt-8 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.15)] dark:border-white/10 dark:bg-[#120F1A]/80 sm:px-10 lg:px-12">
                    
                    <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12">
                        
                        {/* Main Profile Info */}
                        <div className="flex-1">
                            <div className="flex flex-col items-center sm:flex-row sm:items-end gap-6 sm:gap-8">
                                {/* Avatar */}
                                <div className="relative -mt-16 sm:-mt-20 group">
                                    <div className="relative flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center overflow-hidden rounded-full border-[6px] border-white/60 bg-white shadow-2xl backdrop-blur-xl transition hover:scale-105 dark:border-[#120F1A]/60 dark:bg-[#1C1827]">
                                        {freelancer.avatar_url ? (
                                            <OptimizedImage
                                                src={freelancer.avatar_url}
                                                alt={freelancer.full_name}
                                                className="h-full w-full"
                                                imgClassName="h-full w-full object-cover"
                                                priority={true}
                                            />
                                        ) : (
                                            <User className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                                        )}
                                    </div>
                                    
                                    {/* Availability Dot */}
                                    <span 
                                        className={`absolute bottom-4 end-4 h-6 w-6 sm:h-8 sm:w-8 rounded-full border-[4px] border-white dark:border-[#120F1A] shadow-lg ${
                                            freelancer.availability === 'available' ? 'bg-emerald-500' : freelancer.availability === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                                        }`}
                                        title={freelancer.availability}
                                    />
                                </div>

                                <div className="text-center sm:text-start sm:pb-3 flex-1">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-700 backdrop-blur-md dark:bg-purple-500/20 dark:text-purple-300">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {tx('auth.accountPanel.freelancerLabel', undefined, 'Freelancer')}
                                    </div>
                                    <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
                                        {freelancer.full_name}
                                    </h1>
                                    <p className="mt-2 text-xl font-medium text-purple-600 dark:text-purple-400">
                                        {freelancer.title || tx('auth.accountPanel.freelancerLabel', undefined, 'Freelancer')}
                                    </p>
                                </div>
                            </div>

                            {/* Tags Section */}
                            <div className="mt-8 flex flex-wrap justify-center sm:justify-start gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-md dark:bg-white/5 dark:text-slate-300">
                                    <MapPin className="h-4 w-4 text-rose-500" />
                                    {freelancer.location}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50/80 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm backdrop-blur-md dark:bg-amber-500/10 dark:text-amber-400">
                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                    {freelancer.stats.rating} • {tx('pages.freelancerProfile.reviewsCount', { count: freelancer.stats.reviews_count }, `${freelancer.stats.reviews_count} reviews`)}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50/80 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur-md dark:bg-emerald-500/10 dark:text-emerald-400">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    {freelancer.stats.success_rate}% {tx('pages.freelancerProfile.successRate', undefined, 'success')}
                                </span>
                            </div>

                            {/* Bio */}
                            <div className="mt-8 rounded-2xl bg-white/40 p-6 shadow-sm backdrop-blur-md dark:bg-white/5 sm:p-8 border border-white/50 dark:border-white/10">
                                <p className="text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300 italic font-medium">
                                    "{freelancer.bio || tx('settings.noBio', undefined, 'No bio added yet')}"
                                </p>
                            </div>
                        </div>

                        {/* Quick Actions Sidebar */}
                        <aside className="mt-10 w-full lg:mt-0 lg:w-[340px] flex-shrink-0">
                            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-xl dark:from-[#1c1827] dark:to-[#231d33] border border-white/50 dark:border-white/5">
                                <div className="relative z-10">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-900/60 dark:text-indigo-300/60 mb-5">
                                        {tx('pages.searchModal.quickActions', undefined, 'Let\'s Connect')}
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        {!isOwnProfile && (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    size="lg"
                                                    onClick={onContact}
                                                    className="w-full h-14 rounded-2xl text-base shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all font-bold"
                                                >
                                                    {tx('pages.freelancerProfile.hireNow', undefined, 'Hire Me Now')}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    onClick={onMessage}
                                                    leftIcon={<Send className="h-5 w-5" />}
                                                    className="w-full h-14 rounded-2xl text-base border-2 hover:bg-indigo-100 dark:hover:bg-white/10 font-bold"
                                                >
                                                    {tx('pages.freelancerProfile.message', undefined, 'Send Message')}
                                                </Button>
                                            </>
                                        )}
                                        
                                        {freelancer.voice_intro_url ? (
                                            <button
                                                onClick={onPlayVoice}
                                                className={`group flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 text-base font-bold transition-all ${
                                                    isPlayingVoice 
                                                        ? 'border-purple-600 bg-purple-100 text-purple-700 shadow-inner dark:border-purple-500 dark:bg-purple-900/30 dark:text-purple-300' 
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:bg-slate-50 dark:border-white/10 dark:bg-[#120f1a] dark:text-slate-200 dark:hover:bg-white/5'
                                                }`}
                                            >
                                                {isPlayingVoice ? (
                                                    <span className="flex items-center gap-2">
                                                        <Pause className="h-5 w-5 animate-pulse" /> 
                                                        Playing...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                        <Volume2 className="h-5 w-5" />
                                                        Hear my Voice
                                                    </span>
                                                )}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>

                    {/* Stats Grid Bento Box underneath */}
                    <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
                        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-1 dark:bg-[#1a1725] dark:border-white/5">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-50 transition-transform group-hover:scale-150 dark:bg-blue-900/20" />
                            <div className="relative">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                    <BriefcaseBusiness className="h-6 w-6" />
                                </div>
                                <p className="text-4xl font-black text-slate-900 dark:text-white drop-shadow-sm">{freelancer.stats.jobs_completed}</p>
                                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tx('pages.freelancerProfile.completedJobs', undefined, 'Completed')}</p>
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-1 dark:bg-[#1a1725] dark:border-white/5">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-50 transition-transform group-hover:scale-150 dark:bg-emerald-900/20" />
                            <div className="relative">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <p className="text-4xl font-black text-slate-900 dark:text-white drop-shadow-sm">{freelancer.stats.total_earnings.toLocaleString()}</p>
                                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tx('pages.freelancerProfile.totalEarnings', undefined, 'Earned TND')}</p>
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-1 dark:bg-[#1a1725] dark:border-white/5">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-50 transofrm-transform group-hover:scale-150 dark:bg-amber-900/20" />
                            <div className="relative">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                    <Clock3 className="h-6 w-6" />
                                </div>
                                <p className="text-4xl font-black text-slate-900 dark:text-white drop-shadow-sm">{freelancer.stats.response_time_hours}h</p>
                                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tx('pages.freelancerProfile.responseSpeed', undefined, 'Response Time')}</p>
                            </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-1 dark:bg-[#1a1725] dark:border-white/5">
                            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-50 transition-transform group-hover:scale-150 dark:bg-purple-900/20" />
                            <div className="relative">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <p className="text-4xl font-black text-slate-900 dark:text-white drop-shadow-sm">{freelancer.hourly_rate}</p>
                                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tx('findFreelancers.hourlyRate', undefined, 'Rate / Hr')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
