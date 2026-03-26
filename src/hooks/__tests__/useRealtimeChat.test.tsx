import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const chatState = vi.hoisted(() => ({
    messagesResult: [] as unknown[],
    profileResult: null as null | {
        id: string;
        full_name: string;
        avatar_url?: string;
        user_type: string;
    },
    insertHandler: null as null | ((payload: { new: Record<string, unknown> }) => Promise<void> | void),
    presenceHandler: null as null | (() => void),
    subscribeHandler: null as null | ((status: string) => Promise<void> | void),
    track: vi.fn(),
    removeChannel: vi.fn(),
    presenceState: vi.fn(),
    sendMessageRecord: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        error: vi.fn(),
    },
}));

vi.mock('@/services/messages', () => ({
    sendContractMessage: chatState.sendMessageRecord,
}));

vi.mock('@/lib/supabase', () => {
    const channel = {
        on: vi.fn((event: string, _config: unknown, callback: unknown) => {
            if (event === 'postgres_changes') {
                chatState.insertHandler = callback as (payload: { new: Record<string, unknown> }) => Promise<void>;
            }

            if (event === 'presence') {
                chatState.presenceHandler = callback as () => void;
            }

            return channel;
        }),
        subscribe: vi.fn((callback: (status: string) => void) => {
            chatState.subscribeHandler = callback;
            return channel;
        }),
        track: chatState.track,
        presenceState: chatState.presenceState,
    };

    const createMessagesBuilder = () => {
        const builder = {
            select: vi.fn(() => builder),
            eq: vi.fn(() => builder),
            order: vi.fn(async () => ({
                data: chatState.messagesResult,
                error: null,
            })),
        };

        return builder;
    };

    const createProfilesBuilder = () => {
        const builder = {
            select: vi.fn(() => builder),
            eq: vi.fn(() => builder),
            single: vi.fn(async () => ({
                data: chatState.profileResult,
                error: null,
            })),
        };

        return builder;
    };

    return {
        supabase: {
            from: vi.fn((table: string) =>
                table === 'messages' ? createMessagesBuilder() : createProfilesBuilder()
            ),
            channel: vi.fn(() => channel),
            removeChannel: chatState.removeChannel,
        },
    };
});

import { logger } from '@/lib/logger';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';

describe('useRealtimeChat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        chatState.messagesResult = [
            {
                id: 'message-1',
                contract_id: 'contract-1',
                sender_id: 'user-2',
                receiver_id: 'user-1',
                content: 'Initial message',
                attachments: [],
                created_at: '2026-03-23T00:00:00.000Z',
                sender: {
                    id: 'user-2',
                    full_name: 'Other User',
                    avatar_url: 'https://avatar.example/2.png',
                    user_type: 'client',
                },
            },
        ];
        chatState.profileResult = {
            id: 'user-2',
            full_name: 'Other User',
            avatar_url: 'https://avatar.example/2.png',
            user_type: 'client',
        };
        chatState.insertHandler = null;
        chatState.presenceHandler = null;
        chatState.subscribeHandler = null;
        chatState.presenceState.mockReturnValue({});
        chatState.sendMessageRecord.mockResolvedValue({ error: null });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('fetches messages, tracks presence, handles realtime inserts, and cleans up', async () => {
        const { result, unmount } = renderHook(() =>
            useRealtimeChat({
                contractId: 'contract-1',
                userId: 'user-1',
            })
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.messages).toHaveLength(1);
        });

        await act(async () => {
            await chatState.subscribeHandler?.('SUBSCRIBED');
        });

        expect(chatState.track).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'user-1',
            typing: false,
        }));

        await act(async () => {
            await chatState.insertHandler?.({
                new: {
                    id: 'message-2',
                    contract_id: 'contract-1',
                    sender_id: 'user-2',
                    receiver_id: 'user-1',
                    content: 'Realtime hello',
                    attachments: [],
                    created_at: '2026-03-23T00:01:00.000Z',
                },
            });
        });

        await waitFor(() => {
            expect(result.current.messages).toHaveLength(2);
        });

        await act(async () => {
            await chatState.insertHandler?.({
                new: {
                    id: 'message-2',
                    contract_id: 'contract-1',
                    sender_id: 'user-2',
                    receiver_id: 'user-1',
                    content: 'Realtime hello',
                    attachments: [],
                    created_at: '2026-03-23T00:01:00.000Z',
                },
            });
        });

        expect(result.current.messages).toHaveLength(2);

        chatState.presenceState.mockReturnValue({
            'presence-1': [{ user_id: 'user-2', typing: true }],
            'presence-2': [{ user_id: 'user-1', typing: false }],
        });

        act(() => {
            chatState.presenceHandler?.();
        });

        expect(result.current.otherUserTyping).toBe(true);

        unmount();

        expect(chatState.removeChannel).toHaveBeenCalledTimes(1);
    });

    it('sends trimmed messages, toggles typing state, and auto-resets typing', async () => {
        const { result } = renderHook(() =>
            useRealtimeChat({
                contractId: 'contract-1',
                userId: 'user-1',
            })
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        vi.useFakeTimers();

        await act(async () => {
            await chatState.subscribeHandler?.('SUBSCRIBED');
            await result.current.sendMessage('  Hello there  ', 'user-2');
        });

        expect(chatState.sendMessageRecord).toHaveBeenCalledWith({
            contract_id: 'contract-1',
            sender_id: 'user-1',
            receiver_id: 'user-2',
            content: 'Hello there',
            attachments: [],
        });
        expect(result.current.isSending).toBe(false);

        await act(async () => {
            await result.current.sendMessage('   ', 'user-2');
        });

        expect(chatState.sendMessageRecord).toHaveBeenCalledTimes(1);

        act(() => {
            result.current.setTyping(true);
        });

        expect(result.current.isTyping).toBe(true);
        expect(chatState.track).toHaveBeenLastCalledWith(expect.objectContaining({
            user_id: 'user-1',
            typing: true,
        }));

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(result.current.isTyping).toBe(false);
        expect(chatState.track).toHaveBeenLastCalledWith(expect.objectContaining({
            user_id: 'user-1',
            typing: false,
        }));

        vi.useRealTimers();
    });

    it('surfaces fetch and send errors and skips disabled chat setup', async () => {
        chatState.messagesResult = [];
        chatState.sendMessageRecord.mockResolvedValueOnce({
            error: new Error('send failed'),
        });

        const { result } = renderHook(() =>
            useRealtimeChat({
                contractId: 'contract-1',
                userId: 'user-1',
                enabled: false,
            })
        );

        expect(result.current.messages).toEqual([]);
        expect(result.current.isLoading).toBe(true);

        const activeHook = renderHook(() =>
            useRealtimeChat({
                contractId: 'contract-1',
                userId: 'user-1',
            })
        );

        await waitFor(() => {
            expect(activeHook.result.current.isLoading).toBe(false);
        });

        await expect(
            activeHook.result.current.sendMessage('fail me', 'user-2')
        ).rejects.toThrow('send failed');

        expect(logger.error).toHaveBeenCalledWith('Error sending message:', expect.any(Error));
    });
});
