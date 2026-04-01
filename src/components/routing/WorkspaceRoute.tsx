import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useWorkspaceStore } from '../../lib/workspaceState';
import { useAuth } from '../../contexts/AuthContext';

interface WorkspaceRouteProps {
  workspace: 'freelancer' | 'client';
  children: ReactNode;
}

export function WorkspaceRoute({ workspace, children }: WorkspaceRouteProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { isFullyReady } = useAuth();

  // CRITICAL: Do NOT redirect based on persisted workspace state until auth
  // has fully loaded the user's profile and synced the correct workspace.
  // The localStorage-persisted workspace can be stale (e.g. left over from a
  // different user's session in another tab), which was causing automatic
  // cross-session redirects before the real user's profile was loaded.
  if (!isFullyReady) {
    return null; // ProtectedRoute (parent) already shows a loading spinner
  }

  if (activeWorkspace !== workspace) {
    // Redirect to correct workspace dashboard
    return (
      <Navigate
        to={activeWorkspace === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard'}
        replace
      />
    );
  }

  return <>{children}</>;
}
