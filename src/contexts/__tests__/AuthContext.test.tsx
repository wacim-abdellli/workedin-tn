import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
// Now import the component and dependencies
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '@/lib/supabase';

// Wrapper component for testing hooks
function AuthWrapper({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Initial State', () => {
        it('should start with loading state', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            // Wait for initialization to complete
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });

        it('should have no user when not authenticated', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.user).toBeNull();
            expect(result.current.session).toBeNull();
            expect(result.current.profile).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('should provide all auth methods', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(typeof result.current.signInWithEmail).toBe('function');
            expect(typeof result.current.signUpWithEmail).toBe('function');
            expect(typeof result.current.signInWithPhone).toBe('function');
            expect(typeof result.current.verifyOtp).toBe('function');
            expect(typeof result.current.signOut).toBe('function');
            expect(typeof result.current.updateProfile).toBe('function');
            expect(typeof result.current.refreshProfile).toBe('function');
        });
    });

    describe('useAuth Hook', () => {
        it('should throw error when used outside AuthProvider', () => {
            // We need to suppress the error message from React
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            expect(() => {
                renderHook(() => useAuth());
            }).toThrow('useAuth must be used within an AuthProvider');

            consoleSpy.mockRestore();
        });
    });

    describe('Authentication Flow', () => {
        it('should call signInWithPassword on signInWithEmail', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.signInWithEmail('test@example.com', 'password123');
            });

            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        it('should call signUp on signUpWithEmail', async () => {
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

        it('should prepend +216 to phone if not present', async () => {
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

        it('should not add +216 if already present', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.signInWithPhone('+21655123456');
            });

            expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
                phone: '+21655123456',
            });
        });
    });

    describe('Sign Out', () => {
        it('should clear user state on sign out', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Sign out
            await act(async () => {
                await result.current.signOut();
            });

            expect(supabase.auth.signOut).toHaveBeenCalled();
            expect(result.current.user).toBeNull();
            expect(result.current.session).toBeNull();
            expect(result.current.profile).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('Profile Operations', () => {
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
    });

    describe('OTP Verification', () => {
        it('should call verifyOtp with correct parameters', async () => {
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

        it('should handle full phone number in verifyOtp', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.verifyOtp('+21655123456', '654321');
            });

            expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
                phone: '+21655123456',
                token: '654321',
                type: 'sms',
            });
        });
    });
});
