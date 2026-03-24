import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { getWorkspaceProfilePath } from '@/lib/workspaceRoutes';
import { useWorkspaceStore } from '@/lib/workspaceState';
import Loading from '../ui/Loading';

export function ProfileRedirect() {
  const { user, profile, isLoading } = useAuth();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    navigate(getWorkspaceProfilePath(profile, activeWorkspace), { replace: true });
  }, [activeWorkspace, isLoading, navigate, profile, user]);

  return <Loading fullScreen />;
}
