import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { FullScreenLoader } from '@/components/ui';
import AccountStatusGate from '@/components/routing/AccountStatusGate';
import { useWorkspaceStore } from '@/lib/workspaceState';
import {
  getWorkspaceOnboardingPath,
  isWorkspaceReady,
  resolveActiveWorkspace,
} from '@/lib/workspaceRoutes';
import { useTranslation } from "../../i18n";

export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { tx } = useTranslation();
  const { isAuthenticated, isFullyReady, profile, freelancerProfile } = useAuth();
  const location = useLocation();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);

  useSessionTimeout();

  if (isFullyReady && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    isFullyReady &&
    (profile?.account_status === 'suspended' || profile?.account_status === 'archived')
  ) {
    return <AccountStatusGate status={profile.account_status} />;
  }

  const isOnOnboardingPage = location.pathname.startsWith('/onboarding/');

  if (isFullyReady && profile && !isOnOnboardingPage) {
    const workspace = resolveActiveWorkspace(profile, freelancerProfile, activeWorkspace);
    const onboardingComplete = isWorkspaceReady(profile, freelancerProfile, workspace);

    if (!onboardingComplete) {
      return (
        <Navigate
          to={getWorkspaceOnboardingPath(workspace)}
          replace
          state={{ from: location }}
        />
      );
    }
  }

  if (!isFullyReady && !profile) {
    return (
      <div className="fixed inset-0 z-50">
        <FullScreenLoader
          label={tx('ui.loading')}
          hint="Checking your account and workspace access"
        />
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
