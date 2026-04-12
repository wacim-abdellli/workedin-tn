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

    let isCancelled = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!isCancelled) {
        setRetryState('failed');
      }
    }, 8000);

    setRetryState('retrying');
    refreshProfile()
      .catch(() => {
        // Ignore the error here and let the route fallback handle navigation.
      })
      .finally(() => {
        if (isCancelled) return;
        window.clearTimeout(fallbackTimer);
        setRetryState('failed');
      });

    return () => {
      isCancelled = true;
      window.clearTimeout(fallbackTimer);
    };
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
    return <Navigate to="/settings?tab=account" replace state={location.state} />;
  }

  if (shouldRequireUserTypeSelection(profile)) {
    return <Navigate to="/signup?step=select-type" replace state={location.state} />;
  }

  const workspace = resolveActiveWorkspace(profile, freelancerProfile, activeWorkspace);
  return <Navigate to={getWorkspaceDashboardPath(workspace)} replace state={location.state} />;
};
