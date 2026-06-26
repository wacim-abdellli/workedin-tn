import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryState = vi.hoisted(() => {
    const state = {
        fromCalls: [] as string[],
        eqCalls: [] as Array<{ column: string; value: unknown }>,
        updateCalls: [] as unknown[],
        insertCalls: [] as unknown[],
        singleCalls: 0,
        maybeSingleCalls: 0,
        channelCalls: [] as string[],
        onCalls: [] as Array<{ event: string; config: unknown }>,
        removeChannelCalls: 0,
        tableResults: {} as Record<string, unknown>,
        builderResult: { data: null as unknown, error: null as unknown },
        // mock helper for conversations
        conversationIdResult: { data: 'conv-123', error: null as unknown },
    };

    const reset = () => {
        state.fromCalls = [];
        state.eqCalls = [];
        state.updateCalls = [];
        state.insertCalls = [];
        state.singleCalls = 0;
        state.maybeSingleCalls = 0;
        state.channelCalls = [];
        state.onCalls = [];
        state.removeChannelCalls = 0;
        state.tableResults = {};
        state.builderResult = { data: null, error: null };
        state.conversationIdResult = { data: 'conv-123', error: null };
    };

    return { state, reset };
});

vi.mock('@/lib/supabase', () => {
    const builders = new Map<string, ReturnType<typeof createBuilder>>();

    function createBuilder(table: string) {
        const builder = {
            select: vi.fn(() => builder),
            eq: vi.fn((column: string, value: unknown) => {
                queryState.state.eqCalls.push({ column, value });
                return builder;
            }),
            update: vi.fn((value: unknown) => {
                queryState.state.updateCalls.push(value);
                return builder;
            }),
            insert: vi.fn((value: unknown) => {
                queryState.state.insertCalls.push(value);
                return builder;
            }),
            single: vi.fn(async () => {
                queryState.state.singleCalls++;
                return queryState.state.tableResults[table] ?? queryState.state.builderResult;
            }),
            maybeSingle: vi.fn(async () => {
                queryState.state.maybeSingleCalls++;
                return queryState.state.tableResults[table] ?? queryState.state.builderResult;
            }),
            then: (resolve: (value: unknown) => unknown) => {
                const res = queryState.state.tableResults[table] ?? queryState.state.builderResult;
                return Promise.resolve(resolve(res));
            },
        };
        builders.set(table, builder);
        return builder;
    }

    const channelMock = (name: string) => {
        queryState.state.channelCalls.push(name);
        const channelObj = {
            on: vi.fn((event: string, config: unknown, callback: (payload: any) => void) => {
                queryState.state.onCalls.push({ event, config });
                // Store callback on the mock to allow triggering it manually
                (channelObj as any)._triggeredCallback = callback;
                return channelObj;
            }),
            subscribe: vi.fn(() => channelObj),
        };
        return channelObj;
    };

    return {
        supabase: {
            from: vi.fn((table: string) => {
                queryState.state.fromCalls.push(table);
                return builders.get(table) ?? createBuilder(table);
            }),
            channel: vi.fn((name: string) => channelMock(name)),
            removeChannel: vi.fn(async () => {
                queryState.state.removeChannelCalls++;
            }),
        },
    };
});

// Mock conversations service helper
vi.mock('../conversations', () => ({
    getOrCreateConversationId: vi.fn(async () => {
        return {
            data: queryState.state.conversationIdResult.data,
            error: queryState.state.conversationIdResult.error,
        };
    }),
}));

import { markMessageRead, subscribeToMessages, sendContractMessage } from '../legacy';
import {
    subscribeToConversation,
    subscribeToIncomingMessages,
    subscribeToConversations,
    unsubscribeFromChannel
} from '../subscriptions';

describe('legacy messages service', () => {
    beforeEach(() => {
        queryState.reset();
    });

    it('markMessageRead updates message read flag', async () => {
        await markMessageRead('msg-123');
        expect(queryState.state.fromCalls).toContain('messages');
        expect(queryState.state.updateCalls).toContainEqual({ is_read: true });
        expect(queryState.state.eqCalls).toContainEqual({ column: 'id', value: 'msg-123' });
    });

    it('subscribeToMessages sets up channel subscription', () => {
        const chan = subscribeToMessages('contract-1', () => {});
        expect(queryState.state.channelCalls).toContain('messages:contract-1');
        expect(queryState.state.onCalls).toContainEqual({
            event: 'postgres_changes',
            config: {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: 'contract_id=eq.contract-1',
            },
        });
        expect(chan).toBeDefined();
    });

    it('sendContractMessage succeeds under valid permission and settings', async () => {
        queryState.state.tableResults.conversations = {
            data: { participant_1: 'user-sender', participant_2: 'user-receiver' },
            error: null,
        };
        queryState.state.tableResults.messages = {
            data: { id: 'msg-sent', content: 'hello' },
            error: null,
        };

        const result = await sendContractMessage({
            contract_id: 'contract-1',
            sender_id: 'user-sender',
            receiver_id: 'user-receiver',
            content: 'hello',
        });

        expect(result.data).toEqual({ id: 'msg-sent', content: 'hello' });
        expect(result.error).toBeNull();
        expect(queryState.state.fromCalls).toContain('conversations');
        expect(queryState.state.fromCalls).toContain('messages');
    });

    it('sendContractMessage aborts when conversation cannot be resolved', async () => {
        queryState.state.conversationIdResult = {
            data: null,
            error: new Error('Failed to resolve conversation id'),
        };

        const result = await sendContractMessage({
            contract_id: 'contract-1',
            sender_id: 'user-sender',
            receiver_id: 'user-receiver',
            content: 'hello',
        });

        expect(result.data).toBeNull();
        expect(result.error?.message).toContain('Failed to resolve conversation id');
    });

    it('sendContractMessage aborts when conversation is missing or query fails', async () => {
        queryState.state.tableResults.conversations = {
            data: null,
            error: new Error('Database select fail'),
        };

        const result = await sendContractMessage({
            contract_id: 'contract-1',
            sender_id: 'user-sender',
            receiver_id: 'user-receiver',
            content: 'hello',
        });

        expect(result.data).toBeNull();
        expect(result.error?.message).toContain('Database select fail');
    });

    it('sendContractMessage aborts when user is not a participant', async () => {
        queryState.state.tableResults.conversations = {
            data: { participant_1: 'other-user-1', participant_2: 'other-user-2' },
            error: null,
        };

        const result = await sendContractMessage({
            contract_id: 'contract-1',
            sender_id: 'user-sender',
            receiver_id: 'user-receiver',
            content: 'hello',
        });

        expect(result.data).toBeNull();
        expect(result.error?.message).toContain('Permission Denied');
    });
});

describe('subscriptions messages service', () => {
    beforeEach(() => {
        queryState.reset();
    });

    it('subscribeToConversation binds listener', () => {
        subscribeToConversation('conv-1', () => {});
        expect(queryState.state.channelCalls).toContain('messages:conv-1');
        expect(queryState.state.onCalls).toContainEqual({
            event: 'postgres_changes',
            config: {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: 'conversation_id=eq.conv-1',
            },
        });
    });

    it('subscribeToIncomingMessages binds listener', () => {
        subscribeToIncomingMessages('user-1', () => {});
        expect(queryState.state.channelCalls).toContain('incoming_messages:user-1');
        expect(queryState.state.onCalls).toContainEqual({
            event: 'postgres_changes',
            config: {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: 'receiver_id=eq.user-1',
            },
        });
    });

    it('subscribeToConversations binds listener and handles participant checks and scopes', () => {
        let callbackTriggered = 0;
        const chan = subscribeToConversations('user-123', ['contract'], () => {
            callbackTriggered++;
        });

        expect(queryState.state.channelCalls).toContain('conversations:user-123');
        expect(queryState.state.onCalls).toContainEqual({
            event: 'postgres_changes',
            config: {
                event: '*',
                schema: 'public',
                table: 'conversations',
            },
        });

        const triggeredCallback = (chan as any)._triggeredCallback;
        expect(triggeredCallback).toBeDefined();

        // 1. Non-participant payload: callback should NOT trigger
        triggeredCallback({
            new: { participant_1: 'user-other', participant_2: 'user-other-2', conversation_scope: 'contract' }
        });
        expect(callbackTriggered).toBe(0);

        // 2. Participant but out of scope: callback should NOT trigger
        triggeredCallback({
            new: { participant_1: 'user-123', participant_2: 'user-other', conversation_scope: 'direct' }
        });
        expect(callbackTriggered).toBe(0);

        // 3. Participant with matching scope: callback triggers
        triggeredCallback({
            new: { participant_1: 'user-123', participant_2: 'user-other', conversation_scope: 'contract' }
        });
        expect(callbackTriggered).toBe(1);
    });

    it('unsubscribeFromChannel removes channel', async () => {
        const mockChan = {} as any;
        await unsubscribeFromChannel(mockChan);
        expect(queryState.state.removeChannelCalls).toBe(1);
    });
});
