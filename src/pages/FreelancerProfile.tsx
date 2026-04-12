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
    Settings,
    MessageSquare,
    ArrowLeft,
    X,
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
import ContactModal from '../components/freelancer/ContactModal';
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
import OptimizedImage from '@/components/common/OptimizedImage';
import type {
    FreelancerData,
    FreelancerProfilePublicRow,
    FreelancerReviewRow,
    FreelancerSkillValue,
    FreelancerUsernameLookupRow,
    PortfolioItemRow,
} from '../types/freelancer';
import { PREDEFINED_SKILLS, PREDEFINED_TOOLS } from '@/types';

interface ProfilePageProps {
    // 'owner': The freelancer viewing their own profile
    // 'client': A business/client looking to hire
    // 'freelancer': A different freelancer browsing the platform
    // 'guest': Not logged in
    viewerRole: 'owner' | 'client' | 'freelancer' | 'guest';
}

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

function CompactMultiSelectEditor({
    title,
    searchQuery,
    onSearchChange,
    options,
    selectedValues,
    onToggle,
    accentColor,
    maxSelected,
}: {
    title: string;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    options: PickerOption[];
    selectedValues: string[];
    onToggle: (value: string) => void;
    accentColor: string;
    maxSelected: number;
}) {
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const categories = useMemo(() => {
        const values = Array.from(new Set(options.map((option) => option.category)));
        return ['all', ...values];
    }, [options]);

    const filteredOptions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return options.filter((option) => {
            const matchesCategory = activeCategory === 'all' || option.category === activeCategory;
            const matchesSearch = !query || option.name.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, options, searchQuery]);

    return (
        <div className="mt-3 rounded-xl border border-[#262626] bg-[#0a0a0a] p-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={`Search ${title.toLowerCase()}...`}
                    className="flex-1 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white p-2.5 outline-none transition-all"
                />
                <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full border w-fit"
                    style={{
                        borderColor: `color-mix(in srgb, ${accentColor} 35%, #262626)`,
                        background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                        color: accentColor,
                    }}
                >
                    {selectedValues.length}/{maxSelected}
                </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((category) => {
                    const isActive = category === activeCategory;
                    return (
                        <button
                            key={category}
                            type="button"
                            onClick={() => setActiveCategory(category)}
                            className="px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-colors"
                            style={{
                                borderColor: isActive
                                    ? `color-mix(in srgb, ${accentColor} 45%, #262626)`
                                    : '#262626',
                                background: isActive
                                    ? `color-mix(in srgb, ${accentColor} 12%, transparent)`
                                    : '#141414',
                                color: isActive ? accentColor : '#9ca3af',
                            }}
                        >
                            {category === 'all' ? 'All' : toCategoryLabel(category)}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3">
                <div className="border border-[#262626] rounded-xl p-2 bg-[#111111] max-h-56 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredOptions.map((option) => {
                            const isSelected = selectedValues.includes(option.name);

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onToggle(option.name)}
                                    className="w-full text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between"
                                    style={{
                                        borderColor: isSelected
                                            ? `color-mix(in srgb, ${accentColor} 45%, transparent)`
                                            : '#262626',
                                        background: isSelected
                                            ? `color-mix(in srgb, ${accentColor} 14%, transparent)`
                                            : '#141414',
                                        color: isSelected ? accentColor : '#e5e7eb',
                                    }}
                                >
                                    <span className="text-sm font-medium">{option.name}</span>
                                    {isSelected ? <Check className="w-4 h-4" /> : null}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="border border-[#262626] rounded-xl p-2 bg-[#111111] max-h-56 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-400 mb-2">Selected {title}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {selectedValues.length === 0 ? (
                            <p className="text-xs text-gray-500">No {title.toLowerCase()} selected.</p>
                        ) : (
                            selectedValues.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => onToggle(value)}
                                    className="text-xs px-2 py-1 rounded-full border"
                                    style={{
                                        borderColor: `color-mix(in srgb, ${accentColor} 40%, #262626)`,
                                        color: accentColor,
                                        background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                                    }}
                                >
                                    {value}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProfileView({
    viewerRole,
    freelancer,
    onOpenContact,
    onSaveAvatar,
    onSaveBasics,
    onSaveBio,
    onSaveSkills,
    onSaveTools,
}: ProfilePageProps & {
    freelancer: FreelancerData;
    onOpenContact: () => void;
    onSaveAvatar: (file: File) => Promise<void>;
    onSaveBasics: (payload: {
        fullName: string;
        title: string;
        hourlyRate: number;
        availability: FreelancerData['availability'];
    }) => Promise<void>;
    onSaveBio: (bio: string) => Promise<void>;
    onSaveSkills: (skills: string[]) => Promise<void>;
    onSaveTools: (tools: string[]) => Promise<void>;
}) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const avatarInputRef = useRef<HTMLInputElement | null>(null);

    const [editingBasics, setEditingBasics] = useState(false);
    const [editingBio, setEditingBio] = useState(false);
    const [editingSkills, setEditingSkills] = useState(false);
    const [editingTools, setEditingTools] = useState(false);

    const [fullNameDraft, setFullNameDraft] = useState(freelancer.full_name || '');
    const [titleDraft, setTitleDraft] = useState(freelancer.title || '');
    const [hourlyRateDraft, setHourlyRateDraft] = useState(
        freelancer.hourly_rate > 0 ? String(freelancer.hourly_rate) : '',
    );
    const [availabilityDraft, setAvailabilityDraft] = useState<FreelancerData['availability']>(
        freelancer.availability || 'available',
    );
    const [bioDraft, setBioDraft] = useState(freelancer.bio || '');
    const [selectedSkillNames, setSelectedSkillNames] = useState<string[]>([]);
    const [selectedToolNames, setSelectedToolNames] = useState<string[]>([]);
    const [skillSearchQuery, setSkillSearchQuery] = useState('');
    const [toolSearchQuery, setToolSearchQuery] = useState('');

    const [savingAvatar, setSavingAvatar] = useState(false);
    const [savingBasics, setSavingBasics] = useState(false);
    const [savingBio, setSavingBio] = useState(false);
    const [savingSkills, setSavingSkills] = useState(false);
    const [savingTools, setSavingTools] = useState(false);
    const [activeWorkSampleId, setActiveWorkSampleId] = useState<string | null>(null);
    const [activeWorkImageIndex, setActiveWorkImageIndex] = useState(0);

    const isSavingAnySection = savingAvatar || savingBasics || savingBio || savingSkills || savingTools;

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

    const availabilityOptions: Array<{ value: FreelancerData['availability']; label: string }> = [
        { value: 'available', label: 'Available' },
        { value: 'busy', label: 'Busy' },
        { value: 'offline', label: 'Offline' },
    ];

    const resetBasicsDraft = useCallback(() => {
        setFullNameDraft(freelancer.full_name || '');
        setTitleDraft(freelancer.title || '');
        setHourlyRateDraft(freelancer.hourly_rate > 0 ? String(freelancer.hourly_rate) : '');
        setAvailabilityDraft(freelancer.availability || 'available');
    }, [freelancer.availability, freelancer.full_name, freelancer.hourly_rate, freelancer.title]);

    const openBasicsEditor = useCallback(() => {
        resetBasicsDraft();
        setEditingBasics(true);
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [resetBasicsDraft]);

    useEffect(() => {
        setBioDraft(freelancer.bio || '');
    }, [freelancer.bio]);

    useEffect(() => {
        resetBasicsDraft();
    }, [resetBasicsDraft]);

    useEffect(() => {
        setSelectedSkillNames(freelancer.skills.map((skill) => skill.name_en).filter(Boolean));
    }, [freelancer.skills]);

    useEffect(() => {
        setSelectedToolNames(freelancer.tools);
    }, [freelancer.tools]);

    const strengths = freelancer.skills.length > 0
        ? freelancer.skills.map((skill) => skill.name_en).filter(Boolean)
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

    const accentColor = '#8B5CF6';

    const skillPickerOptions = useMemo<PickerOption[]>(() => {
        return PREDEFINED_SKILLS.map((skill) => ({
            id: skill.id,
            name: skill.name_en,
            category: skill.category,
        }));
    }, []);

    const toolPickerOptions = useMemo<PickerOption[]>(() => {
        return PREDEFINED_TOOLS.map((tool) => ({
            id: tool.id,
            name: tool.name_en,
            category: tool.category,
        }));
    }, []);

    const toggleSkillOption = (skillName: string) => {
        setSelectedSkillNames((prev) => {
            if (prev.includes(skillName)) {
                return prev.filter((item) => item !== skillName);
            }

            if (prev.length >= 15) {
                return prev;
            }

            return [...prev, skillName];
        });
    };

    const toggleToolOption = (toolName: string) => {
        setSelectedToolNames((prev) => {
            if (prev.includes(toolName)) {
                return prev.filter((item) => item !== toolName);
            }

            if (prev.length >= 15) {
                return prev;
            }

            return [...prev, toolName];
        });
    };

    const openWorkSampleViewer = useCallback((workSampleId: string) => {
        setActiveWorkSampleId(workSampleId);
        setActiveWorkImageIndex(0);
    }, []);

    const closeWorkSampleViewer = useCallback(() => {
        setActiveWorkSampleId(null);
        setActiveWorkImageIndex(0);
    }, []);

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

    const saveBasics = async () => {
        const normalizedName = fullNameDraft.trim();
        const normalizedTitle = titleDraft.trim();
        const parsedRate = Number(hourlyRateDraft);

        if (!normalizedName) {
            showToast('Full name is required', 'warning');
            return;
        }

        if (!Number.isFinite(parsedRate) || parsedRate < 0) {
            showToast('Please enter a valid hourly rate', 'warning');
            return;
        }

        try {
            setSavingBasics(true);
            await onSaveBasics({
                fullName: normalizedName,
                title: normalizedTitle,
                hourlyRate: parsedRate,
                availability: availabilityDraft,
            });
            setEditingBasics(false);
            showToast('Profile details updated', 'success');
        } catch (error) {
            logger.error('Failed to save profile details', error);
            showToast('Could not update profile details', 'error');
        } finally {
            setSavingBasics(false);
        }
    };

    const saveBio = async () => {
        try {
            setSavingBio(true);
            await onSaveBio(bioDraft);
            setEditingBio(false);
            showToast('Bio updated', 'success');
        } catch (error) {
            logger.error('Failed to save bio', error);
            showToast('Could not update bio', 'error');
        } finally {
            setSavingBio(false);
        }
    };

    const saveSkills = async () => {
        try {
            setSavingSkills(true);
            await onSaveSkills(selectedSkillNames);
            setEditingSkills(false);
            showToast('Skills updated', 'success');
        } catch (error) {
            logger.error('Failed to save skills', error);
            showToast('Could not update skills', 'error');
        } finally {
            setSavingSkills(false);
        }
    };

    const saveTools = async () => {
        try {
            setSavingTools(true);
            await onSaveTools(selectedToolNames);
            setEditingTools(false);
            showToast('Tools updated', 'success');
        } catch (error) {
            logger.error('Failed to save tools', error);
            showToast('Could not update tools', 'error');
        } finally {
            setSavingTools(false);
        }
    };

    const handleAvatarUploadSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
        if (!allowedTypes.has(file.type)) {
            showToast('Please upload JPG, PNG, WEBP, or GIF image.', 'warning');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('Image size should be less than 5MB.', 'warning');
            return;
        }

        try {
            setSavingAvatar(true);
            await onSaveAvatar(file);
            showToast('Profile picture updated', 'success');
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

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white p-4 sm:p-6">
            {isOwner ? (
                <input
                    ref={avatarInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    className="hidden"
                    onChange={handleAvatarUploadSelection}
                    disabled={isSavingAnySection}
                />
            ) : null}

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-5">
                    <ProfileSectionCard className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_10%,rgba(139,92,246,0.16),transparent_38%),#141414] border-white/10">
                        <div className="absolute -top-8 right-10 h-24 w-24 rounded-full bg-[#8B5CF6]/15 blur-2xl" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-5">
                            <div className="relative w-fit">
                                <ProfileAvatar
                                    type="freelancer"
                                    name={freelancer.full_name || 'Freelancer'}
                                    imageUrl={freelancer.avatar_url}
                                    showOnlineDot={freelancer.availability === 'available'}
                                />

                                {isOwner ? (
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={isSavingAnySection}
                                        className="absolute -bottom-1 -left-1 h-9 w-9 rounded-full border border-white/15 bg-[#111111] text-gray-200 inline-flex items-center justify-center hover:text-white transition-colors"
                                        title="Change profile picture"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                ) : null}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div>
                                        <h1 className="text-2xl sm:text-[1.75rem] leading-tight font-black tracking-tight text-white">
                                            {freelancer.full_name || 'Freelancer'}
                                        </h1>
                                        <p className="text-white/55 mt-1 text-sm sm:text-base">
                                            {freelancer.title || 'Independent specialist'}
                                        </p>
                                    </div>

                                    {isOwner && !editingBasics ? (
                                        <button
                                            type="button"
                                            onClick={openBasicsEditor}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 text-white/65 hover:text-white transition-colors"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            Edit profile
                                        </button>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span
                                        className="px-3 py-1 rounded-full border text-xs font-semibold"
                                        style={{
                                            background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                                            color: accentColor,
                                            borderColor: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
                                        }}
                                    >
                                        Freelancer
                                    </span>
                                    <span
                                        className="px-3 py-1 rounded-full border text-xs font-semibold"
                                        style={{
                                            background: availabilityBadge.background,
                                            color: availabilityBadge.color,
                                            borderColor: availabilityBadge.border,
                                        }}
                                    >
                                        {availabilityBadge.label}
                                    </span>
                                </div>

                                {editingBasics && isOwner ? (
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5">
                                        <div>
                                            <label className="text-xs text-white/50">Full name</label>
                                            <input
                                                type="text"
                                                value={fullNameDraft}
                                                onChange={(event) => setFullNameDraft(event.target.value)}
                                                className="mt-1 w-full bg-[#0b0b0b] border border-white/10 rounded-lg text-white p-2.5 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-white/50">Professional title</label>
                                            <input
                                                type="text"
                                                value={titleDraft}
                                                onChange={(event) => setTitleDraft(event.target.value)}
                                                className="mt-1 w-full bg-[#0b0b0b] border border-white/10 rounded-lg text-white p-2.5 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-white/50">Hourly rate (TND)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                value={hourlyRateDraft}
                                                onChange={(event) => setHourlyRateDraft(event.target.value)}
                                                className="mt-1 w-full bg-[#0b0b0b] border border-white/10 rounded-lg text-white p-2.5 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-white/50">Availability</label>
                                            <select
                                                value={availabilityDraft}
                                                onChange={(event) => setAvailabilityDraft(event.target.value as FreelancerData['availability'])}
                                                className="mt-1 w-full bg-[#0b0b0b] border border-white/10 rounded-lg text-white p-2.5 outline-none"
                                            >
                                                {availabilityOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    resetBasicsDraft();
                                                    setEditingBasics(false);
                                                }}
                                                className="px-4 py-2 rounded-lg border border-white/10 text-white/70 text-sm"
                                                disabled={savingBasics}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={saveBasics}
                                                disabled={savingBasics}
                                                className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-70"
                                                style={{ background: accentColor }}
                                            >
                                                {savingBasics ? 'Saving...' : 'Save profile'}
                                            </button>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="flex flex-wrap gap-4 text-sm text-white/55 mt-4">
                                    <span className="inline-flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        {freelancer.location || 'Ariana'}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Star className="w-4 h-4" style={{ color: accentColor }} />
                                        {freelancer.stats.rating.toFixed(1)} - {freelancer.stats.reviews_count} reviews
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
                                        {freelancer.stats.success_rate}% success
                                    </span>
                                </div>
                            </div>
                        </div>
                    </ProfileSectionCard>

                    <ProfileSectionCard>
                        {editingBio && isOwner ? (
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />
                                    <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: `${accentColor}CC` }}>
                                        Introduction
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBioDraft(freelancer.bio || '');
                                        setEditingBio(false);
                                    }}
                                    className="text-xs text-white/60 hover:text-white"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <ProfileSectionHeader
                                title="Introduction"
                                accentColor={accentColor}
                                isOwner={isOwner}
                                onEdit={() => setEditingBio(true)}
                                editLabel="Edit"
                                editIcon={<Edit2 className="w-3.5 h-3.5" />}
                            />
                        )}

                        {editingBio && isOwner ? (
                            <>
                                <textarea
                                    rows={4}
                                    value={bioDraft}
                                    onChange={(event) => setBioDraft(event.target.value)}
                                    className="w-full bg-[#0b0b0b] border border-white/10 rounded-lg text-white p-3 outline-none"
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        type="button"
                                        onClick={saveBio}
                                        disabled={savingBio}
                                        className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-70"
                                        style={{ background: accentColor }}
                                    >
                                        {savingBio ? 'Saving...' : 'Save bio'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p className="text-white/75 leading-relaxed text-sm sm:text-base">
                                {freelancer.bio || 'No bio added yet'}
                            </p>
                        )}
                    </ProfileSectionCard>

                    <ProfileSectionCard>
                        {editingSkills && isOwner ? (
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />
                                    <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: `${accentColor}CC` }}>
                                        Core strengths
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedSkillNames(freelancer.skills.map((skill) => skill.name_en).filter(Boolean));
                                        setSkillSearchQuery('');
                                        setEditingSkills(false);
                                    }}
                                    className="text-xs text-white/60 hover:text-white"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <ProfileSectionHeader
                                title="Core strengths"
                                accentColor={accentColor}
                                isOwner={isOwner}
                                onEdit={() => setEditingSkills(true)}
                                editLabel="Edit"
                                editIcon={<Edit2 className="w-3.5 h-3.5" />}
                            />
                        )}

                        {editingSkills && isOwner ? (
                            <>
                                <CompactMultiSelectEditor
                                    title="Skills"
                                    searchQuery={skillSearchQuery}
                                    onSearchChange={setSkillSearchQuery}
                                    options={skillPickerOptions}
                                    selectedValues={selectedSkillNames}
                                    onToggle={toggleSkillOption}
                                    accentColor={accentColor}
                                    maxSelected={15}
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        type="button"
                                        onClick={saveSkills}
                                        disabled={savingSkills || selectedSkillNames.length === 0}
                                        className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-70"
                                        style={{ background: accentColor }}
                                    >
                                        {savingSkills ? 'Saving...' : 'Save skills'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {strengths.map((item) => (
                                    <span
                                        key={item}
                                        className="px-3.5 py-1.5 rounded-full border text-sm"
                                        style={{
                                            background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                                            color: accentColor,
                                            borderColor: `color-mix(in srgb, ${accentColor} 25%, transparent)`,
                                        }}
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        )}
                    </ProfileSectionCard>

                    <ProfileSectionCard>
                        {editingTools && isOwner ? (
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />
                                    <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: `${accentColor}CC` }}>
                                        Tools
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedToolNames(freelancer.tools);
                                        setToolSearchQuery('');
                                        setEditingTools(false);
                                    }}
                                    className="text-xs text-white/60 hover:text-white"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <ProfileSectionHeader
                                title="Tools"
                                accentColor={accentColor}
                                isOwner={isOwner}
                                onEdit={() => setEditingTools(true)}
                                editLabel="Edit"
                                editIcon={<Edit2 className="w-3.5 h-3.5" />}
                            />
                        )}

                        {editingTools && isOwner ? (
                            <>
                                <CompactMultiSelectEditor
                                    title="Tools"
                                    searchQuery={toolSearchQuery}
                                    onSearchChange={setToolSearchQuery}
                                    options={toolPickerOptions}
                                    selectedValues={selectedToolNames}
                                    onToggle={toggleToolOption}
                                    accentColor={accentColor}
                                    maxSelected={15}
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        type="button"
                                        onClick={saveTools}
                                        disabled={savingTools || selectedToolNames.length === 0}
                                        className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-70"
                                        style={{ background: accentColor }}
                                    >
                                        {savingTools ? 'Saving...' : 'Save tools'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {tools.map((item) => (
                                    <span
                                        key={item}
                                        className="px-3.5 py-1.5 rounded-full border text-sm"
                                        style={{
                                            background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                                            color: accentColor,
                                            borderColor: `color-mix(in srgb, ${accentColor} 25%, transparent)`,
                                        }}
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        )}
                    </ProfileSectionCard>

                    <ProfileSectionCard>
                        <ProfileSectionHeader
                            title="Selected work"
                            accentColor={accentColor}
                        />

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
                                                                className="max-w-full truncate text-[11px] px-2 py-0.5 rounded-full border border-[#f59e0b]/35 text-[#fbbf24] bg-[#f59e0b]/10"
                                                                title={tool}
                                                            >
                                                                {tool}
                                                            </span>
                                                        ))}
                                                        {item.tools_used.length > 3 ? (
                                                            <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/15 text-white/55 bg-white/[0.04]">
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
                                                            Open link
                                                        </a>
                                                    ) : <span />}

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
                                                        View full project
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <ProfileEmptyState
                                icon={<Briefcase className="w-10 h-10" />}
                                title="No work samples added yet"
                                description="Showcase case studies, shipped products, and measurable outcomes."
                                cta={isOwner ? 'Add your first work sample' : undefined}
                                onCta={isOwner ? () => navigate(ROUTES.freelancerPortfolio) : undefined}
                                accentColor={accentColor}
                            />
                        )}
                    </ProfileSectionCard>

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
                                            aria-label="Close portfolio viewer"
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
                                                        aria-label="Previous image"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={showNextWorkImage}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-white/20 bg-black/65 text-white/80 hover:text-white transition-colors inline-flex items-center justify-center"
                                                        aria-label="Next image"
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

                                    <aside className="h-full flex flex-col bg-[#121212]">
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
                                                        Open project link
                                                    </a>
                                                ) : null}
                                            </div>

                                            {activeWorkSample.skills_used && activeWorkSample.skills_used.length > 0 ? (
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45 mb-2">Skills used</p>
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
                                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45 mb-2">Tools used</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {activeWorkSample.tools_used.map((tool) => (
                                                            <span
                                                                key={tool}
                                                                className="text-xs px-2.5 py-1 rounded-full border border-[#f59e0b]/35 text-[#fbbf24] bg-[#f59e0b]/10"
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
                                                    Previous project
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={showNextWorkSample}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/75 hover:text-white transition-colors"
                                                >
                                                    Next project
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : null}
                                    </aside>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <ProfileSectionCard>
                        <ProfileSectionHeader
                            title="Client trust"
                            accentColor={accentColor}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-start">
                            <div className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4 text-center">
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
                                <p className="text-xs text-white/45 mt-2">{freelancer.stats.reviews_count} reviews</p>
                            </div>

                            <div className="space-y-2">
                                {reviewBuckets.map(({ score, pct }) => (
                                    <div key={score} className="flex items-center gap-2 text-xs">
                                        <span className="w-3 text-white/55">{score}</span>
                                        <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: `linear-gradient(90deg, ${accentColor}, color-mix(in srgb, ${accentColor} 55%, #ffffff))`,
                                                }}
                                            />
                                        </div>
                                        <span className="w-10 text-right text-white/40">{pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {freelancer.reviews.length > 0 ? (
                            <div className="mt-6 space-y-3">
                                {freelancer.reviews.slice(0, 3).map((review) => (
                                    <article key={review.id} className="rounded-xl border border-white/10 bg-[#0f0f0f] p-3.5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{review.client_name}</p>
                                                <p className="text-xs text-white/45 mt-0.5">{review.job_title || 'Project collaboration'}</p>
                                            </div>
                                            <div className="inline-flex items-center gap-1 text-xs" style={{ color: accentColor }}>
                                                <Star className="w-3.5 h-3.5" style={{ fill: accentColor }} />
                                                {review.rating.toFixed(1)}
                                            </div>
                                        </div>
                                        <p className="text-sm text-white/70 mt-2">{review.comment}</p>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-5 text-sm text-white/45 text-center">
                                No reviews yet. Complete your first contract to receive feedback.
                            </p>
                        )}
                    </ProfileSectionCard>
                </div>

                <aside className="lg:col-span-1 flex flex-col gap-5">
                    <ProfileSectionCard className="bg-[#131313]">
                        <div className="flex flex-col gap-3">
                            {isOwner ? (
                                <button
                                    onClick={() => navigate(`/freelancer/${freelancer.username || freelancer.id}?preview=public`)}
                                    className="group relative w-full overflow-hidden rounded-xl p-3.5 text-left border transition-all duration-200"
                                    style={{
                                        borderColor: `color-mix(in srgb, ${accentColor} 45%, #2b2b2b)`,
                                        background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 24%, #141414) 0%, #171717 58%, #131313 100%)`,
                                        boxShadow: `0 14px 36px -26px color-mix(in srgb, ${accentColor} 62%, transparent)`,
                                    }}
                                    disabled={isSavingAnySection}
                                >
                                    <span
                                        className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full opacity-35"
                                        style={{ background: `color-mix(in srgb, ${accentColor} 40%, transparent)` }}
                                    />
                                    <span className="inline-flex items-center gap-2 text-base font-semibold text-white relative z-10">
                                        <Eye className="w-4 h-4 text-white/90" />
                                        View Public Profile
                                    </span>
                                    <span className="mt-1 block text-xs text-white/75 relative z-10">
                                        Preview exactly how clients and visitors see your profile.
                                    </span>
                                </button>
                            ) : null}

                            {isOwner ? (
                                <button
                                    onClick={() => navigate(ROUTES.freelancerPortfolio)}
                                    className="w-full rounded-xl p-3.5 text-left border border-white/10 bg-[linear-gradient(180deg,#1a1a1a_0%,#171717_100%)] transition-all duration-200 hover:border-white/20 hover:bg-[#1f1f1f]"
                                    disabled={isSavingAnySection}
                                >
                                    <span className="inline-flex items-center gap-2 text-base font-semibold text-white">
                                        <Briefcase className="w-4 h-4" style={{ color: accentColor }} />
                                        Portfolio Dashboard
                                    </span>
                                    <span className="mt-1 block text-xs text-white/45">Add and organize your best work samples.</span>
                                </button>
                            ) : null}

                            {isOwner ? (
                                <button
                                    onClick={() => navigate(ROUTES.myProposals)}
                                    className="w-full rounded-xl p-3.5 text-left border border-white/10 bg-[linear-gradient(180deg,#1a1a1a_0%,#171717_100%)] transition-all duration-200 hover:border-white/20 hover:bg-[#1f1f1f]"
                                    disabled={isSavingAnySection}
                                >
                                    <span className="inline-flex items-center gap-2 text-base font-semibold text-white">
                                        <MessageSquare className="w-4 h-4" style={{ color: accentColor }} />
                                        My Proposals
                                    </span>
                                    <span className="mt-1 block text-xs text-white/45">Track statuses and follow up faster.</span>
                                </button>
                            ) : null}

                            {isOwner ? (
                                <button
                                    onClick={() => navigate(ROUTES.settings)}
                                    className="w-full rounded-xl p-3.5 text-left border border-white/10 transition-all duration-200 hover:bg-[#141414] hover:border-white/20"
                                    disabled={isSavingAnySection}
                                >
                                    <span className="inline-flex items-center gap-2 text-base font-semibold text-white/90">
                                        <Settings className="w-4 h-4 text-white/80" />
                                        Workspace Settings
                                    </span>
                                    <span className="mt-1 block text-xs text-white/45">Notifications, security, and account controls.</span>
                                </button>
                            ) : null}

                            {viewerRole === 'client' ? (
                                <button
                                    onClick={onOpenContact}
                                    className="w-full text-white rounded-xl py-3 font-semibold transition-colors"
                                    style={{ background: accentColor }}
                                >
                                    Hire Me
                                </button>
                            ) : null}

                            {viewerRole === 'client' ? (
                                <button
                                    onClick={onOpenContact}
                                    className="w-full rounded-xl py-3 font-semibold transition-colors inline-flex items-center justify-center gap-2"
                                    style={{
                                        border: `1px solid ${accentColor}`,
                                        color: accentColor,
                                        background: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
                                    }}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Send Message
                                </button>
                            ) : null}

                            {(viewerRole === 'freelancer' || viewerRole === 'guest') ? (
                                <button
                                    onClick={onOpenContact}
                                    className="w-full bg-transparent border border-white/10 text-white/75 rounded-xl py-3 font-semibold transition-colors hover:text-white inline-flex items-center justify-center gap-2"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Send Message
                                </button>
                            ) : null}
                        </div>
                    </ProfileSectionCard>

                    <section className="grid grid-cols-2 gap-3">
                        <ProfileStatCard
                            icon={<Briefcase className="w-4 h-4" />}
                            value={freelancer.stats.jobs_completed}
                            label="Completed"
                            accentColor={accentColor}
                        />
                        <ProfileStatCard
                            icon={<Wallet className="w-4 h-4" />}
                            value={`${freelancer.stats.total_earnings.toLocaleString()} TND`}
                            label="Earned"
                            accentColor={accentColor}
                        />
                        <ProfileStatCard
                            icon={<Clock className="w-4 h-4" />}
                            value={`${freelancer.stats.response_time_hours}h`}
                            label="Response"
                            accentColor={accentColor}
                            suffix={<span className="text-green-400 text-xs font-semibold">Fast</span>}
                        />
                        <ProfileStatCard
                            icon={<Coins className="w-4 h-4" />}
                            value={`${freelancer.hourly_rate} TND/h`}
                            label="Hourly rate"
                            accentColor={accentColor}
                        />
                    </section>

                    <ProfileSectionCard>
                        <ProfileInfoHeader
                            icon={<ShieldCheck className="w-4 h-4" />}
                            title="Work information"
                            accentColor={accentColor}
                        />

                        <div>
                            <ProfileInfoRow
                                label="Status"
                                value={
                                    <span className="text-sm" style={{ color: freelancer.availability === 'available' ? '#4ade80' : '#fbbf24' }}>
                                        {freelancer.availability === 'available' ? 'Available for work' : freelancer.availability}
                                    </span>
                                }
                            />
                            <ProfileInfoRow
                                label="Member since"
                                value={new Date(freelancer.joined_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                            />
                            <ProfileInfoRow
                                label="Last seen"
                                value={<span className="text-green-400">Recently</span>}
                            />
                        </div>
                    </ProfileSectionCard>

                    <ProfileSectionCard>
                        <ProfileInfoHeader
                            icon={<CheckCircle className="w-4 h-4" />}
                            title="Verifications"
                            accentColor={accentColor}
                        />

                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5 text-sm text-white/75 py-1.5">
                                {freelancer.verifications.cin ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-white/35" />}
                                <span>Identity</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-white/75 py-1.5">
                                {freelancer.verifications.phone ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-white/35" />}
                                <span>Phone</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-white/75 py-1.5">
                                {freelancer.verifications.email ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-white/35" />}
                                <span>Email</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-white/75 py-1.5">
                                {freelancer.verifications.payment ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-white/35" />}
                                <span>Payment method</span>
                            </div>
                        </div>
                    </ProfileSectionCard>
                </aside>
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

        const skillEntries = skillNames.map((name) => ({
            name,
            name_en: name,
            name_ar: name,
            name_fr: name,
        }));

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
                skills: skillNames.map((name, index) => ({
                    id: `${name}-${index}`,
                    name_en: name,
                    name_ar: name,
                    name_fr: name,
                })),
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
                if (profileError || !profileRow?.profile) throw profileError || new Error('Freelancer not found');

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

                const stats = {
                    jobs_completed: profileRow.jobs_completed || 0,
                    rating: profileRow.success_rate ? profileRow.success_rate / 20 : 0,
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
                        payment: false,
                    },
                    work_samples: portfolioRows.map((item) => {
                        const {
                            skills: portfolioSkills,
                            tools: portfolioTools,
                        } = splitPortfolioSkillsAndTools(item.skills_used, item.tools_used);

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
                            description: item.description || undefined,
                            client_name: item.client_name || undefined,
                            completion_date: item.completion_date || undefined,
                            project_url: item.project_url || undefined,
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

    const openContactModal = () => {
        if (!user?.id) {
            showToast('Please log in to continue', 'info');
            navigate(ROUTES.login, { state: { from: `/freelancer/${usernameOrId || ''}` } });
            return;
        }

        if (freelancer?.id && user.id === freelancer.id) {
            showToast('Public preview mode: contact action is disabled on your own profile.', 'info');
            return;
        }

        if (!freelancer?.id) {
            return;
        }

        setShowContactModal(true);
    };

    if (isLoading && !freelancer) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white">
                <Header />
                <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                    {/* Left column */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Profile header skeleton */}
                        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
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
                        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-3">
                            <div className="h-4 w-32 bg-[#262626] rounded" />
                            <div className="h-4 w-full bg-[#262626] rounded" />
                            <div className="h-4 w-3/4 bg-[#262626] rounded" />
                        </div>
                        {/* Skills skeleton */}
                        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-3">
                            <div className="h-4 w-32 bg-[#262626] rounded" />
                            <div className="flex flex-wrap gap-2">
                                {[1,2,3,4].map(i => <div key={i} className="h-8 w-24 bg-[#262626] rounded-full" />)}
                            </div>
                        </div>
                    </div>
                    {/* Right column */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-3">
                            <div className="h-10 w-full bg-[#262626] rounded-xl" />
                            <div className="h-10 w-full bg-[#262626] rounded-xl" />
                            <div className="h-10 w-full bg-[#262626] rounded-xl" />
                        </div>
                        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 grid grid-cols-2 gap-3">
                            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-[#262626] rounded-xl" />)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!freelancer) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white">
                <Header />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Header />
            {isPublicPreview ? (
                <div className="max-w-6xl mx-auto px-6 pt-5">
                    <div className="bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-white">Public Profile Preview</p>
                            <p className="text-xs text-gray-400">You are viewing your profile as other users see it.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(`/freelancer/${usernameOrId || user?.id || ''}`)}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#3a3a3a] px-3 py-2 text-sm text-gray-200 hover:text-white hover:border-[#565656] transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Exit Preview
                        </button>
                    </div>
                </div>
            ) : null}
            <ProfileView
                viewerRole={viewerRole}
                freelancer={freelancer}
                onOpenContact={openContactModal}
                onSaveAvatar={saveAvatar}
                onSaveBasics={saveProfileBasics}
                onSaveBio={saveBio}
                onSaveSkills={saveSkills}
                onSaveTools={saveTools}
            />

            {freelancer?.id ? (
                <ContactModal
                    isOpen={showContactModal}
                    onClose={() => setShowContactModal(false)}
                    freelancerId={freelancer.id}
                    freelancerName={freelancer.full_name}
                />
            ) : null}
        </div>
    );
}
