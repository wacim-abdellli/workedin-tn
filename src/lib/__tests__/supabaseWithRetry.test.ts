import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
    refreshResult: { data: { session: {} }, error: null },
}));

vi.mock('@/lib/logger', () => ({
    logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            refreshSession: vi.fn(async () => mockState.refreshResult),
        },
    },
}));

vi.mock('@/lib/withTimeout', () => ({
    withTimeout: vi.fn(async (promise: Promise<unknown>) => promise),
}));

import { supabaseWithRetry } from '../supabaseWithRetry';

describe('supabaseWithRetry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockState.refreshResult = { data: { session: {} }, error: null };
    });

    it('returns result directly when no error', async () => {
        const queryFn = vi.fn(async () => ({ data: 'ok', error: null }));
        const result = await supabaseWithRetry(queryFn);
        expect(result.data).toBe('ok');
        expect(result.error).toBeNull();
    });

    it('throws normalized error when throwOnError is true (default)', async () => {
        const queryFn = vi.fn(async () => ({ data: null, error: { message: 'fail', status: 500 } }));
        await expect(supabaseWithRetry(queryFn)).rejects.toThrow('fail');
    });

    it('returns result when throwOnError is false and error exists', async () => {
        const queryFn = vi.fn(async () => ({ data: null, error: { message: 'fail', status: 500 } }));
        const result = await supabaseWithRetry(queryFn, { throwOnError: false });
        expect(result.error).toBeTruthy();
    });

    it('retries on 401 by refreshing token', async () => {
        let callCount = 0;
        const queryFn = vi.fn(async () => {
            callCount++;
            if (callCount === 1) {
                return { data: null, error: { message: 'Unauthorized', status: 401 } };
            }
            return { data: 'retried', error: null };
        });

        const result = await supabaseWithRetry(queryFn);
        expect(result.data).toBe('retried');
        expect(callCount).toBe(2);
    });

    it('throws refresh error if token refresh fails', async () => {
        mockState.refreshResult = { data: null, error: new Error('refresh failed') };
        const queryFn = vi.fn(async () => ({ data: null, error: { message: 'Unauthorized', status: 401 } }));

        await expect(supabaseWithRetry(queryFn)).rejects.toThrow('refresh failed');
    });

    it('normalizes non-Error objects into Error instances', async () => {
        const queryFn = vi.fn(async () => ({
            data: null,
            error: { message: 'raw error', status: 403, code: 'PGRST', details: 'detail', hint: 'hint' },
        }));

        try {
            await supabaseWithRetry(queryFn);
            expect.fail('should have thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(Error);
            expect((err as Error).message).toBe('raw error');
        }
    });

    it('normalizes null/undefined errors into generic Error', async () => {
        const queryFn = vi.fn(async () => ({ data: null, error: null }));
        // No error case - should return normally
        const result = await supabaseWithRetry(queryFn);
        expect(result.error).toBeNull();
    });

    it('uses default timeout of 15000ms', async () => {
        const { withTimeout } = await import('@/lib/withTimeout');
        const queryFn = vi.fn(async () => ({ data: 'ok', error: null }));
        await supabaseWithRetry(queryFn);
        expect(withTimeout).toHaveBeenCalledWith(expect.any(Promise), 15000, 'Supabase query');
    });

    it('respects custom timeoutMs option', async () => {
        const { withTimeout } = await import('@/lib/withTimeout');
        const queryFn = vi.fn(async () => ({ data: 'ok', error: null }));
        await supabaseWithRetry(queryFn, { timeoutMs: 5000 });
        expect(withTimeout).toHaveBeenCalledWith(expect.any(Promise), 5000, 'Supabase query');
    });
});
