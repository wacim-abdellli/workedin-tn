import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import {
  getWorkspaceDashboardPath,
  resolveActiveWorkspace,
  shouldRequireUserTypeSelection,
} from '@/lib/workspaceRoutes';
import { useWorkspaceStore } from '@/lib/workspaceState';

export const DashboardRedirect = () => {
  const location = useLocation();
  const { user, profile, freelancerProfile, isFullyReady, refreshProfile } = useAuth();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const [retryState, setRetryState] = useState<'idle' | 'retrying' | 'failed'>('idle');

  useEffect(() => {
    if (!isFullyReady || !user || profile || retryState !== 'idle') {
      return;
    }

    setRetryState('retrying');
    refreshProfile().then(() => {
        setRetryState('failed');
    });
  }, [retryState, isFullyReady, profile, refreshProfile, user]);

  if (!isFullyReady || (user && !profile && retryState !== 'failed')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--workspace-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={location.state} />;
  }

  if (!profile) {
    return <Navigate to="/settings?tab=profile" replace state={location.state} />;
  }

  if (shouldRequireUserTypeSelection(profile)) {
    return <Navigate to="/signup?step=select-type" replace state={location.state} />;
  }

  const workspace = resolveActiveWorkspace(profile, freelancerProfile, activeWorkspace);
  return <Navigate to={getWorkspaceDashboardPath(workspace)} replace state={location.state} />;
};
