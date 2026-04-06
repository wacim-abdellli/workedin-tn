import { lazy } from 'react';

import {
  defineRoute,
  withErrorBoundary,
  withOnboarding,
  withProtected,
  type AppRouteDefinition,
} from './routeDefinitions';

const FreelancerOnboarding = lazy(() => import('@/pages/FreelancerOnboarding'));
const ClientOnboarding = lazy(() => import('@/pages/ClientOnboarding'));

export const onboardingRoutes: AppRouteDefinition[] = [
  defineRoute(
    {
      path: '/onboarding/freelancer',
      page: 'FreelancerOnboarding',
      section: 'onboarding',
      guard: 'protected-onboarding',
      workspace: 'freelancer',
      errorBoundary: true,
    },
    withErrorBoundary(
      withProtected(withOnboarding('freelancer', <FreelancerOnboarding />)),
    ),
  ),
  defineRoute(
    {
      path: '/onboarding/client',
      page: 'ClientOnboarding',
      section: 'onboarding',
      guard: 'protected-onboarding',
      workspace: 'client',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(withOnboarding('client', <ClientOnboarding />))),
  ),
];
