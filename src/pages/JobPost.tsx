import { logger } from '@/lib/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Lightbulb,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { FormProvider, useForm, type SubmitHandler } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import SEO from '../components/common/SEO';
import { Header } from '../components/layout';
import StepBudget from '../components/job-post/StepBudget';
import JobLinksInput from '../components/job-post/JobLinksInput';
import StepReview from '../components/job-post/StepReview';
import StepVisibility from '../components/job-post/StepVisibility';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useAutosave } from '../hooks/useAutosave';
import { useTranslation } from '../i18n';
import { dashboardQueryKeys, invalidateClientDashboardQueries } from '../lib/dashboardQueries';
import { getJobCategories, JOB_CATEGORIES } from '../lib/jobCategories';
import {
  isMissingJobReferenceLinksColumnError,
  MAX_JOB_REFERENCE_LINKS,
  sanitizeJobReferenceLinks,
} from '../lib/jobLinks';
import { getStorageConfigErrorMessage, supabase, uploadFile } from '../lib/supabase';
import { supabaseWithRetry } from '../lib/supabaseWithRetry';
import { PREDEFINED_SKILLS, type Skill } from '../types';

// STEP_ITEMS will be defined inside the component using translations

const DRAFT_PROMPT_DISMISS_KEY = 'workedin_job_restore_dismissed_at';
const DRAFT_PROMPT_COOLDOWN_MS = 2 * 60 * 1000;

// TITLE_TEMPLATES and DESCRIPTION_SNIPPETS are defined inside the component using translations

const FIELD_CLASS =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-500 hover:border-white/20 hover:bg-white/[0.05] focus:bg-white/[0.05] focus:border-workspace-primary focus:ring-4 focus:ring-workspace-primary/10 shadow-inner backdrop-blur-sm';

const LABEL_CLASS = 'text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 inline-flex items-center gap-1.5';
const CHIP_CLASS =
  'inline-flex items-center gap-1.5 bg-white/[0.02] hover:bg-white/[0.06] text-gray-400 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-all cursor-pointer backdrop-blur-sm';

const JOB_POST_DEFAULT_VALUES: Partial<JobFormData> = {
  job_type: 'fixed_price',
  visibility: 'public',
  required_skills: [],
  experience_level: 'intermediate',
  subcategory: '',
  attachments_files: [],
  reference_links: [],
};

const optionalNumber = (message: string) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(1, message).optional()
  );

const createFutureDateString = (tx: ReturnType<typeof useTranslation>['tx']) =>
  z
    .string()
    .min(1, tx('jobs.new.validation.deadlineRequired', undefined, 'Please select a deadline'))
    .refine((value) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return date >= startOfToday;
    }, tx('jobs.new.validation.deadlineFuture', undefined, 'Deadline must be today or later'));

const createJobSchema = (tx: ReturnType<typeof useTranslation>['tx']) =>
  z
    .object({
      title: z
        .string()
        .trim()
        .min(8, tx('jobs.new.validation.titleMin', undefined, 'Title must be at least 8 characters'))
        .max(100),
      category: z.string().min(1, tx('jobs.new.validation.categoryRequired', undefined, 'Please select a category')),
      subcategory: z
        .string()
        .min(1, tx('jobs.new.validation.subcategoryRequired', undefined, 'Please select a subcategory')),
      description: z
        .string()
        .trim()
        .min(80, tx('jobs.new.validation.descriptionMin', undefined, 'Description must be at least 80 characters'))
        .max(2000),
      required_skills: z
        .array(z.any())
        .min(1, tx('jobs.new.validation.skillsRequired', undefined, 'Please select at least one skill'))
        .max(5),
      reference_links: z
        .array(z.string().trim())
        .max(
          MAX_JOB_REFERENCE_LINKS,
          tx(
            'jobs.new.validation.maxReferenceLinks',
            { count: MAX_JOB_REFERENCE_LINKS },
            `Maximum ${MAX_JOB_REFERENCE_LINKS} links`,
          ),
        )
        .optional()
        .refine(
          (links) => {
            if (!links) return true;
            return sanitizeJobReferenceLinks(links, MAX_JOB_REFERENCE_LINKS).length === links.length;
          },
          {
            message: tx('jobs.new.validation.referenceLinksInvalid', undefined, 'Please enter valid links only'),
          },
        ),
      attachments_files: z
        .array(z.instanceof(File))
        .max(5, tx('jobs.new.validation.maxFiles', undefined, 'Maximum 5 files'))
        .optional(),
      job_type: z.enum(['fixed_price', 'hourly']),
      budget_min: optionalNumber(tx('jobs.new.validation.budgetMin', undefined, 'Minimum budget must be at least 1')),
      budget_max: optionalNumber(tx('jobs.new.validation.budgetMax', undefined, 'Maximum budget must be at least 1')),
      hourly_rate: optionalNumber(tx('jobs.new.validation.hourlyRate', undefined, 'Hourly rate must be at least 1')),
      estimated_hours: optionalNumber(
        tx('jobs.new.validation.estimatedHours', undefined, 'Please enter estimated weekly hours')
      ),
      duration: z.string().min(1, tx('jobs.new.validation.durationRequired', undefined, 'Please select a duration')),
      experience_level: z.enum(['beginner', 'intermediate', 'expert']),
      deadline: createFutureDateString(tx),
      visibility: z.enum(['public', 'invite_only']),
    })
    .refine(
      (data) => {
        if (data.job_type === 'fixed_price') {
          const minValid =
            typeof data.budget_min === 'number' && !Number.isNaN(data.budget_min) && data.budget_min > 0;
          const maxValid =
            typeof data.budget_max === 'number' && !Number.isNaN(data.budget_max) && data.budget_max > 0;
          return minValid && maxValid;
        }
        const rateValid =
          typeof data.hourly_rate === 'number' && !Number.isNaN(data.hourly_rate) && data.hourly_rate > 0;
        const hoursValid =
          typeof data.estimated_hours === 'number' &&
          !Number.isNaN(data.estimated_hours) &&
          data.estimated_hours > 0;
        return rateValid && hoursValid;
      },
      {
        message: tx('jobs.new.validation.budgetRequired', undefined, 'Please set a budget'),
        path: ['budget_min'],
      }
    )
    .refine(
      (data) => {
        if (data.job_type !== 'fixed_price') return true;
        if (typeof data.budget_min !== 'number' || typeof data.budget_max !== 'number') return true;
        return data.budget_max >= data.budget_min;
      },
      {
        message: tx(
          'jobs.new.validation.budgetRange',
          undefined,
          'Maximum budget must be greater than or equal to minimum budget'
        ),
        path: ['budget_max'],
      }
    )
    .refine(
      (data) => {
        const category = JOB_CATEGORIES.find((item) => item.id === data.category);
        return Boolean(category?.subcategories.some((item) => item.id === data.subcategory));
      },
      {
        message: tx('jobs.new.validation.subcategoryInvalid', undefined, 'Please select a valid subcategory'),
        path: ['subcategory'],
      }
    );

type JobFormData = z.infer<ReturnType<typeof createJobSchema>>;

type RepostPrefillData = Partial<JobFormData> & {
  sourceJobId?: string;
};

type RepostLocationState = {
  repostFromJob?: RepostPrefillData;
};

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toDateInputString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeFutureDeadlineInput(rawDeadline: unknown) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (typeof rawDeadline === 'string' && rawDeadline.trim()) {
    const candidate = new Date(rawDeadline);
    if (!Number.isNaN(candidate.getTime()) && candidate >= startOfToday) {
      return toDateInputString(candidate);
    }
  }

  const fallback = new Date(startOfToday);
  fallback.setDate(fallback.getDate() + 14);
  return toDateInputString(fallback);
}

export default function JobPost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { tx, language } = useTranslation();

  const STEP_ITEMS = [
    { id: 1, label: tx('jobs.new.steps.basics', undefined, 'Job details'), description: tx('jobs.new.steps.basicsDescription', undefined, 'Define the brief, category, and required skills.') },
    { id: 2, label: tx('jobs.new.steps.budget', undefined, 'Budget/Timeline'), description: tx('jobs.new.steps.budgetDescription', undefined, 'Set pricing model, expected duration, and experience level.') },
    { id: 3, label: tx('jobs.new.steps.visibility', undefined, 'Visibility'), description: tx('jobs.new.steps.visibilityDescription', undefined, 'Choose whether the brief is public or invite-only.') },
    { id: 4, label: tx('jobs.new.steps.review', undefined, 'Review'), description: tx('jobs.new.steps.reviewDescription', undefined, 'Validate the brief before publishing.') },
  ];

  const TITLE_TEMPLATES: string[] = [
    tx('jobs.new.titleTemplateLogo', undefined, 'Logo design for a food company'),
    tx('jobs.new.titleTemplateLanding', undefined, 'Landing page redesign for SaaS product'),
    tx('jobs.new.titleTemplateVideo', undefined, 'Short-form video editor for social ads'),
    tx('jobs.new.titleTemplateDash', undefined, 'React dashboard with analytics widgets'),
  ];

  const DESCRIPTION_SNIPPETS: { label: string; text: string }[] = [
    { label: tx('jobs.new.snippetScope', undefined, 'Scope'), text: tx('jobs.new.snippetScopeText', undefined, 'Scope: Build a responsive experience aligned with our brand guidelines.') },
    { label: tx('jobs.new.snippetDeliverables', undefined, 'Deliverables'), text: tx('jobs.new.snippetDeliverablesText', undefined, 'Deliverables: Source files, deployment-ready build, and concise documentation.') },
    { label: tx('jobs.new.snippetSuccess', undefined, 'Success'), text: tx('jobs.new.snippetSuccessText', undefined, 'Success criteria: Pixel-perfect UI, strong performance, and clean handoff.') },
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const jobSchema = createJobSchema(tx);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<'draft' | 'publish' | null>(null);
  const [skillQuery, setSkillQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [showRestoreDraftModal, setShowRestoreDraftModal] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState<{ data: JobFormData; timestamp: Date } | null>(null);
  const hasCheckedDraftRef = useRef(false);
  const hasAppliedRepostPrefillRef = useRef(false);

  const methods = useForm<JobFormData>({
    resolver: zodResolver(jobSchema) as any,
    defaultValues: JOB_POST_DEFAULT_VALUES,
    mode: 'onChange',
  });

  const formData = methods.watch();
  const autosaveData = useMemo(
    () => ({
      ...formData,
      attachments_files: [],
    }),
    [formData]
  );

  const { status: autosaveStatus, lastSaved, loadFromStorage, clearStorage } = useAutosave<JobFormData>({
    data: autosaveData as JobFormData,
    storageKey: 'workedin_job_draft',
  });

  useEffect(() => {
    if (hasAppliedRepostPrefillRef.current) return;

    const state = location.state as RepostLocationState | null;
    const repostFromJob = state?.repostFromJob;
    if (!repostFromJob || typeof repostFromJob !== 'object') return;

    hasAppliedRepostPrefillRef.current = true;
    hasCheckedDraftRef.current = true;

    const normalizedJobType = repostFromJob.job_type === 'hourly' ? 'hourly' : 'fixed_price';
    const safeSkills = Array.isArray(repostFromJob.required_skills) ? repostFromJob.required_skills : [];
    const safeLinks = Array.isArray(repostFromJob.reference_links)
      ? sanitizeJobReferenceLinks(repostFromJob.reference_links as string[], MAX_JOB_REFERENCE_LINKS)
      : [];

    const normalizedPrefill: JobFormData = {
      ...(JOB_POST_DEFAULT_VALUES as JobFormData),
      ...(repostFromJob as Partial<JobFormData>),
      job_type: normalizedJobType,
      required_skills: safeSkills as Skill[],
      reference_links: safeLinks,
      deadline: normalizeFutureDeadlineInput(repostFromJob.deadline),
      estimated_hours:
        normalizedJobType === 'hourly'
          ? (typeof repostFromJob.estimated_hours === 'number' && repostFromJob.estimated_hours > 0
              ? repostFromJob.estimated_hours
              : 20)
          : undefined,
      attachments_files: [],
    };

    methods.reset(normalizedPrefill);
    setDraftToRestore(null);
    setShowRestoreDraftModal(false);

    showToast(
      tx('jobs.new.toasts.repostPrefilled', undefined, 'Previous project loaded. Review and publish when ready.'),
      'info',
    );

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, methods, navigate, showToast, tx]);

  useEffect(() => {
    if (hasCheckedDraftRef.current) return;
    hasCheckedDraftRef.current = true;

    const saved = loadFromStorage();
    if (!saved?.data || Object.keys(saved.data).length === 0) return;
    if (!saved.data.title && !saved.data.category) return;

    setDraftToRestore(saved);

    const dismissedAtRaw = sessionStorage.getItem(DRAFT_PROMPT_DISMISS_KEY);
    const dismissedAt = dismissedAtRaw ? Number(dismissedAtRaw) : 0;
    const dismissedRecently = Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DRAFT_PROMPT_COOLDOWN_MS;

    const savedAt = saved.timestamp instanceof Date ? saved.timestamp.getTime() : new Date(saved.timestamp).getTime();
    const savedJustNow = Number.isFinite(savedAt) && Date.now() - savedAt < DRAFT_PROMPT_COOLDOWN_MS;

    if (dismissedRecently || savedJustNow) {
      methods.reset({
        ...saved.data,
        attachments_files: [],
      });
      return;
    }

    setShowRestoreDraftModal(true);
  }, [loadFromStorage, methods]);

  const categories = useMemo(() => getJobCategories(language), [language]);
  const selectedCategory = methods.watch('category') || '';
  const selectedSubcategory = methods.watch('subcategory') || '';
  const selectedSkills = methods.watch('required_skills') || [];
  const referenceLinks = methods.watch('reference_links') || [];
  const attachments = methods.watch('attachments_files') || [];
  const title = methods.watch('title') || '';
  const description = methods.watch('description') || '';

  const availableSubcategories = useMemo(() => {
    return categories.find((category) => category.id === selectedCategory)?.subcategories ?? [];
  }, [categories, selectedCategory]);

  const filteredSkillSuggestions = useMemo(() => {
    const query = skillQuery.trim().toLowerCase();
    return PREDEFINED_SKILLS.filter((skill) => {
      const label = language === 'ar' ? skill.name_ar : language === 'fr' ? skill.name_fr : skill.name_en;
      const notSelected = !selectedSkills.some((item) => item.id === skill.id);
      const matchesQuery = query.length === 0 || label.toLowerCase().includes(query);
      return notSelected && matchesQuery;
    }).slice(0, 6);
  }, [language, selectedSkills, skillQuery]);

  const currentStepMeta = STEP_ITEMS[currentStep - 1];
  const progress = `${Math.round((currentStep / STEP_ITEMS.length) * 100)}%`;

  const qualityChecks = useMemo(
    () => [
      { id: 'title', label: tx('jobs.new.quality.clearTitle', undefined, 'Clear title'), pass: title.trim().length >= 12 },
      { id: 'category', label: tx('jobs.new.quality.categorySelected', undefined, 'Category selected'), pass: Boolean(selectedCategory && selectedSubcategory) },
      { id: 'description', label: tx('jobs.new.quality.strongDescription', undefined, 'Strong description'), pass: description.trim().length >= 120 },
      { id: 'skills', label: tx('jobs.new.quality.relevantSkills', undefined, 'Relevant skills'), pass: selectedSkills.length >= 3 },
    ],
    [tx, title, selectedCategory, selectedSubcategory, description, selectedSkills.length]
  );

  const qualityScore = useMemo(() => {
    const passCount = qualityChecks.filter((item) => item.pass).length;
    return Math.round((passCount / qualityChecks.length) * 100);
  }, [qualityChecks]);

  const dismissRestorePrompt = () => {
    setShowRestoreDraftModal(false);
    sessionStorage.setItem(DRAFT_PROMPT_DISMISS_KEY, String(Date.now()));
  };

  const handleRestoreDraft = () => {
    if (draftToRestore) {
      methods.reset({
        ...draftToRestore.data,
        attachments_files: [],
      });
      showToast(tx('jobs.new.toasts.draftRestored', undefined, 'Draft restored successfully'), 'success');
    }
    sessionStorage.removeItem(DRAFT_PROMPT_DISMISS_KEY);
    setShowRestoreDraftModal(false);
  };

  const handleDiscardDraft = () => {
    clearStorage();
    setDraftToRestore(null);
    setShowRestoreDraftModal(false);
    sessionStorage.setItem(DRAFT_PROMPT_DISMISS_KEY, String(Date.now()));
  };

  const applyTitleTemplate = (template: string) => {
    methods.setValue('title', template, { shouldDirty: true, shouldValidate: true });
    methods.clearErrors('title');
  };

  const addDescriptionSnippet = (snippet: string) => {
    const current = methods.getValues('description') || '';
    const next = current.trim().length === 0 ? snippet : `${current.trim()}\n${snippet}`;
    methods.setValue('description', next.slice(0, 2000), { shouldDirty: true, shouldValidate: true });
  };

  const updateFiles = (files: File[]) => {
    if (files.length === 0) return;

    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);
    const oversizedCount = files.length - validFiles.length;

    if (oversizedCount > 0) {
      showToast(`${oversizedCount} file(s) skipped: max size is 10MB`, 'warning');
    }

    if (validFiles.length === 0) return;

    const currentFiles = methods.getValues('attachments_files') || [];
    const availableSlots = Math.max(0, 5 - currentFiles.length);

    if (availableSlots === 0) {
      showToast(tx('jobs.new.validation.maxFiles', undefined, 'Maximum 5 files'), 'warning');
      return;
    }

    const filesToAdd = validFiles.slice(0, availableSlots);
    if (validFiles.length > availableSlots) {
      showToast(tx('jobs.new.validation.maxFiles', undefined, 'Maximum 5 files'), 'warning');
    }

    methods.setValue('attachments_files', [...currentFiles, ...filesToAdd], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleFileBrowse = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    updateFiles(files);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files || []);
    updateFiles(files);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const addSkill = (skill: Skill) => {
    if (selectedSkills.some((item) => item.id === skill.id)) return;
    if (selectedSkills.length >= 5) {
      showToast(tx('jobs.new.validation.skillsRequired', undefined, 'Please select at least one skill'), 'warning');
      return;
    }

    methods.setValue('required_skills', [...selectedSkills, skill], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSkillQuery('');
  };

  const removeSkill = (skillId: string) => {
    methods.setValue(
      'required_skills',
      selectedSkills.filter((item) => item.id !== skillId),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const removeAttachment = (targetIndex: number) => {
    methods.setValue(
      'attachments_files',
      attachments.filter((_, index) => index !== targetIndex),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const focusFirstInvalidField = (fieldNames: Array<keyof JobFormData>) => {
    const errors = methods.formState.errors;
    const firstInvalidField = fieldNames.find((fieldName) => Boolean(errors[fieldName]));
    if (!firstInvalidField) return;

    methods.setFocus(firstInvalidField);

    const escapedName = String(firstInvalidField).replace(/([.[\]])/g, '\\$1');
    const fieldElement = document.querySelector<HTMLElement>(`[name="${escapedName}"]`);
    if (fieldElement) {
      fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const fallbackElement = document.querySelector<HTMLElement>(`[data-field="${escapedName}"]`);
    fallbackElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleNext = async () => {
    let fieldsToValidate: Array<keyof JobFormData> = [];

    if (currentStep === 1) {
      fieldsToValidate = ['title', 'category', 'subcategory', 'description', 'required_skills', 'reference_links'];
    } else if (currentStep === 2) {
      fieldsToValidate = [
        'job_type',
        'budget_min',
        'budget_max',
        'hourly_rate',
        'estimated_hours',
        'duration',
        'experience_level',
        'deadline',
      ];
    } else if (currentStep === 3) {
      fieldsToValidate = ['visibility'];
    }

    const isValid = await methods.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
      return;
    }

    focusFirstInvalidField(fieldsToValidate);

    const firstInvalidField = fieldsToValidate.find((fieldName) => Boolean(methods.formState.errors[fieldName]));
    const firstInvalidError = firstInvalidField ? methods.formState.errors[firstInvalidField] : undefined;
    const fieldSpecificMessage =
      firstInvalidError && typeof firstInvalidError.message === 'string'
        ? firstInvalidError.message
        : tx('jobs.new.errors.stepIncomplete', undefined, 'Please complete required fields before continuing.');

    showToast(`Step ${currentStep}: ${fieldSpecificMessage}`, 'warning');
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  const onSubmit: SubmitHandler<JobFormData> = async (data) => {
    setSubmitIntent('publish');
    await submitJob(data, 'open');
  };

  const handleSaveDraft = async () => {
    setSubmitIntent('draft');
    const data = methods.getValues();

    const draftTitle = data.title?.trim() || '';
    if (!draftTitle) {
      const message = tx('jobs.new.errors.titleRequiredForDraft', undefined, 'Please enter a job title to save draft');
      methods.setError('title', { message });
      methods.setFocus('title');
      const titleField = document.querySelector<HTMLElement>('[name="title"]');
      titleField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast(message, 'warning');
      setSubmitIntent(null);
      return;
    }

    methods.clearErrors('title');

    try {
      const draftData: JobFormData = {
        ...data,
        title: draftTitle,
        attachments_files: [],
      } as JobFormData;

      localStorage.setItem(
        'workedin_job_draft',
        JSON.stringify({
          data: draftData,
          timestamp: new Date().toISOString(),
        })
      );

      showToast(tx('jobs.new.toasts.draftSaved', undefined, 'Draft saved successfully'), 'success');
    } catch (error) {
      logger.error('Error saving local draft:', error);
      showToast(tx('jobs.new.errors.saveFailed', undefined, 'Something went wrong while saving the job'), 'error');
    } finally {
      setSubmitIntent(null);
    }
  };

  useEffect(() => {
    const handleSaveShortcut = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const withModifier = isMac ? event.metaKey : event.ctrlKey;
      if (!withModifier || event.key.toLowerCase() !== 's') return;

      event.preventDefault();
      void handleSaveDraft();
    };

    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [handleSaveDraft]);

  const submitJob = async (data: JobFormData, status: 'open' | 'draft') => {
    if (!user) {
      showToast(tx('jobs.new.errors.loginRequired', undefined, 'You must be logged in to post a job'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      if (data.attachments_files && data.attachments_files.length > 0) {
        let hasStorageConfigError = false;
        let firstUploadErrorMessage = '';
        const failedFiles: string[] = [];

        for (const [index, file] of (data.attachments_files as File[]).entries()) {
          const fileExtRaw = file.name.split('.').pop() || 'bin';
          const fileExt = fileExtRaw.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
          const fileName = `attach-${index + 1}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          try {
            uploadedUrls.push(await uploadFile('attachments', filePath, file));
          } catch (uploadError) {
            failedFiles.push(file.name);
            if (uploadError instanceof Error) {
              if (uploadError.message.toLowerCase().includes('bucket')) {
                hasStorageConfigError = true;
              }
              if (!firstUploadErrorMessage) {
                firstUploadErrorMessage = uploadError.message;
              }
            } else if (!firstUploadErrorMessage) {
              firstUploadErrorMessage = String(uploadError);
            }
          }
        }

        if (failedFiles.length > 0 && uploadedUrls.length === 0) {
          const allFailedMessage = hasStorageConfigError
            ? getStorageConfigErrorMessage('attachments')
            : firstUploadErrorMessage || tx(
                'jobs.new.errors.attachmentsUploadFailed',
                undefined,
                'Attachments upload failed. Please retry with smaller or different files.'
              );

          throw new Error(allFailedMessage);
        }

        if (failedFiles.length > 0) {
          const previewNames = failedFiles.slice(0, 2).join(', ');
          const moreCount = Math.max(0, failedFiles.length - 2);
          const partialWarning = hasStorageConfigError
            ? getStorageConfigErrorMessage('attachments')
            : tx(
                'jobs.new.errors.attachmentsPartial',
                { file: `${previewNames}${moreCount > 0 ? ` +${moreCount}` : ''}` },
                `Some attachments could not be uploaded (${previewNames}${moreCount > 0 ? ` +${moreCount}` : ''}).`
              );

          showToast(partialWarning, 'warning');
        }
      }

      const toNumberOrNull = (value: unknown): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return Number.isNaN(num) ? null : num;
      };

      const jobData = {
        client_id: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        job_type: data.job_type,
        budget_min: toNumberOrNull(data.budget_min),
        budget_max: toNumberOrNull(data.budget_max),
        hourly_rate: toNumberOrNull(data.hourly_rate),
        duration: data.duration,
        experience_level: data.experience_level,
        deadline: data.deadline,
        visibility: data.visibility,
        attachments: uploadedUrls,
        reference_links: sanitizeJobReferenceLinks(data.reference_links || [], MAX_JOB_REFERENCE_LINKS),
        status: 'open' as const,
        required_skills: data.required_skills || [],
      };

      let insertResult = await supabaseWithRetry(() => supabase.from('jobs').insert(jobData).select('id').single());

      if (insertResult.error && isMissingJobReferenceLinksColumnError(insertResult.error)) {
        const { reference_links, ...legacyJobData } = jobData;
        insertResult = await supabaseWithRetry(() => supabase.from('jobs').insert(legacyJobData).select('id').single());

        if (!insertResult.error && (data.reference_links?.length || 0) > 0) {
          showToast(
            tx(
              'jobs.new.warnings.linksTemporarilyUnavailable',
              undefined,
              'Links were saved in the form but could not be persisted yet. Please run latest migrations.',
            ),
            'warning',
          );
        }
      }

      const { data: insertedJob, error } = insertResult;

      if (error) {
        logger.error('Supabase job insert error:', error);
        throw new Error(
          tx(
            'jobs.new.errors.dbError',
            { message: error.message, code: error.code },
            `DB Error: ${error.message} (Code: ${error.code})`
          )
        );
      }

      clearStorage();
      setDraftToRestore(null);
      setShowRestoreDraftModal(false);
      methods.reset(JOB_POST_DEFAULT_VALUES as JobFormData);
      setCurrentStep(1);

      if (status === 'draft') {
        showToast(tx('jobs.new.toasts.draftSaved', undefined, 'Draft saved successfully'), 'success');
      } else {
        await Promise.all([
          invalidateClientDashboardQueries(queryClient, user.id),
          queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.clientStats(user.id) }),
          queryClient.invalidateQueries({ queryKey: ['client-jobs-v3'] }),
          queryClient.invalidateQueries({ queryKey: ['client-jobs'] }),
          queryClient.invalidateQueries({ queryKey: ['client-stats', user.id] }),
        ]);
        showToast(tx('jobs.new.toasts.jobPosted', undefined, 'Job posted successfully!'), 'success');
        navigate(insertedJob?.id ? `/jobs/posted/${insertedJob.id}` : '/jobs', { replace: true });
      }
    } catch (error) {
      logger.error('Error posting job:', error);
      const message = error instanceof Error ? error.message : String(error);
      showToast(message || tx('jobs.new.errors.saveFailed', undefined, 'Something went wrong while saving the job'), 'error');
    } finally {
      setIsSubmitting(false);
      setSubmitIntent(null);
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return tx('jobs.new.time.now', undefined, 'Just now');
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return tx('jobs.new.time.minutesAgo', { count: minutes }, `${minutes} min ago`);
    }
    const hours = Math.floor(seconds / 3600);
    return tx('jobs.new.time.hoursAgo', { count: hours }, `${hours} h ago`);
  };

  return (
    <>
      <SEO
        title={tx('jobs.new.seo.title', undefined, 'Post a Project')}
        description={tx(
          'jobs.new.seo.description',
          undefined,
          'Create a new project, define budget and timeline, and publish it to receive freelancer proposals.'
        )}
      />
      <Header />
      <main className="page-bg-base min-h-screen pb-32">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
            
            {/* Top Minimal Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">
                  {tx('jobs.new.seo.title', undefined, 'Post a Project')}
                </h1>
                <p className="text-gray-400 text-sm">
                  {tx('jobs.new.heroDescription', undefined, 'Define your project brief in focused phases to find the perfect expert.')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="surface-card border border-white/10 bg-white/[0.02] px-3.5 py-1.5 rounded-full text-xs inline-flex items-center gap-2 text-gray-400">
                  {autosaveStatus === 'saving' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-workspace-primary" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {autosaveStatus === 'saving'
                    ? tx('jobs.new.autosave.saving', undefined, 'Saving...')
                    : lastSaved
                    ? tx('jobs.new.autosave.lastSaved', { time: 'Just now' }, 'Last saved: Just now')
                    : tx('jobs.new.autosave.ready', undefined, 'Autosave ready')}
                </span>
                <span className="surface-card border border-white/10 bg-white/[0.02] px-3.5 py-1.5 rounded-full text-xs inline-flex items-center gap-2 text-gray-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-workspace-primary" />
                  {tx('jobs.new.wizard.metaDraft', undefined, 'Draft-safe flow')}
                </span>
              </div>
            </header>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
              
              {/* Sticky Progress & Guide Sidebar */}
              <aside className="space-y-6 lg:sticky lg:top-24">
                
                {/* Steps Checklist */}
                <div className="surface-card border border-white/10 rounded-2xl p-5 w-full flex flex-col gap-6 bg-gradient-to-b from-white/[0.02] to-transparent">
                  <div>
                    <p className="text-workspace-primary text-[10px] font-bold tracking-widest uppercase mb-1">
                      {tx('jobs.new.currentPhase', undefined, 'CURRENT PHASE')}
                    </p>
                    <h2 className="text-white text-base font-bold font-display leading-tight">{currentStepMeta.label}</h2>
                  </div>

                  <nav className="flex flex-col gap-4">
                    {STEP_ITEMS.map((step, idx) => {
                      const isCompleted = step.id < currentStep;
                      const isActive = step.id === currentStep;

                      return (
                        <div key={step.id} className="flex items-start gap-3 relative">
                          {idx < STEP_ITEMS.length - 1 && (
                            <div
                              className={`absolute left-3.5 top-8 bottom-0 w-0.5 -translate-x-1/2 ${
                                isCompleted ? 'bg-workspace-primary' : 'bg-white/5'
                              }`}
                              style={{ height: 'calc(100% + 8px)' }}
                            />
                          )}
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-workspace-primary text-white shadow-[0_0_15px_var(--workspace-shadow)] ring-4 ring-workspace-primary/20'
                                : isCompleted
                                ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                                : 'bg-white/5 text-gray-500 border border-white/10'
                            }`}
                          >
                            {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                          </div>
                          <div className="flex flex-col">
                            <span
                              className={`text-xs font-semibold tracking-wide transition-colors ${
                                isActive ? 'text-workspace-primary' : isCompleted ? 'text-emerald-400' : 'text-gray-500'
                              }`}
                            >
                              {step.label}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5 leading-relaxed hidden xl:block">
                              {step.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </nav>

                  {/* Progress Indicator */}
                  <div className="border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-gray-500">{tx('jobs.new.progress', undefined, 'Progress')}</span>
                      <span className="text-white font-bold">{progress}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-workspace-primary rounded-full transition-all duration-300" style={{ width: progress }} />
                    </div>
                  </div>
                </div>

                {/* Expert Tips Panel */}
                <div className="surface-card border border-white/10 rounded-2xl p-5 w-full flex flex-col gap-3.5 bg-gradient-to-br from-white/[0.01] to-transparent">
                  <div className="flex items-center gap-2 text-workspace-primary text-xs font-bold tracking-wider uppercase">
                    <Lightbulb className="w-4 h-4 shrink-0" />
                    <span>{tx('jobs.new.expertTipsTitle', undefined, 'Expert Tips')}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 leading-relaxed space-y-2.5">
                    {currentStep === 1 && (
                      <>
                        <p><strong>{tx('jobs.new.expertTips.specificTitleLabel', undefined, 'Specific Title:')}</strong> {tx('jobs.new.expertTips.specificTitleText', undefined, 'Describe exactly what you need. A clear title attracts matching specialists immediately.')}</p>
                        <p><strong>{tx('jobs.new.expertTips.richContextLabel', undefined, 'Rich Context:')}</strong> {tx('jobs.new.expertTips.richContextText', undefined, 'Provide clear parameters on scope, final deliverables, and success criteria.')}</p>
                      </>
                    )}
                    {currentStep === 2 && (
                      <>
                        <p><strong>{tx('jobs.new.expertTips.budgetModelLabel', undefined, 'Budget Model:')}</strong> {tx('jobs.new.expertTips.budgetModelText', undefined, 'Choose Fixed Price for well-defined outcomes, and Hourly for ongoing or dynamic briefs.')}</p>
                        <p><strong>{tx('jobs.new.expertTips.deadlineBufferLabel', undefined, 'Deadline Buffer:')}</strong> {tx('jobs.new.expertTips.deadlineBufferText', undefined, 'Setting a realistic date encourages high-quality, professional applications.')}</p>
                      </>
                    )}
                    {currentStep === 3 && (
                      <>
                        <p><strong>{tx('jobs.new.expertTips.publicBriefsLabel', undefined, 'Public Briefs:')}</strong> {tx('jobs.new.expertTips.publicBriefsText', undefined, 'Great for maximum proposals and competitive price bidding.')}</p>
                        <p><strong>{tx('jobs.new.expertTips.inviteOnlyLabel', undefined, 'Invite-only:')}</strong> {tx('jobs.new.expertTips.inviteOnlyText', undefined, 'Best for private/sensitive IP or when you personally select top freelancers.')}</p>
                      </>
                    )}
                    {currentStep === 4 && (
                      <>
                        <p><strong>{tx('jobs.new.expertTips.lockStructureLabel', undefined, 'Lock Structure:')}</strong> {tx('jobs.new.expertTips.lockStructureText', undefined, 'Verify all specs. The core structure is finalized upon publishing to ensure bid consistency.')}</p>
                      </>
                    )}
                  </div>
                </div>
              </aside>

              {/* Right Form Card Container */}
              <div className="flex-1 w-full min-w-0">
                {currentStep === 1 ? (
                  <div className="space-y-6">
                    
                    {/* Step 1 Title Header Card */}
                    <header className="surface-card border border-white/10 rounded-2xl p-6 bg-gradient-to-r from-white/[0.02] to-transparent">
                      <h2 className="text-lg font-bold text-white tracking-wide font-display">
                        {tx('jobs.new.steps.basics', undefined, 'Job details')}
                      </h2>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        {tx('jobs.new.step1.subtitle', undefined, 'Start with a clear title and strong context.')}
                      </p>
                    </header>

                    {/* Step 1 Form Card */}
                    <div className="surface-card border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col gap-8 shadow-sm">
                      
                      {/* Project Title */}
                      <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.01] p-4 md:p-5 transition-colors hover:border-white/10">
                        <label className={LABEL_CLASS}>
                          {tx('jobs.new.fields.title', undefined, 'Project title')}
                          <span className="text-workspace-primary font-bold" aria-hidden="true">*</span>
                        </label>
                        <p className="text-[11px] text-gray-500">
                          {tx('jobs.new.fields.titleHint', undefined, 'Use specific technical terms to help the right freelancers find you.')}
                        </p>
                        <input
                          type="text"
                          {...methods.register('title')}
                          name="title"
                          placeholder={tx(
                            'jobs.new.fields.titlePlaceholder',
                            undefined,
                            'Example: Modern bilingual logo system for a Tunisian cafe'
                          )}
                          className={`${FIELD_CLASS} text-base`}
                        />
                        {methods.formState.errors.title ? (
                          <p className="text-red-400 text-xs">{methods.formState.errors.title.message as string}</p>
                        ) : null}
                        
                        {/* Title Templates */}
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          {TITLE_TEMPLATES.map((template) => (
                            <button
                              key={template}
                              type="button"
                              onClick={() => applyTitleTemplate(template)}
                              className={CHIP_CLASS}
                            >
                              <span className="text-workspace-primary font-semibold font-mono text-[10px]">+</span> {template}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Category Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Main Category */}
                        <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.01] p-4 md:p-5 transition-colors hover:border-white/10">
                          <label className={LABEL_CLASS}>
                            {tx('jobs.new.fields.mainCategory', undefined, 'Main category')}
                            <span className="text-workspace-primary font-bold" aria-hidden="true">*</span>
                          </label>
                          <p className="text-[11px] text-gray-500">
                            {tx('jobs.new.fields.categoryHint', undefined, 'Choose the best fit category to enable automated expert match alerts.')}
                          </p>
                          <div className="relative">
                            <select
                              name="category"
                              aria-label={tx('jobs.new.fields.mainCategory', undefined, 'Main category')}
                              value={selectedCategory}
                              onChange={(event) => {
                                methods.setValue('category', event.target.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                methods.setValue('subcategory', '', {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }}
                              className={`${FIELD_CLASS} appearance-none pr-10`}
                            >
                              <option value="" className="bg-[#030303]">
                                {tx('jobs.new.fields.selectCategory', undefined, 'Select category')}
                              </option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id} className="bg-[#0c0c0e]">
                                  {category.name}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                              ▼
                            </div>
                          </div>
                          {methods.formState.errors.category ? (
                            <p className="text-red-400 text-xs">{methods.formState.errors.category.message as string}</p>
                          ) : null}
                        </div>

                        {/* Subcategory */}
                        <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.01] p-4 md:p-5 transition-colors hover:border-white/10">
                          <label className={LABEL_CLASS}>
                            {tx('jobs.new.fields.subcategory', undefined, 'Subcategory')}
                            <span className="text-workspace-primary font-bold" aria-hidden="true">*</span>
                          </label>
                          <p className="text-[11px] text-gray-500">
                            {tx('jobs.new.fields.subcategoryHint', undefined, 'Pick the exact specialty to filter bids and ensure precise skills matching.')}
                          </p>
                          <div className="relative">
                            <select
                              name="subcategory"
                              aria-label={tx('jobs.new.fields.subcategory', undefined, 'Subcategory')}
                              value={selectedSubcategory}
                              onChange={(event) => {
                                methods.setValue('subcategory', event.target.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }}
                              disabled={!selectedCategory}
                              className={`${FIELD_CLASS} appearance-none pr-10 disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/[0.01] disabled:text-[#6c7485]`}
                            >
                              <option value="" className="bg-[#030303]">
                                {tx('jobs.new.fields.selectSubcategory', undefined, 'Select subcategory')}
                              </option>
                              {availableSubcategories.map((subcategory) => (
                                <option
                                  key={subcategory.id}
                                  value={subcategory.id}
                                  className="bg-[#0c0c0e]"
                                >
                                  {subcategory.name}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                              ▼
                            </div>
                          </div>
                          {methods.formState.errors.subcategory ? (
                            <p className="text-red-400 text-xs">
                              {methods.formState.errors.subcategory.message as string}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.01] p-4 md:p-5 transition-colors hover:border-white/10">
                        <label className={LABEL_CLASS}>
                          {tx('jobs.new.fields.description', undefined, 'Project description')}
                          <span className="text-workspace-primary font-bold" aria-hidden="true">*</span>
                        </label>
                        <p className="text-[11px] text-gray-500">
                          {tx('jobs.new.fields.descriptionHint', undefined, 'Explain the scope, expected parameters, and what successful deliverables look like.')}
                        </p>
                        <textarea
                          rows={7}
                          maxLength={2000}
                          {...methods.register('description')}
                          name="description"
                          placeholder={tx(
                            'jobs.new.fields.descriptionPlaceholder',
                            undefined,
                            'Provide detailed background, target audience, technical specifications, and key deliverables...'
                          )}
                          className={`${FIELD_CLASS} min-h-48 resize-y leading-relaxed`}
                        />

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-gray-500">
                            {tx('jobs.new.fields.charCount', { current: description.length, max: 2000 }, `${description.length} / 2000 characters`)}
                          </span>
                          {methods.formState.errors.description ? (
                            <span className="text-red-400 text-xs">
                              {methods.formState.errors.description.message as string}
                            </span>
                          ) : null}
                        </div>

                        {/* Description Snippets */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {DESCRIPTION_SNIPPETS.map((snippet) => (
                            <button
                              key={snippet.label}
                              type="button"
                              onClick={() => addDescriptionSnippet(snippet.text)}
                              className={CHIP_CLASS}
                            >
                              <span className="text-workspace-primary font-semibold font-mono text-[10px]">+</span> {snippet.label}
                            </button>
                          ))}
                        </div>

                        {/* Description Tips */}
                        <div className="bg-workspace-primary/[0.03] border border-workspace-primary/15 rounded-xl p-4 flex gap-3 mt-4">
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-workspace-primary/10 text-workspace-primary">
                            <Lightbulb className="w-4 h-4" />
                          </span>
                          <ul className="grid gap-2 text-xs text-gray-300 leading-normal sm:grid-cols-2 pt-0.5">
                            <li className="inline-flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-workspace-primary" />
                              {tx('jobs.new.tips.scope', undefined, 'Be specific about scope and expected quality.')}
                            </li>
                            <li className="inline-flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-workspace-primary" />
                              {tx('jobs.new.tips.success', undefined, 'Clearly define what success looks like.')}
                            </li>
                            <li className="inline-flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-workspace-primary" />
                              {tx('jobs.new.tips.references', undefined, 'Add links, references, or examples if available.')}
                            </li>
                            <li className="inline-flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-workspace-primary" />
                              {tx('jobs.new.tips.handoff', undefined, 'Clarify what should be delivered at handoff.')}
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Reference Links */}
                      <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.01] p-4 md:p-5 transition-colors hover:border-white/10" data-field="reference_links">
                        <JobLinksInput
                          value={referenceLinks}
                          onChange={(links) => {
                            methods.setValue('reference_links', links, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          maxLinks={MAX_JOB_REFERENCE_LINKS}
                        />
                        {methods.formState.errors.reference_links ? (
                          <p className="mt-2 text-red-500 text-xs">
                            {methods.formState.errors.reference_links.message as string}
                          </p>
                        ) : null}
                      </div>

                      {/* Required Skills */}
                      <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.01] p-4 md:p-5 transition-colors hover:border-white/10" data-field="required_skills">
                        <label className={LABEL_CLASS}>
                          {tx('jobs.new.fields.requiredSkills', undefined, 'Required skills (max 5)')}
                          <span className="text-workspace-primary font-bold" aria-hidden="true">*</span>
                        </label>
                        <p className="text-[11px] text-gray-500">
                          {tx('jobs.new.fields.skillsHint', undefined, 'Tag precise skills to target specialized freelancers for direct application invitations.')}
                        </p>

                        <div className="relative">
                          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={skillQuery}
                            onChange={(event) => setSkillQuery(event.target.value)}
                            placeholder={tx(
                              'jobs.new.fields.skillsPlaceholder',
                              undefined,
                              'Try Graphic Design, React, Motion Design...'
                            )}
                            className={`${FIELD_CLASS} pl-10`}
                          />
                        </div>

                        {/* Selected Skills */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedSkills.map((skill) => {
                            const label =
                              language === 'ar'
                                ? skill.name_ar
                                : language === 'fr'
                                  ? skill.name_fr
                                  : skill.name_en;
                            return (
                              <span
                                key={skill.id}
                                className="flex items-center gap-1.5 rounded-lg border border-workspace-primary/20 bg-workspace-primary/10 px-2.5 py-1 text-xs text-white"
                              >
                                {label}
                                <button
                                  type="button"
                                  onClick={() => removeSkill(skill.id)}
                                  className="text-workspace-primary/60 hover:text-white transition-colors"
                                  aria-label={`Remove ${label}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            );
                          })}
                        </div>

                        {/* Suggested Skills */}
                        <div className="flex flex-wrap items-center gap-2 text-xs pt-2">
                          <span className="text-gray-500">{tx('jobs.new.fields.suggested', undefined, 'Suggested:')}</span>
                          {filteredSkillSuggestions.map((skill) => {
                            const label =
                              language === 'ar'
                                ? skill.name_ar
                                : language === 'fr'
                                  ? skill.name_fr
                                  : skill.name_en;

                            return (
                              <button
                                key={skill.id}
                                type="button"
                                onClick={() => addSkill(skill)}
                                className={CHIP_CLASS}
                              >
                                <span className="text-workspace-primary font-semibold font-mono text-[10px]">+</span> {label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Quality Score Indicator */}
                        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.01] p-4 md:p-5 shadow-sm transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{tx('jobs.new.quality.title', undefined, 'Quality Score')}</p>
                            <p className="text-sm font-bold text-white">{qualityScore}%</p>
                          </div>
                          <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-4 border border-white/5">
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${qualityScore}%`,
                                background: qualityScore >= 75
                                  ? 'linear-gradient(90deg,#10b981,#34d399)'
                                  : qualityScore >= 50
                                    ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                                    : 'linear-gradient(90deg,#f97316,#fb7185)',
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {qualityChecks.map((check) => (
                              <div key={check.id} className="flex items-center gap-2.5 text-[13px]">
                                <span className={`flex shrink-0 w-4.5 h-4.5 items-center justify-center rounded-full transition-colors ${check.pass ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                                  {check.pass ? <Check className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />}
                                </span>
                                <span className={check.pass ? 'text-gray-300 font-medium' : 'text-gray-500'}>{check.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {methods.formState.errors.required_skills ? (
                          <p className="text-red-500 text-xs">
                            {methods.formState.errors.required_skills.message as string}
                          </p>
                        ) : null}
                      </div>

                      {/* Attachments */}
                      <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.01] p-4 md:p-5 transition-colors hover:border-white/10" data-field="attachments_files">
                        <label className={LABEL_CLASS}>
                          {tx('jobs.new.fields.attachments', undefined, 'Attachments (optional)')}
                        </label>
                        <p className="text-[11px] text-gray-500">
                          {tx('jobs.new.fields.attachmentsHint2', undefined, 'Provide assets, mockups, or detailed specs to clarify work deliverables.')}
                        </p>

                        <label
                          htmlFor="attachments"
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          className={`border border-dashed rounded-xl bg-white/[0.01] px-5 py-8 flex flex-col items-center justify-center gap-3.5 cursor-pointer text-center transition-all duration-200 ${
                            isDragging
                              ? 'border-workspace-primary bg-workspace-primary/5'
                              : 'border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
                          }`}
                        >
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-gray-400">
                            <UploadCloud className="w-6 h-6" />
                          </span>
                          <div className="space-y-1">
                            <p className="text-white text-sm font-semibold">
                              {tx('jobs.new.fields.attachmentsDrop', undefined, 'Drag files here or click to browse')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {tx(
                                'jobs.new.fields.attachmentsHint',
                                undefined,
                                'PDF, DOC, DOCX, TXT, PNG, JPG, WEBP - Max 10MB per file'
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg text-xs transition-colors font-semibold"
                          >
                            {tx('jobs.new.fields.chooseFiles', undefined, 'Choose files')}
                          </button>
                          <input
                            ref={fileInputRef}
                            id="attachments"
                            name="attachments_files"
                            type="file"
                            className="hidden"
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                            onChange={handleFileBrowse}
                          />
                        </label>

                        {/* File Preview list */}
                        {attachments.length > 0 ? (
                          <div className="space-y-2 mt-3">
                            {attachments.map((file, index) => (
                              <div
                                key={`${file.name}-${file.size}-${index}`}
                                className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 flex items-center justify-between"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                  type="button"
                                  className="text-gray-400 hover:text-red-400 transition-colors p-1"
                                  onClick={() => removeAttachment(index)}
                                  aria-label={`Remove ${file.name}`}
                                >
                                  <X className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {methods.formState.errors.attachments_files ? (
                          <p className="text-red-500 text-xs mt-1">
                            {methods.formState.errors.attachments_files.message as string}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {currentStep === 2 ? (
                  <div className="space-y-6">
                    <header className="surface-card border border-white/10 rounded-2xl p-6 bg-gradient-to-r from-white/[0.02] to-transparent">
                      <h2 className="text-lg font-bold text-white tracking-wide font-display">
                        {tx('jobs.new.stepBudget.title', undefined, 'Budget & Duration')}
                      </h2>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        {tx('jobs.new.stepBudget.subtitle', undefined, 'Choose payment terms, timeframe, and contractor profile experience.')}
                      </p>
                    </header>
                    <div className="surface-card border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
                      <StepBudget />
                    </div>
                  </div>
                ) : null}

                {currentStep === 3 ? (
                  <div className="space-y-6">
                    <header className="surface-card border border-white/10 rounded-2xl p-6 bg-gradient-to-r from-white/[0.02] to-transparent">
                      <h2 className="text-lg font-bold text-white tracking-wide font-display">
                        {tx('jobs.new.stepVisibility.title', undefined, 'Visibility')}
                      </h2>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        {tx('jobs.new.stepVisibility.subtitle', undefined, 'Choose who can see your project brief.')}
                      </p>
                    </header>
                    <div className="surface-card border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
                      <StepVisibility />
                    </div>
                  </div>
                ) : null}

                {currentStep === 4 ? (
                  <div className="space-y-6">
                    <header className="surface-card border border-white/10 rounded-2xl p-6 bg-gradient-to-r from-white/[0.02] to-transparent">
                      <h2 className="text-lg font-bold text-white tracking-wide font-display">
                        {tx('jobs.new.stepReview.title', undefined, 'Review and Publish')}
                      </h2>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        {tx('jobs.new.stepReview.subtitle', undefined, 'Final check before sending this project brief live to the marketplace.')}
                      </p>
                    </header>
                    <div className="surface-card border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
                      <StepReview />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Bottom Capsule Sticky Controls */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] md:w-[calc(100%-3rem)] md:max-w-7xl px-4 md:px-8">
              <div className="surface-card border border-white/10 bg-[#0c0c0e]/80 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold">
                    {tx(
                      'jobs.new.stepCounter',
                      { current: currentStep, total: STEP_ITEMS.length },
                      `Step ${currentStep} of ${STEP_ITEMS.length}`
                    )}{' '}
                    - {currentStepMeta.label}
                  </p>
                  <p className="text-gray-500 text-[10px] mt-0.5 hidden sm:block">
                    {lastSaved
                      ? tx('jobs.new.autosave.savedAt', { time: formatTime(lastSaved) }, `Saved at ${formatTime(lastSaved)}`)
                      : tx('jobs.new.autosave.notSaved', undefined, 'Not saved yet')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-gray-300 hover:text-white px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all text-xs font-semibold disabled:opacity-60"
                    >
                      <ArrowLeft className="w-4.5 h-4.5" />
                      {tx('jobs.new.actions.previous', undefined, 'Previous')}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                    className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-gray-300 hover:text-white px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all text-xs font-semibold disabled:opacity-60"
                  >
                    {isSubmitting && submitIntent === 'draft' ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin text-workspace-primary" />
                    ) : (
                      <Save className="w-4.5 h-4.5" />
                    )}
                    {tx('jobs.new.actions.saveDraft', undefined, 'Save draft')}
                  </button>

                  {currentStep < STEP_ITEMS.length ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="bg-workspace-primary hover:bg-workspace-primary-hover text-white px-4 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5 transition-all text-xs disabled:opacity-60 shadow-[0_0_15px_var(--workspace-shadow)]"
                    >
                      {tx('jobs.new.actions.next', undefined, 'Next')}
                      <ChevronRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-workspace-primary hover:bg-workspace-primary-hover text-white px-4 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5 transition-all text-xs disabled:opacity-60 shadow-[0_0_15px_var(--workspace-shadow)]"
                    >
                      {isSubmitting && submitIntent === 'publish' ? (
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      ) : null}
                      {tx('jobs.new.actions.publishJob', undefined, 'Publish job')}
                      <ChevronRight className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </FormProvider>

        {/* Restore Draft Modal */}
        <Modal
          isOpen={showRestoreDraftModal}
          onClose={dismissRestorePrompt}
          title={tx('jobs.new.restoreDraft.title', undefined, 'Restore draft')}
        >
          <div className="space-y-4">
            <p className="text-gray-400 text-xs leading-relaxed">
              {tx(
                'jobs.new.restoreDraft.description',
                { time: draftToRestore ? timeAgo(draftToRestore.timestamp) : '' },
                `We found a saved draft from ${draftToRestore ? timeAgo(draftToRestore.timestamp) : ''}. Do you want to restore and continue?`
              )}
            </p>
            <div
              className="rounded-xl border p-4 text-xs"
              style={{
                borderColor: 'color-mix(in srgb, var(--workspace-primary) 15%, transparent)',
                background: 'color-mix(in srgb, var(--workspace-primary) 5%, var(--card-bg))',
                color: 'var(--text-secondary)',
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>
                {tx('jobs.new.restoreDraft.jobTitle', undefined, 'Title')}:
              </strong>{' '}
              <span className="text-white">
                {draftToRestore?.data.title || tx('jobs.new.restoreDraft.untitled', undefined, '(Untitled)')}
              </span>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-semibold"
              >
                {tx('jobs.new.restoreDraft.startFresh', undefined, 'Start fresh')}
              </button>
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="px-4 py-2 rounded-xl bg-workspace-primary hover:bg-workspace-primary-hover text-xs text-white font-semibold transition-colors"
              >
                {tx('jobs.new.restoreDraft.restore', undefined, 'Restore draft')}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  );
}
