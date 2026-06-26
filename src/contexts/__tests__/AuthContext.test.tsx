import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

const authMockState = vi.hoisted(() => {
    let callback: ((event: string, session: Session | null) => Promise<void> | void) | null = null;
    return {
        getCallback: () => callback,
        setCallback: (cb: (event: string, session: Session | null) => Promise<void> | void) => {
            callback = cb;
        },
        trigger: (event: string, session: Session | null) => {
            if (callback) {
                return callback(event, session);
            }
        }
    };
});

// Mock modules BEFORE importing the component
vi.mock('@/lib/supabase', () => ({
    withTimeout: vi.fn((promise) => promise),
    supabase: {
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
        })),
        removeChannel: vi.fn().mockResolvedValue(undefined),
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            update: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
            verifyOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
            signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
            signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
            onAuthStateChange: vi.fn((callback) => {
                authMockState.setCallback(callback);
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

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

// Wrapper component for testing hooks
function AuthWrapper({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
    );
}

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    afterEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
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
                options: {
                    data: {
                        preferred_language: 'ar',
                    },
                },
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

    describe('Extra AuthContext Coverage', () => {
        beforeEach(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        it('should sign out user on init if email is not confirmed', async () => {
            const unconfirmedSession = {
                user: {
                    id: 'unconfirmed-user',
                    email: 'unconfirmed@example.com',
                    app_metadata: { provider: 'email' },
                    email_confirmed_at: null,
                },
            } as unknown as Session;

            vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
                data: { session: unconfirmedSession },
                error: null,
            });

            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(supabase.auth.signOut).toHaveBeenCalled();
            expect(result.current.user).toBeNull();
        });

        it('should restore persisted workspace from localStorage on init', async () => {
            const mockSession = {
                user: {
                    id: 'restored-user-123',
                    email: 'restored@example.com',
                    app_metadata: { provider: 'google' },
                },
            } as unknown as Session;

            const mockProfile = {
                id: 'restored-user-123',
                email: 'restored@example.com',
                full_name: 'Restored User',
                user_type: 'freelancer' as const,
                active_mode: 'freelancer' as const,
            };

            vi.spyOn(supabase, 'from').mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
            } as any);

            localStorage.setItem('wi_workspace', JSON.stringify({ userId: 'restored-user-123', workspace: 'freelancer' }));

            vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
                data: { session: mockSession },
                error: null,
            });

            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.activeMode).toBe('freelancer');
        });

        it('should hydrate from session storage cache on init', async () => {
            const cachedUserSession = {
                user: {
                    id: 'cached-user-123',
                    email: 'cached@example.com',
                    app_metadata: { provider: 'google' },
                },
            } as unknown as Session;

            const mockProfile = {
                id: 'cached-user-123',
                email: 'cached@example.com',
                full_name: 'Cached User',
                user_type: 'client',
                active_mode: 'client',
            };

            sessionStorage.setItem('wi_profile_cache', JSON.stringify({
                userId: 'cached-user-123',
                profile: mockProfile,
                freelancerProfile: null,
            }));

            vi.spyOn(supabase, 'from').mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
            } as any);

            vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
                data: { session: cachedUserSession },
                error: null,
            });

            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.profile).toEqual(mockProfile);
        });

        it('should call signOut and clear state on TOKEN_REFRESHED with null session', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await authMockState.trigger('TOKEN_REFRESHED', null);
            });

            expect(supabase.auth.signOut).toHaveBeenCalled();
            expect(result.current.user).toBeNull();
            expect(result.current.session).toBeNull();
        });

        it('should sign out user on SIGNED_IN if email is not confirmed', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            const unconfirmedSession = {
                user: {
                    id: 'unconfirmed-user-2',
                    email: 'unconfirmed2@example.com',
                    app_metadata: { provider: 'email' },
                    email_confirmed_at: null,
                },
            } as unknown as Session;

            await act(async () => {
                await authMockState.trigger('SIGNED_IN', unconfirmedSession);
            });

            expect(supabase.auth.signOut).toHaveBeenCalled();
            expect(result.current.user).toBeNull();
        });

        it('should handle signInWithEmail error', async () => {
            vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
                data: { session: null, user: null },
                error: new Error('invalid credentials') as any,
            });

            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await expect(
                act(async () => {
                    await result.current.signInWithEmail('test@example.com', 'wrong');
                })
            ).rejects.toThrow('invalid credentials');
        });

        it('should handle signUpWithEmail error', async () => {
            vi.spyOn(supabase.auth, 'signUp').mockResolvedValueOnce({
                data: { session: null, user: null },
                error: new Error('user already exists') as any,
            });

            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await expect(
                act(async () => {
                    await result.current.signUpWithEmail('test@example.com', 'pass');
                })
            ).rejects.toThrow('user already exists');
        });

        it('should perform local signout even if Supabase API times out', async () => {
            vi.spyOn(supabase.auth, 'signOut').mockRejectedValueOnce(new Error('timeout'));

            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.signOut();
            });

            expect(result.current.user).toBeNull();
            expect(result.current.session).toBeNull();
        });

        it('should retry updateProfile and remove unsupported columns when schema cache mismatch error is thrown', async () => {
            const mockSession = {
                user: {
                    id: 'retry-user-123',
                    email: 'retry@example.com',
                    app_metadata: { provider: 'google' },
                },
            } as unknown as Session;

            const mockProfile = {
                id: 'retry-user-123',
                email: 'retry@example.com',
                full_name: 'Old Name',
                user_type: 'client' as const,
                active_mode: 'client' as const,
            };

            const mockEq = vi.fn()
                .mockResolvedValueOnce({
                    data: null,
                    error: { message: 'column "invalid_field" of relation "profiles" does not exist' }
                })
                .mockResolvedValue({ data: null, error: null });

            const mockUpdateResult = {
                eq: mockEq,
            };

            vi.spyOn(supabase, 'from').mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
                update: vi.fn().mockReturnValue(mockUpdateResult),
                upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
            } as any);

            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Force mock session to be active in context
            await act(async () => {
                await authMockState.trigger('SIGNED_IN', mockSession);
            });

            await act(async () => {
                await result.current.updateProfile({
                    full_name: 'New Name',
                    // @ts-expect-error - testing invalid field
                    invalid_field: 'some value',
                });
            });

            expect(mockEq).toHaveBeenCalled();
            expect(result.current.profile?.full_name).toBe('New Name');
        });

        it('should throw error when updating freelancer profile without user', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await expect(
                act(async () => {
                    await result.current.updateFreelancerProfile({ title: 'Designer' });
                })
            ).rejects.toThrow('No user logged in');
        });

        it('should throw error when setting user type without user', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await expect(
                act(async () => {
                    await result.current.setUserType('client');
                })
            ).rejects.toThrow('No user logged in');
        });

        it('should trigger RPC and set workspace in setUserType', async () => {
            const mockSession = {
                user: {
                    id: 'type-user-123',
                    email: 'type@example.com',
                },
            } as unknown as Session;

            vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
                data: { session: mockSession },
                error: null,
            });

            const mockProfile = {
                id: 'type-user-123',
                email: 'type@example.com',
                full_name: 'User Type Test',
                user_type: 'client' as const,
                active_mode: 'client' as const,
            };

            vi.spyOn(supabase, 'from').mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
            } as any);

            const { result } = renderHook(() => useAuth(), { wrapper: AuthWrapper });
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            // Force mock session to be active in context
            await act(async () => {
                await authMockState.trigger('SIGNED_IN', mockSession);
            });

            await act(async () => {
                await result.current.setUserType('client');
            });

            expect(supabase.rpc).toHaveBeenCalledWith('set_user_type_rpc', {
                p_user_type: 'client',
                p_active_mode: 'client',
            });
            expect(result.current.activeMode).toBe('client');
        });
    });
});
