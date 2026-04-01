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
  isFullyReady: boolean;
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
  const MAX_LOADING_TIME = 4000;
  const PROFILE_RETRY_COOLDOWN = 30000;
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const activeMode = useWorkspaceStore((state) => state.activeWorkspace);

  // Track the currently loaded user ID to avoid stale closures in onAuthStateChange
  const loadedUserIdRef = useRef<string | null>(null);
  const lastProfileAttemptRef = useRef<{ userId: string | null; timestamp: number }>({ userId: null, timestamp: 0 });
  const userRef = useRef<User | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const freelancerProfileRef = useRef<FreelancerProfile | null>(null);
  // Prevents onAuthStateChange from overriding loading state while signIn/signUp is actively managing it
  const manualSignInInProgressRef = useRef(false);
  // Tracks whether initAuth() has already loaded the profile for this session.
  // Prevents the onAuthStateChange SIGNED_IN handler from redundantly re-fetching
  // the profile and flipping the workspace.
  const initAuthCompletedForRef = useRef<string | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    freelancerProfileRef.current = freelancerProfile;
  }, [freelancerProfile]);

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
        // Only reset to client default if the workspace was never explicitly set
        // for a loaded user. This prevents flashing 'client' during sign-out transitions.
        if (!loadedUserIdRef.current) {
          store.setWorkspace('client');
        }
        return;
      }

      const desiredWorkspace = getInitialWorkspace(nextProfile, nextFreelancerProfile);
      const currentWorkspace = store.activeWorkspace;

      // If the workspace is already set to a value the user's profile supports,
      // do NOT overwrite it. This prevents the flip-flop where multiple fetchProfile
      // calls (from initAuth + onAuthStateChange) keep re-deriving the workspace
      // from the DB active_mode, causing redirects.
      const capabilities = getWorkspaceCapabilities(nextProfile.user_type);
      const currentIsValid = capabilities.includes(currentWorkspace);
      
      if (currentIsValid && loadedUserIdRef.current === nextProfile.id) {
        // Workspace already set to a valid value for this user — don't flip it.
        store.setSwitching(false);
        return;
      }

      store.setWorkspace(desiredWorkspace);
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

      await supabaseWithRetry(
        () =>
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
              ignoreDuplicates: true,
            }
          ),
        { timeoutMs: 10000 }
      );
    },
    [getPreferredLanguage]
  );

  const fetchProfile = useCallback(
    async (userId: string, forceUserObj?: User) => {
      lastProfileAttemptRef.current = { userId, timestamp: Date.now() };
      const previousProfile = profileRef.current?.id === userId ? profileRef.current : null;
      const previousFreelancerProfile = previousProfile ? freelancerProfileRef.current : null;
      const currentUser = forceUserObj || userRef.current;

      try {
        const loadProfile = () =>
          supabaseWithRetry(
            () => supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
            { timeoutMs: 10000 }
          );

        let profileResult = await loadProfile();

        if (!profileResult.data && currentUser?.id === userId) {
          await ensureProfileExists(currentUser);
          profileResult = await supabaseWithRetry(() =>
            supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
            { timeoutMs: 10000 }
          );
        } else if (!profileResult.data) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          profileResult = await loadProfile();
        }

        const nextProfile = profileResult.data;
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
          const { data } = await supabaseWithRetry(
            () => supabase.from('freelancer_profiles').select('*').eq('id', userId).maybeSingle(),
            { timeoutMs: 10000 }
          );
          nextFreelancerProfile = data;
        }

        setFreelancerProfile(nextFreelancerProfile);
        syncWorkspaceFromProfile(nextProfile, nextFreelancerProfile);

        return { profile: nextProfile, freelancerProfile: nextFreelancerProfile };
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        const isTimeoutError = message.includes('timed out after');

        if (isTimeoutError) {
          logger.warn('Profile fetch timed out; continuing with current UI state');
        } else {
          logger.error('Error fetching profile:', error);
        }

        if (previousProfile) {
          setProfile(previousProfile);
          setFreelancerProfile(previousFreelancerProfile);
          syncWorkspaceFromProfile(previousProfile, previousFreelancerProfile);
          return { profile: previousProfile, freelancerProfile: previousFreelancerProfile };
        }

        setProfile(null);
        setFreelancerProfile(null);
        syncWorkspaceFromProfile(null, null);
        return { profile: null, freelancerProfile: null };
      }
    },
    [ensureProfileExists, syncWorkspaceFromProfile]
  );

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (window.location.pathname === '/auth/callback') {
        if (mounted) {
          setIsProfileReady(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const {
          data: { session: currentSession },
          error,
        } = await withTimeout(supabase.auth.getSession(), 8000, 'Initialize session');

        if (error) {
          logger.error('Error in getSession:', error);
        }

        if (mounted && currentSession) {
          const isEmailAuth = currentSession.user.app_metadata?.provider === 'email';
          if (isEmailAuth && !currentSession.user.email_confirmed_at) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            return;
          }

          setIsProfileReady(false);
          setSession(currentSession);
          setUser(currentSession.user);
          loadedUserIdRef.current = currentSession.user.id;
          await fetchProfile(currentSession.user.id, currentSession.user);
          // Mark that initAuth has completed loading for this user.
          // This prevents the onAuthStateChange SIGNED_IN handler from
          // redundantly re-fetching the profile and flipping the workspace.
          initAuthCompletedForRef.current = currentSession.user.id;
        }
      } catch (error) {
        logger.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsProfileReady(true);
          setIsLoading(false);
        }
      }
    };

    void initAuth();

    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      try {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Ignore background auth churn events to prevent unnecessary loading
        // flashes and duplicate profile fetches.
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          return;
        }

        // If initAuth already fully loaded the profile for this exact user,
        // skip the SIGNED_IN handler entirely. This is the primary fix for
        // the workspace flip-flop bug: initAuth and SIGNED_IN were both
        // calling fetchProfile → syncWorkspaceFromProfile, causing the
        // workspace (and therefore the dashboard) to change multiple times.
        if (
          event === 'SIGNED_IN' &&
          newSession?.user &&
          initAuthCompletedForRef.current === newSession.user.id
        ) {
          return;
        }

        if (newSession?.user) {
          const isEmailAuth = newSession.user.app_metadata?.provider === 'email';
          if (isEmailAuth && !newSession.user.email_confirmed_at) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            return;
          }

          // If signInWithEmail / signUpWithEmail is actively handling this sign-in,
          // skip the listener's full-screen loading cycle to prevent a race condition
          // where the listener resets isProfileReady to false AFTER signInWithEmail
          // already fetched the profile and set it to true.
          if (manualSignInInProgressRef.current) {
            return;
          }

          // Only show full-screen loading if we don't already have the profile data.
          // The loadedUserIdRef bypasses the stale closure of the state variables here.
          const isFirstLoadTracker = loadedUserIdRef.current !== newSession.user.id;
          const hasLoadedProfile = profileRef.current?.id === newSession.user.id;

          // If we ALREADY loaded the UI for this user, do not block the UI again.
          // Just fetch the profile in the background. This prevents infinite loading loops
          // if profile fetching fails via RLS/network but token refreshes keep triggering events.
          if (!isFirstLoadTracker) {
            if (hasLoadedProfile) {
                loadedUserIdRef.current = newSession.user.id;
                await fetchProfile(newSession.user.id, newSession.user);
            } else {
                const lastAttempt = lastProfileAttemptRef.current;
                const shouldRetryProfile =
                  lastAttempt.userId !== newSession.user.id ||
                  Date.now() - lastAttempt.timestamp > PROFILE_RETRY_COOLDOWN;

                if (shouldRetryProfile) {
                  loadedUserIdRef.current = newSession.user.id;
                  void fetchProfile(newSession.user.id, newSession.user);
                }
            }
            return;
          }

          if (isFirstLoadTracker) {
            setIsLoading(true);
          }

          setIsProfileReady(false);
          await fetchProfile(newSession.user.id, newSession.user);
          loadedUserIdRef.current = newSession.user.id;

          if (mounted) {
            setIsProfileReady(true);
            if (isFirstLoadTracker) setIsLoading(false);
          }
          return;
        }

        loadedUserIdRef.current = null;
        setProfile(null);
        setFreelancerProfile(null);
        syncWorkspaceFromProfile(null, null);
        setIsProfileReady(true);
        setIsLoading(false);
      } catch (error) {
        logger.error('Error handling auth state change:', error);

        if (mounted) {
          setIsProfileReady(true);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [fetchProfile, syncWorkspaceFromProfile]);

  // Absolute loading safety net - only runs once on mount to prevent reset loops
  useEffect(() => {
    const timer = window.setTimeout(() => {
        logger.warn('Auth absolute loading timeout - forcing ready state');
        setIsLoading(false);
        setIsProfileReady(true);
    }, MAX_LOADING_TIME);

    return () => window.clearTimeout(timer);
  }, []); // Empty dependency array ensures this is an absolute timeout

  const signInWithEmail = async (email: string, password: string) => {
    manualSignInInProgressRef.current = true;
    setIsProfileReady(false);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsProfileReady(true);
        throw error;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        loadedUserIdRef.current = data.session.user.id;
        await fetchProfile(data.session.user.id, data.session.user);
        setIsProfileReady(true);
      }
    } finally {
      manualSignInInProgressRef.current = false;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    manualSignInInProgressRef.current = true;
    setIsProfileReady(false);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            preferred_language: getPreferredLanguage(),
          },
        },
      });

      if (error) {
        setIsProfileReady(true);
        throw error;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        loadedUserIdRef.current = data.session.user.id;
        await fetchProfile(data.session.user.id, data.session.user);
        setIsProfileReady(true);
      }
    } finally {
      manualSignInInProgressRef.current = false;
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
    manualSignInInProgressRef.current = false;
    loadedUserIdRef.current = null;
    initAuthCompletedForRef.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);
    setFreelancerProfile(null);
    syncWorkspaceFromProfile(null, null);
    setIsProfileReady(true);

    // Clear Sentry user context in production
    if (import.meta.env.PROD && Sentry) {
      Sentry.setUser(null);
    }

    clearAllAuthData();

    void Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Signout timeout')), 3000)),
      ]).catch((error) => {
        logger.warn('Supabase signOut call failed, but local cleanup completed:', error);
      });

    clearAllAuthData();
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    if (!profile) {
      await ensureProfileExists(user);
    }

    await supabaseWithRetry(
      () =>
        supabase
          .from('profiles')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id),
      { timeoutMs: 10000 }
    );

    const nextProfile = profile ? { ...profile, ...data } : ({ id: user.id, ...data } as Profile);
    setProfile(nextProfile);
    syncWorkspaceFromProfile(nextProfile, freelancerProfile);

    if (
      nextProfile.onboarding_completed ||
      nextProfile.client_onboarding_completed ||
      nextProfile.freelancer_onboarding_completed
    ) {
      persistUserTypeSelectionMarker(user.id);
    }
  };

  const updateFreelancerProfile = async (data: Partial<FreelancerProfile>) => {
    if (!user) throw new Error('No user logged in');

    const safeData = sanitizeFreelancerProfileData(data as Record<string, unknown>) as Partial<FreelancerProfile>;

    await supabaseWithRetry(
      () =>
        supabase.from('freelancer_profiles').upsert(
          {
            id: user.id,
            ...safeData,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'id',
          }
        ),
      { timeoutMs: 10000 }
    );

    const nextFreelancerProfile = freelancerProfile
      ? { ...freelancerProfile, ...safeData }
      : (safeData as FreelancerProfile);

    setFreelancerProfile(nextFreelancerProfile);
    syncWorkspaceFromProfile(profile, nextFreelancerProfile);
  };

  const setUserType = async (userType: UserType) => {
    if (!user) throw new Error('No user logged in');

    const {
      data: { session: liveSession },
      error: sessionError,
    } = await withTimeout(supabase.auth.getSession(), 5000, 'Set user type session');

    if (sessionError) {
      logger.error('setUserType getSession error:', sessionError);
      throw sessionError;
    }

    if (!liveSession) throw new Error('No session token');

    const nextMode: Workspace = userType === 'client' ? 'client' : 'freelancer';

    await supabaseWithRetry(
      () =>
        supabase.rpc('set_user_type_rpc', {
          p_user_type: userType,
          p_active_mode: nextMode,
        }),
      { timeoutMs: 15000 }
    );

    useWorkspaceStore.getState().setWorkspace(nextMode);
    persistUserTypeSelectionMarker(user.id);
    await fetchProfile(user.id);
  };

  const refreshProfile = useCallback(async () => {
    const currentUserId = userRef.current?.id;
    if (currentUserId) {
      await fetchProfile(currentUserId);
    }
  }, [fetchProfile]);

  const availableModes = useMemo(() => {
    return Array.from(new Set([...getWorkspaceCapabilities(profile?.user_type), activeMode])) as AccountMode[];
  }, [activeMode, profile?.user_type]);

  const isFullyReady = !isLoading && isProfileReady;

  const value: AuthContextType = {
    user,
    session,
    profile,
    freelancerProfile,
    activeMode,
    availableModes,
    isLoading,
    isFullyReady,
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
