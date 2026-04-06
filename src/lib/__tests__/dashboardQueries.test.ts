import { describe, expect, it, vi } from 'vitest';

import {
  dashboardQueryKeys,
  invalidateClientDashboardQueries,
  invalidateFreelancerDashboardQueries,
} from '../dashboardQueries';

describe('dashboard query keys', () => {
  it('builds stable dashboard query keys', () => {
    expect(dashboardQueryKeys.freelancerStats('user-1')).toEqual(['freelancerDashboardStats', 'user-1']);
    expect(dashboardQueryKeys.clientStats('user-2')).toEqual(['clientDashboardStats', 'user-2']);
  });

  it('invalidates only freelancer dashboard queries when requested', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);

    await invalidateFreelancerDashboardQueries({ invalidateQueries }, 'user-1');

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['freelancerDashboardStats', 'user-1'] });
  });

  it('invalidates only client dashboard queries when requested', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);

    await invalidateClientDashboardQueries({ invalidateQueries }, 'user-2');

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['clientDashboardStats', 'user-2'] });
  });

  it('skips invalidation when no user id exists', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);

    await invalidateFreelancerDashboardQueries({ invalidateQueries }, undefined);
    await invalidateClientDashboardQueries({ invalidateQueries }, null);

    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
