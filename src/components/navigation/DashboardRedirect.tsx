import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceStore } from '@/lib/workspaceState';
import { getWorkspaceTargetRoute } from '@/lib/workspaceRoutes';

export const DashboardRedirect = () => {
  const location = useLocation();
  const { profile, freelancerProfile, isLoading } = useAuth();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace state={location.state} />;
  }

  if (!profile.user_type) {
    return <Navigate to="/signup?step=select-type" replace state={location.state} />;
  }

  const target = getWorkspaceTargetRoute(profile, freelancerProfile, activeWorkspace);
  return <Navigate to={target.path} replace state={location.state} />;
};
