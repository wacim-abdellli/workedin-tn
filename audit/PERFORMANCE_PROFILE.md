# Performance Profile

This document is the P2-4 source of truth for current query/cache performance improvements in `khedma-tn`.

## Hotspots found

1. Global focus refetch churn
   - The React Query client was configured with `refetchOnWindowFocus: true`.
   - On multi-query routes such as dashboards and job detail, tab focus could fan out into several unnecessary refetches at once.

2. Duplicate profile-save work in settings
   - `ProfileSettings` called `updateProfile()`, then `refreshProfile()`, then several manual dashboard invalidations.
   - That doubled profile work and still used stale or incorrect invalidation keys.

3. Wrong dashboard invalidation keys
   - `AuthContext` and settings code invalidated `['freelancer-dashboard']`, `['clientDashboardJobs']`, and `['clientActiveContracts']`.
   - Those keys did not match the actual dashboard queries and created noisy, low-value invalidation logic.

## Changes made

1. Disabled global focus refetch
   - `src/lib/queryClient.ts`
   - Standard queries no longer refetch on every tab focus unless they explicitly opt in.

2. Centralized dashboard query keys
   - `src/lib/dashboardQueries.ts`
   - Client and freelancer dashboard stats now share one canonical query-key source.

3. Narrowed invalidation policy
   - `updateProfile()` no longer invalidates unrelated dashboard queries.
   - `refreshProfile()` no longer triggers broad dashboard invalidation.
   - `updateFreelancerProfile()` invalidates only the freelancer dashboard stats query, which actually depends on freelancer profile metadata.

4. Removed duplicate settings refresh churn
   - `ProfileSettings` no longer calls `refreshProfile()` immediately after `updateProfile()`.
   - Avatar updates now go through `updateProfile({ avatar_url })` instead of a separate profile write plus refresh.

## Measurable impact

### Focus-refetch budget
- Before:
  - standard routes could trigger all mounted stale queries on every window-focus event
- After:
  - budget is `0` implicit focus refetches for standard queries
  - any route that truly needs focus refresh must opt in explicitly

### Settings save budget
- Before:
  - `1` profile write
  - `1` forced profile reread
  - `4+` manual dashboard invalidation attempts
- After:
  - `1` profile write
  - `0` forced profile rereads
  - `0` broad dashboard invalidations for normal profile saves

### Freelancer profile update budget
- Before:
  - freelancer dashboard title/connects metadata could remain stale
- After:
  - exactly `1` targeted freelancer dashboard stats invalidation

## Budgets to hold going forward

- Default query behavior:
  - `refetchOnWindowFocus` stays `false`
- Settings/profile mutations:
  - no forced `refreshProfile()` immediately after `updateProfile()`
- Dashboard invalidation:
  - invalidate only canonical dashboard keys that actually consume the changed data
- Critical-route query fan-out:
  - new pages should aggregate related backend reads where practical rather than stacking many separate `useQuery` hooks for the same view

## Verification

- `npm run test:run`
- `npm run audit:strict`

Supporting tests added:

- `src/lib/__tests__/dashboardQueries.test.ts`
- `src/lib/__tests__/queryClient.test.ts`
