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
import { I18nProvider } from '@/i18n';
import { supabase } from '@/lib/supabase';

// Test wrapper with all needed providers
function TestWrapper({ children }: { children: ReactNode }) {
    return (
        <I18nProvider>
            <ThemeProvider>
                <MemoryRouter>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </MemoryRouter>
            </ThemeProvider>
        </I18nProvider>
    );
}

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the login form correctly', async () => {
            render(<LoginForm />, { wrapper: TestWrapper });

            // Wait for auth to initialize
            await waitFor(() => {
                expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
            });

            // Check for password input
            expect(screen.getByPlaceholderText(/\*\*\*\*\*\*/)).toBeInTheDocument();

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
        it('should show error for invalid email', async () => {
            const user = userEvent.setup();
            render(<LoginForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
            });

            // Fill in invalid email
            const emailInput = screen.getByPlaceholderText(/example@email.com/i);
            await user.type(emailInput, 'invalid-email');

            // Fill in password
            const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*/);
            await user.type(passwordInput, 'password123');

            // Submit
            const submitButton = screen.getByRole('button', { name: /login|تسجيل الدخول/i });
            await user.click(submitButton);

            // Should show validation error
            await waitFor(() => {
                expect(screen.getByText(/invalid|غير صالح/i)).toBeInTheDocument();
            });
        });

        it('should show error for short password', async () => {
            const user = userEvent.setup();
            render(<LoginForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
            });

            // Fill in valid email
            const emailInput = screen.getByPlaceholderText(/example@email.com/i);
            await user.type(emailInput, 'test@example.com');

            // Fill in short password
            const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*/);
            await user.type(passwordInput, '123');

            // Submit
            const submitButton = screen.getByRole('button', { name: /login|تسجيل الدخول/i });
            await user.click(submitButton);

            // Should show validation error about password length
            await waitFor(() => {
                expect(screen.getByText(/6|أحرف/i)).toBeInTheDocument();
            });
        });
    });

    describe('Form Submission', () => {
        it('should call signInWithEmail on valid form submission', async () => {
            const user = userEvent.setup();

            render(<LoginForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
            });

            // Fill in valid credentials
            const emailInput = screen.getByPlaceholderText(/example@email.com/i);
            await user.type(emailInput, 'test@example.com');

            const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*/);
            await user.type(passwordInput, 'password123');

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

    describe('Password Visibility Toggle', () => {
        it('should toggle password visibility', async () => {
            const user = userEvent.setup();
            render(<LoginForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/\*\*\*\*\*\*/)).toBeInTheDocument();
            });

            const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*/);

            // Initially password type
            expect(passwordInput).toHaveAttribute('type', 'password');

            // Find and click toggle button (it's the button with Eye icon)
            const toggleButtons = screen.getAllByRole('button');
            const toggleButton = toggleButtons.find(btn => btn.getAttribute('type') === 'button');

            if (toggleButton) {
                await user.click(toggleButton);

                // Should now be text type
                expect(passwordInput).toHaveAttribute('type', 'text');

                // Click again to toggle back
                await user.click(toggleButton);
                expect(passwordInput).toHaveAttribute('type', 'password');
            }
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
