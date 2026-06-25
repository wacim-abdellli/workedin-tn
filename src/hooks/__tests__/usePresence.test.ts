import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePresence } from '../usePresence';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockResolvedValue(undefined),
            track: vi.fn().mockResolvedValue(undefined),
            untrack: vi.fn().mockResolvedValue(undefined),
            presenceState: vi.fn(() => ({})),
        })),
        removeChannel: vi.fn(),
    },
}));

import { supabase } from '@/lib/supabase';

describe('usePresence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Reset singleton state between tests
        vi.restoreAllMocks();
    });

    it('returns onlineIds as an empty Set and isOnline function', () => {
        const { result } = renderHook(() => usePresence({ userId: 'user-1', isOnlineForMessages: true }));

        expect(result.current.onlineIds).toBeInstanceOf(Set);
        expect(result.current.onlineIds.size).toBe(0);
        expect(typeof result.current.isOnline).toBe('function');
    });

    it('isOnline returns false for unknown user', () => {
        const { result } = renderHook(() => usePresence({ userId: 'user-1', isOnlineForMessages: true }));

        expect(result.current.isOnline('user-999')).toBe(false);
    });

    it('isOnline returns false for null/undefined id', () => {
        const { result } = renderHook(() => usePresence({ userId: 'user-1', isOnlineForMessages: true }));

        expect(result.current.isOnline(null)).toBe(false);
        expect(result.current.isOnline(undefined)).toBe(false);
    });

    it('creates a channel on mount', () => {
        renderHook(() => usePresence({ userId: 'user-1', isOnlineForMessages: true }));

        expect(supabase.channel).toHaveBeenCalledWith('global-presence', {
            config: { presence: { key: 'presence' } },
        });
    });

    it('subscribes to the channel on mount', () => {
        const mockSubscribe = vi.fn().mockResolvedValue(undefined);
        const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
        (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue({
            on: mockOn,
            subscribe: mockSubscribe,
            track: vi.fn(),
            untrack: vi.fn(),
            presenceState: vi.fn(() => ({})),
        });

        renderHook(() => usePresence({ userId: 'user-1', isOnlineForMessages: true }));

        expect(mockOn).toHaveBeenCalledWith('presence', { event: 'sync' }, expect.any(Function));
        expect(mockSubscribe).toHaveBeenCalled();
    });

    it('tracks user when userId and isOnlineForMessages are provided', async () => {
        const mockTrack = vi.fn().mockResolvedValue(undefined);
        const mockSubscribe = vi.fn().mockResolvedValue(undefined);
        const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
        (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue({
            on: mockOn,
            subscribe: mockSubscribe,
            track: mockTrack,
            untrack: vi.fn(),
            presenceState: vi.fn(() => ({})),
        });

        renderHook(() => usePresence({ userId: 'user-1', isOnlineForMessages: true }));

        // track is called asynchronously
        await act(async () => {
            await new Promise(r => setTimeout(r, 0));
        });

        expect(mockTrack).toHaveBeenCalledWith({ user_id: 'user-1' });
    });

    it('does not track when userId is null', async () => {
        const mockTrack = vi.fn();
        (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockResolvedValue(undefined),
            track: mockTrack,
            untrack: vi.fn(),
            presenceState: vi.fn(() => ({})),
        });

        renderHook(() => usePresence({ userId: null, isOnlineForMessages: true }));

        await act(async () => {
            await new Promise(r => setTimeout(r, 0));
        });

        expect(mockTrack).not.toHaveBeenCalled();
    });

    it('does not track when isOnlineForMessages is false', async () => {
        const mockTrack = vi.fn();
        const mockUntrack = vi.fn().mockResolvedValue(undefined);
        (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockResolvedValue(undefined),
            track: mockTrack,
            untrack: mockUntrack,
            presenceState: vi.fn(() => ({})),
        });

        renderHook(() => usePresence({ userId: 'user-1', isOnlineForMessages: false }));

        await act(async () => {
            await new Promise(r => setTimeout(r, 0));
        });

        expect(mockTrack).not.toHaveBeenCalled();
    });

    it('cleans up channel when last subscriber unmounts', () => {
        const { unmount } = renderHook(() => usePresence({ userId: 'user-1', isOnlineForMessages: true }));

        unmount();

        expect(supabase.removeChannel).toHaveBeenCalled();
    });

    it('adds beforeunload listener for untracking', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');

        const { unmount } = renderHook(() => usePresence({ userId: 'user-1', isOnlineForMessages: true }));

        expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });
});
