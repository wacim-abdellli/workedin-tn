import { lazy } from 'react';

import { ProfileRedirect } from '@/components/routing/ProfileRedirect';

import {
  defineRoute,
  withErrorBoundary,
  withProtected,
  withWorkspace,
  type AppRouteDefinition,
} from './routeDefinitions';

const Wallet = lazy(() => import('@/pages/Wallet'));
const MyProposals = lazy(() => import('@/pages/MyProposals'));
const ClientJobs = lazy(() => import('@/pages/ClientJobs'));
const Messages = lazy(() => import('@/pages/Messages'));
const Settings = lazy(() => import('@/pages/Settings'));
const VerifyIdentity = lazy(() => import('@/pages/VerifyIdentity'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const SavedJobs = lazy(() => import('@/pages/SavedJobs'));

export const accountRoutes: AppRouteDefinition[] = [
  defineRoute(
    { path: '/wallet', page: 'Wallet', section: 'account', guard: 'protected', errorBoundary: false },
    withProtected(<Wallet />),
  ),
  defineRoute(
    {
      path: '/my-proposals',
      page: 'MyProposals',
      section: 'account',
      guard: 'protected-workspace',
      workspace: 'freelancer',
      errorBoundary: false,
    },
    withProtected(withWorkspace('freelancer', <MyProposals />)),
  ),
  defineRoute(
    {
      path: '/client/jobs',
      page: 'ClientJobs',
      section: 'account',
      guard: 'protected-workspace',
      workspace: 'client',
      errorBoundary: false,
    },
    withProtected(withWorkspace('client', <ClientJobs />)),
  ),
  defineRoute(
    {
      path: '/messages',
      page: 'Messages',
      section: 'account',
      guard: 'protected',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(<Messages />)),
  ),
  defineRoute(
    {
      path: '/profile',
      page: 'ProfileRedirect',
      section: 'account',
      guard: 'protected-redirect',
      errorBoundary: false,
    },
    withProtected(<ProfileRedirect />),
  ),
  defineRoute(
    {
      path: '/settings',
      page: 'Settings',
      section: 'account',
      guard: 'protected',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(<Settings />)),
  ),
  defineRoute(
    {
      path: '/settings/:tab',
      page: 'Settings',
      section: 'account',
      guard: 'protected',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(<Settings />)),
  ),
  defineRoute(
    {
      path: '/verify-identity',
      page: 'VerifyIdentity',
      section: 'account',
      guard: 'protected',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(<VerifyIdentity />)),
  ),
  defineRoute(
    {
      path: '/notifications',
      page: 'Notifications',
      section: 'account',
      guard: 'protected',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(<Notifications />)),
  ),
  defineRoute(
    {
      path: '/saved',
      page: 'SavedJobs',
      section: 'account',
      guard: 'protected',
      errorBoundary: false,
    },
    withProtected(<SavedJobs />),
  ),
];
