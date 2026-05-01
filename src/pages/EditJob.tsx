import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';
import { getStorageConfigErrorMessage, supabase, uploadFile } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import SEO from '@/components/common/SEO';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { FileX } from 'lucide-react';
import JobWizardLayout from '@/components/job-post/JobWizardLayout';
import StepJobBasics from '@/components/job-post/StepJobBasics';
import StepBudget from '@/components/job-post/StepBudget';
import StepVisibility from '@/components/job-post/StepVisibility';
import StepReview from '@/components/job-post/StepReview';
import { JOB_CATEGORIES } from '@/lib/jobCategories';
import { PREDEFINED_SKILLS, type Skill } from '@/types';
import {
  isMissingJobReferenceLinksColumnError,
  MAX_JOB_REFERENCE_LINKS,
  sanitizeJobReferenceLinks,
} from '@/lib/jobLinks';

interface JobData {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  job_type: 'fixed_price' | 'hourly';
  budget_min: number | null;
  budget_max: number | null;
  hourly_rate: number | null;
  duration: string;
  experience_level: string;
  required_skills: unknown[];
  attachments?: string[];
  reference_links?: string[];
  visibility: string;
  deadline: string;
  status: string;
}

const optionalNumber = (message: string) => z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number().min(1, message).optional()
);

type DurationValue = 'less_than_1_month' | '1_3_months' | '3_6_months' | 'more_than_6_months';

const DURATION_ALIASES: Record<string, DurationValue> = {
  less_than_1_month: 'less_than_1_month',
  less_than_one_month: 'less_than_1_month',
  '1_3_months': '1_3_months',
  one_to_three_months: '1_3_months',
  '3_6_months': '3_6_months',
  three_to_six_months: '3_6_months',
  more_than_6_months: 'more_than_6_months',
  more_than_six_months: 'more_than_6_months',
};

const skillLookup = (() => {
  const lookup = new Map<string, Skill>();
  for (const skill of PREDEFINED_SKILLS) {
    lookup.set(skill.id.trim().toLowerCase(), skill);
    lookup.set(skill.name_en.trim().toLowerCase(), skill);
    lookup.set(skill.name_fr.trim().toLowerCase(), skill);
    lookup.set(skill.name_ar.trim().toLowerCase(), skill);
  }
  return lookup;
})();

function normalizeDateForInput(rawValue: unknown): string {
  if (typeof rawValue !== 'string') return '';

  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  const exactDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (exactDate?.[1]) {
    return exactDate[1];
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return '';
}

function normalizeDuration(rawValue: unknown): DurationValue | '' {
  if (typeof rawValue !== 'string') return '';
  const normalized = rawValue.trim().toLowerCase();
  return DURATION_ALIASES[normalized] || '';
}

function normalizeVisibility(rawValue: unknown): 'public' | 'invite_only' {
  if (typeof rawValue !== 'string') return 'public';
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === 'invite_only' || normalized === 'private') return 'invite_only';
  return 'public';
}

function buildFallbackSkill(label: string, index: number): Skill {
  const trimmed = label.trim();
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const fallbackId = slug ? `legacy-${slug}` : `legacy-skill-${index}`;

  return {
    id: fallbackId,
    name_en: trimmed,
    name_fr: trimmed,
    name_ar: trimmed,
  };
}

function normalizeRequiredSkills(rawSkills: unknown): Skill[] {
  if (!Array.isArray(rawSkills)) return [];

  const normalizedSkills: Skill[] = [];
  const seenIds = new Set<string>();

  rawSkills.forEach((rawSkill, index) => {
    let candidate: Skill | null = null;
    let fallbackLabel = '';

    if (typeof rawSkill === 'string') {
      const key = rawSkill.trim().toLowerCase();
      candidate = skillLookup.get(key) || null;
      fallbackLabel = rawSkill;
    } else if (rawSkill && typeof rawSkill === 'object') {
      const maybeSkill = rawSkill as Partial<Skill> & { name?: unknown };

      const potentialKeys = [
        typeof maybeSkill.id === 'string' ? maybeSkill.id : '',
        typeof maybeSkill.name === 'string' ? maybeSkill.name : '',
        typeof maybeSkill.name_en === 'string' ? maybeSkill.name_en : '',
        typeof maybeSkill.name_fr === 'string' ? maybeSkill.name_fr : '',
        typeof maybeSkill.name_ar === 'string' ? maybeSkill.name_ar : '',
      ]
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

      for (const key of potentialKeys) {
        const mapped = skillLookup.get(key);
        if (mapped) {
          candidate = mapped;
          break;
        }
      }

      if (!candidate && typeof maybeSkill.id === 'string' && maybeSkill.id.trim()) {
        const resolvedName =
          (typeof maybeSkill.name_en === 'string' && maybeSkill.name_en.trim())
          || (typeof maybeSkill.name_fr === 'string' && maybeSkill.name_fr.trim())
          || (typeof maybeSkill.name_ar === 'string' && maybeSkill.name_ar.trim())
          || maybeSkill.id.trim();

        candidate = {
          id: maybeSkill.id.trim(),
          name_en: resolvedName,
          name_fr: typeof maybeSkill.name_fr === 'string' && maybeSkill.name_fr.trim() ? maybeSkill.name_fr.trim() : resolvedName,
          name_ar: typeof maybeSkill.name_ar === 'string' && maybeSkill.name_ar.trim() ? maybeSkill.name_ar.trim() : resolvedName,
        };
      }

      fallbackLabel =
        (typeof maybeSkill.name_en === 'string' && maybeSkill.name_en)
        || (typeof maybeSkill.name_fr === 'string' && maybeSkill.name_fr)
        || (typeof maybeSkill.name_ar === 'string' && maybeSkill.name_ar)
        || (typeof maybeSkill.name === 'string' && maybeSkill.name)
        || (typeof maybeSkill.id === 'string' && maybeSkill.id)
        || '';
    }

    if (!candidate && fallbackLabel.trim()) {
      candidate = buildFallbackSkill(fallbackLabel, index + 1);
    }

    if (!candidate) return;

    const dedupeId = candidate.id.trim().toLowerCase();
    if (!dedupeId || seenIds.has(dedupeId)) return;

    seenIds.add(dedupeId);
    normalizedSkills.push(candidate);
  });

  return normalizedSkills;
}

export default function EditJob() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const { tx } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Create edit schema (deadline can be in the past for existing jobs)
  const editJobSchema = z.object({
    title: z.string().trim().min(8, tx('jobs.new.validation.titleMin', undefined, 'Title must be at least 8 characters')).max(100),
    category: z.string().min(1, tx('jobs.new.validation.categoryRequired', undefined, 'Please select a category')),
    subcategory: z.string().min(1, tx('jobs.new.validation.subcategoryRequired', undefined, 'Please select a subcategory')),
    description: z.string().trim().min(80, tx('jobs.new.validation.descriptionMin', undefined, 'Description must be at least 80 characters')).max(2000),
    required_skills: z.array(z.any()).min(1, tx('jobs.new.validation.skillsRequired', undefined, 'Please select at least one skill')).max(5),
    existing_attachments: z.array(z.string().trim()).optional(),
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
    attachments_files: z.array(z.instanceof(File)).max(5).optional(),
    job_type: z.enum(['fixed_price', 'hourly']),
    budget_min: optionalNumber(tx('jobs.new.validation.budgetMin', undefined, 'Minimum budget must be at least 1')),
    budget_max: optionalNumber(tx('jobs.new.validation.budgetMax', undefined, 'Maximum budget must be at least 1')),
    hourly_rate: optionalNumber(tx('jobs.new.validation.hourlyRate', undefined, 'Hourly rate must be at least 1')),
    estimated_hours: optionalNumber(tx('jobs.new.validation.estimatedHours', undefined, 'Please enter estimated weekly hours')).optional(),
    duration: z.string().min(1, tx('jobs.new.validation.durationRequired', undefined, 'Please select a duration')),
    experience_level: z.enum(['beginner', 'intermediate', 'expert']),
    deadline: z.string().min(1, tx('jobs.new.validation.deadlineRequired', undefined, 'Please select a deadline')),
    visibility: z.enum(['public', 'invite_only']),
  }).refine((data) => {
    if (data.job_type === 'fixed_price') {
      const minValid = typeof data.budget_min === 'number' && !Number.isNaN(data.budget_min) && data.budget_min > 0;
      const maxValid = typeof data.budget_max === 'number' && !Number.isNaN(data.budget_max) && data.budget_max > 0;
      return minValid && maxValid;
    }
    const rateValid = typeof data.hourly_rate === 'number' && !Number.isNaN(data.hourly_rate) && data.hourly_rate > 0;
    return rateValid;
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

  type EditJobFormData = z.infer<typeof editJobSchema>;

  const methods = useForm<EditJobFormData>({
    resolver: zodResolver(editJobSchema) as any,
    defaultValues: {
      job_type: 'fixed_price',
      visibility: 'public',
      required_skills: [],
      existing_attachments: [],
      reference_links: [],
      experience_level: 'intermediate',
      subcategory: '',
    },
    mode: 'onChange',
  });

  // Fetch job data
  const { data: job, isLoading, error } = useQuery<JobData | null>({
    queryKey: ['job-edit', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId!)
        .single();
      if (error) throw error;
      return data as JobData;
    },
    enabled: !!jobId,
  });

  // Populate form when job data loads
  useEffect(() => {
    if (job) {
      methods.reset({
        title: job.title || '',
        category: job.category || '',
        subcategory: job.subcategory || '',
        description: job.description || '',
        required_skills: normalizeRequiredSkills(job.required_skills),
        existing_attachments: Array.isArray(job.attachments)
          ? job.attachments.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          : [],
        reference_links: sanitizeJobReferenceLinks(job.reference_links || [], MAX_JOB_REFERENCE_LINKS),
        job_type: job.job_type || 'fixed_price',
        budget_min: job.budget_min ?? undefined,
        budget_max: job.budget_max ?? undefined,
        hourly_rate: job.hourly_rate ?? undefined,
        duration: normalizeDuration(job.duration),
        experience_level: (job.experience_level as 'beginner' | 'intermediate' | 'expert') || 'intermediate',
        deadline: normalizeDateForInput(job.deadline),
        visibility: normalizeVisibility(job.visibility),
        attachments_files: [],
      });
    }
  }, [job, methods]);

  // Check ownership
  const isOwner = job && user && job.client_id === user.id;

  // Redirect if not owner
  useEffect(() => {
    if (job && user && !isOwner) {
      showToast(tx('editJob.notOwner', undefined, 'You can only edit your own jobs'), 'error');
      navigate(`/jobs/${jobId}`, { replace: true });
    }
  }, [job, user, isOwner, jobId, navigate, showToast, tx]);

  // Redirect if job is not editable
  useEffect(() => {
    if (job && job.status !== 'open') {
      showToast(tx('editJob.notEditable', undefined, 'Only open jobs can be edited'), 'warning');
      navigate(`/jobs/${jobId}`, { replace: true });
    }
  }, [job, jobId, navigate, showToast, tx]);

  const steps = [
    { id: 1, title: tx('jobs.new.steps.basics', undefined, 'Job details'), description: tx('jobs.new.steps.basicsDescription', undefined, 'Define the brief, category, and required skills clearly.') },
    { id: 2, title: tx('jobs.new.steps.budget', undefined, 'Budget and timeline'), description: tx('jobs.new.steps.budgetDescription', undefined, 'Set pricing model, expected duration, and experience level.') },
    { id: 3, title: tx('jobs.new.steps.visibility', undefined, 'Visibility'), description: tx('jobs.new.steps.visibilityDescription', undefined, 'Choose whether the brief is public or invite-only.') },
    { id: 4, title: tx('jobs.new.steps.review', undefined, 'Review and save'), description: tx('editJob.steps.reviewDescription', undefined, 'Validate the changes before saving.') },
  ];

  const focusFirstInvalidField = (fieldNames: Array<keyof EditJobFormData>) => {
    const errors = methods.formState.errors;
    const firstInvalidField = fieldNames.find((fieldName) => Boolean(errors[fieldName]));
    if (!firstInvalidField) return;
    methods.setFocus(firstInvalidField);
    const escapedName = String(firstInvalidField).replace(/([.[\]])/g, '\\$1');
    const fieldElement = document.querySelector<HTMLElement>(`[name="${escapedName}"]`);
    fieldElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleNext = async () => {
    let fieldsToValidate: Array<keyof EditJobFormData> = [];
    if (currentStep === 1) {
      fieldsToValidate = ['title', 'category', 'subcategory', 'description', 'required_skills', 'reference_links'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['job_type', 'budget_min', 'budget_max', 'hourly_rate', 'duration', 'experience_level', 'deadline'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['visibility'];
    }

    const isValid = await methods.trigger(fieldsToValidate);
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

  const onSubmit = async (data: EditJobFormData) => {
    if (!user || !jobId) return;
    setIsSubmitting(true);

    const toNumberOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    try {
      const existingAttachments = Array.isArray(data.existing_attachments)
        ? data.existing_attachments.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];

      const uploadedUrls: string[] = [];

      if (data.attachments_files && data.attachments_files.length > 0) {
        let hasStorageConfigError = false;
        const failedFiles: string[] = [];

        for (const [index, file] of data.attachments_files.entries()) {
          const fileExtRaw = file.name.split('.').pop() || 'bin';
          const fileExt = fileExtRaw.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
          const fileName = `attach-${index + 1}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          try {
            uploadedUrls.push(await uploadFile('attachments', filePath, file));
          } catch (uploadError) {
            failedFiles.push(file.name);
            if (uploadError instanceof Error && uploadError.message.toLowerCase().includes('bucket')) {
              hasStorageConfigError = true;
            }
          }
        }

        if (failedFiles.length > 0 && uploadedUrls.length === 0) {
          const allFailedMessage = hasStorageConfigError
            ? getStorageConfigErrorMessage('attachments')
            : tx(
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

      const attachments = Array.from(new Set([...existingAttachments, ...uploadedUrls]));

      const updatePayload = {
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
        attachments,
        reference_links: sanitizeJobReferenceLinks(data.reference_links || [], MAX_JOB_REFERENCE_LINKS),
        required_skills: data.required_skills || [],
        updated_at: new Date().toISOString(),
      };

      let updateResult = await supabase.from('jobs').update(updatePayload).eq('id', jobId);

      if (updateResult.error && isMissingJobReferenceLinksColumnError(updateResult.error)) {
        const { reference_links, ...legacyPayload } = updatePayload;
        updateResult = await supabase.from('jobs').update(legacyPayload).eq('id', jobId);

        if (!updateResult.error && (data.reference_links?.length || 0) > 0) {
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

      if (updateResult.error) throw updateResult.error;

      queryClient.invalidateQueries({ queryKey: ['job-edit', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
      showToast(tx('editJob.success', undefined, 'Job updated successfully'), 'success');
      navigate(`/jobs/${jobId}`, { replace: true });
    } catch (err) {
      console.error('Update error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
            ? (err as { message: string }).message
            : tx('editJob.error', undefined, 'Failed to update job');

      showToast(errorMessage || tx('editJob.error', undefined, 'Failed to update job'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-shell">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--workspace-primary)' }} />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="page-shell">
        <Header />
        <div className="page-shell-content">
          <EmptyState
            icon={FileX}
            title={tx('editJob.notFound', undefined, 'Job not found')}
            description={tx('editJob.notFoundDescription', undefined, 'This job may have been deleted or does not exist.')}
            action={{
              label: tx('editJob.goBack', undefined, 'Go to jobs'),
              onClick: () => navigate('/jobs'),
              variant: 'primary',
            }}
          />
        </div>
      </div>
    );
  }

  const isFinalStep = currentStep === steps.length;

  return (
    <div className="page-shell pb-20" style={{ background: 'var(--page-bg)' }}>
      <SEO
        title={tx('editJob.seo.title', undefined, 'Edit Job')}
        description={tx('editJob.seo.description', undefined, 'Update your job posting')}
        noIndex
      />
      <Header />

      <main className="page-shell-content">
        <JobWizardLayout
          currentStep={currentStep}
          steps={steps}
          title={tx('editJob.heroTitle', undefined, 'Edit your project brief')}
          description={tx('editJob.heroDescription', undefined, 'Update the details, budget, or visibility of your existing project.')}
          meta={null}
        >
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
              {currentStep === 1 && <StepJobBasics />}
              {currentStep === 2 && <StepBudget allowPastDeadline />}
              {currentStep === 3 && <StepVisibility />}
              {currentStep === 4 && <StepReview />}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <div>
                  {currentStep > 1 && (
                    <Button type="button" variant="ghost" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                      {tx('common.back', undefined, 'Back')}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => navigate(`/jobs/${jobId}`)}>
                    {tx('common.cancel', undefined, 'Cancel')}
                  </Button>
                  {isFinalStep ? (
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmitting}
                      rightIcon={<Check className="w-4 h-4" />}
                    >
                      {tx('editJob.saveChanges', undefined, 'Save Changes')}
                    </Button>
                  ) : (
                    <Button type="button" variant="primary" onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
                      {tx('common.next', undefined, 'Next')}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </FormProvider>
        </JobWizardLayout>
      </main>
    </div>
  );
}

