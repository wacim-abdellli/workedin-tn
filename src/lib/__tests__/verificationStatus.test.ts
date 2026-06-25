import { describe, expect, it, vi, beforeEach } from 'vitest';

let maybeSingleResult: { data: unknown; error: unknown } = { data: null, error: null };

vi.mock('@/lib/supabase', () => {
    const builder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => maybeSingleResult),
        then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(maybeSingleResult)),
    };
    return {
        supabase: {
            from: vi.fn(() => builder),
            channel: vi.fn(() => ({
                on: vi.fn().mockReturnThis(),
                subscribe: vi.fn().mockResolvedValue({}),
            })),
            removeChannel: vi.fn(),
        },
    };
});

vi.mock('@/lib/supabaseWithRetry', () => ({
    supabaseWithRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@sentry/react', () => ({
    captureException: vi.fn(),
}));

import { getVerificationStatus, getPendingVerifications } from '../verificationStatus';

describe('getVerificationStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        maybeSingleResult = { data: null, error: null };
    });

    it('returns verified when verification row has approved status', async () => {
        maybeSingleResult = {
            data: { id: 'v1', status: 'approved', submitted_at: '2026-01-01', reviewed_at: '2026-01-02', rejection_reason: null },
            error: null,
        };
        const result = await getVerificationStatus('user-1');
        expect(result.status).toBe('verified');
        expect(result.verificationId).toBe('v1');
        expect(result.submittedAt).toBe('2026-01-01');
        expect(result.reviewedAt).toBe('2026-01-02');
    });

    it('maps accepted/complete/success to verified', async () => {
        for (const status of ['accepted', 'complete', 'completed', 'success']) {
            maybeSingleResult = {
                data: { id: 'v1', status, submitted_at: '2026-01-01', reviewed_at: null, rejection_reason: null },
                error: null,
            };
            const result = await getVerificationStatus('user-1');
            expect(result.status).toBe('verified');
        }
    });

    it('returns pending for in_review/under_review/reviewing/submitted', async () => {
        for (const status of ['pending', 'in_review', 'under_review', 'reviewing', 'submitted']) {
            maybeSingleResult = {
                data: { id: 'v1', status, submitted_at: '2026-01-01', reviewed_at: null, rejection_reason: null },
                error: null,
            };
            const result = await getVerificationStatus('user-1');
            expect(result.status).toBe('pending');
        }
    });

    it('returns rejected for failed/denied/resubmit statuses', async () => {
        for (const status of ['rejected', 'requires_resubmit', 'resubmit_required', 'failed', 'denied']) {
            maybeSingleResult = {
                data: { id: 'v1', status, submitted_at: '2026-01-01', reviewed_at: null, rejection_reason: 'Bad docs' },
                error: null,
            };
            const result = await getVerificationStatus('user-1');
            expect(result.status).toBe('rejected');
            expect(result.rejectionReason).toBe('Bad docs');
        }
    });

    it('returns missing for unknown status', async () => {
        maybeSingleResult = {
            data: { id: 'v1', status: 'something_weird', submitted_at: '2026-01-01', reviewed_at: null, rejection_reason: null },
            error: null,
        };
        const result = await getVerificationStatus('user-1');
        expect(result.status).toBe('missing');
    });

    it('returns missing when no verification row and profile not verified', async () => {
        maybeSingleResult = { data: null, error: null };
        const result = await getVerificationStatus('user-1');
        expect(result.status).toBe('missing');
    });
});

describe('getPendingVerifications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        maybeSingleResult = { data: null, error: null };
    });

    it('returns empty array when no data', async () => {
        maybeSingleResult = { data: [], error: null };
        const result = await getPendingVerifications();
        expect(result).toEqual([]);
    });
});
