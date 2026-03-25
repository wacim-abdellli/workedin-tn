import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useTranslation } from '../i18n';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import { supabaseAnon } from '../lib/supabase';
import type { Skill } from '../types';
import type { FreelancerData } from '../types/freelancer';
import ContactModal from '../components/freelancer/ContactModal';
import { OptimizedImage } from '../components/common';

// Subcomponents
import ProfileHeader from '../components/freelancer/profile/ProfileHeader';
import AboutSection from '../components/freelancer/profile/AboutSection';
import SkillsSection from '../components/freelancer/profile/SkillsSection';
import PortfolioSection from '../components/freelancer/profile/PortfolioSection';
import ReviewsSection from '../components/freelancer/profile/ReviewsSection';
import ProfileSidebar from '../components/freelancer/profile/ProfileSidebar';
import ProfileSkeleton from '../components/freelancer/profile/ProfileSkeleton';

export default function FreelancerProfile() {
    const { usernameOrId } = useParams<{ usernameOrId: string }>();
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
    }, [usernameOrId]);

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
        if (!usernameOrId) return;
        setIsLoading(true);

        try {
            // Determine if input is a UUID or a username
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId);

            let profileId = usernameOrId;

            if (!isUUID) {
                const { data: userProfile, error: userError } = await supabaseAnon
                    .from('profiles')
                    .select('id')
                    .eq('username', usernameOrId)
                    .single();

                if (userError || !userProfile) throw new Error('User not found');
                profileId = userProfile.id;
            }

            // Fetch freelancer_profile with joined profile data
            const { data: profile, error: profileError } = await supabaseAnon
                .from('freelancer_profiles')
                .select(`
                    *,
                    profile:profiles!id (
                        full_name,
                        username,
                        avatar_url,
                        bio,
                        location,
                        created_at,
                        phone,
                        user_type
                    )
                `)
                .eq('id', profileId)
                .single();

            if (profileError) throw profileError;

            const targetFreelancerId = profile.id;

            // Skills are stored as JSONB in freelancer_profiles.skills
            // Format: [{name: string, level: string}] or [string]
            const rawSkills: unknown[] = Array.isArray(profile.skills) ? profile.skills : [];
            const skills: Skill[] = rawSkills.map((s: any, i: number) => ({
                id: typeof s === 'string' ? s : (s?.name || String(i)),
                name_en: typeof s === 'string' ? s : (s?.name || ''),
                name_ar: typeof s === 'string' ? s : (s?.name || ''),
                name_fr: typeof s === 'string' ? s : (s?.name || ''),
            }));

            // Fetch portfolio items
            const { data: portfolioItems } = await supabaseAnon
                .from('portfolio_items')
                .select('*')
                .eq('freelancer_id', targetFreelancerId)
                .order('order_index', { ascending: true });

            // Fetch reviews
            const { data: reviews } = await supabaseAnon
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
                .eq('reviewee_id', targetFreelancerId)
                .order('created_at', { ascending: false });

            // Format stats
            const stats = {
                jobs_completed: profile.jobs_completed || 0,
                rating: profile.success_rate ? (profile.success_rate / 20) : 0, // Convert % to 5-star
                reviews_count: reviews?.length || 0,
                response_time_hours: profile.response_time_hours || 24,
                completion_rate: 100,
                repeat_clients: profile.repeat_clients || 0,
                total_earnings: profile.total_earnings || 0,
                success_rate: profile.success_rate || 0,
                profile_views: profile.profile_views || 0
            };

            const formattedData: FreelancerData = {
                id: profile.id,
                full_name: profile.profile.full_name,
                username: profile.profile.username,
                title: profile.title,
                avatar_url: profile.profile.avatar_url,
                bio: profile.profile.bio || '',
                location: profile.profile.location || 'تونس',
                joined_at: profile.profile.created_at,
                voice_intro_url: profile.voice_intro_url,
                hourly_rate: profile.hourly_rate || 0,
                availability: profile.availability || 'available',
                skills: skills,
                languages: Array.isArray(profile.languages) ? profile.languages : [],
                education: Array.isArray(profile.education) ? profile.education : [],
                certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
                stats,
                verifications: {
                    cin: profile.cin_verified || false,
                    phone: !!profile.profile.phone,
                    email: true,
                    payment: false
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
            logger.error('Error loading freelancer:', error);
            setFreelancer(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayVoice = () => {
        if (!freelancer?.voice_intro_url) return;

        if (isPlayingVoice) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setIsPlayingVoice(false);
        } else {
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

    if (isLoading) {
        return <ProfileSkeleton />;
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

            <ProfileHeader
                freelancer={freelancer}
                onContact={() => setShowContactModal(true)}
                onMessage={() => setShowContactModal(true)}
                onPlayVoice={handlePlayVoice}
                isPlayingVoice={isPlayingVoice}
            />

            <div className="container-custom relative">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <AboutSection bio={freelancer.bio} />
                        <SkillsSection skills={freelancer.skills} language={language} />
                        <PortfolioSection
                            workSamples={freelancer.work_samples}
                            onSelectSample={setSelectedWorkSample}
                        />
                        <ReviewsSection reviews={freelancer.reviews} stats={freelancer.stats} />
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <ProfileSidebar freelancer={freelancer} />
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
                                        <OptimizedImage
                                            src={sample.thumbnail_url}
                                            alt={sample.title}
                                            className="w-full h-full flex items-center justify-center"
                                            imgClassName="max-w-full max-h-full object-contain"
                                            fill={false}
                                            priority={true}
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
