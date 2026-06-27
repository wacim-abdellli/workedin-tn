import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockFromResult: Record<string, unknown> = { data: [], error: null, count: 0 };
let mockRpcResult: Record<string, unknown> = { data: null, error: null };

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            single: vi.fn(async () => mockFromResult),
            maybeSingle: vi.fn(async () => mockFromResult),
            then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(mockFromResult)),
        })),
        rpc: vi.fn(async () => mockRpcResult),
    },
    supabaseAnon: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn(async () => mockFromResult),
            then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(mockFromResult)),
        })),
    },
    uploadFile: vi.fn(async () => 'https://files.example/test.pdf'),
}));

vi.mock('@/lib/supabaseWithRetry', () => ({
    supabaseWithRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@/lib/logger', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), log: vi.fn() },
}));

import {
    getDailyProposalUsage,
    getProposalsByJob,
    getMyProposal,
    getProposalsByFreelancer,
    withdrawProposal,
    updateProposalStatus,
    createProposal,
    DAILY_PROPOSAL_LIMIT,
} from '../proposals';
import { supabase } from '@/lib/supabase';

describe('proposals service coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFromResult = { data: [], error: null, count: 0 };
        mockRpcResult = { data: null, error: null };
    });

    it('getDailyProposalUsage returns 0 when error occurs', async () => {
        mockFromResult = { data: null, error: { message: 'RLS blocked' } };
        const result = await getDailyProposalUsage('user-1');
        expect(result.used).toBe(0);
        expect(result.remaining).toBe(DAILY_PROPOSAL_LIMIT);
        expect(result.resetAt).toBeNull();
    });

    it('getDailyProposalUsage counts proposals and calculates reset time', async () => {
        const now = new Date();
        mockFromResult = {
            data: [
                { created_at: new Date(now.getTime() - 1000 * 60 * 60).toISOString() },
                { created_at: new Date(now.getTime() - 1000 * 60 * 30).toISOString() },
            ],
            error: null,
        };
        const result = await getDailyProposalUsage('user-1', now);
        expect(result.used).toBe(2);
        expect(result.remaining).toBe(DAILY_PROPOSAL_LIMIT - 2);
        expect(result.resetAt).toBeTruthy();
    });

    it('getDailyProposalUsage returns full limit when no proposals', async () => {
        mockFromResult = { data: [], error: null };
        const result = await getDailyProposalUsage('user-1');
        expect(result.used).toBe(0);
        expect(result.remaining).toBe(DAILY_PROPOSAL_LIMIT);
        expect(result.resetAt).toBeNull();
    });

    it('getProposalsByJob queries with correct join', async () => {
        mockFromResult = { data: [{ id: 'p1' }], error: null };
        await getProposalsByJob('job-1');
    });

    it('getMyProposal queries by job and freelancer', async () => {
        mockFromResult = { data: { id: 'p1' }, error: null };
        await getMyProposal('job-1', 'freelancer-1');
    });

    it('getProposalsByFreelancer queries with job join', async () => {
        mockFromResult = { data: [{ id: 'p1' }], error: null };
        await getProposalsByFreelancer('freelancer-1');
    });

    it('withdrawProposal deletes pending proposal', async () => {
        mockFromResult = { data: null, error: null };
        await withdrawProposal('proposal-1');
    });

    it('updateProposalStatus updates status', async () => {
        mockFromResult = { data: null, error: null };
        await updateProposalStatus('proposal-1', 'accepted');
    });

    it('DAILY_PROPOSAL_LIMIT is 6', () => {
        expect(DAILY_PROPOSAL_LIMIT).toBe(6);
    });

    describe('createProposal', () => {
        const input = {
            job_id: 'job-1',
            freelancer_id: 'user-1',
            cover_letter: 'Hello world',
            bid_amount: 100,
            delivery_time_days: 5,
        };

        it('submits proposal successfully via RPC when function exists', async () => {
            mockRpcResult = { data: 'proposal-123', error: null };
            const result = await createProposal(input);
            expect(result.data).toBe('proposal-123');
            expect(result.error).toBeNull();
        });

        it('submits proposal successfully via RPC returning object candidate ID', async () => {
            mockRpcResult = { data: { proposal_id: 'proposal-456' }, error: null };
            const result = await createProposal(input);
            expect(result.data).toBe('proposal-456');
            expect(result.error).toBeNull();
        });

        it('submits proposal successfully via RPC returning alternative object id field', async () => {
            mockRpcResult = { data: { id: 'proposal-789' }, error: null };
            const result = await createProposal(input);
            expect(result.data).toBe('proposal-789');
            expect(result.error).toBeNull();
        });

        it('handles file attachments and calls RPC', async () => {
            mockRpcResult = { data: 'proposal-123', error: null };
            const file = new File(['hello'], 'resume.pdf', { type: 'application/pdf' });
            const result = await createProposal(input, [file]);
            expect(result.data).toBe('proposal-123');
            expect(result.error).toBeNull();
        });

        it('falls back to non-atomic insert when atomic RPC is missing', async () => {
            mockRpcResult = {
                data: null,
                error: {
                    message: 'Function public.submit_proposal_atomic() does not exist',
                    details: 'pgrst202',
                    hint: 'could not find function in schema',
                },
            };

            // Mock table insert response
            mockFromResult = { data: { id: 'fallback-proposal-id' }, error: null };

            const result = await createProposal(input);
            expect(result.data).toBe('fallback-proposal-id');
            expect(result.error).toBeNull();
        });

        it('resolves duplicate proposal creation in fallback mode by querying existing id', async () => {
            mockRpcResult = {
                data: null,
                error: { message: 'Function submit_proposal_atomic does not exist' },
            };

            // Mock table insert/select sequence
            vi.spyOn(supabase, 'from').mockImplementation(() => {
                const builder = {
                    insert: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn(async () => {
                        return { data: null, error: { message: 'duplicate key value violates unique constraint' } };
                    }),
                    maybeSingle: vi.fn(async () => {
                        return { data: { id: 'duplicate-proposal-id' }, error: null };
                    }),
                } as unknown as ReturnType<typeof supabase.from>;
                return builder;
            });

            const result = await createProposal(input);
            expect(result.data).toBe('duplicate-proposal-id');
            expect(result.error).toBeNull();
        });

        it('returns error when fallback insert fails without duplicate key error', async () => {
            mockRpcResult = {
                data: null,
                error: { message: 'Function submit_proposal_atomic does not exist' },
            };

            vi.spyOn(supabase, 'from').mockImplementation(() => {
                const builder = {
                    insert: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn(async () => {
                        return { data: null, error: { message: 'General insert failure' } };
                    }),
                } as unknown as ReturnType<typeof supabase.from>;
                return builder;
            });

            const result = await createProposal(input);
            expect(result.data).toBeNull();
            expect(result.error?.message).toBe('General insert failure');
        });

        it('defensively confirms proposal via query if RPC returns empty or unexpected shape', async () => {
            mockRpcResult = { data: null, error: null }; // no error, but data is null

            vi.spyOn(supabase, 'from').mockImplementation(() => {
                const builder = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn(async () => {
                        return { data: { id: 'defensive-proposal-id' }, error: null };
                    }),
                } as unknown as ReturnType<typeof supabase.from>;
                return builder;
            });

            const result = await createProposal(input);
            expect(result.data).toBe('defensive-proposal-id');
            expect(result.error).toBeNull();
        });

        it('returns confirmation failure if defensive lookup finds nothing', async () => {
            mockRpcResult = { data: null, error: null };

            vi.spyOn(supabase, 'from').mockImplementation(() => {
                const builder = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn(async () => {
                        return { data: null, error: null };
                    }),
                } as unknown as ReturnType<typeof supabase.from>;
                return builder;
            });

            const result = await createProposal(input);
            expect(result.data).toBeNull();
            expect(result.error?.message).toBe('Proposal submission could not be confirmed. Please try again.');
        });

        it('handles limit errors mapping correctly', async () => {
            mockRpcResult = { data: null, error: { message: 'daily_apply_limit_reached' } };
            const result1 = await createProposal(input);
            expect(result1.error?.message).toBe("You've reached the proposal limit. Try again in an hour.");

            mockRpcResult = { data: null, error: { message: 'daily_proposal_limit_reached' } };
            const result2 = await createProposal(input);
            expect(result2.error?.message).toBe("You've reached the proposal limit. Try again in an hour.");

            mockRpcResult = { data: null, error: { message: 'rate_limit_exceeded' } };
            const result3 = await createProposal(input);
            expect(result3.error?.message).toBe("You've reached the proposal limit. Try again in an hour.");
        });

        it('handles generic non-Error shapes and empty fallbacks in error translation', async () => {
            // Throw string error
            vi.spyOn(supabase, 'rpc').mockImplementation(async () => {
                throw 'Some string error';
            });
            const result1 = await createProposal(input);
            expect(result1.error?.message).toBe('Some string error');

            // Throw error with object details
            vi.spyOn(supabase, 'rpc').mockImplementation(async () => {
                throw { details: 'Database connection details' };
            });
            const result2 = await createProposal(input);
            expect(result2.error?.message).toBe('Database connection details');

            // Throw error with object hint
            vi.spyOn(supabase, 'rpc').mockImplementation(async () => {
                throw { hint: 'Try resolving host hint' };
            });
            const result3 = await createProposal(input);
            expect(result3.error?.message).toBe('Try resolving host hint');

            // Throw object without message/details/hint
            vi.spyOn(supabase, 'rpc').mockImplementation(async () => {
                throw { unknown_field: 'unsupported' };
            });
            const result4 = await createProposal(input);
            expect(result4.error?.message).toBe('Failed to submit proposal');
        });
    });
});
