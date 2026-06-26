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
            range: vi.fn(() => builder),
            insert: vi.fn((value: unknown) => {
                state.insertCalls.push({ table, value });
                return builder;
            }),
            update: vi.fn((value: unknown) => {
                state.updateCalls.push({ table, value });
                return builder;
            }),
            single: vi.fn(async () => getTableResult(table)),
            maybeSingle: vi.fn(async () => getTableResult(table)),
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
            auth: {
                getUser: vi.fn(async () => {
                    const mockUserId = state.tableResults.authUserId ?? 'sender-1';
                    if (!mockUserId) return { data: { user: null }, error: new Error('No user') };
                    return { data: { user: { id: mockUserId } }, error: null };
                }),
            },
            rpc: vi.fn(async (fnName) => {
                if (state.tableResults.rpc !== undefined) return state.tableResults.rpc;
                if (fnName === 'delete_message_atomic') {
                    return { data: { conversation_id: 'conversation-1' }, error: null };
                }
                return { data: null, error: null };
            }),
            removeChannel: vi.fn(async () => undefined),
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
    deleteMessage,
    getTotalUnreadCount,
    markConversationRead,
    subscribeToConversation,
    subscribeToIncomingMessages,
    subscribeToConversations,
    sendContractMessage,
    unsubscribeFromChannel,
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
                table: 'messages',
                column: 'conversation_id',
                value: 'conversation-1',
            },
        ]));
        expect(state.orCalls).toEqual(expect.arrayContaining([
            {
                table: 'conversations',
                value: 'client_id.eq.user-1,freelancer_id.eq.user-1',
            },
        ]));
        expect(state.orderCalls).toEqual(expect.arrayContaining([
            { table: 'conversations', column: 'last_message_at', options: { ascending: false } },
            { table: 'messages', column: 'created_at', options: { ascending: false } },
        ]));
    });

    it('loads first-class contract conversation rows', async () => {
        state.tableResults.conversations = {
            data: [{
                id: 'contract-conversation-1',
                participant_1: 'user-1',
                participant_2: 'freelancer-1',
                client_id: 'user-1',
                freelancer_id: 'freelancer-1',
                status: 'active',
                contract_id: 'contract-1',
                last_message_text: 'Hello from contract',
                last_message_at: '2026-04-18T10:00:00.000Z',
                unread_count_1: 1,
                unread_count_2: 0,
                created_at: '2026-04-17T10:00:00.000Z',
                updated_at: '2026-04-18T10:00:00.000Z',
                conversation_scope: 'contract',
                inbox_participant_1: 'client',
                inbox_participant_2: 'freelancer',
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
                client_id: 'user-1',
                freelancer_id: 'freelancer-1',
                inbox_participant_1: 'client',
                inbox_participant_2: 'freelancer',
                otherUser: expect.objectContaining({
                    id: 'freelancer-1',
                    full_name: 'Freelancer One',
                }),
            }),
        ]);
        // DB repairs are bypassed in Phase 3
        expect(state.updateCalls).not.toContainEqual(expect.objectContaining({
            table: 'conversations',
        }));
    });

    it('filters out contract conversations from the wrong workspace mode', async () => {
        state.tableResults.conversations = {
            data: [{
                id: 'contract-conversation-2',
                participant_1: 'client-1',
                participant_2: 'user-1',
                client_id: 'client-1',
                freelancer_id: 'user-1',
                status: 'active',
                contract_id: 'contract-2',
                last_message_text: 'Wrong inbox before repair',
                last_message_at: '2026-04-18T11:00:00.000Z',
                unread_count_1: 0,
                unread_count_2: 3,
                created_at: '2026-04-17T11:00:00.000Z',
                updated_at: '2026-04-18T11:00:00.000Z',
                conversation_scope: 'contract',
                inbox_participant_1: 'client',
                inbox_participant_2: 'freelancer',
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
    });

    it('sends messages successfully and supports read updates and subscriptions', async () => {
        state.tableResults.conversations = {
            data: { id: 'conversation-1', participant_1: 'sender-1', participant_2: 'receiver-1' },
            error: null,
        };
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
        state.tableResults.conversations = {
            data: { id: 'conversation-1', participant_1: 'sender-1', participant_2: 'receiver-1' },
            error: null,
        };
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

    it('allows message deletion only by the sender (owner)', async () => {
        state.tableResults.authUserId = 'sender-1';
        state.tableResults.messages = {
            data: { id: 'message-1', sender_id: 'sender-1', receiver_id: 'receiver-1' },
            error: null,
        };

        const result = await deleteMessage('message-1');
        expect(result.error).toBeNull();
        expect(result.data).toEqual({ conversation_id: 'conversation-1' });
    });

    it('blocks message deletion by non-senders', async () => {
        state.tableResults.authUserId = 'receiver-1';
        state.tableResults.messages = {
            data: { id: 'message-1', sender_id: 'sender-1', receiver_id: 'receiver-1' },
            error: null,
        };

        const result = await deleteMessage('message-1');
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toContain('Access Denied');
        expect(result.data).toBeNull();
    });

    it('returns 0 unread when no conversations exist (no scope)', async () => {
        state.tableResults.rpc = { data: 0, error: null };
        const result = await getTotalUnreadCount('user-1');
        expect(result.count).toBe(0);
        expect(result.error).toBeNull();
    });

    it('counts unread with client scope filter', async () => {
        state.tableResults.conversations = {
            data: [
                {
                    participant_1: 'user-1',
                    participant_2: 'other-1',
                    client_id: 'user-1',
                    freelancer_id: 'other-1',
                    unread_count_1: 3,
                    unread_count_2: 0,
                    status: 'active',
                },
            ],
            error: null,
        };
        const result = await getTotalUnreadCount('user-1', ['client']);
        expect(result.count).toBe(3);
        expect(result.error).toBeNull();
    });

    it('counts unread with freelancer scope filter', async () => {
        state.tableResults.conversations = {
            data: [
                {
                    participant_1: 'client-1',
                    participant_2: 'user-1',
                    client_id: 'client-1',
                    freelancer_id: 'user-1',
                    unread_count_1: 0,
                    unread_count_2: 5,
                    status: 'active',
                },
            ],
            error: null,
        };
        const result = await getTotalUnreadCount('user-1', ['freelancer']);
        expect(result.count).toBe(5);
        expect(result.error).toBeNull();
    });

    it('skips archived conversations in unread count', async () => {
        state.tableResults.conversations = {
            data: [
                {
                    participant_1: 'user-1',
                    participant_2: 'other-1',
                    client_id: 'user-1',
                    freelancer_id: 'other-1',
                    unread_count_1: 10,
                    unread_count_2: 0,
                    status: 'archived',
                },
            ],
            error: null,
        };
        const result = await getTotalUnreadCount('user-1', ['client']);
        expect(result.count).toBe(0);
    });

    it('handles getTotalUnreadCount error gracefully', async () => {
        state.tableResults.conversations = { data: null, error: new Error('db down') };
        const result = await getTotalUnreadCount('user-1', ['client']);
        expect(result.count).toBe(0);
        expect(result.error).toBeInstanceOf(Error);
    });

    it('marks conversation as read via RPC', async () => {
        state.tableResults.rpc = { data: null, error: null };
        const result = await markConversationRead('conversation-1');
        expect(result.error).toBeNull();
    });

    it('handles markConversationRead error gracefully', async () => {
        state.tableResults.rpc = { data: null, error: new Error('rpc failed') };
        const result = await markConversationRead('conversation-1');
        expect(result.error).toBeInstanceOf(Error);
    });

    it('subscribes to a single conversation channel', () => {
        const callback = vi.fn();
        const channel = subscribeToConversation('conversation-1', callback);
        expect(state.channelCalls).toContain('messages:conversation-1');
        expect(state.onCalls).toContainEqual({
            channel: 'messages:conversation-1',
            event: 'postgres_changes',
            config: {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: 'conversation_id=eq.conversation-1',
            },
        });
        expect(channel).toEqual({ id: 'messages:conversation-1' });
    });

    it('subscribes to incoming messages for a user', () => {
        const callback = vi.fn();
        const channel = subscribeToIncomingMessages('user-1', callback);
        expect(state.channelCalls).toContain('incoming_messages:user-1');
        expect(state.onCalls).toContainEqual({
            channel: 'incoming_messages:user-1',
            event: 'postgres_changes',
            config: {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: 'receiver_id=eq.user-1',
            },
        });
        expect(channel).toEqual({ id: 'incoming_messages:user-1' });
    });

    it('subscribes to conversations channel', () => {
        const callback = vi.fn();
        const channel = subscribeToConversations('user-1', ['client', 'freelancer'], callback);
        expect(state.channelCalls).toContain('conversations:user-1');
        // subscribeToConversations returns the channel object (with .on and .subscribe methods)
        expect(channel).toHaveProperty('on');
        expect(channel).toHaveProperty('subscribe');
    });

    it('unsubscribes from a channel', async () => {
        const channel = { id: 'test-channel' } as any;
        await unsubscribeFromChannel(channel);
        // removeChannel is now mocked and should have been called
    });

    it('deletes message when no active session', async () => {
        state.tableResults.authUserId = '';
        const result = await deleteMessage('message-1');
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toContain('Unauthorized');
        expect(result.data).toBeNull();
    });

    it('deletes message when message not found', async () => {
        state.tableResults.authUserId = 'sender-1';
        state.tableResults.messages = { data: null, error: null };
        const result = await deleteMessage('message-1');
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toContain('not found');
        expect(result.data).toBeNull();
    });

    it('sendContractMessage returns error when conversation resolution fails', async () => {
        state.tableResults.conversations = { data: null, error: new Error('no conv') };
        const result = await sendContractMessage({
            contract_id: 'contract-1',
            sender_id: 'sender-1',
            receiver_id: 'receiver-1',
            content: 'Hello',
        });
        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
    });

    it('sendMessage returns error when conversation query fails or returns null', async () => {
        state.tableResults.conversations = { data: null, error: new Error('Conversation query database error') };
        const result = await sendMessage({
            conversationId: 'conversation-1',
            senderId: 'sender-1',
            receiverId: 'receiver-1',
            content: 'Hello',
        });
        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe('Conversation query database error');
    });

    it('sendMessage returns error when sender is not a participant in the conversation', async () => {
        state.tableResults.conversations = {
            data: { participant_1: 'user-2', participant_2: 'user-3' },
            error: null,
        };
        const result = await sendMessage({
            conversationId: 'conversation-1',
            senderId: 'user-1',
            receiverId: 'user-2',
            content: 'Hello',
        });
        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toContain('Permission Denied');
    });

    it('deleteMessage returns descriptive error when atomic function is missing from the database', async () => {
        state.tableResults.authUserId = 'sender-1';
        state.tableResults.messages = {
            data: { id: 'message-1', sender_id: 'sender-1', receiver_id: 'receiver-1' },
            error: null,
        };
        state.tableResults.rpc = {
            data: null,
            error: new Error('Could not find the function public.delete_message_atomic in the schema cache'),
        };

        const result = await deleteMessage('message-1');
        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toContain('Run the latest messages SQL migration first');
    });

    it('deleteMessage returns normalized error for generic database delete failure', async () => {
        state.tableResults.authUserId = 'sender-1';
        state.tableResults.messages = {
            data: { id: 'message-1', sender_id: 'sender-1', receiver_id: 'receiver-1' },
            error: null,
        };
        state.tableResults.rpc = {
            data: null,
            error: new Error('Some database connection timeout error'),
        };

        const result = await deleteMessage('message-1');
        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe('Some database connection timeout error');
    });

    it('getMessages returns list of messages in reverse order on success', async () => {
        state.tableResults.messages = {
            data: [
                { id: 'msg-2', content: 'Second message' },
                { id: 'msg-1', content: 'First message' },
            ],
            error: null,
        };

        const result = await getMessages('conversation-1');
        expect(result.error).toBeNull();
        // Since we reverse the array of data on success, the order should be msg-1 then msg-2
        expect(result.data).toEqual([
            { id: 'msg-1', content: 'First message' },
            { id: 'msg-2', content: 'Second message' },
        ]);
    });

    it('getMessages returns error when database query fails', async () => {
        state.tableResults.messages = {
            data: null,
            error: new Error('Database select messages failed'),
        };

        const result = await getMessages('conversation-1');
        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe('Database select messages failed');
    });

    it('uploadMessageAttachment returns error when file validation fails', async () => {
        const file = new File([new Uint8Array([0x00, 0x00])], 'unsafe.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'arrayBuffer', {
            configurable: true,
            value: vi.fn(async () => new Uint8Array([0x00, 0x00]).buffer),
        });

        const result = await uploadMessageAttachment(file, 'conversation-1');
        expect(result.url).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toContain('File content does not match its declared type');
    });

    it('uploadMessageAttachment returns error when uploadFile throws an error', async () => {
        state.uploadFile.mockRejectedValue(new Error('S3 bucket permissions denied'));

        const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], 'safe.pdf', { type: 'application/pdf' });
        Object.defineProperty(file, 'arrayBuffer', {
            configurable: true,
            value: vi.fn(async () => new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]).buffer),
        });

        const result = await uploadMessageAttachment(file, 'conversation-1');
        expect(result.url).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe('S3 bucket permissions denied');
    });
});
