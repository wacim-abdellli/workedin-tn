import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { FullScreenLoader } from '@/components/ui';
import { useTranslation } from "../../i18n";

export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { tx } = useTranslation();
  const { isAuthenticated, isFullyReady, profile, freelancerProfile: _freelancerProfile } = useAuth();
  const location = useLocation();
  useSessionTimeout();

  if (isFullyReady && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isFullyReady && !profile) {
    // Try to detect workspace from localStorage for better UX
    let detectedMode: 'freelancer' | 'client' | 'admin' = 'freelancer';
    try {
      const storedProfile = localStorage.getItem('profile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed?.active_mode === 'client') detectedMode = 'client';
      }
    } catch {
      // Ignore
    }
    
    return (
      <div className="fixed inset-0 z-50">
        <FullScreenLoader
          label={tx('ui.loading')}
          hint="Checking your account and workspace access"
          mode={detectedMode}
        />
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
