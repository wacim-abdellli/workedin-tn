import { lazy } from 'react';

import {
  defineRoute,
  withErrorBoundary,
  withProtected,
  type AppRouteDefinition,
} from './routeDefinitions';

const ContractsList = lazy(() => import('@/pages/ContractsList'));
const JobProposals = lazy(() => import('@/pages/JobProposals'));
const JobPostSuccess = lazy(() => import('@/pages/JobPostSuccess'));
const JobMatches = lazy(() => import('@/pages/JobMatches'));
const ContractWorkspace = lazy(() => import('@/pages/ContractWorkspace'));
const LeaveReview = lazy(() => import('@/pages/LeaveReview'));
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('@/pages/PaymentFailed'));

export const contractRoutes: AppRouteDefinition[] = [
  defineRoute(
    {
      path: '/contracts',
      page: 'ContractsList',
      section: 'contracts',
      guard: 'protected',
      errorBoundary: false,
    },
    withProtected(<ContractsList />),
  ),
  defineRoute(
    {
      path: '/client/jobs/:jobId/proposals',
      page: 'JobProposals',
      section: 'contracts',
      guard: 'protected',
      errorBoundary: false,
    },
    withProtected(<JobProposals />),
  ),
  defineRoute(
    {
      path: '/jobs/posted/:jobId',
      page: 'JobPostSuccess',
      section: 'contracts',
      guard: 'protected',
      errorBoundary: false,
    },
    withProtected(<JobPostSuccess />),
  ),
  defineRoute(
    {
      path: '/jobs/:jobId/matches',
      page: 'JobMatches',
      section: 'contracts',
      guard: 'protected',
      errorBoundary: false,
    },
    withProtected(<JobMatches />),
  ),
  defineRoute(
    {
      path: '/contracts/:contractId',
      page: 'ContractWorkspace',
      section: 'contracts',
      guard: 'protected',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(<ContractWorkspace />)),
  ),
  defineRoute(
    {
      path: '/contracts/:contractId/review',
      page: 'LeaveReview',
      section: 'contracts',
      guard: 'protected',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(<LeaveReview />)),
  ),
  defineRoute(
    {
      path: '/payment/success',
      page: 'PaymentSuccess',
      section: 'contracts',
      guard: 'protected',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(<PaymentSuccess />)),
  ),
  defineRoute(
    {
      path: '/payment/failed',
      page: 'PaymentFailed',
      section: 'contracts',
      guard: 'protected',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(<PaymentFailed />)),
  ),
];
