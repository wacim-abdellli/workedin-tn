import { lazy } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import {
  defineRoute,
  withErrorBoundary,
  withProtected,
  withWorkspace,
  type AppRouteDefinition,
} from './routeDefinitions';

const ContractsList = lazy(() => import('@/pages/ContractsList'));
const JobProposals = lazy(() => import('@/pages/JobProposals'));
const JobPostSuccess = lazy(() => import('@/pages/JobPostSuccess'));
const JobMatches = lazy(() => import('@/pages/JobMatches'));
const LeaveReview = lazy(() => import('@/pages/LeaveReview'));
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'));
const PaymentFailed = lazy(() => import('@/pages/PaymentFailed'));
const EditJob = lazy(() => import('@/pages/EditJob'));

function ContractSessionRedirect() {
  const { contractId } = useParams<{ contractId: string }>();
  const location = useLocation();
  const routeState = (location.state as { otherUserId?: string | null } | null) ?? null;
  const encodedContractId = contractId ? encodeURIComponent(contractId) : '';
  const encodedOtherUserId = routeState?.otherUserId ? encodeURIComponent(routeState.otherUserId) : '';
  const target = contractId
    ? `/messages?contract=${encodedContractId}${encodedOtherUserId ? `&with=${encodedOtherUserId}` : ''}`
    : '/messages';
  return <Navigate to={target} replace state={contractId ? { contractId, otherUserId: routeState?.otherUserId ?? null } : null} />;
}

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
      guard: 'protected-workspace',
      workspace: 'client',
      errorBoundary: false,
    },
    withProtected(withWorkspace('client', <JobProposals />)),
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
      path: '/jobs/:jobId/edit',
      page: 'EditJob',
      section: 'contracts',
      guard: 'protected-workspace',
      workspace: 'client',
      errorBoundary: false,
    },
    withProtected(withWorkspace('client', <EditJob />)),
  ),
  defineRoute(
    {
      path: '/jobs/:jobId/matches',
      page: 'JobMatches',
      section: 'contracts',
      guard: 'protected-workspace',
      workspace: 'client',
      errorBoundary: false,
    },
    withProtected(withWorkspace('client', <JobMatches />)),
  ),
  defineRoute(
    {
      path: '/contracts/:contractId',
      page: 'ContractSessionRedirect',
      section: 'contracts',
      guard: 'protected',
      errorBoundary: false,
    },
    withProtected(<ContractSessionRedirect />),
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
