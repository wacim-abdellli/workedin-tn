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

describe('SignupForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render user type selection initially', async () => {
            render(<SignupForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                // Look for user type selection buttons  
                expect(screen.getByRole('button', { name: /freelancer|مستقل/i })).toBeInTheDocument();
                expect(screen.getByRole('button', { name: /client|صاحب عمل/i })).toBeInTheDocument();
            });
        });

        it('should render all three user type options', async () => {
            render(<SignupForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                // Three options: freelancer, client, both
                const buttons = screen.getAllByRole('button');
                // Should have at least 3 buttons for user types
                expect(buttons.length).toBeGreaterThanOrEqual(3);
            });
        });
    });

    describe('User Type Selection', () => {
        it('should progress to email form when freelancer is selected', async () => {
            const user = userEvent.setup();
            render(<SignupForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /freelancer|مستقل/i })).toBeInTheDocument();
            });

            // Click freelancer option
            await user.click(screen.getByRole('button', { name: /freelancer|مستقل/i }));

            // Should now show email form
            await waitFor(() => {
                expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
            });
        });

        it('should progress to email form when client is selected', async () => {
            const user = userEvent.setup();
            render(<SignupForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /client|صاحب عمل/i })).toBeInTheDocument();
            });

            // Click client option
            await user.click(screen.getByRole('button', { name: /client|صاحب عمل/i }));

            // Should now show email form
            await waitFor(() => {
                expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
            });
        });
    });

    describe('Email and Password Form', () => {
        it('should show password field after selecting user type', async () => {
            const user = userEvent.setup();
            render(<SignupForm />, { wrapper: TestWrapper });

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /freelancer|مستقل/i })).toBeInTheDocument();
            });

            // Select user type
            await user.click(screen.getByRole('button', { name: /freelancer|مستقل/i }));

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
            });

            // Should have password input
            const passwordInputs = screen.getAllByPlaceholderText(/\*\*\*\*\*\*/);
            expect(passwordInputs.length).toBeGreaterThanOrEqual(1);
        });

        it('should validate email format', async () => {
            const user = userEvent.setup();
            render(<SignupForm />, { wrapper: TestWrapper });

            // Select user type
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /freelancer|مستقل/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /freelancer|مستقل/i }));

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
            });

            // Fill invalid email
            await user.type(screen.getByPlaceholderText(/example@email.com/i), 'invalid-email');

            // Fill password
            const passwordInputs = screen.getAllByPlaceholderText(/\*\*\*\*\*\*/);
            await user.type(passwordInputs[0], 'password123');
            if (passwordInputs[1]) {
                await user.type(passwordInputs[1], 'password123');
            }

            // Submit
            const submitButtons = screen.getAllByRole('button');
            const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit');
            if (submitButton) {
                await user.click(submitButton);
            }

            // Should show validation error
            await waitFor(() => {
                expect(screen.getByText(/invalid|غير صالح/i)).toBeInTheDocument();
            });
        });

        it('should validate password minimum length', async () => {
            const user = userEvent.setup();
            render(<SignupForm />, { wrapper: TestWrapper });

            // Select user type
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /freelancer|مستقل/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /freelancer|مستقل/i }));

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
            });

            // Fill valid email
            await user.type(screen.getByPlaceholderText(/example@email.com/i), 'test@example.com');

            // Fill short password
            const passwordInputs = screen.getAllByPlaceholderText(/\*\*\*\*\*\*/);
            await user.type(passwordInputs[0], '123');

            // Submit  
            const submitButtons = screen.getAllByRole('button');
            const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit');
            if (submitButton) {
                await user.click(submitButton);
            }

            // Should show validation error about password length
            await waitFor(() => {
                expect(screen.getByText(/6|أحرف/i)).toBeInTheDocument();
            });
        });
    });

    describe('Successful Submission', () => {
        it('should call signUp on valid form submission', async () => {
            const user = userEvent.setup();
            render(<SignupForm />, { wrapper: TestWrapper });

            // Select user type
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /freelancer|مستقل/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /freelancer|مستقل/i }));

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
            });

            // Fill valid email
            await user.type(screen.getByPlaceholderText(/example@email.com/i), 'newuser@example.com');

            // Fill valid password
            const passwordInputs = screen.getAllByPlaceholderText(/\*\*\*\*\*\*/);
            await user.type(passwordInputs[0], 'password123');
            if (passwordInputs[1]) {
                await user.type(passwordInputs[1], 'password123');
            }

            // Submit  
            const submitButtons = screen.getAllByRole('button');
            const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit');
            if (submitButton) {
                await user.click(submitButton);
            }

            // Should call signUp
            await waitFor(() => {
                expect(supabase.auth.signUp).toHaveBeenCalled();
            });
        });
    });

    describe('Password Visibility', () => {
        it('should toggle password visibility', async () => {
            const user = userEvent.setup();
            render(<SignupForm />, { wrapper: TestWrapper });

            // Select user type
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /freelancer|مستقل/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /freelancer|مستقل/i }));

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/example@email.com/i)).toBeInTheDocument();
            });

            const passwordInputs = screen.getAllByPlaceholderText(/\*\*\*\*\*\*/);

            // Initially password type
            expect(passwordInputs[0]).toHaveAttribute('type', 'password');

            // Find toggle buttons
            const allButtons = screen.getAllByRole('button');
            const toggleButton = allButtons.find(btn => btn.getAttribute('type') === 'button');

            if (toggleButton) {
                await user.click(toggleButton);

                // Should change to text type
                await waitFor(() => {
                    const inputs = screen.getAllByPlaceholderText(/\*\*\*\*\*\*/);
                    expect(inputs[0]).toHaveAttribute('type', 'text');
                });
            }
        });
    });
});
