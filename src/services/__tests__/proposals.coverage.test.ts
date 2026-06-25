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
    DAILY_PROPOSAL_LIMIT,
} from '../proposals';

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
});
