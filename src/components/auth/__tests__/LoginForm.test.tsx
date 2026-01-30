import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mock modules BEFORE importing components
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

import LoginForm from '../LoginForm';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { I18nProvider } from '@/i18n';
import { supabase } from '@/lib/supabase';

// Test wrapper with all needed providers
function TestWrapper({ children }: { children: ReactNode }) {
    return (
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
    );
}

// Helper to get email input by name (language-independent)
const getEmailInput = () => document.querySelector('input[name="email"]') as HTMLInputElement;
const getPasswordInput = () => document.querySelector('input[name="password"]') as HTMLInputElement;

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the login form correctly', async () => {
            render(<LoginForm />, { wrapper: TestWrapper });

            // Wait for form to render
            await waitFor(() => {
                expect(getEmailInput()).toBeInTheDocument();
            });

            // Check for email input
            expect(getEmailInput()).toBeInTheDocument();

            // Check for password input
            expect(getPasswordInput()).toBeInTheDocument();

            // Check for submit button
            expect(screen.getByRole('button', { name: /login|تسجيل الدخول/i })).toBeInTheDocument();
        });

        it('should render switch to signup link when callback provided', async () => {
            const onSwitchToSignup = vi.fn();
            render(<LoginForm onSwitchToSignup={onSwitchToSignup} />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /signup|إنشاء حساب/i })).toBeInTheDocument();
            });
        });
    });

    describe('Validation', () => {
        it('should have password field with password type', async () => {
            render(<LoginForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(getPasswordInput()).toBeInTheDocument();
            });

            // Password should be type password by default
            expect(getPasswordInput()).toHaveAttribute('type', 'password');
        });

        it('should have email field with email type', async () => {
            render(<LoginForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(getEmailInput()).toBeInTheDocument();
            });

            // Email should be type email
            expect(getEmailInput()).toHaveAttribute('type', 'email');
        });
    });

    describe('Form Submission', () => {
        it('should call signInWithEmail on valid form submission', async () => {
            const user = userEvent.setup();

            render(<LoginForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(getEmailInput()).toBeInTheDocument();
            });

            // Fill in valid credentials
            await user.type(getEmailInput(), 'test@example.com');
            await user.type(getPasswordInput(), 'password123');

            // Submit
            const submitButton = screen.getByRole('button', { name: /login|تسجيل الدخول/i });
            await user.click(submitButton);

            // Should call Supabase signInWithPassword
            await waitFor(() => {
                expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'password123',
                });
            });
        });
    });

    describe('Switch to Signup', () => {
        it('should call onSwitchToSignup when link clicked', async () => {
            const onSwitchToSignup = vi.fn();
            const user = userEvent.setup();

            render(<LoginForm onSwitchToSignup={onSwitchToSignup} />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /signup|إنشاء حساب/i })).toBeInTheDocument();
            });

            // Click signup button
            await user.click(screen.getByRole('button', { name: /signup|إنشاء حساب/i }));

            expect(onSwitchToSignup).toHaveBeenCalledTimes(1);
        });
    });
});
