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
    uploadFile: vi.fn(async () => 'https://mock-url.com/file.jpg'),
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
            in: vi.fn(async () => getTableResult(table)),
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
        uploadFile: state.uploadFile,
    };
});

import {
    getConversations,
    getMessages,
    markMessageRead,
    sendMessage,
    subscribeToMessages,
    uploadMessageAttachment,
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
        state.uploadFile.mockClear();
        state.tableResults = {
            conversations: { data: [], error: null },
            contracts: { data: [], error: null },
            messages: { data: [], error: null },
            public_profiles: { data: [], error: null },
        };
    });

    it('loads conversations and conversation messages', async () => {
        await getConversations('user-1');
        await getMessages('conversation-1');

        expect(state.selectCalls).toEqual(expect.arrayContaining([
            expect.objectContaining({ table: 'conversations', columns: expect.stringContaining('participant_1, participant_2') }),
            expect.objectContaining({ table: 'messages', columns: '*' }),
        ]));
        expect(state.eqCalls).toEqual(expect.arrayContaining([
            {
                table: 'conversations',
                column: 'participant_1',
                value: 'user-1',
            },
            {
                table: 'conversations',
                column: 'participant_2',
                value: 'user-1',
            },
            {
                table: 'messages',
                column: 'conversation_id',
                value: 'conversation-1',
            },
        ]));
        expect(state.orderCalls).toEqual(expect.arrayContaining([
            { table: 'conversations', column: 'last_message_at', options: { ascending: false } },
            { table: 'messages', column: 'created_at', options: { ascending: false } },
        ]));
    });

    it('repairs legacy contract inbox rows before returning them', async () => {
        state.tableResults.conversations = {
            data: [{
                id: 'contract-conversation-1',
                participant_1: 'user-1',
                participant_2: 'freelancer-1',
                contract_id: 'contract-1',
                last_message_text: 'Hello from contract',
                last_message_at: '2026-04-18T10:00:00.000Z',
                unread_count_1: 1,
                unread_count_2: 0,
                created_at: '2026-04-17T10:00:00.000Z',
                updated_at: '2026-04-18T10:00:00.000Z',
                conversation_scope: 'contract',
                inbox_participant_1: 'contract',
                inbox_participant_2: 'contract',
            }],
            error: null,
        };
        state.tableResults.contracts = {
            data: [{
                id: 'contract-1',
                client_id: 'user-1',
                freelancer_id: 'freelancer-1',
            }],
            error: null,
        };
        state.tableResults.public_profiles = {
            data: [{
                id: 'freelancer-1',
                full_name: 'Freelancer One',
                avatar_url: null,
                username: 'freelancer-one',
            }],
            error: null,
        };

        const result = await getConversations('user-1', 0, 20, {
            scopes: ['client', 'contract', 'shared'],
        });

        expect(result.error).toBeNull();
        expect(result.data).toEqual([
            expect.objectContaining({
                id: 'contract-conversation-1',
                inbox_participant_1: 'client',
                inbox_participant_2: 'freelancer',
                otherUser: expect.objectContaining({
                    id: 'freelancer-1',
                    full_name: 'Freelancer One',
                }),
            }),
        ]);
        expect(state.updateCalls).toContainEqual({
            table: 'conversations',
            value: {
                conversation_scope: 'contract',
                inbox_participant_1: 'client',
                inbox_participant_2: 'freelancer',
            },
        });
    });

    it('drops repaired contract rows from the wrong mode scope', async () => {
        state.tableResults.conversations = {
            data: [{
                id: 'contract-conversation-2',
                participant_1: 'client-1',
                participant_2: 'user-1',
                contract_id: 'contract-2',
                last_message_text: 'Wrong inbox before repair',
                last_message_at: '2026-04-18T11:00:00.000Z',
                unread_count_1: 0,
                unread_count_2: 3,
                created_at: '2026-04-17T11:00:00.000Z',
                updated_at: '2026-04-18T11:00:00.000Z',
                conversation_scope: 'contract',
                inbox_participant_1: 'contract',
                inbox_participant_2: 'contract',
            }],
            error: null,
        };
        state.tableResults.contracts = {
            data: [{
                id: 'contract-2',
                client_id: 'client-1',
                freelancer_id: 'user-1',
            }],
            error: null,
        };

        const result = await getConversations('user-1', 0, 20, {
            scopes: ['client', 'contract', 'shared'],
        });

        expect(result.error).toBeNull();
        expect(result.data).toEqual([]);
        expect(result.count).toBe(0);
        expect(state.updateCalls).toContainEqual({
            table: 'conversations',
            value: {
                conversation_scope: 'contract',
                inbox_participant_1: 'client',
                inbox_participant_2: 'freelancer',
            },
        });
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

        expect(result).toEqual({
            data: expect.objectContaining({
                id: 'message-1',
                sender: {
                    id: 'sender-1',
                    full_name: 'You',
                    avatar_url: null,
                },
            }),
            error: null,
        });
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

    it('uploads message attachments inside the conversation-scoped prefix', async () => {
        const randomUuidSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('uuid-attachment-token');

        const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], 'brief @!.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'arrayBuffer', {
            configurable: true,
            value: vi.fn(async () => new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]).buffer),
        });
        const result = await uploadMessageAttachment(file, 'conversation-1');

        expect(state.uploadFile).toHaveBeenCalledWith(
            'message_attachments',
            'conversation-1/uuid-attachment-token-brief___.pdf',
            file,
        );
        expect(result).toEqual({ url: 'https://mock-url.com/file.jpg', error: null });
        randomUuidSpy.mockRestore();
    });
});
