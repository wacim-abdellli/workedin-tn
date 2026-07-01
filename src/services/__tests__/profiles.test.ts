import { describe, it, expect, vi, beforeEach } from 'vitest';

const supabaseMocks = vi.hoisted(() => {
  let defaultResult: Record<string, unknown> = { data: null, error: null };
  const builderTarget: Record<string, ReturnType<typeof vi.fn>> = {};

  function setDefaultResult(result: Record<string, unknown>) {
    defaultResult = result;
  }

  const builder = new Proxy(builderTarget, {
    get(target, prop: string | symbol) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown) => resolve(defaultResult);
      }
      return target[prop as string];
    },
  });

  function resetBuilder() {
    Object.assign(builderTarget, {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      neq: vi.fn(),
      not: vi.fn(),
      in: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      contains: vi.fn(),
      range: vi.fn(),
      order: vi.fn(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
      limit: vi.fn(),
      or: vi.fn(),
      ilike: vi.fn(),
    });

    builderTarget.select.mockReturnValue(builder);
    builderTarget.insert.mockReturnValue(builder);
    builderTarget.update.mockReturnValue(builder);
    builderTarget.upsert.mockReturnValue(builder);
    builderTarget.delete.mockReturnValue(builder);
    builderTarget.eq.mockReturnValue(builder);
    builderTarget.neq.mockReturnValue(builder);
    builderTarget.not.mockReturnValue(builder);
    builderTarget.in.mockReturnValue(builder);
    builderTarget.gte.mockReturnValue(builder);
    builderTarget.lte.mockReturnValue(builder);
    builderTarget.contains.mockReturnValue(builder);
    builderTarget.range.mockReturnValue(builder);
    builderTarget.order.mockReturnValue(builder);
    builderTarget.maybeSingle.mockReturnValue(builder);
    builderTarget.single.mockReturnValue(builder);
    builderTarget.limit.mockReturnValue(builder);
    builderTarget.or.mockReturnValue(builder);
    builderTarget.ilike.mockReturnValue(builder);
  }

  resetBuilder();

  return {
    builder,
    resetBuilder,
    from: vi.fn(() => builder),
    rpc: vi.fn(),
    setDefaultResult,
    uploadFile: vi.fn().mockResolvedValue('https://example.com/avatar.jpg'),
  };
});

vi.mock('@/lib/supabaseWithRetry', () => ({
  supabaseWithRetry: vi.fn((fn: () => unknown) => fn()),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: supabaseMocks.from, rpc: supabaseMocks.rpc },
  uploadFile: supabaseMocks.uploadFile,
}));

vi.mock('@/lib/schemaValidation', () => ({
  sanitizeFreelancerProfileData: vi.fn((data: Record<string, unknown>) => ({ ...data, sanitized: true })),
}));

import { supabase } from '@/lib/supabase';
import { supabaseWithRetry } from '@/lib/supabaseWithRetry';
import {
  getProfileById,
  getOwnProfile,
  getFreelancerProfile,
  getFreelancerWithProfile,
  getFreelancers,
  updateProfile,
  updateFreelancerProfile,
  uploadAvatar,
  getFavoriteStatus,
  toggleFavorite,
  getSavedJobs,
  getSavedFreelancerIds,
  toggleFreelancerFavorite,
  getReviewsByUser,
  getFreelancerReviewStats,
  getClientStats,
} from '../profiles';

const setupDefaultSingleResult = (data: unknown = { id: 'abc' }) => {
  supabaseMocks.builder.single.mockResolvedValue({ data, error: null });
};

const setupDefaultMaybeSingleResult = (data: unknown = { id: 'abc' }) => {
  supabaseMocks.builder.maybeSingle.mockResolvedValue({ data, error: null });
};

describe('profiles service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.resetBuilder();
    supabaseMocks.setDefaultResult({ data: null, error: null });
    setupDefaultSingleResult();
    setupDefaultMaybeSingleResult();
    (supabaseWithRetry as ReturnType<typeof vi.fn>).mockImplementation((fn: () => unknown) => fn());
  });

  describe('getProfileById', () => {
    it('queries public_profiles view by id', async () => {
      setupDefaultSingleResult({ id: 'user-1', full_name: 'Test User' });
      const result = await getProfileById('user-1');
      expect(supabase.from).toHaveBeenCalledWith('public_profiles');
      expect(supabaseMocks.builder.select).toHaveBeenCalledWith('*');
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('id', 'user-1');
      expect(result.data).toEqual({ id: 'user-1', full_name: 'Test User' });
    });
  });

  describe('getOwnProfile', () => {
    it('queries profiles table by id', async () => {
      setupDefaultSingleResult({ id: 'user-1', email: 'test@test.com' });
      const result = await getOwnProfile('user-1');
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabaseMocks.builder.select).toHaveBeenCalledWith('*');
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('id', 'user-1');
      expect(result.data).toEqual({ id: 'user-1', email: 'test@test.com' });
    });
  });

  describe('getFreelancerProfile', () => {
    it('queries freelancer_profiles table by id', async () => {
      setupDefaultSingleResult({ id: 'user-1', title: 'Developer', hourly_rate: 50 });
      const result = await getFreelancerProfile('user-1');
      expect(supabase.from).toHaveBeenCalledWith('freelancer_profiles');
      expect(supabaseMocks.builder.select).toHaveBeenCalledWith('*');
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('id', 'user-1');
      expect(result.data).toEqual({ id: 'user-1', title: 'Developer', hourly_rate: 50 });
    });
  });

  describe('getFreelancerWithProfile', () => {
    it('performs joined query with portfolio_items limit', async () => {
      setupDefaultSingleResult({ id: 'user-1', freelancer_profiles: { title: 'Dev' }, portfolio_items: [] });
      const result = await getFreelancerWithProfile('user-1');
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabaseMocks.builder.select).toHaveBeenCalledWith('*, freelancer_profiles(*), portfolio_items(*)');
      expect(supabaseMocks.builder.limit).toHaveBeenCalledWith(20, { foreignTable: 'portfolio_items' });
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('id', 'user-1');
      expect(result.data.freelancer_profiles.title).toBe('Dev');
    });
  });

  describe('getFreelancers', () => {
    it('queries public_profiles with freelancer_profiles inner join', async () => {
      supabaseMocks.setDefaultResult({ data: [{ id: 'f-1' }], error: null, count: 1 });
      const result = await getFreelancers({}, 1, 20);
      expect(supabase.from).toHaveBeenCalledWith('public_profiles');
      expect(supabaseMocks.builder.in).toHaveBeenCalledWith('user_type', ['freelancer', 'both']);
      expect(supabaseMocks.builder.range).toHaveBeenCalledWith(0, 19);
      expect(result.data).toHaveLength(1);
    });

    it('applies search filter using .or() when available', async () => {
      supabaseMocks.builder.or = vi.fn(() => supabaseMocks.builder);
      supabaseMocks.setDefaultResult({ data: [], error: null, count: 0 });
      await getFreelancers({ search: 'John' }, 1, 20);
      expect(supabaseMocks.builder.or).toHaveBeenCalled();
    });

    it('applies search filter using .ilike() fallback when .or() unavailable', async () => {
      supabaseMocks.builder.or = undefined as unknown as ReturnType<typeof vi.fn>;
      supabaseMocks.setDefaultResult({ data: [], error: null, count: 0 });
      await getFreelancers({ search: 'John' }, 1, 20);
      expect(supabaseMocks.builder.ilike).toHaveBeenCalled();
    });

    it('applies all filters', async () => {
      supabaseMocks.setDefaultResult({ data: [{ id: 'f-1' }], error: null, count: 1 });
      await getFreelancers({
        availability: 'available',
        minRate: 20,
        maxRate: 100,
        skills: ['React'],
        locations: ['Tunis'],
        excludeId: 'user-1',
      }, 2, 10);
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('freelancer_profiles.availability', 'available');
      expect(supabaseMocks.builder.gte).toHaveBeenCalledWith('freelancer_profiles.hourly_rate', 20);
      expect(supabaseMocks.builder.lte).toHaveBeenCalledWith('freelancer_profiles.hourly_rate', 100);
      expect(supabaseMocks.builder.contains).toHaveBeenCalledWith('freelancer_profiles.skills', ['React']);
      expect(supabaseMocks.builder.in).toHaveBeenCalledWith('location', ['Tunis']);
      expect(supabaseMocks.builder.neq).toHaveBeenCalledWith('id', 'user-1');
      expect(supabaseMocks.builder.range).toHaveBeenCalledWith(10, 19);
    });

    it('does not apply availability filter when set to any', async () => {
      supabaseMocks.setDefaultResult({ data: [], error: null, count: 0 });
      await getFreelancers({ availability: 'any' }, 1, 20);
      const eqCalls = supabaseMocks.builder.eq.mock.calls.filter(
        ([col]: [string]) => col === 'freelancer_profiles.availability'
      );
      expect(eqCalls).toHaveLength(0);
    });

    it('handles empty search string', async () => {
      supabaseMocks.setDefaultResult({ data: [], error: null, count: 0 });
      await getFreelancers({ search: '' }, 1, 20);
      expect(supabaseMocks.builder.or).not.toHaveBeenCalled();
      expect(supabaseMocks.builder.ilike).not.toHaveBeenCalled();
    });

    it('strips dangerous characters from search', async () => {
      supabaseMocks.builder.or = vi.fn(() => supabaseMocks.builder);
      supabaseMocks.setDefaultResult({ data: [], error: null, count: 0 });
      await getFreelancers({ search: 'John,"_%' }, 1, 20);
      expect(supabaseMocks.builder.or).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('updates the profiles table with updated_at', async () => {
      await updateProfile('user-1', { full_name: 'New Name' });
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabaseMocks.builder.update).toHaveBeenCalledWith(
        expect.objectContaining({ full_name: 'New Name', updated_at: expect.any(String) })
      );
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('id', 'user-1');
    });
  });

  describe('updateFreelancerProfile', () => {
    it('upserts sanitized data to freelancer_profiles', async () => {
      await updateFreelancerProfile('user-1', { title: 'Developer' });
      expect(supabase.from).toHaveBeenCalledWith('freelancer_profiles');
      expect(supabaseMocks.builder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-1', sanitized: true, updated_at: expect.any(String) }),
        { onConflict: 'id' }
      );
    });
  });

  describe('uploadAvatar', () => {
    it('uploads file to avatars bucket', async () => {
      const file = new File(['data'], 'avatar.png', { type: 'image/png' });
      await uploadAvatar('user-1', file);
      expect(supabaseMocks.uploadFile).toHaveBeenCalledWith('avatars', expect.stringContaining('user-1/avatar-'), file);
    });

    it('returns the uploaded URL', async () => {
      const file = new File(['data'], 'avatar.png', { type: 'image/png' });
      const result = await uploadAvatar('user-1', file);
      expect(result).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('getFavoriteStatus', () => {
    it('queries favorites with user_id and job_id', async () => {
      setupDefaultMaybeSingleResult({ id: 'fav-1' });
      const result = await getFavoriteStatus('user-1', 'job-1');
      expect(supabase.from).toHaveBeenCalledWith('favorites');
      expect(supabaseMocks.builder.select).toHaveBeenCalledWith('id');
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('job_id', 'job-1');
      expect(result.data).toEqual({ id: 'fav-1' });
    });
  });

  describe('toggleFavorite', () => {
    it('deletes favorite when isSaved is true', async () => {
      await toggleFavorite('user-1', 'job-1', true);
      expect(supabase.from).toHaveBeenCalledWith('favorites');
      expect(supabaseMocks.builder.delete).toHaveBeenCalled();
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('job_id', 'job-1');
    });

    it('inserts favorite when isSaved is false', async () => {
      await toggleFavorite('user-1', 'job-1', false);
      expect(supabase.from).toHaveBeenCalledWith('favorites');
      expect(supabaseMocks.builder.insert).toHaveBeenCalledWith({ user_id: 'user-1', job_id: 'job-1' });
    });
  });

  describe('getSavedJobs', () => {
    it('queries favorites with joined job data', async () => {
      supabaseMocks.setDefaultResult({ data: [{ job_id: 'job-1', jobs: { title: 'Test' } }], error: null });
      const result = await getSavedJobs('user-1');
      expect(supabase.from).toHaveBeenCalledWith('favorites');
      expect(supabaseMocks.builder.select).toHaveBeenCalledWith('job_id, jobs(*)');
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(supabaseMocks.builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(supabaseMocks.builder.not).toHaveBeenCalledWith('job_id', 'is', null);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getSavedFreelancerIds', () => {
    it('queries favorites for freelancer IDs', async () => {
      supabaseMocks.setDefaultResult({ data: [{ freelancer_id: 'f-1' }], error: null });
      const result = await getSavedFreelancerIds('user-1');
      expect(supabase.from).toHaveBeenCalledWith('favorites');
      expect(supabaseMocks.builder.select).toHaveBeenCalledWith('freelancer_id');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('toggleFreelancerFavorite', () => {
    it('deletes when isSaved is true', async () => {
      await toggleFreelancerFavorite('user-1', 'f-1', true);
      expect(supabase.from).toHaveBeenCalledWith('favorites');
      expect(supabaseMocks.builder.delete).toHaveBeenCalled();
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('freelancer_id', 'f-1');
    });

    it('inserts when isSaved is false', async () => {
      await toggleFreelancerFavorite('user-1', 'f-1', false);
      expect(supabase.from).toHaveBeenCalledWith('favorites');
      expect(supabaseMocks.builder.insert).toHaveBeenCalledWith({ user_id: 'user-1', freelancer_id: 'f-1' });
    });
  });

  describe('getReviewsByUser', () => {
    it('queries reviews by reviewee_id', async () => {
      supabaseMocks.setDefaultResult({ data: [{ id: 'r-1', rating: 5 }], error: null });
      const result = await getReviewsByUser('user-1');
      expect(supabase.from).toHaveBeenCalledWith('reviews');
      expect(supabaseMocks.builder.select).toHaveBeenCalledWith('*');
      expect(supabaseMocks.builder.eq).toHaveBeenCalledWith('reviewee_id', 'user-1');
      expect(supabaseMocks.builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getFreelancerReviewStats', () => {
    it('computes weighted average rating', async () => {
      supabaseMocks.setDefaultResult({
        data: [
          { rating: 5, trust_weight: 1 },
          { rating: 3, trust_weight: 1 },
        ],
        error: null,
      });
      const stats = await getFreelancerReviewStats('user-1');
      expect(stats.averageRating).toBe(4);
      expect(stats.reviewCount).toBe(2);
    });

    it('returns zeros when no reviews', async () => {
      supabaseMocks.setDefaultResult({ data: [], error: null });
      const stats = await getFreelancerReviewStats('user-1');
      expect(stats.averageRating).toBe(0);
      expect(stats.reviewCount).toBe(0);
    });

    it('returns zeros on error', async () => {
      supabaseMocks.setDefaultResult({ data: null, error: { message: 'DB error' } });
      const stats = await getFreelancerReviewStats('user-1');
      expect(stats.averageRating).toBe(0);
      expect(stats.reviewCount).toBe(0);
    });

    it('handles trust_weight with default of 1', async () => {
      supabaseMocks.setDefaultResult({
        data: [{ rating: 4, trust_weight: null }, { rating: 5, trust_weight: null }],
        error: null,
      });
      const stats = await getFreelancerReviewStats('user-1');
      expect(stats.averageRating).toBe(4.5);
      expect(stats.reviewCount).toBe(2);
    });

    it('returns zeros when select throws', async () => {
      (supabaseWithRetry as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
      const stats = await getFreelancerReviewStats('user-1');
      expect(stats.averageRating).toBe(0);
      expect(stats.reviewCount).toBe(0);
    });
  });

  describe('getClientStats', () => {
    it('calls RPC and parses result', async () => {
      supabaseMocks.rpc.mockResolvedValue({
        data: [{ job_count: 10, total_spent: 5000, avg_rating: 4.5 }],
        error: null,
      });
      const stats = await getClientStats('client-1');
      expect(supabase.rpc).toHaveBeenCalledWith('get_client_stats_v2', { p_client_id: 'client-1' });
      expect(stats).toEqual({ totalJobs: 10, totalSpent: 5000, rating: 4.5 });
    });

    it('returns zeros on error', async () => {
      supabaseMocks.rpc.mockResolvedValue({ data: null, error: { message: 'RPC error' } });
      const stats = await getClientStats('client-1');
      expect(stats).toEqual({ totalJobs: 0, totalSpent: 0, rating: 0 });
    });

    it('returns zeros when RPC throws', async () => {
      supabaseMocks.rpc.mockRejectedValue(new Error('Network error'));
      const stats = await getClientStats('client-1');
      expect(stats).toEqual({ totalJobs: 0, totalSpent: 0, rating: 0 });
    });

    it('handles empty result array', async () => {
      supabaseMocks.rpc.mockResolvedValue({ data: [], error: null });
      const stats = await getClientStats('client-1');
      expect(stats).toEqual({ totalJobs: 0, totalSpent: 0, rating: 0 });
    });

    it('handles null stats in result', async () => {
      supabaseMocks.rpc.mockResolvedValue({ data: [null], error: null });
      const stats = await getClientStats('client-1');
      expect(stats).toEqual({ totalJobs: 0, totalSpent: 0, rating: 0 });
    });
  });
});
