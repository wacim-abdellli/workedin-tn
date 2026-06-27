import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Clock,
    CheckCircle,
    Pause,
    MapPin,
    Briefcase,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
    Volume2,
    User,
    ArrowLeft,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { Header } from '../components/layout';
import { supabase } from '../lib/supabase';
import OptimizedImage from '../components/common/OptimizedImage';
import type { Skill, Job, FreelancerProfile, Profile } from '../types';

// MATCHING LOGIC AND TYPES
interface MatchResult {
    id: string; // profile id
    match_score: number;
    freelancer: FreelancerProfile & Profile;
}

interface JobSkill {
    skill_id: string;
}

interface ProfileSkill {
    skill?: {
        id: string;
        name_ar: string;
        name_fr: string;
        name_en: string;
    };
}

interface FreelancerWithSkills {
    id: string;
    completion_rate?: number;
    response_time_hours?: number;
    cin_verified?: boolean;
    skills?: ProfileSkill[];
    work_samples?: unknown[];
}

function clampToPercent(value: number | undefined): number {
    if (typeof value !== 'number' || Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
}

function normalizeResponseHours(value: number | undefined): number {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return 24;
    return Math.round(value);
}

function normalizeSkillIds(skillIds: Array<string | undefined>): string[] {
    return Array.from(new Set(skillIds.filter((id): id is string => typeof id === 'string' && id.length > 0)));
}

export function computeMatchScore(input: {
    requiredSkillIds: string[];
    freelancerSkillIds: Array<string | undefined>;
    completionRate?: number;
    cinVerified?: boolean;
}): number {
    const requiredIds = normalizeSkillIds(input.requiredSkillIds);
    const freelancerIds = new Set(normalizeSkillIds(input.freelancerSkillIds));

    const matchedSkillsCount = requiredIds.filter((skillId) => freelancerIds.has(skillId)).length;
    const skillsWeight = requiredIds.length > 0 ? (matchedSkillsCount / requiredIds.length) * 70 : 0;
    const completionRate = clampToPercent(input.completionRate);
    const performanceWeight = (completionRate / 100) * 20;
    const verifiedWeight = input.cinVerified ? 10 : 0;

    return Math.round(Math.min(100, skillsWeight + performanceWeight + verifiedWeight));
}

function sortMatchesByRank(a: MatchResult, b: MatchResult): number {
    if (b.match_score !== a.match_score) return b.match_score - a.match_score;

    const aCompletion = a.freelancer.completion_rate ?? 0;
    const bCompletion = b.freelancer.completion_rate ?? 0;
    if (bCompletion !== aCompletion) return bCompletion - aCompletion;

    const aResponse = a.freelancer.response_time_hours ?? Number.MAX_SAFE_INTEGER;
    const bResponse = b.freelancer.response_time_hours ?? Number.MAX_SAFE_INTEGER;
    if (aResponse !== bResponse) return aResponse - bResponse;

    return a.id.localeCompare(b.id);
}

function JobMatches() {
    const { jobId } = useParams<{ jobId: string }>();
    const { t, language, tx } = useTranslation();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [job, setJob] = useState<Job | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fetch Job and Calculate Matches
    useEffect(() => {
        if (!jobId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Get Job Details with Skills
                const { data: jobData, error: jobError } = await supabase
                    .from('jobs')
                    .select('*, required_skills:job_skills(skill_id)')
                    .eq('id', jobId)
                    .single();

                if (jobError) throw jobError;

                // Transform job skills to array of IDs
                const requiredSkillIds = jobData.required_skills?.map((s: JobSkill) => s.skill_id) || [];
                setJob(jobData);

                // 2. Get All Freelancers with their Skills
                const { data: freelancers, error: flError } = await supabase
                    .from('public_profiles')
                    .select(`
                        *,
                        skills:profile_skills(
                            skill:skills(id, name_ar, name_fr, name_en)
                        ),
                        work_samples(*)
                    `)
                    .in('user_type', ['freelancer', 'both']);

                if (flError) throw flError;

                // 3. Calculate Scores
                const results = freelancers.map((fl: FreelancerWithSkills) => {
                    // Flatten skills structure
                    const flSkills = fl.skills?.map((s: ProfileSkill) => ({
                        id: s.skill?.id,
                        name_ar: s.skill?.name_ar,
                        name_fr: s.skill?.name_fr,
                        name_en: s.skill?.name_en
                    })) || [];

                    const completionRate = clampToPercent(fl.completion_rate);
                    const responseTimeHours = normalizeResponseHours(fl.response_time_hours);
                    const matchScore = computeMatchScore({
                        requiredSkillIds,
                        freelancerSkillIds: flSkills.map((s) => s.id),
                        completionRate,
                        cinVerified: fl.cin_verified,
                    });

                    return {
                        id: fl.id,
                        match_score: matchScore,
                        freelancer: {
                            ...fl,
                            skills: flSkills,
                            completion_rate: completionRate,
                            response_time_hours: responseTimeHours,
                            repeat_clients: 0,
                            total_earnings: 0
                        }
                    } as MatchResult;
                });

                // Sort by score
                const sortedMatches = results
                    .filter(m => m.match_score > 0)
                    .sort(sortMatchesByRank);

                setMatches(sortedMatches);
            } catch (err) {
                logger.error('Error fetching matches:', err);
                showToast(t.jobMatches.searchError, 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [jobId]);
    // Get skill name based on current language
    const getSkillName = (skill: Skill) => {
        switch (language) {
            case 'fr':
                return skill.name_fr;
            case 'en':
                return skill.name_en;
            default:
                return skill.name_ar;
        }
    };

    // Toggle expanded freelancer card
    const toggleExpanded = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Play voice intro
    const playVoice = (freelancerId: string) => {
        const match = matches.find(m => m.id === freelancerId);
        const voiceUrl = match?.freelancer.voice_intro_url;

        if (playingVoice === freelancerId) {
            audioRef.current?.pause();
            setPlayingVoice(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (voiceUrl && typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
                audioRef.current = new window.Audio(voiceUrl);
            }
            setPlayingVoice(freelancerId);
            setTimeout(() => setPlayingVoice(null), 3000);
        }
    };

    // Open confirmation modal
    const handleSelectFreelancer = (match: MatchResult) => {
        setSelectedMatch(match);
        setIsInviteModalOpen(true);
    };

    // Confirm freelancer selection and create contract
    const confirmSelection = async () => {
        if (!selectedMatch || !job) return;
        setIsLoading(true);

        try {
            const { data: contract, error } = await supabase
                .from('contracts')
                .insert({
                    job_id: job.id,
                    freelancer_id: selectedMatch.freelancer.id,
                    client_id: job.client_id,
                    amount: job.budget,
                    status: 'pending_payment',
                    payment_status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            showToast(t.jobMatches.contractCreated, 'success');
            setIsInviteModalOpen(false);
            navigate(`/contracts/${contract.id}`);
        } catch (error) {
            logger.error('Error creating contract:', error);
            const message = error instanceof Error && error.message
                ? error.message
                : t.jobMatches.contractError;
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-surface">
                <Header />
                <div className="container-custom py-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface">
            <Header />

            <div className="container-custom py-12">
                <div className="max-w-3xl mx-auto">
                    {/* Back button + Job info */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-muted hover:text-foreground mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                        {tx('dynamic_key_48788556')}</button>

                    <div className="card mb-8">
                        <h1 className="text-xl font-bold text-foreground mb-2">
                            {job?.title}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-muted">
                            <span className="badge-primary">{job?.budget} {tx('dynamic_key_1524267')}</span>
                            <span>{t.selection.topMatches}</span>
                        </div>
                    </div>

                    {/* Freelancer Cards */}
                    <div className="space-y-6">
                        {matches.map((match, index) => {
                            const isExpanded = expandedId === match.id;
                            const freelancer = match.freelancer;

                            return (
                                <div
                                    key={match.id}
                                    className={`
                    card border-2 transition-all duration-300
                    ${index === 0 ? 'border-primary-400 ring-2 ring-primary-100' : 'border-transparent'}
                  `}
                                >
                                    {/* Match rank badge */}
                                    {index === 0 && (
                                        <div className="absolute -top-3 start-4 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            {tx('dynamic_key_1842976832')}</div>
                                    )}

                                    {/* Main info row */}
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                            {freelancer.avatar_url ? (
                                                <OptimizedImage
                                                    src={freelancer.avatar_url}
                                                    alt={freelancer.full_name}
                                                    className="w-full h-full rounded-full"
                                                    imgClassName="object-cover"
                                                />
                                            ) : (
                                                <User className="w-8 h-8 text-primary-600" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-bold text-lg text-foreground truncate">
                                                    {freelancer.full_name}
                                                </h3>
                                                <span className="badge-secondary">
                                                    {match.match_score}% {t.selection.matchScore}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-muted mb-2">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {freelancer.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {freelancer.response_time_hours} {t.selection.hours}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4" />
                                                    {freelancer.completion_rate}% {t.selection.completionRate}
                                                </span>
                                            </div>

                                            {/* Skills */}
                                            <div className="flex flex-wrap gap-2">
                                                {(freelancer.skills as Skill[]).map((skill) => (
                                                    <span
                                                        key={skill.id}
                                                        className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
                                                    >
                                                        {getSkillName(skill)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Voice Intro */}
                                    {freelancer.voice_intro_url && (
                                        <button
                                            onClick={() => playVoice(freelancer.id)}
                                            className={`
                        mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all
                        ${playingVoice === freelancer.id
                                                    ? 'bg-primary-100 text-primary-700'
                                                    : 'bg-muted text-foreground hover:bg-secondary'
                                                }
                      `}
                                        >
                                            {playingVoice === freelancer.id ? (
                                                <>
                                                    <Pause className="w-5 h-5" />
                                                    {tx('dynamic_key_1225650541')}</>
                                            ) : (
                                                <>
                                                    <Volume2 className="w-5 h-5" />
                                                    {t.selection.voiceIntro}
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {/* Work Samples Preview */}
                                    {freelancer.work_samples && freelancer.work_samples.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium text-muted mb-2 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" />
                                                {t.selection.workSamples}
                                            </p>
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {freelancer.work_samples.slice(0, 3).map((sample) => (
                                                    <OptimizedImage
                                                        key={sample.id}
                                                        src={sample.thumbnail_url || ''}
                                                        alt={tx('dynamic_key_1739654371')}
                                                        className="w-20 h-16 rounded-lg flex-shrink-0"
                                                        imgClassName="object-cover"
                                                    />
                                                ))}
                                                {freelancer.work_samples.length > 3 && (
                                                    <div className="w-20 h-16 bg-muted rounded-lg flex items-center justify-center text-sm text-muted flex-shrink-0">
                                                        +{freelancer.work_samples.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Expandable bio */}
                                    <div className="mt-4">
                                        <button
                                            onClick={() => toggleExpanded(match.id)}
                                            className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    {tx('dynamic_key_1501416850')}<ChevronUp className="w-4 h-4" />
                                                </>
                                            ) : (
                                                <>
                                                    {t.selection.readMore}
                                                    <ChevronDown className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>

                                        {isExpanded && (
                                            <div className="mt-4 p-4 bg-surface rounded-xl">
                                                <p className="text-foreground">{freelancer.bio}</p>
                                                <div className="mt-4 flex items-center gap-4 text-sm text-muted">
                                                    <span>
                                                        <Briefcase className="w-4 h-4 inline me-1" />
                                                        {freelancer.repeat_clients} {tx('dynamic_key_9853380')}</span>
                                                    <span>
                                                        {tx('dynamic_key_1573622')}{freelancer.total_earnings} {tx('dynamic_key_1524267')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-3 mt-6">
                                        <Button
                                            variant="ghost"
                                            size="md"
                                            className="flex-1"
                                            onClick={() => navigate(`/freelancer/${freelancer.id}`)}
                                        >
                                            {t.selection.viewFullProfile}
                                        </Button>
                                        <Button
                                            variant={index === 0 ? 'primary' : 'secondary'}
                                            size="md"
                                            className="flex-1"
                                            onClick={() => handleSelectFreelancer(match)}
                                        >
                                            {t.selection.select}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                title={t.selection.confirmSelection}
            >
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                        <User className="w-10 h-10 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                        {selectedMatch?.freelancer.full_name}
                    </h3>
                    <p className="text-muted mb-6">
                        {tx('dynamic_key_193923978')}</p>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            size="lg"
                            className="flex-1"
                            onClick={() => setIsInviteModalOpen(false)}
                        >
                            {t.selection.cancel}
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            className="flex-1"
                            onClick={confirmSelection}
                        >
                            {t.selection.startWork}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default JobMatches;

