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
const switchAccountModeMock = vi.hoisted(() => vi.fn(async () => ({
    mode: 'client' as const,
    userType: 'both' as const,
    targetPath: '/onboarding/client',
    isOnboarded: false,
})));

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
        t: {
            auth: {
                accountPanel: {
                    sectionLabel: 'Workspace',
                    switchWorkspace: 'Switch workspace',
                    switchWorkspaceBoth: 'Use one account for both',
                    switchWorkspaceSingle: 'Enable the second workspace only when you need it.',
                    completeSetup: 'Complete setup',
                    freelancerLabel: 'Freelancer',
                    clientLabel: 'Client',
                    ready: 'Ready',
                    needsSetup: 'Needs setup',
                    progressLabel: 'Profile completion',
                    freelancerDesc: 'Find work, send proposals, and get paid in TND.',
                    clientDesc: 'Post projects, compare proposals, and release escrow payments.',
                    current: 'Current',
                    switchAction: 'Switch',
                    enable: 'Enable',
                    switching: 'Switching',
                    switchedFreelancer: 'Freelancer workspace is now active.',
                    switchedClient: 'Client workspace is now active.',
                    switchError: 'We could not switch your workspace right now.',
                    manageProfile: 'Manage profile',
                    freelancerHint: 'Freelancer hint',
                    clientHint: 'Client hint',
                    tools: 'Account tools',
                    profileAction: 'Profile',
                    settingsAction: 'Settings',
                    logoutAction: 'Sign out',
                    logoutDesc: 'End this session safely on this device.',
                },
                loggingOut: 'Logging out...',
            },
        },
    }),
}));

vi.mock('@/components/ui/Toast', () => ({
    useToast: () => ({
        showToast: vi.fn(),
    }),
}));

import { UserAccountPanel } from '@/components/layout/Header/UserMenu';

describe('UserAccountPanel', () => {
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
        onClose: vi.fn(),
    };

    it('renders the workspace-first panel', async () => {
        render(
            <MemoryRouter>
                <UserAccountPanel {...baseProps} />
            </MemoryRouter>
        );

        expect(screen.getByText('Workspace')).toBeInTheDocument();
        expect(screen.getByText('Switch workspace')).toBeInTheDocument();
        expect(screen.getByText('Account tools')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('switches to the client workspace and navigates to the target path', async () => {
        render(
            <MemoryRouter>
                <UserAccountPanel {...baseProps} />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /enable/i }));

        await waitFor(() => {
            expect(switchAccountModeMock).toHaveBeenCalledWith('client');
            expect(navigateMock).toHaveBeenCalledWith('/onboarding/client');
            expect(baseProps.onClose).toHaveBeenCalled();
        });
    });

    it('clears auth data and hard redirects on logout', async () => {
        render(
            <MemoryRouter>
                <UserAccountPanel {...baseProps} />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

        await waitFor(() => {
            expect(authUtilsState.clearAllAuthData).toHaveBeenCalled();
            expect(baseProps.signOut).toHaveBeenCalled();
            expect(authUtilsState.hardLogout).toHaveBeenCalledWith('/login');
        });
    });
});
