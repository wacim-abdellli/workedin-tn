import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const SavedRedirect = () => {
    const { profile, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return null;

    if (!profile) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Saved items in settings (or wherever saved jobs are)
    // The requirement says /settings?tab=saved
    return <Navigate to="/settings?tab=saved" replace />;
};
