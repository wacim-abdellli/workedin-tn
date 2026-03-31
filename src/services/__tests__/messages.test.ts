import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
    fromCalls: [] as string[],
    selectCalls: [] as Array<{ table: string; columns: string }>,
    eqCalls: [] as Array<{ table: string; column: string; value: unknown }>,
    orCalls: [] as Array<{ table: string; value: string }>,
    orderCalls: [] as Array<{ table: string; column: string; options?: unknown }>,
    updateCalls: [] as Array<{ table: string; value: unknown }>,
    insertCalls: [] as Array<{ table: string; value: unknown }>,
    channelCalls: [] as string[],
    onCalls: [] as Array<{ channel: string; event: string; config: unknown }>,
    tableResults: {} as Record<string, unknown>,
}));

vi.mock('@/lib/supabase', () => {
    const getTableResult = (table: string) =>
        state.tableResults[table] ?? { data: [], error: null };

    const createBuilder = (table: string) => {
        const builder = {
            select: vi.fn((columns: string) => {
                state.selectCalls.push({ table, columns });
                return builder;
            }),
            eq: vi.fn((column: string, value: unknown) => {
                state.eqCalls.push({ table, column, value });
                return builder;
            }),
            or: vi.fn((value: string) => {
                state.orCalls.push({ table, value });
                return builder;
            }),
            order: vi.fn((column: string, options?: unknown) => {
                state.orderCalls.push({ table, column, options });
                return builder;
            }),
            insert: vi.fn((value: unknown) => {
                state.insertCalls.push({ table, value });
                return builder;
            }),
            update: vi.fn((value: unknown) => {
                state.updateCalls.push({ table, value });
                return builder;
            }),
            single: vi.fn(async () => getTableResult(table)),
            then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(getTableResult(table))),
        };

        return builder;
    };

    return {
        supabase: {
            from: vi.fn((table: string) => {
                state.fromCalls.push(table);
                return createBuilder(table);
            }),
            channel: vi.fn((name: string) => {
                state.channelCalls.push(name);
                const channel = {
                    on: vi.fn((event: string, config: unknown, callback: unknown) => {
                        void callback;
                        state.onCalls.push({ channel: name, event, config });
                        return channel;
                    }),
                    subscribe: vi.fn(() => ({ id: name })),
                };
                return channel;
            }),
        },
        withTimeout: vi.fn(async <T>(promise: PromiseLike<T>) => promise),
        uploadFile: vi.fn(async () => 'https://mock-url.com/file.jpg'),
    };
});

import {
    getConversations,
    getMessages,
    markMessageRead,
    sendMessage,
    subscribeToMessages,
} from '@/services/messages';

describe('messages service coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.fromCalls = [];
        state.selectCalls = [];
        state.eqCalls = [];
        state.orCalls = [];
        state.orderCalls = [];
        state.updateCalls = [];
        state.insertCalls = [];
        state.channelCalls = [];
        state.onCalls = [];
        state.tableResults = {
            conversations: { data: [], error: null },
            messages: { data: [], error: null },
        };
    });

    it('loads conversations and conversation messages', async () => {
        await getConversations('user-1');
        await getMessages('conversation-1');

        // After N+1 optimization, conversations are fetched separately from profiles
        expect(state.selectCalls).toEqual(expect.arrayContaining([
            expect.objectContaining({ table: 'conversations', columns: expect.stringContaining('messages(count)') }),
            expect.objectContaining({ table: 'messages', columns: expect.stringContaining('sender:profiles!sender_id') }),
        ]));
        expect(state.orCalls).toContainEqual({
            table: 'conversations',
            value: 'participant_1.eq.user-1,participant_2.eq.user-1',
        });
        expect(state.eqCalls).toContainEqual({
            table: 'messages',
            column: 'conversation_id',
            value: 'conversation-1',
        });
        expect(state.orderCalls).toEqual(expect.arrayContaining([
            { table: 'conversations', column: 'last_message_at', options: { ascending: false } },
            { table: 'messages', column: 'created_at', options: { ascending: true } },
        ]));
    });

    it('sends messages successfully and supports read updates and subscriptions', async () => {
        state.tableResults.messages = {
            data: { id: 'message-1' },
            error: null,
        };

        const result = await sendMessage({
            conversationId: 'conversation-1',
            senderId: 'sender-1',
            receiverId: 'receiver-1',
            content: 'Hello',
            contractId: 'contract-1',
            attachments: [{ name: 'brief.pdf', url: 'https://files/brief.pdf', type: 'application/pdf', size: '20KB' }],
        });
        await markMessageRead('message-1');
        const subscription = subscribeToMessages('contract-1', vi.fn());

        expect(result).toEqual({ data: { id: 'message-1' }, error: null });
        expect(state.insertCalls).toContainEqual({
            table: 'messages',
            value: expect.objectContaining({
                conversation_id: 'conversation-1',
                sender_id: 'sender-1',
                receiver_id: 'receiver-1',
                contract_id: 'contract-1',
                content: 'Hello',
            }),
        });
        expect(state.updateCalls).toContainEqual({
            table: 'messages',
            value: { is_read: true },
        });
        expect(state.channelCalls).toContain('messages:contract-1');
        expect(state.onCalls).toContainEqual({
            channel: 'messages:contract-1',
            event: 'postgres_changes',
            config: {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: 'contract_id=eq.contract-1',
            },
        });
        expect(subscription).toEqual({ id: 'messages:contract-1' });
    });

    it('normalizes rate-limit and generic send failures', async () => {
        state.tableResults.messages = { data: null, error: new Error('rate_limit_exceeded') };
        const rateLimited = await sendMessage({
            conversationId: 'conversation-1',
            senderId: 'sender-1',
            receiverId: 'receiver-1',
            content: 'Slow down',
        });

        state.tableResults.messages = { data: null, error: 'plain failure' };
        const generic = await sendMessage({
            conversationId: 'conversation-1',
            senderId: 'sender-1',
            receiverId: 'receiver-1',
            content: 'Fallback error',
        });

        expect(rateLimited.data).toBeNull();
        expect(rateLimited.error).toBeInstanceOf(Error);
        expect((rateLimited.error as Error).message).toBe('Slow down - max 30 messages per minute.');

        expect(generic.data).toBeNull();
        expect(generic.error).toBeInstanceOf(Error);
        expect((generic.error as Error).message).toBe('plain failure');
    });
});
