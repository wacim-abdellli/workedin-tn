import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/i18n';

import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { WorkspaceRoute } from '@/components/routing/WorkspaceRoute';

const authState = vi.hoisted(() => ({
    isAuthenticated: true,
    isFullyReady: true,
    profile: null as any,
    freelancerProfile: null as any,
}));

const workspaceState = vi.hoisted(() => ({
    activeWorkspace: 'client' as 'client' | 'freelancer',
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
    });

    it('ProtectedRoute derives a valid workspace when the store is invalid for the user', () => {
        authState.profile = {
            id: 'user-1',
            user_type: 'freelancer',
            active_mode: 'freelancer',
            onboarding_completed: false,
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
});
