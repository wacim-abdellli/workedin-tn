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
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import SEO from '../components/common/SEO';
import { Header } from '../components/layout';
import StepBudget from '../components/job-post/StepBudget';
import StepReview from '../components/job-post/StepReview';
import StepVisibility from '../components/job-post/StepVisibility';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useAutosave } from '../hooks/useAutosave';
import { useTranslation } from '../i18n';
import { dashboardQueryKeys, invalidateClientDashboardQueries } from '../lib/dashboardQueries';
import { getJobCategories, JOB_CATEGORIES } from '../lib/jobCategories';
import { getStorageConfigErrorMessage, supabase, uploadFile } from '../lib/supabase';
import { supabaseWithRetry } from '../lib/supabaseWithRetry';
import { PREDEFINED_SKILLS, type Skill } from '../types';

const STEP_ITEMS = [
  {
    id: 1,
    label: 'Job details',
    description: 'Define the brief, category, and required skills.',
  },
  {
    id: 2,
    label: 'Budget/Timeline',
    description: 'Set pricing model, expected duration, and experience level.',
  },
  {
    id: 3,
    label: 'Visibility',
    description: 'Choose whether the brief is public or invite-only.',
  },
  {
    id: 4,
    label: 'Review',
    description: 'Validate the brief before publishing.',
  },
] as const;

const DRAFT_PROMPT_DISMISS_KEY = 'workedin_job_restore_dismissed_at';
const DRAFT_PROMPT_COOLDOWN_MS = 2 * 60 * 1000;

const TITLE_TEMPLATES = [
  'Logo design for a food company',
  'Landing page redesign for SaaS product',
  'Short-form video editor for social ads',
  'React dashboard with analytics widgets',
] as const;

const DESCRIPTION_SNIPPETS = [
  'Scope: Build a responsive experience aligned with our brand guidelines.',
  'Deliverables: Source files, deployment-ready build, and concise documentation.',
  'Success criteria: Pixel-perfect UI, strong performance, and clean handoff.',
] as const;

const FIELD_CLASS =
  'bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500/70 text-[var(--text-primary)] p-3.5 w-full outline-none transition-all placeholder:text-[var(--text-muted)]';

const JOB_POST_DEFAULT_VALUES: Partial<JobFormData> = {
  job_type: 'fixed_price',
  visibility: 'public',
  required_skills: [],
  experience_level: 'intermediate',
  subcategory: '',
  attachments_files: [],
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

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function JobPost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { tx, language } = useTranslation();
  const navigate = useNavigate();
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
      { id: 'title', label: 'Clear title', pass: title.trim().length >= 12 },
      { id: 'category', label: 'Category selected', pass: Boolean(selectedCategory && selectedSubcategory) },
      { id: 'description', label: 'Strong description', pass: description.trim().length >= 120 },
      { id: 'skills', label: 'Relevant skills', pass: selectedSkills.length >= 3 },
    ],
    [title, selectedCategory, selectedSubcategory, description, selectedSkills.length]
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
      fieldsToValidate = ['title', 'category', 'subcategory', 'description', 'required_skills'];
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
        let attachmentsSkipped = false;
        let attachmentWarningMessage: string | null = null;

        for (const file of data.attachments_files as File[]) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          try {
            uploadedUrls.push(await uploadFile('attachments', filePath, file));
          } catch (uploadError) {
            attachmentsSkipped = true;
            attachmentWarningMessage =
              uploadError instanceof Error && uploadError.message.includes('bucket')
                ? getStorageConfigErrorMessage('attachments')
                : tx(
                    'jobs.new.errors.attachmentsPartial',
                    { file: file.name },
                    `Some attachments could not be uploaded (${file.name}).`
                  );
          }
        }

        if (attachmentsSkipped) {
          showToast(attachmentWarningMessage || getStorageConfigErrorMessage('attachments'), 'warning');
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
        status: 'open' as const,
        required_skills: data.required_skills || [],
      };

      const { data: insertedJob, error } = await supabaseWithRetry(() =>
        supabase.from('jobs').insert(jobData).select('id').single()
      );

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
    <div className="bg-[#0a0a0a] min-h-screen text-white">
      <SEO
        title={tx('jobs.new.seo.title', undefined, 'Post a Project')}
        description={tx(
          'jobs.new.seo.description',
          undefined,
          'Create a new project, define budget and timeline, and publish it to receive freelancer proposals.'
        )}
      />
      <Header />

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="min-h-screen w-full bg-[#0a0a0a] text-white p-4 md:p-8 flex justify-center pb-24 md:pb-28">
          <div className="max-w-4xl w-full flex flex-col gap-6">
            <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-4 items-start">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold max-w-xl">
                  {tx('jobs.new.heroTitle', undefined, 'Post a project with clarity and attract better-fit freelancers.')}
                </h1>
                <p className="text-gray-400 max-w-2xl">
                  {tx(
                    'jobs.new.heroDescription',
                    undefined,
                    'Move through the brief in focused phases so top talent can quickly understand what you need and respond with accurate proposals.'
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#141414] border border-[#262626] px-3 py-1.5 rounded-full text-xs inline-flex items-center gap-1.5">
                    {autosaveStatus === 'saving' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : autosaveStatus === 'saved' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {autosaveStatus === 'saving'
                      ? tx('jobs.new.autosave.saving', undefined, 'Saving...')
                      : autosaveStatus === 'saved'
                        ? tx('jobs.new.autosave.saved', undefined, 'Saved')
                        : lastSaved
                        ? tx('jobs.new.autosave.lastSaved', { time: timeAgo(lastSaved) }, `Last saved: ${timeAgo(lastSaved)}`)
                        : tx('jobs.new.autosave.ready', undefined, 'Autosave ready')}
                  </span>
                  <span className="bg-[#141414] border border-[#262626] px-3 py-1.5 rounded-full text-xs inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {tx('jobs.new.wizard.metaDraft', undefined, 'Draft-safe flow')}
                  </span>
                </div>
              </div>

              <aside className="bg-[#141414] border border-[#262626] rounded-2xl p-5 w-full lg:w-72">
                <p className="text-orange-400 text-xs font-semibold tracking-wide">
                  {tx('jobs.new.currentPhase', undefined, 'CURRENT PHASE')}
                </p>
                <h2 className="text-white text-lg font-semibold mt-1">{currentStepMeta.label}</h2>
                <p className="text-gray-400 text-sm mt-1">{currentStepMeta.description}</p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{tx('jobs.new.progress', undefined, 'Progress')}</span>
                    <span className="text-white">{progress}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#262626] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: progress }} />
                  </div>
                </div>

                <p className="text-gray-400 text-xs mt-3">
                  {tx('jobs.new.stepCounter', { current: currentStep, total: STEP_ITEMS.length }, `Step ${currentStep} of ${STEP_ITEMS.length}`)}
                </p>
              </aside>
            </section>

            <section className="bg-[#141414] border border-[#262626] rounded-2xl p-2">
              <ol className="flex items-center justify-between gap-2 overflow-x-auto">
                {STEP_ITEMS.map((step, index) => {
                  const isCompleted = step.id < currentStep;
                  const isActive = step.id === currentStep;

                  return (
                    <li key={step.id} className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl">
                        <span
                          className={`w-7 h-7 rounded-full text-xs font-semibold inline-flex items-center justify-center ${
                            isActive || isCompleted
                              ? 'bg-orange-500 text-white'
                              : 'bg-[#262626] text-gray-400'
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                        </span>
                        <span
                          className={`${
                            isActive ? 'text-white' : 'text-gray-500'
                          } text-sm font-medium`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < STEP_ITEMS.length - 1 ? (
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </section>

            {currentStep === 1 ? (
              <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6 md:p-8 flex flex-col gap-8">
                <header>
                  <h2 className="text-xl font-bold">{tx('jobs.new.steps.basics', undefined, 'Job details')}</h2>
                  <p className="text-gray-400 mt-1">
                    {tx('jobs.new.step1.subtitle', undefined, 'Start with a clear title and strong context.')}
                  </p>
                </header>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {tx('jobs.new.fields.title', undefined, 'Project title')}
                  </label>
                  <input
                    type="text"
                    {...methods.register('title')}
                    name="title"
                    placeholder={tx(
                      'jobs.new.fields.titlePlaceholder',
                      undefined,
                      'Example: Logo design for a food company'
                    )}
                    className={FIELD_CLASS}
                  />
                  {methods.formState.errors.title ? (
                    <p className="text-red-400 text-xs">{methods.formState.errors.title.message as string}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {TITLE_TEMPLATES.map((template) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() => applyTitleTemplate(template)}
                        className="text-xs px-2.5 py-1 rounded-full border border-[#2b2b2b] text-gray-300 hover:text-white hover:border-orange-500/60 transition-colors"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs tracking-wide text-gray-400 uppercase">
                      {tx('jobs.new.fields.mainCategory', undefined, 'Main category')}
                    </label>
                    <select
                      name="category"
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
                      className={FIELD_CLASS}
                    >
                      <option value="">
                        {tx('jobs.new.fields.selectCategory', undefined, 'Select category')}
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {methods.formState.errors.category ? (
                      <p className="text-red-400 text-xs">{methods.formState.errors.category.message as string}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs tracking-wide text-gray-400 uppercase">
                      {tx('jobs.new.fields.subcategory', undefined, 'Subcategory')}
                    </label>
                    <select
                      name="subcategory"
                      value={selectedSubcategory}
                      onChange={(event) => {
                        methods.setValue('subcategory', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      disabled={!selectedCategory}
                      className={`${FIELD_CLASS} disabled:opacity-50`}
                    >
                      <option value="">
                        {tx('jobs.new.fields.selectSubcategory', undefined, 'Select subcategory')}
                      </option>
                      {availableSubcategories.map((subcategory) => (
                        <option
                          key={subcategory.id}
                          value={subcategory.id}
                          className="bg-[#0a0a0a] text-white"
                        >
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                    {methods.formState.errors.subcategory ? (
                      <p className="text-red-400 text-xs">
                        {methods.formState.errors.subcategory.message as string}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs tracking-wide text-gray-400 uppercase">
                    {tx('jobs.new.fields.description', undefined, 'Project description')}
                  </label>
                  <textarea
                    rows={6}
                    maxLength={2000}
                    {...methods.register('description')}
                    name="description"
                    placeholder={tx(
                      'jobs.new.fields.descriptionPlaceholder',
                      undefined,
                      'Describe project details...'
                    )}
                    className={`${FIELD_CLASS} resize-y`}
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{description.length} / 2000 characters</span>
                    {methods.formState.errors.description ? (
                      <span className="text-red-400 text-xs">
                        {methods.formState.errors.description.message as string}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {DESCRIPTION_SNIPPETS.map((snippet) => (
                      <button
                        key={snippet}
                        type="button"
                        onClick={() => addDescriptionSnippet(snippet)}
                        className="text-xs px-2.5 py-1 rounded-full border border-[#2b2b2b] text-gray-300 hover:text-white hover:border-orange-500/60 transition-colors"
                      >
                        + template
                      </button>
                    ))}
                  </div>

                  <div className="bg-orange-500/5 text-orange-400 border border-orange-500/20 rounded-xl p-4 flex gap-3">
                    <Lightbulb className="w-5 h-5 mt-0.5 shrink-0" />
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li className="inline-flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-orange-400" />
                        {tx(
                          'jobs.new.tips.scope',
                          undefined,
                          'Be specific about scope and expected quality.'
                        )}
                      </li>
                      <li className="inline-flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-orange-400" />
                        {tx(
                          'jobs.new.tips.success',
                          undefined,
                          'Clearly define what success looks like.'
                        )}
                      </li>
                      <li className="inline-flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-orange-400" />
                        {tx(
                          'jobs.new.tips.references',
                          undefined,
                          'Add links, references, or examples if available.'
                        )}
                      </li>
                      <li className="inline-flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-orange-400" />
                        {tx(
                          'jobs.new.tips.handoff',
                          undefined,
                          'Clarify what should be delivered at handoff.'
                        )}
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3" data-field="required_skills">
                  <label className="text-sm font-medium">
                    {tx('jobs.new.fields.requiredSkills', undefined, 'Required skills (max 5)')}
                  </label>

                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={skillQuery}
                      onChange={(event) => setSkillQuery(event.target.value)}
                      placeholder={tx(
                        'jobs.new.fields.skillsPlaceholder',
                        undefined,
                        'Search for skills...'
                      )}
                      className={`${FIELD_CLASS} pl-10`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
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
                          className="flex items-center gap-2 bg-[#262626] text-white px-3 py-1.5 rounded-full text-sm"
                        >
                          {label}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill.id)}
                            className="text-gray-400 hover:text-white transition-colors"
                            aria-label={`Remove ${label}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-gray-400">{tx('jobs.new.fields.suggested', undefined, 'Suggested:')}</span>
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
                          className="border border-[#262626] text-gray-400 px-3 py-1 rounded-full hover:border-orange-500 hover:text-orange-500 cursor-pointer transition-all"
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-[#2b2b2b] bg-[#111111] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase tracking-wide text-gray-400">{tx('jobs.new.quality.title', undefined, 'Quality Score')}</p>
                      <p className="text-sm font-semibold text-white">{qualityScore}%</p>
                    </div>
                    <div className="h-2 rounded-full bg-[#262626] overflow-hidden mb-3">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${qualityScore}%`,
                          background: qualityScore >= 75 ? '#22c55e' : qualityScore >= 50 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {qualityChecks.map((check) => (
                        <div key={check.id} className="inline-flex items-center gap-2 text-xs">
                          <span className={`inline-flex w-4 h-4 items-center justify-center rounded-full ${check.pass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#262626] text-gray-500'}`}>
                            {check.pass ? <Check className="w-3 h-3" /> : <span>•</span>}
                          </span>
                          <span className={check.pass ? 'text-gray-200' : 'text-gray-500'}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {methods.formState.errors.required_skills ? (
                    <p className="text-red-400 text-xs">
                      {methods.formState.errors.required_skills.message as string}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3" data-field="attachments_files">
                  <label className="text-sm font-medium">
                    {tx('jobs.new.fields.attachments', undefined, 'Attachments (optional)')}
                  </label>

                  <label
                    htmlFor="attachments"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed bg-[#0a0a0a] rounded-2xl py-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-orange-500/50'
                        : 'border-[#262626] hover:border-orange-500/50'
                    }`}
                  >
                    <UploadCloud className="size-10 text-gray-500" />
                    <p className="text-white font-medium">
                      {tx('jobs.new.fields.attachmentsDrop', undefined, 'Drag files here or click to browse')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tx(
                        'jobs.new.fields.attachmentsHint',
                        undefined,
                        'PDF, DOC, DOCX, TXT, PNG, JPG, WEBP - Max 10MB per file'
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-[#262626] text-white px-4 py-2 rounded-lg text-sm mt-2"
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

                  {attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={`${file.name}-${file.size}-${index}`}
                          className="bg-[#0a0a0a] border border-[#262626] rounded-xl px-3 py-2.5 flex items-center justify-between"
                        >
                          <span className="text-sm text-white truncate">{file.name}</span>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-white transition-colors"
                            onClick={() => removeAttachment(index)}
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {methods.formState.errors.attachments_files ? (
                    <p className="text-red-400 text-xs">
                      {methods.formState.errors.attachments_files.message as string}
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {currentStep === 2 ? (
              <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6 md:p-8">
                <StepBudget />
              </section>
            ) : null}

            {currentStep === 3 ? (
              <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6 md:p-8">
                <StepVisibility />
              </section>
            ) : null}

            {currentStep === 4 ? (
              <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6 md:p-8">
                <StepReview />
              </section>
            ) : null}
          </div>

          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] md:w-[calc(100%-3rem)] md:max-w-4xl">
            <div className="bg-[#141414]/95 backdrop-blur-md border border-[#262626] rounded-2xl px-3 py-3 md:px-4 md:py-3 flex items-center justify-between gap-3 shadow-[0_20px_45px_-30px_rgba(0,0,0,0.9)]">
              <div className="min-w-0">
                <p className="text-gray-400 text-xs">
                  {tx(
                    'jobs.new.stepCounter',
                    { current: currentStep, total: STEP_ITEMS.length },
                    `Step ${currentStep} of ${STEP_ITEMS.length}`
                  )}{' '}
                  • {currentStepMeta.label}
                </p>
                <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">
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
                    className="border border-[#262626] text-gray-300 hover:text-white px-3.5 py-2 rounded-xl inline-flex items-center gap-2 transition-colors text-sm disabled:opacity-60"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {tx('jobs.new.actions.previous', undefined, 'Previous')}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="border border-[#262626] text-gray-300 hover:text-white px-3.5 py-2 rounded-xl inline-flex items-center gap-2 transition-colors text-sm disabled:opacity-60"
                >
                  {isSubmitting && submitIntent === 'draft' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {tx('jobs.new.actions.saveDraft', undefined, 'Save draft')}
                </button>

                {currentStep < STEP_ITEMS.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium inline-flex items-center gap-2 transition-colors text-sm disabled:opacity-60"
                  >
                    {tx('jobs.new.actions.next', undefined, 'Next')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium inline-flex items-center gap-2 transition-colors text-sm disabled:opacity-60"
                  >
                    {isSubmitting && submitIntent === 'publish' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    {tx('jobs.new.actions.publishJob', undefined, 'Publish job')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </FormProvider>

      <Modal
        isOpen={showRestoreDraftModal}
        onClose={dismissRestorePrompt}
        title={tx('jobs.new.restoreDraft.title', undefined, 'Restore draft')}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {tx(
              'jobs.new.restoreDraft.description',
              { time: draftToRestore ? timeAgo(draftToRestore.timestamp) : '' },
              `We found a saved draft from ${draftToRestore ? timeAgo(draftToRestore.timestamp) : ''}. Do you want to restore and continue?`
            )}
          </p>
          <div
            className="rounded-lg border p-3 text-sm"
            style={{
              borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, transparent)',
              background: 'color-mix(in srgb, var(--workspace-primary) 10%, var(--card-bg))',
              color: 'var(--text-secondary)',
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>
              {tx('jobs.new.restoreDraft.jobTitle', undefined, 'Title')}:
            </strong>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              {draftToRestore?.data.title || tx('jobs.new.restoreDraft.untitled', undefined, '(Untitled)')}
            </span>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-4 py-2 rounded-xl border border-[#262626] text-sm text-gray-300 hover:text-white"
            >
              {tx('jobs.new.restoreDraft.startFresh', undefined, 'Start fresh')}
            </button>
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-sm text-white"
            >
              {tx('jobs.new.restoreDraft.restore', undefined, 'Restore draft')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
