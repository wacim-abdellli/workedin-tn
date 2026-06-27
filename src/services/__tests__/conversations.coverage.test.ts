import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockDataByTable: Record<string, unknown> = {};
let mockErrorByTable: Record<string, unknown> = {};
let mockRpcResult: { data: unknown; error: unknown } = { data: null, error: null };

const createMockBuilder = (
    table: string,
    singleResolver: (action: 'select' | 'insert') => { data: unknown; error: unknown } = () => ({ data: null, error: null }),
    thenResolver?: (resolve: (val: unknown) => unknown) => Promise<unknown>
) => {
    let action: 'select' | 'insert' = 'select';
    const builder = {
        select: vi.fn(() => {
            if (action !== 'insert') {
                action = 'select';
            }
            return builder;
        }),
        insert: vi.fn(() => {
            action = 'insert';
            return builder;
        }),
        eq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        is: vi.fn(() => builder),
        or: vi.fn(() => builder),
        order: vi.fn(() => builder),
        single: vi.fn(async () => singleResolver(action)),
        maybeSingle: vi.fn(async () => singleResolver(action)),
        then: vi.fn((resolve: (val: unknown) => unknown) => {
            if (thenResolver) {
                return thenResolver(resolve);
            }
            return Promise.resolve(resolve(singleResolver(action)));
        }),
    };
    return builder;
};

vi.mock('@/lib/supabase', () => {
    const defaultSingleResolver = (table: string) => ({
        data: mockDataByTable[table] !== undefined ? mockDataByTable[table] : null,
        error: mockErrorByTable[table] !== undefined ? mockErrorByTable[table] : null,
    });

    const createBuilder = (table: string) => {
        const builder = {
            select: vi.fn(() => builder),
            insert: vi.fn(() => builder),
            eq: vi.fn(() => builder),
            in: vi.fn(() => builder),
            is: vi.fn(() => builder),
            or: vi.fn(() => builder),
            order: vi.fn(() => builder),
            single: vi.fn(async () => defaultSingleResolver(table)),
            maybeSingle: vi.fn(async () => defaultSingleResolver(table)),
            then: vi.fn((resolve: (val: unknown) => unknown) => {
                return Promise.resolve(resolve(defaultSingleResolver(table)));
            }),
        };
        return builder;
    };

    return {
        supabase: {
            from: vi.fn((table: string) => createBuilder(table)),
            rpc: vi.fn(async () => mockRpcResult),
        },
    };
});

vi.mock('@/lib/supabaseWithRetry', () => ({
    supabaseWithRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

import {
    getOrCreateConversationId,
    getConversations,
    getTotalUnreadCount,
    conversationIdCache,
} from '../messages/conversations';
import { supabase } from '@/lib/supabase';

describe('conversations service coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDataByTable = {};
        mockErrorByTable = {};
        mockRpcResult = { data: null, error: null };
        conversationIdCache.clear();
    });

    describe('getOrCreateConversationId', () => {
        it('returns cached conversation id if present', async () => {
            conversationIdCache.set('user1:user2:none:shared', 'cached-id');
            const result = await getOrCreateConversationId('user1', 'user2', null, 'shared');
            expect(result.data).toBe('cached-id');
            expect(result.error).toBeNull();
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('fetches existing conversation and caches it', async () => {
            mockDataByTable = {
                conversations: { id: 'existing-id' },
            };
            const result = await getOrCreateConversationId('user-b', 'user-a', null, 'shared');
            expect(result.data).toBe('existing-id');
            expect(conversationIdCache.get('user-a:user-b:none:shared')).toBe('existing-id');
        });

        it('returns error if fetch conversation query fails', async () => {
            mockErrorByTable = {
                conversations: new Error('DB fetch error'),
            };
            const result = await getOrCreateConversationId('user-a', 'user-b');
            expect(result.data).toBeNull();
            expect(result.error?.message).toContain('DB fetch error');
        });

        it('creates a conversation when contract is specified and resolves client/freelancer roles', async () => {
            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                return createMockBuilder(
                    table,
                    (action) => {
                        if (table === 'contracts') {
                            return { data: { client_id: 'client-1', freelancer_id: 'freelancer-1' }, error: null };
                        }
                        if (table === 'conversations') {
                            if (action === 'insert') {
                                return { data: { id: 'new-conv-id' }, error: null };
                            }
                            return { data: null, error: null };
                        }
                        return { data: null, error: null };
                    }
                ) as unknown as ReturnType<typeof supabase.from>;
            });

            const result = await getOrCreateConversationId('user-a', 'user-b', 'contract-1');
            expect(result.data).toBe('new-conv-id');
        });

        it('throws contract error if contract fetch fails', async () => {
            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                return createMockBuilder(
                    table,
                    () => {
                        if (table === 'contracts') {
                            return { data: null, error: new Error('Contract not found') };
                        }
                        return { data: null, error: null };
                    }
                ) as unknown as ReturnType<typeof supabase.from>;
            });

            const result = await getOrCreateConversationId('user-a', 'user-b', 'contract-1');
            expect(result.data).toBeNull();
            expect(result.error?.message).toContain('Contract not found');
        });

        it('creates a conversation and resolves user roles from profiles if contract is missing or lacks info', async () => {
            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                return createMockBuilder(
                    table,
                    (action) => {
                        if (table === 'conversations') {
                            if (action === 'insert') {
                                return { data: { id: 'new-conv-id-2' }, error: null };
                            }
                            return { data: null, error: null };
                        }
                        return { data: null, error: null };
                    },
                    (resolve) => {
                        if (table === 'profiles') {
                            return Promise.resolve(resolve({
                                data: [
                                    { id: 'user-a', user_type: 'client' },
                                    { id: 'user-b', user_type: 'freelancer' },
                                ],
                                error: null,
                            }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }
                ) as unknown as ReturnType<typeof supabase.from>;
            });

            const result = await getOrCreateConversationId('user-a', 'user-b');
            expect(result.data).toBe('new-conv-id-2');
        });

        it('handles roles resolution branch when user 2 is client and user 1 is freelancer', async () => {
            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                return createMockBuilder(
                    table,
                    (action) => {
                        if (table === 'conversations') {
                            if (action === 'insert') {
                                return { data: { id: 'new-conv-id-3' }, error: null };
                            }
                            return { data: null, error: null };
                        }
                        return { data: null, error: null };
                    },
                    (resolve) => {
                        if (table === 'profiles') {
                            return Promise.resolve(resolve({
                                data: [
                                    { id: 'user-a', user_type: 'freelancer' },
                                    { id: 'user-b', user_type: 'client' },
                                ],
                                error: null,
                            }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }
                ) as unknown as ReturnType<typeof supabase.from>;
            });

            const result = await getOrCreateConversationId('user-a', 'user-b');
            expect(result.data).toBe('new-conv-id-3');
        });

        it('handles roles resolution fallback when user profiles have no type match', async () => {
            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                return createMockBuilder(
                    table,
                    (action) => {
                        if (table === 'conversations') {
                            if (action === 'insert') {
                                return { data: { id: 'new-conv-id-fallback' }, error: null };
                            }
                            return { data: null, error: null };
                        }
                        return { data: null, error: null };
                    },
                    (resolve) => {
                        if (table === 'profiles') {
                            return Promise.resolve(resolve({
                                data: [
                                    { id: 'user-a', user_type: 'unknown' },
                                    { id: 'user-b', user_type: 'unknown' },
                                ],
                                error: null,
                            }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }
                ) as unknown as ReturnType<typeof supabase.from>;
            });

            const result = await getOrCreateConversationId('user-a', 'user-b');
            expect(result.data).toBe('new-conv-id-fallback');
        });

        it('throws profiles error if profiles fetch fails', async () => {
            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                return createMockBuilder(
                    table,
                    () => ({ data: null, error: null }),
                    (resolve) => {
                        if (table === 'profiles') {
                            return Promise.resolve(resolve({ data: null, error: new Error('Profiles DB error') }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }
                ) as unknown as ReturnType<typeof supabase.from>;
            });

            const result = await getOrCreateConversationId('user-a', 'user-b');
            expect(result.data).toBeNull();
            expect(result.error?.message).toContain('Profiles DB error');
        });

        it('returns error if insert fails', async () => {
            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                return createMockBuilder(
                    table,
                    (action) => {
                        if (table === 'conversations') {
                            if (action === 'insert') {
                                return { data: null, error: new Error('Insert failed') };
                            }
                            return { data: null, error: null };
                        }
                        return { data: null, error: null };
                    },
                    (resolve) => {
                        if (table === 'profiles') {
                            return Promise.resolve(resolve({ data: [], error: null }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }
                ) as unknown as ReturnType<typeof supabase.from>;
            });

            const result = await getOrCreateConversationId('user-a', 'user-b');
            expect(result.data).toBeNull();
            expect(result.error?.message).toContain('Insert failed');
        });

        it('returns error if insert returns no ID', async () => {
            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                return createMockBuilder(
                    table,
                    (action) => {
                        if (table === 'conversations') {
                            if (action === 'insert') {
                                return { data: {}, error: null };
                            }
                            return { data: null, error: null };
                        }
                        return { data: null, error: null };
                    },
                    (resolve) => {
                        if (table === 'profiles') {
                            return Promise.resolve(resolve({ data: [], error: null }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }
                ) as unknown as ReturnType<typeof supabase.from>;
            });

            const result = await getOrCreateConversationId('user-a', 'user-b');
            expect(result.data).toBeNull();
            expect(result.error?.message).toContain('Failed to create conversation');
        });
    });

    describe('getConversations', () => {
        it('queries and filters conversations correctly', async () => {
            const mockConvs = [
                {
                    id: 'c-1',
                    participant_1: 'user-a',
                    participant_2: 'user-b',
                    client_id: 'user-a',
                    freelancer_id: 'user-b',
                    status: 'active',
                    unread_count_1: 2,
                    unread_count_2: 0,
                },
                {
                    id: 'c-2',
                    participant_1: 'user-a',
                    participant_2: 'user-c',
                    client_id: 'user-c',
                    freelancer_id: 'user-a',
                    status: 'archived',
                },
            ];

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                const builder = {
                    select: vi.fn(() => builder),
                    or: vi.fn(() => builder),
                    eq: vi.fn(() => builder),
                    order: vi.fn(() => builder),
                    in: vi.fn(() => builder),
                    then: vi.fn((resolve: (val: unknown) => unknown) => {
                        if (table === 'conversations') {
                            return Promise.resolve(resolve({ data: mockConvs, error: null }));
                        }
                        if (table === 'public_profiles') {
                            return Promise.resolve(resolve({
                                data: [
                                    { id: 'user-b', full_name: 'Bob', avatar_url: 'bob.jpg', username: 'bob' },
                                ],
                                error: null,
                            }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }),
                } as unknown as ReturnType<typeof supabase.from>;
                return builder;
            });

            const result = await getConversations('user-a');
            expect(result.data).toHaveLength(1);
            expect(result.data?.[0].id).toBe('c-1');
            expect(result.data?.[0].otherUser.full_name).toBe('Bob');
        });

        it('filters conversations by client scopes', async () => {
            const mockConvs = [
                {
                    id: 'c-1',
                    participant_1: 'user-a',
                    participant_2: 'user-b',
                    client_id: 'user-a',
                    freelancer_id: 'user-b',
                    status: 'active',
                },
                {
                    id: 'c-2',
                    participant_1: 'user-b',
                    participant_2: 'user-a',
                    client_id: 'user-b',
                    freelancer_id: 'user-a',
                    status: 'active',
                },
            ];

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                const builder = {
                    select: vi.fn(() => builder),
                    or: vi.fn(() => builder),
                    eq: vi.fn(() => builder),
                    order: vi.fn(() => builder),
                    in: vi.fn(() => builder),
                    then: vi.fn((resolve: (val: unknown) => unknown) => {
                        if (table === 'conversations') {
                            return Promise.resolve(resolve({ data: mockConvs, error: null }));
                        }
                        if (table === 'public_profiles') {
                            return Promise.resolve(resolve({ data: [], error: null }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }),
                } as unknown as ReturnType<typeof supabase.from>;
                return builder;
            });

            const result = await getConversations('user-a', 0, 20, { scopes: ['client'] });
            expect(result.data).toHaveLength(1);
            expect(result.data?.[0].id).toBe('c-1');
        });

        it('filters conversations by freelancer scopes', async () => {
            const mockConvs = [
                {
                    id: 'c-1',
                    participant_1: 'user-a',
                    participant_2: 'user-b',
                    client_id: 'user-a',
                    freelancer_id: 'user-b',
                    status: 'active',
                },
                {
                    id: 'c-2',
                    participant_1: 'user-b',
                    participant_2: 'user-a',
                    client_id: 'user-b',
                    freelancer_id: 'user-a',
                    status: 'active',
                },
            ];

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                const builder = {
                    select: vi.fn(() => builder),
                    or: vi.fn(() => builder),
                    eq: vi.fn(() => builder),
                    order: vi.fn(() => builder),
                    in: vi.fn(() => builder),
                    then: vi.fn((resolve: (val: unknown) => unknown) => {
                        if (table === 'conversations') {
                            return Promise.resolve(resolve({ data: mockConvs, error: null }));
                        }
                        if (table === 'public_profiles') {
                            return Promise.resolve(resolve({ data: [], error: null }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }),
                } as unknown as ReturnType<typeof supabase.from>;
                return builder;
            });

            const result = await getConversations('user-a', 0, 20, { scopes: ['freelancer'] });
            expect(result.data).toHaveLength(1);
            expect(result.data?.[0].id).toBe('c-2');
        });

        it('filters conversations using inbox fallbacks, contract scopes, and general scopes', async () => {
            const mockConvs = [
                {
                    id: 'c-1',
                    participant_1: 'user-a',
                    participant_2: 'user-b',
                    status: 'active',
                    inbox_participant_1: 'client',
                    inbox_participant_2: 'freelancer',
                },
                {
                    id: 'c-2',
                    participant_1: 'user-b',
                    participant_2: 'user-a',
                    status: 'active',
                    conversation_scope: 'contract',
                },
                {
                    id: 'c-3',
                    participant_1: 'user-b',
                    participant_2: 'user-a',
                    status: 'active',
                    conversation_scope: 'shared',
                },
                {
                    id: 'c-4',
                    participant_1: 'user-a',
                    participant_2: 'user-d',
                    status: 'active',
                    conversation_scope: undefined,
                }
            ];

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                const builder = {
                    select: vi.fn(() => builder),
                    or: vi.fn(() => builder),
                    eq: vi.fn(() => builder),
                    order: vi.fn(() => builder),
                    in: vi.fn(() => builder),
                    then: vi.fn((resolve: (val: unknown) => unknown) => {
                        if (table === 'conversations') {
                            return Promise.resolve(resolve({ data: mockConvs, error: null }));
                        }
                        if (table === 'public_profiles') {
                            return Promise.resolve(resolve({ data: [], error: null }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }),
                } as unknown as ReturnType<typeof supabase.from>;
                return builder;
            });

            const result = await getConversations('user-a', 0, 20, { scopes: ['client', 'freelancer', 'contract', 'shared'] });
            expect(result.data).toHaveLength(4);
        });

        it('returns error if profile query fails during details lookup', async () => {
            const mockConvs = [
                {
                    id: 'c-1',
                    participant_1: 'user-a',
                    participant_2: 'user-b',
                    status: 'active',
                },
            ];

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                const builder = {
                    select: vi.fn(() => builder),
                    or: vi.fn(() => builder),
                    eq: vi.fn(() => builder),
                    order: vi.fn(() => builder),
                    in: vi.fn(() => builder),
                    then: vi.fn((resolve: (val: unknown) => unknown) => {
                        if (table === 'conversations') {
                            return Promise.resolve(resolve({ data: mockConvs, error: null }));
                        }
                        if (table === 'public_profiles') {
                            return Promise.resolve(resolve({ data: null, error: new Error('Profiles DB lookup failed') }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }),
                } as unknown as ReturnType<typeof supabase.from>;
                return builder;
            });

            const result = await getConversations('user-a');
            expect(result.data).toBeNull();
            expect(result.error?.message).toContain('Profiles DB lookup failed');
        });
    });

    describe('getTotalUnreadCount', () => {
        it('queries and filters unread count with scopes client and freelancer', async () => {
            const mockRows = [
                {
                    status: 'active',
                    client_id: 'user-a',
                    freelancer_id: 'user-b',
                    participant_1: 'user-a',
                    participant_2: 'user-b',
                    unread_count_1: 5,
                    unread_count_2: 0,
                },
                {
                    status: 'archived',
                    client_id: 'user-a',
                    freelancer_id: 'user-c',
                    participant_1: 'user-a',
                    participant_2: 'user-c',
                    unread_count_1: 10,
                },
                {
                    status: 'active',
                    client_id: 'user-c',
                    freelancer_id: 'user-a',
                    participant_1: 'user-c',
                    participant_2: 'user-a',
                    unread_count_2: 3,
                },
            ];

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                const builder = {
                    select: vi.fn(() => builder),
                    eq: vi.fn(() => builder),
                    or: vi.fn(() => builder),
                    then: vi.fn((resolve: (val: unknown) => unknown) => {
                        if (table === 'conversations') {
                            return Promise.resolve(resolve({ data: mockRows, error: null }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }),
                } as unknown as ReturnType<typeof supabase.from>;
                return builder;
            });

            const result1 = await getTotalUnreadCount('user-a', ['client', 'freelancer']);
            expect(result1.count).toBe(8);
            expect(result1.error).toBeNull();

            const result2 = await getTotalUnreadCount('user-a', ['freelancer']);
            expect(result2.count).toBe(3);
            expect(result2.error).toBeNull();
        });

        it('queries unread count by inbox resolution when roles client/freelancer are not set directly', async () => {
            const mockRows = [
                {
                    status: 'active',
                    participant_1: 'user-a',
                    participant_2: 'user-b',
                    inbox_participant_1: 'client',
                    inbox_participant_2: 'freelancer',
                    unread_count_1: 4,
                },
                {
                    status: 'active',
                    participant_1: 'user-a',
                    participant_2: 'user-b',
                    inbox_participant_1: 'freelancer',
                    inbox_participant_2: 'client',
                    unread_count_1: 2,
                }
            ];

            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                const builder = {
                    select: vi.fn(() => builder),
                    eq: vi.fn(() => builder),
                    or: vi.fn(() => builder),
                    then: vi.fn((resolve: (val: unknown) => unknown) => {
                        if (table === 'conversations') {
                            return Promise.resolve(resolve({ data: mockRows, error: null }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }),
                } as unknown as ReturnType<typeof supabase.from>;
                return builder;
            });

            const result = await getTotalUnreadCount('user-a', ['client']);
            expect(result.count).toBe(4);
        });

        it('returns error if query fails when checking unread count with scopes', async () => {
            vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
                const builder = {
                    select: vi.fn(() => builder),
                    eq: vi.fn(() => builder),
                    or: vi.fn(() => builder),
                    then: vi.fn((resolve: (val: unknown) => unknown) => {
                        if (table === 'conversations') {
                            return Promise.resolve(resolve({ data: null, error: new Error('Unread DB error') }));
                        }
                        return Promise.resolve(resolve({ data: null, error: null }));
                    }),
                } as unknown as ReturnType<typeof supabase.from>;
                return builder;
            });

            const result = await getTotalUnreadCount('user-a', ['client']);
            expect(result.count).toBe(0);
            expect(result.error?.message).toContain('Unread DB error');
        });

        it('calls RPC when scopes are not specified', async () => {
            mockRpcResult = { data: 12, error: null };
            const result = await getTotalUnreadCount('user-a');
            expect(result.count).toBe(12);
            expect(result.error).toBeNull();
        });

        it('returns error if RPC fails when scopes are not specified', async () => {
            mockRpcResult = { data: null, error: new Error('Unread RPC failed') };
            const result = await getTotalUnreadCount('user-a');
            expect(result.count).toBe(0);
            expect(result.error?.message).toContain('Unread RPC failed');
        });
    });
});
