import { lazy } from 'react';

import {
  defineRoute,
  withErrorBoundary,
  withProtected,
  withWorkspace,
  type AppRouteDefinition,
} from './routeDefinitions';

const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const HowItWorks = lazy(() => import('@/pages/HowItWorks'));
const ForClients = lazy(() => import('@/pages/ForClients'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const JobBoard = lazy(() => import('@/pages/JobBoard'));
const JobDetail = lazy(() => import('@/pages/JobDetail'));
const FindFreelancers = lazy(() => import('@/pages/FindFreelancers'));
const SearchResults = lazy(() => import('@/pages/SearchResults'));
const FreelancerProfile = lazy(() => import('@/pages/FreelancerProfile'));
const ClientProfile = lazy(() => import('@/pages/ClientProfile'));


export const publicRoutes: AppRouteDefinition[] = [
  defineRoute(
    { path: '/', page: 'Home', section: 'public', guard: 'public', errorBoundary: true },
    withErrorBoundary(<Home />),
  ),
  defineRoute(
    {
      path: '/how-it-works',
      page: 'HowItWorks',
      section: 'public',
      guard: 'public',
      errorBoundary: true,
    },
    withErrorBoundary(<HowItWorks />),
  ),
  defineRoute(
    {
      path: '/for-clients',
      page: 'ForClients',
      section: 'public',
      guard: 'public',
      errorBoundary: true,
    },
    withErrorBoundary(<ForClients />),
  ),
  defineRoute(
    { path: '/login', page: 'Login', section: 'public', guard: 'public', errorBoundary: true },
    withErrorBoundary(<Login />),
  ),
  defineRoute(
    { path: '/signup', page: 'Signup', section: 'public', guard: 'public', errorBoundary: true },
    withErrorBoundary(<Signup />),
  ),
  defineRoute(
    { path: '/terms', page: 'Terms', section: 'public', guard: 'public', errorBoundary: true },
    withErrorBoundary(<Terms />),
  ),
  defineRoute(
    {
      path: '/privacy',
      page: 'Privacy',
      section: 'public',
      guard: 'public',
      errorBoundary: true,
    },
    withErrorBoundary(<Privacy />),
  ),
  defineRoute(
    { path: '/faq', page: 'FAQ', section: 'public', guard: 'public', errorBoundary: true },
    withErrorBoundary(<FAQ />),
  ),
  defineRoute(
    {
      path: '/forgot-password',
      page: 'ForgotPassword',
      section: 'public',
      guard: 'public',
      errorBoundary: true,
    },
    withErrorBoundary(<ForgotPassword />),
  ),
  defineRoute(
    {
      path: '/reset-password',
      page: 'ResetPassword',
      section: 'public',
      guard: 'public',
      errorBoundary: true,
    },
    withErrorBoundary(<ResetPassword />),
  ),
  defineRoute(
    {
      path: '/auth/callback',
      page: 'AuthCallback',
      section: 'public',
      guard: 'public',
      errorBoundary: true,
    },
    withErrorBoundary(<AuthCallback />),
  ),
  defineRoute(
    {
      path: '/verify-email',
      page: 'VerifyEmail',
      section: 'public',
      guard: 'public',
      errorBoundary: true,
    },
    withErrorBoundary(<VerifyEmail />),
  ),
  defineRoute(
    {
      path: '/jobs',
      page: 'JobBoard',
      section: 'public',
      guard: 'protected-workspace',
      workspace: 'freelancer',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(withWorkspace('freelancer', <JobBoard />))),
  ),
  defineRoute(
    {
      path: '/jobs/:jobId',
      page: 'JobDetail',
      section: 'public',
      guard: 'protected-workspace',
      workspace: 'freelancer',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(withWorkspace('freelancer', <JobDetail />))),
  ),
  defineRoute(
    {
      path: '/find-freelancers',
      page: 'FindFreelancers',
      section: 'public',
      guard: 'protected',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(<FindFreelancers />)),
  ),
  defineRoute(
    { path: '/search', page: 'SearchResults', section: 'public', guard: 'protected', errorBoundary: true },
    withErrorBoundary(withProtected(<SearchResults />)),
  ),
  defineRoute(
    {
      path: '/freelancer/:usernameOrId',
      page: 'FreelancerProfile',
      section: 'public',
      guard: 'protected',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(<FreelancerProfile />)),
  ),
  defineRoute(
    {
      path: '/client/:clientId',
      page: 'ClientProfile',
      section: 'public',
      guard: 'protected',
      errorBoundary: true,
    },
    withErrorBoundary(withProtected(<ClientProfile />)),
  ),
];
