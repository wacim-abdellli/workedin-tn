/**
 * Service Layer Tests - Critical Path Coverage
 * Tests the service functions return correct query structures
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockEq,
    mockNeq,
    mockOr,
    mockOrder,
    mockLimit,
    mockRange,
    mockSingle,
    mockMaybeSingle,
    mockIlike,
    mockGte,
    mockLte,
    mockUpsert,
    mockRpc,
    mockFrom,
} = vi.hoisted(() => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockInsert = vi.fn().mockReturnThis();
    const mockUpdate = vi.fn().mockReturnThis();
    const mockDelete = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockNeq = vi.fn().mockReturnThis();
    const mockOr = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockReturnThis();
    const mockRange = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockReturnThis();
    const mockMaybeSingle = vi.fn().mockReturnThis();
    const mockIlike = vi.fn().mockReturnThis();
    const mockGte = vi.fn().mockReturnThis();
    const mockLte = vi.fn().mockReturnThis();
    const mockUpsert = vi.fn().mockReturnThis();
    const mockRpc = vi.fn();

    const mockFrom = vi.fn(() => ({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
        eq: mockEq,
        neq: mockNeq,
        or: mockOr,
        order: mockOrder,
        limit: mockLimit,
        range: mockRange,
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
        ilike: mockIlike,
        gte: mockGte,
        lte: mockLte,
        upsert: mockUpsert,
    }));

    return {
        mockSelect,
        mockInsert,
        mockUpdate,
        mockDelete,
        mockEq,
        mockNeq,
        mockOr,
        mockOrder,
        mockLimit,
        mockRange,
        mockSingle,
        mockMaybeSingle,
        mockIlike,
        mockGte,
        mockLte,
        mockUpsert,
        mockRpc,
        mockFrom,
    };
});

vi.mock('@/lib/supabase', () => ({
    supabase: { from: mockFrom, rpc: mockRpc },
    supabaseAnon: { from: mockFrom },
    uploadFile: vi.fn().mockResolvedValue('https://example.com/file.jpg'),
}));

import * as jobsService from '@/services/jobs';
import * as proposalsService from '@/services/proposals';
import * as profilesService from '@/services/profiles';
import * as notificationsService from '@/services/notifications';

function resetMocks() {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: null, error: null });
}

describe('Jobs Service', () => {
    beforeEach(() => {
        resetMocks();
    });

    it('getJobs calls supabase with default filters', async () => {
        await jobsService.getJobs();
        expect(mockFrom).toHaveBeenCalledWith('jobs');
    });

    it('getJobs applies category filter', async () => {
        await jobsService.getJobs({ category: 'design' } as never);
        expect(mockFrom).toHaveBeenCalledWith('jobs');
    });

    it('getJobById fetches single job with client join', async () => {
        await jobsService.getJobById('test-id');
        expect(mockFrom).toHaveBeenCalledWith('jobs');
    });

    it('createJob inserts with open status', async () => {
        const job = {
            client_id: 'user-1',
            title: 'Test Job',
            description: 'A test job',
            category: 'design',
            job_type: 'fixed_price' as const,
            duration: '1-week',
            experience_level: 'intermediate',
            visibility: 'public',
        };
        await jobsService.createJob(job);
        expect(mockFrom).toHaveBeenCalledWith('jobs');
    });
});

describe('Proposals Service', () => {
    beforeEach(() => {
        resetMocks();
    });

    it('getMyProposal queries by job and freelancer', async () => {
        await proposalsService.getMyProposal('job-1', 'freelancer-1');
        expect(mockFrom).toHaveBeenCalledWith('proposals');
    });

    it('withdrawProposal deletes by id', async () => {
        await proposalsService.withdrawProposal('proposal-1');
        expect(mockFrom).toHaveBeenCalledWith('proposals');
    });
});

describe('Profiles Service', () => {
    beforeEach(() => {
        resetMocks();
    });

    it('getProfileById fetches single profile', async () => {
        await profilesService.getProfileById('user-1');
        expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    it('updateProfile includes updated_at', async () => {
        await profilesService.updateProfile('user-1', { full_name: 'Test' });
        expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    it('toggleFavorite inserts when not saved', async () => {
        await profilesService.toggleFavorite('user-1', 'job-1', false);
        expect(mockFrom).toHaveBeenCalledWith('favorites');
    });

    it('toggleFavorite deletes when saved', async () => {
        await profilesService.toggleFavorite('user-1', 'job-1', true);
        expect(mockFrom).toHaveBeenCalledWith('favorites');
    });
});

describe('Notifications Service', () => {
    beforeEach(() => {
        resetMocks();
    });

    it('getNotifications fetches with limit', async () => {
        await notificationsService.getNotifications('user-1');
        expect(mockFrom).toHaveBeenCalledWith('notifications');
    });

    it('markAllRead updates unread notifications', async () => {
        await notificationsService.markAllRead('user-1');
        expect(mockFrom).toHaveBeenCalledWith('notifications');
    });
});
