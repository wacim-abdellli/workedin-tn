import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockFromResult: Record<string, unknown> = { data: [], error: null };

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn(async () => mockFromResult),
            then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(mockFromResult)),
        })),
    },
}));

vi.mock('@/lib/supabaseWithRetry', () => ({
    supabaseWithRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

import { getReports, updateReportStatus, submitReport } from '../reports';

describe('reports service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFromResult = { data: [], error: null };
    });

    it('getReports returns reports list', async () => {
        mockFromResult = { data: [{ id: 'r1', reason: 'spam' }], error: null };
        const result = await getReports();
        expect(result).toEqual([{ id: 'r1', reason: 'spam' }]);
    });

    it('getReports filters by status', async () => {
        mockFromResult = { data: [{ id: 'r1', status: 'pending' }], error: null };
        const result = await getReports('pending');
        expect(result).toHaveLength(1);
    });

    it('getReports throws on error', async () => {
        mockFromResult = { data: null, error: new Error('db error') };
        await expect(getReports()).rejects.toThrow('Failed to fetch reports');
    });

    it('updateReportStatus calls update', async () => {
        mockFromResult = { data: null, error: null };
        await updateReportStatus('r1', 'reviewed', 'admin-1');
    });

    it('updateReportStatus throws on error', async () => {
        mockFromResult = { data: null, error: new Error('update failed') };
        await expect(updateReportStatus('r1', 'reviewed', 'admin-1')).rejects.toThrow('Failed to update report');
    });

    it('submitReport rejects self-reporting', async () => {
        await expect(submitReport('user-1', 'user', 'user-1', 'spam')).rejects.toThrow('You cannot report your own content');
    });

    it('submitReport succeeds for other users', async () => {
        mockFromResult = { data: { id: 'r1' }, error: null };
        await submitReport('user-1', 'user', 'user-2', 'spam');
    });

    it('submitReport normalizes rate limit errors', async () => {
        mockFromResult = { data: null, error: new Error('Rate limit exceeded: max 5 reports per hour') };
        await expect(submitReport('user-1', 'user', 'user-2', 'spam')).rejects.toThrow('You can submit maximum 5 reports per hour');
    });

    it('submitReport normalizes self-reporting errors from db', async () => {
        mockFromResult = { data: null, error: new Error('no_self_reporting') };
        await expect(submitReport('user-1', 'user', 'user-2', 'spam')).rejects.toThrow('You cannot report your own content');
    });

    it('submitReport normalizes "You cannot report your own content" errors', async () => {
        mockFromResult = { data: null, error: new Error('You cannot report your own content.') };
        await expect(submitReport('user-1', 'user', 'user-2', 'spam')).rejects.toThrow('You cannot report your own content.');
    });

    it('submitReport handles non-Error thrown values', async () => {
        mockFromResult = { data: null, error: 'string error' };
        await expect(submitReport('user-1', 'user', 'user-2', 'spam')).rejects.toThrow();
    });
});
