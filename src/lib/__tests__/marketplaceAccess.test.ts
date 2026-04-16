import { describe, expect, it } from 'vitest';

import {
  canApplyToJob,
  canPublishJob,
  getMarketplaceUserState,
} from '@/lib/marketplaceAccess';

describe('marketplaceAccess strict workspace separation', () => {
  it('does not treat legacy global onboarding flag as workspace-ready state', () => {
    const state = getMarketplaceUserState({
      isAuthenticated: true,
      profile: {
        id: 'user-legacy',
        user_type: 'both',
        onboarding_completed: true,
        client_onboarding_completed: false,
        freelancer_onboarding_completed: false,
      } as any,
      freelancerProfile: null,
    });

    expect(state).toBe('role_selected');
  });

  it('requires client onboarding even when freelancer onboarding is complete', () => {
    const decision = canPublishJob({
      isAuthenticated: true,
      profile: {
        id: 'user-client',
        user_type: 'both',
        client_onboarding_completed: false,
        freelancer_onboarding_completed: true,
      } as any,
      freelancerProfile: { id: 'user-client', title: 'Designer', skills: ['figma'] } as any,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('client_onboarding_required');
    expect(decision.nextStepPath).toBe('/onboarding/client');
  });

  it('requires freelancer onboarding even when client onboarding is complete', () => {
    const decision = canApplyToJob({
      isAuthenticated: true,
      profile: {
        id: 'user-freelancer',
        user_type: 'both',
        client_onboarding_completed: true,
        freelancer_onboarding_completed: false,
      } as any,
      freelancerProfile: null,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('freelancer_onboarding_required');
    expect(decision.nextStepPath).toBe('/onboarding/freelancer');
  });

  it('blocks apply while dual-role account is in client workspace mode', () => {
    const decision = canApplyToJob({
      isAuthenticated: true,
      profile: {
        id: 'user-dual',
        user_type: 'both',
        active_mode: 'client',
        client_onboarding_completed: true,
        freelancer_onboarding_completed: true,
        avatar_url: 'https://example.com/avatar.png',
        full_name: 'Dual Mode User',
        bio: 'Freelancer profile summary that is long enough to pass checks.',
        phone: '+21600000000',
        location: 'Tunis',
      } as any,
      freelancerProfile: {
        id: 'user-dual',
        title: 'Full Stack Developer',
        skills: ['react', 'typescript', 'supabase'],
        hourly_rate: 80,
        years_experience: 5,
        tools: ['VS Code'],
        industries: ['saas'],
        portfolio_links: ['https://example.com/portfolio'],
        project_preferences: {
          summary: 'I prefer long-term product work with clear deliverables.',
        },
      } as any,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('freelancer_workspace_required');
  });
});
