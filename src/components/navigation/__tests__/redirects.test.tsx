import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import type { Profile, FreelancerProfile } from '@/types';
import { DashboardRedirect } from '../DashboardRedirect';
import { MyJobsRedirect } from '../MyJobsRedirect';
import { SavedRedirect } from '../SavedRedirect';

interface AuthStateMock {
    user: User | null;
    profile: Profile | null;
    freelancerProfile: FreelancerProfile | null;
    isFullyReady: boolean;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
}

const authState = vi.hoisted((): AuthStateMock => ({
    user: null,
    profile: null,
    freelancerProfile: null,
    isFullyReady: true,
    isLoading: false,
    refreshProfile: vi.fn().mockResolvedValue(undefined),
}));

const workspaceState = vi.hoisted(() => ({
    activeWorkspace: 'client' as 'client' | 'freelancer',
    setWorkspace: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => authState,
}));

vi.mock('@/lib/workspaceState', () => ({
    useWorkspaceStore: ((selector?: (state: typeof workspaceState) => unknown) =>
        selector ? selector(workspaceState) : workspaceState) as typeof import('@/lib/workspaceState').useWorkspaceStore,
}));

vi.mock('@/components/ui', () => ({
    FullScreenLoader: ({ label, hint }: { label: string; hint?: string }) => (
        <div data-testid="fullscreen-loader">
            <span data-testid="loader-label">{label}</span>
            {hint && <span data-testid="loader-hint">{hint}</span>}
        </div>
    ),
}));

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname + location.search}</div>;
}

describe('Navigation Redirects', () => {
    beforeEach(() => {
        authState.user = null;
        authState.profile = null;
        authState.freelancerProfile = null;
        authState.isFullyReady = true;
        authState.isLoading = false;
        vi.mocked(authState.refreshProfile).mockReset();
        vi.mocked(authState.refreshProfile).mockResolvedValue(undefined);
        workspaceState.activeWorkspace = 'client';
        workspaceState.setWorkspace.mockClear();
    });

    describe('DashboardRedirect', () => {
        it('renders FullScreenLoader when auth is not fully ready', () => {
            authState.isFullyReady = false;

            render(
                <MemoryRouter>
                    <DashboardRedirect />
                </MemoryRouter>
            );

            expect(screen.getByTestId('fullscreen-loader')).toBeInTheDocument();
            expect(screen.getByTestId('loader-label')).toHaveTextContent('Redirecting to dashboard');
        });

        it('redirects to login when user is null', () => {
            authState.isFullyReady = true;
            authState.user = null;

            render(
                <MemoryRouter initialEntries={['/dashboard']}>
                    <Routes>
                        <Route path="/dashboard" element={<DashboardRedirect />} />
                        <Route path="/login" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('location')).toHaveTextContent('/login');
        });

        it('triggers refreshProfile and displays loader when user exists but profile is null', async () => {
            authState.isFullyReady = true;
            authState.user = { id: 'user-123' } as User;
            authState.profile = null;

            render(
                <MemoryRouter>
                    <DashboardRedirect />
                </MemoryRouter>
            );

            expect(screen.getByTestId('fullscreen-loader')).toBeInTheDocument();
            expect(authState.refreshProfile).toHaveBeenCalled();
        });

        it('redirects to settings tab when user exists but profile remains null after refreshProfile fails', () => {
            authState.isFullyReady = true;
            authState.user = { id: 'user-123' } as User;
            authState.profile = null;

            const syncErrorThenable = {
                then: function(onFulfilled?: () => unknown) {
                    return this;
                },
                catch: function(onRejected?: (err: Error) => unknown) {
                    if (onRejected) onRejected(new Error('fetch failed'));
                    return this;
                },
                finally: function(onFinally?: () => unknown) {
                    if (onFinally) onFinally();
                    return this;
                }
            };

            vi.mocked(authState.refreshProfile).mockReturnValue(syncErrorThenable as unknown as Promise<void>);

            render(
                <MemoryRouter initialEntries={['/dashboard']}>
                    <Routes>
                        <Route path="/dashboard" element={<DashboardRedirect />} />
                        <Route path="/settings" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('location')).toHaveTextContent('/settings?tab=account');
        });

        it('redirects to signup select-type step when user_type is missing', () => {
            authState.isFullyReady = true;
            authState.user = { id: 'user-123' } as User;
            authState.profile = { id: 'user-123', email: 'test@example.com', full_name: 'Test', user_type: null } as unknown as Profile;

            render(
                <MemoryRouter initialEntries={['/dashboard']}>
                    <Routes>
                        <Route path="/dashboard" element={<DashboardRedirect />} />
                        <Route path="/signup" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('location')).toHaveTextContent('/signup?step=select-type');
        });

        it('redirects to client dashboard when workspace is client', () => {
            authState.isFullyReady = true;
            authState.user = { id: 'user-123' } as User;
            authState.profile = {
                id: 'user-123',
                email: 'test@example.com',
                full_name: 'Test',
                user_type: 'client',
                active_mode: 'client',
                client_onboarding_completed: true,
            } as unknown as Profile;
            workspaceState.activeWorkspace = 'client';

            render(
                <MemoryRouter initialEntries={['/dashboard']}>
                    <Routes>
                        <Route path="/dashboard" element={<DashboardRedirect />} />
                        <Route path="/client/dashboard" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('location')).toHaveTextContent('/client/dashboard');
        });

        it('redirects to freelancer dashboard when workspace is freelancer', () => {
            authState.isFullyReady = true;
            authState.user = { id: 'user-123' } as User;
            authState.profile = {
                id: 'user-123',
                email: 'test@example.com',
                full_name: 'Test',
                user_type: 'freelancer',
                active_mode: 'freelancer',
                freelancer_onboarding_completed: true,
            } as unknown as Profile;
            authState.freelancerProfile = { id: 'user-123', title: 'Web Developer' } as unknown as FreelancerProfile;
            workspaceState.activeWorkspace = 'freelancer';

            render(
                <MemoryRouter initialEntries={['/dashboard']}>
                    <Routes>
                        <Route path="/dashboard" element={<DashboardRedirect />} />
                        <Route path="/freelancer/dashboard" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('location')).toHaveTextContent('/freelancer/dashboard');
        });
    });

    describe('MyJobsRedirect', () => {
        it('renders null when loading', () => {
            authState.isLoading = true;

            const { container } = render(
                <MemoryRouter>
                    <MyJobsRedirect />
                </MemoryRouter>
            );

            expect(container.firstChild).toBeNull();
        });

        it('redirects to login when unauthenticated', () => {
            authState.isLoading = false;
            authState.profile = null;

            render(
                <MemoryRouter initialEntries={['/redirect']}>
                    <Routes>
                        <Route path="/redirect" element={<MyJobsRedirect />} />
                        <Route path="/login" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('location')).toHaveTextContent('/login');
        });

        it('redirects to myProposals when active workspace is freelancer', () => {
            authState.isLoading = false;
            authState.profile = { id: 'user-1' } as Profile;
            workspaceState.activeWorkspace = 'freelancer';

            render(
                <MemoryRouter initialEntries={['/redirect']}>
                    <Routes>
                        <Route path="/redirect" element={<MyJobsRedirect />} />
                        <Route path="/my-proposals" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('location')).toHaveTextContent('/my-proposals');
        });

        it('redirects to clientJobs when active workspace is client', () => {
            authState.isLoading = false;
            authState.profile = { id: 'user-1' } as Profile;
            workspaceState.activeWorkspace = 'client';

            render(
                <MemoryRouter initialEntries={['/redirect']}>
                    <Routes>
                        <Route path="/redirect" element={<MyJobsRedirect />} />
                        <Route path="/client/jobs" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('location')).toHaveTextContent('/client/jobs');
        });
    });

    describe('SavedRedirect', () => {
        it('renders null when loading', () => {
            authState.isLoading = true;

            const { container } = render(
                <MemoryRouter>
                    <SavedRedirect />
                </MemoryRouter>
            );

            expect(container.firstChild).toBeNull();
        });

        it('redirects to login when unauthenticated', () => {
            authState.isLoading = false;
            authState.profile = null;

            render(
                <MemoryRouter initialEntries={['/redirect']}>
                    <Routes>
                        <Route path="/redirect" element={<SavedRedirect />} />
                        <Route path="/login" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('location')).toHaveTextContent('/login');
        });

        it('redirects to saved when authenticated', () => {
            authState.isLoading = false;
            authState.profile = { id: 'user-1' } as Profile;

            render(
                <MemoryRouter initialEntries={['/redirect']}>
                    <Routes>
                        <Route path="/redirect" element={<SavedRedirect />} />
                        <Route path="/saved" element={<LocationProbe />} />
                    </Routes>
                </MemoryRouter>
            );

            expect(screen.getByTestId('location')).toHaveTextContent('/saved');
        });
    });
});
