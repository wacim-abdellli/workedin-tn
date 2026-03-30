import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { getWorkspaceProfilePath } from '@/lib/workspaceRoutes';
import { useWorkspaceStore } from '@/lib/workspaceState';
import Loading from '../ui/Loading';

export function ProfileRedirect() {
  const { user, profile, isLoading } = useAuth();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate('/login', { replace: true, state: { from: location } });
      return;
    }

    navigate(getWorkspaceProfilePath(profile, activeWorkspace), { replace: true });
  }, [activeWorkspace, isLoading, location, navigate, profile, user]);

  return <Loading fullScreen />;
}
