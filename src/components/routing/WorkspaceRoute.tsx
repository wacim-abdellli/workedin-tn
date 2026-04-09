import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useWorkspaceStore, loadWorkspaceForUser } from '../../lib/workspaceState';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkspaceDashboardPath, resolveActiveWorkspace } from '@/lib/workspaceRoutes';
import { FullScreenLoader } from '@/components/ui';

interface WorkspaceRouteProps {
  workspace: 'freelancer' | 'client';
  children: ReactNode;
}

export function WorkspaceRoute({ workspace, children }: WorkspaceRouteProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { isFullyReady, profile, freelancerProfile, user } = useAuth();

  // Show loader while auth is resolving — prevents black screen on direct URL load
  if (!isFullyReady) {
    // Peek at the saved workspace to avoid a flash redirect:
    // if the user saved 'freelancer' and is visiting /freelancer/dashboard, just show loader
    const savedWorkspace = user ? loadWorkspaceForUser(user.id) : null;
    if (!savedWorkspace || savedWorkspace === workspace) {
      return (
        <div className="fixed inset-0 z-50">
          <FullScreenLoader label="Loading..." hint="Checking your workspace access" />
        </div>
      );
    }
    // Saved workspace doesn't match — redirect immediately without waiting
    return <Navigate to={getWorkspaceDashboardPath(savedWorkspace)} replace />;
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
