import { beforeEach, describe, expect, it, vi } from 'vitest';

const serviceState = vi.hoisted(() => {
    const state = {
        fromCalls: [] as string[],
        selectCalls: [] as Array<{ table: string; columns: string; options?: unknown }>,
        eqCalls: [] as Array<{ table: string; column: string; value: unknown }>,
        orCalls: [] as Array<{ table: string; value: string }>,
        orderCalls: [] as Array<{ table: string; column: string; options?: unknown }>,
        limitCalls: [] as Array<{ table: string; value: number }>,
        rangeCalls: [] as Array<{ table: string; from: number; to: number }>,
        insertCalls: [] as Array<{ table: string; value: unknown }>,
        updateCalls: [] as Array<{ table: string; value: unknown }>,
        upsertCalls: [] as Array<{ table: string; value: unknown; options?: unknown }>,
        notCalls: [] as Array<{ table: string; column: string; operator: string; value: unknown }>,
        ltCalls: [] as Array<{ table: string; column: string; value: unknown }>,
        rpcCalls: [] as Array<{ fn: string; params: unknown }>,
        functionCalls: [] as Array<{ name: string; body?: unknown }>,
        singleCalls: [] as string[],
        maybeSingleCalls: [] as string[],
        channelCalls: [] as string[],
        onCalls: [] as Array<{ channel: string; event: string; config: unknown }>,
        removeChannelCalls: [] as string[],
        tableResults: {} as Record<string, unknown>,
        session: { access_token: 'session-token' } as { access_token: string } | null,
        functionResult: { data: { message: 'Reconciled' }, error: null as { message: string } | null },
        uploadFileResult: { url: 'https://files.example/avatar.png' } as unknown,
        uploadFileCalls: [] as Array<{ bucket: string; path: string; file: File }>,
    };

    const reset = () => {
        state.fromCalls = [];
        state.selectCalls = [];
        state.eqCalls = [];
        state.orCalls = [];
        state.orderCalls = [];
        state.limitCalls = [];
        state.rangeCalls = [];
        state.insertCalls = [];
        state.updateCalls = [];
        state.upsertCalls = [];
        state.notCalls = [];
        state.ltCalls = [];
        state.rpcCalls = [];
        state.functionCalls = [];
        state.singleCalls = [];
        state.maybeSingleCalls = [];
        state.channelCalls = [];
        state.onCalls = [];
        state.removeChannelCalls = [];
        state.tableResults = {};
        state.session = { access_token: 'session-token' };
        state.functionResult = { data: { message: 'Reconciled' }, error: null };
        state.uploadFileResult = { url: 'https://files.example/avatar.png' };
        state.uploadFileCalls = [];
    };

    return { state, reset };
});

vi.mock('@/lib/supabase', () => {
    const builders = new Map<string, ReturnType<typeof createBuilder>>();

    function getTableResult(table: string) {
        return serviceState.state.tableResults[table] ?? { data: [{ id: `${table}-1` }], error: null, count: 1 };
    }

    function createBuilder(table: string) {
        const builder = {
            select: vi.fn((columns: string, options?: unknown) => {
                serviceState.state.selectCalls.push({ table, columns, options });
                return builder;
            }),
            eq: vi.fn((column: string, value: unknown) => {
                serviceState.state.eqCalls.push({ table, column, value });
                return builder;
            }),
            or: vi.fn((value: string) => {
                serviceState.state.orCalls.push({ table, value });
                return builder;
            }),
            in: vi.fn(() => builder),
            order: vi.fn((column: string, options?: unknown) => {
                serviceState.state.orderCalls.push({ table, column, options });
                return builder;
            }),
            limit: vi.fn((value: number) => {
                serviceState.state.limitCalls.push({ table, value });
                return builder;
            }),
            range: vi.fn((from: number, to: number) => {
                serviceState.state.rangeCalls.push({ table, from, to });
                return builder;
            }),
            insert: vi.fn((value: unknown) => {
                serviceState.state.insertCalls.push({ table, value });
                return builder;
            }),
            delete: vi.fn(() => builder),
            update: vi.fn((value: unknown) => {
                serviceState.state.updateCalls.push({ table, value });
                return builder;
            }),
            upsert: vi.fn((value: unknown, options?: unknown) => {
                serviceState.state.upsertCalls.push({ table, value, options });
                return builder;
            }),
            not: vi.fn((column: string, operator: string, value: unknown) => {
                serviceState.state.notCalls.push({ table, column, operator, value });
                return builder;
            }),
            lt: vi.fn((column: string, value: unknown) => {
                serviceState.state.ltCalls.push({ table, column, value });
                return builder;
            }),
            single: vi.fn(async () => {
                serviceState.state.singleCalls.push(table);
                return getTableResult(table);
            }),
            maybeSingle: vi.fn(async () => {
                serviceState.state.maybeSingleCalls.push(table);
                return getTableResult(table);
            }),
            then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(getTableResult(table))),
        };

        builders.set(table, builder);
        return builder;
    }

    return {
        supabase: {
            from: vi.fn((table: string) => {
                serviceState.state.fromCalls.push(table);
                return builders.get(table) ?? createBuilder(table);
            }),
            rpc: vi.fn(async (fn: string, params: unknown) => {
                serviceState.state.rpcCalls.push({ fn, params });
                return { data: { ok: true }, error: null };
            }),
            channel: vi.fn((name: string) => {
                serviceState.state.channelCalls.push(name);
                const channel = {
                    on: vi.fn((event: string, config: unknown, callback: unknown) => {
                        void callback;
                        serviceState.state.onCalls.push({ channel: name, event, config });
                        return channel;
                    }),
                    subscribe: vi.fn(() => ({ id: name })),
                };
                return channel;
            }),
            removeChannel: vi.fn((channel: { id: string }) => {
                serviceState.state.removeChannelCalls.push(channel.id);
            }),
            auth: {
                getSession: vi.fn(async () => ({ data: { session: serviceState.state.session } })),
            },
            functions: {
                invoke: vi.fn(async (name: string, options?: { body?: unknown }) => {
                    serviceState.state.functionCalls.push({ name, body: options?.body });
                    return serviceState.state.functionResult;
                }),
            },
        },
        supabaseAnon: {
            from: vi.fn((table: string) => {
                serviceState.state.fromCalls.push(table);
                return builders.get(table) ?? createBuilder(table);
            }),
        },
        uploadFile: vi.fn(async (bucket: string, path: string, file: File) => {
            serviceState.state.uploadFileCalls.push({ bucket, path, file });
            return serviceState.state.uploadFileResult;
        }),
    };
});

import {
    createContract,
    createMilestone,
    getContractById,
    getContractsByUser,
    getMilestones,
    updateContractStatus,
    updateMilestoneStatus,
} from '@/services/contracts';
import {
    createNotification,
    getNotifications,
    getUnreadCount,
    markAllRead,
    markNotificationRead,
    subscribeToNotifications,
} from '@/services/notifications';
import {
    getClientStats,
    getFavoriteStatus,
    getFreelancerProfile,
    getFreelancerWithProfile,
    getFreelancers,
    getProfileById,
    getReviewsByUser,
    getSavedJobs,
    toggleFavorite,
    uploadAvatar,
    updateFreelancerProfile,
    updateProfile,
} from '@/services/profiles';
import {
    addPaymentMethod,
    completeEscrowPayment,
    getEarningsStats,
    getPaymentMethods,
    getStuckTransactions,
    getTransactions,
    getWallet,
    getWithdrawals,
    reconcilePayment,
    requestWithdrawal,
} from '@/services/payments';

describe('contracts service coverage', () => {
    beforeEach(() => {
        serviceState.reset();
    });

    it('fetches a contract with related entities', async () => {
        serviceState.state.tableResults.contracts = {
            data: { id: 'contract-1' },
            error: null,
        };

        const result = await getContractById('contract-1');

        expect(result).toEqual({ data: { id: 'contract-1' }, error: null });
        expect(serviceState.state.selectCalls).toContainEqual(expect.objectContaining({
            table: 'contracts',
            columns: expect.stringContaining('milestones(*)'),
        }));
        expect(serviceState.state.eqCalls).toContainEqual({ table: 'contracts', column: 'id', value: 'contract-1' });
        expect(serviceState.state.singleCalls).toContain('contracts');
    });

    it('lists contracts for a user ordered by creation date', async () => {
        await getContractsByUser('user-1');

        expect(serviceState.state.orCalls).toContainEqual({
            table: 'contracts',
            value: 'client_id.eq.user-1,freelancer_id.eq.user-1',
        });
        expect(serviceState.state.orderCalls).toContainEqual({
            table: 'contracts',
            column: 'created_at',
            options: { ascending: false },
        });
    });

    it('creates contracts and milestones and updates milestone status', async () => {
        await createContract({
            job_id: 'job-1',
            client_id: 'client-1',
            freelancer_id: 'freelancer-1',
            amount: 900,
        });
        await createMilestone({
            contract_id: 'contract-1',
            title: 'Kickoff',
            amount: 200,
            order_index: 1,
        });
        await getMilestones('contract-1');
        await updateMilestoneStatus('milestone-1', 'completed');
        await updateContractStatus('contract-1', 'completed');

        expect(serviceState.state.insertCalls).toContainEqual({
            table: 'contracts',
            value: expect.objectContaining({ status: 'active', payment_status: 'pending' }),
        });
        expect(serviceState.state.insertCalls).toContainEqual({
            table: 'milestones',
            value: expect.objectContaining({ title: 'Kickoff', contract_id: 'contract-1' }),
        });
        expect(serviceState.state.eqCalls).toContainEqual({ table: 'milestones', column: 'contract_id', value: 'contract-1' });
        expect(serviceState.state.updateCalls).toContainEqual({
            table: 'milestones',
            value: { status: 'completed' },
        });
        expect(serviceState.state.updateCalls).toContainEqual({
            table: 'contracts',
            value: { status: 'completed' },
        });
    });
});

describe('profiles service coverage', () => {
    beforeEach(() => {
        serviceState.reset();
    });

    it('gets and updates a profile record', async () => {
        serviceState.state.tableResults.profiles = {
            data: { id: 'user-1', full_name: 'Sam' },
            error: null,
        };

        const profile = await getProfileById('user-1');
        await updateProfile('user-1', { full_name: 'Updated Sam' });

        expect(profile).toEqual({ data: { id: 'user-1', full_name: 'Sam' }, error: null });
        expect(serviceState.state.eqCalls).toContainEqual({ table: 'profiles', column: 'id', value: 'user-1' });
        expect(serviceState.state.updateCalls).toContainEqual({
            table: 'profiles',
            value: expect.objectContaining({
                full_name: 'Updated Sam',
                updated_at: expect.any(String),
            }),
        });
    });

    it('upserts freelancer profiles and toggles favorites', async () => {
        await updateFreelancerProfile('user-1', {
            title: 'Frontend engineer',
            avatar_url: 'https://avatar.example/should-not-persist.png',
        });
        await toggleFavorite('user-1', 'job-1', false);
        await toggleFavorite('user-1', 'job-1', true);
        await getSavedJobs('user-1');

        expect(serviceState.state.upsertCalls).toContainEqual({
            table: 'freelancer_profiles',
            value: expect.objectContaining({
                id: 'user-1',
                title: 'Frontend engineer',
                updated_at: expect.any(String),
            }),
            options: { onConflict: 'id' },
        });

        const freelancerUpsertCall = serviceState.state.upsertCalls.find((call) => call.table === 'freelancer_profiles');
        expect(freelancerUpsertCall).toBeDefined();
        expect(freelancerUpsertCall?.value).not.toHaveProperty('avatar_url');

        expect(serviceState.state.insertCalls).toContainEqual({
            table: 'favorites',
            value: { user_id: 'user-1', job_id: 'job-1' },
        });
        expect(serviceState.state.notCalls).toContainEqual({
            table: 'favorites',
            column: 'job_id',
            operator: 'is',
            value: null,
        });
    });

    it('fetches freelancer-specific profile data and upload helpers', async () => {
        serviceState.state.tableResults.favorites = {
            data: { id: 'favorite-1' },
            error: null,
        };

        await getFreelancerProfile('user-1');
        await getFreelancerWithProfile('user-1');
        await getFreelancers({ search: 'amine' }, 2, 10);
        await getFavoriteStatus('user-1', 'job-2');
        await getReviewsByUser('user-1');
        const upload = await uploadAvatar('user-1', new File(['avatar'], 'avatar.png', { type: 'image/png' }));

        expect(serviceState.state.selectCalls).toEqual(expect.arrayContaining([
            expect.objectContaining({ table: 'freelancer_profiles', columns: '*' }),
            expect.objectContaining({ table: 'profiles', columns: expect.stringContaining('freelancer_profiles(*)') }),
            expect.objectContaining({
                table: 'profiles',
                columns: expect.stringMatching(/freelancer_profiles\s*\(/),
                options: { count: 'exact' },
            }),
            expect.objectContaining({ table: 'favorites', columns: 'id' }),
            expect.objectContaining({ table: 'reviews', columns: '*' }),
        ]));
        expect(serviceState.state.orCalls).toContainEqual({
            table: 'profiles',
            value: 'full_name.ilike.%amine%',
        });
        expect(serviceState.state.rangeCalls).toContainEqual({
            table: 'profiles',
            from: 10,
            to: 19,
        });
        expect(serviceState.state.maybeSingleCalls).toContain('favorites');
        expect(serviceState.state.uploadFileCalls).toHaveLength(1);
        expect(serviceState.state.uploadFileCalls[0].bucket).toBe('avatars');
        expect(serviceState.state.uploadFileCalls[0].path).toMatch(/^user-1\/avatar-\d+\.png$/);
        expect(upload).toEqual({ url: 'https://files.example/avatar.png' });
    });

    it('aggregates client stats from jobs, contracts, and reviews', async () => {
        serviceState.state.tableResults.jobs = { data: null, error: null, count: 3 };
        serviceState.state.tableResults.contracts = {
            data: [{ total_amount: 100 }, { total_amount: 250 }],
            error: null,
        };
        serviceState.state.tableResults.reviews = {
            data: [{ rating: 4 }, { rating: 5 }],
            error: null,
        };

        const result = await getClientStats('client-1');

        expect(result).toEqual({
            totalJobs: 3,
            totalSpent: 350,
            rating: 4.5,
        });
    });
});

describe('notifications service coverage', () => {
    beforeEach(() => {
        serviceState.reset();
    });

    it('lists notifications and unread counts', async () => {
        await getNotifications('user-1');
        await getUnreadCount('user-1');

        expect(serviceState.state.selectCalls).toEqual(expect.arrayContaining([
            { table: 'notifications', columns: '*', options: undefined },
            { table: 'notifications', columns: '*', options: { count: 'exact', head: true } },
        ]));
        expect(serviceState.state.orderCalls).toContainEqual({
            table: 'notifications',
            column: 'created_at',
            options: { ascending: false },
        });
        expect(serviceState.state.limitCalls).toContainEqual({
            table: 'notifications',
            value: 50,
        });
        expect(serviceState.state.eqCalls).toEqual(expect.arrayContaining([
            { table: 'notifications', column: 'user_id', value: 'user-1' },
            { table: 'notifications', column: 'is_read', value: false },
        ]));
    });

    it('creates notifications, marks reads, and subscribes to realtime inserts', async () => {
        await createNotification({
            user_id: 'user-1',
            type: 'message',
            content: 'New message',
            link: '/messages',
        });
        await markNotificationRead('notif-1');
        await markAllRead('user-1');
        const subscription = subscribeToNotifications('user-1', vi.fn());

        expect(serviceState.state.insertCalls).toContainEqual({
            table: 'notifications',
            value: {
                user_id: 'user-1',
                type: 'message',
                content: 'New message',
                link: '/messages',
                is_read: false,
            },
        });
        expect(serviceState.state.updateCalls).toEqual(expect.arrayContaining([
            { table: 'notifications', value: { is_read: true } },
            { table: 'notifications', value: { is_read: true } },
        ]));
        expect(serviceState.state.channelCalls).toContain('notifications:user-1');
        expect(serviceState.state.onCalls).toContainEqual({
            channel: 'notifications:user-1',
            event: 'postgres_changes',
            config: {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: 'user_id=eq.user-1',
            },
        });
        expect(subscription).toEqual({ id: 'notifications:user-1' });
    });
});

describe('payments service coverage', () => {
    beforeEach(() => {
        serviceState.reset();
        vi.restoreAllMocks();
    });

    it('queries wallet, transactions, withdrawals, and payment methods', async () => {
        await getWallet('user-1');
        await getTransactions('user-1', 2, 20);
        await getWithdrawals('user-1');
        await getPaymentMethods('user-1');
        await addPaymentMethod('user-1', {
            type: 'bank_transfer',
            details: { iban: 'TN123' },
            is_default: true,
        });

        expect(serviceState.state.eqCalls).toEqual(expect.arrayContaining([
            { table: 'wallets', column: 'user_id', value: 'user-1' },
            { table: 'transactions', column: 'user_id', value: 'user-1' },
            { table: 'withdrawals', column: 'user_id', value: 'user-1' },
            { table: 'payment_methods', column: 'user_id', value: 'user-1' },
        ]));
        expect(serviceState.state.rangeCalls).toContainEqual({
            table: 'transactions',
            from: 20,
            to: 39,
        });
        expect(serviceState.state.insertCalls).toContainEqual({
            table: 'payment_methods',
            value: {
                user_id: 'user-1',
                type: 'bank_transfer',
                details: { iban: 'TN123' },
                is_default: true,
            },
        });
    });

    it('creates withdrawals, completes escrow rpc calls, and calculates earnings', async () => {
        serviceState.state.tableResults.wallets = {
            data: { balance: 900 },
            error: null,
        };
        serviceState.state.tableResults.transactions = {
            data: [
                { amount: 150, type: 'earning' },
                { amount: 300, type: 'escrow_release' },
                { amount: 25, type: 'withdrawal' },
            ],
            error: null,
        };

        await requestWithdrawal({
            user_id: 'user-1',
            amount: 50,
            method: 'bank',
            details: { iban: 'TN123' },
        });
        await completeEscrowPayment('txn-1', 'contract-1', 'free-1', 300);
        const stats = await getEarningsStats('user-1');

        expect(serviceState.state.insertCalls).toContainEqual({
            table: 'withdrawals',
            value: expect.objectContaining({ status: 'pending', amount: 50 }),
        });
        expect(serviceState.state.rpcCalls).toContainEqual({
            fn: 'complete_escrow_payment',
            params: {
                p_transaction_id: 'txn-1',
                p_contract_id: 'contract-1',
                p_freelancer_id: 'free-1',
                p_amount: 300,
            },
        });
        expect(stats).toEqual({
            wallet: { balance: 900 },
            totalEarnings: 450,
            transactionCount: 3,
        });
    });

    it('returns stuck transactions and reconciles payments when authenticated', async () => {
        serviceState.state.tableResults.transactions = {
            data: [
                {
                    id: 'txn-1',
                    user_id: 'user-1',
                    amount: 99,
                    type: 'payment',
                    status: 'pending',
                    reference_id: 'ref-1',
                    created_at: '2026-03-22T00:00:00.000Z',
                },
            ],
            error: null,
        };
        const stuck = await getStuckTransactions();
        const result = await reconcilePayment('txn-1');

        expect(stuck).toHaveLength(1);
        expect(serviceState.state.ltCalls).toContainEqual({
            table: 'transactions',
            column: 'created_at',
            value: expect.any(String),
        });
        expect(serviceState.state.functionCalls).toContainEqual({
            name: 'reconcile-payment',
            body: { transaction_id: 'txn-1' },
        });
        expect(result).toEqual({ success: true, message: 'Reconciled' });
    });

    it('returns an auth error when reconciling without a session', async () => {
        serviceState.state.session = null;

        const result = await reconcilePayment('txn-2');

        expect(result).toEqual({ success: false, message: 'Not authenticated' });
    });

    it('handles stuck-transaction failures and reconcile API errors', async () => {
        serviceState.state.tableResults.transactions = {
            data: null,
            error: { message: 'broken' },
        };
        serviceState.state.functionResult = {
            data: null,
            error: { message: 'Function failed' },
        };

        const stuck = await getStuckTransactions();
        const result = await reconcilePayment('txn-3');

        expect(stuck).toEqual([]);
        expect(result).toEqual({ success: false, message: 'Function failed' });
    });
});
