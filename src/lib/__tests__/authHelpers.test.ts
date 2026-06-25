import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  readProfileCache,
  writeProfileCache,
  clearProfileCache,
  resolveModeAvatarUrl,
  withModeAwareAvatar,
  getPreferredLanguage,
} from '@/lib/authHelpers';
import { useWorkspaceStore } from '@/lib/workspaceState';

// Mock workspaceStore for resolveModeAvatarUrl
vi.mock('@/lib/workspaceState', () => ({
  useWorkspaceStore: {
    getState: vi.fn(() => ({
      activeWorkspace: null,
    })),
  },
}));

describe('authHelpers', () => {
  const PROFILE_CACHE_KEY = 'wi_profile_cache';

  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('readProfileCache', () => {
    it('returns null when cache is empty', () => {
      expect(readProfileCache('user-1')).toBeNull();
    });

    it('returns cached profile when userId matches', () => {
      const profile = { id: 'user-1', full_name: 'Ahmed' } as any;
      const freelancerProfile = { id: 'user-1', skills: ['React'] } as any;
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
        userId: 'user-1',
        profile,
        freelancerProfile,
      }));

      const result = readProfileCache('user-1');
      expect(result).toEqual({ profile, freelancerProfile });
    });

    it('returns null when userId does not match', () => {
      const profile = { id: 'user-1', full_name: 'Ahmed' } as any;
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
        userId: 'user-1',
        profile,
      }));

      expect(readProfileCache('user-2')).toBeNull();
    });

    it('returns null when cached data is malformed', () => {
      sessionStorage.setItem(PROFILE_CACHE_KEY, 'not-json');
      expect(readProfileCache('user-1')).toBeNull();
    });

    it('returns null when freelancerProfile is missing', () => {
      const profile = { id: 'user-1' } as any;
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
        userId: 'user-1',
        profile,
      }));

      const result = readProfileCache('user-1');
      expect(result).toEqual({ profile, freelancerProfile: null });
    });
  });

  describe('writeProfileCache', () => {
    it('writes profile to sessionStorage', () => {
      const profile = { id: 'user-1' } as any;
      const freelancerProfile = { id: 'user-1' } as any;
      writeProfileCache('user-1', profile, freelancerProfile);

      const stored = JSON.parse(sessionStorage.getItem(PROFILE_CACHE_KEY)!);
      expect(stored.userId).toBe('user-1');
      expect(stored.profile).toEqual(profile);
      expect(stored.freelancerProfile).toEqual(freelancerProfile);
    });

    it('handles null freelancerProfile', () => {
      const profile = { id: 'user-1' } as any;
      writeProfileCache('user-1', profile, null);

      const stored = JSON.parse(sessionStorage.getItem(PROFILE_CACHE_KEY)!);
      expect(stored.freelancerProfile).toBeNull();
    });
  });

  describe('clearProfileCache', () => {
    it('removes the cache from sessionStorage', () => {
      sessionStorage.setItem(PROFILE_CACHE_KEY, '{"userId":"user-1"}');
      clearProfileCache();
      expect(sessionStorage.getItem(PROFILE_CACHE_KEY)).toBeNull();
    });

    it('does not throw when cache is already empty', () => {
      expect(() => clearProfileCache()).not.toThrow();
    });
  });

  describe('resolveModeAvatarUrl', () => {
    const baseProfile = {
      id: 'user-1',
      avatar_url: '/avatars/base.jpg',
      avatar_url_freelancer: '/avatars/freelancer.jpg',
      avatar_url_client: '/avatars/client.jpg',
      active_mode: 'client',
    } as any;

    it('returns freelancer avatar when mode is freelancer', () => {
      expect(resolveModeAvatarUrl(baseProfile, 'freelancer')).toBe('/avatars/freelancer.jpg');
    });

    it('returns client avatar when mode is client', () => {
      expect(resolveModeAvatarUrl(baseProfile, 'client')).toBe('/avatars/client.jpg');
    });

    it('returns client avatar as fallback when freelancer avatar is missing', () => {
      const profile = { ...baseProfile, avatar_url_freelancer: null } as any;
      expect(resolveModeAvatarUrl(profile, 'freelancer')).toBe('/avatars/client.jpg');
    });

    it('falls back to profile.active_mode when no mode param', () => {
      expect(resolveModeAvatarUrl(baseProfile)).toBe('/avatars/client.jpg');
    });

    it('falls back to base avatar_url when no mode-specific avatar', () => {
      const profile = {
        ...baseProfile,
        avatar_url_freelancer: null,
        avatar_url_client: null,
      } as any;
      expect(resolveModeAvatarUrl(profile, 'freelancer')).toBe('/avatars/base.jpg');
    });

    it('uses workspace store when no mode param and profile.active_mode is missing', () => {
      const profile = { ...baseProfile, active_mode: null } as any;
      vi.mocked(useWorkspaceStore.getState).mockReturnValue({ activeWorkspace: 'client' } as any);
      expect(resolveModeAvatarUrl(profile)).toBe('/avatars/client.jpg');
    });
  });

  describe('withModeAwareAvatar', () => {
    it('returns profile with resolved avatar_url', () => {
      const profile = {
        id: 'user-1',
        avatar_url: '/base.jpg',
        avatar_url_freelancer: '/freelancer.jpg',
        avatar_url_client: '/client.jpg',
      } as any;

      const result = withModeAwareAvatar(profile, 'freelancer');
      expect(result.avatar_url).toBe('/freelancer.jpg');
      expect(result.id).toBe('user-1');
    });
  });

  describe('getPreferredLanguage', () => {
    // localStorage is mocked with vi.fn() in test setup — it doesn't store values.
    // We restore a real in-memory localStorage for these tests.
    let realStorage: Record<string, string>;
    let origLocalStorage: Storage;

    beforeEach(() => {
      realStorage = {};
      origLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: (key: string) => realStorage[key] ?? null,
          setItem: (key: string, val: string) => { realStorage[key] = val; },
          removeItem: (key: string) => { delete realStorage[key]; },
          clear: () => { realStorage = {}; },
          get length() { return Object.keys(realStorage).length; },
          key: (i: number) => Object.keys(realStorage)[i] ?? null,
        },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'localStorage', { value: origLocalStorage, writable: true, configurable: true });
    });

    it('returns ar as default', () => {
      expect(getPreferredLanguage()).toBe('ar');
    });

    it('returns stored language from i18n-language key', () => {
      window.localStorage.setItem('i18n-language', 'fr');
      expect(getPreferredLanguage()).toBe('fr');
    });

    it('returns stored language from language key', () => {
      window.localStorage.setItem('language', 'en');
      expect(getPreferredLanguage()).toBe('en');
    });

    it('prefers i18n-language over language key', () => {
      window.localStorage.setItem('i18n-language', 'en');
      window.localStorage.setItem('language', 'fr');
      expect(getPreferredLanguage()).toBe('en');
    });

    it('returns html lang attribute when no stored language', () => {
      document.documentElement.lang = 'fr';
      expect(getPreferredLanguage()).toBe('fr');
    });

    it('returns ar for invalid stored value', () => {
      document.documentElement.lang = 'ar';
      window.localStorage.setItem('i18n-language', 'de');
      expect(getPreferredLanguage()).toBe('ar');
    });
  });
});
