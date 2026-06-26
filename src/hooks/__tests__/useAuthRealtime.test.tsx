import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const channelCallbacks = new Map<string, (payload: any) => void>();
const mockChannel = {
    on: vi.fn((event, filter, callback) => {
        channelCallbacks.set(filter.table + ':' + filter.event, callback);
        return mockChannel;
    }),
    subscribe: vi.fn(() => mockChannel),
};

vi.mock('@/lib/supabase', () => ({
    supabase: {
        channel: vi.fn(() => mockChannel),
        removeChannel: vi.fn(),
        auth: {
            signOut: vi.fn().mockResolvedValue({ error: null }),
        },
    },
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

import { supabase } from '@/lib/supabase';
import { useAuthRealtime } from '@/hooks/useAuthRealtime';
import { logger } from '@/lib/logger';

describe('useAuthRealtime', () => {
    const mockParams = {
        userId: 'user-123',
        setProfile: vi.fn(),
        setFreelancerProfile: vi.fn(),
        setSession: vi.fn(),
        setUser: vi.fn(),
        setIsProfileReady: vi.fn(),
        setIsLoading: vi.fn(),
        clearProfileCache: vi.fn(),
        clearWorkspaceForUser: vi.fn(),
        withModeAwareAvatar: vi.fn((profile) => ({ ...profile, avatar_url: 'avatar-url' })),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        channelCallbacks.clear();
    });

    it('subscribes to profile changes when userId is present', () => {
        renderHook(() => useAuthRealtime(mockParams));

        expect(supabase.channel).toHaveBeenCalledWith('profile-status-user-123');
        expect(mockChannel.on).toHaveBeenCalledWith(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: 'id=eq.user-123',
            },
            expect.any(Function)
        );
        expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('does not subscribe when userId is empty', () => {
        renderHook(() => useAuthRealtime({ ...mockParams, userId: undefined }));

        expect(supabase.channel).not.toHaveBeenCalled();
    });

    it('handles normal profile update event', () => {
        renderHook(() => useAuthRealtime(mockParams));

        const callback = channelCallbacks.get('profiles:UPDATE');
        expect(callback).toBeDefined();

        const updatePayload = {
            new: {
                id: 'user-123',
                full_name: 'Updated Name',
                account_status: 'active',
            },
        };

        act(() => {
            callback!(updatePayload);
        });

        // Trigger setProfile functional state update
        const profileUpdater = mockParams.setProfile.mock.calls[0][0];
        const oldProfile = { id: 'user-123', full_name: 'Old Name' };
        const nextProfile = profileUpdater(oldProfile);

        expect(mockParams.withModeAwareAvatar).toHaveBeenCalledWith({
            ...oldProfile,
            ...updatePayload.new,
        });
        expect(nextProfile.avatar_url).toBe('avatar-url');
    });

    it('handles suspension/archival event by signing out and clearing data', async () => {
        renderHook(() => useAuthRealtime(mockParams));

        const callback = channelCallbacks.get('profiles:UPDATE');
        expect(callback).toBeDefined();

        const updatePayload = {
            new: {
                id: 'user-123',
                account_status: 'suspended',
            },
        };

        await act(async () => {
            callback!(updatePayload);
        });

        expect(logger.warn).toHaveBeenCalled();
        expect(mockParams.setFreelancerProfile).toHaveBeenCalledWith(null);
        expect(mockParams.setSession).toHaveBeenCalledWith(null);
        expect(mockParams.setUser).toHaveBeenCalledWith(null);
        expect(mockParams.setIsProfileReady).toHaveBeenCalledWith(true);
        expect(mockParams.setIsLoading).toHaveBeenCalledWith(false);
        expect(mockParams.clearProfileCache).toHaveBeenCalled();
        expect(mockParams.clearWorkspaceForUser).toHaveBeenCalled();
        expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });

        // Verify setProfile callback updates status
        const profileUpdater = mockParams.setProfile.mock.calls[0][0];
        const oldProfile = { id: 'user-123', account_status: 'active' };
        const nextProfile = profileUpdater(oldProfile);
        expect(mockParams.withModeAwareAvatar).toHaveBeenCalledWith({
            ...oldProfile,
            ...updatePayload.new,
        });
        expect(nextProfile.avatar_url).toBe('avatar-url');
    });

    it('unsubscribes and cleans up channel on unmount', () => {
        const { unmount } = renderHook(() => useAuthRealtime(mockParams));

        unmount();

        expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
});
