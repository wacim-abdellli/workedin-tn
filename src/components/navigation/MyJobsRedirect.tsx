import { Navigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceStore } from '@/lib/workspaceState';

export const MyJobsRedirect = () => {
  const { profile, isLoading } = useAuth();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

  if (isLoading) return null;

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (activeWorkspace === 'freelancer') {
    return <Navigate to="/freelancer/proposals" replace />;
  }

  return <Navigate to="/client/jobs" replace />;
};
