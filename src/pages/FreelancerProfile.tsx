import {
    MapPin,
    Star,
    _Target,
    Briefcase,
    CalendarDays,
    Camera,
    ChevronLeft,
    ChevronRight,
    _Eye,
    ExternalLink,
    _ShieldCheck,
    TrendingUp,
    _Wallet,
    Clock,
    _Coins,
    Check,
    CheckCircle,
    Circle,
    Images,
    Plus,
    Edit2,
    Trash2,
    _Settings,
    MessageSquare,
    ArrowLeft,
    X,
    _Save,
    _Loader2,
    _DollarSign,
    Globe,
    Share2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { getStorageConfigErrorMessage, isMissingStorageBucketError, supabase } from '../lib/supabase';
import { useTranslation } from '../i18n';
import { localizeGovernorate } from '../lib/governorates';
import { ROUTES } from '@/lib/routes';
import { logger } from '@/lib/logger';
import { usePresence } from '@/hooks/usePresence';
import ContactModal from '../components/freelancer/ContactModal';
import InviteToJobModal from '../components/freelancer/InviteToJobModal';
import { uploadAvatar } from '@/services/profiles';
import { getPortfolioImageUrl, resolvePortfolioMediaUrl } from '@/lib/portfolioMedia';
import { splitPortfolioSkillsAndTools } from '@/lib/portfolioTools';
import {
    _ProfileAvatar,
    _ProfileEmptyState,
    _ProfileInfoHeader,
    _ProfileInfoRow,
    _ProfileSectionCard,
    _ProfileSectionHeader,
    _ProfileStatCard,
} from '@/components/profile/ProfilePrimitives';




import OptimizedImage from '@/components/common/OptimizedImage';
import type {
    FreelancerData,
    FreelancerProfilePublicRow,
    FreelancerReviewRow,
    FreelancerSkillValue,
    FreelancerUsernameLookupRow,
    PortfolioItemRow,
} from '../types/freelancer';
import { PREDEFINED_SKILLS, type Skill } from '@/types';

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

interface _PickerOption {
    id: string;
    name: string;
    category: string;
}

function _toCategoryLabel(value: string): string {
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
    if (typeof fallbackBio === 'string' && fallbackBio.trim().length > 0) {
        return fallbackBio.trim();
    }

    const preferences = toRecord(projectPreferences);
    const intro = preferences.bio;

    if (typeof intro === 'string' && intro.trim().length > 0) {
        return intro.trim();
    }

    return '';
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
    const { tx, txPlural, language } = useTranslation();
    const { user, profile } = useAuth();
    const { isOnline } = usePresence({
        userId: user?.id,
        isOnlineForMessages: profile?.is_online_for_messages !== false,
    });
    const _avatarInputRef = useRef<HTMLInputElement | null>(null);

    const [savingAvatar, setSavingAvatar] = useState(false);
    const [activeWorkSampleId, setActiveWorkSampleId] = useState<string | null>(null);
    const [activeWorkImageIndex, setActiveWorkImageIndex] = useState(0);
    const [deletingWorkSampleId, setDeletingWorkSampleId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [localTime, setLocalTime] = useState(() => {
        return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setLocalTime(new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }));
        }, 30000);
        return () => clearInterval(timer);
    }, []);

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

    const _strengths = freelancer.skills.length > 0
        ? freelancer.skills.map((skill) => resolveFreelancerSkillLabel(skill)).filter(Boolean)
        : ['Web Development', 'Web Research'];

    const _tools = freelancer.tools.length > 0
        ? freelancer.tools
        : ['Figma', 'Canva', 'VS Code', 'Docker', 'Vercel', 'MongoDB'];

    const reviewBuckets = [5, 4, 3, 2, 1].map((score) => {
        const total = freelancer.stats.reviews_count || 0;
        const count = freelancer.reviews.filter((r) => Math.round(r.rating) === score).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;

        return { score, pct };
    });

    const _accentColor = 'var(--workspace-primary)';

    const _isSavingAnySection = savingAvatar;

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
            label: tx('publicProfile.available', undefined, 'Available'),
            color: '#4ade80',
            background: 'rgba(34,197,94,0.12)',
            border: 'rgba(34,197,94,0.3)',
        }
        : freelancer.availability === 'busy'
            ? {
                label: tx('publicProfile.busy', undefined, 'Busy'),
                color: '#fbbf24',
                background: 'rgba(245,158,11,0.12)',
                border: 'rgba(245,158,11,0.3)',
            }
            : {
                label: tx('publicProfile.offline', undefined, 'Offline'),
                color: '#d1d5db',
                background: 'rgba(107,114,128,0.12)',
                border: 'rgba(107,114,128,0.3)',
            };

  const _heroBadges = [
    { label: tx('settings.profileTabs.freelancer', undefined, 'Freelancer'), style: "filled" as const },
    { label: availabilityBadge.label, style: "filled" as const },
  ];

  const _heroMeta = [
    { icon: <MapPin className="w-3.5 h-3.5" />, label: localizeGovernorate(freelancer.location, language) || localizeGovernorate('Ariana', language) },
    { icon: <Star className="w-3.5 h-3.5" />, label: `${freelancer.stats.rating.toFixed(1)} - ${txPlural('pages.freelancerProfile.main.reviewsCount', freelancer.stats.reviews_count, undefined, `${freelancer.stats.reviews_count} reviews`)}` },
    { icon: <TrendingUp className="w-3.5 h-3.5" />, label: `${freelancer.stats.success_rate}% ${tx('pages.freelancerCard.success', undefined, 'success')}` },
  ];

  const _heroActions = isOwner ? (
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

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(rate);
  };

  const displayRate = freelancer.hourly_rate > 0
    ? tx('pages.freelancerProfile.main.hourlyRateFormat', { rate: formatRate(freelancer.hourly_rate) }, `${formatRate(freelancer.hourly_rate)}/hr`)
    : tx('pages.freelancerProfile.main.hourlyRateFormat', { rate: formatRate(0) }, '$0.00/hr');

  const initialAvatar = freelancer.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="min-h-screen w-full bg-[#f9fafb] dark:bg-black py-6 px-2 sm:px-4 transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-[#2d2d2d] rounded-2xl shadow-sm overflow-hidden transition-colors duration-200 relative">
        
        {/* ─── Profile Header ────────────────────────────────────────────── */}
        <header className="relative p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 dark:bg-[#8B5CF6]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/5 dark:bg-[#3B82F6]/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 flex-1 w-full">
            {/* Avatar block with green dot and gradient ambient border */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] opacity-20 group-hover:opacity-70 blur-sm transition duration-500" />
              {freelancer.avatar_url ? (
                <img
                  src={freelancer.avatar_url}
                  alt={freelancer.full_name}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border border-gray-200 dark:border-[#2d2d2d] bg-white dark:bg-[#0c0c0e]"
                />
              ) : (
                <div
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-3xl font-bold text-white select-none"
                  style={{ background: '#10B981' }}
                >
                  {initialAvatar}
                </div>
              )}
              
              {/* Availability Status Dot with breathing pulse */}
              {isOnline(freelancer.id) && (
                <span className="absolute bottom-1 right-1 w-4 h-4 shrink-0 flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-[#10B981] opacity-40" />
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#10B981] opacity-75" style={{ animationDelay: '500ms', animationDuration: '2s' }} />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981] border border-white dark:border-[#0c0c0e]" />
                </span>
              )}

              {/* Camera overlay for avatar upload (owner only) */}
              {isOwner && typeof onSaveAvatar === 'function' && (
                <label className={`absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full transition-opacity duration-200 cursor-pointer ${
                  savingAvatar ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                }`}>
                  {savingAvatar ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-[10px] text-white font-medium uppercase tracking-wider">
                        {tx('ui.change', undefined, 'Change')}
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUploadSelection}
                    disabled={savingAvatar}
                  />
                </label>
              )}
            </div>

            {/* Info details */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-zinc-50 tracking-tight">
                  {freelancer.full_name || 'Freelancer'}
                </h1>
                
                {/* Verification badge */}
                {(freelancer.verifications.cin || freelancer.verifications.email) && (
                  <CheckCircle 
                    className="w-5 h-5 text-[#10B981] fill-white dark:fill-[#0c0c0e] shrink-0"
                    aria-label="Verified"
                  />
                )}
              </div>

              {/* Location & Local Time */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                  <span>{localizeGovernorate(freelancer.location, language)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                  <span>{tx('pages.freelancerProfile.main.localTime', { time: localTime }, `${localTime} local time`)}</span>
                </span>
              </div>

              {/* Stats: Rating, Jobs, Response Time */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 mt-4 text-sm text-gray-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1 text-[#F59E0B] font-medium">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{freelancer.stats.rating.toFixed(1)} ({txPlural('pages.freelancerProfile.main.reviewsCount', freelancer.stats.reviews_count, undefined, `${freelancer.stats.reviews_count} reviews`)})</span>
                </span>
                <span className="text-gray-300 dark:text-[#2d2d2d] select-none">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                  <span>{txPlural('pages.freelancerProfile.main.jobsCompletedCount', freelancer.stats.jobs_completed, undefined, `${freelancer.stats.jobs_completed} jobs completed`)}</span>
                </span>
                <span className="text-gray-300 dark:text-[#2d2d2d] select-none">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                  <span>
                    {freelancer.stats.response_time_hours <= 2 
                      ? tx('pages.freelancerProfile.stats.lessThanTwoHours', undefined, '< 2 hrs') 
                      : tx('pages.freelancerProfile.stats.hoursResponseTime', { hours: freelancer.stats.response_time_hours }, `< ${freelancer.stats.response_time_hours} hrs`)}
                    {' '}{tx('pages.freelancerProfile.main.responseTimeSuffix', undefined, 'response time')}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons (Right side) */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end mt-4 md:mt-0 shrink-0 flex-wrap z-10">
            {isOwner ? (
              <button
                type="button"
                onClick={() => navigate('/settings?tab=profile')}
                className="rounded-full border border-[#8B5CF6] hover:bg-[#8B5CF6]/5 text-[#8B5CF6] dark:text-[#8B5CF6] dark:border-[#8B5CF6] px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-all duration-150"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {tx('pages.freelancerProfile.cta.editProfile', undefined, 'Edit Profile')}
              </button>
            ) : viewerRole === 'client' ? (
              <>
                <button
                  type="button"
                  onClick={onHireNow}
                  className="rounded-full bg-[#8B5CF6] hover:bg-[#7c3aed] text-white px-5 py-2 text-sm font-semibold transition-all duration-150"
                >
                  {tx('pages.freelancerProfile.cta.hireMe', undefined, 'Hire Me')}
                </button>
                <button
                  type="button"
                  onClick={onOpenContact}
                  className="rounded-full border border-gray-300 dark:border-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#161618] text-gray-700 dark:text-zinc-300 px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-all duration-150"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {tx('pages.freelancerProfile.cta.sendMessage', undefined, 'Send Message')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenContact}
                className="rounded-full border border-gray-300 dark:border-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#161618] text-gray-700 dark:text-zinc-300 px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-all duration-150"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {tx('pages.freelancerProfile.cta.sendMessage', undefined, 'Send Message')}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                showToast(tx('pages.freelancerProfile.toasts.linkCopied', undefined, 'Profile link copied to clipboard'), 'success');
                setTimeout(() => setCopied(false), 2000);
              }}
              className={`rounded-full border px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-all duration-300 transform active:scale-95 ${
                copied 
                  ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' 
                  : 'border-gray-300 dark:border-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#161618] text-gray-700 dark:text-zinc-300'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {tx('pages.freelancerProfile.main.copied', undefined, 'Copied!')}
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  {tx('pages.freelancerProfile.main.share', undefined, 'Share')}
                </>
              )}
            </button>
          </div>
        </header>

        {/* Divider */}
        <div className="border-b border-gray-200 dark:border-[#2d2d2d]" />

        {/* ─── Two-Column Split Grid with Mount Transition ───────────────── */}
        <div className={`grid grid-cols-1 lg:grid-cols-4 transition-all duration-700 transform ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}>
          
          {/* ─── Left Column (3/4 width) ──────────────────────────────────── */}
          <main className="lg:col-span-3 flex flex-col divide-y divide-gray-200 dark:divide-[#2d2d2d]">
            
            {/* Title, Rate & Bio Description */}
            <section className="p-6 sm:p-8 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-50">
                    {freelancer.title || tx('pages.freelancerProfile.main.independentSpecialist', undefined, 'Independent Specialist')}
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">
                    {freelancer.skills && freelancer.skills.length > 0 
                      ? tx('pages.freelancerProfile.main.specializedIn', { skills: freelancer.skills.slice(0, 3).map(s => getFreelancerSkillName(s)).join(', ') }, `Specialized in ${freelancer.skills.slice(0, 3).map(s => getFreelancerSkillName(s)).join(', ')}`)
                      : tx('pages.freelancerProfile.main.specializedFreelancer', undefined, 'Specialized Freelancer')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-gray-900 dark:text-zinc-50">
                    {displayRate}
                  </span>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => navigate('/settings?tab=profile&focus=title')}
                      className="p-1.5 text-gray-400 hover:text-[#8B5CF6] dark:text-zinc-500 dark:hover:text-[#a78bfa] hover:bg-[#8B5CF6]/10 dark:hover:bg-[#8B5CF6]/20 hover:scale-110 active:scale-90 rounded-full transition-all duration-200"
                      aria-label="Edit title and rate"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bio Description Paragraph */}
              <div className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                {freelancer.bio || tx('pages.freelancerProfile.main.noBio', undefined, 'No biography details provided yet.')}
              </div>

              {isOwner && !freelancer.bio && (
                <button
                  type="button"
                  onClick={() => navigate('/settings?tab=profile&focus=bio')}
                  className="text-sm font-semibold text-[#8B5CF6] hover:underline self-start"
                >
                  {tx('pages.freelancerProfile.main.addDescription', undefined, '+ Add description')}
                </button>
              )}
            </section>

            {/* Skills & Tools */}
            <section className="p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">
                  {tx('pages.freelancerProfile.main.skills', undefined, 'Skills')}
                </h3>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => navigate('/settings?tab=profile&focus=skills')}
                    className="p-1.5 text-gray-400 hover:text-[#8B5CF6] dark:text-zinc-500 dark:hover:text-[#a78bfa] hover:bg-[#8B5CF6]/10 dark:hover:bg-[#8B5CF6]/20 hover:scale-110 active:scale-90 rounded-full transition-all duration-200"
                    aria-label="Edit skills and tools"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Services/Skills */}
                {freelancer.skills && freelancer.skills.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                      {tx('pages.freelancerProfile.main.services', undefined, 'Services')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="px-3.5 py-1.5 bg-gray-50 dark:bg-[#161618] border border-gray-200 dark:border-[#2d2d2d] rounded-full text-xs font-medium text-gray-700 dark:text-zinc-300 hover:scale-105 hover:bg-[#8B5CF6]/5 hover:border-[#8B5CF6]/40 dark:hover:bg-[#8B5CF6]/10 dark:hover:border-[#a78bfa]/40 transition-all duration-200"
                        >
                          {getFreelancerSkillName(skill)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tools */}
                {freelancer.tools && freelancer.tools.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                      {tx('pages.freelancerProfile.main.tools', undefined, 'Tools')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.tools.map((tool) => (
                        <span
                          key={tool}
                          className="px-3.5 py-1.5 bg-gray-50 dark:bg-[#161618] border border-gray-200 dark:border-[#2d2d2d] rounded-full text-xs font-medium text-gray-700 dark:text-zinc-300 hover:scale-105 hover:bg-[#8B5CF6]/5 hover:border-[#8B5CF6]/40 dark:hover:bg-[#8B5CF6]/10 dark:hover:border-[#a78bfa]/40 transition-all duration-200"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Industries */}
                {freelancer.industries && freelancer.industries.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                      {tx('pages.freelancerProfile.main.industries', undefined, 'Industries')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.industries.map((industry) => (
                        <span
                          key={industry}
                          className="px-3.5 py-1.5 bg-gray-50 dark:bg-[#161618] border border-gray-200 dark:border-[#2d2d2d] rounded-full text-xs font-medium text-gray-700 dark:text-zinc-300 hover:scale-105 hover:bg-[#8B5CF6]/5 hover:border-[#8B5CF6]/40 dark:hover:bg-[#8B5CF6]/10 dark:hover:border-[#a78bfa]/40 transition-all duration-200"
                        >
                          {industry}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Project Preferences & Details */}
            <section className="p-6 sm:p-8 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">
                  {tx('pages.freelancerProfile.projectPreferences.title', undefined, 'Project Preferences & Details')}
                </h3>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => navigate('/settings?tab=profile&focus=project_preferences')}
                    className="p-1.5 text-gray-400 hover:text-[#8B5CF6] dark:text-zinc-500 dark:hover:text-[#a78bfa] hover:bg-[#8B5CF6]/10 dark:hover:bg-[#8B5CF6]/20 hover:scale-110 active:scale-90 rounded-full transition-all duration-200"
                    aria-label="Edit project preferences"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-2.5 p-4 rounded-xl border border-gray-100 dark:border-[#2d2d2d] bg-gray-50/50 dark:bg-[#161618]/30 hover:-translate-y-0.5 hover:border-[#8B5CF6]/20 hover:shadow-sm transition-all duration-300">
                  <h4 className="font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#8B5CF6]" />
                    {tx('pages.freelancerProfile.projectPreferences.revisionPolicy', undefined, 'Revision Policy')}
                  </h4>
                  <p className="text-gray-600 dark:text-zinc-400 leading-relaxed text-xs">
                    {freelancer.revision_policy || tx('pages.freelancerProfile.projectPreferences.revisionPolicyDefault', undefined, '2 revisions included, additional billed separately.')}
                  </p>
                </div>

                <div className="space-y-2.5 p-4 rounded-xl border border-gray-100 dark:border-[#2d2d2d] bg-gray-50/50 dark:bg-[#161618]/30 hover:-translate-y-0.5 hover:border-[#8B5CF6]/20 hover:shadow-sm transition-all duration-300">
                  <h4 className="font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#8B5CF6]" />
                    {tx('pages.freelancerProfile.projectPreferences.projectPreferences', undefined, 'Project Preferences')}
                  </h4>
                  <p className="text-gray-600 dark:text-zinc-400 leading-relaxed text-xs">
                    {(freelancer.project_preferences?.details as string) || tx('pages.freelancerProfile.projectPreferences.projectPreferencesDefault', undefined, 'Open to project scope changes, regular text/call communication, and milestone-based deliverables.')}
                  </p>
                </div>
              </div>
            </section>

            {/* Portfolio */}
            <section className="p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">
                  {tx('pages.freelancerProfile.main.portfolio', undefined, 'Portfolio')}
                </h3>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.freelancerPortfolio)}
                    className="text-[#8B5CF6] hover:underline text-sm font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    {tx('pages.freelancerProfile.main.add', undefined, 'Add')}
                  </button>
                )}
              </div>

              {workSamples.length > 0 ? (
                <div className={`grid gap-5 ${workSamples.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {workSamples.map((item) => {
                    const workImages = getWorkSampleImages(item);
                    const workImage = workImages[0] || '';
                    const workTitle = item.title?.trim() || tx('pages.freelancerProfile.main.untitledWork', undefined, 'Untitled work');

                    return (
                      <article
                        key={item.id}
                        className="group flex flex-col border border-gray-200 dark:border-[#2d2d2d] rounded-xl overflow-hidden bg-white dark:bg-[#0c0c0e] hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/50 hover:border-[#8B5CF6]/30 transition-all duration-300"
                      >
                        {/* Image wrapper */}
                        <div className="relative h-44 w-full bg-gray-50 dark:bg-black overflow-hidden border-b border-gray-200 dark:border-[#2d2d2d]">
                          {workImage ? (
                            <OptimizedImage
                              src={workImage}
                              alt={workTitle}
                              className="h-full w-full"
                              imgClassName="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-[#2d2d2d]">
                              <Briefcase className="w-10 h-10" />
                            </div>
                          )}
                          
                          <div className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white">
                            <Images className="w-3.5 h-3.5" />
                            {txPlural('pages.freelancerProfile.main.photosCount', workImages.length, undefined, `${workImages.length} photos`)}
                          </div>
                        </div>

                        {/* Title and content */}
                        <div className="p-4 flex-1 flex flex-col gap-3">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 line-clamp-1">
                              {workTitle}
                            </h4>
                            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                              {item.description || tx('pages.freelancerProfile.main.noDescription', undefined, 'No description provided.')}
                            </p>
                          </div>

                          {/* Skill pills used */}
                          {item.skills_used && item.skills_used.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {item.skills_used.slice(0, 3).map((skill) => (
                                <span
                                  key={skill}
                                  className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-[#2d2d2d] text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-[#161618]/50"
                                >
                                  {skill}
                                </span>
                              ))}
                              {item.skills_used.length > 3 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-[#2d2d2d] text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-[#161618]/50">
                                  +{item.skills_used.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action row */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-[#2d2d2d]/80 mt-1">
                            {item.project_url ? (
                              <a
                                href={item.project_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-[#8B5CF6] dark:text-[#a78bfa] hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {tx('pages.freelancerProfile.main.openLink', undefined, 'Open Link')}
                              </a>
                            ) : (
                              <span />
                            )}

                            <div className="flex items-center gap-1.5">
                              {isOwner ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => editWorkSample(item.id)}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors"
                                    title="Edit project"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { void deleteWorkSample(item.id); }}
                                    disabled={deletingWorkSampleId === item.id}
                                    className="p-1.5 text-gray-400 hover:text-red-650 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50"
                                    title="Delete project"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => openWorkSampleViewer(item.id)}
                                className="text-xs font-semibold text-[#8B5CF6] hover:underline"
                              >
                                {tx('pages.freelancerProfile.main.viewProject', undefined, 'View Project')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-300 dark:border-[#2d2d2d] rounded-xl bg-gray-50/50 dark:bg-[#161618]/10 text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#161618] text-gray-400 dark:text-[#2d2d2d] mb-3">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                    {tx('pages.freelancerProfile.workSamples.emptyTitle', undefined, 'No work samples added yet')}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-[280px] leading-relaxed mb-4">
                    {tx('pages.freelancerProfile.main.workSamplesEmptyDesc', undefined, 'Showcase case studies, designs, products, and measurable outcomes to attract clients.')}
                  </p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.freelancerPortfolio)}
                      className="px-5 py-2 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
                    >
                      {tx('pages.freelancerProfile.main.addFirstWorkSample', undefined, 'Add your first work sample')}
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Work History & Reviews */}
            <section className="p-6 sm:p-8 flex flex-col gap-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">
                {tx('pages.freelancerProfile.main.workHistoryAndReviews', undefined, 'Work History & Reviews')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-start">
                <div className="border border-gray-200 dark:border-[#2d2d2d] bg-gray-50/30 dark:bg-[#161618]/30 rounded-xl p-4 text-center">
                  <p className="text-5xl font-black text-gray-900 dark:text-zinc-50 leading-none">
                    {freelancer.stats.rating.toFixed(1)}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        className="w-4 h-4"
                        style={{
                          color: value <= Math.round(freelancer.stats.rating) ? '#F59E0B' : '#d1d5db',
                          fill: value <= Math.round(freelancer.stats.rating) ? '#F59E0B' : 'none',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                    {txPlural('pages.freelancerProfile.main.reviewsCount', freelancer.stats.reviews_count, undefined, `${freelancer.stats.reviews_count} reviews`)}
                  </p>
                </div>

                <div className="space-y-2 flex-1">
                  {reviewBuckets.map(({ score, pct }) => (
                    <div key={score} className="flex items-center gap-3 text-xs group">
                      <span className="w-3 text-gray-500 dark:text-zinc-400">{score}</span>
                      <div className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-[#161618] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#8B5CF6] transition-all duration-500 group-hover:brightness-110"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-gray-400 dark:text-zinc-500 group-hover:text-[#8B5CF6] group-hover:font-medium transition-all">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {freelancer.reviews.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-[#2d2d2d] mt-4">
                  {freelancer.reviews.slice(0, 5).map((review) => (
                    <article key={review.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            {review.job_title || tx('pages.freelancerProfile.main.projectCollaboration', undefined, 'Project Collaboration')}
                          </h4>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                            {tx('pages.freelancerProfile.main.reviewBy', { name: review.client_name }, `by ${review.client_name}`)} • {new Date(review.created_at).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-1 text-[#F59E0B] font-medium text-sm">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-zinc-300 italic font-normal leading-relaxed mt-1">
                        "{review.comment}"
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center border border-gray-100 dark:border-[#2d2d2d] rounded-xl bg-gray-50/20 dark:bg-[#161618]/10">
                  <p className="text-xs text-gray-400 dark:text-zinc-500">
                    {tx('pages.freelancerProfile.reviews.empty', undefined, 'No reviews yet. Complete your first contract to receive feedback.')}
                  </p>
                </div>
              )}
            </section>
          </main>

          {/* ─── Right Column (1/4 width, Sidebar) ─────────────────────────── */}
          <aside className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-[#2d2d2d] flex flex-col divide-y divide-gray-200 dark:divide-[#2d2d2d]">
            
            {/* Availability & Stats */}
            <section className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50">
                  {tx('pages.freelancerProfile.stats.availabilityAndStats', undefined, 'Availability & Stats')}
                </h3>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => navigate('/settings?tab=profile&focus=availability')}
                    className="p-1.5 text-gray-400 hover:text-[#8B5CF6] dark:text-zinc-500 dark:hover:text-[#a78bfa] hover:bg-[#8B5CF6]/10 dark:hover:bg-[#8B5CF6]/20 hover:scale-110 active:scale-90 rounded-full transition-all duration-200"
                    aria-label="Edit availability settings"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <dl className="space-y-3.5 text-sm">
                <div className="flex justify-between items-start gap-3">
                  <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx('pages.freelancerProfile.stats.status', undefined, 'Status')}</dt>
                  <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: freelancer.availability === 'available' ? '#4ade80' : '#fbbf24' }}
                    />
                    {freelancer.availability === 'available' 
                      ? tx('pages.freelancerProfile.stats.availableForWork', undefined, 'Available for work') 
                      : availabilityBadge.label}
                  </dd>
                </div>

                <div className="flex justify-between items-start gap-3">
                  <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx('pages.freelancerProfile.stats.weeklyAvailability', undefined, 'Weekly availability')}</dt>
                  <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right">
                    {tx('pages.freelancerProfile.stats.hoursPerWeek', { hours: freelancer.weekly_availability_hours || 30 }, `${freelancer.weekly_availability_hours || 30} hrs/week`)}
                  </dd>
                </div>

                <div className="flex justify-between items-start gap-3">
                  <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx('pages.freelancerProfile.stats.yearsOfExperience', undefined, 'Years of experience')}</dt>
                  <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right">
                    {txPlural('pages.freelancerProfile.stats.yearsCount', freelancer.years_experience || 1, undefined, `${freelancer.years_experience || 1} years`)}
                  </dd>
                </div>

                <div className="flex justify-between items-start gap-3">
                  <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx('pages.freelancerProfile.stats.responseTime', undefined, 'Response time')}</dt>
                  <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right">
                    {freelancer.stats.response_time_hours <= 2 
                      ? tx('pages.freelancerProfile.stats.lessThanTwoHours', undefined, '< 2 hrs') 
                      : tx('pages.freelancerProfile.stats.hoursResponseTime', { hours: freelancer.stats.response_time_hours }, `< ${freelancer.stats.response_time_hours} hrs`)}
                  </dd>
                </div>

                <div className="flex justify-between items-start gap-3">
                  <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx('pages.freelancerProfile.stats.jobSuccess', undefined, 'Job Success')}</dt>
                  <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right">
                    {freelancer.stats.success_rate}%
                  </dd>
                </div>

                <div className="flex justify-between items-start gap-3">
                  <dt className="text-gray-500 dark:text-zinc-400 text-xs">{tx('pages.freelancerProfile.stats.profileVisibility', undefined, 'Profile Visibility')}</dt>
                  <dd className="font-semibold text-gray-900 dark:text-zinc-100 text-right flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                    <span>{tx('pages.freelancerProfile.stats.public', undefined, 'Public')}</span>
                  </dd>
                </div>
              </dl>
            </section>

            {/* Portfolio Links */}
            <section className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50">
                  {tx('pages.freelancerProfile.portfolioLinks.title', undefined, 'Portfolio Links')}
                </h3>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => navigate('/settings?tab=profile&focus=portfolio_links')}
                    className="p-1.5 text-gray-400 hover:text-[#8B5CF6] dark:text-zinc-500 dark:hover:text-[#a78bfa] hover:bg-[#8B5CF6]/10 dark:hover:bg-[#8B5CF6]/20 hover:scale-110 active:scale-90 rounded-full transition-all duration-200"
                    aria-label="Edit portfolio links"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {freelancer.portfolio_links && freelancer.portfolio_links.length > 0 ? (
                <ul className="space-y-2.5">
                  {freelancer.portfolio_links.map((link, idx) => {
                    const cleanLink = link.trim();
                    if (!cleanLink) return null;
                    const displayLabel = cleanLink.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || 'Link';
                    return (
                      <li key={idx}>
                        <a
                          href={cleanLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-[#8B5CF6] dark:text-[#a78bfa] hover:underline hover:translate-x-1 transition-transform duration-200"
                        >
                          <Globe className="w-4 h-4 shrink-0 text-gray-400 dark:text-zinc-500" />
                          <span className="truncate">{displayLabel}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{tx('pages.freelancerProfile.portfolioLinks.empty', undefined, 'No links added yet.')}</p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => navigate('/settings?tab=profile&focus=portfolio_links')}
                      className="text-xs font-semibold text-[#8B5CF6] hover:underline mt-1"
                    >
                      {tx('pages.freelancerProfile.portfolioLinks.add', undefined, '+ Add portfolio links')}
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Verifications */}
            <section className="p-6 flex flex-col gap-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50">
                {tx('pages.freelancerProfile.verifications.title', undefined, 'Verifications')}
              </h3>

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2.5">
                  {freelancer.verifications.cin ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-[#10B981] fill-white dark:fill-[#0f0f10]" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0 text-gray-300 dark:text-zinc-700" />
                  )}
                  <span className={freelancer.verifications.cin ? 'text-gray-950 dark:text-zinc-100 font-medium' : 'text-gray-400 dark:text-zinc-500'}>
                    {tx('pages.freelancerProfile.verifications.identityVerified', undefined, 'Identity Verified')}
                  </span>
                </li>

                <li className="flex items-center gap-2.5">
                  {freelancer.verifications.phone ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-[#10B981] fill-white dark:fill-[#0f0f10]" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0 text-gray-300 dark:text-zinc-700" />
                  )}
                  <span className={freelancer.verifications.phone ? 'text-gray-950 dark:text-zinc-100 font-medium' : 'text-gray-400 dark:text-zinc-500'}>
                    {tx('pages.freelancerProfile.verifications.phoneNumber', undefined, 'Phone Number')}
                  </span>
                </li>

                <li className="flex items-center gap-2.5">
                  {freelancer.verifications.email ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-[#10B981] fill-white dark:fill-[#0f0f10]" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0 text-gray-300 dark:text-zinc-700" />
                  )}
                  <span className={freelancer.verifications.email ? 'text-gray-950 dark:text-zinc-100 font-medium' : 'text-gray-400 dark:text-zinc-500'}>
                    {tx('pages.freelancerProfile.verifications.emailAddress', undefined, 'Email Address')}
                  </span>
                </li>

                <li className="flex items-center gap-2.5">
                  {freelancer.verifications.payment ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-[#10B981] fill-white dark:fill-[#0f0f10]" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0 text-gray-300 dark:text-zinc-700" />
                  )}
                  <span className={freelancer.verifications.payment ? 'text-gray-950 dark:text-zinc-100 font-medium' : 'text-gray-400 dark:text-zinc-500'}>
                    {tx('pages.freelancerProfile.verifications.paymentMethod', undefined, 'Payment Method')}
                  </span>
                </li>
              </ul>
            </section>

            {/* Languages */}
            <section className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50">
                  {tx('pages.freelancerProfile.languages.title', undefined, 'Languages')}
                </h3>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => navigate('/settings?tab=profile&focus=languages')}
                    className="p-1.5 text-gray-400 hover:text-[#8B5CF6] dark:text-zinc-500 dark:hover:text-[#a78bfa] hover:bg-[#8B5CF6]/10 dark:hover:bg-[#8B5CF6]/20 hover:scale-110 active:scale-90 rounded-full transition-all duration-200"
                    aria-label="Edit languages"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {freelancer.languages && freelancer.languages.length > 0 ? (
                <ul className="space-y-3">
                  {freelancer.languages.map((lang, idx) => (
                    <li key={idx} className="flex justify-between text-sm gap-2">
                      <span className="font-semibold text-gray-800 dark:text-zinc-200">
                        {tx(`profile.languages.names.${lang.language.toLowerCase()}`, undefined, lang.language)}
                      </span>
                      <span className="text-gray-500 dark:text-zinc-400 capitalize text-xs">
                        {tx(`profile.languages.levels.${lang.proficiency.toLowerCase()}`, undefined, lang.proficiency)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 dark:text-zinc-500">{tx('pages.freelancerProfile.languages.empty', undefined, 'No languages listed.')}</p>
              )}
            </section>

            {/* Education */}
            <section className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50">
                  {tx('pages.freelancerProfile.education.title', undefined, 'Education')}
                </h3>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => navigate('/settings?tab=profile&focus=education')}
                    className="p-1.5 text-gray-400 hover:text-[#8B5CF6] dark:text-zinc-500 dark:hover:text-[#a78bfa] hover:bg-[#8B5CF6]/10 dark:hover:bg-[#8B5CF6]/20 hover:scale-110 active:scale-90 rounded-full transition-all duration-200"
                    aria-label="Add education"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {freelancer.education && freelancer.education.length > 0 ? (
                <ul className="space-y-4">
                  {freelancer.education.map((edu, idx) => (
                    <li key={idx} className="text-sm">
                      <p className="font-semibold text-gray-800 dark:text-zinc-200">{edu.institution}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        {tx('pages.freelancerProfile.education.studyField', { degree: edu.degree, field: edu.field }, `${edu.degree} in ${edu.field}`)}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">{edu.startYear} - {edu.endYear}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{tx('pages.freelancerProfile.education.empty', undefined, 'No education entered yet.')}</p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => navigate('/settings?tab=profile&focus=education')}
                      className="text-xs font-semibold text-[#8B5CF6] hover:underline mt-1"
                    >
                      {tx('pages.freelancerProfile.education.add', undefined, '+ Add education details')}
                    </button>
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      {/* ─── Portfolio item viewer overlay modal ─────────────────────────── */}
      {activeWorkSample && (
        <div
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm p-3 sm:p-6"
          onClick={closeWorkSampleViewer}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mx-auto h-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f10] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="h-full grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="relative bg-black flex flex-col justify-center items-center p-4">
                <button
                  type="button"
                  onClick={closeWorkSampleViewer}
                  className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-black/60 text-white/80 hover:text-white border border-white/20 transition-colors inline-flex items-center justify-center"
                  aria-label="Close viewer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="relative flex-1 flex items-center justify-center w-full">
                  {activeWorkSampleImage ? (
                    <OptimizedImage
                      src={activeWorkSampleImage}
                      alt={activeWorkSample.title || 'Portfolio project image'}
                      className="max-h-[58vh] lg:max-h-[74vh] w-full"
                      imgClassName="object-contain"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white/30">
                      <Briefcase className="w-12 h-12" />
                    </div>
                  )}

                  {activeWorkSampleImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={showPreviousWorkImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white/80 hover:text-white border border-white/20 transition-colors inline-flex items-center justify-center"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={showNextWorkImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white/80 hover:text-white border border-white/20 transition-colors inline-flex items-center justify-center"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {activeWorkSampleImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto w-full max-w-md py-2 justify-center">
                    {activeWorkSampleImages.map((imageUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveWorkImageIndex(idx)}
                        className={`h-12 w-16 shrink-0 overflow-hidden rounded border transition-colors ${idx === activeWorkImageIndex ? 'border-[#8B5CF6]' : 'border-white/10 hover:border-white/30'}`}
                      >
                        <img
                          src={imageUrl}
                          alt="Thumbnail"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <aside className="h-full flex flex-col bg-zinc-900 text-white border-l border-zinc-800 overflow-y-auto">
                <div className="border-b border-zinc-800 p-5">
                  <p className="text-[10px] uppercase tracking-wider text-[#8B5CF6] font-semibold">
                    Project {Math.max(1, activeWorkSamplePosition + 1)} of {workSamples.length}
                  </p>
                  <h3 className="text-lg font-bold text-white mt-1.5">
                    {activeWorkSample.title || 'Untitled Work'}
                  </h3>
                </div>

                <div className="flex-1 p-5 space-y-6">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {activeWorkSample.description || 'No description provided.'}
                  </p>

                  <div className="space-y-3.5 text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
                    {activeWorkSample.client_name && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-zinc-550" />
                        <span>Client: {activeWorkSample.client_name}</span>
                      </div>
                    )}
                    {activeWorkSample.completion_date && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-zinc-550" />
                        <span>Date: {formatPortfolioMonth(activeWorkSample.completion_date)}</span>
                      </div>
                    )}
                    {activeWorkSample.project_url && (
                      <a
                        href={activeWorkSample.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#8B5CF6] hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Project Link
                      </a>
                    )}
                  </div>

                  {activeWorkSample.skills_used && activeWorkSample.skills_used.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Skills Used</p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeWorkSample.skills_used.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-full font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeWorkSample.tools_used && activeWorkSample.tools_used.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tools Used</p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeWorkSample.tools_used.map((tool) => (
                          <span
                            key={tool}
                            className="text-xs px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-full font-medium"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {workSamples.length > 1 && (
                  <div className="border-t border-zinc-800 p-4 flex items-center justify-between gap-3 bg-zinc-950/40">
                    <button
                      type="button"
                      onClick={showPreviousWorkSample}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={showNextWorkSample}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:text-white transition-colors"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}
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

    const _saveBio = useCallback(async (bio: string) => {
        if (!user?.id) {
            return;
        }

        const normalizedBio = bio.trim();

        // 1. Update profiles table bio (the single source of truth)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ bio: normalizedBio })
            .eq('id', user.id);

        if (profileError) {
            logger.error('Error updating profile bio in profiles table', profileError);
            throw profileError;
        }

        // 2. Clear bio from freelancer_profiles project_preferences to prevent shadowing
        const currentPreferences = toRecord(freelancer?.project_preferences);
        const nextPreferences = { ...currentPreferences };
        delete nextPreferences.bio;

        const { error: prefsError } = await supabase
            .from('freelancer_profiles')
            .update({ project_preferences: nextPreferences })
            .eq('id', user.id);

        if (prefsError) {
            logger.error('Error clearing profile bio from project_preferences', prefsError);
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

    const _saveProfileBasics = useCallback(async (payload: {
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

    const _saveSkills = useCallback(async (skillNames: string[]) => {
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

    const _saveTools = useCallback(async (toolNames: string[]) => {
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
                                user_type,
                                phone_verified,
                                payment_verified
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
                    years_experience: profileRow.years_experience ?? 1,
                    industries: Array.isArray(profileRow.industries) ? profileRow.industries : [],
                    portfolio_links: Array.isArray(profileRow.portfolio_links) ? profileRow.portfolio_links : [],
                    weekly_availability_hours: profileRow.weekly_availability_hours ?? 30,
                    revision_policy: profileRow.revision_policy ?? '',
                    project_preferences: toRecord(profileRow.project_preferences),
                    stats,
                    verifications: {
                        cin: profileRow.cin_verified || false,
                        phone: profileRow.profile?.phone_verified || false,
                        email: true,
                        payment: profileRow.profile?.payment_verified || false,
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
                <div className="max-w-[1400px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
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
                <div className="max-w-[1400px] mx-auto px-4 pt-4">
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


