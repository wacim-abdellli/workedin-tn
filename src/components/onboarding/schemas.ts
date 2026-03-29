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
});

export type Step2FormData = z.infer<typeof step2Schema>;
