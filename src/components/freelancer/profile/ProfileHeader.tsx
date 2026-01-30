import { Star, MapPin, CheckCircle, MessageSquare, Pause, Volume2, User } from 'lucide-react';
import { OptimizedImage } from '../../common';
import Button from '../../ui/Button';
import type { FreelancerData } from '@/types/freelancer';

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
    return (
        <>
            {/* Cover Photo */}
            <div className="h-64 bg-gradient-to-r from-primary-800 to-primary-600 relative overflow-hidden">
                {freelancer.cover_url && (
                    <OptimizedImage
                        src={freelancer.cover_url}
                        alt="Cover"
                        className="w-full h-full"
                        imgClassName="object-cover opacity-50"
                        priority={true}
                    />
                )}
                <div className="absolute inset-0 bg-black/20" />
            </div>

            <div className="container-custom relative">
                {/* Header Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 -mt-20 mb-8 relative z-10">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0 relative mx-auto md:mx-0 -mt-16 md:-mt-10">
                            <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-md bg-white overflow-hidden">
                                {freelancer.avatar_url ? (
                                    <OptimizedImage
                                        src={freelancer.avatar_url}
                                        alt={freelancer.full_name}
                                        className="w-full h-full"
                                        imgClassName="object-cover"
                                        priority={true}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                        <User className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className={`absolute bottom-2 end-2 w-4 h-4 rounded-full border-2 border-white ${freelancer.availability === 'available' ? 'bg-green-500' :
                                freelancer.availability === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
                                }`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-start pt-2 md:pt-0">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{freelancer.full_name}</h1>
                                    <p className="text-lg text-primary-600 font-medium mb-3">{freelancer.title || 'مستقل'}</p>

                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 mb-4">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {freelancer.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                            {freelancer.stats.rating} ({freelancer.stats.reviews_count} تقييم)
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            {freelancer.stats.success_rate}% نجاح
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={onContact}
                                    >
                                        توظيف الآن
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={onMessage}
                                        leftIcon={<MessageSquare className="w-4 h-4" />}
                                    >
                                        مراسلة
                                    </Button>
                                    {/* Voice Intro Button */}
                                    {freelancer.voice_intro_url && (
                                        <button
                                            onClick={onPlayVoice}
                                            className={`
                                                flex items-center justify-center w-10 h-10 rounded-xl border transition-all
                                                ${isPlayingVoice
                                                    ? 'border-primary-600 text-primary-600 bg-primary-50'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {isPlayingVoice ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
                        <div className="text-center md:text-start px-4 border-e border-gray-100 last:border-0 md:last:border-0">
                            <p className="text-2xl font-bold text-gray-900">{freelancer.stats.jobs_completed}</p>
                            <p className="text-sm text-muted">مهمة منجزة</p>
                        </div>
                        <div className="text-center md:text-start px-4 border-e border-gray-100 last:border-0 md:last:border-0">
                            <p className="text-2xl font-bold text-gray-900">{freelancer.stats.total_earnings.toLocaleString()} د.ت</p>
                            <p className="text-sm text-muted">إجمالي الأرباح</p>
                        </div>
                        <div className="text-center md:text-start px-4 border-e border-gray-100 last:border-0 md:last:border-0">
                            <p className="text-2xl font-bold text-gray-900">{freelancer.stats.response_time_hours} س</p>
                            <p className="text-sm text-muted">سرعة الرد</p>
                        </div>
                        <div className="text-center md:text-start px-4">
                            <p className="text-2xl font-bold text-gray-900">{freelancer.hourly_rate} د.ت</p>
                            <p className="text-sm text-muted">سعر الساعة</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
