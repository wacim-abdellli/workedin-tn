import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { I18nProvider } from '@/i18n';
import { HelmetProvider } from 'react-helmet-async';

// ============================================================================
// All Providers Wrapper
// ============================================================================

interface AllProvidersProps {
    children: ReactNode;
    initialRoute?: string;
}

/**
 * Wrapper component that includes all application providers.
 * Used by the custom render function for integration-like tests.
 */
function AllProviders({ children, initialRoute = '/' }: AllProvidersProps): ReactElement {
    return (
        <HelmetProvider>
            <I18nProvider>
                <ThemeProvider>
                    <ToastProvider>
                        <MemoryRouter initialEntries={[initialRoute]}>
                            <AuthProvider>
                                {children}
                            </AuthProvider>
                        </MemoryRouter>
                    </ToastProvider>
                </ThemeProvider>
            </I18nProvider>
        </HelmetProvider>
    );
}

// ============================================================================
// Custom Render Functions
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    initialRoute?: string;
}

/**
 * Custom render function that wraps the component with all providers.
 * Use this for components that need the full application context.
 */
function customRender(
    ui: ReactElement,
    options?: CustomRenderOptions
): RenderResult {
    const { initialRoute, ...renderOptions } = options || {};

    return render(ui, {
        wrapper: ({ children }) => (
            <AllProviders initialRoute={initialRoute}>{children}</AllProviders>
        ),
        ...renderOptions,
    });
}

/**
 * Lightweight render that only wraps with Router.
 * Use this for simple components that don't need auth/theme context.
 */
function renderWithRouter(
    ui: ReactElement,
    { route = '/', ...renderOptions }: RenderOptions & { route?: string } = {}
): RenderResult {
    return render(ui, {
        wrapper: ({ children }) => (
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        ),
        ...renderOptions,
    });
}

// ============================================================================
// Test Data Factories
// ============================================================================

export const createMockUser = (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    phone: '+21612345678',
    created_at: new Date().toISOString(),
    ...overrides,
});

export const createMockProfile = (overrides = {}) => ({
    id: 'test-user-id',
    full_name: 'Test User',
    phone: '+21612345678',
    user_type: 'freelancer' as const,
    avatar_url: null,
    bio: 'Test bio',
    location: 'Tunis',
    title: 'Developer',
    hourly_rate: 50,
    skills: ['React', 'TypeScript'],
    is_verified: true,
    is_available: true,
    rating: 4.5,
    total_reviews: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
});

export const createMockJob = (overrides = {}) => ({
    id: 'test-job-id',
    title: 'Test Job',
    description: 'Test job description',
    category: 'برمجة وتطوير',
    budget_type: 'fixed' as const,
    budget_min: 100,
    budget_max: 500,
    location: 'عن بعد',
    skills: ['React', 'TypeScript'],
    status: 'open' as const,
    client_id: 'test-client-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    proposals_count: 5,
    views_count: 100,
    ...overrides,
});

export const createMockProposal = (overrides = {}) => ({
    id: 'test-proposal-id',
    job_id: 'test-job-id',
    freelancer_id: 'test-freelancer-id',
    cover_letter: 'Test cover letter',
    bid_amount: 300,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
});

export const createMockConversation = (overrides = {}) => ({
    id: 'test-conversation-id',
    participant: {
        id: 'other-user-id',
        name: 'Other User',
        title: 'Designer',
        avatar: null,
        is_online: true,
    },
    last_message: 'Test message',
    last_message_time: 'منذ 5 دقائق',
    unread_count: 2,
    is_starred: false,
    job_title: 'Test Job',
    ...overrides,
});

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Wait for an element to be removed from the DOM.
 */
export const waitForElementToBeRemoved = async (
    callback: () => HTMLElement | null,
    options = { timeout: 5000 }
) => {
    const startTime = Date.now();

    while (Date.now() - startTime < options.timeout) {
        if (callback() === null) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    throw new Error('Element was not removed within timeout');
};

/**
 * Check if an element has specific Arabic text content.
 */
export const hasArabicText = (element: HTMLElement, text: string): boolean => {
    return element.textContent?.includes(text) ?? false;
};

// ============================================================================
// Re-exports
// ============================================================================

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export custom render as the default render
export { customRender as render, renderWithRouter };
