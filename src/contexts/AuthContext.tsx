import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { clearAllAuthData } from '../lib/authUtils';
import type { Profile, FreelancerProfile, UserType } from '../types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    freelancerProfile: FreelancerProfile | null;
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

    // Fetch user profile from database
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                logger.error('Error fetching profile:', profileError);
                return;
            }

            if (profileData) {
                setProfile(profileData as Profile);

                // If user is a freelancer, fetch freelancer profile
                if (profileData.user_type === 'freelancer' || profileData.user_type === 'both') {
                    const { data: freelancerData, error: freelancerError } = await supabase
                        .from('freelancer_profiles')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    if (!freelancerError && freelancerData) {
                        setFreelancerProfile(freelancerData as FreelancerProfile);
                    }
                }
            }
        } catch (error) {
            logger.error('Error fetching profile:', error);
        }
    }, []);

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
                    fetchProfile(currentSession.user.id).catch(e => logger.error('Profile fetch error', e));
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
        }, 2000);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                if (!mounted) return;

                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (newSession?.user) {
                    await fetchProfile(newSession.user.id);
                } else {
                    setProfile(null);
                    setFreelancerProfile(null);
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
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
    };

    // Sign up with email and password
    const signUpWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;
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

        await updateProfile({ user_type: userType });

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
    };

    // Refresh profile data
    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    const value: AuthContextType = {
        user,
        session,
        profile,
        freelancerProfile,
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
