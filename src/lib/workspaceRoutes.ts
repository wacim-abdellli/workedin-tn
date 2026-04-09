import type { AccountMode, FreelancerProfile, Profile, UserType } from '@/types';

export type Workspace = AccountMode;
const ACCOUNT_TYPE_SELECTION_KEY = 'Khedmetna-account-type-selected-v1';

type ProfileLike =
  | Partial<
      Pick<
        Profile,
        | 'id'
        | 'user_type'
        | 'active_mode'
        | 'full_name'
        | 'location'
        | 'onboarding_completed'
        | 'client_onboarding_completed'
        | 'freelancer_onboarding_completed'
        | 'username'        | 'bio'
        | 'avatar_url'
        | 'phone'      >
    >
  | null
  | undefined;

function hasWorkspaceOnboardingFlags(profile: ProfileLike): boolean {
  return (
    typeof profile?.client_onboarding_completed === 'boolean' ||
    typeof profile?.freelancer_onboarding_completed === 'boolean'
  );
}

function getSelectionStorageKey(profileId?: string): string {
  return profileId ? `${ACCOUNT_TYPE_SELECTION_KEY}:${profileId}` : ACCOUNT_TYPE_SELECTION_KEY;
}

function hasSelectionMarker(profileId?: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(getSelectionStorageKey(profileId)) === '1';
}

export function persistUserTypeSelectionMarker(profileId?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getSelectionStorageKey(profileId), '1');
}

export function shouldRequireUserTypeSelection(profile: ProfileLike): boolean {
  if (!profile) {
    return false;
  }

  if (!profile.user_type) {
    return true;
  }

  if (hasSelectionMarker(profile.id)) {
    return false;
  }

  const hasAnyOnboarding = Boolean(
    profile.onboarding_completed ||
      profile.client_onboarding_completed ||
      profile.freelancer_onboarding_completed
  );

  const hasFlags = hasWorkspaceOnboardingFlags(profile);

  // Legacy DBs may default new users to client; require explicit choice once.
  return profile.user_type === 'client' && !hasAnyOnboarding && !hasFlags;
}

export function getWorkspaceCapabilities(userType: UserType | null | undefined): Workspace[] {
  switch (userType) {
    case 'freelancer':
      return ['freelancer'];
    case 'both':
      return ['client', 'freelancer'];
    case 'client':
    default:
      return ['client'];
  }
}

export function promoteUserTypeForWorkspace(
  currentType: UserType | null | undefined,
  workspace: Workspace
): UserType {
  if (!currentType) {
    return workspace;
  }

  if (currentType === 'both' || currentType === workspace) {
    return currentType;
  }

  return 'both';
}

export function getInitialWorkspace(
  profile: ProfileLike,
  freelancerProfile?: FreelancerProfile | null
): Workspace {
  if (profile?.active_mode === 'client' || profile?.active_mode === 'freelancer') {
    return profile.active_mode;
  }

  if (profile?.user_type === 'freelancer') {
    return 'freelancer';
  }

  if (profile?.user_type === 'both') {
    return freelancerProfile?.title ? 'freelancer' : 'client';
  }

  return 'client';
}

export function resolveActiveWorkspace(
  profile: ProfileLike,
  freelancerProfile: FreelancerProfile | null | undefined,
  requestedWorkspace?: Workspace | null
): Workspace {
  if (!profile) {
    return requestedWorkspace ?? 'client';
  }

  const capabilities = getWorkspaceCapabilities(profile.user_type);
  if (requestedWorkspace && capabilities.includes(requestedWorkspace)) {
    return requestedWorkspace;
  }

  return getInitialWorkspace(profile, freelancerProfile);
}

export function getWorkspaceDashboardPath(workspace: Workspace): string {
  return workspace === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard';
}

export function getWorkspaceOnboardingPath(workspace: Workspace): string {
  return workspace === 'freelancer' ? '/onboarding/freelancer' : '/onboarding/client';
}

export function getWorkspaceJobsPath(workspace: Workspace): string {
  return workspace === 'freelancer' ? '/jobs' : '/jobs/new';
}

export function getWorkspaceProfilePath(profile: ProfileLike, workspace: Workspace): string {
  if (workspace === 'freelancer' && profile?.id) {
    return `/freelancer/${profile.username || profile.id}`;
  }

  return '/settings?tab=profile';
}

export function getWorkspaceSettingsPath(): string {
  return '/settings?tab=account';
}

export function isClientWorkspaceReady(profile: ProfileLike): boolean {
  if (profile?.client_onboarding_completed === true) {
    return true;
  }

  if (profile?.onboarding_completed === true) {
    return true;
  }

  if (hasWorkspaceOnboardingFlags(profile) && profile?.client_onboarding_completed === false) {
    return false;
  }

  // Fallback for legacy users who might not have onboarding_completed=true but have filled out profile details
  if (profile?.bio || profile?.avatar_url || profile?.phone) {
    return true;
  }

  // If the user already has a legit setup or name, bypass the strict location trap.
  return Boolean(
    profile?.onboarding_completed || 
    (profile?.full_name && profile?.location)
  );
}

export function isFreelancerWorkspaceReady(
  profile: ProfileLike,
  freelancerProfile?: FreelancerProfile | null
): boolean {
  if (profile?.freelancer_onboarding_completed === true) {
    return true;
  }

  if (profile?.onboarding_completed === true) {
    return true;
  }

  if (hasWorkspaceOnboardingFlags(profile) && profile?.freelancer_onboarding_completed === false) {
    return false;
  }

  if (!freelancerProfile) {
    return false;
  }

  const hasSkills = Array.isArray(freelancerProfile.skills) && freelancerProfile.skills.length > 0;

  // Fallback for legacy users whose onboarding_completed got lost but have filled something
  const hasProfileBasics = profile?.onboarding_completed || profile?.bio || profile?.avatar_url || profile?.phone || profile?.location || (profile?.full_name && profile?.user_type);

  return Boolean(hasProfileBasics && (freelancerProfile?.title || hasSkills));
}

export function isWorkspaceReady(
  profile: ProfileLike,
  freelancerProfile: FreelancerProfile | null | undefined,
  workspace: Workspace
): boolean {
  return workspace === 'freelancer'
    ? isFreelancerWorkspaceReady(profile, freelancerProfile)
    : isClientWorkspaceReady(profile);
}

export function getWorkspaceSetupProgress(
  profile: ProfileLike,
  freelancerProfile: FreelancerProfile | null | undefined,
  workspace: Workspace
): number {
  const checks =
    workspace === 'freelancer'
      ? [
          Boolean(profile?.full_name),
          Boolean(profile?.location),
          Boolean(freelancerProfile?.title),
          Boolean(Array.isArray(freelancerProfile?.skills) && freelancerProfile.skills.length > 0),
        ]
      : [
          Boolean(profile?.full_name),
          Boolean(profile?.location),
          Boolean(profile?.client_onboarding_completed ?? profile?.onboarding_completed),
        ];

  const completed = checks.filter(Boolean).length;
  const progress = Math.round((completed / checks.length) * 100);

  return Math.max(isWorkspaceReady(profile, freelancerProfile, workspace) ? 100 : 0, progress);
}

export function getWorkspaceTargetRoute(
  profile: ProfileLike,
  freelancerProfile: FreelancerProfile | null | undefined,
  workspace: Workspace
): { path: string; isOnboarded: boolean } {
  const isOnboarded = isWorkspaceReady(profile, freelancerProfile, workspace);

  return {
    path: isOnboarded ? getWorkspaceDashboardPath(workspace) : getWorkspaceOnboardingPath(workspace),
    isOnboarded,
  };
}

export function getPostAuthWorkspacePath(
  profile: ProfileLike,
  freelancerProfile?: FreelancerProfile | null
): string {
  if (shouldRequireUserTypeSelection(profile)) {
    return '/signup?step=select-type';
  }

  const workspace = getInitialWorkspace(profile, freelancerProfile);
  return getWorkspaceTargetRoute(profile, freelancerProfile, workspace).path;
}

