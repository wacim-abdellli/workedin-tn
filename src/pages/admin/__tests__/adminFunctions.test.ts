import { describe, expect, it, vi, beforeEach } from 'vitest';
import { adminPillClass } from '../adminTheme';

const mockSupabase = vi.hoisted(() => {
    const chainable: Record<string, unknown> = {};
    const chain = (result: unknown) => {
        chainable.select = vi.fn().mockReturnThis();
        chainable.eq = vi.fn().mockReturnThis();
        chainable.in = vi.fn().mockReturnThis();
        chainable.order = vi.fn().mockReturnThis();
        chainable.limit = vi.fn().mockResolvedValue(result);
        chainable.gte = vi.fn().mockReturnThis();
        chainable.is = vi.fn().mockReturnThis();
        chainable.not = vi.fn().mockReturnThis();
        chainable.lt = vi.fn().mockReturnThis();
        chainable.maybeSingle = vi.fn().mockResolvedValue(result || { data: null, error: null });
        chainable.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
        Object.assign(chainable, {
            from: vi.fn(() => chainable),
            functions: {
                invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
            },
            storage: {
                from: vi.fn(() => ({
                    createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: { message: 'no bucket' } }),
                })),
            },
            auth: {
                admin: {
                    getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
                },
            },
        });
        return chainable;
    };
    return chain({ data: [], error: null });
});

vi.mock('@/lib/supabase', () => ({
    supabase: mockSupabase,
}));

vi.mock('@/lib/supabaseWithRetry', () => ({
    supabaseWithRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@/lib/logger', () => ({
    logger: { error: vi.fn(), log: vi.fn(), warn: vi.fn() },
}));

describe('adminPillClass', () => {
    it('returns primary class', () => {
        expect(adminPillClass('primary')).toContain('purple');
    });
    it('returns blue class', () => {
        expect(adminPillClass('blue')).toContain('blue');
    });
    it('returns violet class', () => {
        expect(adminPillClass('violet')).toContain('violet');
    });
    it('returns amber class', () => {
        expect(adminPillClass('amber')).toContain('amber');
    });
    it('returns emerald class', () => {
        expect(adminPillClass('emerald')).toContain('emerald');
    });
    it('returns red class', () => {
        expect(adminPillClass('red')).toContain('red');
    });
    it('returns cyan class', () => {
        expect(adminPillClass('cyan')).toContain('cyan');
    });
    it('returns indigo class', () => {
        expect(adminPillClass('indigo')).toContain('indigo');
    });
    it('returns neutral class for unknown tone', () => {
        const result = adminPillClass('neutral');
        expect(result).toContain('gray');
    });
});

describe('fetchAdminUsers', () => {
    let fetchAdminUsers: typeof import('../UsersTab').fetchAdminUsers;

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod = await import('../UsersTab');
        fetchAdminUsers = mod.fetchAdminUsers;
    });

    it('maps profiles to AdminUser array', async () => {
        const mockData = [
            { id: '1', full_name: 'Alice', email: 'alice@test.com', user_type: 'freelancer', active_mode: 'freelancer', cin_verified: true, is_admin: false, is_super_admin: false, account_status: 'active', created_at: '2024-01-01' },
            { id: '2', full_name: '', email: 'bob@test.com', user_type: 'client', active_mode: 'client', cin_verified: false, is_admin: true, is_super_admin: false, account_status: 'suspended', created_at: '2024-01-02' },
        ];
        mockSupabase.from.mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }));

        const result = await fetchAdminUsers();
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ name: 'Alice', email: 'alice@test.com', type: 'freelancer', status: 'active', cin_verified: true });
        expect(result[1]).toMatchObject({ name: '', email: 'bob@test.com', type: 'client', status: 'suspended', cin_verified: false, is_admin: true });
    });

    it('handles account_status migration fallback', async () => {
        mockSupabase.from
            .mockImplementationOnce(() => ({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: { message: 'column account_status does not exist' } }),
            }))
            .mockImplementationOnce(() => ({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [{ id: '1', full_name: 'Test', email: 'test@test.com', user_type: 'client', active_mode: 'client', cin_verified: false, is_admin: false, is_super_admin: false, created_at: '2024-01-01' }], error: null }),
            }));

        const result = await fetchAdminUsers();
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('active');
    });

    it('handles AbortError gracefully', async () => {
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        mockSupabase.from.mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockRejectedValue(abortError),
        }));

        const result = await fetchAdminUsers();
        expect(result).toEqual([]);
    });

    it('throws on non-abort errors', async () => {
        mockSupabase.from.mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockRejectedValue(new Error('Network error')),
        }));

        await expect(fetchAdminUsers()).rejects.toThrow('Network error');
    });
});

describe('fetchAdminJobs', () => {
    let fetchAdminJobs: typeof import('../JobsTab').fetchAdminJobs;

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod = await import('../JobsTab');
        fetchAdminJobs = mod.fetchAdminJobs;
    });

    it('maps jobs to AdminJob array with normalized client', async () => {
        const mockData = [
            { id: '1', title: 'Dev needed', status: 'open', budget_min: 100, budget_max: 500, hourly_rate: null, created_at: '2024-01-01', client: { full_name: 'Client A', email: 'a@test.com' } },
            { id: '2', title: 'Designer', status: 'in_progress', budget_min: null, budget_max: null, hourly_rate: 25, created_at: '2024-01-02', client: [{ full_name: 'Client B', email: 'b@test.com' }] },
        ];
        mockSupabase.from.mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }));

        const result = await fetchAdminJobs();
        expect(result).toHaveLength(2);
        expect(result[0].title).toBe('Dev needed');
        expect(result[0].client?.full_name).toBe('Client A');
        expect(result[1].client?.full_name).toBe('Client B');
    });

    it('handles null client', async () => {
        mockSupabase.from.mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [{ id: '1', title: 'Test', status: 'open', budget_min: null, budget_max: null, hourly_rate: null, created_at: '2024-01-01', client: null }], error: null }),
        }));

        const result = await fetchAdminJobs();
        expect(result[0].client).toBeNull();
    });

    it('handles AbortError gracefully', async () => {
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        mockSupabase.from.mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockRejectedValue(abortError),
        }));

        const result = await fetchAdminJobs();
        expect(result).toEqual([]);
    });

    it('throws on query error', async () => {
        mockSupabase.from.mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: { message: 'permission denied' } }),
        }));

        await expect(fetchAdminJobs()).rejects.toThrow('permission denied');
    });
});
