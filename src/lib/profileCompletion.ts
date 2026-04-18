import type { Profile, FreelancerProfile } from '../types';

export interface CompletionStep {
    id: string;
    label: string;
    completed: boolean;
    weight: number; // Weight in percentage points
    link?: string; // Link to complete this step
}

export interface ProfileCompletionResult {
    percentage: number;
    steps: CompletionStep[];
    missingSteps: CompletionStep[];
    completedSteps: CompletionStep[];
    strengthLabel: 'ضعيف' | 'متوسط' | 'جيد' | 'ممتاز';
    strengthColor: string;
}

/**
 * Calculate profile completion for freelancers
 */
export function calculateFreelancerProfileCompletion(
    profile: Profile | null,
    freelancerProfile: FreelancerProfile | null
): ProfileCompletionResult {
    const steps: CompletionStep[] = [
        {
            id: 'avatar',
            label: 'إضافة صورة شخصية',
            completed: !!profile?.avatar_url,
            weight: 8,
            link: '/settings?tab=profile',
        },
        {
            id: 'full_name',
            label: 'إكمال الاسم الكامل',
            completed: !!profile?.full_name && profile.full_name.length > 2,
            weight: 8,
            link: '/settings?tab=profile',
        },
        {
            id: 'bio',
            label: 'إضافة نبذة تعريفية',
            completed: !!profile?.bio && profile.bio.length > 20,
            weight: 8,
            link: '/settings?tab=profile',
        },
        {
            id: 'phone',
            label: 'إضافة رقم الهاتف',
            completed: !!profile?.phone,
            weight: 4,
            link: '/settings?tab=profile',
        },
        {
            id: 'location',
            label: 'تحديد الموقع',
            completed: !!profile?.location,
            weight: 4,
            link: '/settings?tab=profile',
        },
        {
            id: 'title',
            label: 'إضافة المسمى الوظيفي',
            completed: !!freelancerProfile?.title && freelancerProfile.title.length > 3,
            weight: 10,
            link: '/onboarding/freelancer',
        },
        {
            id: 'skills',
            label: 'إضافة المهارات (3+ مهارات)',
            completed: !!freelancerProfile?.skills && freelancerProfile.skills.length >= 3,
            weight: 14,
            link: '/onboarding/freelancer',
        },
        {
            id: 'hourly_rate',
            label: 'تحديد سعر الساعة',
            completed: !!freelancerProfile?.hourly_rate && freelancerProfile.hourly_rate > 0,
            weight: 8,
            link: '/onboarding/freelancer',
        },
        {
            id: 'years_experience',
            label: 'سنوات الخبرة',
            completed: Boolean(
                (freelancerProfile?.years_experience ?? 0) > 0
                || (freelancerProfile?.languages?.length ?? 0) > 0
                || (freelancerProfile?.education?.length ?? 0) > 0
            ),
            weight: 8,
            link: '/onboarding/freelancer',
        },
        {
            id: 'tools',
            label: 'الأدوات الأساسية',
            completed: (freelancerProfile?.tools?.length ?? 0) > 0 || (freelancerProfile?.skills?.length ?? 0) >= 3,
            weight: 6,
            link: '/onboarding/freelancer',
        },
        {
            id: 'industries',
            label: 'مجالات العمل',
            completed: (freelancerProfile?.industries?.length ?? 0) > 0 || !!freelancerProfile?.title,
            weight: 6,
            link: '/onboarding/freelancer',
        },
        {
            id: 'portfolio',
            label: 'إضافة أعمال سابقة',
            completed: (freelancerProfile?.work_samples?.length ?? 0) > 0 || (freelancerProfile?.portfolio_links?.length ?? 0) > 0,
            weight: 8,
            link: '/freelancer/portfolio',
        },
        {
            id: 'project_preferences',
            label: 'تفضيلات المشاريع',
            completed: Boolean(
                freelancerProfile?.project_preferences
                && typeof freelancerProfile.project_preferences === 'object'
                && 'summary' in freelancerProfile.project_preferences
                && typeof freelancerProfile.project_preferences.summary === 'string'
                && freelancerProfile.project_preferences.summary.trim().length > 10
            ) || !!profile?.bio,
            weight: 8,
            link: '/onboarding/freelancer',
        },
    ];

    const completedSteps = steps.filter(step => step.completed);
    const missingSteps = steps.filter(step => !step.completed);

    const percentage = Math.round(
        completedSteps.reduce((sum, step) => sum + step.weight, 0)
    );

    let strengthLabel: ProfileCompletionResult['strengthLabel'];
    let strengthColor: string;

    if (percentage < 30) {
        strengthLabel = 'ضعيف';
        strengthColor = 'text-red-500 bg-red-100 dark:bg-red-900/30';
    } else if (percentage < 60) {
        strengthLabel = 'متوسط';
        strengthColor = 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
    } else if (percentage < 90) {
        strengthLabel = 'جيد';
        strengthColor = 'text-primary-600 bg-primary-100 dark:bg-primary-900/30';
    } else {
        strengthLabel = 'ممتاز';
        strengthColor = 'text-green-500 bg-green-100 dark:bg-green-900/30';
    }

    return {
        percentage,
        steps,
        missingSteps,
        completedSteps,
        strengthLabel,
        strengthColor,
    };
}

/**
 * Calculate profile completion for clients
 */
export function calculateClientProfileCompletion(profile: Profile | null): ProfileCompletionResult {
    const steps: CompletionStep[] = [
        {
            id: 'avatar',
            label: 'إضافة صورة شخصية',
            completed: !!profile?.avatar_url,
            weight: 20,
            link: '/settings?tab=profile',
        },
        {
            id: 'full_name',
            label: 'إكمال الاسم الكامل',
            completed: !!profile?.full_name && profile.full_name.length > 2,
            weight: 25,
            link: '/settings?tab=profile',
        },
        {
            id: 'bio',
            label: 'إضافة نبذة عن الشركة/العمل',
            completed: !!profile?.bio && profile.bio.length > 20,
            weight: 20,
            link: '/settings?tab=profile',
        },
        {
            id: 'phone',
            label: 'إضافة رقم الهاتف',
            completed: !!profile?.phone,
            weight: 15,
            link: '/settings?tab=profile',
        },
        {
            id: 'location',
            label: 'تحديد الموقع',
            completed: !!profile?.location,
            weight: 5,
            link: '/settings?tab=profile',
        },
        {
            id: 'company_name',
            label: 'اسم الشركة',
            completed: !!profile?.company_name,
            weight: 5,
            link: '/onboarding/client',
        },
        {
            id: 'company_industry',
            label: 'مجال الشركة',
            completed: !!profile?.company_industry,
            weight: 4,
            link: '/onboarding/client',
        },
        {
            id: 'hiring_needs',
            label: 'احتياجات التوظيف',
            completed: (profile?.hiring_needs?.length ?? 0) > 0,
            weight: 3,
            link: '/onboarding/client',
        },
        {
            id: 'project_budget_preference',
            label: 'تفضيل الميزانية',
            completed: !!profile?.project_budget_preference,
            weight: 2,
            link: '/onboarding/client',
        },
        {
            id: 'project_timeline_preference',
            label: 'تفضيل الجدول الزمني',
            completed: !!profile?.project_timeline_preference,
            weight: 1,
            link: '/settings?tab=profile',
        },
    ];

    const completedSteps = steps.filter(step => step.completed);
    const missingSteps = steps.filter(step => !step.completed);

    const percentage = Math.round(
        completedSteps.reduce((sum, step) => sum + step.weight, 0)
    );

    let strengthLabel: ProfileCompletionResult['strengthLabel'];
    let strengthColor: string;

    if (percentage < 30) {
        strengthLabel = 'ضعيف';
        strengthColor = 'text-red-500 bg-red-100 dark:bg-red-900/30';
    } else if (percentage < 60) {
        strengthLabel = 'متوسط';
        strengthColor = 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
    } else if (percentage < 90) {
        strengthLabel = 'جيد';
        strengthColor = 'text-primary-600 bg-primary-100 dark:bg-primary-900/30';
    } else {
        strengthLabel = 'ممتاز';
        strengthColor = 'text-green-500 bg-green-100 dark:bg-green-900/30';
    }

    return {
        percentage,
        steps,
        missingSteps,
        completedSteps,
        strengthLabel,
        strengthColor,
    };
}
