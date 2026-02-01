import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const DashboardRedirect = () => {
    const { profile, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    // Redirect based on user type
    if (profile.user_type === 'freelancer') {
        return <Navigate to="/freelancer/dashboard" replace />;
    } else if (profile.user_type === 'client') {
        return <Navigate to="/client/dashboard" replace />;
    } else if (profile.user_type === 'both') {
        // Default to freelancer dashboard for "both" users
        return <Navigate to="/freelancer/dashboard" replace />;
    }

    // No user type set - send to select account type or onboarding
    return <Navigate to="/onboarding" replace />;
};
