import type { FreelancerProfile, Profile, UserType } from '@/types';

import {
  calculateClientProfileCompletion,
  calculateFreelancerProfileCompletion,
} from '@/lib/profileCompletion';

export type AccessReason =
  | 'ok'
  | 'auth_required'
  | 'role_selection_required'
  | 'freelancer_role_required'
  | 'freelancer_workspace_required'
  | 'client_role_required'
  | 'freelancer_onboarding_required'
  | 'client_onboarding_required'
  | 'freelancer_profile_incomplete'
  | 'client_profile_incomplete';

export type MarketplaceUserState =
  | 'visitor'
  | 'account_created'
  | 'role_selected'
  | 'workspace_ready'
  | 'market_ready';

export interface AccessDecision {
  allowed: boolean;
  reason: AccessReason;
  state: MarketplaceUserState;
  nextStepPath?: string;
  completion?: number;
}

interface AccessContext {
  isAuthenticated: boolean;
  profile: Profile | null;
  freelancerProfile?: FreelancerProfile | null;
}

const FREELANCER_MARKET_READY_THRESHOLD = 60;
const CLIENT_MARKET_READY_THRESHOLD = 60;

function hasRole(userType: UserType | null | undefined, role: 'freelancer' | 'client'): boolean {
  if (!userType) return false;
  return userType === role || userType === 'both';
}

function getFreelancerCompletion(profile: Profile | null, freelancerProfile: FreelancerProfile | null | undefined): number {
  return calculateFreelancerProfileCompletion(profile, freelancerProfile ?? null).percentage;
}

function getClientCompletion(profile: Profile | null): number {
  return calculateClientProfileCompletion(profile).percentage;
}

export function getMarketplaceUserState({
  isAuthenticated,
  profile,
  freelancerProfile,
}: AccessContext): MarketplaceUserState {
  if (!isAuthenticated || !profile) {
    return 'visitor';
  }

  if (!profile.user_type) {
    return 'account_created';
  }

  const hasAnyWorkspaceReady = Boolean(
    profile.client_onboarding_completed ||
      profile.freelancer_onboarding_completed
  );

  if (!hasAnyWorkspaceReady) {
    return 'role_selected';
  }

  const freelancerReady =
    hasRole(profile.user_type, 'freelancer') &&
    getFreelancerCompletion(profile, freelancerProfile) >= FREELANCER_MARKET_READY_THRESHOLD;
  const clientReady =
    hasRole(profile.user_type, 'client') && getClientCompletion(profile) >= CLIENT_MARKET_READY_THRESHOLD;

  if (freelancerReady || clientReady) {
    return 'market_ready';
  }

  return 'workspace_ready';
}

export function canSaveJob(context: AccessContext): AccessDecision {
  const state = getMarketplaceUserState(context);

  if (!context.isAuthenticated || !context.profile) {
    return {
      allowed: false,
      reason: 'auth_required',
      state,
      nextStepPath: '/login',
    };
  }

  return {
    allowed: true,
    reason: 'ok',
    state,
  };
}

export function canSaveFreelancer(context: AccessContext): AccessDecision {
  return canSaveJob(context);
}

export function canApplyToJob(context: AccessContext): AccessDecision {
  const state = getMarketplaceUserState(context);
  const { isAuthenticated, profile, freelancerProfile } = context;

  if (!isAuthenticated || !profile) {
    return {
      allowed: false,
      reason: 'auth_required',
      state,
      nextStepPath: '/login',
    };
  }

  if (!profile.user_type) {
    return {
      allowed: false,
      reason: 'role_selection_required',
      state,
      nextStepPath: '/signup?step=select-type',
    };
  }

  if (!hasRole(profile.user_type, 'freelancer')) {
    return {
      allowed: false,
      reason: 'freelancer_role_required',
      state,
      nextStepPath: '/signup?step=select-type',
    };
  }

  // Dual-role users must be in freelancer workspace before applying.
  if (profile.user_type === 'both' && profile.active_mode === 'client') {
    return {
      allowed: false,
      reason: 'freelancer_workspace_required',
      state,
    };
  }

  if (!profile.freelancer_onboarding_completed) {
    return {
      allowed: false,
      reason: 'freelancer_onboarding_required',
      state,
      nextStepPath: '/onboarding/freelancer',
    };
  }

  const completion = getFreelancerCompletion(profile, freelancerProfile);
  if (completion < FREELANCER_MARKET_READY_THRESHOLD) {
    return {
      allowed: false,
      reason: 'freelancer_profile_incomplete',
      state,
      completion,
      nextStepPath: '/settings?tab=profile',
    };
  }

  return {
    allowed: true,
    reason: 'ok',
    state,
    completion,
  };
}

export function canPublishJob(context: AccessContext): AccessDecision {
  const state = getMarketplaceUserState(context);
  const { isAuthenticated, profile } = context;

  if (!isAuthenticated || !profile) {
    return {
      allowed: false,
      reason: 'auth_required',
      state,
      nextStepPath: '/login',
    };
  }

  if (!profile.user_type) {
    return {
      allowed: false,
      reason: 'role_selection_required',
      state,
      nextStepPath: '/signup?step=select-type',
    };
  }

  if (!hasRole(profile.user_type, 'client')) {
    return {
      allowed: false,
      reason: 'client_role_required',
      state,
      nextStepPath: '/signup?step=select-type',
    };
  }

  if (!profile.client_onboarding_completed) {
    return {
      allowed: false,
      reason: 'client_onboarding_required',
      state,
      nextStepPath: '/onboarding/client',
    };
  }

  const completion = getClientCompletion(profile);
  if (completion < CLIENT_MARKET_READY_THRESHOLD) {
    return {
      allowed: false,
      reason: 'client_profile_incomplete',
      state,
      completion,
      nextStepPath: '/settings?tab=profile',
    };
  }

  return {
    allowed: true,
    reason: 'ok',
    state,
    completion,
  };
}

export function getAccessMessage(reason: AccessReason, completion?: number): string {
  switch (reason) {
    case 'auth_required':
      return 'Sign in to continue.';
    case 'role_selection_required':
      return 'Choose your account type first.';
    case 'freelancer_role_required':
      return 'Only freelancer accounts can apply to jobs.';
    case 'freelancer_workspace_required':
      return 'Switch to Freelancer workspace before applying to jobs.';
    case 'client_role_required':
      return 'Only client accounts can publish jobs.';
    case 'freelancer_onboarding_required':
      return 'Finish freelancer onboarding before applying.';
    case 'client_onboarding_required':
      return 'Finish client onboarding before publishing a job.';
    case 'freelancer_profile_incomplete':
      return `Complete your freelancer profile before applying. Current completion: ${completion ?? 0}%.`;
    case 'client_profile_incomplete':
      return `Complete your client profile before publishing. Current completion: ${completion ?? 0}%.`;
    default:
      return 'You can continue.';
  }
}
