import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import {
  getWorkspaceDashboardPath,
  resolveActiveWorkspace,
  shouldRequireUserTypeSelection,
} from '@/lib/workspaceRoutes';
import { useWorkspaceStore } from '@/lib/workspaceState';
import { FullScreenLoader } from '@/components/ui';

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
    const workspace = resolveActiveWorkspace(profile, freelancerProfile, activeWorkspace);
    return (
      <FullScreenLoader
        label="Redirecting to dashboard"
        hint="Resolving your workspace selection and checking authentication state."
        mode={workspace as 'freelancer' | 'client' | 'admin'}
      />
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
