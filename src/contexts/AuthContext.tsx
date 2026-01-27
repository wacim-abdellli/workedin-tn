import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, FreelancerProfile, UserType } from '../types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    freelancerProfile: FreelancerProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
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
                console.error('Error fetching profile:', profileError);
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
            console.error('Error fetching profile:', error);
        }
    }, []);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);
                    await fetchProfile(currentSession.user.id);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
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
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // Send OTP to phone number
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

    // Sign out
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        setUser(null);
        setSession(null);
        setProfile(null);
        setFreelancerProfile(null);
    };

    // Update user profile
    const updateProfile = async (data: Partial<Profile>) => {
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', user.id);

        if (error) throw error;

        setProfile((prev) => (prev ? { ...prev, ...data } : null));
    };

    // Update freelancer profile
    const updateFreelancerProfile = async (data: Partial<FreelancerProfile>) => {
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('freelancer_profiles')
            .upsert({ id: user.id, ...data });

        if (error) throw error;

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
                    is_available: true,
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
