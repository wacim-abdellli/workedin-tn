import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceStore } from '@/lib/workspaceState';
import { isWorkspaceReady } from '@/lib/workspaceRoutes';
import { isSuspended, resolveWorkspace } from '@/lib/permissionEngine';
import AccountStatusGate from './AccountStatusGate';

interface ProtectedGateProps {
  children: ReactNode;
}

export function ProtectedGate({ children }: ProtectedGateProps) {
  const { profile, freelancerProfile, isFullyReady } = useAuth();
  const { activeWorkspace } = useWorkspaceStore();
  const location = useLocation();

  if (!isFullyReady || !profile) {
    return null;
  }

  // 1. Account Status Gate (Suspended/Archived check)
  if (isSuspended(profile)) {
    return <AccountStatusGate status={profile.account_status as 'suspended' | 'archived'} />;
  }

  // 2. Onboarding Gate (except for onboarding routes themselves to prevent loops)
  const isCurrentlyOnboarding = location.pathname.startsWith('/onboarding');
  if (!isCurrentlyOnboarding) {
    const workspace = resolveWorkspace(profile, freelancerProfile, activeWorkspace);
    const ready = isWorkspaceReady(profile, freelancerProfile, workspace);
    if (!ready) {
      return <Navigate to={`/onboarding/${workspace}`} replace />;
    }
  }

  return <>{children}</>;
}

export default ProtectedGate;
