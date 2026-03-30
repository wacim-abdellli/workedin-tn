import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryState = vi.hoisted(() => {
    const state = {
        fromCalls: [] as string[],
        selectCalls: [] as Array<{ columns: string; options?: unknown }>,
        eqCalls: [] as Array<{ column: string; value: unknown }>,
        inCalls: [] as Array<{ column: string; values: unknown[] }>,
        orCalls: [] as string[],
        gteCalls: [] as Array<{ column: string; value: unknown }>,
        lteCalls: [] as Array<{ column: string; value: unknown }>,
        orderCalls: [] as Array<{ column: string; options?: unknown }>,
        rangeCalls: [] as Array<{ from: number; to: number }>,
        insertCalls: [] as unknown[],
        rpcCalls: [] as Array<{ fn: string; params: unknown }>,
        singleCalls: 0,
        builderResult: { data: { id: 'proposal-1' }, error: null as unknown, count: 1 },
        rpcResult: { data: 'proposal-1', error: null as unknown },
        uploadUrl: 'https://files.example/proposal.pdf',
    };

    const reset = () => {
        state.fromCalls = [];
        state.selectCalls = [];
        state.eqCalls = [];
        state.inCalls = [];
        state.orCalls = [];
        state.gteCalls = [];
        state.lteCalls = [];
        state.orderCalls = [];
        state.rangeCalls = [];
        state.insertCalls = [];
        state.rpcCalls = [];
        state.singleCalls = 0;
        state.builderResult = { data: { id: 'proposal-1' }, error: null, count: 1 };
        state.rpcResult = { data: 'proposal-1', error: null };
        state.uploadUrl = 'https://files.example/proposal.pdf';
    };

    return { state, reset };
});

vi.mock('@/lib/supabase', () => {
    const builder = {
        select: vi.fn((columns: string, options?: unknown) => {
            queryState.state.selectCalls.push({ columns, options });
            return builder;
        }),
        eq: vi.fn((column: string, value: unknown) => {
            queryState.state.eqCalls.push({ column, value });
            return builder;
        }),
        in: vi.fn((column: string, values: unknown[]) => {
            queryState.state.inCalls.push({ column, values });
            return builder;
        }),
        or: vi.fn((value: string) => {
            queryState.state.orCalls.push(value);
            return builder;
        }),
        gte: vi.fn((column: string, value: unknown) => {
            queryState.state.gteCalls.push({ column, value });
            return builder;
        }),
        lte: vi.fn((column: string, value: unknown) => {
            queryState.state.lteCalls.push({ column, value });
            return builder;
        }),
        order: vi.fn((column: string, options?: unknown) => {
            queryState.state.orderCalls.push({ column, options });
            return builder;
        }),
        range: vi.fn((from: number, to: number) => {
            queryState.state.rangeCalls.push({ from, to });
            return builder;
        }),
        insert: vi.fn((value: unknown) => {
            queryState.state.insertCalls.push(value);
            return builder;
        }),
        single: vi.fn(async () => {
            queryState.state.singleCalls += 1;
            return queryState.state.builderResult;
        }),
        maybeSingle: vi.fn(async () => ({ data: { id: 'free-1' }, error: null })),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(queryState.state.builderResult)),
    };

    return {
        supabase: {
            from: vi.fn((table: string) => {
                queryState.state.fromCalls.push(table);
                return builder;
            }),
            rpc: vi.fn(async (fn: string, params: unknown) => {
                queryState.state.rpcCalls.push({ fn, params });
                return queryState.state.rpcResult;
            }),
        },
        supabaseAnon: {
            from: vi.fn((table: string) => {
                queryState.state.fromCalls.push(table);
                return builder;
            }),
        },
        uploadFile: vi.fn(async () => queryState.state.uploadUrl),
    };
});

import { createJob, getJobById, getJobs } from '@/services/jobs';
import { createProposal } from '@/services/proposals';

describe('jobs service targeted coverage', () => {
    beforeEach(() => {
        queryState.reset();
    });

    it('applies filters, ordering, and pagination in getJobs', async () => {
        queryState.state.builderResult = {
            data: [{ id: 'job-22', title: 'React build' }],
            error: null,
            count: 42,
        };

        const result = await getJobs({
            search: 'react',
            categories: ['development', 'design'],
            jobType: 'fixed_price',
            budgetRange: '50-100',
            experienceLevels: ['expert'],
            postedWithin: '24h',
            sortBy: 'budget_high',
        }, 2, 10);

        expect(result).toEqual({
            data: [{ id: 'job-22', title: 'React build' }],
            count: 42,
        });
        expect(queryState.state.fromCalls).toContain('jobs');
        expect(queryState.state.orCalls).toContain('title.ilike.%react%,description.ilike.%react%');
        expect(queryState.state.inCalls).toContainEqual({ column: 'category', values: ['development', 'design'] });
        expect(queryState.state.inCalls).toContainEqual({ column: 'experience_level', values: ['expert'] });
        expect(queryState.state.eqCalls).toEqual(expect.arrayContaining([
            { column: 'status', value: 'open' },
            { column: 'visibility', value: 'public' },
            { column: 'job_type', value: 'fixed_price' },
        ]));
        expect(queryState.state.gteCalls).toEqual(expect.arrayContaining([
            { column: 'budget_min', value: 50 },
            { column: 'posted_at', value: expect.any(String) },
        ]));
        expect(queryState.state.lteCalls).toContainEqual({ column: 'budget_min', value: 100 });
        expect(queryState.state.orderCalls).toContainEqual({ column: 'budget_max', options: { ascending: false } });
        expect(queryState.state.rangeCalls).toContainEqual({ from: 10, to: 19 });
    });

    it('returns the joined single-job query in getJobById', async () => {
        queryState.state.builderResult = {
            data: { id: 'job-99', client_id: 'client-1' },
            error: null,
            count: 1,
        };

        const result = await getJobById('job-99');

        expect(result).toEqual({
            data: { id: 'job-99', client_id: 'client-1' },
            error: null,
            count: 1,
        });
        expect(queryState.state.selectCalls[0]?.columns).toContain('client:profiles!jobs_client_id_fkey');
        expect(queryState.state.eqCalls).toContainEqual({ column: 'id', value: 'job-99' });
        expect(queryState.state.singleCalls).toBe(1);
    });

    it('creates an open job and selects the inserted id', async () => {
        await createJob({
            client_id: 'client-1',
            title: 'Launch backend',
            description: 'Need a production-ready backend',
            category: 'development',
            job_type: 'hourly',
            hourly_rate: 80,
            duration: '2 weeks',
            experience_level: 'expert',
            visibility: 'public',
        });

        expect(queryState.state.insertCalls).toContainEqual(expect.objectContaining({
            client_id: 'client-1',
            title: 'Launch backend',
            status: 'open',
        }));
        expect(queryState.state.selectCalls.at(-1)).toEqual({ columns: 'id', options: undefined });
        expect(queryState.state.singleCalls).toBe(1);
    });
});

describe('proposals service targeted coverage', () => {
    beforeEach(() => {
        queryState.reset();
    });

    it('creates a proposal and uploads attachments before inserting the proposal row', async () => {
        const file = new File(['hello'], 'brief.pdf', { type: 'application/pdf' });

        const result = await createProposal({
            job_id: 'job-1',
            freelancer_id: 'free-1',
            cover_letter: 'I can deliver this cleanly and quickly.',
            bid_amount: 150,
            delivery_time_days: 4,
        }, [file]);

        expect(result).toEqual({ data: 'proposal-1', error: null });
        expect(queryState.state.fromCalls).toEqual(expect.arrayContaining(['freelancer_profiles', 'proposals']));
        expect(queryState.state.insertCalls).toContainEqual(expect.objectContaining({
            job_id: 'job-1',
            freelancer_id: 'free-1',
            cover_letter: 'I can deliver this cleanly and quickly.',
            bid_amount: 150,
            delivery_time_days: 4,
            attachments: ['https://files.example/proposal.pdf'],
        }));
    });

    it('normalizes rate limit rpc failures into a user-facing error', async () => {
        queryState.state.builderResult = {
            data: null,
            error: new Error('rate_limit_exceeded'),
            count: 0,
        };

        const result = await createProposal({
            job_id: 'job-1',
            freelancer_id: 'free-1',
            cover_letter: 'I can deliver this cleanly and quickly.',
            bid_amount: 150,
            delivery_time_days: 4,
        });

        expect(result.data).toBeNull();
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe("You've reached the proposal limit. Try again in an hour.");
    });
});
