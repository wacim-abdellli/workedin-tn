import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/i18n';

import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { WorkspaceRoute } from '@/components/routing/WorkspaceRoute';
import { OnboardingRoute } from '@/components/routing/OnboardingRoute';

const authState = vi.hoisted(() => ({
    isAuthenticated: true,
    isFullyReady: true,
    profile: null as any,
    freelancerProfile: null as any,
}));

const workspaceState = vi.hoisted(() => ({
    activeWorkspace: 'client' as 'client' | 'freelancer',
    setWorkspace: vi.fn((workspace: 'client' | 'freelancer') => {
        workspaceState.activeWorkspace = workspace;
    }),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => authState,
}));

vi.mock('@/hooks/useSessionTimeout', () => ({
    useSessionTimeout: vi.fn(),
}));

vi.mock('@/components/ui', () => ({
    FullScreenLoader: ({ label }: { label: string }) => <div>{label}</div>,
}));

vi.mock('@/components/routing/AccountStatusGate', () => ({
    default: ({ status }: { status: string }) => <div>Account blocked: {status}</div>,
}));

vi.mock('@/lib/workspaceState', () => ({
    useWorkspaceStore: ((selector?: (state: typeof workspaceState) => unknown) =>
        selector ? selector(workspaceState) : workspaceState) as typeof import('@/lib/workspaceState').useWorkspaceStore,
}));

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
}

describe('workspace routing guards', () => {
    beforeEach(() => {
        authState.isAuthenticated = true;
        authState.isFullyReady = true;
        authState.profile = null;
        authState.freelancerProfile = null;
        workspaceState.activeWorkspace = 'client';
        workspaceState.setWorkspace.mockClear();
    });

    it('ProtectedRoute derives a valid workspace when the store is invalid for the user', () => {
        authState.profile = {
            id: 'user-1',
            user_type: 'freelancer',
            active_mode: 'freelancer',
            freelancer_onboarding_completed: false,
        };
        authState.freelancerProfile = null;
        workspaceState.activeWorkspace = 'client';

        render(
            <I18nProvider>
                <MemoryRouter initialEntries={['/my-proposals']}>
                    <Routes>
                        <Route
                            path="/my-proposals"
                            element={
                                <ProtectedRoute>
                                    <div>Protected content</div>
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            </I18nProvider>
        );

        expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/freelancer');
    });

    it('WorkspaceRoute redirects to the resolved workspace dashboard instead of a stale store value', () => {
        authState.profile = {
            id: 'user-2',
            user_type: 'freelancer',
            active_mode: 'freelancer',
        };
        authState.freelancerProfile = { id: 'user-2', title: 'Designer', skills: ['figma'] };
        workspaceState.activeWorkspace = 'client';

        render(
            <I18nProvider>
                <MemoryRouter initialEntries={['/client/jobs']}>
                    <Routes>
                        <Route
                            path="/client/jobs"
                            element={
                                <WorkspaceRoute workspace="client">
                                    <div>Wrong workspace</div>
                                </WorkspaceRoute>
                            }
                        />
                        <Route path="/freelancer/dashboard" element={<LocationProbe />} />
                        <Route path="*" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            </I18nProvider>
        );

        expect(screen.getByTestId('location')).toHaveTextContent('/freelancer/dashboard');
    });

    it('WorkspaceRoute sends client-mode access on freelancer jobs route to /jobs/new', () => {
        authState.profile = {
            id: 'user-2b',
            user_type: 'both',
            active_mode: 'client',
            client_onboarding_completed: true,
            freelancer_onboarding_completed: true,
        };
        authState.freelancerProfile = { id: 'user-2b', title: 'Designer', skills: ['figma'] };
        workspaceState.activeWorkspace = 'client';

        render(
            <I18nProvider>
                <MemoryRouter initialEntries={['/jobs']}>
                    <Routes>
                        <Route
                            path="/jobs"
                            element={
                                <WorkspaceRoute workspace="freelancer">
                                    <div>Freelancer marketplace route</div>
                                </WorkspaceRoute>
                            }
                        />
                        <Route path="/jobs/new" element={<LocationProbe />} />
                        <Route path="*" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            </I18nProvider>
        );

        expect(screen.getByTestId('location')).toHaveTextContent('/jobs/new');
    });

    it('ProtectedRoute does not treat freelancer completion as client completion', () => {
        authState.profile = {
            id: 'user-3',
            user_type: 'both',
            active_mode: 'client',
            freelancer_onboarding_completed: true,
            client_onboarding_completed: false,
        };
        authState.freelancerProfile = { id: 'user-3', title: 'Designer', skills: ['figma'] };
        workspaceState.activeWorkspace = 'client';

        render(
            <I18nProvider>
                <MemoryRouter initialEntries={['/client/dashboard']}>
                    <Routes>
                        <Route
                            path="/client/dashboard"
                            element={
                                <ProtectedRoute>
                                    <div>Client dashboard</div>
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            </I18nProvider>
        );

        expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/client');
    });

    it('ProtectedRoute does not treat client completion as freelancer completion', () => {
        authState.profile = {
            id: 'user-4',
            user_type: 'both',
            active_mode: 'freelancer',
            client_onboarding_completed: true,
            freelancer_onboarding_completed: false,
        };
        authState.freelancerProfile = null;
        workspaceState.activeWorkspace = 'freelancer';

        render(
            <I18nProvider>
                <MemoryRouter initialEntries={['/freelancer/dashboard']}>
                    <Routes>
                        <Route
                            path="/freelancer/dashboard"
                            element={
                                <ProtectedRoute>
                                    <div>Freelancer dashboard</div>
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            </I18nProvider>
        );

        expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/freelancer');
    });

    it('OnboardingRoute keeps client onboarding open when only freelancer onboarding is complete', () => {
        authState.profile = {
            id: 'user-5',
            user_type: 'both',
            active_mode: 'client',
            freelancer_onboarding_completed: true,
            client_onboarding_completed: false,
        };
        authState.freelancerProfile = { id: 'user-5', title: 'Designer', skills: ['figma'] };
        workspaceState.activeWorkspace = 'freelancer';

        render(
            <I18nProvider>
                <MemoryRouter initialEntries={['/onboarding/client']}>
                    <Routes>
                        <Route
                            path="/onboarding/client"
                            element={
                                <OnboardingRoute workspace="client">
                                    <div data-testid="client-onboarding-content">Client onboarding form</div>
                                </OnboardingRoute>
                            }
                        />
                        <Route path="*" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            </I18nProvider>
        );

        expect(screen.getByTestId('client-onboarding-content')).toBeInTheDocument();
    });

    it('OnboardingRoute redirects to client dashboard only when client onboarding is complete', () => {
        authState.profile = {
            id: 'user-6',
            user_type: 'both',
            active_mode: 'client',
            client_onboarding_completed: true,
            freelancer_onboarding_completed: false,
        };
        authState.freelancerProfile = null;
        workspaceState.activeWorkspace = 'freelancer';

        render(
            <I18nProvider>
                <MemoryRouter initialEntries={['/onboarding/client']}>
                    <Routes>
                        <Route
                            path="/onboarding/client"
                            element={
                                <OnboardingRoute workspace="client">
                                    <div>Should not render</div>
                                </OnboardingRoute>
                            }
                        />
                        <Route path="*" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            </I18nProvider>
        );

        expect(screen.getByTestId('location')).toHaveTextContent('/client/dashboard');
    });
});
