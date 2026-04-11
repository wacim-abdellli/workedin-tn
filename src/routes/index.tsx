import { accountRoutes } from './accountRoutes';
import { adminRoutes } from './adminRoutes';
import { contractRoutes } from './contractRoutes';
import { onboardingRoutes } from './onboardingRoutes';
import { publicRoutes } from './publicRoutes';
import { createRouteGraph, renderRouteDefinitions } from './routeDefinitions';
import { workspaceRoutes } from './workspaceRoutes';
import { ROUTES } from '@/lib/routes';

export const appRoutes = [
  ...publicRoutes,
  ...onboardingRoutes,
  ...workspaceRoutes,
  ...accountRoutes,
  ...contractRoutes,
  ...adminRoutes,
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
