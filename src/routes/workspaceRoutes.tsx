import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

import {
  defineRoute,
  withErrorBoundary,
  withProtected,
  withWorkspace,
  type AppRouteDefinition,
} from './routeDefinitions';

import { DashboardRedirect } from '@/components/navigation/DashboardRedirect';
import { MyJobsRedirect } from '@/components/navigation/MyJobsRedirect';

const FreelancerDashboard = lazy(() => import('@/pages/FreelancerDashboard'));
const PortfolioDashboard = lazy(() => import('@/pages/PortfolioDashboard'));
const FreelancerEarnings = lazy(() => import('@/pages/FreelancerEarnings'));
const ClientDashboard = lazy(() => import('@/pages/ClientDashboard'));
const JobPost = lazy(() => import('@/pages/JobPost'));

export const workspaceRoutes: AppRouteDefinition[] = [
  defineRoute(
    {
      path: '/dashboard',
      page: 'DashboardRedirect',
      section: 'workspace',
      guard: 'protected-redirect',
      errorBoundary: false,
    },
    withProtected(<DashboardRedirect />),
  ),
  defineRoute(
    {
      path: '/my-jobs',
      page: 'MyJobsRedirect',
      section: 'workspace',
      guard: 'protected-redirect',
      errorBoundary: false,
    },
    withProtected(<MyJobsRedirect />),
  ),
  defineRoute(
    {
      path: '/freelancer/dashboard',
      page: 'FreelancerDashboard',
      section: 'workspace',
      guard: 'protected-workspace',
      workspace: 'freelancer',
      errorBoundary: true,
    },
    withErrorBoundary(
      withProtected(withWorkspace('freelancer', <FreelancerDashboard />)),
    ),
  ),
  defineRoute(
    {
      path: '/freelancer/portfolio',
      page: 'PortfolioDashboard',
      section: 'workspace',
      guard: 'protected-workspace',
      workspace: 'freelancer',
      errorBoundary: false,
    },
    withProtected(withWorkspace('freelancer', <PortfolioDashboard />)),
  ),
  defineRoute(
    {
      path: '/freelancer/earnings',
      page: 'FreelancerEarnings',
      section: 'workspace',
      guard: 'protected-workspace',
      workspace: 'freelancer',
      errorBoundary: false,
    },
    withProtected(withWorkspace('freelancer', <FreelancerEarnings />)),
  ),
  defineRoute(
    {
      path: '/client/dashboard',
      page: 'ClientDashboard',
      section: 'workspace',
      guard: 'protected-workspace',
      workspace: 'client',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(withWorkspace('client', <ClientDashboard />))),
  ),
  defineRoute(
    {
      path: '/jobs/new',
      page: 'JobPost',
      section: 'workspace',
      guard: 'protected-workspace',
      workspace: 'client',
      errorBoundary: false,
    },
    withProtected(withWorkspace('client', <JobPost />)),
  ),
  defineRoute(
    {
      path: '/post-job',
      page: 'PostJobRedirect',
      section: 'workspace',
      guard: 'public-redirect',
      errorBoundary: false,
      redirectTo: '/jobs/new',
    },
    <Navigate to="/jobs/new" replace />,
  ),
];
