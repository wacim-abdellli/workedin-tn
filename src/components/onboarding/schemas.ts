import { z } from 'zod';

export const step1Schema = z.object({
    full_name: z.string().min(3, 'Minimum 3 characters'),
    title: z.string().min(5, 'Minimum 5 characters'),
    phone: z.string().optional(),
    location: z.string().min(1, 'Required'),
    bio: z.string().optional(),
});

export type Step1FormData = z.infer<typeof step1Schema>;

export const step2Schema = z.object({
    hourly_rate: z.string().optional(),
    availability: z.string().optional(),
    custom_skill_enabled: z.boolean().optional(),
    custom_skill_name: z.string().trim().max(60, 'Maximum 60 characters').optional(),
});

export type Step2FormData = z.infer<typeof step2Schema>;

export const freelancerStep3Schema = z.object({
    years_experience: z.string().optional(),
    tools: z.string().optional(),
    industries: z.string().optional(),
    portfolio_links: z.string().optional(),
    weekly_availability_hours: z.string().optional(),
    revision_policy: z.string().max(400, 'Maximum 400 characters').optional(),
    project_preferences: z.string().max(600, 'Maximum 600 characters').optional(),
});

export type FreelancerStep3FormData = z.infer<typeof freelancerStep3Schema>;

export const clientStep2Schema = z.object({
    company_name: z.string().trim().min(2, 'Minimum 2 characters'),
    company_website: z.string().trim().url('Invalid URL').optional().or(z.literal('')),
    company_industry: z.string().trim().min(2, 'Minimum 2 characters'),
    company_size: z.string().trim().min(1, 'Required'),
    company_role: z.string().trim().min(2, 'Minimum 2 characters'),
    hiring_needs: z.string().trim().min(2, 'Add at least one hiring need'),
    project_budget_preference: z.string().trim().min(2, 'Required'),
    project_timeline_preference: z.string().trim().min(2, 'Required'),
    communication_preferences: z.string().trim().max(400, 'Maximum 400 characters').optional(),
    screening_preferences: z.string().trim().max(400, 'Maximum 400 characters').optional(),
    legal_preferences: z.string().trim().max(400, 'Maximum 400 characters').optional(),
});

export type ClientStep2FormData = z.infer<typeof clientStep2Schema>;
