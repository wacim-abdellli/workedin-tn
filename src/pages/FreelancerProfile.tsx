import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import type { Skill } from '../types';
import type {
    FreelancerData,
    FreelancerProfilePublicRow,
    FreelancerReviewRow,
    FreelancerSkillValue,
    FreelancerUsernameLookupRow,
    PortfolioItemRow,
} from '../types/freelancer';
import ContactModal from '../components/freelancer/ContactModal';
import { OptimizedImage } from '../components/common';
import SEO from '../components/common/SEO';
import ReportButton from '../components/settings/ReportButton';

// Subcomponents
import ProfileHeader from '../components/freelancer/profile/ProfileHeader';
import AboutSection from '../components/freelancer/profile/AboutSection';
import SkillsSection from '../components/freelancer/profile/SkillsSection';
import PortfolioSection from '../components/freelancer/profile/PortfolioSection';
import ReviewsSection from '../components/freelancer/profile/ReviewsSection';
import ProfileSidebar from '../components/freelancer/profile/ProfileSidebar';
import ProfileSkeleton from '../components/freelancer/profile/ProfileSkeleton';

function getFreelancerSkillName(skillValue: FreelancerSkillValue): string {
    if (typeof skillValue === 'string') {
        return skillValue;
    }

    return typeof skillValue?.name === 'string' ? skillValue.name : '';
}

function getSingleReviewer(reviewer: FreelancerReviewRow['reviewer']) {
    return Array.isArray(reviewer) ? (reviewer[0] ?? null) : reviewer;
}

function getReviewJobTitle(contract: FreelancerReviewRow['contract']): string | null {
    const contractRow = Array.isArray(contract) ? contract[0] : contract;
    const job = contractRow?.job;
    const jobRow = Array.isArray(job) ? job[0] : job;

    return jobRow?.title || null;
}

export default function FreelancerProfile() {
    const { usernameOrId } = useParams<{ usernameOrId: string }>();
    const { language, t, tx } = useTranslation();
    const { user } = useAuth();
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
                const { data: userProfile, error: userError } = await supabase
                    .from('public_profiles')
                    .select('id')
                    .eq('username', usernameOrId)
                    .single();

                const userProfileRow = userProfile as FreelancerUsernameLookupRow | null;

                if (userError || !userProfileRow) throw new Error('User not found');
                profileId = userProfileRow.id;
            }

            // Fetch all freelancer data in parallel
            const [
                { data: profile, error: profileError },
                { data: portfolioItems },
                { data: reviews }
            ] = await Promise.all([
                supabase
                    .from('freelancer_profiles')
                    .select(`
                        *,
                        profile:public_profiles!id (
                            full_name,
                            username,
                            avatar_url,
                            bio,
                            location,
                            created_at,
                            user_type
                        )
                    `)
                    .eq('id', profileId)
                    .single(),
                supabase
                    .from('portfolio_items')
                    .select('*')
                    .eq('freelancer_id', profileId)
                    .order('order_index', { ascending: true }),
                supabase
                    .from('reviews')
                    .select(`
                        id,
                        rating,
                        comment,
                        created_at,
                        skills_rating,
                        reviewer:public_profiles!reviewer_id (
                            full_name,
                            avatar_url
                        ),
                        contract:contracts!contract_id (
                            job:jobs (
                                title
                            )
                        )
                    `)
                    .eq('reviewee_id', profileId)
                    .order('created_at', { ascending: false })
            ]);

            const profileRow = profile as FreelancerProfilePublicRow | null;

            if (profileError || !profileRow?.profile) throw profileError || new Error('Freelancer not found');

            // const targetFreelancerId = profileRow.id;

            // Skills are stored as JSONB in freelancer_profiles.skills
            // Format: [{name: string, level: string}] or [string]
            const rawSkills: FreelancerSkillValue[] = Array.isArray(profileRow.skills) ? profileRow.skills : [];
            const skills: Skill[] = rawSkills.map((skillValue, index) => {
                const skillName = getFreelancerSkillName(skillValue);

                return {
                    id: skillName || String(index),
                    name_en: skillName,
                    name_ar: skillName,
                    name_fr: skillName,
                };
            });

            const portfolioRows = (portfolioItems ?? []) as PortfolioItemRow[];

            const reviewRows = (reviews ?? []) as FreelancerReviewRow[];

            // Format stats
            const stats = {
                jobs_completed: profileRow.jobs_completed || 0,
                rating: profileRow.success_rate ? (profileRow.success_rate / 20) : 0, // Convert % to 5-star
                reviews_count: reviewRows.length,
                response_time_hours: profileRow.response_time_hours || 24,
                completion_rate: 100,
                repeat_clients: profileRow.repeat_clients || 0,
                total_earnings: profileRow.total_earnings || 0,
                success_rate: profileRow.success_rate || 0,
                profile_views: profileRow.profile_views || 0
            };

            const formattedData: FreelancerData = {
                id: profileRow.id,
                full_name: profileRow.profile.full_name,
                username: profileRow.profile.username || undefined,
                title: profileRow.title,
                avatar_url: profileRow.profile.avatar_url,
                bio: profileRow.profile.bio || '',
                location: profileRow.profile.location || t.footer?.city || 'Tunis, Tunisia',
                joined_at: profileRow.profile.created_at,
                voice_intro_url: profileRow.voice_intro_url,
                hourly_rate: profileRow.hourly_rate || 0,
                availability: profileRow.availability || 'available',
                skills,
                languages: Array.isArray(profileRow.languages) ? profileRow.languages : [],
                education: Array.isArray(profileRow.education) ? profileRow.education : [],
                certifications: Array.isArray(profileRow.certifications) ? profileRow.certifications : [],
                stats,
                verifications: {
                    cin: profileRow.cin_verified || false,
                    // phone field removed from profiles join to avoid sensitive data exposure.
                    // Use phone_verified flag from freelancer_profiles if it exists.
                    phone: (profileRow as any).phone_verified || false,
                    email: true,
                    payment: false
                },
                work_samples: portfolioRows.map(item => ({
                    id: item.id,
                    title: item.title || '',
                    thumbnail_url: item.thumbnail_url || item.media_urls?.[0] || '',
                    description: item.description || undefined,
                    project_url: item.project_url || undefined,
                    skills_used: item.skills_used || undefined,
                    media_urls: item.media_urls || undefined,
                })),
                reviews: reviewRows.map((review) => {
                    const reviewer = getSingleReviewer(review.reviewer);

                    return {
                        id: review.id,
                        client_name: reviewer?.full_name || t.reviews?.client || 'Client',
                        client_avatar: reviewer?.avatar_url || undefined,
                        rating: review.rating,
                        comment: review.comment || '',
                        created_at: review.created_at,
                        job_title: getReviewJobTitle(review.contract) || tx('pages.freelancerProfile.jobFallback', undefined, 'Project'),
                        skills_rating: review.skills_rating || undefined,
                    };
                }),
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

    const profileNotFoundTitle = tx('pages.freelancerProfile.notFoundTitle', undefined, 'Profile not found');
    const backHomeLabel = tx('pages.errorBoundary.backHome', undefined, 'Back to home');

    const isOwner = !!user && (user.id === freelancer?.id || user.id === (freelancer as any)?.profile?.id);

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!freelancer) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-subtle)]">
                <Header />
                <div className="container-custom py-12 text-center">
                    <User className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">{profileNotFoundTitle}</h2>
                    <Button variant="primary" onClick={() => navigate('/')}>
                        {backHomeLabel}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 md:pb-0" style={{ background: 'var(--color-background-base)' }}>
            <SEO
                title={`${freelancer.full_name} — ${freelancer.title} | ${t.seo.freelancerProfile.titleSuffix}`}
                description={freelancer.bio?.slice(0, 160) || `${freelancer.title} — ${t.seo.freelancerProfile.descriptionFallback}`}
                image={freelancer.avatar_url || undefined}
            />
            <Header />

            <ProfileHeader
                freelancer={freelancer}
                onContact={() => setShowContactModal(true)}
                onMessage={() => setShowContactModal(true)}
                onPlayVoice={handlePlayVoice}
                isPlayingVoice={isPlayingVoice}
            />

            <div className="container-custom relative py-2 sm:py-4">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.65fr)_360px] gap-8 items-start">
                    <div className="space-y-8">
                        <AboutSection
                            bio={freelancer.bio}
                            isOwner={isOwner}
                            onUpdate={bio => setFreelancer(f => f ? { ...f, bio } : f)}
                        />
                        <SkillsSection
                            skills={freelancer.skills}
                            language={language}
                            isOwner={isOwner}
                            onUpdate={skills => setFreelancer(f => f ? { ...f, skills } : f)}
                        />
                        <PortfolioSection
                            workSamples={freelancer.work_samples}
                            onSelectSample={setSelectedWorkSample}
                        />
                        <ReviewsSection reviews={freelancer.reviews} stats={freelancer.stats} />
                    </div>

                    <div>
                        <ProfileSidebar freelancer={freelancer} />
                        {user?.id !== freelancer.id && user?.id !== (freelancer as any).profile?.id && (
                            <div className="mt-4 flex justify-end">
                                <ReportButton reportedType="user" reportedId={freelancer.id} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedWorkSample && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-overlay)] p-4">
                    <button
                        onClick={() => setSelectedWorkSample(null)}
                        className="absolute top-4 end-4 text-white hover:text-[var(--color-text-secondary)] z-50 p-2"
                    >
                        <span className="text-4xl">&times;</span>
                    </button>

                    <div className="relative max-w-5xl w-full h-full max-h-[90vh] flex flex-col md:flex-row bg-[var(--color-bg-elevated)] rounded-2xl overflow-hidden border border-[var(--color-border-subtle)]">
                        {(() => {
                            const sample = freelancer.work_samples.find(s => s.id === selectedWorkSample);
                            if (!sample) return null;
                            return (
                                <>
                                    <div className="flex-1 bg-[var(--neutral-950)] flex items-center justify-center relative">
                                        <OptimizedImage
                                            src={sample.thumbnail_url}
                                            alt={sample.title}
                                            className="w-full h-full flex items-center justify-center"
                                            imgClassName="max-w-full max-h-full object-contain"
                                            fill={false}
                                            priority={true}
                                        />
                                    </div>
                                    <div className="w-full md:w-80 bg-[var(--color-bg-elevated)] p-6 overflow-y-auto">
                                        <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">{sample.title}</h3>
                                        <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed whitespace-pre-line">
                                            {sample.description || tx('pages.freelancerProfile.noDescription', undefined, 'No description available')}
                                        </p>

                                        {sample.skills_used && sample.skills_used.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="font-bold text-sm mb-2">{tx('pages.freelancerProfile.portfolio.skillsUsed', undefined, 'Skills Used')}</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {sample.skills_used.map((skill, i) => (
                                                        <span key={i} className="text-xs bg-[var(--color-bg-muted)] px-2 py-1 rounded text-[var(--color-text-secondary)]">
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
                                                className="block w-full text-center py-3 bg-[var(--color-brand-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-brand-primary-hover)] transition"
                                            >
                                                {tx('pages.freelancerProfile.portfolio.visitProject', undefined, 'Visit Project')}
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
        </div>
    );
}
