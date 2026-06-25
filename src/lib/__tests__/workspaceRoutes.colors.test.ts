import { describe, expect, it } from 'vitest';

import {
    getWorkspaceCapabilities,
    promoteUserTypeForWorkspace,
    getInitialWorkspace,
    getWorkspaceDashboardPath,
    getWorkspaceOnboardingPath,
    getWorkspaceJobsPath,
    getWorkspaceProfilePath,
    getWorkspaceSettingsPath,
    isClientWorkspaceReady,
    isFreelancerWorkspaceReady,
    isWorkspaceReady,
    getWorkspaceSetupProgress,
    getWorkspaceTargetRoute,
} from '@/lib/workspaceRoutes';
import { colors } from '@/lib/colors';

// ── colors.ts ───────────────────────────────────────────────────────────────

describe('colors', () => {
    it('has brand purple color', () => {
        expect(colors.brand.purple).toBe('#8b5cf6');
    });

    it('has light theme page background', () => {
        expect(colors.light.pageBg).toBe('#ffffff');
    });

    it('has dark theme page background', () => {
        expect(colors.dark.pageBg).toBe('#0f0e17');
    });

    it('has matching light/dark text primary keys', () => {
        expect(typeof colors.light.text.primary).toBe('string');
        expect(typeof colors.dark.text.primary).toBe('string');
    });
});

// ── workspaceRoutes.ts ──────────────────────────────────────────────────────

describe('workspaceRoutes', () => {
    describe('getWorkspaceCapabilities', () => {
        it('returns freelancer for freelancer type', () => {
            expect(getWorkspaceCapabilities('freelancer')).toEqual(['freelancer']);
        });

        it('returns both workspaces for both type', () => {
            expect(getWorkspaceCapabilities('both')).toEqual(['client', 'freelancer']);
        });

        it('returns client for client type', () => {
            expect(getWorkspaceCapabilities('client')).toEqual(['client']);
        });

        it('returns client for null', () => {
            expect(getWorkspaceCapabilities(null)).toEqual(['client']);
        });

        it('returns client for undefined', () => {
            expect(getWorkspaceCapabilities(undefined)).toEqual(['client']);
        });
    });

    describe('promoteUserTypeForWorkspace', () => {
        it('returns workspace when no current type', () => {
            expect(promoteUserTypeForWorkspace(null, 'freelancer')).toBe('freelancer');
        });

        it('returns both when mixing types', () => {
            expect(promoteUserTypeForWorkspace('client', 'freelancer')).toBe('both');
        });

        it('returns same type when already both', () => {
            expect(promoteUserTypeForWorkspace('both', 'freelancer')).toBe('both');
        });

        it('returns same type when matching', () => {
            expect(promoteUserTypeForWorkspace('freelancer', 'freelancer')).toBe('freelancer');
        });
    });

    describe('getInitialWorkspace', () => {
        it('returns active_mode if set', () => {
            expect(getInitialWorkspace({ active_mode: 'freelancer' } as any)).toBe('freelancer');
        });

        it('returns freelancer for freelancer user_type', () => {
            expect(getInitialWorkspace({ user_type: 'freelancer' } as any)).toBe('freelancer');
        });

        it('returns freelancer for both with title', () => {
            expect(getInitialWorkspace(
                { user_type: 'both' } as any,
                { title: 'Developer' } as any,
            )).toBe('freelancer');
        });

        it('returns client for both without title', () => {
            expect(getInitialWorkspace({ user_type: 'both' } as any, null)).toBe('client');
        });

        it('returns client for null profile', () => {
            expect(getInitialWorkspace(null)).toBe('client');
        });
    });

    describe('getWorkspaceDashboardPath', () => {
        it('returns freelancer dashboard', () => {
            expect(getWorkspaceDashboardPath('freelancer')).toBe('/freelancer/dashboard');
        });

        it('returns client dashboard', () => {
            expect(getWorkspaceDashboardPath('client')).toBe('/client/dashboard');
        });
    });

    describe('getWorkspaceOnboardingPath', () => {
        it('returns freelancer onboarding', () => {
            expect(getWorkspaceOnboardingPath('freelancer')).toBe('/onboarding/freelancer');
        });

        it('returns client onboarding', () => {
            expect(getWorkspaceOnboardingPath('client')).toBe('/onboarding/client');
        });
    });

    describe('getWorkspaceJobsPath', () => {
        it('returns /jobs for freelancer', () => {
            expect(getWorkspaceJobsPath('freelancer')).toBe('/jobs');
        });

        it('returns /jobs/new for client', () => {
            expect(getWorkspaceJobsPath('client')).toBe('/jobs/new');
        });
    });

    describe('getWorkspaceProfilePath', () => {
        it('returns freelancer profile with username', () => {
            expect(getWorkspaceProfilePath({ id: 'u1', username: 'ahmed' } as any, 'freelancer')).toBe('/freelancer/ahmed');
        });

        it('returns freelancer profile with id fallback', () => {
            expect(getWorkspaceProfilePath({ id: 'u1' } as any, 'freelancer')).toBe('/freelancer/u1');
        });

        it('returns client profile with id', () => {
            expect(getWorkspaceProfilePath({ id: 'u1' } as any, 'client')).toBe('/client/u1');
        });

        it('returns settings fallback when no profile id', () => {
            expect(getWorkspaceProfilePath(null, 'freelancer')).toBe('/settings?tab=account');
        });
    });

    describe('getWorkspaceSettingsPath', () => {
        it('returns settings path', () => {
            expect(getWorkspaceSettingsPath()).toBe('/settings?tab=account');
        });
    });

    describe('isClientWorkspaceReady', () => {
        it('returns true when onboarding completed', () => {
            expect(isClientWorkspaceReady({ client_onboarding_completed: true } as any)).toBe(true);
        });

        it('returns false when null profile', () => {
            expect(isClientWorkspaceReady(null)).toBe(false);
        });

        it('returns legacy fallback when no boolean flag', () => {
            expect(isClientWorkspaceReady({ onboarding_completed: true } as any)).toBe(true);
        });

        it('returns false when onboarding not completed', () => {
            expect(isClientWorkspaceReady({ client_onboarding_completed: false } as any)).toBe(false);
        });
    });

    describe('isFreelancerWorkspaceReady', () => {
        it('returns true when onboarding completed', () => {
            expect(isFreelancerWorkspaceReady({ freelancer_onboarding_completed: true } as any)).toBe(true);
        });

        it('returns false when null profile', () => {
            expect(isFreelancerWorkspaceReady(null)).toBe(false);
        });

        it('returns legacy fallback', () => {
            expect(isFreelancerWorkspaceReady({ onboarding_completed: true } as any)).toBe(true);
        });
    });

    describe('isWorkspaceReady', () => {
        it('checks freelancer workspace', () => {
            expect(isWorkspaceReady({ freelancer_onboarding_completed: true } as any, null, 'freelancer')).toBe(true);
        });

        it('checks client workspace', () => {
            expect(isWorkspaceReady({ client_onboarding_completed: true } as any, null, 'client')).toBe(true);
        });
    });

    describe('getWorkspaceSetupProgress', () => {
        it('returns 100 when fully onboarded', () => {
            expect(getWorkspaceSetupProgress(
                { full_name: 'Ahmed', location: 'Tunis', client_onboarding_completed: true } as any,
                null,
                'client',
            )).toBe(100);
        });

        it('returns 0 for null profile', () => {
            expect(getWorkspaceSetupProgress(null, null, 'client')).toBe(0);
        });

        it('calculates partial progress for freelancer', () => {
            const progress = getWorkspaceSetupProgress(
                { full_name: 'Ahmed', location: 'Tunis' } as any,
                null,
                'freelancer',
            );
            expect(progress).toBeGreaterThanOrEqual(50);
        });
    });

    describe('getWorkspaceTargetRoute', () => {
        it('returns dashboard when onboarded', () => {
            const result = getWorkspaceTargetRoute(
                { client_onboarding_completed: true } as any,
                null,
                'client',
            );
            expect(result.path).toBe('/client/dashboard');
            expect(result.isOnboarded).toBe(true);
        });

        it('returns onboarding when not onboarded', () => {
            const result = getWorkspaceTargetRoute(
                { client_onboarding_completed: false } as any,
                null,
                'client',
            );
            expect(result.path).toBe('/onboarding/client');
            expect(result.isOnboarded).toBe(false);
        });
    });
});
