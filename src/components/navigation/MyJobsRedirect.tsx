import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceStore } from '@/lib/workspaceState';

export const MyJobsRedirect = () => {
  const { profile, isLoading } = useAuth();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const location = useLocation();

  if (isLoading) return null;

  if (!profile) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (activeWorkspace === 'freelancer') {
    return <Navigate to="/freelancer/proposals" replace />;
  }

  return <Navigate to="/client/jobs" replace />;
};
