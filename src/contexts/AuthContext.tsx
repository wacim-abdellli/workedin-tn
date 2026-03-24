import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { clearAllAuthData } from '../lib/authUtils';
import {
    canAccessMode,
    getAvailableModes,
    getModeTarget,
    persistAccountMode,
    promoteUserTypeForMode,
    resolveAccountMode,
} from '@/lib/accountMode';
import type { WorkspaceSwitchResult } from '@/lib/accountMode';
import type { Profile, FreelancerProfile, UserType, AccountMode, Language } from '../types';

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
    switchAccountMode: (mode: AccountMode) => Promise<WorkspaceSwitchResult>;
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
    const [modeOverride, setModeOverride] = useState<AccountMode | null>(null);

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

    const withTimeout = useCallback(async <T,>(promise: Promise<T>, label: string, timeoutMs: number = 8000): Promise<T> => {
        return await Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                window.setTimeout(() => reject(new Error(`${label}_timeout`)), timeoutMs)
            ),
        ]);
    }, []);

    const ensureProfileExists = useCallback(async (authUser: User) => {
        const fallbackName =
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split('@')[0] ||
            'Khedma User';

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: authUser.id,
                email: authUser.email ?? null,
                full_name: fallbackName,
                preferred_language: getPreferredLanguage(),
                onboarding_completed: false,
            });

        if (error) {
            logger.error('ensureProfileExists error:', error);
            throw error;
        }
    }, [getPreferredLanguage]);

    const persistWorkspaceState = useCallback(async (nextUserType: UserType, nextMode: AccountMode) => {
        if (!user) throw new Error('No user logged in');

        const basePayload = {
            user_type: nextUserType,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('profiles')
            .update({
                ...basePayload,
                active_mode: nextMode,
            })
            .eq('id', user.id);

        if (!error) {
            setProfile((prev) => (prev ? { ...prev, ...basePayload, active_mode: nextMode } : {
                ...(basePayload as Partial<Profile>),
                active_mode: nextMode,
            } as Profile));
            return;
        }

        const message = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
        const missingActiveModeColumn =
            message.includes('active_mode') &&
            (message.includes('column') || message.includes('schema cache'));

        if (!missingActiveModeColumn) {
            logger.error('persistWorkspaceState error:', error);
            throw error;
        }

        logger.warn('profiles.active_mode is unavailable remotely, falling back to local workspace persistence');

        const { error: fallbackError } = await supabase
            .from('profiles')
            .update(basePayload)
            .eq('id', user.id);

        if (fallbackError) {
            logger.error('persistWorkspaceState fallback error:', fallbackError);
            throw fallbackError;
        }

        setProfile((prev) => (prev ? { ...prev, ...basePayload } : basePayload as Profile));
    }, [user]);

    // Fetch user profile from database
    const fetchProfile = useCallback(async (userId: string, authUser?: User) => {
        try {
            const loadProfile = async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                return { data, error };
            };

            let { data: profileData, error: profileError } = await loadProfile();

            if (profileError?.code === 'PGRST116' && authUser) {
                await ensureProfileExists(authUser);
                const retryResult = await loadProfile();
                profileData = retryResult.data;
                profileError = retryResult.error;
            }

            if (profileError && profileError.code !== 'PGRST116') {
                logger.error('Error fetching profile:', profileError);
                return;
            }

            if (!profileData) {
                setProfile(null);
                setFreelancerProfile(null);
                return { profile: null, freelancerProfile: null };
            }

            setProfile(profileData as Profile);
            let nextFreelancerProfile: FreelancerProfile | null = null;

            // If user is a freelancer, fetch freelancer profile
            if (profileData.user_type === 'freelancer' || profileData.user_type === 'both') {
                const { data: freelancerData, error: freelancerError } = await supabase
                    .from('freelancer_profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (!freelancerError && freelancerData) {
                    nextFreelancerProfile = freelancerData as FreelancerProfile;
                    setFreelancerProfile(nextFreelancerProfile);
                } else {
                    setFreelancerProfile(null);
                }
            } else {
                setFreelancerProfile(null);
            }

            return {
                profile: profileData as Profile,
                freelancerProfile: nextFreelancerProfile,
            };
        } catch (error) {
            logger.error('Error fetching profile:', error);
            return { profile: null, freelancerProfile: null };
        }
    }, [ensureProfileExists]);

    // Initialize auth state
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            // Fast-path: If we are on the AuthCallback route, skip initializing.
            // Let the background provider exchange the code and the callback component handle reload.
            // This completely avoids the React StrictMode + getSession() deadlock.
            if (window.location.pathname === '/auth/callback') {
                if (mounted) setIsLoading(false);
                return;
            }

            try {
                const { data: { session: currentSession }, error } = await Promise.race([
                    supabase.auth.getSession(),
                    new Promise<{data: { session: null }, error: any}>((_, reject) => 
                        setTimeout(() => reject(new Error('getSession timeout')), 4000)
                    )
                ]);

                if (error) {
                    logger.error('Error in getSession:', error);
                }

                if (mounted && currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);
                    await fetchProfile(currentSession.user.id, currentSession.user);
                }
            } catch (error) {
                logger.error('Error initializing auth:', error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        initAuth();

        // Safety timeout (reduced to 2s)
        const timeoutId = setTimeout(() => {
            if (mounted) {
                setIsLoading((prev) => {
                    if (prev) {
                        logger.warn('Auth initialization slow, forcing completion');
                        return false;
                    }
                    return prev;
                });
            }
        }, 6000);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                if (!mounted) return;

                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (newSession?.user) {
                    setIsLoading(true);
                    await fetchProfile(newSession.user.id, newSession.user);
                    if (mounted) setIsLoading(false);
                } else {
                    setModeOverride(null);
                    setProfile(null);
                    setFreelancerProfile(null);
                    setIsLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // Sign in with email and password
    const signInWithEmail = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            await fetchProfile(data.session.user.id, data.session.user);
        }
    };

    // Sign up with email and password
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
            await fetchProfile(data.session.user.id, data.session.user);
        }
    };

    // Send OTP to phone number (keeping for compatibility)
    const signInWithPhone = async (phone: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            phone: phone.startsWith('+216') ? phone : `+216${phone}`,
        });

        if (error) throw error;
    };

    // Verify OTP
    const verifyOtp = async (phone: string, token: string) => {
        const fullPhone = phone.startsWith('+216') ? phone : `+216${phone}`;

        const { error } = await supabase.auth.verifyOtp({
            phone: fullPhone,
            token,
            type: 'sms',
        });

        if (error) throw error;
    };

    // Sign out - comprehensive logout with multiple cleanup strategies
    const signOut = async () => {
        // STEP 1: Immediately clear React state (synchronous)
        // This prevents any component from reading stale user data
        setUser(null);
        setSession(null);
        setModeOverride(null);
        setProfile(null);
        setFreelancerProfile(null);

        // STEP 2: Clear all browser storage (synchronous)
        // This prevents re-authentication from cached tokens
        clearAllAuthData();

        // STEP 3: Try to sign out from Supabase (async, but non-blocking)
        // We don't await this because we've already cleared local data
        try {
            // Use 'local' scope for immediate local token invalidation
            // Use 'global' would also invalidate tokens on other devices
            await Promise.race([
                supabase.auth.signOut({ scope: 'local' }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Signout timeout')), 3000)
                )
            ]);
        } catch (error) {
            // Log but don't throw - local cleanup already done
            logger.warn('Supabase signOut call failed, but local cleanup completed:', error);
        }

        // STEP 4: Final cleanup pass - ensure nothing remains
        clearAllAuthData();
    };

    // Update user profile (uses UPDATE for existing profiles)
    const updateProfile = async (data: Partial<Profile>) => {
        if (!user) throw new Error('No user logged in');

        if (!profile) {
            await ensureProfileExists(user);
        }

        // Use UPDATE (not upsert) for partial updates to avoid NOT NULL violations
        const { error } = await supabase
            .from('profiles')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (error) {
            logger.error('updateProfile error:', error);
            throw error;
        }

        setProfile((prev) => (prev ? { ...prev, ...data } : data as Profile));
    };

    // Update freelancer profile
    const updateFreelancerProfile = async (data: Partial<FreelancerProfile>) => {
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('freelancer_profiles')
            .upsert({
                id: user.id,
                ...data,
                updated_at: new Date().toISOString()
            });

        if (error) {
            logger.error('updateFreelancerProfile error:', error);
            throw error;
        }

        setFreelancerProfile((prev) => (prev ? { ...prev, ...data } : data as FreelancerProfile));
    };

    // Set user type and create freelancer profile if needed
    const setUserType = async (userType: UserType) => {
        if (!user) throw new Error('No user logged in');

        const nextMode: AccountMode = userType === 'client' ? 'client' : 'freelancer';

        if (!profile) {
            await ensureProfileExists(user);
        }

        persistAccountMode(nextMode, user.id);
        setModeOverride(nextMode);
        await persistWorkspaceState(userType, nextMode);

        // Create freelancer profile if user is freelancer or both
        if (userType === 'freelancer' || userType === 'both') {
            const { error } = await supabase
                .from('freelancer_profiles')
                .upsert({
                    id: user.id,
                    skills: [],
                    availability: 'available', // ✅ FIXED: Match schema (enum) instead of is_available boolean
                });

            if (error) throw error;
        }

        await fetchProfile(user.id, user);
    };

    const switchAccountMode = async (mode: AccountMode): Promise<WorkspaceSwitchResult> => {
        if (!user) throw new Error('No user logged in');

        if (mode === activeMode && profile) {
            const currentTarget = getModeTarget(profile, freelancerProfile, mode);
            return {
                mode,
                userType: profile.user_type ?? mode,
                targetPath: currentTarget.path,
                isOnboarded: currentTarget.isOnboarded,
            };
        }

        if (!profile) {
            await ensureProfileExists(user);
        }

        const previousMode = canAccessMode(profile, activeMode) ? activeMode : resolveAccountMode(profile, freelancerProfile);
        const nextUserType = promoteUserTypeForMode(profile?.user_type, mode);
        const previousProfile = profile;
        const previousFreelancerProfile = freelancerProfile;

        try {
            persistAccountMode(mode, user.id);
            setModeOverride(mode);

            if (nextUserType !== profile?.user_type || profile?.active_mode !== mode) {
                await withTimeout(persistWorkspaceState(nextUserType, mode), 'workspace_persist');
            }

            let optimisticFreelancerProfile = freelancerProfile;
            if (mode === 'freelancer') {
                optimisticFreelancerProfile = freelancerProfile ?? {
                    id: user.id,
                    skills: [],
                    availability: 'available',
                    completion_rate: 0,
                    repeat_clients: 0,
                    cin_verified: false,
                    total_earnings: 0,
                    created_at: new Date().toISOString(),
                } as FreelancerProfile;
                setFreelancerProfile((prev) => prev ?? optimisticFreelancerProfile);

                const { error } = await withTimeout(
                    (async () => await supabase
                        .from('freelancer_profiles')
                        .upsert({
                            id: user.id,
                            skills: [],
                            availability: 'available',
                        }))(),
                    'freelancer_profile_upsert'
                ) as { error: unknown };

                if (error) {
                    logger.error('switchAccountMode freelancer upsert error:', error);
                    throw error;
                }
            }

            const nextProfile = {
                ...profile,
                id: user.id,
                user_type: nextUserType,
                active_mode: mode,
            } as Profile;
            setProfile((prev) => prev ? { ...prev, user_type: nextUserType, active_mode: mode } : nextProfile);

            const target = getModeTarget(nextProfile, optimisticFreelancerProfile, mode);

            void withTimeout(fetchProfile(user.id, user), 'workspace_refresh', 10000).catch((error) => {
                logger.warn('Background workspace refresh failed:', error);
            });

            return {
                mode,
                userType: nextUserType,
                targetPath: target.path,
                isOnboarded: target.isOnboarded,
            };
        } catch (error) {
            persistAccountMode(previousMode, user.id);
            setModeOverride(previousMode);
            setProfile(previousProfile);
            setFreelancerProfile(previousFreelancerProfile);
            throw error;
        }
    };

    // Refresh profile data
    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id, user);
        }
    };

    useEffect(() => {
        if (!profile?.id) return;

        if (profile.active_mode && canAccessMode(profile, profile.active_mode)) {
            persistAccountMode(profile.active_mode, profile.id);
        }

        if (!modeOverride) return;

        // Keep the override alive until the persisted profile catches up.
        // Clearing it too early causes the app to snap back to the old workspace
        // while the DB update is still in flight.
        if (profile.active_mode === modeOverride || resolveAccountMode(profile, freelancerProfile) === modeOverride) {
            setModeOverride(null);
        }
    }, [freelancerProfile, modeOverride, profile]);

    const effectiveProfile = useMemo(() => {
        if (!modeOverride) return profile;

        const nextUserType = promoteUserTypeForMode(profile?.user_type, modeOverride);

        return {
            ...(profile ?? {}),
            id: profile?.id ?? user?.id,
            user_type: nextUserType,
            active_mode: modeOverride,
        } as Profile;
    }, [modeOverride, profile, user?.id]);

    const resolvedMode = resolveAccountMode(effectiveProfile, freelancerProfile);
    const activeMode = modeOverride ?? resolvedMode;
    const availableModes = getAvailableModes(effectiveProfile);

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
        switchAccountMode,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access the authentication context.
 * Provides user object, session, profile data, and auth methods (login, signup, logout).
 * 
 * @hook
 * @returns {AuthContextType} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * const { user, signInWithEmail } = useAuth();
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
