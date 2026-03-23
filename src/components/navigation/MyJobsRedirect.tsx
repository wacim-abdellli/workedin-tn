import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const MyJobsRedirect = () => {
    const { profile, activeMode, isLoading } = useAuth();

    if (isLoading) return null; // Or loader

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    if (activeMode === 'freelancer') {
        return <Navigate to="/freelancer/proposals" replace />; // Their submitted proposals
    }

    return <Navigate to="/client/jobs" replace />; // Posted jobs
};
