import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useForm, FormProvider, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Clock3, Loader2, Save } from 'lucide-react';
import { Header } from '../components/layout';
import SEO from '../components/common/SEO';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n';
import { getStorageConfigErrorMessage, uploadFile, supabase } from '../lib/supabase';
import { supabaseWithRetry } from '../lib/supabaseWithRetry';
import { useAutosave } from '../hooks/useAutosave';
import { JOB_CATEGORIES } from '../lib/jobCategories';

// Components
import JobWizardLayout from '../components/job-post/JobWizardLayout';
import StepJobBasics from '../components/job-post/StepJobBasics';
import StepBudget from '../components/job-post/StepBudget';
import StepVisibility from '../components/job-post/StepVisibility';
import StepReview from '../components/job-post/StepReview';

const JOB_POST_DEFAULT_VALUES: Partial<JobFormData> = {
    job_type: 'fixed_price',
    visibility: 'public',
    required_skills: [],
    experience_level: 'intermediate',
    subcategory: '',
};

const optionalNumber = (message: string) => z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(1, message).optional()
);

const createFutureDateString = (tx: ReturnType<typeof useTranslation>['tx']) => z.string().min(1, tx('jobs.new.validation.deadlineRequired', undefined, 'Please select a deadline')).refine((value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return date >= startOfToday;
}, tx('jobs.new.validation.deadlineFuture', undefined, 'Deadline must be today or later'));

const createJobSchema = (tx: ReturnType<typeof useTranslation>['tx']) => z.object({
    title: z.string().trim().min(8, tx('jobs.new.validation.titleMin', undefined, 'Title must be at least 8 characters')).max(100),
    category: z.string().min(1, tx('jobs.new.validation.categoryRequired', undefined, 'Please select a category')),
    subcategory: z.string().min(1, tx('jobs.new.validation.subcategoryRequired', undefined, 'Please select a subcategory')),
    description: z.string().trim().min(80, tx('jobs.new.validation.descriptionMin', undefined, 'Description must be at least 80 characters')).max(2000),
    required_skills: z.array(z.any()).min(1, tx('jobs.new.validation.skillsRequired', undefined, 'Please select at least one skill')).max(5),
    attachments_files: z.array(z.instanceof(File))
        .max(5, tx('jobs.new.validation.maxFiles', undefined, 'Maximum 5 files'))
        .optional(),

    job_type: z.enum(['fixed_price', 'hourly']),
    budget_min: optionalNumber(tx('jobs.new.validation.budgetMin', undefined, 'Minimum budget must be at least 1')),
    budget_max: optionalNumber(tx('jobs.new.validation.budgetMax', undefined, 'Maximum budget must be at least 1')),
    hourly_rate: optionalNumber(tx('jobs.new.validation.hourlyRate', undefined, 'Hourly rate must be at least 1')),
    estimated_hours: optionalNumber(tx('jobs.new.validation.estimatedHours', undefined, 'Please enter estimated weekly hours')),
    duration: z.string().min(1, tx('jobs.new.validation.durationRequired', undefined, 'Please select a duration')),
    experience_level: z.enum(['beginner', 'intermediate', 'expert']),
    deadline: createFutureDateString(tx),

    visibility: z.enum(['public', 'invite_only']),
}).refine((data) => {
    if (data.job_type === 'fixed_price') {
        const minValid = typeof data.budget_min === 'number' && !Number.isNaN(data.budget_min) && data.budget_min > 0;
        const maxValid = typeof data.budget_max === 'number' && !Number.isNaN(data.budget_max) && data.budget_max > 0;
        return minValid && maxValid;
    }
    const rateValid = typeof data.hourly_rate === 'number' && !Number.isNaN(data.hourly_rate) && data.hourly_rate > 0;
    const hoursValid = typeof data.estimated_hours === 'number' && !Number.isNaN(data.estimated_hours) && data.estimated_hours > 0;
    return rateValid && hoursValid;
}, {
    message: tx('jobs.new.validation.budgetRequired', undefined, 'Please set a budget'),
    path: ['budget_min'],
}).refine((data) => {
    if (data.job_type !== 'fixed_price') return true;
    if (typeof data.budget_min !== 'number' || typeof data.budget_max !== 'number') return true;
    return data.budget_max >= data.budget_min;
}, {
    message: tx('jobs.new.validation.budgetRange', undefined, 'Maximum budget must be greater than or equal to minimum budget'),
    path: ['budget_max'],
}).refine((data) => {
    const category = JOB_CATEGORIES.find((item) => item.id === data.category);
    return Boolean(category?.subcategories.some((item) => item.id === data.subcategory));
}, {
    message: tx('jobs.new.validation.subcategoryInvalid', undefined, 'Please select a valid subcategory'),
    path: ['subcategory'],
});

type JobFormData = z.infer<ReturnType<typeof createJobSchema>>;

export default function JobPost() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { tx } = useTranslation();
    const navigate = useNavigate();
    const jobSchema = createJobSchema(tx);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitIntent, setSubmitIntent] = useState<'draft' | 'publish' | null>(null);

    // Autosave state
    const [showRestoreDraftModal, setShowRestoreDraftModal] = useState(false);
    const [draftToRestore, setDraftToRestore] = useState<{ data: JobFormData, timestamp: Date } | null>(null);

    const methods = useForm<JobFormData>({
        resolver: zodResolver(jobSchema) as any, // Type assertion to fix resolver compatibility
        defaultValues: JOB_POST_DEFAULT_VALUES,
        mode: 'onChange'
    });

    const formData = methods.watch();

    const { status, lastSaved, loadFromStorage, clearStorage } = useAutosave<JobFormData>({
        data: formData,
        storageKey: 'khedma_job_draft',
        // Optional: onSave callback if needed
    });

    // Check for saved draft on mount
    useEffect(() => {
        // Prevent hydration mismatch or immediate overwrite
        const saved = loadFromStorage();
        if (saved && saved.data && Object.keys(saved.data).length > 0) {
            // Check if draft has meaningful data (e.g. at least a title or category)
            if (saved.data.title || saved.data.category) {
                setDraftToRestore(saved);
                setShowRestoreDraftModal(true);
            }
        }
    }, []);

    const handleRestoreDraft = () => {
        if (draftToRestore) {
            methods.reset(draftToRestore.data);
            showToast(tx('jobs.new.toasts.draftRestored', undefined, 'Draft restored successfully'), 'success');
        }
        setShowRestoreDraftModal(false);
    };

    const handleDiscardDraft = () => {
        clearStorage();
        setShowRestoreDraftModal(false);
    };

    const steps = [
        {
            id: 1,
            title: tx('jobs.new.steps.basics', undefined, 'Job details'),
            description: tx('jobs.new.steps.basicsDescription', undefined, 'Define the brief, category, and required skills clearly.'),
        },
        {
            id: 2,
            title: tx('jobs.new.steps.budget', undefined, 'Budget and timeline'),
            description: tx('jobs.new.steps.budgetDescription', undefined, 'Set pricing model, expected duration, and experience level.'),
        },
        {
            id: 3,
            title: tx('jobs.new.steps.visibility', undefined, 'Visibility'),
            description: tx('jobs.new.steps.visibilityDescription', undefined, 'Choose whether the brief is public or invite-only.'),
        },
        {
            id: 4,
            title: tx('jobs.new.steps.review', undefined, 'Review and publish'),
            description: tx('jobs.new.steps.reviewDescription', undefined, 'Validate the brief before sending it live.'),
        },
    ];
    const currentStepMeta = steps[currentStep - 1];
    const isFinalStep = currentStep === steps.length;

    const focusFirstInvalidField = (fieldNames: Array<keyof JobFormData>) => {
        const errors = methods.formState.errors;
        const firstInvalidField = fieldNames.find((fieldName) => Boolean(errors[fieldName]));

        if (!firstInvalidField) return;

        methods.setFocus(firstInvalidField);

        const escapedName = String(firstInvalidField).replace(/([.[\]])/g, '\\$1');
        const fieldElement = document.querySelector<HTMLElement>(`[name="${escapedName}"]`);
        fieldElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleNext = async () => {
        let fieldsToValidate: Array<keyof JobFormData> = [];
        let isValid = false;
        if (currentStep === 1) {
            fieldsToValidate = ['title', 'category', 'subcategory', 'description', 'required_skills'];
        } else if (currentStep === 2) {
            fieldsToValidate = ['job_type', 'budget_min', 'budget_max', 'hourly_rate', 'estimated_hours', 'duration', 'experience_level', 'deadline'];
        } else if (currentStep === 3) {
            fieldsToValidate = ['visibility'];
        }

        isValid = await methods.trigger(fieldsToValidate);

        if (isValid) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
            return;
        }

        focusFirstInvalidField(fieldsToValidate);
        showToast(tx('jobs.new.errors.stepIncomplete', undefined, 'Please complete the required fields before continuing.'), 'warning');
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const onSubmit: SubmitHandler<JobFormData> = async (data) => {
        setSubmitIntent('publish');
        await submitJob(data, 'open');
    };

    const handleSaveDraft = async () => {
        setSubmitIntent('draft');
        const data = methods.getValues();

        const title = data.title?.trim() || '';
        if (!title) {
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
                title,
                attachments_files: [],
            };

            localStorage.setItem('khedma_job_draft', JSON.stringify({
                data: draftData,
                timestamp: new Date().toISOString(),
            }));

            showToast(tx('jobs.new.toasts.draftSaved', undefined, 'Draft saved successfully'), 'success');
        } catch (error) {
            logger.error('Error saving local draft:', error);
            showToast(tx('jobs.new.errors.saveFailed', undefined, 'Something went wrong while saving the job'), 'error');
        } finally {
            setSubmitIntent(null);
        }
    };

    const submitJob = async (data: JobFormData, status: 'open' | 'draft') => {
        if (!user) {
            showToast(tx('jobs.new.errors.loginRequired', undefined, 'You must be logged in to post a job'), 'error');
            return;
        }

        logger.debug('Job submission started', { userId: user.id, jobType: data.job_type });

        setIsSubmitting(true);
        try {
            // Upload attachments if any
            const uploadedUrls: string[] = [];
            if (data.attachments_files && data.attachments_files.length > 0) {
                let attachmentsSkipped = false;
                let attachmentWarningMessage: string | null = null;
                // ... (Keep existing upload logic)
                // Note: File lists cannot be easily autosaved/restored from localStorage
                // We might need to handle this gracefully or ignore files in autosave
                for (const file of data.attachments_files as File[]) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${user.id}/${fileName}`;

                    try {
                        uploadedUrls.push(await uploadFile('attachments', filePath, file));
                    } catch (uploadError) {
                        attachmentsSkipped = true;
                        attachmentWarningMessage = uploadError instanceof Error && uploadError.message.includes('bucket')
                            ? getStorageConfigErrorMessage('attachments')
                            : tx('jobs.new.errors.attachmentsPartial', { file: file.name }, `Some attachments could not be uploaded (${file.name}). The job will be posted with the files that succeeded.`);
                    }
                }

                if (attachmentsSkipped) {
                    showToast(attachmentWarningMessage || getStorageConfigErrorMessage('attachments'), 'warning');
                }
            }

            // Helper function to safely convert to number or null
            const toNumberOrNull = (value: unknown): number | null => {
                if (value === null || value === undefined || value === '') return null;
                const num = Number(value);
                return isNaN(num) ? null : num;
            };

            // Transform data for DB with proper type conversions
            // Skills are stored as JSONB in required_skills column (not separate table)
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
                // Note: 'draft' is not in job_status_enum, use 'open' for both
                status: 'open' as const,
                required_skills: data.required_skills || [], // JSONB array of skill objects
                // proposals_count and views_count have DB defaults, no need to send
            };

            logger.debug('Job data prepared for DB insert');

            // Use official Supabase client - supabaseWithRetry already has timeout handling
            const { data: insertedJob, error } = await supabaseWithRetry(() =>
                supabase.from('jobs').insert(jobData).select('id').single()
            );

            logger.debug('Supabase insert response received', { error: error?.message });

            if (error) {
                logger.error('Supabase job insert error:', error);
                throw new Error(tx('jobs.new.errors.dbError', { message: error.message, code: error.code }, `DB Error: ${error.message} (Code: ${error.code})`));
            }

            // Skills are already included in jobData as JSONB - no separate table insert needed

            // Clean up autosave
            clearStorage();
            setDraftToRestore(null);
            setShowRestoreDraftModal(false);
            methods.reset(JOB_POST_DEFAULT_VALUES);
            setCurrentStep(1);

            if (status === 'draft') {
                showToast(tx('jobs.new.toasts.draftSaved', undefined, 'Draft saved successfully'), 'success');
            } else {
                await import('./JobPostSuccess');
                showToast(tx('jobs.new.toasts.jobPosted', undefined, 'Job posted successfully!'), 'success');
                navigate(insertedJob?.id ? `/jobs/posted/${insertedJob.id}` : '/jobs', { replace: true });
            }

        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            logger.error('Error posting job:', error);
            showToast(msg || tx('jobs.new.errors.saveFailed', undefined, 'Something went wrong while saving the job'), 'error');
        } finally {
            setIsSubmitting(false);
            setSubmitIntent(null);
        }
    };

    // Helper for relative time (since date-fns is missing)
    const timeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return tx('jobs.new.time.now', undefined, 'Just now');
        if (seconds < 3600) return tx('jobs.new.time.minutesAgo', { count: Math.floor(seconds / 60) }, `${Math.floor(seconds / 60)} min ago`);
        return tx('jobs.new.time.hoursAgo', { count: Math.floor(seconds / 3600) }, `${Math.floor(seconds / 3600)} h ago`);
    };

    return (
        <div className="page-shell pb-20" style={{ background: 'var(--page-bg)' }}>
            <SEO
                title={tx('jobs.new.seo.title', undefined, 'Post a Project')}
                description={tx('jobs.new.seo.description', undefined, 'Create a new project, define budget and timeline, and publish it to receive freelancer proposals.')}
            />
            <Header />

            <main className="page-shell-content">
                <JobWizardLayout
                    currentStep={currentStep}
                    steps={steps}
                    title={tx('jobs.new.heroTitle', undefined, 'Post a project with clarity and attract better-fit freelancers.')}
                    description={tx('jobs.new.heroDescription', undefined, 'Move through the brief in focused phases: define the work, set budget and timing, choose visibility, then review before publishing.')}
                    meta={
                        <>
                            <div className="summary-chip" role="status" aria-live="polite">
                                {status === 'saving' ? (
                                    <>
                                        <Loader2 className="summary-chip-icon animate-spin" />
                                        <span>{tx('jobs.new.autosave.saving', undefined, 'Saving...')}</span>
                                    </>
                                ) : status === 'saved' ? (
                                    <>
                                        <Check className="summary-chip-icon" />
                                        <span>{tx('jobs.new.autosave.saved', undefined, 'Saved')}</span>
                                    </>
                                ) : lastSaved ? (
                                    <>
                                        <Clock3 className="summary-chip-icon" />
                                        <span>{tx('jobs.new.autosave.lastSaved', { time: timeAgo(lastSaved) }, `Last saved: ${timeAgo(lastSaved)}`)}</span>
                                    </>
                                ) : (
                                    <>
                                        <Clock3 className="summary-chip-icon" />
                                        <span>{tx('jobs.new.autosave.ready', undefined, 'Autosave ready')}</span>
                                    </>
                                )}
                            </div>
                            <div className="summary-chip">
                                <Save className="summary-chip-icon" />
                                <span>{tx('jobs.new.wizard.metaDraft', undefined, 'Draft-safe flow')}</span>
                            </div>
                        </>
                    }
                >
                    <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(onSubmit as any)} className="space-y-8">

                            {/* Step Content */}
                            <div className="min-h-[400px]">
                                {currentStep === 1 && <StepJobBasics />}
                                {currentStep === 2 && <StepBudget />}
                                {currentStep === 3 && <StepVisibility />}
                                {currentStep === 4 && <StepReview />}
                            </div>

                            {/* Actions */}
                            <div
                                className="mt-10 rounded-[1.8rem] border p-5 shadow-sm backdrop-blur-sm sm:p-6"
                                style={{
                                    borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, var(--border))',
                                    background: 'linear-gradient(145deg, color-mix(in srgb, var(--card-bg) 96%, white), color-mix(in srgb, var(--surface-bg) 92%, white))',
                                    boxShadow: '0 28px 70px -52px rgba(245,158,11,0.24)',
                                }}
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="min-w-0">
                                        <div
                                            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                                            style={{
                                                borderColor: 'color-mix(in srgb, var(--workspace-primary) 22%, transparent)',
                                                background: 'color-mix(in srgb, var(--workspace-primary) 10%, var(--card-bg))',
                                                color: 'var(--workspace-primary-active)',
                                            }}
                                        >
                                            <span>{tx('jobs.new.stepCounter', { current: currentStep, total: steps.length }, `Step ${currentStep} of ${steps.length}`)}</span>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {currentStepMeta?.title}
                                        </p>
                                        <p className="mt-1 text-xs leading-6" style={{ color: 'var(--text-secondary)' }}>
                                            {isFinalStep
                                                ? tx('jobs.new.actions.publishHint', undefined, 'Review the brief one last time, then publish it live.')
                                                : tx('jobs.new.actions.nextHint', undefined, 'Save a draft if needed, or continue to the next step.')}
                                        </p>
                                    </div>

                                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                                        {currentStep > 1 ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full rounded-2xl sm:w-auto"
                                                onClick={handleBack}
                                                disabled={isSubmitting}
                                                leftIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-180" />}
                                            >
                                                {tx('jobs.new.actions.previous', undefined, 'Previous')}
                                            </Button>
                                        ) : null}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full rounded-2xl sm:w-auto"
                                            isLoading={isSubmitting && submitIntent === 'draft'}
                                            disabled={isSubmitting}
                                            onClick={handleSaveDraft}
                                            leftIcon={isSubmitting && submitIntent === 'draft' ? undefined : <Save className="w-4 h-4" />}
                                        >
                                            {tx('jobs.new.actions.saveDraft', undefined, 'Save draft')}
                                        </Button>

                                        {currentStep < steps.length ? (
                                            <Button
                                                type="button"
                                                variant="primary"
                                                className="w-full rounded-2xl px-6 sm:w-auto"
                                                onClick={handleNext}
                                                disabled={isSubmitting}
                                                rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
                                            >
                                                {tx('jobs.new.actions.next', undefined, 'Next')}
                                            </Button>
                                        ) : (
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                isLoading={isSubmitting && submitIntent === 'publish'}
                                                className="w-full rounded-2xl px-8 sm:w-auto"
                                                rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
                                            >
                                                {tx('jobs.new.actions.publishJob', undefined, 'Publish job')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </form>
                    </FormProvider>
                </JobWizardLayout>
            </main>

            {/* Restore Draft Modal */}
            <Modal
                isOpen={showRestoreDraftModal}
                onClose={() => setShowRestoreDraftModal(false)}
                title={tx('jobs.new.restoreDraft.title', undefined, 'Restore draft')}
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        {tx('jobs.new.restoreDraft.description', { time: draftToRestore ? timeAgo(draftToRestore.timestamp) : '' }, `We found a saved draft from ${draftToRestore ? timeAgo(draftToRestore.timestamp) : ''}. Do you want to restore and continue?`)}
                    </p>
                    <div
                        className="rounded-lg border p-3 text-sm"
                        style={{
                            borderColor: 'color-mix(in srgb, var(--workspace-primary) 20%, transparent)',
                            background: 'color-mix(in srgb, var(--workspace-primary) 10%, var(--card-bg))',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        <strong style={{ color: 'var(--text-primary)' }}>{tx('jobs.new.restoreDraft.jobTitle', undefined, 'Title')}:</strong>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>
                            {draftToRestore?.data.title || tx('jobs.new.restoreDraft.untitled', undefined, '(Untitled)')}
                        </span>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={handleDiscardDraft}>
                            {tx('jobs.new.restoreDraft.startFresh', undefined, 'Start fresh')}
                        </Button>
                        <Button variant="primary" onClick={handleRestoreDraft}>
                            {tx('jobs.new.restoreDraft.restore', undefined, 'Restore draft')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

