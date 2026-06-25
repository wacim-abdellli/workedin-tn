/**
 * Auth helper utilities — extracted from AuthContext.tsx for testability.
 * Pure functions that don't depend on React state or Supabase.
 */
import { useWorkspaceStore } from '@/lib/workspaceState';
import type { Profile, FreelancerProfile } from '@/types';

const PROFILE_CACHE_KEY = 'wi_profile_cache';

export function readProfileCache(userId: string): { profile: Profile; freelancerProfile: FreelancerProfile | null } | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.userId !== userId) return null;
    return { profile: parsed.profile, freelancerProfile: parsed.freelancerProfile ?? null };
  } catch {
    return null;
  }
}

export function writeProfileCache(userId: string, profile: Profile, freelancerProfile: FreelancerProfile | null) {
  try {
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ userId, profile, freelancerProfile }));
  } catch {
    // sessionStorage unavailable — silently ignore
  }
}

export function clearProfileCache() {
  try {
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // ignore
  }
}

export function resolveModeAvatarUrl(profile: Profile, currentMode?: string): string | undefined {
  const mode = currentMode || useWorkspaceStore.getState().activeWorkspace || profile.active_mode;
  if (mode === 'freelancer' && profile.avatar_url_freelancer) {
    return profile.avatar_url_freelancer;
  }

  if (mode === 'client' && profile.avatar_url_client) {
    return profile.avatar_url_client;
  }

  return profile.avatar_url_freelancer || profile.avatar_url_client || profile.avatar_url;
}

export function withModeAwareAvatar(profile: Profile, currentMode?: string): Profile {
  return {
    ...profile,
    avatar_url: resolveModeAvatarUrl(profile, currentMode),
  };
}

export function getPreferredLanguage(): 'ar' | 'fr' | 'en' {
  if (typeof window === 'undefined') return 'ar';

  const storedLanguage = window.localStorage.getItem('i18n-language') || window.localStorage.getItem('language');
  if (storedLanguage === 'ar' || storedLanguage === 'fr' || storedLanguage === 'en') {
    return storedLanguage;
  }

  const htmlLanguage = document.documentElement.lang;
  if (htmlLanguage === 'ar' || htmlLanguage === 'fr' || htmlLanguage === 'en') {
    return htmlLanguage as 'ar' | 'fr' | 'en';
  }

  return 'ar';
}
