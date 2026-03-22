import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../common';

/**
 * AdminRoute — Only allows access if user is authenticated AND has admin role.
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

  // Check if user is admin — uses email allowlist as a simple check.
  // TODO: Replace with a proper `is_admin` column in the profiles table.
  const ADMIN_EMAILS = [
    'wacimabdelli01@gmail.com',
    // Add your admin email(s) here
  ];

  const userEmail = profile?.email || '';
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;
