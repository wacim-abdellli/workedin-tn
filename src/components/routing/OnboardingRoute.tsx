import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { getWorkspaceDashboardPath, isWorkspaceReady, type Workspace } from '@/lib/workspaceRoutes';
import { useWorkspaceStore } from '@/lib/workspaceState';
import Loading from '../ui/Loading';

interface OnboardingRouteProps {
  workspace: Workspace;
  children: ReactNode;
}

export function OnboardingRoute({ workspace, children }: OnboardingRouteProps) {
  const { isLoading, profile, freelancerProfile } = useAuth();
  const { activeWorkspace, setWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (activeWorkspace !== workspace) {
      setWorkspace(workspace);
    }
  }, [activeWorkspace, setWorkspace, workspace]);

  if (isLoading) {
    return <Loading fullScreen />;
  }

  const alreadyCompleted = isWorkspaceReady(profile, freelancerProfile, workspace);

  if (alreadyCompleted) {
    return <Navigate to={getWorkspaceDashboardPath(workspace)} replace />;
  }

  return <>{children}</>;
}