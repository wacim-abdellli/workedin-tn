import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../common';

/**
 * AdminRoute - Only allows access if user is authenticated and has admin role.
 * Non-admin users are redirected to the home page.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, profile } = useAuth();

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.is_admin !== true) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;
