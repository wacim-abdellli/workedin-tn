import { useState } from 'react';
import { useForm, FormProvider, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Save } from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Components
import JobWizardLayout from '../components/job-post/JobWizardLayout';
import StepJobBasics from '../components/job-post/StepJobBasics';
import StepBudget from '../components/job-post/StepBudget';
import StepVisibility from '../components/job-post/StepVisibility';
import StepReview from '../components/job-post/StepReview';

// Schema
const jobSchema = z.object({
    title: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل').max(100),
    category: z.string().min(1, 'يرجى اختيار التصنيف'),
    description: z.string().min(50, 'الوصف يجب أن يكون 50 حرف على الأقل'),
    required_skills: z.array(z.any()).min(1, 'يرجى اختيار مهارة واحدة على الأقل').max(5),
    attachments_files: z.any().optional(),

    // Step 2
    job_type: z.enum(['fixed_price', 'hourly']),
    budget_min: z.number().optional(),
    budget_max: z.number().optional(),
    hourly_rate: z.number().optional(),
    estimated_hours: z.string().optional(),
    duration: z.string().min(1, 'يرجى تحديد المدة'),
    experience_level: z.enum(['beginner', 'intermediate', 'expert']),

    // Step 3 (Merged into Step 2 UI or defaulted for now)
    visibility: z.enum(['public', 'invite_only']),
}).refine((data) => {
    if (data.job_type === 'fixed_price') {
        return !!data.budget_min && !!data.budget_max;
    }
    return !!data.hourly_rate;
}, {
    message: "يرجى تحديد الميزانية",
    path: ["budget_min"],
});

type JobFormData = z.infer<typeof jobSchema>;

export default function JobPost() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const methods = useForm<JobFormData>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            job_type: 'fixed_price',
            visibility: 'public',
            required_skills: [],
            experience_level: 'intermediate'
        },
        mode: 'onChange'
    });

    const steps = [
        { id: 1, title: 'تفاصيل المهمة' },
        { id: 2, title: 'الميزانية والمدة' },
        { id: 3, title: 'الظهور' },
        { id: 4, title: 'المراجعة والنشر' },
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
        await submitJob(data, 'open');
    };

    const handleSaveDraft = async () => {
        const data = methods.getValues();
        // Minimal validation for draft
        if (!data.title) {
            methods.setError('title', { message: 'يرجى إدخال عنوان الوظيفة لحفظ المسودة' });
            return;
        }
        await submitJob(data, 'draft');
    };

    const submitJob = async (data: JobFormData, status: 'open' | 'draft') => {
        if (!user) {
            showToast('يجب تسجيل الدخول لنشر وظيفة', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // Upload attachments if any
            const uploadedUrls: string[] = [];
            if (data.attachments_files && data.attachments_files.length > 0) {
                for (const file of data.attachments_files as File[]) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${user.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('job-attachments')
                        .upload(filePath, file);

                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('job-attachments')
                            .getPublicUrl(filePath);
                        uploadedUrls.push(publicUrl);
                    }
                }
            }

            // Transform data for DB
            const jobData = {
                client_id: user.id,
                title: data.title,
                description: data.description,
                category: data.category,
                job_type: data.job_type,
                budget_min: data.budget_min,
                budget_max: data.budget_max,
                hourly_rate: data.hourly_rate,
                duration: data.duration,
                experience_level: data.experience_level,
                visibility: data.visibility,
                attachments: uploadedUrls,
                status: status,
                currency: 'TND',
                proposals_count: 0,
                views_count: 0,
            };

            const { data: job, error } = await supabase
                .from('jobs')
                .insert(jobData)
                .select()
                .single();

            if (error) throw error;

            // Insert skills
            if (data.required_skills && data.required_skills.length > 0) {
                const jobSkillsData = data.required_skills.map((skill: any) => ({
                    job_id: job.id,
                    skill_id: skill.id
                }));

                const { error: skillsError } = await supabase
                    .from('job_skills')
                    .insert(jobSkillsData);

                if (skillsError) throw skillsError;
            }

            if (status === 'draft') {
                showToast('تم حفظ المسودة بنجاح', 'success');
            } else {
                showToast('تم نشر الوظيفة بنجاح!', 'success');
                navigate(`/jobs/posted/${job.id}`);
            }

        } catch (error) {
            console.error('Error posting job:', error);
            showToast('حدث خطأ أثناء حفظ الوظيفة', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />

            <div className="container-custom py-12">
                <JobWizardLayout currentStep={currentStep} steps={steps}>
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
                            <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-8">
                                {currentStep > 1 ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBack}
                                        leftIcon={<ArrowRight className="w-4 h-4" />} // RTL arrow
                                    >
                                        السابق
                                    </Button>
                                ) : (
                                    <div /> // Spacer
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={isSubmitting}
                                        onClick={handleSaveDraft}
                                    >
                                        <Save className="w-4 h-4 ml-2" />
                                        حفظ كمسودة
                                    </Button>

                                    {currentStep < steps.length ? (
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={handleNext}
                                            rightIcon={<ArrowLeft className="w-4 h-4" />} // RTL arrow
                                        >
                                            التالي
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            isLoading={isSubmitting}
                                            className="px-8"
                                            rightIcon={<ArrowLeft className="w-4 h-4" />}
                                        >
                                            نشر الوظيفة
                                        </Button>
                                    )}
                                </div>
                            </div>

                        </form>
                    </FormProvider>
                </JobWizardLayout>
            </div>
        </div>
    );
}
