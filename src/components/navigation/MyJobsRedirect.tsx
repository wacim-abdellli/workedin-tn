import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';
import { useWorkspaceStore } from '@/lib/workspaceState';

export const MyJobsRedirect = () => {
  const { profile, isLoading } = useAuth();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const location = useLocation();

  if (isLoading) return null;

  if (!profile) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  if (activeWorkspace === 'freelancer') {
    return <Navigate to={ROUTES.myProposals} replace />;
  }

  return <Navigate to={ROUTES.clientJobs} replace />;
};
