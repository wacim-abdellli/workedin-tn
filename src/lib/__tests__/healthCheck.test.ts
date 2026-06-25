import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
    selectResult: { data: null, error: null },
    listResult: { data: null, error: null },
}));

vi.mock('../supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                limit: vi.fn(async () => mockState.selectResult),
            })),
        })),
        storage: {
            from: vi.fn(() => ({
                list: vi.fn(async () => mockState.listResult),
            })),
        },
    },
}));

import { supabase } from '../supabase';
import { checkDatabase, checkCache, checkStorage, getHealthStatus, getReadinessStatus, getLivenessStatus } from '../healthCheck';

describe('healthCheck', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockState.selectResult = { data: null, error: null };
        mockState.listResult = { data: null, error: null };
    });

    describe('checkDatabase', () => {
        it('returns true when database is healthy', async () => {
            expect(await checkDatabase()).toBe(true);
        });

        it('returns false when query returns error', async () => {
            mockState.selectResult = { data: null, error: { message: 'connection refused' } };
            expect(await checkDatabase()).toBe(false);
        });

        it('returns false on exception', async () => {
            vi.mocked(supabase.from).mockReturnValueOnce({
                select: (() => { throw new Error('crash'); }) as never,
            } as never);
            expect(await checkDatabase()).toBe(false);
        });
    });

    describe('checkCache', () => {
        it('always returns true (no cache layer yet)', async () => {
            expect(await checkCache()).toBe(true);
        });
    });

    describe('checkStorage', () => {
        it('returns true when storage is healthy', async () => {
            expect(await checkStorage()).toBe(true);
        });

        it('returns false when storage returns error', async () => {
            mockState.listResult = { data: null, error: { message: 'bucket not found' } };
            expect(await checkStorage()).toBe(false);
        });

        it('returns false on exception', async () => {
            vi.mocked(supabase.storage.from).mockReturnValueOnce({
                list: (() => { throw new Error('crash'); }) as never,
            } as never);
            expect(await checkStorage()).toBe(false);
        });
    });

    describe('getHealthStatus', () => {
        it('returns ok when all checks pass', async () => {
            const result = await getHealthStatus();
            expect(result.status).toBe('ok');
            expect(result.checks.database).toBe(true);
            expect(result.checks.cache).toBe(true);
            expect(result.checks.storage).toBe(true);
            expect(result.uptime).toBeGreaterThanOrEqual(0);
            expect(result.version).toBe('1.0.0');
            expect(result.timestamp).toBeTruthy();
        });

        it('returns degraded when database fails', async () => {
            mockState.selectResult = { data: null, error: { message: 'down' } };
            const result = await getHealthStatus();
            expect(result.status).toBe('degraded');
            expect(result.checks.database).toBe(false);
        });

        it('returns degraded when storage fails', async () => {
            mockState.listResult = { data: null, error: { message: 'down' } };
            const result = await getHealthStatus();
            expect(result.status).toBe('degraded');
            expect(result.checks.storage).toBe(false);
        });
    });

    describe('getReadinessStatus', () => {
        it('returns ready when health is ok', async () => {
            const result = await getReadinessStatus();
            expect(result.ready).toBe(true);
            expect(result.timestamp).toBeTruthy();
        });

        it('returns not ready when health is degraded', async () => {
            mockState.selectResult = { data: null, error: { message: 'down' } };
            const result = await getReadinessStatus();
            expect(result.ready).toBe(false);
        });
    });

    describe('getLivenessStatus', () => {
        it('always returns alive', async () => {
            const result = await getLivenessStatus();
            expect(result.alive).toBe(true);
            expect(result.timestamp).toBeTruthy();
        });
    });
});
