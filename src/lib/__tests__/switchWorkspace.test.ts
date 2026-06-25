import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            upsert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
        })),
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: null }),
        },
    },
}));

vi.mock('@/lib/supabaseWithRetry', () => ({
    supabaseWithRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@/lib/workspaceRoutes', () => ({
    getWorkspaceTargetRoute: vi.fn(() => ({ path: '/dashboard', isOnboarded: true })),
    promoteUserTypeForWorkspace: vi.fn((_current: unknown, target: string) => target),
}));

vi.mock('@/lib/workspaceState', () => ({
    useWorkspaceStore: {
        getState: vi.fn(() => ({
            setSwitching: vi.fn(),
            setWorkspace: vi.fn(),
        })),
    },
    saveWorkspaceForUser: vi.fn(),
}));

describe('switchWorkspace', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('calls navigate with target route', async () => {
        const { switchWorkspace } = await import('../switchWorkspace');
        await switchWorkspace({
            userId: 'user-1',
            targetWorkspace: 'freelancer',
            currentUserType: 'client',
            profile: { id: 'user-1', user_type: 'client', active_mode: 'client' },
            freelancerProfile: null,
            navigate: mockNavigate,
        });
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', expect.any(Object));
    });

    it('saves workspace to storage', async () => {
        const { saveWorkspaceForUser } = await import('@/lib/workspaceState');
        const { switchWorkspace } = await import('../switchWorkspace');
        await switchWorkspace({
            userId: 'user-1',
            targetWorkspace: 'client',
            currentUserType: 'freelancer',
            profile: { id: 'user-1' },
            freelancerProfile: null,
            navigate: mockNavigate,
        });
        expect(saveWorkspaceForUser).toHaveBeenCalledWith('user-1', 'client');
    });

    it('returns targetRoute and isOnboarded', async () => {
        const { switchWorkspace } = await import('../switchWorkspace');
        const result = await switchWorkspace({
            userId: 'user-1',
            targetWorkspace: 'freelancer',
            currentUserType: null,
            profile: null,
            freelancerProfile: null,
            navigate: mockNavigate,
        });
        expect(result).toEqual({ targetRoute: '/dashboard', isOnboarded: true });
    });

    it('sets session storage', async () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
        const { switchWorkspace } = await import('../switchWorkspace');
        await switchWorkspace({
            userId: 'user-1',
            targetWorkspace: 'freelancer',
            currentUserType: null,
            profile: null,
            freelancerProfile: null,
            navigate: mockNavigate,
        });
        expect(setItemSpy).toHaveBeenCalledWith('workspace_switched', 'freelancer');
        setItemSpy.mockRestore();
    });

    it('navigates with switching state', async () => {
        const { switchWorkspace } = await import('../switchWorkspace');
        await switchWorkspace({
            userId: 'user-1',
            targetWorkspace: 'client',
            currentUserType: null,
            profile: null,
            freelancerProfile: null,
            navigate: mockNavigate,
        });
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
            state: { switching: true, workspace: 'client' },
        });
    });

    it('uses default profile id from userId', async () => {
        const { switchWorkspace } = await import('../switchWorkspace');
        await switchWorkspace({
            userId: 'user-1',
            targetWorkspace: 'client',
            currentUserType: null,
            profile: null,
            freelancerProfile: null,
            navigate: mockNavigate,
        });
        // Should not throw with null profile
        expect(mockNavigate).toHaveBeenCalled();
    });
});
