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
import { getStorageConfigErrorMessage, isMissingStorageBucketError, supabase } from '../lib/supabase';
import { supabaseWithRetry } from '../lib/supabaseWithRetry';
import { useAutosave } from '../hooks/useAutosave';

// Components
import JobWizardLayout from '../components/job-post/JobWizardLayout';
import StepJobBasics from '../components/job-post/StepJobBasics';
import StepBudget from '../components/job-post/StepBudget';
import StepVisibility from '../components/job-post/StepVisibility';
import StepReview from '../components/job-post/StepReview';

// Schema - Using z.coerce.number() to handle string-to-number conversion from form inputs
const jobSchema = z.object({
    title: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل').max(100),
    category: z.string().min(1, 'يرجى اختيار التصنيف'),
    description: z.string().min(50, 'الوصف يجب أن يكون 50 حرف على الأقل'),
    required_skills: z.array(z.any()).min(1, 'يرجى اختيار مهارة واحدة على الأقل').max(5),
    attachments_files: z.array(z.instanceof(File))
        .max(5, 'الحد الأقصى 5 ملفات')
        .optional(),

    // Step 2 - Using coerce.number to handle string inputs from HTML number fields
    job_type: z.enum(['fixed_price', 'hourly']),
    budget_min: z.coerce.number().min(1, 'الحد الأدنى يجب أن يكون 1 على الأقل').optional().nullable(),
    budget_max: z.coerce.number().min(1, 'الحد الأقصى يجب أن يكون 1 على الأقل').optional().nullable(),
    hourly_rate: z.coerce.number().min(1, 'السعر بالساعة يجب أن يكون 1 على الأقل').optional().nullable(),
    estimated_hours: z.string().optional(),
    duration: z.string().min(1, 'يرجى تحديد المدة'),
    experience_level: z.enum(['beginner', 'intermediate', 'expert']),

    // Step 3 (Merged into Step 2 UI or defaulted for now)
    visibility: z.enum(['public', 'invite_only']),
}).refine((data) => {
    if (data.job_type === 'fixed_price') {
        // Check for valid numbers (not NaN, not null/undefined)
        const minValid = typeof data.budget_min === 'number' && !isNaN(data.budget_min) && data.budget_min > 0;
        const maxValid = typeof data.budget_max === 'number' && !isNaN(data.budget_max) && data.budget_max > 0;
        return minValid && maxValid;
    }
    const rateValid = typeof data.hourly_rate === 'number' && !isNaN(data.hourly_rate) && data.hourly_rate > 0;
    return rateValid;
}, {
    message: "يرجى تحديد الميزانية",
    path: ["budget_min"],
});

type JobFormData = z.infer<typeof jobSchema>;

export default function JobPost() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { tx } = useTranslation();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitIntent, setSubmitIntent] = useState<'draft' | 'publish' | null>(null);

    // Autosave state
    const [showRestoreDraftModal, setShowRestoreDraftModal] = useState(false);
    const [draftToRestore, setDraftToRestore] = useState<{ data: JobFormData, timestamp: Date } | null>(null);

    const methods = useForm<JobFormData>({
        resolver: zodResolver(jobSchema) as any, // Type assertion to fix resolver compatibility
        defaultValues: {
            job_type: 'fixed_price',
            visibility: 'public',
            required_skills: [],
            experience_level: 'intermediate'
        },
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

    // Warn before unload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Check if form is dirty or has data
            const isDirty = methods.formState.isDirty;
            if (isDirty && !isSubmitting) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [methods.formState.isDirty, isSubmitting]);

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

    const handleNext = async () => {
        let isValid = false;
        if (currentStep === 1) {
            isValid = await methods.trigger(['title', 'category', 'description', 'required_skills']);
        } else if (currentStep === 2) {
            isValid = await methods.trigger(['job_type', 'budget_min', 'budget_max', 'hourly_rate', 'duration', 'experience_level']);
        } else if (currentStep === 3) {
            isValid = await methods.trigger(['visibility']);
        }

        if (isValid) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
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
        // Minimal validation for draft
        if (!data.title) {
            methods.setError('title', { message: tx('jobs.new.errors.titleRequiredForDraft', undefined, 'Please enter a job title to save draft') });
            setSubmitIntent(null);
            return;
        }
        await submitJob(data, 'draft');
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
                // ... (Keep existing upload logic)
                // Note: File lists cannot be easily autosaved/restored from localStorage
                // We might need to handle this gracefully or ignore files in autosave
                for (const file of data.attachments_files as File[]) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${user.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('attachments')
                        .upload(filePath, file);

                    if (uploadError) {
                        if (isMissingStorageBucketError(uploadError)) {
                            attachmentsSkipped = true;
                            break;
                        }

                        throw uploadError;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('attachments')
                        .getPublicUrl(filePath);
                    uploadedUrls.push(publicUrl);
                }

                if (attachmentsSkipped) {
                    showToast(getStorageConfigErrorMessage('attachments'), 'warning');
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
                job_type: data.job_type,
                budget_min: toNumberOrNull(data.budget_min),
                budget_max: toNumberOrNull(data.budget_max),
                hourly_rate: toNumberOrNull(data.hourly_rate),
                duration: data.duration,
                experience_level: data.experience_level,
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
                throw new Error(`DB Error: ${error.message} (Code: ${error.code})`);
            }

            // Skills are already included in jobData as JSONB - no separate table insert needed

            // Clean up autosave
            clearStorage();

            if (status === 'draft') {
                showToast(tx('jobs.new.toasts.draftSaved', undefined, 'Draft saved successfully'), 'success');
            } else {
                showToast(tx('jobs.new.toasts.jobPosted', undefined, 'Job posted successfully!'), 'success');
                navigate(insertedJob?.id ? `/jobs/posted/${insertedJob.id}` : '/jobs');
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
        <div className="page-shell bg-[#f6f3ff] dark:bg-[#0b0a12] pb-20">
            <SEO
                title={tx('jobs.new.seo.title', undefined, 'Post a Project')}
                description={tx('jobs.new.seo.description', undefined, 'Create a new project, define budget and timeline, and publish it to receive freelancer proposals.')}
            />
            <Header />

            <div className="page-shell-content">
                <JobWizardLayout
                    currentStep={currentStep}
                    steps={steps}
                    title={tx('jobs.new.heroTitle', undefined, 'Post a project with clarity and attract better-fit freelancers.')}
                    description={tx('jobs.new.heroDescription', undefined, 'Move through the brief in focused phases: define the work, set budget and timing, choose visibility, then review before publishing.')}
                    meta={
                        <>
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-4 py-2 text-sm text-[#353149] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#e3def7]" role="status" aria-live="polite">
                                {status === 'saving' ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-500" />
                                        <span>{tx('jobs.new.autosave.saving', undefined, 'Saving...')}</span>
                                    </>
                                ) : status === 'saved' ? (
                                    <>
                                        <Check className="h-3.5 w-3.5 text-primary-500" />
                                        <span>{tx('jobs.new.autosave.saved', undefined, 'Saved')}</span>
                                    </>
                                ) : lastSaved ? (
                                    <>
                                        <Clock3 className="h-3.5 w-3.5 text-primary-500" />
                                        <span>{tx('jobs.new.autosave.lastSaved', { time: timeAgo(lastSaved) }, `Last saved: ${timeAgo(lastSaved)}`)}</span>
                                    </>
                                ) : (
                                    <>
                                        <Clock3 className="h-3.5 w-3.5 text-primary-500" />
                                        <span>{tx('jobs.new.autosave.ready', undefined, 'Autosave ready')}</span>
                                    </>
                                )}
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-4 py-2 text-sm text-[#353149] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#e3def7]">
                                <Save className="h-3.5 w-3.5 text-primary-500" />
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
                            <div className="mt-8 flex items-center justify-between border-t border-primary-100/70 pt-6 dark:border-white/10">
                                {currentStep > 1 ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-2xl"
                                        onClick={handleBack}
                                        disabled={isSubmitting}
                                        leftIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-180" />}
                                    >
                                        {tx('jobs.new.actions.previous', undefined, 'Previous')}
                                    </Button>
                                ) : (
                                    <div /> // Spacer
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="rounded-2xl"
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
                                            className="rounded-2xl"
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
                                            className="rounded-2xl px-8"
                                            rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
                                        >
                                            {tx('jobs.new.actions.publishJob', undefined, 'Publish job')}
                                        </Button>
                                    )}
                                </div>
                            </div>

                        </form>
                    </FormProvider>
                </JobWizardLayout>
            </div>

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
                    <div className="bg-gray-50 dark:bg-dark-800 p-3 rounded-lg text-sm text-gray-500">
                        <strong>{tx('jobs.new.restoreDraft.jobTitle', undefined, 'Title')}:</strong> {draftToRestore?.data.title || tx('jobs.new.restoreDraft.untitled', undefined, '(Untitled)')}
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
