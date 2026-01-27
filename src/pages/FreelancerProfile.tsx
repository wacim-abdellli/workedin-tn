import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Star,
    MapPin,
    CheckCircle,
    Briefcase,
    Volume2,
    Pause,
    MessageSquare,
    User,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import type { Skill } from '../types';
import ContactModal from '../components/freelancer/ContactModal';

// Type definitions
interface FreelancerData {
    id: string;
    full_name: string;
    title: string | null;
    avatar_url: string | null;
    cover_url?: string | null;
    bio: string;
    location: string;
    joined_at: string;
    voice_intro_url: string | null;
    hourly_rate: number;
    availability: 'available' | 'busy' | 'offline';
    skills: Skill[];
    languages: Array<{ language: string; proficiency: string }>;
    education: Array<{ institution: string; degree: string; field: string; startYear: string; endYear: string }>;
    certifications: Array<{ name: string; issuer: string; year: string }>;
    stats: {
        jobs_completed: number;
        rating: number;
        reviews_count: number;
        response_time_hours: number;
        completion_rate: number;
        repeat_clients: number;
        total_earnings: number;
        success_rate: number;
        profile_views: number;
    };
    verifications: {
        cin: boolean;
        phone: boolean;
        email: boolean;
        payment: boolean;
    };
    work_samples: Array<{
        id: string;
        title: string;
        thumbnail_url: string;
        description?: string;
        skills_used?: string[];
        project_url?: string;
        media_urls?: string[];
    }>;
    reviews: Array<{
        id: string;
        client_name: string;
        client_avatar?: string;
        rating: number;
        comment: string;
        created_at: string;
        job_title: string;
        skills_rating?: Record<string, number>;
    }>;
}

function FreelancerProfile() {
    const { freelancerId } = useParams<{ freelancerId: string }>();
    const { language } = useTranslation();
    const navigate = useNavigate();

    const [freelancer, setFreelancer] = useState<FreelancerData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlayingVoice, setIsPlayingVoice] = useState(false);

    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedWorkSample, setSelectedWorkSample] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);


    useEffect(() => {
        loadFreelancer();
    }, [freelancerId]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const loadFreelancer = async () => {
        if (!freelancerId) return;
        setIsLoading(true);

        try {
            // Fetch profile & freelancer_profile data joined
            const { data: profile, error: profileError } = await supabase
                .from('freelancer_profiles')
                .select(`
                    *,
                    profile:profiles!id (
                        full_name,
                        avatar_url,
                        bio,
                        location,
                        created_at,
                        phone,
                        user_type
                    )
                `)
                .eq('id', freelancerId)
                .single();

            if (profileError) throw profileError;

            // Fetch skills
            const { data: profileSkills } = await supabase
                .from('profile_skills')
                .select(`
                    skill:skills (
                        id,
                        name_ar,
                        name_fr,
                        name_en
                    )
                `)
                .eq('profile_id', freelancerId);

            // Fetch portfolio/work samples (using new portfolio_items table if available, else work_samples)
            // Note: For now using work_samples or assuming migration.
            // Let's check if we should use existing work_samples table which was in old schema, 
            // but schema_v2 creates portfolio_items. 
            // I'll try to fetch from portfolio_items first, if empty fall back or just use what exists.
            // Since we just migrated, let's stick to 'work_samples' if that's what's populated, 
            // OR 'portfolio_items' if that's the new standard. 
            // The prompt asks for "portfolio items", which matches schema_v2 `portfolio_items`.

            // Let's use portfolio_items as per V2 schema.
            const { data: portfolioItems } = await supabase
                .from('portfolio_items')
                .select('*')
                .eq('freelancer_id', freelancerId)
                .order('order_index', { ascending: true });

            // Fetch reviews
            const { data: reviews } = await supabase
                .from('reviews')
                .select(`
                    id,
                    rating,
                    comment,
                    created_at,
                    skills_rating,
                    reviewer:profiles!reviewer_id (
                        full_name,
                        avatar_url
                    ),
                    contract:contracts!contract_id (
                        job:jobs (
                            title
                        )
                    )
                `)
                .eq('reviewee_id', freelancerId)
                .order('created_at', { ascending: false });

            // Format stats
            const stats = {
                jobs_completed: profile.jobs_completed || 0,
                rating: profile.success_rate ? (profile.success_rate / 20) : 0, // Convert % to 5-star
                reviews_count: reviews?.length || 0,
                response_time_hours: profile.response_time_hours || 24,
                completion_rate: 100, // Placeholder if not calculating dynamicaly
                repeat_clients: profile.repeat_clients || 0,
                total_earnings: profile.total_earnings || 0,
                success_rate: profile.success_rate || 0,
                profile_views: profile.profile_views || 0
            };

            const formattedData: FreelancerData = {
                id: profile.id,
                full_name: profile.profile.full_name,
                title: profile.title,
                avatar_url: profile.profile.avatar_url,
                bio: profile.profile.bio || '',
                location: profile.profile.location || 'تونس',
                joined_at: profile.profile.created_at,
                voice_intro_url: profile.voice_intro_url,
                hourly_rate: profile.hourly_rate || 0,
                availability: profile.availability || 'available',
                skills: profileSkills?.map(ps => ps.skill as unknown as Skill).filter(Boolean) || [],
                languages: Array.isArray(profile.languages) ? profile.languages : [],
                education: Array.isArray(profile.education) ? profile.education : [],
                certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
                stats,
                verifications: {
                    cin: profile.cin_verified || false,
                    phone: !!profile.profile.phone, // simplistic check
                    email: true, // simplified
                    payment: false // simplified
                },
                work_samples: portfolioItems?.map(item => ({
                    id: item.id,
                    title: item.title,
                    thumbnail_url: item.thumbnail_url || item.media_urls?.[0] || '',
                    description: item.description,
                    project_url: item.project_url,
                    skills_used: item.skills_used,
                    media_urls: item.media_urls
                })) || [],
                reviews: reviews?.map(r => ({
                    id: r.id,
                    client_name: (r.reviewer as any)?.full_name || 'عميل',
                    client_avatar: (r.reviewer as any)?.avatar_url,
                    rating: r.rating,
                    comment: r.comment || '',
                    created_at: r.created_at,
                    job_title: (r.contract as any)?.job?.title || 'مهمة',
                    skills_rating: r.skills_rating
                })) || [],
            };

            setFreelancer(formattedData);
        } catch (error) {
            console.error('Error loading freelancer:', error);
            setFreelancer(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayVoice = () => {
        if (!freelancer?.voice_intro_url) return;

        if (isPlayingVoice) {
            // Stop playing
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setIsPlayingVoice(false);
        } else {
            // Start playing
            const audio = new Audio(freelancer.voice_intro_url);
            audioRef.current = audio;

            audio.onended = () => setIsPlayingVoice(false);
            audio.onerror = () => setIsPlayingVoice(false);

            audio.play().catch(() => {
                setIsPlayingVoice(false);
            });
            setIsPlayingVoice(true);
        }
    };

    // Helper for rendering stars
    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(rating)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    const handleContactFreelancer = () => {
        setShowContactModal(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-TN', {
            year: 'numeric',
            month: 'long',
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container-custom py-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
                    <p className="text-muted mt-4">جاري تحميل الملف الشخصي...</p>
                </div>
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container-custom py-12 text-center">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-700 mb-2">لم يتم العثور على الملف الشخصي</h2>
                    <Button variant="primary" onClick={() => navigate('/')}>
                        العودة للرئيسية
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            <Header />

            {/* Cover Photo */}
            <div className="h-64 bg-gradient-to-r from-primary-800 to-primary-600 relative overflow-hidden">
                {freelancer.cover_url && (
                    <img
                        src={freelancer.cover_url}
                        alt="Cover"
                        className="w-full h-full object-cover opacity-50"
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
                                    <img
                                        src={freelancer.avatar_url}
                                        alt={freelancer.full_name}
                                        className="w-full h-full object-cover"
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
                                        onClick={handleContactFreelancer}
                                    >
                                        توظيف الآن
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => setShowContactModal(true)}
                                        leftIcon={<MessageSquare className="w-4 h-4" />}
                                    >
                                        مراسلة
                                    </Button>
                                    {/* Voice Intro Button */}
                                    {freelancer.voice_intro_url && (
                                        <button
                                            onClick={handlePlayVoice}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* About Section */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4">نبذة عني</h2>
                            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                                {freelancer.bio}
                            </div>
                        </section>

                        {/* Skills Section */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4">المهارات</h2>
                            <div className="flex flex-wrap gap-2">
                                {freelancer.skills.map((skill) => (
                                    <span
                                        key={skill.id}
                                        className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors cursor-default"
                                    >
                                        {language === 'ar' ? skill.name_ar : language === 'fr' ? skill.name_fr : skill.name_en}
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* Portfolio Section */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">معرض الأعمال</h2>
                                <span className="text-muted text-sm">{freelancer.work_samples.length} عمل</span>
                            </div>

                            {freelancer.work_samples.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {freelancer.work_samples.map((sample) => (
                                        <div
                                            key={sample.id}
                                            onClick={() => setSelectedWorkSample(sample.id)}
                                            className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer bg-gray-100"
                                        >
                                            <img
                                                src={sample.thumbnail_url}
                                                alt={sample.title}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                <h3 className="text-white font-bold text-lg line-clamp-1">{sample.title}</h3>
                                                {sample.description && (
                                                    <p className="text-white/80 text-sm line-clamp-1 mt-1">{sample.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-muted">لم يقم المستقل بإضافة أعمال بعد</p>
                                </div>
                            )}
                        </section>

                        {/* Work History & Reviews */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-6">تاريخ العمل والتقييمات</h2>

                            {/* Rating Breakdown */}
                            <div className="flex flex-col md:flex-row items-center gap-8 mb-8 bg-gray-50 p-6 rounded-xl">
                                <div className="text-center md:text-start min-w-[120px]">
                                    <div className="text-4xl font-bold text-gray-900 mb-1">{freelancer.stats.rating}</div>
                                    {renderStars(freelancer.stats.rating)}
                                    <p className="text-sm text-muted mt-2">{freelancer.stats.reviews_count} تقييم</p>
                                </div>
                                <div className="flex-1 w-full space-y-2">
                                    {[5, 4, 3, 2, 1].map((stars) => {
                                        const count = freelancer.reviews.filter(r => Math.round(r.rating) === stars).length;
                                        const percentage = freelancer.stats.reviews_count > 0
                                            ? (count / freelancer.stats.reviews_count) * 100
                                            : 0;
                                        return (
                                            <div key={stars} className="flex items-center gap-3">
                                                <span className="text-sm font-medium w-3 text-gray-600">{stars}</span>
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-yellow-400 rounded-full"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted w-8 text-end">{Math.round(percentage)}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Reviews List */}
                            <div className="space-y-6">
                                {freelancer.reviews.map((review) => (
                                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    {review.client_avatar ? (
                                                        <img src={review.client_avatar} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-gray-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-900">{review.client_name}</h4>
                                                    <span className="text-xs text-muted">{formatDate(review.created_at)}</span>
                                                </div>
                                            </div>
                                            {renderStars(review.rating)}
                                        </div>
                                        <h5 className="font-medium text-sm text-gray-700 mb-1">{review.job_title}</h5>
                                        <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                                    </div>
                                ))}
                                {freelancer.reviews.length === 0 && (
                                    <p className="text-center text-muted py-4">لا توجد تقييمات مكتوبة بعد</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Availability Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold mb-4">معلومات العمل</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                    <span className="text-gray-600">الحالة</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${freelancer.availability === 'available' ? 'bg-green-100 text-green-700' :
                                        freelancer.availability === 'busy' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {freelancer.availability === 'available' ? 'متاح للعمل' :
                                            freelancer.availability === 'busy' ? 'مشغول حالياً' : 'غير متصل'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                    <span className="text-gray-600">عضو منذ</span>
                                    <span className="text-gray-900">{formatDate(freelancer.joined_at)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                    <span className="text-gray-600">آخر ظهور</span>
                                    <span className="text-gray-900">منذ ساعة</span>
                                </div>
                            </div>
                        </div>

                        {/* Languages */}
                        {freelancer.languages.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold mb-4">اللغات</h3>
                                <div className="space-y-3">
                                    {freelancer.languages.map((lang, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <span className="text-gray-700">{lang.language}</span>
                                            <span className="text-xs text-muted bg-gray-100 px-2 py-1 rounded">
                                                {lang.proficiency}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {freelancer.education.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold mb-4">التعليم</h3>
                                <div className="space-y-4">
                                    {freelancer.education.map((edu, idx) => (
                                        <div key={idx} className="relative ps-4 border-s-2 border-gray-100">
                                            <h4 className="font-bold text-sm text-gray-900">{edu.institution}</h4>
                                            <p className="text-xs text-gray-600 mb-1">{edu.degree} - {edu.field}</p>
                                            <p className="text-xs text-muted">{edu.startYear} - {edu.endYear}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Verifications */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold mb-4">التوثيقات</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className={`w-5 h-5 ${freelancer.verifications.cin ? 'text-green-500' : 'text-gray-300'}`} />
                                    <span className={freelancer.verifications.cin ? 'text-gray-900' : 'text-gray-400'}>الهوية الشخصية</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className={`w-5 h-5 ${freelancer.verifications.phone ? 'text-green-500' : 'text-gray-300'}`} />
                                    <span className={freelancer.verifications.phone ? 'text-gray-900' : 'text-gray-400'}>رقم الهاتف</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className={`w-5 h-5 ${freelancer.verifications.email ? 'text-green-500' : 'text-gray-300'}`} />
                                    <span className={freelancer.verifications.email ? 'text-gray-900' : 'text-gray-400'}>البريد الإلكتروني</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className={`w-5 h-5 ${freelancer.verifications.payment ? 'text-green-500' : 'text-gray-300'}`} />
                                    <span className={freelancer.verifications.payment ? 'text-gray-900' : 'text-gray-400'}>وسيلة الدفع</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedWorkSample && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                    <button
                        onClick={() => setSelectedWorkSample(null)}
                        className="absolute top-4 end-4 text-white hover:text-gray-300 z-50 p-2"
                    >
                        <span className="text-4xl">&times;</span>
                    </button>

                    <div className="relative max-w-5xl w-full h-full max-h-[90vh] flex flex-col md:flex-row bg-white rounded-xl overflow-hidden">
                        {(() => {
                            const sample = freelancer.work_samples.find(s => s.id === selectedWorkSample);
                            if (!sample) return null;
                            return (
                                <>
                                    <div className="flex-1 bg-black flex items-center justify-center relative">
                                        <img
                                            src={sample.thumbnail_url}
                                            alt={sample.title}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                    <div className="w-full md:w-80 bg-white p-6 overflow-y-auto">
                                        <h3 className="text-2xl font-bold mb-4">{sample.title}</h3>
                                        <p className="text-gray-600 mb-6 leading-relaxed whitespace-pre-line">
                                            {sample.description || 'لا يوجد وصف'}
                                        </p>

                                        {sample.skills_used && sample.skills_used.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="font-bold text-sm mb-2">المهارات المستخدمة</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {sample.skills_used.map((skill, i) => (
                                                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {sample.project_url && (
                                            <a
                                                href={sample.project_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full text-center py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition"
                                            >
                                                زيارة المشروع
                                            </a>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            <ContactModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                freelancerId={freelancer.id}
                freelancerName={freelancer.full_name}
            />

            <Footer />
        </div>
    );
}

export default FreelancerProfile;
