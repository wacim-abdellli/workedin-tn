import { lazy } from 'react';

import {
  defineRoute,
  withAdmin,
  withErrorBoundary,
  type AppRouteDefinition,
} from './routeDefinitions';

const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const VerificationQueue = lazy(() => import('@/pages/admin/VerificationQueue'));

export const adminRoutes: AppRouteDefinition[] = [
  defineRoute(
    { path: '/admin', page: 'AdminDashboard', section: 'admin', guard: 'admin', errorBoundary: true },
    withErrorBoundary(withAdmin(<AdminDashboard />)),
  ),
  defineRoute(
    { path: '/admin/verifications', page: 'VerificationQueue', section: 'admin', guard: 'admin', errorBoundary: true },
    withErrorBoundary(withAdmin(<VerificationQueue />)),
  ),
];
