import { lazy } from 'react';
import { accountRoutes } from './accountRoutes';
import { adminRoutes } from './adminRoutes';
import { contractRoutes } from './contractRoutes';
import { onboardingRoutes } from './onboardingRoutes';
import { publicRoutes } from './publicRoutes';
import { createRouteGraph, renderRouteDefinitions, defineRoute, withErrorBoundary } from './routeDefinitions';
import { workspaceRoutes } from './workspaceRoutes';
import { ROUTES } from '@/lib/routes';

const NotFound = lazy(() => import('@/pages/NotFound'));

export const appRoutes = [
  ...publicRoutes,
  ...onboardingRoutes,
  ...workspaceRoutes,
  ...accountRoutes,
  ...contractRoutes,
  ...adminRoutes,
  defineRoute(
    { path: '*', page: 'NotFound', section: 'public', guard: 'public', errorBoundary: true },
    withErrorBoundary(<NotFound />),
  ),
];

export const appRouteGraph = createRouteGraph(appRoutes);

if (import.meta.env.DEV) {
  const registeredPaths = new Set(appRoutes.map((route) => route.path));
  const requiredTargets = [
    ROUTES.login,
    ROUTES.myProposals,
    ROUTES.freelancerPortfolio,
    ROUTES.clientJobs,
    ROUTES.jobs,
    ROUTES.settings,
  ];

  const missingTargets = requiredTargets.filter((path) => !registeredPaths.has(path));
  if (missingTargets.length > 0) {
    console.error('[Routes] Missing required navigation targets:', missingTargets);
  }
}

export { renderRouteDefinitions };
