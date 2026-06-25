import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockMarkConversationRead = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/services/messages', () => ({
    markConversationRead: (...args: unknown[]) => mockMarkConversationRead(...args),
}));

import { useReadReceipts } from '../useReadReceipts';

describe('useReadReceipts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns null', () => {
        const { result } = renderHook(() =>
            useReadReceipts({
                conversationId: null,
                currentUserId: null,
                messages: [],
            })
        );
        expect(result.current).toBeNull();
    });

    it('does not call markConversationRead when conversationId is null', () => {
        renderHook(() =>
            useReadReceipts({
                conversationId: null,
                currentUserId: 'user-1',
                messages: [{ id: 'msg-1', receiver_id: 'user-1', sender_id: 'user-2', is_read: false }],
            })
        );
        act(() => vi.advanceTimersByTime(500));
        expect(mockMarkConversationRead).not.toHaveBeenCalled();
    });

    it('does not call markConversationRead when messages are empty', () => {
        renderHook(() =>
            useReadReceipts({
                conversationId: 'conv-1',
                currentUserId: 'user-1',
                messages: [],
            })
        );
        act(() => vi.advanceTimersByTime(500));
        expect(mockMarkConversationRead).not.toHaveBeenCalled();
    });

    it('marks conversation as read after 400ms debounce', async () => {
        renderHook(() =>
            useReadReceipts({
                conversationId: 'conv-1',
                currentUserId: 'user-1',
                messages: [
                    { id: 'msg-1', receiver_id: 'user-1', sender_id: 'user-2', is_read: false },
                    { id: 'msg-2', receiver_id: 'user-2', sender_id: 'user-1', is_read: true },
                ],
            })
        );

        await act(async () => {
            vi.advanceTimersByTime(400);
            await vi.runAllTimersAsync();
        });

        expect(mockMarkConversationRead).toHaveBeenCalledWith('conv-1', 'user-1');
    });

    it('does not mark already-read messages', () => {
        renderHook(() =>
            useReadReceipts({
                conversationId: 'conv-1',
                currentUserId: 'user-1',
                messages: [
                    { id: 'msg-1', receiver_id: 'user-1', sender_id: 'user-2', is_read: true },
                ],
            })
        );

        act(() => vi.advanceTimersByTime(500));
        expect(mockMarkConversationRead).not.toHaveBeenCalled();
    });

    it('calls onMarkedRead callback after successful mark', async () => {
        const onMarkedRead = vi.fn();

        renderHook(() =>
            useReadReceipts({
                conversationId: 'conv-1',
                currentUserId: 'user-1',
                messages: [
                    { id: 'msg-1', receiver_id: 'user-1', sender_id: 'user-2', is_read: false },
                    { id: 'msg-2', receiver_id: 'user-1', sender_id: 'user-2', is_read: false },
                ],
                onMarkedRead,
            })
        );

        await act(async () => {
            vi.advanceTimersByTime(400);
            await vi.runAllTimersAsync();
        });

        expect(onMarkedRead).toHaveBeenCalledWith(
            expect.arrayContaining(['msg-1', 'msg-2'])
        );
    });
});
