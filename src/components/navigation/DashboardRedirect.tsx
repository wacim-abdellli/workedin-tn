import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { shouldRequireUserTypeSelection } from '@/lib/workspaceRoutes';
import { useWorkspaceStore } from '@/lib/workspaceState';

export const DashboardRedirect = () => {
  const location = useLocation();
  const { user, profile, isFullyReady, refreshProfile } = useAuth();
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

  return activeWorkspace === 'freelancer'
    ? <Navigate to="/freelancer/dashboard" replace state={location.state} />
    : <Navigate to="/client/dashboard" replace state={location.state} />;
};
