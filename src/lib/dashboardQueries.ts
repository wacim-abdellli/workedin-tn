import type { QueryClient } from '@tanstack/react-query';

export const dashboardQueryKeys = {
  freelancerStats: (userId: string | null | undefined) => ['freelancerDashboardStats', userId] as const,
  clientStats: (userId: string | null | undefined) => ['clientDashboardStats', userId] as const,
};

export async function invalidateFreelancerDashboardQueries(
  queryClient: Pick<QueryClient, 'invalidateQueries'>,
  userId: string | null | undefined,
) {
  if (!userId) return;

  await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.freelancerStats(userId) });
}

export async function invalidateClientDashboardQueries(
  queryClient: Pick<QueryClient, 'invalidateQueries'>,
  userId: string | null | undefined,
) {
  if (!userId) return;

  await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.clientStats(userId) });
}
