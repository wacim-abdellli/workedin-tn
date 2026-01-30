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
            weight: 10,
            link: '/settings?tab=profile',
        },
        {
            id: 'full_name',
            label: 'إكمال الاسم الكامل',
            completed: !!profile?.full_name && profile.full_name.length > 2,
            weight: 10,
            link: '/settings?tab=profile',
        },
        {
            id: 'bio',
            label: 'إضافة نبذة تعريفية',
            completed: !!profile?.bio && profile.bio.length > 20,
            weight: 10,
            link: '/settings?tab=profile',
        },
        {
            id: 'phone',
            label: 'إضافة رقم الهاتف',
            completed: !!profile?.phone,
            weight: 5,
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
            weight: 15,
            link: '/onboarding/freelancer',
        },
        {
            id: 'hourly_rate',
            label: 'تحديد سعر الساعة',
            completed: !!freelancerProfile?.hourly_rate && freelancerProfile.hourly_rate > 0,
            weight: 10,
            link: '/onboarding/freelancer',
        },
        {
            id: 'languages',
            label: 'إضافة اللغات',
            completed: !!freelancerProfile?.languages && freelancerProfile.languages.length > 0,
            weight: 5,
            link: '/onboarding/freelancer',
        },
        {
            id: 'education',
            label: 'إضافة المؤهلات التعليمية',
            completed: !!freelancerProfile?.education && freelancerProfile.education.length > 0,
            weight: 10,
            link: '/onboarding/freelancer',
        },
        {
            id: 'portfolio',
            label: 'إضافة أعمال سابقة',
            completed: (freelancerProfile?.work_samples?.length ?? 0) > 0,
            weight: 10,
            link: '/freelancer/portfolio',
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
        strengthColor = 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
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
            weight: 20,
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
        strengthColor = 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
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
