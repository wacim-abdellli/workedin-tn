import {
    MapPin,
    Star,
    Target,
    Briefcase,
    CalendarDays,
    Camera,
    ChevronLeft,
    ChevronRight,
    Eye,
    ExternalLink,
    ShieldCheck,
    TrendingUp,
    Wallet,
    Clock,
    Coins,
    Check,
    CheckCircle,
    Circle,
    Images,
    Plus,
    Edit2,
    Trash2,
    Settings,
    MessageSquare,
    ArrowLeft,
    X,
    Save,
    Loader2,
    DollarSign,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { getStorageConfigErrorMessage, isMissingStorageBucketError, supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';
import { localizeGovernorate } from '../lib/governorates';
import { ROUTES } from '@/lib/routes';
import { logger } from '@/lib/logger';
import ContactModal from '../components/freelancer/ContactModal';
import InviteToJobModal from '../components/freelancer/InviteToJobModal';
import { uploadAvatar } from '@/services/profiles';
import { getPortfolioImageUrl, resolvePortfolioMediaUrl } from '@/lib/portfolioMedia';
import { splitPortfolioSkillsAndTools } from '@/lib/portfolioTools';
import {
    ProfileAvatar,
    ProfileEmptyState,
    ProfileInfoHeader,
    ProfileInfoRow,
    ProfileSectionCard,
    ProfileSectionHeader,
    ProfileStatCard,
} from '@/components/profile/ProfilePrimitives';
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileStatBar } from "@/components/profile/ProfileStatBar";
import { ProfileSection, ProfileTag, ProfileEmptySlot } from "@/components/profile/ProfileSection";
import { ProfileActionSidebar } from "@/components/profile/ProfileActionSidebar";
import OptimizedImage from '@/components/common/OptimizedImage';
import type {
    FreelancerData,
    FreelancerProfilePublicRow,
    FreelancerReviewRow,
    FreelancerSkillValue,
    FreelancerUsernameLookupRow,
    PortfolioItemRow,
} from '../types/freelancer';
import { PREDEFINED_SKILLS, PREDEFINED_TOOLS, type Skill } from '@/types';

interface ProfilePageProps {
    // 'owner': The freelancer viewing their own profile
    // 'client': A business/client looking to hire
    // 'freelancer': A different freelancer browsing the platform
    // 'guest': Not logged in
    viewerRole: 'owner' | 'client' | 'freelancer' | 'guest';
}

function getFreelancerSkillName(skillValue: FreelancerSkillValue | Skill): string {
    if (typeof skillValue === 'string') {
        return skillValue;
    }

    if (skillValue && typeof skillValue === 'object' && 'name_en' in skillValue && typeof skillValue.name_en === 'string') {
        return skillValue.name_en;
    }

    if (skillValue && typeof skillValue === 'object' && 'name' in skillValue && typeof skillValue.name === 'string') {
        return skillValue.name;
    }

    return '';
}

const SKILL_LABEL_BY_ID = new Map(PREDEFINED_SKILLS.map((skill) => [skill.id, skill.name_en] as const));
const SKILL_ID_BY_LABEL = new Map(PREDEFINED_SKILLS.map((skill) => [skill.name_en.toLowerCase(), skill.id] as const));

function resolveFreelancerSkillLabel(skillValue: FreelancerSkillValue | Skill): string {
    const rawValue = getFreelancerSkillName(skillValue).trim();
    if (!rawValue) {
        return '';
    }

    const mappedLabel = SKILL_LABEL_BY_ID.get(rawValue);
    if (mappedLabel) {
        return mappedLabel;
    }

    return rawValue;
}

function resolveFreelancerSkillId(skillLabel: string): string {
    const normalizedLabel = skillLabel.trim();
    if (!normalizedLabel) {
        return '';
    }

    const mappedId = SKILL_ID_BY_LABEL.get(normalizedLabel.toLowerCase());
    return mappedId || normalizedLabel;
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

interface PickerOption {
    id: string;
    name: string;
    category: string;
}

function toCategoryLabel(value: string): string {
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    return {};
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    if (error && typeof error === 'object') {
        const maybeMessage = 'message' in error && typeof error.message === 'string'
            ? error.message
            : '';
        if (maybeMessage) {
            return maybeMessage;
        }
    }

    return String(error || '');
}

function isSchemaCacheMissingColumnError(
    error: unknown,
    tableName: string,
    columnName: string,
): boolean {
    const message = getErrorMessage(error).toLowerCase();
    return message.includes('could not find')
        && message.includes('schema cache')
        && message.includes(tableName.toLowerCase())
        && message.includes(columnName.toLowerCase());
}

function isMissingAvatarModeColumnError(error: unknown): boolean {
    return isSchemaCacheMissingColumnError(error, 'profiles', 'avatar_url_freelancer')
        || isSchemaCacheMissingColumnError(error, 'profiles', 'avatar_url_client');
}

function getAvatarUpdateErrorMessage(error: unknown): string {
    const message = getErrorMessage(error).toLowerCase();

    if (message.includes('row-level security') || message.includes('42501')) {
        return 'You do not have permission to update this profile picture.';
    }

    if (message.includes('timed out') || message.includes('failed to fetch') || message.includes('network')) {
        return 'Network issue while updating profile picture. Please try again.';
    }

    if (isMissingAvatarModeColumnError(error)) {
        return 'Your database schema is outdated. Please apply the latest migrations and try again.';
    }

    return 'Could not update profile picture';
}

function getFreelancerIntro(projectPreferences: unknown, fallbackBio: string | null | undefined): string {
    const preferences = toRecord(projectPreferences);
    const intro = preferences.bio;

    if (typeof intro === 'string' && intro.trim().length > 0) {
        return intro.trim();
    }

    return fallbackBio?.trim() || '';
}

type WorkSample = FreelancerData['work_samples'][number];

function getWorkSampleImages(sample: WorkSample | null | undefined): string[] {
    if (!sample) {
        return [];
    }

    const candidates = [sample.thumbnail_url, ...(sample.media_urls ?? [])]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean);

    const uniqueImages: string[] = [];
    const seen = new Set<string>();

    candidates.forEach((value) => {
        const key = value.toLowerCase();
        if (seen.has(key)) {
            return;
        }

        seen.add(key);
        uniqueImages.push(value);
    });

    return uniqueImages;
}

function formatPortfolioMonth(value?: string): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
    });
}

function isHttpUrl(value: string): boolean {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function stripTrailingUrlPunctuation(value: string): string {
    return value.replace(/[),.;!?]+$/g, '');
}

function extractHttpUrlsFromText(value: string): string[] {
    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    const matches = value.match(urlPattern) ?? [];
    const unique: string[] = [];
    const seen = new Set<string>();

    matches.forEach((rawMatch) => {
        const cleaned = stripTrailingUrlPunctuation(rawMatch.trim());
        if (!cleaned || !isHttpUrl(cleaned)) {
            return;
        }

        const key = cleaned.toLowerCase();
        if (seen.has(key)) {
            return;
        }

        seen.add(key);
        unique.push(cleaned);
    });

    return unique;
}

function sanitizePortfolioTextFields(descriptionValue: string | null | undefined, projectUrlValue: string | null | undefined): {
    description: string | undefined;
    projectUrl: string | undefined;
} {
    const rawDescription = (descriptionValue || '').trim();
    const rawProjectUrl = (projectUrlValue || '').trim();

    const descriptionUrls = rawDescription ? extractHttpUrlsFromText(rawDescription) : [];
    const candidateUrls = [rawProjectUrl, ...descriptionUrls]
        .map((value) => value.trim())
        .filter(Boolean);

    const sanitizedProjectUrl = candidateUrls.find((value) => isHttpUrl(value));

    if (!rawDescription) {
        return {
            description: undefined,
            projectUrl: sanitizedProjectUrl,
        };
    }

    if (descriptionUrls.length === 0) {
        return {
            description: rawDescription,
            projectUrl: sanitizedProjectUrl,
        };
    }

    const withoutUrls = rawDescription
        .replace(/https?:\/\/[^\s]+/gi, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    return {
        description: withoutUrls.length >= 8 ? withoutUrls : undefined,
        projectUrl: sanitizedProjectUrl,
    };
}



function ProfileView({
    viewerRole,
    freelancer,
    onOpenContact,
    onHireNow,
    onSaveAvatar,
    onRefreshWorkSamples,
}: ProfilePageProps & {
    freelancer: FreelancerData;
    onOpenContact: () => void;
    onHireNow: () => void;
    onSaveAvatar: (file: File) => Promise<void>;
    onRefreshWorkSamples: () => Promise<void>;
}) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { tx } = useTranslation();
    const avatarInputRef = useRef<HTMLInputElement | null>(null);

    const [savingAvatar, setSavingAvatar] = useState(false);
    const [activeWorkSampleId, setActiveWorkSampleId] = useState<string | null>(null);
    const [activeWorkImageIndex, setActiveWorkImageIndex] = useState(0);
    const [deletingWorkSampleId, setDeletingWorkSampleId] = useState<string | null>(null);

    const workSamples = freelancer.work_samples;

    const activeWorkSample = useMemo(() => {
        if (!activeWorkSampleId) {
            return null;
        }

        return workSamples.find((item) => item.id === activeWorkSampleId) || null;
    }, [activeWorkSampleId, workSamples]);

    const activeWorkSampleImages = useMemo(
        () => getWorkSampleImages(activeWorkSample),
        [activeWorkSample],
    );

    const activeWorkSamplePosition = useMemo(
        () => workSamples.findIndex((item) => item.id === activeWorkSampleId),
        [activeWorkSampleId, workSamples],
    );

    const activeWorkSampleImage = activeWorkSampleImages[activeWorkImageIndex] || '';



    const openWorkSampleViewer = useCallback((workSampleId: string) => {
        setActiveWorkSampleId(workSampleId);
        setActiveWorkImageIndex(0);
    }, []);

    const closeWorkSampleViewer = useCallback(() => {
        setActiveWorkSampleId(null);
        setActiveWorkImageIndex(0);
    }, []);

    const editWorkSample = useCallback((workSampleId: string) => {
        navigate(`${ROUTES.freelancerPortfolio}?edit=${encodeURIComponent(workSampleId)}`);
    }, [navigate]);

    const deleteWorkSample = useCallback(async (workSampleId: string) => {
        const confirmed = window.confirm(tx(
            'pages.freelancerProfile.workSamples.deleteConfirm',
            undefined,
            'Delete this work sample? This action cannot be undone.',
        ));
        if (!confirmed) {
            return;
        }

        try {
            setDeletingWorkSampleId(workSampleId);

            const { error } = await supabase
                .from('portfolio_items')
                .delete()
                .eq('id', workSampleId)
                .eq('freelancer_id', freelancer.id);

            if (error) {
                throw error;
            }

            if (activeWorkSampleId === workSampleId) {
                closeWorkSampleViewer();
            }

            showToast(tx('pages.freelancerProfile.toasts.workSampleDeleted', undefined, 'Work sample deleted'), 'success');
            await onRefreshWorkSamples();
        } catch (error) {
            logger.error('Failed to delete work sample', error);
            showToast(tx('pages.freelancerProfile.toasts.workSampleDeleteError', undefined, 'Could not delete work sample'), 'error');
        } finally {
            setDeletingWorkSampleId(null);
        }
    }, [activeWorkSampleId, closeWorkSampleViewer, freelancer.id, onRefreshWorkSamples, showToast, tx]);

    const showPreviousWorkSample = useCallback(() => {
        if (workSamples.length <= 1) {
            return;
        }

        const currentIndex = activeWorkSamplePosition >= 0 ? activeWorkSamplePosition : 0;
        const nextIndex = (currentIndex - 1 + workSamples.length) % workSamples.length;

        setActiveWorkSampleId(workSamples[nextIndex].id);
        setActiveWorkImageIndex(0);
    }, [activeWorkSamplePosition, workSamples]);

    const showNextWorkSample = useCallback(() => {
        if (workSamples.length <= 1) {
            return;
        }

        const currentIndex = activeWorkSamplePosition >= 0 ? activeWorkSamplePosition : 0;
        const nextIndex = (currentIndex + 1) % workSamples.length;

        setActiveWorkSampleId(workSamples[nextIndex].id);
        setActiveWorkImageIndex(0);
    }, [activeWorkSamplePosition, workSamples]);

    const showPreviousWorkImage = useCallback(() => {
        if (activeWorkSampleImages.length <= 1) {
            return;
        }

        setActiveWorkImageIndex((prev) =>
            (prev - 1 + activeWorkSampleImages.length) % activeWorkSampleImages.length,
        );
    }, [activeWorkSampleImages.length]);

    const showNextWorkImage = useCallback(() => {
        if (activeWorkSampleImages.length <= 1) {
            return;
        }

        setActiveWorkImageIndex((prev) => (prev + 1) % activeWorkSampleImages.length);
    }, [activeWorkSampleImages.length]);

    useEffect(() => {
        if (!activeWorkSampleId) {
            return;
        }

        const stillExists = workSamples.some((item) => item.id === activeWorkSampleId);
        if (!stillExists) {
            setActiveWorkSampleId(null);
            setActiveWorkImageIndex(0);
        }
    }, [activeWorkSampleId, workSamples]);

    useEffect(() => {
        setActiveWorkImageIndex(0);
    }, [activeWorkSampleId]);

    useEffect(() => {
        if (!activeWorkSample) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeWorkSampleViewer();
                return;
            }

            if (event.key === 'ArrowLeft') {
                if (activeWorkSampleImages.length > 1) {
                    showPreviousWorkImage();
                } else {
                    showPreviousWorkSample();
                }
                return;
            }

            if (event.key === 'ArrowRight') {
                if (activeWorkSampleImages.length > 1) {
                    showNextWorkImage();
                } else {
                    showNextWorkSample();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        activeWorkSample,
        activeWorkSampleImages.length,
        closeWorkSampleViewer,
        showNextWorkImage,
        showNextWorkSample,
        showPreviousWorkImage,
        showPreviousWorkSample,
    ]);

    const strengths = freelancer.skills.length > 0
        ? freelancer.skills.map((skill) => resolveFreelancerSkillLabel(skill)).filter(Boolean)
        : ['Web Development', 'Web Research'];

    const tools = freelancer.tools.length > 0
        ? freelancer.tools
        : ['Figma', 'Canva', 'VS Code', 'Docker', 'Vercel', 'MongoDB'];

    const reviewBuckets = [5, 4, 3, 2, 1].map((score) => {
        const total = freelancer.stats.reviews_count || 0;
        const count = freelancer.reviews.filter((r) => Math.round(r.rating) === score).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;

        return { score, pct };
    });

    const accentColor = 'var(--workspace-primary)';

    const isSavingAnySection = savingAvatar;

    const handleAvatarUploadSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
        if (!allowedTypes.has(file.type)) {
            showToast(tx('pages.freelancerProfile.validation.avatarType', undefined, 'Please upload JPG, PNG, WEBP, or GIF image.'), 'warning');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast(tx('pages.freelancerProfile.validation.avatarSize', undefined, 'Image size should be less than 5MB.'), 'warning');
            return;
        }

        try {
            setSavingAvatar(true);
            await onSaveAvatar(file);
            showToast(tx('pages.freelancerProfile.toasts.avatarUpdated', undefined, 'Profile picture updated'), 'success');
        } catch (error) {
            logger.error('Failed to upload profile picture', error);
            const fallbackErrorText = getAvatarUpdateErrorMessage(error);
            const rawErrorText = getErrorMessage(error);
            showToast(
                isMissingStorageBucketError(error)
                    ? getStorageConfigErrorMessage('avatars')
                    : fallbackErrorText === 'Could not update profile picture' && rawErrorText
                        ? `${fallbackErrorText}: ${rawErrorText}`
                        : fallbackErrorText,
                'error',
            );
        } finally {
            setSavingAvatar(false);
        }
    };

    const isOwner = viewerRole === 'owner';

    const availabilityBadge = freelancer.availability === 'available'
        ? {
            label: 'Available',
            color: '#4ade80',
            background: 'rgba(34,197,94,0.12)',
            border: 'rgba(34,197,94,0.3)',
        }
        : freelancer.availability === 'busy'
            ? {
                label: 'Busy',
                color: '#fbbf24',
                background: 'rgba(245,158,11,0.12)',
                border: 'rgba(245,158,11,0.3)',
            }
            : {
                label: 'Offline',
                color: '#d1d5db',
                background: 'rgba(107,114,128,0.12)',
                border: 'rgba(107,114,128,0.3)',
            };

  const heroBadges = [
    { label: "Freelancer", style: "filled" as const },
    { label: availabilityBadge.label, style: "filled" as const },
  ];

  const heroMeta = [
    { icon: <MapPin className="w-3.5 h-3.5" />, label: freelancer.location || 'Ariana' },
    { icon: <Star className="w-3.5 h-3.5" />, label: `${freelancer.stats.rating.toFixed(1)} - ${freelancer.stats.reviews_count} reviews` },
    { icon: <TrendingUp className="w-3.5 h-3.5" />, label: `${freelancer.stats.success_rate}% success` },
  ];

  const heroActions = isOwner ? (
      <button
        type="button"
        onClick={() => navigate('/settings?tab=profile')}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border transition-all duration-150"
        style={{ 
          color: 'var(--color-text-secondary)', 
          borderColor: 'var(--color-border-subtle)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Edit2 className="w-3.5 h-3.5" />
        {tx('pages.freelancerProfile.actions.editProfile', undefined, 'Edit profile')}
      </button>
  ) : undefined;

  return (
    <div className="min-h-screen w-full page-bg-base">
      <ProfileHero
        variant="freelancer"
        name={freelancer.full_name || 'Freelancer'}
        subtitle={freelancer.title || 'Independent specialist'}
        avatarUrl={freelancer.avatar_url}
        badges={heroBadges}
        meta={heroMeta}
        actions={heroActions}
        isOwner={isOwner}
        isUploadingAvatar={savingAvatar}
        onAvatarUpload={handleAvatarUploadSelection}
      />

      {/* ── Stat bar ────────────────────────────────────────────────────── */}
      <ProfileStatBar
        variant="freelancer"
        stats={[
            { icon: <Briefcase className="w-4 h-4" />, label: 'Completed', value: freelancer.stats.jobs_completed },
            { icon: <DollarSign className="w-4 h-4" />, label: 'Hourly Rate', value: `${freelancer.hourly_rate} TND/hr`, highlight: true },
            { icon: <CheckCircle className="w-4 h-4" />, label: 'Success Rate', value: `${freelancer.stats.success_rate}%` },
            { icon: <Clock className="w-4 h-4" />, label: 'Response Time', value: '< 2 hrs' },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-5">

                    <ProfileSection
                        title="Skills"
                        animationDelay={180}
                        onEdit={isOwner ? () => navigate('/settings?tab=profile') : undefined}
                        editLabel="Edit"
                    >
                        {strengths.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {strengths.map((item) => (
                                    <ProfileTag key={item} label={item} accentColor="var(--workspace-primary)" />
                                ))}
                            </div>
                        ) : (
                            <ProfileEmptySlot 
                                message="No skills added yet."
                                cta={isOwner ? <Link to="/settings?tab=profile" className="text-xs font-medium" style={{ color: accentColor }}>+ Add skills</Link> : undefined} 
                            />
                        )}
                    </ProfileSection>

                    <ProfileSection
                        title="Tools"
                        animationDelay={240}
                        onEdit={isOwner ? () => navigate('/settings?tab=profile') : undefined}
                        editLabel="Edit"
                    >
                        {tools.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {tools.map((item) => (
                                    <ProfileTag key={item} label={item} accentColor="var(--workspace-primary)" />
                                ))}
                            </div>
                        ) : (
                            <ProfileEmptySlot 
                                message="No tools added yet."
                                cta={isOwner ? <Link to="/settings?tab=profile" className="text-xs font-medium" style={{ color: accentColor }}>+ Add tools</Link> : undefined} 
                            />
                        )}
                    </ProfileSection>

                    <ProfileSection title={tx('pages.freelancerProfile.sections.selectedWork', undefined, 'Selected work')} animationDelay={320}>
                        {workSamples.length > 0 ? (
                            <div className={`grid gap-4 ${workSamples.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                {workSamples.map((item) => {
                                    const workImages = getWorkSampleImages(item);
                                    const workImage = workImages[0] || '';
                                    const workTitle = item.title?.trim() || 'Untitled work';

                                    return (
                                        <article key={item.id} className="group rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden transition-colors hover:border-white/20">
                                            <div className="relative h-44 w-full bg-[radial-gradient(circle_at_25%_18%,rgba(139,92,246,0.2),transparent_48%),#111111]">
                                                {workImage ? (
                                                    <OptimizedImage
                                                        src={workImage}
                                                        alt={workTitle}
                                                        className="h-full w-full"
                                                        imgClassName="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-white/30">
                                                        <Briefcase className="w-8 h-8" />
                                                    </div>
                                                )}

                                                <div className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] text-white/85">
                                                    <Images className="w-3.5 h-3.5" />
                                                    {workImages.length} {workImages.length === 1 ? 'photo' : 'photos'}
                                                </div>
                                            </div>

                                            <div className="p-3.5 space-y-3">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-white line-clamp-2 leading-5">{workTitle}</h4>
                                                    <p className="mt-1.5 text-xs text-white/60 line-clamp-3 leading-5">
                                                        {item.description || 'No description provided yet.'}
                                                    </p>
                                                </div>

                                                {item.skills_used && item.skills_used.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.skills_used.slice(0, 4).map((skill) => (
                                                            <span
                                                                key={skill}
                                                                className="max-w-full truncate text-[11px] px-2 py-0.5 rounded-full border"
                                                                style={{
                                                                    borderColor: `color-mix(in srgb, ${accentColor} 24%, #2f2f2f)`,
                                                                    color: accentColor,
                                                                    background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                                                                }}
                                                                title={skill}
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        {item.skills_used.length > 4 ? (
                                                            <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/15 text-white/55 bg-white/[0.04]">
                                                                +{item.skills_used.length - 4} more
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                ) : null}

                                                {item.tools_used && item.tools_used.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.tools_used.slice(0, 3).map((tool) => (
                                                            <span
                                                                key={tool}
                                                                className="max-w-full truncate text-[11px] px-2 py-0.5 rounded-full border"
                                                                style={{
                                                                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 35%, transparent)',
                                                                    color: 'var(--workspace-primary)',
                                                                    background: 'var(--workspace-primary-dim)'
                                                                }}
                                                                title={tool}
                                                            >
                                                                {tool}
                                                            </span>
                                                        ))}
                                                        {item.tools_used.length > 3 ? (
                                                            <span 
                                                                className="text-[11px] px-2 py-0.5 rounded-full border"
                                                                style={{
                                                                    borderColor: 'var(--color-border-subtle)',
                                                                    color: 'var(--color-text-tertiary)',
                                                                    background: 'var(--color-bg-subtle)'
                                                                }}
                                                            >
                                                                +{item.tools_used.length - 3} more
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                ) : null}

                                                <div className="flex items-center justify-between gap-2 pt-1">
                                                    {item.project_url ? (
                                                        <a
                                                            href={item.project_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-[#c4b5fd] hover:text-[#ddd6fe] transition-colors"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            {tx('pages.freelancerProfile.actions.openLink', undefined, 'Open link')}
                                                        </a>
                                                    ) : <span />}

                                                    <div className="flex items-center gap-2">
                                                        {isOwner ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => editWorkSample(item.id)}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/15 text-xs font-semibold text-white/75 hover:text-white transition-colors"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { void deleteWorkSample(item.id); }}
                                                                    disabled={deletingWorkSampleId === item.id}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/35 text-xs font-semibold text-red-300 hover:text-red-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    {deletingWorkSampleId === item.id ? 'Deleting...' : 'Delete'}
                                                                </button>
                                                            </>
                                                        ) : null}

                                                        <button
                                                            type="button"
                                                            onClick={() => openWorkSampleViewer(item.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
                                                            style={{
                                                                borderColor: `color-mix(in srgb, ${accentColor} 38%, #2f2f2f)`,
                                                                color: accentColor,
                                                                background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                                                            }}
                                                        >
                                                            {tx('pages.freelancerProfile.actions.viewFullProject', undefined, 'View full project')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <ProfileEmptyState
                                icon={<Briefcase className="w-10 h-10" />}
                                title={tx('pages.freelancerProfile.workSamples.emptyTitle', undefined, 'No work samples added yet')}
                                description="Showcase case studies, shipped products, and measurable outcomes."
                                cta={isOwner ? 'Add your first work sample' : undefined}
                                onCta={isOwner ? () => navigate(ROUTES.freelancerPortfolio) : undefined}
                                accentColor={accentColor}
                            />
                        )}
                    </ProfileSection>

                    {activeWorkSample ? (
                        <div
                            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm p-3 sm:p-6"
                            onClick={closeWorkSampleViewer}
                            role="dialog"
                            aria-modal="true"
                        >
                            <div
                                className="mx-auto h-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <div className="h-full grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
                                    <section className="relative bg-black/90 min-h-[280px] lg:min-h-full flex flex-col">
                                        <button
                                            type="button"
                                            onClick={closeWorkSampleViewer}
                                            className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full border border-white/20 bg-black/65 text-white/80 hover:text-white transition-colors inline-flex items-center justify-center"
                                            aria-label={tx('pages.freelancerProfile.viewer.close', undefined, 'Close portfolio viewer')}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>

                                        <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4">
                                            {activeWorkSampleImage ? (
                                                <OptimizedImage
                                                    src={activeWorkSampleImage}
                                                    alt={activeWorkSample.title || 'Portfolio project image'}
                                                    className="h-full max-h-[56vh] lg:max-h-[72vh] w-full"
                                                    imgClassName="object-contain"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-white/25 bg-[radial-gradient(circle_at_35%_20%,rgba(139,92,246,0.2),transparent_48%),#090909] rounded-xl">
                                                    <Briefcase className="w-10 h-10" />
                                                </div>
                                            )}

                                            {activeWorkSampleImages.length > 1 ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={showPreviousWorkImage}
                                                        className="absolute left-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-white/20 bg-black/65 text-white/80 hover:text-white transition-colors inline-flex items-center justify-center"
                                                        aria-label={tx('pages.freelancerProfile.viewer.previousImage', undefined, 'Previous image')}
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={showNextWorkImage}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-white/20 bg-black/65 text-white/80 hover:text-white transition-colors inline-flex items-center justify-center"
                                                        aria-label={tx('pages.freelancerProfile.viewer.nextImage', undefined, 'Next image')}
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>

                                        {activeWorkSampleImages.length > 1 ? (
                                            <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                                                <div className="flex gap-2 overflow-x-auto pb-1">
                                                    {activeWorkSampleImages.map((imageUrl, index) => (
                                                        <button
                                                            key={`${activeWorkSample.id}-image-${index}`}
                                                            type="button"
                                                            onClick={() => setActiveWorkImageIndex(index)}
                                                            className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition-colors ${index === activeWorkImageIndex ? 'border-[#8B5CF6]' : 'border-white/15 hover:border-white/35'}`}
                                                        >
                                                            <OptimizedImage
                                                                src={imageUrl}
                                                                alt={`Project image ${index + 1}`}
                                                                className="h-full w-full"
                                                                imgClassName="object-cover"
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </section>

                                    <aside className="h-full flex flex-col bg-[var(--color-bg-elevated)]">
                                        <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                                            <p className="text-xs uppercase tracking-[0.12em] text-[#c4b5fd] font-semibold">
                                                Project {Math.max(1, activeWorkSamplePosition + 1)} of {workSamples.length}
                                            </p>
                                            <h3 className="text-lg font-bold text-white mt-2 leading-6">
                                                {activeWorkSample.title || 'Untitled work'}
                                            </h3>
                                        </div>

                                        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-5">
                                            <p className="text-sm text-white/75 leading-6">
                                                {activeWorkSample.description || 'No description provided yet.'}
                                            </p>

                                            <div className="space-y-2.5 text-sm text-white/70">
                                                <div className="inline-flex items-center gap-2">
                                                    <Images className="w-4 h-4 text-white/45" />
                                                    <span>{activeWorkSampleImages.length} {activeWorkSampleImages.length === 1 ? 'photo' : 'photos'}</span>
                                                </div>

                                                {activeWorkSample.client_name ? (
                                                    <div className="inline-flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-2">
                                                            <Briefcase className="w-4 h-4 text-white/45" />
                                                            <span>{activeWorkSample.client_name}</span>
                                                        </span>
                                                    </div>
                                                ) : null}

                                                {activeWorkSample.completion_date ? (
                                                    <div className="inline-flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-2">
                                                            <CalendarDays className="w-4 h-4 text-white/45" />
                                                            <span>{formatPortfolioMonth(activeWorkSample.completion_date)}</span>
                                                        </span>
                                                    </div>
                                                ) : null}

                                                {activeWorkSample.project_url ? (
                                                    <a
                                                        href={activeWorkSample.project_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-2 text-[#c4b5fd] hover:text-[#ddd6fe] transition-colors"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        {tx('pages.freelancerProfile.actions.openProjectLink', undefined, 'Open project link')}
                                                    </a>
                                                ) : null}
                                            </div>

                                            {activeWorkSample.skills_used && activeWorkSample.skills_used.length > 0 ? (
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45 mb-2">{tx('pages.freelancerProfile.labels.skillsUsed', undefined, 'Skills used')}</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {activeWorkSample.skills_used.map((skill) => (
                                                            <span
                                                                key={skill}
                                                                className="text-xs px-2.5 py-1 rounded-full border"
                                                                style={{
                                                                    borderColor: `color-mix(in srgb, ${accentColor} 30%, #2f2f2f)`,
                                                                    color: accentColor,
                                                                    background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                                                                }}
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {activeWorkSample.tools_used && activeWorkSample.tools_used.length > 0 ? (
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45 mb-2">{tx('pages.freelancerProfile.labels.toolsUsed', undefined, 'Tools used')}</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {activeWorkSample.tools_used.map((tool) => (
                                                            <span
                                                                key={tool}
                                                                className="text-xs px-2.5 py-1 rounded-full border"
                                                                style={{
                                                                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 35%, transparent)',
                                                                    color: 'var(--workspace-primary)',
                                                                    background: 'var(--workspace-primary-dim)'
                                                                }}
                                                            >
                                                                {tool}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        {workSamples.length > 1 ? (
                                            <div className="border-t border-white/10 px-4 py-3 sm:px-5 flex items-center justify-between gap-3">
                                                <button
                                                    type="button"
                                                    onClick={showPreviousWorkSample}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/75 hover:text-white transition-colors"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                    {tx('pages.freelancerProfile.actions.previousProject', undefined, 'Previous project')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={showNextWorkSample}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/75 hover:text-white transition-colors"
                                                >
                                                    {tx('pages.freelancerProfile.actions.nextProject', undefined, 'Next project')}
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : null}
                                    </aside>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <ProfileSection title={tx('pages.freelancerProfile.sections.clientTrust', undefined, 'Client trust')} animationDelay={400}>
                        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-start">
                            <div className="rounded-xl border bg-[var(--color-bg-base)] p-4 text-center" style={{ borderColor: 'var(--color-border-subtle)' }}>
                                <p className="text-5xl leading-none font-black text-white">
                                    {freelancer.stats.rating.toFixed(1)}
                                </p>
                                <div className="mt-2 flex items-center justify-center gap-1">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <Star
                                            key={value}
                                            className="w-4 h-4"
                                            style={{
                                                color: value <= Math.round(freelancer.stats.rating) ? accentColor : '#4b5563',
                                                fill: value <= Math.round(freelancer.stats.rating) ? accentColor : 'none',
                                            }}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-[var(--color-text-secondary)] mt-2">{freelancer.stats.reviews_count} reviews</p>
                            </div>

                            <div className="space-y-2">
                                {reviewBuckets.map(({ score, pct }) => (
                                    <div key={score} className="flex items-center gap-2 text-xs">
                                        <span className="w-3 text-[var(--color-text-secondary)]">{score}</span>
                                        <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border-subtle)' }}>
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: `linear-gradient(90deg, ${accentColor}, color-mix(in srgb, ${accentColor} 55%, #ffffff))`,
                                                }}
                                            />
                                        </div>
                                        <span className="w-10 text-right text-[var(--color-text-tertiary)]">{pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {freelancer.reviews.length > 0 ? (
                            <div className="mt-6 space-y-3">
                                {freelancer.reviews.slice(0, 3).map((review) => (
                                    <article key={review.id} className="rounded-xl border p-3.5" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-bg-subtle)' }}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{review.client_name}</p>
                                                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{review.job_title || 'Project collaboration'}</p>
                                            </div>
                                            <div className="inline-flex items-center gap-1 text-xs" style={{ color: accentColor }}>
                                                <Star className="w-3.5 h-3.5" style={{ fill: accentColor }} />
                                                {review.rating.toFixed(1)}
                                            </div>
                                        </div>
                                        <p className="text-sm text-[var(--color-text-secondary)] mt-2">{review.comment}</p>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <ProfileEmptySlot message={tx('pages.freelancerProfile.reviews.empty', undefined, 'No reviews yet. Complete your first contract to receive feedback.')} />
                        )}
                    </ProfileSection>
                </div>

                <div className="lg:col-span-1">
                    <ProfileActionSidebar
                        variant="freelancer"
                        primaryCta={
                            viewerRole === 'client' ? (
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={onHireNow}
                                        className="w-full text-white rounded-xl py-3 font-semibold transition-all shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.23)]"
                                        style={{ background: accentColor }}
                                    >
                                        {tx('pages.freelancerProfile.cta.hireMe', undefined, 'Hire Me')}
                                    </button>
                                    <button
                                        onClick={onOpenContact}
                                        className="w-full rounded-xl py-3 font-semibold transition-colors inline-flex items-center justify-center gap-2 hover:bg-[#8B5CF6]/10"
                                        style={{ border: `1px solid color-mix(in srgb, ${accentColor} 50%, transparent)`, color: accentColor }}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        {tx('pages.freelancerProfile.cta.sendMessage', undefined, 'Send Message')}
                                    </button>
                                </div>
                            ) : (viewerRole === 'freelancer' || viewerRole === 'guest') ? (
                                <button
                                    onClick={onOpenContact}
                                    className="w-full rounded-xl py-3 font-semibold transition-colors inline-flex items-center justify-center gap-2 hover:bg-white/5"
                                    style={{ border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-primary)' }}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    {tx('pages.freelancerProfile.cta.sendMessage', undefined, 'Send Message')}
                                </button>
                            ) : undefined
                        }
                        workspaceInfo={[
                            {
                                label: "Status",
                                value: (
                                    <span className="flex items-center justify-end gap-1.5">
                                        <span className="w-2 h-2 rounded-full" style={{ background: freelancer.availability === 'available' ? '#4ade80' : '#fbbf24' }} />
                                        {freelancer.availability === 'available' ? 'Available for work' : freelancer.availability}
                                    </span>
                                )
                            },
                            {
                                label: tx('pages.freelancerProfile.info.memberSince', undefined, 'Member since'),
                                value: new Date(freelancer.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                            },
                            {
                                label: tx('pages.freelancerProfile.info.lastSeen', undefined, 'Last seen'),
                                value: <span className="text-emerald-400">Recently</span>
                            }
                        ]}
                        verifications={[
                            { label: 'Identity', passed: !!freelancer.verifications.cin },
                            { label: 'Phone', passed: !!freelancer.verifications.phone },
                            { label: 'Email', passed: !!freelancer.verifications.email },
                            { label: tx('pages.freelancerProfile.verifications.paymentMethod', undefined, 'Payment method'), passed: !!freelancer.verifications.payment },
                        ]}
                        ownerActions={isOwner ? [
                            {
                                icon: <Eye className="w-4 h-4" />,
                                label: tx('pages.freelancerProfile.cta.viewPublicProfile', undefined, 'View Public Profile'),
                                description: 'Preview how others see your profile.',
                                onClick: () => navigate(`/freelancer/${freelancer.username || freelancer.id}?preview=public`)
                            },
                            {
                                icon: <Briefcase className="w-4 h-4" />,
                                label: tx('pages.freelancerProfile.cta.portfolioDashboard', undefined, 'Portfolio Dashboard'),
                                description: 'Organize your best work.',
                                onClick: () => navigate(ROUTES.freelancerPortfolio)
                            },
                            {
                                icon: <MessageSquare className="w-4 h-4" />,
                                label: tx('pages.freelancerProfile.cta.myProposals', undefined, 'My Proposals'),
                                description: 'Track statuses and follow up.',
                                onClick: () => navigate(ROUTES.myProposals)
                            },
                            {
                                icon: <Settings className="w-4 h-4" />,
                                label: tx('pages.freelancerProfile.cta.workspaceSettings', undefined, 'Workspace Settings'),
                                description: 'Notifications and security.',
                                onClick: () => navigate(ROUTES.settings)
                            }
                        ] : []}
                    />
                </div>
            </div>
        </div>
      </div>
    );
}

export default function FreelancerProfile() {
    const { usernameOrId } = useParams<{ usernameOrId: string }>();
    const { language, t, tx } = useTranslation();
    const { user, profile, activeMode, updateProfile } = useAuth();
    const { showToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const isPublicPreview = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('preview') === 'public';
    }, [location.search]);

    useEffect(() => {
        if (!user?.id || activeMode !== 'client' || !usernameOrId) {
            return;
        }

        const metadataUsername = typeof user.user_metadata?.username === 'string'
            ? user.user_metadata.username
            : undefined;

        const isOwnFreelancerRoute =
            usernameOrId === user.id ||
            usernameOrId === profile?.username ||
            usernameOrId === metadataUsername;

        if (isOwnFreelancerRoute) {
            navigate(`/client/${user.id}`, { replace: true });
        }
    }, [activeMode, navigate, profile?.username, user?.id, user?.user_metadata?.username, usernameOrId]);

    // Use refs so loadFreelancer doesn't re-run on language change
    const languageRef = useRef(language);
    const tRef = useRef(t);
    const txRef = useRef(tx);
    useEffect(() => { languageRef.current = language; }, [language]);
    useEffect(() => { tRef.current = t; }, [t]);
    useEffect(() => { txRef.current = tx; }, [tx]);

    // Seed from sessionStorage cache for instant render
    const getCached = (id: string): FreelancerData | null => {
        try {
            const raw = sessionStorage.getItem(`fp_cache_${id}`);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    };
    const setCache = (id: string, data: FreelancerData) => {
        try { sessionStorage.setItem(`fp_cache_${id}`, JSON.stringify(data)); } catch { /* ignore */ }
    };

    const [freelancer, setFreelancer] = useState<FreelancerData | null>(() => {
        if (!usernameOrId) return null;
        return getCached(usernameOrId);
    });
    const [isLoading, setIsLoading] = useState(!freelancer); // skip loading if cache hit
    const [resolvedProfileId, setResolvedProfileId] = useState<string | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const saveBio = useCallback(async (bio: string) => {
        if (!user?.id) {
            return;
        }

        const normalizedBio = bio.trim();
        const currentPreferences = toRecord(freelancer?.project_preferences);
        const nextPreferences: Record<string, unknown> = {
            ...currentPreferences,
        };

        if (normalizedBio) {
            nextPreferences.bio = normalizedBio;
        } else {
            delete nextPreferences.bio;
        }

        const { error } = await supabase
            .from('freelancer_profiles')
            .update({ project_preferences: nextPreferences })
            .eq('id', user.id);

        if (error) {
            logger.error('Error updating profile bio', error);
            throw error;
        }

        setFreelancer((prev) => {
            if (!prev) {
                return prev;
            }

            return {
                ...prev,
                bio: normalizedBio,
                project_preferences: nextPreferences,
            };
        });
    }, [freelancer?.project_preferences, user?.id]);

    const saveProfileBasics = useCallback(async (payload: {
        fullName: string;
        title: string;
        hourlyRate: number;
        availability: FreelancerData['availability'];
    }) => {
        if (!user?.id) {
            return;
        }

        const normalizedFullName = payload.fullName.trim();
        const normalizedTitle = payload.title.trim();
        const normalizedRate = Number.isFinite(payload.hourlyRate) ? payload.hourlyRate : 0;

        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name: normalizedFullName,
            })
            .eq('id', user.id);

        if (profileError) {
            logger.error('Error updating profile basics in profiles table', profileError);
            throw profileError;
        }

        const { error: freelancerError } = await supabase
            .from('freelancer_profiles')
            .update({
                title: normalizedTitle || null,
                hourly_rate: normalizedRate,
                availability: payload.availability,
            })
            .eq('id', user.id);

        if (freelancerError) {
            logger.error('Error updating profile basics in freelancer_profiles table', freelancerError);
            throw freelancerError;
        }

        setFreelancer((prev) => {
            if (!prev) {
                return prev;
            }

            return {
                ...prev,
                full_name: normalizedFullName,
                title: normalizedTitle || null,
                hourly_rate: normalizedRate,
                availability: payload.availability,
            };
        });
    }, [user?.id]);

    const saveAvatar = useCallback(async (file: File) => {
        if (!user?.id) {
            return;
        }

        const avatarUrl = await uploadAvatar(user.id, file);

        try {
            await updateProfile({
                avatar_url: avatarUrl,
                avatar_url_freelancer: avatarUrl,
                avatar_url_client: avatarUrl,
            });
        } catch (error) {
            // Backward compatibility for workspaces that still have the legacy
            // single avatar_url column but not mode-specific avatar columns.
            if (isMissingAvatarModeColumnError(error)) {
                logger.warn('Avatar mode columns missing, retrying with legacy avatar_url only.', error);
                await updateProfile({ avatar_url: avatarUrl });
            } else {
                logger.error('Error updating freelancer avatar', error);
                throw error;
            }
        }

        setFreelancer((prev) => {
            if (!prev) {
                return prev;
            }

            return {
                ...prev,
                avatar_url: avatarUrl,
            };
        });
    }, [updateProfile, user?.id]);

    const saveSkills = useCallback(async (skillNames: string[]) => {
        if (!user?.id) {
            return;
        }

        const resolvedSkillIds = skillNames
            .map((name) => resolveFreelancerSkillId(name))
            .filter(Boolean);

        const skillEntries = resolvedSkillIds.map((skillId) => {
            const skill = PREDEFINED_SKILLS.find((item) => item.id === skillId);

            return {
                name: skillId,
                name_en: skill?.name_en || skillId,
                name_ar: skill?.name_ar || skillId,
                name_fr: skill?.name_fr || skillId,
            };
        });

        const { error } = await supabase
            .from('freelancer_profiles')
            .update({ skills: skillEntries })
            .eq('id', user.id);

        if (error) {
            logger.error('Error updating freelancer skills', error);
            throw error;
        }

        setFreelancer((prev) => {
            if (!prev) {
                return prev;
            }

            return {
                ...prev,
                skills: resolvedSkillIds.map((skillId, index) => {
                    const skill = PREDEFINED_SKILLS.find((item) => item.id === skillId);

                    return {
                        id: skillId || `${index}`,
                        name_en: skill?.name_en || skillId,
                        name_ar: skill?.name_ar || skillId,
                        name_fr: skill?.name_fr || skillId,
                    };
                }),
            };
        });
    }, [user?.id]);

    const saveTools = useCallback(async (toolNames: string[]) => {
        if (!user?.id) {
            return;
        }

        const { error } = await supabase
            .from('freelancer_profiles')
            .update({ tools: toolNames })
            .eq('id', user.id);

        if (error) {
            logger.error('Error updating freelancer tools', error);
            throw error;
        }

        setFreelancer((prev) => {
            if (!prev) {
                return prev;
            }

            return {
                ...prev,
                tools: toolNames,
            };
        });
    }, [user?.id]);

    const loadFreelancer = useCallback(async (showLoader = true) => {
            if (showLoader) {
                setIsLoading(true);
            }

            if (!usernameOrId) {
                setFreelancer(null);
                setResolvedProfileId(null);
                if (showLoader) {
                    setIsLoading(false);
                }
                return;
            }

            try {
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

                setResolvedProfileId(profileId);

                const [{ data: profileData, error: profileError }, { data: portfolioItems }, { data: reviews }] = await Promise.all([
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
                        .order('created_at', { ascending: false }),
                ]);

                const profileRow = profileData as FreelancerProfilePublicRow | null;
                if (profileError || !profileRow?.profile) throw new Error(profileError?.message || 'Freelancer not found');

                const rawSkills: FreelancerSkillValue[] = Array.isArray(profileRow.skills) ? profileRow.skills : [];
                const skills = rawSkills.map((skillValue, index) => {
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

                const totalWeight = reviewRows.reduce((sum, r) => sum + Number((r as any).trust_weight ?? 1), 0);
                const weightedRating = reviewRows.reduce((sum, r) => sum + Number(r.rating) * Number((r as any).trust_weight ?? 1), 0);
                const computedRating = totalWeight > 0 ? Math.round((weightedRating / totalWeight) * 10) / 10 : 0;

                const stats = {
                    jobs_completed: profileRow.jobs_completed || 0,
                    rating: computedRating,
                    reviews_count: reviewRows.length,
                    response_time_hours: profileRow.response_time_hours || 24,
                    completion_rate: 100,
                    repeat_clients: profileRow.repeat_clients || 0,
                    total_earnings: profileRow.total_earnings || 0,
                    success_rate: profileRow.success_rate || 0,
                    profile_views: profileRow.profile_views || 0,
                };

                const formattedData: FreelancerData = {
                    id: profileRow.id,
                    full_name: profileRow.profile.full_name,
                    username: profileRow.profile.username || undefined,
                    title: profileRow.title,
                    avatar_url: profileRow.profile.avatar_url,
                    bio: getFreelancerIntro(profileRow.project_preferences, profileRow.profile.bio),
                    location: profileRow.profile.location
                        ? localizeGovernorate(profileRow.profile.location, languageRef.current)
                        : tRef.current.footer?.city || 'Tunis, Tunisia',
                    joined_at: profileRow.profile.created_at,
                    voice_intro_url: profileRow.voice_intro_url,
                    hourly_rate: profileRow.hourly_rate || 0,
                    availability: profileRow.availability || 'available',
                    skills,
                    tools: Array.isArray(profileRow.tools) ? profileRow.tools : [],
                    languages: Array.isArray(profileRow.languages) ? profileRow.languages : [],
                    education: Array.isArray(profileRow.education) ? profileRow.education : [],
                    certifications: Array.isArray(profileRow.certifications) ? profileRow.certifications : [],
                    project_preferences: toRecord(profileRow.project_preferences),
                    stats,
                    verifications: {
                        cin: profileRow.cin_verified || false,
                        phone: (profileRow as { phone_verified?: boolean }).phone_verified || false,
                        email: true,
                        payment: (profileRow as { payment_verified?: boolean }).payment_verified || false,
                    },
                    work_samples: portfolioRows.map((item) => {
                        const {
                            skills: portfolioSkills,
                            tools: portfolioTools,
                        } = splitPortfolioSkillsAndTools(item.skills_used, item.tools_used);
                        const {
                            description: sanitizedDescription,
                            projectUrl: sanitizedProjectUrl,
                        } = sanitizePortfolioTextFields(item.description, item.project_url);

                        const normalizedMediaUrls = Array.isArray(item.media_urls)
                            ? item.media_urls
                                .map((mediaUrl) => resolvePortfolioMediaUrl(mediaUrl))
                                .filter(Boolean)
                            : [];

                        const resolvedThumbnailUrl = getPortfolioImageUrl(
                            item.thumbnail_url,
                            normalizedMediaUrls.length > 0 ? normalizedMediaUrls : item.media_urls,
                        );

                        return {
                            id: item.id,
                            title: item.title || '',
                            thumbnail_url: resolvedThumbnailUrl,
                            description: sanitizedDescription,
                            client_name: item.client_name || undefined,
                            completion_date: item.completion_date || undefined,
                            project_url: sanitizedProjectUrl,
                            skills_used: portfolioSkills.length > 0 ? portfolioSkills : undefined,
                            tools_used: portfolioTools.length > 0 ? portfolioTools : undefined,
                            media_urls: normalizedMediaUrls.length > 0 ? normalizedMediaUrls : undefined,
                        };
                    }),
                    reviews: reviewRows.map((review) => {
                        const reviewer = getSingleReviewer(review.reviewer);

                        return {
                            id: review.id,
                            client_name: reviewer?.full_name || tRef.current.reviews?.client || 'Client',
                            client_avatar: reviewer?.avatar_url || undefined,
                            rating: review.rating,
                            comment: review.comment || '',
                            created_at: review.created_at,
                            job_title: getReviewJobTitle(review.contract) || txRef.current('pages.freelancerProfile.jobFallback', undefined, 'Project'),
                            skills_rating: review.skills_rating || undefined,
                        };
                    }),
                };

                setFreelancer(formattedData);
                setCache(usernameOrId, formattedData);
            } catch (error) {
                logger.error('Error loading freelancer profile data', error);
                setFreelancer(null);
                setResolvedProfileId(null);
            } finally {
                if (showLoader) {
                    setIsLoading(false);
                }
            }
        }, [usernameOrId]);

    useEffect(() => {
        // If we have cached data, fetch in background without showing loader
        const hasCached = !!freelancer;
        void loadFreelancer(!hasCached);
    }, [loadFreelancer]);

    useEffect(() => {
        if (!resolvedProfileId) {
            return;
        }

        if (typeof supabase.channel !== 'function') {
            return;
        }

        const channel = supabase
            .channel(`freelancer-profile-live-${resolvedProfileId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'freelancer_profiles',
                filter: `id=eq.${resolvedProfileId}`,
            }, () => {
                void loadFreelancer(false);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'public_profiles',
                filter: `id=eq.${resolvedProfileId}`,
            }, () => {
                void loadFreelancer(false);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'portfolio_items',
                filter: `freelancer_id=eq.${resolvedProfileId}`,
            }, () => {
                void loadFreelancer(false);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'reviews',
                filter: `reviewee_id=eq.${resolvedProfileId}`,
            }, () => {
                void loadFreelancer(false);
            })
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [loadFreelancer, resolvedProfileId]);

    const viewerRole = useMemo<ProfilePageProps['viewerRole']>(() => {
        if (!user) return 'guest';

        const metadataUsername = typeof user.user_metadata?.username === 'string'
            ? user.user_metadata.username
            : undefined;

        const viewingOwnProfile = !usernameOrId
            || usernameOrId === user.id
            || usernameOrId === profile?.username
            || usernameOrId === metadataUsername;
        if (viewingOwnProfile) {
            return isPublicPreview ? 'guest' : 'owner';
        }

        if (activeMode === 'client') return 'client';
        if (activeMode === 'freelancer') return 'freelancer';

        if (profile?.user_type === 'freelancer') return 'freelancer';
        return 'client';
    }, [activeMode, isPublicPreview, profile?.user_type, profile?.username, user, usernameOrId]);

    const canStartInteraction = () => {
        if (!user?.id) {
            showToast(tx('pages.freelancerProfile.toasts.loginRequired', undefined, 'Please log in to continue'), 'info');
            navigate(ROUTES.login, { state: { from: `/freelancer/${usernameOrId || ''}` } });
            return false;
        }

        if (freelancer?.id && user.id === freelancer.id) {
            showToast(tx('pages.freelancerProfile.toasts.contactDisabledOwnProfile', undefined, 'Public preview mode: contact action is disabled on your own profile.'), 'info');
            return false;
        }

        if (!freelancer?.id) {
            return false;
        }

        return true;
    };

    const openContactModal = () => {
        if (!canStartInteraction()) {
            return;
        }

        setShowContactModal(true);
    };

    const startHireFlow = () => {
        if (!canStartInteraction()) {
            return;
        }

        if (!freelancer?.id) {
            return;
        }

        setShowInviteModal(true);
    };

    if (isLoading && !freelancer) {
        return (
            <div className="min-h-screen page-bg-base">
                <Header />
                <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                    {/* Left column */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Profile header skeleton */}
                        <div className="surface-card border border-surface rounded-2xl p-6">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-[#262626]" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-6 w-48 bg-[#262626] rounded-lg" />
                                    <div className="h-4 w-32 bg-[#262626] rounded-lg" />
                                    <div className="flex gap-2">
                                        <div className="h-6 w-20 bg-[#262626] rounded-full" />
                                        <div className="h-6 w-20 bg-[#262626] rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Bio skeleton */}
                        <div className="surface-card border border-surface rounded-2xl p-6 space-y-3">
                            <div className="h-4 w-32 bg-[#262626] rounded" />
                            <div className="h-4 w-full bg-[#262626] rounded" />
                            <div className="h-4 w-3/4 bg-[#262626] rounded" />
                        </div>
                        {/* Skills skeleton */}
                        <div className="surface-card border border-surface rounded-2xl p-6 space-y-3">
                            <div className="h-4 w-32 bg-[#262626] rounded" />
                            <div className="flex flex-wrap gap-2">
                                {[1,2,3,4].map(i => <div key={i} className="h-8 w-24 bg-[#262626] rounded-full" />)}
                            </div>
                        </div>
                    </div>
                    {/* Right column */}
                    <div className="flex flex-col gap-4">
                        <div className="surface-card border border-surface rounded-2xl p-6 space-y-3">
                            <div className="h-10 w-full bg-[#262626] rounded-xl" />
                            <div className="h-10 w-full bg-[#262626] rounded-xl" />
                            <div className="h-10 w-full bg-[#262626] rounded-xl" />
                        </div>
                        <div className="surface-card border border-surface rounded-2xl p-6 grid grid-cols-2 gap-3">
                            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-[#262626] rounded-xl" />)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="min-h-screen page-bg-base">
                <Header />
            </div>
        );
    }

    return (
        <div className="min-h-screen page-bg-base">
            <Header />
            {isPublicPreview ? (
                <div className="max-w-6xl mx-auto px-6 pt-5">
                    <div 
                        className="surface-card border rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                        style={{ borderColor: 'var(--color-border-default)' }}
                    >
                        <div>
                            <p 
                                className="text-sm font-semibold"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                {tx('pages.freelancerProfile.publicPreview.title', undefined, 'Public Profile Preview')}
                            </p>
                            <p 
                                className="text-xs"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                {tx('pages.freelancerProfile.publicPreview.description', undefined, 'You are viewing your profile as other users see it.')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(`/freelancer/${usernameOrId || user?.id || ''}`)}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                            style={{ 
                                borderColor: 'var(--color-border-default)',
                                color: 'var(--color-text-secondary)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-text-primary)';
                                e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--color-text-secondary)';
                                e.currentTarget.style.borderColor = 'var(--color-border-default)';
                            }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {tx('pages.freelancerProfile.publicPreview.exit', undefined, 'Exit Preview')}
                        </button>
                    </div>
                </div>
            ) : null}
            <ProfileView
                viewerRole={viewerRole}
                freelancer={freelancer}
                onOpenContact={openContactModal}
                onHireNow={startHireFlow}
                onSaveAvatar={saveAvatar}
                onSaveBasics={saveProfileBasics}
                onSaveBio={saveBio}
                onSaveSkills={saveSkills}
                onSaveTools={saveTools}
                onRefreshWorkSamples={() => loadFreelancer(false)}
            />

            {freelancer?.id ? (
                <ContactModal
                    isOpen={showContactModal}
                    onClose={() => setShowContactModal(false)}
                    freelancerId={freelancer.id}
                    freelancerName={freelancer.full_name}
                    freelancerAvatar={freelancer.avatar_url}
                    freelancerTitle={freelancer.title}
                    hourlyRate={freelancer.hourly_rate}
                    accentColor="#8B5CF6"
                />
            ) : null}

            {freelancer?.id ? (
                <InviteToJobModal
                    isOpen={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    freelancerId={freelancer.id}
                    freelancerName={freelancer.full_name || freelancer.username || 'this freelancer'}
                />
            ) : null}
        </div>
    );
}


