import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useWorkspaceStore } from '../../lib/workspaceState';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkspaceDashboardPath, resolveActiveWorkspace } from '@/lib/workspaceRoutes';

interface WorkspaceRouteProps {
  workspace: 'freelancer' | 'client';
  children: ReactNode;
}

export function WorkspaceRoute({ workspace, children }: WorkspaceRouteProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { isFullyReady, profile, freelancerProfile } = useAuth();

  // Wait until auth/profile state is fully loaded, then validate the requested
  // workspace against the current user's actual capabilities before redirecting.
  if (!isFullyReady) {
    return null; // ProtectedRoute (parent) already shows a loading spinner
  }

  const resolvedWorkspace = resolveActiveWorkspace(profile, freelancerProfile, activeWorkspace);

  if (resolvedWorkspace !== workspace) {
    return (
      <Navigate
        to={getWorkspaceDashboardPath(resolvedWorkspace)}
        replace
      />
    );
  }

  return <>{children}</>;
}
