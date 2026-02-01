import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const MyJobsRedirect = () => {
    const { profile, isLoading } = useAuth();

    if (isLoading) return null; // Or loader

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    // Redirect based on user type
    if (profile.user_type === 'freelancer' || profile.user_type === 'both') {
        return <Navigate to="/freelancer/proposals" replace />; // Their submitted proposals
    } else {
        return <Navigate to="/client/jobs" replace />; // Posted jobs
    }
};
