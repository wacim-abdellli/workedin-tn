import type { AccountMode, FreelancerProfile, Profile, UserType } from '@/types';

const STORAGE_KEY_PREFIX = 'khedma-active-mode';

export interface WorkspaceSwitchResult {
    mode: AccountMode;
    userType: UserType;
    targetPath: string;
    isOnboarded: boolean;
}

type RoleCapableProfile =
    | Partial<Pick<Profile, 'id' | 'user_type' | 'active_mode' | 'full_name' | 'location' | 'onboarding_completed' | 'username'>>
    | null
    | undefined;

export function getAvailableModes(profile: RoleCapableProfile): AccountMode[] {
    switch (profile?.user_type) {
        case 'freelancer':
            return ['freelancer'];
        case 'both':
            return ['freelancer', 'client'];
        case 'client':
        default:
            return ['client'];
    }
}

export function canAccessMode(profile: RoleCapableProfile, mode: AccountMode): boolean {
    return getAvailableModes(profile).includes(mode);
}

function getStorageKey(userId?: string): string {
    return userId ? `${STORAGE_KEY_PREFIX}:${userId}` : STORAGE_KEY_PREFIX;
}

export function getStoredAccountMode(userId?: string): AccountMode | null {
    if (typeof window === 'undefined') return null;

    const storedMode = window.localStorage.getItem(getStorageKey(userId));
    return storedMode === 'freelancer' || storedMode === 'client' ? storedMode : null;
}

export function persistAccountMode(mode: AccountMode, userId?: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(getStorageKey(userId), mode);
}

export function resolveAccountMode(
    profile: RoleCapableProfile,
    freelancerProfile?: FreelancerProfile | null
): AccountMode {
    const profileMode = profile?.active_mode;
    if (profileMode === 'freelancer' || profileMode === 'client') {
        if (canAccessMode(profile, profileMode)) {
            return profileMode;
        }
    }

    const storedMode = getStoredAccountMode(profile?.id);
    if (storedMode && canAccessMode(profile, storedMode)) {
        return storedMode;
    }

    if (profile?.user_type === 'freelancer') {
        return 'freelancer';
    }

    if (profile?.user_type === 'both') {
        return freelancerProfile ? 'freelancer' : 'client';
    }

    return 'client';
}

export function promoteUserTypeForMode(currentType: UserType | null | undefined, mode: AccountMode): UserType {
    if (!currentType) {
        return mode;
    }

    if (currentType === 'both' || currentType === mode) {
        return currentType;
    }

    return 'both';
}

export function getDashboardPath(mode: AccountMode): string {
    return mode === 'client' ? '/client/dashboard' : '/freelancer/dashboard';
}

export function getOnboardingPath(mode: AccountMode): string {
    return mode === 'client' ? '/onboarding/client' : '/onboarding/freelancer';
}

export function getJobsPath(mode: AccountMode): string {
    return mode === 'client' ? '/jobs/new' : '/jobs';
}

export function getProfilePath(profile: RoleCapableProfile, mode: AccountMode): string {
    if (mode === 'freelancer' && profile?.id) {
        return `/freelancer/${profile.username || profile.id}`;
    }

    return '/client/dashboard';
}

export function isClientModeOnboarded(profile: RoleCapableProfile): boolean {
    return Boolean(profile?.onboarding_completed || (profile?.full_name && profile?.location));
}

export function isFreelancerModeOnboarded(
    profile: RoleCapableProfile,
    freelancerProfile?: FreelancerProfile | null
): boolean {
    if (!profile?.onboarding_completed || !freelancerProfile) {
        return false;
    }

    const hasSkills = Array.isArray(freelancerProfile.skills) && freelancerProfile.skills.length > 0;
    return Boolean(freelancerProfile.title || hasSkills);
}

export function isModeOnboarded(
    profile: RoleCapableProfile,
    freelancerProfile: FreelancerProfile | null | undefined,
    mode: AccountMode
): boolean {
    return mode === 'client'
        ? isClientModeOnboarded(profile)
        : isFreelancerModeOnboarded(profile, freelancerProfile);
}

export function getModeSetupChecklist(
    profile: RoleCapableProfile,
    freelancerProfile: FreelancerProfile | null | undefined,
    mode: AccountMode
): boolean[] {
    if (mode === 'client') {
        return [
            Boolean(profile?.full_name),
            Boolean(profile?.location),
            Boolean(profile?.bio && profile.bio.length > 20),
        ];
    }

    const hasSkills = Array.isArray(freelancerProfile?.skills) && freelancerProfile.skills.length > 0;

    return [
        Boolean(profile?.full_name),
        Boolean(profile?.location),
        Boolean(freelancerProfile?.title),
        hasSkills,
    ];
}

export function getModeSetupProgress(
    profile: RoleCapableProfile,
    freelancerProfile: FreelancerProfile | null | undefined,
    mode: AccountMode
): number {
    const checks = getModeSetupChecklist(profile, freelancerProfile, mode);
    const completed = checks.filter(Boolean).length;

    return Math.max(
        isModeOnboarded(profile, freelancerProfile, mode) ? 100 : 0,
        Math.round((completed / checks.length) * 100)
    );
}

export function getModeTarget(
    profile: RoleCapableProfile,
    freelancerProfile: FreelancerProfile | null | undefined,
    mode: AccountMode
): { path: string; isOnboarded: boolean } {
    const isOnboarded = isModeOnboarded(profile, freelancerProfile, mode);

    return {
        path: isOnboarded ? getDashboardPath(mode) : getOnboardingPath(mode),
        isOnboarded,
    };
}

export function getPostAuthPath(
    profile: RoleCapableProfile,
    freelancerProfile?: FreelancerProfile | null
): string {
    if (!profile?.user_type) {
        return '/signup?step=select-type';
    }

    const mode = resolveAccountMode(profile, freelancerProfile);
    return getModeTarget(profile, freelancerProfile, mode).path;
}
