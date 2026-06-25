import { describe, expect, it } from 'vitest';

import { sanitizePhoneInput, normalizePhoneNumber, isValidOptionalPhone, formatPhoneAsYouType } from '@/lib/phone';
import { canAccessContract, canAccessMessage, canDeleteMessage, canSendMessage, isSuspended } from '@/lib/permissionEngine';
import { calculateFreelancerProfileCompletion, calculateClientProfileCompletion } from '@/lib/profileCompletion';
import { getAccessMessage, canApplyToJob, canPublishJob, canSaveJob, getMarketplaceUserState } from '@/lib/marketplaceAccess';

// ── phone.ts ────────────────────────────────────────────────────────────────

describe('phone', () => {
    describe('sanitizePhoneInput', () => {
        it('strips non-digit characters except leading +', () => {
            expect(sanitizePhoneInput('+216 12 345 678')).toBe('+21612345678');
        });

        it('limits to 15 digits', () => {
            expect(sanitizePhoneInput('+12345678901234567890')).toBe('+123456789012345');
        });

        it('converts 00 prefix to +', () => {
            expect(sanitizePhoneInput('0021612345678')).toBe('+21612345678');
        });

        it('returns empty string for empty input', () => {
            expect(sanitizePhoneInput('')).toBe('');
        });

        it('handles digits only without plus', () => {
            expect(sanitizePhoneInput('21612345678')).toBe('21612345678');
        });

        it('handles 00 with no digits after', () => {
            expect(sanitizePhoneInput('00')).toBe('');
        });
    });

    describe('normalizePhoneNumber', () => {
        it('trims whitespace', () => {
            expect(normalizePhoneNumber('  +216 12 345  ')).toBe('+21612345');
        });

        it('returns empty for empty input', () => {
            expect(normalizePhoneNumber('')).toBe('');
        });
    });

    describe('isValidOptionalPhone', () => {
        it('returns true for empty', () => {
            expect(isValidOptionalPhone(undefined)).toBe(true);
            expect(isValidOptionalPhone('')).toBe(true);
        });

        it('returns true for valid phone', () => {
            expect(isValidOptionalPhone('+21612345678')).toBe(true);
        });

        it('rejects multiple plus signs', () => {
            expect(isValidOptionalPhone('+216+123')).toBe(false);
        });

        it('rejects non-leading plus', () => {
            expect(isValidOptionalPhone('216+123')).toBe(false);
        });

        it('rejects too short', () => {
            expect(isValidOptionalPhone('+21612')).toBe(false);
        });
    });

    describe('formatPhoneAsYouType', () => {
        it('formats Tunisian number with country code', () => {
            expect(formatPhoneAsYouType('21612345678')).toBe('+216 12 345 678');
        });

        it('strips leading +', () => {
            expect(formatPhoneAsYouType('+21612345678')).toBe('+216 12 345 678');
        });

        it('strips leading 00', () => {
            expect(formatPhoneAsYouType('0021612345678')).toBe('+216 12 345 678');
        });

        it('formats partial number', () => {
            expect(formatPhoneAsYouType('12')).toBe('+216 12');
        });

        it('returns empty for empty', () => {
            expect(formatPhoneAsYouType('')).toBe('');
        });

        it('limits to 8 Tunisian digits', () => {
            expect(formatPhoneAsYouType('1234567890')).toBe('+216 12 345 678');
        });
    });
});

// ── permissionEngine.ts ─────────────────────────────────────────────────────

describe('permissionEngine', () => {
    describe('canAccessContract', () => {
        it('allows client access', () => {
            expect(canAccessContract('u1', { client_id: 'u1', freelancer_id: 'u2' })).toBe(true);
        });

        it('allows freelancer access', () => {
            expect(canAccessContract('u2', { client_id: 'u1', freelancer_id: 'u2' })).toBe(true);
        });

        it('blocks non-participant', () => {
            expect(canAccessContract('u3', { client_id: 'u1', freelancer_id: 'u2' })).toBe(false);
        });

        it('blocks null contract', () => {
            expect(canAccessContract('u1', null)).toBe(false);
        });

        it('blocks undefined contract', () => {
            expect(canAccessContract('u1', undefined)).toBe(false);
        });

        it('blocks when no client_id', () => {
            expect(canAccessContract('u1', { freelancer_id: 'u2' })).toBe(false);
        });
    });

    describe('canAccessMessage', () => {
        it('allows sender access', () => {
            expect(canAccessMessage('u1', { sender_id: 'u1', receiver_id: 'u2' })).toBe(true);
        });

        it('allows receiver access', () => {
            expect(canAccessMessage('u2', { sender_id: 'u1', receiver_id: 'u2' })).toBe(true);
        });

        it('blocks non-participant', () => {
            expect(canAccessMessage('u3', { sender_id: 'u1', receiver_id: 'u2' })).toBe(false);
        });

        it('blocks null message', () => {
            expect(canAccessMessage('u1', null)).toBe(false);
        });
    });

    describe('canDeleteMessage', () => {
        it('allows sender to delete', () => {
            expect(canDeleteMessage('u1', { sender_id: 'u1' })).toBe(true);
        });

        it('blocks non-sender', () => {
            expect(canDeleteMessage('u2', { sender_id: 'u1' })).toBe(false);
        });

        it('blocks null message', () => {
            expect(canDeleteMessage('u1', null)).toBe(false);
        });
    });

    describe('canSendMessage', () => {
        it('allows participant 1', () => {
            expect(canSendMessage('u1', { participant_1: 'u1', participant_2: 'u2' })).toBe(true);
        });

        it('allows participant 2', () => {
            expect(canSendMessage('u2', { participant_1: 'u1', participant_2: 'u2' })).toBe(true);
        });

        it('blocks non-participant', () => {
            expect(canSendMessage('u3', { participant_1: 'u1', participant_2: 'u2' })).toBe(false);
        });

        it('blocks null conversation', () => {
            expect(canSendMessage('u1', null)).toBe(false);
        });
    });

    describe('isSuspended', () => {
        it('detects suspended', () => {
            expect(isSuspended({ account_status: 'suspended' })).toBe(true);
        });

        it('detects archived', () => {
            expect(isSuspended({ account_status: 'archived' })).toBe(true);
        });

        it('returns false for active', () => {
            expect(isSuspended({ account_status: 'active' })).toBe(false);
        });

        it('returns false for null', () => {
            expect(isSuspended(null)).toBe(false);
        });

        it('returns false for undefined', () => {
            expect(isSuspended(undefined)).toBe(false);
        });
    });
});

// ── profileCompletion.ts ─────────────────────────────────────────────────────

describe('profileCompletion', () => {
    const emptyProfile = null;
    const emptyFreelancer = null;

    describe('calculateFreelancerProfileCompletion', () => {
        it('returns 0 for null profiles', () => {
            const result = calculateFreelancerProfileCompletion(emptyProfile, emptyFreelancer);
            expect(result.percentage).toBe(0);
            expect(result.steps.every(s => !s.completed)).toBe(true);
        });

        it('computes correct percentage for fully filled profile', () => {
            const profile = {
                avatar_url: 'url',
                full_name: 'Ahmed Ben Ali',
                bio: 'A very detailed bio with more than twenty characters for testing',
                phone_verified: true,
                location: 'Tunis',
            } as any;
            const freelancer = {
                title: 'Senior Developer',
                skills: ['React', 'Node.js', 'TypeScript'],
                hourly_rate: 50,
                years_experience: 5,
                languages: ['Arabic'],
                tools: ['VS Code'],
                industries: ['Tech'],
                work_samples: [{ url: 'http://example.com' }],
                project_preferences: { summary: 'A detailed summary of project preferences that is long enough' },
            } as any;
            const result = calculateFreelancerProfileCompletion(profile, freelancer);
            expect(result.percentage).toBeGreaterThanOrEqual(90);
            expect(result.strengthLabel).toBe('ممتاز');
        });

        it('labels low completion as ضعيف', () => {
            const result = calculateFreelancerProfileCompletion(
                { full_name: 'A' } as any,
                null,
            );
            expect(result.strengthLabel).toBe('ضعيف');
        });
    });

    describe('calculateClientProfileCompletion', () => {
        it('returns 0 for null profile', () => {
            const result = calculateClientProfileCompletion(null);
            expect(result.percentage).toBe(0);
        });

        it('computes percentage for filled client profile', () => {
            const result = calculateClientProfileCompletion({
                avatar_url: 'url',
                full_name: 'Company Inc',
                bio: 'We are a great company with more than twenty characters',
                phone_verified: true,
                location: 'Sfax',
                company_name: 'Company Inc',
                company_industry: 'Tech',
                hiring_needs: ['Design'],
                project_budget_preference: 'mid',
                project_timeline_preference: 'flexible',
            } as any);
            expect(result.percentage).toBe(100);
            expect(result.strengthLabel).toBe('ممتاز');
        });
    });
});

// ── marketplaceAccess.ts ────────────────────────────────────────────────────

describe('marketplaceAccess', () => {
    describe('getMarketplaceUserState', () => {
        it('returns visitor when not authenticated', () => {
            expect(getMarketplaceUserState({ isAuthenticated: false, profile: null })).toBe('visitor');
        });

        it('returns account_created when no user_type', () => {
            expect(getMarketplaceUserState({
                isAuthenticated: true,
                profile: { id: 'u1' } as any,
            })).toBe('account_created');
        });

        it('returns role_selected when no onboarding', () => {
            expect(getMarketplaceUserState({
                isAuthenticated: true,
                profile: { id: 'u1', user_type: 'freelancer' } as any,
            })).toBe('role_selected');
        });
    });

    describe('getAccessMessage', () => {
        it('returns correct message for auth_required', () => {
            expect(getAccessMessage('auth_required')).toBe('Sign in to continue.');
        });

        it('includes completion in profile_incomplete message', () => {
            expect(getAccessMessage('freelancer_profile_incomplete', 45)).toContain('45%');
        });

        it('returns default for ok', () => {
            expect(getAccessMessage('ok')).toBe('You can continue.');
        });
    });

    describe('canSaveJob', () => {
        it('allows authenticated user', () => {
            const result = canSaveJob({ isAuthenticated: true, profile: { id: 'u1' } as any });
            expect(result.allowed).toBe(true);
        });

        it('blocks unauthenticated user', () => {
            const result = canSaveJob({ isAuthenticated: false, profile: null });
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('auth_required');
            expect(result.nextStepPath).toBe('/login');
        });
    });

    describe('canApplyToJob', () => {
        it('blocks unauthenticated', () => {
            expect(canApplyToJob({ isAuthenticated: false, profile: null }).allowed).toBe(false);
        });

        it('blocks when no user_type', () => {
            expect(canApplyToJob({
                isAuthenticated: true,
                profile: { id: 'u1' } as any,
            }).reason).toBe('role_selection_required');
        });

        it('blocks client-only users', () => {
            expect(canApplyToJob({
                isAuthenticated: true,
                profile: { id: 'u1', user_type: 'client' } as any,
            }).reason).toBe('freelancer_role_required');
        });
    });

    describe('canPublishJob', () => {
        it('blocks freelancer-only users', () => {
            expect(canPublishJob({
                isAuthenticated: true,
                profile: { id: 'u1', user_type: 'freelancer' } as any,
            }).reason).toBe('client_role_required');
        });

        it('blocks unauthenticated', () => {
            expect(canPublishJob({ isAuthenticated: false, profile: null }).allowed).toBe(false);
        });
    });
});
