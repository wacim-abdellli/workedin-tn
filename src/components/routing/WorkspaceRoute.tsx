import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useWorkspaceStore } from '../../lib/workspaceState';

interface WorkspaceRouteProps {
  workspace: 'freelancer' | 'client';
  children: ReactNode;
}

export function WorkspaceRoute({ workspace, children }: WorkspaceRouteProps) {
  const { activeWorkspace } = useWorkspaceStore();
  
  if (activeWorkspace !== workspace) {
    // Redirect to correct workspace dashboard
    return <Navigate
      to={activeWorkspace === 'freelancer'
        ? '/freelancer/dashboard'
        : '/client/dashboard'}
      replace
    />;
  }
  
  return <>{children}</>;
}
