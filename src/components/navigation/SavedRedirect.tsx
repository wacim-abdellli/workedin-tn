import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';

export const SavedRedirect = () => {
    const { profile, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return null;

    if (!profile) {
        return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
    }

    return <Navigate to={ROUTES.settingsAccount} replace />;
};
