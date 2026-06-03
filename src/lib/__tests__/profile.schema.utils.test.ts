import { beforeEach, describe, expect, it, vi } from 'vitest';

const loggerState = vi.hoisted(() => ({
    warn: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        warn: loggerState.warn,
    },
}));

import {
    calculateClientProfileCompletion,
    calculateFreelancerProfileCompletion,
} from '@/lib/profileCompletion';
import {
    isBlockedField,
    isValidProfileField,
    sanitizeFreelancerProfileData,
    sanitizeProfileData,
} from '@/lib/schemaValidation';
import { cn } from '@/lib/utils';

describe('profileCompletion', () => {
    it('calculates weak freelancer completion with missing steps', () => {
        const result = calculateFreelancerProfileCompletion(
            {
                id: 'user-1',
                full_name: 'Al',
                avatar_url: '',
                bio: '',
                phone: '',
                location: '',
            } as never,
            null
        );

        expect(result.percentage).toBe(0);
        expect(result.completedSteps).toHaveLength(0);
        expect(result.missingSteps).toHaveLength(result.steps.length);
        expect(result.strengthColor).toContain('text-red-500');
    });

    it('calculates excellent freelancer completion when all major steps are filled', () => {
        const result = calculateFreelancerProfileCompletion(
            {
                id: 'user-1',
                full_name: 'Amina Ben Salem',
                avatar_url: 'https://avatar.example/1.png',
                bio: 'Experienced freelance designer with strong delivery history.',
                phone: '+21600000000',
                phone_verified: true,
                location: 'Tunis',
            } as never,
            {
                title: 'Senior Designer',
                skills: ['Figma', 'Branding', 'UI'],
                hourly_rate: 75,
                languages: ['Arabic', 'French'],
                education: ['ISAMM'],
                work_samples: [{ id: 'sample-1' }],
            } as never
        );

        expect(result.percentage).toBe(100);
        expect(result.completedSteps).toHaveLength(result.steps.length);
        expect(result.missingSteps).toHaveLength(0);
        expect(result.strengthColor).toContain('text-green-500');
    });

    it('calculates client completion strength tiers', () => {
        const medium = calculateClientProfileCompletion({
            id: 'client-1',
            full_name: 'Client Name',
            avatar_url: 'https://avatar.example/client.png',
            bio: '',
            phone: '',
            location: '',
        } as never);

        const strong = calculateClientProfileCompletion({
            id: 'client-1',
            full_name: 'Client Name',
            avatar_url: 'https://avatar.example/client.png',
            bio: 'We hire product and growth freelancers for long-term work.',
            phone: '+21611111111',
            phone_verified: true,
            location: '',
        } as never);

        expect(medium.percentage).toBe(45);
        expect(medium.strengthColor).toContain('text-amber-500');

        expect(strong.percentage).toBe(80);
        expect(strong.strengthColor).toContain('text-primary-600');
    });
});

describe('schemaValidation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sanitizes profile data and warns on blocked or unknown fields', () => {
        const sanitized = sanitizeProfileData({
            id: 'user-1',
            full_name: 'Test User',
            email: 'blocked@example.com',
            onboarding_completed: true,
            mystery: 'unknown',
        });

        expect(sanitized).toEqual({
            id: 'user-1',
            full_name: 'Test User',
            onboarding_completed: true,
        });
        expect(loggerState.warn).toHaveBeenCalledTimes(2);
    });

    it('sanitizes freelancer profile data and validates field helpers', () => {
        const sanitized = sanitizeFreelancerProfileData({
            title: 'Frontend Engineer',
            skills: ['React', 'TypeScript'],
            hourly_rate: 50,
            bad_field: true,
        });

        expect(sanitized).toEqual({
            title: 'Frontend Engineer',
            skills: ['React', 'TypeScript'],
            hourly_rate: 50,
        });
        expect(loggerState.warn).toHaveBeenCalledTimes(1);

        expect(isValidProfileField('full_name')).toBe(true);
        expect(isValidProfileField('bad_field')).toBe(false);
        expect(isBlockedField('email')).toBe(true);
        expect(isBlockedField('full_name')).toBe(false);
    });
});

describe('utils', () => {
    it('merges class names predictably', () => {
        expect(cn('px-2', undefined, 'py-1', 'px-4')).toBe('py-1 px-4');
    });
});
