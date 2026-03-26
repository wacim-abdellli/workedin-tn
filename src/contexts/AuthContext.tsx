import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { clearAllAuthData } from '@/lib/authUtils';
import { logger } from '@/lib/logger';
import { supabase, withTimeout } from '@/lib/supabase';
import { useWorkspaceStore, type Workspace } from '@/lib/workspaceState';
import { getInitialWorkspace, getWorkspaceCapabilities } from '@/lib/workspaceRoutes';
import type { AccountMode, FreelancerProfile, Language, Profile, UserType } from '@/types';

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

  const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
  const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  // Raw REST helper — bypasses the supabase-js internal token-refresh mutex
  const rawGet = useCallback(<T,>(path: string, token?: string | null): Promise<T | null> => {
    const headers: Record<string, string> = { 'apikey': SUPA_KEY, 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(`${SUPA_URL}/rest/v1/${path}`, { headers })
      .then(res => {
        if (!res.ok) return null;
        return res.json().then((data: T[] | T) => Array.isArray(data) ? (data[0] ?? null) : data as T);
      })
      .catch(() => null);
  }, [SUPA_KEY, SUPA_URL]);

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

      const { error } = await withTimeout(
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
        ),
        15000,
        'ensureProfileExists (upsert profiles)'
      );

      if (error) {
        logger.error('ensureProfileExists error:', error);
        throw error;
      }
    },
    [getPreferredLanguage]
  );

 const fetchProfile = useCallback(
    async (userId: string, token?: string | null) => {
      try {
        // Use raw REST calls to bypass the supabase-js internal token-refresh mutex
        const profileData = await rawGet<Profile>(
          `profiles?id=eq.${userId}&select=*`,
          token
        );

        // If not found, retry once after 1.5s (handle_new_user trigger may still be running)
        let nextProfile = profileData;
        if (!nextProfile) {
          await new Promise(r => setTimeout(r, 1500));
          nextProfile = await rawGet<Profile>(`profiles?id=eq.${userId}&select=*`, token);
        }

        if (!nextProfile) {
          setProfile(null);
          setFreelancerProfile(null);
          syncWorkspaceFromProfile(null, null);
          return { profile: null, freelancerProfile: null };
        }

        setProfile(nextProfile);

        let nextFreelancerProfile: FreelancerProfile | null = null;
        if (nextProfile.user_type === 'freelancer' || nextProfile.user_type === 'both') {
          nextFreelancerProfile = await rawGet<FreelancerProfile>(
            `freelancer_profiles?id=eq.${userId}&select=*`,
            token
          );
        }

        setFreelancerProfile(nextFreelancerProfile);
        syncWorkspaceFromProfile(nextProfile, nextFreelancerProfile);

        return { profile: nextProfile, freelancerProfile: nextFreelancerProfile };
      } catch (error) {
        logger.error('Error fetching profile:', error);
        return { profile: null, freelancerProfile: null };
      }
    },
    [rawGet, syncWorkspaceFromProfile]
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
          await fetchProfile(currentSession.user.id, currentSession.access_token);
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
        await fetchProfile(newSession.user.id, newSession.access_token);
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
      await fetchProfile(data.session.user.id, data.session.access_token);
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
      await fetchProfile(data.session.user.id, data.session.access_token);
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

    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      logger.error('updateProfile error:', error);
      throw error;
    }

    setProfile((prev) => (prev ? { ...prev, ...data } : (data as Profile)));
  };

  const updateFreelancerProfile = async (data: Partial<FreelancerProfile>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase.from('freelancer_profiles').upsert(
      {
        id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      }
    );

    if (error) {
      logger.error('updateFreelancerProfile error:', error);
      throw error;
    }

    setFreelancerProfile((prev) => (prev ? { ...prev, ...data } : (data as FreelancerProfile)));
  };

  const setUserType = async (userType: UserType) => {
    if (!user) throw new Error('No user logged in');
    if (!session?.access_token) throw new Error('No session token');

    const nextMode: Workspace = userType === 'client' ? 'client' : 'freelancer';

    // CRITICAL FIX: Use raw fetch instead of supabase.rpc() or supabase.from().update()
    // The supabase-js browser client has a known internal lock where it hangs indefinitely
    // waiting to refresh tokens before making ANY query, even when a valid token already exists.
    // By using window.fetch directly with the session token, we completely bypass this lock.
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    const rpcResponse = await Promise.race([
      fetch(`${supabaseUrl}/rest/v1/rpc/set_user_type_rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          p_user_type: userType,
          p_active_mode: nextMode,
        }),
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('setUserType raw fetch timed out after 15000ms')), 15000)
      ),
    ]);

    if (!rpcResponse.ok) {
      const errText = await rpcResponse.text();
      logger.error('setUserType raw fetch error:', errText);
      throw new Error(errText || `HTTP ${rpcResponse.status}`);
    }

    useWorkspaceStore.getState().setWorkspace(nextMode);
    await fetchProfile(user.id, session.access_token);
  };

  const refreshProfile = async () => {
    if (user && session?.access_token) {
      await fetchProfile(user.id, session.access_token);
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
