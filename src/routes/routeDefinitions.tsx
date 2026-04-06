import type { ReactElement } from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { AdminRoute } from '@/components/routing/AdminRoute';
import { OnboardingRoute } from '@/components/routing/OnboardingRoute';
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import { WorkspaceRoute } from '@/components/routing/WorkspaceRoute';
import type { Workspace } from '@/lib/workspaceRoutes';

export type RouteSection =
  | 'public'
  | 'onboarding'
  | 'workspace'
  | 'account'
  | 'contracts'
  | 'admin';

export type RouteGuard =
  | 'public'
  | 'public-redirect'
  | 'protected'
  | 'protected-redirect'
  | 'protected-workspace'
  | 'protected-onboarding'
  | 'admin';

export interface AppRouteDefinition {
  path: string;
  page: string;
  section: RouteSection;
  guard: RouteGuard;
  workspace?: Workspace;
  errorBoundary: boolean;
  redirectTo?: string;
  element: ReactElement;
}

export function defineRoute(
  metadata: Omit<AppRouteDefinition, 'element'>,
  element: ReactElement,
): AppRouteDefinition {
  return { ...metadata, element };
}

export function withErrorBoundary(element: ReactElement) {
  return <ErrorBoundary>{element}</ErrorBoundary>;
}

export function withProtected(element: ReactElement) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export function withWorkspace(workspace: Workspace, element: ReactElement) {
  return <WorkspaceRoute workspace={workspace}>{element}</WorkspaceRoute>;
}

export function withOnboarding(workspace: Workspace, element: ReactElement) {
  return <OnboardingRoute workspace={workspace}>{element}</OnboardingRoute>;
}

export function withAdmin(element: ReactElement) {
  return <AdminRoute>{element}</AdminRoute>;
}

export function renderRouteDefinitions(routes: AppRouteDefinition[]) {
  return routes.map(({ path, element }) => (
    <Route key={path} path={path} element={element} />
  ));
}

export function createRouteGraph(routes: AppRouteDefinition[]) {
  return routes.map(({ path, page, section, guard, workspace, errorBoundary, redirectTo }) => ({
    path,
    page,
    section,
    guard,
    workspace: workspace ?? null,
    errorBoundary,
    redirectTo: redirectTo ?? null,
  }));
}
