import type { AccountMode, FreelancerProfile, Profile, UserType } from '@/types';

export type Workspace = AccountMode;

type ProfileLike =
  | Partial<Pick<Profile, 'id' | 'user_type' | 'active_mode' | 'full_name' | 'location' | 'onboarding_completed' | 'username'>>
  | null
  | undefined;

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
  return Boolean(profile?.onboarding_completed || (profile?.full_name && profile?.location));
}

export function isFreelancerWorkspaceReady(
  profile: ProfileLike,
  freelancerProfile?: FreelancerProfile | null
): boolean {
  if (!freelancerProfile) {
    return false;
  }

  const hasSkills = Array.isArray(freelancerProfile.skills) && freelancerProfile.skills.length > 0;

  return Boolean(
    (profile?.onboarding_completed || (profile?.full_name && profile?.location)) &&
      (freelancerProfile.title || hasSkills)
  );
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
          Boolean(profile?.onboarding_completed),
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
  if (!profile?.user_type) {
    return '/signup?step=select-type';
  }

  const workspace = getInitialWorkspace(profile, freelancerProfile);
  return getWorkspaceTargetRoute(profile, freelancerProfile, workspace).path;
}
