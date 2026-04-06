import { accountRoutes } from './accountRoutes';
import { adminRoutes } from './adminRoutes';
import { contractRoutes } from './contractRoutes';
import { onboardingRoutes } from './onboardingRoutes';
import { publicRoutes } from './publicRoutes';
import { createRouteGraph, renderRouteDefinitions } from './routeDefinitions';
import { workspaceRoutes } from './workspaceRoutes';

export const appRoutes = [
  ...publicRoutes,
  ...onboardingRoutes,
  ...workspaceRoutes,
  ...accountRoutes,
  ...contractRoutes,
  ...adminRoutes,
];

export const appRouteGraph = createRouteGraph(appRoutes);

export { renderRouteDefinitions };
