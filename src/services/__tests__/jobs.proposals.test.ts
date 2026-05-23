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
        tableResults: {} as Record<string, unknown>,
        builderResult: { data: { id: 'proposal-1' }, error: null as unknown, count: 1 } as { data: unknown; error: unknown; count: number },
        rpcResult: { data: 'proposal-1', error: null as unknown } as { data: unknown; error: unknown },
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
        state.tableResults = {
            profiles: {
                data: {
                    id: 'free-1',
                    user_type: 'freelancer',
                    freelancer_onboarding_completed: true,
                    full_name: 'Freelancer One',
                    avatar_url: 'https://avatar.example/freelancer.png',
                    bio: 'Experienced frontend engineer focused on reliable product delivery.',
                    phone: '+21655123456',
                    location: 'Tunis',
                },
                error: null,
                count: 1,
            },
            freelancer_profiles: {
                data: {
                    id: 'free-1',
                    title: 'Frontend Engineer',
                    skills: ['React', 'TypeScript', 'Testing'],
                    hourly_rate: 75,
                    languages: ['Arabic', 'French'],
                    education: ['ESPRIT'],
                    work_samples: ['https://portfolio.example/work-sample'],
                },
                error: null,
                count: 1,
            },
        };
        state.builderResult = { data: { id: 'proposal-1' }, error: null, count: 1 };
        state.rpcResult = { data: 'proposal-1', error: null } as { data: unknown; error: unknown };
        state.uploadUrl = 'https://files.example/proposal.pdf';
    };

    return { state, reset };
});

vi.mock('@/lib/supabase', () => {
    const builders = new Map<string, ReturnType<typeof createBuilder>>();

    const getTableResult = (table: string) =>
        queryState.state.tableResults[table] ?? queryState.state.builderResult;

    function createBuilder(table: string) {
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
                return getTableResult(table);
            }),
            maybeSingle: vi.fn(async () => getTableResult(table)),
            then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(getTableResult(table))),
        };

        builders.set(table, builder);
        return builder;
    }

    return {
        supabase: {
            from: vi.fn((table: string) => {
                queryState.state.fromCalls.push(table);
                return builders.get(table) ?? createBuilder(table);
            }),
            rpc: vi.fn(async (fn: string, params: unknown) => {
                queryState.state.rpcCalls.push({ fn, params });
                return queryState.state.rpcResult;
            }),
        },
        supabaseAnon: {
            from: vi.fn((table: string) => {
                queryState.state.fromCalls.push(table);
                return builders.get(table) ?? createBuilder(table);
            }),
        },
        uploadFile: vi.fn(async () => queryState.state.uploadUrl),
    };
});

import { createJob, getJobById, getJobs } from '@/services/jobs';
import { createProposal, getProposalsByJob } from '@/services/proposals';

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
        expect(queryState.state.selectCalls[0]?.columns).toContain('client:public_profiles!jobs_client_id_fkey');
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
        expect(queryState.state.selectCalls[queryState.state.selectCalls.length - 1]).toEqual({ columns: 'id', options: undefined });
        expect(queryState.state.singleCalls).toBe(1);
    });
});

describe('proposals service targeted coverage', () => {
    beforeEach(() => {
        queryState.reset();
    });

    it('calls submit_proposal_atomic rpc and uploads attachments before the call', async () => {
        // The new flow: createProposal() uploads files, then calls the atomic RPC.
        // It no longer uses .from('proposals').insert(...) directly.
        queryState.state.rpcResult = {
            data: { success: true, proposal_id: 'proposal-1', existing: false },
            error: null,
        };

        const file = new File(['hello'], 'brief.pdf', { type: 'application/pdf' });

        const result = await createProposal({
            job_id: 'job-1',
            freelancer_id: 'free-1',
            cover_letter: 'I can deliver this cleanly and quickly.',
            bid_amount: 150,
            delivery_time_days: 4,
        }, [file]);

        expect(result).toEqual({ data: 'proposal-1', error: null });

        // Verify the RPC was called with the right function and params.
        expect(queryState.state.rpcCalls).toContainEqual(
            expect.objectContaining({
                fn: 'submit_proposal_atomic',
                params: expect.objectContaining({
                    p_job_id: 'job-1',
                    p_cover_letter: 'I can deliver this cleanly and quickly.',
                    p_bid_amount: 150,
                    p_delivery_time_days: 4,
                    // Attachment URL uploaded by uploadFile mock before the RPC call.
                    p_attachments: ['https://files.example/proposal.pdf'],
                }),
            })
        );

        // No direct insert on proposals table — atomicity is handled by the RPC.
        expect(queryState.state.insertCalls).toHaveLength(0);
    });

    it('normalizes rate limit rpc failures into a user-facing error', async () => {
        // Simulate the access-check pre-flight succeeding but the atomic RPC failing
        // with a rate_limit_exceeded error.
        queryState.state.rpcResult = {
            data: null,
            error: new Error('rate_limit_exceeded'),
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

    it('falls back to direct insert when submit_proposal_atomic RPC is unavailable', async () => {
        queryState.state.rpcResult = {
            data: null,
            error: new Error('Could not find the function public.submit_proposal_atomic in the schema cache'),
        };

        queryState.state.tableResults.proposals = {
            data: { id: 'proposal-fallback-1' },
            error: null,
            count: 1,
        };

        const result = await createProposal({
            job_id: 'job-legacy',
            freelancer_id: 'free-1',
            cover_letter: 'Fallback path proposal.',
            bid_amount: 90,
            delivery_time_days: 2,
        });

        expect(result).toEqual({ data: 'proposal-fallback-1', error: null });
        expect(queryState.state.insertCalls).toContainEqual(expect.objectContaining({
            job_id: 'job-legacy',
            freelancer_id: 'free-1',
            cover_letter: 'Fallback path proposal.',
            bid_amount: 90,
            delivery_time_days: 2,
            status: 'pending',
        }));
    });
});

describe('proposals public_profiles join regression', () => {
    beforeEach(() => {
        queryState.reset();
    });

    // Regression guard: getProposalsByJob must join freelancer data through public_profiles,
    // NOT through the raw profiles base table (which exposes email, phone, etc.).
    // This test would have FAILED before the Phase 5b fix that swapped:
    //   profiles!proposals_freelancer_id_fkey  →  public_profiles!freelancer_id
    // A regression back to the raw join would silently leak private columns to any
    // authenticated client who can read proposals.
    it('getProposalsByJob joins freelancer through public_profiles not profiles', async () => {
        await getProposalsByJob('job-1');

        expect(queryState.state.fromCalls).toContain('proposals');

        // The select string must reference public_profiles for the freelancer join.
        const proposalSelect = queryState.state.selectCalls.find((c) =>
            c.columns.includes('freelancer')
        );
        expect(proposalSelect).toBeDefined();
        expect(proposalSelect?.columns).toContain('public_profiles!freelancer_id');

        // Ensure the raw profiles table is NOT referenced in the select join.
        // If this fails, private columns (email, phone) are being exposed on a client-readable query.
        expect(proposalSelect?.columns).not.toMatch(/profiles!proposals_freelancer_id_fkey/);
        expect(proposalSelect?.columns).not.toMatch(/^.*freelancer:profiles[^_]/);
    });
});
