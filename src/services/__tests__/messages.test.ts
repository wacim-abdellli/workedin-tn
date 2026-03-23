import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
    selectCalls: [] as Array<{ table: string; columns: string }>,
    eqCalls: [] as Array<{ table: string; column: string; value: unknown }>,
    orCalls: [] as Array<{ table: string; value: string }>,
    orderCalls: [] as Array<{ table: string; column: string; options?: unknown }>,
    updateCalls: [] as Array<{ table: string; value: unknown }>,
    rpcCalls: [] as Array<{ fn: string; params: unknown }>,
    channelCalls: [] as string[],
    onCalls: [] as Array<{ channel: string; event: string; config: unknown }>,
    rpcResult: { data: 'message-1', error: null as unknown },
}));

vi.mock('@/lib/supabase', () => {
    const builder = {
        select: vi.fn((columns: string) => {
            state.selectCalls.push({ table: 'messages', columns });
            return builder;
        }),
        eq: vi.fn((column: string, value: unknown) => {
            state.eqCalls.push({ table: 'messages', column, value });
            return builder;
        }),
        or: vi.fn((value: string) => {
            state.orCalls.push({ table: 'messages', value });
            return builder;
        }),
        order: vi.fn((column: string, options?: unknown) => {
            state.orderCalls.push({ table: 'messages', column, options });
            return builder;
        }),
        update: vi.fn((value: unknown) => {
            state.updateCalls.push({ table: 'messages', value });
            return builder;
        }),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: [], error: null })),
    };

    return {
        supabase: {
            from: vi.fn(() => builder),
            rpc: vi.fn(async (fn: string, params: unknown) => {
                state.rpcCalls.push({ fn, params });
                return state.rpcResult;
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
        state.selectCalls = [];
        state.eqCalls = [];
        state.orCalls = [];
        state.orderCalls = [];
        state.updateCalls = [];
        state.rpcCalls = [];
        state.channelCalls = [];
        state.onCalls = [];
        state.rpcResult = { data: 'message-1', error: null };
    });

    it('loads conversations and contract messages', async () => {
        await getConversations('user-1');
        await getMessages('contract-1');

        expect(state.selectCalls).toEqual(expect.arrayContaining([
            expect.objectContaining({ columns: expect.stringContaining('sender:profiles!sender_id') }),
            expect.objectContaining({ columns: expect.stringContaining('sender:profiles!sender_id') }),
        ]));
        expect(state.orCalls).toContainEqual({
            table: 'messages',
            value: 'sender_id.eq.user-1,receiver_id.eq.user-1',
        });
        expect(state.eqCalls).toContainEqual({
            table: 'messages',
            column: 'contract_id',
            value: 'contract-1',
        });
        expect(state.orderCalls).toEqual(expect.arrayContaining([
            { table: 'messages', column: 'created_at', options: { ascending: false } },
            { table: 'messages', column: 'created_at', options: { ascending: true } },
        ]));
    });

    it('sends messages successfully and supports read updates and subscriptions', async () => {
        const result = await sendMessage({
            contract_id: 'contract-1',
            sender_id: 'sender-1',
            receiver_id: 'receiver-1',
            content: 'Hello',
            attachments: [{ name: 'brief.pdf', url: 'https://files/brief.pdf', type: 'application/pdf', size: '20KB' }],
            message_type: 'file',
        });
        await markMessageRead('message-1');
        const subscription = subscribeToMessages('contract-1', vi.fn());

        expect(result).toEqual({ data: 'message-1', error: null });
        expect(state.rpcCalls).toContainEqual({
            fn: 'send_message',
            params: {
                p_contract_id: 'contract-1',
                p_sender_id: 'sender-1',
                p_receiver_id: 'receiver-1',
                p_content: 'Hello',
                p_attachments: [{ name: 'brief.pdf', url: 'https://files/brief.pdf', type: 'application/pdf', size: '20KB' }],
                p_message_type: 'file',
            },
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

    it('normalizes rate-limit and generic send_message failures', async () => {
        state.rpcResult = { data: null, error: new Error('rate_limit_exceeded') };
        const rateLimited = await sendMessage({
            contract_id: 'contract-1',
            sender_id: 'sender-1',
            receiver_id: 'receiver-1',
            content: 'Slow down',
        });

        state.rpcResult = { data: null, error: 'plain failure' };
        const generic = await sendMessage({
            contract_id: 'contract-1',
            sender_id: 'sender-1',
            receiver_id: 'receiver-1',
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
