import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useWorkspaceStore, loadWorkspaceForUser } from '../../lib/workspaceState';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkspaceDashboardPath, getWorkspaceJobsPath } from '@/lib/workspaceRoutes';
import { resolveWorkspace } from '@/lib/permissionEngine';
import { FullScreenLoader } from '@/components/ui';
import { useTranslation } from "../../i18n";

interface WorkspaceRouteProps {
  workspace: 'freelancer' | 'client';
  children: ReactNode;
}

export function WorkspaceRoute({ workspace, children }: WorkspaceRouteProps) {
    const { tx } = useTranslation();
  const location = useLocation();
  const { activeWorkspace } = useWorkspaceStore();
  const { isFullyReady, profile, freelancerProfile, user } = useAuth();

  const isFreelancerMarketplacePath =
    location.pathname === '/jobs' || location.pathname.startsWith('/jobs/');

  const getMismatchRedirectPath = (targetWorkspace: 'freelancer' | 'client') => {
    if (workspace === 'freelancer' && targetWorkspace === 'client' && isFreelancerMarketplacePath) {
      return getWorkspaceJobsPath('client');
    }

    return getWorkspaceDashboardPath(targetWorkspace);
  };

  // Show loader while auth is resolving — prevents black screen on direct URL load
  if (!isFullyReady) {
    // Peek at the saved workspace to avoid a flash redirect:
    // if the user saved 'freelancer' and is visiting /freelancer/dashboard, just show loader
    const savedWorkspace = user ? loadWorkspaceForUser(user.id) : null;
    if (!savedWorkspace || savedWorkspace === workspace) {
      return (
        <div className="fixed inset-0 z-50">
          <FullScreenLoader label={tx('ui.loading')} hint="Checking your workspace access" mode={workspace} />
        </div>
      );
    }
    // Saved workspace doesn't match — redirect immediately without waiting
    return <Navigate to={getMismatchRedirectPath(savedWorkspace)} replace />;
  }

  const resolvedWorkspace = resolveWorkspace(profile, freelancerProfile, activeWorkspace);

  if (resolvedWorkspace !== workspace) {
    return (
      <Navigate
        to={getMismatchRedirectPath(resolvedWorkspace)}
        replace
      />
    );
  }

  return <>{children}</>;
}
