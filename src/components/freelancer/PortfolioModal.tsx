import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2, Upload, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import {
    PREDEFINED_SKILLS,
    PREDEFINED_TOOLS,
    type PortfolioItem,
    type SkillCategory,
    type ToolCategory,
} from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useFileUpload } from '../../hooks/useFileUpload';
import { getPortfolioImageUrl, resolvePortfolioMediaUrl } from '../../lib/portfolioMedia';
import { normalizePortfolioTextArray, splitPortfolioSkillsAndTools } from '../../lib/portfolioTools';
import { getStorageConfigErrorMessage, isMissingStorageBucketError } from '../../lib/supabase';
import { useTranslation } from "../../i18n";
import { useToast } from '../ui/Toast';
import OptimizedImage from '../common/OptimizedImage';

// import { useToast } from '../ui/Toast'; // Optional: Use parent's toast

type Tx = (key: string, params?: Record<string, string | number>, fallback?: string) => string;
const MAX_SKILLS = 15;
const MAX_TOOLS = 15;

const SKILL_CATEGORY_ORDER: SkillCategory[] = [
    'design',
    'development',
    'writing',
    'marketing',
    'video',
    'business',
    'data',
    'other',
];

const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
    design: 'Design',
    development: 'Development',
    writing: 'Writing',
    marketing: 'Marketing',
    video: 'Video',
    business: 'Business',
    data: 'Data',
    other: 'Other',
};

const TOOL_CATEGORY_ORDER: ToolCategory[] = [
    'design',
    'development',
    'productivity',
    'video',
    'marketing',
    'other',
];

const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
    design: 'Design',
    development: 'Development',
    productivity: 'Productivity',
    video: 'Video',
    marketing: 'Marketing',
    other: 'Other',
};

function isHttpUrl(value: string): boolean {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function getUploadErrorMessage(error: unknown, tx: Tx): string {
    if (isMissingStorageBucketError(error)) {
        return getStorageConfigErrorMessage('avatars');
    }

    if (error instanceof Error) {
        const normalizedMessage = error.message.toLowerCase();

        if (
            normalizedMessage.includes('failed to fetch')
            || normalizedMessage.includes('timed out')
            || normalizedMessage.includes('network')
            || normalizedMessage.includes('cors')
        ) {
            return tx(
                'portfolio.form.upload.networkError',
                undefined,
                'Upload service is unreachable right now. You can still paste a direct image URL.',
            );
        }

        if (
            normalizedMessage.includes('row-level security')
            || normalizedMessage.includes('not authorized')
            || normalizedMessage.includes('permission')
        ) {
            return tx(
                'portfolio.form.upload.permissionError',
                undefined,
                'You do not have permission to upload files to storage.',
            );
        }

        if (error.message.trim()) {
            return error.message;
        }
    }

    return tx('portfolio.form.upload.error', undefined, 'Failed to upload image.');
}

const createPortfolioSchema = (tx: Tx) => z.object({
    title: z.string().min(3, tx('portfolio.form.validation.titleMin')),
    description: z.string().min(10, tx('portfolio.form.validation.descriptionMin')),
    client_name: z.string().optional().or(z.literal('')),
    project_url: z
        .string()
        .optional()
        .or(z.literal(''))
        .refine((value) => !value || isHttpUrl(value), tx('portfolio.form.validation.invalidUrl')),
    skills_used: z
        .array(z.string().trim().min(1))
        .max(
            MAX_SKILLS,
            tx(
                'portfolio.form.validation.skillsLimit',
                { count: MAX_SKILLS },
                `You can select up to ${MAX_SKILLS} skills`,
            ),
        ),
    tools_used: z
        .array(z.string().trim().min(1))
        .max(
            MAX_TOOLS,
            tx(
                'portfolio.form.validation.toolsLimit',
                { count: MAX_TOOLS },
                `You can select up to ${MAX_TOOLS} tools`,
            ),
        ),
    completion_date: z.string().optional(),
    media_url: z
        .string()
        .optional()
        .or(z.literal(''))
        .refine((value) => !value || isHttpUrl(value), tx('portfolio.form.validation.invalidImageUrl')), // URL can come from upload or manual input
}).superRefine((value, ctx) => {
    if (!value.media_url?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['media_url'],
            message: tx('portfolio.form.validation.imageRequired'),
        });
    }
});

type PortfolioFormData = z.infer<ReturnType<typeof createPortfolioSchema>>;

export interface PortfolioSubmitData extends Omit<PortfolioFormData, 'media_url'> {
    media_urls: string[];
}

interface PortfolioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PortfolioSubmitData) => Promise<void>;
    initialData?: PortfolioItem | null;
    isSubmitting?: boolean;
}

const fieldThemeVars = {
    '--color-background-base': '#101010',
    '--color-background-muted': '#171717',
    '--color-border-default': 'rgba(255,255,255,0.14)',
    '--color-border-strong': 'rgba(255,255,255,0.28)',
    '--color-text-primary': '#ffffff',
    '--color-text-secondary': 'rgba(255,255,255,0.82)',
    '--color-text-tertiary': 'rgba(255,255,255,0.56)',
    '--color-text-disabled': 'rgba(255,255,255,0.35)',
    '--workspace-primary': '#8B5CF6',
    '--color-status-error': '#f87171',
} as CSSProperties;

const inputClassName =
    'bg-[var(--color-bg-base)] border-white/15 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/35 focus:border-[#8B5CF6]/70 focus:ring-[#8B5CF6]/25';

export default function PortfolioModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isSubmitting = false
}: PortfolioModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { tx, language } = useTranslation();
    const schema = useMemo(() => createPortfolioSchema(tx), [tx]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const additionalImageInputRef = useRef<HTMLInputElement | null>(null);
    const skillsInputRef = useRef<HTMLInputElement | null>(null);
    const toolsInputRef = useRef<HTMLInputElement | null>(null);
    const [uploadError, setUploadError] = useState('');
    const [skillsQuery, setSkillsQuery] = useState('');
    const [toolsQuery, setToolsQuery] = useState('');
    const [extraMediaUrls, setExtraMediaUrls] = useState<string[]>([]);
    const [extraImageUrlInput, setExtraImageUrlInput] = useState('');

    const {
        upload,
        isUploading,
    } = useFileUpload({
        bucket: 'avatars',
        maxSizeMB: 5,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setError,
        clearErrors,
        watch,
        setValue,
    } = useForm<PortfolioFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: '',
            description: '',
            client_name: '',
            project_url: '',
            skills_used: [],
            tools_used: [],
            completion_date: '',
            media_url: '',
        }
    });

    const mediaUrl = watch('media_url');
    const selectedSkills = watch('skills_used') ?? [];
    const selectedTools = watch('tools_used') ?? [];
    const resolvedPreviewUrl = resolvePortfolioMediaUrl(mediaUrl || '');

    useEffect(() => {
        if ((mediaUrl || '').trim()) {
            setUploadError('');
        }
    }, [mediaUrl]);

    const skillOptions = useMemo(() => {
        const seen = new Set<string>();

        return PREDEFINED_SKILLS
            .map((skill) => {
                const label = language === 'ar'
                    ? skill.name_ar
                    : language === 'fr'
                        ? skill.name_fr
                        : skill.name_en;

                return {
                    value: skill.name_en,
                    label,
                    category: skill.category,
                    isPrimary: Boolean(skill.isPrimary),
                };
            })
            .filter((skill) => {
                const normalized = skill.value.trim().toLowerCase();
                if (!normalized || seen.has(normalized)) {
                    return false;
                }

                seen.add(normalized);
                return true;
            })
            .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.label.localeCompare(b.label));
    }, [language]);

    const skillLabelMap = useMemo(() => {
        const map = new Map<string, string>();

        skillOptions.forEach((option) => {
            map.set(option.value.toLowerCase(), option.label);
            map.set(option.label.toLowerCase(), option.label);
        });

        return map;
    }, [skillOptions]);

    const toolOptions = useMemo(() => {
        const seen = new Set<string>();

        return PREDEFINED_TOOLS
            .map((tool) => {
                const label = language === 'ar'
                    ? tool.name_ar
                    : language === 'fr'
                        ? tool.name_fr
                        : tool.name_en;

                return {
                    value: tool.name_en,
                    label,
                    category: tool.category,
                    isPrimary: Boolean(tool.isPrimary),
                };
            })
            .filter((tool) => {
                const normalized = tool.value.trim().toLowerCase();
                if (!normalized || seen.has(normalized)) {
                    return false;
                }

                seen.add(normalized);
                return true;
            })
            .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.label.localeCompare(b.label));
    }, [language]);

    const toolLabelMap = useMemo(() => {
        const map = new Map<string, string>();

        toolOptions.forEach((option) => {
            map.set(option.value.toLowerCase(), option.label);
            map.set(option.label.toLowerCase(), option.label);
        });

        return map;
    }, [toolOptions]);

    const selectedSkillSet = useMemo(
        () => new Set(selectedSkills.map((skill) => skill.trim().toLowerCase()).filter(Boolean)),
        [selectedSkills],
    );

    const filteredSkillsByCategory = useMemo(() => {
        const query = skillsQuery.trim().toLowerCase();
        const grouped: Record<SkillCategory, typeof skillOptions> = {
            design: [],
            development: [],
            writing: [],
            marketing: [],
            video: [],
            business: [],
            data: [],
            other: [],
        };

        skillOptions.forEach((option) => {
            const category = option.category as SkillCategory;

            if (!category || !grouped[category]) {
                return;
            }

                const isAlreadySelected =
                    selectedSkillSet.has(option.value.toLowerCase())
                    || selectedSkillSet.has(option.label.toLowerCase());

                if (isAlreadySelected) {
                    return;
                }

                if (!query) {
                    grouped[category].push(option);
                    return;
                }

                if (option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query)) {
                    grouped[category].push(option);
                }
            });

        SKILL_CATEGORY_ORDER.forEach((category) => {
            grouped[category] = grouped[category]
                .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.label.localeCompare(b.label))
                .slice(0, 24);
        });

        return grouped;
    }, [skillsQuery, skillOptions, selectedSkillSet]);

    const hasFilteredSkillOptions = useMemo(
        () => SKILL_CATEGORY_ORDER.some((category) => filteredSkillsByCategory[category].length > 0),
        [filteredSkillsByCategory],
    );

    const selectedToolSet = useMemo(
        () => new Set(selectedTools.map((tool) => tool.trim().toLowerCase()).filter(Boolean)),
        [selectedTools],
    );

    const filteredToolsByCategory = useMemo(() => {
        const query = toolsQuery.trim().toLowerCase();
        const grouped: Record<ToolCategory, typeof toolOptions> = {
            design: [],
            development: [],
            productivity: [],
            video: [],
            marketing: [],
            other: [],
        };

        toolOptions.forEach((option) => {
            const category = option.category as ToolCategory;

            if (!category || !grouped[category]) {
                return;
            }

            const isAlreadySelected =
                selectedToolSet.has(option.value.toLowerCase())
                || selectedToolSet.has(option.label.toLowerCase());

            if (isAlreadySelected) {
                return;
            }

            if (!query) {
                grouped[category].push(option);
                return;
            }

            if (option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query)) {
                grouped[category].push(option);
            }
        });

        TOOL_CATEGORY_ORDER.forEach((category) => {
            grouped[category] = grouped[category]
                .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.label.localeCompare(b.label))
                .slice(0, 24);
        });

        return grouped;
    }, [toolsQuery, toolOptions, selectedToolSet]);

    const hasFilteredToolOptions = useMemo(
        () => TOOL_CATEGORY_ORDER.some((category) => filteredToolsByCategory[category].length > 0),
        [filteredToolsByCategory],
    );

    const normalizeMediaValue = (value: string | null | undefined): string => {
        if (typeof value !== 'string') {
            return '';
        }

        const trimmed = value.trim();
        return trimmed ? (resolvePortfolioMediaUrl(trimmed) || trimmed) : '';
    };

    useEffect(() => {
        setUploadError('');
        setSkillsQuery('');
        setToolsQuery('');
        setExtraImageUrlInput('');

        if (isOpen && initialData) {
            const initialMediaUrls = Array.from(
                new Set(
                    (initialData.media_urls ?? [])
                        .map((value) => normalizeMediaValue(value))
                        .filter(Boolean),
                ),
            );

            const initialPrimaryImage =
                normalizeMediaValue(initialData.thumbnail_url)
                || initialMediaUrls[0]
                || '';

            const {
                skills: normalizedInitialSkills,
                tools: normalizedInitialTools,
            } = splitPortfolioSkillsAndTools(initialData.skills_used, initialData.tools_used);

            setValue('title', initialData.title);
            setValue('description', initialData.description || '');
            setValue('client_name', initialData.client_name || '');
            setValue('project_url', initialData.project_url || '');
            setValue('skills_used', normalizedInitialSkills);
            setValue('tools_used', normalizedInitialTools);
            setValue('completion_date', initialData.completion_date || '');

            setValue('media_url', initialPrimaryImage || getPortfolioImageUrl(initialData.thumbnail_url, initialData.media_urls));
            setExtraMediaUrls(initialMediaUrls.filter((url) => url !== initialPrimaryImage));
        } else if (isOpen) {
            reset({
                title: '',
                description: '',
                client_name: '',
                project_url: '',
                skills_used: [],
                tools_used: [],
                completion_date: '',
                media_url: '',
            });
            setExtraMediaUrls([]);
        }
    }, [isOpen, initialData, setValue, reset]);

    const getSkillLabel = (value: string): string => {
        const normalized = value.trim().toLowerCase();
        return skillLabelMap.get(normalized) || value;
    };

    const getSkillCategoryLabel = (category: SkillCategory): string => {
        return tx(
            `portfolio.form.skills.sections.${category}`,
            undefined,
            SKILL_CATEGORY_LABELS[category],
        );
    };

    const getToolLabel = (value: string): string => {
        const normalized = value.trim().toLowerCase();
        return toolLabelMap.get(normalized) || value;
    };

    const getToolCategoryLabel = (category: ToolCategory): string => {
        return tx(
            `portfolio.form.tools.sections.${category}`,
            undefined,
            TOOL_CATEGORY_LABELS[category],
        );
    };

    const toggleSkill = (value: string) => {
        const normalizedValue = value.trim();
        if (!normalizedValue) {
            return;
        }

        const currentSkills = Array.from(
            new Set(
                (selectedSkills ?? [])
                    .map((skill) => skill.trim())
                    .filter(Boolean),
            ),
        );

        const existingIndex = currentSkills.findIndex((skill) => skill.toLowerCase() === normalizedValue.toLowerCase());
        if (existingIndex >= 0) {
            const nextSkills = currentSkills.filter((_, index) => index !== existingIndex);
            clearErrors('skills_used');
            setValue('skills_used', nextSkills, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
            return;
        }

        if (currentSkills.length >= MAX_SKILLS) {
            const message = tx(
                'portfolio.form.validation.skillsLimit',
                { count: MAX_SKILLS },
                `You can select up to ${MAX_SKILLS} skills`,
            );

            setError('skills_used', { type: 'manual', message });
            return;
        }

        clearErrors('skills_used');
        setValue('skills_used', [...currentSkills, normalizedValue], {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    };

    const clearAllSkills = () => {
        clearErrors('skills_used');
        setValue('skills_used', [], {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    };

    const toggleTool = (value: string) => {
        const normalizedValue = value.trim();
        if (!normalizedValue) {
            return;
        }

        const currentTools = normalizePortfolioTextArray(selectedTools);
        const existingIndex = currentTools.findIndex((tool) => tool.toLowerCase() === normalizedValue.toLowerCase());

        if (existingIndex >= 0) {
            const nextTools = currentTools.filter((_, index) => index !== existingIndex);
            clearErrors('tools_used');
            setValue('tools_used', nextTools, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
            return;
        }

        if (currentTools.length >= MAX_TOOLS) {
            const message = tx(
                'portfolio.form.validation.toolsLimit',
                { count: MAX_TOOLS },
                `You can select up to ${MAX_TOOLS} tools`,
            );

            setError('tools_used', { type: 'manual', message });
            return;
        }

        clearErrors('tools_used');
        setValue('tools_used', [...currentTools, normalizedValue], {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    };

    const clearAllTools = () => {
        clearErrors('tools_used');
        setValue('tools_used', [], {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    };

    const appendExtraMediaUrl = (value: string) => {
        const normalizedPrimary = normalizeMediaValue(mediaUrl || '');
        const normalizedExtra = normalizeMediaValue(value);

        if (!normalizedExtra) {
            return;
        }

        if (!normalizedPrimary) {
            setValue('media_url', normalizedExtra, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
            return;
        }

        setExtraMediaUrls((previous) => {
            const next = Array.from(new Set([...previous, normalizedExtra].filter(Boolean)));
            return next.filter((url) => url !== normalizedPrimary);
        });
    };

    const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        if (!user?.id) {
            const message = tx('portfolio.form.upload.loginRequired', undefined, 'Please sign in to upload images.');
            setUploadError(message);
            return;
        }

        setUploadError('');

        try {
            const uploaded = await upload(file, `${user.id}/portfolio`);
            const uploadedUrl = resolvePortfolioMediaUrl(uploaded.url) || uploaded.url;

            setValue('media_url', uploadedUrl, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
            clearErrors('media_url');
            showToast(tx('portfolio.form.upload.success', undefined, 'Image uploaded successfully'), 'success');
        } catch (error) {
            const message = getUploadErrorMessage(error, tx);

            setUploadError(message);
        }
    };

    const handleAdditionalImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        if (!user?.id) {
            const message = tx('portfolio.form.upload.loginRequired', undefined, 'Please sign in to upload images.');
            setUploadError(message);
            return;
        }

        setUploadError('');

        try {
            const uploaded = await upload(file, `${user.id}/portfolio`);
            const uploadedUrl = normalizeMediaValue(uploaded.url);

            appendExtraMediaUrl(uploadedUrl);
            showToast(tx('portfolio.form.upload.extraAdded', undefined, 'Image added to gallery'), 'success');
        } catch (error) {
            const message = getUploadErrorMessage(error, tx);
            setUploadError(message);
        }
    };

    const handleAddExtraImageUrl = () => {
        const normalized = normalizeMediaValue(extraImageUrlInput);
        if (!normalized) {
            return;
        }

        if (!isHttpUrl(normalized)) {
            setUploadError(tx('portfolio.form.validation.invalidImageUrl'));
            return;
        }

        appendExtraMediaUrl(normalized);
        setExtraImageUrlInput('');
        setUploadError('');
    };

    const removeExtraMediaUrl = (index: number) => {
        setExtraMediaUrls((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    };

    const clearSelectedImage = () => {
        setUploadError('');

        if (extraMediaUrls.length > 0) {
            const [nextPrimary, ...rest] = extraMediaUrls;
            setValue('media_url', nextPrimary, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
            setExtraMediaUrls(rest);
            return;
        }

        setValue('media_url', '', {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    };

    const handleFormSubmit = async (data: PortfolioFormData) => {
        const normalizedPrimaryImageUrl = normalizeMediaValue(data.media_url || '');
        const normalizedExtraMediaUrls = Array.from(
            new Set(
                extraMediaUrls
                    .map((value) => normalizeMediaValue(value))
                    .filter(Boolean),
            ),
        ).filter((value) => value !== normalizedPrimaryImageUrl);

        const mediaUrls = normalizedPrimaryImageUrl
            ? [normalizedPrimaryImageUrl, ...normalizedExtraMediaUrls]
            : normalizedExtraMediaUrls;

        const normalizedSkills = Array.from(
            new Set(
                (data.skills_used ?? [])
                    .map((skill) => skill.trim())
                    .filter(Boolean),
            ),
        ).slice(0, MAX_SKILLS);

        const normalizedTools = normalizePortfolioTextArray(data.tools_used).slice(0, MAX_TOOLS);

        const formattedData: PortfolioSubmitData = {
            title: data.title.trim(),
            description: data.description.trim(),
            client_name: data.client_name?.trim() || '',
            project_url: data.project_url?.trim() || '',
            completion_date: data.completion_date || '',
            skills_used: normalizedSkills,
            tools_used: normalizedTools,
            media_urls: mediaUrls,
        };

        await onSubmit(formattedData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? tx('portfolio.form.editTitle') : tx('portfolio.form.addTitle')}
            size="4xl"
        >
            <div className="space-y-4" style={fieldThemeVars}>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left column (Content: Title, Description, Media) */}
                        <div className="lg:col-span-6 lg:sticky lg:top-0 space-y-5">
                            <Input
                                label={tx('portfolio.form.fields.title.label')}
                                placeholder={tx('portfolio.form.fields.title.placeholder')}
                                error={errors.title?.message}
                                className={inputClassName}
                                {...register('title')}
                            />

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-[var(--color-text-primary)]/85">
                                    {tx('portfolio.form.fields.description.label')}
                                </label>
                                <textarea
                                    {...register('description')}
                                    rows={5}
                                    className="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-[var(--color-bg-base)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/35 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25 focus:border-[#8B5CF6]/70 transition-all resize-none"
                                    placeholder={tx('portfolio.form.fields.description.placeholder')}
                                />
                                {errors.description && (
                                    <p className="text-red-400 text-xs">{errors.description.message}</p>
                                )}
                            </div>

                            {/* Media Showcase Panel */}
                            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.01] p-4">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-[var(--color-text-primary)]/90">
                                        {tx('portfolio.form.fields.imageUpload.label', undefined, 'Project Media & Showcase')}
                                    </label>
                                    {isUploading && (
                                        <span className="flex items-center gap-1.5 text-xs text-purple-400">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            {tx('portfolio.form.upload.uploading', undefined, 'Uploading Cover...')}
                                        </span>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                                <input
                                    ref={additionalImageInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    className="hidden"
                                    onChange={handleAdditionalImageUpload}
                                />

                                {resolvedPreviewUrl ? (
                                    <div className="relative h-48 w-full rounded-xl overflow-hidden border border-white/10 group bg-[#111] transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5">
                                        <OptimizedImage
                                            src={resolvedPreviewUrl}
                                            alt="Portfolio cover"
                                            className="h-full w-full"
                                            imgClassName="object-cover transition-transform duration-500 group-hover:scale-103"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-3.5 py-2 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-transform duration-150 active:scale-95"
                                            >
                                                <Upload className="w-3.5 h-3.5" />
                                                Replace Cover
                                            </button>
                                            <button
                                                type="button"
                                                onClick={clearSelectedImage}
                                                className="p-2 rounded-xl bg-red-500/90 text-white hover:bg-red-600 text-xs font-semibold flex items-center justify-center shadow-lg transition-transform duration-150 active:scale-95"
                                                title="Delete Cover"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-40 w-full border border-dashed border-white/20 hover:border-purple-500/40 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center cursor-pointer gap-2 group"
                                    >
                                        <span className="p-3 rounded-full bg-white/[0.04] group-hover:bg-purple-500/10 text-white/40 group-hover:text-purple-400 transition-colors">
                                            <Upload className="w-5 h-5" />
                                        </span>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">Upload Cover Image</p>
                                            <p className="text-[11px] text-white/35 mt-0.5">Drag & drop or click to browse. JPEG, PNG, WEBP (Max 5MB)</p>
                                        </div>
                                    </div>
                                )}

                                {/* Image URL Input Drawer - Only show when no cover image is set */}
                                {!resolvedPreviewUrl && (
                                    <div className="pt-3 border-t border-white/[0.05]">
                                        <p className="text-[11px] text-white/40 mb-2 font-medium">Or paste a direct image URL for the cover:</p>
                                        <input
                                            type="url"
                                            placeholder="https://example.com/cover-image.jpg"
                                            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[var(--color-bg-base)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/25 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                                            dir="ltr"
                                            {...register('media_url')}
                                        />
                                        {errors.media_url && (
                                            <p className="text-red-400 text-xs mt-1">{errors.media_url.message}</p>
                                        )}
                                    </div>
                                )}

                                <div className="pt-4 border-t border-white/[0.05] space-y-2">
                                    <p className="text-xs font-semibold text-[var(--color-text-primary)]/75">Project Gallery (Optional)</p>
                                    
                                    <div className="grid grid-cols-4 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => additionalImageInputRef.current?.click()}
                                            className="h-16 border border-dashed border-white/15 hover:border-purple-500/30 rounded-xl flex flex-col items-center justify-center bg-white/[0.01] hover:bg-white/[0.03] text-white/40 hover:text-purple-400 transition-all gap-1"
                                            title="Add gallery image"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="text-[9px] font-bold uppercase tracking-wider">Add</span>
                                        </button>

                                        {extraMediaUrls.map((url, index) => (
                                            <div key={`${url}-${index}`} className="relative h-16 rounded-xl overflow-hidden border border-white/10 bg-black/40 group">
                                                <OptimizedImage
                                                    src={url}
                                                    alt={`Gallery preview ${index + 1}`}
                                                    className="w-full h-full"
                                                    imgClassName="object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeExtraMediaUrl(index)}
                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white hover:text-red-400 transition-opacity"
                                                    title="Delete image"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 mt-2 pt-2">
                                        <input
                                            type="url"
                                            value={extraImageUrlInput}
                                            onChange={(event) => setExtraImageUrlInput(event.target.value)}
                                            placeholder="Add extra image URL..."
                                            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-white/10 bg-[var(--color-bg-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/25 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                                            dir="ltr"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddExtraImageUrl}
                                            className="px-3 py-1.5 rounded-xl border border-white/15 text-xs font-semibold text-[var(--color-text-primary)]/75 hover:text-[var(--color-text-primary)] hover:border-white/30 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {uploadError && <p className="text-red-400 text-xs mt-1">{uploadError}</p>}
                            </div>
                        </div>

                        {/* Right column (Metadata: URL, Date, Brand, Skills, Tools) */}
                        <div className="lg:col-span-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label={tx('portfolio.form.fields.projectUrl.label')}
                                    placeholder={tx('portfolio.form.fields.projectUrl.placeholder')}
                                    error={errors.project_url?.message}
                                    className={inputClassName}
                                    {...register('project_url')}
                                    dir="ltr"
                                />

                                <Input
                                    label={tx('portfolio.form.fields.completionDate.label')}
                                    type="date"
                                    error={errors.completion_date?.message}
                                    className={inputClassName}
                                    {...register('completion_date')}
                                />
                            </div>

                            <Input
                                label={tx('portfolio.form.fields.clientName.label', undefined, 'Client / Brand (optional)')}
                                placeholder={tx('portfolio.form.fields.clientName.placeholder', undefined, 'Example: Acme Corp')}
                                error={errors.client_name?.message}
                                className={inputClassName}
                                {...register('client_name')}
                            />

                            {/* Skills Used */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <label className="block text-sm font-medium text-[var(--color-text-primary)]/85">
                                        {tx('portfolio.form.fields.skills.label')}
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-[var(--color-text-primary)]/45">
                                            {selectedSkills.length}/{MAX_SKILLS}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => skillsInputRef.current?.focus()}
                                            className="text-xs px-2 py-1 rounded-lg border border-white/15 text-[var(--color-text-primary)]/65 hover:text-[var(--color-text-primary)] hover:border-white/30 transition-colors"
                                        >
                                            {tx('portfolio.form.skills.edit', undefined, 'Edit')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearAllSkills}
                                            disabled={selectedSkills.length === 0}
                                            className="text-xs px-2 py-1 rounded-lg border border-white/15 text-[var(--color-text-primary)]/65 hover:text-red-300 hover:border-red-400/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {tx('portfolio.form.skills.clearAll', undefined, 'Delete all')}
                                        </button>
                                    </div>
                                </div>

                                <input
                                    ref={skillsInputRef}
                                    type="text"
                                    value={skillsQuery}
                                    onChange={(event) => setSkillsQuery(event.target.value)}
                                    placeholder={tx(
                                        'portfolio.form.fields.skills.searchPlaceholder',
                                        undefined,
                                        'Search and select skills...',
                                    )}
                                    className="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-[var(--color-bg-base)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/35 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25 focus:border-[#8B5CF6]/70 transition-all"
                                />

                                {selectedSkills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[var(--color-bg-subtle)] p-2.5">
                                        {selectedSkills.map((skill) => (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => toggleSkill(skill)}
                                                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#8B5CF6]/35 bg-[#8B5CF6]/12 px-2.5 py-1 text-xs text-[#c4b5fd] hover:border-[#8B5CF6]/60 hover:text-[var(--color-text-primary)] transition-colors"
                                                title={tx('portfolio.form.skills.remove', undefined, 'Remove skill')}
                                            >
                                                <span className="truncate">{getSkillLabel(skill)}</span>
                                                <span className="text-[var(--color-text-primary)]/60">×</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-white/15 bg-[var(--color-bg-base)] px-3 py-2 text-xs text-[var(--color-text-primary)]/45">
                                        {tx('portfolio.form.skills.noneSelected', undefined, 'No skills selected yet.')}
                                    </div>
                                )}

                                <div className="max-h-36 overflow-y-auto rounded-xl border border-white/10 bg-[var(--color-bg-base)] p-2.5 space-y-2">
                                    {hasFilteredSkillOptions ? (
                                        SKILL_CATEGORY_ORDER.map((category) => {
                                            const categoryOptions = filteredSkillsByCategory[category];
                                            if (categoryOptions.length === 0) {
                                                return null;
                                            }

                                            return (
                                                <div key={category} className="rounded-lg border border-white/10 bg-[var(--color-bg-base)] p-2">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B5CF6] mb-1.5">
                                                        {getSkillCategoryLabel(category)}
                                                    </p>

                                                    <div className="flex flex-wrap gap-2">
                                                        {categoryOptions.map((option) => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => toggleSkill(option.value)}
                                                                className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-[var(--color-text-primary)]/75 hover:border-[#8B5CF6]/50 hover:text-[var(--color-text-primary)] transition-colors"
                                                                title={option.label}
                                                            >
                                                                {option.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="px-1 py-1 text-xs text-[var(--color-text-primary)]/45">
                                            {tx('portfolio.form.skills.noResults', undefined, 'No matching skills found.')}
                                        </p>
                                    )}
                                </div>

                                {errors.skills_used ? (
                                    <p className="text-red-400 text-xs">{errors.skills_used.message as string}</p>
                                ) : null}
                            </div>

                            {/* Tools Used */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <label className="block text-sm font-medium text-[var(--color-text-primary)]/85">
                                        {tx('portfolio.form.fields.tools.label', undefined, 'Tools used (optional)')}
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-[var(--color-text-primary)]/45">
                                            {selectedTools.length}/{MAX_TOOLS}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => toolsInputRef.current?.focus()}
                                            className="text-xs px-2 py-1 rounded-lg border border-white/15 text-[var(--color-text-primary)]/65 hover:text-[var(--color-text-primary)] hover:border-white/30 transition-colors"
                                        >
                                            {tx('portfolio.form.tools.edit', undefined, 'Edit')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearAllTools}
                                            disabled={selectedTools.length === 0}
                                            className="text-xs px-2 py-1 rounded-lg border border-white/15 text-[var(--color-text-primary)]/65 hover:text-red-300 hover:border-red-400/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {tx('portfolio.form.tools.clearAll', undefined, 'Delete all')}
                                        </button>
                                    </div>
                                </div>

                                <input
                                    ref={toolsInputRef}
                                    type="text"
                                    value={toolsQuery}
                                    onChange={(event) => setToolsQuery(event.target.value)}
                                    placeholder={tx(
                                        'portfolio.form.fields.tools.searchPlaceholder',
                                        undefined,
                                        'Search and select tools...',
                                    )}
                                    className="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-[var(--color-bg-base)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-primary)]/35 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/25 focus:border-[#f59e0b]/70 transition-all"
                                />

                                {selectedTools.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[var(--color-bg-subtle)] p-2.5">
                                        {selectedTools.map((tool) => (
                                            <button
                                                key={tool}
                                                type="button"
                                                onClick={() => toggleTool(tool)}
                                                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#f59e0b]/35 bg-[#f59e0b]/12 px-2.5 py-1 text-xs text-[#fcd34d] hover:border-[#f59e0b]/60 hover:text-[var(--color-text-primary)] transition-colors"
                                                title={tx('portfolio.form.tools.remove', undefined, 'Remove tool')}
                                            >
                                                <span className="truncate">{getToolLabel(tool)}</span>
                                                <span className="text-[var(--color-text-primary)]/60">×</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-white/15 bg-[var(--color-bg-base)] px-3 py-2 text-xs text-[var(--color-text-primary)]/45">
                                        {tx('portfolio.form.tools.noneSelected', undefined, 'No tools selected yet.')}
                                    </div>
                                )}

                                <div className="max-h-36 overflow-y-auto rounded-xl border border-white/10 bg-[var(--color-bg-base)] p-2.5 space-y-2">
                                    {hasFilteredToolOptions ? (
                                        TOOL_CATEGORY_ORDER.map((category) => {
                                            const categoryOptions = filteredToolsByCategory[category];
                                            if (categoryOptions.length === 0) {
                                                return null;
                                            }

                                            return (
                                                <div key={category} className="rounded-lg border border-white/10 bg-[var(--color-bg-base)] p-2">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#f59e0b] mb-1.5">
                                                        {getToolCategoryLabel(category)}
                                                    </p>

                                                    <div className="flex flex-wrap gap-2">
                                                        {categoryOptions.map((option) => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => toggleTool(option.value)}
                                                                className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-[var(--color-text-primary)]/75 hover:border-[#f59e0b]/50 hover:text-[var(--color-text-primary)] transition-colors"
                                                                title={option.label}
                                                            >
                                                                {option.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="px-1 py-1 text-xs text-[var(--color-text-primary)]/45">
                                            {tx('portfolio.form.tools.noResults', undefined, 'No matching tools found.')}
                                        </p>
                                    )}
                                </div>

                                {errors.tools_used ? (
                                    <p className="text-red-400 text-xs">{errors.tools_used.message as string}</p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSubmitting || isUploading}
                            className="!rounded-xl !border !border-white/15 !bg-transparent !text-[var(--color-text-primary)]/75 hover:!bg-white/10 hover:!text-[var(--color-text-primary)]"
                        >
                            {tx('portfolio.form.actions.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting || isUploading}
                            disabled={isUploading}
                            className="!rounded-xl !px-6"
                        >
                            {initialData ? tx('portfolio.form.actions.save') : tx('portfolio.form.actions.add')}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}



