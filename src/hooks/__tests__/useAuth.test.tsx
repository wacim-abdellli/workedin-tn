import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// Mock modules BEFORE importing the component
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        })),
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
            verifyOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
            signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
            signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
            onAuthStateChange: vi.fn((callback) => {
                callback('INITIAL_SESSION', null);
                return { data: { subscription: { unsubscribe: vi.fn() } } };
            }),
        },
    },
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Wrapper for testing hooks
function AuthWrapper({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Authentication State', () => {
        it('should return isAuthenticated as false when no user', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.user).toBeNull();
        });
    });

    describe('Login Functions', () => {
        it('should provide signInWithEmail function', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.signInWithEmail).toBe('function');
        });

        it('should call supabase signInWithPassword when signInWithEmail is called', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.signInWithEmail('test@example.com', 'password');
            });

            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password',
            });
        });

        it('should provide signInWithPhone function', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.signInWithPhone).toBe('function');
        });

        it('should format phone number with +216 prefix', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.signInWithPhone('55123456');
            });

            expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
                phone: '+21655123456',
            });
        });
    });

    describe('Signup Functions', () => {
        it('should provide signUpWithEmail function', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.signUpWithEmail).toBe('function');
        });

        it('should call supabase signUp when signUpWithEmail is called', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.signUpWithEmail('new@example.com', 'password123');
            });

            expect(supabase.auth.signUp).toHaveBeenCalledWith({
                email: 'new@example.com',
                password: 'password123',
            });
        });
    });

    describe('Logout Function', () => {
        it('should provide signOut function', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.signOut).toBe('function');
        });

        it('should call supabase signOut and clear state', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.signOut();
            });

            expect(supabase.auth.signOut).toHaveBeenCalled();
            expect(result.current.user).toBeNull();
            expect(result.current.session).toBeNull();
            expect(result.current.profile).toBeNull();
        });
    });

    describe('OTP Verification', () => {
        it('should provide verifyOtp function', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.verifyOtp).toBe('function');
        });

        it('should call supabase verifyOtp with correct params', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.verifyOtp('55123456', '123456');
            });

            expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
                phone: '+21655123456',
                token: '123456',
                type: 'sms',
            });
        });
    });

    describe('Profile Functions', () => {
        it('should provide updateProfile function', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.updateProfile).toBe('function');
        });

        it('should provide refreshProfile function', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.refreshProfile).toBe('function');
        });

        it('should throw error when updating profile without user', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await expect(
                act(async () => {
                    await result.current.updateProfile({ full_name: 'New Name' });
                })
            ).rejects.toThrow('No user logged in');
        });

        it('should provide setUserType function', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.setUserType).toBe('function');
        });
    });

    describe('Freelancer Profile Functions', () => {
        it('should provide updateFreelancerProfile function', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.updateFreelancerProfile).toBe('function');
        });

        it('should return freelancerProfile as null initially', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.freelancerProfile).toBeNull();
        });
    });
});
