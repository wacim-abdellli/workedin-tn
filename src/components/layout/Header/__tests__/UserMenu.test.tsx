import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authUtilsState = vi.hoisted(() => ({
    clearAllAuthData: vi.fn(),
    hardLogout: vi.fn(),
}));

const loggerState = vi.hoisted(() => ({
    error: vi.fn(),
}));

const navigateMock = vi.hoisted(() => vi.fn());
const switchAccountModeMock = vi.hoisted(() => vi.fn(async () => 'client'));

const useAuthState = vi.hoisted(() => ({
    activeMode: 'freelancer' as const,
    availableModes: ['freelancer'] as Array<'freelancer' | 'client'>,
    freelancerProfile: {
        id: 'user-1',
        title: 'Designer',
        skills: [],
        completion_rate: 80,
        repeat_clients: 0,
        cin_verified: false,
        total_earnings: 0,
        created_at: '',
    },
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    },
}));

vi.mock('@/lib/authUtils', () => ({
    clearAllAuthData: authUtilsState.clearAllAuthData,
    hardLogout: authUtilsState.hardLogout,
}));

vi.mock('@/lib/logger', () => ({
    logger: loggerState,
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        activeMode: useAuthState.activeMode,
        availableModes: useAuthState.availableModes,
        freelancerProfile: useAuthState.freelancerProfile,
        switchAccountMode: switchAccountModeMock,
    }),
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        language: 'en',
        dir: 'ltr',
        t: {
            auth: {
                freelancer: 'Freelancer',
                client: 'Client',
                loggingOut: 'Logging out...',
            },
        },
    }),
}));

import { UserMenu } from '@/components/layout/Header/UserMenu';

describe('UserMenu', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthState.activeMode = 'freelancer';
        useAuthState.availableModes = ['freelancer'];
    });

    const baseProps = {
        user: {
            id: 'user-1',
            email: 'user@example.com',
            user_metadata: {},
        } as never,
        profile: {
            full_name: 'Amina Ben Salah',
            avatar_url: null,
            user_type: 'freelancer' as const,
            is_admin: true,
            username: 'amina',
        },
        signOut: vi.fn(async () => undefined),
        t: {
            nav: {
                dashboard: 'Dashboard',
                myJobs: 'My Jobs',
                messages: 'Messages',
                profile: 'Profile',
                saved: 'Saved',
                settings: 'Settings',
                logout: 'Logout',
            },
        },
    };

    it('renders a polished account panel with quick actions and admin link', async () => {
        render(
            <MemoryRouter>
                <UserMenu {...baseProps} />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { expanded: false }));

        expect(screen.getByText('Account')).toBeInTheDocument();
        expect(screen.getByText('Switch workspace')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('@amina')).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });

        await waitFor(() => {
            expect(screen.queryByText('Switch workspace')).not.toBeInTheDocument();
        });
    });

    it('switches to the client workspace and navigates to the client onboarding flow', async () => {
        render(
            <MemoryRouter>
                <UserMenu {...baseProps} />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { expanded: false }));
        fireEvent.click(screen.getByRole('button', { name: /enable client/i }));

        await waitFor(() => {
            expect(switchAccountModeMock).toHaveBeenCalledWith('client');
            expect(navigateMock).toHaveBeenCalledWith('/onboarding/client');
        });
    });

    it('clears auth data and hard redirects on logout', async () => {
        render(
            <MemoryRouter>
                <UserMenu {...baseProps} />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { expanded: false }));
        fireEvent.click(screen.getByRole('menuitem', { name: /logout/i }));

        await waitFor(() => {
            expect(authUtilsState.clearAllAuthData).toHaveBeenCalled();
            expect(baseProps.signOut).toHaveBeenCalled();
            expect(authUtilsState.hardLogout).toHaveBeenCalledWith('/login');
        });
    });
});
