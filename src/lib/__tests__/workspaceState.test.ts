import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            update: vi.fn(() => ({
                eq: vi.fn(async () => ({ error: null })),
            })),
        })),
    },
}));

import { useWorkspaceStore } from '../workspaceState';

describe('workspaceState', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useWorkspaceStore.setState({ activeWorkspace: 'client', isSwitching: false });
    });

    describe('useWorkspaceStore', () => {
        it('defaults to client workspace', () => {
            expect(useWorkspaceStore.getState().activeWorkspace).toBe('client');
        });

        it('switches workspace to freelancer', () => {
            useWorkspaceStore.getState().setWorkspace('freelancer');
            expect(useWorkspaceStore.getState().activeWorkspace).toBe('freelancer');
        });

        it('switches workspace back to client', () => {
            useWorkspaceStore.getState().setWorkspace('freelancer');
            useWorkspaceStore.getState().setWorkspace('client');
            expect(useWorkspaceStore.getState().activeWorkspace).toBe('client');
        });

        it('tracks switching state', () => {
            useWorkspaceStore.getState().setSwitching(true);
            expect(useWorkspaceStore.getState().isSwitching).toBe(true);
        });

        it('resets switching state', () => {
            useWorkspaceStore.getState().setSwitching(true);
            useWorkspaceStore.getState().setSwitching(false);
            expect(useWorkspaceStore.getState().isSwitching).toBe(false);
        });
    });
});
