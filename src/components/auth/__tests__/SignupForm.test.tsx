import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mock modules BEFORE importing components
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            upsert: vi.fn().mockResolvedValue({ data: {}, error: null }),
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

import SignupForm from '../SignupForm';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { I18nProvider } from '@/i18n';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

// Test wrapper with all needed providers
function TestWrapper({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <I18nProvider>
                <ThemeProvider>
                    <ToastProvider>
                        <MemoryRouter>
                            <AuthProvider>
                                {children}
                            </AuthProvider>
                        </MemoryRouter>
                    </ToastProvider>
                </ThemeProvider>
            </I18nProvider>
        </QueryClientProvider>
    );
}

// Helper to get form inputs by name (language-independent)
const getEmailInput = () => document.querySelector('input[name="email"]') as HTMLInputElement;
const getPasswordInput = () => document.querySelector('input[name="password"]') as HTMLInputElement;
const getConfirmPasswordInput = () => document.querySelector('input[name="confirmPassword"]') as HTMLInputElement;

describe('SignupForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    describe('Rendering', () => {
        it('should render email step initially', async () => {
            render(<SignupForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                // Should show email form first (not user type selection)
                expect(getEmailInput()).toBeInTheDocument();
            });
        });

        it('should render all required input fields', async () => {
            render(<SignupForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(getEmailInput()).toBeInTheDocument();
                expect(getPasswordInput()).toBeInTheDocument();
                expect(getConfirmPasswordInput()).toBeInTheDocument();
            });
        });

        it('should render Google OAuth button', async () => {
            render(<SignupForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                // Google button has "Google" text in it
                expect(screen.getByText(/Google/i)).toBeInTheDocument();
            });
        });
    });

    describe('Form Fields', () => {
        it('should have password field with password type', async () => {
            render(<SignupForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(getPasswordInput()).toBeInTheDocument();
            });

            // Password input should have type password by default
            expect(getPasswordInput()).toHaveAttribute('type', 'password');
        });

        it('should have email field with email type', async () => {
            render(<SignupForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(getEmailInput()).toBeInTheDocument();
            });

            // Email should be type email
            expect(getEmailInput()).toHaveAttribute('type', 'email');
        });

        it('should have confirm password field', async () => {
            render(<SignupForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(getConfirmPasswordInput()).toBeInTheDocument();
            });

            // Confirm password should also be type password
            expect(getConfirmPasswordInput()).toHaveAttribute('type', 'password');
        });
    });

    describe('Successful Submission', () => {
        it('should call signUp on valid form submission', async () => {
            const user = userEvent.setup();
            render(<SignupForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(getEmailInput()).toBeInTheDocument();
            });

            // Fill valid form data
            await user.type(getEmailInput(), 'newuser@example.com');
            await user.type(getPasswordInput(), 'Password123');
            await user.type(getConfirmPasswordInput(), 'Password123');

            // Submit form
            const submitButton = screen.getByRole('button', { name: /إنشاء حساب|create account/i });
            await user.click(submitButton);

            // Should call signUp
            await waitFor(() => {
                expect(supabase.auth.signUp).toHaveBeenCalled();
            });
        });
    });
});
