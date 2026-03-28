import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { clearAllAuthData } from '@/lib/authUtils';
import { logger } from '@/lib/logger';
import { sanitizeFreelancerProfileData } from '@/lib/schemaValidation';
import { supabase, withTimeout } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import { useWorkspaceStore, type Workspace } from '@/lib/workspaceState';
import {
  getInitialWorkspace,
  getWorkspaceCapabilities,
  persistUserTypeSelectionMarker,
} from '@/lib/workspaceRoutes';
import type { AccountMode, FreelancerProfile, Language, Profile, UserType } from '@/types';

// Lazy import Sentry to avoid circular dependencies
let Sentry: typeof import('@/lib/sentry').Sentry | null = null;
if (import.meta.env.PROD) {
  import('@/lib/sentry').then((module) => {
    Sentry = module.Sentry;
  });
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  freelancerProfile: FreelancerProfile | null;
  activeMode: AccountMode;
  availableModes: AccountMode[];
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  updateFreelancerProfile: (data: Partial<FreelancerProfile>) => Promise<void>;
  setUserType: (userType: UserType) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeMode = useWorkspaceStore((state) => state.activeWorkspace);

  // Track the currently loaded user ID to avoid stale closures in onAuthStateChange
  const loadedUserIdRef = useRef<string | null>(null);

  // Global Failsafe: If isLoading is stuck for more than 4 seconds, force it to false
  // This prevents infinite loading loops across the app (Login, ProtectedRoute, etc.)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  const getPreferredLanguage = useCallback((): Language => {
    if (typeof window === 'undefined') return 'ar';

    const storedLanguage = window.localStorage.getItem('language');
    if (storedLanguage === 'ar' || storedLanguage === 'fr' || storedLanguage === 'en') {
      return storedLanguage;
    }

    const htmlLanguage = document.documentElement.lang;
    if (htmlLanguage === 'ar' || htmlLanguage === 'fr' || htmlLanguage === 'en') {
      return htmlLanguage;
    }

    return 'ar';
  }, []);

  const syncWorkspaceFromProfile = useCallback(
    (nextProfile: Profile | null, nextFreelancerProfile: FreelancerProfile | null = null) => {
      const store = useWorkspaceStore.getState();

      if (!nextProfile) {
        store.setSwitching(false);
        store.setWorkspace('client');
        return;
      }

      const workspace = getInitialWorkspace(nextProfile, nextFreelancerProfile);
      store.setWorkspace(workspace);
      store.setSwitching(false);
    },
    []
  );

  const ensureProfileExists = useCallback(
    async (authUser: User) => {
      const fallbackName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'Khedma User';

      await withTimeout(
        supabaseWithRetry(() =>
          supabase.from('profiles').upsert(
            {
              id: authUser.id,
              email: authUser.email ?? null,
              full_name: fallbackName,
              preferred_language: getPreferredLanguage(),
              onboarding_completed: false,
              active_mode: 'client',
            },
            {
              onConflict: 'id',
            }
          )
        ),
        15000,
        'ensureProfileExists (upsert profiles)'
      );
    },
    [getPreferredLanguage]
  );

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          logger.warn('fetchProfile getSession error:', sessionError);
        }

        const loadProfile = async () => {
          const { data } = await supabaseWithRetry(() =>
            supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
          );
          return data;
        };

        // If not found, retry once after 1.5s (handle_new_user trigger may still be running)
        let nextProfile = await loadProfile();
        if (!nextProfile) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          nextProfile = await loadProfile();
        }

        if (!nextProfile) {
          setProfile(null);
          setFreelancerProfile(null);
          syncWorkspaceFromProfile(null, null);
          return { profile: null, freelancerProfile: null };
        }

        setProfile(nextProfile);

        // Set Sentry user context in production
        if (import.meta.env.PROD && Sentry && nextProfile) {
          Sentry.setUser({
            id: nextProfile.id,
            email: nextProfile.email || undefined,
            username: nextProfile.full_name || undefined,
          });
        }

        if (
          nextProfile.onboarding_completed ||
          nextProfile.client_onboarding_completed ||
          nextProfile.freelancer_onboarding_completed
        ) {
          persistUserTypeSelectionMarker(nextProfile.id);
        }

        let nextFreelancerProfile: FreelancerProfile | null = null;
        if (nextProfile.user_type === 'freelancer' || nextProfile.user_type === 'both') {
          const { data } = await supabaseWithRetry(() =>
            supabase.from('freelancer_profiles').select('*').eq('id', userId).maybeSingle()
          );
          nextFreelancerProfile = data;
        }

        setFreelancerProfile(nextFreelancerProfile);
        syncWorkspaceFromProfile(nextProfile, nextFreelancerProfile);

        return { profile: nextProfile, freelancerProfile: nextFreelancerProfile };
      } catch (error) {
        logger.error('Error fetching profile:', error);
        return { profile: null, freelancerProfile: null };
      }
    },
    [syncWorkspaceFromProfile]
  );

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (window.location.pathname === '/auth/callback') {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          logger.error('Error in getSession:', error);
        }

        if (mounted && currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        }
      } catch (error) {
        logger.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void initAuth();

    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Ignore token refresh churn to prevent unnecessary loading flashes
      // when the user switches tabs and comes back.
      if (event === 'TOKEN_REFRESHED') {
        return;
      }

      if (newSession?.user) {
        // Only show full-screen loading if we don't already have the profile data.
        // The loadedUserIdRef bypasses the stale closure of the state variables here.
        const isFirstLoadTracker = loadedUserIdRef.current !== newSession.user.id;
        if (isFirstLoadTracker) {
          setIsLoading(true);
        }
        await fetchProfile(newSession.user.id);
        loadedUserIdRef.current = newSession.user.id;
        if (mounted && isFirstLoadTracker) setIsLoading(false);
      } else {
        loadedUserIdRef.current = null;
        setProfile(null);
        setFreelancerProfile(null);
        syncWorkspaceFromProfile(null, null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [fetchProfile, syncWorkspaceFromProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
      await fetchProfile(data.session.user.id);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          preferred_language: getPreferredLanguage(),
        },
      },
    });

    if (error) throw error;

    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
      await fetchProfile(data.session.user.id);
    }
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone.startsWith('+216') ? phone : `+216${phone}`,
    });

    if (error) throw error;
  };

  const verifyOtp = async (phone: string, token: string) => {
    const fullPhone = phone.startsWith('+216') ? phone : `+216${phone}`;

    const { error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token,
      type: 'sms',
    });

    if (error) throw error;
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setFreelancerProfile(null);
    syncWorkspaceFromProfile(null, null);

    // Clear Sentry user context in production
    if (import.meta.env.PROD && Sentry) {
      Sentry.setUser(null);
    }

    clearAllAuthData();

    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Signout timeout')), 3000)),
      ]);
    } catch (error) {
      logger.warn('Supabase signOut call failed, but local cleanup completed:', error);
    }

    clearAllAuthData();
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    if (!profile) {
      await ensureProfileExists(user);
    }

    await supabaseWithRetry(() =>
      supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    );

    setProfile((prev) => (prev ? { ...prev, ...data } : (data as Profile)));
  };

  const updateFreelancerProfile = async (data: Partial<FreelancerProfile>) => {
    if (!user) throw new Error('No user logged in');

    const safeData = sanitizeFreelancerProfileData(data as Record<string, unknown>) as Partial<FreelancerProfile>;

    await supabaseWithRetry(() =>
      supabase.from('freelancer_profiles').upsert(
        {
          id: user.id,
          ...safeData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        }
      )
    );

    setFreelancerProfile((prev) => (prev ? { ...prev, ...safeData } : (safeData as FreelancerProfile)));
  };

  const setUserType = async (userType: UserType) => {
    if (!user) throw new Error('No user logged in');

    const {
      data: { session: liveSession },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      logger.error('setUserType getSession error:', sessionError);
      throw sessionError;
    }

    if (!liveSession) throw new Error('No session token');

    const nextMode: Workspace = userType === 'client' ? 'client' : 'freelancer';

    await withTimeout(
      supabaseWithRetry(() =>
        supabase.rpc('set_user_type_rpc', {
          p_user_type: userType,
          p_active_mode: nextMode,
        })
      ),
      15000,
      'setUserType rpc'
    );

    useWorkspaceStore.getState().setWorkspace(nextMode);
    persistUserTypeSelectionMarker(user.id);
    await fetchProfile(user.id);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const availableModes = useMemo(() => {
    return Array.from(new Set([...getWorkspaceCapabilities(profile?.user_type), activeMode])) as AccountMode[];
  }, [activeMode, profile?.user_type]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    freelancerProfile,
    activeMode,
    availableModes,
    isLoading,
    isAuthenticated: !!user,
    signInWithEmail,
    signUpWithEmail,
    signInWithPhone,
    verifyOtp,
    signOut,
    updateProfile,
    updateFreelancerProfile,
    setUserType,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useActiveWorkspace() {
  return useWorkspaceStore((state) => state.activeWorkspace);
}
